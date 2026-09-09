# Mapa de Realidade H01 - Colmeia API (REALIDADE == MAPA)

Card: #98 H01-007 | Papel: Curator | Atualizado: 2026-09-09
Regra: mapa so afirma o observado (evidencia material/homologacao). Nada de claim sem prova.

## Componentes homologados da rota minima (REALIDADE)
| Componente | Localizacao | Commit(s) prova | Testes | Homologacao |
|---|---|---|---|---|
| Executor (Hermes) | (Hermes CLI + agentic worker/router) | #71-#74; usado em #94-#97 | 22/22 sensores; 24/24 verifier; 41/41 fallback | Planner (#94/#95/#96/#97 fechados) |
| Test Runner | agentic/scripts + Testes/ (suites #95/#96/#73) | prova #94 (RESULT 5608035978) | 87/0 acumulado | #94 COMPLETED |
| Sensores Local/Git | agentic/sensors/ | 7694acb (v1) | 22/22 | #95 COMPLETED |
| Verifier (spec-driven) | agentic/verifier/ | dfcb044, 5495f2b, 4251c78 | 24/24 | #96 COMPLETED |
| Router/fallback (despacho real) | agentic/router/ (dispatch.js) | 49c52fe | fallback A01 41/41 sem regressao | #97 COMPLETED |

## Estado Git REAL (base da foto)
- Branch: sprint/h01-colmeia-api-001
- HEAD local == HEAD remoto == 49c52fe (ate esta foto; #98 adicionara novos commits)
- Itens locais preexistentes nao commitados: 56 (17 modified + 39 untracked) - preservados, fora do escopo H01 agêntico

## Papeis de cadeia estendida (contratos, sem gate por task)
- agentic/roles/README.md (registry) + reviewer-argos, code-reviewer, ddd-reviewer, curator, obsidian-downplant
- Menor Rota Confiavel: task simples aciona ZERO reviewers (regra registrada no registry)

## Divergencias monitoradas (nao bloqueantes)
- Groq: GET /models -> 403 (listagem); chat/completions real -> 200 (validado #97). Nao bloqueante (DECISAO-1).
- A02 #79 (papeis/autoridade) e #80 (template de card) seguem abertos no canteiro A02.
- #92/#93 (bootstrap/executor): absorvidos na pratica; fechamento e bookkeeping do #101.
