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
