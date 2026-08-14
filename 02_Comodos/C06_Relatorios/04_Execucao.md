# C06 â€” RelatÃ³rios Oficiais e FormataÃ§Ã£o Visual (Tasks)

> **Documento:** `02_Comodos/03_TASKS/M06_TASKS.md`  
> **Status da Sprint:** SPRINT C06 CONCLUÃDA E HOMOLOGADA  
> **Contexto:** Ecossistema SynthÃ©on GS Down Plant Offline  

---

## ðŸŽ¯ Lista Integrada de Tarefas do C06

### [CONCLUÃDO] TASK-C06.1-01C â€” CorreÃ§Ã£o e HomologaÃ§Ã£o Fiel das FunÃ§Ãµes ExecutÃ¡veis do InventÃ¡rio
- SubstituÃ­da a `TASK-C06.1-01B` pela **`TASK-C06.1-01C`**.
- Atualizados `02_Comodos/01_SPRINTS/SPRINT_M06_RELATORIOS.md` e `02_Comodos/02_SPECS/M06_RELATORIOS_SPEC.md` com os nomes executÃ¡veis reais verificados no cÃ³digo.
- Separados Compiladores Visuais de ApresentaÃ§Ã£o dos Motores/MÃ©tricas Internas.

### [CONCLUÃDO] TASK-C06.1-02 â€” EstilizaÃ§Ã£o e FormataÃ§Ã£o Visual da Aba [AUDITORIA] Ocorrencias
- Atualizado `Render/RendererAuditoriaSaude.js` implementando o mÃ©todo `estilizarAbaAuditoria_`.
- Aplicada a paleta de severidades exclusiva (`CRITICO` `#D9534F`, `ALERTA` `#F0AD4E`, `OBSERVACAO` `#5BC0DE`, `EXCECAO MANUAL` `#6F42C1`, `ERRO TECNICO` `#900C3F`, `APROVADO` `#28A745`) na coluna 4 (SEVERIDADE).
- Aplicado tÃ­tulo Azul Escuro (`#1C3144`), cabeÃ§alho Azul MÃ©dio (`#2C4257`), congelamento de painÃ©is (`setFrozenRows(5)`), zebrado suave e larguras de colunas recomendadas.
- Preservados 100% intocados os relatÃ³rios oficiais de produtividade (Comparativo, PIP, Armas, Drogas e CPM).

### [CONCLUÃDO] TASK-C06.1-03 â€” EstilizaÃ§Ã£o e FormataÃ§Ã£o Visual da Aba [HISTORICO] Auditoria Ocorrencias
- Atualizado `Render/RendererAuditoriaSaude.js` implementando o mÃ©todo `estilizarAbaHistorico_`.
- Mantido o histÃ³rico estritamente cumulativo (sem limpar, reordenar ou sobrescrever registros).
- Aplicado cabeÃ§alho Azul MÃ©dio (`#2C4257`), fonte branca em negrito centralizado e congelada **apenas a linha 1** (`setFrozenRows(1)`).
- Aplicada a paleta de severidade **exclusivamente na coluna 5** (SEVERIDADE no histÃ³rico) para todas as linhas acumuladas.
- Centralizadas as colunas 1 a 6 e alinhamento explÃ­cito Ã  esquerda nas colunas 7 a 9.
- Aplicadas larguras recomendadas (`160, 120, 180, 70, 140, 210, 320, 320, 320`) e zebrado discreto nas linhas pares.

### [CONCLUÃDO] TASK-C06.1-04 â€” PadronizaÃ§Ã£o Visual das Abas Mensais e PreservaÃ§Ã£o da Coluna AM
- Atualizados `Features/GuardiaoQualidade.js` e `Render/RendererAuditoriaSaude.js` implementando `aplicarDestaquesAlertasAM_(sheet, idx.alerta, saida)`.
- Chamada explÃ­cita passando a referÃªncia real `idx.alerta` (0-based) e `saida`, eliminando qualquer inferÃªncia da "Ãºltima coluna da aba".
- Aplicado destaque visual discreto **exclusivamente na cÃ©lula AM (Coluna 39)** das linhas operacionais com alerta (`fundo #FFF3CD`, `fonte #856404`, `negrito`).
- Validadas planilhas fictÃ­cias com colunas adicionais apÃ³s AM no Teste 25, garantindo que o destaque permanece na coluna 39 e nÃ£o vaza para colunas posteriores.
- Garantida a preservaÃ§Ã£o integral e intocada das cores, zebrados, bordas, fÃ³rmulas e dados operacionais das colunas A atÃ© AL (1 a 38).

### [CONCLUÃDO] TASK-C06.1-05 â€” SuÃ­te de Testes Visuais e HomologaÃ§Ã£o Offline do C06
- Criada a suÃ­te dedicada `Testes/TestRenderers.js` para validaÃ§Ã£o de regressÃ£o visual dos renderizadores.
- Integrada em `Testes/RodarTodosOsTestes.js` com a suÃ­te global expandida para **72 testes** (15 DomÃ­nio + 10 Plugins + 6 RegressÃ£o V2 + 8 Adaptador 2026 + 27 GuardiÃ£o + 4 Renderizadores + 2 Central AnalÃ­tica), todos 100% aprovados.
- Elaborado o roteiro e protocolo oficial de homologaÃ§Ã£o offline em `02_Comodos/M06_RELATORIOS_HOMOLOGACAO.md`.



## Extrato de MOD-C06-01_Sprint.md

# Sprint C06 Ã¢â‚¬â€ RelatÃƒÂ³rios Oficiais e FormataÃƒÂ§ÃƒÂ£o Visual

> **Documento:** `02_Comodos/01_SPRINTS/SPRINT_M06_RELATORIOS.md`  
> **Status:** TASK-C06.1-01C CONCLUÃƒÂDA  
> **Contexto:** Ecossistema SynthÃƒÂ©on GS Down Plant Offline  

---

## Ã°Å¸Å½Â¯ Objetivo da Sprint

Padronizar a apresentaÃƒÂ§ÃƒÂ£o visual, estrutura de tabelas, estilos de cabeÃƒÂ§alho, formataÃƒÂ§ÃƒÂ£o numÃƒÂ©rica e geraÃƒÂ§ÃƒÂ£o de relatÃƒÂ³rios do ecossistema SynthÃƒÂ©on em ambiente offline, separando rigorosamente os **RelatÃƒÂ³rios Oficiais de Produtividade** dos **RelatÃƒÂ³rios de Apoio e Auditoria**, com base no inventÃƒÂ¡rio de funÃƒÂ§ÃƒÂµes executÃƒÂ¡veis 100% verificado no cÃƒÂ³digo do projeto.

---

## Ã°Å¸â€œÅ  ClassificaÃƒÂ§ÃƒÂ£o dos RelatÃƒÂ³rios

### 1. RelatÃƒÂ³rios Oficiais de Produtividade
RelatÃƒÂ³rios institucionais que utilizam a paleta operacional oficial (Cores de PelotÃƒÂµes/Oficiais e Legenda de Armas).
- **COMPARATIVO_2026**
- **PIP (Compilador PIP | Ciclo 29Ã¢â‚¬â€œ28)**
- **CPM (Compilador de PontuaÃƒÂ§ÃƒÂ£o Mensal | MÃƒÂªs civil)**
- **RELATÃƒâ€œRIO DE ARMAS**
- **RELATÃƒâ€œRIO DE ENTORPECENTES (DROGAS)**

### 2. RelatÃƒÂ³rios de Apoio e DiagnÃƒÂ³stico
RelatÃƒÂ³rios tÃƒÂ©cnicos gerados pelo GuardiÃƒÂ£o da Qualidade que utilizam a paleta exclusiva de severidades.
- **`[AUDITORIA] Ocorrencias`** (ÃƒÅ¡ltima varredura de saÃƒÂºde da aba)
- **`[HISTORICO] Auditoria Ocorrencias`** (Registro histÃƒÂ³rico cumulativo)

