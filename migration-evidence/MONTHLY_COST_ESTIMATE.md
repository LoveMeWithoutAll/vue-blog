# Monthly cost estimate — 2026-10-18

Planning range for this small blog: USD0–2/month (roughly KRW0–3,000), assuming
low traffic, at most1,000 image uploads/month, <=10seconds processing per upload
plus short duplicate/derivative events, no minimum warm instance, image download
<=1GB EACH day, Hosting transfer<=360MB EACH day, and Firestore within free quotas.
This is a conditional estimate, not an invoice forecast or spending cap. Other
projects can consume billing-account-level free tiers; taxes/KRW SKU rates vary.
Today's migration builds are nonrecurring and are not a representative month.

## Actual read-only measurements
- Existing live objects:122; live bytes171,443,020 (~171MB,0.160GiB).
- Latest existing live-object creation before tests:2025-11-12T19:55:42.839Z.
- Artifact Registry gcf-artifacts:127,320,771bytes (~127MB), before final test.
- 30-day storage sent-bytes metric:4,336bytes, largely management API operations.
  Old function executions6 and new Run requests2 at collection time were consistent
  with this investigation's probes. These are NOT evidence of normal visitor
  downloads: billing was just restored; missing/incomplete traffic cannot be
  treated as a reliable zero-cost month. Monitoring data is not billing export.
- Storage total_bytes is a daily gauge. Sum5,143,571,550 is a sum of daily samples,
  NOT5.14GB of stored data. Use current object total above for the estimate.
- Hosting/Firestore historical consumption and actual invoice line items were
  not retrieved. Their free-tier assumptions are explicit above.
- Live test processing request latencies were approximately0.930s and1.016s for
  two small JPEG fixtures; total end-to-end validation took6.168s/5.138s including
  polling/downloads. These are not measured CPU usage or a guarantee for large
  files. The10second planning assumption above deliberately exceeds those samples.

## Published prices relevant to this project
- Legacy *.appspot.com bucket: first5GB storage free; then$0.026/GB-month.
  First1GB download/day free; then$0.12/GB. Daily free allowances do not roll over.
  Upload operations20,000/day and download operations50,000/day free.
- Cloud Run request-based(us-central1):180,000vCPU-seconds,360,000GiB-seconds and
  2million requests/month free. Runtime0.5833vCPU/1GiB,minInstances0,maxInstances3.
  1,000 uploads*10seconds consumes about5,833vCPU-seconds and10,000GiB-seconds
  before extra short events/startup. Small synthetic timings are not a large-image
  performance guarantee. MaxInstances3 caps concurrency, not total monthly cost.
- Artifact Registry first0.5GiB/account free; above approximately$0.10/GiB-month.
  Current measured repository is below that allowance if not consumed elsewhere.
- Eventarc Google-source events$0; Pub/Sub transport has a10GiB monthly free tier.
- Hosting:10GB storage and360MB/day transfer free; excess transfer$0.15/GB.

Example traffic sensitivity:100GB of image downloads spread evenly across30days
would exceed the daily allowances by roughly70GB:70*$0.12=$8.40 (~KRW11,200 before
tax using the earlier approximate exchange rate), excluding Hosting and other
services. Concentrated downloads can cost more for the same monthly total.

KRW13,300 monthly budget is an alert only, not this estimate and not automatic
shutdown. No spend cap or new recurring monitoring was created.

Sources accessed2026-10-18:
- https://firebase.google.com/pricing
- https://cloud.google.com/run/pricing
- https://cloud.google.com/artifact-registry/pricing
- https://cloud.google.com/eventarc/pricing

Evidence:cutover-quiescence-usage.json,usage-metrics-30d.json,
artifact-storage-usage.json,production-probe.json,cutover-final-audit.json.
