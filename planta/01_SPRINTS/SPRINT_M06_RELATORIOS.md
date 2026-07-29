# Sprint M06 — Relatórios Oficiais e Formatação Visual

> **Documento:** `planta/01_SPRINTS/SPRINT_M06_RELATORIOS.md`  
> **Status:** EM REVISÃO DOCUMENTAL (TASK-M06.1-01B)  
> **Contexto:** Ecossistema Synthéon GS Down Plant Offline  

---

## 🎯 Objetivo da Sprint

Padronizar a apresentação visual, estrutura de tabelas, estilos de cabeçalho, formatação numérica e geração de relatórios do ecossistema Synthéon em ambiente offline, separando rigorosamente os **Relatórios Oficiais de Produtividade** dos **Relatórios de Apoio e Auditoria**, com base no inventário 100% verificado no código do projeto.

---

## 📊 Classificação dos Relatórios

### 1. Relatórios Oficiais de Produtividade
Relatórios institucionais que utilizam a paleta operacional oficial (Cores de Pelotões/Oficiais e Legenda de Armas).
- **COMPARATIVO_2026**
- **PIP (Compilador PIP)**
- **RELATÓRIO DE ARMAS**
- **RELATÓRIO DE ENTORPECENTES (DROGAS)**
- **CPM (Compilador de Pontuação Mensal)**

### 2. Relatórios de Apoio e Diagnóstico
Relatórios técnicos gerados pelo Guardião da Qualidade que utilizam a paleta exclusiva de severidades.
- **`[AUDITORIA] Ocorrencias`** (Última varredura de saúde da aba)
- **`[HISTORICO] Auditoria Ocorrencias`** (Registro histórico cumulativo)

---

## 📋 Tabela de Inventário Real Mapeada do Código

| Relatório | Menu / Gatilho | Compilador Visual (Apresentação) | Motor / Métrica Interna | Aba(s) de Saída Real(is) | Fonte de Dados | Período | Métricas Obrigatórias | Status da Regra Visual |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **COMPARATIVO_2026** | `abrirMenuComparativo2026()` | `Features/CompiladorProdutividade.js` (`gerarComparativo2026Premium`) $\rightarrow$ `Render/RendererComparativo2026.js` | Motor V2 (`SyntheonLeitor`, `SyntheonMetricas`) | `COMPARATIVO_2026` | Abas mensais (`JAN2026`..`DEZ2026`) + `EFETIVO` | Anual / Seleção 2026 | Qtd. Ocorrências, Pontuação Rateada, Qtd. Armas, Entorpecentes Total (g) | **IMPLEMENTADA NO CÓDIGO ATUAL** (Cores Pelotões, GTAR, Escala Armas, Carimbo, Formatos `#,##0.00`) |
| **PIP** | `criarMenuPIP_()` / `executarCompilacaoPIP_()` | `Compilador PIP.js` (`criarAbaResultado_()`) | Motor V2 (`SyntheonMetricas`, `SyntheonRanking`) | `PIP_<período>`, `PIP_ANUAL_2026`, `PIP_SELECAO_LIVRE` | Abas mensais (`JAN`..`DEZ`) + `EFETIVO` | Mensal / Seleção / Anual | Rank, Graduação, Matrícula, Nome Completo, Designação, Pontuação, Qtd. Oc. | **CONTRATO VISUAL A IMPLEMENTAR NO M06** (Atualmente possui apenas cabeçalho verde `#D9EAD3` e formato `#,##0.00`) |
| **ARMAS** | `criarMenuArmas_()` / `executarCompilacaoArmas_()` | `Compilador_Armas.js` (Inline em `executarCompilacaoArmas_()`) | Acumulador por Matrícula (conceitual `PluginArmas`) | `COMP_ARMAS_2026`, `COMP_ARMAS_<período>` | Abas mensais operacionais (`JAN`..`DEZ`) | Mensal / Seleção / Anual | Pelotão, Graduação, Matrícula, Policial, Score Acumulado (Armas) | **CONTRATO VISUAL A IMPLEMENTAR NO M06** (Atualmente tem cores básicas de Pelotão; falta escala de armas e GTAR) |
| **DROGAS** | `criarMenuEntorpecentes_()` / `executarCompilacaoEntorpecentes_()` | `Compilador de Entorpecentes.js` (Inline em `executarCompilacaoEntorpecentes_()`) | Acumulador por Matrícula (conceitual `PluginEntorpecentes`) | `COMP_DROGAS_2026`, `COMP_DROGAS_<período>` | Abas mensais operacionais (`JAN`..`DEZ`) | Mensal / Seleção / Anual | Posição, Pelotão, Graduação, Matrícula, Policial, Maconha (g), Cocaína (g), Total (g), Ocorrências, BOEs | **CONTRATO VISUAL A IMPLEMENTAR NO M06** (Atualmente tem cores básicas de Pelotão; falta GTAR e formato `#,##0.00`g) |
| **CPM** | `criarMenuCPM_()` / `abrirMenuCPMMensal()` | `CPM – Compilador de Pontuação Mensal.js` (`criarAbaResultadoCPM_()`) | Motor V2 (`SyntheonRanking`, `pontosCPM`) | `CPM_<mes>`, `CPM_ANUAL_2026`, `CPM_SELECAO_LIVRE` | Abas mensais (`JAN`..`DEZ`) + `EFETIVO` | Mensal / Seleção / Anual | Rank, Graduação, Matrícula, Nome Completo, Ocorrências, Pontuação | **CONTRATO VISUAL A IMPLEMENTAR NO M06** (Atualmente possui apenas cabeçalho verde `#D9EAD3` e formato `#,##0.00`) |
| **AUDITORIA** | Guardião $\rightarrow$ Auditar Aba | `Features/GuardiaoQualidade.js` $\rightarrow$ `Render/RendererAuditoriaSaude.js` | Motor do Guardião (`Core/RegrasQualidade.js`) | `[AUDITORIA] Ocorrencias` | Aba mensal selecionada | Instância Atual | 8 Colunas de Diagnóstico, Resumo de Saúde | **CONTRATO VISUAL A IMPLEMENTAR NO M06** (Estilização de cores por severidade, congelamento e zebrado) |
| **HISTORICO_AUDITORIA** | Guardião $\rightarrow$ Auditar Aba | `Features/GuardiaoQualidade.js` $\rightarrow$ `Render/RendererAuditoriaSaude.js` | Motor do Guardião (`Core/RegrasQualidade.js`) | `[HISTORICO] Auditoria Ocorrencias` | Histórico acumulado | Cumulativo | 9 Colunas de Diagnóstico + Data/Hora | **CONTRATO VISUAL A IMPLEMENTAR NO M06** (Zebrado cumulativo e destaque na coluna de severidade) |

