/**
 * ARQUIVO: Core/ReauditoriaNormalizador.js
 * DESCRICAO: Reauditoria automatica e delta antes/depois do Normalizador Seguro (G01-009 / card #121).
 *
 * Fecha o ciclo: depois de um lote aplicado, o Guardiao e chamado de novo NO MESMO ESCOPO e o delta e
 * comparado de forma factual. Sucesso exige TODOS os criterios verdes; qualquer falha de qualidade
 * dispara ROLLBACK do lote e nova reauditoria do rollback (nenhum falso sucesso passa).
 *
 * Nucleo 100% puro: depende de um ADAPTADOR injetado que reaudita e (quando preciso) reverte.
 *   reauditar(aba) -> { reauditoria_id?, diagnosticos:[...], cobertura:{status, regrasNaoAuditadas[]} }
 *
 * Criterio de sucesso (requisito 4): ERRO_ALVO_RESOLVIDO=true, NOVOS_ERROS_CRIADOS=0,
 * ESCOPO_MUTADO<=LIMITE e REAUDITORIA=GREEN para o escopo tratado.
 */

class ReauditoriaNormalizador {
  static executorPadrao() {
    if (typeof ExecutorNormalizador !== 'undefined') return ExecutorNormalizador;
    if (typeof require !== 'undefined') { try { return require('./ExecutorNormalizador').ExecutorNormalizador; } catch (e) { return null; } }
    return null;
  }

  static hash(valor) {
    const texto = typeof valor === 'string' ? valor : JSON.stringify(valor);
    let h = 5381;
    for (let i = 0; i < texto.length; i++) h = ((h << 5) + h + texto.charCodeAt(i)) | 0;
    return 'REAUD_' + (h >>> 0).toString(16).toUpperCase();
  }

  /** Chave estavel de um diagnostico para comparar antes/depois. */
  static chave(d) {
    return [d.aba || '', d.linha || '', d.coluna || d.campo || '', d.codigoRegra || ''].join('|');
  }

  /** Regras que a cobertura declarou NAO auditaveis (para detectar perda de auditabilidade). */
  static regrasNaoAuditadas(cobertura) {
    const c = cobertura || {};
    const lista = c.regrasNaoAuditadas || [];
    return lista.map(r => ({
      regra: r.regra || null,
      motivo: r.motivo || null,
      tipo: r.tipo || null
    }));
  }

