'use strict';
if (typeof require === 'undefined') { /* Ignora no Apps Script */ } else {

/**
 * ARQUIVO: Testes/TestEntradaManualDryRun.js
 * DESCRICAO: Suite do dry-run do caminho de gravacao de BO (pedido do proprietario, 12/09/2026).
 * Prova que a porta headless: valida a MESMA cadeia do formulario, NUNCA grava, reporta os bloqueios
 * reais ("Faltam linhas preparadas", duplicidade, aba mensal) e nunca lanca.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('Iniciando Testes: dry-run da entrada manual de BO...\n');

const REPO = path.join(__dirname, '..');
const codigo = fs.readFileSync(path.join(REPO, 'Entrada', 'EntradaManualHeadless.js'), 'utf8');
(0, eval)(codigo + '\n;globalThis.validarEntradaManualHeadless = validarEntradaManualHeadless;');
const validar = globalThis.validarEntradaManualHeadless;

let sucessos = 0;
let falhas = 0;
function test(nome, fn) {
  try {
    fn();
    console.log(`  [PASS] ${nome}`);
    sucessos++;
  } catch (err) {
    console.error(`  [FAIL] ${nome}:`, err.message);
    falhas++;
  }
}

const PAYLOAD = {
  data: '06/09/2026', hora: '16:54', mike: '202609061705524900', boe: '26E0321003619',
  natureza: 'ENTORPECENTES (POSSE E USO)', ais: '7', cidade: 'OLINDA', bairro: 'SANTA TEREZA',
  policiais: [{ pelotao: '2º PEL', posto: '3ºSGT', matricula: '1109553', nome: 'ARY SILVA' }],
  ocorrenciasPip: ['Apreensão de arma de fogo revólver']
};

function montarCenario(opcoes) {
  const chamadas = { montar: 0, gravar: 0, duplicidade: 0 };
  global.obterSpreadsheetOcorrencias_ = function () { return { fake: true }; };
  global.localizarAbaMensalTratada = function () {
    if (opcoes.abaFalha) throw new Error('Aba mensal esperada (SET2026) não encontrada.');
    return { getName: function () { return 'SET2026'; } };
  };
  global.verificarDuplicidadeOcorrencia = function () {
    chamadas.duplicidade++;
    if (opcoes.duplicada) throw new Error('Ocorrência já cadastrada na aba SET2026 (MIKE 202609061705524900).');
  };
  global.montarLinhasEntradaManual = function () {
    chamadas.montar++;
    if (opcoes.montagemFalha) throw new Error('payload sem policiais');
    return [[], []]; // 2 linhas
  };
  global.gravarLinhasEntradaManual = function (aba, linhas, flags) {
    chamadas.gravar++;
    chamadas.flags = flags;
    if (opcoes.gravacaoFalha) throw new Error('Linha 40 da aba não possui as fórmulas pré-formatadas requeridas na coluna \'TOTAL DE MACONHA\'. Faltam linhas preparadas.');
    return { simulado: true, aba: aba.getName(), linhas: linhas.length, linhaInicial: 40 };
  };
  return chamadas;
}

test('caminho feliz: valida, reporta o plano e NAO grava', () => {
  const ch = montarCenario({});
  const saida = JSON.parse(validar(PAYLOAD));
  assert.strictEqual(saida.status, 'OK');
  assert.strictEqual(saida.gravou, false, 'dry-run nunca pode gravar');
  assert.strictEqual(saida.relatorio.aba, 'SET2026');
  assert.strictEqual(saida.relatorio.linhasComputadas, 2);
  assert.strictEqual(saida.relatorio.plano.simulado, true);
  assert.deepStrictEqual(ch.flags, { simular: true }, 'o gravador TEM de ser chamado em modo simulação');
});

test('duplicidade (BOE/MIKE ja cadastrado) vira problema, sem gravar', () => {
  const ch = montarCenario({ duplicada: true });
  const saida = JSON.parse(validar(PAYLOAD));
  assert.strictEqual(saida.status, 'PROBLEMAS');
  assert.strictEqual(saida.gravou, false);
  assert.strictEqual(saida.problemas[0].codigo, 'DUPLICIDADE');
  assert.strictEqual(ch.gravar, 1, 'segue validando o resto mesmo com duplicidade');
});

test('aba mensal inexistente e reportada como ABA_MENSAL', () => {
  montarCenario({ abaFalha: true });
  const saida = JSON.parse(validar(PAYLOAD));
  assert.strictEqual(saida.status, 'PROBLEMAS');
  assert.strictEqual(saida.problemas[0].codigo, 'ABA_MENSAL');
});

test('travas reais do gravador (faltam linhas preparadas) sao reportadas', () => {
  const ch = montarCenario({ gravacaoFalha: true });
  const saida = JSON.parse(validar(PAYLOAD));
  assert.strictEqual(saida.status, 'PROBLEMAS');
  const codigos = saida.problemas.map(p => p.codigo);
  assert.ok(codigos.indexOf('GRAVACAO_BLOQUEADA') !== -1, 'codigo GRAVACAO_BLOQUEADA esperado');
  assert.ok(/Faltam linhas preparadas/.test(saida.problemas[0].mensagem));
  assert.strictEqual(saida.gravou, false);
  assert.strictEqual(ch.gravar, 1);
});

test('falha de montagem nao impede o relatorio', () => {
  montarCenario({ montagemFalha: true });
  const saida = JSON.parse(validar(PAYLOAD));
  assert.strictEqual(saida.status, 'PROBLEMAS');
  assert.strictEqual(saida.problemas[0].codigo, 'MONTAGEM');
});

test('payload invalido devolve ERRO (nunca lanca)', () => {
  montarCenario({});
  for (const entrada of [null, undefined, 'texto', 42]) {
    const saida = JSON.parse(validar(entrada));
    assert.strictEqual(saida.status, 'ERRO');
    assert.strictEqual(saida.gravou, false);
  }
});

test('erro inesperado de infraestrutura vira ERRO serializavel', () => {
  montarCenario({});
  global.obterSpreadsheetOcorrencias_ = function () { throw new Error('sem permissao'); };
  const saida = JSON.parse(validar(PAYLOAD));
  assert.strictEqual(saida.status, 'ERRO');
  assert.strictEqual(saida.mensagem, 'sem permissao');
});

console.log(`\nTestes do dry-run de entrada manual: ${sucessos} PASS / ${falhas} FAIL`);
if (falhas > 0) process.exitCode = 1;

}
