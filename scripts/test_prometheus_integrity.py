import unittest
from copy import deepcopy
from prometheus_integrity import append, verify, GENESIS

class IntegrityTests(unittest.TestCase):
    def setUp(self):
        self.journal = append(append([], {"decision":"allow"}), {"decision":"review"})
        self.head = self.journal[-1]["hash"]
    def test_valid(self):
        self.assertTrue(verify(self.journal, self.head))
        self.assertTrue(verify([], GENESIS))
    def test_tamper(self):
        changed = deepcopy(self.journal)
        changed[0]["decision"]["decision"] = "deny"
        self.assertFalse(verify(changed, self.head))
    def test_truncation(self):
        self.assertFalse(verify(self.journal[:-1], self.head))
    def test_reordering(self):
        self.assertFalse(verify(self.journal[::-1], self.head))
    def test_invalid(self):
        self.assertFalse(verify([None], self.head))
        with self.assertRaises(ValueError):
            append([], {"decision":"execute"})