---

## Ã°Å¸â€œâ€¹ Tabela de InventÃƒÂ¡rio Real de FunÃƒÂ§ÃƒÂµes ExecutÃƒÂ¡veis no CÃƒÂ³digo

| RelatÃƒÂ³rio | Menu / FunÃƒÂ§ÃƒÂµes ExecutÃƒÂ¡veis Reais | Compilador Visual (ApresentaÃƒÂ§ÃƒÂ£o) | Motor / MÃƒÂ©trica Interna | Aba(s) de SaÃƒÂ­da Real(is) | Fonte de Dados | PerÃƒÂ­odo | MÃƒÂ©tricas ObrigatÃƒÂ³rias | Status da Regra Visual |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **COMPARATIVO_2026** | `abrirMenuComparativo2026()`, `gerarComparativo2026Premium()` | `Features/CompiladorProdutividade.js` $\rightarrow$ `Render/RendererComparativo2026.js` | Motor V2 (`SyntheonLeitor`, `SyntheonMetricas`) | `COMPARATIVO_2026` | Abas mensais (`JAN2026`..`DEZ2026`) + `EFETIVO` | Anual / SeleÃƒÂ§ÃƒÂ£o 2026 | Qtd. OcorrÃƒÂªncias, PontuaÃƒÂ§ÃƒÂ£o Rateada, Qtd. Armas, Entorpecentes Total (g) | **IMPLEMENTADA NO CÃƒâ€œDIGO ATUAL** (Cores PelotÃƒÂµes, GTAR, Escala Armas, Carimbo, Formatos `#,##0.00`) |
| **PIP** | `criarMenuPip_()`, `abrirMenuPipMensal()`, `abrirMenuPipLivre()`, `gerarPipAnual()` | `Compilador PIP.js` (`criarAbaResultado_()`) | Motor V2 (`SyntheonMetricas`, `SyntheonRanking`) | `PIP_<perÃƒÂ­odo>`, `PIP_ANUAL_2026`, `PIP_SELECAO_LIVRE` | Abas mensais (`JAN`..`DEZ`) + `EFETIVO` | Ciclo 29 do mÃƒÂªs anterior a 28 do mÃƒÂªs | Rank, GraduaÃƒÂ§ÃƒÂ£o, MatrÃƒÂ­cula, Nome Completo, DesignaÃƒÂ§ÃƒÂ£o, PontuaÃƒÂ§ÃƒÂ£o, Qtd. Oc. | **CONTRATO VISUAL A IMPLEMENTAR NO C06** (Possui cabeÃƒÂ§alho verde `#D9EAD3` e formato `#,##0.00`) |
| **CPM** | `criarMenuCPM_()`, `abrirMenuCPMMensal()`, `abrirMenuCPMLivre()`, `gerarCPMAnual()` | `CPM Ã¢â‚¬â€œ Compilador de PontuaÃƒÂ§ÃƒÂ£o Mensal.js` (`criarAbaResultadoCPM_()`) | Motor V2 (`SyntheonRanking`, `pontosCPM`) | `CPM_<mes>`, `CPM_ANUAL_2026`, `CPM_SELECAO_LIVRE` | Abas mensais (`JAN`..`DEZ`) + `EFETIVO` | MÃƒÂªs Civil (dia 1Ã‚Âº ao ÃƒÂºltimo dia) | Rank, GraduaÃƒÂ§ÃƒÂ£o, MatrÃƒÂ­cula, Nome Completo, OcorrÃƒÂªncias, PontuaÃƒÂ§ÃƒÂ£o | **CONTRATO VISUAL A IMPLEMENTAR NO C06** (Possui cabeÃƒÂ§alho verde `#D9EAD3` e formato `#,##0.00`) |
| **ARMAS** | `criarMenuArmas_()`, `abrirMenuSelecaoLivre()` | `Compilador_Armas.js` (Inline no compilador) | Acumulador por MatrÃƒÂ­cula (conceitual `PluginArmas`) | `COMP_ARMAS_2026`, `COMP_ARMAS_<perÃƒÂ­odo>` | Abas mensais operacionais (`JAN`..`DEZ`) | Mensal / SeleÃƒÂ§ÃƒÂ£o / Anual | PelotÃƒÂ£o, GraduaÃƒÂ§ÃƒÂ£o, MatrÃƒÂ­cula, Policial, Score Acumulado (Armas) | **CONTRATO VISUAL A IMPLEMENTAR NO C06** (Tem cores bÃƒÂ¡sicas de PelotÃƒÂ£o; falta escala de armas e GTAR) |
| **DROGAS** | `criarMenuDrogas_()`, `abrirMenuSelecaoLivreDrogas()` | `Compilador de Entorpecentes.js` (Inline no compilador) | Acumulador por MatrÃƒÂ­cula (conceitual `PluginEntorpecentes`) | `COMP_DROGAS_2026`, `COMP_DROGAS_<perÃƒÂ­odo>` | Abas mensais operacionais (`JAN`..`DEZ`) | Mensal / SeleÃƒÂ§ÃƒÂ£o / Anual | PosiÃƒÂ§ÃƒÂ£o, PelotÃƒÂ£o, GraduaÃƒÂ§ÃƒÂ£o, MatrÃƒÂ­cula, Policial, Maconha (g), CocaÃƒÂ­na (g), Total (g), OcorrÃƒÂªncias, BOEs | **CONTRATO VISUAL A IMPLEMENTAR NO C06** (Tem cores bÃƒÂ¡sicas de PelotÃƒÂ£o; falta GTAR e formato `#,##0.00`g) |
| **AUDITORIA** | GuardiÃƒÂ£o $\rightarrow$ Auditar Aba | `Features/GuardiaoQualidade.js` $\rightarrow$ `Render/RendererAuditoriaSaude.js` | Motor do GuardiÃƒÂ£o (`Core/RegrasQualidade.js`) | `[AUDITORIA] Ocorrencias` | Aba mensal selecionada | InstÃƒÂ¢ncia Atual | 8 Colunas de DiagnÃƒÂ³stico, Resumo de SaÃƒÂºde | **CONTRATO VISUAL A IMPLEMENTAR NO C06** (EstilizaÃƒÂ§ÃƒÂ£o de cores por severidade, congelamento e zebrado) |
| **HISTORICO_AUDITORIA** | GuardiÃƒÂ£o $\rightarrow$ Auditar Aba | `Features/GuardiaoQualidade.js` $\rightarrow$ `Render/RendererAuditoriaSaude.js` | Motor do GuardiÃƒÂ£o (`Core/RegrasQualidade.js`) | `[HISTORICO] Auditoria Ocorrencias` | HistÃƒÂ³rico acumulado | Cumulativo | 9 Colunas de DiagnÃƒÂ³stico + Data/Hora | **CONTRATO VISUAL A IMPLEMENTAR NO C06** (Zebrado cumulativo e destaque na coluna de severidade) |

---

## Ã°Å¸â€ºâ€˜ Regras de GovernanÃƒÂ§a e Diretrizes Absolutas

