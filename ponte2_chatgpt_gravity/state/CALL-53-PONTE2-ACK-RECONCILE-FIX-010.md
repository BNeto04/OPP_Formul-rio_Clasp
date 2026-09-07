CALL_ID: CALL-53-PONTE2-ACK-RECONCILE-FIX-010
STATUS: AUTHORIZED

Mudanca necessaria no arquivo ponte2_chatgpt_gravity/server/ponte2_daemon.js:

1. Remover o requeue automatico de CALL e RESULT apos 15s sem ACK.
2. Timeout sem ACK deve virar SEND_UNCERTAIN.
3. Antes de qualquer retry, reconciliar por CALL_ID.
4. CALL ou RESULT ja confirmados devem virar DEDUPE_NO_OP.
5. Persistir estado suficiente para sobreviver a restart.
6. Adicionar testes para timeout sem reenvio e dedupe de CALL e RESULT.
7. Nao tocar na Ponte 1.
8. Continuar sem aguardar nova autorizacao.

STOP_STATE: READY_FOR_CHATGPT_AUDIT_ACK_RECONCILE_FIX
