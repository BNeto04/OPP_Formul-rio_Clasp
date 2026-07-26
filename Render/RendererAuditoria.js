/**
 * ARQUIVO: Render/RendererAuditoria.js
 * RESPONSABILIDADE: Materializar logs de auditoria em abas do Google Sheets.
 */
const RendererAuditoria = {
  render(ss, logger, nomeAbaLog, nomeAbaResultado) {
    let sheet = ss.getSheetByName(nomeAbaLog);
    if (!sheet) {
      sheet = ss.insertSheet(nomeAbaLog);
    }
    sheet.clear();

    const linhas = RendererAuditoria.montarLinhas(logger, nomeAbaResultado);
    sheet.getRange(1, 1, linhas.length, 2).setValues(linhas);

    const cores = (typeof CONFIG_SYNTHEON !== 'undefined' && CONFIG_SYNTHEON.RELATORIOS)
      ? CONFIG_SYNTHEON.RELATORIOS
      : {};

    sheet.getRange(1, 1, 1, 2)
      .setFontWeight('bold')
      .setBackground(cores.CABECALHO_BG || '#073763')
      .setFontColor(cores.CABECALHO_TXT || '#ffffff');
    sheet.autoResizeColumns(1, 2);
  },

  montarLinhas(logger, nomeAbaResultado) {
    const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss');
    const linhas = [
      [`RELATORIO DE AUDITORIA E LOG - ${logger.modo}`, ''],
      ['Aba de Resultado Gerada:', nomeAbaResultado],
      ['Data/Hora de Geracao:', timestamp],
      ['Tempo de Processamento:', `${logger.getTempoExecucaoSegundos()} segundos`],
      ['', ''],
      ['ESTATISTICAS DO FLUXO', ''],
      ['Abas Varridas:', logger.abasLidas.join(', ') || 'Nenhuma'],
      ['Total de Linhas Lidas:', logger.linhasLidas],
      ['Linhas Consideradas Validas:', logger.linhasValidas],
      ['Linhas Ignoradas (Filtro/Formato):', logger.linhasIgnoradas],
      ['Duplicidades Eliminadas:', logger.duplicidades],
      ['Policiais Unicos consolidados:', logger.policiaisUnicos],
      ['Ocorrencias Unicas identificadas:', logger.ocorrenciasUnicas],
      ['Membros nao cadastrados no EFETIVO:', logger.matriculasNaoEncontradas.size],
      ['', ''],
      ['MATRICULAS NAO LOCALIZADAS NO EFETIVO', '']
    ];

    logger.matriculasNaoEncontradas.forEach(mat => {
      linhas.push([mat, '']);
    });

    linhas.push(['', '']);
    linhas.push(['AVISOS E INCONSISTENCIAS IDENTIFICADAS', '']);

    if (logger.avisos.length === 0) {
      linhas.push(['Sem alertas de integridade de dados.', '']);
    } else {
      logger.avisos.forEach(aviso => {
        linhas.push(['-', aviso]);
      });
    }

    return linhas.map(row => row.length === 1 ? [row[0], ''] : row);
  }
};
