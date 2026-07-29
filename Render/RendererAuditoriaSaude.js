/**
 * ARQUIVO: Render/RendererAuditoriaSaude.js
 * DESCRICAO: Materialização visual e histórica da auditoria do Guardião da Qualidade.
 */
class RendererAuditoriaSaude {
  static renderizarLog(sheet, todosDiagnosticos, tuneis, totalLinhas) {
    if (!sheet || typeof sheet.getParent !== 'function') return;
    const ss = sheet.getParent();
    if (!ss) return;

    const nomeAba = sheet.getName();
    const nomeLog = '[AUDITORIA] Ocorrencias';
    const nomeHistorico = '[HISTORICO] Auditoria Ocorrencias';

    let logSheet = ss.getSheetByName(nomeLog);
    if (!logSheet) {
      logSheet = ss.insertSheet(nomeLog);
    }

    let histSheet = ss.getSheetByName(nomeHistorico);
    if (!histSheet) {
      histSheet = ss.insertSheet(nomeHistorico);
      const headersHist = [['DATA/HORA EXECUÇÃO', 'ABA', 'TÚNEL', 'LINHA', 'SEVERIDADE', 'REGRA', 'DIAGNÓSTICO', 'EVIDÊNCIA', 'AÇÃO RECOMENDADA']];
      histSheet.getRange(1, 1, 1, 9).setValues(headersHist);
      if (typeof histSheet.setFontWeight === 'function') histSheet.setFontWeight('bold');
    }

    let agora = '';
    if (typeof Utilities !== 'undefined' && typeof Session !== 'undefined') {
      agora = Utilities.formatDate(
        new Date(),
        Session.getScriptTimeZone() || 'America/Sao_Paulo',
        'dd/MM/yyyy HH:mm:ss'
      );
    } else {
      const d = new Date();
      agora = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
    }

    const diags = Array.isArray(todosDiagnosticos) ? todosDiagnosticos : [];
    const criticos = diags.filter(d => d.severidade === 'CRITICO').length;
    const alertas = diags.filter(d => d.severidade === 'ALERTA').length;
    const observacoes = diags.filter(d => d.severidade === 'OBSERVACAO').length;
    const excecoes = diags.filter(d => d.severidade === 'EXCECAO MANUAL').length;
    const totalErros = criticos + alertas;

    // 1. Montagem da Aba [AUDITORIA] Ocorrencias (Última Execução)
    const dadosLog = [
      ['RELATÓRIO DE AUDITORIA DE INTEGRIDADE', agora, 'Aba Auditada:', nomeAba, 'Status:', totalErros > 0 ? 'COM PENDÊNCIAS' : 'APROVADO', '', ''],
      ['Túneis Analisados:', Object.keys(tuneis || {}).length, 'Linhas Analisadas:', totalLinhas || 0, 'Críticos:', criticos, 'Alertas:', alertas],
      ['Observações:', observacoes, 'Exceções Manuais:', excecoes, '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['ABA', 'TÚNEL', 'LINHA', 'SEVERIDADE', 'REGRA', 'DIAGNÓSTICO', 'EVIDÊNCIA', 'AÇÃO RECOMENDADA']
    ];

    const registrosTabela = [];

    if (diags.length > 0) {
      diags.forEach(d => {
        const lin = [
          nomeAba,
          d.tunel || '-',
          d.linha || '-',
          d.severidade || 'ALERTA',
          d.codigoRegra || 'REGRA_GERAL',
          d.diagnostico || '-',
          d.evidencia || '-',
          d.acaoRecomendada || '-'
        ];
        dadosLog.push(lin);
        registrosTabela.push(lin);
      });
    } else {
      const linAprovado = [
        nomeAba,
        '-',
        '-',
        'APROVADO',
        'INTEGRIDADE_OK',
        'Nenhuma inconsistência encontrada na aba. Ocorrências 100% íntegras.',
        '-',
        'Nenhuma ação necessária.'
      ];
      dadosLog.push(linAprovado);
      registrosTabela.push(linAprovado);
    }

    logSheet.clear();
    logSheet.getRange(1, 1, dadosLog.length, 8).setValues(dadosLog);
    if (typeof logSheet.getRange === 'function') {
      logSheet.getRange(1, 1, 5, 8).setFontWeight('bold');
    }

    // 2. Anexo sem sobrescrever na Aba [HISTORICO] Auditoria Ocorrencias
    const registrosHistorico = registrosTabela.map(r => [agora, ...r]);
    const proxLinhaHist = Math.max(histSheet.getLastRow() + 1, 2);
    histSheet.getRange(proxLinhaHist, 1, registrosHistorico.length, 9).setValues(registrosHistorico);
  }

  static prepararColunaAlertas(sheet, idxAlerta, linhasDados) {
    const coluna = idxAlerta + 1;
    sheet.getRange(1, coluna)
      .clearDataValidations()
      .setValue('Alerta Integridade');

    if (linhasDados <= 0) return;

    sheet.getRange(2, coluna, linhasDados, 1)
      .clearContent()
      .clearDataValidations();
  }

  static montarLinhasComAlerta(nomeAba, saida) {
    const linhasComAlerta = [];
    saida.forEach((row, index) => {
      if (row[0]) {
        linhasComAlerta.push([nomeAba, index + 2, 'ALERTA', row[0]]);
      }
    });
    return linhasComAlerta;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = RendererAuditoriaSaude;
}