  /**
   * Executa a reauditoria de um lote aplicado.
   * @param {Object} relatorio relatorio do ExecutorNormalizador (#120)
   * @param {Object} plano plano do dry-run (#119) usado na execucao
   * @param {Object} adaptador { reauditar(aba), escreverCelula/lerCelula (para rollback) }
   * @param {Object} opcoes { limiteEscopo, agora, executarRollback (default true), executor }
   */
  static executar(relatorio, plano, adaptador, opcoes) {
    const opts = opcoes || {};
    const agora = opts.agora || new Date().toISOString();
    const limite = opts.limiteEscopo || (plano && plano.limites ? plano.limites.max_acoes : 200);
    const executor = opts.executor || ReauditoriaNormalizador.executorPadrao();
    const reauditoriaId = ReauditoriaNormalizador.hash({ exec: relatorio ? relatorio.execucao_id : null, quando: agora });

    const saida = {
      schema: 'REAUDITORIA_NORMALIZADOR_V1',
      reauditoria_id: reauditoriaId,
      execucao_id: relatorio ? relatorio.execucao_id : null,
      plano_id: plano ? plano.plano_id : null,
      status: null,
      criterios: {
        ERRO_ALVO_RESOLVIDO: false,
        NOVOS_ERROS_CRIADOS: 0,
        ESCOPO_MUTADO: relatorio && relatorio.aplicadas ? relatorio.aplicadas.length : 0,
        LIMITE_ESCOPO: limite,
        REAUDITORIA: null
      },
      cadeia: [],
      delta: { resolvidos: [], persistentes: [], novos: [], nao_auditados: [] },
      cobertura_antes: null,
      cobertura_depois: null,
      rollback: null,
      reauditoria_pos_rollback: null,
      resumo_humano: []
    };

    if (!relatorio || !relatorio.aplicadas || relatorio.aplicadas.length === 0) {
      saida.status = 'SEM_MUTACAO';
      saida.resumo_humano.push('Nenhuma mutacao aplicada: nada a reauditar.');
      return saida;
    }

    // Cadeia diagnostico -> plano -> mutacao -> reauditoria (requisito 2) preservando ARCA (requisito 7)
    saida.cadeia = relatorio.aplicadas.map(a => {
      const acao = ((plano && plano.acoes) || []).find(x => x.id === a.id) || {};
      return {
        diagnostic_id: acao.diagnostic_id || null,
        regra_arca: acao.regra ? acao.regra.rule_id : null,
        fonte_regra: acao.regra ? acao.regra.fonte_status : null,
        plano_id: saida.plano_id,
        mutacao_id: (relatorio.execucao_id || '') + '#' + a.id,
        range: a.range,
        aba: acao.aba || null,
        reauditoria_id: reauditoriaId
      };
    });

    const abas = saida.cadeia.map(c => c.aba).filter((v, i, arr) => arr.indexOf(v) === i && v);
    const antes = ReauditoriaNormalizador.diagnosticosDe(plano, relatorio);
    const depois = [];
    let coberturaDepois = null;
    abas.forEach(aba => {
      const r = adaptador.reauditar(aba) || {};
      (r.diagnosticos || []).forEach(d => depois.push(Object.assign({ aba: d.aba || aba }, d)));
      if (r.cobertura) coberturaDepois = r.cobertura;
    });
    saida.cobertura_antes = opts.coberturaAntes || null;
    saida.cobertura_depois = coberturaDepois;

    // 3. Delta factual
    const chavesAntes = {};
    antes.forEach(d => { chavesAntes[ReauditoriaNormalizador.chave(d)] = d; });
    const chavesDepois = {};
    depois.forEach(d => { chavesDepois[ReauditoriaNormalizador.chave(d)] = d; });

    // alvos = os diagnosticos que o lote tratou
    const alvos = saida.cadeia.map(c => ({ diagnostic_id: c.diagnostic_id, aba: c.aba }));

    Object.keys(chavesAntes).forEach(k => {
      const d = chavesAntes[k];
      const alvoDoLote = alvos.some(a => a.diagnostic_id === d.codigoRegra && a.aba === (d.aba || ''));
      if (!chavesDepois[k]) {
        if (alvoDoLote) saida.delta.resolvidos.push({ chave: k, codigoRegra: d.codigoRegra });
      } else {
        saida.delta.persistentes.push({ chave: k, codigoRegra: d.codigoRegra });
      }
    });
    Object.keys(chavesDepois).forEach(k => {
      if (!chavesAntes[k]) saida.delta.novos.push({ chave: k, codigoRegra: chavesDepois[k].codigoRegra });
    });
    saida.delta.nao_auditados = ReauditoriaNormalizador.regrasNaoAuditadas(coberturaDepois);

    // 4. Criterios
    const alvosResolvidos = alvos.length > 0 && alvos.every(a => saida.delta.resolvidos.some(r => r.codigoRegra === a.diagnostic_id));
    saida.criterios.ERRO_ALVO_RESOLVIDO = alvosResolvidos;
    saida.criterios.NOVOS_ERROS_CRIADOS = saida.delta.novos.length;

    // 6. Perda de auditabilidade: cobertura PARCIAL no escopo tratado OU regra alvo marcada como nao auditada
    const coberturaParcial = !!(coberturaDepois && coberturaDepois.status && coberturaDepois.status !== 'COMPLETA');
    const alvoPerdeuAuditoria = saida.delta.nao_auditados.length > 0;
    const auditabilidadePreservada = !coberturaParcial && !alvoPerdeuAuditoria;

    saida.criterios.REAUDITORIA = (auditabilidadePreservada && saida.criterios.NOVOS_ERROS_CRIADOS === 0 && alvosResolvidos) ? 'GREEN' : 'RED';
    const escopoOk = saida.criterios.ESCOPO_MUTADO <= limite;
    const sucesso = saida.criterios.ERRO_ALVO_RESOLVIDO === true
      && saida.criterios.NOVOS_ERROS_CRIADOS === 0
      && escopoOk
      && saida.criterios.REAUDITORIA === 'GREEN'
      && auditabilidadePreservada;

    // 8. Resumo humano
    const resumo = saida.resumo_humano;
    resumo.push(`Reauditoria ${reauditoriaId} do lote ${saida.execucao_id}: ${saida.delta.resolvidos.length} resolvido(s), ${saida.delta.persistentes.length} persistente(s), ${saida.delta.novos.length} novo(s).`);
    if (!alvosResolvidos) resumo.push('ERRO_ALVO_RESOLVIDO=false: o defeito alvo continua presente.');
    if (saida.criterios.NOVOS_ERROS_CRIADOS > 0) resumo.push(`NOVOS_ERROS_CRIADOS=${saida.criterios.NOVOS_ERROS_CRIADOS}: a correcao introduziu defeito novo.`);
    if (!escopoOk) resumo.push(`ESCOPO_MUTADO ${saida.criterios.ESCOPO_MUTADO} acima do limite ${limite}.`);
    if (!auditabilidadePreservada) resumo.push('Perda de auditabilidade no escopo tratado (cobertura PARCIAL ou regra NAO_AUDITADA) - ausencia de diagnostico NAO conta como verde.');
    resumo.push(`Cobertura depois: ${coberturaDepois && coberturaDepois.status ? coberturaDepois.status : 'NAO_INFORMADA'}.`);

    if (sucesso) {
      saida.status = 'VERDE';
      resumo.push('RESULTADO: correcao confirmada pela reauditoria (todos os criterios verdes).');
      return saida;
    }

    // 5/10. Falha de qualidade => rollback automatico do lote + reauditoria do rollback
    saida.status = 'ROLLBACK_POR_QUALIDADE';
    resumo.push('RESULTADO: criterios de qualidade falharam -> rollback automatico do lote.');
    if (opts.executarRollback === false) {
      resumo.push('Rollback desabilitado por opcao explicita: estado final NAO comprovado.');
      return saida;
    }
    if (!executor || !adaptador.escreverCelula) {
      resumo.push('Adaptador/executor sem capacidade de rollback: estado final NAO comprovado.');
      return saida;
    }

    saida.rollback = executor.reverterLote(relatorio.snapshot || [], adaptador, {
      agora: agora, execucaoId: relatorio.execucao_id, planoId: saida.plano_id, motivo: 'FALHA_DE_QUALIDADE_NA_REAUDITORIA'
    });

    // prova de estado final apos o rollback (requisito 10)
    const depois2 = [];
    let cobertura2 = null;
    abas.forEach(aba => {
      const r = adaptador.reauditar(aba) || {};
      (r.diagnosticos || []).forEach(d => depois2.push(Object.assign({ aba: d.aba || aba }, d)));
      if (r.cobertura) cobertura2 = r.cobertura;
    });
    const chavesDepois2 = {};
    depois2.forEach(d => { chavesDepois2[ReauditoriaNormalizador.chave(d)] = d; });
    const restaurados = chavesDepois2;
    const alvosDeVolta = alvos.every(a => Object.keys(restaurados).some(k => {
      const d = restaurados[k];
      return d.codigoRegra === a.diagnostic_id && (d.aba || '') === (a.aba || '');
    }));
    saida.reauditoria_pos_rollback = {
      reauditoria_id: ReauditoriaNormalizador.hash({ pos: relatorio.execucao_id, quando: agora }),
      diagnosticos: depois2.length,
      alvos_de_volta: alvosDeVolta,
      cobertura: cobertura2,
      estado_final_comprovado: saida.rollback.falhas.length === 0 && saida.rollback.revertidas.length > 0
    };
    resumo.push(`Apos o rollback: ${saida.rollback.revertidas.length} celula(s) revertida(s), ${saida.rollback.falhas.length} falha(s); defeitos alvo de volta ao estado anterior: ${alvosDeVolta ? 'SIM' : 'NAO'}.`);
    resumo.push(saida.reauditoria_pos_rollback.estado_final_comprovado ? 'ESTADO FINAL COMPROVADO.' : 'ESTADO FINAL NAO COMPROVADO.');
    return saida;
  }

  /** Diagnosticos existentes ANTES, a partir do plano (diag de origem de cada acao). */
  static diagnosticosDe(plano, relatorio) {
    const lista = [];
    const acoes = (plano && plano.acoes) || [];
    (relatorio && relatorio.aplicadas ? relatorio.aplicadas : []).forEach(a => {
      const acao = acoes.find(x => x.id === a.id);
      if (acao && acao.diagnostic_id) {
        lista.push({ aba: acao.aba, linha: acao.linha, coluna: acao.coluna, codigoRegra: acao.diagnostic_id });
      }
    });
    // diagnosticos alheios ao lote que ja existiam no escopo entram como contexto (persistentes legitimos)
    acoes.forEach(x => {
      if (x.diagnostic_id && !lista.some(l => l.aba === x.aba && l.linha === x.linha && l.coluna === x.coluna && l.codigoRegra === x.diagnostic_id)) {
        lista.push({ aba: x.aba, linha: x.linha, coluna: x.coluna, codigoRegra: x.diagnostic_id });
      }
    });
    return lista;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ReauditoriaNormalizador };
}