1. **DistinÃƒÂ§ÃƒÂ£o entre Compilador Visual e Motor Interno:** Os arquivos `Compilador PIP.js`, `Compilador_Armas.js`, `Compilador de Entorpecentes.js`, `CPM Ã¢â‚¬â€œ Compilador de PontuaÃƒÂ§ÃƒÂ£o Mensal.js` e `Features/CompiladorProdutividade.js` sÃƒÂ£o os **compiladores/geradores de apresentaÃƒÂ§ÃƒÂ£o visual** dos relatÃƒÂ³rios. Os componentes `PluginArmas` e `PluginEntorpecentes` pertencem exclusivamente ao motor matemÃƒÂ¡tico interno V2.
2. **Central AnalÃƒÂ­tica Suspensa:** A Central AnalÃƒÂ­tica permanece estritamente suspensa (`SUSPENSA`). Nenhuma chamada ou consolidador ativo da Central AnalÃƒÂ­tica deve ser incluÃƒÂ­do nesta sprint.
3. **Isolamento da Paleta de Severidades:** A paleta de severidades de auditoria (`CRITICO`, `ALERTA`, `OBSERVACAO`, `EXCECAO MANUAL`) pertence **exclusivamente aos relatÃƒÂ³rios de apoio** (`[AUDITORIA]` e `[HISTORICO]`). Ela **jamais pode substituir ou alterar a paleta oficial consagrada** dos relatÃƒÂ³rios de produtividade (Comparativo, PIP, Armas, Drogas e CPM).
4. **PreservaÃƒÂ§ÃƒÂ£o Visual da Coluna AM:** A escrita de alertas na Coluna AM (`Alerta Integridade`) das abas mensais **nÃƒÂ£o pode limpar ou resetar as formataÃƒÂ§ÃƒÂµes estruturais das linhas** (zebrado, bordas, fontes); ela deve aplicar ou remover **exclusivamente o seu prÃƒÂ³prio destaque de alerta na cÃƒÂ©lula AM**.
5. **PreservaÃƒÂ§ÃƒÂ£o de Dados Operacionais:** Os renderizadores tratam formataÃƒÂ§ÃƒÂ£o visual (cores, bordas, fontes, alinhamentos e formatos numÃƒÂ©ricos) sem alterar os dados operacionais brutos.
6. **Limite Estrito de Arquivos:** Respeitar o teto mÃƒÂ¡ximo de **5 arquivos modificados por turno/checkpoint**. Se uma demanda exigir a alteraÃƒÂ§ÃƒÂ£o de mais de 5 arquivos, o executor deve **solicitar autorizaÃƒÂ§ÃƒÂ£o prÃƒÂ©via ao usuÃƒÂ¡rio**.
7. **Zero Push Rule:** Mantida a restriÃƒÂ§ÃƒÂ£o total de execuÃƒÂ§ÃƒÂ£o de `git push` ou `clasp push`.

---

## Ã°Å¸â€”â€œÃ¯Â¸Â Planejamento de Entregas

- `TASK-C06.1-01C`: InventÃƒÂ¡rio Fiel com FunÃƒÂ§ÃƒÂµes ExecutÃƒÂ¡veis Reais do CÃƒÂ³digo (**CONCLUÃƒÂDA**).
- `TASK-C06.1-02`: EstilizaÃƒÂ§ÃƒÂ£o e FormataÃƒÂ§ÃƒÂ£o Visual de `[AUDITORIA] Ocorrencias`.
- `TASK-C06.1-03`: EstilizaÃƒÂ§ÃƒÂ£o e FormataÃƒÂ§ÃƒÂ£o Visual de `[HISTORICO] Auditoria Ocorrencias`.
- `TASK-C06.1-04`: PadronizaÃƒÂ§ÃƒÂ£o Visual das Abas Mensais Operacionais e Destaques da Coluna AM sem perda de formataÃƒÂ§ÃƒÂ£o estrutural.
- `TASK-C06.1-05`: SuÃƒÂ­te de Testes Visuais e HomologaÃƒÂ§ÃƒÂ£o Offline do C06.



## Extrato de MOD-C06-02_Execucao.md

# C06 Ã¢â‚¬â€ RelatÃƒÂ³rios Oficiais e PadronizaÃƒÂ§ÃƒÂ£o Visual (Tasks)

> **Documento:** `02_Comodos/03_TASKS/C06.2_TASKS.md`  
> **Status da Sprint:** EM HOMOLOGAÃƒâ€¡ÃƒÆ’O MANUAL (TASK-C06-06B Instalada na CÃƒÂ³pia | 85/85 Testes Passando)  
> **Contexto:** Ecossistema SynthÃƒÂ©on GS Down Plant Offline  

---

## Ã°Å¸Å½Â¯ Lista Integrada de Tarefas da Sprint C06

### [CONCLUÃƒÂDO] TASK-C06-01 Ã¢â‚¬â€ Captura do Contrato Visual Atual dos RelatÃƒÂ³rios Oficiais
- Mapeadas as funÃƒÂ§ÃƒÂµes executÃƒÂ¡veis reais, abas geradas, colunas, perÃƒÂ­odos e regras protegidas para os 5 relatÃƒÂ³rios oficiais (`COMPARATIVO_2026`, `PIP`, `CPM`, `ARMAS`, `DROGAS`).
- Registrada a intocabilidade do `COMPARATIVO_2026` como referÃƒÂªncia visual premium.
- Corrigida e alinhada a especificaÃƒÂ§ÃƒÂ£o visual ÃƒÂ  paleta consagrada de produtividade (Oficiais `#F1C232`, 1Ã‚Âº PEL GTAR `#00CC00` bold, 1Ã‚Âº PEL `#00FF00`, 2Ã‚Âº PEL GTAR `#3C78D8` bold branco, 2Ã‚Âº PEL `#6D9EEB`, 3Ã‚Âº PEL `#FFFFFF`).
- Documentadas as diferenÃƒÂ§as de perÃƒÂ­odo (PIP ciclo 29Ã¢â‚¬â€œ28 vs CPM mÃƒÂªs civil).

---

### [CONCLUÃƒÂDO] TASK-C06-02 Ã¢â‚¬â€ SuÃƒÂ­te de RegressÃƒÂ£o Visual do COMPARATIVO_2026
- Criada a suÃƒÂ­te isolada `Testes/TestRendererComparativo2026.js` com 6 testes unitÃƒÂ¡rios e de regressÃƒÂ£o visual.
- Protegidos integralmente os componentes estruturais do `COMPARATIVO_2026` sem alterar nenhuma linha dos arquivos operantes.

---

### [CONCLUÃƒÂDO] TASK-C06-03 Ã¢â‚¬â€ PadronizaÃƒÂ§ÃƒÂ£o Visual de PIP e CPM
- Padronizada a formataÃƒÂ§ÃƒÂ£o visual e de nÃƒÂºmeros dos compiladores PIP e CPM.
- Preservado o perÃƒÂ­odo de ciclo 29-28 no PIP e mÃƒÂªs civil no CPM.

---

### [CONCLUÃƒÂDO] TASK-C06-03A Ã¢â‚¬â€ Cores de PelotÃƒÂ£o/GTAR e CentralizaÃƒÂ§ÃƒÂ£o no CPM
- Aplicada a paleta oficial nos 6 grupos de lotaÃƒÂ§ÃƒÂ£o (incluindo 1Ã‚Âº PEL GTAR `#00CC00` bold e 2Ã‚Âº PEL GTAR `#3C78D8` bold branco) na linha inteira do CPM por metadado interno, mantendo estritamente as 6 colunas originais.
- Centralizadas as mÃƒÂ©tricas numÃƒÂ©ricas (`OCORRÃƒÅ NCIAS` e `PONTUAÃƒâ€¡ÃƒÆ’O`) junto ÃƒÂ s colunas de identificaÃƒÂ§ÃƒÂ£o (`RANK`, `GRADUAÃƒâ€¡ÃƒÆ’O`, `MATRÃƒÂCULA`).
- Criado teste de integraÃƒÂ§ÃƒÂ£o em `Testes/TestRelatoriosPipCpm.js` cobrindo todos os grupos de lotaÃƒÂ§ÃƒÂ£o.

---

### [CONCLUÃƒÂDO] TASK-C06-04 Ã¢â‚¬â€ PadronizaÃƒÂ§ÃƒÂ£o Visual do RelatÃƒÂ³rio de ARMAS
- Aplicadas as cores oficiais consagradas de pelotÃƒÂµes e escala de destaque de armas.
- Criada suÃƒÂ­te de testes de integraÃƒÂ§ÃƒÂ£o real em `Testes/TestRelatorioArmas.js`.

---

