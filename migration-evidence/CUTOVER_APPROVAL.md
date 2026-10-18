# Concrete cutover and recovery gate

## Removal targets (not executed)
1. Uninstall only Extension instance
   projects/book-blog-with-largo/instances/storage-resize-images, version0.1.5.
   Its verified spec has one resource generateResizedImage of type
   firebaseextensions.v1beta.function, and no SECRET parameters. This removes
   ext-storage-resize-images-generateResizedImage in asia-northeast1 and the
   account ext-storage-resize-images@book-blog-with-largo.iam.gserviceaccount.com.
   Do NOT separately delete that managed function; uninstall owns its lifecycle.
2. Delete only projects/book-blog-with-largo/locations/us-central1/functions/rotateUsingExif.
   Retain the shared App Engine account; it is not dedicated to this function.
3. Neither operation deletes the existing Storage bucket, original images,
   thumbnails, Firestore, Hosting, or the new dedicated account/Eventarc trigger.
   Recheck instance spec immediately before removal; stop if resources changed.

Old runtime Node8 restoration is NOT a reliable rollback. Uninstall/delete cannot
be undone as an instance restore. Source/config can reconstruct behavior on a
supported runtime, but are not proof the old Node8 service can be redeployed.

## Verified preservation and recovery limits
- rotateUsingExif-v24.js and package.json: deployed source snapshot; JS matches
  repository after newline normalization. No functions.config calls in it.
- extension-removal-snapshot.json: actual instance/version, four non-secret
  parameters, resource list/account and absence of secret parameters. Upstream
  version0.1.5 source was reviewed; a full deployed extension ZIP was not exported.
- Legacy .runtimeconfig.json was not read or copied. No whole bucket/image backup
  was made; existing originals/derivatives are outside removal scope.
- Exact new supported-runtime source ZIP ../image-pipeline-paused-recovery.zip:
  SHA256 dba24624a124b756215ce379ef3d9b49aec36048bbed1627915cbc4b427d05df.
  Hash verified against first deployment request. Includes package lock and
  native fixture, excludes credentials/config secrets.
- Initial new revision passed real Linux native rotation/resize and actual
  Storage->Eventarc->paused-handler HTTP200 verification. Local tests28passed.
- Same-ZIP recovery redeployment completed: build6319c472-6dd6-41b9-b129-4716cba3ccc1,
  revision processblogimage-00002-riq READY,100%traffic. Its native check passed
  at2026-10-18T05:31:23.319846Z (600x800/375x500). A second actual non-image
  Storage event reached that revision and returned paused/HTTP200 at05:32:18UTC.
  Exact test object generation1792301537040988 was selected for cleanup.
- Recovery is restore/redeploy the frozen supported-runtime code, keeping uploads
  stopped. It is not independent fallback behavior if that code has a logic bug.
  Production bucket image read/write end-to-end is still a cutover test.

## Upload pause and timing
Confirm all image uploads/replacements to book-blog-with-largo.appspot.com are
stopped before deletion. Known repository paths: FileUploader.vue cover upload
and Writer.vue embedded editor image upload, both images/<filename>. Existing
open writer tabs, other browsers/users, direct console uploads and external
scripts are not inventoried and must also pause. No automatic UI/rules lock was
installed; human confirmation is required. Existing public reading remains up.
Reserve20-30minutes as an estimate, not a deadline promise; failures extend the
pause. Record start timestamp, wait at least5minutes and inspect activity for
in-flight work, then remove old writers and verify absence before enabling new.
Any unexpected upload during pause means stop/reconcile that boundary before
proceeding. Paused events are acknowledged and will not replay automatically.

## Narrow production-write test after old writers are gone
- Enable the new handler, with initial maxInstances3/concurrency1 (approval must
  include this explicit capacity; current paused verification cap is1).
- Create exactly one fresh path images/__migration_cutover_<UTC-run-id>_exif6.jpg
  with ifGenerationMatch=0, using the bundled synthetic800x600/EXIF6JPEG only.
- Verify original600x800 and thumbnail375x500, autoOrient marker, original token
  retention and independent thumbnail token. Compare tokens in memory only;
  never print or save their values. Verify original/thumbnail download behavior.
- Overwrite the same synthetic original once using its exact generation
  precondition and fresh test bytes; verify latest generation/thumbnail converge
  and no continuing self-trigger write loop. No existing user object is touched.
- Clean up only these two synthetic object paths at their verified generations.
  No prefix-wide deletion, no historical backfill and no bulk reprocessing.
- Reopen uploads only after checks pass and operational logs are clean.

## Failure action
Keep all uploaders paused. Set IMAGE_PROCESSING_PAUSED=true on new function while
preserving other env fields; wait for the revision to settle. Record affected
test/boundary generations. Redeploy the verified ZIP using the rehearsed API
path, retain the named account and separate Eventarc trigger, then repeat tests.
If identical code still fails, keep uploads paused and fix before reopening;
do not claim instant restoration of Node8 or blindly replay historical objects.
No deletion is authorized by this document.
