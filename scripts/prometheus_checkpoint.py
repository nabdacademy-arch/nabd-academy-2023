"""HMAC checkpoint primitive; key custody and durable storage are external."""
import hashlib
import hmac
import re

def seal(head, key):
    if not isinstance(head, str) or not re.fullmatch(r"[0-9a-f]{64}", head):
        raise ValueError("Invalid journal head")
    if not isinstance(key, bytes) or len(key) < 32:
        raise ValueError("At least 32 key bytes required")
    return hmac.new(key, b"NABD-PROMETHEUS-v1:" + head.encode("ascii"), hashlib.sha256).hexdigest()

def verify_checkpoint(head, key, tag):
    if not isinstance(tag, str) or not re.fullmatch(r"[0-9a-f]{64}", tag):
        return False
    try:
        return hmac.compare_digest(seal(head, key), tag)
    except ValueError:
        return False