### [CONCLUÃƒÂDO] TASK-C06-05 Ã¢â‚¬â€ PadronizaÃƒÂ§ÃƒÂ£o Visual do RelatÃƒÂ³rio de DROGAS
- Preservada a estrutura de 10 colunas (`POS`, `PELOTÃƒÆ’O`, `GRADUAÃƒâ€¡ÃƒÆ’O`, `MATRÃƒÂCULA`, `POLICIAL`, `MACONHA (g)`, `COCAÃƒÂNA (g)`, `TOTAL (g)`, `OCORRÃƒÅ NCIAS`, `BOEs`).
- Aplicada a paleta oficial de pelotÃƒÂµes e GTAR nas colunas A:G e I:J e a escala prÃƒÂ³pria de total de entorpecentes em gramas na Coluna H.
- Criada suÃƒÂ­te de testes de integraÃƒÂ§ÃƒÂ£o real em `Testes/TestRelatorioDrogas.js`.

---

### [CONCLUÃƒÂDO] TASK-C06-06A Ã¢â‚¬â€ Protocolo de HomologaÃƒÂ§ÃƒÂ£o dos RelatÃƒÂ³rios
- SuÃƒÂ­te automatizada integral em 85/85 testes aprovados.
- Criado o protocolo formal em `02_Comodos/04_PROTOCOLS/C06.2_PROTOCOLO_HOMOLOGACAO_RELATORIOS.md`.

---

### [EM HOMOLOGAÃƒâ€¡ÃƒÆ’O MANUAL] TASK-C06-06B Ã¢â‚¬â€ InstalaÃƒÂ§ÃƒÂ£o e HomologaÃƒÂ§ÃƒÂ£o na CÃƒÂ³pia DescartÃƒÂ¡vel
- CÃƒÂ³digo offline publicado via `clasp push -f` exclusivamente na pasta temporÃƒÂ¡ria isolada apontando para a planilha descartÃƒÂ¡vel (`1Pehkbdl6T-ADZCGozvKvgHHyM2AfvtL6hl5udxWF92kXsvfHPbEblCyS`).
- Bancada offline e `.clasp.json` original mantidos intocados.
- AÃƒÂ§ÃƒÂ£o Pendente: ExecuÃƒÂ§ÃƒÂ£o manual dos 5 relatÃƒÂ³rios na cÃƒÂ³pia descartÃƒÂ¡vel e preenchimento da matriz do protocolo.



## Extrato de MOD-C06-02_Sprint_Oficiais.md

# Sprint C06 Ã¢â‚¬â€ RelatÃƒÂ³rios Oficiais e PadronizaÃƒÂ§ÃƒÂ£o Visual

> **Documento:** `02_Comodos/01_SPRINTS/SPRINT_M06.2_RELATORIOS_OFICIAIS.md`  
> **Status:** EM HOMOLOGAÃƒâ€¡ÃƒÆ’O MANUAL (TASK-C06-06A ConcluÃƒÂ­da)  
> **Contexto:** Ecossistema SynthÃƒÂ©on GS Down Plant Offline  

---

## Ã°Å¸Å½Â¯ Objetivo da Sprint

Padronizar a apresentaÃƒÂ§ÃƒÂ£o visual e a legibilidade dos **RelatÃƒÂ³rios Oficiais de Produtividade** do SynthÃƒÂ©on GS (`COMPARATIVO_2026`, `PIP`, `CPM`, `ARMAS` e `DROGAS`), alinhando-os ÃƒÂ  paleta consagrada de produtividade (Oficiais `#F1C232`, 1Ã‚Âº PEL GTAR `#00CC00` bold, 1Ã‚Âº PEL `#00FF00`, 2Ã‚Âº PEL GTAR `#3C78D8` bold branco, 2Ã‚Âº PEL `#6D9EEB`, 3Ã‚Âº PEL `#FFFFFF`) e protegendo as regras de negÃƒÂ³cio de cada mÃƒÂ³dulo.

---

## Ã°Å¸â€œÅ’ Status das Tarefas da Sprint

| CÃƒÂ³digo | Tarefa | Status | DescriÃƒÂ§ÃƒÂ£o SintÃƒÂ©tica |
| :--- | :--- | :--- | :--- |
| **C06-01** | Captura do Contrato Visual Atual | **CONCLUÃƒÂDO** | Mapeamento dos contratos visuais dos 5 relatÃƒÂ³rios e alinhamento da especificaÃƒÂ§ÃƒÂ£o ÃƒÂ  paleta consagrada. |
| **C06-02** | SuÃƒÂ­te de RegressÃƒÂ£o COMPARATIVO_2026 | **CONCLUÃƒÂDO** | SuÃƒÂ­te isolada de 6 testes protegendo a referÃƒÂªncia visual premium sem alterar cÃƒÂ³digo produtivo. |
| **C06-03** | PadronizaÃƒÂ§ÃƒÂ£o Visual PIP e CPM | **CONCLUÃƒÂDO** | PadronizaÃƒÂ§ÃƒÂ£o visual preservando perÃƒÂ­odo de ciclo 29Ã¢â‚¬â€œ28 (PIP) e mÃƒÂªs civil (CPM). |
| **C06-04** | PadronizaÃƒÂ§ÃƒÂ£o Visual ARMAS | **CONCLUÃƒÂDO** | AplicaÃƒÂ§ÃƒÂ£o da paleta oficial de pelotÃƒÂµes/GTAR e escala de armas com teste de integraÃƒÂ§ÃƒÂ£o real. |
| **C06-05** | PadronizaÃƒÂ§ÃƒÂ£o Visual DROGAS | **CONCLUÃƒÂDO** | AplicaÃƒÂ§ÃƒÂ£o da paleta oficial de pelotÃƒÂµes/GTAR e escala de gramagem em 10 colunas com teste real. |
| **C06-06** | HomologaÃƒÂ§ÃƒÂ£o Visual em CÃƒÂ³pia | **EM HOMOLOGAÃƒâ€¡ÃƒÆ’O MANUAL** | PrÃƒÂ©-requisitos offline aprovados (85/85); aguardando execuÃƒÂ§ÃƒÂ£o manual em cÃƒÂ³pia descartÃƒÂ¡vel. |

---

## Ã°Å¸â€ºÂ¡Ã¯Â¸Â Regras Globais Protegidas

1. **COMPARATIVO_2026 IntocÃƒÂ¡vel**: Mantido como referÃƒÂªncia estÃƒÂ©tica sovereign premium.
2. **SeparaÃƒÂ§ÃƒÂ£o PIP x CPM**: PIP em ciclo 29Ã¢â‚¬â€œ28 e CPM em mÃƒÂªs civil.
3. **PelotÃƒÂµes Especiais**: 1Ã‚Âº PEL GTAR (`#00CC00` bold) e 2Ã‚Âº PEL GTAR (`#3C78D8` bold branco) preservados com destaque semÃƒÂ¢ntico.
4. **Central AnalÃƒÂ­tica Suspensa**: Central AnalÃƒÂ­tica permanece suspensa durante toda a homologaÃƒÂ§ÃƒÂ£o.
5. **Zero Remote Push**: `clasp push` e `git push` desativados e intocÃƒÂ¡veis.



## Extrato de MOD-C06-03_Execucao.md

# Sprint C06 Ã¢â‚¬â€ MÃƒÂ©rito de Equipe por Armas (Tasks)

> **Documento:** `02_Comodos/03_TASKS/C06.2_TASKS.md`  
> **Status da Sprint:** EM ESPECIFICAÃƒâ€¡ÃƒÆ’O (TASK-C06-01 ConcluÃƒÂ­da)  
> **Contexto:** Ecossistema SynthÃƒÂ©on GS Down Plant Offline  

---

## Ã°Å¸Å½Â¯ Lista Integrada de Tarefas da Sprint C06

