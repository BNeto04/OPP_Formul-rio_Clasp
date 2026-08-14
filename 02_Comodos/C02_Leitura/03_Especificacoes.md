# EspecificaÃ§Ã£o TÃ©cnica â€” CÃ´modo C02 Leitura

> **CÃ³digo do CÃ´modo:** C02  
> **Nome:** Leitura & Adaptadores  
> **Status:** SPEC APROVADA (AGUARDANDO EXECUÃ‡ÃƒO)  

---

## 1. VisÃ£o Geral e Responsabilidades

O cÃ´modo **C02 Leitura** Ã© a camada responsÃ¡vel por extrair dados das abas fÃ­sicas do Google Sheets e convertÃª-los em estruturas de dados limpas. Ele encapsula todas as nuances da API do `SpreadsheetApp`, conversÃ£o de coordenadas de cÃ©lula (A1 notation vs Ã­ndices base zero) e tratamento de variaÃ§Ãµes de cabeÃ§alho.

### Pertence ao C02:
- `Leitura/Adaptador2026.js`
- `Core/LeitorPlanilhas.js`
- FunÃ§Ãµes auxiliares de varredura de colunas e mapeamento dinÃ¢mico de cabeÃ§alho.

### VedaÃ§Ãµes (NÃƒO pertence ao C02):
- Processamento de regras de negÃ³cios ou pontuaÃ§Ã£o (C04 Motor).
- RenderizaÃ§Ã£o visual ou formataÃ§Ã£o de abas (C06 RelatÃ³rios).
- ApresentaÃ§Ã£o de menus ou formulÃ¡rios HTML (C01 Entrada).
- ValidaÃ§Ã£o de regras de qualidade ou alertas (C05 GuardiÃ£o).

---

## 2. Regras de Design e TolerÃ¢ncia a Falhas

1. **Mapeamento FlexÃ­vel de CabeÃ§alhos:**
   - O leitor deve utilizar busca case-insensitive por nomes de colunas e aliases comuns:
     - `MATRICULA` / `MATRÃCULA` / `MAT`
     - `QDT ARMAS` / `QTD ARMAS` / `ARMAS`
     - `GRADUAÃ‡ÃƒO` / `GRAD` / `POSTO`
     - `PELOTÃƒO` / `PEL`

2. **DetecÃ§Ã£o Segura de Limites de Dados:**
   - Para evitar iterar sobre milhares de linhas vazias, a varredura deve identificar a Ãºltima linha preenchida na coluna de controle (geralmente Coluna `B` - Data ou Coluna `E` - MIKE).

3. **CentralizaÃ§Ã£o da ObtenÃ§Ã£o da Planilha (`ss`):**
   - Eliminar chamadas diretas a `SpreadsheetApp.openById('1S05sTbd3otgjGjrC...')`.
   - Utilizar utilitÃ¡rio centralizado (`Core/Config.js` ou `SpreadsheetApp.getActiveSpreadsheet()`).

---

## 3. Interfaces e Contratos Esperados

### Assinatura do Adaptador 2026:
```javascript
/**
 * Extrai registros brutos de um conjunto de abas mensais em 2026.
 * @param {Array<string>} nomesAbas 
 * @returns {Array<Object>} Lista de objetos estruturados por ocorrÃªncia/policial
 */
function lerRegistrosMensais2026(nomesAbas) { ... }
```

---

## 4. Portas de ComunicaÃ§Ã£o
- **C02 â†’ C03 DomÃ­nio:** Retorna objetos brutos para criaÃ§Ã£o de `RegistroAnalitico` ou `RegistroCanonico`.
- **C02 â†’ C04 Motor:** Envia lote de dados para agregaÃ§Ã£o em ranking anual ou livre.

