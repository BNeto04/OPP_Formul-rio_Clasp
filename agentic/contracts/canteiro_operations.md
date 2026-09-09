# Canteiro A02 - Operacao Diaria e Mapa Operacional

Card: #89 T-A02-DOCS-011 | Regra #57 | REALIDADE == MAPA (nada de estrutura nao implementada)
Consolida #79-#88. Documentos-fonte: a02_canteiro_authority.md (#79), issue_template.md (#80), scripts (dispatcher #82, worker #81, worktree #83, test_gate #84, git_secure #85, canteiro_circuit #86, canteiro_observability #87) e skill antigravity-sprint-continuity.

## 1. Papeis e autoridade (resumo operacional)
ChatGPT = Planner/Auditor final (unico que fecha Issue). GitHub Issue = contrato. Gravity/Mestre de Obras = coordena/despacha (sem autoridade final, nao-SPOF). Hermes/worker = executor (nao fecha Issue, nao decide arquitetura). Verifier = veredito material. Proprietario (Mano) = decisao humana (OWNER_DECISION_REQUIRED). Detalhe: #79.

## 2. Maquina de estados do card
BACKLOG -> READY -> DISPATCHED -> EXECUTING -> TESTING -> RESULT_PENDING_AUDIT -> DONE (+BLOCKED e rejeicao). Transicoes por papel em #79. Estado rastreado via comentarios [CANTEIRO] na Issue e marker local (obs #87).

## 3. Template de Issue executavel (#80)
agentic/contracts/issue_template.md - campos TASK_ID/PARENT/PRIORIDADE/BRANCH/OWNER_DECISION_REQUIRED/CLASP_REQUIRED_RULE/RESULT_SCHEMA + blocos ARQUIVOS_ALVO/PROIBIDOS/OBJETIVO/CONTEXTO/CRITERIOS/TESTES/EFEITOS. Parser deterministico: agentic/contracts/card_parser.js.

## 4. Cadeia de execucao
dispatcher_issue.js (#82): le Issue (gh ou arquivo), valida schema, branch, OWNER_DECISION, dedup por TASK_ID -> worktree_manager.js (#83): worktree por task (base guard, manifest, cleanup) -> syntheon_worker.js (#81): worker real via router A01, escopo allowlist, anti-secrets -> test_gate.js (#84): escopo/secrets/giants/sintaxe/testes + ciclos limitados -> git_secure.js (#85): stage seletivo, gate verde obrigatorio, push confinado, HEAD remoto.

## 5. Integracao router A01
Router local 127.0.0.1:4000 (dispatch real #97/#75): primary deepseek -> fallback groq, 2 providers, sem 3o. Worker consome alias syntheon-worker. Diagnostico: start/stop/status_router.js, GET /health /metrics /v1/models.

## 6. Circuito de coordenacao (#86)
canteiro_circuit.js: envelopes CALL (issue/task/call_id) e RESULT; dedup por CALL_ID/TASK_ID; retorno Telegram via bot da Ponte 1 (token gitignored; dry-run p/ teste). Ponte 2 = transporte ChatGPT<->Gravity (wake #59) - quando fora do ar, registra-se NOT_EXERCISED, nunca simula. Worker NAO fala com Telegram (autoridade so no circuito).

## 7. Recovery/replay/dedup (#87)
canteiro_observability.js: execution_id deterministico; estado fora do prompt; replay nao duplica; resume do ultimo gate seguro (STALE); reconciliacao de RESULT nao entregue (PENDENTE sem prova); metricas (sucesso/retrabalho/fallback/retry TRANSPORT|PROVIDER|CORRECTION); zero LLM idle.

## 8. Comandos operacionais de diagnostico
- Estado git: node agentic/sensors/run_sensors.js --scope git --repo . (sensores #95)
- Router: node agentic/scripts/status_router.js | start_router.js | stop_router.js
- Suites: test_issue_template | test_syntheon_worker | test_dispatch_issue | test_worktree_manager | test_test_gate | test_git_secure | test_canteiro_circuit | test_canteiro_observability (agentic/scripts/)
- Verifier: node agentic/verifier/run_verifier.js --claim/--test/--local/--git
- Circuito/obs: state dirs em %TEMP%\syntheon_* (fora do repo)
- Telemetria router: agentic/logs/router.log (gitignored)

## 9. Canvas/Planta
CANVAS_STATE = NAO_APLICAVEL: nenhum no/porta novo de estrutura (router 4000 e bot Telegram ja existiam; worktrees/state vivem em temp fora do Down Plant). Nenhum comodo novo documentado.

## 10. Quatro pontas #57
CODE_STATE=ALINHADO (toda a cadeia #79-#88 versionada e testada) | DOC_STATE=ALINHADO (este documento) | CANVAS_STATE=NAO_APLICAVEL (justificativa secao 9) | GIT_STATE=ALINHADO (pos-push deste card; 56 itens preservados).
