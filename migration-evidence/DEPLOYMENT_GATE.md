# Deployment gate — 2026-10-18

## Current state (supersedes historical approval gates below)
Paused deployment is complete. processBlogImage/us-central1 is ACTIVE; separate
Eventarc trigger blog-image-finalized/us is ready. Named/scoped IAM and the
separately approved project Storage Publisher grant are verified. No project-wide
Token Creator, Storage Object User or Run Invoker was added by this work.
Native runtime verification passed in revision processblogimage-00001-bop:
EXIF6 fixture ->600x800 original /375x500 thumbnail. Actual Storage text-probe
delivery produced the paused log and HTTP200; its exact generation was cleaned up.
Both legacy functions remain ACTIVE. See SCOPED_API_DEPLOYMENT.md and JSON evidence.

Remaining gate: coordinated upload pause, cloud image read/write end-to-end
verification without concurrent old writers, supported-runtime recovery rehearsal,
then explicit authorization to retire the old rotation function and extension.
Do not interpret a successful paused deployment as authorization to unpause or
remove old processing. No historical backfill. Current maxInstances1 is for paused
verification; select and document production capacity before switching.
The exact deployed source ZIP is preserved outside the repository at
../image-pipeline-paused-recovery.zip; its SHA256 is in paused-create-request.json.
This preserves an artifact proven to build/run/receive events, not a rehearsed
production recovery after old-function retirement.

## Historical investigation notes

Project: book-blog-with-largo (861459209119). CLI authenticated as
lovemewithoutall@gmail.com; existing project role Owner. Blaze enabled with
KRW13,300 monthly alert, no automatic shutdown. Bucket location US multi-region;
proposed function region us-central1, Eventarc bucket trigger location us.

## Preserved evidence
- prerequisites.json: selected deployed function metadata and enabled API names.
- iam-relevant-bindings.json: relevant existing role bindings; no credentials.
- rotateUsingExif-v24.js and package.json: individual files copied from read-only
  console source editor. JS matches repository functions/index.js after newline
  normalization. No functions.config() call. .runtimeconfig.json exists but was
  not opened/exported; full source ZIP intentionally not downloaded.
- Tested Node22 recovery candidate frozen outside repository at
  ../rollback-c41d666 (commit c41d666, package lock included). This is a local
  modern recovery candidate, NOT a cloud-proven rollback and NOT a restoration
  of Node8. pipeline.js SHA256 d5e479ddf67c5fc42b48f45ebe987f0c0290f55f22f84dbe97ccdb4649b97b75.

## Update after API approval
The four APIs below are now enabled and their four Google-managed default
service-agent roles are verified. See approved-api-enablement.json and
approved-default-service-agents.json. No new image function has been deployed.
The new entrypoint defaults to paused (only the literal string false enables
processing), so a verification deployment can coexist with the old handlers
without writing images. Lint and all 28 tests pass.

Remaining consent is for additional execution/event-delivery IAM, beyond the
four approved service-agent roles. Installed CLI15.34.0 automatically requests
project-level storage.objectUser for its firebase-fn runtime account,
pubsub.publisher for the Storage service agent, iam.serviceAccountTokenCreator
for the Pub/Sub service agent, and run.invoker plus eventarc.eventReceiver for
the default Compute service account on first v2 event integration. This exact
behavior was checked in deploy/functions/prepare.js and checkIam.js. No such
additional bindings were applied. A narrower explicit-account/bucket-scoped
alternative would require changing the declarative-IAM deployment design.

## Initial finding (superseded for the four API/default-role approvals)
Enabled-services inventory lacks run.googleapis.com, eventarc.googleapis.com,
cloudbuild.googleapis.com and artifactregistry.googleapis.com. New function is
2nd gen and requires these APIs. Enabling them provisions Google service identities
and associated service-agent access. Existing relevant bindings contain no
Eventarc receiver, Cloud Run invoker or Storage-agent Pub/Sub publisher grant.
Current code declares requiresRole('roles/storage.objectUser'); CLI may apply
project-level runtime access. This must not be silently granted.

Official installed firebase-tools15.34.0 prepare.js calls ensure API activation and
service identity generation, even on paths preceding its dryRun return. Therefore
'deploy --dry-run' has NOT been used as a supposed read-only permission check.

## Approval gate A (before any resource creation)
Approve enabling the four named APIs and their Google-managed service agents for
this project. Separately approve only reviewed event delivery/runtime bindings,
with exact principal and smallest resource scope; avoid blanket project Owner or
Editor grants. Expected bindings include Storage service agent
service-861459209119@gs-project-accounts.iam.gserviceaccount.com -> Pub/Sub Publisher,
and a selected runtime/trigger service account -> Eventarc Event Receiver and
Cloud Run Invoker for the new service. Runtime requires read/create/update/delete
object access for this bucket. Current source does not explicitly select a runtime
account, so default identity and declarative IAM scope must be resolved before deploy.
No IAM change, API enablement or new function creation has been executed.

## Approval gate B (only after real-runtime/recovery validation)
Coordinate pause of ALL image uploaders; do not stop Hosting/read traffic. Drain
in-flight work, record the narrow cutover boundary. Remove old processing only
with explicit approval: rotateUsingExif/us-central1 and extension instance
storage-resize-images (managed function ext-storage-resize-images-generateResizedImage
in asia-northeast1). Review actual extension uninstall resource list first; no
bucket/object deletion is authorized. Do not run old and new writers concurrently.
Old Node8 deployments cannot be assumed redeployable. If new verification fails,
keep uploads paused and use a tested supported-runtime artifact; until one is
cloud-proven, deletion gate remains closed. No historical bulk reprocessing.
