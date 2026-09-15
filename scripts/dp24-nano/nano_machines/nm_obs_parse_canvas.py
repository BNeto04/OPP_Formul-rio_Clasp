import json

VALID_NODE_TYPES = {"text", "file", "link", "group"}
VALID_EDGE_SIDES = {"top", "right", "bottom", "left"}


def parse_canvas(text):
    diagnostics = []
    try:
        payload = json.loads(text)
    except json.JSONDecodeError as exc:
        return {"ok": False, "diagnostics": [{"code": "INVALID_JSON", "message": str(exc)}], "canvas": None}
    if not isinstance(payload, dict):
        diagnostics.append({"code": "ROOT_NOT_OBJECT"})
        return {"ok": False, "diagnostics": diagnostics, "canvas": payload}
    nodes = payload.get("nodes")
    edges = payload.get("edges")
    if not isinstance(nodes, list):
        diagnostics.append({"code": "NODES_NOT_ARRAY"})
        nodes = []
    if not isinstance(edges, list):
        diagnostics.append({"code": "EDGES_NOT_ARRAY"})
        edges = []
    ids = []
    seen = set()
    for index, node in enumerate(nodes):
        if not isinstance(node, dict):
            diagnostics.append({"code": "NODE_NOT_OBJECT", "index": index})
            continue
        node_id = node.get("id")
        if not node_id:
            diagnostics.append({"code": "NODE_ID_MISSING", "index": index})
        elif node_id in seen:
            diagnostics.append({"code": "DUPLICATE_NODE_ID", "id": node_id})
        else:
            seen.add(node_id)
            ids.append(node_id)
        if node.get("type") not in VALID_NODE_TYPES:
            diagnostics.append({"code": "INVALID_NODE_TYPE", "id": node_id, "type": node.get("type")})
    id_set = set(ids)
    for index, edge in enumerate(edges):
        if not isinstance(edge, dict):
            diagnostics.append({"code": "EDGE_NOT_OBJECT", "index": index})
            continue
        if edge.get("fromNode") not in id_set:
            diagnostics.append({"code": "ORPHAN_EDGE_FROM", "index": index, "fromNode": edge.get("fromNode")})
        if edge.get("toNode") not in id_set:
            diagnostics.append({"code": "ORPHAN_EDGE_TO", "index": index, "toNode": edge.get("toNode")})
        for side_key in ("fromSide", "toSide"):
            if side_key in edge and edge[side_key] not in VALID_EDGE_SIDES:
                diagnostics.append({"code": "INVALID_EDGE_SIDE", "index": index, "field": side_key, "value": edge[side_key]})
    return {"ok": not diagnostics, "diagnostics": sorted(diagnostics, key=lambda d: (d.get("code", ""), str(d))), "canvas": payload}
