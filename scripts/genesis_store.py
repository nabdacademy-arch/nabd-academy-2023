"""Local educational event store; no production database access."""
import sqlite3
import json
from genesis_sync import reconcile

def persist(path, events):
    validated = reconcile(events)
    db = sqlite3.connect(path, timeout=5)
    try:
        with db:
            db.execute("CREATE TABLE IF NOT EXISTS events (id TEXT PRIMARY KEY, payload TEXT NOT NULL)")
            db.execute("BEGIN IMMEDIATE")
            inserted = 0
            for event in validated:
                payload = json.dumps(event, sort_keys=True, separators=(",", ":"))
                row = db.execute("SELECT payload FROM events WHERE id=?", (event["id"],)).fetchone()
                if row:
                    if row[0] != payload:
                        raise ValueError("conflicting persistent replay")
                else:
                    db.execute("INSERT INTO events VALUES (?,?)", (event["id"], payload))
                    inserted += 1
            return {"inserted": inserted, "duplicates": len(validated)-inserted}
    finally:
        db.close()
