from .safe_path import resolve_under

class ReadLimitExceeded(RuntimeError):
    pass

def read_file(root, relative, max_bytes=262144):
    target = resolve_under(root, relative)
    if not target.is_file():
        raise FileNotFoundError(str(target))
    with target.open("rb") as fh:
        data = fh.read(max_bytes + 1)
    if len(data) > max_bytes:
        raise ReadLimitExceeded("READ_LIMIT_EXCEEDED")
    text = data.decode("utf-8", errors="strict")
    return {"path": str(target), "bytes": len(data), "text": text}
