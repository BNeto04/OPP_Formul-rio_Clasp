'use strict';
if (typeof require === 'undefined') { /* Ignora no Apps Script */ } else {

/**
 * ARQUIVO: Testes/TestGuardiaoHeadless.js
 * DESCRICAO: Suite da entrada headless do Guardiao (G01 #117, gate 13). Cobre: selecao TODOS,
 * selecao nominal, selecao invalida sem efeito colateral, ausencia de abas mensais, falha
 * isolada de um mes sem esconder os demais, serializacao JSON (exigencia do scripts.run),
 * truncamento do painel e limites de prioridades.
 */

const assert = require('assert');
const GuardiaoHeadless = require('../Features/GuardiaoHeadless');

console.log('Iniciando Testes: Entrada headless do Guardiao (G01 #117)...\n');

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

/** Fake do modulo SeletorMesesGuardiao: registra chamadas para provar ausencia de side effects. */
function criarModulo(validas, consolidado, invalidos) {
  const chamadas = { listar: 0, parse: 0, auditar: 0, painel: 0 };
  return {
    chamadas: chamadas,
    listarAbasMensais: function () { chamadas.listar++; return validas.slice(); },
    parseSelecao: function (texto) {
      chamadas.parse++;
      if (invalidos && invalidos.length) return { alvos: [], invalidos: invalidos.slice() };
      return { alvos: validas.slice(), invalidos: [] };
    },
    auditarMeses: function () { chamadas.auditar++; return consolidado; },
    montarPainel: function () { chamadas.painel++; return { texto: 'painel x', prioritarios: [] }; }
  };
}

function criarDeps(modulo) {
  return { obterSS: function () { return { getSheets: function () { return []; } }; }, modulo: modulo };
}

const CONSOLIDADO_2_MESES = {
  porMes: {
    JUL2026: { status: 'OK', resultado: { tuneis: 3, linhas: 10, alertas: 0 } },
    AGO2026: { status: 'OK', resultado: { tuneis: 47, linhas: 1188, alertas: 178 } }
  }
};

// ---------- 1. Selecao TODOS ----------
test('TODOS consolida um resumo por mes auditado', function () {
  const modulo = criarModulo(['JUL2026', 'AGO2026'], CONSOLIDADO_2_MESES);
  const out = JSON.parse(GuardiaoHeadless.executar('TODOS', criarDeps(modulo)));
  assert.strictEqual(out.status, 'OK');
  assert.deepStrictEqual(out.resumo.map(function (r) { return r.aba; }), ['JUL2026', 'AGO2026']);
  assert.strictEqual(out.resumo[0].alertas, 0, 'mes saudavel deve sair com 0 alertas');
  assert.strictEqual(out.resumo[1].alertas, 178, 'mes com alertas deve preservar a contagem');
  assert.strictEqual(modulo.chamadas.auditar, 1, 'auditarMeses deve ser chamado uma unica vez');
});

test('selecao vazia/ausente equivale a TODOS (nunca fica sem alvo)', function () {
  const modulo = criarModulo(['JUL2026'], CONSOLIDADO_2_MESES);
  const out = JSON.parse(GuardiaoHeadless.executar('', criarDeps(modulo)));
  assert.strictEqual(out.status, 'OK');
  assert.strictEqual(modulo.chamadas.auditar, 1);
});

// ---------- 2. Selecao invalida: sem efeito colateral ----------
test('selecao invalida retorna SELECAO_INVALIDA com a lista de abas e NAO audita', function () {
  const modulo = criarModulo(['JUL2026', 'AGO2026'], CONSOLIDADO_2_MESES, ['XYZ']);
  const out = JSON.parse(GuardiaoHeadless.executar('XYZ', criarDeps(modulo)));
  assert.strictEqual(out.status, 'SELECAO_INVALIDA');
  assert.deepStrictEqual(out.invalidos, ['XYZ']);
  assert.deepStrictEqual(out.validas, ['JUL2026', 'AGO2026']);
  assert.strictEqual(modulo.chamadas.auditar, 0, 'nao pode auditar com selecao invalida');
  assert.strictEqual(modulo.chamadas.painel, 0, 'nao pode renderizar painel sem auditoria');
});

// ---------- 3. Sem abas mensais ----------
test('sem abas mensais devolve NAO_AUDITAVEL (sem falso verde)', function () {
  const modulo = criarModulo([], CONSOLIDADO_2_MESES);
  const out = JSON.parse(GuardiaoHeadless.executar('TODOS', criarDeps(modulo)));
  assert.strictEqual(out.status, 'NAO_AUDITAVEL');
  assert.strictEqual(out.motivo, 'NENHUMA_ABA_MENSAL');
  assert.strictEqual(modulo.chamadas.auditar, 0);
});

// ---------- 4. Falha isolada por mes ----------
test('falha de um mes nao esconde os demais', function () {
  const consolidado = {
    porMes: {
      JUL2026: { status: 'OK', resultado: { tuneis: 2, linhas: 5, alertas: 1 } },
      AGO2026: { status: 'ERRO', mensagem: 'aba corrompida' }
    }
  };
  const modulo = criarModulo(['JUL2026', 'AGO2026'], consolidado);
  const out = JSON.parse(GuardiaoHeadless.executar('TODOS', criarDeps(modulo)));
  assert.strictEqual(out.resumo.length, 2);
  assert.strictEqual(out.resumo[1].status, 'ERRO');
  assert.strictEqual(out.resumo[1].mensagem, 'aba corrompida');
});

// ---------- 5. Contrato de serializacao (scripts.run aceita so tipos basicos) ----------
test('retorno e string JSON reparseavel e prioridades so com campos simples', function () {
  const consolidado = {
    porMes: { AGO2026: { status: 'OK', resultado: { tuneis: 47, linhas: 1188, alertas: 178 } } }
  };
  const modulo = criarModulo(['AGO2026'], consolidado);
  modulo.montarPainel = function () {
    return {
      texto: 'painel',
      prioritarios: [{
        classificacao: 'CRITICO', mes: 'AGO2026', mike: '202609042215125692', tunel: 'T1',
        linhas: [12, 13], motivo: 'x',
        diagnosticos: [{ codigo: 'FORMULA_AUSENTE', severidade: 'CRITICO', _interno: function () {} }]
      }]
    };
  };
  const bruto = GuardiaoHeadless.executar('TODOS', criarDeps(modulo));
  assert.strictEqual(typeof bruto, 'string', 'porta headless deve devolver string JSON');
  const out = JSON.parse(bruto);
  assert.strictEqual(out.prioritarios[0].codigo, 'FORMULA_AUSENTE');
  assert.strictEqual(out.prioritarios[0].mike, '202609042215125692');
  assert.strictEqual(out.prioritarios[0]._interno, undefined, 'nada de funcao/objeto interno');
});

test('painel longo e truncado no limite declarado', function () {
  const modulo = criarModulo(['AGO2026'], CONSOLIDADO_2_MESES);
  modulo.montarPainel = function () {
    return { texto: 'x'.repeat(GuardiaoHeadless.LIMITE_TEXTO + 500), prioritarios: [] };
  };
  const out = JSON.parse(GuardiaoHeadless.executar('TODOS', criarDeps(modulo)));
  assert.ok(out.painel.length <= GuardiaoHeadless.LIMITE_TEXTO + 20, 'texto deve ser truncado');
  assert.ok(out.painel.indexOf('[...cortado]') > 0, 'marca de truncamento presente');
});

test('prioridades respeitam o limite maximo', function () {
  const itens = [];
  for (let i = 0; i < GuardiaoHeadless.LIMITE_PRIORITARIOS + 7; i++) {
    itens.push({ classificacao: 'ALERTA', mes: 'AGO2026', linhas: [i], diagnosticos: [{ codigo: 'C' + i }] });
  }
  const modulo = criarModulo(['AGO2026'], CONSOLIDADO_2_MESES);
  modulo.montarPainel = function () { return { texto: '', prioritarios: itens }; };
  const out = JSON.parse(GuardiaoHeadless.executar('TODOS', criarDeps(modulo)));
  assert.strictEqual(out.prioritarios.length, GuardiaoHeadless.LIMITE_PRIORITARIOS);
});

// ---------- 6. Erro de infraestrutura nao vira excecao crua ----------
test('erro inesperado vira status ERRO (porta nao lanca)', function () {
  const deps = {
    obterSS: function () { throw new Error('sem permissao na planilha'); },
    modulo: criarModulo(['JUL2026'], CONSOLIDADO_2_MESES)
  };
  const out = JSON.parse(GuardiaoHeadless.executar('TODOS', deps));
  assert.strictEqual(out.status, 'ERRO');
  assert.strictEqual(out.mensagem, 'sem permissao na planilha');
});

console.log(`\nTestes Entrada headless do Guardiao: ${sucessos} PASS / ${falhas} FAIL`);
if (falhas > 0) process.exitCode = 1;

}
