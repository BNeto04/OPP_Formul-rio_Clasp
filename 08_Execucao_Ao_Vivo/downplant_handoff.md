# HANDOFF

> Gerado automaticamente a partir do objeto downplant_handoff (§46.12). Não editar diretamente — editar o YAML de origem e regerar.
> Fonte canônica: `08_Execucao_Ao_Vivo/downplant_handoff.yaml` · gerador: `scripts/downplant/gerar-handoff-md.mjs`.

## Localização Down Plant
- Terreno: (nao declarado no YAML)
- Cômodo: C00_Governanca_Estrutural
- Módulo: MOD-C00-02_VALIDACAO_ESTRUTURAL
- Submódulo: (nao declarado no YAML)
- Escala: modulo
- Circuito: (nao declarado no YAML)
- Porta: (nao declarado no YAML)

## Task
- ID: TASK-C00-163
- Objetivo: #156 DP-HANDOFF-001 + #157 DP-TRANSICAO-001
- Ação: alterar
- Alvo: scripts/downplant/validar-handoff.mjs
- Resultado esperado: Conferidor -> Publicacao (apos auditoria)

## Escopo autorizado
- Arquivos:
  - 08_Execucao_Ao_Vivo/downplant_handoff.yaml
  - 08_Execucao_Ao_Vivo/downplant_handoff.md
  - scripts/downplant/validar-handoff.mjs
  - 03_Fundacao/ESTRUTURA_DO_COFRE.md
  - RELATORIO_DE_DIFERENCIAS_156_157.md
- Funções: scripts/downplant/validar-handoff.mjs
- Artefatos: (nao declarado no YAML)
- Ambiente: local
- Pode expandir: false

## Conexões afetadas
- Origem: (nao declarado no YAML)
- Destino: (nao declarado no YAML)
- Contrato: (nao declarado no YAML)

## Portões
- Atual: Executor -> Conferidor (aguardando auditoria); sem autorizacao de publicacao
- Destino: Conferidor -> Publicacao (apos auditoria)

## Proibições
- Expandir escopo: false
- Efeitos externos: (nao declarado no YAML)
- Publicação: (nao declarado no YAML)
- Outros:
  - nao alterar codigo funcional do produto
  - nao commitar, nao push, nao deploy
  - nao postar ou comentar no GitHub
  - nao inventar dado, versao ou evidencia
  - nao criar pasta condicional sem gatilho, dono e condicao de encerramento

## Regra para intercorrências
Detectar → localizar → registrar → devolver ao Planner.

## Regra de parada
Ao concluir o escopo, registrar resultado e parar.
- Declarada neste objeto: parar ao fim da fatia; nao iniciar a proxima; nao commitar, nao push, nao deploy, nao postar

## Cabeçalho do objeto

| Campo | Valor |
|---|---|
| downplant_schema | DP-HANDOFF-1 |
| downplant_version | 2.1 |
| handoff_version | 1 |
| gerado_em | 2026-09-13 |
| autor | HERMES |
| card_origem | #156 (DP-HANDOFF-001) |
| card_pai | #57 |
| estado_do_handoff | ATIVO |

**Propósito**

Contexto minimo obrigatorio para o inicio de uma task com o estado declarado das quatro pontas. Nao duplica estado operacional: referencia os documentos canonicos.

## Identidade

| Campo | Valor |
|---|---|
| projeto | SYNTHEON GS |
| repositorio | C:/Users/Bneto04/Documents/Codex/syntheon-gs-downplant-offline |
| espelho | C:/Users/Bneto04/Documents/Obsidian/Obsidian_Brain/Syntheon |
| branch | sprint/g01-guardiao-qualidade-live-001 |
| head_observado | 98f5c8d |
| pasta_de_trabalho | C:/Users/Bneto04 |

## Contexto de task

| Campo | Valor |
|---|---|
| comodo | C00_Governanca_Estrutural |
| modulo_ativo | MOD-C00-02_VALIDACAO_ESTRUTURAL |
| fatia_ativa | #156 DP-HANDOFF-001 + #157 DP-TRANSICAO-001 |
| ambiente | local |
| portao_atual | Executor -> Conferidor (aguardando auditoria); sem autorizacao de publicacao |
| regra_de_parada | parar ao fim da fatia; nao iniciar a proxima; nao commitar, nao push, nao deploy, nao postar |

