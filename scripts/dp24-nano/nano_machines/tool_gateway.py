import hashlib
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict

from .nm_obs_build_canvas import build_canvas
from .nm_obs_parse_canvas import parse_canvas
from .nm_obs_patch import patch_once
from .nm_obs_read import read_file
from .nm_obs_verify_file import verify_file
from .nm_obs_write import write_file
from .safe_path import resolve_under

ALLOWED_CALLER_TYPES = {"agente_local", "agente_global", "sistema_api"}
READ_OPS = {"READ", "VERIFY_FILE", "PARSE_CANVAS", "BUILD_CANVAS"}
WRITE_OPS = {"WRITE", "PATCH"}
ALL_OPS = READ_OPS | WRITE_OPS


class ToolGatewayRejected(RuntimeError):
    pass


@dataclass(frozen=True)
class GatewayContext:
    caller_id: str
    caller_type: str
    operation: str
    dry_run: bool


def _require_string(envelope: Dict[str, Any], key: str) -> str:
    value = envelope.get(key)
    if not isinstance(value, str) or not value.strip():
        raise ToolGatewayRejected(f"{key.upper()}_REQUIRED")
    return value


def _context(envelope: Dict[str, Any]) -> GatewayContext:
    caller_id = _require_string(envelope, "caller_id")
    caller_type = _require_string(envelope, "caller_type")
    if caller_type not in ALLOWED_CALLER_TYPES:
        raise ToolGatewayRejected("CALLER_TYPE_REJECTED")
    operation = _require_string(envelope, "operation").upper()
    if operation not in ALL_OPS:
        raise ToolGatewayRejected("OPERATION_REJECTED")
    return GatewayContext(
        caller_id=caller_id,
        caller_type=caller_type,
        operation=operation,
        dry_run=bool(envelope.get("dry_run", False)),
    )


def _root_and_target(envelope: Dict[str, Any]):
    root = Path(_require_string(envelope, "root"))
    if not root.exists() or not root.is_dir():
        raise ToolGatewayRejected("ROOT_NOT_DIRECTORY")
    target = _require_string(envelope, "target")
    resolved = resolve_under(root, target)
    return root, target, resolved


def _base_response(ctx: GatewayContext) -> Dict[str, Any]:
    return {
        "ok": False,
        "status": "ERROR",
        "operation": ctx.operation,
        "caller": {"id": ctx.caller_id, "type": ctx.caller_type},
        "dry_run": ctx.dry_run,
        "changed": False,
        "diagnostics": [],
        "evidence": {},
        "result": None,
    }


