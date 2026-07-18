/**
 * Cérebro matemático e consolidador de métricas do ecossistema SYNTHÉON.
 */
const SyntheonMetricas = {
  /**
   * Consolida as ocorrências estruturadas em métricas por policial individual.
   * @param {Array<OcorrenciaPadronizada>} ocorrencias - Lista de ocorrências canônicas.
   * @return {Object.<string, Object>} Mapa contendo as métricas de cada militar.
   */
  consolidarPoliciais(ocorrencias) {
    const produtividade = {};

    ocorrencias.forEach(oc => {
      Object.keys(oc.policiais).forEach(matricula => {
        const pol = oc.policiais[matricula];

        if (!produtividade[matricula]) {
          produtividade[matricula] = {
            matricula: matricula,
            nome: pol.nome,
            grad: pol.grad,
            pelotao: pol.pelotao, // Lotação inicial
            ocorrencias: 0,
            pontosPIP: 0,
            pontosCPM: 0,
            armas: 0,
            maconha: 0,
            cocaina: 0,
            crack: 0,
            drogasTotal: 0,
            historicoEscalas: [] // Armazena todas as lotações por onde passou
          };
        }

        const registro = produtividade[matricula];
        
        // Atualiza a lotação mais recente vista (se for diferente da anterior, e adiciona ao histórico)
        if (pol.pelotao && pol.pelotao !== 'N/I') {
          registro.pelotao = pol.pelotao; 
          if (!registro.historicoEscalas.includes(pol.pelotao)) {
            registro.historicoEscalas.push(pol.pelotao);
          }
        }

        registro.ocorrencias++;
        
        // Acumular Pontuações
        // Para PIP/CPM, a pontuação consolidada no Objeto Canônico é a pontosFiccao rateada
        registro.pontosPIP += pol.pontosFiccao;
        registro.pontosCPM += pol.pontosFiccao; // CPM utiliza a mesma base de pontos na célula

        // Acumular Apreensões
        registro.armas += pol.armas;
        registro.maconha += pol.maconha;
        registro.cocaina += pol.cocaina;
        registro.crack += pol.crack;
        
        // Peso total de drogas (maconha + cocaína + crack)
        registro.drogasTotal += (pol.maconha + pol.cocaina + pol.crack);
      });
    });

    return produtividade;
  }
};
