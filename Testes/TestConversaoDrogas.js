'use strict';
if (typeof require === 'undefined') { /* Ignora no Apps Script */ } else {

/**
 * ARQUIVO: Testes/TestConversaoDrogas.js
 * DESCRICAO: Conversao canonica das formas de apreensao em gramas - ARCA-CONVERSAO-001 (cards #142/#144).
 *
 * Medidas ditadas pelo proprietario (11/09/2026): 1 pedra de crack = 0,25 g; 1 papelote/big de maconha = 3 g;
 * 1 pino/ziplock de cocaina = 1 g. Este teste amarra a constante do codigo (Core/Constantes.js) as formulas
 * reais da aba mensal, para que qualquer mudanca de um lado sem o outro falhe.
 *
 * Formulas reais medidas na aba SET2026:
 *   S TOTAL DE MACONHA   = Q*3 + R                      (Q = MACONHA DOLAR, R = MACONHA GRAMA)
 *   W Total CRACK (gr)   = V + (U/4)                    (V = CRACK GRAMA, U = CRACK PEDRA)
 *   Z TOTAL DE COCAINA   = (X+Y) + (V + (U/4))          (X/Y = COCAINA PINO/GRAMA)
 */

const assert = require('assert');
const path = require('path');

console.log('Iniciando Testes: Conversao canonica de drogas em gramas (ARCA-CONVERSAO-001)...\n');

let passou = 0, falhou = 0;
function test(nome, fn) {
  try { fn(); console.log(`  [PASS] ${nome}`); passou++; }
  catch (e) { console.error(`  [FAIL] ${nome}:`, e.message); falhou++; }
}

const REPO = path.join(__dirname, '..');
const CONSTANTES = require(path.join(REPO, 'Core/Constantes.js'));
const CONV = CONSTANTES.CONVERSOES_DROGAS;
const ARCA = require(path.join(REPO, 'Dominio/ARCA/arca_regras_dominio.json'));

test('a constante existe e esta congelada (imutavel)', () => {
  assert.ok(CONV, 'CONVERSOES_DROGAS ausente em Core/Constantes.js');
  assert.throws(() => { CONV.CRACK_PEDRA_GRAMA = 1; }, 'a constante deveria ser imutavel');
  assert.strictEqual(CONV.CRACK_PEDRA_GRAMA, 0.25);
});

test('medidas canonicas conferem com as formulas da aba (pedra 1/4, big x3, pino x1)', () => {
  assert.strictEqual(CONV.CRACK_PEDRA_GRAMA, 1 / 4, 'pedra de crack deve ser 0,25 g (formula U/4)');
  assert.strictEqual(CONV.MACONHA_PAPELOTE_GRAMA, 3, 'papelote/big de maconha deve ser 3 g (formula Q*3)');
  assert.strictEqual(CONV.COCAINA_PINO_GRAMA, 1, 'pino/ziplock de cocaina deve ser 1 g');
});

test('formula da maconha: BIGS*3 + GRAMAS (ex.: 58 bigs + 0 g = 174 g do tunel real)', () => {
  const bigs = 58, gramas = 0;
  assert.strictEqual(bigs * CONV.MACONHA_PAPELOTE_GRAMA + gramas, 174);
});

test('formula do crack: GRAMAS + PEDRAS/4 (ex.: 10 g + 20 pedras = 15 g)', () => {
  const gramas = 10, pedras = 20;
  assert.strictEqual(gramas + (pedras * CONV.CRACK_PEDRA_GRAMA), 15);
});

test('formula da cocaina: (PINO+GRAMA) + crack convertido (crack soma no geral dos escaloes superiores)', () => {
  const pino = 0, grama = 0, crackGrama = 10, crackPedra = 20;
  const totalCocaina = (pino * CONV.COCAINA_PINO_GRAMA + grama) + (crackGrama + crackPedra * CONV.CRACK_PEDRA_GRAMA);
  assert.strictEqual(totalCocaina, 15, 'o TOTAL DE COCAINA inclui o crack (derivado direto)');
  assert.strictEqual(CONSTANTES.COCAINA_INCLUI_CRACK_EM_ESCALOES_SUPERIORES, true);
});

test('a regra ARCA-CONVERSAO-001 existe no catalogo com os mesmos parametros', () => {
  const regra = (ARCA.regras || []).find((r) => r.rule_id === 'ARCA-CONVERSAO-001');
  assert.ok(regra, 'ARCA-CONVERSAO-001 ausente no catalogo');
  const p = {};
  (regra.parametros || []).forEach((x) => { p[x.nome] = x.valor; });
  assert.strictEqual(p.CRACK_PEDRA_GRAMA, CONV.CRACK_PEDRA_GRAMA, 'parametro da ARCA != constante do codigo');
  assert.strictEqual(p.MACONHA_PAPELOTE_GRAMA, CONV.MACONHA_PAPELOTE_GRAMA);
  assert.strictEqual(p.COCAINA_PINO_GRAMA, CONV.COCAINA_PINO_GRAMA);
  assert.ok((regra.consumidores.REAL_CODE_CONSUMER || []).includes('Core/Constantes.js'));
});

console.log(`\nRESULTADOS FINAIS: ${passou} PASS / ${falhou} FAIL`);
if (falhou > 0) process.exitCode = 1;
}
