"""NABD Guardian: transparent, read-only synthetic availability checks.

No fake students, browser clicks, database writes, or private credentials.
"""
from __future__ import annotations

import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

CONFIG_FILE = Path(__file__).resolve().parents[1] / "assets" / "js" / "config.js"
AGENT = "NABD-Guardian/1.0 (synthetic health monitor; NABD Academy)"


def read_public_config():
    """Read public client configuration; never access a service-role key."""
    source = CONFIG_FILE.read_text(encoding="utf-8")

    def get(name):
        match = re.search(r"\b" + re.escape(name) + r"\s*:\s*['\"]([^'\"]+)['\"]", source)
        if not match:
            raise ValueError(f"Missing public config: {name}")
        return match.group(1)

    return get("supabaseUrl"), get("supabaseAnonKey"), get("siteBaseUrl")


def request_status(url, headers):
    request = urllib.request.Request(
        url,
        headers={"User-Agent": AGENT, "Cache-Control": "no-cache", **headers},
    )
    with urllib.request.urlopen(request, timeout=15) as response:
        if response.status != 200:
            raise RuntimeError(f"Unhealthy HTTP status: {response.status}")
        return response.read(4096)


def check(name, url, headers, expected_json=False):
    last_error = None
    for attempt in range(2):
        try:
            body = request_status(url, headers)
            if expected_json and not isinstance(json.loads(body.decode("utf-8")), list):
                raise ValueError("Expected a JSON array from the public database endpoint")
            print(f"[OK] {name}: HTTP 200")
            return True
        except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError,
                ValueError, RuntimeError) as exc:
            last_error = exc
            if attempt == 0:
                time.sleep(2)
    # Intentionally don't log response bodies, sensitive headers, or student data.
    print(f"[FAIL] {name}: {type(last_error).__name__} (2 attempts)", file=sys.stderr)
    return False


def main():
    try:
        default_db, default_key, default_site = read_public_config()
        db_url = os.getenv("NABD_GUARDIAN_SUPABASE_URL", default_db).rstrip("/")
        public_key = os.getenv("NABD_GUARDIAN_PUBLISHABLE_KEY", default_key)
        site_url = os.getenv("NABD_GUARDIAN_SITE_URL", default_site)
        if not (db_url.startswith("https://") and site_url.startswith("https://")):
            raise ValueError("Monitoring endpoints must use HTTPS")
        if not public_key.startswith(("sb_publishable_", "eyJ")):
            raise ValueError("Monitoring must use a publishable or legacy anon key only")
    except (OSError, ValueError) as exc:
        print(f"[FAIL] configuration: {exc}", file=sys.stderr)
        return 2

    # This makes an actual, minimal database SELECT under the existing public RLS
    # policy for active courses. A 200 response with [] also counts as healthy.
    db_url = db_url + "/rest/v1/courses?select=id&limit=1"
    site_ok = check("Public website", site_url, {"Accept": "text/html"})
    db_ok = check("Supabase public course read", db_url,
                  {"apikey": public_key, "Accept": "application/json"}, expected_json=True)
    if site_ok and db_ok:
        print("NABD Guardian: healthy (synthetic checks, not genuine student visits).")
        return 0
    return 1


if __name__ == "__main__":
    sys.exit(main())
