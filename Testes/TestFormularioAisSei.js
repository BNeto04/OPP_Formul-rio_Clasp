'use strict';
if (typeof require === 'undefined') { /* Ignora no Apps Script */ } else {

/**
 * ARQUIVO: Testes/TestFormularioAisSei.js
 * DESCRICAO: AIS em endereco SEI/CIODS segmentado por ';' (card #140 OCR-P3-006).
 *
 * Carrega a funcao REAL `extrairEnderecoOcr_` de `Entrada/Formulario.html` (extracao por balanceamento de chaves)
 * e prova, com os enderecos reportados pelo proprietario:
 *  1. o layout SEI (`logradouro; complemento; numero; CEP; BAIRRO;CIDADE;UF; PAIS`) entrega bairro/cidade;
 *  2. o AIS esperado e alcancado pela base territorial canonica (TORROES/SANCHO -> AIS 4);
 *  3. nada e inventado quando o campo vem "NAO INFORMADO";
 *  4. as regras antigas (rotulo explicito de Bairro/Municipio) continuam valendo.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('Iniciando Testes: AIS em endereco SEI/CIODS (#140)...\n');

let passou = 0, falhou = 0;
function test(nome, fn) {
  try { fn(); console.log(`  [PASS] ${nome}`); passou++; }
  catch (e) { console.error(`  [FAIL] ${nome}:`, e.message); falhou++; }
}

const REPO = path.join(__dirname, '..');

function extrairFuncao(html, nome) {
  const marca = 'function ' + nome + '(';
  const i = html.indexOf(marca);
  if (i === -1) throw new Error('funcao nao encontrada no HTML: ' + nome);
  let nivel = 0;
  for (let j = html.indexOf('{', i); j < html.length; j++) {
    if (html[j] === '{') nivel++;
    else if (html[j] === '}') { nivel--; if (nivel === 0) return html.slice(i, j + 1); }
  }
  throw new Error('nao foi possivel delimitar: ' + nome);
}

const html = fs.readFileSync(path.join(REPO, 'Entrada/Formulario.html'), 'utf8');
const extrairEnderecoOcr_ = new Function('return ' + extrairFuncao(html, 'extrairEnderecoOcr_'))();

const { resolverAIS } = require(path.join(REPO, 'Dominio/ResolverAIS.js'));
const modTab = require(path.join(REPO, 'Dominio/TabelaTerritorialAIS.js'));
const TABELA = modTab.TABELA_TERRITORIAL_AIS || modTab;

// ---------- enderecos REAIS dos BOs reportados ----------
const SEI_01SET = 'Endereço do Fato: RUA ONZE DE FEVEREIRO; COMPLEMENTO NÃO INFORMADO;NÚMERO NÃO INFORMADO;CEP NÃO INFORMADO; TORRÕES;RECIFE;PE; BRASIL';
const SEI_04SET = 'Endereço do Fato: AVENIDA GAROTA DE IPANEMA; COMPLEMENTO NÃO INFORMADO;NÚMERO NÃO INFORMADO;50920-680; SANCHO;RECIFE;PE; BRASIL';

test('endereco SEI do BO 01/09 (TORRÕES/RECIFE) entrega bairro e cidade', () => {
  const r = extrairEnderecoOcr_(SEI_01SET);
  assert.strictEqual(r.bairro.toUpperCase(), 'TORRÕES', 'bairro obtido: ' + JSON.stringify(r));
  assert.strictEqual(r.cidade.toUpperCase(), 'RECIFE', 'cidade obtida: ' + JSON.stringify(r));
});

test('endereco SEI do BO 04/09 (SANCHO/RECIFE) entrega bairro e cidade', () => {
  const r = extrairEnderecoOcr_(SEI_04SET);
  assert.strictEqual(r.bairro.toUpperCase(), 'SANCHO', 'bairro obtido: ' + JSON.stringify(r));
  assert.strictEqual(r.cidade.toUpperCase(), 'RECIFE', 'cidade obtida: ' + JSON.stringify(r));
});

test('o AIS esperado e alcancado pela base canonica (TORROES e SANCHO -> AIS 4)', () => {
  [['TORROES', SEI_01SET], ['SANCHO', SEI_04SET]].forEach(function (par) {
    const extraido = extrairEnderecoOcr_(par[1]);
    const r = resolverAIS(extraido.cidade, extraido.bairro, TABELA);
    assert.strictEqual(r.ais, 'AIS 4', 'AIS nao resolvido para ' + par[0] + ': ' + JSON.stringify(r));
    assert.strictEqual(r.status, 'DETERMINADO');
  });
});

test('NADA e inventado quando bairro/cidade vem NAO INFORMADO', () => {
  const semDados = 'Endereço do Fato: RUA X; COMPLEMENTO NÃO INFORMADO;NÚMERO NÃO INFORMADO;CEP NÃO INFORMADO; NÃO INFORMADO;NÃO INFORMADO;PE; BRASIL';
  const r = extrairEnderecoOcr_(semDados);
  assert.ok(!r.bairro || /NAO INFORMADO|NÃO INFORMADO/i.test(r.bairro), 'bairro inventado: ' + JSON.stringify(r));
  assert.ok(!r.cidade || /NAO INFORMADO|NÃO INFORMADO/i.test(r.cidade), 'cidade inventada: ' + JSON.stringify(r));
});

test('REGRESSAO: rotulo explicito de Bairro (com cidade) continua funcionando', () => {
  const r1 = extrairEnderecoOcr_('Bairro: BOA VIAGEM');
  assert.strictEqual(r1.bairro.toUpperCase(), 'BOA VIAGEM');
  const r2 = extrairEnderecoOcr_('Bairro: SANTA MÔNICA - CAMARAGIBE');
  assert.strictEqual(r2.bairro.toUpperCase(), 'SANTA MÔNICA');
  assert.strictEqual(r2.cidade.toUpperCase(), 'CAMARAGIBE');
});

test('REGRESSAO: rotulo de Municipio/Cidade e o fallback por Local do Fato continuam valendo', () => {
  const r1 = extrairEnderecoOcr_('Município: JABOATÃO DOS GUARARAPES; Bairro: GUARARAPES');
  assert.strictEqual(r1.cidade.toUpperCase(), 'JABOATÃO DOS GUARARAPES');
  assert.strictEqual(r1.bairro.toUpperCase(), 'GUARARAPES');
  const r2 = extrairEnderecoOcr_('Local do Fato: RUA X\nBairro: TORRÕES\nCidade: RECIFE');
  assert.strictEqual(r2.bairro.toUpperCase(), 'TORRÕES');
  assert.strictEqual(r2.cidade.toUpperCase(), 'RECIFE');
});

console.log(`\nRESULTADOS FINAIS: ${passou} PASS / ${falhou} FAIL`);
if (falhou > 0) process.exitCode = 1;
}
