/**
 * ARQUIVO: Motor/PoliticaMeritoArmas.js
 * DESCRIÇÃO: Motor puro de cálculo de Mérito de Equipe por Armas (TASK-M06.3-05I.2).
 * REGRA DE OURO: Agrupa ocorrências pelo túnel (DATA | MIKE | BOE).
 * ARMA é a fonte exclusiva de arma de fogo física (numérica). QDT ARMAS não entra no cálculo.
 * Reconhecimento de artesanal vem de indicadores textuais (TIPO/MODELO/ARMA), nunca de QDT ARMAS.
 * Pecúlio externo fornece apenas ORD; nome, graduação e pelotão do líder vêm da ocorrência mensal.
 * Atribui o mérito ao militar de menor N (mais antigo).
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

    const tuneis = {};

    // 1. Agrupar por túnel único (DATA | MIKE | BOE)
    ocorrencias.forEach(oc => {
      const dataStr = oc.data ? (oc.data instanceof Date ? oc.data.toISOString().split('T')[0] : String(oc.data)) : '';
      const mike = oc.mike || oc.chaveOcorrencia || oc.chave || '';
      const boe = oc.boe || '';

      const chaveTunel = (oc.chaveTunel || `${dataStr}_${mike}_${boe}`).toUpperCase();

      if (!tuneis[chaveTunel]) {
        tuneis[chaveTunel] = {
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

      const t = tuneis[chaveTunel];
      t.linhas.push(oc);

      // Verificação textual de arma artesanal (NUNCA usa QDT ARMAS)
      const textCheck = `${oc.tipoArma || ''} ${oc.modelo || ''} ${oc.descricaoArma || ''} ${oc.arma || ''} ${oc.natureza || ''}`.toUpperCase();
      const isArtesanal = (oc.isArtesanal === true || oc.tipoArma === 'ARTESANAL' || textCheck.includes('ARTESANAL'));

      let qtdFogo = 0;
      let qtdArtesanal = 0;

      if (isArtesanal) {
        qtdArtesanal = 1;
        // Se houver armasFogo explicitado e positivo no caso de túnel duplo
        if (oc.armasFogo !== undefined && !isNaN(Number(oc.armasFogo)) && Number(oc.armasFogo) > 0) {
          qtdFogo = Number(oc.armasFogo);
        } else {
          qtdFogo = 0;
        }
      } else {
        const numVal = Number(oc.armas || oc.armasFogo || oc.armaFato || 0);
        qtdFogo = isNaN(numVal) ? 0 : numVal;
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
          // Preserva nome, grad e pelotão vindos da ocorrência mensal
          if (!t.integrantes[mat].nome && (pm.nome || pm.policial)) t.integrantes[mat].nome = pm.nome || pm.policial;
          if (!t.integrantes[mat].grad && (pm.grad || pm.graduacao)) t.integrantes[mat].grad = pm.grad || pm.graduacao;
          if (!t.integrantes[mat].pelotao && (pm.pelotao || pm.designacao)) t.integrantes[mat].pelotao = pm.pelotao || pm.designacao;
        }
      });
    });

    const resultados = [];

    // 2. Processar cada túnel com apreensão de armas
    Object.values(tuneis).forEach(t => {
      const totalFatosFisicos = t.armasFogo + t.armasArtesanais;
      if (totalFatosFisicos <= 0) return; // Ignora túneis sem armas

      const listaIntegrantes = Object.values(t.integrantes);
      if (listaIntegrantes.length === 0) {
        resultados.push({
          chaveTunel: t.chave,
          data: t.data,
          mike: t.mike,
          boe: t.boe,
          qtdArmas: t.armasFogo,
          armasFogo: t.armasFogo,
          armasArtesanais: t.armasArtesanais,
          totalFatosFisicos: totalFatosFisicos,
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
          qtdArmas: t.armasFogo,
          armasFogo: t.armasFogo,
          armasArtesanais: t.armasArtesanais,
          totalFatosFisicos: totalFatosFisicos,
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
          qtdArmas: t.armasFogo,
          armasFogo: t.armasFogo,
          armasArtesanais: t.armasArtesanais,
          totalFatosFisicos: totalFatosFisicos,
          status: 'PENDENTE_AUDITORIA',
          motivoPendente: 'EMPATE_ANTIGUIDADE',
          lider: null,
          integrantes: listaIntegrantes
        });
        return;
      }

      // Líder único de menor N definido: nome, grad e designação vêm da ocorrência mensal
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
        qtdArmas: t.armasFogo, // Apenas armas de fogo numéricas para soma dos cards
        armasFogo: t.armasFogo,
        armasArtesanais: t.armasArtesanais,
        totalFatosFisicos: totalFatosFisicos,
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
