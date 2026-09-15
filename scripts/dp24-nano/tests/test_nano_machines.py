import hashlib
import json
import shutil
import tempfile
import unittest
from pathlib import Path

from nano_machines.nm_obs_build_canvas import BuildCanvasRejected, build_canvas
from nano_machines.nm_obs_parse_canvas import parse_canvas
from nano_machines.nm_obs_patch import PatchRejected, patch_once
from nano_machines.nm_obs_read import ReadLimitExceeded, read_file
from nano_machines.nm_obs_verify_file import verify_file
from nano_machines.nm_obs_write import WriteRejected, write_file
from nano_machines.safe_path import PathSecurityError, resolve_under


class NanoMachineTestCase(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp(prefix="dp24-nm-test-"))

    def tearDown(self):
        shutil.rmtree(self.tmp, ignore_errors=True)

    def test_resolve_under_rejects_absolute_and_traversal(self):
        with self.assertRaises(PathSecurityError):
            resolve_under(self.tmp, "../fora.md")
        with self.assertRaises(PathSecurityError):
            resolve_under(self.tmp, str(self.tmp / "abs.md"))

    def test_write_file_is_atomic_idempotent_and_requires_existing_parent(self):
        first = write_file(self.tmp, "a.md", "texto")
        second = write_file(self.tmp, "a.md", "texto")
        self.assertTrue(first["changed"])
        self.assertFalse(second["changed"])
        self.assertEqual(first["sha256"], second["sha256"])
        with self.assertRaises(WriteRejected):
            write_file(self.tmp, "sub/sem_pasta.md", "x")

    def test_read_file_enforces_utf8_and_byte_limit(self):
        (self.tmp / "ok.md").write_text("abc", encoding="utf-8")
        self.assertEqual(read_file(self.tmp, "ok.md", max_bytes=3)["text"], "abc")
        with self.assertRaises(ReadLimitExceeded):
            read_file(self.tmp, "ok.md", max_bytes=2)
        (self.tmp / "bad.bin").write_bytes(b"\xff\xfe")
        with self.assertRaises(UnicodeDecodeError):
            read_file(self.tmp, "bad.bin")

    def test_parse_canvas_detects_duplicate_and_orphan_edges(self):
        canvas = {
            "nodes": [
                {"id": "n1", "type": "text"},
                {"id": "n1", "type": "text"},
            ],
            "edges": [
                {"id": "e1", "fromNode": "n1", "toNode": "n2", "fromSide": "right", "toSide": "left"}
            ],
        }
        result = parse_canvas(json.dumps(canvas))
        codes = {d["code"] for d in result["diagnostics"]}
        self.assertFalse(result["ok"])
        self.assertIn("DUPLICATE_NODE_ID", codes)
        self.assertIn("ORPHAN_EDGE_TO", codes)

    def test_build_canvas_rejects_cycles_and_nonfinite_numbers(self):
        cyclic = []
        cyclic.append(cyclic)
        with self.assertRaises(BuildCanvasRejected):
            build_canvas(cyclic, [])
        with self.assertRaises(BuildCanvasRejected):
            build_canvas([{"id": "n", "type": "text", "x": float("inf")}], [])

    def test_build_write_read_parse_verify_patch_verify_pipeline(self):
        nodes = [
            {"id": "terreno", "type": "text", "x": 0, "y": 0, "width": 300, "height": 90, "text": "TERRENO C99"},
            {"id": "porta", "type": "text", "x": 360, "y": 0, "width": 200, "height": 90, "text": "PORTA PE-C99-02"},
        ]
        edges = [{"id": "e1", "fromNode": "terreno", "fromSide": "right", "toNode": "porta", "toSide": "left"}]
        built = build_canvas(nodes, edges)
        write = write_file(self.tmp, "piloto.canvas", built["text"])
        self.assertEqual(write["sha256"], built["sha256"])
        self.assertTrue(parse_canvas(read_file(self.tmp, "piloto.canvas")["text"])["ok"])
        self.assertEqual(verify_file(self.tmp, "piloto.canvas", built["sha256"])["status"], "OK")
        patched = patch_once(self.tmp, "piloto.canvas", built["sha256"], "PORTA PE-C99-02", "PORTA PE-C99-02 VALIDADA")
        self.assertEqual(verify_file(self.tmp, "piloto.canvas", patched["sha256"])["status"], "OK")
        with self.assertRaises(PatchRejected):
            patch_once(self.tmp, "piloto.canvas", built["sha256"], "PORTA", "X")

    def test_verify_file_reports_missing_and_hash_mismatch(self):
        self.assertEqual(verify_file(self.tmp, "ausente.md")["status"], "FILE_MISSING")
        (self.tmp / "a.md").write_text("abc", encoding="utf-8")
        wrong = hashlib.sha256(b"xyz").hexdigest()
        result = verify_file(self.tmp, "a.md", wrong)
        self.assertFalse(result["ok"])
        self.assertEqual(result["status"], "SHA256_MISMATCH")


if __name__ == "__main__":
    unittest.main()
