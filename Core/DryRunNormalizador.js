/**
 * ARQUIVO: Core/DryRunNormalizador.js
 * DESCRICAO: Dry-run e plano deterministico de correcao do Normalizador Seguro (G01-007 / card #119).
 *
 * Nucleo 100% PURO: consome os diagnosticos do MOD-C05-01 + o contrato do #118
 * (`Core/ContratoMutacaoSegura.js`) e produz um PLANO de correcao sem tocar na planilha.
 * Nenhuma escrita acontece aqui — o modo real pertence ao card #120.
 *
 * Garantias:
 *  - idempotencia: o mesmo estado de entrada produz o MESMO plano e o MESMO hash estavel;
 *  - rastreabilidade: cada acao carrega diagnostic_id, regra/fonte, aba, celula/range,
 *    valor atual, valor proposto, classe e justificativa;
 *  - deteccao de problemas: plano vazio, conflito de alvo, alvo fora da whitelist,
 *    fonte insuficiente, ambiguidade e limite de acoes (kill-switch do executor);
 *  - preview legivel para confirmacao do operador.
 */

class DryRunNormalizador {
  /**
   * Resolve o contrato do #118 tanto no Apps Script (escopo global compartilhado) quanto no Node (require).
   */
  static contratoPadrao() {
    if (typeof ContratoMutacaoSegura !== 'undefined') return ContratoMutacaoSegura;
    if (typeof require !== 'undefined') {
      try { return require('./ContratoMutacaoSegura').ContratoMutacaoSegura; } catch (e) { return null; }
    }
    return null;
  }

  /** Limite padrao de acoes/celulas por lote (consumido pelo kill-switch do executor, card #120). */
  static LIMITE_PADRAO_ACOES() { return 200; }

  /**
   * Normaliza um diagnostico do Guardiao para o formato de entrada do contrato.
   * Espera (quando existirem): codigoRegra, aba, linha, coluna/campo, severidade, camada, tunel,
   * diagnostico, evidencia, valorAtual, valorProposto, arca.
   */
  static extrairDiagnostico(diagnostico) {
    const d = diagnostico || {};
    return {
      codigoRegra: d.codigoRegra || null,
      aba: d.aba || null,
      linha: d.linha || null,
      coluna: d.coluna || d.campo || null,
      severidade: d.severidade || null,
      camada: d.camada || null,
      tunel: d.tunel || d.mike || null,
      diagnostico: d.diagnostico || d.mensagem || null,
      evidencia: d.evidencia || null,
      arca: d.arca || null,
      valorAtual: d.valorAtual === undefined ? null : d.valorAtual,
      valorProposto: d.valorProposto === undefined ? null : d.valorProposto
    };
  }

  /** Hash estavel (djb2/FNV-like) sobre a serializacao canonica — sem dependencia externa. */
  static hashCanonico(valor) {
    const texto = typeof valor === 'string' ? valor : JSON.stringify(valor);
    let h = 5381;
    for (let i = 0; i < texto.length; i++) {
      h = ((h << 5) + h + texto.charCodeAt(i)) | 0;
    }
    return 'PLANO_' + (h >>> 0).toString(16).toUpperCase();
  }

  /** Serializacao canonica: chaves em ordem e lista de acoes ordenada (determinismo). */
  static serializarCanonico(acoes) {
    return JSON.stringify((acoes || []).map(a => ({
      id: a.id,
      classe: a.classe,
      tipo_acao: a.tipo_acao,
      aba: a.aba,
      linha: a.linha,
      coluna: a.coluna,
      valor_atual: a.valor_atual,
      valor_proposto: a.valor_proposto,
      justificativa: a.justificativa,
      regra: a.regra
    })));
  }

  /** Ordem deterministica: aba, linha numerica, coluna, id. */
  static ordenar(acoes) {
    return (acoes || []).slice().sort((a, b) => {
      const k = (x) => [String(x.aba || ''), Number(x.linha) || 0, String(x.coluna || ''), String(x.id || '')].join('|');
      return k(a) < k(b) ? -1 : (k(a) > k(b) ? 1 : 0);
    });
  }

