"""Operator entry point; no action execution or production writes."""
import argparse
import json
from prometheus_report import report
from prometheus_lab import benchmark
from prometheus_guardian_adapter import monitor

def main(argv=None):
    parser = argparse.ArgumentParser(description="NABD PROMETHEUS operator diagnostics")
    parser.add_argument("command", choices=("report", "benchmark", "guardian"))
    parser.add_argument("--live", action="store_true", help="Explicitly permit read-only Guardian network checks")
    args = parser.parse_args(argv)
    if args.command == "guardian" and not args.live:
        parser.error("guardian requires --live")
    result = {"report": report, "benchmark": benchmark, "guardian": monitor}[args.command]()
    print(json.dumps(result, ensure_ascii=False, indent=2))
    if args.command == "benchmark":
        return int(bool(result["failed"]))
    if args.command == "guardian":
        return {"healthy": 0, "degraded": 1, "unknown": 2}[result["status"]]
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
