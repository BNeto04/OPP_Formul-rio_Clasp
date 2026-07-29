# Especificação Técnica de Relatórios e Regras Visuais (M06)

> **Documento:** `planta/02_SPECS/M06_RELATORIOS_SPEC.md`  
> **Status:** EM ELABORAÇÃO (TASK-M06.1-01)  
> **Escopo:** Design System, Paletas de Cores, Tipografia e Leiautes para Google Sheets / Apps Script  

---

## 🎨 1. Guia de Estilo e Design System Operacional

### 1.1 Paleta de Cores Institucional e Severidades

| Categoria / Elemento | Cor de Fundo (HEX) | Cor do Texto (HEX) | Aplicação |
| :--- | :--- | :--- | :--- |
| **Cabeçalho Principal** | `#1C3144` (Azul Escuro) | `#FFFFFF` (Branco) | Títulos das tabelas de auditoria e relatório |
| **Cabeçalho Secundário** | `#2C4257` (Azul Médio) | `#FFFFFF` (Branco) | Subtítulos e colunas de suporte |
| **Linha Zebrada Par** | `#F8F9FA` (Cinza Múltiplo) | `#212529` (Preto) | Leitura confortável de tabelas longas |
| **Linha Zebrada Ímpar** | `#FFFFFF` (Branco Puro) | `#212529` (Preto) | Base limpa para alternância visual |
| **Severidade: ERRO TECNICO** | `#900C3F` (Vinho/Bordô) | `#FFFFFF` (Branco Bold) | Falha grave de execução do script |
| **Severidade: CRITICO** | `#D9534F` (Vermelho) | `#FFFFFF` (Branco Bold) | Ocorrência órfã, violações estruturais |
| **Severidade: ALERTA** | `#F0AD4E` (Laranja/Amarelo) | `#212529` (Preto Bold) | Divergência de MIKE/Data/Rateio |
| **Severidade: OBSERVACAO** | `#5BC0DE` (Azul Claro) | `#212529` (Preto) | Fato não auditável, modo limitado PIP |
| **Severidade: EXCECAO MANUAL**| `#6F42C1` (Roxo/Púrpura) | `#FFFFFF` (Branco Bold) | Ajuste justificado por nota |
| **Status: APROVADO / OK** | `#28A745` (Verde) | `#FFFFFF` (Branco Bold) | Planilha 100% integra |

---

## 📐 2. Tipografia, Alinhamentos e Formatação de Números

### 2.1 Tipografia e Hierarquia
- **Fonte Padrão:** `Roboto`, `Arial` ou a fonte padrão da planilha.
- **Tamanho dos Títulos:** `11pt` a `12pt` em negrito.
- **Tamanho dos Dados:** `9pt` a `10pt` normal.
- **Resumos Superiores:** `10pt` em negrito com rótulos destacados.

### 2.2 Alinhamentos Recomendados
- **Textos / Nomes / Diagnósticos:** Alinhado à **Esquerda**.
- **Datas / MIKE / BOE / Matrículas / Severidades / Linhas:** **Centralizado**.
- **Valores Numéricos (Armas, Gramaturas, Pontos, Rateios):** Alinhado à **Direita**.

### 2.3 Formatação Numérica Padrão
- **Gramaturas de Drogas (Maconha, Crack, Cocaína):** `0.00` (ex: `15.50` g).
- **Quantidades de Armas e Munições:** `#,##0` (Inteiros, ex: `2`).
- **Pontos Totais e PONTOS FICÇÃO:** `0.00` ou `0` conforme a precisão.
- **Valores Monetários (Numerário):** `R$ #,##0.00`.

---

## 📋 3. Estrutura dos Relatórios Oficiais

### 3.1 Aba `[AUDITORIA] Ocorrencias`
- **Linhas 1-3:** Card de Resumo de Saúde da Aba (Data/Hora, Nome da Aba, Linhas/Túneis, Totalizadores por Severidade).
- **Linha 4:** Espaçamento/Linha de Separação Visual.
- **Linha 5:** Cabeçalho de 8 Colunas (`ABA`, `TÚNEL`, `LINHA`, `SEVERIDADE`, `REGRA`, `DIAGNÓSTICO`, `EVIDÊNCIA`, `AÇÃO RECOMENDADA`).
- **Linha 6+:** Diagnósticos formatados com fundo colorido por severidade nas colunas de `SEVERIDADE` e `REGRA`.

### 3.2 Aba `[HISTORICO] Auditoria Ocorrencias`
- **Linha 1:** Cabeçalho de 9 Colunas (`DATA/HORA EXECUÇÃO`, `ABA`, `TÚNEL`, `LINHA`, `SEVERIDADE`, `REGRA`, `DIAGNÓSTICO`, `EVIDÊNCIA`, `AÇÃO RECOMENDADA`).
- **Linha 2+:** Registros históricos preservando zebrado e destaque visual na coluna `SEVERIDADE`.

### 3.3 Coluna AM (`Alerta Integridade`) nas Abas Mensais
- Destaque discreto nas células preenchidas (fundo leve amarelo/laranja e texto em negrito).
- Limpeza total de formatação se a célula estiver vazia.

---

## 🔒 4. Restrições de Governança
- A **Central Analítica** permanece **SUSPENSA**. Nenhuma regra de relatório deve invocar a Central Analítica nesta fase.
- Modificações de layout não devem quebrar o parsing de testes automatizados em Node.js.
