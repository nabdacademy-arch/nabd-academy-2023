import unittest
from prometheus_report import report

class ReportTests(unittest.TestCase):
    def test_integrated(self):
        result = report()
        self.assertEqual(result["journal_entries"], 12)
        self.assertTrue(result["journal_valid"])
        self.assertFalse(result["checkpoint_independent"])
        self.assertFalse(result["executed"])
        self.assertEqual(result["benchmark"]["failed"], [])
        self.assertEqual(result["health"]["status"], "degraded")
        self.assertTrue(all(v == "awaiting_review" for v in result["plans"].values()))