### [CONCLUÃƒÂDO] TASK-C06-01 Ã¢â‚¬â€ EspecificaÃƒÂ§ÃƒÂ£o e InventÃƒÂ¡rio de Antiguidade
- Criados os documentos de Sprint, EspecificaÃƒÂ§ÃƒÂ£o TÃƒÂ©cnica e Controle de Tarefas da C06.
- Fixadas as regras de negÃƒÂ³cio: arma artesanal conta como 1 arma de mÃƒÂ©rito, cada tÃƒÂºnel gera um ÃƒÂºnico lÃƒÂ­der contemplado, e ausÃƒÂªncia/empate de antiguidade exige alerta auditÃƒÂ¡vel.

---

### [CONCLUÃƒÂDO] TASK-C06-02 Ã¢â‚¬â€ Motor de AtribuiÃƒÂ§ÃƒÂ£o por Antiguidade (C04)
- Criado o motor puro em `Motor/PoliticaMeritoArmas.js`.
- Implementado agrupamento por tÃƒÂºnel `DATA | MIKE | BOE`, soma ÃƒÂºnica de armas fÃƒÂ­sicas (arma artesanal = 1), e seleÃƒÂ§ÃƒÂ£o do integrante com menor nÃƒÂºmero N (mais antigo) como lÃƒÂ­der contemplado.
- Adicionada regra defensiva: ausÃƒÂªncia de N cadastrado ou empate em N marca o tÃƒÂºnel como `PENDENTE_AUDITORIA` sem tomada de decisÃƒÂ£o arbitrÃƒÂ¡ria ou silenciosa.
- Criadas fixtures em `Testes/Fixtures/MeritoArmasFixture.js` e 7 testes unitÃƒÂ¡rios automatizados em `Testes/TestMeritoEquipeArmas.js` (93/93 testes verdes no total).
- **TASK-C06-02A (MicrocorreÃƒÂ§ÃƒÂ£o)**: Corrigida a contagem de armas artesanais (`tipoArma: 'ARTESANAL'`, `armas: 1`), contabilizando exclusivamente em `armasArtesanais` sem dupla contagem em `armasFogo` (`qtdArmas === 1`, `armasFogo === 0`, `armasArtesanais === 1`).

---

### [CONCLUÃƒÂDO] TASK-C06-03A Ã¢â‚¬â€ Leitura Oficial de Antiguidade (PecÃƒÂºlio / Efetivo)
- Criado o leitor em `Leitura/LeitorAntiguidadePeculio.js` para extraÃƒÂ§ÃƒÂ£o oficial da coluna N (Antiguidade/Senioridade).
- Implementada a normalizaÃƒÂ§ÃƒÂ£o de matrÃƒÂ­cula (removendo hÃƒÂ­fens, pontos e espaÃƒÂ§os), mapeando metadados completos (`nome`, `grad`, `designacao`).
- Implementado tratamento defensivo para N ausente/invÃƒÂ¡lido e duplicidades de matrÃƒÂ­cula.
- **TASK-C06-03B (Rigor e RemoÃƒÂ§ÃƒÂ£o de Fallbacks)**: Removido fallback para a primeira aba (`sheets[0]`) e removidos os ÃƒÂ­ndices fixos de colunas. Se a aba nÃƒÂ£o for reconhecida por alias oficial ou se os cabeÃƒÂ§alhos explÃƒÂ­citos de `N` e `MATRÃƒÂCULA` nÃƒÂ£o forem localizados, retorna o erro tÃƒÂ©cnico `ANTIGUIDADE_FONTE_NAO_LOCALIZADA`.
- SuÃƒÂ­te de testes em `Testes/TestLeitorAntiguidadePeculio.js` expandida para 7 testes (100/100 testes verdes no total).

---

### [CONCLUÃƒÂDO] TASK-C06-03 Ã¢â‚¬â€ DiagnÃƒÂ³sticos do GuardiÃƒÂ£o da Qualidade (C05)
- Integrado o diagnÃƒÂ³stico de mÃƒÂ©rito por armas no GuardiÃƒÂ£o (`Features/GuardiaoQualidade.js` e `Core/RegrasQualidade.js`).
- Adicionado `validarMeritoArmasTunel`: audita **exclusivamente** tÃƒÂºneis com arma fÃƒÂ­sica (fogo ou artesanal).
- Gera alerta `CRITICO`: `MERITO_ARMAS_ANTIGUIDADE_AUSENTE` quando integrante da equipe de tÃƒÂºnel armado nÃƒÂ£o possui N cadastrado.
- Gera alerta `CRITICO`: `MERITO_ARMAS_EMPATE_ANTIGUIDADE` quando 2 ou mais integrantes de tÃƒÂºnel armado empatam no menor N.
- Gera alerta `OBSERVACAO`: `ANTIGUIDADE_FONTE_NAO_LOCALIZADA` quando a aba oficial de antiguidade nÃƒÂ£o for localizada na planilha.
- **TASK-C06-03C (Ajustes de Rigor na IntegraÃƒÂ§ÃƒÂ£o)**:
  - Coletados todos os integrantes do tÃƒÂºnel (inclusive os de linhas sem armas) para resoluÃƒÂ§ÃƒÂ£o legÃƒÂ­tima do lÃƒÂ­der.
  - Limitada a observaÃƒÂ§ÃƒÂ£o `ANTIGUIDADE_FONTE_NAO_LOCALIZADA` a no mÃƒÂ¡ximo **uma ÃƒÂºnica emissÃƒÂ£o por varredura**.
- **TASK-C06-03D (Fonte Externa ÃƒÅ¡nica e ConfigurÃƒÂ¡vel)**:
  - Corrigido o ID do PecÃƒÂºlio em `Core/Config.js` para o ID oficial: `1PJnA8d9sf5CNj0-rt3yIxnwS8BEGfqxRvoyOjCtVHNE`.
  - Removido `ID_PLANILHA_PECULIO` redundante de `Core/Constantes.js`.
  - Removido o fallback `sheet.getParent()` do GuardiÃƒÂ£o. O PecÃƒÂºlio ÃƒÂ© lido **exclusivamente** da fonte oficial via `CONFIG_SYNTHEON.obterIdPeculio()` ou fonte externa injetada.
  - SuÃƒÂ­te de testes em `Testes/TestGuardiao.js` expandida para 37 testes (109/109 testes verdes no total).

---

### [CONCLUÃƒÂDO] TASK-C06-04A Ã¢â‚¬â€ NÃƒÂºcleo e Renderizador Trimestral Gxt (C06)
- Criado o compilador do relatÃƒÂ³rio Gxt em `Features/CompiladorGxt.js`:
  - Processa os meses selecionados, obtÃƒÂ©m o mapa oficial de antiguidade N e atribui 100% das armas ao lÃƒÂ­der.
  - Filtro Estrito: envia **exclusivamente** os registros com status `PROCESSADO` ao renderizador (tÃƒÂºneis pendentes sÃƒÂ£o ignorados).
  - Gera os resumos por pelotÃƒÂ£o e GTAR por mÃƒÂªs.
