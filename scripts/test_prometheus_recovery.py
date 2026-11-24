import hashlib
import tempfile
import unittest
from pathlib import Path
from prometheus_recovery import restore_cache

class RecoveryTests(unittest.TestCase):
    def test_restore(self):
        with tempfile.TemporaryDirectory() as directory:
            data = b'{"status":"healthy"}'
            self.assertTrue(restore_cache(directory, data, hashlib.sha256(data).hexdigest()))
            self.assertEqual((Path(directory)/"prometheus-health-cache.json").read_bytes(), data)
            self.assertFalse(restore_cache(directory, b"corrupt", hashlib.sha256(data).hexdigest()))
            self.assertEqual((Path(directory)/"prometheus-health-cache.json").read_bytes(), data)
