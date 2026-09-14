/**
 * ARQUIVO: Core/SerializacaoEscrita.js
 * INSTALACAO TRANSVERSAL: INST-SERIALIZACAO-001 (§8.11)
 *
 * Helper UNICO de serializacao de escrita do produto. Motivo (medido, card #164):
 * o codigo de produto NAO usava nenhuma trava (0 ocorrencias de `LockService` fora do stub de
 * sandbox `Testes/TestMenuP3.js:80`) e 9 Portas de escrita com nome fixo/ler-depois-escrever
 * podiam interleavar: log sobrescrito, EFETIVO hibrido, `[HISTORICO]` anexado no mesmo bloco,
 * coluna AM baseada em retrato parcial, comparativo misturado e - o caso de maior severidade -
 * DOIS BOs escolhendo a MESMA linha livre na aba mensal (o BO de um operador desaparecia sem
 * erro). Diagnostico: `DIAGNOSTICO_164_CONCORRENCIA.md` (§1 os 9 itens; §2 a reproducao; §5 a
 * recomendacao A+E acolhida pelo Planner).
 *
 * CONTRATO (o que este helper garante):
 *   1. UMA trava por EXECUCAO (lock global de escrita), adquirida no entrypoint mutante —
 *      `LockService.getScriptLock()` no runtime Apps Script. Headless (`clasp run`) e gatilhos
 *      instalados rodam no MESMO projeto de script: observam a MESMA trava.
 *   2. FAIL-CLOSED: nao obteve a trava => NADA e escrito e a execucao falha RUIDOSAMENTE
 *      (`SERIALIZACAO_OCUPADA`). Nunca "segue pela metade".
 *   3. REENTRANCIA: chamada aninhada da MESMA execucao (menu -> funcao interna) nao readquire
 *      a trava nem deadlocka; a trava pertence ao entrypoint externo.
 *   4. RELEASE GARANTIDO: liberacao em `finally` e, no runtime, o proprio Apps Script libera os
 *      locks no fim da execucao (inclusive em excecao/timeout).
 *   5. DONO + ORFAO + CORROMPIDO (molde `VigiaPonte/LockManager.js:28-106`): o dono e registrado
 *      (sessionId + fluxo + instante); trava registrada e NATIVA LIVRE = execucao anterior morreu
 *      sem liberar => ORFAO recuperado; registro ilegivel => CORROMPIDO recuperado; `liberar()`
 *      so age se for o DONO.
 *
 * MEIO DE TRAVA (declarado, sem terceira via): `LockService` quando existe (runtime). No sandbox
 * Node (execucao offline de teste, sem `LockService`) o dominio de exclusao e o PROCESSO — o
 * mutex `globalThis.__SYNTHEON_ESCRITA_MUTEX__`, compartilhado por todas as instancias do helper
 * no mesmo processo. A ausencia de meio de trava NUNCA autoriza escrever: sem trava adquirida,
 * nao ha escrita.
 *
 * NAO muda contrato de nome de aba, nem o comportamento visivel quando nao ha disputa.
 */

