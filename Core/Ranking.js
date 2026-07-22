/**
 * Motor de classificação e ranqueamento parametrizado do ecossistema SYNTHÉON.
 */
const SyntheonRanking = {
  /**
   * Ordena e classifica a lista de produtividade de acordo com critérios fornecidos.
   * @param {Object} produtividade - Mapa retornado por SyntheonMetricas.
   * @param {Array<string>} criterios - Vetor ordenado de critérios (ex: ['PONTOS', 'OCORRENCIAS', 'ARMAS', 'DROGAS']).
   * @return {Array<Object>} Lista ranqueada com o atributo 'rank' (1-based).
   */
  gerarRanking(produtividade, criterios) {
    const lista = Object.values(produtividade);

    lista.sort((a, b) => {
      for (const criterio of criterios) {
        let valA = 0;
        let valB = 0;

        switch (criterio) {
          case 'PONTOS':
            // Pontos acumulados (PIP ou CPM)
            valA = (a.indicadores && a.indicadores.pontosPIP !== undefined) ? a.indicadores.pontosPIP : (a.pontosPIP || 0);
            valB = (b.indicadores && b.indicadores.pontosPIP !== undefined) ? b.indicadores.pontosPIP : (b.pontosPIP || 0);
            break;
          case 'OCORRENCIAS':
            valA = (a.fatos && a.fatos.ocorrencias !== undefined) ? a.fatos.ocorrencias : (a.ocorrencias || 0);
            valB = (b.fatos && b.fatos.ocorrencias !== undefined) ? b.fatos.ocorrencias : (b.ocorrencias || 0);
            break;
          case 'ARMAS':
            valA = (a.fatos && a.fatos.armas !== undefined) ? a.fatos.armas : (a.armas || 0);
            valB = (b.fatos && b.fatos.armas !== undefined) ? b.fatos.armas : (b.armas || 0);
            break;
          case 'DROGAS':
            valA = (a.fatos && a.fatos.drogasTotal !== undefined) ? a.fatos.drogasTotal : (a.drogasTotal || 0);
            valB = (b.fatos && b.fatos.drogasTotal !== undefined) ? b.fatos.drogasTotal : (b.drogasTotal || 0);
            break;
          default:
            break;
        }

        if (valB !== valA) {
          return valB - valA; // Ordenação decrescente
        }
      }

      // Desempate padrão por ordem alfabética do nome
      return String(a.nome).localeCompare(String(b.nome), 'pt-BR');
    });

    // Insere o rank numérico
    return lista.map((item, index) => {
      return {
        rank: index + 1,
        ...item
      };
    });
  }
};
