/**
 * ARQUIVO: Dominio/ARCA/AdaptadorConsultaArca.js
 * DESCRIÇÃO: Adaptador de consulta somente leitura para a ARCA (Catálogo Canônico de Regras de Domínio).
 * Fornece metadados explicáveis para enriquecimento aditivo de diagnósticos de auditoria e qualidade.
 * TOTALMENTE SOMENTE LEITURA, FAIL-SOFT E NÃO INTRUSIVO.
 */

class AdaptadorConsultaArca {
  /**
   * Mapeamento canônico entre os códigos de diagnóstico do Guardião/RegrasQualidade e os rule_ids da ARCA.
   */
  static get MAPA_DIAGNOSTICO_ARCA() {
    return Object.freeze({
      // Domínio: Drogas / Entorpecentes
      'FATO_MACONHA_AUSENTE': 'ARCA-DROGAS-001',
      'FATO_CRACK_AUSENTE': 'ARCA-DROGAS-001',
      'FATO_COCAINA_AUSENTE': 'ARCA-DROGAS-001',

      // Domínio: Armas
      'FATO_ARMA_AUSENTE': 'ARCA-ARMAS-003',

      // Domínio: Munições
      'FATO_MUNICAO_AUSENTE': 'ARCA-MUNICOES-001',

      // Domínio: Numerário
      'FATO_NAO_AUDITAVEL_AUTOMATICAMENTE': 'ARCA-NUMERARIO-001',

      // Domínio: PIP / Pontuação
      'RATEIO_PONTOS_INCOERENTE': 'ARCA-PIP-001',
      'INDICADOR_DESCONHECIDO': 'ARCA-PIP-003',
      'MODO_LIMITADO_CATALOGO_PIP': 'ARCA-PIP-003',

      // Domínio: Ocorrência / Túnel
      'TUNEL_SEM_EQUIPE': 'ARCA-OCORRENCIA-003',
      'TUNEL_SEM_FATOS': 'ARCA-OCORRENCIA-004',
      'OCORRENCIA_ORFA': 'ARCA-OCORRENCIA-002',

      // Domínio: Mérito de Equipe por Armas / Antiguidade
      'MERITO_ARMAS_ANTIGUIDADE_AUSENTE': 'ARCA-MERITO-001',
      'MERITO_ARMAS_EMPATE_ANTIGUIDADE': 'ARCA-MERITO-002',
      'ANTIGUIDADE_FONTE_NAO_LOCALIZADA': 'ARCA-MERITO-003',

      // Domínio: MIKE
      'MIKE_DATA_DIVERGENTE': 'ARCA-MIKE-001',
      'MIKE_DATAS_DIVERGENTES': 'ARCA-MIKE-002',
      'MIKE_SUSPEITO': 'ARCA-MIKE-003',

      // Domínio: BOE
      'MIKE_BOE_DIVERGENTE': 'ARCA-BOE-001',

      // Domínio: Imputação
      'EVENTO_INCOMPLETO_AG': 'ARCA-IMPUTACAO-001',
      'IMPUTADO_SEM_EVENTO_AH': 'ARCA-IMPUTACAO-001',
      'IMPUTADO_INVALIDO': 'ARCA-IMPUTACAO-001',

      // Domínio: Matrícula / Efetivo
      'MATRICULA_AUSENTE': 'ARCA-MATRICULA-002',

      // Técnicas / Fórmulas
      'FORMULA_CORROMPIDA_ERRO_SINTAXE': 'ARCA-TECNICA-001',
      'FORMULA_AUSENTE': 'ARCA-TECNICA-001',
      'EXCECAO_MANUAL_JUSTIFICADA': 'ARCA-TECNICA-002',

      // G01 (#126 ARCA-FIX-003): codigos antes sem regra ARCA (geravam LACUNA_ARCA)
      'TUNEL_FRAGMENTADO': 'ARCA-MIKE-004',
      'POLICIAL_SEM_NOME': 'ARCA-EFETIVO-003',
      'MATRICULA_MULTIPLAS_OCORRENCIAS_MESMA_DATA': 'ARCA-MATRICULA-003'
    });
  }

  /**
   * Instância singleton cacheada em memória (somente leitura).
   * Obs.: campos de classe (`static x = ...`) nao sao suportados pelo parser do
   * Apps Script - os valores sao inicializados apos a definicao da classe.
   */

  /**
   * Permite configurar um caminho customizado ou mock injetável (ex: para testes de fail-soft).
   */
  static configurarCaminho(caminho) {
    AdaptadorConsultaArca._caminhoCustomizado = caminho;
    AdaptadorConsultaArca._cacheArca = null;
  }

  /**
   * Reseta o cache interno para forçar recarregamento.
   */
  static limparCache() {
    AdaptadorConsultaArca._cacheArca = null;
  }

  /**
   * Carrega os dados da ARCA de forma totalmente fail-soft.
   * Se o arquivo não existir ou o JSON estiver corrompido, retorna null sem lançar exceção.
   * @returns {Object|null}
   */
  static carregarArca() {
    if (AdaptadorConsultaArca._cacheArca !== null) {
      return AdaptadorConsultaArca._cacheArca;
    }

    try {
      let arcaData = null;

      if (typeof require !== 'undefined') {
        const fs = require('fs');
        const path = require('path');

        let jsonPath = AdaptadorConsultaArca._caminhoCustomizado;
        if (!jsonPath) {
          jsonPath = path.join(__dirname, 'arca_regras_dominio.json');
        }

        if (fs.existsSync(jsonPath)) {
          const raw = fs.readFileSync(jsonPath, 'utf8');
          arcaData = JSON.parse(raw);
        }
      }

      if (arcaData && Array.isArray(arcaData.regras)) {
        const mapaRegras = {};
        arcaData.regras.forEach(r => {
          if (r && r.rule_id) {
            mapaRegras[r.rule_id] = Object.freeze(JSON.parse(JSON.stringify(r)));
          }
        });
        AdaptadorConsultaArca._cacheArca = Object.freeze({
          meta: Object.freeze(arcaData.meta || {}),
          regrasPorId: Object.freeze(mapaRegras)
        });
        return AdaptadorConsultaArca._cacheArca;
      }
    } catch (e) {
      // Fail-soft: silencioso em tempo de execução para não interromper varredura
    }

    return null;
  }

