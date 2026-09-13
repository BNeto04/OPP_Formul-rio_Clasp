---
cards: ["156 DP-HANDOFF-001", "157 DP-TRANSICAO-001"]
card_pai: "#57"
tipo: relatorio_de_diferencas
data: "2026-09-13"
autor: HERMES
commit: "(pendente - commit proibido neste card)"
---

# RELATORIO_DE_DIFERENCIAS_156_157

Relatório das entregas dos cards **#156 (DP-HANDOFF-001)** e **#157 (DP-TRANSICAO-001)**, executados em conjunto e reportados separadamente. Escopo: repo canônico + espelho Obsidian. Sem commit, sem push, sem postagem.

## 1. Natureza das duas entregas (por que são diferentes)

| | #156 DP-HANDOFF-001 | #157 DP-TRANSICAO-001 |
|---|---|---|
| Objeto | **criar** um objeto canônico novo (`downplant_handoff`) | **resolver** a ausência/estado de um diretório condicional (`99_Arquivo_Transicao`) |
| Ação | materializar YAML + espelho MD + validador | registrar decisão de aplicabilidade no manifesto |
| Artefato novo | sim (`08_Execucao_Ao_Vivo/downplant_handoff.{yaml,md}`, `scripts/downplant/validar-handoff.mjs`) | não (nenhuma pasta; nenhuma estrutura ornamental) |
| Mudança no manifesto | não | sim (`03_Fundacao/ESTRUTURA_DO_COFRE.md`) |
| Prova | validador node verde (exit 0) + lint | lint repo + ausência confirmada no espelho |
| Espelho | MD derivado escrito | manifesto reconciliado |

## 2. #156 — entregas

