"""Pure reconciliation for synthetic learning events; no production writes."""
import hashlib
import json
import uuid

def reconcile(events):
    if not isinstance(events,list) or len(events)>1000:
        raise ValueError("invalid batch")
    seen={}
    for event in events:
        if not isinstance(event,dict) or set(event)!={"id","activity","verb"}:
            raise ValueError("invalid event")
        if not all(isinstance(v,str) for v in event.values()):
            raise ValueError("invalid fields")
        if str(uuid.UUID(event["id"]))!=event["id"]:
            raise ValueError("invalid event id")
        if event["verb"] not in {"started","completed","reviewed"}:
            raise ValueError("invalid verb")
        if not event["activity"].startswith("urn:nabd:lesson:") or len(event["activity"])>160:
            raise ValueError("invalid activity")
        digest=hashlib.sha256(json.dumps(event,sort_keys=True).encode()).hexdigest()
        if event["id"] in seen and seen[event["id"]][0]!=digest:
            raise ValueError("conflicting replay")
        seen[event["id"]]=(digest,dict(event))
    return [seen[k][1] for k in sorted(seen)]
