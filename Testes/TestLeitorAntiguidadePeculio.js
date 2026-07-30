'use strict';
if (typeof require === 'undefined') { /* Ignora no Apps Script */ } else {

/**
 * ARQUIVO: Testes/TestLeitorAntiguidadePeculio.js
 * DESCRIÇÃO: Suíte de testes unitários para a leitura oficial do mapa de antiguidade N no Pecúlio/Efetivo (TASK-M06.3-03A).
 */

const assert = require('assert');
const LeitorAntiguidadePeculio = require('../Leitura/LeitorAntiguidadePeculio');

console.log('🧪 Iniciando Testes Unitários: Leitor de Antiguidade do Pecúlio (M06.3-03A)...\n');

let sucessos = 0;

function test(nome, fn) {
  try {
    fn();
    console.log(`  ✅ [PASS] ${nome}`);
    sucessos++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${nome}:`, err.message);
    process.exitCode = 1;
  }
}

// 1. Teste: Normalização de Matrícula (removendo hífens, pontos e espaços)
test('LeitorAntiguidade: normalizarMatricula limpa hífens, pontos e espaços', () => {
  assert.strictEqual(LeitorAntiguidadePeculio.normalizarMatricula('108.394-5'), '1083945');
  assert.strictEqual(LeitorAntiguidadePeculio.normalizarMatricula(' 102950-9 '), '1029509');
  assert.strictEqual(LeitorAntiguidadePeculio.normalizarMatricula(101001), '101001');
  assert.strictEqual(LeitorAntiguidadePeculio.normalizarMatricula(null), '');
});

// 2. Teste: Leitura e extração com cabeçalho dinâmico e matriz 2D
test('LeitorAntiguidade: lê matriz 2D oficial e extrai mapa de antiguidade N normalizado', () => {
  const dadosMock = [
    ['N', 'MATRÍCULA', 'GRADUAÇÃO', 'NOME', 'DESIGNAÇÃO'],
    [1, '101.001-0', 'MAJ', 'JOSUÉ CORREIA', '3º PEL'],
    [4, '102.540-0', 'MAJ', 'RODRIGO MONTEIRO', '3º PEL'],
    [10, '108.394-5', '3º SGT', 'IRAN SILVA', '1º PEL GTAR'],
    [12, '102950-9', '2º SGT', 'SAULO ALVES', '2º PEL GTAR'],
    [25, '113920-7', 'CB', 'MARCONI LIMA', '1º PEL']
  ];

  const resultado = LeitorAntiguidadePeculio.lerMapaAntiguidade(dadosMock);

  assert.strictEqual(resultado.estatisticas.validos, 5);
  assert.strictEqual(resultado.mapa['1010010'], 1);
  assert.strictEqual(resultado.mapa['1025400'], 4);
  assert.strictEqual(resultado.mapa['1083945'], 10);
  assert.strictEqual(resultado.mapa['1029509'], 12);
  assert.strictEqual(resultado.mapa['1139207'], 25);

  // Confirma preservação de metadados no mapaCompleto
  assert.strictEqual(resultado.mapaCompleto['1083945'].nome, 'IRAN SILVA');
  assert.strictEqual(resultado.mapaCompleto['1083945'].grad, '3º SGT');
  assert.strictEqual(resultado.mapaCompleto['1083945'].designacao, '1º PEL GTAR');
});

// 3. Teste: Ignora N ausente, nulo, vazio ou inválido (<= 0 ou texto não numérico)
test('LeitorAntiguidade: ignora linhas com N ausente, nulo ou inválido', () => {
  const dadosMock = [
    ['N', 'MATRÍCULA', 'NOME'],
    [1, '101001-0', 'MAJ CORREIA'],
    ['', '102002-8', 'MAJ ALISSON'], // N vazio
    [0, '103003-6', 'CAP SILVA'],   // N zerado
    [-5, '104004-4', 'TEN SOUZA'],   // N negativo
    ['N/I', '105005-2', 'SD LIMA']  // N texto inválido
  ];

  const resultado = LeitorAntiguidadePeculio.lerMapaAntiguidade(dadosMock);

  assert.strictEqual(resultado.estatisticas.validos, 1);
  assert.strictEqual(resultado.estatisticas.invalidos, 4);
  assert.strictEqual(resultado.mapa['1010010'], 1);
  assert.strictEqual(resultado.mapa['1020028'], undefined);
  assert.strictEqual(resultado.mapa['1030036'], undefined);
});

// 4. Teste: Trata duplicidade de matrícula preservando a primeira ocorrência válida
test('LeitorAntiguidade: trata duplicidades de matrícula mantendo a primeira ocorrência', () => {
  const dadosMock = [
    ['N', 'MATRÍCULA', 'NOME'],
    [10, '108394-5', 'SGT IRAN (Linha 1)'],
    [15, '108394-5', 'SGT IRAN (Linha Duplicada 2)']
  ];

  const resultado = LeitorAntiguidadePeculio.lerMapaAntiguidade(dadosMock);

  assert.strictEqual(resultado.estatisticas.validos, 1);
  assert.strictEqual(resultado.estatisticas.duplicados, 1);
  assert.strictEqual(resultado.mapa['1083945'], 10, 'Deve manter o N=10 da primeira linha');
  assert.strictEqual(resultado.mapaCompleto['1083945'].nome, 'SGT IRAN (Linha 1)');
});

console.log(`\n🎉 Testes do Leitor de Antiguidade do Pecúlio concluídos: ${sucessos} testes passaram!`);
}
