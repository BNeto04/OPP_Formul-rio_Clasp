import hashlib
import os
import tempfile
from .safe_path import resolve_under

class WriteRejected(RuntimeError):
    pass

def write_file(root, relative, text):
    target = resolve_under(root, relative)
    if not target.parent.exists():
        raise WriteRejected("PARENT_DIRECTORY_MISSING")
    payload = text.encode("utf-8", errors="strict")
    digest = hashlib.sha256(payload).hexdigest()
    if target.exists() and target.read_bytes() == payload:
        return {"changed": False, "path": str(target), "bytes": len(payload), "sha256": digest}
    fd, tmp_name = tempfile.mkstemp(prefix=target.name + ".", suffix=".tmp", dir=str(target.parent))
    try:
        with os.fdopen(fd, "wb") as tmp:
            tmp.write(payload)
            tmp.flush()
            os.fsync(tmp.fileno())
        os.replace(tmp_name, target)
    finally:
        if os.path.exists(tmp_name):
            os.unlink(tmp_name)
    return {"changed": True, "path": str(target), "bytes": len(payload), "sha256": digest}
