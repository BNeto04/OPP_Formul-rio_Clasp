/**
 * ARQUIVO: Core/ContratoMutacaoSegura.js
 * DESCRICAO: Contrato de mutacao segura do Normalizador de Aba (G01-006 / card #118, Sprint #112).
 *
 * Nucleo 100% PURO: NAO escreve em planilha nenhuma, NAO chama APIs do Apps Script.
 * Responsabilidade: transformar diagnostico em PROPOSTA tipada, decidir a classe de correcao
 * (AUTO_FIX | CONFIRM_FIX | MANUAL_ONLY) e montar o PLANO (dry-run) com whitelist/blacklist e
 * politica de formula. A execucao real pertence aos cards seguintes (G01-007..G01-010), que devem
 * consumir as INTERFACES declaradas aqui.
 *
 * Regras inegociaveis (requisitos do #118):
 *  1) schema diagnostico -> proposta -> classe -> plano;
 *  2) FORMULA = CONFIRM_FIX por padrao;
 *  3) formula so vira AUTO_FIX com fonte canonica + contexto compativel + padrao comprovado + reauditoria imediata;
 *  4) whitelist explicita do que cada classe pode mutar;
 *  5) blacklist dura de campos operacionais (MIKE, BOE, matricula, policial, arma, droga, PIP, quantidades...);
 *  6) nenhuma heuristica/UNKNOWN e promovida a oficial;
 *  7) toda acao carrega diagnostico de origem, regra ARCA/fonte, aba, linha/coluna e justificativa;
 *  8) esta task nao realiza escrita operacional.
 */

class ContratoMutacaoSegura {
  static CLASSES() {
    return { AUTO_FIX: 'AUTO_FIX', CONFIRM_FIX: 'CONFIRM_FIX', MANUAL_ONLY: 'MANUAL_ONLY' };
  }

  /** Tipos de acao mutavel (o que pode ser feito numa celula). */
  static TIPOS_ACAO() {
    return {
      RESTAURAR_FORMULA: 'RESTAURAR_FORMULA',
      CORRIGIR_CABECALHO: 'CORRIGIR_CABECALHO',
      AJUSTAR_FORMATACAO: 'AJUSTAR_FORMATACAO'
    };
  }

  /** Whitelist: por classe, quais tipos de acao sao permitidos. MANUAL_ONLY nao muta nada. */
  static WHITELIST() {
    const T = ContratoMutacaoSegura.TIPOS_ACAO();
    return {
      AUTO_FIX: [T.RESTAURAR_FORMULA],
      CONFIRM_FIX: [T.RESTAURAR_FORMULA, T.CORRIGIR_CABECALHO, T.AJUSTAR_FORMATACAO],
      MANUAL_ONLY: []
    };
  }

  /**
   * Blacklist dura: campos/colunas de dado operacional que NUNCA sao mutados por este contrato,
   * mesmo com fonte canonica (exigem decisao humana fora do normalizador).
   */
  static BLACKLIST() {
    return [
      'MIKE', 'BOE', 'MATRICULA', 'POLICIAL', 'NOME', 'ARMA', 'ARMAS', 'DROGA', 'DROGAS',
      'PIP', 'PONTOS', 'QUANTIDADE', 'QTD', 'EFETIVO', 'FATO', 'OCORRENCIA', 'DATA',
      'HORA', 'LOCAL', 'AIS', 'TERRITORIO', 'ANTIGUIDADE'
    ];
  }

  /** Janela operacional das abas mensais: A:AL sao dados; AM e a coluna de alerta do Guardiao. */
  static JANELA_OPERACIONAL() {
    return { primeira_coluna: 'A', ultima_coluna: 'AL', coluna_alerta: 'AM' };
  }

  /**
   * Codigos de diagnostico do Guardiao que o contrato considera CORRIGIVEIS hoje.
   * classe_base = CONFIRM_FIX: formula so escala para AUTO_FIX cumprindo as 4 condicoes.
   */
  static REGRAS_CORRIGIVEIS() {
    const T = ContratoMutacaoSegura.TIPOS_ACAO();
    return {
      FORMULA_AUSENTE: { tipo_acao: T.RESTAURAR_FORMULA, classe_base: 'CONFIRM_FIX' },
      FORMULA_CORROMPIDA_ERRO_SINTAXE: { tipo_acao: T.RESTAURAR_FORMULA, classe_base: 'CONFIRM_FIX' },
      RATEIO_PONTOS_INCOERENTE: { tipo_acao: T.RESTAURAR_FORMULA, classe_base: 'CONFIRM_FIX' }
    };
  }

