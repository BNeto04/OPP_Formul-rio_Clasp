/**
 * ARQUIVO: Motor/PoliticaMeritoArmas.js
 * DESCRIÇÃO: Motor puro de cálculo de Mérito de Equipe por Armas (TASK-M06.3-02).
 * REGRA: Agrupa ocorrências pelo túnel (DATA | MIKE | BOE), soma todas as armas físicas do túnel
 * uma única vez (arma artesanal = 1), identifica o participante de menor N (mais antigo)
 * e atribui 100% das armas ao líder. Em caso de ausência de N ou empate, sinaliza pendência auditável.
 */

const PoliticaMeritoArmas = {
  /**
   * Processa uma lista de ocorrências canônicas ou fatos estruturados e gera os registros de mérito.
   * @param {Array<Object>} ocorrencias - Lista de ocorrências com chave do túnel e integrantes.
   * @param {Object.<string, number>} mapaAntiguidade - Mapa { matricula: numeroN } de antiguidade.
   * @returns {Array<Object>} Registros de mérito calculados por túnel com status e atribuição.
   */
  processarMeritoArmas(ocorrencias, mapaAntiguidade = {}) {
    if (!Array.isArray(ocorrencias) || ocorrencias.length === 0) {
      return [];
    }

    const tunéis = {};

    // 1. Agrupar por túnel único (DATA | MIKE | BOE)
    ocorrencias.forEach(oc => {
      const dataStr = oc.data ? (oc.data instanceof Date ? oc.data.toISOString().split('T')[0] : String(oc.data)) : '';
      const mike = oc.mike || oc.chaveOcorrencia || oc.chave || '';
      const boe = oc.boe || '';

      const chaveTunel = (oc.chaveTunel || `${dataStr}_${mike}_${boe}`).toUpperCase();

      if (!tunéis[chaveTunel]) {
        tunéis[chaveTunel] = {
          chave: chaveTunel,
          data: oc.data,
          mike: mike,
          boe: boe,
          armasFogo: 0,
          armasArtesanais: 0,
          integrantes: {},
          linhas: []
        };
      }

      const t = tunéis[chaveTunel];
      t.linhas.push(oc);

      // Soma de armas físicas (fogo + artesanais, onde 1 artesanal = 1)
      const isArtesanal = (oc.tipoArma === 'ARTESANAL' || oc.isArtesanal === true || String(oc.descricaoArma || '').toUpperCase().includes('ARTESANAL'));

      let qtdFogo = 0;
      let qtdArtesanal = 0;

      if (isArtesanal) {
        qtdArtesanal = Number(oc.armasArtesanais || oc.qtdArtesanal || oc.armas || oc.qtdArmas || 1);
      } else {
        qtdFogo = Number(oc.armas || oc.qtdArmas || 0);
        qtdArtesanal = Number(oc.armasArtesanais || oc.qtdArtesanal || 0);
      }

      t.armasFogo += (isNaN(qtdFogo) ? 0 : qtdFogo);
      t.armasArtesanais += (isNaN(qtdArtesanal) ? 0 : qtdArtesanal);

      // Coleta os integrantes da equipe envolvidos no fato
      let pmsArray = [];
      if (Array.isArray(oc.policiais)) {
        pmsArray = oc.policiais;
      } else if (oc.policiais && typeof oc.policiais === 'object') {
        pmsArray = Object.values(oc.policiais);
      } else if (oc.matricula) {
        pmsArray = [oc];
      }

      pmsArray.forEach(pm => {
        const mat = String(pm.matricula || '').trim();
        if (!mat) return;

        if (!t.integrantes[mat]) {
          t.integrantes[mat] = {
            matricula: mat,
            nome: pm.nome || pm.policial || '',
            grad: pm.grad || pm.graduacao || '',
            pelotao: pm.pelotao || pm.designacao || pm.lote || ''
          };
        } else {
          if (!t.integrantes[mat].nome && (pm.nome || pm.policial)) t.integrantes[mat].nome = pm.nome || pm.policial;
          if (!t.integrantes[mat].grad && (pm.grad || pm.graduacao)) t.integrantes[mat].grad = pm.grad || pm.graduacao;
          if (!t.integrantes[mat].pelotao && (pm.pelotao || pm.designacao)) t.integrantes[mat].pelotao = pm.pelotao || pm.designacao;
        }
      });
    });

    const resultados = [];

    // 2. Processar cada túnel com apreensão de armas
    Object.values(tunéis).forEach(t => {
      const totalArmas = t.armasFogo + t.armasArtesanais;
      if (totalArmas <= 0) return; // Ignora túneis sem armas

      const listaIntegrantes = Object.values(t.integrantes);
      if (listaIntegrantes.length === 0) {
        resultados.push({
          chaveTunel: t.chave,
          data: t.data,
          mike: t.mike,
          boe: t.boe,
          qtdArmas: totalArmas,
          status: 'PENDENTE_AUDITORIA',
          motivoPendente: 'SEM_INTEGRANTES',
          lider: null,
          integrantes: []
        });
        return;
      }

      let menorN = Infinity;
      let candidatosLider = [];
      let temIntegranteSemN = false;

      listaIntegrantes.forEach(pm => {
        const normMat = String(pm.matricula || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().trim();
        const n = mapaAntiguidade[pm.matricula] !== undefined ? mapaAntiguidade[pm.matricula] : mapaAntiguidade[normMat];
        const numN = Number(n);

        if (n === undefined || n === null || isNaN(numN) || numN <= 0) {
          temIntegranteSemN = true;
          pm.numN = null;
        } else {
          pm.numN = numN;
          if (numN < menorN) {
            menorN = numN;
            candidatosLider = [pm];
          } else if (numN === menorN) {
            candidatosLider.push(pm);
          }
        }
      });

      // Em caso de participante sem N cadastrado ou empate estrito de N, sinaliza pendência auditável
      if (temIntegranteSemN || candidatosLider.length === 0) {
        resultados.push({
          chaveTunel: t.chave,
          data: t.data,
          mike: t.mike,
          boe: t.boe,
          qtdArmas: totalArmas,
          status: 'PENDENTE_AUDITORIA',
          motivoPendente: 'ANTIGUIDADE_AUSENTE',
          lider: null,
          integrantes: listaIntegrantes
        });
        return;
      }

      if (candidatosLider.length > 1) {
        resultados.push({
          chaveTunel: t.chave,
          data: t.data,
          mike: t.mike,
          boe: t.boe,
          qtdArmas: totalArmas,
          status: 'PENDENTE_AUDITORIA',
          motivoPendente: 'EMPATE_ANTIGUIDADE',
          lider: null,
          integrantes: listaIntegrantes
        });
        return;
      }

      // Líder único de menor N definido
      const vencedor = candidatosLider[0];
      resultados.push({
        chaveTunel: t.chave,
        data: t.data,
        mike: t.mike,
        boe: t.boe,
        lider: vencedor.nome,
        grad: vencedor.grad,
        matricula: vencedor.matricula,
        designacao: vencedor.pelotao,
        numN: vencedor.numN,
        qtdArmas: totalArmas,
        armasFogo: t.armasFogo,
        armasArtesanais: t.armasArtesanais,
        status: 'PROCESSADO',
        integrantes: listaIntegrantes
      });
    });

    return resultados;
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PoliticaMeritoArmas;
}
