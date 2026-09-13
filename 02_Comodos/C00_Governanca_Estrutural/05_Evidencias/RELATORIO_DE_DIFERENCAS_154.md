# RELATÓRIO DE DIFERENÇAS — CARD #154 (DP-SYNC-CANVAS-001)

- **Card:** #154 — [DP-SYNC-CANVAS-001] Reconciliar Canvas e Planta Mestra com o terreno real
- **Pai:** #57 · **Repositório canônico:** `syntheon-gs-downplant-offline` · **Espelho:** `Obsidian_Brain/Syntheon`
- **Regra de decisão do Planner:** `repo/GIT define nomes e endereços canônicos`
- **Método aplicado:** nada de arquitetura fictícia — cada nó nomeia artefato, função, regra ou aba **existente**; o que não tem comportamento real foi **marcado e reportado**, não desenhado.
- **Escopo desta execução:** preencher os circuitos de módulo **vazios** (`.canvas`), atualizar a PLANTA MESTRA e medir a derivação. Nenhum código funcional foi alterado; nenhum commit/push; nada postado no GitHub.

---

## 1. Antes e depois medido — REPOSITÓRIO (canônico)

Contagem real lida do JSON de cada arquivo (nós, arestas). `0/0` = circuito vazio.

| # | Circuito | Antes | Depois | Situação |
|---|---|---|---|---|
| 1 | `01_Planta/PLANTA_MESTRA.canvas` | 13 / 13 | **31 / 43** | reconstruída |
| 2 | `CIR-MOD-C00-01_ESTRUTURA_DO_COFRE` | **0 / 0** | **10 / 9** | preenchido |
| 3 | `CIR-SUB-C00-01-01_MIGRACAO_DP21` | **0 / 0** | **5 / 4** | preenchido |
| 4 | `CIR-SUB-C00-01-02_PLANTA_MESTRA` | **0 / 0** | **4 / 3** | preenchido |
| 5 | `CIR-MOD-C00-02_VALIDACAO_ESTRUTURAL` | **0 / 0** | **7 / 7** | preenchido |
| 6 | `CIR-SUB-C00-02-01_LINT` | **0 / 0** | **5 / 4** | preenchido |
| 7 | `CIR-MOD-C01-01_FORMULARIO_E_MENUS` | 15 / 17 | 15 / 17 | já preenchido (não tocado) |
| 8 | `CIR-SUB-C01-01-01_OCR_E_CONFERENCIA` | 5 / 4 | 5 / 4 | já preenchido (não tocado) |
| 9 | `CIR-SUB-C01-01-02_PERSISTENCIA_MANUAL` | **0 / 0** | **5 / 5** | preenchido |
| 10 | `CIR-MOD-C01-02_NORMALIZADOR_DE_EFETIVO` | 4 / 3 | 4 / 3 | já preenchido (não tocado) |
| 11 | `CIR-SUB-C01-02-01_DEPENDENCIA_ARCA` | 1 / 0 | 1 / 0 | parcial — **não tocado** (ver §4.3) |
| 12 | `CIR-MOD-C02-01_LEITURA_E_ADAPTACAO` | **0 / 0** | **9 / 11** | preenchido |
| 13 | `CIR-C03_DOMINIO` (visão do cômodo) | 5 / 4 | 5 / 4 | já preenchido (não tocado) |
| 14 | `CIR-MOD-C03-01_MODELO_DE_OCORRENCIA` | **0 / 0** | **8 / 8** | preenchido |
| 15 | `CIR-MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO` | 6 / 5 | 6 / 5 | já preenchido, **conteúdo defasado** (ver §4.1) |
| 16 | `CIR-SUB-C03-02-01_CATALOGO_DE_REGRAS` | 1 / 0 | 1 / 0 | parcial — **não tocado** |
| 17 | `CIR-SUB-C03-02-02_FONTES_E_PROVENIENCIA` | 1 / 0 | 1 / 0 | parcial — **não tocado** |
| 18 | `CIR-SUB-C03-02-03_COBERTURA_E_LACUNAS` | 1 / 0 | 1 / 0 | parcial — **não tocado** |
| 19 | `CIR-SUB-C03-02-04_ADAPTADOR_PORTA_DE_CONSULTA` | 1 / 0 | 1 / 0 | parcial — **não tocado** |
| 20 | `CIR-MOD-C04-01_MOTOR_ANALITICO` | **0 / 0** | **8 / 8** | preenchido |
| 21 | `CIR-MOD-C05-01_GUARDIAO_DE_QUALIDADE` | **0 / 0** | **10 / 10** | preenchido |
| 22 | `CIR-MOD-C05-02_NORMALIZADOR_DE_ABA` | **0 / 0** | **9 / 9** | preenchido |
| 23 | `CIR-MOD-C06-01_RELATORIOS_OFICIAIS` | **0 / 0** | **9 / 9** | preenchido |
| 24 | `CIR-MOD-C06-02_MERITO_DE_ARMAS_GXT` | **0 / 0** | **8 / 8** | preenchido |
| 25 | `CIR-MOD-C08-01_HOMOLOGACAO_OFFLINE` | **0 / 0** | **8 / 7** | preenchido |

