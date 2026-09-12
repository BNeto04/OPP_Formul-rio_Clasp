'use strict';
/**
 * ARQUIVO: Testes/TestCorretorQualidade.js
 * DESCRICAO: Suite do Corretor de Formulas (Features/CorretorQualidade.js).
 * Cobre os "buracos": cabecalho intocado, formula ausente preenchida, formula
 * existente preservada, nota EXCECAO respeitada, coluna sem fonte reportada,
 * fonte com erro pulada e idempotencia.
 */

const assert = require('assert');

// Mock RegrasQualidade (nucleo puro do Guardiao): colunas calculadas do teste.
global.RegrasQualidade = {
  localizarColunasCalculadas: function () {
    return [
      { nome: 'PELOTAO', indice: 0 },
      { nome: 'GRAD', indice: 1 },
      { nome: 'MATRICULA', indice: 2 }
    ];
  }
};

const CorretorQualidade = require('../Features/CorretorQualidade');

// ---------- Mock de Sheet (getRange sobrecarregado: celula vs range) ----------
function criarSheet(lastRow, celulasIniciais) {
  const celulas = {};
  (Object.keys(celulasIniciais || {})).forEach(function (k) {
    celulas[k] = Object.assign({ formula: '', nota: '', valor: '' }, celulasIniciais[k]);
  });
  const chamadas = []; // { r, c, s } para cada setFormulaR1C1

  function getCell(r, c) {
    const key = r + ',' + c;
    if (!celulas[key]) celulas[key] = { formula: '', nota: '' };
    const cel = celulas[key];
    return {
      getFormula: function () { return cel.formula; },
      getFormulaR1C1: function () { return cel.formula ? 'R1C1:' + cel.formula : ''; },
      setFormulaR1C1: function (s) { cel.formula = '=' + s; chamadas.push({ r: r, c: c, s: s }); },
      getNote: function () { return cel.nota; },
      getValue: function () { return cel.valor; }
    };
  }

  const headers = ['H1', 'H2', 'H3', 'H4', 'H5'];
  function getRange(r, c, nr, nc) {
    if (nr === undefined && nc === undefined) return getCell(r, c);
    if (r === 1 && c === 1 && nr === 1) {
      return { getValues: function () { return [headers]; } };
    }
    const f = [], n = [], vv = [];
    for (let i = 0; i < nr; i++) {
      const fr = [], nr2 = [], vr = [];
      for (let j = 0; j < nc; j++) {
        const key = (r + i) + ',' + (c + j);
        const cel = celulas[key] || { formula: '', nota: '', valor: '' };
        fr.push(cel.formula);
        nr2.push(cel.nota);
        vr.push(cel.valor);
      }
      f.push(fr);
      n.push(nr2);
      vv.push(vr);
    }
    return { getFormulas: function () { return f; }, getNotes: function () { return n; }, getValues: function () { return vv; } };
  }

  return {
    chamadas: chamadas,
    celulas: celulas,
    getLastRow: function () { return lastRow; },
    getLastColumn: function () { return headers.length; },
    getName: function () { return 'MOCK'; },
    getRange: getRange
  };
}

function test(name, fn) {
  try {
    fn();
    console.log('  [PASS] ' + name);
  } catch (err) {
    console.error('  [FAIL] ' + name);
    console.error(err);
    process.exit(1);
  }
}

console.log('Testes Unitarios: Corretor de Formulas...\n');

// 1. Preenche formula ausente, sem tocar o cabecalho.
test('preenche formula ausente e nao toca o cabecalho', () => {
  const sheet = criarSheet(5, {
    '2,1': { formula: '=VLOOKUP(AE2;EFETIVO;6;0)' },
    '3,1': { formula: '' },
    '4,1': { formula: '' },
    '5,1': { formula: '' }
  });
  const resumo = CorretorQualidade.corrigirFormulasAba(sheet);

  const pelotao = resumo.colunas.find(c => c.nome === 'PELOTAO');
  assert.ok(pelotao, 'PELOTAO deve estar no resumo');
  assert.strictEqual(pelotao.corrigidas, 3, '3 celulas ausentes devem ser preenchidas');
  assert.strictEqual(sheet.chamadas.filter(ch => ch.c === 1).length, 3, '3 setFormulaR1C1 na coluna 1');
  assert.ok(!sheet.chamadas.some(ch => ch.r === 1), 'cabecalho (linha 1) nunca tocado');
});

