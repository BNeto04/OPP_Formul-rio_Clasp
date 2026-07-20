/**
 * ARQUIVO: Plugins/Metricas/PluginEntorpecentes.js
 * DESCRIÇÃO: Plugin responsável por contabilizar apreensão de drogas.
 */
class PluginEntorpecentes extends IPluginMetrica {
  inicializar(consolidado) {
    if (!consolidado.fatos) consolidado.fatos = {};
    consolidado.fatos.maconha = 0;
    consolidado.fatos.cocaina = 0;
    consolidado.fatos.crack = 0;
    consolidado.fatos.drogasTotal = 0;
    consolidado.fatos.ocorrenciasComDroga = 0;
  }

  processar(fato, pmFato, consolidado, chaveAtuacao, primeiraVezNaOcorrencia) {
    if (primeiraVezNaOcorrencia) {
      if (pmFato.maconha > 0 || pmFato.cocaina > 0 || pmFato.crack > 0) {
        consolidado.fatos.ocorrenciasComDroga++;
      }
    }

    consolidado.fatos.maconha += (pmFato.maconha || 0);
    consolidado.fatos.cocaina += (pmFato.cocaina || 0);
    consolidado.fatos.crack += (pmFato.crack || 0);
    
    // Total consolidado
    consolidado.fatos.drogasTotal += ((pmFato.maconha || 0) + (pmFato.cocaina || 0) + (pmFato.crack || 0));
  }

  finalizar(consolidado) {
    // Nada a fazer no final
  }
}
