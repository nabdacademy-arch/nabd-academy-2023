import unittest
from prometheus_guardian_adapter import monitor

class GuardianAdapterTests(unittest.TestCase):
    def test_healthy(self):
        self.assertEqual(monitor(lambda: 0)["status"], "healthy")
    def test_degraded(self):
        result = monitor(lambda: 1)
        self.assertEqual(result["recovery_plan"]["status"], "awaiting_review")
        self.assertFalse(result["executed_recovery"])
    def test_unknown(self):
        for code in (2, None, True):
            self.assertEqual(monitor(lambda: code)["status"], "unknown")
