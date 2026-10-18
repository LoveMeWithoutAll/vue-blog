# Production cutover completed — 2026-10-18

At05:44:58UTC final verification completed; uploads can resume. Public blog:
https://book-blog-with-largo.firebaseapp.com/ returnedHTTP200.

## Production state
- Only processBlogImage is listed: Node22/2ndgen,us-central1,ACTIVE.
- IMAGE_PROCESSING_PAUSED=false,maxInstances3,minInstances0,concurrency1,1GiB,
  fractional0.5833vCPU,120second timeout.
- Named runtime/trigger account blog-image-pipeline@book-blog-with-largo.iam.gserviceaccount.com.
- Separate Eventarc trigger blog-image-finalized/us targets Cloud Run
  processblogimage/us-central1, only finalized events from the existing bucket.
  Functions API metadata remains HTTP; runtime signature is CloudEvent. Manage
  the separate trigger explicitly and do not use Firebase CLI auto-IAM deployment.
- Extension storage-resize-images0.1.5 uninstalled, including its managed function
  ext-storage-resize-images-generateResizedImage and dedicated service account.
- rotateUsingExif deleted separately. Shared App Engine account preserved.
- Existing bucket, Firestore, Hosting and user images were not removed.
- Last five minutes of old-function logs were empty before removal began at
  05:37:32UTC. Known user upload pause was explicitly approved/confirmed through
  the parent conversation. No UI/Storage-rules upload lock was installed.

## Actual production validation
Synthetic test path images/__migration_cutover_20261018T0540Z_exif6.jpg only:
- First upload:800x600EXIF6 ->600x800original,375x500thumbnail.
- Same-path overwrite:600x900 ->600x900original,333x500thumbnail.
- Both rounds: original download token retained; actual original HTTP200 download;
  independent thumbnail token and successful download; no generation changes for
  ten seconds after convergence. A prior harness-only stream option error was
  corrected and its two synthetic objects cleaned up before the full rerun.
- Final test original and thumbnail deleted with exact generation preconditions.
- Live object count122 and bytes171443020 match the pre-cutover readout exactly.
- No historical bulk reprocessing. Old rotation/resize behavior is maintained.
- Test wall time to validate convergence/downloads:6.168s and5.138s, not CPU billing
  time. Main processing HTTP requests were about0.930s and1.016s for these small
  uniform-color JPEG fixtures; large-image/traffic performance is not established.

## Transient and final health
One competing event hit a Storage generation/metageneration precondition and
returnedHTTP500. The guard prevented a conflicting write, and the delivery queue
subsequently drained: at05:44UTC undelivered_messages0 and oldest_unacked_age0.
The most recent minute had0ERROR logs. Do not describe the test as having zero
transient errors. Google Storage SDK also emitted MaxListeners warnings during
the conflict; no sustained failure or continuing write loop was observed.
The source generation guards and retry delivery remain enabled.

## Recovery
Verified source archive ../image-pipeline-paused-recovery.zip,
SHA256 dba24624a124b756215ce379ef3d9b49aec36048bbed1627915cbc4b427d05df.
Its redeployment was rehearsed as revision processblogimage-00002-riq with actual
native conversion and Storage event delivery. Active revision is
processblogimage-00003-xor (same source,activated settings).
If a problem develops: stop uploads, pause the new function while preserving env,
wait for activation/pause operation completion, redeploy the frozen source using
the scoped API procedure, and repeat a synthetic test before reopening. The
separate Eventarc trigger and dedicated IAM must remain intact. This is not an
instant rollback to removed Node8 resources; behavior bugs can still require fixes.
The currently deployed code does not use functions.config(); legacy config values
were never opened or deleted. No claim is made about unrelated residual config
resources or exported secrets.

## Costs and evidence
Conditional low-traffic estimate USD0–2/month (~KRW0–3,000); see
MONTHLY_COST_ESTIMATE.md for measured storage, free-tier assumptions and limits.
KRW13,300 is an alert only, not a forecast or cap.

Evidence:cutover-removal-operations.json,cutover-removal-status.json,
cutover-activation-operation.json,production-probe.json,cutover-final-audit.json,
cutover-settled-check.json,cutover-quiescence-usage.json.
Source changes are committed locally; no Git remote push was performed.
