# Sprint M06 — Relatórios Oficiais e Formatação Visual

> **Documento:** `planta/01_SPRINTS/SPRINT_M06_RELATORIOS.md`  
> **Status:** EM REVISÃO DOCUMENTAL (TASK-M06.1-01A)  
> **Contexto:** Ecossistema Synthéon GS Down Plant Offline  

---

## 🎯 Objetivo da Sprint

Padronizar a apresentação visual, estrutura de tabelas, estilos de cabeçalho, formatação numérica e geração de relatórios do ecossistema Synthéon em ambiente offline, separando rigorosamente os **Relatórios Oficiais de Produtividade** dos **Relatórios de Apoio e Auditoria**, garantindo a preservação integral do Design System consagrado.

---

## 📊 Classificação e Separação dos Relatórios

### 1. Relatórios Oficiais de Produtividade
Relatórios institucionais que utilizam a paleta operacional oficial (Cores de Pelotões/Oficiais e Legenda de Armas).
- **PIP (Produtividade Individual e por Pelotão)**
- **COMPARATIVO_2026**
- **RELATÓRIO DE ARMAS**
- **RELATÓRIO DE DROGAS**
- **RELATÓRIO DE CPM (Comando de Policiamento Multimissão)**

### 2. Relatórios de Apoio e Diagnóstico
Relatórios técnicos gerados pelo Guardião da Qualidade que utilizam a paleta de severidades.
- **`[AUDITORIA] Ocorrencias`** (Última varredura de saúde da aba)
- **`[HISTORICO] Auditoria Ocorrencias`** (Registro histórico cumulativo)

---

## 📋 Tabela de Inventário dos Relatórios Oficiais e de Apoio

| Relatório | Menu de Origem | Compilador | Renderizador | Aba de Saída | Fonte de Dados | Período | Métricas Obrigatórias | Regra Visual Protegida |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **COMPARATIVO_2026** | Synthéon $\rightarrow$ Comparativo | Motor V2 | `RendererComparativo2026.js` | `[COMPARATIVO] 2026` | Abas mensais (`JAN`..`DEZ`) | Anual Acumulado | Ocorrências, Pontuação, Armas, Drogas | Paleta de Pelotões/Oficiais, Escala de Armas (0, 1-3, 4-5, 6-9, 10+), Carimbo |
| **PIP** | Synthéon $\rightarrow$ PIP | Motor V2 | `RendererComparativo2026.js` / `RendererTabela.js` | `[RELATORIO] PIP` | Abas mensais (`JAN`..`DEZ`) | Mensal / Acumulado | Pontos Totais, PONTOS FICÇÃO, Pelotão | Paleta de Pelotões, Negrito GTAR, Formatação `#,##0.00` |
| **ARMAS** | Synthéon $\rightarrow$ Armas | PluginArmas | `RendererComparativo2026.js` / `RendererTabela.js` | `[RELATORIO] Armas` | Abas mensais (`JAN`..`DEZ`) | Mensal / Acumulado | Total Armas, Ocorrências com Arma | Escala Oficial de Armas (0 em Vermelho, 1-3, 4-5, 6-9, 10+ Verde Escuro) |
| **DROGAS** | Synthéon $\rightarrow$ Entorpecentes | PluginEntorpecentes | `RendererComparativo2026.js` / `RendererTabela.js` | `[RELATORIO] Drogas` | Abas mensais (`JAN`..`DEZ`) | Mensal / Acumulado | Maconha, Crack, Cocaína, Peso Total | Formato `#,##0.00`g, Alinhamento à Direita |
| **CPM** | Synthéon $\rightarrow$ CPM | Motor V2 | `RendererComparativo2026.js` / `RendererTabela.js` | `[RELATORIO] CPM` | Abas mensais (`JAN`..`DEZ`) | Mensal / Acumulado | Consolidado Operacional por Pelotão | Paleta Oficial de Pelotões, Títulos em Azul Escuro (`#1C3144`) |
| **AUDITORIA** | Guardião $\rightarrow$ Auditar Aba | GuardiaoQualidade | `RendererAuditoriaSaude.js` | `[AUDITORIA] Ocorrencias` | Aba mensal selecionada | Instância Atual | 8 Colunas de Diagnóstico, Resumo de Saúde | Paleta de Severidades (CRITICO, ALERTA, OBSERVACAO, EXCECAO, APROVADO) |
| **HISTORICO_AUDITORIA** | Guardião $\rightarrow$ Auditar Aba | GuardiaoQualidade | `RendererAuditoriaSaude.js` | `[HISTORICO] Auditoria Ocorrencias` | Histórico acumulado | Cumulativo | 9 Colunas de Diagnóstico + Data/Hora | Tabela cumulativa, Zebrado, Destaque de Severidade na Coluna E |

---

## 🛑 Regras de Governança e Diretrizes Absolutas

1. **Central Analítica Suspensa:** A Central Analítica permanece estritamente suspensa (`SUSPENSA`). Nenhuma chamada ou consolidador ativo da Central Analítica deve ser incluído nos relatórios desta sprint.
2. **Isolamento da Paleta de Severidades:** A paleta de severidades de auditoria (`CRITICO`, `ALERTA`, `OBSERVACAO`, `EXCECAO MANUAL`) pertence **exclusivamente aos relatórios de apoio** (`[AUDITORIA]` e `[HISTORICO]`). Ela **jamais pode substituir ou alterar a paleta oficial consagrada** dos relatórios de produtividade (Comparativo, PIP, Armas, Drogas e CPM).
3. **Preservação Visual da Coluna AM:** A escrita de alertas na Coluna AM (`Alerta Integridade`) das abas mensais **não pode limpar ou resetar as formatações estruturais das linhas** (zebrado, bordas, fontes); ela deve aplicar ou remover **exclusivamente o seu próprio destaque de alerta na célula AM**.
4. **Preservação de Dados Operacionais:** Os renderizadores tratam formatação visual (cores, bordas, fontes, alinhamentos e formatos numéricos) sem alterar os dados operacionais brutos.
5. **Limite Estrito de Arquivos:** Respeitar o teto máximo de **5 arquivos modificados por turno/checkpoint**. Se uma demanda exigir a alteração de mais de 5 arquivos, o executor deve **solicitar autorização prévia ao usuário**.
6. **Zero Push Rule:** Mantida a restrição total de execução de `git push` ou `clasp push`.

---

## 🗓️ Planejamento de Entregas

- `TASK-M06.1-01A`: Inventário de Relatórios, Separação de Módulos e Regras Visuais (**Em Revisão**).
- `TASK-M06.1-02`: Estilização e Formatação Visual de `[AUDITORIA] Ocorrencias`.
- `TASK-M06.1-03`: Estilização e Formatação Visual de `[HISTORICO] Auditoria Ocorrencias`.
- `TASK-M06.1-04`: Padronização Visual das Abas Mensais Operacionais e Destaques da Coluna AM sem perda de formatação estrutural.
- `TASK-M06.1-05`: Suíte de Testes Visuais e Homologação Offline do M06.
