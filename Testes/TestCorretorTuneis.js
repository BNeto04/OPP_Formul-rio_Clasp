'use strict';
/**
 * ARQUIVO: Testes/TestCorretorTuneis.js
 * DESCRICAO: Suite do Corretor de Túneis (Features/CorretorTuneis.js).
 * Cobre: propagação de DATA/BOE nas linhas-filhas, ORD intocado, célula já
 * preenchida preservada, conflito de data/BOE pulado, linha em branco como
 * fronteira e idempotência.
 */

const assert = require('assert');
const CorretorTuneis = require('../Features/CorretorTuneis');

// Mock de Sheet: linhas = array de [ORD, DATA, HORA, QTD, MIKE, NATUREZA, BOE] (linha 2 em diante).
function criarSheet(linhas) {
  const dados = linhas.map(function (r) { return r.slice(); });
  const chamadas = []; // { r, c, v }

  function getRange(r, c, nr, nc) {
    if (nr === undefined && nc === undefined) {
      return {
        setValue: function (v) { dados[r - 2][c - 1] = v; chamadas.push({ r: r, c: c, v: v }); }
      };
    }
    const sub = dados.slice(r - 2, r - 2 + nr).map(function (row) { return row.slice(c - 1, c - 1 + nc); });
    return { getValues: function () { return sub; } };
  }

  return {
    chamadas: chamadas,
    dados: dados,
    getLastRow: function () { return linhas.length + 1; },
    getName: function () { return 'MOCK'; },
    getRange: getRange
  };
}

function test(name, fn) {
  try { fn(); console.log('  [PASS] ' + name); }
  catch (err) { console.error('  [FAIL] ' + name); console.error(err); process.exit(1); }
}

console.log('Testes Unitarios: Corretor de Túneis (propagação de DATA/BOE)...\n');

// 1. Propaga DATA para linhas-filhas, sem tocar ORD.
test('propaga DATA para as linhas-filhas e nao toca ORD', () => {
  const sheet = criarSheet([
    ['1', '01/01/2026', '10:00', '1', 'MIKE1', 'NAT', 'BOE1'],
    ['2', '', '', '', 'MIKE1', '', 'BOE1'],
    ['3', '', '', '', 'MIKE1', '', 'BOE1'],
    ['4', '', '', '', 'MIKE1', '', 'BOE1']
  ]);
  const resumo = CorretorTuneis.corrigirTuneisAba(sheet);
  assert.strictEqual(resumo.datas, 3, '3 datas preenchidas');
  assert.strictEqual(resumo.boes, 0, 'BOE ja preenchido');
  assert.strictEqual(sheet.dados[1][1], '01/01/2026', 'linha 3 DATA preenchida');
  assert.strictEqual(sheet.dados[2][1], '01/01/2026', 'linha 4 DATA preenchida');
  assert.strictEqual(sheet.dados[3][1], '01/01/2026', 'linha 5 DATA preenchida');
  assert.strictEqual(sheet.dados[1][0], '2', 'ORD da linha 3 intocado');
  assert.ok(!sheet.chamadas.some(ch => ch.c === 1), 'nenhuma escrita na coluna ORD (A)');
});

// 2. Propaga BOE quando vazio.
test('propaga BOE quando vazio na linha-filha', () => {
  const sheet = criarSheet([
    ['1', '01/01/2026', '', '', 'MIKE1', '', 'BOE1'],
    ['2', '', '', '', 'MIKE1', '', '']
  ]);
  const resumo = CorretorTuneis.corrigirTuneisAba(sheet);
  assert.strictEqual(resumo.boes, 1, '1 BOE preenchido');
  assert.strictEqual(sheet.dados[1][6], 'BOE1', 'BOE propagado');
});

// 3. Não sobrescreve DATA já preenchida.
test('nao sobrescreve DATA ja preenchida', () => {
  const sheet = criarSheet([
    ['1', '01/01/2026', '', '', 'MIKE1', '', 'BOE1'],
    ['2', '01/01/2026', '', '', 'MIKE1', '', 'BOE1'],
    ['3', '', '', '', 'MIKE1', '', 'BOE1']
  ]);
  const resumo = CorretorTuneis.corrigirTuneisAba(sheet);
  assert.strictEqual(resumo.datas, 1, 'so a linha 4 (vazia)');
});

// 4. Conflito de data (2 datas distintas no mesmo MIKE) -> pula.
test('conflito de data: 2 datas distintas no mesmo MIKE -> nao corrige', () => {
  const sheet = criarSheet([
    ['1', '01/01/2026', '', '', 'MIKE1', '', 'BOE1'],
    ['2', '02/01/2026', '', '', 'MIKE1', '', 'BOE1']
  ]);
  const resumo = CorretorTuneis.corrigirTuneisAba(sheet);
  assert.strictEqual(resumo.conflitos.length, 1, 'conflito reportado');
  assert.strictEqual(resumo.datas, 0, 'nenhuma data preenchida');
});

// 5. Conflito de BOE (2 BOEs distintos no mesmo MIKE) -> pula.
test('conflito de BOE: 2 BOEs distintos no mesmo MIKE -> nao corrige', () => {
  const sheet = criarSheet([
    ['1', '01/01/2026', '', '', 'MIKE1', '', 'BOE1'],
    ['2', '', '', '', 'MIKE1', '', 'BOE2']
  ]);
  const resumo = CorretorTuneis.corrigirTuneisAba(sheet);
  assert.strictEqual(resumo.conflitos.length, 1, 'conflito reportado');
  assert.strictEqual(resumo.boes, 0, 'nenhum BOE preenchido');
});

// 6. Linha em branco separa túneis (fronteira respeitada).
test('linha em branco separa tuneis e nao vaza data entre eles', () => {
  const sheet = criarSheet([
    ['1', '01/01/2026', '', '', 'MIKE1', '', 'BOE1'],
    ['2', '', '', '', 'MIKE1', '', 'BOE1'],
    ['3', '', '', '', '', '', ''],   // linha em branco
    ['4', '02/01/2026', '', '', 'MIKE2', '', 'BOE2'],
    ['5', '', '', '', 'MIKE2', '', 'BOE2']
  ]);
  const resumo = CorretorTuneis.corrigirTuneisAba(sheet);
  assert.strictEqual(resumo.datas, 2, '1 filha do MIKE1 + 1 filha do MIKE2');
  assert.strictEqual(sheet.dados[1][1], '01/01/2026', 'filha do MIKE1 com a data certa');
  assert.strictEqual(sheet.dados[4][1], '02/01/2026', 'filha do MIKE2 com a data certa');
});

// 7. Idempotência: segunda execução corrige zero.
test('idempotencia: segunda execucao corrige zero', () => {
  const sheet = criarSheet([
    ['1', '01/01/2026', '', '', 'MIKE1', '', 'BOE1'],
    ['2', '', '', '', 'MIKE1', '', 'BOE1']
  ]);
  const r1 = CorretorTuneis.corrigirTuneisAba(sheet);
  const r2 = CorretorTuneis.corrigirTuneisAba(sheet);
  assert.ok(r1.datas > 0, 'primeira execucao corrige');
  assert.strictEqual(r2.datas + r2.boes, 0, 'segunda execucao nao corrige nada');
});

console.log('\nTodos os testes do Corretor de Túneis passaram.');