  /**
   * Codigos explicitamente NAO corrigiveis pelo contrato (MANUAL_ONLY), com motivo factual.
   * Cobre 100% dos codigos reais emitidos pelo MOD-C05-01 hoje.
   */
  static REGRAS_PROIBIDAS() {
    return {
      MIKE_SUSPEITO: 'DADO_OPERACIONAL_BLACKLIST',
      MIKE_DATA_DIVERGENTE: 'DADO_OPERACIONAL_BLACKLIST',
      MIKE_DATAS_DIVERGENTES: 'DADO_OPERACIONAL_BLACKLIST',
      MIKE_BOE_DIVERGENTE: 'DADO_OPERACIONAL_BLACKLIST',
      TUNEL_FRAGMENTADO: 'ESTRUTURAL_NAO_CORRIGIVEL_AUTOMATICAMENTE',
      TUNEL_SEM_EQUIPE: 'CONTEUDO_OPERACIONAL_AUSENTE',
      TUNEL_SEM_FATOS: 'CONTEUDO_OPERACIONAL_AUSENTE',
      OCORRENCIA_ORFA: 'ESTRUTURAL_NAO_CORRIGIVEL_AUTOMATICAMENTE',
      IMPUTADO_INVALIDO: 'DADO_OPERACIONAL_BLACKLIST',
      IMPUTADO_SEM_EVENTO_AH: 'CONTEUDO_OPERACIONAL_AUSENTE',
      MATRICULA_AUSENTE: 'DADO_OPERACIONAL_BLACKLIST',
      MATRICULA_MULTIPLAS_OCORRENCIAS_MESMA_DATA: 'JULGAMENTO_HUMANO_NECESSARIO',
      POLICIAL_SEM_NOME: 'DADO_OPERACIONAL_BLACKLIST',
      FATO_ARMA_AUSENTE: 'DADO_OPERACIONAL_BLACKLIST',
      ARMA_ARTESANAL_INCONSISTENTE: 'DADO_OPERACIONAL_BLACKLIST',
      FATO_MUNICAO_AUSENTE: 'DADO_OPERACIONAL_BLACKLIST',
      FATO_COCAINA_AUSENTE: 'DADO_OPERACIONAL_BLACKLIST',
      FATO_CRACK_AUSENTE: 'DADO_OPERACIONAL_BLACKLIST',
      FATO_MACONHA_AUSENTE: 'DADO_OPERACIONAL_BLACKLIST',
      FATO_NAO_AUDITAVEL_AUTOMATICAMENTE: 'SEM_FONTE_CANONICA',
      MERITO_ARMAS_ANTIGUIDADE_AUSENTE: 'DADO_OPERACIONAL_BLACKLIST',
      MERITO_ARMAS_EMPATE_ANTIGUIDADE: 'JULGAMENTO_HUMANO_NECESSARIO',
      EVENTO_INCOMPLETO_AG: 'CONTEUDO_OPERACIONAL_AUSENTE',
      EXCECAO_MANUAL_JUSTIFICADA: 'JA_JUSTIFICADO_PELO_OPERADOR',
      INDICADOR_DESCONHECIDO: 'SEM_FONTE_CANONICA',
      MODO_LIMITADO_CATALOGO_PIP: 'LIMITACAO_DE_CATALOGO',
      ANTIGUIDADE_FONTE_NAO_LOCALIZADA: 'SEM_FONTE_CANONICA'
    };
  }

  /** Remove acentos e normaliza para comparacao de campo. */
  static normalizarCampo(valor) {
    return String(valor === undefined || valor === null ? '' : valor)
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toUpperCase().trim();
  }

  /** Campo/coluna esta na blacklist dura? */
  static campoBloqueado(campo) {
    const alvo = ContratoMutacaoSegura.normalizarCampo(campo);
    if (!alvo) return false;
    return ContratoMutacaoSegura.BLACKLIST().some(b => alvo === b || alvo.indexOf(b) !== -1);
  }

  /** ID deterministico da proposta (mesma entrada => mesmo id; idempotencia do plano). */
  static idDeterministico(diagnostico) {
    const d = diagnostico || {};
    return ['PROP', d.aba || 'ABA?', d.linha || '?', d.coluna || '?', d.codigoRegra || '?'].join('_');
  }

