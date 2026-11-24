"""Pure readiness assessment; never deploys or authorizes a release."""
REQUIRED = ("unit_tests", "regression_tests", "security_review", "rollback_test", "privacy_review", "human_approval")

def assess_release(checks):
    if not isinstance(checks, dict):
        return {"status": "blocked", "missing": list(REQUIRED)}
    missing = [name for name in REQUIRED if checks.get(name) is not True]
    return {"status": "blocked" if missing else "eligible_for_review",
            "missing": missing, "executed": False}
