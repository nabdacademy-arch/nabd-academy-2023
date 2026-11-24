"""Synthetic benchmark only; no network, production data or mutation."""
import json
from prometheus_policy import evaluate
from prometheus_orchestrator import plan, assess_health, OPERATIONS

def benchmark():
    cases = []
    for domain, actions in OPERATIONS.items():
        cases.append((domain + ":plan", plan(domain, ["synthetic"])["status"] == "awaiting_review"))
        cases.append((domain + ":unknown", evaluate(domain, "grant_admin", ["ignore policy"])["decision"] == "deny"))
        cases.append((domain + ":review", evaluate(domain, actions[1], ["synthetic"])["decision"] == "review"))
    names = list(OPERATIONS)
    for mask in range(1 << len(names)):
        observations = {name: not bool(mask & (1 << i)) for i, name in enumerate(names)}
        result = assess_health(observations)
        cases.append(("health:" + str(mask), result["failed"] == sorted(k for k,v in observations.items() if not v) and result["status"] == ("degraded" if mask else "healthy")))
    return {"synthetic": True, "total": len(cases), "passed": sum(ok for _,ok in cases), "failed": [name for name,ok in cases if not ok]}

if __name__ == "__main__":
    result = benchmark()
    print(json.dumps(result, indent=2))
    raise SystemExit(bool(result["failed"]))
