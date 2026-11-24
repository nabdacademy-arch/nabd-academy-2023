import unittest
from prometheus_release_gate import assess_release, REQUIRED

class ReleaseGateTests(unittest.TestCase):
    def test_all_combinations(self):
        for mask in range(1 << len(REQUIRED)):
            checks = {name: bool(mask & (1 << i)) for i,name in enumerate(REQUIRED)}
            result = assess_release(checks)
            self.assertEqual(result["status"], "eligible_for_review" if all(checks.values()) else "blocked")
            self.assertFalse(result["executed"])
    def test_invalid(self):
        for value in [None, [], {}, dict.fromkeys(REQUIRED, "true"), dict.fromkeys(REQUIRED, 1)]:
            self.assertEqual(assess_release(value)["status"], "blocked")
