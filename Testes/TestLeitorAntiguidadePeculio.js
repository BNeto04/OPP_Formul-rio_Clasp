'use strict';
if (typeof require === 'undefined') { /* Ignora no Apps Script */ } else {

/**
 * ARQUIVO: Testes/TestLeitorAntiguidadePeculio.js
 * DESCRIÇÃO: Suíte de testes unitários para a leitura oficial do mapa de antiguidade N no Pecúlio/Efetivo (TASK-M06.3-03B).
 */

const assert = require('assert');
const LeitorAntiguidadePeculio = require('../Leitura/LeitorAntiguidadePeculio');

console.log('🧪 Iniciando Testes Unitários: Leitor de Antiguidade do Pecúlio (M06.3-03B)...\n');

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
    ['N', 'GRAD.', 'MATRÍCULA', 'NOME'],
    [1, 'SD', '101001-0', 'MAJ CORREIA'],
    ['', 'SD', '102002-8', 'MAJ ALISSON'], // N vazio
    [0, 'SD', '103003-6', 'CAP SILVA'],   // N zerado
    [-5, 'SD', '104004-4', 'TEN SOUZA'],   // N negativo
    ['N/I', 'SD', '105005-2', 'SD LIMA']  // N texto inválido
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
    ['N', 'GRAD.', 'MATRÍCULA', 'NOME'],
    [10, 'SGT', '108394-5', 'SGT IRAN (Linha 1)'],
    [15, 'SGT', '108394-5', 'SGT IRAN (Linha Duplicada 2)']
  ];

  const resultado = LeitorAntiguidadePeculio.lerMapaAntiguidade(dadosMock);

  assert.strictEqual(resultado.estatisticas.validos, 1);
  assert.strictEqual(resultado.estatisticas.duplicados, 1);
  assert.strictEqual(resultado.mapa['1083945'], 10, 'Deve manter o N=10 da primeira linha');
  assert.strictEqual(resultado.mapaCompleto['1083945'].nome, 'SGT IRAN (Linha 1)');
});

// 5. Teste (TASK-M06.3-05G): Aba ausente na planilha resulta em erro PECULIO_ABA_NAO_LOCALIZADA
test('LeitorAntiguidade: aba ausente na planilha retorna erro PECULIO_ABA_NAO_LOCALIZADA sem ler abas arbitrarias', () => {
  const mockSS = {
    getSheetByName: () => null, // Nenhuma das abas reconhecidas existe
    getSheets: () => [{ getName: () => 'JAN2026' }] // Tenta enganar com relatorio mensal como primeira aba
  };

  const resultado = LeitorAntiguidadePeculio.lerMapaAntiguidade(mockSS, 'EFETIVO');

  assert.strictEqual(resultado.erro, 'PECULIO_ABA_NAO_LOCALIZADA');
  assert.strictEqual(Object.keys(resultado.mapa).length, 0);
});

// 6. Teste (TASK-M06.3-05G): Cabeçalho sem coluna N resulta em erro PECULIO_CABECALHO_NAO_LOCALIZADO
test('LeitorAntiguidade: cabeçalho sem coluna N explicita retorna erro PECULIO_CABECALHO_NAO_LOCALIZADO', () => {
  const dadosMockSemN = [
    ['RANK', 'MATRÍCULA', 'NOME', 'OCORRÊNCIAS', 'PONTOS'], // N ausente no cabecalho
    [1, '101001-0', 'MAJ CORREIA', 10, 100.0]
  ];

  const resultado = LeitorAntiguidadePeculio.lerMapaAntiguidade(dadosMockSemN);

  assert.strictEqual(resultado.erro, 'PECULIO_CABECALHO_NAO_LOCALIZADO');
  assert.strictEqual(Object.keys(resultado.mapa).length, 0);
});

// 7. Teste (TASK-M06.3-05G): Primeira aba sendo relatório não relacionado retorna erro sem ler dados falsos
test('LeitorAntiguidade: primeira aba sendo relatório não relacionado retorna erro sem ler dados falsos', () => {
  const mockRelatorioMensal = {
    getName: () => 'COMPILADO_DROGAS_JAN2026',
    getLastRow: () => 10,
    getLastColumn: () => 5,
    getRange: () => ({
      getValues: () => [
        ['ITEM', 'POLICIAL', 'MACONHA', 'COCAINA', 'TOTAL'],
        [1, '108394-5', 500, 200, 700]
      ]
    })
  };

  const mockSS = {
    getSheetByName: (nome) => (nome === 'EFETIVO' ? null : null),
    getSheets: () => [mockRelatorioMensal] // Primeira aba e um relatorio mensal
  };

  const resultado = LeitorAntiguidadePeculio.lerMapaAntiguidade(mockSS);

  assert.strictEqual(resultado.erro, 'PECULIO_ABA_NAO_LOCALIZADA');
  assert.strictEqual(resultado.mapa['1083945'], undefined, 'Nao pode atribuir N=1 a partir da coluna ITEM do relatorio');
});

