# Especificação Técnica de Relatórios e Regras Visuais (M06)

> **Documento:** `planta/02_SPECS/M06_RELATORIOS_SPEC.md`  
> **Status:** TASK-M06.1-01C CONCLUÍDA  
> **Referência Transversal:** `REGRA_TRANSVERSAL_FORMATACAO_RELATORIOS.md`  
> **Escopo:** Design System, Paletas de Cores de Produtividade vs Severidade, Layouts de Tabelas e Mapeamento de Implementação  

---

## 🎨 1. Paletas de Cores e Design System Protegido

### 1.1 Paleta Oficial de Produtividade (Relatórios Oficiais)
As cores a seguir são **consagradas no projeto** para a apresentação de produtividade (Comparativo 2026, PIP, Armas, Drogas e CPM). Elas **nunca** podem ser substituídas por cores de auditoria.

#### Cores de Pelotões e Graduações
| Grupo / Pelotão | Cor de Fundo (HEX) | Cor da Fonte (HEX) | Estilo Fonte | Status da Implementação no Código |
| :--- | :--- | :--- | :--- | :--- |
| **Oficiais** | `#F1C232` (Amarelo Ouro) | `#000000` (Preto) | Normal | **IMPLEMENTADA NO CÓDIGO ATUAL** (`RendererComparativo2026.js`, `Compilador_Armas.js`, `Compilador de Entorpecentes.js`) |
| **1º PEL GTAR** | `#00CC00` (Verde Escuro) | `#000000` (Preto) | **Negrito** | **IMPLEMENTADA NO CÓDIGO ATUAL** (`RendererComparativo2026.js`) / *A padronizar nos demais no M06* |
| **1º PEL** | `#00FF00` (Verde Claro) | `#000000` (Preto) | Normal | **IMPLEMENTADA NO CÓDIGO ATUAL** (`RendererComparativo2026.js`, `Compilador_Armas.js`, `Compilador de Entorpecentes.js`) |
| **2º PEL GTAR** | `#3C78D8` (Azul Escuro) | `#FFFFFF` (Branco) | **Negrito** | **IMPLEMENTADA NO CÓDIGO ATUAL** (`RendererComparativo2026.js`) / *A padronizar nos demais no M06* |
| **2º PEL** | `#6D9EEB` (Azul Claro) | `#000000` (Preto) | Normal | **IMPLEMENTADA NO CÓDIGO ATUAL** (`RendererComparativo2026.js`, `Compilador_Armas.js`, `Compilador de Entorpecentes.js`) |
| **3º PEL** | `#FFFFFF` (Branco) | `#000000` (Preto) | Normal | **IMPLEMENTADA NO CÓDIGO ATUAL** (`RendererComparativo2026.js`, `Compilador_Armas.js`) |

#### Escala Oficial de Destaque de Armas
| Faixa de Armas | Cor de Fundo (HEX) | Cor da Fonte (HEX) | Descrição | Status da Implementação no Código |
| :--- | :--- | :--- | :--- | :--- |
| **0 armas** | `#FF0000` (Vermelho) | `#FF0000` (Vermelho) | Célula totalmente em destaque de atenção | **IMPLEMENTADA NO CÓDIGO ATUAL** (`RendererComparativo2026.js`) |
| **1 a 3 armas** | `#FF9900` (Laranja) | `#000000` (Preto) | Faixa inicial de apreensão | **IMPLEMENTADA NO CÓDIGO ATUAL** (`RendererComparativo2026.js`) |
| **4 a 5 armas** | `#FFFF00` (Amarelo) | `#000000` (Preto) | Faixa intermediária de apreensão | **IMPLEMENTADA NO CÓDIGO ATUAL** (`RendererComparativo2026.js`) |
| **6 a 9 armas** | `#93C47D` (Verde Médio) | `#000000` (Preto) | Faixa alta de apreensão | **IMPLEMENTADA NO CÓDIGO ATUAL** (`RendererComparativo2026.js`) |
| **10+ armas** | `#38761D` (Verde Folha) | `#FFFFFF` (Branco Bold) | Destaque máximo de apreensão | **IMPLEMENTADA NO CÓDIGO ATUAL** (`RendererComparativo2026.js`) |

---

### 1.2 Paleta de Severidades (Exclusiva para Relatórios de Apoio e Auditoria)
Esta paleta se aplica **exclusivamente** às abas `[AUDITORIA] Ocorrencias` e `[HISTORICO] Auditoria Ocorrencias`. **Proibido aplicar em relatórios oficiais de produtividade.**

