# Router Multi-Provider A01 - Nota de Responsabilidade e Operacao

Card: #76 T-A01-DOCS-008 | Regra: #57 (quatro pontas) | REALIDADE == MAPA

## 1. Responsabilidade do router
O Syntheon Local Router (agentic/router/router_server.js, porta 127.0.0.1:4000) e a camada
transversal de despacho multi-provider com fallback, retry, circuit breaker e idempotencia.
Ele NAO decide politica de negocio: recebe tasks (alias de modelo), roteia para provider,
registra PROVIDER_USED/FALLBACK_REASON/ATTEMPTS e devolve completions tipadas.
Nao e gateway do Gravity nem da Ponte 2.

## 2. Endereco Down Plant (infraestrutura transversal, sem comodo novo)
agentic/ (camada transversal agêntica) -> agentic/router/ (codigo) + agentic/config/providers.json (contrato de providers) + agentic/logs/ (router.log, router_stdout.log, metricas). Nenhum comodo novo criado: a camada vive como infraestrutura transversal do vault.

## 3. Aliases de modelo (sem nomes/keys sensiveis)
Expostos em GET /v1/health e /v1/models do router: syntheon-worker, syntheon-fast, syntheon-reasoning.
O alias mapeia para o provider/modelo via agentic/config/providers.json (model_alias). Nenhuma chave aparece em codigo, log ou doc.

## 4. Providers ativos - HISTORICO A01 vs RUNTIME ATUAL (sem mistura silenciosa)
- CONTRATO HISTORICO A01 (#71-#75, homologado): 2 providers ativos = Gemini (primary) -> Groq (fallback_1), conforme T-A01-POLICY-005 (#73). Gemini tinha readiness CONFIGURED_QUOTA_LIMITED.
- DECISAO POSTERIOR H01 (#97, homologada): providers.json local passou a routing_policy primary=deepseek, fallback_1=groq (DeepSeek validado SMOKE_PASS; Groq chat real validado 200 no #75/#97; GET /models Groq responde 403 - limitacao de endpoint, nao de geracao).
- ESTADO ATUAL DO RUNTIME: segue o providers.json local (deepseek -> groq). OpenRouter permanece deferred (fora do escopo ativo). Este documento registra ambos os fatos sem os fundir: rotulo historico A01 e rotulo H01 explicitos.
- IMPORTANTE: nenhuma afirmacao acima atribui a A01 provider que ela nao homologou; DeepSeek e rotulado como decisao H01.

## 5. Matriz fallback/retry/idempotencia (resumo factual da #75, matriz 45/45)
| Condicao | Comportamento |
|---|---|
| 429 / timeout / 5xx / connection error no primary | retry 1x no mesmo provider -> fallback_1 (groq) |
| erro nao elegivel (payload invalido, logico) | 400/422, ZERO fallback (allow_fallback=false) |
| primary + fallback falham | 502 ALL_PROVIDERS_EXHAUSTED, sem 3o provider (politica: 2) |
| idempotency_key repetida | replay do cache -> MESMO completion id (single effect) |
| circuit breaker | abre apos falhas elegiveis; desvia/registra CIRCUIT_OPEN |
- Registro em toda resposta: provider_used, routing_tier, fallback_used, fallback_reason, attempts (provider/attempt/error_class/action), circuit_state.
- Knobs de teste (deterministicos, mocked:true explicito, sem chamada externa): headers x-syntheon-h01-force-fail / -mock-fallback / -mock-fallback-fail (ver suite test_contingency_75.js).

## 6. Comandos de operacao
- Start: node agentic/scripts/start_router.js (ou node agentic/router/router_server.js com chaves no env)
- Stop: node agentic/scripts/stop_router.js
- Health: GET http://127.0.0.1:4000/health | Metrics: GET /metrics | Models: GET /v1/models
- Smoke: node agentic/scripts/smoke_local_router.js (router) e smoke_test_providers.js (providers)
- Suites: node agentic/scripts/test_fallback_policy.js (politica A01 #73), test_contingency_75.js (matriz #75)
- Pre-requisito: chaves (DEEPSEEK_API_KEY/GROQ_API_KEY/GEMINI_API_KEY) no ambiente do processo; router NAO chama rede sem credencial.

## 7. Relacao com Gravity/Hermes/Ponte 2 (fatos, sem inventar)
- Gravity/Antigravity: SEM integracao implementada com o router hoje; integracao via Ponte 2 planejada no canteiro A02 (#86), nao executada.
- Ponte 2 (8765/8767): nao consome o router; transporta envelopes ChatGPT<->Gravity.
- Hermes: o Hermes CLI usa provider diretamente via config proprio (deepseek); o router serve o worker adapter (agentic/workers/syntheon_worker_adapter.js) para agentes que despacham via alias syntheon-worker.

## 8. Canvas
Nenhuma mudanca estrutural de comodos do Down Plant: implementacao vive em infraestrutura transversal (agentic/). CANVAS_STATE: NAO_APLICAVEL (sem delta estrutural; justificativa: camada transversal ja existente, sem comodo novo).

## 9. Declaracao #57 (quatro pontas) - ver agentic/state/a01_reality_map.md