  /**
   * Classifica um diagnostico. Nunca lanca excecao; entrada invalida volta como MANUAL_ONLY com motivo.
   * @returns {{classe:string, mutavel:boolean, tipo_acao:string|null, motivos:Array<string>}}
   */
  static classificar(diagnostico, contexto) {
    const d = diagnostico || {};
    const ctx = contexto || {};
    const proibida = (motivo, extra) => ({
      classe: 'MANUAL_ONLY', mutavel: false, tipo_acao: null,
      motivos: [motivo].concat(extra || [])
    });

    if (!d.codigoRegra) return proibida('DIAGNOSTICO_SEM_CODIGO');
    if (!d.aba || !d.linha) return proibida('DIAGNOSTICO_SEM_ENDERECO');

    const regra = ContratoMutacaoSegura.REGRAS_CORRIGIVEIS()[d.codigoRegra];
    if (!regra) {
      const motivoProibido = ContratoMutacaoSegura.REGRAS_PROIBIDAS()[d.codigoRegra];
      return proibida(motivoProibido ? 'NAO_CORRIGIVEL:' + motivoProibido : 'CODIGO_DESCONHECIDO_NO_CONTRATO');
    }

    const campo = d.coluna || d.campo || '';
    if (ContratoMutacaoSegura.campoBloqueado(campo)) {
      return proibida('CAMPO_NA_BLACKLIST:' + ContratoMutacaoSegura.normalizarCampo(campo));
    }

    // Heuristica/UNKNOWN nunca vira regra oficial nem mutacao automatica
    const fonte = ContratoMutacaoSegura.normalizarCampo(ctx.fonte || d.fonte || '');
    if (['HEURISTIC', 'HEURISTICA', 'UNKNOWN', 'DESCONHECIDA'].indexOf(fonte) !== -1) {
      return proibida('FONTE_NAO_CANONICA:' + fonte);
    }

    // Formula: CONFIRM_FIX por padrao; AUTO_FIX apenas com as 4 condicoes comprovadas
    if (regra.tipo_acao === ContratoMutacaoSegura.TIPOS_ACAO().RESTAURAR_FORMULA) {
      const faltando = [];
      if (ctx.fonteCanonica !== true) faltando.push('FONTE_CANONICA');
      if (ctx.contextoCompativel !== true) faltando.push('CONTEXTO_COMPATIVEL');
      if (ctx.padraoComprovado !== true) faltando.push('PADRAO_COMPROVADO');
      if (ctx.reauditoriaImediata !== true) faltando.push('REAUDITORIA_IMEDIATA');
      if (faltando.length === 0) {
        return { classe: 'AUTO_FIX', mutavel: true, tipo_acao: regra.tipo_acao, motivos: ['FORMULA_FONTE_CANONICA_E_REAUDITORIA_COMPROVADAS'] };
      }
      return {
        classe: 'CONFIRM_FIX', mutavel: true, tipo_acao: regra.tipo_acao,
        motivos: ['FORMULA_PADRAO_CONFIRM_FIX', 'CONDICOES_AUSENTES:' + faltando.join('+')]
      };
    }

    return { classe: regra.classe_base, mutavel: regra.classe_base !== 'MANUAL_ONLY', tipo_acao: regra.tipo_acao, motivos: ['REGRA_CLASSIFICADA'] };
  }

