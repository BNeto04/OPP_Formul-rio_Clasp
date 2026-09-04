// VigiaPonte/VigiaEngine.js
// Orquestrador central do Vigia da Ponte: determinístico, debounce, cooldown e fail-open

const Config = require('./Config');
const { classificarPorRegras } = require('./ClassificadorRegras');
const { classificarComOllama } = require('./AdaptadorOllama');
const { emitirAlertaVisualSonoro, despertarFocoJanela } = require('./AcoesLocais');
const { gerarReportFormatado } = require('./VigiaLogger');

class VigiaEngine {
  constructor(opcoes = {}) {
    this.config = Object.assign({}, Config, opcoes);
    this.cooldowns = new Map(); // tipo -> timestamp da última emissão
    this.rodando = false;
    this.instanciasWatcherDetectadas = 0;
  }

  podeDisparar(tipo) {
    const agora = Date.now();
    const ultimo = this.cooldowns.get(tipo) || 0;
    if (agora - ultimo < this.config.EVENT_COOLDOWN_MS) {
      return false; // Em cooldown
    }
    this.cooldowns.set(tipo, agora);
    return true;
  }

  /**
   * Processa uma observação textual observada em processos/janelas/logs
   * @param {string} texto 
   * @param {Object} [meta] 
   * @returns {Promise<Object>}
   */
  async processarObservacao(texto, meta = {}) {
    // 1. Regra Determinística Prioritária
    let res = classificarPorRegras(texto);
    let classificacaoFonte = 'RULE';

    // 2. Se indeterminada por regras, recorre ao Ollama como fallback
    if (!res) {
      res = await classificarComOllama(texto);
      classificacaoFonte = res.fonte;
    }

    const tipo = res.tipo;
    const ownerDecision = res.ownerDecisionRequired;
    const emCooldown = !this.podeDisparar(tipo);

    let acaoTomada = 'LOGGED_ONLY';

    if (!emCooldown) {
      if (tipo === 'WAITING_INTERACTION') {
        emitirAlertaVisualSonoro(tipo, 'Terminal aguardando interação.');
        despertarFocoJanela('Terminal/CLI');
        acaoTomada = 'WAKE_WINDOW_AND_ALERT';
      } else if (tipo === 'PERMISSION_REQUIRED') {
        emitirAlertaVisualSonoro(tipo, 'ATENÇÃO: Ação sensível requer decisão do proprietário.');
        despertarFocoJanela('Terminal/Permissão');
        acaoTomada = 'ALERT_OWNER_REQUIRED_NO_AUTO_APPROVE';
      } else if (tipo === 'TIMEOUT_OR_STALL' || tipo === 'TRANSIENT_ERROR') {
        emitirAlertaVisualSonoro(tipo, 'Alerta de estagnação/timeout registrado.');
        acaoTomada = 'REPORT_AND_MONITOR';
      }
    } else {
      acaoTomada = 'DEBOUNCED_SUPPRESSED_SPAM';
    }

    // 3. Gravar no Report Estruturado
    const logResult = gerarReportFormatado({
      fonte: meta.fonte || 'LOCAL_MONITOR',
      taskId: meta.taskId || 'BRIDGE-OBSERVATION',
      tipo: tipo,
      observacao: texto,
      classificacaoFonte: classificacaoFonte,
      acaoTomada: acaoTomada,
      motivo: res.motivo,
      acaoSegura: res.acaoSegura || 'REPORT_ONLY',
      ownerDecision: ownerDecision,
      evidencia: res.padraoIdentificado || res.respostaBruta || 'Classificação via Vigia Engine',
      cooldownEstado: emCooldown ? 'SUPPRESSED_BY_COOLDOWN' : 'EMITTED'
    });

    return {
      tipo: tipo,
      classificacaoFonte: classificacaoFonte,
      acaoTomada: acaoTomada,
      ownerDecisionRequired: ownerDecision,
      emCooldown: emCooldown,
      report: logResult.report
    };
  }
}

module.exports = {
  VigiaEngine: VigiaEngine
};
