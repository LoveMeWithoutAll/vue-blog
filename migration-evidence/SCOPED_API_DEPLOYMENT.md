# Scoped API deployment plan and execution notes

## Executed 2026-10-18
Named account and scoped IAM approved and verified, including Storage project
Publisher. New function processBlogImage is ACTIVE, paused=true, maxInstances=1
for verification. serviceConfig.service is
projects/book-blog-with-largo/locations/us-central1/services/processblogimage.
Invoker is scoped to this service, not public. No default Compute IAM was added;
Cloud Build reported that account as its default, with an existing Editor binding.
Build 53df9644-707c-4d69-8a29-bd82677654b9 completed. Revision
processblogimage-00001-bop logged successful native conversion at
2026-10-18T05:22:52.297925Z: original 600x800, thumbnail375x500,
ImageMagick6.9.11-60 Q16 x86_64. Only bundled synthetic bytes were transformed.

Plan correction: the Functions API rejected changing HTTP to event-triggered
(400, no update). Instead a separately managed Eventarc trigger
projects/book-blog-with-largo/locations/us/triggers/blog-image-finalized was
created successfully targeting processblogimage/us-central1. Its finalized event
filter selects only book-blog-with-largo.appspot.com; account is the dedicated
blog-image-pipeline account. Functions API metadata remains HTTP, while the
runtime uses FUNCTION_SIGNATURE_TYPE=cloudevent. Manage this external Eventarc
trigger separately on future updates/deletion; never infer it from function metadata.

Both legacy functions remain ACTIVE. A 73-byte text/plain probe was created at
_migration-verification/paused-event-20261018T0526Z.txt, generation1792301149849811,
with ifGenerationMatch=0. The original probe records remain in Git commit359c3ee.
Delivery was confirmed by the paused handler log and HTTP200 at05:25:50UTC.
The exact probe generation was subsequently cleaned up. No existing object was deleted.
Current operational status and final evidence are in CUTOVER_RESULT.md.
No production image processing switch or historical reprocessing occurred.

The following is the pre-execution design; the notes above supersede steps4/6
where the API behavior required a separate Eventarc trigger.

Project book-blog-with-largo / 861459209119. No additional IAM or deployment has
been executed for this plan. No Firebase CLI deploy/dry-run: its first-v2 path
adds project-wide IAM even when narrow resource bindings already exist.

## Exact proposed IAM

- New runtime/trigger account: blog-image-pipeline@book-blog-with-largo.iam.gserviceaccount.com.
- That account -> roles/storage.objectUser on bucket book-blog-with-largo.appspot.com only.
- That account -> roles/eventarc.eventReceiver on project book-blog-with-largo.
- That account -> roles/run.invoker on the new function's returned serviceConfig.service only.
- If existing effective permissions do not already allow OpenID tokens:
  service-861459209119@gcp-sa-pubsub.iam.gserviceaccount.com ->
  roles/iam.serviceAccountTokenCreator on projects/book-blog-with-largo/serviceAccounts/blog-image-pipeline@book-blog-with-largo.iam.gserviceaccount.com only.
- Remaining separately requested grant for direct Storage events:
  service-861459209119@gs-project-accounts.iam.gserviceaccount.com ->
  roles/pubsub.publisher on project book-blog-with-largo.
- No new grants to default Compute account. No project-wide Token Creator or Run Invoker.

## Why publisher remains project scoped

Cloud Functions EventTrigger.pubsubTopic and Eventarc transport.pubsub.topic allow
an existing topic only for google.cloud.pubsub.topic.v1.messagePublished. For
google.cloud.storage.object.v1.finalized, Eventarc creates/manages its own topic.
The official direct-Storage setup requires the publisher grant before trigger
creation and documents project scope. There is no supported preselection of a
single topic to authorize first in this direct-event workflow. Do not intentionally
fail creation to discover a generated topic or promise post-creation narrowing
will survive trigger recreation. Topic-level Storage publishing is possible with
a separately managed Storage notification + Pub/Sub trigger, but would change
payload/transport and require adapter/lifecycle tests; not selected for this migration.

