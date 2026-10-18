# Local validation — 2026-10-18

- Runtime: Node.js **22.23.3**, macOS arm64 (isolated npm cache runtime).
- Native test executable: ImageMagick **6.9.13-60 (Beta)**, Q16 arm64,
  built in `/tmp` from official ImageMagick6 commit
  `0b36d6bafb58eea8f288c456d4bfac40dc9cda90` using existing local codec libraries.
  Only build-time configure detection was adjusted to use explicit existing
  library paths because pkg-config was absent. No system package was installed.
- `node --test`: **27 passed, 0 failed, 0 skipped** after preservation review.
- ESLint 10.13.0: **passed, zero warnings**.
- `git diff --check`: passed after staging the deliverable.
- SDK registration: only `processBlogImage`, v2 Storage finalize, parameterized
  bucket/region, retries, concurrency 1, isolated codebase/config verified offline.
- Source search: no `functions.config` / `runtimeconfig` matches in existing
  `functions/` or `src/`; deployed source and cloud Runtime Config remain unverified.

Tests process real generated JPEG (EXIF orientation 6), PNG (alpha, small image),
WebP (portrait), animated GIF (two frames, delays and repeat count), TIFF,
a valid PNG with trailing bytes above 25 MiB, and an 8001x5001 image (>40 MP).
The byte-limit test verifies input admission, not high-entropy image memory usage.
Sharp is only a development fixture generator/decoder; the production transform
under test invokes native ImageMagick, with no fallback.
Storage race tests use an in-memory model enforcing
generation and metageneration preconditions; adapter tests check actual SDK call
arguments. They cover simultaneous duplicate events, retry after original write,
new upload during processing, stale delivery, newer thumbnail races, metadata
updates, deleted source, same-name reuploads with independent original/derivative
tokens, suffix-only source names, path normalization, collision and invalid input.
Native command tests also verify private paths and cleanup on failure.

Earlier checks exposed missing lint globals and a test assertion that compared
an SDK parameter object with its serialized string. Both were corrected. Review
also found a metadata-only race that could drop thumbnail work; it now retries,
with a passing regression test. The preservation self-review confirmed the initial
JPEG/PNG/WebP-only allowlist and 25 MiB / 40 MP limits were unjustified regressions.
They were removed, native legacy operations restored, and the implicit capacity
cap replaced by a required deployment parameter. No checks remain failing locally.

Not run: Firebase Emulator Suite, real Storage/Eventarc integration, production
sample comparisons, exact Google Linux native ImageMagick runtime execution,
deployed-source comparison, all-format/all-EXIF-orientation parity, billing/IAM
validation, frontend build/tests, or
any deployment. Existing frontend and old function sources were not changed.

Production remains gated on the compatibility and cutover checklist in README.

The final local command used the temporary `utilities` directory on PATH and
`MAGICK_CONFIGURE_PATH=/tmp/vue-blog-imagemagick6/config`; no profile/PATH setting
was changed. Node 22.23.3 ran both the tests and ESLint.

## Additional integration verification (2026-10-18)

PASS: Firebase CLI 15.34.0 Storage + Functions + Eventarc emulators, Node 22.23.3,
synthetic demo-vue-blog-image-test project, localhost only. Actual SDK upload produced
automatic v2 finalized event. EXIF-6 JPEG original became 600x800; thumbnail became
375x500. Original download token survived; derivative did not copy it. Original and
thumbnail follow-up events converged (processed / thumbnail / complete); derivative
generation stayed stable. Reproducible script: integration/emulator.cjs.
CLI emitted a firebase-admin dependency warning despite successful event execution;
this test does not establish full emulator feature coverage or production IAM behavior.

Run emulators with firebase.image-pipeline.emulator.json, explicitly
--project demo-vue-blog-image-test. Supply local .env.demo-vue-blog-image-test:
IMAGE_BUCKET=demo-vue-blog-image-test.appspot.com, IMAGE_REGION=us-central1,
IMAGE_MAX_INSTANCES=1. Use separate lines. The permissive storage.emulator.rules is
ONLY for synthetic local tests; never deploy it. Run script with
STORAGE_EMULATOR_HOST=http://127.0.0.1:9199 node integration/emulator.cjs.
A working convert executable is required on PATH.

## Runtime evidence and remaining deployment gates

Read-only inspection of public official google-22-full/runtimes/nodejs22 image layer
sha256:3ba44be5095e52f9925cc4333e303b500f8577320ac23295eac75adb2792f00a
found /usr/bin/convert and ImageMagick Q16 package
8:6.9.11.60+dfsg-1.3ubuntu0.22.04.5+esm14 (amd64).
The layer policy limits memory=256MiB, map=512MiB, disk=1GiB, width/height=16KP,
area=128MP; blocks URL/HTTP/HTTPS delegates, @ paths and PS/PS2/PS3/EPS/PDF/XPS.
No application-added format/size restriction does NOT mean unlimited runtime support.
This is static layer evidence, not execution or proof of the stack selected by Firebase.
Local tests used Mac ImageMagick 6.9.13-60; no usable Docker engine exists on this Mac.
Exact deployed Linux codecs/policies, memory and timeout behavior remain NOT RUN.
Official references: https://docs.cloud.google.com/docs/buildpacks/stacks and
https://docs.cloud.google.com/functions/docs/reference/system-packages .

Read-only authenticated user-Mac Chrome access could list production bucket objects,
but Configuration explicitly denied storage.buckets.get and storage.buckets.getIamPolicy.
Bucket location/IAM therefore remain BLOCKED. Previously observed project Spark/billing
disabled also remains a production deployment blocker; no billing or IAM was changed.
No callable Firebase MCP tools are exposed in this session.

## Concrete next approval scope: isolated cloud verification only

Use a separate billing-enabled staging project and one staging bucket/function in
us-central1, maxInstances=1/minInstances=0/concurrency=1, 1GiB, timeout120s; no production
bucket access. At most 20 synthetic fixtures, <=5MiB total compressed input, <=100
expected deliveries, one build, stop within 30 minutes and explicitly delete created
function/trigger/bucket artifacts after evidence collection. Verify deployed stack and
convert -version/-list format/-list policy first, then EXIF1-8, GIF frames/delays,
JPEG/PNG/WebP/TIFF, duplicate and overwrite ordering, object metadata and permissions.
Do not expose a public invocation endpoint. Eventarc invoker/receiver roles and storage
service-agent Pub/Sub publishing, build/deploy service accounts, required APIs and
bucket-scoped runtime object access must be reviewed by project administrator.
Do not blindly accept project-wide requiresRole provisioning.

Planning estimate: <$1 USD for this bounded trial under normal completion, not a billing
cap or guarantee. At 100 x 120 seconds, conservative 1vCPU/1GiB active compute is about
$0.318 before free tiers at us-central1 rates ($0.000024/vCPU-s + $0.0000025/GiB-s).
Build, artifact storage, Eventarc/PubSub, object operations and logs add costs; retries
or lingering resources invalidate that estimate. Budget alerts do not enforce a cap.
Reference: https://cloud.google.com/run/pricing . Obtain approval for this exact resource,
billing and cleanup scope before creating anything; production migration is separate.
