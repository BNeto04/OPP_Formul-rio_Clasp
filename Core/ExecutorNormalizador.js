/**
 * ARQUIVO: Core/ExecutorNormalizador.js
 * DESCRICAO: Executor seguro do Normalizador de Aba (G01-008 / card #120).
 *
 * Aplica SOMENTE correcoes autorizadas pelo plano do dry-run (#119) e pelo contrato (#118), sob
 * contencao de risco: lock single-flight por aba, snapshot pre-execucao, revalidacao de estado
 * (anti plano stale), kill-switch por quantidade, log ANTES -> DEPOIS por celula e ROLLBACK INTEGRAL
 * do lote em qualquer falha (fail-closed).
 *
 * O executor NAO fala com a planilha diretamente: tudo passa por um ADAPTADOR injetado que deve
 * implementar:
 *   adquirirLock(aba, execucaoId) -> { ok:boolean, lockId?:string, motivo?:string }
 *   liberarLock(aba, lockId)      -> void
 *   lerCelula(aba, range)         -> valor atual
 *   escreverCelula(aba, range, valor) -> { ok:boolean, erro?:string }
 *   killSwitchAcionado()          -> boolean
 * Assim o mesmo nucleo roda no Node (testes com adaptador em memoria) e no Apps Script (adaptador real).
 */

class ExecutorNormalizador {
  /** Resolve o dry-run (#119) e o contrato (#118) tanto no Apps Script quanto no Node. */
  static dryRunPadrao() {
    if (typeof DryRunNormalizador !== 'undefined') return DryRunNormalizador;
    if (typeof require !== 'undefined') { try { return require('./DryRunNormalizador').DryRunNormalizador; } catch (e) { return null; } }
    return null;
  }

  static contratoPadrao() {
    if (typeof ContratoMutacaoSegura !== 'undefined') return ContratoMutacaoSegura;
    if (typeof require !== 'undefined') { try { return require('./ContratoMutacaoSegura').ContratoMutacaoSegura; } catch (e) { return null; } }
    return null;
  }

  static hash(valor) {
    const texto = typeof valor === 'string' ? valor : JSON.stringify(valor);
    let h = 5381;
    for (let i = 0; i < texto.length; i++) h = ((h << 5) + h + texto.charCodeAt(i)) | 0;
    return 'EXEC_' + (h >>> 0).toString(16).toUpperCase();
  }

  /** Status possiveis do executor. */
  static STATUS() {
    return {
      APLICADO: 'APLICADO',
      SEM_ACOES: 'SEM_ACOES',
      NAO_AUTORIZADO: 'NAO_AUTORIZADO',
      INTERROMPIDO_POR_KILL_SWITCH: 'INTERROMPIDO_POR_KILL_SWITCH',
      ROLLBACK_EXECUTADO: 'ROLLBACK_EXECUTADO'
    };
  }

  /**
   * Revalida a acao imediatamente antes de escrever (defesa em profundidade, alem do plano).
   * @returns {string|null} motivo de bloqueio ou null quando liberada
   */
  static revalidarAcao(acao, contrato) {
    const C = contrato || ExecutorNormalizador.contratoPadrao();
    if (!acao || !acao.aba || !acao.linha || !acao.coluna) return 'ENDERECO_INCOMPLETO';
    if (acao.classe === 'MANUAL_ONLY') return 'MANUAL_ONLY_NUNCA_MUTA';
    if (C.campoBloqueado(acao.coluna)) return 'CAMPO_NA_BLACKLIST';
    const col = C.normalizarCampo(acao.coluna);
    const janela = C.JANELA_OPERACIONAL();
    if (/^[A-Z]{1,2}$/.test(col) && (col > janela.ultima_coluna || col === janela.coluna_alerta)) return 'FORA_DA_JANELA_OPERACIONAL';
    const wl = C.WHITELIST()[acao.classe] || [];
    if (acao.tipo_acao && wl.indexOf(acao.tipo_acao) === -1) return 'TIPO_ACAO_FORA_DA_WHITELIST';
    return null;
  }

