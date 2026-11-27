"""Evidence inventory, not a certification or authorization mechanism."""
REQUIREMENTS = {
    "FHIR": ("official_validation", "hospital_integration"),
    "Open Badges": ("schema_validation", "issuer_proof", "revocation"),
    "LTI": ("signed_launch", "nonce", "deployment_registration"),
    "xAPI": ("statement_validation", "persistent_deduplication"),
    "ASVS": ("security_tests", "independent_review"),
    "ISO27001": ("risk_register", "control_audit"),
    "ISO21001": ("learning_outcomes", "quality_review"),
    "ISO42001": ("ai_inventory", "impact_assessment", "human_oversight"),
    "WCAG": ("keyboard_test", "contrast_test", "screen_reader_test"),
    "Integration": ("offline_sync", "regression", "privacy_review"),
}

def inventory(evidence):
    evidence = evidence if isinstance(evidence, dict) else {}
    result = {}
    for standard, checks in REQUIREMENTS.items():
        supplied = evidence.get(standard)
        supplied = supplied if isinstance(supplied, dict) else {}
        missing = [check for check in checks if supplied.get(check) is not True]
        result[standard] = {"missing": missing, "reported_complete": not missing}
    return {"standards": result, "independently_verified": False,
            "certified": False, "production_authorized": False}
