import hashlib
import json
import math

class BuildCanvasRejected(RuntimeError):
    pass

def _validate_jsonable(value, seen=None):
    if seen is None:
        seen = set()
    if isinstance(value, (dict, list)):
        obj_id = id(value)
        if obj_id in seen:
            raise BuildCanvasRejected("CYCLE_REJECTED")
        seen.add(obj_id)
        iterable = value.values() if isinstance(value, dict) else value
        for item in iterable:
            _validate_jsonable(item, seen)
        seen.remove(obj_id)
    elif isinstance(value, float) and not math.isfinite(value):
        raise BuildCanvasRejected("NON_FINITE_NUMBER")
    elif value is not None and not isinstance(value, (str, int, bool, float)):
        raise BuildCanvasRejected(f"NON_JSON_TYPE_{type(value).__name__}")

def build_canvas(nodes, edges):
    if not isinstance(nodes, list) or not isinstance(edges, list):
        raise BuildCanvasRejected("NODES_AND_EDGES_MUST_BE_ARRAYS")
    payload = {"nodes": nodes, "edges": edges}
    _validate_jsonable(payload)
    text = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    data = text.encode("utf-8")
    return {"text": text, "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()}