- Proibições:
  - nao alterar codigo funcional do produto
  - nao commitar, nao push, nao deploy
  - nao postar ou comentar no GitHub
  - nao inventar dado, versao ou evidencia
  - nao criar pasta condicional sem gatilho, dono e condicao de encerramento

**Ids remotos**

| Identificador | Valor |
|---|---|
| apps_script_script_id | 1dudWJXeADZ3nSJSimyHgEQbi0Gu-RnV57w3dNvS6m-zbfqvtQ3GxEx4G |
| sheets_id | 1S05sTbd3otgjGjrC-YrzHk7dXp7mzzaw_J2lyQ86hOY |
| github_repo | BNeto04/OPP_Formul-rio_Clasp |

## Quatro pontas

| Ponta | Estado | Justificativa |
|---|---|---|
| CODE_STATE | ALINHADO | Validador node criado e verde (exit 0); nenhum codigo funcional do produto alterado. |
| DOC_STATE | ALINHADO | Handoff YAML+MD, manifesto e relatorio escritos no repo e derivados no espelho. |
| CANVAS_STATE | NAO_APLICAVEL | Sem delta estrutural: nenhum comodo, modulo, porta ou no novo. |
| GIT_STATE | PENDENTE | Mudancas nao commitadas por regra do card; arvore de trabalho com alteracoes. |

## Proveniência

| Campo | Valor |
|---|---|
| agente | HERMES |
| modelo | deepseek-v4-flash |
| objetivo | Executar #156 e #157 com evidencia real, sem commit, sem push e sem postagem. |
| revisao_humana | pendente |

## Referências canônicas (o handoff aponta, não copia)

- estado_operacional: [AGORA.md](AGORA.md) · `08_Execucao_Ao_Vivo/AGORA.md`
- manifesto: [ESTRUTURA_DO_COFRE.md](../03_Fundacao/ESTRUTURA_DO_COFRE.md) · `03_Fundacao/ESTRUTURA_DO_COFRE.md`
- constituicao: [CONSTITUICAO.md](../03_Fundacao/CONSTITUICAO.md) · `03_Fundacao/CONSTITUICAO.md`
- planta_mestra: [PLANTA_MESTRA.canvas](../01_Planta/PLANTA_MESTRA.canvas) · `01_Planta/PLANTA_MESTRA.canvas`
- lint: [lint-estrutura.mjs](../scripts/downplant/lint-estrutura.mjs) · `scripts/downplant/lint-estrutura.mjs`
- validador: [validar-handoff.mjs](../scripts/downplant/validar-handoff.mjs) · `scripts/downplant/validar-handoff.mjs`

## Notas do objeto (§46.11)

**projecao_32_14**

Campos do require da §32.14 que este objeto declara explicitamente. Os demais campos do require NAO sao duplicados aqui: downplant.comodo <- contexto_de_task.comodo; downplant.modulo <- contexto_de_task.modulo_ativo; escopo.arquivos <- contexto_de_task.arquivos_permitidos; estado.portao_atual <- contexto_de_task.portao_atual. O mapa completo (e a projecao) esta em scripts/downplant/validar-handoff.mjs, secao 8 - validador unico, sem segundo validador.

**verificacao**

node scripts/downplant/validar-handoff.mjs . (secao 8 - require/ensure/invariant da §32.14; 40 PASS / 0 FAIL; exit 0) - medicao declarada na data de gerado_em deste objeto.

**formato**

O objeto nasceu do que o metodo disponivel no disco na epoca do #156 definia (§32.1 contexto minimo obrigatorio; familia §46.8/§46.9 para o par YAML+espelho; as quatro pontas ja materializadas no #57). Atualizacao #163: o texto canonico 2.4 passou a estar versionado no proprio repositorio (03_Fundacao/METODO_DOWN_PLANT_PROGRESSIVO_v2.4.md, commit 42ca47e) e CONTEM as secoes §46.11 (espelho Markdown derivado), §46.12 (objeto canonico de handoff Planner -> Executor) e §32.14 (contrato de entrada require/ensure/invariant). A divergencia registrada no #156 esta, portanto, resolvida: os campos do require foram homologados neste objeto e o contrato passou a ser verificado pelo validador unico deste repositorio.

**derivacao_do_espelho**

O espelho Markdown (08_Execucao_Ao_Vivo/downplant_handoff.md) e DERIVADO deste YAML por scripts/downplant/gerar-handoff-md.mjs (§46.11). Nao editar o .md: editar este YAML e regerar. Divergencia entre os dois e deriva a ser reportada pelo Curador (§4.5/§7.7).
