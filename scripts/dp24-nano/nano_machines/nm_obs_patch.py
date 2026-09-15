import hashlib
from .nm_obs_write import write_file
from .nm_obs_read import read_file

class PatchRejected(RuntimeError):
    pass

def patch_once(root, relative, expected_sha256, anchor, replacement):
    current = read_file(root, relative)["text"]
    current_hash = hashlib.sha256(current.encode("utf-8")).hexdigest()
    if current_hash != expected_sha256:
        raise PatchRejected("PREIMAGE_HASH_MISMATCH")
    count = current.count(anchor)
    if count != 1:
        raise PatchRejected(f"ANCHOR_COUNT_{count}")
    updated = current.replace(anchor, replacement, 1)
    result = write_file(root, relative, updated)
    result["before_sha256"] = current_hash
    return result
