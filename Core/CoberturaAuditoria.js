/**
 * ARQUIVO: Core/CoberturaAuditoria.js
 * DESCRICAO: Cobertura de auditoria do Guardiao da Qualidade (G01 #115).
 * Nucleo 100% puro (sem APIs Apps Script). Resposta explicita para:
 * "o que o Guardiao NAO conseguiu verificar neste mes?".
 *
 * Postura anti-falso-verde: toda familia de regra que nao pôde ser avaliada
 * vira entrada em `regrasNaoAuditadas` com tipo LIMITACAO_DE_AUDITORIA e motivo.
 * Nenhuma heuristica e promovida a regra oficial (requisito #115-10).
 */

class CoberturaAuditoria {
  /**
   * Monta o relatorio de cobertura da varredura.
   * @param {Object} ctx
   *  - catalogoPIP: null quando a Tabela PIP/coluna de indicadores nao foi localizada
   *  - resPeculio: resultado do LeitorAntiguidadePeculio ({erro} quando indisponivel)
   *  - diagnosticos: todos os diagnosticos emitidos na varredura (com .arca)
   * @returns {{status:'COMPLETA'|'PARCIAL', regrasNaoAuditadas:Array}}
   */
  static montarCobertura(ctx) {
    const regrasNaoAuditadas = [];
    const catalogoPIP = ctx && ctx.catalogoPIP;
    const resPeculio = ctx && ctx.resPeculio;
    const diagnosticos = (ctx && ctx.diagnosticos) || [];

    // 1. Catalogo PIP indisponivel -> regras de indicador nao avaliadas
    if (!catalogoPIP || (Array.isArray(catalogoPIP) && catalogoPIP.length === 0)) {
      regrasNaoAuditadas.push({
        regra: 'VALIDACAO_INDICADOR_PIP',
        motivo: 'CATALOGO_PIP_INDISPONIVEL: aba Tabela PIP ou coluna de indicador nao localizada.',
        tipo: 'LIMITACAO_DE_AUDITORIA'
      });
    }

    // 2. Fonte de antiguidade (EFETIVO/PECULIO) indisponivel -> merito por armas nao avaliado
    if (resPeculio && resPeculio.erro) {
      regrasNaoAuditadas.push({
        regra: 'MERITO_ARMAS_ANTIGUIDADE',
        motivo: 'FONTE_ANTIGUIDADE_INDISPONIVEL: ' + resPeculio.erro,
        tipo: 'LIMITACAO_DE_AUDITORIA'
      });
    }

    // 3. Lacunas de ARCA: diagnostico emitido sem mapeamento ARCA
    // (codigos de verificabilidade sao reportados como limitacao nas regras 1/2 acima)
    const CODIGOS_VERIFICABILIDADE = new Set([
      'MODO_LIMITADO_CATALOGO_PIP',
      'FATO_NAO_AUDITAVEL_AUTOMATICAMENTE',
      'ANTIGUIDADE_FONTE_NAO_LOCALIZADA'
    ]);
    const semArca = Array.from(new Set(
      diagnosticos
        .filter(d => d && d.arca && d.arca.status === 'ARCA_RULE_NOT_MAPPED' && !CODIGOS_VERIFICABILIDADE.has(d.codigoRegra))
        .map(d => d.codigoRegra || '')
        .filter(Boolean)
    ));
    if (semArca.length > 0) {
      regrasNaoAuditadas.push({
        regra: 'METADADOS_ARCA',
        motivo: 'ARCA_RULE_NOT_MAPPED: diagnosticos sem mapeamento ARCA: ' + semArca.join(', '),
        tipo: 'LACUNA_ARCA'
      });
    }

    return {
      status: regrasNaoAuditadas.length === 0 ? 'COMPLETA' : 'PARCIAL',
      regrasNaoAuditadas
    };
  }

  /**
   * Detecta policial (matricula) vinculado a 2+ MIKEs na MESMA data.
   * Participacao em multiplas ocorrencias no mesmo dia exige confirmacao humana -> OBSERVACAO.
   * @param {Object} mapaMatriculas matricula -> {datas:Set(data), mikes:Set(mike), linhas:Array}
   * @param {Function} criarDiag injecao de RegrasQualidade.criarDiagnostico (ou construtor puro)
   * @returns {Array} diagnosticos OBSERVACAO
   */
  static detectarMatriculaMultiplaNaMesmaData(mapaMatriculas, criarDiag) {
    const diags = [];
    Object.keys(mapaMatriculas || {}).forEach(mat => {
      const info = mapaMatriculas[mat];
      const datasComMultiplosMikes = [];
      const porData = {};
      (info.linhas || []).forEach(l => {
        if (!porData[l.data]) porData[l.data] = new Set();
        porData[l.data].add(l.mike);
      });
      Object.keys(porData).forEach(data => {
        if (porData[data].size > 1) {
          datasComMultiplosMikes.push({ data, mikes: Array.from(porData[data]) });
        }
      });
      datasComMultiplosMikes.forEach(oc => {
        diags.push(criarDiag({
          severidade: 'OBSERVACAO',
          codigoRegra: 'MATRICULA_MULTIPLAS_OCORRENCIAS_MESMA_DATA',
          camada: 'SEMANTICA',
          linha: (info.linhas || []).find(l => l.data === oc.data) ? info.linhas.find(l => l.data === oc.data).linha : 2,
          tunel: '',
          diagnostico: `Matricula ${mat} vinculada a mais de um MIKE na mesma data (${oc.data}).`,
          evidencia: `Matricula: ${mat} | MIKEs na data: ${oc.mikes.join(', ')}`,
          acaoRecomendada: 'Confirme se o policial participou de mais de uma ocorrência no mesmo dia ou se houve erro de preenchimento.'
        }));
      });
    });
    return diags;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CoberturaAuditoria };
}
