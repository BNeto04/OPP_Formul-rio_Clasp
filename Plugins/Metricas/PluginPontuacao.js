/**
 * ARQUIVO: Plugins/Metricas/PluginPontuacao.js
 * DESCRIÇÃO: Plugin responsável por calcular a pontuação rateada do policial.
 */
class PluginPontuacao extends IPluginMetrica {
  constructor() {
    super();
    this._pontosPorPolicial = new Map();
  }

  inicializar(consolidado) {
    if (!consolidado.indicadores) consolidado.indicadores = {};
    consolidado.indicadores.pontosPIP = 0;
    consolidado.indicadores.pontosCPM = 0;
    consolidado.indicadores.pontosTotais = 0;

    const matricula = consolidado.matricula || 'N/I';
    this._pontosPorPolicial.set(matricula, new Map());
  }

  processar(fato, pmFato, consolidado, chaveAtuacao, primeiraVezNaOcorrencia) {
    const matricula = consolidado.matricula || 'N/I';
    let mapaPontos = this._pontosPorPolicial.get(matricula);
    if (!mapaPontos) {
      mapaPontos = new Map();
      this._pontosPorPolicial.set(matricula, mapaPontos);
    }

    const chavePonto = `pts_${chaveAtuacao}`;
    const pontosLidos = pmFato.pontosRateados || 0;
    const atual = mapaPontos.get(chavePonto) || 0;
    mapaPontos.set(chavePonto, Math.max(atual, pontosLidos));
  }

  finalizar(consolidado) {
    const matricula = consolidado.matricula || 'N/I';
    const mapaPontos = this._pontosPorPolicial.get(matricula);
    let pontos = 0;

    if (mapaPontos) {
      for (const p of mapaPontos.values()) {
        pontos += p;
      }
      this._pontosPorPolicial.delete(matricula);
    }

    consolidado.indicadores.pontosCPM = pontos;
    consolidado.indicadores.pontosPIP = pontos;
    consolidado.indicadores.pontosTotais = pontos;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  if (typeof IPluginMetrica === 'undefined') {
    global.IPluginMetrica = require('../IPluginMetrica');
  }
  module.exports = PluginPontuacao;
}

