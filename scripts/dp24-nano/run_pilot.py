import json
from pathlib import Path
from nano_machines.nm_obs_build_canvas import build_canvas
from nano_machines.nm_obs_parse_canvas import parse_canvas
from nano_machines.nm_obs_patch import patch_once
from nano_machines.nm_obs_read import read_file
from nano_machines.nm_obs_verify_file import verify_file
from nano_machines.nm_obs_write import write_file

ROOT = Path(__file__).resolve().parent
LAB = ROOT / "C99-LAB-FANTASMA"
LAB.mkdir(exist_ok=True)

nodes = [
    {"id": "terreno", "type": "text", "x": 0, "y": 0, "width": 360, "height": 120, "text": "TERRENO C99-LAB-FANTASMA"},
    {"id": "porta", "type": "text", "x": 460, "y": 0, "width": 260, "height": 120, "text": "PORTA PE-C99-02"},
]
edges = [{"id": "e1", "fromNode": "terreno", "fromSide": "right", "toNode": "porta", "toSide": "left"}]
built = build_canvas(nodes, edges)
write1 = write_file(LAB, "piloto.canvas", built["text"])
read1 = read_file(LAB, "piloto.canvas")
parsed = parse_canvas(read1["text"])
verified = verify_file(LAB, "piloto.canvas", built["sha256"])
patch = patch_once(LAB, "piloto.canvas", built["sha256"], "PORTA PE-C99-02", "PORTA PE-C99-02 VALIDADA")
read2 = read_file(LAB, "piloto.canvas")
parsed2 = parse_canvas(read2["text"])
verified2 = verify_file(LAB, "piloto.canvas", patch["sha256"])
report = {
    "lab": str(LAB),
    "build": built,
    "write_initial": write1,
    "read_initial_bytes": read1["bytes"],
    "parse_initial_ok": parsed["ok"],
    "verify_initial": verified,
    "patch": patch,
    "parse_after_patch_ok": parsed2["ok"],
    "verify_after_patch": verified2,
    "neighbor_files": sorted(p.name for p in LAB.iterdir()),
}
print(json.dumps(report, ensure_ascii=False, indent=2))
if not parsed["ok"] or not parsed2["ok"] or not verified["ok"] or not verified2["ok"]:
    raise SystemExit(1)
