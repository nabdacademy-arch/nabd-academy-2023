import unittest
from genesis_fhir import example_bundle

class FHIRExampleTests(unittest.TestCase):
    def test_reference(self):
        patient, observation = [e["resource"] for e in example_bundle()["entry"]]
        self.assertEqual(observation["subject"]["reference"], "Patient/"+patient["id"])
        self.assertEqual(observation["valueQuantity"]["code"], "/min")
    def test_no_identity(self):
        patient = example_bundle()["entry"][0]["resource"]
        self.assertFalse(set(patient) & {"name","identifier","address","telecom","birthDate"})
