/**
 * ARQUIVO: Render/RendererAuditoriaSaude.js
 * DESCRICAO: Materialização visual e histórica da auditoria do Guardião da Qualidade (M06).
 * Aplica a paleta de severidades exclusivamente aos relatórios de apoio ([AUDITORIA] e [HISTORICO])
 * e destaca visualmente apenas a célula AM das abas mensais com alerta (TASK-M06.1-04).
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
      const headersHist = [['DATA/HORA EXECUÇÃO', 'ABA', 'TÚNEL', 'LINHA', 'CAMADA', 'SEVERIDADE', 'REGRA', 'DIAGNÓSTICO', 'EVIDÊNCIA', 'SUGESTÃO DE CORREÇÃO']];
      histSheet.getRange(1, 1, 1, 10).setValues(headersHist);
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

    const tuneisArray = Object.values(tuneis || {});
    const totalTuneis = tuneisArray.length;
    const tuneisValidos = tuneisArray.filter(t => t.statusClassificacao === 'VALIDO').length;
    const tuneisInvalidos = tuneisArray.filter(t => t.statusClassificacao && t.statusClassificacao.startsWith('INVALIDO')).length;
    const diagsSintaticos = diags.filter(d => d.camada === 'SINTATICA').length;
    const diagsSemanticos = diags.filter(d => d.camada === 'SEMANTICA').length;

    // 1. Montagem dos Dados de [AUDITORIA] Ocorrencias (9 colunas com cards executivos)
    const dadosLog = [
      ['RELATÓRIO DE AUDITORIA DE INTEGRIDADE (C05)', agora, 'Aba Auditada:', nomeAba, 'Status:', statusFinal, '', '', ''],
      ['Túneis Analisados:', totalTuneis, 'Túneis Válidos:', tuneisValidos, 'Túneis Inválidos:', tuneisInvalidos, 'Linhas Analisadas:', totalLinhas || 0, ''],
      ['Críticos:', criticos, 'Alertas:', alertas, 'Observações:', observacoes, 'Exceções:', excecoes, `Sintaxe: ${diagsSintaticos} | Semântica: ${diagsSemanticos}`],
      ['', '', '', '', '', '', '', '', ''],
      ['ABA', 'TÚNEL', 'LINHA', 'CAMADA', 'SEVERIDADE', 'REGRA', 'DIAGNÓSTICO', 'EVIDÊNCIA', 'SUGESTÃO DE CORREÇÃO']
    ];

    const registrosTabela = [];

    if (diags.length > 0) {
      diags.forEach(d => {
        const lin = [
          nomeAba,
          d.tunel || '-',
          d.linha || '-',
          d.camada || 'SEMANTICA',
          d.severidade || 'ALERTA',
          d.codigoRegra || 'REGRA_GERAL',
          d.diagnostico || '-',
          d.evidencia || '-',
          d.sugestaoCorrecao || d.acaoRecomendada || '-'
        ];
        dadosLog.push(lin);
        registrosTabela.push(lin);
      });
    } else {
      const linAprovado = [
        nomeAba,
        '-',
        '-',
        'ESTRUTURAL',
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
    logSheet.getRange(1, 1, dadosLog.length, 9).setValues(dadosLog);

    // Estilização Executiva e Paleta de Severidades para [AUDITORIA] Ocorrencias
    RendererAuditoriaSaude.estilizarAbaAuditoria_(logSheet, dadosLog.length, statusFinal, registrosTabela);

    // 2. Anexo sem sobrescrever na Aba [HISTORICO] Auditoria Ocorrencias (10 colunas)
    // G01 #117 (pedido do proprietario, 10/09/2026): separar cada auditoria com UMA LINHA EM
    // BRANCO, para leitura rapida de onde termina uma execucao e comeca a seguinte.
    const registrosHistorico = registrosTabela.map(r => [agora, ...r]);
    const ultimaLinhaHist = typeof histSheet.getLastRow === 'function' ? histSheet.getLastRow() : 1;
    const proxLinhaHist = RendererAuditoriaSaude.calcularLinhaAnexoHistorico(ultimaLinhaHist);

    if (ultimaLinhaHist >= 2) {
      try {
        const linhaSeparadora = histSheet.getRange(ultimaLinhaHist + 1, 1, 1, 10);
        if (typeof linhaSeparadora.clearContent === 'function') linhaSeparadora.clearContent();
      } catch (e) { /* separador e cosmetico: falha aqui nao interrompe o anexo */ }
    }

    if (Array.isArray(registrosHistorico) && registrosHistorico.length > 0) {
      histSheet.getRange(proxLinhaHist, 1, registrosHistorico.length, 10).setValues(registrosHistorico);
    }

    // Estilização Executiva acumulativa de TODAS as linhas do [HISTORICO] Auditoria Ocorrencias
    RendererAuditoriaSaude.estilizarAbaHistorico_(histSheet, registrosHistorico, proxLinhaHist);
  }

  /**
   * Calcula a proxima linha de anexo no [HISTORICO], reservando UMA LINHA EM BRANCO entre
   * execucoes (G01 #117, pedido do proprietario 10/09/2026), para leitura rapida de onde
   * termina uma auditoria e comeca a seguinte. 1 = somente cabecalho (primeira execucao).
   * @param {number} ultimaLinha ultima linha usada na aba
   * @returns {number} linha (1-based) onde o novo bloco comeca
   */
  static calcularLinhaAnexoHistorico(ultimaLinha) {
    const ultima = Number(ultimaLinha) || 1;
    return ultima >= 2 ? ultima + 2 : 2;
  }

  static estilizarAbaAuditoria_(logSheet, totalLinhasDoc, statusFinal, registrosTabela) {
    if (!logSheet || typeof logSheet.getRange !== 'function') return;

    try {
      // Congelamento e Gridlines
      if (typeof logSheet.setFrozenRows === 'function') logSheet.setFrozenRows(5);
      if (typeof logSheet.setHiddenGridlines === 'function') logSheet.setHiddenGridlines(false);

      // Linha 1: Título Principal
      const rangeTitulo = logSheet.getRange(1, 1, 1, 9);
      if (typeof rangeTitulo.setBackground === 'function') rangeTitulo.setBackground('#1C3144').setFontColor('#FFFFFF').setFontWeight('bold');

      // Linhas 1-3: Cards de Resumo
      const rangeResumo = logSheet.getRange(1, 1, 3, 9);
      if (typeof rangeResumo.setFontFamily === 'function') rangeResumo.setFontFamily('Arial');

      // Linha 5: Cabeçalho da Tabela
      const rangeCabecalho = logSheet.getRange(5, 1, 1, 9);
      if (typeof rangeCabecalho.setBackground === 'function') {
        rangeCabecalho.setBackground('#2C4257')
          .setFontColor('#FFFFFF')
          .setFontWeight('bold')
          .setHorizontalAlignment('center');
      }

      // Estilização das Linhas de Dados (Linha 6 em diante)
      registrosTabela.forEach((linData, idx) => {
        const linhaReal = 6 + idx;
        const severidade = linData[4]; // Coluna 5 é SEVERIDADE
        const estilo = RendererAuditoriaSaude.PALETA_SEVERIDADES[severidade] || RendererAuditoriaSaude.PALETA_SEVERIDADES['ALERTA'];

        // Destacar a célula de SEVERIDADE (Coluna 5) e REGRA (Coluna 6)
        const cellSeveridade = logSheet.getRange(linhaReal, 5);
        if (typeof cellSeveridade.setBackground === 'function') {
          cellSeveridade.setBackground(estilo.fundo)
            .setFontColor(estilo.fonte)
            .setFontWeight(estilo.negrito ? 'bold' : 'normal')
            .setHorizontalAlignment('center');
        }

        const cellRegra = logSheet.getRange(linhaReal, 6);
        if (typeof cellRegra.setHorizontalAlignment === 'function') {
          cellRegra.setHorizontalAlignment('center').setFontWeight('bold');
        }

        // Alinhamento central das colunas ABA, TÚNEL, LINHA, CAMADA (Colunas 1 a 4)
        const rangeCentralizado = logSheet.getRange(linhaReal, 1, 1, 4);
        if (typeof rangeCentralizado.setHorizontalAlignment === 'function') {
          rangeCentralizado.setHorizontalAlignment('center');
        }

        // Alinhamento à esquerda explícito das colunas DIAGNÓSTICO, EVIDÊNCIA, SUGESTÃO DE CORREÇÃO (Colunas 7 a 9)
        const rangeEsquerdaTextos = logSheet.getRange(linhaReal, 7, 1, 3);
        if (typeof rangeEsquerdaTextos.setHorizontalAlignment === 'function') {
          rangeEsquerdaTextos.setHorizontalAlignment('left');
        }

        // Zebrado suave no restante da linha
        if (idx % 2 === 1) {
          const rangeZebrado = logSheet.getRange(linhaReal, 1, 1, 9);
          if (typeof rangeZebrado.setBackground === 'function') {
            const rangeEsquerda = logSheet.getRange(linhaReal, 1, 1, 4);
            const rangeDireita = logSheet.getRange(linhaReal, 6, 1, 4);
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
        logSheet.setColumnWidth(4, 110); // CAMADA
        logSheet.setColumnWidth(5, 140); // SEVERIDADE
        logSheet.setColumnWidth(6, 210); // REGRA
        logSheet.setColumnWidth(7, 320); // DIAGNÓSTICO
        logSheet.setColumnWidth(8, 320); // EVIDÊNCIA
        logSheet.setColumnWidth(9, 340); // SUGESTÃO DE CORREÇÃO
      }

    } catch (e) {
      // Garante execução limpa em ambientes isolados/mocks
    }
  }

  static estilizarAbaHistorico_(histSheet, novosRegistros, proxLinhaHist) {
    if (!histSheet || typeof histSheet.getRange !== 'function') return;

    try {
      // Congelamento apenas da linha 1 e Gridlines
      if (typeof histSheet.setFrozenRows === 'function') histSheet.setFrozenRows(1);
      if (typeof histSheet.setHiddenGridlines === 'function') histSheet.setHiddenGridlines(false);

      // Linha 1: Cabeçalho da Tabela de Histórico (10 colunas)
      const rangeCabecalho = histSheet.getRange(1, 1, 1, 10);
      if (typeof rangeCabecalho.setBackground === 'function') {
        rangeCabecalho.setBackground('#2C4257')
          .setFontColor('#FFFFFF')
          .setFontWeight('bold')
          .setHorizontalAlignment('center');
      }

      const ultLinha = typeof histSheet.getLastRow === 'function' ? histSheet.getLastRow() : 1;
      if (ultLinha >= 2) {
        let todosDadosHist = [];
        const rangeDadosHist = histSheet.getRange(2, 1, ultLinha - 1, 10);
        if (typeof rangeDadosHist.getValues === 'function') {
          todosDadosHist = rangeDadosHist.getValues();
        }

        // Estilização de TODAS as linhas de dados do histórico (existentes + recém-anexadas)
        for (let i = 0; i < ultLinha - 1; i++) {
          const linhaReal = 2 + i;

          // G01 #117: linha em branco que separa execucoes nao deve ser pintada (permanece vazia)
          const linhaBruta = (todosDadosHist && todosDadosHist[i]) ? todosDadosHist[i] : [];
          const linhaTemDados = Array.isArray(linhaBruta) &&
            linhaBruta.some(v => String(v === undefined || v === null ? '' : v).trim() !== '');
          if (!linhaTemDados) continue;

          let severidade = 'ALERTA';

          if (todosDadosHist && todosDadosHist[i] && todosDadosHist[i][5]) {
            severidade = todosDadosHist[i][5];
          } else if (novosRegistros) {
            const idxNovo = linhaReal - proxLinhaHist;
            if (idxNovo >= 0 && novosRegistros[idxNovo]) {
              severidade = novosRegistros[idxNovo][5];
            }
          }

          const estilo = RendererAuditoriaSaude.PALETA_SEVERIDADES[severidade] || RendererAuditoriaSaude.PALETA_SEVERIDADES['ALERTA'];

          // Centralizar colunas 1 a 5 (DATA/HORA EXECUÇÃO, ABA, TÚNEL, LINHA, CAMADA)
          const rangeCentralizadoEsquerda = histSheet.getRange(linhaReal, 1, 1, 5);
          if (typeof rangeCentralizadoEsquerda.setHorizontalAlignment === 'function') {
            rangeCentralizadoEsquerda.setHorizontalAlignment('center');
          }

          // Destacar a célula de SEVERIDADE (Coluna 6)
          const cellSeveridade = histSheet.getRange(linhaReal, 6);
          if (typeof cellSeveridade.setBackground === 'function') {
            cellSeveridade.setBackground(estilo.fundo)
              .setFontColor(estilo.fonte)
              .setFontWeight(estilo.negrito ? 'bold' : 'normal')
              .setHorizontalAlignment('center');
          }

          // Destacar a célula de REGRA (Coluna 7)
          const cellRegra = histSheet.getRange(linhaReal, 7);
          if (typeof cellRegra.setHorizontalAlignment === 'function') {
            cellRegra.setHorizontalAlignment('center').setFontWeight('bold');
          }

          // Alinhamento à esquerda explícito das colunas DIAGNÓSTICO, EVIDÊNCIA, SUGESTÃO DE CORREÇÃO (Colunas 8 a 10)
          const rangeEsquerdaTextos = histSheet.getRange(linhaReal, 8, 1, 3);
          if (typeof rangeEsquerdaTextos.setHorizontalAlignment === 'function') {
            rangeEsquerdaTextos.setHorizontalAlignment('left');
          }

          // Zebrado discreto nas linhas pares de dados (sem apagar a célula de severidade na Coluna 6)
          if (linhaReal % 2 === 0) {
            const rangeEsquerda = histSheet.getRange(linhaReal, 1, 1, 5);
            const rangeDireita = histSheet.getRange(linhaReal, 7, 1, 4);
            if (typeof rangeEsquerda.setBackground === 'function') rangeEsquerda.setBackground('#F8F9FA');
            if (typeof rangeDireita.setBackground === 'function') rangeDireita.setBackground('#F8F9FA');
          }
        }
      }

      // Larguras Fixas Recomendadas para Histórico (10 colunas)
      if (typeof histSheet.setColumnWidth === 'function') {
        histSheet.setColumnWidth(1, 160); // DATA/HORA EXECUÇÃO
        histSheet.setColumnWidth(2, 120); // ABA
        histSheet.setColumnWidth(3, 180); // TÚNEL
        histSheet.setColumnWidth(4, 70);  // LINHA
        histSheet.setColumnWidth(5, 110); // CAMADA
        histSheet.setColumnWidth(6, 140); // SEVERIDADE
        histSheet.setColumnWidth(7, 210); // REGRA
        histSheet.setColumnWidth(8, 320); // DIAGNÓSTICO
        histSheet.setColumnWidth(9, 320); // EVIDÊNCIA
        histSheet.setColumnWidth(10, 340); // SUGESTÃO DE CORREÇÃO
      }

    } catch (e) {
      // Garante execução limpa em ambientes isolados/mocks
    }
  }

  /**
   * Aplica o destaque visual discreto exclusivamente na célula AM da linha afetada (TASK-M06.1-04).
   * Requer o índice real da coluna de alerta (idxAlerta 0-based) e a matriz de textos de saída (saida).
   * Não infere AM pela última coluna da aba, evitando desalinhamento se houver colunas adicionais.
   * Não altera qualquer formatação, valor, fórmula ou borda das colunas A:AL (1 a 38).
   */
  static aplicarDestaquesAlertasAM_(sheet, idxAlerta, saida) {
    if (!sheet || typeof sheet.getRange !== 'function' || typeof idxAlerta !== 'number' || idxAlerta < 0) return;

    try {
      const colAM = idxAlerta + 1; // Coluna real do alerta em base 1 (ex: 39 para AM)
      let valoresAM = saida;

      if (!valoresAM) {
        const lastR = typeof sheet.getLastRow === 'function' ? sheet.getLastRow() : 1;
        if (lastR < 2) return;
        const rangeAM = sheet.getRange(2, colAM, lastR - 1, 1);
        if (typeof rangeAM.getValues === 'function') {
          valoresAM = rangeAM.getValues();
        }
      }

      if (!Array.isArray(valoresAM) || valoresAM.length === 0) return;

      valoresAM.forEach((row, idx) => {
        const linhaReal = idx + 2;
        const textoAlerta = (row && row[0]) ? String(row[0]).trim() : '';
        const cellAM = sheet.getRange(linhaReal, colAM);

        if (textoAlerta.length > 0) {
          // Com alerta: aplicar exclusivamente em AM fundo #FFF3CD, fonte #856404 e negrito
          if (typeof cellAM.setBackground === 'function') {
            cellAM.setBackground('#FFF3CD')
              .setFontColor('#856404')
              .setFontWeight('bold');
          }
        } else {
          // Sem alerta: limpar apenas o destaque visual criado em AM, sem alterar qualquer célula de A:AL
          if (typeof cellAM.setBackground === 'function') {
            cellAM.setBackground(null)
              .setFontColor(null)
              .setFontWeight('normal');
          }
        }
      });
    } catch (e) {
      // Garante execução isolada e segura em ambientes de teste / mocks
    }
  }

  static prepararColunaAlertas(sheet, idxAlerta, linhasDados) {
    const coluna = idxAlerta + 1;
    sheet.getRange(1, coluna)
      .clearDataValidations()
      .setValue('Alerta Integridade');

    if (linhasDados <= 0) return;

    // Limpa TODO o restante da coluna (nao apenas o trecho atual) para que
    // reexecucoes idempotentes nao deixem alertas antigos orfaos abaixo (G01 #116-req9).
    let totalLinhasDados = linhasDados;
    if (typeof sheet.getLastRow === 'function') {
      const ultima = sheet.getLastRow() - 1;
      if (ultima > totalLinhasDados) totalLinhasDados = ultima;
    }

    sheet.getRange(2, coluna, totalLinhasDados, 1)
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