---

## 🛑 Regras de Governança e Diretrizes Absolutas

1. **Distinção entre Compilador Visual e Motor Interno:** Os arquivos `Compilador PIP.js`, `Compilador_Armas.js`, `Compilador de Entorpecentes.js`, `CPM – Compilador de Pontuação Mensal.js` e `Features/CompiladorProdutividade.js` são os **compiladores/geradores de apresentação visual** dos relatórios. Os componentes `PluginArmas` e `PluginEntorpecentes` pertencem exclusivamente ao motor matemático interno V2.
2. **Central Analítica Suspensa:** A Central Analítica permanece estritamente suspensa (`SUSPENSA`). Nenhuma chamada ou consolidador ativo da Central Analítica deve ser incluído nesta sprint.
3. **Isolamento da Paleta de Severidades:** A paleta de severidades de auditoria (`CRITICO`, `ALERTA`, `OBSERVACAO`, `EXCECAO MANUAL`) pertence **exclusivamente aos relatórios de apoio** (`[AUDITORIA]` e `[HISTORICO]`). Ela **jamais pode substituir ou alterar a paleta oficial consagrada** dos relatórios de produtividade (Comparativo, PIP, Armas, Drogas e CPM).
4. **Preservação Visual da Coluna AM:** A escrita de alertas na Coluna AM (`Alerta Integridade`) das abas mensais **não pode limpar ou resetar as formatações estruturais das linhas** (zebrado, bordas, fontes); ela deve aplicar ou remover **exclusivamente o seu próprio destaque de alerta na célula AM**.
5. **Preservação de Dados Operacionais:** Os renderizadores tratam formatação visual (cores, bordas, fontes, alinhamentos e formatos numéricos) sem alterar os dados operacionais brutos.
6. **Limite Estrito de Arquivos:** Respeitar o teto máximo de **5 arquivos modificados por turno/checkpoint**. Se uma demanda exigir a alteração de mais de 5 arquivos, o executor deve **solicitar autorização prévia ao usuário**.
7. **Zero Push Rule:** Mantida a restrição total de execução de `git push` ou `clasp push`.

---

## 🗓️ Planejamento de Entregas

- `TASK-M06.1-01B`: Inventário Fiel do Código, Separação de Módulos e Regras Visuais (**Em Revisão Documental**).
- `TASK-M06.1-02`: Estilização e Formatação Visual de `[AUDITORIA] Ocorrencias`.
- `TASK-M06.1-03`: Estilização e Formatação Visual de `[HISTORICO] Auditoria Ocorrencias`.
- `TASK-M06.1-04`: Padronização Visual das Abas Mensais Operacionais e Destaques da Coluna AM sem perda de formatação estrutural.
- `TASK-M06.1-05`: Suíte de Testes Visuais e Homologação Offline do M06.