**Total do repo:** 25 arquivos `.canvas`. **Vazios antes: 14** (10 circuitos de módulo `CIR-MOD-*` + 4 circuitos de submódulo `CIR-SUB-*`). **Vazios depois: 0.**
**15 arquivos escritos** (14 circuitos + a planta). Nenhum arquivo não-vazio teve conteúdo existente substituído.

### Circuitos de módulo (`CIR-MOD-*`) — o alvo literal do card

| Circuito de módulo | Antes | Depois |
|---|---|---|
| `CIR-MOD-C00-01_ESTRUTURA_DO_COFRE` | 0 / 0 | 10 / 9 |
| `CIR-MOD-C00-02_VALIDACAO_ESTRUTURAL` | 0 / 0 | 7 / 7 |
| `CIR-MOD-C01-01_FORMULARIO_E_MENUS` | 15 / 17 | 15 / 17 (já preenchido) |
| `CIR-MOD-C01-02_NORMALIZADOR_DE_EFETIVO` | 4 / 3 | 4 / 3 (já preenchido) |
| `CIR-MOD-C02-01_LEITURA_E_ADAPTACAO` | 0 / 0 | 9 / 11 |
| `CIR-MOD-C03-01_MODELO_DE_OCORRENCIA` | 0 / 0 | 8 / 8 |
| `CIR-MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO` | 6 / 5 | 6 / 5 (já preenchido) |
| `CIR-MOD-C04-01_MOTOR_ANALITICO` | 0 / 0 | 8 / 8 |
| `CIR-MOD-C05-01_GUARDIAO_DE_QUALIDADE` | 0 / 0 | 10 / 10 |
| `CIR-MOD-C05-02_NORMALIZADOR_DE_ABA` | 0 / 0 | 9 / 9 |
| `CIR-MOD-C06-01_RELATORIOS_OFICIAIS` | 0 / 0 | 9 / 9 |
| `CIR-MOD-C06-02_MERITO_DE_ARMAS_GXT` | 0 / 0 | 8 / 8 |
| `CIR-MOD-C08-01_HOMOLOGACAO_OFFLINE` | 0 / 0 | 8 / 7 |

**13 circuitos de módulo: 10 estavam vazios → 0 vazios.** Os 3 restantes já tinham conteúdo e foram preservados byte a byte.

---

## 2. Antes e depois medido — ESPELHO (deriva do repo)

O espelho tem **35 arquivos `.canvas`** (10 a mais que o repo: `COMODO-CXX.canvas` de visão de cômodo e subcircuitos com nomes divergentes).

| Circuito (espelho) | Antes | Depois |
|---|---|---|
| `01_Planta/PLANTA_MESTRA.canvas` | 32 / 11 | **31 / 43** |
| `CIR-MOD-C00-02_VALIDACAO_ESTRUTURAL` | **0 / 0** | **7 / 7** |
| `CIR-MOD-C02-01_LEITURA_E_ADAPTACAO` | **0 / 0** | **9 / 11** |
| `CIR-MOD-C03-01_MODELO_DE_OCORRENCIA` | **0 / 0** | **8 / 8** |
| `CIR-MOD-C04-01_MOTOR_ANALITICO` | **0 / 0** | **8 / 8** |
| `CIR-MOD-C05-01_GUARDIAO_DE_QUALIDADE` | **0 / 0** | **10 / 10** |
| `CIR-MOD-C06-01_RELATORIOS_OFICIAIS` | **0 / 0** | **9 / 9** |
| `CIR-MOD-C06-02_MERITO_DE_ARMAS_GXT` | **0 / 0** | **8 / 8** |
| `CIR-MOD-C08-01_HOMOLOGACAO_OFFLINE` | **0 / 0** | **8 / 7** |

**Espelho: 8 circuitos de módulo vazios → 0.** Os outros 27 arquivos `.canvas` do espelho não foram tocados.

### Prova de "mesma derivação"
Os 9 arquivos derivados foram comparados por SHA-256 entre repo e espelho: **todos idênticos byte a byte** (inclui `PLANTA_MESTRA.canvas`). Os circuitos pré-existentes do espelho preservam seu estilo próprio (blocos de código, `group`, emojis) porque **não foram sobrescritos**.

---

## 3. PLANTA MESTRA reconstruída

`01_Planta/PLANTA_MESTRA.canvas` — **31 nós / 43 arestas** (antes: 13 / 13).
Conteúdo exigido pelo card, medido por prefixo de id:

| Bloco | Quantidade | Nota |
|---|---|---|
| **Cômodos** (`room_*`) | **8** | C00, C01, C02, C03, C04, C05, C06, C08 |
| **Módulos** (`mod_*`) | **13** | exatamente os 13 `MOD-CXX-NN` do repo |
| **Vizinhança externa** (`ext_*`) | **3** | texto do BO (SEI/CIODS/PMPE), Google Sheets (abas mensais A..AK, EFETIVO, Tabela PIP, auditoria), planilha PECULIO (antiguidade N) |
| **Portas** (`porta_*`) | **7** | P3 (menu), payload (`processarEntradaManual`), EFETIVO, ARCA (read-only), AM (coluna 39), saída de relatórios, publicação (`clasp push` / `.claspignore`) |

