'use strict';
if (typeof require === 'undefined') { /* Ignora no Apps Script */ } else {

/**
 * ARQUIVO: Testes/TestOcrEntorpecentesDetidos.js
 * DESCRICAO: OCR de entorpecentes (multiplas entradas) e DETIDOS explicito - card #144 OCR-P3-010.
 *
 * Fixture = trecho REAL do BO 01/09/2026 (arquivo "SEI - Servico do dia 01SET2026.pdf", secao
 * "Imagens Complementares"), que lista TRES entorpecentes:
 *
 *   ENTORPECENTE/CRACK , 10 GRAMA(S),
 *    ENTORPECENTE/ANABOLIZANTES , 5 UNIDADE(S),
 *   ENTORPECENTE/CRACK , 20 UNIDADE(S),
 *
 * Defeito observado na tela: apenas "CRACK PEDRA - 20" foi preenchido; a entrada de 10 GRAMAS foi perdida
 * (causa: deduplicacao por SUBSTANCIA guardando a maior quantidade, ignorando a unidade).
 * ANABOLIZANTES nao tem coluna no schema da aba mensal -> nao e suportado e nao pode ser inventado.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('Iniciando Testes: OCR entorpecentes (multiplas entradas) e DETIDOS (#144)...\n');

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
const extrairDrogasOcr_ = new Function('return ' + extrairFuncao(html, 'extrairDrogasOcr_'))();
const detidosPendentesOcr_ = new Function('return ' + extrairFuncao(html, 'detidosPendentesOcr_'))();

// ---------- fixture REAL do BO 01/09 ----------
const BO_01SET = [
  'Imagens Complementares',
  'VEICULO/MOTOCICLETA HONDA, MODELO: CB 125,',
  ' MOEDA/REAL , MODELO: NI,',
  'ENTORPECENTE/CRACK , 10 GRAMA(S),',
  ' ENTORPECENTE/ANABOLIZANTES , 5 UNIDADE(S),',
  'ENTORPECENTE/CRACK , 20 UNIDADE(S),',
  '3ª Parte - Polícia Civil de Pernambuco (PCPE)',
  'Envolvidos',
  'ENVOLVIDO Nº 1',
  'Tipo de Envolvimento: AUTOR   \\   AGENTEContato: NÃO INFORMADORG: 10041182/SDS/PECP',
  'ENVOLVIDO Nº 2',
  'Tipo de Envolvimento: AUTOR   \\   AGENTEContato: NÃO INFORMADORG: 9725898/SDS/PECP',
  'Autuados',
  'Autuação:ENTORPECENTES (TRÁFICO)'
].join('\n');

function achar(lista, tipo) {
  return lista.filter((d) => d.tipo === tipo);
}

test('CRACK em GRAMAS (10 g) NAO pode ser perdido quando existe CRACK em UNIDADES (20)', () => {
  const drogas = extrairDrogasOcr_(BO_01SET);
  const crack = achar(drogas, 'CRACK');
  const emGrama = crack.find((d) => d.unidadeMedida === 'GRAMAS');
  const emUnidade = crack.find((d) => d.unidadeMedida === 'UNIDADES');
  assert.ok(emGrama, 'CRACK em GRAMAS ausente — entradas obtidas: ' + JSON.stringify(drogas));
  assert.strictEqual(emGrama.quantidade, 10, 'quantidade em gramas = ' + emGrama.quantidade);
  assert.ok(emUnidade, 'CRACK em UNIDADES ausente: ' + JSON.stringify(drogas));
  assert.strictEqual(emUnidade.quantidade, 20, 'quantidade em unidades = ' + emUnidade.quantidade);
});

test('nao inventa substancia ausente na lista estruturada (MACONHA)', () => {
  const drogas = extrairDrogasOcr_(BO_01SET);
  assert.strictEqual(achar(drogas, 'MACONHA').length, 0, 'MACONHA nao consta da lista de entorpecentes do BO');
});

test('substancia sem coluna no schema (ANABOLIZANTES) nao e convertida em outra nem duplicada', () => {
  const drogas = extrairDrogasOcr_(BO_01SET);
  const nomes = drogas.map((d) => d.tipo).sort();
  assert.ok(!nomes.some((n) => /ANABOLIZ/.test(n)), 'ANABOLIZANTES nao e suportado pela aba mensal: ' + JSON.stringify(nomes));
  assert.strictEqual(drogas.length, 2, 'esperado exatamente 2 entradas suportadas (CRACK grama e unidade): ' + JSON.stringify(drogas));
});

test('DETIDOS vazio + BO com autor/autuado -> conferencia explicita (nao infere valor)', () => {
  assert.strictEqual(detidosPendentesOcr_(BO_01SET, ''), true, 'deveria sinalizar conferencia de DETIDOS');
});

test('DETIDOS ja preenchido pelo operador -> sem alerta', () => {
  assert.strictEqual(detidosPendentesOcr_(BO_01SET, 'APFD'), false);
});

test('BO sem evidencia de detido -> sem alerta', () => {
  assert.strictEqual(detidosPendentesOcr_('Polícia Militar de Pernambuco\nRoubo de veículo', ''), false);
});

console.log(`\nRESULTADOS FINAIS: ${passou} PASS / ${falhou} FAIL`);
if (falhou > 0) process.exitCode = 1;
}