  /** Acoes executaveis: validas, nao MANUAL_ONLY; CONFIRM_FIX somente com confirmacao explicita. */
  static selecionarAcoes(plano, confirmacao) {
    const conf = confirmacao || [];
    const aplicar = [];
    const ignoradas = [];
    ((plano && plano.acoes) || []).forEach(a => {
      if (!a.valida) { ignoradas.push({ id: a.id, motivo: 'ACAO_BLOQUEADA_NO_PLANO', bloqueios: a.bloqueios }); return; }
      if (a.classe === 'MANUAL_ONLY') { ignoradas.push({ id: a.id, motivo: 'MANUAL_ONLY_NUNCA_MUTA' }); return; }
      if (a.classe === 'CONFIRM_FIX' && conf.indexOf(a.id) === -1) { ignoradas.push({ id: a.id, motivo: 'CONFIRM_FIX_SEM_CONFIRMACAO' }); return; }
      aplicar.push(a);
    });
    return { aplicar: aplicar, ignoradas: ignoradas };
  }

  /**
   * Executa o plano com contencao total.
   * @param {Object} plano plano vindo do dry-run (#119)
   * @param {Object} adaptador ver contrato no cabecalho
   * @param {Object} opcoes { estado, confirmacao[], maxAcoes, agora (timestamp injetavel), reverterEmFalha (default true) }
   * @returns {Object} relatorio da execucao
   */
  static executar(plano, adaptador, opcoes) {
    const opts = opcoes || {};
    const S = ExecutorNormalizador.STATUS();
    const dryRun = opts.dryRun || ExecutorNormalizador.dryRunPadrao();
    const contrato = opts.contrato || ExecutorNormalizador.contratoPadrao();
    const agora = opts.agora || new Date().toISOString();
    const relatorio = {
      schema: 'RELATORIO_EXECUCAO_NORMALIZADOR_V1',
      plano_id: plano ? plano.plano_id : null,
      execucao_id: null,
      status: null,
      aplicadas: [],
      ignoradas: [],
      log: [],
      snapshot: [],
      rollback: null,
      lote: { limite: opts.maxAcoes || (dryRun ? dryRun.LIMITE_PADRAO_ACOES() : 200), aplicadas: 0 }
    };

    if (!plano || !Array.isArray(plano.acoes) || plano.acoes.length === 0) {
      relatorio.status = S.SEM_ACOES;
      return relatorio;
    }

    // 1. Portao do #119/#118: dry-run feito, todas as travas, sem limite estourado e sem conflito
    const aut = dryRun.autorizarExecucao(plano, opts.estado || {});
    if (!aut.autorizado) {
      relatorio.status = S.NAO_AUTORIZADO;
      relatorio.motivos = aut.motivos;
      return relatorio;
    }

    // 2. Selecao do que pode mutar
    const sel = ExecutorNormalizador.selecionarAcoes(plano, opts.confirmacao);
    relatorio.ignoradas = sel.ignoradas;
    if (sel.aplicar.length === 0) {
      relatorio.status = S.SEM_ACOES;
      return relatorio;
    }
    if (sel.aplicar.length > relatorio.lote.limite) {
      relatorio.status = S.NAO_AUTORIZADO;
      relatorio.motivos = ['LIMITE_DE_LOTE_EXCEDIDO'];
      return relatorio;
    }

    relatorio.execucao_id = ExecutorNormalizador.hash({
      plano_id: plano.plano_id,
      acoes: sel.aplicar.map(a => a.id),
      quando: agora
    });

    // 3. Lock single-flight por aba (adquire antes de qualquer escrita)
    const abas = sel.aplicar.map(a => a.aba).filter((v, i, arr) => arr.indexOf(v) === i);
    const locks = [];
    for (const aba of abas) {
      const r = adaptador.adquirirLock(aba, relatorio.execucao_id);
      if (!r || !r.ok) {
        locks.forEach(l => adaptador.liberarLock(l.aba, l.lockId));
        relatorio.status = S.NAO_AUTORIZADO;
        relatorio.motivos = ['LOCK_NAO_ADQUIRIDO:' + aba + (r && r.motivo ? ':' + r.motivo : '')];
        return relatorio;
      }
      locks.push({ aba: aba, lockId: r.lockId });
    }

    const liberarTudo = () => locks.forEach(l => { try { adaptador.liberarLock(l.aba, l.lockId); } catch (e) {} });

    // 4. Aplicacao com snapshot, revalidacao, kill-switch e log
    const aplicarLote = () => {
      for (let i = 0; i < sel.aplicar.length; i++) {
        const acao = sel.aplicar[i];

        // kill-switch consultado antes de CADA escrita
        let kill = false;
        try { kill = adaptador.killSwitchAcionado() === true; } catch (e) { kill = true; }
        if (kill) return { erro: 'KILL_SWITCH_ACIONADO', indice: i };

        // escopo (defesa em profundidade)
        const violacao = ExecutorNormalizador.revalidarAcao(acao, contrato);
        if (violacao) return { erro: 'VIOLACAO_DE_ESCOPO:' + violacao, indice: i };

        // snapshot + revalidacao de estado (anti plano stale)
        let valorAntes;
        try { valorAntes = adaptador.lerCelula(acao.aba, acao.range); } catch (e) { return { erro: 'LEITURA_FALHOU', indice: i }; }
        relatorio.snapshot.push({ id: acao.id, aba: acao.aba, range: acao.range, valor_antes: valorAntes });

        if (opts.revalidarValorAtual !== false && acao.valor_atual !== null && acao.valor_atual !== undefined) {
          if (String(valorAntes) !== String(acao.valor_atual)) {
            return { erro: 'PLANO_STALE', indice: i, detalhe: 'valor atual "' + valorAntes + '" difere do plano "' + acao.valor_atual + '"' };
          }
        }

        // escrita
        let res;
        try { res = adaptador.escreverCelula(acao.aba, acao.range, acao.valor_proposto); } catch (e) { res = { ok: false, erro: (e && e.message) || 'EXCECAO_DE_ESCRITA' }; }
        if (!res || res.ok !== true) return { erro: 'ESCRITA_FALHOU:' + ((res && res.erro) || 'desconhecido'), indice: i };

        relatorio.aplicadas.push({ id: acao.id, range: acao.range, classe: acao.classe });
        relatorio.lote.aplicadas++;
        relatorio.log.push({
          plano_id: plano.plano_id,
          execucao_id: relatorio.execucao_id,
          diagnostic_id: acao.diagnostic_id,
          regra: acao.regra ? acao.regra.rule_id : null,
          classe: acao.classe,
          aba: acao.aba,
          range: acao.range,
          valor_antes: valorAntes,
          valor_depois: acao.valor_proposto,
          timestamp: agora,
          resultado: 'APLICADO'
        });
      }
      return null;
    };

    const falha = aplicarLote();

    if (falha) {
      // 5. ROLLBACK INTEGRAL do lote (fail-closed). O snapshot inclui tambem a acao que falhou:
      //    uma excecao de escrita pode ter aplicado parcialmente, entao restaurar por inteiro e o
      //    comportamento seguro (restaurar celula intacta e idempotente).
      const rollback = ExecutorNormalizador.reverterLote(relatorio.snapshot, adaptador, { agora: agora, execucaoId: relatorio.execucao_id, planoId: plano.plano_id });
      relatorio.rollback = rollback;
      relatorio.motivo_falha = falha.erro + (falha.detalhe ? ' (' + falha.detalhe + ')' : '');
      relatorio.status = falha.erro === 'KILL_SWITCH_ACIONADO' ? S.INTERROMPIDO_POR_KILL_SWITCH : S.ROLLBACK_EXECUTADO;
      relatorio.log.forEach(l => { l.resultado = 'APLICADO_REVERTIDO'; });
      relatorio.log = relatorio.log.concat(rollback.log);
      liberarTudo();
      return relatorio;
    }

    relatorio.status = S.APLICADO;
    liberarTudo();
    return relatorio;
  }

