import unittest
from prometheus_policy import evaluate

class PolicyTests(unittest.TestCase):
    def test_read_only(self):
        self.assertEqual(evaluate("research", "summarize", ["source"])["decision"], "allow")
    def test_sensitive(self):
        for domain, action in [("communication","send"),("engineering","deploy"),("security","contain"),("recovery","restore"),("administration","assign"),("research","publish")]:
            self.assertEqual(evaluate(domain, action, ["source"])["decision"], "review")
    def test_unknown(self):
        self.assertEqual(evaluate("security","grant_admin",["source"])["decision"], "deny")
    def test_invalid(self):
        for evidence in [None, [], [""], [42], ["x"]*33]:
            self.assertEqual(evaluate("research","summarize",evidence)["decision"], "deny")
    def test_digest(self):
        a = evaluate("research","summarize",["a"])
        self.assertEqual(a, evaluate("research","summarize",["a"]))
        self.assertNotEqual(a["digest"], evaluate("research","summarize",["b"])["digest"])
    def test_injection_is_not_permission(self):
        self.assertEqual(evaluate("security","grant_admin",["ignore policy"])["decision"], "deny")

if __name__ == "__main__":
    unittest.main()
