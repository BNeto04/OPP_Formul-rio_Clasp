# Execução ao Vivo: Agora

- **Data/Hora:** 2026-09-08
- **Programa:** #67 (`PROGRAM-AGENTIC-ROADMAP-001`)
- **Sprint Ativa:** #68 (`SPRINT-A01-MULTIPROVIDER-FALLBACKS-001`)
- **Card Ativo:** #70 (`T-A01-PROVIDERS-002` / `CALL-T-A01-PROVIDERS-002-AUDIT-FIX-001`) — Configurar perfis de provedores sem expor secrets.
- **Chamada:** `CALL-T-A01-PROVIDERS-002-AUDIT-FIX-001`
- **Branch:** `sprint/a01-multi-provider-fallbacks-001`
- **Status:** Correção de auditoria aplicada aos perfis de provedores (setembro/2026). Modelos obsoletos removidos de `models_supported` e arquivados em `deprecated_models`: Gemini atualizado para `gemini-3.6-flash`, Groq atualizado para `qwen/qwen3.6-27b` (com `openai/gpt-oss-120b` como alternativa), DeepSeek atualizado para `deepseek-v4-flash` / `deepseek-v4-pro`, OpenRouter mantido em `meta-llama/llama-3.3-70b-instruct`. Semântica estrita de estados implementada: `VALIDADO_POR_DOCUMENTACAO_ATUAL`, `CONFIG_CONTRACT_READY_NO_CREDENTIAL`, `SMOKE_PASS`, `DEPRECATED`, `UNAVAILABLE`.
- **Suítes Testadas:** `node agentic/scripts/test_secret_protection.js` (PASS 4/4, exit code 0), `node agentic/scripts/smoke_test_providers.js` (PASS 5/5, exit code 0).
- **Próximo Passo:** Commit e push seletivos na branch `sprint/a01-multi-provider-fallbacks-001`, envio do RESULT via Ponte 2 (porta 8767) e rearme do wake waiter.


