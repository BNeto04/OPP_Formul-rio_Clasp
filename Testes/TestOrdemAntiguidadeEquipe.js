'use strict';
if (typeof require === 'undefined') { /* Ignora no Apps Script */ } else {

/**
 * ARQUIVO: Testes/TestOrdemAntiguidadeEquipe.js
 * DESCRICAO: Ordem de antiguidade da equipe - regra do proprietario (11/09/2026):
 *   "comparar sempre primeiro a patente; o mais antigo deve ser o primeiro e, em caso de empate de
 *    graduacao, vai pela matricula, sempre o mais antigo acima, para ja chegar na planilha na ordem
 *    correta de antiguidade".
 *
 * Fixture real: equipe do BO 04/09/2026 (print da tela EQUIPE/POLICIAIS):
 *   CB 1183796 ANDRESSON · 3ºSGT 1109553 ARY SILVA · CB 1183788 SILVA GOMES · CB 1207270 FILIPE GOUVEIA
 * Ordem esperada: ARY SILVA (3ºSGT) -> SILVA GOMES (1183788) -> ANDRESSON (1183796) -> FILIPE GOUVEIA (1207270)
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('Iniciando Testes: ordem de antiguidade da equipe (patente -> matricula)...\n');

let passou = 0, falhou = 0;
function test(nome, fn) {
  try { fn(); console.log(`  [PASS] ${nome}`); passou++; }
  catch (e) { console.error(`  [FAIL] ${nome}:`, e.message); falhou++; }
}

const REPO = path.join(__dirname, '..');

/** Extrai o bloco contiguo: var ORDEM_POSTOS_ANTIGUIDADE_ ... ate o fim de ordenarEquipePorAntiguidade_. */
function carregarNucleo(fonte) {
  const i = fonte.indexOf('ORDEM_POSTOS_ANTIGUIDADE_ = [');
  if (i === -1) throw new Error('bloco de ordem nao encontrado');
  const inicio = fonte.lastIndexOf('var ', i);
  const marcador = '// FIM-ORDEM-ANTIGUIDADE';
  const fim = fonte.indexOf(marcador, inicio);
  if (fim === -1) throw new Error('marcador FIM-ORDEM-ANTIGUIDADE ausente');
  const bloco = fonte.slice(inicio.split ? inicio : inicio, fim);
  return new Function(bloco + '\nreturn { ordenar: ordenarEquipePorAntiguidade_, indice: indiceAntiguidadePosto_ };')();
}

const core = carregarNucleo(fs.readFileSync(path.join(REPO, 'Core/Policiais.js'), 'utf8'));
const cliente = carregarNucleo(fs.readFileSync(path.join(REPO, 'Entrada/Formulario.html'), 'utf8'));
const html = fs.readFileSync(path.join(REPO, 'Entrada/Formulario.html'), 'utf8');
const entradaManual = fs.readFileSync(path.join(REPO, 'Entrada/EntradaManual.js'), 'utf8');

const EQUIPE_PRINT = [
  { posto: 'CB',     matricula: '1183796', nome: 'ANDRESSON' },
  { posto: '3ºSGT',  matricula: '1109553', nome: 'ARY SILVA' },
  { posto: 'CB',     matricula: '1183788', nome: 'SILVA GOMES' },
  { posto: 'CB',     matricula: '1207270', nome: 'FILIPE GOUVEIA' }
];
const ORDEM_ESPERADA = ['ARY SILVA', 'SILVA GOMES', 'ANDRESSON', 'FILIPE GOUVEIA'];

test('equipe do print 04/09 sai na ordem de antiguidade correta', () => {
  const nomes = core.ordenar(EQUIPE_PRINT).map((p) => p.nome);
  assert.deepStrictEqual(nomes, ORDEM_ESPERADA, 'ordem obtida: ' + JSON.stringify(nomes));
});

test('cliente e servidor produzem EXATAMENTE a mesma ordem (nao podem divergir)', () => {
  const a = core.ordenar(EQUIPE_PRINT).map((p) => p.nome);
  const b = cliente.ordenar(EQUIPE_PRINT).map((p) => p.nome);
  assert.deepStrictEqual(b, a, 'cliente: ' + JSON.stringify(b) + ' | servidor: ' + JSON.stringify(a));
  const ranks = ['CEL', 'TEN CEL', 'MAJ', 'CAP', '1º TEN', '2º TEN', 'ASP', 'SUB TEN', '1º SGT', '2º SGT', '3º SGT', 'CB', 'SD'];
  const idxCore = ranks.map((r) => core.indice(r));
  const idxCli = ranks.map((r) => cliente.indice(r));
  assert.deepStrictEqual(idxCli, idxCore, 'indices divergentes: cliente ' + JSON.stringify(idxCli) + ' x servidor ' + JSON.stringify(idxCore));
  for (let i = 1; i < idxCore.length; i++) {
    assert.ok(idxCore[i] > idxCore[i - 1], 'ordem de patente invalida em ' + ranks[i]);
  }
});

test('patente manda mais que matricula (MAJ com matricula alta vem antes de CB antigo)', () => {
  const lista = [
    { posto: 'CB', matricula: '1000001', nome: 'CABO ANTIGO' },
    { posto: 'MAJ', matricula: '1999999', nome: 'MAJOR NOVO' }
  ];
  assert.deepStrictEqual(core.ordenar(lista).map((p) => p.nome), ['MAJOR NOVO', 'CABO ANTIGO']);
});

test('empate de graduacao: matricula mais antiga (menor) primeiro', () => {
  const lista = [
    { posto: 'CB', matricula: '1207270', nome: 'CB NOVO' },
    { posto: 'CABO', matricula: '1183788', nome: 'CB ANTIGO' },
    { posto: 'CB', matricula: '1183796', nome: 'CB MEIO' }
  ];
  assert.deepStrictEqual(core.ordenar(lista).map((p) => p.nome), ['CB ANTIGO', 'CB MEIO', 'CB NOVO']);
});

test('graduacao desconhecida vai para o fim, preservando a ordem relativa (estavel)', () => {
  const lista = [
    { posto: '', matricula: '1', nome: 'SEM POSTO A' },
    { posto: 'CB', matricula: '1183796', nome: 'CABO' },
    { posto: 'XPTO', matricula: '2', nome: 'SEM POSTO B' }
  ];
  assert.deepStrictEqual(core.ordenar(lista).map((p) => p.nome), ['CABO', 'SEM POSTO A', 'SEM POSTO B']);
});

test('nao altera o array original (sem efeito colateral)', () => {
  const original = EQUIPE_PRINT.slice();
  core.ordenar(original);
  assert.deepStrictEqual(original.map((p) => p.nome), EQUIPE_PRINT.map((p) => p.nome));
});

test('esta ligado de ponta a ponta: UI do OCR, payload do cliente e gravacao no servidor', () => {
  assert.ok(/ordenarMatriculasPorAntiguidade_\(matsEncontradas\)/.test(html),
    'o OCR nao ordena as matriculas na tela');
  assert.ok(/policiais:\s*ordenarEquipePorAntiguidade_\(efetivoSelecionados\)/.test(html),
    'o payload do cliente nao ordena a equipe');
  assert.ok(/const policiais = ordenarEquipePorAntiguidade_\(payload\.policiais \|\| \[\]\)/.test(entradaManual),
    'o servidor nao ordena antes de montar as linhas');
});

console.log(`\nRESULTADOS FINAIS: ${passou} PASS / ${falhou} FAIL`);
if (falhou > 0) process.exitCode = 1;
}