  /**
   * Gera o plano (dry-run) a partir dos diagnosticos.
   * @param {Array} diagnosticos diagnosticos do Guardiao (com .arca quando houver)
   * @param {Object} opcoes { maxAcoes, resolverValorCanonico(d), abaFiltro }
   * @returns {Object} plano deterministico, com problemas, resumo, preview e limites
   */
  static gerarPlano(diagnosticos, opcoes) {
    const opts = opcoes || {};
    const contrato = opts.contrato || DryRunNormalizador.contratoPadrao();
    const limite = opts.maxAcoes || DryRunNormalizador.LIMITE_PADRAO_ACOES();
    const resolver = opts.resolverValorCanonico || null;
    const lista = Array.isArray(diagnosticos) ? diagnosticos : [];

    const problemas = [];
    const acoes = [];
    const diagnosticosIgnorados = [];

    if (lista.length === 0) {
      problemas.push({ tipo: 'PLANO_VAZIO', detalhe: 'Nenhum diagnostico recebido: nada a corrigir.' });
    }

    lista.forEach(bruto => {
      const d = DryRunNormalizador.extrairDiagnostico(bruto);
      if (opts.abaFiltro && d.aba !== opts.abaFiltro) { diagnosticosIgnorados.push({ id: d.codigoRegra, motivo: 'ABA_FORA_DO_FILTRO' }); return; }

      // valor canonico: do proprio diagnostico ou de um resolvedor explicito
      let valorProposto = d.valorProposto;
      if ((valorProposto === null || valorProposto === undefined || String(valorProposto).trim() === '') && typeof resolver === 'function') {
        try { valorProposto = resolver(d); } catch (e) { valorProposto = null; }
      }

      const contexto = {
        arca: d.arca,
        valorAtual: d.valorAtual,
        valorProposto: valorProposto,
        justificativa: opts.justificativaDe ? opts.justificativaDe(d) : DryRunNormalizador.justificativaPadrao(d),
        fonteCanonica: d.fonteCanonica === true,
        contextoCompativel: d.contextoCompativel === true,
        padraoComprovado: d.padraoComprovado === true,
        reauditoriaImediata: d.reauditoriaImediata === true,
        lacunaArcaExplicita: d.lacunaArcaExplicita === true
      };

      const proposta = contrato.construirProposta(d, contexto);
      const validacao = contrato.validarProposta(proposta);

      const acao = {
        id: proposta.id,
        diagnostic_id: d.codigoRegra,
        classe: proposta.classe,
        tipo_acao: proposta.tipo_acao,
        aba: proposta.aba,
        linha: proposta.linha,
        coluna: proposta.coluna,
        range: proposta.aba && proposta.linha && proposta.coluna ? proposta.aba + '!' + proposta.coluna + proposta.linha : null,
        valor_atual: proposta.valor_atual,
        valor_proposto: proposta.valor_proposto,
        justificativa: proposta.justificativa,
        regra: proposta.regra_arca,
        motivos_classe: proposta.motivos_classe,
        exigencias: proposta.exigencias,
        valida: validacao.valida,
        bloqueios: validacao.bloqueios
      };

      if (!validacao.valida) {
        acao.bloqueios.forEach(bl => {
          const tipo = bl.indexOf('TIPO_ACAO_FORA_DA_WHITELIST') === 0 ? 'ALVO_FORA_DA_WHITELIST'
            : (bl === 'SEM_VALOR_PROPOSTO' ? 'FONTE_INSUFICIENTE'
              : (bl === 'SEM_REGRA_ARCA_OU_LACUNA_EXPLICITA' ? 'FONTE_INSUFICIENTE' : 'BLOQUEIO_CONTRATO'));
          problemas.push({ tipo: tipo, detalhe: bl, id: acao.id, aba: acao.aba, linha: acao.linha });
        });
      }
      acoes.push(acao);
    });

    // Deteccao de conflito/ambiguidade por celula alvo
    const porAlvo = {};
    acoes.forEach(a => {
      const alvo = [a.aba, a.linha, a.coluna].join('!');
      if (!porAlvo[alvo]) porAlvo[alvo] = [];
      porAlvo[alvo].push(a);
    });
    Object.keys(porAlvo).forEach(alvo => {
      const grupo = porAlvo[alvo];
      if (grupo.length > 1) {
        const valores = grupo.map(g => String(g.valor_proposto));
        const distintos = valores.filter((v, i) => valores.indexOf(v) === i).length > 1;
        problemas.push({
          tipo: distintos ? 'CONFLITO_DE_ALVO' : 'AMBIGUIDADE_DE_ALVO',
          detalhe: (distintos ? 'Acoes divergentes para a mesma celula: ' : 'Acoes duplicadas para a mesma celula: ') + alvo,
          id: grupo.map(g => g.id).join(','), aba: grupo[0].aba, linha: grupo[0].linha
        });
        grupo.forEach(g => { g.valida = false; g.bloqueios = g.bloqueios.concat([distintos ? 'CONFLITO_DE_ALVO' : 'AMBIGUIDADE_DE_ALVO']); });
      }
    });

    const ordenadas = DryRunNormalizador.ordenar(acoes);
    const mutaveis = ordenadas.filter(a => a.valida && a.classe !== 'MANUAL_ONLY');
    const por_classe = {
      AUTO_FIX: ordenadas.filter(a => a.classe === 'AUTO_FIX').length,
      CONFIRM_FIX: ordenadas.filter(a => a.classe === 'CONFIRM_FIX').length,
      MANUAL_ONLY: ordenadas.filter(a => a.classe === 'MANUAL_ONLY').length
    };
    const excedeuLimite = mutaveis.length > limite;
    if (excedeuLimite) {
      problemas.push({ tipo: 'LIMITE_EXCEDIDO', detalhe: `Acoes mutaveis (${mutaveis.length}) acima do limite de lote (${limite}).` });
    }

    const plano = {
      schema: 'PLANO_NORMALIZACAO_V1',
      dry_run: true,
      escrito: false,
      plano_id: DryRunNormalizador.hashCanonico(DryRunNormalizador.serializarCanonico(ordenadas)),
      acoes: ordenadas,
      resumo: {
        total_diagnosticos: lista.length,
        total_acoes: ordenadas.length,
        mutaveis: mutaveis.length,
        bloqueadas: ordenadas.length - mutaveis.length,
        por_classe: por_classe,
        problemas: problemas.length
      },
      problemas: problemas,
      ignorados: diagnosticosIgnorados,
      limites: { max_acoes: limite, excedeu_limite: excedeuLimite },
      exigencias_globais: ['DRY_RUN_OBRIGATORIO', 'LOCK_SINGLE_FLIGHT', 'SNAPSHOT_ANTES', 'KILL_SWITCH_RESPEITADO', 'REAUDITORIA_APOS', 'NOVOS_ERROS_CRIADOS_IGUAL_ZERO']
    };
    plano.preview = DryRunNormalizador.previewLegivel(plano);
    return plano;
  }

