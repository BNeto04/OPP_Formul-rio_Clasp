'use strict';
if (typeof require === 'undefined') { /* Ignora no Apps Script */ } else {

/**
 * ARQUIVO: Testes/TestSemanticaArmasQdt.js
 * DESCRICAO: Semantica canonica ARMA (fisica) x QDT ARMAS (participacao) - card #141 OCR-P3-007.
 *
 * Prova, com os CABECALHOS REAIS da aba mensal e com a fixture descrita pelo proprietario:
 *   - "ARMA"     (coluna 12) = arma fisica da linha (uma arma por linha; 2 armas = 2 linhas com ARMA=1)
 *   - "QDT ARMAS" (coluna 32) = participacoes DO POLICIAL = total de armas do tunel, replicado em todos
 *   - nenhum alias de arma fisica pode resolver para a coluna de participacao (contagem duplicada)
 *
 * Fixture real (tunel MIKE ...443710, SET2026 L4-L7): ARMA = 1,1,'','' e QDT ARMAS = 2,2,2,2
 *   -> total fisico do tunel = 2 (soma da coluna 12) · somar a coluna 32 daria 8 (4 policiais x 2) = duplicacao
 */

const assert = require('assert');
const path = require('path');

console.log('Iniciando Testes: Semantica ARMA x QDT ARMAS (#141)...\n');

let passou = 0, falhou = 0;
function test(nome, fn) {
  try { fn(); console.log(`  [PASS] ${nome}`); passou++; }
  catch (e) { console.error(`  [FAIL] ${nome}:`, e.message); falhou++; }
}

const REPO = path.join(__dirname, '..');
global.CONSTANTES_SYNTHEON = require(path.join(REPO, 'Core/Constantes.js'));
try {
  const Cab = require(path.join(REPO, 'Core/Cabecalhos.js'));
  if (Cab && typeof Cab.encontrar === 'function') { global.SyntheonCabecalhos = Cab; }
} catch (e) { /* segue pelo caminho de fallback do Utils */ }
const CONSTANTES = global.CONSTANTES_SYNTHEON;
const Utils = require(path.join(REPO, 'Core/Utils.js'));

// Cabecalhos REAIS da aba mensal (0-based, como o Sheets entrega)
const HEADERS = [
  'ORD', 'DATA', 'HORA', 'QTD O', 'MIKE', 'NATUREZA', 'BOE', 'AIS', 'CIDADE', 'BAIRRO', 'DETIDOS',
  'ARMA', 'TIPO', 'CALIBRE', 'MODELO', 'MUNIÇÃO',
  'MACONHA DOLAR', 'MACONHA GRAMA', 'TOTAL DE MACONHA', 'Dividido mac',
  'CRACK PEDRA', 'CRACK GRAMA', 'Total CRACK (gr)',
  'COCAINA PINO', 'COCAINA GRAMA', 'TOTAL DE COCAINA', 'Dividido coc',
  'PELOTÃO', 'GRAD', 'MATRICULA', 'POLICIAL', 'QDT ARMAS', 'OCORRÊNCIA PIP', 'IMPUTADO?',
  'PONTOS TOTAIS', 'PONTOS FICÇÃO (1/4)', 'Chave Ocorrência'
];
const loc = (chave) => Utils.localizarColuna(HEADERS, chave);

const COL_ARMA = 11;      // coluna 12 (1-based)
const COL_QDT_ARMAS = 31; // coluna 32 (1-based)

// Fixture do tunel real: 4 linhas (4 policiais), 2 armas fisicas registradas em 2 linhas
const TUNEL_FIXTURE = [
  { ARMA: 1, QDT: 2 }, { ARMA: 1, QDT: 2 }, { ARMA: '', QDT: 2 }, { ARMA: '', QDT: 2 }
];

test('sanidade: ARMA_LINHA resolve a coluna ARMA (12)', () => {
  assert.strictEqual(loc('ARMA_LINHA'), COL_ARMA, 'ARMA_LINHA -> ' + loc('ARMA_LINHA'));
});

test('sanidade: QDT_ARMAS resolve a coluna QDT ARMAS (32)', () => {
  assert.strictEqual(loc('QDT_ARMAS'), COL_QDT_ARMAS, 'QDT_ARMAS -> ' + loc('QDT_ARMAS'));
});

test('ARMAS (fisica) NAO pode resolver para a coluna de participacao (32)', () => {
  assert.strictEqual(loc('ARMAS'), COL_ARMA, 'ARMAS resolveu para ' + loc('ARMAS') + ' (esperado ' + COL_ARMA + ' = coluna ARMA)');
});

test('somente o alias QDT_ARMAS pode listar a coluna de participacao', () => {
  Object.keys(CONSTANTES.ALIASES).forEach((chave) => {
    const aliases = (CONSTANTES.ALIASES[chave] || []).map((a) => String(a).toUpperCase());
    const temParticipacao = aliases.includes('QDT ARMAS') || aliases.includes('QTD ARMAS');
    if (temParticipacao) {
      assert.strictEqual(chave, 'QDT_ARMAS',
        'alias ' + chave + ' lista a coluna de participacao: ' + JSON.stringify(aliases));
    }
  });
  ['ARMAS', 'ARMA_LINHA'].forEach((chave) => {
    const aliases = (CONSTANTES.ALIASES[chave] || []).map((a) => String(a).toUpperCase());
    assert.ok(!aliases.includes('QDT ARMAS') && !aliases.includes('QTD ARMAS'),
      'alias ' + chave + ' lista a coluna de participacao: ' + JSON.stringify(aliases));
  });
});

test('soma fisica do tunel = 2 (soma da coluna ARMA), nunca 8 (participacao x policiais)', () => {
  const idxArmas = loc('ARMAS');
  const linhas = TUNEL_FIXTURE.map((l) => {
    const row = new Array(HEADERS.length).fill('');
    row[COL_ARMA] = String(l.ARMA);
    row[COL_QDT_ARMAS] = String(l.QDT);
    return row;
  });
  const somaFisica = linhas.reduce((acc, row) => acc + (parseFloat(row[COL_ARMA]) || 0), 0);
  assert.strictEqual(somaFisica, 2, 'soma fisica esperada = 2 (2 linhas com ARMA=1)');
  const somaPeloAlias = linhas.reduce((acc, row) => acc + (parseFloat(row[idxArmas]) || 0), 0);
  assert.strictEqual(somaPeloAlias, 2,
    'alias ARMAS somou ' + somaPeloAlias + ' — leu a coluna de participacao (' + (idxArmas + 1) + ') como se fosse arma fisica');
});

test('INVARIANTE do tunel: QDT ARMAS igual em todas as linhas e igual a soma de ARMA do tunel', () => {
  const valores = TUNEL_FIXTURE.map((l) => l.QDT);
  const unico = valores.every((v) => v === valores[0]);
  assert.ok(unico, 'QDT ARMAS divergente entre participantes: ' + JSON.stringify(valores));
  const somaFisica = TUNEL_FIXTURE.reduce((acc, l) => acc + (parseFloat(l.ARMA) || 0), 0);
  assert.strictEqual(valores[0], somaFisica, 'QDT ARMAS (' + valores[0] + ') deve ser igual ao total de armas do tunel (' + somaFisica + ')');
});

console.log(`\nRESULTADOS FINAIS: ${passou} PASS / ${falhou} FAIL`);
if (falhou > 0) process.exitCode = 1;
}