Definição do método usada (lida antes de criar):
- `references/metodo-down-plant-progressivo-v2.1.md` §32.1 **Contexto mínimo obrigatório** = conteúdo do handoff;
- família de modelos §46.8 (manifesto com frontmatter YAML) / §46.9 (índice derivado) = forma do par YAML + derivado;
- regra das **quatro pontas** já materializada no repo (card #57).

| Artefato | Caminho (repo) | Papel |
|---|---|---|
| YAML canônico versionado | `08_Execucao_Ao_Vivo/downplant_handoff.yaml` | **fonte canônica** do objeto (schema `DP-HANDOFF-1`) |
| Espelho Markdown derivado | `08_Execucao_Ao_Vivo/downplant_handoff.md` | leitura humana derivada do YAML |
| Validador/teste | `scripts/downplant/validar-handoff.mjs` | prova YAML válido + utilizável no início de uma task |
| Espelho (Obsidian) | `.../Syntheon/08_Execucao_Ao_Vivo/downplant_handoff.{yaml,md}` | derivação no espelho |

**Schema mínimo (`DP-HANDOFF-1`)** — não duplica estado operacional; referencia os documentos canônicos:
- `identidade` (projeto, repositório, espelho, branch, head observado, pasta);
- `contexto_de_task` (§32.1: cômodo, módulo ativo, fatia, ambiente, portão, regra de parada, arquivos permitidos, proibições, IDs remotos);
- `quatro_pontas` (CODE/DOC/CANVAS/GIT + justificativas);
- `proveniencia` (§32.3) e `referencias` (ponteiros, não cópias).

## 3. #157 — decisão

**Resultado: `99_Arquivo_Transicao` = NÃO_APLICÁVEL** (diretório condicional não ativado). Não materializado.

Justificativa factual (método §40.2 / §40.8 / §40.10):
1. §40.2 classifica `99_Arquivo_Transicao` como **C (condicional)**, ativo "somente durante migração, com origem, dono e condição de encerramento".
2. Nenhum gatilho comprovado: a raiz já materializa os **sete** diretórios ativos + `README.md`; código e documentação vivos estão endereçados em `02_Comodos` e `07_Codigo_Leitura`; **não existe acervo legado aguardando transição**.
3. Materializar sem origem/dono/encerramento violaria §40.2 (item C sem gatilho), §40.8 (pasta de transição sem dono/motivo/encerramento = achado) e §40.10 (nada de estrutura ornamental/burocrática).
4. O estado é **registrado** no manifesto (não é ausência silenciosa): frontmatter `conditional_directories` + seção "Diretórios Condicionais e Transição" em `03_Fundacao/ESTRUTURA_DO_COFRE.md` (repo e espelho).

Consequência: a ausência deixa de ser divergência — repo e documentação concordam; nenhuma pasta criada.

## 4. Divergências registradas (não ocultadas)

1. **Referência de seção do card #156.** Os cards citam §46.12 / §32.14. O método disponível no disco (`Skill Packages/down-plant-progressivo-2.1/.../metodo-down-plant-progressivo-v2.1.md`) vai até §46.10 e §32.4 — **essas seções não existem** no arquivo. O objeto foi construído a partir do que o método de fato define (§32.1 + família §46.8/§46.9 + quatro pontas do #57), com o mesmo critério derivado-e-declarado já usado em `EV-C00-001`. A referência de seção fica como divergência a reconciliar com o autor do método.
2. **Espelho desalinhado (pré-existente + alteração externa concorrente).** O lint no espelho é a soma de duas fontes que **não** são desta entrega: (a) dívida pré-existente de slots `02`–`05` ausentes e wikilinks com sintaxe de path completo, declarada em `EV-C00-001` e tratada no **#154**; (b) uma alteração **externa concorrente** (mtime `13:57`, anterior a esta entrega, `14:06/14:07`): criação de `02_Comodos/C00_Governanca_Estrutural/03_Especificacoes/INSTALACOES_TRANSVERSAIS/INST-EXEC-001_ENDPOINT_DE_EXECUCAO.md` sem `INDICE.md` no slot e um novo wikilink em `07_Codigo_Leitura/Entrada/WebAppExecucao.js.md`. Contagem: baseline **358** → atual **359**; **0 (zero)** erros citam os arquivos novos desta entrega.
3. **Direção de sincronização.** Repo = canônico; espelho = leitura (porta `P01_SINCRONIZACAO_UNIDIRECIONAL_PORTA.md`). Mantida.

## 5. Evidência — comandos e saída (executados)

- `node scripts/downplant/lint-estrutura.mjs` (repo) → **exit 0** `SUCESSO! A arvore documental esta em estrita conformidade com o Down Plant 2.1.`
- `node scripts/downplant/lint-estrutura.mjs "C:/Users/Bneto04/Documents/Obsidian/Obsidian_Brain/Syntheon"` (espelho) → **exit 1** `FALHA! 359 erro(s)` (358 pré-existentes + 1 de alteração externa concorrente; 0 citando os arquivos desta entrega — item 4.2).
- `node scripts/downplant/validar-handoff.mjs` (repo) → **exit 0** `SUCESSO! O YAML do downplant_handoff e valido e utilizavel no inicio de uma task.`

## 6. Quatro pontas (estado desta entrega)

| Ponta | Estado | Nota |
|---|---|---|
| CÓDIGO | ALINHADO | validador node criado e verde; nenhum código funcional do produto alterado |
| DOCUMENTAÇÃO | ALINHADO | handoff, manifesto e este relatório no repo e no espelho |
| CANVAS / PLANTA | NÃO_APLICÁVEL | sem delta estrutural (nenhum nó/porta/cômodo novo) |
| GIT | PENDENTE | alterações não commitadas por regra do card |

## 7. Limites

- Não houve commit, push, deploy nem postagem (proibido pelo card).
- O lint valida **estrutura, nomenclatura, legado, links e JSON de canvas** — não valida semântica.
- O espelho permanece divergente por dívida pré-existente (#154); esta entrega não a resolveu.
- A divergência §46.12/§32.14 depende do autor do método para fechamento normativo.

## 8. Próximo passo seguro

Auditoria da entrega (Conferidor). Nenhuma fatia dependente iniciada automaticamente.