  static justificativaPadrao(d) {
    const regra = d.arca && d.arca.rule_id ? d.arca.rule_id : 'sem-regra-arca';
    return `Diagnostico ${d.codigoRegra} na ${d.aba} linha ${d.linha}: ${d.diagnostico || 'sem descricao'} (${regra})`;
  }

  /** Preview textual para confirmacao do operador (nada e escrito). */
  static previewLegivel(plano) {
    const l = [];
    l.push(`PLANO ${plano.plano_id} | dry-run | acoes: ${plano.resumo.total_acoes} (mutaveis ${plano.resumo.mutaveis}, bloqueadas ${plano.resumo.bloqueadas})`);
    l.push(`Classes: AUTO_FIX=${plano.resumo.por_classe.AUTO_FIX} | CONFIRM_FIX=${plano.resumo.por_classe.CONFIRM_FIX} | MANUAL_ONLY=${plano.resumo.por_classe.MANUAL_ONLY}`);
    if (plano.limites.excedeu_limite) l.push(`ATENCAO: limite de lote excedido (${plano.limites.max_acoes}).`);
    (plano.acoes || []).forEach(a => {
      const estado = a.valida ? a.classe : 'BLOQUEADO(' + a.bloqueios.join('+') + ')';
      l.push(`- [${estado}] ${a.range || 'sem-endereco'} | ${a.tipo_acao || 'sem-tipo'} | "${String(a.valor_atual)}" -> "${String(a.valor_proposto)}" | ${a.regra && a.regra.rule_id ? a.regra.rule_id : 'sem-regra-arca'}`);
    });
    (plano.problemas || []).forEach(p => l.push(`! ${p.tipo}: ${p.detalhe}`));
    return l;
  }

  /**
   * Ponte para o executor (card #120): o plano so autoriza execucao com todas as travas,
   * exatamente como definido no contrato do #118.
   */
  static autorizarExecucao(plano, estado) {
    const contrato = DryRunNormalizador.contratoPadrao();
    const base = contrato.podeAutorizar({ mutaveis: (plano && plano.acoes || []).filter(a => a.valida && a.classe !== 'MANUAL_ONLY') }, estado);
    const motivos = base.motivos.slice();
    if (plano && plano.limites && plano.limites.excedeu_limite) motivos.push('LIMITE_DE_LOTE_EXCEDIDO');
    if (plano && plano.problemas && plano.problemas.some(p => p.tipo === 'CONFLITO_DE_ALVO')) motivos.push('CONFLITO_DE_ALVO_NO_PLANO');
    return { autorizado: motivos.length === 0, motivos: motivos };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DryRunNormalizador };
}
