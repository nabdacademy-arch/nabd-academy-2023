"""Offline planning adapter. No external calls or action execution."""
from prometheus_policy import evaluate

OPERATIONS = {
    "administration": ("summarize", "assign"),
    "communication": ("draft", "send"),
    "research": ("summarize", "publish"),
    "engineering": ("propose", "deploy"),
    "security": ("analyze", "contain"),
    "recovery": ("diagnose", "restore"),
}

def plan(domain, evidence):
    if not isinstance(domain, str) or domain not in OPERATIONS:
        return {"status": "denied", "steps": []}
    steps = [evaluate(domain, action, evidence) for action in OPERATIONS[domain]]
    if any(step["decision"] == "deny" for step in steps):
        return {"status": "denied", "steps": []}
    return {"status": "awaiting_review", "steps": steps, "executed": False}

def assess_health(observations):
    """Classify explicit synthetic/monitor observations, not live telemetry."""
    if not isinstance(observations, dict) or not observations:
        return {"status": "unknown", "failed": []}
    if any(not isinstance(k, str) or type(v) is not bool for k,v in observations.items()):
        return {"status": "unknown", "failed": []}
    failed = sorted(k for k,v in observations.items() if not v)
    return {"status": "degraded" if failed else "healthy", "failed": failed}
