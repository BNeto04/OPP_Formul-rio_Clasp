# Canteiro A02 - Contrato de Autoridade e Maquina de Estados

Card: #79 T-A02-ROLES-001 | Pai: #78 | Regras: #57 (quatro pontas), #58 (conceitual, fora do loop)
Reutiliza: agentic/roles/ (#98 H01, papeis selecionaveis), skill antigravity-sprint-continuity (ordem de autoridade), h01_reality_map/a01_reality_map.

## 1. Papeis e autoridade (quem planeja, executa, verifica, audita, fecha)
| Papel | Quem | Autoridade | NAO pode |
|---|---|---|---|
| Planner/Arquiteto/Auditor final | ChatGPT (web) | decompor, especificar cards, autorizar execucao, AUDITAR e FECHAR Issue com evidencia | delegar a autoridade final de fechamento |
| Contrato/estado rastreavel | GitHub Issue/Kanban | fonte canonica de estado e DONE | - |
| Mestre de Obras/coordenador | Gravity/Antigravity (quando disponivel) | despachar cards, coordenar operarios, nao-SPOF | homologar arquitetura nem fechar como autoridade final |
| Operario executor | Hermes/worker (agentic) | executar cards aprovados, produzir RESULT + evidencia material | fechar Issue, decidir arquitetura, auto-homologar |
| Verifier | agentic/verifier (#96) | veredito material independente (VERIFIED/NOT_VERIFIED/INSUFFICIENT/TEST_FAILED) | aprovar sem evidencia |
| Reviewer/Curator/orbitais | agentic/roles (#98) | acionamento SELETIVO por garantia exigida | virar gate obrigatorio por task |
| Ponte 2 | transporte | CALL/RESULT + wake reativo | decidir acao funcional |
| Ponte 1 | retorno | relatorio ao proprietario/Telegram | filtrar decisao |
| Proprietario | Mano | decisao humana final, escalonamento | - |

## 2. Ordem canonica de autoridade (do mais forte ao mais fraco)
1. Seguranca e decisao humana explicita (OWNER_DECISION_REQUIRED);
2. DONE_GATE e contrato factual da Issue no GitHub;
3. Skill soberana antigravity-sprint-continuity;
4. Contratos do canteiro (este documento) + Down Plant;
5. Convencoes locais legadas.

## 3. Maquina de estados minima de um card
BACKLOG -> READY -> DISPATCHED -> EXECUTING -> TESTING -> RESULT_PENDING_AUDIT -> DONE
BLOCKED acessivel de READY/DISPATCHED/EXECUTING/TESTING (e retorna a origem ou vira REJECTED->READY).

## 4. Matriz papel -> transicoes permitidas
| Transicao | Quem autoriza | Evidencia exigida |
|---|---|---|
| BACKLOG -> READY | Planner (card com spec/DONE) | spec escrito no card |
| READY -> DISPATCHED | Mestre de Obras (Gravity) ou Planner; operario NAO se auto-despacha | card aprovado |
| DISPATCHED -> EXECUTING | Mestre de Obras | ACK do operario |
| EXECUTING -> TESTING | Operario (Hermes/worker) | alteracao confinada + testes |
| TESTING -> RESULT_PENDING_AUDIT | Operario publica RESULT; Verifier opcional ja pode ter emitido verdict | RESULT + evidencia Local/Git |
| RESULT_PENDING_AUDIT -> DONE | SOMENTE Planner | evidencia auditada; quatro pontas #57 |
| qualquer -> BLOCKED | Operario ou Mestre de Obras | motivo + escalonamento ao proprietario se OWNER_DECISION_REQUIRED |
| BLOCKED -> (origem) | Mestre de Obras | desbloqueio factual |
| RESULT_PENDING_AUDIT -> READY (rejeicao) | Planner | motivo de rejeicao (REJECTED) |

## 5. Regras de bloqueio e escalonamento
- BLOCKED com decisoes de arquitetura/escopo: escalar ao Planner; se exigir decisao humana explicita (OWNER_DECISION_REQUIRED), escalar ao proprietario.
- Bloqueio de credencial/provider: registrar factual (ex.: status real 403/200), nao inventar disponibilidade.
- Worker NAO fecha Issue; Gravity NAO homologa arquitetura; so Planner fecha apos evidencia (#57 verde).

## 6. Relacoes
- #57 (quatro pontas): qualquer promocao estrutural/DONE exige CODE/DOC/CANVAS/GIT STATE coerentes.
- #58: permanece conceitual (teoria em construcao), fora do loop obrigatorio deste canteiro.
- #98 (H01): reviewers/curator/observacao orbital NAO sao gates por task - acionamento seletivo preservado.

## 7. Estado real (REALIDADE == MAPA, quatro pontas)
- CODE_STATE: ALINHADO (contrato novo; runtime A01/H01 inalterado).
- DOC_STATE: ALINHADO (este contrato; nenhuma duplicacao de papeis H01).
- CANVAS_STATE: NAO_APLICAVEL (sem delta estrutural; documento vive em agentic/contracts/, camada transversal).
- GIT_STATE: ALINHADO (pos-push deste card; 56 itens preexistentes preservados).
