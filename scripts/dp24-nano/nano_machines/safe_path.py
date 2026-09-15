from pathlib import Path

class PathSecurityError(ValueError):
    pass

def resolve_under(root, relative):
    if not isinstance(relative, str) or not relative.strip():
        raise PathSecurityError("EMPTY_RELATIVE_PATH")
    candidate_raw = Path(relative)
    if candidate_raw.is_absolute():
        raise PathSecurityError("ABSOLUTE_PATH_REJECTED")
    if any(part in ("..", "") for part in candidate_raw.parts):
        raise PathSecurityError("TRAVERSAL_REJECTED")
    base = Path(root).resolve(strict=True)
    candidate = (base / candidate_raw).resolve(strict=False)
    try:
        candidate.relative_to(base)
    except ValueError as exc:
        raise PathSecurityError("OUTSIDE_ROOT_REJECTED") from exc
    for parent in [candidate.parent, *candidate.parents]:
        if parent == base.parent:
            break
        if parent.exists() and parent.is_symlink():
            raise PathSecurityError("SYMLINK_PARENT_REJECTED")
    if candidate.exists() and candidate.is_symlink():
        raise PathSecurityError("SYMLINK_TARGET_REJECTED")
    return candidate
