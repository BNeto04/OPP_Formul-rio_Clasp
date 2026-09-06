import json
import time
import os
import sys
import hashlib
import re
import threading
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler

LOG_FILE = os.path.join(os.path.dirname(__file__), "test_bridge_server.log")

def log_event(msg):
    ts = time.strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{ts}] {msg}"
    try:
        print(line, flush=True)
    except Exception:
        pass
    try:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(line + "\n")
    except Exception:
        pass

# Estado da Fila e Single-Flight
in_flight_packet = None
packet_queue = []
delivered_history = []
dedupe_keys_seen = set()
delivered_ack_keys = set()

last_outbound_packet = None
outbound_history = []

# Mecanismo de Wake Factual do Antigravity
wake_event = threading.Event()
pending_wake_packet = None
wake_lock = threading.Lock()

ALLOWED_OUTBOUND_TYPES = ["CALL", "MESSAGE", "AUDIT", "OWNER_DIRECTIVE", "CHATGPT_REPLY"]

def compute_dedupe_key(packet):
    payload = packet.get("payload", "")
    packet_id = packet.get("packet_id", "")
    h = hashlib.sha256(payload.strip().encode("utf-8")).hexdigest()[:16]
    return f"{packet_id}::{h}"

def compute_ack_key(payload):
    sprint_match = re.search(r"SPRINT_ID:\s*([^\r\n]+)", payload, re.IGNORECASE)
    reply_match = re.search(r"REPLY_TO_CALL_ID:\s*([^\r\n]+)", payload, re.IGNORECASE)
    sprint = sprint_match.group(1).strip() if sprint_match else "NO_SPRINT"
    reply = reply_match.group(1).strip() if reply_match else "NO_REPLY"
    return f"ACK::{sprint}::{reply}"