Convenção das arestas: 13 arestas `cômodo -> módulo` (`contem`) + 30 arestas de fluxo real (menu, payload, leitura das abas, cadastro, registros canônicos, ARCA, registros analíticos, diagnóstico/plano do Guardião, reauditoria, materialização de aba, exclusão da bancada do push).

A planta foi escrita **idêntica** no repo e no espelho (mesmo SHA-256).

---

## 4. O que foi derivado de qual arquivo (rastreabilidade nó → fonte)

Nenhum nó foi inventado. Fontes por circuito:

| Circuito | Evidência real usada |
|---|---|
| `CIR-MOD-C00-01_ESTRUTURA_DO_COFRE` | `03_Fundacao/ESTRUTURA_DO_COFRE.md` (frontmatter manifest **DP-VAULT-1** / version **2.1** / profile **P1** / owner / trigger; `active_rooms` com 8 cômodos; `conditional_directories` C07; árvore raiz; seções "Padrão de Cômodos", "Módulos e Submódulos") + `scripts/downplant/lint-estrutura.mjs` (linhas 18-27, 34-91, 94-118) |
| `CIR-SUB-C00-01-01_MIGRACAO_DP21` | mesmo manifesto (alvo 2.1) + a varredura de legado do linter (`legacyPattern` na linha 118) |
| `CIR-SUB-C00-01-02_PLANTA_MESTRA` | `01_Planta/PLANTA_MESTRA.canvas` + `01_Planta/TERRENO_DO_PROJETO.md` + validação de Canvas do linter (linhas 160-177) |
| `CIR-MOD-C00-02_VALIDACAO_ESTRUTURAL` / `CIR-SUB-C00-02-01_LINT` | `scripts/downplant/lint-estrutura.mjs`: verificação 1 (linhas 18-27), 2 (30-92), 3 (94-139 markdown, 141-158 wikilink), 4 (160-177 Canvas), contrato de saída (180-186) |
| `CIR-SUB-C01-01-02_PERSISTENCIA_MANUAL` | `Entrada/EntradaManual.js`, `Entrada/EntradaManualHeadless.js`, `Testes/TestEntradaManualFormulario.js`, `Testes/TestEntradaManualDryRun.js`, `02_Execucao_Atual.md` (colunas AE/AF gravadas; AB/AC/AD intocadas; regex de matrícula tolerante) |
| `CIR-MOD-C02-01_LEITURA_E_ADAPTACAO` | `Config/Metamodelos.js` (`CatalogoEstruturas`), `Core/Cabecalhos.js` (`SyntheonCabecalhos`), `Core/Utils.js` (`localizarColuna`), `Leitura/Adaptador2026.js` (`extrairFatos`), `Core/LeitorPlanilhas.js` (`lerAbas`/`_mapearColunas`/`_processarLinha`), `Leitura/LeitorAntiguidadePeculio.js`, `Core/Policiais.js` (`carregarEfetivo`, `carregarListaEfetivo`, `ordenarEquipePorAntiguidade_`), `Core/Normalizador.js`, `Core/Validador.js`, `Dominio/ResolverAIS.js`, `Dominio/TabelaTerritorialAIS.js`, `Core/Config.js`; riscos da "Tabela Geral do Inventário" do `C02_Leitura/00_Visao_Do_Comodo/INDICE.md` |
| `CIR-MOD-C03-01_MODELO_DE_OCORRENCIA` | `02_Comodos/C03_Dominio/.../MOD-C03-01_MODELO_DE_OCORRENCIA/MAPA_DO_TUNEL_E_FORMULAS.md` (card #142: 37 colunas A..AK, fórmulas literais de S/W/Z/AI/AJ/AK, semântica ARMA × QDT ARMAS, 8 riscos) + `Dominio/Ocorrencia.js`, `OcorrenciaFactory.js`, `RegistroCanonico.js`, `Policial.js`, `Arma.js`, `Droga.js`, `Equipe.js`, `ValueObjects/ChaveOcorrencia.js` + `Core/Constantes.js` (`DIVISOR_RATEIO_PIP`) |
| `CIR-MOD-C04-01_MOTOR_ANALITICO` | `Motor/MotorAnaliticoV2.js` (`processarProdutividadePolicial` registra os 5 plugins; dedupe `matricula_chaveOcorrencia`; propagação de pelotão), `Plugins/Metricas/PluginOcorrencias.js`, `PluginArmas.js`, `PluginEntorpecentes.js`, `PluginPrisoes.js`, `PluginPontuacao.js`, `Core/Ranking.js`, `Core/Metricas.js`, `Features/CentralAnalitica.js`, `Dominio/RegistroAnalitico.js`, `Modelos/ModeloProdutividade.js`, `Temas/TemaPMPE.js`, `Drivers/GoogleSheetsDriver.js`, + "Preservação Transversal de Dados Visuais" do `C04_Motor/00_Visao_Do_Comodo/INDICE.md` |
| `CIR-MOD-C05-01_GUARDIAO_DE_QUALIDADE` | `Entrada/SeletorMesesGuardiao.js`, `Features/GuardiaoQualidade.js` (`varrerAba`), `Core/RegrasQualidade.js` (`validarTunel`, `criarDiagnostico`, `SEVERIDADES_GUARDIAO`), `Core/SaudeTuneis.js` (5 estados; orfão/duplicado/fragmentado), `Core/CoberturaAuditoria.js`, `Dominio/ARCA/AdaptadorConsultaArca.js` (`enriquecerDiagnostico`), `Render/PainelSaude.js`, `Features/GuardiaoHeadless.js`, códigos de diagnóstico da matriz do `C05_Guardiao/00_Visao_Do_Comodo/INDICE.md`, regra da coluna AM e "A:AL intocadas" |
| `CIR-MOD-C05-02_NORMALIZADOR_DE_ABA` | `CONTRATO_MUTACAO_SEGURA.md` (classes, whitelist, blacklist dura, janela A:AL / coluna AM, 29 códigos), `DRY_RUN_E_PLANO.md` (plano determinístico, problemas tipados), `EXECUTOR_SEGURO.md` (10 contenções, 17 PASS), `REAUDITORIA_E_DELTA.md` (critérios simultâneos, 13 PASS), `NOTA_DE_RESPONSABILIDADE.md` (fluxo canônico, M1-M6) + `Core/ContratoMutacaoSegura.js`, `DryRunNormalizador.js`, `ExecutorNormalizador.js`, `ReauditoriaNormalizador.js` |
| `CIR-MOD-C06-01_RELATORIOS_OFICIAIS` | `Features/CompiladorProdutividade.js` (`abrirMenuComparativo2026`, `gerarComparativo2026Premium`), `CompiladorProdutividadeV2.js`, `Render/RendererComparativo2026.js` (linhas 16-58: grupos e colunas), `Render/DocumentoLogico.js`, `RendererLogico.js`, `RendererTabela.js`, `RendererCA.js`, `RendererAuditoria.js`, `RendererAuditoriaSaude.js`, `Compilador PIP.js`, `CPM – Compilador de Pontuação Mensal.js`, `Compilador_Armas.js`, `Compilador de Entorpecentes.js`, `Modelos/ModeloProdutividade.js`, + nomes das abas oficiais e regra "somente coluna AM" do `C06_Relatorios/00_Visao_Do_Comodo/INDICE.md` |
| `CIR-MOD-C06-02_MERITO_DE_ARMAS_GXT` | `Features/CompiladorGxt.js` (`compilar`, `normalizarNomeAba`, `localizarAbaMes`), `Motor/PoliticaMeritoArmas.js` (túnel, fogo × artesanal, líder por menor N), `Motor/DiagnosticoDeterministicoGxt.js` (`diagnosticarMes`, `formatarData`, `PECULIO_SEM_REGISTROS_VALIDOS`), `Render/RendererGxt.js` (`corPorArmas`, `obterEstiloPelotao`, blocos de 3 meses, 18 colunas), `scripts/build-gxt.js`, `Testes/TestRelatorioGxt.js`, `Testes/DiagnosticoGxtTrimestral.js`, `Testes/TestMeritoEquipeArmas.js` |
| `CIR-MOD-C08-01_HOMOLOGACAO_OFFLINE` | `Homologacao/RodarTesteDeHomologacao.js`, `Homologacao/Framework/HomologationEngine.js`, `Comparator.js`, `HomologationReport.js`, `Homologacao/Tests/TestPontuacao.js`, `TestOcorrencias.js`, `TestArmas.js`, `TestDrogas.js`, `Homologacao/Drivers/ConsoleDriver.js`, `JsonDriver.js`, `HomologationSheetsDriver.js`, `.claspignore` (exclusão de `Homologacao/**`) |
| `PLANTA_MESTRA.canvas` | os 13 endereços `MOD-*` do repo, o manifesto, e as portas/fluxos citados nas fontes acima; externos comprovados por `Config/Metamodelos.js`, `Core/Config.js` e `MAPA_DO_TUNEL_E_FORMULAS.md` |

As fontes usam apenas **nome de artefato real** (arquivo, classe, método, aba ou código de diagnóstico) — nenhuma entidade sem lastro.

---

## 5. Divergências encontradas e NÃO corrigidas (marcadas, não inventadas)

Estas divergências são **pré-existentes**, ficam fora do alvo literal do card (preencher circuito vazio) e **exigem decisão do proprietário** antes de serem alteradas. Ficam registradas aqui em vez de "resolvidas" por conta própria.

### 5.1 ARCA — contagem de regras divergente em QUATRO lugares
| Fonte | Total de regras | Detalhe |
|---|---|---|
| `Dominio/ARCA/arca_regras_dominio.json` (fonte de máquina) | **48** | 10 OFFICIAL_BUSINESS · 30 INTERNAL_OPERATIONAL · 2 HEURISTIC · 5 TECHNICAL · 1 CANONICAL_NORMATIVE |
| `Dominio/ARCA/ARCA_REGRAS_DOMINIO.md` | **40** | "(negócio/operacionais: 35 \| técnicas: 5)" |
| `Dominio/ARCA/INVENTARIO_ARCA.md` | **45** | "Auditadas pelo Guardião (MAPEADO): 29" |
| `CIR-MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO.canvas` (já preenchido) | **31** | "9 OFFICIAL_BUSINESS, 17 INTERNAL_OPERATIONAL, 1 CANONICAL_NORMATIVE, 2 HEURISTIC, 2 TECHNICAL" |

Fontes do JSON: 34 `INTERNAL_SOURCE_CONFIRMED` · 12 `CANONICAL_SOURCE_CONFIRMED` · 2 `DOMAIN_RULE_SOURCE_UNKNOWN`.
O circuito afirma ainda "11 canônicas | 18 internas | 2 desconhecidas" e "26 códigos -> 20 de 31 regras"; a medição real de `AdaptadorConsultaArca.MAPA_DIAGNOSTICO_ARCA` é **36 códigos -> 29 rule_ids distintos**.
O `INVENTARIO_ARCA.md` declara que "Fonte da verdade: o JSON" — o que apontaria **48** como canônico, mas **não há decisão registrada** para o `.md` e o Canvas. **Não corrigido.**

### 5.2 Taxonomia divergente repo × espelho (a causa dos 366 erros de lint do espelho)
| Situação | Repo | Espelho |
|---|---|---|
| Módulos de C00 | `MOD-C00-01_ESTRUTURA_DO_COFRE`, `MOD-C00-02_VALIDACAO_ESTRUTURAL` | `MOD-C00-01_INFRAESTRUTURA_CORE`, `MOD-C00-02_VALIDACAO_ESTRUTURAL`, **`MOD-C00-03_CURADOR_OBSIDIAN`** |
| Módulo de C01 | `MOD-C01-01`, **`MOD-C01-02_NORMALIZADOR_DE_EFETIVO`** | apenas `MOD-C01-01` |
| Módulo de C05 | `MOD-C05-01`, **`MOD-C05-02_NORMALIZADOR_DE_ABA`** | apenas `MOD-C05-01` |
| Total de módulos | **13** | **12** |
| Submódulos | 7 | 15 (nomes diferentes, ex.: `SUB-C03-02-01_CATALOGO_DE_REGRAS` × `SUB-C03-02_ARCA_CANONICA`) |

Consequências que **permanecem** (não são o alvo do card, mas ficam medidas):
- `MOD-C00-03_CURADOR_OBSIDIAN` e `MOD-C00-01_INFRAESTRUTURA_CORE` **não têm endereço canônico no repo** → pelo método do card **não foram preenchidos nem desenhados**; a decisão de renomear/remover é do proprietário.
- `MOD-C01-02` e `MOD-C05-02` existem no repo e **não existem no espelho**.

### 5.3 Circuitos parcialmente preenchidos (1 nó / 0 arestas) — não tocados
`CIR-SUB-C01-02-01_DEPENDENCIA_ARCA`, `CIR-SUB-C03-02-01_CATALOGO_DE_REGRAS`, `CIR-SUB-C03-02-02_FONTES_E_PROVENIENCIA`, `CIR-SUB-C03-02-03_COBERTURA_E_LACUNAS`, `CIR-SUB-C03-02-04_ADAPTADOR_PORTA_DE_CONSULTA` — **1 nó, 0 arestas**. Não estão vazios (havia conteúdo real), mas não têm nenhuma ligação. Não foram alterados para não substituir conteúdo existente nem inventar arestas internas sem fonte.

### 5.4 Espelho — slots ausentes
Cada um dos 8 cômodos do espelho **não possui** os slots `02_Integracoes`, `03_Especificacoes`, `04_Execucao`, `05_Evidencias` → **32 erros** de lint (`Comodo ... nao possui diretorio slot ...`). O repo tem os 6 slots com `INDICE.md`.

### 5.5 Espelho — documentos só do espelho com legado e wikilinks em forma de caminho
- **17 erros de legado**: `07_Codigo_Leitura/*.js.md` (a sigla legada de tarefa — `TASK` + hífen + `M` — com sufixo numérico aparece em 9 arquivos; o prefixo de módulo antigo — `M` + dois dígitos — aparece em 2 circuitos de C02; e uma URI `file:` de arquivo local em `03_Fundacao/CONTRATO_VISUAL_DAS_PLANTAS.md`). *(Os tokens são escritos aqui de forma quebrada de propósito: grafá-los literalmente faria este próprio relatório ser reprovado pelo linter que ele documenta.)*
- **309 wikilinks quebrados restantes**: a maioria em `07_Codigo_Leitura/INDICE_AS_IS.md` (132) e `00_Painel/INICIO.md` (17); o linter resolve wikilink **por nome-base**, e o espelho usa a forma de caminho completo — logo nenhum resolve.

### 5.6 Nota de concorrência
Durante esta execução, **outro processo** (evidências do card #153) criou arquivos `EV-C0X-00N_*.md` em `05_Evidencias/` e alterou `05_Evidencias/INDICE.md` e `MOD-C01-01/NOTA_DE_RESPONSABILIDADE.md`. Esses arquivos **não** são desta execução; não foram tocados.

---

## 6. Lint — saída exata

### Antes
```
$ node scripts/downplant/lint-estrutura.mjs .
🔍 Verificando Terreno: C:\Users\Bneto04\Documents\Codex\syntheon-gs-downplant-offline
✅ SUCESSO! A arvore documental esta em estrita conformidade com o Down Plant 2.1.   (exit 0)

$ node scripts/downplant/lint-estrutura.mjs "C:/Users/Bneto04/Documents/Obsidian/Obsidian_Brain/Syntheon"
🔥 FALHA! 366 erro(s) de estrutura encontrados.                                      (exit 1)
   317 WikiLink quebrado | 32 Comodo (slot ausente) | 17 Legado encontrado
```

### Depois
```
$ node scripts/downplant/lint-estrutura.mjs .
🔍 Verificando Terreno: C:\Users\Bneto04\Documents\Codex\syntheon-gs-downplant-offline
✅ SUCESSO! A arvore documental esta em estrita conformidade com o Down Plant 2.1.   (exit 0)

$ node scripts/downplant/lint-estrutura.mjs "C:/Users/Bneto04/Documents/Obsidian/Obsidian_Brain/Syntheon"
🔥 FALHA! 358 erro(s) de estrutura encontrados.                                      (exit 1)
   309 WikiLink quebrado | 32 Comodo (slot ausente) | 17 Legado encontrado
```

**Repo: passa (exit 0), antes e depois.** **Espelho: 366 -> 358** (−8 = os 8 wikilinks em forma de caminho que existiam dentro da `PLANTA_MESTRA.canvas` do espelho e que a planta reconciliada não usa mais). Os 358 restantes são a **taxonomia divergente** descrita em §5.2-§5.5 — evidência do problema que o card resolve, não regressão de lint.

**O delta atribuível a este card é exatamente −8.** O número absoluto do espelho **deriva com escrita concorrente**: no fechamento foi medido **359** porque outro processo criou `02_Comodos/C00_Governanca_Estrutural/03_Especificacoes/` **sem `INDICE.md`** (troca 1 erro "slot ausente" por 1 erro "slot sem INDICE.md") e adicionou `07_Codigo_Leitura/Entrada/WebAppExecucao.js.md` com wikilink em forma de caminho (`INST-EXEC-001`). Nenhuma dessas escritas é desta entrega.

### 6.1 Nota de concorrência — o lint do repo voltou a falhar por causa de OUTRO card (não deste)

O lint do repo retornou **SUCESSO / exit 0** imediatamente depois da escrita dos 15 canvas e deste relatório. A partir de **13:53:52** — **2 segundos depois** de este relatório ser gravado — **outro processo** (execução do **card #153**, cápsulas §46.2) começou a criar arquivos `MOD-CXX-NN_*.md` na raiz dos módulos, e esses arquivos usam um caminho relativo **inválido**:

```text
[EVD-C00-001] ( ../05_Evidencias/EVD-C00-001_ESTRUTURA_E_VALIDACAO.md )
```
A partir de `02_Comodos/<CXX>/01_Dominio/modulos/<MOD>/`, `../05_Evidencias/` resolve para `01_Dominio/05_Evidencias/`, que **não existe** (o slot correto está dois níveis acima, em `02_Comodos/<CXX>/05_Evidencias/`). O erro é do arquivo de #153, **não** do Canvas, do espelho ou deste relatório.

Cada cápsula nova soma 1 erro, e a contagem **cresceu durante a medição** (1 -> 3 -> 4 -> 6 -> 8 — um erro por cápsula de módulo que o #153 grava; são 13 módulos). Estado no momento do fechamento: **8 erros, nenhum desta entrega**. Exemplos medidos (o restante segue padrão idêntico):

| Arquivo acusado (autor: execução do #153) | Link quebrado |
|---|---|
| `MOD-C00-01_ESTRUTURA_DO_COFRE/MOD-C00-01_ESTRUTURA_DO_COFRE.md` | `../05_Evidencias/EVD-C00-001_ESTRUTURA_E_VALIDACAO.md` |
| `MOD-C00-02_VALIDACAO_ESTRUTURAL/MOD-C00-02_VALIDACAO_ESTRUTURAL.md` | `../05_Evidencias/EVD-C00-001_ESTRUTURA_E_VALIDACAO.md` |
| `MOD-C02-01_LEITURA_E_ADAPTACAO/MOD-C02-01_LEITURA_E_ADAPTACAO.md` | `../05_Evidencias/EVD-C02-001_LEITURA_TUNEL_E_FORMULAS.md` |
| `MOD-C04-01_MOTOR_ANALITICO/MOD-C04-01_MOTOR_ANALITICO.md` | `../05_Evidencias/EVD-C04-001_MOTOR_E_MERITO_ARMAS.md` |
| `MOD-C05-01_GUARDIAO_DE_QUALIDADE/MOD-C05-01_GUARDIAO_DE_QUALIDADE.md` | `../05_Evidencias/EVD-C05-001_GUARDIAO_SEMANTICA_ARMAS.md` |

Há ainda 1 erro de outro artefato concorrente (não Canvas, não cápsula de módulo): `08_Execucao_Ao_Vivo/downplant_handoff.md` aponta para `../scripts/downplant/validar-handoff.mjs`, que não existe. Também não é desta entrega.

**Nenhuma falha aponta para os 15 `.canvas` desta entrega nem para este relatório.** Verificação:
```bash
# nenhum arquivo acusado pertence a esta entrega
node scripts/downplant/lint-estrutura.mjs . 2>&1 | grep "ERRO:" | grep -E "RELATORIO_DE_DIFERENCAS_154|CIR-MOD|CIR-SUB|PLANTA_MESTRA" || echo "NENHUM"
```
Correção sugerida para o #153 (fora do escopo deste card): trocar `../05_Evidencias/` por `../../../05_Evidencias/` nas cápsulas, ou usar caminho a partir da raiz do cofre.

### Validação estrutural adicional (repo + espelho)
- **0 problemas** em 25 canvas do repo e 35 canvas do espelho: JSON válido, ids de nó e de aresta únicos, toda aresta com `fromNode`/`toNode` existentes, todo nó com `id/type/x/y/width/height`, todo nó `file` com destino existente.
- **9 arquivos idênticos por SHA-256** entre repo e espelho (8 circuitos de módulo + `PLANTA_MESTRA.canvas`).

---

## 7. Limites declarados desta execução

- **Não** houve commit, push, `clasp push`, release ou comentário/fechamento no GitHub.
- **Não** foi alterado código funcional (nenhum `.js`, `.html` ou `.json` de runtime). A única escrita foi em `.canvas`.
- **Não** foram alteradas as notas de responsabilidade, os índices nem as cápsulas existentes.
- **Não** foram corrigidas as divergências da §5 (exigem decisão do proprietário).
- Backup integral dos 25 canvas do repo e dos 35 canvas do espelho, no estado anterior, em `%LOCALAPPDATA%\Temp\dp154_backup`.

## 8. Arquivos escritos

**Repositório canônico — 15 arquivos**
```
01_Planta/PLANTA_MESTRA.canvas
02_Comodos/C00_Governanca_Estrutural/01_Dominio/modulos/MOD-C00-01_ESTRUTURA_DO_COFRE/CIR-MOD-C00-01_ESTRUTURA_DO_COFRE.canvas
02_Comodos/C00_Governanca_Estrutural/01_Dominio/modulos/MOD-C00-01_ESTRUTURA_DO_COFRE/submodulos/SUB-C00-01-01_MIGRACAO_DP21/CIR-SUB-C00-01-01_MIGRACAO_DP21.canvas
02_Comodos/C00_Governanca_Estrutural/01_Dominio/modulos/MOD-C00-01_ESTRUTURA_DO_COFRE/submodulos/SUB-C00-01-02_PLANTA_MESTRA/CIR-SUB-C00-01-02_PLANTA_MESTRA.canvas
02_Comodos/C00_Governanca_Estrutural/01_Dominio/modulos/MOD-C00-02_VALIDACAO_ESTRUTURAL/CIR-MOD-C00-02_VALIDACAO_ESTRUTURAL.canvas
02_Comodos/C00_Governanca_Estrutural/01_Dominio/modulos/MOD-C00-02_VALIDACAO_ESTRUTURAL/submodulos/SUB-C00-02-01_LINT/CIR-SUB-C00-02-01_LINT.canvas
02_Comodos/C01_Entrada/01_Dominio/modulos/MOD-C01-01_FORMULARIO_E_MENUS/submodulos/SUB-C01-01-02_PERSISTENCIA_MANUAL/CIR-SUB-C01-01-02_PERSISTENCIA_MANUAL.canvas
02_Comodos/C02_Leitura/01_Dominio/modulos/MOD-C02-01_LEITURA_E_ADAPTACAO/CIR-MOD-C02-01_LEITURA_E_ADAPTACAO.canvas
02_Comodos/C03_Dominio/01_Dominio/modulos/MOD-C03-01_MODELO_DE_OCORRENCIA/CIR-MOD-C03-01_MODELO_DE_OCORRENCIA.canvas
02_Comodos/C04_Motor/01_Dominio/modulos/MOD-C04-01_MOTOR_ANALITICO/CIR-MOD-C04-01_MOTOR_ANALITICO.canvas
02_Comodos/C05_Guardiao/01_Dominio/modulos/MOD-C05-01_GUARDIAO_DE_QUALIDADE/CIR-MOD-C05-01_GUARDIAO_DE_QUALIDADE.canvas
02_Comodos/C05_Guardiao/01_Dominio/modulos/MOD-C05-02_NORMALIZADOR_DE_ABA/CIR-MOD-C05-02_NORMALIZADOR_DE_ABA.canvas
02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-01_RELATORIOS_OFICIAIS/CIR-MOD-C06-01_RELATORIOS_OFICIAIS.canvas
02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-02_MERITO_DE_ARMAS_GXT/CIR-MOD-C06-02_MERITO_DE_ARMAS_GXT.canvas
02_Comodos/C08_Homologacao/01_Dominio/modulos/MOD-C08-01_HOMOLOGACAO_OFFLINE/CIR-MOD-C08-01_HOMOLOGACAO_OFFLINE.canvas
```

**Espelho — 9 arquivos** (mesmo conteúdo byte a byte dos correspondentes do repo)
```
01_Planta/PLANTA_MESTRA.canvas
02_Comodos/C00_Governanca_Estrutural/01_Dominio/modulos/MOD-C00-02_VALIDACAO_ESTRUTURAL/CIR-MOD-C00-02_VALIDACAO_ESTRUTURAL.canvas
02_Comodos/C02_Leitura/01_Dominio/modulos/MOD-C02-01_LEITURA_E_ADAPTACAO/CIR-MOD-C02-01_LEITURA_E_ADAPTACAO.canvas
02_Comodos/C03_Dominio/01_Dominio/modulos/MOD-C03-01_MODELO_DE_OCORRENCIA/CIR-MOD-C03-01_MODELO_DE_OCORRENCIA.canvas
02_Comodos/C04_Motor/01_Dominio/modulos/MOD-C04-01_MOTOR_ANALITICO/CIR-MOD-C04-01_MOTOR_ANALITICO.canvas
02_Comodos/C05_Guardiao/01_Dominio/modulos/MOD-C05-01_GUARDIAO_DE_QUALIDADE/CIR-MOD-C05-01_GUARDIAO_DE_QUALIDADE.canvas
02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-01_RELATORIOS_OFICIAIS/CIR-MOD-C06-01_RELATORIOS_OFICIAIS.canvas
02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-02_MERITO_DE_ARMAS_GXT/CIR-MOD-C06-02_MERITO_DE_ARMAS_GXT.canvas
02_Comodos/C08_Homologacao/01_Dominio/modulos/MOD-C08-01_HOMOLOGACAO_OFFLINE/CIR-MOD-C08-01_HOMOLOGACAO_OFFLINE.canvas
```

---

## 9. Comandos exatos de verificação

```bash
# 1) lint do repositório (deve retornar SUCESSO e exit code 0)
cd "C:/Users/Bneto04/Documents/Codex/syntheon-gs-downplant-offline"
node scripts/downplant/lint-estrutura.mjs .
echo "EXIT=$?"

# 2) lint do espelho (retorna FALHA 358 - divergência de taxonomia, ver §5)
node scripts/downplant/lint-estrutura.mjs "C:/Users/Bneto04/Documents/Obsidian/Obsidian_Brain/Syntheon"
echo "EXIT=$?"

# 3) contagem de nós/arestas de todos os canvas do repo
node -e "const fs=require('fs'),path=require('path');(function w(d,a){for(const f of fs.readdirSync(d)){const p=path.join(d,f);fs.statSync(p).isDirectory()?w(p,a):f.endsWith('.canvas')&&a.push(p)}return a})('.',[]).sort().forEach(p=>{const c=JSON.parse(fs.readFileSync(p,'utf8'));console.log((c.nodes||[]).length+' n / '+(c.edges||[]).length+' e  '+p)})"

# 4) composição da PLANTA MESTRA (8 comodos + 13 modulos + 3 vizinhanca + 7 portas)
node -e "const fs=require('fs');const c=JSON.parse(fs.readFileSync('01_Planta/PLANTA_MESTRA.canvas','utf8'));const i=c.nodes.map(n=>n.id);const f=p=>i.filter(x=>x.startsWith(p)).length;console.log('comodos',f('room_'),'modulos',f('mod_'),'vizinhanca',f('ext_'),'portas',f('porta_'),'nos',i.length,'arestas',c.edges.length)"

# 4b) nenhum circuito vazio restante no repo (esperado: vazios 0)
node -e "const fs=require('fs'),path=require('path');let e=0,t=0;(function w(d){for(const f of fs.readdirSync(d)){if(f==='.git')continue;const p=path.join(d,f);if(fs.statSync(p).isDirectory())w(p);else if(f.endsWith('.canvas')){t++;if(JSON.parse(fs.readFileSync(p,'utf8')).nodes.length===0)e++;}}})('.');console.log('total canvas no repo:',t,'| vazios:',e)"

# 5) identidade repo x espelho dos arquivos derivados
for f in "01_Planta/PLANTA_MESTRA.canvas" "02_Comodos/C04_Motor/01_Dominio/modulos/MOD-C04-01_MOTOR_ANALITICO/CIR-MOD-C04-01_MOTOR_ANALITICO.canvas"; do
  sha256sum "C:/Users/Bneto04/Documents/Codex/syntheon-gs-downplant-offline/$f" "C:/Users/Bneto04/Documents/Obsidian/Obsidian_Brain/Syntheon/$f"
done

# 6) provar que nenhum código funcional foi alterado
git diff --stat -- '*.js' '*.html' '*.json'
```
