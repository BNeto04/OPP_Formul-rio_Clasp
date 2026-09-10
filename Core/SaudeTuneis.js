/**
 * ARQUIVO: Core/SaudeTuneis.js
 * DESCRICAO: Quadro de saude por tunel/MIKE do Guardiao da Qualidade (G01 #114).
 * Núcleo 100% puro (sem APIs Apps Script), consome somente estruturas canonicas:
 * tuneis/mikesMapa/diagnosticos produzidos pelo motor GuardiaoQualidade.varrerAba.
 *
 * Classificacao (precedencia, sem inventar regra):
 *   CRITICO      -> existe diagnostico CRITICO no tunel (ex.: TUNEL_SEM_EQUIPE, MERITO_ARMAS_*).
 *   ALERTA       -> diagnostico ALERTA ou EXCECAO_MANUAL no tunel
 *                   (excecao manual justificada exige atencao humana e nunca e "verde limpo").
 *   INCOMPLETO   -> estrutura incompleta: TUNEL_SEM_FATOS / statusClassificacao VAZIO
 *                   ou INVALIDO_SEM_FATOS (equipe sem fato ou MIKE sem conteudo).
 *   NAO_AUDITAVEL-> so ha OBSERVACAO de verificabilidade (numerario sem valor,
 *                   fonte de antiguidade nao localizada, catalogo PIP em modo limitado)
 *                   ou observacao generica (indicador desconhecido): nao da para afirmar verde.
 *   SAUDAVEL     -> VALIDO e zero diagnosticos.
 *
 * Deteccoes estruturais:
 *   - Orfao: ocorrencia/linha com conteudo sem MIKE (diag OCORRENCIA_ORFA ja emitido pelo motor).
 *   - Duplicado: mesmo MIKE com BOEs ou datas divergentes (diags MIKE_BOE_DIVERGENTE /
 *     MIKE_DATAS_DIVERGENTES ja emitidos pelo motor) -> sumarizado aqui.
 *   - Fragmentado: mesmo MIKE com datas e BOE unicos, mas espalhado em mais de uma chave de tunel
 *     (ex.: formato de data Date vs String - risco documentado em ARCA_REGRAS_DOMINIO.md).
 *
 * Regra do produto mantida: o Guardiao NAO corrige dados; detecta, explica e localiza.
 */

const CODIGOS_NAO_AUDITAVEL = new Set([
  'FATO_NAO_AUDITAVEL_AUTOMATICAMENTE',
  'ANTIGUIDADE_FONTE_NAO_LOCALIZADA',
  'MODO_LIMITADO_CATALOGO_PIP'
]);

const SEVERIDADES_REF = {
  ERRO_TECNICO: 'ERRO TECNICO',
  CRITICO: 'CRITICO',
  ALERTA: 'ALERTA',
  OBSERVACAO: 'OBSERVACAO',
  EXCECAO_MANUAL: 'EXCECAO MANUAL'
};

class SaudeTuneis {
  /** Separa diagnosticos por chave de tunel. Diagnosticos sem tunel ficam em '' (orfas de ocorrencia). */
  static diagnosticosPorTunel(diagnosticos) {
    const mapa = {};
    (diagnosticos || []).forEach(d => {
      const chave = (d && d.tunel) || '';
      if (!mapa[chave]) mapa[chave] = [];
      mapa[chave].push(d);
    });
    return mapa;
  }

  static temSeveridade(diags, sev) {
    return (diags || []).some(d => (d.severidade || '') === sev);
  }

  static temCodigo(diags, codigo) {
    return (diags || []).some(d => (d.codigoRegra || '') === codigo);
  }

  /**
   * Classifica UM tunel nos 5 estados de saude.
   * @returns {{classificacao:string, motivo:string, codigos:Array<string>, linhas:Array<number>}}
   */
  static classificarTunel(tunel, diagsDoTunel) {
    const diags = diagsDoTunel || [];
    const codigos = Array.from(new Set(diags.map(d => d.codigoRegra || '').filter(Boolean)));
    const linhas = Array.from(new Set(
      diags.map(d => d.linha).filter(l => l && l >= 2)
        .concat((tunel.linhasFatos || []).map(lf => lf.linha))
    )).sort((a, b) => a - b);
    const statusEstrutural = tunel && tunel.statusClassificacao;

    const base = { codigos, linhas };

    // 1. CRITICO domina tudo
    if (SaudeTuneis.temSeveridade(diags, SEVERIDADES_REF.CRITICO)) {
      return Object.assign(base, { classificacao: 'CRITICO', motivo: 'DIAGNOSTICO_CRITICO_NO_TUNEL' });
    }

    // 2. Estrutural incompleto (sem fatos / vazio) tem precedencia sobre ALERTA generico do mesmo tunel
    if (statusEstrutural === 'INVALIDO_SEM_FATOS' || statusEstrutural === 'VAZIO' ||
        SaudeTuneis.temCodigo(diags, 'TUNEL_SEM_FATOS')) {
      return Object.assign(base, { classificacao: 'INCOMPLETO', motivo: 'TUNEL_SEM_FATOS_OU_VAZIO' });
    }

    // 3. ALERTA / EXCECAO_MANUAL
    if (SaudeTuneis.temSeveridade(diags, SEVERIDADES_REF.ALERTA) ||
        SaudeTuneis.temSeveridade(diags, SEVERIDADES_REF.EXCECAO_MANUAL)) {
      return Object.assign(base, { classificacao: 'ALERTA', motivo: 'DIAGNOSTICO_ALERTA_OU_EXCECAO' });
    }

    // 4. Nao auditavel: observacoes de verificabilidade (ou genericas) -> nunca falso verde
    if (diags.length > 0 && SaudeTuneis.temSeveridade(diags, SEVERIDADES_REF.OBSERVACAO)) {
      return Object.assign(base, { classificacao: 'NAO_AUDITAVEL', motivo: 'OBSERVACAO_SEM_VERIFICACAO_COMPLETA' });
    }

    // 5. Saudavel
    if (diags.length === 0 && statusEstrutural === 'VALIDO') {
      return Object.assign(base, { classificacao: 'SAUDAVEL', motivo: 'INTEGRIDADE_OK' });
    }

    // Caso residual (ex.: tunel sem nenhuma informacao acumulada) -> incompleto, nunca verde
    return Object.assign(base, { classificacao: 'INCOMPLETO', motivo: 'SEM_INFORMACAO_SUFICIENTE' });
  }

