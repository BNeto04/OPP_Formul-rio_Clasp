/**
 * Função utilitária temporária para analisar a estrutura e matemática da planilha.
 * Execute esta função no painel do Apps Script e envie o log gerado.
 */
function exportSheetMetadata() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();
  const metadata = [];

  sheets.forEach(sheet => {
    const name = sheet.getName();
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    
    // Ignorar abas de log ou compiladas anteriormente para não gerar log gigante
    if (name.startsWith('COMP_') || name.startsWith('LOG_') || name === 'LOG_PIP' || name === 'LOG_CPM') {
      return;
    }
    
    let headers = [];
    if (lastRow >= 1 && lastCol >= 1) {
      headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    }
    
    let sampleRows = [];
    if (lastRow >= 2 && lastCol >= 1) {
      const numRowsToGet = Math.min(3, lastRow - 1); // Pegar apenas as 3 primeiras linhas de exemplo
      sampleRows = sheet.getRange(2, 1, numRowsToGet, lastCol).getValues();
    }
    
    metadata.push({
      sheetName: name,
      dimensions: { rows: lastRow, cols: lastCol },
      headers: headers.map(h => String(h).trim()),
      samples: sampleRows.map(row => row.map(cell => {
        // Se for uma data, formatar de forma legível
        if (cell instanceof Date) {
          return Utilities.formatDate(cell, ss.getSpreadsheetTimeZone(), "dd/MM/yyyy HH:mm:ss");
        }
        return cell;
      }))
    });
  });
  
  Logger.log("=== INÍCIO METADADOS ===");
  Logger.log(JSON.stringify(metadata, null, 2));
  Logger.log("=== FIM METADADOS ===");
}
