import unittest
from prometheus_checkpoint import seal, verify_checkpoint

class CheckpointTests(unittest.TestCase):
    def test_authenticity(self):
        key = b"a"*32
        head = "0"*64
        tag = seal(head,key)
        self.assertTrue(verify_checkpoint(head,key,tag))
        self.assertFalse(verify_checkpoint("1"*64,key,tag))
        self.assertFalse(verify_checkpoint(head,b"b"*32,tag))
        self.assertFalse(verify_checkpoint(head,b"short",tag))
        self.assertFalse(verify_checkpoint(head,key,"invalid"))