| Severidade | Cor de Fundo (HEX) | Cor da Fonte (HEX) | Aplicação em Auditoria | Status no Código |
| :--- | :--- | :--- | :--- | :--- |
| **ERRO TECNICO** | `#900C3F` (Vinho/Bordô) | `#FFFFFF` (Branco Bold) | Erro técnico de execução | **CONTRATO VISUAL A IMPLEMENTAR NO M06** |
| **CRITICO** | `#D9534F` (Vermelho) | `#FFFFFF` (Branco Bold) | Ocorrência órfã | **CONTRATO VISUAL A IMPLEMENTAR NO M06** |
| **ALERTA** | `#F0AD4E` (Laranja/Amarelo) | `#212529` (Preto Bold) | Divergência de MIKE/Data/Rateio | **CONTRATO VISUAL A IMPLEMENTAR NO M06** |
| **OBSERVACAO** | `#5BC0DE` (Azul Claro) | `#212529` (Preto) | Fato não auditável, modo limitado PIP | **CONTRATO VISUAL A IMPLEMENTAR NO M06** |
| **EXCECAO MANUAL**| `#6F42C1` (Roxo/Púrpura) | `#FFFFFF` (Branco Bold) | Ajuste justificado por nota `EXCECAO:` | **CONTRATO VISUAL A IMPLEMENTAR NO M06** |
| **APROVADO / OK** | `#28A745` (Verde) | `#FFFFFF` (Branco Bold) | Sem inconformidades encontradas | **CONTRATO VISUAL A IMPLEMENTAR NO M06** |

---

## 📐 2. Estrutura Visual, Congelamento e Formatos Numéricos

### 2.1 Padrão Visual do Comparativo 2026 (`Features/CompiladorProdutividade.js` $\rightarrow$ `Render/RendererComparativo2026.js`)
- **Gatilhos / Funções Reais:** `abrirMenuComparativo2026()`, `gerarComparativo2026Premium()`
- **Aba de Saída:** `COMPARATIVO_2026` (**IMPLEMENTADA NO CÓDIGO ATUAL**)
- **Título Principal (Linha 2):** Fonte Arial 20pt Negrito, Centralizado, Borda Espessa `#000000`, Fundo Branco (**IMPLEMENTADA NO CÓDIGO ATUAL**).
- **Linha de Metadados (Linha 4):** Fonte Arial 10pt Cor `#4B5563`, Centralizado (`Ano base | Periodo | Policiais`) (**IMPLEMENTADA NO CÓDIGO ATUAL**).
- **Linha de Grupos (Linha 5):** Fundo `#9E9E9E`, Texto Preto Negrito, Centralizado (**IMPLEMENTADA NO CÓDIGO ATUAL**).
- **Linha de Cabeçalhos (Linha 6):** Fundo `#F3F4F6`, Texto Preto Negrito, Centralizado (**IMPLEMENTADA NO CÓDIGO ATUAL**).
- **Congelamento:** `sheet.setFrozenRows(6)` (**IMPLEMENTADA NO CÓDIGO ATUAL**).
- **Gridlines:** Ocultas via `sheet.setHiddenGridlines(true)` (**IMPLEMENTADA NO CÓDIGO ATUAL**).
- **AutoFiltro:** `createFilter()` aplicado sobre a linha de cabeçalho (**IMPLEMENTADA NO CÓDIGO ATUAL**).
- **Larguras Fixas de Colunas:** Col 1 (44px), Col 2 (70px), Col 3 (92px), Col 4 (260px), Col 5 (86px), Col 6 (72px), Col 7 (112px), Col 8 (92px), Col 9 (140px) (**IMPLEMENTADA NO CÓDIGO ATUAL**).
- **Formatos Numéricos:** Pontuação (`#,##0.00`), Entorpecentes (`#,##0.00`) (**IMPLEMENTADA NO CÓDIGO ATUAL**).