## Ordered API operations after approval

1. Read current function names, IAM etags, enabled APIs, Pub/Sub service-agent role,
   and Cloud Build default service account. Confirm existing build permissions;
   do not silently add builder roles. Validate the intended new function does not
   exist, or inspect a prior attempt before retrying. Never alter old function resources.
2. Create the named runtime account through IAM v1 (no keys). Merge only approved
   project, bucket and account-level bindings, preserving etags and all unrelated
   bindings. Check propagation through read-back; no broad fallback permissions.
3. Build a ZIP from an explicit allowlist of index.js, pipeline.js, storage.js,
   image-processing source files, package.json and package-lock.json (resolve actual
   require graph first). No .env, credentials, .runtimeconfig.json, tests or node_modules.
   Record source hash. POST Cloud Functions v2 projects/book-blog-with-largo/locations/
   us-central1/functions:generateUploadUrl; PUT bytes to the returned signed URL;
   do not log the signed URL. Use returned storageSource exactly.
4. POST v2 .../locations/us-central1/functions?functionId=processBlogImage,
   environment GEN_2, runtime nodejs22, entryPoint processBlogImage, uploaded source,
   explicit runtime account. Initially OMIT eventTrigger to obtain the private
   service without creating the Storage notification. Set FUNCTION_SIGNATURE_TYPE=
   cloudevent (same runtime setting CLI uses), IMAGE_PROCESSING_PAUSED=true,
   bucket/region/service-account parameters explicitly. Use 1GiB, 120s, concurrency1,
   minInstances0 and a small verification-only max count. Pin reviewed fractional
   CPU equivalent from CLI conversion; do not assume the string gcf_gen1 is a REST value.
   Poll returned operation and inspect state messages. If the API rejects the
   triggerless CloudEvent setup, stop and revise the sequence; do not grant broader IAM.
5. Read serviceConfig.service from the created function. GET/merge/set IAM only
   on that Cloud Run service, adding the named account as run.invoker, never allUsers.
   Verify supported-runtime ImageMagick using local-only fixture startup testing;
   paused handler logs alone are not evidence that image conversion works.
6. After publisher approval and runtime verification, PATCH this function with
   updateMask=eventTrigger: type google.cloud.storage.object.v1.finalized,
   filter bucket=book-blog-with-largo.appspot.com, triggerRegion=us,
   serviceAccountEmail=the named account, retryPolicy=RETRY_POLICY_RETRY.
   Keep processing paused. Poll operation, then inspect actual Eventarc transport,
   trigger identity, service IAM, runtime identity and function ACTIVE state.
7. Verify actual event delivery using a separately scoped agreed test; record logs
   without user content/tokens. Pause does not replay acknowledged events. Existing
   handlers retain production processing. A successful paused deployment is not a
   completed migration. Coordinate all-uploader pause, drain, recovery verification,
   old-handler retirement authorization and unpause separately. No bulk backfill.

The sequence is a reviewed plan, not a claim of a completed build/runtime test.
Build identity/permissions, native runtime fixture hook and exact request body
remain pre-execution checks. Fail closed on additional permissions or API requirements.

## Evidence

- Installed CLI15.34.0: deploy/functions/checkIam.js ensureServiceAgentRoles;
  deploy/functions/prepare.js resolveBackendServiceAccount;
  deploy/functions/release/fabricator.js grantNewRoles;
  gcp/cloudfunctionsv2.js sets runtime and trigger service account together and
  FUNCTION_SIGNATURE_TYPE=cloudevent for event handlers.
- https://docs.cloud.google.com/functions/docs/reference/rest/v2/projects.locations.functions#EventTrigger
- https://docs.cloud.google.com/eventarc/docs/reference/rest/v1/projects.locations.triggers#Pubsub
- https://docs.cloud.google.com/eventarc/standard/docs/run/route-trigger-cloud-storage
- https://docs.cloud.google.com/eventarc/docs/roles-permissions
- https://docs.cloud.google.com/pubsub/docs/authenticate-push-subscriptions (Claims:
  OpenID-token permission on push-auth account itself or an ancestor is sufficient.)
