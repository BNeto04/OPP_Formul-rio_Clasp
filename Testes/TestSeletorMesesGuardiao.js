'use strict';
if (typeof require === 'undefined') { /* Ignora no Apps Script */ } else {

/**
 * ARQUIVO: Testes/TestSeletorMesesGuardiao.js
 * DESCRICAO: Suite do seletor de meses do Guardiao (G01 #113): filtragem de abas validas,
 * selecao 1/N/TODOS, ordenacao, consolidacao por mes, falha isolada sem esconder as demais
 * e injecao do motor canonico varrerAba.
 */

const assert = require('assert');
const SeletorMesesGuardiao = require('../Entrada/SeletorMesesGuardiao');

console.log('Iniciando Testes: Seletor de Meses do Guardiao (G01 #113)...\n');

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

function sheet(nome) {
  return { getName: () => nome };
}

function criarSS(nomes) {
  return { getSheets: () => nomes.map(sheet) };
}

// ---------- 1. Filtragem: so abas mensais validas ----------
test('reconhece JUL2026 como mes valido', () => {
  const p = SeletorMesesGuardiao.nomeMensalValido('JUL2026');
  assert.ok(p && p.ano === 2026 && p.mes === 7);
});

test('reconhece formatos flexiveis (JUL 2026, 2026-07, 2026 07, 202607, JULHO 2026)', () => {
  for (const n of ['JUL 2026', '2026-07', '2026 07', '202607', 'JULHO 2026', 'JUL/2026']) {
    const p = SeletorMesesGuardiao.nomeMensalValido(n);
    assert.ok(p && p.ano === 2026 && p.mes === 7, `falhou para ${n}`);
  }
});

test('exclui abas auxiliares (AUDITORIA/HISTORICO/Tabela PIP/aux/teste)', () => {
  for (const n of ['AUDITORIA', 'HISTORICO', 'Tabela PIP', 'PIP', 'AUXILIAR', 'MODELO_JUL2026', 'GABARITO', 'JUL2026_TESTE']) {
    assert.strictEqual(SeletorMesesGuardiao.nomeMensalValido(n), null, `deveria excluir ${n}`);
  }
});

test('rejeita nomes sem mes/ano e relatorios', () => {
  for (const n of ['JULHO', '2026', 'OCORRENCIAS', 'GERAL', 'PLANILHA1', '']) {
    assert.strictEqual(SeletorMesesGuardiao.nomeMensalValido(n), null, `deveria rejeitar ${n}`);
  }
});

// ---------- 2. Listagem/ordenacao ----------
test('lista somente abas mensais, ordenadas cronologicamente', () => {
  const ss = criarSS(['JUN2026', 'AUDITORIA', 'Tabela PIP', 'AGO2026', 'JUL2026', '2025-12']);
  const abas = SeletorMesesGuardiao.listarAbasMensais(ss);
  assert.deepStrictEqual(abas.map(a => a.nome), ['2025-12', 'JUN2026', 'JUL2026', 'AGO2026']);
});

test('sem abas validas retorna lista vazia (fonte do NAO_AUDITAVEL)', () => {
  const ss = criarSS(['AUDITORIA', 'HISTORICO']);
  assert.deepStrictEqual(SeletorMesesGuardiao.listarAbasMensais(ss), []);
});

// ---------- 3. Selecao 1/N/TODOS e cancelamento ----------
test('TODOS seleciona todas as validas', () => {
  const validas = SeletorMesesGuardiao.listarAbasMensais(criarSS(['JUN2026', 'JUL2026']));
  const s = SeletorMesesGuardiao.parseSelecao('TODOS', validas);
  assert.strictEqual(s.modo, 'TODOS');
  assert.strictEqual(s.alvos.length, 2);
});

test('selecao por nome, numero da lista e varios com virgula', () => {
  const validas = SeletorMesesGuardiao.listarAbasMensais(criarSS(['JUN2026', 'JUL2026', 'AGO2026']));
  assert.deepStrictEqual(SeletorMesesGuardiao.parseSelecao('jul2026', validas).alvos.map(a => a.nome), ['JUL2026']);
  assert.deepStrictEqual(SeletorMesesGuardiao.parseSelecao('2', validas).alvos.map(a => a.nome), ['JUL2026']);
  assert.deepStrictEqual(SeletorMesesGuardiao.parseSelecao('JUL2026, 3', validas).alvos.map(a => a.nome), ['JUL2026', 'AGO2026']);
  assert.deepStrictEqual(SeletorMesesGuardiao.parseSelecao('1,2,3', validas).alvos.map(a => a.nome), ['JUN2026', 'JUL2026', 'AGO2026']);
});

test('nome desconhecido vai para invalidos (sem falso verde)', () => {
  const validas = SeletorMesesGuardiao.listarAbasMensais(criarSS(['JUN2026']));
  const s = SeletorMesesGuardiao.parseSelecao('JUN2026, FEV2099', validas);
  assert.deepStrictEqual(s.invalidos, ['FEV2099']);
  assert.strictEqual(s.modo, 'LISTA');
});

test('null (cancelar) retorna cancelado sem alvos', () => {
  const s = SeletorMesesGuardiao.parseSelecao(null, []);
  assert.strictEqual(s.cancelado, true);
  assert.strictEqual(s.alvos.length, 0);
});

// ---------- 4. Consolidacao multiaba com motor injetado ----------
function motorFake(resultadosPorNome, errosPorNome = {}) {
  return {
    varrerAba(s) {
      const nome = s.getName();
      if (errosPorNome[nome]) throw new Error(errosPorNome[nome]);
      return resultadosPorNome[nome] || { alertas: 0, linhas: 0, tuneis: 0, diagnosticos: [] };
    }
  };
}

test('consolida 1 mes (modo LISTA)', () => {
  const validas = SeletorMesesGuardiao.listarAbasMensais(criarSS(['JUN2026']));
  const motor = motorFake({ JUN2026: { alertas: 3, linhas: 10, tuneis: 2, diagnosticos: [1, 2] } });
  const c = SeletorMesesGuardiao.auditarMeses(SeletorMesesGuardiao.parseSelecao('JUN2026', validas), criarSS(['JUN2026']), motor);
  assert.strictEqual(c.porMes.JUN2026.status, 'OK');
  assert.deepStrictEqual(c.resumo, { total: 1, ok: 1, comErro: 0, alertas: 3, tuneis: 2, diagnosticos: 2, status: 'OK' });
});

test('consolida N meses e TODOS chamando o mesmo motor por aba', () => {
  const validas = SeletorMesesGuardiao.listarAbasMensais(criarSS(['JUN2026', 'JUL2026', 'AGO2026']));
  const chamadas = [];
  const motor = {
    varrerAba(s) { chamadas.push(s.getName()); return { alertas: 1, linhas: 5, tuneis: 1, diagnosticos: [] }; }
  };
  const s = SeletorMesesGuardiao.parseSelecao('TODOS', validas);
  const c = SeletorMesesGuardiao.auditarMeses(s, criarSS([]), motor);
  assert.deepStrictEqual(chamadas, ['JUN2026', 'JUL2026', 'AGO2026']);
  assert.deepStrictEqual(c.resumo, { total: 3, ok: 3, comErro: 0, alertas: 3, tuneis: 3, diagnosticos: 0, status: 'OK' });
});

test('falha em UMA aba nao esconde as demais e fica marcada como ERRO', () => {
  const validas = SeletorMesesGuardiao.listarAbasMensais(criarSS(['JUN2026', 'JUL2026']));
  const motor = motorFake(
    { JUN2026: { alertas: 2, linhas: 8, tuneis: 1, diagnosticos: [] } },
    { JUL2026: 'falha simulada na JUL2026' }
  );
  const c = SeletorMesesGuardiao.auditarMeses(SeletorMesesGuardiao.parseSelecao('TODOS', validas), criarSS([]), motor);
  assert.strictEqual(c.porMes.JUN2026.status, 'OK');
  assert.strictEqual(c.porMes.JUL2026.status, 'ERRO');
  assert.ok(c.porMes.JUL2026.mensagem.includes('falha simulada'));
  assert.deepStrictEqual([c.resumo.ok, c.resumo.comErro, c.resumo.status], [1, 1, 'PARCIAL_COM_ERRO']);
});

test('selecao cancelada/vazia retorna NAO_EXECUTADO sem chamar o motor', () => {
  let chamadas = 0;
  const motor = { varrerAba() { chamadas++; } };
  const c = SeletorMesesGuardiao.auditarMeses(SeletorMesesGuardiao.parseSelecao(null, []), criarSS([]), motor);
  assert.strictEqual(chamadas, 0);
  assert.strictEqual(c.resumo.status, 'NAO_EXECUTADO');
});

test('motor indisponivel lanca erro explicito (nunca verde silencioso)', () => {
  assert.throws(() => SeletorMesesGuardiao.auditarMeses({ alvos: [{}], cancelado: false }, criarSS([]), { semVarrer: true }), /varrerAba/);
});

// ---------- 5. Mensagem legivel ----------
test('mensagem legivel lista abas e numeracao', () => {
  const validas = SeletorMesesGuardiao.listarAbasMensais(criarSS(['JUL2026', 'AGO2026']));
  const msg = SeletorMesesGuardiao.montarListaLegivel(validas);
  assert.ok(msg.includes('JUL2026') && msg.includes('AGO2026') && msg.includes('1.'));
});

console.log(`\nRESULTADOS FINAIS: ${sucessos} PASS / ${falhas} FAIL`);
if (falhas > 0) process.exit(1);
}
