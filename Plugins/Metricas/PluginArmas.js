/**
 * ARQUIVO: Plugins/Metricas/PluginArmas.js
 * DESCRIÇÃO: Plugin responsável por contabilizar apreensão de armas
 * e presença de armas na ocorrência.
 */
class PluginArmas extends IPluginMetrica {
  inicializar(consolidado) {
    if (!consolidado.fatos) consolidado.fatos = {};
    consolidado.fatos.armas = 0;
    consolidado.fatos.ocorrenciasComArma = 0;
  }

  processar(fato, pmFato, consolidado, chaveAtuacao, primeiraVezNaOcorrencia) {
    // Conta as ocorrências onde ELE pegou arma (apenas 1 vez por ocorrência)
    if (primeiraVezNaOcorrencia && pmFato.armas > 0) {
      consolidado.fatos.ocorrenciasComArma++;
    }

    // Agregação bruta física
    consolidado.fatos.armas += (pmFato.armas || 0);
  }

  finalizar(consolidado) {
    // Nada a fazer no final
  }
}
