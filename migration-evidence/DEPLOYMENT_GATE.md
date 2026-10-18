# Deployment gate — 2026-10-18

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

## Why an ordinary deploy cannot proceed within current permission scope
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
