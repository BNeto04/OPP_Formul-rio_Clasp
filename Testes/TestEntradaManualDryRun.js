'use strict';
if (typeof require === 'undefined') { /* Ignora no Apps Script */ } else {

/**
 * ARQUIVO: Testes/TestEntradaManualDryRun.js
 * DESCRICAO: Suite do dry-run da entrada manual (12/09/2026). A entrada agora é PERMISSIVA (avisos,
 * nunca bloqueio) — o dry-run reporta os avisos do núcleo `_processarEntradaManual` em modo simulação.
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

const PAYLOAD = { data: '06/09/2026', mike: '202609061705524900', boe: '26E0321003619', natureza: 'X',
                  policiais: [{ nome: 'A' }], ocorrenciasPip: ['Apreensão de arma de fogo revólver'] };

function stub(env) {
  globalThis._processarEntradaManual = function (payload, opcoes) {
    env.chamadas = (env.chamadas || 0) + 1;
    env.ultimoOpcoes = opcoes;
    if (env.lancar) throw new Error(env.lancar);
    return env.resultado;
  };
}

test('caminho feliz: reporta plano (simulado) e nunca grava', () => {
  const env = { resultado: { status: 'SIMULADO', registros: 4, avisos: [], identificador: 'X', aba: 'SET2026' } };
  stub(env);
  const saida = JSON.parse(validar(PAYLOAD));
  assert.strictEqual(saida.status, 'OK');
  assert.strictEqual(saida.gravou, false);
  assert.strictEqual(saida.relatorio.aba, 'SET2026');
  assert.strictEqual(saida.relatorio.linhasComputadas, 4);
  assert.deepStrictEqual(saida.problemas, []);
  assert.deepStrictEqual(env.ultimoOpcoes, { simular: true }, 'deve chamar o nucleo em modo simulacao');
});

test('avisos do nucleo viram PROBLEMAS com codigo extraido', () => {
  const env = { resultado: { status: 'SIMULADO', registros: 2, avisos: ['DUPLICIDADE: o MIKE X já consta', 'VALOR_FORA_LISTA: Y na coluna Z'], identificador: 'X', aba: 'SET2026' } };
  stub(env);
  const saida = JSON.parse(validar(PAYLOAD));
  assert.strictEqual(saida.status, 'PROBLEMAS');
  assert.strictEqual(saida.gravou, false);
  assert.strictEqual(saida.problemas[0].codigo, 'DUPLICIDADE');
  assert.strictEqual(saida.problemas[1].codigo, 'VALOR_FORA_LISTA');
});

test('aba mensal inexistente vira aviso ABA_MENSAL (nao grava, nao bloqueia)', () => {
  const env = { resultado: { status: 'NAO_GRAVADO', registros: 0, avisos: ['ABA_MENSAL: Aba mensal esperada (SET2026) não encontrada.'], identificador: 'X', aba: null } };
  stub(env);
  const saida = JSON.parse(validar(PAYLOAD));
  assert.strictEqual(saida.status, 'PROBLEMAS');
  assert.strictEqual(saida.gravou, false);
  assert.strictEqual(saida.problemas[0].codigo, 'ABA_MENSAL');
});

test('payload invalido devolve ERRO (nunca lanca)', () => {
  stub({ resultado: { status: 'SIMULADO', registros: 0, avisos: [], aba: null } });
  for (const entrada of [null, undefined, 'texto', 42]) {
    const saida = JSON.parse(validar(entrada));
    assert.strictEqual(saida.status, 'ERRO');
    assert.strictEqual(saida.gravou, false);
  }
});

test('erro inesperado do nucleo vira ERRO serializavel', () => {
  stub({ lancar: 'sem permissao na planilha' });
  const saida = JSON.parse(validar(PAYLOAD));
  assert.strictEqual(saida.status, 'ERRO');
  assert.strictEqual(saida.gravou, false);
  assert.strictEqual(saida.mensagem, 'sem permissao na planilha');
});

console.log(`\nTestes do dry-run de entrada manual: ${sucessos} PASS / ${falhas} FAIL`);
if (falhas > 0) process.exitCode = 1;

}
