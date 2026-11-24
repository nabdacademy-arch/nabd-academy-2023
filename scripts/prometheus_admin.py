"""Autonomous local administrative triage; no external writes or messages."""
def triage(report):
    final = report.get("final") if isinstance(report, dict) else None
    status = final.get("status") if isinstance(final, dict) else None
    if status == "healthy":
        return {"priority": "routine", "owner": "operations", "task": "record_health", "review": False}
    if status == "degraded":
        return {"priority": "high", "owner": "operations", "task": "investigate_service", "review": True}
    return {"priority": "high", "owner": "operations", "task": "verify_monitor", "review": True}

def administrative_cycle(run=None):
    from prometheus_operations import cycle
    report = cycle(run)
    return {"health": report, "administrative_task": triage(report),
            "external_actions": False}

if __name__ == "__main__":
    import json
    result = administrative_cycle()
    print(json.dumps(result, ensure_ascii=False))
    raise SystemExit({"healthy": 0, "degraded": 1, "unknown": 2}[result["health"]["final"]["status"]])
