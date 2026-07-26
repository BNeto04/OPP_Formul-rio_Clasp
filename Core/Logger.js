/**
 * Logger central do ecossistema SYNTHEON.
 * Centraliza estatisticas e avisos dos fluxos.
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
    this.matriculasNaoEncontradas = new Set();
    this.avisos = [];
  }

  logAba(nomeAba) {
    if (!this.abasLidas.includes(nomeAba)) {
      this.abasLidas.push(nomeAba);
    }
  }

  logAbaDetalhado(nomeAba, linhas, ocorrencias, policiais, tempoSegundos) {
    if (typeof Logger !== 'undefined') {
      Logger.log(`[ABA] ${nomeAba} | ${linhas} linhas | ${ocorrencias} ocorrencias | ${policiais} policiais | Tempo: ${tempoSegundos}s`);
    }
  }

  aviso(mensagem) {
    this.avisos.push(mensagem);
    if (CONFIG_SYNTHEON.DEBUG && typeof Logger !== 'undefined') {
      Logger.log(`[AVISO] ${mensagem}`);
    }
  }

  getTempoExecucaoSegundos() {
    return ((new Date() - this.inicio) / 1000).toFixed(2);
  }

  gravarPlanilha(nomeAbaLog, nomeAbaResultado) {
    RendererAuditoria.render(SpreadsheetApp.getActiveSpreadsheet(), this, nomeAbaLog, nomeAbaResultado);
  }
}
