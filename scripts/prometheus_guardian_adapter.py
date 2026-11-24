"""Explicit opt-in live check using the existing Guardian monitor."""
import json
import nabd_guardian
from prometheus_orchestrator import assess_health, plan

def monitor(run=None):
    code = (run or nabd_guardian.main)()
    if type(code) is not int or code not in (0, 1):
        return {"status": "unknown", "executed_recovery": False}
    health = assess_health({"guardian_aggregate": code == 0})
    return {"status": health["status"], "failed": health["failed"],
            "recovery_plan": plan("recovery", ["Guardian reported a failed aggregate check"]) if code == 1 else None,
            "executed_recovery": False}

if __name__ == "__main__":
    print(json.dumps(monitor(), ensure_ascii=False))
