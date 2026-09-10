'use strict';
if (typeof require === 'undefined') { /* Ignora no Apps Script */ } else {

/**
 * ARQUIVO: Testes/TestExecutorNormalizador.js
 * DESCRICAO: Suite do executor seguro do Normalizador (G01-008 / #120).
 * Prova: single-flight, snapshot, revalidacao (plano stale), kill-switch, log ANTES->DEPOIS,
 * rollback INTEGRAL do lote, fail-closed em qualquer falha parcial e respeito a whitelist/blacklist.
 * Usa um adaptador de planilha EM MEMORIA (nada real e tocado).
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { ExecutorNormalizador } = require('../Core/ExecutorNormalizador');
const { DryRunNormalizador } = require('../Core/DryRunNormalizador');
const { ContratoMutacaoSegura } = require('../Core/ContratoMutacaoSegura');

console.log('Iniciando Testes: Executor seguro do Normalizador (G01-008 / #120)...\n');

let sucessos = 0;
let falhas = 0;
function test(nome, fn) {
  try { fn(); console.log(`  [PASS] ${nome}`); sucessos++; }
  catch (err) { console.error(`  [FAIL] ${nome}:`, err.message); falhas++; }
}

const E = ExecutorNormalizador;
const arcaOk = { rule_id: 'ARCA-PIP-001', status: 'MAPPED', fonte_status: 'CANONICAL_SOURCE_CONFIRMED' };

/** Adaptador de planilha em memoria, com ganchos de falha/concorrencia/kill-switch. */
function criarPlanilhaFalsa(opcoes) {
  const o = opcoes || {};
  const dados = Object.assign({ 'ago.2026': { 'FORMULA42': '', 'FORMULA43': 'ANTIGO', 'FORMULA44': '' } }, o.dados || {});
  const chamadas = { leituras: [], escritas: [], locks: [], unlocks: [] };
  return {
    dados: dados,
    chamadas: chamadas,
    kill: o.kill === true,
    killApos: o.killApos === undefined ? null : o.killApos,
    falharEscritaEm: o.falharEscritaEm || null,
    lockIndisponivel: o.lockIndisponivel === true,
    excecaoEm: o.excecaoEm || null,
    adquirirLock(aba, execucaoId) {
      chamadas.locks.push({ aba: aba, execucaoId: execucaoId });
      if (this.lockIndisponivel) return { ok: false, motivo: 'LOCK_JA_ADQUIRIDO' };
      return { ok: true, lockId: 'LOCK-' + aba };
    },
    liberarLock(aba, lockId) { chamadas.unlocks.push({ aba: aba, lockId: lockId }); },
    killSwitchAcionado() {
      if (this.killApos !== null && chamadas.escritas.length >= this.killApos) return true;
      return this.kill;
    },
    _chave(range) { return String(range).indexOf('!') !== -1 ? String(range).split('!')[1] : String(range); },
    lerCelula(aba, range) { chamadas.leituras.push(range); return dados[aba][this._chave(range)]; },
    escreverCelula(aba, range, valor) {
      if (this.excecaoEm === range) throw new Error('EXCECAO_SIMULADA');
      if (this.falharEscritaEm === range) { chamadas.escritas.push({ aba: aba, range: range, valor: valor, ok: false }); return { ok: false, erro: 'ESCRITA_NEGADA' }; }
      chamadas.escritas.push({ aba: aba, range: range, valor: valor, ok: true });
      dados[aba][this._chave(range)] = valor;
      return { ok: true };
    }
  };
}

function acao(linha, coluna, valorAtual, valorProposto, classe, extra) {
  return Object.assign({
    id: 'PROP_ago.2026_' + linha + '_' + coluna + '_FORMULA_AUSENTE',
    diagnostic_id: 'FORMULA_AUSENTE',
    classe: classe || 'AUTO_FIX',
    tipo_acao: 'RESTAURAR_FORMULA',
    aba: 'ago.2026',
    linha: linha,
    coluna: coluna,
    range: 'ago.2026!' + coluna + linha,
    valor_atual: valorAtual,
    valor_proposto: valorProposto,
    justificativa: 'Restaurar formula canonica.',
    regra: arcaOk,
    valida: true,
    bloqueios: []
  }, extra || {});
}

const planoBase = {
  plano_id: 'PLANO_TESTE_120',
  dry_run: true,
  escrito: false,
  acoes: [acao(42, 'FORMULA', '', '=SOMA(A2:A5)'), acao(43, 'FORMULA', 'ANTIGO', '=SOMA(B2:B5)')],
  resumo: { mutaveis: 2, bloqueadas: 0, por_classe: { AUTO_FIX: 2, CONFIRM_FIX: 0, MANUAL_ONLY: 0 } },
  problemas: [],
  limites: { max_acoes: 200, excedeu_limite: false }
};

const estadoOk = { kill_switch: false, lock_adquirido: true, dry_run_executado: true, snapshot_disponivel: true, reauditoria_disponivel: true };
const quando = '2026-09-10T20:00:00.000Z';

// ---------- 1. portao de autorizacao ----------
test('plano sem travas completas NAO executa e nao escreve nada (fail-closed)', () => {
  const f = criarPlanilhaFalsa();
  const r = E.executar(planoBase, f, { estado: {}, agora: quando });
  assert.strictEqual(r.status, 'NAO_AUTORIZADO');
  assert.strictEqual(f.chamadas.escritas.length, 0);
  assert.strictEqual(f.chamadas.locks.length, 0, 'nem lock deve ser pedido sem autorizacao');
  assert.ok(r.motivos.length >= 4);
});

test('plano vazio nao abre lock nem escreve', () => {
  const f = criarPlanilhaFalsa();
  const r = E.executar({ plano_id: 'X', dry_run: true, acoes: [], problemas: [], limites: { max_acoes: 10, excedeu_limite: false } }, f, { estado: estadoOk, agora: quando });
  assert.strictEqual(r.status, 'SEM_ACOES');
  assert.strictEqual(f.chamadas.escritas.length, 0);
});

// ---------- 2. caminho feliz ----------
test('AUTO_FIX autorizado aplica, registra log ANTES->DEPOIS completo e libera o lock', () => {
  const f = criarPlanilhaFalsa();
  const r = E.executar(planoBase, f, { estado: estadoOk, agora: quando });
  assert.strictEqual(r.status, 'APLICADO');
  assert.strictEqual(r.aplicadas.length, 2);
  assert.strictEqual(f.dados['ago.2026']['FORMULA42'], '=SOMA(A2:A5)');
  assert.strictEqual(f.dados['ago.2026']['FORMULA43'], '=SOMA(B2:B5)');
  const log = r.log[0];
  ['plano_id', 'execucao_id', 'diagnostic_id', 'regra', 'classe', 'aba', 'range', 'valor_antes', 'valor_depois', 'timestamp', 'resultado'].forEach(k => {
    assert.ok(log[k] !== undefined, 'log deve conter ' + k);
  });
  assert.strictEqual(log.plano_id, 'PLANO_TESTE_120');
  assert.strictEqual(log.valor_antes, '');
  assert.strictEqual(log.valor_depois, '=SOMA(A2:A5)');
  assert.strictEqual(log.resultado, 'APLICADO');
  assert.strictEqual(f.chamadas.locks.length, 1, 'single-flight: um lock por aba');
  assert.strictEqual(f.chamadas.unlocks.length, 1, 'lock deve ser liberado');
  assert.ok(r.execucao_id && r.execucao_id.indexOf('EXEC_') === 0);
});

test('CONFIRM_FIX so aplica com confirmacao explicita do operador', () => {
  const plano = Object.assign({}, planoBase, { acoes: [acao(42, 'FORMULA', '', '=SOMA(A2:A5)', 'CONFIRM_FIX')] });
  const f1 = criarPlanilhaFalsa();
  const r1 = E.executar(plano, f1, { estado: estadoOk, agora: quando });
  assert.strictEqual(f1.chamadas.escritas.length, 0, 'sem confirmacao nao escreve');
  assert.ok(r1.ignoradas.some(i => i.motivo === 'CONFIRM_FIX_SEM_CONFIRMACAO'));
  const f2 = criarPlanilhaFalsa();
  const r2 = E.executar(plano, f2, { estado: estadoOk, agora: quando, confirmacao: ['PROP_ago.2026_42_FORMULA_FORMULA_AUSENTE'] });
  assert.strictEqual(r2.status, 'APLICADO');
  assert.strictEqual(f2.dados['ago.2026']['FORMULA42'], '=SOMA(A2:A5)');
});

test('MANUAL_ONLY nunca muta: fica de fora enquanto o AUTO_FIX do mesmo plano e aplicado', () => {
  const plano = Object.assign({}, planoBase, { acoes: [acao(42, 'FORMULA', '', '=SOMA(A2:A5)'), acao(44, 'MATRICULA', '999', '123', 'MANUAL_ONLY')] });
  const f = criarPlanilhaFalsa();
  const r = E.executar(plano, f, { estado: estadoOk, agora: quando });
  assert.strictEqual(r.status, 'APLICADO');
  assert.ok(r.ignoradas.some(i => i.motivo === 'MANUAL_ONLY_NUNCA_MUTA'), 'MANUAL_ONLY deve ser ignorada com motivo');
  const celulas = f.chamadas.escritas.map(e => e.range);
  assert.ok(celulas.indexOf('ago.2026!MATRICULA44') === -1, 'celula de MANUAL_ONLY nao pode ser escrita');
  assert.deepStrictEqual(celulas, ['ago.2026!FORMULA42']);
});

// ---------- 3. contencao ----------
test('plano stale (celula mudou desde o dry-run) dispara rollback fail-closed e nao altera nada', () => {
  const f = criarPlanilhaFalsa({ dados: { 'ago.2026': { 'FORMULA42': 'MUDOU_DEPOIS_DO_PLANO', 'FORMULA43': 'ANTIGO' } } });
  const r = E.executar(planoBase, f, { estado: estadoOk, agora: quando });
  assert.strictEqual(r.status, 'ROLLBACK_EXECUTADO');
  assert.ok(r.motivo_falha.indexOf('PLANO_STALE') !== -1);
  assert.strictEqual(f.dados['ago.2026']['FORMULA42'], 'MUDOU_DEPOIS_DO_PLANO', 'valor original deve permanecer');
  assert.strictEqual(f.dados['ago.2026']['FORMULA43'], 'ANTIGO');
  assert.strictEqual(f.chamadas.unlocks.length, 1, 'lock liberado mesmo em falha');
});

test('falha parcial de escrita (2a celula) reverte o LOTE INTEIRO (nao so a celula que falhou)', () => {
  const f = criarPlanilhaFalsa({ falharEscritaEm: 'ago.2026!FORMULA43' });
  const r = E.executar(planoBase, f, { estado: estadoOk, agora: quando });
  assert.strictEqual(r.status, 'ROLLBACK_EXECUTADO');
  assert.strictEqual(f.dados['ago.2026']['FORMULA42'], '', 'a 1a celula aplicada deve voltar ao original');
  assert.strictEqual(f.dados['ago.2026']['FORMULA43'], 'ANTIGO');
  assert.ok(r.rollback.executado);
  assert.ok(r.rollback.log.some(l => l.resultado === 'ROLLBACK'));
  assert.ok(r.rollback.revertidas.length >= 1);
  assert.strictEqual(f.chamadas.unlocks.length, 1);
});

test('excecao de escrita tambem dispara rollback integral', () => {
  const f = criarPlanilhaFalsa({ excecaoEm: 'ago.2026!FORMULA43' });
  const r = E.executar(planoBase, f, { estado: estadoOk, agora: quando });
  assert.strictEqual(r.status, 'ROLLBACK_EXECUTADO');
  assert.strictEqual(f.dados['ago.2026']['FORMULA42'], '');
});

test('kill-switch acionado ANTES do lote: interrompe sem nenhuma escrita', () => {
  const f = criarPlanilhaFalsa({ kill: true });
  const r = E.executar(planoBase, f, { estado: estadoOk, agora: quando });
  assert.strictEqual(r.status, 'INTERROMPIDO_POR_KILL_SWITCH');
  assert.strictEqual(f.chamadas.escritas.length, 0);
  assert.strictEqual(f.chamadas.unlocks.length, 1);
});

test('kill-switch acionado NO MEIO: interrompe e reverte o que ja foi aplicado', () => {
  const f = criarPlanilhaFalsa({ killApos: 1 });
  const r = E.executar(planoBase, f, { estado: estadoOk, agora: quando });
  assert.strictEqual(r.status, 'INTERROMPIDO_POR_KILL_SWITCH');
  assert.strictEqual(f.dados['ago.2026']['FORMULA42'], '', 'primeira escrita revertida pelo rollback integral');
  assert.ok(r.rollback.executado);
});

test('lock indisponivel (outra execucao em voo) bloqueia sem escrever', () => {
  const f = criarPlanilhaFalsa({ lockIndisponivel: true });
  const r = E.executar(planoBase, f, { estado: estadoOk, agora: quando });
  assert.strictEqual(r.status, 'NAO_AUTORIZADO');
  assert.ok(r.motivos.some(m => m.indexOf('LOCK_NAO_ADQUIRIDO') === 0));
  assert.strictEqual(f.chamadas.escritas.length, 0);
});

test('violacao de escopo injetada no plano (coluna AM / blacklist) e barrada antes de escrever', () => {
  const planoAm = Object.assign({}, planoBase, { acoes: [acao(42, 'AM', '', 'x', 'AUTO_FIX')] });
  const fAm = criarPlanilhaFalsa();
  const rAm = E.executar(planoAm, fAm, { estado: estadoOk, agora: quando });
  assert.notStrictEqual(rAm.status, 'APLICADO');
  assert.strictEqual(fAm.chamadas.escritas.length, 0, 'coluna de alerta nunca pode ser escrita');

  const planoBlack = Object.assign({}, planoBase, { acoes: [acao(42, 'MATRICULA', '9', '1', 'AUTO_FIX')] });
  const fb = criarPlanilhaFalsa();
  const rb = E.executar(planoBlack, fb, { estado: estadoOk, agora: quando });
  assert.notStrictEqual(rb.status, 'APLICADO');
  assert.strictEqual(fb.chamadas.escritas.length, 0, 'campo na blacklist nunca pode ser escrito');
});

test('limite de lote: acima do maximo nao inicia (kill-switch por quantidade)', () => {
  const f = criarPlanilhaFalsa();
  const r = E.executar(planoBase, f, { estado: estadoOk, agora: quando, maxAcoes: 1 });
  assert.strictEqual(r.status, 'NAO_AUTORIZADO');
  assert.ok(r.motivos.indexOf('LIMITE_DE_LOTE_EXCEDIDO') !== -1);
  assert.strictEqual(f.chamadas.escritas.length, 0);
});

// ---------- 4. garantias estruturais ----------
test('escritas ocorrem SOMENTE nos ranges das acoes autorizadas (nenhum dado fora da whitelist)', () => {
  const f = criarPlanilhaFalsa();
  E.executar(planoBase, f, { estado: estadoOk, agora: quando });
  const ranges = f.chamadas.escritas.map(e => e.range).sort();
  assert.deepStrictEqual(ranges, ['ago.2026!FORMULA42', 'ago.2026!FORMULA43']);
});

test('execucao_id e deterministico para o mesmo plano/instante e o log carrega o plano_id', () => {
  const f1 = criarPlanilhaFalsa(); const r1 = E.executar(planoBase, f1, { estado: estadoOk, agora: quando });
  const f2 = criarPlanilhaFalsa(); const r2 = E.executar(planoBase, f2, { estado: estadoOk, agora: quando });
  assert.strictEqual(r1.execucao_id, r2.execucao_id);
  assert.ok(r2.log.every(l => l.plano_id === 'PLANO_TESTE_120' && l.execucao_id === r2.execucao_id));
});

test('executor nao usa API de planilha direta (tudo via adaptador)', () => {
  const fonte = fs.readFileSync(path.join(__dirname, '..', 'Core', 'ExecutorNormalizador.js'), 'utf8');
  ['SpreadsheetApp', 'getRange(', 'setValue', 'setValues', 'setFormula'].forEach(api => {
    assert.ok(fonte.indexOf(api) === -1, 'API direta encontrada: ' + api);
  });
  const metodos = Object.getOwnPropertyNames(E).filter(n => typeof E[n] === 'function');
  const suspeitos = metodos.filter(m => /^(aplicar|mutar|gravar)$/i.test(m));
  assert.deepStrictEqual(suspeitos, [], 'metodo solto de escrita: ' + suspeitos.join(', '));
});

test('integracao #118/#119/#120: plano do dry-run alimenta o executor com o mesmo contrato', () => {
  const diag = { codigoRegra: 'FORMULA_AUSENTE', aba: 'ago.2026', linha: 42, coluna: 'FORMULA', diagnostico: 'x', valorAtual: '', valorProposto: '=SOMA(A2:A5)', arca: arcaOk };
  const plano = DryRunNormalizador.gerarPlano([diag], { contrato: ContratoMutacaoSegura });
  assert.strictEqual(plano.resumo.mutaveis, 1);
  const f = criarPlanilhaFalsa();
  const r = E.executar(plano, f, { estado: estadoOk, agora: quando, confirmacao: [plano.acoes[0].id] });
  assert.strictEqual(r.status, 'APLICADO');
  assert.strictEqual(f.dados['ago.2026']['FORMULA42'], '=SOMA(A2:A5)');
});

console.log(`\nRESULTADOS FINAIS: ${sucessos} PASS / ${falhas} FAIL`);
if (falhas > 0) process.exitCode = 1;
}