// 8. Teste (TASK-M06.3-05F): Leitura com estrutura real do Pecúlio (cabeçalho na linha 11 com ORD, GRAD., MAT., NOME DE GUERRA e SUB-UNIDADE)
test('LeitorAntiguidade: extrai mapa de antiguidade N com cabeçalho na linha 11 usando ORD, MAT. e NOME DE GUERRA', () => {
  const matrizRealPeculio = [];
  // Linhas 1 a 10: Título, imagens e notas institucionais do Pecúlio
  for (let i = 1; i <= 10; i++) {
    matrizRealPeculio.push(['', '', `CABEÇALHO INSTITUCIONAL LINHA ${i}`, '', '']);
  }
  // Linha 11 (índice 10): Cabeçalho real oficial da planilha do Pecúlio
  matrizRealPeculio.push(['ORD', 'GRAD.', 'MAT.', 'NOME DE GUERRA', 'SUB-UNIDADE']);

  // Linhas de dados de militares (linha 12 em diante)
  matrizRealPeculio.push([1, 'MAJ', '101.001-0', 'JOSUÉ CORREIA', '3º PEL']);
  matrizRealPeculio.push([10, '3º SGT', '108.394-5', 'IRAN SILVA', '1º PEL GTAR']);
  matrizRealPeculio.push([12, '2º SGT', '102.950-9', 'SAULO ALVES', '2º PEL GTAR']);

  const resultado = LeitorAntiguidadePeculio.lerMapaAntiguidade(matrizRealPeculio);

  assert.strictEqual(resultado.estatisticas.validos, 3);
  assert.strictEqual(resultado.mapa['1010010'], 1);
  assert.strictEqual(resultado.mapa['1083945'], 10);
  assert.strictEqual(resultado.mapa['1029509'], 12);

  assert.strictEqual(resultado.mapaCompleto['1083945'].nome, 'IRAN SILVA');
  assert.strictEqual(resultado.mapaCompleto['1083945'].grad, '3º SGT');
  assert.strictEqual(resultado.mapaCompleto['1083945'].designacao, '1º PEL GTAR');
});

// 9. Seleção Semântica de Aba Ignorando Primeira Aba Inválida (TASK-M06.3-05H)
test('LeitorAntiguidade: ignora a primeira aba EFETIVO sem cabeçalhos e seleciona semântica a aba válida CÓPIA DE PECÚLIO COM PONTUAÇÃO', () => {
  const abaEfetivoSemCabecalhos = {
    getName: () => 'EFETIVO',
    getLastRow: () => 5,
    getLastColumn: () => 3,
    getRange: () => ({
      getValues: () => [
        ['SUMÁRIO DO EFETIVO', '', ''],
        ['OFICIAIS: 10', '', ''],
        ['PRAÇAS: 50', '', ''],
        ['TOTAL: 60', '', ''],
        ['', '', '']
      ]
    })
  };

  const matrizValidaLinha11 = Array(10).fill(null).map(() => ['', '', '', '', '']);
  matrizValidaLinha11.push(['ORD.', 'GRAD.', 'MAT.', 'NOME DE GUERRA', 'SUB-UNIDADE']);
  matrizValidaLinha11.push([1, 'CB', '123456-7', 'SILVA', 'GTAR']);
  matrizValidaLinha11.push([2, 'SD', '987654-3', 'SOUZA', '1º PEL']);

  const abaPeculioOficial = {
    getName: () => 'CÓPIA DE PECÚLIO COM PONTUAÇÃO',
    getLastRow: () => matrizValidaLinha11.length,
    getLastColumn: () => 5,
    getRange: () => ({
      getValues: () => matrizValidaLinha11
    })
  };

  const mockSS = {
    getSheetByName: (nome) => {
      if (nome === 'EFETIVO') return abaEfetivoSemCabecalhos;
      if (nome === 'CÓPIA DE PECÚLIO COM PONTUAÇÃO') return abaPeculioOficial;
      return null;
    },
    getSheets: () => [abaEfetivoSemCabecalhos, abaPeculioOficial]
  };

  const res = LeitorAntiguidadePeculio.lerMapaAntiguidade(mockSS);
  assert.strictEqual(res.erro, undefined, 'Não deve retornar erro ao encontrar a segunda aba válida');
  assert.strictEqual(res.nomeAba, 'CÓPIA DE PECÚLIO COM PONTUAÇÃO');
  assert.strictEqual(res.mapa['1234567'], 1);
  assert.strictEqual(res.mapa['9876543'], 2);
});