  /**
   * Reverte o LOTE INTEIRO (nao uma celula): restaura, em ordem inversa, todos os valores do snapshot.
   * Usado tanto no rollback automatico quanto numa reversao explicita posterior.
   */
  static reverterLote(snapshot, adaptador, opcoes) {
    const opts = opcoes || {};
    const agora = opts.agora || new Date().toISOString();
    const r = { executado: false, revertidas: [], falhas: [], log: [], motivo: opts.motivo || 'ROLLBACK_SOLICITADO' };
    const lista = (snapshot || []).slice().reverse();
    lista.forEach(item => {
      try {
        const res = adaptador.escreverCelula(item.aba, item.range, item.valor_antes);
        if (res && res.ok === true) {
          r.revertidas.push({ id: item.id, range: item.range });
          r.log.push({
            plano_id: opts.planoId || null,
            execucao_id: opts.execucaoId || null,
            diagnostic_id: item.id,
            aba: item.aba,
            range: item.range,
            valor_antes: null,
            valor_depois: item.valor_antes,
            timestamp: agora,
            resultado: 'ROLLBACK'
          });
        } else {
          r.falhas.push({ id: item.id, range: item.range, erro: (res && res.erro) || 'FALHA_NO_ROLLBACK' });
        }
      } catch (e) {
        r.falhas.push({ id: item.id, range: item.range, erro: (e && e.message) || 'EXCECAO_NO_ROLLBACK' });
      }
    });
    r.executado = r.revertidas.length > 0;
    return r;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ExecutorNormalizador };
}