def execute_tool(envelope: Dict[str, Any]) -> Dict[str, Any]:
    """Execute one Nano Machine through a stable agent-first envelope."""
    try:
        ctx = _context(envelope)
    except Exception as exc:
        operation = str(envelope.get("operation", "UNKNOWN")).upper() if isinstance(envelope, dict) else "UNKNOWN"
        caller_id = str(envelope.get("caller_id", "UNKNOWN")) if isinstance(envelope, dict) else "UNKNOWN"
        caller_type = str(envelope.get("caller_type", "UNKNOWN")) if isinstance(envelope, dict) else "UNKNOWN"
        return {
            "ok": False,
            "status": "REJECTED" if isinstance(exc, ToolGatewayRejected) else "ERROR",
            "operation": operation,
            "caller": {"id": caller_id, "type": caller_type},
            "dry_run": bool(envelope.get("dry_run", False)) if isinstance(envelope, dict) else False,
            "changed": False,
            "diagnostics": [{"code": exc.__class__.__name__, "message": str(exc)}],
            "evidence": {},
            "result": None,
        }
    response = _base_response(ctx)
    try:
        payload = envelope.get("payload") or {}
        if not isinstance(payload, dict):
            raise ToolGatewayRejected("PAYLOAD_MUST_BE_OBJECT")

        if ctx.operation == "BUILD_CANVAS":
            result = build_canvas(payload.get("nodes", []), payload.get("edges", []))
            response.update(ok=True, status="OK", result=result)
            response["evidence"] = {"bytes": result["bytes"], "sha256": result["sha256"]}
            return response

        root, target, resolved = _root_and_target(envelope)
        response["evidence"].update({"root": str(root.resolve()), "target": target, "resolved": str(resolved)})

        if ctx.operation == "READ":
            max_bytes = int(payload.get("max_bytes", 262144))
            result = read_file(root, target, max_bytes=max_bytes)
            response.update(ok=True, status="OK", result=result)
            response["evidence"].update({"bytes": result["bytes"]})
            return response

        if ctx.operation == "VERIFY_FILE":
            result = verify_file(root, target, payload.get("expected_sha256"))
            response.update(ok=bool(result.get("ok")), status=result.get("status", "ERROR"), result=result)
            response["evidence"].update({"bytes": result.get("bytes"), "sha256": result.get("sha256")})
            return response

        if ctx.operation == "PARSE_CANVAS":
            read = read_file(root, target, max_bytes=int(payload.get("max_bytes", 262144)))
            result = parse_canvas(read["text"])
            response.update(ok=bool(result["ok"]), status="OK" if result["ok"] else "CANVAS_INVALID", result=result)
            response["evidence"].update({"bytes": read["bytes"], "diagnostics_count": len(result["diagnostics"])})
            return response

        if ctx.operation == "WRITE":
            text = payload.get("text")
            if not isinstance(text, str):
                raise ToolGatewayRejected("PAYLOAD_TEXT_REQUIRED")
            digest = hashlib.sha256(text.encode("utf-8")).hexdigest()
            if ctx.dry_run:
                existing_same = resolved.exists() and resolved.is_file() and resolved.read_bytes() == text.encode("utf-8")
                response.update(ok=True, status="DRY_RUN", changed=not existing_same, result={"would_change": not existing_same, "sha256": digest, "bytes": len(text.encode("utf-8"))})
                response["evidence"].update({"sha256_after": digest})
                return response
            result = write_file(root, target, text)
            response.update(ok=True, status="OK", changed=bool(result["changed"]), result=result)
            response["evidence"].update({"sha256_after": result["sha256"], "bytes": result["bytes"]})
            return response

        if ctx.operation == "PATCH":
            expected_sha256 = _require_string(payload, "expected_sha256")
            anchor = _require_string(payload, "anchor")
            replacement = _require_string(payload, "replacement")
            current = read_file(root, target)["text"]
            if ctx.dry_run:
                current_hash = hashlib.sha256(current.encode("utf-8")).hexdigest()
                if current_hash != expected_sha256:
                    raise ToolGatewayRejected("PREIMAGE_HASH_MISMATCH")
                count = current.count(anchor)
                if count != 1:
                    raise ToolGatewayRejected(f"ANCHOR_COUNT_{count}")
                updated = current.replace(anchor, replacement, 1)
                digest = hashlib.sha256(updated.encode("utf-8")).hexdigest()
                response.update(ok=True, status="DRY_RUN", changed=True, result={"would_change": True, "sha256": digest, "bytes": len(updated.encode("utf-8"))})
                response["evidence"].update({"sha256_before": current_hash, "sha256_after": digest})
                return response
            result = patch_once(root, target, expected_sha256, anchor, replacement)
            response.update(ok=True, status="OK", changed=bool(result["changed"]), result=result)
            response["evidence"].update({"sha256_before": result["before_sha256"], "sha256_after": result["sha256"], "bytes": result["bytes"]})
            return response

        raise ToolGatewayRejected("UNREACHABLE_OPERATION")
    except Exception as exc:
        response["diagnostics"].append({"code": exc.__class__.__name__, "message": str(exc)})
        response["status"] = "REJECTED" if isinstance(exc, ToolGatewayRejected) else "ERROR"
        return response

