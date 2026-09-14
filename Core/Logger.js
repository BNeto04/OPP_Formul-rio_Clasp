/**
 * Logger central do ecossistema SYNTHEON.
 * Centraliza estatisticas e avisos dos fluxos.
 *
 * INST-SERIALIZACAO-001 (§8.11): `gravarPlanilha` materializa o retrato do log em aba de NOME FIXO
 * (`clear()` + `setValues` em `Render/RendererAuditoria.js:11,14`). Essa escrita roda sob a TRAVA
 * GLOBAL: dois geradores concorrentes (comparativo + armas, produtividade + PIP/CPM) nao se apagam
 * nem produzem log HIBRIDO (`DIAGNOSTICO_164_CONCORRENCIA.md` §2.3, item #1 dos 9).
 */
if (typeof SyntheonSerializacaoEscrita === 'undefined' && typeof require !== 'undefined') {
  try { global.SyntheonSerializacaoEscrita = require('./SerializacaoEscrita'); } catch (e) { /* fail-closed no uso */ }
}

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
    if (typeof SyntheonSerializacaoEscrita === 'undefined' || !SyntheonSerializacaoEscrita
        || typeof SyntheonSerializacaoEscrita.executarComLock !== 'function') {
      throw new Error('ESCRITA BLOQUEADA: mecanismo de serializacao de escrita indisponivel (INST-SERIALIZACAO-001). Nada foi gravado.');
    }
    return SyntheonSerializacaoEscrita.executarComLock('Logger.gravarPlanilha', () => {
      return RendererAuditoria.render(SpreadsheetApp.getActiveSpreadsheet(), this, nomeAbaLog, nomeAbaResultado);
    });
  }
}
