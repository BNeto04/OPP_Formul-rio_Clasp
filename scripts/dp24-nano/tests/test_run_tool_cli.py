import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RUN_TOOL = ROOT / "run_tool.py"


class RunToolCliTestCase(unittest.TestCase):
    def setUp(self):
        self.tmpdir = tempfile.TemporaryDirectory(prefix="dp24-run-tool-")
        self.root = Path(self.tmpdir.name)

    def tearDown(self):
        self.tmpdir.cleanup()

    def run_cli(self, envelope):
        proc = subprocess.run(
            [sys.executable, str(RUN_TOOL), "--envelope", "-"],
            input=json.dumps(envelope),
            text=True,
            capture_output=True,
            cwd=str(ROOT),
        )
        payload = json.loads(proc.stdout)
        return proc, payload

    def base(self, operation, caller_type="agente_local", target="a.md", payload=None, dry_run=False):
        return {
            "caller_id": "cli-test",
            "caller_type": caller_type,
            "operation": operation,
            "root": str(self.root),
            "target": target,
            "payload": payload or {},
            "dry_run": dry_run,
        }

    def test_cli_write_read_for_agent_local(self):
        proc, response = self.run_cli(self.base("WRITE", payload={"text": "ola"}))
        self.assertEqual(proc.returncode, 0)
        self.assertTrue(response["ok"])
        proc, response = self.run_cli(self.base("READ"))
        self.assertEqual(proc.returncode, 0)
        self.assertEqual(response["result"]["text"], "ola")

    def test_cli_rejected_envelope_returns_code_2(self):
        proc, response = self.run_cli({"caller_id": "x", "caller_type": "humano", "operation": "READ"})
        self.assertEqual(proc.returncode, 2)
        self.assertFalse(response["ok"])
        self.assertEqual(response["status"], "REJECTED")

    def test_cli_dry_run_from_global_agent_does_not_write(self):
        proc, response = self.run_cli(self.base("WRITE", caller_type="agente_global", payload={"text": "x"}, dry_run=True))
        self.assertEqual(proc.returncode, 0)
        self.assertEqual(response["status"], "DRY_RUN")
        self.assertFalse((self.root / "a.md").exists())

    def test_cli_invalid_json_returns_structured_error(self):
        proc = subprocess.run(
            [sys.executable, str(RUN_TOOL), "--envelope", "-"],
            input="{",
            text=True,
            capture_output=True,
            cwd=str(ROOT),
        )
        response = json.loads(proc.stdout)
        self.assertEqual(proc.returncode, 2)
        self.assertEqual(response["diagnostics"][0]["code"], "INVALID_JSON")


if __name__ == "__main__":
    unittest.main()
