import tempfile
import unittest
from pathlib import Path
from genesis_store import persist

class StoreTests(unittest.TestCase):
    def test_persistence_and_rollback(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory)/"events.sqlite"
            a = {"id":"00000000-0000-4000-8000-000000000002","activity":"urn:nabd:lesson:demo","verb":"started"}
            b = dict(a,id="00000000-0000-4000-8000-000000000001")
            self.assertEqual(persist(path,[a])["inserted"],1)
            self.assertEqual(persist(path,[a])["duplicates"],1)
            with self.assertRaises(ValueError):
                persist(path,[b,dict(a,verb="completed")])
            self.assertEqual(persist(path,[b])["inserted"],1)
