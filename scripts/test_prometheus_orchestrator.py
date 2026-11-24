import unittest
from prometheus_orchestrator import plan, assess_health, OPERATIONS

class OrchestratorTests(unittest.TestCase):
    def test_all_domains(self):
        for domain in OPERATIONS:
            result = plan(domain, ["synthetic evidence"])
            self.assertEqual(result["status"], "awaiting_review")
            self.assertFalse(result["executed"])
            self.assertEqual([s["decision"] for s in result["steps"]], ["allow", "review"])
    def test_unknown_domain(self):
        self.assertEqual(plan("root", ["x"])["status"], "denied")
    def test_invalid_evidence(self):
        self.assertEqual(plan("recovery", [])["status"], "denied")
    def test_health(self):
        self.assertEqual(assess_health({"a": True, "b": False}), {"status":"degraded","failed":["b"]})
        self.assertEqual(assess_health({"a": True})["status"], "healthy")
    def test_unknown_health(self):
        for value in [{}, None, {"a": "true"}]:
            self.assertEqual(assess_health(value)["status"], "unknown")
