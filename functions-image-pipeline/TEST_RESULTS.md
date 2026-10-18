# Local validation — 2026-10-18

- Runtime: Node.js **22.23.3**, macOS arm64 (isolated npm cache runtime).
- `node --test`: **18 passed, 0 failed, 0 skipped**.
- ESLint 10.13.0: **passed, zero warnings**.
- `git diff --check`: passed after staging the deliverable.
- SDK registration: only `processBlogImage`, v2 Storage finalize, parameterized
  bucket/region, retries, concurrency 1, isolated codebase/config verified offline.
- Source search: no `functions.config` / `runtimeconfig` matches in existing
  `functions/` or `src/`; deployed source and cloud Runtime Config remain unverified.

Tests process real generated JPEG (EXIF orientation 6), PNG (alpha, small image),
and WebP (portrait) buffers. Storage race tests use an in-memory model enforcing
generation and metageneration preconditions; adapter tests check actual SDK call
arguments. They cover simultaneous duplicate events, retry after original write,
new upload during processing, stale delivery, newer thumbnail races, metadata
updates, deleted source, token retention, path collision and invalid input.

Earlier checks exposed missing lint globals and a test assertion that compared
an SDK parameter object with its serialized string. Both were corrected. Review
also found a metadata-only race that could drop thumbnail work; it now retries,
with a passing regression test. No checks remain failing locally.

Not run: Firebase Emulator Suite, real Storage/Eventarc integration, production
sample comparisons, Linux native Sharp execution, deployed-source comparison,
all-format/ImageMagick parity, billing/IAM validation, frontend build/tests, or
any deployment. Existing frontend and old function sources were not changed.

Production remains gated on the compatibility and cutover checklist in README.
