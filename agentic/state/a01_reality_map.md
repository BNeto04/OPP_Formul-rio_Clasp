# Mapa de Realidade A01 - Router Multi-Provider (REALIDADE == MAPA)

Card: #76 T-A01-DOCS-008 | Papel: Curator/Docs | Atualizado: 2026-09-09
Regra #57 (quatro pontas) | Mapa so afirma o observado.

## INVENTORY_FOUND (documentacao preexistente)
- Nenhuma doc dedicada do router/fallback/observabilidade em agentic/ (so headers de codigo e issues #71-#75).
- Contratos de codigo: agentic/router/*.js, agentic/scripts/start|stop|status_router.js, fallback_policy.js, observability.js, providers.json.
- Registro historico em issues A01 (#71-#75) e H01 (#97) conforme secao 4 do README.

## Docs criadas/atualizadas (FILES_CHANGED)
- agentic/router/README.md (nova): responsabilidade, endereco Down Plant, aliases, historico A01 vs decisao H01, matriz fallback/retry/idempotencia (#75), comandos start/stop/health/smoke, relacao Gravity/Hermes/Ponte 2, decisao Canvas.
- agentic/state/a01_reality_map.md (nova, este arquivo): quatro pontas e divergencias.

## DOWN_PLANT_ADDRESS
agentic/router/ (codigo) + agentic/config/providers.json (contrato) + agentic/logs/ (evidencia) - infraestrutura transversal, sem comodo novo.

## CANVAS_DECISION
CANVAS_STATE = NAO_APLICAVEL. Justificativa: nenhuma mudanca estrutural de comodos; router vive como camada transversal em agentic/ (sem criar comodo novo, conforme passo 2 do card).

## Quatro pontas #57
- CODE_STATE: ALINHADO - codigo router/fallback/dispatch no commit 118295f (branch sprint/h01-colmeia-api-001), suites 45/45 (contingencia #75), 41/41 (fallback #73), 22/22 (#95), 24/24 (#96).
- DOC_STATE: ALINHADO - apos este card; docs factuais criadas sem inventar arquitetura; rotulos historico A01 (gemini->groq) e decisao H01 (deepseek->groq) separados.
- CANVAS_STATE: NAO_APLICAVEL (justificativa acima).
- GIT_STATE: ALINHADO - head local == remoto apos push deste card; 56 itens locais preexistentes preservados (17 modified + 39 untracked).

## Divergencias remanescentes (nao bloqueantes, registradas)
- providers.json local segue MODIFIED (nao commitado): reflete decisao H01 deepseek-primary (runtime atual); commit futuro do arquivo e decisao de contrato (nao feito neste card para preservar os 56 itens).
- Groq GET /models -> 403 (listagem) vs chat/completions 200: limitacao de endpoint documentada (DECISAO-1).
- Integracao Ponte 2/Gravity com router: pendente no canteiro A02 (#86), fora deste card.