### 2.2 Padrão Visual do PIP (`Compilador PIP.js`)
- **Gatilhos / Funções Reais:** `criarMenuPip_()`, `abrirMenuPipMensal()`, `abrirMenuPipLivre()`, `gerarPipAnual()`, `criarAbaResultado_()`
- **Regra Temporal PIP:** Período de apuração de 29 do mês anterior a 28 do mês atual.
- **Abas de Saída:** `PIP_<período>`, `PIP_ANUAL_2026`, `PIP_SELECAO_LIVRE` (**IMPLEMENTADAS NO CÓDIGO ATUAL**).
- **Estrutura Atual:** Cabeçalho de 7 colunas em `#D9EAD3` negrito centralizado, `setFrozenRows(1)`, AutoFiltro, formato `#,##0.00` na Coluna 6 (Pontuação) (**IMPLEMENTADA NO CÓDIGO ATUAL**).
- **Contrato M06:** Padronização visual completa no Design System Synthéon (**CONTRATO VISUAL A IMPLEMENTAR NO M06**).

### 2.3 Padrão Visual do CPM (`CPM – Compilador de Pontuação Mensal.js`)
- **Gatilhos / Funções Reais:** `criarMenuCPM_()`, `abrirMenuCPMMensal()`, `abrirMenuCPMLivre()`, `gerarCPMAnual()`, `criarAbaResultadoCPM_()`
- **Regra Temporal CPM:** Período de apuração do mês civil (1º ao último dia do mês).
- **Abas de Saída:** `CPM_<mes>`, `CPM_ANUAL_2026`, `CPM_SELECAO_LIVRE` (**IMPLEMENTADAS NO CÓDIGO ATUAL**).
- **Estrutura Atual:** Cabeçalho 6 colunas em `#D9EAD3` negrito centralizado, `setFrozenRows(1)`, AutoFiltro, formato `#,##0.00` na Coluna 6 (**IMPLEMENTADA NO CÓDIGO ATUAL**).
- **Contrato M06:** Padronização visual no Design System Synthéon (**CONTRATO VISUAL A IMPLEMENTAR NO M06**).

### 2.4 Padrão Visual de Armas (`Compilador_Armas.js`)
- **Gatilhos / Funções Reais:** `criarMenuArmas_()`, `abrirMenuSelecaoLivre()`
- **Abas de Saída:** `COMP_ARMAS_2026`, `COMP_ARMAS_<período>` (**IMPLEMENTADAS NO CÓDIGO ATUAL**).
- **Estrutura Atual:** Cabeçalho 5 colunas em `#E0E0E0` negrito, cores básicas de Pelotão (`#F1C232` Oficiais, `#00FF00` 1º PEL, `#6D9EEB` 2º PEL, `#FFFFFF` 3º PEL) (**IMPLEMENTADA NO CÓDIGO ATUAL**).
- **Contrato M06:** Incorporar escala de destaque de armas, GTAR e carimbo de auditoria (**CONTRATO VISUAL A IMPLEMENTAR NO M06**).

### 2.5 Padrão Visual de Entorpecentes / Drogas (`Compilador de Entorpecentes.js`)
- **Gatilhos / Funções Reais:** `criarMenuDrogas_()`, `abrirMenuSelecaoLivreDrogas()`
- **Abas de Saída:** `COMP_DROGAS_2026`, `COMP_DROGAS_<período>` (**IMPLEMENTADAS NO CÓDIGO ATUAL**).
- **Estrutura Atual:** Cabeçalho 10 colunas em `#E0E0E0` negrito, cores básicas de Pelotão (**IMPLEMENTADA NO CÓDIGO ATUAL**).
- **Contrato M06:** Padronização com GTAR, alinhamentos à direita e formatos `#,##0.00`g estritos (**CONTRATO VISUAL A IMPLEMENTAR NO M06**).

---

## 🛡️ 3. Regra de Formatação da Coluna AM (`Alerta Integridade`)

- **Preservação Estrutural da Linha:** Ao escrever um diagnóstico ou limpar o alerta na Coluna AM das abas mensais, o script **jamais pode resetar a cor de fundo, bordas ou fonte dos dados das colunas A até AL**.
- **Ação Restrita à Célula AM:**
  - **Com Alerta:** Aplica destaque Amarelo/Laranja (`#FFF3CD` / `#856404`) **exclusivamente na célula AM** da linha auditada.
  - **Sem Alerta (Limpa):** Reseta o fundo e limpa o texto **exclusivamente na célula AM** da linha auditada, mantendo o zebrado e as bordas originais da planilha intactos.

---

## 🔒 4. Restrições de Governança
- A **Central Analítica** permanece **SUSPENSA**. Nenhuma regra de relatório deve invocar ou depender da Central Analítica nesta sprint.
- Toda modificação visual deve manter conformidade com as suítes de testes unitários offline em Node.js.