class BridgeHandler(BaseHTTPRequestHandler):
    def _send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Accept")

    def do_OPTIONS(self):
        self.send_response(200)
        self._send_cors_headers()
        self.end_headers()

    def do_GET(self):
        global in_flight_packet, packet_queue, delivered_history, last_outbound_packet, pending_wake_packet, wake_event

        if self.path == "/context_packet":
            packet_to_send = None
            if in_flight_packet is None and len(packet_queue) > 0:
                in_flight_packet = packet_queue.pop(0)
                in_flight_packet["dispatched"] = True
                packet_to_send = in_flight_packet
                log_event(f"[SINGLE_FLIGHT_DISPATCH] Alocado e despachado 1 item: {in_flight_packet['packet_id']} (Restam na fila: {len(packet_queue)})")

            if packet_to_send is not None:
                log_event(f"GET /context_packet -> Servindo 1x: {packet_to_send['packet_id']}")
                body = json.dumps(packet_to_send).encode("utf-8")
            else:
                # Se já tem item in-flight aguardando confirmação, NÃO re-serve para evitar duplicação!
                body = json.dumps({"packet_id": None, "payload": None, "in_flight": in_flight_packet["packet_id"] if in_flight_packet else None}).encode("utf-8")

            self.send_response(200)
            self._send_cors_headers()
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(body)

        elif self.path == "/status":
            current_packet_id = packet_queue[0]["packet_id"] if len(packet_queue) > 0 else (in_flight_packet["packet_id"] if in_flight_packet else None)
            is_delivered = (len(packet_queue) == 0 and in_flight_packet is None)
            body = json.dumps({
                "in_flight": in_flight_packet["packet_id"] if in_flight_packet else None,
                "queue_length": len(packet_queue),
                "delivered": is_delivered,
                "packet_id": current_packet_id,
                "delivered_count": len(delivered_history),
                "delivered_ack_count": len(delivered_ack_keys),
                "last_outbound": last_outbound_packet,
                "has_pending_wake": pending_wake_packet is not None
            }).encode("utf-8")
            self.send_response(200)
            self._send_cors_headers()
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(body)

        elif self.path == "/last_outbound":
            body = json.dumps({
                "last_outbound": last_outbound_packet,
                "count": len(outbound_history)
            }).encode("utf-8")
            self.send_response(200)
            self._send_cors_headers()
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(body)

        elif self.path.startswith("/wait_wake"):
            # Long-polling para o Antigravity Wake Listener
            # Se já há pacote pendente, retorna imediatamente
            timeout = 180
            m = re.search(r"timeout=(\d+)", self.path)
            if m:
                timeout = int(m.group(1))

            delivered_wake = None
            with wake_lock:
                if pending_wake_packet is not None:
                    delivered_wake = pending_wake_packet
                    pending_wake_packet = None
                    wake_event.clear()

            if delivered_wake is not None:
                log_event(f"[WAKE_DISPATCHED_IMMEDIATE] Wake entregue ao listener: {delivered_wake.get('call_id')}")
                body = json.dumps({
                    "status": "WAKE_TRIGGERED",
                    "packet": delivered_wake
                }).encode("utf-8")
                self.send_response(200)
                self._send_cors_headers()
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(body)
                return

            # Aguarda o evento de wake
            log_event(f"[WAKE_LISTENER_WAITING] Listener Antigravity aguardando wake (timeout={timeout}s)...")
            signaled = wake_event.wait(timeout=timeout)

            with wake_lock:
                if signaled and pending_wake_packet is not None:
                    delivered_wake = pending_wake_packet
                    pending_wake_packet = None
                    wake_event.clear()

            if delivered_wake is not None:
                log_event(f"[WAKE_DISPATCHED_LIVE] Wake LIVE despachado ao listener: {delivered_wake.get('call_id')}")
                body = json.dumps({
                    "status": "WAKE_TRIGGERED",
                    "packet": delivered_wake
                }).encode("utf-8")
            else:
                log_event(f"[WAKE_TIMEOUT] Listener encerrou ciclo sem wake.")
                body = json.dumps({
                    "status": "TIMEOUT",
                    "packet": None
                }).encode("utf-8")

            self.send_response(200)
            self._send_cors_headers()
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(body)

        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        global in_flight_packet, packet_queue, delivered_history, dedupe_keys_seen, delivered_ack_keys, last_outbound_packet, outbound_history, pending_wake_packet, wake_event

        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length).decode("utf-8") if content_length > 0 else ""

        if self.path == "/ack":
            try:
                data = json.loads(body)
            except Exception:
                data = {"raw": body}

            acked_packet_id = data.get("packet_id")
            log_event(f"[ACK] POST /ack RECEBIDO! Dados: {json.dumps(data)}")

            if in_flight_packet and (not acked_packet_id or in_flight_packet.get("packet_id") == acked_packet_id):
                payload = in_flight_packet.get("payload", "")
                if "[BRIDGE_AUTO_CONTINUE_V1]" in payload or "STATUS: ACK_" in payload:
                    ack_key = compute_ack_key(payload)
                    delivered_ack_keys.add(ack_key)
                    log_event(f"[ACK_DEDUPE_INDEXED] ACK registrado no histórico de dedupe: {ack_key}")

                delivered_history.append(in_flight_packet)
                log_event(f"[SINGLE_FLIGHT_CONFIRMED] Pacote {in_flight_packet['packet_id']} confirmado e finalizado. Liberando canal para próximo item.")
                in_flight_packet = None

            self.send_response(200)
            self._send_cors_headers()
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"status": "ACK_RECORDED", "success": True}).encode("utf-8"))

        elif self.path == "/reset":
            packet_queue.clear()
            in_flight_packet = None
            delivered_history.clear()
            delivered_ack_keys.clear()
            dedupe_keys_seen.clear()
            last_outbound_packet = None
            pending_wake_packet = None
            self.send_response(200)
            self._send_cors_headers()
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"status": "RESET_OK", "success": true}')

        elif self.path == "/queue":
            try:
                data = json.loads(body)
                packet_id = data.get("packet_id", f"PACKET_{int(time.time())}")
                payload = data.get("payload", "")

                packet_obj = {
                    "packet_id": packet_id,
                    "payload": payload
                }

                # 1. Deduplicação estrita de ACK por chave estável (SPRINT, REPLY_TO)
                if "STATUS: ANTIGRAVITY_WAKE_ACK" in payload or "STATUS: ACK_" in payload:
                    ack_key = compute_ack_key(payload)
                    if ack_key in delivered_ack_keys:
                        log_event(f"[ACK_ALREADY_DELIVERED] ACK duplicado descartado por chave {ack_key} -> DROP_NO_OP")
                        self.send_response(200)
                        self._send_cors_headers()
                        self.send_header("Content-Type", "application/json")
                        self.end_headers()
                        self.wfile.write(json.dumps({
                            "queued": False,
                            "status": "ACK_ALREADY_DELIVERED",
                            "action": "DROP_NO_OP",
                            "ack_key": ack_key
                        }).encode("utf-8"))
                        return
                    # Registra imediatamente para travar concorrência no mesmo voo
                    delivered_ack_keys.add(ack_key)

                dedupe_key = compute_dedupe_key(packet_obj)

                # 2. Deduplicação geral de pacotes
                if dedupe_key in dedupe_keys_seen:
                    log_event(f"[DEDUPE_NO_OP] Pacote duplicado detectado e descartado: {dedupe_key}")
                    self.send_response(200)
                    self._send_cors_headers()
                    self.send_header("Content-Type", "application/json")
                    self.end_headers()
                    self.wfile.write(json.dumps({
                        "queued": False,
                        "status": "DUPLICATE_NO_OP",
                        "dedupe_key": dedupe_key
                    }).encode("utf-8"))
                    return

                dedupe_keys_seen.add(dedupe_key)
                packet_queue.append(packet_obj)
                log_event(f"[QUEUE_APPEND] Pacote adicionado à fila: {packet_id} (Posição: {len(packet_queue)})")

                self.send_response(200)
                self._send_cors_headers()
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({
                    "queued": True,
                    "status": "QUEUED",
                    "packet_id": packet_id,
                    "queue_position": len(packet_queue)
                }).encode("utf-8"))
            except Exception as e:
                log_event(f"Erro em /queue: {str(e)}")
                self.send_response(500)
                self._send_cors_headers()
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": str(e)}).encode("utf-8"))

        elif self.path == "/reconcile":
            try:
                data = json.loads(body)
                action = data.get("action")
                if action == "CONFIRM_CURRENT" and in_flight_packet:
                    delivered_history.append(in_flight_packet)
                    log_event(f"[RECONCILE_CONFIRM] In-flight {in_flight_packet['packet_id']} reconciliado como entregue.")
                    in_flight_packet = None
                elif action == "RETRY_CURRENT":
                    log_event(f"[RECONCILE_RETRY] In-flight mantido para retry controlado.")

                self.send_response(200)
                self._send_cors_headers()
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"reconciled": True, "in_flight": in_flight_packet is not None}).encode("utf-8"))
            except Exception as e:
                self.send_response(500)
                self.end_headers()

        elif self.path == "/outbound_packet":
            try:
                data = json.loads(body)
                packet_id = data.get("packet_id")
                call_id = data.get("call_id")
                sprint_id = data.get("sprint_id")
                pkt_type = data.get("type", "").upper()
                payload = data.get("payload")

                if not call_id or not sprint_id or not pkt_type or not payload:
                    self.send_response(400)
                    self._send_cors_headers()
                    self.send_header("Content-Type", "application/json")
                    self.end_headers()
                    self.wfile.write(json.dumps({"success": False, "error": "MISSING_REQUIRED_FIELDS"}).encode("utf-8"))
                    return

                if pkt_type not in ALLOWED_OUTBOUND_TYPES:
                    self.send_response(400)
                    self._send_cors_headers()
                    self.send_header("Content-Type", "application/json")
                    self.end_headers()
                    self.wfile.write(json.dumps({"success": False, "error": f"TYPE_NOT_ALLOWED: {pkt_type}"}).encode("utf-8"))
                    return

                last_outbound_packet = data
                outbound_history.append(data)
                log_event(f"[OUTBOUND_RECEIVED] packet_id={packet_id}, call_id={call_id}, type={pkt_type}, sprint_id={sprint_id}")

                if pkt_type == "CHATGPT_REPLY":
                    log_event(f"[CHATGPT_REPLY_ACCEPTED] call_id={call_id}, reply_to_event_id={data.get('reply_to_event_id')}, reply_to_message_id={data.get('reply_to_message_id')}")

                # Sinaliza o listener do Antigravity para acordar
                with wake_lock:
                    pending_wake_packet = data
                    wake_event.set()
                log_event(f"[AUTOWAKE_TRIGGERED] Notificação de wake disparada para o Antigravity.")

                if call_id.startswith("CALL-E2E-"):
                    packet_queue.append({
                        "packet_id": f"INBOUND_REPLY_{call_id}",
                        "payload": f"[BRIDGE_AUTO_CONTINUE_V1]\nSPRINT_ID: {sprint_id}\nREPLY_TO_CALL_ID: {call_id}\nSTATUS: ANTIGRAVITY_PROCESSED_SUCCESS\nRESULT: Test E2E loop\n[/BRIDGE_AUTO_CONTINUE_V1]"
                    })

                # Resposta estrita: BRIDGE_RECEIVED (e não ANTIGRAVITY_WAKE_ACK)
                self.send_response(200)
                self._send_cors_headers()
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({
                    "status": "BRIDGE_RECEIVED",
                    "success": True,
                    "packet_id": packet_id,
                    "bridge_ack": True
                }).encode("utf-8"))
            except Exception as e:
                log_event(f"Erro em /outbound_packet: {str(e)}")
                self.send_response(500)
                self._send_cors_headers()
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": str(e)}).encode("utf-8"))

        elif self.path == "/log":
            log_event(f"[EXT_LOG] {body}")
            self.send_response(200)
            self._send_cors_headers()
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"ok":true}')
        else:
            self.send_response(404)
            self.end_headers()

def run(port=8765):
    server_address = ("127.0.0.1", port)
    httpd = ThreadingHTTPServer(server_address, BridgeHandler)
    log_event(f"Bridge V2 Resiliente iniciada com AutoWake e ACK Dedupe em http://127.0.0.1:{port}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    httpd.server_close()
    log_event("Bridge V2 encerrada.")

if __name__ == "__main__":
    port = 8765
    if len(sys.argv) > 1:
        port = int(sys.argv[1])
    run(port)
