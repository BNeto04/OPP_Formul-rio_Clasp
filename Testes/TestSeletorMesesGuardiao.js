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

// ---------- 6. Nomes REAIS da planilha viva (evidencia live G01 #117, 10/09/2026) ----------
test('nomes reais da planilha: seleciona exatamente os 9 meses auditaveis', () => {
  const nomesReais = ['SET2026', 'AGO2026', 'CA_JUL2026_JUL2026', '_BACKUP_JUN2026', '_BKP_20260710_JAN2026', '_BKP_20260710_FEV2026', '_BKP_20260710_MAR2026', '_BKP_20260710_ABR2026', '_BKP_20260710_MAI2026', '_BKP_20260710_JUN2026', '_BACKUP_MAI2026', '_BACKUP_ABR2026', '_BACKUP_MAR2026', '_BACKUP_FEV2026', '_BACKUP_JAN2026', 'JUL2026', 'PIP_SELECAO_LIVRE', 'PIP_JUL_2026.v5', 'PRODUTIVIDADE_GERAL', 'LOG_COMPARATIVO_2026', 'LOG_PRODUTIVIDADE', 'PIP_JUL_2026.v3', 'PIP_JUL_2026.v2', 'COMP_ARMAS_2026.v1', '[DEBUG] Homologação', 'ListaV1_PM', 'ListaV2_PM', 'COMP_ARMAS_JUL2026_JUL2026.v1', 'PIP_JUL_2026', 'COMP_ARMAS_JUL2026_JUL2026', 'COMP_ARMAS_2026', 'LOG_DROGAS_LIVRE', 'JUN2026', '[AUDITORIA] Ocorrencias', 'LOG_DROGAS_ANUAL', 'LOG_CPM', 'PIP_JUN_2026.v5', 'MAI2026', 'ABR2026', 'MAR2026', 'FEV2026', 'JAN2026', 'PIP_FINAL-AGO2026', 'COMPARATIVO_2026', 'LOOKER_PIP_PREVIA.', 'Modelo_2026', 'Posição Geografica', 'EFETIVO', '[AUDITORIA] Efetivo', 'LOG_PIP', 'LOG_ANUAL', 'LOG_LIVRE', 'tabela de pontos PIP', 'Cópia de tabela de pontos PIP'];
  const abas = SeletorMesesGuardiao.listarAbasMensais(criarSS(nomesReais)).map(a => a.nome);
  assert.deepStrictEqual(abas, ['JAN2026', 'FEV2026', 'MAR2026', 'ABR2026', 'MAI2026', 'JUN2026', 'JUL2026', 'AGO2026', 'SET2026']);
});

test('variacoes com separador real (jul.2026, JUL-2026, jul_2026) sao aceitas', () => {
  for (const n of ['jul.2026', 'JUL-2026', 'jul_2026', 'JUL.2026']) {
    const p = SeletorMesesGuardiao.nomeMensalValido(n);
    assert.ok(p && p.mes === 7 && p.ano === 2026, `falhou para ${n}`);
  }
});

// ---------- 7. Seletor em BOTOES (dialogo HTML - decisao do proprietario 10/09/2026) ----------
test('prepararOpcoes gera valor canonico + rotulo amigavel para o dialogo', () => {
  const validas = SeletorMesesGuardiao.listarAbasMensais(criarSS(['JUL2026', 'SET2026']));
  const opcoes = SeletorMesesGuardiao.prepararOpcoes(validas);
  assert.strictEqual(opcoes.length, 2);
  assert.strictEqual(opcoes[0].valor, 'JUL2026');
  assert.ok(opcoes[0].rotulo.includes('07/2026') && opcoes[0].rotulo.includes('JUL2026'));
  assert.ok(opcoes[1].rotulo.includes('09/2026'));
});

test('selecao vinda do dialogo (array de nomes) resolve para alvos validos', () => {
  const validas = SeletorMesesGuardiao.listarAbasMensais(criarSS(['JUN2026', 'JUL2026', 'AGO2026']));
  const s = SeletorMesesGuardiao.resolverSelecaoDialogo(['JUL2026', 'AGO2026'], validas);
  assert.strictEqual(s.modo, 'LISTA');
  assert.deepStrictEqual(s.alvos.map(a => a.nome), ['JUL2026', 'AGO2026']);
  assert.deepStrictEqual(s.invalidos, []);
});

test('dialogo com array vazio nao audita nada (sem falso verde)', () => {
  const validas = SeletorMesesGuardiao.listarAbasMensais(criarSS(['JUL2026']));
  const s = SeletorMesesGuardiao.resolverSelecaoDialogo([], validas);
  assert.strictEqual(s.alvos.length, 0);
  assert.strictEqual(s.cancelado, false);
});

test('dialogo cancelado (null) retorna cancelado sem alvos', () => {
  const s = SeletorMesesGuardiao.resolverSelecaoDialogo(null, []);
  assert.strictEqual(s.cancelado, true);
  assert.strictEqual(s.alvos.length, 0);
});

test('nome invalido vindo do dialogo vai para invalidos', () => {
  const validas = SeletorMesesGuardiao.listarAbasMensais(criarSS(['JUL2026']));
  const s = SeletorMesesGuardiao.resolverSelecaoDialogo(['JUL2026', 'FEV2099'], validas);
  assert.deepStrictEqual(s.alvos.map(a => a.nome), ['JUL2026']);
  assert.deepStrictEqual(s.invalidos, ['FEV2099']);
});

test('formatarResultado resume meses OK e ERRO sem esconder falha', () => {
  const consolidado = {
    porMes: {
      JUL2026: { status: 'OK', resultado: { tuneis: 33, linhas: 1208, alertas: 3 } },
      AGO2026: { status: 'ERRO', mensagem: 'ABA_INDISPONIVEL' }
    }
  };
  const texto = SeletorMesesGuardiao.formatarResultado(consolidado, { texto: '', prioritarios: [] });
  assert.ok(texto.includes('JUL2026') && texto.includes('33') && texto.includes('1208'));
  assert.ok(texto.includes('AGO2026') && texto.includes('ERRO') && texto.includes('ABA_INDISPONIVEL'));
  assert.ok(texto.includes('[AUDITORIA] Ocorrencias'));
});

console.log(`\nRESULTADOS FINAIS: ${sucessos} PASS / ${falhas} FAIL`);
if (falhas > 0) process.exit(1);
}