- Criado o renderizador executivo em `Render/RendererGxt.js`:
  - Gera os 3 blocos mensais lado a lado com as 5 colunas protegidas (`NÃ‚Âº`, `GRAD. / MATRÃƒÂCULA`, `NOME`, `QTD ARMAS`, `DESIGNAÃƒâ€¡ÃƒÆ’O`).
  - Aplica as cores oficiais de PelotÃƒÂ£o/GTAR (`1Ã‚Âº PEL GTAR` verde escuro #00CC00 negrito, `2Ã‚Âº PEL GTAR` azul escuro #3C78D8 texto branco negrito, etc.).
  - Aplica a escala oficial de destaque para a quantidade de armas e renderiza a tabela de resumo acumulado por pelotÃƒÂ£o.
- **TASK-C06-04B (CorreÃƒÂ§ÃƒÂ£o do Pipeline Real e Visual)**:
  - `Features/CompiladorGxt.js`: Converte explicitamente `RegistroCanonico` em DTO plano (`data`, `mike`, `boe`, `armas`, `armasArtesanais`, `policiais`), preservando todos os integrantes do tÃƒÂºnel e suas armas.
  - `Render/RendererGxt.js`: AplicaÃƒÂ§ÃƒÂ£o completa de negritos (`setFontWeights`), alinhamentos (`setHorizontalAlignments`), formatos numÃƒÂ©ricos (`setNumberFormats`), larguras de colunas (`setColumnWidth`) e congelamento da linha 2 (`setFrozenRows(2)`).
- **TASK-C06-04E (SeleÃƒÂ§ÃƒÂ£o Livre sem Perda de Meses)**:
  - `Features/CompiladorGxt.js`: Implementada ordenaÃƒÂ§ÃƒÂ£o cronolÃƒÂ³gica institucional dos meses selecionados pelo operador.
  - `Render/RendererGxt.js`: Reformulado para agrupar qualquer quantidade de meses em painÃƒÂ©is trimestrais (atÃƒÂ© 3 meses por painel) empilhados verticalmente na mesma aba acumulada.
  - `Testes/TestRelatorioGxt.js`: Adicionado o Teste 8 (5 meses fora de ordem) comprovando a ordenaÃƒÂ§ÃƒÂ£o cronolÃƒÂ³gica e o empilhamento vertical sem truncamento nem perda de dados (117/117 testes verdes no total).

---

### [EM HOMOLOGAÃƒâ€¡ÃƒÆ’O MANUAL] TASK-C06-05 Ã¢â‚¬â€ HomologaÃƒÂ§ÃƒÂ£o na CÃƒÂ³pia DescartÃƒÂ¡vel e SuÃƒÂ­te de Testes
- **TASK-C06-05A (Protocolo de HomologaÃƒÂ§ÃƒÂ£o do Gxt)**:
  - Criado o protocolo oficial de homologaÃƒÂ§ÃƒÂ£o manual em `02_Comodos/04_PROTOCOLS/C06.3_PROTOCOLO_HOMOLOGACAO_GXT.md`.
  - Definido uso exclusivo da cÃƒÂ³pia descartÃƒÂ¡vel (`16mSKBXoqQuwxTdPxSQjl2v0cJAZjjHIh7N3UNo0KWAg`) com validaÃƒÂ§ÃƒÂ£o do `scriptId` no `.clasp.json`.
  - Roteiro de testes para `Gxt > Selecao livre` (`ABR2026`, `MAI2026`, `JUN2026`) e `Gxt > Anual` (`GXT_1T_2026`..`GXT_4T_2026`).
  - ProibiÃƒÂ§ÃƒÂ£o estrita de `git push` e alteraÃƒÂ§ÃƒÂµes na planilha de produÃƒÂ§ÃƒÂ£o.
  - SuÃƒÂ­te local 100% aprovada em 117/117 testes automatizados.
- **TASK-C06-05C (DiagnÃƒÂ³stico e Bloqueio Seguro do Gxt)**:
  - `Features/CompiladorGxt.js`: Implementada a funÃƒÂ§ÃƒÂ£o `localizarAbaMes` para localizar abas por nome normalizado (ex: `abr.2026` -> `ABR2026`).
  - `Leitura/LeitorAntiguidadePeculio.js`: Ampliados os aliases de abas e varredura flexÃƒÂ­vel das 10 primeiras linhas de cabeÃƒÂ§alho do PecÃƒÂºlio.
  - `Render/RendererGxt.js`: Adicionado o mÃƒÂ©todo `renderizarAlertaErro` para destacar alertas de diagnÃƒÂ³stico de erro na aba de saÃƒÂ­da.
  - `Features/CompiladorGxt.js`: InterrupÃƒÂ§ÃƒÂ£o de seguranÃƒÂ§a com mensagem clara se o PecÃƒÂºlio for indisponÃƒÂ­vel ou se todos os tÃƒÂºneis armados estiverem pendentes (sem relatÃƒÂ³rio silenciosamente vazio).
  - `Testes/TestRelatorioGxt.js`: Adicionados os testes 9, 10 e 11 cobrindo localizaÃƒÂ§ÃƒÂ£o flexÃƒÂ­vel de abas, bloqueio por PecÃƒÂºlio ausente e relatÃƒÂ³rio de pendÃƒÂªncias (120/120 testes verdes no total).
- **TASK-C06-05D (MicrocorreÃƒÂ§ÃƒÂ£o de SeguranÃƒÂ§a e Rigor do Gxt)**:
  - `Features/CompiladorGxt.js`: Removido o fallback para a planilha ativa de ocorrÃƒÂªncias; exige obrigatoriamente fonte externa de PecÃƒÂºlio (`fontePeculio` ou `CONFIG_SYNTHEON.obterIdPeculio()`). Em falha, preserva 100% intacta qualquer aba de relatÃƒÂ³rio existente sem limpar nem sobrescrever.
  - `Leitura/LeitorAntiguidadePeculio.js`: Removidos os aliases genÃƒÂ©ricos `PONTUAÃƒâ€¡ÃƒÆ’O` e `PONTUACAO` para nÃƒÂ£o capturar relatÃƒÂ³rios PIP/CPM por engano.
  - `Testes/TestRelatorioGxt.js`: Adicionados os testes 12, 13 e 14 garantindo a rejeiÃƒÂ§ÃƒÂ£o de fallback local, a rejeiÃƒÂ§ÃƒÂ£o de abas de PontuaÃƒÂ§ÃƒÂ£o e a preservaÃƒÂ§ÃƒÂ£o fiel da aba existente em falha (124/124 testes verdes no total).
- **TASK-C06-05E (HigienizaÃƒÂ§ÃƒÂ£o do Pacote de PublicaÃƒÂ§ÃƒÂ£o)**:
  - `.claspignore`: Adicionadas as regras `scratch/**`, `Homologacao/**` e `02_Comodos/**`.
  - PublicaÃƒÂ§ÃƒÂ£o limpa realizada a partir de diretÃƒÂ³rio temporÃƒÂ¡rio externo isolado (`AppData/Local/Temp/syntheon-gxt-homologacao`) contendo estritamente os 67 arquivos de cÃƒÂ³digo fonte de produÃƒÂ§ÃƒÂ£o.
  - Eliminadas todas as duplicidades de escopo global no projeto do Apps Script da cÃƒÂ³pia descartÃƒÂ¡vel (`1Pehkbdl6T-ADZCGozvKvgHHyM2AfvtL6hl5udxWF92kXsvfHPbEblCyS`).
- **TASK-C06-05F (Leitura do PecÃƒÂºlio Oficial)**:
  - `Leitura/LeitorAntiguidadePeculio.js`: Varredura de cabeÃƒÂ§alho expandida para as primeiras 25 linhas e adicionados os aliases de antiguidade `ORD` e `ORD.` e aliases de apoio `NOME DE GUERRA` e `SUB-UNIDADE`.
  - `Testes/TestLeitorAntiguidadePeculio.js`: Adicionado o Teste 8 com a matriz real do PecÃƒÂºlio oficial (cabeÃƒÂ§alho na linha 11 com `ORD`, `GRAD.`, `MAT.`, `NOME DE GUERRA` e `SUB-UNIDADE`).
  - SuÃƒÂ­te local 100% aprovada em 125/125 testes.
- **TASK-C06-05G (DiagnÃƒÂ³stico ExplÃƒÂ­cito da Fonte Externa)**:
  - `Features/CompiladorGxt.js`: Tratamento de exceÃƒÂ§ÃƒÂ£o explicito no `openById` para capturar a causa real (`PECULIO_ACESSO_NEGADO`) com o detalhe do erro do sistema. Alertas de UI formatados com aÃƒÂ§ÃƒÂ£o recomendada especÃƒÂ­fica para cada cÃƒÂ³digo de erro (`PECULIO_ACESSO_NEGADO`, `PECULIO_ABA_NAO_LOCALIZADA`, `PECULIO_CABECALHO_NAO_LOCALIZADO`, `PECULIO_SEM_REGISTROS_VALIDOS`).
  - `Leitura/LeitorAntiguidadePeculio.js`: Retornos diferenciados e precisos para os quatro modos de falha da fonte externa.
  - `Core/RegrasQualidade.js`: Regra de validaÃƒÂ§ÃƒÂ£o atualizada para aceitar o diagnÃƒÂ³stico unificado de erro do PecÃƒÂºlio.
  - SuÃƒÂ­te local 100% aprovada em 125/125 testes.
- **TASK-C06-05G.1 (Repasse do Detalhe TÃƒÂ©cnico do Erro do PecÃƒÂºlio)**:
  - `Features/CompiladorGxt.js`: Adicionado o campo `peculioDetalhe: resPeculio.detalheErro || ''` no objeto `_diagnostico`. Alertas de UI atualizados para incluir a mensagem nativa do sistema em `diag.peculioDetalhe`.
  - `Testes/TestRelatorioGxt.js`: Adicionado o Teste 15 simulando exceÃƒÂ§ÃƒÂ£o do `SpreadsheetApp.openById` e verificando que a mensagem exata do sistema ÃƒÂ© repassada ao diagnÃƒÂ³stico.
  - SuÃƒÂ­te local 100% aprovada em 126/126 testes.
- **TASK-C06-05H (SeleÃƒÂ§ÃƒÂ£o SemÃƒÂ¢ntica da Aba do PecÃƒÂºlio)**:
  - `Leitura/LeitorAntiguidadePeculio.js`: Implementada a seleÃƒÂ§ÃƒÂ£o semÃƒÂ¢ntica de abas com `localizarCabecalhoEmMatriz`. O leitor examina as 25 primeiras linhas de todas as abas candidatas (principais por nome/alias e secundÃƒÂ¡rias) e seleciona a aba que contÃƒÂ©m a combinaÃƒÂ§ÃƒÂ£o vÃƒÂ¡lida de cabeÃƒÂ§alhos (`ORD`/`N` e `MAT.`/`MATRÃƒÂCULA`), ignorando abas auxiliares ou sem cabeÃƒÂ§alhos. Se nenhuma aba contiver a estrutura vÃƒÂ¡lida, inclui no `detalheErro` a lista completa das abas examinadas.
  - `Testes/TestLeitorAntiguidadePeculio.js`: Adicionado o Teste 9 com duas abas em mock (uma `EFETIVO` sem cabeÃƒÂ§alhos e uma `CÃƒâ€œPIA DE PECÃƒÅ¡LIO COM PONTUAÃƒâ€¡ÃƒÆ’O` na linha 11) comprovando que o leitor seleciona a aba correta.
  - SuÃƒÂ­te local 100% aprovada em 127/127 testes.
- **TASK-C06-05H.1 (Contrato Estrito da Aba de Antiguidade)**:
  - `Leitura/LeitorAntiguidadePeculio.js`: Filtro de nomes restrito exclusivamente a aliases reconhecidos e abas contendo `EFETIVO` ou `PECULIO` no nome (bloqueado varredura em relatÃƒÂ³rios arbitrÃƒÂ¡rios). ExigÃƒÂªncia do contrato estrito de antiguidade no mesmo cabeÃƒÂ§alho: `ORD`/`N`, `MAT.`/`MATRÃƒÂCULA` E ao menos 2 marcadores de identidade (`GRAD.`, `NOME DE GUERRA`, `SUB-UNIDADE`).
  - `Testes/TestLeitorAntiguidadePeculio.js`: Adicionado o Teste 10 com aba contendo apenas `ORD` e `MAT.` sem marcadores de identidade, comprovando a rejeiÃƒÂ§ÃƒÂ£o estrita pelo contrato.
- **TASK-C06-05H.2 (Integridade da SuÃƒÂ­te apÃƒÂ³s Contrato do PecÃƒÂºlio)**:
  - `Testes/TestGuardiao.js`: Atualizados os mocks de teste do GuardiÃƒÂ£o (`efetivoSheetMock`, `mockPeculioValido`, `mockPeculioExterno`) para fornecer o contrato estrito oficial do PecÃƒÂºlio (`ORD.`, `GRAD.`, `MAT.`, `NOME DE GUERRA`, `SUB-UNIDADE`), eliminando observaÃƒÂ§ÃƒÂµes artificiais em auditorias limpas e restaurando o status `APROVADO`.
  - `Testes/RodarTodosOsTestes.js`: Atualizado o executor principal para validar `process.exitCode`. O banner de sucesso sÃƒÂ³ ÃƒÂ© exibido quando a execuÃƒÂ§ÃƒÂ£o encerra com cÃƒÂ³digo 0; em caso de falha em qualquer suÃƒÂ­te, exibe um banner de falha e encerra explicitamente com saÃƒÂ­da `1`.
  - SuÃƒÂ­te local 100% aprovada em 128/128 testes com cÃƒÂ³digo de saÃƒÂ­da `0`.
- **TASK-C06-05I.1S (DiagnÃƒÂ³stico Forense Real Limpo e Normalizado Ã¢â‚¬â€ Armas de Fogo vs Artesanais)**:
  - `scripts/DiagnosticoGxtTrimestral.py` & `Testes/DiagnosticoGxtTrimestral.js`: Criado o analisador Python em `scripts/` (versionado, sem `scratch/`) que localiza dinamicamente os arquivos Excel reais via `find_excel_file` com suporte a normalizaÃƒÂ§ÃƒÂ£o Unicode sem falhas de encoding.
  - `02_Comodos/C06.3_DIAGNOSTICO_GXT_2T.md`: Produzido o relatÃƒÂ³rio forense real normalizado comprovando a causa da inflaÃƒÂ§ÃƒÂ£o (coluna 31 `QDT ARMAS` por PM = 448 armas no 2T) e demonstrando que a separaÃƒÂ§ÃƒÂ£o entre Armas de Fogo NumÃƒÂ©ricas e Armas Artesanais (texto `"ARTESANAL"`) atinge **100% DE CONVERGÃƒÅ NCIA EXATA COM OS TARGETS HISTÃƒâ€œRICOS**:
    - **Abril**: **40.0 Armas de Fogo NumÃƒÂ©ricas** (+ 1 Artesanal em texto) | Target = 40 Ã¢Å“â€¦
    - **Maio**: **27.0 Armas de Fogo NumÃƒÂ©ricas** (+ 0 Artesanal) | Target = 27 Ã¢Å“â€¦
    - **Junho**: **21.0 Armas de Fogo NumÃƒÂ©ricas** (+ 1 Artesanal no tÃƒÂºnel 17/JUN `26E1174008629`) | Target = 21 Ã¢Å“â€¦ (`REGRA_HISTORICA_ARTESANAL`)
    - **Total Trimestre**: **88.0 Armas de Fogo NumÃƒÂ©ricas** | Target Total = 88 Ã¢Å“â€¦
- **TASK-C06-05I.2R (ConexÃƒÂ£o do Adaptador2026 aos CabeÃƒÂ§alhos Reais e Fatos FÃƒÂ­sicos)**:
  - `Core/Constantes.js`: Adicionados aliases exclusivos `ARMA_FATO` (`['ARMA']`), `TIPO_ARMA` (`['TIPO', ...]`), `MODELO_ARMA` (`['MODELO', ...]`) e `QDT_ARMAS` (`['QDT ARMAS', 'QTD ARMAS']`), separando a busca exata da coluna fÃƒÂ­sica de armas da coluna replicada pela equipe.
  - `Leitura/Adaptador2026.js`: Estendido o adaptador para extrair separadamente `armaFato` da coluna `ARMA` (fato fÃƒÂ­sico real), `tipoArma` e `modeloArma`. Mapeado `armas` em `policiais[0]` diretamente para `armaFato`, deixando `QDT ARMAS` apenas como dado de auditoria. Adicionadas importaÃƒÂ§ÃƒÂµes seguras para ambiente Node.js.
  - `Features/CompiladorGxt.js`: Ajustado para consumir `armaFato` e metadados diretamente dos Registros CanÃƒÂ´nicos retornados pelo `Adaptador2026`, removendo a inflaÃƒÂ§ÃƒÂ£o de armas nas planilhas reais.
  - `Testes/TestRelatorioGxt.js`: Adicionado o **Teste 17** com a estrutura completa de cabeÃƒÂ§alhos reais (`ARMA`, `TIPO`, `MODELO`, `QDT ARMAS`, `MIKE`, `BOE`, `MATRÃƒÂCULA`, `POLICIAL`, `PELOTÃƒÆ’O`), comprovando que 4 policiais com `QDT ARMAS = 1` e apenas um `ARMA = 1` geram 1 arma, artesanais viram texto, o caso misto preserva ambos e os resumos numÃƒÂ©ricos nÃƒÂ£o somam textos.
  - SuÃƒÂ­te integral 100% aprovada (130/130 testes, `NODE_EXIT=0`). Commits locais `d1e29ed` e `c703366`. Sem `clasp push` ou `git push`.
- **TASK-C06-05I.3A (Log Operacional Atual do GXT Ã¢â‚¬â€ [LOG] Gxt)**:
  - `Features/CompiladorGxt.js`: Implementado o helper estÃƒÂ¡tico `gerarLogOperacionalGxt(ss, dadosLog)` e integrado aos orquestradores `gerarGxtSelecaoLivre` e `gerarGxtAnual`. A aba `[LOG] Gxt` ÃƒÂ© ÃƒÂºnica e descartÃƒÂ¡vel, sobrescrevendo apenas o prÃƒÂ³prio conteÃƒÂºdo a cada execuÃƒÂ§ÃƒÂ£o sem criar histÃƒÂ³rico acumulado. O log contÃƒÂ©m o **Resumo Superior** (Data/Hora, Status, Modo, Meses, PecÃƒÂºlio, Abas Geradas, Detalhe Final) e a **Tabela Mensal** com mÃƒÂ©tricas por mÃƒÂªs (Fatos Lidos, TÃƒÂºneis Armados, Processados, Pendentes, Armas de Fogo, Artesanais, DiagnÃƒÂ³stico & AÃƒÂ§ÃƒÂ£o) e linha `TOTAL`. No modo Anual, compila as 12 linhas mensais no mesmo log ao final da execuÃƒÂ§ÃƒÂ£o. Em caso de falha de PecÃƒÂºlio, o log registra o diagnÃƒÂ³stico da falha e as abas GXT existentes permanecem intactas.
  - `Testes/TestRelatorioGxt.js`: Adicionados os testes 18, 19, 20 e 21 validando a criaÃƒÂ§ÃƒÂ£o do log, sobrescrita descartÃƒÂ¡vel sem acÃƒÂºmulo, tratamento de falhas sem alterar relatÃƒÂ³rios anteriores e inclusÃƒÂ£o das 12 linhas no modo Anual com validaÃƒÂ§ÃƒÂ£o da linha TOTAL.
  - SuÃƒÂ­te integral 100% aprovada em **134/134 testes** (`NODE_EXIT=0`). Sem `clasp push` ou `git push`.



## Extrato de MOD-C06-03_Sprint_Armas.md

# Sprint C06 Ã¢â‚¬â€ RelatÃƒÂ³rio de MÃƒÂ©rito de Equipe por Armas

> **Documento:** `02_Comodos/01_SPRINTS/SPRINT_M06.3_MERITO_ARMAS.md`  
> **Status:** EM HOMOLOGAÃƒâ€¡ÃƒÆ’O MANUAL (TASK-C06-05A)  
> **Contexto:** Ecossistema SynthÃƒÂ©on GS Down Plant Offline  

---

## Ã°Å¸Å½Â¯ Objetivo da Sprint

Implementar o mÃƒÂ³dulo de **MÃƒÂ©rito de Equipe por Armas**, responsÃƒÂ¡vel por consolidar e atribuir integralmente as apreensÃƒÂµes de armas de fogo e artesanais de um mesmo tÃƒÂºnel de ocorrÃƒÂªncia (`DATA | MIKE | BOE`) ao integrante de **maior antiguidade** (lÃƒÂ­der da equipe).

O mÃƒÂ³dulo abrange:
- **C04 (Motor & Regra Pura)**: Agrupamento por tÃƒÂºnel e atribuiÃƒÂ§ÃƒÂ£o total das armas ao lÃƒÂ­der mais antigo.
- **C05 (GuardiÃƒÂ£o da Qualidade)**: DiagnÃƒÂ³stico e alertas auditÃƒÂ¡veis em caso de empate ou ausÃƒÂªncia de antiguidade vÃƒÂ¡lida.
- **C06 (Renderizador Visual)**: GeraÃƒÂ§ÃƒÂ£o do relatÃƒÂ³rio de mÃƒÂ©rito trimestral e resumo mensal por pelotÃƒÂ£o.

---

## Ã°Å¸â€œÅ’ Status das Tarefas da Sprint C06

| CÃƒÂ³digo | Tarefa | Status | DescriÃƒÂ§ÃƒÂ£o SintÃƒÂ©tica |
| :--- | :--- | :--- | :--- |
| **C06-01** | EspecificaÃƒÂ§ÃƒÂ£o e InventÃƒÂ¡rio de Antiguidade | **CONCLUÃƒÂDO** | CriaÃƒÂ§ÃƒÂ£o da spec contratual, levantamento das fontes de antiguidade e detalhamento das tarefas. |
| **C06-02** | Motor de AtribuiÃƒÂ§ÃƒÂ£o por Antiguidade (C04) | **CONCLUÃƒÂDO** | ImplementaÃƒÂ§ÃƒÂ£o e testes unitÃƒÂ¡rios do algoritmo de seleÃƒÂ§ÃƒÂ£o de lÃƒÂ­der por tÃƒÂºnel por menor N. |
| **C06-03** | DiagnÃƒÂ³sticos e Alertas do GuardiÃƒÂ£o (C05) | **CONCLUÃƒÂDO** | DetecÃƒÂ§ÃƒÂ£o de ocorrÃƒÂªncias com armas sem antiguidade resolvida, empate ou fonte ausente. |
| **C06-04** | Renderizador Trimestral, Escala e UI (C06) | **CONCLUÃƒÂDO** | GeraÃƒÂ§ÃƒÂ£o do relatÃƒÂ³rio trimestral, escala oficial de armas, menu UI e empilhamento vertical. |
| **C06-05** | HomologaÃƒÂ§ÃƒÂ£o Visual e Testes de RegressÃƒÂ£o | **EM HOMOLOGAÃƒâ€¡ÃƒÆ’O MANUAL** | Protocolo em `02_Comodos/04_PROTOCOLS/C06.3_PROTOCOLO_HOMOLOGACAO_GXT.md` para testes em cÃƒÂ³pia descartÃƒÂ¡vel. |

---

## Ã°Å¸â€ºÂ¡Ã¯Â¸Â Regras de NegÃƒÂ³cio e PrincÃƒÂ­pios Protegidos

1. **Isolamento de Outros RelatÃƒÂ³rios**: PIP, CPM, COMPARATIVO_2026 e o RelatÃƒÂ³rio Geral de Armas permanecem 100% intocados e independentes.
2. **Unicidade de AtribuiÃƒÂ§ÃƒÂ£o por TÃƒÂºnel**: Um tÃƒÂºnel `DATA | MIKE | BOE` gera um ÃƒÂºnico lÃƒÂ­der contemplado; a soma total das armas fÃƒÂ­sicas do tÃƒÂºnel vai integralmente para esse militar.
3. **Contagem de Armas Artesanais**: Cada arma artesanal conta como 1 arma de mÃƒÂ©rito.
4. **Sem Escolha Silenciosa**: AusÃƒÂªncia de dados de antiguidade ou empate de antiguidade gera alerta auditÃƒÂ¡vel do GuardiÃƒÂ£o da Qualidade, nunca uma decisÃƒÂ£o arbitrÃƒÂ¡ria ou omissÃƒÂ£o silenciosa.


