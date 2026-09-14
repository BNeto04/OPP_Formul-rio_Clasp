# downplant_handoff — espelho Markdown derivado

> **Derivado de:** [`downplant_handoff.yaml`](downplant_handoff.yaml) (fonte canônica versionada).
> Este espelho é a leitura humana do mesmo objeto. Não introduz fato que não esteja no YAML.
> Objeto do card **#156 (DP-HANDOFF-001)**, pai **#57**.

## 1. Cabeçalho

| Campo | Valor |
|---|---|
| Esquema | `DP-HANDOFF-1` |
| Versão do método | `2.1` |
| Versão do handoff | `1` |
| Gerado em | `2026-09-13` |
| Autor | HERMES |
| Card de origem | #156 (DP-HANDOFF-001) |
| Card pai | #57 |
| Estado do handoff | ATIVO |

**Propósito:** contexto mínimo obrigatório para o início de uma task, com o estado declarado das quatro pontas (CÓDIGO / DOCUMENTAÇÃO / CANVAS-PLANTA / GIT). **Não duplica** estado operacional — referencia os documentos canônicos (§40.7/§32.1: o handoff carrega o contexto, não uma segunda cópia do estado).

## 2. Identidade

| Campo | Valor |
|---|---|
| Projeto | SYNTHEON GS |
| Repositório (canônico) | `C:/Users/Bneto04/Documents/Codex/syntheon-gs-downplant-offline` |
| Espelho (leitura) | `C:/Users/Bneto04/Documents/Obsidian/Obsidian_Brain/Syntheon` |
| Branch | `sprint/g01-guardiao-qualidade-live-001` |
| HEAD observado | `98f5c8d` |
| Pasta de trabalho | `C:/Users/Bneto04` |

## 3. Contexto de task

| Campo | Valor |
|---|---|
| Cômodo | `C00_Governanca_Estrutural` |
| Módulo ativo | `MOD-C00-02_VALIDACAO_ESTRUTURAL` |
| Fatia ativa | #156 DP-HANDOFF-001 + #157 DP-TRANSICAO-001 |
| Ambiente | local |
| Portão atual | Executor → Conferidor (aguardando auditoria); sem autorização de publicação |
| Regra de parada | parar ao fim da fatia; não iniciar a próxima; não commitar, não push, não deploy, não postar |

**Arquivos permitidos**

- `08_Execucao_Ao_Vivo/downplant_handoff.yaml`
- `08_Execucao_Ao_Vivo/downplant_handoff.md`
- `scripts/downplant/validar-handoff.mjs`
- `03_Fundacao/ESTRUTURA_DO_COFRE.md`
- `RELATORIO_DE_DIFERENCIAS_156_157.md`

**Proibições**

- não alterar código funcional do produto
- não commitar, não push, não deploy
- não postar ou comentar no GitHub
- não inventar dado, versão ou evidência
- não criar pasta condicional sem gatilho, dono e condição de encerramento

**IDs remotos**

| Identificador | Valor |
|---|---|
| Apps Script Script ID | `1dudWJXeADZ3nSJSimyHgEQbi0Gu-RnV57w3dNvS6m-zbfqvtQ3GxEx4G` |
| Sheets ID | `1S05sTbd3otgjGjrC-YrzHk7dXp7mzzaw_J2lyQ86hOY` |
| Repositório GitHub | `BNeto04/OPP_Formul-rio_Clasp` |

## 3.1 Contrato de entrada §32.14 (campos declarados — #163 DP24-002)

> Campos do require da §32.14 que o objeto declara explicitamente. Os demais campos do require **não são duplicados aqui**: `downplant.comodo` ← Cômodo (§3), `downplant.modulo` ← Módulo ativo (§3), `escopo.arquivos` ← Arquivos permitidos (§3), `estado.portao_atual` ← Portão atual (§3). O mapa completo (e a projeção) está em `scripts/downplant/validar-handoff.mjs`, seção 8 — validador único, sem segundo validador.

| Campo §32.14 | Valor declarado |
|---|---|
| `downplant.escala` | `modulo` (`submodulo` \| `modulo` \| `comodo` — §40.4) |
| `task.id` | `TASK-C00-163` (padrão `TASK-<COMODO>-<n>`, §46.12; Task do card #163) |
| `task.acao` | `alterar` |
| `task.alvo` | `scripts/downplant/validar-handoff.mjs` |
| `escopo.pode_expandir` | `false` (explícito, nunca ausente) |
| `estado.portao_destino` | Conferidor → Publicação (após auditoria) |

Verificação: `node scripts/downplant/validar-handoff.mjs .` (seção 8 — require/ensure/invariant §32.14; 40 PASS / 0 FAIL, exit 0).

## 4. Quatro pontas

| Ponta | Estado | Justificativa |
|---|---|---|
| CODE_STATE | ALINHADO | Validador node criado e verde (exit 0); nenhum código funcional do produto alterado. |
| DOC_STATE | ALINHADO | Handoff YAML+MD, manifesto e relatório escritos no repo e derivados no espelho. |
| CANVAS_STATE | NAO_APLICAVEL | Sem delta estrutural: nenhum cômodo, módulo, porta ou nó novo. |
| GIT_STATE | PENDENTE | Mudanças não commitadas por regra do card; árvore de trabalho com alterações. |

## 5. Proveniência

| Campo | Valor |
|---|---|
| Agente | HERMES |
| Modelo | deepseek-v4-flash |
| Objetivo | Executar #156 e #157 com evidência real, sem commit, sem push e sem postagem. |
| Revisão humana | pendente |

## 6. Referências canônicas (o handoff aponta, não copia)

- Estado operacional: [AGORA.md](AGORA.md)
- Manifesto do cofre: [ESTRUTURA_DO_COFRE.md](../03_Fundacao/ESTRUTURA_DO_COFRE.md)
- Constituição: [CONSTITUICAO.md](../03_Fundacao/CONSTITUICAO.md)
- Planta Mestra: [PLANTA_MESTRA.canvas](../01_Planta/PLANTA_MESTRA.canvas)
- Lint estrutural: `scripts/downplant/lint-estrutura.mjs`
- Validador do handoff: `scripts/downplant/validar-handoff.mjs`

## 7. Nota de formato (honestidade normativa)

O objeto acima nasceu do que o método disponível no disco na época do #156 definia (§32.1 contexto mínimo obrigatório; família §46.8/§46.9 para o par YAML+espelho; as quatro pontas já materializadas no #57). **Atualização #163:** o texto canônico **2.4** passou a estar versionado no próprio repositório (`03_Fundacao/METODO_DOWN_PLANT_PROGRESSIVO_v2.4.md`, commit `42ca47e`) e **contém** as seções §46.11 (espelho Markdown derivado), §46.12 (objeto canônico de handoff Planner → Executor) e §32.14 (contrato de entrada require/ensure/invariant). A divergência registrada no #156 está, portanto, resolvida: os campos do require foram homologados neste objeto (§3.1) e o contrato passou a ser verificado pelo validador único deste repositório.
