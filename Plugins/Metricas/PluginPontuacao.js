/**
 * ARQUIVO: Plugins/Metricas/PluginPontuacao.js
 * DESCRIÇÃO: Plugin responsável por calcular a pontuação rateada do policial.
 */
class PluginPontuacao extends IPluginMetrica {
  inicializar(consolidado) {
    if (!consolidado.indicadores) consolidado.indicadores = {};
    consolidado.indicadores.pontosPIP = 0;
    consolidado.indicadores.pontosCPM = 0;
    consolidado.indicadores.pontosTotais = 0;
    
    // Variável temporária para rastrear a maior pontuação dentro da mesma ocorrência
    consolidado._pts = {}; 
  }

  processar(fato, pmFato, consolidado, chaveAtuacao, primeiraVezNaOcorrencia) {
    const chavePonto = `pts_${chaveAtuacao}`;
    const pontosLidos = pmFato.pontosRateados || 0;

    if (!consolidado._pts[chavePonto]) {
      consolidado._pts[chavePonto] = pontosLidos;
    } else {
      consolidado._pts[chavePonto] = Math.max(consolidado._pts[chavePonto], pontosLidos);
    }
  }

  finalizar(consolidado) {
    let pontos = 0;
    
    // Soma a pontuação máxima detectada em cada ocorrência distinta
    if (consolidado._pts) {
      Object.values(consolidado._pts).forEach(p => pontos += p);
      delete consolidado._pts; // Limpa a sujeira do objeto antes de ir pro RegistroAnalitico
    }
    
    consolidado.indicadores.pontosCPM = pontos;
    consolidado.indicadores.pontosPIP = pontos;
    consolidado.indicadores.pontosTotais = pontos;
  }
}
