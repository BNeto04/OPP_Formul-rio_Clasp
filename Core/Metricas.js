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
            detidos: 0,
            apfd: 0,
            tco: 0,
            boc: 0,
            qtdBoe: 0,
            ocorrenciasComArma: 0,
            ocorrenciasComDroga: 0,
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
        if (pol.armas > 0) registro.ocorrenciasComArma++;
        if (pol.maconha > 0 || pol.cocaina > 0 || pol.crack > 0) registro.ocorrenciasComDroga++;
        
        // Acumular Pontuações
        // Para PIP/CPM, a pontuação consolidada no Objeto Canônico é a pontosFiccao rateada
        registro.pontosPIP += pol.pontosFiccao || 0;
        registro.pontosCPM += pol.pontosFiccao || 0; // CPM utiliza a mesma base de pontos na célula
        registro.pontosTotais += pol.pontosFiccao || 0;

        // Acumular Apreensões e KPIs
        registro.armas += pol.armas || 0;
        registro.maconha += pol.maconha || 0;
        registro.cocaina += pol.cocaina || 0;
        registro.crack += pol.crack || 0;
        registro.detidos += pol.detidos || 0;
        registro.apfd += pol.apfd || 0;
        registro.tco += pol.tco || 0;
        registro.boc += pol.boc || 0;
        registro.qtdBoe += pol.qtdBoe || 0;
        
        // Peso total de drogas (maconha + cocaína + crack)
        registro.drogasTotal += ((pol.maconha || 0) + (pol.cocaina || 0) + (pol.crack || 0));
      });
    });

    const resultado = {};
    for (const matricula in produtividade) {
      const reg = produtividade[matricula];
      reg.pontosTotais = reg.pontosCPM;
      // Requer que a classe RegistroAnalitico já tenha sido carregada pelo Google Apps Script
      resultado[matricula] = typeof RegistroAnalitico !== 'undefined' ? new RegistroAnalitico(reg) : reg;
    }

    return resultado;
  }
};
