# PROMETHEUS — engineering specification
Status: isolated prototype, not a production security boundary.

## Architecture
Policy -> planner -> review -> external executor (not implemented).
Guardian adapter uses the existing read-only monitor. The journal requires an independently trusted checkpoint. The lab uses synthetic inputs only.

## Threat model
Untrusted evidence and model output must never confer permissions. Unknown actions fail closed. A compromised process can rewrite local policy and hashes; production enforcement must reside in a separate trusted service. Do not store credentials, personal data or raw messages in the journal. Hashes are not signatures. No automatic containment, deployment, messaging or recovery is authorized by this prototype.

## Verification
Run:
```sh
python3 -m unittest discover -s scripts -p 'test_prometheus*.py'
python3 scripts/prometheus_lab.py
python3 scripts/prometheus_report.py
```
Optional live read-only check: python3 scripts/prometheus_guardian_adapter.py.

## Production acceptance
- Independent server-side authentication and authorization for every action.
- CORTEX adapter with least privilege and explicit approval.
- Model provider integration with structured outputs and untrusted-input isolation.
- Durable signed audit checkpoints and retention policy.
- Idempotent executor, bounded retries, rollback and emergency stop.
- Staging integration tests, threat review and operational monitoring.
- Preserve homepage, academy identity and existing student data.

Do not claim autonomous operation or comparative superiority until measured.
