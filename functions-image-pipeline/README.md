# Image pipeline migration (production cutover complete)

The new processBlogImage function is deployed in us-central1 with image processing
enabled, minInstances0/maxInstances3/concurrency1. A separately managed Eventarc trigger blog-image-finalized in us delivers
bucket finalized events to its private Cloud Run service processblogimage.
Functions API trigger metadata remains HTTP; runtime signature is cloudevent.
Update the function and the separate Eventarc trigger explicitly through reviewed
APIs, not firebase deploy. See ../migration-evidence/SCOPED_API_DEPLOYMENT.md.
The legacy storage-resize-images extension (including its managed function and
account) and rotateUsingExif were removed with approval on2026-10-18.
Production upload/overwrite, URL preservation, resize and cleanup tests passed.
See ../migration-evidence/CUTOVER_RESULT.md for evidence and recovery instructions.

This is a separate, self-managed Node.js 22 / Firebase Functions v2 codebase.
The existing `functions/`, primary `firebase.json`, and frontend remain unchanged.
The separate Firebase config documents the codebase and supports local checks;
production updates use the reviewed scoped API procedure.

## Verified contract

Public application source baseline: `aba467e3462b754d957a5e0872d76c91cb515ed6`.
This checkout is not proven identical to the deployed source.
`FileUploader.vue` and `Writer.vue` upload `images/<filename>` and store the
original object's download URL. The original path and custom download token
therefore survive an in-place EXIF orientation update. Truthy `autoOrient`
metadata skips another rotation, matching the old custom function.

Console inspection (2026-10-18) found `storage-resize-images` 0.1.5 in
asia-northeast1, configured for 500x500, no output subfolder, no original deletion,
and no cache override. Its deployed function and `rotateUsingExif` (us-central1)
are both Node.js 8/v1 and subscribe to the same bucket. Blaze billing was enabled
with approval and a KRW13,300 monthly alert (not a spending cap).

The tagged upstream 0.1.5 implementation confirms same-directory
`<stem>_500x500<extension>` names and aspect-preserving downscale without enlargement.
Its validator accepts all `image/*`, as does the cover uploader; neither the
uploader nor Storage rules imposes the proposed 25 MiB / 40 MP limits.
This implementation retains those paths and dimensions; originals are never
deleted. It preserves Storage content type, disposition, language, cache control,
and custom metadata. A derivative never receives the original download token.
If a derivative already has its own token, that token is retained to preserve URLs.

Sources:
- https://github.com/LoveMeWithoutAll/vue-blog/tree/aba467e3462b754d957a5e0872d76c91cb515ed6
- https://github.com/firebase/extensions/blob/storage-resize-images-v0.1.5/storage-resize-images/functions/src/index.ts
- https://firebase.google.com/docs/functions/manage-functions
- https://firebase.google.com/docs/extensions/users/migrate

## Processing and retries

One handler normalizes the original first and then writes its thumbnail. It also
receives the normalized original's finalize event; retries of either event can
finish the thumbnail if the first attempt failed. Original writes require both
generation and metageneration matches. Source downloads are generation-pinned.
Thumbnail writes use compare-and-swap and a source-generation marker so duplicate
or out-of-order workers cannot overwrite an already committed newer thumbnail.
Precondition conflicts intentionally throw for platform retry, which then reads
fresh state. Generated thumbnail events are ignored via `resizedImage` metadata.
No bucket enumeration, installation hook, or historical backfill is implemented.

Storage has no transaction across original and derivative objects. A thumbnail
can briefly reflect an older source if an upload races just after the final
source check. Processing the newer event converges to the newest thumbnail;
there is no promise of atomic visibility across these two URLs. Alert on failed
newer events rather than assuming the presence of any thumbnail means success.
Metadata-only updates do not create finalize events; an existing completed
thumbnail does not automatically mirror later metadata edits.

## Local checks

Use Node.js 22.13 or later in the 22.x line:

```sh
cd functions-image-pipeline
npm ci
npm run lint
npm test
```

Native ImageMagick 6 `convert` must be on PATH for image tests. There is no
automatic binary installer or Sharp fallback. The Google Functions system-package
reference lists ImageMagick 6 in the Ubuntu 22.04 base image; verify `convert`
and needed delegates in the exact staging runtime before production.
https://docs.cloud.google.com/functions/docs/reference/system-packages

