"""Recover a disposable local diagnostic cache, never production records."""
import hashlib
import hmac
import os
import tempfile
from pathlib import Path

def restore_cache(directory, snapshot, trusted_digest):
    if not isinstance(snapshot, bytes) or len(snapshot) > 1048576:
        return False
    if not isinstance(trusted_digest, str) or not hmac.compare_digest(hashlib.sha256(snapshot).hexdigest(), trusted_digest):
        return False
    root = Path(directory)
    target = root / "prometheus-health-cache.json"
    if target.is_symlink():
        return False
    fd, temporary = tempfile.mkstemp(dir=root)
    try:
        with os.fdopen(fd, "wb") as stream:
            stream.write(snapshot)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, target)
        return True
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)
