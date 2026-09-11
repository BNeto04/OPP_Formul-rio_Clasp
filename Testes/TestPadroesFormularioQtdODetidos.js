'use strict';
if (typeof require === 'undefined') { /* Ignora no Apps Script */ } else {

/**
 * ARQUIVO: Testes/TestPadroesFormularioQtdODetidos.js
 * DESCRICAO: Padroes fixos do formulario determinados pelo proprietario (11/09/2026):
 *   - QTD O (quantidade de ocorrencias do tunel) = SEMPRE 01 por padrao, nunca inferido pelo OCR;
 *   - DETIDOS = lista suspensa com padrao TCO, escolhivel pelo operador.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('Iniciando Testes: padroes QTD O = 01 e DETIDOS = TCO (lista suspensa)...\n');

let passou = 0, falhou = 0;
function test(nome, fn) {
  try { fn(); console.log(`  [PASS] ${nome}`); passou++; }
  catch (e) { console.error(`  [FAIL] ${nome}:`, e.message); falhou++; }
}

const REPO = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(REPO, 'Entrada/Formulario.html'), 'utf8');
const entradaManual = fs.readFileSync(path.join(REPO, 'Entrada/EntradaManual.js'), 'utf8');

function extrairFuncao(fonte, nome) {
  const marca = 'function ' + nome + '(';
  const i = fonte.indexOf(marca);
  if (i === -1) throw new Error('funcao nao encontrada: ' + nome);
  let nivel = 0;
  for (let j = fonte.indexOf('{', i); j < fonte.length; j++) {
    if (fonte[j] === '{') nivel++;
    else if (fonte[j] === '}') { nivel--; if (nivel === 0) return fonte.slice(i, j + 1); }
  }
  throw new Error('nao foi possivel delimitar: ' + nome);
}
const normalizarQtdO_ = new Function('return ' + extrairFuncao(html, 'normalizarQtdO_'))();
const qtdOcorrenciaPadrao_ = new Function('return ' + extrairFuncao(entradaManual, 'qtdOcorrenciaPadrao_'))();

test('campo QTD O nasce com padrao 01 (nao vazio, nao 1)', () => {
  const m = html.match(/<input[^>]*id="qtd_o"[^>]*>/);
  assert.ok(m, 'campo qtd_o nao encontrado');
  assert.ok(/value="01"/.test(m[0]), 'valor padrao deveria ser 01: ' + m[0]);
  assert.ok(/placeholder="01"/.test(m[0]), 'placeholder deveria ser 01: ' + m[0]);
});

test('normalizarQtdO_ (cliente): vazio/0/1 viram 01; outros valores sao preservados', () => {
  assert.strictEqual(normalizarQtdO_(''), '01');
  assert.strictEqual(normalizarQtdO_(undefined), '01');
  assert.strictEqual(normalizarQtdO_('1'), '01');
  assert.strictEqual(normalizarQtdO_('0'), '01');
  assert.strictEqual(normalizarQtdO_('01'), '01');
  assert.strictEqual(normalizarQtdO_('2'), '2');
  assert.strictEqual(normalizarQtdO_('10'), '10');
});

test('qtdOcorrenciaPadrao_ (servidor) usa a MESMA regra do cliente', () => {
  ['', undefined, '1', '0', '01'].forEach((v) => assert.strictEqual(qtdOcorrenciaPadrao_(v), '01', 'valor: ' + v));
  assert.strictEqual(qtdOcorrenciaPadrao_('3'), '3');
});

test('o OCR NUNCA escreve em QTD O (nao infere quantidade de ocorrencia)', () => {
  const corpo = extrairFuncao(html, 'parseAndFill');
  assert.ok(!/getElementById\(\s*['"]qtd_o['"]\s*\)\s*\.value\s*=/.test(corpo),
    'parseAndFill esta atribuindo valor a qtd_o');
});

test('limpar BO anterior restaura QTD O = 01 e DETIDOS = TCO', () => {
  const bloco = html.slice(html.indexOf('function limparDadosDocumentoAnterior'));
  const fim = bloco.indexOf('function ', 20);
  const corpo = bloco.slice(0, fim === -1 ? bloco.length : fim);
  assert.ok(/elQtdO\.value\s*=\s*['"]01['"]/.test(corpo), 'reset nao restaura 01 em QTD O');
  assert.ok(/elDetidos\.value\s*=\s*['"]TCO['"]/.test(corpo), 'reset nao restaura TCO em DETIDOS');
});

test('DETIDOS: lista suspensa com as opcoes e padrao TCO', () => {
  const m = html.match(/<input[^>]*id="detidos"[^>]*>/);
  assert.ok(m, 'campo detidos nao encontrado');
  assert.ok(/list="detidosList"/.test(m[0]), 'detidos deveria apontar para a lista suspensa');
  assert.ok(/value="TCO"/.test(m[0]), 'padrao deveria ser TCO: ' + m[0]);
  const dl = html.slice(html.indexOf('id="detidosList"'));
  const opcoes = (dl.slice(0, dl.indexOf('</datalist>')).match(/value="([^"]+)"/g) || []).map((s) => s.replace(/value="|"/g, ''));
  ['APFD', 'TCO', 'BOC', 'AAFAI'].forEach((o) => assert.ok(opcoes.includes(o), 'opcao ausente na lista: ' + o + ' -> ' + JSON.stringify(opcoes)));
});

test('ao virar <select> do servidor, o padrao TCO e preservado', () => {
  assert.ok(/novoSelect\.value\s*=\s*valorAnterior\s*\|\|\s*['"]TCO['"]/.test(html),
    'a troca para <select> pode apagar o padrao TCO');
});

console.log(`\nRESULTADOS FINAIS: ${passou} PASS / ${falhou} FAIL`);
if (falhou > 0) process.exitCode = 1;
}
