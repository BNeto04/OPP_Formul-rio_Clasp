/**
 * ARQUIVO: Plugins/Metricas/PluginPrisoes.js
 * DESCRIÇÃO: Plugin responsável por contabilizar detidos e procedimentos legais.
 */
class PluginPrisoes extends IPluginMetrica {
  inicializar(consolidado) {
    if (!consolidado.fatos) consolidado.fatos = {};
    consolidado.fatos.detidos = 0;
    consolidado.fatos.apfd = 0;
    consolidado.fatos.tco = 0;
    consolidado.fatos.boc = 0;
  }

  processar(fato, pmFato, consolidado, chaveAtuacao, primeiraVezNaOcorrencia) {
    consolidado.fatos.detidos += (pmFato.detidos || 0);
    consolidado.fatos.apfd += (pmFato.apfd || 0);
    consolidado.fatos.tco += (pmFato.tco || 0);
    consolidado.fatos.boc += (pmFato.boc || 0);
  }

  finalizar(consolidado) {}
}

if (typeof module !== 'undefined' && module.exports) {
  if (typeof IPluginMetrica === 'undefined') {
    global.IPluginMetrica = require('../IPluginMetrica');
  }
  module.exports = PluginPrisoes;
}