  /**
   * Consulta os metadados de uma regra da ARCA a partir de seu rule_id.
   * @param {string} ruleId - Identificador estável (ex: 'ARCA-PIP-001').
   * @returns {Object}
   */
  static consultarPorRuleId(ruleId) {
    const arca = AdaptadorConsultaArca.carregarArca();
    if (!arca) {
      return Object.freeze({
        status: 'ARCA_METADATA_UNAVAILABLE',
        rule_id: ruleId || null,
        mensagem: 'Metadados da ARCA indisponíveis no momento.'
      });
    }

    const regra = arca.regrasPorId[ruleId];
    if (!regra) {
      return Object.freeze({
        status: 'ARCA_RULE_NOT_MAPPED',
        rule_id: ruleId || null,
        mensagem: `Regra "${ruleId}" não catalogada na ARCA.`
      });
    }

    const isOfficial = (regra.tipo_regra === 'OFFICIAL_BUSINESS_RULE' && regra.fonte_status === 'CANONICAL_SOURCE_CONFIRMED');

    let fonteSummary = 'Fonte interna operacional';
    if (regra.fonte_status === 'CANONICAL_SOURCE_CONFIRMED' && regra.fontes && regra.fontes.length > 0) {
      fonteSummary = `${regra.fontes[0].nome} (${regra.fontes[0].tipo})`;
    } else if (regra.fonte_status === 'DOMAIN_RULE_SOURCE_UNKNOWN' || regra.tipo_regra === 'HEURISTIC') {
      fonteSummary = 'Fonte oficial não comprovada (Heurística / DOMAIN_RULE_SOURCE_UNKNOWN)';
    }

    return Object.freeze({
      status: 'MAPPED',
      rule_id: regra.rule_id,
      titulo: regra.titulo,
      subdominio: regra.subdominio,
      tipo_regra: regra.tipo_regra,
      fonte_status: regra.fonte_status,
      fonte_summary: fonteSummary,
      fontes: regra.fontes || [],
      confianca: regra.confianca || 'MEDIA',
      alcance: regra.alcance || 'LOCAL',
      is_official: isOfficial,
      expected_rule_summary: regra.descricao_humana || regra.resultado_esperado || '',
      condicao: regra.condicao || '',
      // Parametros de dominio declarados na regra (card #138: `titulo_pip` de ARCA-VEICULO-001 e consumido
      // pelo servidor do formulario via porta canonica). Campo aditivo: nao altera os campos existentes.
      parametros: regra.parametros || {},
      excecoes: regra.excecoes || []
    });
  }

  /**
   * Enriquece um diagnóstico existente com metadados canônicos da ARCA de forma explicável.
   * @param {string} codigoDiagnostico - Código do diagnóstico (ex: 'RATEIO_PONTOS_INCOERENTE').
   * @param {Object} [contexto] - Dados contextuais opcionais (evidência, ação recomendada).
   * @returns {Object} Estrutura explicável do enriquecimento.
   */
  static enriquecerDiagnostico(codigoDiagnostico, contexto = {}) {
    const mapa = AdaptadorConsultaArca.MAPA_DIAGNOSTICO_ARCA;
    const ruleId = mapa[codigoDiagnostico];

    if (!ruleId) {
      return Object.freeze({
        status: 'ARCA_RULE_NOT_MAPPED',
        diagnostic_code: codigoDiagnostico,
        rule_id: null,
        rule_type: null,
        source_status: null,
        source_summary: 'Regra sem mapeamento correspondente na ARCA',
        confidence: null,
        found_value: contexto.evidencia || null,
        expected_rule_summary: null,
        human_action: contexto.acaoRecomendada || null,
        is_official: false
      });
    }

    const meta = AdaptadorConsultaArca.consultarPorRuleId(ruleId);

    if (meta.status === 'ARCA_METADATA_UNAVAILABLE') {
      return Object.freeze({
        status: 'ARCA_METADATA_UNAVAILABLE',
        diagnostic_code: codigoDiagnostico,
        rule_id: ruleId,
        rule_type: null,
        source_status: null,
        source_summary: 'ARCA indisponível para consulta em runtime',
        confidence: null,
        found_value: contexto.evidencia || null,
        expected_rule_summary: null,
        human_action: contexto.acaoRecomendada || null,
        is_official: false
      });
    }

    return Object.freeze({
      status: 'ENRICHED',
      diagnostic_code: codigoDiagnostico,
      rule_id: meta.rule_id,
      titulo_regra: meta.titulo,
      subdominio: meta.subdominio,
      rule_type: meta.tipo_regra,
      source_status: meta.fonte_status,
      source_summary: meta.fonte_summary,
      confidence: meta.confianca,
      found_value: contexto.evidencia || null,
      expected_rule_summary: meta.expected_rule_summary,
      human_action: contexto.acaoRecomendada || null,
      is_official: meta.is_official,
      excecoes: meta.excecoes
    });
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AdaptadorConsultaArca;
}

// Inicializacao pos-classe (compativel com o parser do Apps Script, que rejeita campos de classe)
AdaptadorConsultaArca._cacheArca = null;
AdaptadorConsultaArca._caminhoCustomizado = null;
