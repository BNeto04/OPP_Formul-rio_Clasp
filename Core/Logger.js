/**
 * Logger central do ecossistema SYNTHÉON.
 * Centraliza estatísticas, avisos e gera relatórios de auditoria padronizados.
 */
class SyntheonLogger {
  constructor(modo) {
    this.modo = modo;
    this.inicio = new Date();
    this.abasLidas = [];
    this.linhasLidas = 0;
    this.linhasValidas = 0;
    this.linhasIgnoradas = 0;
    this.duplicidades = 0;
    this.policiaisUnicos = 0;
    this.ocorrenciasUnicas = 0;
    
    // Matrículas que não foram encontradas na aba EFETIVO
    this.matriculasNaoEncontradas = new Set();
    
    // Alertas/inconsistências de validação (ex: linha vazia, matrícula inválida)
    this.avisos = [];
  }

  logAba(nomeAba) {
    if (!this.abasLidas.includes(nomeAba)) {
      this.abasLidas.push(nomeAba);
    }
  }

  logAbaDetalhado(nomeAba, linhas, ocorrencias, policiais, tempoSegundos) {
    // Pode imprimir no console de debug
    if (typeof Logger !== 'undefined') {
      Logger.log(`[ABA] ${nomeAba} | ${linhas} linhas | ${ocorrencias} ocorrências | ${policiais} policiais | Tempo: ${tempoSegundos}s`);
    }
  }

  aviso(mensagem) {
    this.avisos.push(mensagem);
    if (CONFIG_SYNTHEON.DEBUG) {
      Logger.log(`[AVISO] ${mensagem}`);
    }
  }

  getTempoExecucaoSegundos() {
    return ((new Date() - this.inicio) / 1000).toFixed(2);
  }

  /**
   * Salva os logs estruturados em uma aba de auditoria.
   * @param {string} nomeAbaLog - Nome da aba onde salvar os logs (ex: LOG_PIP, LOG_CA).
   * @param {string} nomeAbaResultado - Nome da aba gerada com o ranking/consolidado.
   */
  gravarPlanilha(nomeAbaLog, nomeAbaResultado) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(nomeAbaLog);
    if (!sheet) {
      sheet = ss.insertSheet(nomeAbaLog);
    }
    sheet.clear();

    const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");
    
    const linhas = [
      [`RELATÓRIO DE AUDITORIA E LOG - ${this.modo}`, ''],
      ['Aba de Resultado Gerada:', nomeAbaResultado],
      ['Data/Hora de Geração:', timestamp],
      ['Tempo de Processamento:', `${this.getTempoExecucaoSegundos()} segundos`],
      ['', ''],
      ['ESTATÍSTICAS DO FLUXO', ''],
      ['Abas Varridas:', this.abasLidas.join(', ') || 'Nenhuma'],
      ['Total de Linhas Lidas:', this.linhasLidas],
      ['Linhas Consideradas Válidas:', this.linhasValidas],
      ['Linhas Ignoradas (Filtro/Formato):', this.linhasIgnoradas],
      ['Duplicidades Eliminadas:', this.duplicidades],
      ['Policiais Únicos consolidados:', this.policiaisUnicos],
      ['Ocorrências Únicas identificadas:', this.ocorrenciasUnicas],
      ['Membros não cadastrados no EFETIVO:', this.matriculasNaoEncontradas.size],
      ['', ''],
      ['MATRÍCULAS NÃO LOCALIZADAS NO EFETIVO', '']
    ];

    this.matriculasNaoEncontradas.forEach(mat => {
      linhas.push([mat, '']);
    });

    linhas.push(['', '']);
    linhas.push(['AVISOS E INCONSISTÊNCIAS IDENTIFICADAS', '']);

    if (this.avisos.length === 0) {
      linhas.push(['Sem alertas de integridade de dados.', '']);
    } else {
      this.avisos.forEach(aviso => {
        linhas.push(['-', aviso]);
      });
    }

    sheet.getRange(1, 1, linhas.length, 2).setValues(
      linhas.map(row => row.length === 1 ? [row[0], ''] : row)
    );
    
    sheet.getRange(1, 1, 1, 2).setFontWeight('bold').setBackground('#f4cccc');
    sheet.autoResizeColumns(1, 2);
  }
}
