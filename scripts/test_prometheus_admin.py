import unittest
from prometheus_admin import triage, administrative_cycle

class AdminTests(unittest.TestCase):
    def test_healthy(self):
        self.assertFalse(administrative_cycle(lambda: 0)["administrative_task"]["review"])
    def test_degraded(self):
        result = administrative_cycle(lambda: 1)
        self.assertTrue(result["administrative_task"]["review"])
        self.assertFalse(result["external_actions"])
    def test_unknown(self):
        self.assertEqual(triage(None)["task"], "verify_monitor")
        self.assertTrue(administrative_cycle(lambda: 2)["administrative_task"]["review"])
