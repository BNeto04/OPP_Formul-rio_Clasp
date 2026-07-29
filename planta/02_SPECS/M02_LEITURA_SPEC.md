# Especificação Técnica — Cômodo M02 Leitura

> **Código do Cômodo:** M02  
> **Nome:** Leitura & Adaptadores  
> **Status:** SPEC APROVADA (AGUARDANDO EXECUÇÃO)  

---

## 1. Visão Geral e Responsabilidades

O cômodo **M02 Leitura** é a camada responsável por extrair dados das abas físicas do Google Sheets e convertê-los em estruturas de dados limpas. Ele encapsula todas as nuances da API do `SpreadsheetApp`, conversão de coordenadas de célula (A1 notation vs índices base zero) e tratamento de variações de cabeçalho.

### Pertence ao M02:
- `Leitura/Adaptador2026.js`
- `Core/LeitorPlanilhas.js`
- Funções auxiliares de varredura de colunas e mapeamento dinâmico de cabeçalho.

### Vedações (NÃO pertence ao M02):
- Processamento de regras de negócios ou pontuação (M04 Motor).
- Renderização visual ou formatação de abas (M06 Relatórios).
- Apresentação de menus ou formulários HTML (M01 Entrada).
- Validação de regras de qualidade ou alertas (M05 Guardião).

---

## 2. Regras de Design e Tolerância a Falhas

1. **Mapeamento Flexível de Cabeçalhos:**
   - O leitor deve utilizar busca case-insensitive por nomes de colunas e aliases comuns:
     - `MATRICULA` / `MATRÍCULA` / `MAT`
     - `QDT ARMAS` / `QTD ARMAS` / `ARMAS`
     - `GRADUAÇÃO` / `GRAD` / `POSTO`
     - `PELOTÃO` / `PEL`

2. **Detecção Segura de Limites de Dados:**
   - Para evitar iterar sobre milhares de linhas vazias, a varredura deve identificar a última linha preenchida na coluna de controle (geralmente Coluna `B` - Data ou Coluna `E` - MIKE).

3. **Centralização da Obtenção da Planilha (`ss`):**
   - Eliminar chamadas diretas a `SpreadsheetApp.openById('1S05sTbd3otgjGjrC...')`.
   - Utilizar utilitário centralizado (`Core/Config.js` ou `SpreadsheetApp.getActiveSpreadsheet()`).

---

## 3. Interfaces e Contratos Esperados

### Assinatura do Adaptador 2026:
```javascript
/**
 * Extrai registros brutos de um conjunto de abas mensais em 2026.
 * @param {Array<string>} nomesAbas 
 * @returns {Array<Object>} Lista de objetos estruturados por ocorrência/policial
 */
function lerRegistrosMensais2026(nomesAbas) { ... }
```

---

## 4. Portas de Comunicação
- **M02 → M03 Domínio:** Retorna objetos brutos para criação de `RegistroAnalitico` ou `RegistroCanonico`.
- **M02 → M04 Motor:** Envia lote de dados para agregação em ranking anual ou livre.
