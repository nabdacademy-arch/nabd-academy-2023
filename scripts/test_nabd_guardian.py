"""Offline regression tests: no network or production writes."""
import unittest
from unittest.mock import patch
import urllib.error
import nabd_guardian as guardian


class GuardianTests(unittest.TestCase):
    @patch.object(guardian, "request_status", return_value=b"[]")
    def test_empty_public_courses_is_healthy(self, request):
        self.assertTrue(guardian.check("database", "https://example.invalid", {}, True))
        self.assertEqual(request.call_count, 1)

    @patch.object(guardian.time, "sleep")
    @patch.object(guardian, "request_status", return_value=b'{"error":"invalid"}')
    def test_wrong_json_shape_fails(self, request, sleep):
        self.assertFalse(guardian.check("database", "https://example.invalid", {}, True))
        self.assertEqual(request.call_count, 2)
        sleep.assert_called_once_with(2)

    @patch.object(guardian.time, "sleep")
    @patch.object(guardian, "request_status", side_effect=[TimeoutError(), b"[]"])
    def test_transient_failure_recovers(self, request, sleep):
        self.assertTrue(guardian.check("database", "https://example.invalid", {}, True))
        self.assertEqual(request.call_count, 2)

    @patch.object(guardian.time, "sleep")
    @patch.object(guardian, "request_status", side_effect=urllib.error.URLError("offline"))
    def test_persistent_failure_is_bounded(self, request, sleep):
        self.assertFalse(guardian.check("site", "https://example.invalid", {}))
        self.assertEqual(request.call_count, 2)


if __name__ == "__main__":
    unittest.main()
