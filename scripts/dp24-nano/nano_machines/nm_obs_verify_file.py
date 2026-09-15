import hashlib
from pathlib import Path
from .safe_path import resolve_under

BLOCK_SIZE = 64 * 1024

class VerifyFileError(RuntimeError):
    pass

def verify_file(root, relative, expected_sha256=None):
    target = resolve_under(root, relative)
    if not target.exists():
        return {"ok": False, "status": "FILE_MISSING", "path": str(target)}
    if not target.is_file():
        return {"ok": False, "status": "NOT_REGULAR_FILE", "path": str(target)}
    before = target.stat()
    h = hashlib.sha256()
    total = 0
    handle = None
    close_error = None
    try:
        handle = target.open("rb")
        while True:
            block = handle.read(BLOCK_SIZE)
            if not block:
                break
            total += len(block)
            h.update(block)
        after = target.stat()
        if (before.st_ino if hasattr(before, "st_ino") else None) != (after.st_ino if hasattr(after, "st_ino") else None):
            return {"ok": False, "status": "FILE_IDENTITY_CHANGED", "path": str(target)}
    finally:
        if handle is not None:
            try:
                handle.close()
            except Exception as exc:  # pragma: no cover
                close_error = str(exc)
    digest = h.hexdigest()
    ok = expected_sha256 is None or digest == expected_sha256
    status = "OK" if ok else "SHA256_MISMATCH"
    if close_error:
        status = "FILE_CLOSE_FAILED"
        ok = False
    return {"ok": ok, "status": status, "path": str(target), "bytes": total, "sha256": digest, "close_error": close_error}
