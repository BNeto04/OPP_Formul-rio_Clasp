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
            valA = a.pontosPIP;
            valB = b.pontosPIP;
            break;
          case 'OCORRENCIAS':
            valA = a.ocorrencias;
            valB = b.ocorrencias;
            break;
          case 'ARMAS':
            valA = a.armas;
            valB = b.armas;
            break;
          case 'DROGAS':
            valA = a.drogasTotal;
            valB = b.drogasTotal;
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
