import itertools
import unittest
from prometheus_readiness import STAGES, readiness

class ReadinessTests(unittest.TestCase):
    def test_combinations(self):
        for values in itertools.product((False, True), repeat=10):
            result = readiness(dict(zip((key for _, key in STAGES), values)))
            self.assertEqual(result["verified_count"], sum(values))
            self.assertEqual(result["ready"], all(values))
            self.assertFalse(result["evidence_authenticated"])
    def test_invalid(self):
        self.assertFalse(readiness(None)["ready"])
        self.assertFalse(readiness({key: 1 for _, key in STAGES})["ready"])