// 2. Nao sobrescreve celula que ja tem formula.
test('nao sobrescreve formula existente', () => {
  const sheet = criarSheet(5, {
    '2,1': { formula: '=VLOOKUP(AE2;EFETIVO;6;0)' },
    '3,1': { formula: '=VLOOKUP(AE3;EFETIVO;6;0)' },
    '4,1': { formula: '' },
    '5,1': { formula: '' }
  });
  CorretorQualidade.corrigirFormulasAba(sheet);
  const setadas = sheet.chamadas.filter(ch => ch.c === 1);
  assert.deepStrictEqual(setadas.map(ch => ch.r).sort(), [4, 5], 'apenas linhas 4 e 5');
  assert.strictEqual(sheet.celulas['3,1'].formula, '=VLOOKUP(AE3;EFETIVO;6;0)', 'linha 3 preservada');
});

// 3. Respeita nota de excecao manual (EXCECAO:).
test('respeita nota EXCECAO (excecao manual justificada)', () => {
  const sheet = criarSheet(4, {
    '2,1': { formula: '=VLOOKUP(AE2;EFETIVO;6;0)' },
    '3,1': { formula: '', nota: 'EXCECAO: valor calculado manualmente pela gestao' },
    '4,1': { formula: '' }
  });
  CorretorQualidade.corrigirFormulasAba(sheet);
  const setadas = sheet.chamadas.filter(ch => ch.c === 1);
  assert.deepStrictEqual(setadas.map(ch => ch.r), [4], 'linha 3 (excecao) nao tocada');
});

// 4. Coluna sem nenhuma linha-modelo valida e reportada, sem inventar.
test('coluna sem fonte valida e reportada como nao corrigida', () => {
  const sheet = criarSheet(5, {}); // GRAD (col 2) sem formula em lugar nenhum
  const resumo = CorretorQualidade.corrigirFormulasAba(sheet);
  assert.ok(resumo.naoCorrigidas.indexOf('GRAD') !== -1, 'GRAD na lista de nao corrigidas');
  assert.ok(!sheet.chamadas.some(ch => ch.c === 2), 'nenhuma escrita na coluna 2');
});

// 5. Fonte com erro de formula e pulada; usa a proxima valida.
test('fonte com erro e pulada, usa a proxima valida', () => {
  const sheet = criarSheet(4, {
    '2,3': { formula: '=VLOOKUP(AE2;BROKEN;5;0)', valor: '#REF!' },   // formula quebrada
    '3,3': { formula: '=VLOOKUP(AE3;EFETIVO;5;0)', valor: '1264974' }, // valida
    '4,3': { formula: '', valor: '' }                                   // ausente
  });
  const resumo = CorretorQualidade.corrigirFormulasAba(sheet);
  const mat = resumo.colunas.find(c => c.nome === 'MATRICULA');
  assert.strictEqual(mat.fonte, 3, 'fonte deve ser a linha 3 (valida), nao a 2 (erro)');
  // linha 2 (quebrada) e linha 4 (ausente) sao corrigidas com a formula da linha 3
  assert.deepStrictEqual(sheet.chamadas.filter(ch => ch.c === 3).map(ch => ch.r).sort(), [2, 4],
    'linhas 2 e 4 corrigidas; linha 3 preservada');
});

// 6. Idempotencia: segunda execucao nao corrige nada.
test('idempotencia: segunda execucao corrige zero', () => {
  const sheet = criarSheet(5, {
    '2,1': { formula: '=VLOOKUP(AE2;EFETIVO;6;0)' },
    '3,1': { formula: '' },
    '4,1': { formula: '' }
  });
  const r1 = CorretorQualidade.corrigirFormulasAba(sheet);
  const r2 = CorretorQualidade.corrigirFormulasAba(sheet);
  assert.ok(r1.corrigidas > 0, 'primeira execucao corrige');
  assert.strictEqual(r2.corrigidas, 0, 'segunda execucao nao corrige nada');
});

console.log('\nTodos os testes do Corretor de Formulas passaram.');
