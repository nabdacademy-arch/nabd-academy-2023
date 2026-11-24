"""Readiness inventory: never equate code presence with production readiness."""
STAGES = (
 ("governance", "policy"), ("monitoring", "guardian"),
 ("scheduled_operations", "scheduler"), ("administration", "admin_executor"),
 ("security", "security_boundary"), ("recovery", "rollback"),
 ("ai", "model_provider"), ("integrity", "trusted_checkpoint"),
 ("dashboard", "browser_auth"), ("release", "production_acceptance"),
)

def readiness(evidence):
    evidence = evidence if isinstance(evidence, dict) else {}
    stages = [{"stage": name, "required": key,
               "verified": evidence.get(key) is True} for name, key in STAGES]
    return {"stages": stages, "verified_count": sum(s["verified"] for s in stages),
            "ready": all(s["verified"] for s in stages),
            "evidence_authenticated": False}