  /**
   * Constroi a PROPOSTA tipada (schema do contrato). Nao valida (use validarProposta) e nao escreve.
   */
  static construirProposta(diagnostico, contexto) {
    const d = diagnostico || {};
    const ctx = contexto || {};
    const cls = ContratoMutacaoSegura.classificar(d, ctx);
    const exigencias = ['DRY_RUN_OBRIGATORIO', 'LOCK_SINGLE_FLIGHT', 'SNAPSHOT_ANTES', 'REAUDITORIA_APOS', 'LOG_ANTES_DEPOIS'];
    if (cls.classe === 'CONFIRM_FIX') exigencias.push('CONFIRMACAO_DO_OPERADOR');

    const arca = d.arca || ctx.arca || null;
    return {
      id: ContratoMutacaoSegura.idDeterministico(d),
      schema: 'PROPOSTA_MUTACAO_SEGURA_V1',
      aba: d.aba || null,
      linha: d.linha || null,
      coluna: d.coluna || d.campo || null,
      tipo_acao: cls.tipo_acao,
      classe: cls.classe,
      mutavel: cls.mutavel,
      motivos_classe: cls.motivos,
      valor_atual: ctx.valorAtual === undefined ? null : ctx.valorAtual,
      valor_proposto: ctx.valorProposto === undefined ? null : ctx.valorProposto,
      justificativa: ctx.justificativa || '',
      condicoes_auto_fix: {
        fonteCanonica: ctx.fonteCanonica === true,
        contextoCompativel: ctx.contextoCompativel === true,
        padraoComprovado: ctx.padraoComprovado === true,
        reauditoriaImediata: ctx.reauditoriaImediata === true
      },
      lacuna_arca_explicita: ctx.lacunaArcaExplicita === true,
      regra_arca: arca ? {
        rule_id: arca.rule_id || null,
        status: arca.status || null,
        fonte_status: arca.fonte_status || null
      } : null,
      diagnostico_origem: {
        codigoRegra: d.codigoRegra || null,
        severidade: d.severidade || null,
        camada: d.camada || null,
        linha: d.linha || null,
        tunel: d.tunel || null,
        diagnostico: d.diagnostico || null,
        evidencia: d.evidencia || null
      },
      exigencias: exigencias
    };
  }

  /**
   * Valida a proposta contra whitelist, blacklist, janela operacional e exigencias de trilha.
   * @returns {{valida:boolean, bloqueios:Array<string>}}
   */
  static validarProposta(proposta) {
    const p = proposta || {};
    const b = [];
    const CLASSES = ContratoMutacaoSegura.CLASSES();
    const TIPOS = ContratoMutacaoSegura.TIPOS_ACAO();
    const WL = ContratoMutacaoSegura.WHITELIST();
    const janela = ContratoMutacaoSegura.JANELA_OPERACIONAL();

    if (Object.keys(CLASSES).map(k => CLASSES[k]).indexOf(p.classe) === -1) b.push('CLASSE_INVALIDA');
    if (p.classe === CLASSES.MANUAL_ONLY) b.push('MUTACAO_MANUAL_ONLY_PROIBIDA');

    if (p.classe && p.classe !== CLASSES.MANUAL_ONLY) {
      const tipoOk = p.tipo_acao && Object.keys(TIPOS).map(k => TIPOS[k]).indexOf(p.tipo_acao) !== -1;
      if (!tipoOk) b.push('TIPO_ACAO_INVALIDO');
      else if ((WL[p.classe] || []).indexOf(p.tipo_acao) === -1) b.push('TIPO_ACAO_FORA_DA_WHITELIST:' + p.tipo_acao);
    }

    if (!p.aba || !p.linha || !p.coluna) b.push('ENDERECO_INCOMPLETO');
    if (ContratoMutacaoSegura.campoBloqueado(p.coluna)) b.push('CAMPO_NA_BLACKLIST');

    // A janela A:AL so se aplica quando o alvo e LETRA de coluna (ex.: 'C', 'AM').
    // Colunas identificadas por NOME (ex.: 'FORMULA', 'QTD ARMAS') sao governadas pela blacklist.
    const col = ContratoMutacaoSegura.normalizarCampo(p.coluna);
    const ehLetraDeColuna = /^[A-Z]{1,2}$/.test(col);
    if (ehLetraDeColuna && col > janela.ultima_coluna) b.push('FORA_DA_JANELA_OPERACIONAL');
    if (ehLetraDeColuna && col === janela.coluna_alerta) b.push('PROIBIDO_ALTERAR_COLUNA_DE_ALERTA');

    if (p.valor_proposto === null || p.valor_proposto === undefined || String(p.valor_proposto).trim() === '') b.push('SEM_VALOR_PROPOSTO');
    if (!p.justificativa || String(p.justificativa).trim() === '') b.push('SEM_JUSTIFICATIVA');
    if (!p.diagnostico_origem || !p.diagnostico_origem.codigoRegra) b.push('SEM_DIAGNOSTICO_DE_ORIGEM');
    if (!p.regra_arca && p.lacuna_arca_explicita !== true) b.push('SEM_REGRA_ARCA_OU_LACUNA_EXPLICITA');

    if (p.classe === CLASSES.AUTO_FIX) {
      const c = p.condicoes_auto_fix || {};
      const faltando = [];
      if (c.fonteCanonica !== true) faltando.push('FONTE_CANONICA');
      if (c.contextoCompativel !== true) faltando.push('CONTEXTO_COMPATIVEL');
      if (c.padraoComprovado !== true) faltando.push('PADRAO_COMPROVADO');
      if (c.reauditoriaImediata !== true) faltando.push('REAUDITORIA_IMEDIATA');
      if (faltando.length > 0) b.push('AUTO_FIX_SEM_CONDICOES:' + faltando.join('+'));
    }

    return { valida: b.length === 0, bloqueios: b };
  }

