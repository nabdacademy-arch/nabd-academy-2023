"""PROMETHEUS v0: offline, deny-by-default decision gate. Never executes actions."""
import hashlib
import json

POLICY = {
    "administration": {"summarize": "allow", "assign": "review"},
    "communication": {"draft": "allow", "send": "review"},
    "research": {"summarize": "allow", "publish": "review"},
    "engineering": {"propose": "allow", "deploy": "review"},
    "security": {"analyze": "allow", "contain": "review"},
    "recovery": {"diagnose": "allow", "restore": "review"},
}

def evaluate(domain, action, evidence):
    """Return a recommendation, never an authorization token."""
    if not isinstance(domain, str) or not isinstance(action, str):
        return {"decision": "deny", "reason": "invalid request"}
    if not isinstance(evidence, list) or not evidence or len(evidence) > 32 or any(
        not isinstance(item, str) or not item.strip() or len(item) > 2048 for item in evidence
    ):
        return {"decision": "deny", "reason": "invalid evidence"}
    decision = POLICY.get(domain, {}).get(action, "deny")
    record = {"version": 1, "domain": domain, "action": action,
              "decision": decision, "evidence_count": len(evidence)}
    # Digest binds evidence without retaining its plaintext. Not a signature.
    payload = json.dumps([record, evidence], sort_keys=True, ensure_ascii=True,
                         separators=(",", ":")).encode("utf-8")
    record["digest"] = hashlib.sha256(payload).hexdigest()
    return record
