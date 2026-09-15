import argparse
import json
import sys
from pathlib import Path

from nano_machines.tool_gateway import execute_tool


def _load_envelope(path_arg):
    if path_arg == "-":
        raw = sys.stdin.read()
        source = "stdin"
    else:
        path = Path(path_arg)
        raw = path.read_text(encoding="utf-8")
        source = str(path)
    try:
        envelope = json.loads(raw)
    except json.JSONDecodeError as exc:
        return source, None, {
            "ok": False,
            "status": "REJECTED",
            "operation": "UNKNOWN",
            "caller": {"id": "UNKNOWN", "type": "UNKNOWN"},
            "dry_run": False,
            "changed": False,
            "diagnostics": [{"code": "INVALID_JSON", "message": str(exc)}],
            "evidence": {"source": source},
            "result": None,
        }
    return source, envelope, None


def main(argv=None):
    parser = argparse.ArgumentParser(description="Executa uma Nano Maquina via envelope JSON agent-first.")
    parser.add_argument("--envelope", default="-", help="Arquivo JSON do envelope ou '-' para stdin.")
    parser.add_argument("--pretty", action="store_true", help="Imprime JSON indentado.")
    args = parser.parse_args(argv)

    source, envelope, error_response = _load_envelope(args.envelope)
    response = error_response if error_response is not None else execute_tool(envelope)
    response.setdefault("evidence", {})["envelope_source"] = source
    print(json.dumps(response, ensure_ascii=False, indent=2 if args.pretty else None, sort_keys=True))
    return 0 if response.get("ok") else 2


if __name__ == "__main__":
    raise SystemExit(main())
