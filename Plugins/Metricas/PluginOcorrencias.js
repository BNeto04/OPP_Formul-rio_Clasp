/**
 * ARQUIVO: Plugins/Metricas/PluginOcorrencias.js
 * DESCRIÇÃO: Plugin responsável por contabilizar a quantidade de ocorrências
 * e BOEs participados pelo policial.
 */
class PluginOcorrencias extends IPluginMetrica {
  inicializar(consolidado) {
    if (!consolidado.fatos) consolidado.fatos = {};
    consolidado.fatos.ocorrencias = 0;
    consolidado.fatos.qtdBoe = 0;
  }

  processar(fato, pmFato, consolidado, chaveAtuacao, primeiraVezNaOcorrencia) {
    if (primeiraVezNaOcorrencia) {
      consolidado.fatos.ocorrencias++;
      if (fato.ocorrencia.boe) {
        consolidado.fatos.qtdBoe++;
      }
    }
  }

  finalizar(consolidado) {}
}

if (typeof module !== 'undefined' && module.exports) {
  if (typeof IPluginMetrica === 'undefined') {
    global.IPluginMetrica = require('../IPluginMetrica');
  }
  module.exports = PluginOcorrencias;
}

