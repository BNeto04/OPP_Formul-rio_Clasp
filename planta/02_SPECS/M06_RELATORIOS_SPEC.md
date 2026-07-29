# Especificação Técnica de Relatórios e Regras Visuais (M06)

> **Documento:** `planta/02_SPECS/M06_RELATORIOS_SPEC.md`  
> **Status:** EM REVISÃO DOCUMENTAL (TASK-M06.1-01A)  
> **Referência Transversal:** `REGRA_TRANSVERSAL_FORMATACAO_RELATORIOS.md`  
> **Escopo:** Design System, Paletas de Cores de Produtividade vs Severidade, Layouts de Tabelas e Regras de Renderização  

---

## 🎨 1. Paletas de Cores e Design System Protegido

### 1.1 Paleta Oficial de Produtividade (Relatórios Oficiais)
As cores a seguir são **consagradas e imutáveis** para a apresentação de produtividade (Comparativo 2026, PIP, Armas, Drogas e CPM). Elas **nunca** podem ser substituídas por cores de auditoria.

#### Cores de Pelotões e Graduações
| Grupo / Pelotão | Cor de Fundo (HEX) | Cor da Fonte (HEX) | Estilo Fonte | Condição de Aplicação |
| :--- | :--- | :--- | :--- | :--- |
| **Oficiais** | `#F1C232` (Amarelo Ouro) | `#000000` (Preto) | Normal | Graduação: MAJ, CAP, TEN, ASP, CEL, TC |
| **1º PEL GTAR** | `#00CC00` (Verde Escuro) | `#000000` (Preto) | **Negrito** | Pelotão contém `GTAR` e `1` |
| **1º PEL** | `#00FF00` (Verde Claro) | `#000000` (Preto) | Normal | Pelotão contém `1` e `PEL` |
| **2º PEL GTAR** | `#3C78D8` (Azul Escuro) | `#FFFFFF` (Branco) | **Negrito** | Pelotão contém `GTAR` e `2` |
| **2º PEL** | `#6D9EEB` (Azul Claro) | `#000000` (Preto) | Normal | Pelotão contém `2` e `PEL` |
| **3º PEL** | `#FFFFFF` (Branco) | `#000000` (Preto) | Normal | Demais pelotões ou 3º PEL |

#### Escala Oficial de Destaque de Armas
| Faixa de Armas | Cor de Fundo (HEX) | Cor da Fonte (HEX) | Descrição na Legenda |
| :--- | :--- | :--- | :--- |
| **0 armas** | `#FF0000` (Vermelho) | `#FF0000` (Vermelho) | Célula totalmente em destaque de atenção |
| **1 a 3 armas** | `#FF9900` (Laranja) | `#000000` (Preto) | Faixa inicial de apreensão |
| **4 a 5 armas** | `#FFFF00` (Amarelo) | `#000000` (Preto) | Faixa intermediária de apreensão |
| **6 a 9 armas** | `#93C47D` (Verde Médio) | `#000000` (Preto) | Faixa alta de apreensão |
| **10+ armas** | `#38761D` (Verde Folha) | `#FFFFFF` (Branco Bold) | Destaque máximo de apreensão |

---

### 1.2 Paleta de Severidades (Exclusiva para Relatórios de Apoio e Auditoria)
Esta paleta se aplica **exclusivamente** às abas `[AUDITORIA] Ocorrencias` e `[HISTORICO] Auditoria Ocorrencias`. **Proibido aplicar em relatórios oficiais de produtividade.**

| Severidade | Cor de Fundo (HEX) | Cor da Fonte (HEX) | Aplicação em Auditoria |
| :--- | :--- | :--- | :--- |
| **ERRO TECNICO** | `#900C3F` (Vinho/Bordô) | `#FFFFFF` (Branco Bold) | Erro técnico de execução de scripts |
| **CRITICO** | `#D9534F` (Vermelho) | `#FFFFFF` (Branco Bold) | Ocorrência órfã (policial sem MIKE) |
| **ALERTA** | `#F0AD4E` (Laranja/Amarelo) | `#212529` (Preto Bold) | MIKE suspeito, data divergente, rateio |
| **OBSERVACAO** | `#5BC0DE` (Azul Claro) | `#212529` (Preto) | Fato não auditável, modo limitado PIP |
| **EXCECAO MANUAL**| `#6F42C1` (Roxo/Púrpura) | `#FFFFFF` (Branco Bold) | Ajuste justificado por nota `EXCECAO:` |
| **APROVADO / OK** | `#28A745` (Verde) | `#FFFFFF` (Branco Bold) | Sem inconformidades encontradas |

---

## 📐 2. Estrutura Visual, Congelamento e Formatos Numéricos

### 2.1 Padrão Visual do Comparativo 2026 e Relatórios Oficiais
- **Título Principal (Linha 2):** Fonte Arial 20pt Negrito, Centralizado, Borda Espessa `#000000`, Fundo Branco.
- **Linha de Metadados (Linha 4):** Fonte Arial 10pt Cor `#4B5563`, Centralizado (`Ano base | Periodo | Policiais`).
- **Linha de Grupos (Linha 5):** Fundo `#9E9E9E`, Texto Preto Negrito, Centralizado.
- **Linha de Cabeçalhos (Linha 6):** Fundo `#F3F4F6`, Texto Preto Negrito, Centralizado.
- **Congelamento:** `sheet.setFrozenRows(6)` (fixa o cabeçalho durante a rolagem).
- **AutoFiltro:** `createFilter()` aplicado sobre a linha de cabeçalho.
- **Larguras Fixas de Colunas (Comparativo):**
  - Coluna 1 (Nº): `44px`
  - Coluna 2 (Grad): `70px`
  - Coluna 3 (Matrícula): `92px`
  - Coluna 4 (Nome Guerra): `260px`
  - Coluna 5 (Escala/Pelotão): `86px`
  - Coluna 6 (Qtd. Ocorrências): `72px`
  - Coluna 7 (Pontuação Rateada): `112px` (Format: `#,##0.00`)
  - Coluna 8 (Qtd. Armas): `92px` (Format: `#,##0`)
  - Coluna 9 (Entorpecentes Total): `140px` (Format: `#,##0.00`)

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
