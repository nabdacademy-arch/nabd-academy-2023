"""Tamper-evident journal prototype; trusted checkpoint must be stored independently."""
import hashlib
import json
import hmac

GENESIS = "0" * 64

def digest(record):
    return hashlib.sha256(json.dumps(record, sort_keys=True, separators=(",", ":"), ensure_ascii=True, allow_nan=False).encode()).hexdigest()

def append(journal, decision):
    if not isinstance(decision, dict) or decision.get("decision") not in ("allow", "review", "deny"):
        raise ValueError("invalid decision")
    entry = {"sequence": len(journal), "previous": journal[-1]["hash"] if journal else GENESIS,
             "decision": json.loads(json.dumps(decision, allow_nan=False))}
    entry["hash"] = digest(entry)
    return [*journal, entry]

def verify(journal, trusted_head):
    if not isinstance(journal, list) or not isinstance(trusted_head, str):
        return False
    previous = GENESIS
    try:
        for i, entry in enumerate(journal):
            body = {k:v for k,v in entry.items() if k != "hash"}
            if body["sequence"] != i or body["previous"] != previous:
                return False
            if not hmac.compare_digest(digest(body), entry["hash"]):
                return False
            previous = entry["hash"]
        return hmac.compare_digest(previous, trusted_head)
    except (TypeError, ValueError, KeyError, AttributeError, UnicodeError):
        return False
