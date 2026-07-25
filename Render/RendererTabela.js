/**
 * ARQUIVO: Render/RendererTabela.js
 * @deprecated Mantido apenas para fluxos legados de produtividade V1.
 * Prefira renderizadores específicos como RendererComparativo2026.
 * DESCRIÇÃO: Renderizador genérico de tabelas com bloco de metadados.
 * Totalmente isolado das regras de negócio do aplicativo.
 */
const RendererTabela = {
  /**
   * Renderiza os dados em uma aba destino, criando-a ou limpando-a.
   * @param {SpreadsheetApp.Spreadsheet} ss - A planilha ativa.
   * @param {string} nomeAba - Nome da aba de destino.
   * @param {Array<string>} cabecalho - Array com os nomes das colunas.
   * @param {Array<Array<any>>} dados - Matriz 2D com os dados a renderizar.
   * @param {Object} metadata - Objeto com informações do relatório.
   */
  render(ss, nomeAba, cabecalho, dados, metadata) {
    let sheet = ss.getSheetByName(nomeAba);
    if (!sheet) {
      sheet = ss.insertSheet(nomeAba);
    } else {
      sheet.clear();
      // Remove filtros anteriores, se houver
      if (sheet.getFilter()) {
        sheet.getFilter().remove();
      }
    }

    const { titulo, periodo, abasLidas, policiais, ocorrencias, atualizado, tempo } = metadata;

    // Linhas de Metadados
    const linhasMeta = [
      [titulo || "RELATÓRIO CONSOLIDADO", ""],
      ["Período:", periodo || "-"],
      ["Abas lidas:", abasLidas || 0],
      ["Policiais:", policiais || 0],
      ["Ocorrências:", ocorrencias || 0],
      ["Atualizado:", atualizado || ""],
      ["Tempo:", tempo || ""]
    ];

    sheet.getRange(1, 1, linhasMeta.length, 2).setValues(linhasMeta);
    sheet.getRange(1, 1, 1, 2).setFontWeight("bold").setBackground("#073763").setFontColor("#ffffff");
    sheet.getRange(2, 1, linhasMeta.length - 1, 1).setFontWeight("bold");

    // Espaçamento
    const rowCabecalho = linhasMeta.length + 2;
    
    // Escrever Cabeçalho
    if (cabecalho && cabecalho.length > 0) {
      const rangeCabecalho = sheet.getRange(rowCabecalho, 1, 1, cabecalho.length);
      rangeCabecalho.setValues([cabecalho]);
      rangeCabecalho.setFontWeight("bold")
                    .setBackground("#073763")
                    .setFontColor("#ffffff")
                    .setHorizontalAlignment("center");
    }

    // Escrever Dados
    if (dados && dados.length > 0) {
      const colLength = cabecalho.length > 0 ? cabecalho.length : dados[0].length;
      const rangeDados = sheet.getRange(rowCabecalho + 1, 1, dados.length, colLength);
      rangeDados.setValues(dados);
      
      // Auto-resize
      sheet.autoResizeColumns(1, colLength);
      
      // Filtros
      if (cabecalho.length > 0) {
        sheet.getRange(rowCabecalho, 1, dados.length + 1, cabecalho.length).createFilter();
      }
    }
  }
};