var SyntheonSerializacaoEscrita = (function () {
  var NOME_LOCK = 'syntheon-escrita-global';
  var CHAVE_DONO = 'SYNTHEON_ESCRITA_LOCK';
  var CHAVE_MUTEX_PROCESSO = '__SYNTHEON_ESCRITA_MUTEX__';

  var estado = {
    profundidade: 0,
    dono: null,
    lockNativo: null,
    provedorDeTeste: null
  };

  /** Erro tipado: o chamador distingue disputa de falha tecnica. */
  function ErroSerializacao(codigo, mensagem, detalhes) {
    var e = new Error(mensagem);
    e.codigo = codigo;
    e.serializacao = detalhes || null;
    return e;
  }

  function agoraIso() {
    return new Date().toISOString();
  }

  function novoSessionId(fluxo) {
    var base = 'exec_' + Date.now() + '_' + Math.floor(Math.random() * 1e9);
    return fluxo ? (fluxo + '#' + base) : base;
  }

  function raizGlobal() {
    if (typeof globalThis !== 'undefined') return globalThis;
    if (typeof global !== 'undefined') return global;
    return {};
  }

  /** Registro do dono (observabilidade/orfao). Nao e a trava: e o rastro de quem a tem. */
  function storePropriedades() {
    try {
      if (typeof PropertiesService === 'undefined' || !PropertiesService || !PropertiesService.getScriptProperties) return null;
      return PropertiesService.getScriptProperties();
    } catch (e) {
      return null;
    }
  }

  function lerRegistro() {
    var store = storePropriedades();
    if (!store) return { estado: 'AUSENTE', dado: null };
    var bruto = null;
    try { bruto = store.getProperty(CHAVE_DONO); } catch (e) { return { estado: 'AUSENTE', dado: null }; }
    if (bruto === null || bruto === undefined || String(bruto).trim() === '') return { estado: 'AUSENTE', dado: null };
    try {
      var dado = JSON.parse(bruto);
      if (!dado || !dado.sessionId) return { estado: 'CORROMPIDO', dado: null };
      return { estado: 'PRESENTE', dado: dado };
    } catch (e) {
      return { estado: 'CORROMPIDO', dado: null };
    }
  }

  function gravarRegistro(dono) {
    var store = storePropriedades();
    if (!store) return;
    try { store.setProperty(CHAVE_DONO, JSON.stringify(dono)); } catch (e) { /* rastro opcional */ }
  }

  function apagarRegistro() {
    var store = storePropriedades();
    if (!store) return;
    try { store.deleteProperty(CHAVE_DONO); } catch (e) { /* rastro opcional */ }
  }

  // ---------------------------------------------------------------------------
  // Provedores de trava (nativo x processo)
  // ---------------------------------------------------------------------------
  function provedorNativo() {
    if (typeof LockService === 'undefined' || !LockService) return null;
    var alvo = null;
    try {
      if (typeof LockService.getScriptLock === 'function') alvo = LockService.getScriptLock();
      else if (typeof LockService.getDocumentLock === 'function') alvo = LockService.getDocumentLock();
    } catch (e) {
      return null;
    }
    if (!alvo || typeof alvo.tryLock !== 'function') return null;
    return {
      nome: 'LockService',
      tentar: function () { return alvo.tryLock(0) === true; },
      liberar: function () { try { if (typeof alvo.releaseLock === 'function') alvo.releaseLock(); } catch (e) {} }
    };
  }

  function provedorProcesso() {
    var raiz = raizGlobal();
    var mutex = raiz[CHAVE_MUTEX_PROCESSO];
    if (!mutex) {
      mutex = { ocupado: false, dono: null };
      raiz[CHAVE_MUTEX_PROCESSO] = mutex;
    }
    return {
      nome: 'mutex-de-processo',
      tentar: function () {
        if (mutex.ocupado) return false;
        mutex.ocupado = true;
        return true;
      },
      liberar: function () { mutex.ocupado = false; mutex.dono = null; }
    };
  }

  function provedorAtivo() {
    if (estado.provedorDeTeste) return estado.provedorDeTeste;
    return provedorNativo() || provedorProcesso();
  }

  function estaAtivo() {
    return estado.profundidade > 0;
  }

  function infoDono() {
    return estado.dono ? {
      sessionId: estado.dono.sessionId,
      fluxo: estado.dono.fluxo,
      inicio: estado.dono.inicio,
      profundidade: estado.profundidade
    } : null;
  }

  function mensagemOcupada(fluxo, info) {
    var quem = (info && info.dono && info.dono.fluxo) ? info.dono.fluxo : 'outra execucao';
    return 'ESCRITA BLOQUEADA: o sistema ja esta executando "' + quem + '" nesta planilha. ' +
      'A operacao "' + fluxo + '" NAO foi executada e NADA foi gravado (fail-closed). ' +
      'Aguarde a execucao em andamento terminar (ou o Guardiao encerrar) e repita.';
  }

  // ---------------------------------------------------------------------------
  // API
  // ---------------------------------------------------------------------------

  /**
   * Adquire a trava global. Fail-closed: devolve `{ok:false}` quando ocupada; nunca "quase".
   * @returns {{ok:boolean, motivo:string, dono:Object|null, orfao?:boolean, corrompido?:boolean}}
   */
  function adquirir(fluxo) {
    if (estaAtivo()) {
      return { ok: true, motivo: 'REENTRANTE', dono: infoDono(), reentrante: true };
    }
    var provedor = provedorAtivo();
    var registro = lerRegistro();

    if (!provedor || !provedor.tentar()) {
      return {
        ok: false,
        motivo: 'SERIALIZACAO_OCUPADA',
        dono: registro.dado || null,
        provedor: provedor ? provedor.nome : 'INDISPONIVEL'
      };
    }

    // Conseguiu a trava nativa: registro anterior e RASTRO MORTO (orfao) ou ilegivel (corrompido).
    var orfao = registro.estado === 'PRESENTE';
    var corrompido = registro.estado === 'CORROMPIDO';

    estado.dono = {
      sessionId: novoSessionId(fluxo),
      fluxo: fluxo || 'nao-declarado',
      inicio: agoraIso(),
      provedor: provedor.nome,
      orfaoRecuperado: orfao ? registro.dado : null,
      corrompidoRecuperado: corrompido
    };
    estado.lockNativo = provedor;
    estado.profundidade = 1;
    gravarRegistro({ sessionId: estado.dono.sessionId, fluxo: estado.dono.fluxo, inicio: estado.dono.inicio });
    return {
      ok: true,
      motivo: orfao ? 'ORFAO_RECUPERADO' : (corrompido ? 'CORROMPIDO_RECUPERADO' : 'ADQUIRIDA'),
      dono: infoDono(),
      orfao: orfao,
      corrompido: corrompido,
      provedor: provedor.nome
    };
  }

  /** Libera a trava. Release SO do dono (a instancia que a adquiriu). */
  function liberar() {
    if (estado.profundidade > 1) { estado.profundidade--; return false; }
    if (!estado.dono) return false;
    var meu = estado.dono.sessionId;
    var registro = lerRegistro();
    if (registro.estado === 'PRESENTE' && registro.dado.sessionId !== meu) return false;
    var provedor = estado.lockNativo;
    estado.profundidade = 0;
    estado.dono = null;
    estado.lockNativo = null;
    apagarRegistro();
    if (provedor && typeof provedor.liberar === 'function') provedor.liberar();
    return true;
  }

  /**
   * Executa `fn` sob a trava global. Fail-closed: sem trava, `fn` NAO roda e a excecao
   * `SERIALIZACAO_OCUPADA` sobe para o entrypoint mostrar a mensagem ao operador.
   * @template T
   * @param {string} fluxo nome do fluxo/entrypoint (observabilidade e mensagem)
   * @param {function():T} fn corpo mutante
   * @returns {T}
   */
  function executarComLock(fluxo, fn) {
    if (typeof fn !== 'function') throw ErroSerializacao('SERIALIZACAO_USO_INCORRETO', 'executarComLock exige uma funcao.');
    if (estaAtivo()) {
      estado.profundidade++;
      try { return fn(); } finally { estado.profundidade--; }
    }
    var info = adquirir(fluxo);
    if (!info.ok) {
      throw ErroSerializacao('SERIALIZACAO_OCUPADA', mensagemOcupada(fluxo, info), info);
    }
    try {
      return fn();
    } finally {
      liberar();
    }
  }

  /** Mensagem ao operador para qualquer erro deste helper (usada pelas UIs). */
  function mensagemParaOperador(erro) {
    if (erro && erro.codigo === 'SERIALIZACAO_OCUPADA') return erro.message || mensagemOcupada('operacao', erro.serializacao || {});
    return erro && erro.message ? erro.message : String(erro);
  }

  function ehOcupada(erro) {
    return !!(erro && erro.codigo === 'SERIALIZACAO_OCUPADA');
  }

  /** Diagnostico read-only do estado (nao adquire nada). */
  function estadoAtual() {
    var registro = lerRegistro();
    return {
      ativo: estaAtivo(),
      nomeLock: NOME_LOCK,
      dono: infoDono(),
      registroPersistido: registro.estado,
      registroDono: registro.dado
    };
  }

  /** Somente teste: injeta um provedor de trava (ex.: tryLock que sempre recusa). */
  function _definirProvedorParaTeste(provedor) {
    estado.provedorDeTeste = provedor || null;
  }

  /** Somente teste: derruba todo o estado em memoria (nao mexe no registro persistido). */
  function _resetarParaTeste() {
    estado.profundidade = 0;
    estado.dono = null;
    estado.lockNativo = null;
    estado.provedorDeTeste = null;
    var raiz = raizGlobal();
    if (raiz[CHAVE_MUTEX_PROCESSO]) {
      raiz[CHAVE_MUTEX_PROCESSO].ocupado = false;
      raiz[CHAVE_MUTEX_PROCESSO].dono = null;
    }
  }

  return {
    NOME_LOCK: NOME_LOCK,
    CHAVE_DONO: CHAVE_DONO,
    adquirir: adquirir,
    liberar: liberar,
    executarComLock: executarComLock,
    estaAtivo: estaAtivo,
    estadoAtual: estadoAtual,
    mensagemParaOperador: mensagemParaOperador,
    ehOcupada: ehOcupada,
    _definirProvedorParaTeste: _definirProvedorParaTeste,
    _resetarParaTeste: _resetarParaTeste,
    _provedorProcesso: provedorProcesso
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SyntheonSerializacaoEscrita;
}
