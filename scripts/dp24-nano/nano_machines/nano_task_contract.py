ALLOWED_TOOLS = {
    "NM-OBS-READ",
    "NM-OBS-WRITE",
    "NM-OBS-PATCH",
    "NM-OBS-PARSE-CANVAS",
    "NM-OBS-BUILD-CANVAS",
    "NM-OBS-VERIFY-FILE",
}
REQUIRED_BLOCKS = [
    "identity",
    "gps",
    "input",
    "operation",
    "contract",
    "authority",
    "transition",
    "evidence",
    "stop",
]


class NanoTaskRejected(RuntimeError):
    pass


def validate_nano_task(task):
    if not isinstance(task, dict):
        raise NanoTaskRejected("NANO_TASK_MUST_BE_OBJECT")
    missing = [name for name in REQUIRED_BLOCKS if name not in task]
    if missing:
        raise NanoTaskRejected("MISSING_BLOCKS:" + ",".join(missing))
    extra = [name for name in task if name not in REQUIRED_BLOCKS]
    if extra:
        raise NanoTaskRejected("EXTRA_BLOCKS:" + ",".join(extra))
    operation = task.get("operation")
    if not isinstance(operation, dict):
        raise NanoTaskRejected("OPERATION_MUST_BE_OBJECT")
    if "capability" in operation:
        raise NanoTaskRejected("OPERATION_CAPABILITY_IS_ONTOLOGY_DRIFT")
    tool = operation.get("tool")
    if tool not in ALLOWED_TOOLS:
        raise NanoTaskRejected("UNKNOWN_TOOL")
    max_calls = operation.get("max_calls")
    if not isinstance(max_calls, int) or max_calls < 1:
        raise NanoTaskRejected("MAX_CALLS_INVALID")
    authority = task.get("authority")
    if not isinstance(authority, dict):
        raise NanoTaskRejected("AUTHORITY_MUST_BE_OBJECT")
    if authority.get("expand_scope") is not False:
        raise NanoTaskRejected("EXPAND_SCOPE_MUST_BE_FALSE")
    return {"ok": True, "blocks": list(REQUIRED_BLOCKS), "tool": tool, "max_calls": max_calls}