  /**
   * Detecta tuneis fragmentados: mesmo MIKE com BOE e data unicos, porem >1 chave de tunel.
   * Causa tipica: representacao de data inconsistente (Date vs String) fragmentando a chave.
   * @returns {Array<{mike:string, chaves:Array<string>, linhas:Array<number>}>}
   */
  static detectarFragmentados(mikesMapa) {
    const fragmentados = [];
    Object.values(mikesMapa || {}).forEach(entry => {
      if (!entry || !entry.mike) return;
      const chaves = Array.from(new Set((entry.linhas || []).map(l => l.chave).filter(Boolean)));
      if (chaves.length > 1 && entry.boes.size <= 1 && entry.datas.size <= 1) {
        fragmentados.push({
          mike: entry.mike,
          chaves,
          linhas: (entry.linhas || []).map(l => l.linha).sort((a, b) => a - b)
        });
      }
    });
    return fragmentados;
  }

  /** Sumariza tuneis duplicados (MIKE com BOEs/datas divergentes) para o quadro. */
  static detectarDuplicados(mikesMapa) {
    const duplicados = [];
    Object.values(mikesMapa || {}).forEach(entry => {
      if (!entry || !entry.mike) return;
      const tipos = [];
      if (entry.boes && entry.boes.size > 1) tipos.push('BOE');
      if (entry.datas && entry.datas.size > 1) tipos.push('DATA');
      if (tipos.length) {
        duplicados.push({
          mike: entry.mike,
          tipo: tipos.join('_'),
          boes: entry.boes ? Array.from(entry.boes) : [],
          datas: entry.datas ? Array.from(entry.datas) : [],
          linhas: (entry.linhas || []).map(l => l.linha).sort((a, b) => a - b)
        });
      }
    });
    return duplicados;
  }

  /** Conta ocorrencias orfas (linha com conteudo sem MIKE) a partir dos diagnosticos. */
  static contarOcorrenciasOrfas(diagnosticos) {
    return (diagnosticos || []).filter(d => d.codigoRegra === 'OCORRENCIA_ORFA').length;
  }

  /**
   * Monta o quadro completo de saude de uma varredura.
   * @param {Object} tuneis mapa chave->tunel
   * @param {Object} mikesMapa mapa mike->{...}
   * @param {Array} diagnosticos todos os diagnosticos da varredura (ja com tunel/linha)
   * @returns {{tuneis:Array, contagem:Object, orfaos:Object, duplicados:Array, fragmentados:Array}}
   */
  static montarQuadroSaude(tuneis, mikesMapa, diagnosticos) {
    const porTunelDiags = SaudeTuneis.diagnosticosPorTunel(diagnosticos);
    const tuneisLista = [];
    Object.keys(tuneis || {}).forEach(chave => {
      const tunel = tuneis[chave];
      const cls = SaudeTuneis.classificarTunel(tunel, porTunelDiags[chave] || []);
      tuneisLista.push(Object.assign({
        chave,
        mike: tunel.chave ? String(tunel.chave).split('|')[1] || '' : '',
        statusEstrutural: tunel.statusClassificacao || null,
        fatos: tunel.fatos || null,
        equipe: tunel.matriculas ? tunel.matriculas.size : 0
      }, cls));
    });

    const contagem = {
      total: tuneisLista.length,
      saudaveis: tuneisLista.filter(t => t.classificacao === 'SAUDAVEL').length,
      alertas: tuneisLista.filter(t => t.classificacao === 'ALERTA').length,
      criticos: tuneisLista.filter(t => t.classificacao === 'CRITICO').length,
      incompletos: tuneisLista.filter(t => t.classificacao === 'INCOMPLETO').length,
      naoAuditaveis: tuneisLista.filter(t => t.classificacao === 'NAO_AUDITAVEL').length
    };

    return {
      tuneis: tuneisLista,
      contagem,
      orfaos: { ocorrenciasSemMike: SaudeTuneis.contarOcorrenciasOrfas(diagnosticos) },
      duplicados: SaudeTuneis.detectarDuplicados(mikesMapa),
      fragmentados: SaudeTuneis.detectarFragmentados(mikesMapa)
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SaudeTuneis, SEVERIDADES_REF };
}
