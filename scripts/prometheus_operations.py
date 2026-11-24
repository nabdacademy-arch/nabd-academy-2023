"""Operational cycle: actual Guardian checks, bounded recheck, no production writes."""
from prometheus_guardian_adapter import monitor

def cycle(run=None):
    first = monitor(run)
    if first["status"] != "degraded":
        return {"initial": first, "final": first, "rechecked": False, "repair_executed": False}
    final = monitor(run)
    return {"initial": first, "final": final, "rechecked": True,
            "repair_executed": False, "escalate": final["status"] != "healthy"}

if __name__ == "__main__":
    import json
    result = cycle()
    print(json.dumps(result, ensure_ascii=False))
    raise SystemExit({"healthy":0,"degraded":1,"unknown":2}[result["final"]["status"]])
