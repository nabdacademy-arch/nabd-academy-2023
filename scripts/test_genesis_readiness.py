import unittest
from genesis_readiness import inventory, REQUIREMENTS

class ReadinessTests(unittest.TestCase):
    def test_missing(self):
        self.assertTrue(all(v["missing"] for v in inventory(None)["standards"].values()))
    def test_truthy_not_evidence(self):
        self.assertIn("official_validation",inventory({"FHIR":{"official_validation":"yes"}})["standards"]["FHIR"]["missing"])
    def test_complete_is_not_certification(self):
        result=inventory({s:{c:True for c in checks} for s,checks in REQUIREMENTS.items()})
        self.assertTrue(all(v["reported_complete"] for v in result["standards"].values()))
        self.assertFalse(result["certified"])
        self.assertFalse(result["production_authorized"])
