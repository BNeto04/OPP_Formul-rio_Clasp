'use strict';
/**
 * ARQUIVO: Testes/TestBoeAusente.js
 * DESCRICAO: Suite do diagnóstico BOE_AUSENTE (ARCA-BOE-002) — o BOE (número da
 * Polícia Civil) é obrigatório; MIKE sem BOE em nenhuma linha gera ALERTA.
 */

const assert = require('assert');
const { RegrasQualidade } = require('../Core/RegrasQualidade');

function test(name, fn) {
  try { fn(); console.log('  [PASS] ' + name); }
  catch (err) { console.error('  [FAIL] ' + name); console.error(err); process.exit(1); }
}

console.log('Testes: BOE ausente (obrigatoriedade do número da Polícia Civil)...\n');

function mikesMapaCom(mike, boes, linha) {
  return {
    [mike]: {
      mike,
      boes: new Set(boes),
      datas: new Set(['04/09/2026']),
      linhas: [{ linha, boe: boes[0] || '', dataTexto: '04/09/2026', chave: `04/09/2026|${mike}|${boes[0] || ''}` }]
    }
  };
}

test('MIKE sem BOE em nenhuma linha emite BOE_AUSENTE (ALERTA)', () => {
  const diags = RegrasQualidade.validarCoerenciaCruzadaMikes(mikesMapaCom('202609042215125692', [], 28));
  const boeAusente = diags.find(d => d.codigoRegra === 'BOE_AUSENTE');
  assert.ok(boeAusente, 'BOE_AUSENTE deve ser emitido');
  assert.strictEqual(boeAusente.severidade, 'ALERTA');
  assert.strictEqual(boeAusente.linha, 28);
});

test('MIKE com BOE preenchido nao emite BOE_AUSENTE', () => {
  const diags = RegrasQualidade.validarCoerenciaCruzadaMikes(mikesMapaCom('202609011653443710', ['26E0109007905'], 4));
  assert.ok(!diags.some(d => d.codigoRegra === 'BOE_AUSENTE'), 'nao deve emitir BOE_AUSENTE');
});

test('MIKE com BOEs diferentes nao emite BOE_AUSENTE (emite MIKE_BOE_DIVERGENTE)', () => {
  const mapa = {
    'M1': {
      mike: 'M1',
      boes: new Set(['A', 'B']),
      datas: new Set(['04/09/2026']),
      linhas: [{ linha: 2, boe: 'A', dataTexto: '04/09/2026', chave: '04/09/2026|M1|A' }]
    }
  };
  const diags = RegrasQualidade.validarCoerenciaCruzadaMikes(mapa);
  assert.ok(!diags.some(d => d.codigoRegra === 'BOE_AUSENTE'), 'BOE_AUSENTE nao deve aparecer');
  assert.ok(diags.some(d => d.codigoRegra === 'MIKE_BOE_DIVERGENTE'), 'MIKE_BOE_DIVERGENTE deve aparecer');
});

console.log('\nTodos os testes de BOE ausente passaram.');