// 10. Rejeição de Aba Não Relacionada ou sem Contrato Estrito (TASK-M06.3-05H.1)
test('LeitorAntiguidade: rejeita aba que possui ORD e MAT. mas carece de 2 marcadores de identidade', () => {
  const abaRelatorioNaoRelacionado = {
    getName: () => 'PECÚLIO', // Nome válido para ser encontrado, mas conteúdo inválido
    getLastRow: () => 5,
    getLastColumn: () => 4,
    getRange: () => ({
      getValues: () => [
        ['ORD.', 'MAT.', 'SITUAÇÃO', 'DESCRICAO'],
        [1, '123456-7', 'CONCLUÍDO', 'SEM IDENTIFICADORES DE MILITAR'],
        [2, '987654-3', 'PENDENTE', 'APENAS DUAS COLUNAS PADRAO']
      ]
    })
  };

  const mockSS = {
    getSheetByName: (n) => (n === 'PECÚLIO' ? abaRelatorioNaoRelacionado : null),
    getSheets: () => [abaRelatorioNaoRelacionado]
  };

  const res = LeitorAntiguidadePeculio.lerMapaAntiguidade(mockSS);
  assert.strictEqual(res.erro, 'PECULIO_CABECALHO_NAO_LOCALIZADO');
  assert.ok(res.detalheErro.includes('contrato estrito'));
});

// 11. Teste: Contador de Linhas Lidas Ignora Linhas Totalmente Vazias
test('LeitorAntiguidade: contador de linhas ignora linhas totalmente em branco no meio e no final da planilha', () => {
  const dadosMock = [
    ['ORD.', 'MAT.', 'NOME DE GUERRA', 'GRAD.', 'SUB-UNIDADE'],
    [1, '123456-7', 'SILVA', 'CB', 'GTAR'],
    ['', '', '', '', ''], // Linha vazia no meio
    [2, '987654-3', 'SOUZA', 'SD', '1º PEL'],
    ['', '', '', '', ''], // Linhas vazias no final simulando getRange exagerado
    ['', null, undefined, '', ' '] 
  ];

  const resultado = LeitorAntiguidadePeculio.lerMapaAntiguidade(dadosMock);

  assert.strictEqual(resultado.estatisticas.validos, 2);
  assert.strictEqual(resultado.estatisticas.lidos, 2, 'O contador de linhas deve ignorar as três linhas totalmente vazias.');
});

// 12. Teste: Remoção de Fallback Perigoso
test('LeitorAntiguidade: nao utiliza fallback de iteracao para encontrar abas desconhecidas se nao corresponderem a nomes ou aliases estritos', () => {
  const abaPerigosa = {
    getName: () => 'PECULIO_TESTE_FALSO',
    getLastRow: () => 5,
    getLastColumn: () => 5,
    getRange: () => ({
      getValues: () => [
        ['ORD.', 'MAT.', 'NOME DE GUERRA', 'GRAD.', 'SUB-UNIDADE'],
        [99, '000000-0', 'HACKER', 'SD', 'MALIGNO']
      ]
    })
  };

  const mockSS = {
    getSheetByName: (n) => null, // Não achou pelos nomes exatos
    getSheets: () => [abaPerigosa] // Tinha uma aba parecida, mas não pode adivinhar!
  };

  const res = LeitorAntiguidadePeculio.lerMapaAntiguidade(mockSS, 'EFETIVO');
  
  assert.strictEqual(res.erro, 'PECULIO_ABA_NAO_LOCALIZADA', 'Deve falhar limpo pois a aba não foi localizada pelos nomes estritos.');
  assert.strictEqual(Object.keys(res.mapa).length, 0);
});

console.log(`\n🎉 Testes do Leitor de Antiguidade do Pecúlio concluídos: ${sucessos} testes passaram!`);
}
