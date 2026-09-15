import hashlib
import shutil
import tempfile
import unittest
from pathlib import Path

from nano_machines.tool_gateway import execute_tool


class ToolGatewayTestCase(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp(prefix="dp24-gateway-test-"))

    def tearDown(self):
        shutil.rmtree(self.tmp, ignore_errors=True)

    def envelope(self, caller_type, operation, target="arquivo.md", payload=None, dry_run=False):
        return {
            "caller_id": "teste",
            "caller_type": caller_type,
            "operation": operation,
            "root": str(self.tmp),
            "target": target,
            "payload": payload or {},
            "dry_run": dry_run,
        }

    def test_accepts_three_future_callers(self):
        for caller_type in ["agente_local", "agente_global", "sistema_api"]:
            response = execute_tool(self.envelope(caller_type, "WRITE", payload={"text": caller_type}))
            self.assertTrue(response["ok"])
            self.assertEqual(response["caller"]["type"], caller_type)

    def test_rejects_unknown_caller_and_operation(self):
        self.assertFalse(execute_tool(self.envelope("humano_solto", "WRITE", payload={"text": "x"}))["ok"])
        self.assertFalse(execute_tool(self.envelope("agente_local", "DELETE", payload={}))["ok"])

    def test_dry_run_write_does_not_create_file(self):
        response = execute_tool(self.envelope("agente_global", "WRITE", payload={"text": "novo"}, dry_run=True))
        self.assertTrue(response["ok"])
        self.assertEqual(response["status"], "DRY_RUN")
        self.assertTrue(response["changed"])
        self.assertFalse((self.tmp / "arquivo.md").exists())

    def test_write_read_verify_pipeline_through_gateway(self):
        written = execute_tool(self.envelope("sistema_api", "WRITE", payload={"text": "abc"}))
        self.assertTrue(written["ok"])
        digest = hashlib.sha256(b"abc").hexdigest()
        read = execute_tool(self.envelope("agente_local", "READ"))
        verify = execute_tool(self.envelope("agente_global", "VERIFY_FILE", payload={"expected_sha256": digest}))
        self.assertEqual(read["result"]["text"], "abc")
        self.assertTrue(verify["ok"])
        self.assertEqual(verify["status"], "OK")

    def test_build_parse_patch_canvas_through_gateway(self):
        build = execute_tool({
            "caller_id": "teste",
            "caller_type": "agente_local",
            "operation": "BUILD_CANVAS",
            "payload": {
                "nodes": [
                    {"id": "a", "type": "text", "x": 0, "y": 0, "width": 200, "height": 80, "text": "A"},
                    {"id": "b", "type": "text", "x": 260, "y": 0, "width": 200, "height": 80, "text": "B"},
                ],
                "edges": [{"id": "e", "fromNode": "a", "fromSide": "right", "toNode": "b", "toSide": "left"}],
            },
        })
        self.assertTrue(build["ok"])
        write = execute_tool(self.envelope("sistema_api", "WRITE", target="fluxo.canvas", payload={"text": build["result"]["text"]}))
        self.assertTrue(write["ok"])
        parsed = execute_tool(self.envelope("agente_global", "PARSE_CANVAS", target="fluxo.canvas"))
        self.assertTrue(parsed["ok"])
        patch = execute_tool(self.envelope("agente_local", "PATCH", target="fluxo.canvas", payload={
            "expected_sha256": build["result"]["sha256"],
            "anchor": "\"text\":\"A\"",
            "replacement": "\"text\":\"A VALIDADO\"",
        }))
        self.assertTrue(patch["ok"])
        parsed2 = execute_tool(self.envelope("agente_global", "PARSE_CANVAS", target="fluxo.canvas"))
        self.assertTrue(parsed2["ok"])


if __name__ == "__main__":
    unittest.main()
