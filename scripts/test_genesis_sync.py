import unittest
from genesis_sync import reconcile

class SyncTests(unittest.TestCase):
    def setUp(self):
        self.event={"id":"00000000-0000-4000-8000-000000000001","activity":"urn:nabd:lesson:demo","verb":"started"}
    def test_replay(self):
        self.assertEqual(reconcile([self.event,self.event]),[self.event])
    def test_conflict(self):
        with self.assertRaises(ValueError):
            reconcile([self.event,dict(self.event,verb="completed")])
    def test_invalid(self):
        with self.assertRaises(ValueError):
            reconcile([dict(self.event,email="example@example.org")])
