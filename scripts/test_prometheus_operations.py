import unittest
from prometheus_operations import cycle

class OperationsTests(unittest.TestCase):
    def test_recovered(self):
        codes = iter([1,0])
        result = cycle(lambda: next(codes))
        self.assertTrue(result["rechecked"])
        self.assertFalse(result["escalate"])
        self.assertFalse(result["repair_executed"])
    def test_persistent(self):
        codes = iter([1,1])
        self.assertTrue(cycle(lambda: next(codes))["escalate"])
    def test_healthy(self):
        self.assertFalse(cycle(lambda: 0)["rechecked"])
    def test_unknown(self):
        self.assertFalse(cycle(lambda: 2)["rechecked"])
