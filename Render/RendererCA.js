/**
 * ARQUIVO: Render/RendererCA.js
 * PILAR 3: Apresentação e Renderização
 * DESCRIÇÃO: Renderizador dedicado para o Painel Mestre da Central Analítica (CA).
 * Materializa o relatório consolidado de produtividade com estilo profissional.
 */
const RendererCA = {
  /**
   * Renderiza a base oficial da Central Analítica na aba de destino.
   * @param {SpreadsheetApp.Spreadsheet} ss - Planilha ativa.
   * @param {string} nomeAba - Nome da aba (ex: CA_2026 ou CA_JAN2026_JUL2026).
   * @param {Array<Object>} registros - Lista de RegistroAnalitico ordenados.
   * @param {Object} metadados - Informações da execução.
   */
  renderizar(ss, nomeAba, registros, metadados) {
    let sheet = ss.getSheetByName(nomeAba);
    if (!sheet) {
      sheet = ss.insertSheet(nomeAba);
    } else {
      sheet.clear();
      if (sheet.getFilter()) {
        sheet.getFilter().remove();
      }
    }

    const { periodo, abasLidas, totalPoliciais, totalOcorrencias, tempoSegundos } = metadados;

    // 1. Bloco de Metadados no topo
    const meta = [
      ["📊 CENTRAL ANALÍTICA — PAINEL MESTRE (ERA 3)", ""],
      ["Período:", periodo || "2026"],
      ["Abas Processadas:", abasLidas ? abasLidas.join(', ') : "-"],
      ["Policiais Consolidados:", totalPoliciais || 0],
      ["Ocorrências Únicas:", totalOcorrencias || 0],
      ["Data de Emissão:", formatarDataBR(new Date()) + " " + new Date().toLocaleTimeString('pt-BR')],
      ["Tempo de Processamento:", `${tempoSegundos}s`]
    ];

    sheet.getRange(1, 1, meta.length, 2).setValues(meta);
    sheet.getRange(1, 1, 1, 2).setFontWeight("bold").setBackground("#064e3b").setFontColor("#ffffff");
    sheet.getRange(2, 1, meta.length - 1, 1).setFontWeight("bold");

    // 2. Cabeçalhos da Tabela Principal (Linha 9)
    const rowHeader = meta.length + 2;
    const headers = [
      "RANK",
      "GRADUAÇÃO",
      "MATRÍCULA",
      "NOME",
      "ESCALA",
      "OCORRÊNCIAS",
      "PONTUAÇÃO",
      "ARMAS",
      "MACONHA (G)",
      "CRACK (G)",
      "COCAÍNA (G)",
      "TOTAL DROGAS (G)",
      "DETIDOS",
      "APFD",
      "TCO",
      "BOC"
    ];

    const rangeHeader = sheet.getRange(rowHeader, 1, 1, headers.length);
    rangeHeader.setValues([headers]);
    rangeHeader.setFontWeight("bold")
               .setBackground("#073763")
               .setFontColor("#ffffff")
               .setHorizontalAlignment("center");

    // 3. Montar Linhas de Dados
    if (!registros || registros.length === 0) return;

    const linhas = registros.map((reg, idx) => [
      idx + 1,
      reg.graduacao || 'N/I',
      reg.matricula || 'N/I',
      reg.nome || 'N/I',
      reg.pelotao || 'N/I',
      reg.fatos ? reg.fatos.ocorrencias : (reg.ocorrencias || 0),
      reg.indicadores ? reg.indicadores.pontosTotais : (reg.pontosTotais || 0),
      reg.fatos ? reg.fatos.armas : (reg.armas || 0),
      reg.fatos ? reg.fatos.maconha : (reg.maconha || 0),
      reg.fatos ? reg.fatos.crack : (reg.crack || 0),
      reg.fatos ? reg.fatos.cocaina : (reg.cocaina || 0),
      reg.fatos ? reg.fatos.drogasTotal : (reg.drogasTotal || 0),
      reg.fatos ? reg.fatos.detidos : (reg.detidos || 0),
      reg.fatos ? reg.fatos.apfd : (reg.apfd || 0),
      reg.fatos ? reg.fatos.tco : (reg.tco || 0),
      reg.fatos ? reg.fatos.boc : (reg.boc || 0)
    ]);

    const rangeDados = sheet.getRange(rowHeader + 1, 1, linhas.length, headers.length);
    rangeDados.setValues(linhas);

    // Formatação de Colunas Específicas
    // Coluna Pontuação (G) -> Number com 2 casas
    sheet.getRange(rowHeader + 1, 7, linhas.length, 1).setNumberFormat("#,##0.00");
    // Colunas Gramas de Drogas (I, J, K, L) -> Number com 2 casas
    sheet.getRange(rowHeader + 1, 9, linhas.length, 4).setNumberFormat("#,##0.00");

    // Auto-ajuste de colunas e criação de filtro
    sheet.autoResizeColumns(1, headers.length);
    sheet.getRange(rowHeader, 1, linhas.length + 1, headers.length).createFilter();
    sheet.setFrozenRows(rowHeader);
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = RendererCA;
}
