function logFormulas() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("JUL2026");
  if (!sheet) {
    Logger.log("Aba JUL2026 não encontrada.");
    return;
  }
  
  // Colunas de interesse:
  // 19: TOTAL DE MACONHA
  // 20: Dividido mac
  // 23: Total CRACK (gr)
  // 26: TOTAL DE COCAINA
  // 27: Dividido coc
  // 35: PONTOS TOTAIS
  // 36: PONTOS FICÇÃO (1/4)
  // 37: Chave Ocorrência
  
  const cols = [19, 20, 23, 26, 27, 35, 36, 37];
  const row = 2;
  
  Logger.log("=== FÓRMULAS DA LINHA 2 ===");
  cols.forEach(col => {
    const range = sheet.getRange(row, col);
    const header = sheet.getRange(1, col).getValue();
    const formula = range.getFormula();
    const value = range.getValue();
    Logger.log(`Coluna ${col} [${header}]: Formula="${formula}" | Valor="${value}"`);
  });
  
  const row3 = 3;
  Logger.log("=== FÓRMULAS DA LINHA 3 ===");
  cols.forEach(col => {
    const range = sheet.getRange(row3, col);
    const header = sheet.getRange(1, col).getValue();
    const formula = range.getFormula();
    const value = range.getValue();
    Logger.log(`Coluna ${col} [${header}]: Formula="${formula}" | Valor="${value}"`);
  });
}
