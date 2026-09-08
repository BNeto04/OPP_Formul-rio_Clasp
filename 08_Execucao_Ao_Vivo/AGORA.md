# Execução ao Vivo: Agora

- **Data/Hora:** 2026-09-08
- **Programa:** #67 (`PROGRAM-AGENTIC-ROADMAP-001`)
- **Sprint Ativa:** #68 (`SPRINT-A01-MULTIPROVIDER-FALLBACKS-001`)
- **Card Ativo:** #73 (`T-A01-POLICY-005`) — Implementar política explícita de fallback, retry e idempotência.
- **Chamada:** `CALL-T-A01-POLICY-005-AUDIT-FIX-002`
- **Branch:** `sprint/a01-multi-provider-fallbacks-001`
- **Status:** Correção final do Card #73 concluída para refletir a decisão operacional do proprietário: exatamente dois provedores ativos nesta sprint (Primary Gemini `gemini-3.6-flash` -> Fallback 1 Groq `qwen/qwen3.6-27b`). OpenRouter e DeepSeek marcados formalmente como `DEFERRED`/`DISABLED`, completamente excluídos do caminho ativo, rota de retry/fallback, health operacional e limite de providers. Limites operacionais ajustados para `MAX_PROVIDERS_PER_EXECUTION = 2` e `GLOBAL_ATTEMPT_LIMIT = 4` (2 providers x 2 tentativas máx). Endpoint de healthcheck atualizado para reportar `ACTIVE_PRIMARY`, `ACTIVE_FALLBACK` e `DEFERRED`, e circuit breakers estritamente para Gemini e Groq. Baterias de teste atualizadas e 100% aprovadas (41 PASS em `test_fallback_policy.js` cobrindo cenários A-J incluindo prova de esgotamento da cadeia sem 3o provider, 9/9 em `smoke_local_router.js`, 100% em `test_worker_router_integration.js`). Zero chamadas externas em idle; zero secrets expostos. Pontes 1 e 2 intactas.
- **Suítes Testadas:** `node agentic/scripts/test_fallback_policy.js` (41 PASS, 0 FAIL, exit code 0); `node agentic/scripts/smoke_local_router.js` (9/9 PASS, exit code 0); `node agentic/scripts/test_worker_router_integration.js` (100% PASS, exit code 0).
- **Próximo Passo:** Commit e push seletivos na branch `sprint/a01-multi-provider-fallbacks-001`, envio do RESULT via Ponte 2 (porta 8767) e rearme do wake waiter.



