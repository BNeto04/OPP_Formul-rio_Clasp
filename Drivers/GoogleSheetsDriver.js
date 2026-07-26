/**
 * ARQUIVO: Drivers/GoogleSheetsDriver.js
 * DESCRIÇÃO: Encapsula absolutamente todas as interações com a API do Google Sheets.
 * Recebe um DocumentoLógico (agnóstico) e efetiva as pinturas, escritas e filtros
 * na planilha física. Nenhuma outra classe deve chamar setValues() ou setBackground().
 */

class GoogleSheetsDriver {
  /**
   * Materializa um DocumentoLógico na interface do Google Sheets.
   * @param {SpreadsheetApp.Spreadsheet} planilha - A planilha destino
   * @param {DocumentoLogico} documento - O relatório abstraído
   */
  static materializar(planilha, documento) {
    const nomeAba = documento.titulo;
    let aba = planilha.getSheetByName(nomeAba);
    
    // 1. Criar ou Limpar a Aba (Isolamento de API)
    if (aba) {
      aba.clear();
      if (aba.getFilter()) {
        aba.getFilter().remove();
      }
    } else {
      aba = planilha.insertSheet(nomeAba);
    }

    if (documento.linhas.length === 0 && documento.cabecalhos.length === 0) {
      return; // Documento vazio
    }

    // 2. Escrever Dados
    const totalLinhas = documento.linhas.length + 1; // +1 do cabeçalho
    const totalColunas = documento.cabecalhos.length;
    
    const range = aba.getRange(1, 1, totalLinhas, totalColunas);
    const matrizValores = [documento.cabecalhos, ...documento.linhas];
    
    range.setValues(matrizValores);

    // 3. Aplicar Estilos (Cores Lógicas mapeadas para Cores Físicas hex)
    if (documento.estilos && documento.estilos.length === totalLinhas) {
      range.setBackgrounds(documento.estilos);
    }

    // 4. Acabamentos Físicos (Congelamento, Filtro e Resize)
    aba.setFrozenRows(1);
    aba.getRange(1, 1, 1, totalColunas).setFontWeight("bold");
    range.createFilter();
    
    for (let i = 1; i <= totalColunas; i++) {
      aba.autoResizeColumn(i);
    }
  }
}