  /** Monta o PLANO (dry-run) a partir das propostas: o que muta, o que bloqueia e por que. */
  static planejar(propostas) {
    const lista = (propostas || []).map(p => {
      const v = ContratoMutacaoSegura.validarProposta(p);
      return { id: p.id, classe: p.classe, tipo_acao: p.tipo_acao, aba: p.aba, linha: p.linha, coluna: p.coluna, valida: v.valida, bloqueios: v.bloqueios };
    });
    const por_classe = { AUTO_FIX: 0, CONFIRM_FIX: 0, MANUAL_ONLY: 0 };
    lista.forEach(i => { por_classe[i.classe] = (por_classe[i.classe] || 0) + 1; });
    return {
      schema: 'PLANO_NORMALIZACAO_V1',
      dry_run: true,
      total: lista.length,
      por_classe: por_classe,
      mutaveis: lista.filter(i => i.valida && i.classe !== 'MANUAL_ONLY'),
      bloqueadas: lista.filter(i => !i.valida || i.classe === 'MANUAL_ONLY'),
      exigencias_globais: ['DRY_RUN_OBRIGATORIO', 'LOCK_SINGLE_FLIGHT', 'KILL_SWITCH_RESPEITADO', 'ROLLBACK_DE_LOTE_DISPONIVEL', 'NOVOS_ERROS_CRIADOS_IGUAL_ZERO']
    };
  }

  /**
   * Porteiro unico de autorizacao. Sem todas as travas, NADA e executado (os cards seguintes
   * implementam a execucao, mas a decisao de autorizar permanece aqui).
   */
  static podeAutorizar(plano, estado) {
    const e = estado || {};
    const motivos = [];
    if (!plano || !plano.mutaveis || plano.mutaveis.length === 0) motivos.push('PLANO_SEM_ACOES_MUTAVEIS');
    if (e.kill_switch !== false) motivos.push('KILL_SWITCH_AUSENTE_OU_ACIONADO');
    if (e.lock_adquirido !== true) motivos.push('LOCK_NAO_ADQUIRIDO');
    if (e.dry_run_executado !== true) motivos.push('DRY_RUN_NAO_EXECUTADO');
    if (e.snapshot_disponivel !== true) motivos.push('SNAPSHOT_INDISPONIVEL');
    if (e.reauditoria_disponivel !== true) motivos.push('REAUDITORIA_INDISPONIVEL');
    return { autorizado: motivos.length === 0, motivos: motivos };
  }

  /**
   * Interfaces exigidas dos cards seguintes (G01-007 .. G01-010). Nao implementa nada: declara o
   * contrato para que dry-run, lock, rollback e reauditoria nasçam compativeis.
   */
  static INTERFACES() {
    return {
      DRY_RUN: { assinatura: 'executarDryRun(plano, adaptadorDeAba)', invariantes: ['NAO_ESCREVE', 'RETORNA_DIFF_POR_CELULA', 'MESMO_PLANO_MESMO_RESULTADO'] },
      LOCK: { assinatura: 'adquirirLock(aba, execucaoId)', invariantes: ['SINGLE_FLIGHT_POR_ABA', 'LIBERA_EM_SUCESSO_E_ERRO'] },
      SNAPSHOT_ROLLBACK: { assinatura: 'capturarSnapshot(plano) / reverterLote(execucaoId)', invariantes: ['REVERSIVEL_POR_LOTE', 'LOG_ANTES_DEPOIS_POR_CELULA'] },
      KILL_SWITCH: { assinatura: 'killSwitchAcionado()', invariantes: ['CONSULTADO_ANTES_DE_CADA_LOTE', 'ACIONADO_INTERROMPE_SEM_CORROMPER'] },
      REAUDITORIA_DELTA: { assinatura: 'reauditarEComparar(aba, execucaoId)', invariantes: ['NOVOS_ERROS_CRIADOS_IGUAL_ZERO', 'DELTA_ANTES_DEPOIS_OBRIGATORIO'] }
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ContratoMutacaoSegura };
}