The tests use generated real JPEG/PNG/WebP/GIF/TIFF images and an in-memory Storage model with
generation/metageneration conditions. They cover EXIF rotation, bounding size,
transparency, tokens, duplicate concurrency, partial failure, retry, stale events,
source metadata races, output races, deletion, collisions and large inputs.
Adapter and SDK registration tests do not contact Google Cloud or load credentials.
They do not substitute for a live staging Storage/Eventarc test.

## Compatibility gates before production

- The first draft's Sharp allowlist and byte/pixel admission limits were regressions
  and have been removed. Production now uses the same ImageMagick operations as
  the old source. Sharp is a development-only fixture generator/decoder.
- All `image/*` proceeds to native conversion, without a new application size
  cap. Runtime memory/disk/time limits and ImageMagick policies still apply.
  Unsupported codecs fail as native conversion errors rather than being silently
  converted to another format. Local native version/delegates differ from Cloud.
- Compare representative images in the actual runtime: JPEG quality, profiles,
  EXIF/IPTC/XMP, animations, SVG delegates and rare formats can vary between
  ImageMagick versions. Exact byte equality across versions is not promised.
- A legitimate original whose filename normalizes to another source's existing
  thumbnail path is rejected instead of overwriting unrelated data. This is an
  intentional collision safety difference; inspect actual names before cutover.
  Encoded downloads are not labeled with stale contentEncoding after conversion.
  Errors are retried by Eventarc, including permanent codec failures; set
  alerts and an operational resolution path before enabling live traffic.
- Reserved markers are `blogPipelineInputGeneration`,
  `blogPipelineSourceGeneration`, `blogPipelineSourceName`. Check for existing
  custom-key collisions before cutover.
- Original public code has no `functions.config()` call. That does not establish
  that deployed code or Runtime Config has already migrated. Never dump values.

## Configuration and deployment prerequisites (not executed)

`IMAGE_BUCKET`, `IMAGE_REGION`, `IMAGE_SERVICE_ACCOUNT`, and `IMAGE_MAX_INSTANCES` are required parameters with no production
defaults. Verify actual bucket location before choosing the event trigger region;
the legacy function region alone is insufficient. The selected runtime is Node 22;
dependencies are pinned with a lockfile. Functions have 1 GiB memory, legacy-style
CPU, concurrency 1, a capacity selected explicitly at deployment, 120-second
timeout and retries. The old console reported max instances 3000; no lower
production cap is silently substituted. Capacity requires v2 quota/load review.
Limits require
load validation; no invocation or billing estimate was verified in this task.

The code selects an explicit service account and makes no declarative IAM/API
requests. The proposed account is blog-image-pipeline@book-blog-with-largo.iam.gserviceaccount.com;
its creation and permissions remain subject to approval. Storage access is limited
to the one image bucket. Do not run firebase deploy: CLI15.34.0 independently adds
project-wide event-delivery bindings even with an explicit service account.
Use the reviewed API sequence in ../migration-evidence/SCOPED_API_DEPLOYMENT.md.
Blaze and the four deployment APIs/default service-agent roles are already enabled.

1. Retain the approved billing alert and existing handlers during verification.
2. Obtain deployed source/config snapshots and representative original/thumbnail
   metadata without exposing secrets. Resolve format/limit/URL compatibility gates.
3. After scoped IAM approval, deploy only the new paused function in the existing
   project using the reviewed API sequence. Verify native ImageMagick on Linux
   Node 22 without production object writes; then plan a controlled upload test.
4. For separately approved production cutover, pause uploads and drain in-flight
   work. Record a narrow event boundary; do not schedule historical backfill.
   Disable/remove the old rotation function and extension only with explicit
   approval. Do not leave the legacy extension and new handler concurrently
   writing to the same output namespace. New thumbnail markers do not protect
   against writes from the old extension.
5. Wait for Eventarc readiness and verify new-handler logs plus original and
   derivative behavior before reopening uploads. Reconcile only known cutover
   events if necessary. This is distinct from a bulk historical reprocess.
6. Prepare a rollback on a supported runtime before cutover. Redeploying Node 8
   is not a viable rollback assumption; retain snapshots and the previous tested
   modern artifact. Never run an unscoped functions deployment from this migration
   config, or infer authorization to delete existing functions from a CLI prompt.

## Deployment safety switch
IMAGE_PROCESSING_PAUSED defaults to true. Paused events are acknowledged without
Storage reads or writes; they will NOT replay automatically when unpaused. Keep
legacy handlers active during paused runtime verification. For the local demo
emulator integration only, explicitly set IMAGE_PROCESSING_PAUSED=false.
Changing this parameter to false is the production cutover and must be coordinated
with retiring the old writers and pausing all uploaders. No historical backfill.
