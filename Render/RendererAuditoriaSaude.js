/**
 * ARQUIVO: Render/RendererAuditoriaSaude.js
 * DESCRICAO: Materialização visual e histórica da auditoria do Guardião da Qualidade (M06).
 * Aplica a paleta de severidades exclusivamente aos relatórios de apoio ([AUDITORIA] e [HISTORICO]).
 */
class RendererAuditoriaSaude {
  static get PALETA_SEVERIDADES() {
    return {
      'ERRO TECNICO': { fundo: '#900C3F', fonte: '#FFFFFF', negrito: true },
      'CRITICO': { fundo: '#D9534F', fonte: '#FFFFFF', negrito: true },
      'ALERTA': { fundo: '#F0AD4E', fonte: '#212529', negrito: true },
      'OBSERVACAO': { fundo: '#5BC0DE', fonte: '#212529', negrito: false },
      'EXCECAO MANUAL': { fundo: '#6F42C1', fonte: '#FFFFFF', negrito: true },
      'APROVADO': { fundo: '#28A745', fonte: '#FFFFFF', negrito: true }
    };
  }

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
    const statusFinal = totalErros > 0 ? 'COM PENDÊNCIAS' : 'APROVADO';

    // 1. Montagem dos Dados de [AUDITORIA] Ocorrencias
    const dadosLog = [
      ['RELATÓRIO DE AUDITORIA DE INTEGRIDADE', agora, 'Aba Auditada:', nomeAba, 'Status:', statusFinal, '', ''],
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

    // Estilização Executiva e Paleta de Severidades para [AUDITORIA] Ocorrencias
    RendererAuditoriaSaude.estilitarAbaAuditoria_(logSheet, dadosLog.length, statusFinal, registrosTabela);

    // 2. Anexo sem sobrescrever na Aba [HISTORICO] Auditoria Ocorrencias
    const registrosHistorico = registrosTabela.map(r => [agora, ...r]);
    const proxLinhaHist = Math.max(histSheet.getLastRow() + 1, 2);
    histSheet.getRange(proxLinhaHist, 1, registrosHistorico.length, 9).setValues(registrosHistorico);
  }

  static estilitarAbaAuditoria_(logSheet, totalLinhasDoc, statusFinal, registrosTabela) {
    if (!logSheet || typeof logSheet.getRange !== 'function') return;

    try {
      // Congelamento e Gridlines
      if (typeof logSheet.setFrozenRows === 'function') logSheet.setFrozenRows(5);
      if (typeof logSheet.setHiddenGridlines === 'function') logSheet.setHiddenGridlines(false);

      // Linha 1: Título Principal
      const rangeTitulo = logSheet.getRange(1, 1, 1, 8);
      if (typeof rangeTitulo.setBackground === 'function') rangeTitulo.setBackground('#1C3144').setFontColor('#FFFFFF').setFontWeight('bold');

      // Linhas 1-3: Cards de Resumo
      const rangeResumo = logSheet.getRange(1, 1, 3, 8);
      if (typeof rangeResumo.setFontFamily === 'function') rangeResumo.setFontFamily('Arial');

      // Linha 5: Cabeçalho da Tabela
      const rangeCabecalho = logSheet.getRange(5, 1, 1, 8);
      if (typeof rangeCabecalho.setBackground === 'function') {
        rangeCabecalho.setBackground('#2C4257')
          .setFontColor('#FFFFFF')
          .setFontWeight('bold')
          .setHorizontalAlignment('center');
      }

      // Estilização das Linhas de Dados (Linha 6 em diante)
      registrosTabela.forEach((linData, idx) => {
        const linhaReal = 6 + idx;
        const severidade = linData[3];
        const estilo = RendererAuditoriaSaude.PALETA_SEVERIDADES[severidade] || RendererAuditoriaSaude.PALETA_SEVERIDADES['ALERTA'];

        // Destacar a célula de SEVERIDADE (Coluna 4) e REGRA (Coluna 5)
        const cellSeveridade = logSheet.getRange(linhaReal, 4);
        if (typeof cellSeveridade.setBackground === 'function') {
          cellSeveridade.setBackground(estilo.fundo)
            .setFontColor(estilo.fonte)
            .setFontWeight(estilo.negrito ? 'bold' : 'normal')
            .setHorizontalAlignment('center');
        }

        const cellRegra = logSheet.getRange(linhaReal, 5);
        if (typeof cellRegra.setHorizontalAlignment === 'function') {
          cellRegra.setHorizontalAlignment('center').setFontWeight('bold');
        }

        // Alinhamento central das colunas ABA, TÚNEL, LINHA (Colunas 1 a 3)
        const rangeCentralizado = logSheet.getRange(linhaReal, 1, 1, 3);
        if (typeof rangeCentralizado.setHorizontalAlignment === 'function') {
          rangeCentralizado.setHorizontalAlignment('center');
        }

        // Alinhamento à esquerda explicito das colunas DIAGNÓSTICO, EVIDÊNCIA, AÇÃO RECOMENDADA (Colunas 6 a 8)
        const rangeEsquerdaTextos = logSheet.getRange(linhaReal, 6, 1, 3);
        if (typeof rangeEsquerdaTextos.setHorizontalAlignment === 'function') {
          rangeEsquerdaTextos.setHorizontalAlignment('left');
        }

        // Zebrado suave no restante da linha
        if (idx % 2 === 1) {
          const rangeZebrado = logSheet.getRange(linhaReal, 1, 1, 8);
          if (typeof rangeZebrado.setBackground === 'function') {
            // Preserva a cor da célula de severidade já aplicada
            const rangeEsquerda = logSheet.getRange(linhaReal, 1, 1, 3);
            const rangeDireita = logSheet.getRange(linhaReal, 5, 1, 4);
            if (typeof rangeEsquerda.setBackground === 'function') rangeEsquerda.setBackground('#F8F9FA');
            if (typeof rangeDireita.setBackground === 'function') rangeDireita.setBackground('#F8F9FA');
          }
        }
      });

      // Larguras Fixas Recomendadas
      if (typeof logSheet.setColumnWidth === 'function') {
        logSheet.setColumnWidth(1, 120); // ABA
        logSheet.setColumnWidth(2, 180); // TÚNEL
        logSheet.setColumnWidth(3, 70);  // LINHA
        logSheet.setColumnWidth(4, 140); // SEVERIDADE
        logSheet.setColumnWidth(5, 210); // REGRA
        logSheet.setColumnWidth(6, 320); // DIAGNÓSTICO
        logSheet.setColumnWidth(7, 320); // EVIDÊNCIA
        logSheet.setColumnWidth(8, 320); // AÇÃO RECOMENDADA
      }

    } catch (e) {
      // Garante execução limpa em ambientes isolados/mocks
    }
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
