'use strict';
if (typeof require === 'undefined') { /* Ignora no Apps Script */ } else {

/**
 * ARQUIVO: Testes/TestReauditoriaNormalizador.js
 * DESCRICAO: Suite da reauditoria automatica e delta do Normalizador (G01-009 / #121).
 * Cobre os 5 cenarios exigidos: correcao bem-sucedida, erro persistente, novo erro introduzido,
 * perda de auditabilidade e rollback pos-reauditoria (com prova de estado final).
 *
 * O adaptador de reauditoria e um MODELO fiel do Guardiao: um diagnostico existe enquanto a celula
 * estiver em estado nao corrigido (vazia / 'ANTIGO'); preencher a formula o remove.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { ReauditoriaNormalizador } = require('../Core/ReauditoriaNormalizador');
const { ExecutorNormalizador } = require('../Core/ExecutorNormalizador');

console.log('Iniciando Testes: Reauditoria automatica e delta do Normalizador (G01-009 / #121)...\n');

let sucessos = 0;
let falhas = 0;
function test(nome, fn) {
  try { fn(); console.log(`  [PASS] ${nome}`); sucessos++; }
  catch (err) { console.error(`  [FAIL] ${nome}:`, err.message); falhas++; }
}

const R = ReauditoriaNormalizador;
const arcaOk = { rule_id: 'ARCA-PIP-001', status: 'MAPPED', fonte_status: 'CANONICAL_SOURCE_CONFIRMED' };
const agora = '2026-09-10T21:00:00.000Z';

const MAPA_PADRAO = { 'FORMULA42': 'FORMULA_AUSENTE', 'FORMULA43': 'FORMULA_CORROMPIDA_ERRO_SINTAXE' };

/**
 * Ambiente em memoria: planilha + Guardiao que reaudita a partir do estado atual das celulas.
 * opcoes: dados (estado inicial), mapa (celula -> codigo do diagnostico), extras (diagnosticos
 * injetados, ex.: regra fora do escopo), cobertura.
 */
function criarAmbiente(opcoes) {
  const o = opcoes || {};
  const dados = Object.assign({ 'ago.2026': { 'FORMULA42': '', 'FORMULA43': 'ANTIGO' } }, o.dados || {});
  const mapa = o.mapa || MAPA_PADRAO;
  const chamadas = { escritas: [], reauditorias: [] };
  return {
    dados: dados,
    chamadas: chamadas,
    reauditar(aba) {
      chamadas.reauditorias.push(aba);
      const diags = [];
      Object.keys(mapa).forEach(celula => {
        const valor = dados[aba][celula];
        const corrigido = !(valor === '' || valor === null || valor === undefined || valor === 'ANTIGO');
        if (!corrigido) {
          diags.push({ aba: aba, linha: Number(String(celula).replace(/[^0-9]/g, '')), coluna: 'FORMULA', codigoRegra: mapa[celula] });
        }
      });
      (o.extras || []).forEach(d => diags.push(Object.assign({ aba: aba, coluna: 'FORMULA' }, d)));
      const cobertura = o.cobertura === undefined ? { status: 'COMPLETA', regrasNaoAuditadas: [] } : o.cobertura;
      return { reauditoria_id: 'REAUD_FAKE', diagnosticos: diags, cobertura: cobertura };
    },
    lerCelula(aba, range) { return dados[aba][String(range).split('!')[1]]; },
    escreverCelula(aba, range, valor) {
      chamadas.escritas.push({ aba: aba, range: range, valor: valor });
      dados[aba][String(range).split('!')[1]] = valor;
      return { ok: true };
    }
  };
}

function acaoExecutada(linha, codigoRegra) {
  return { id: 'PROP_ago.2026_' + linha + '_FORMULA_' + codigoRegra, range: 'ago.2026!FORMULA' + linha, classe: 'AUTO_FIX' };
}

function planoCom(acoesExtras) {
  return {
    plano_id: 'PLANO_121',
    acoes: [
      { id: 'PROP_ago.2026_42_FORMULA_FORMULA_AUSENTE', diagnostic_id: 'FORMULA_AUSENTE', aba: 'ago.2026', linha: 42, coluna: 'FORMULA', range: 'ago.2026!FORMULA42', regra: arcaOk, classe: 'AUTO_FIX', valida: true },
      { id: 'PROP_ago.2026_43_FORMULA_FORMULA_CORROMPIDA_ERRO_SINTAXE', diagnostic_id: 'FORMULA_CORROMPIDA_ERRO_SINTAXE', aba: 'ago.2026', linha: 43, coluna: 'FORMULA', range: 'ago.2026!FORMULA43', regra: arcaOk, classe: 'AUTO_FIX', valida: true }
    ].concat(acoesExtras || []),
    limites: { max_acoes: 200, excedeu_limite: false }
  };
}

function relatorioBase() {
  return {
    status: 'APLICADO',
    execucao_id: 'EXEC_TESTE',
    plano_id: 'PLANO_121',
    aplicadas: [acaoExecutada(42, 'FORMULA_AUSENTE'), acaoExecutada(43, 'FORMULA_CORROMPIDA_ERRO_SINTAXE')],
    snapshot: [
      { id: 'PROP_ago.2026_42_FORMULA_FORMULA_AUSENTE', aba: 'ago.2026', range: 'ago.2026!FORMULA42', valor_antes: '' },
      { id: 'PROP_ago.2026_43_FORMULA_FORMULA_CORROMPIDA_ERRO_SINTAXE', aba: 'ago.2026', range: 'ago.2026!FORMULA43', valor_antes: 'ANTIGO' }
    ]
  };
}

// ---------- 1. correcao bem-sucedida ----------
test('correcao bem-sucedida: celulas corrigidas => reauditoria VERDE, alvos resolvidos, zero novos', () => {
  const amb = criarAmbiente({ dados: { 'ago.2026': { 'FORMULA42': '=SOMA(A2:A5)', 'FORMULA43': '=SOMA(B2:B5)' } } });
  const s = R.executar(relatorioBase(), planoCom(), amb, { agora: agora, executor: ExecutorNormalizador });
  assert.strictEqual(s.status, 'VERDE');
  assert.strictEqual(s.criterios.ERRO_ALVO_RESOLVIDO, true);
  assert.strictEqual(s.criterios.NOVOS_ERROS_CRIADOS, 0);
  assert.strictEqual(s.criterios.REAUDITORIA, 'GREEN');
  assert.strictEqual(s.delta.resolvidos.length, 2);
  assert.strictEqual(s.rollback, null);
  assert.ok(amb.chamadas.reauditorias.length > 0, 'Guardiao deve ser chamado no mesmo escopo');
});

test('diagnostico conhecido FORA do lote permanece persistente sem bloquear o verde', () => {
  const plano = planoCom([{ id: 'PROP_ago.2026_99_X_POLICIAL_SEM_NOME', diagnostic_id: 'POLICIAL_SEM_NOME', aba: 'ago.2026', linha: 99, coluna: 'X', range: 'ago.2026!X99', regra: arcaOk, classe: 'MANUAL_ONLY', valida: true }]);
  const amb = criarAmbiente({
    dados: { 'ago.2026': { 'FORMULA42': '=SOMA(A2:A5)', 'FORMULA43': '=SOMA(B2:B5)' } },
    extras: [{ linha: 99, coluna: 'X', codigoRegra: 'POLICIAL_SEM_NOME' }]
  });
  const s = R.executar(relatorioBase(), plano, amb, { agora: agora, executor: ExecutorNormalizador });
  assert.strictEqual(s.delta.novos.length, 0, 'diagnostico que ja existia nao pode contar como novo');
  assert.ok(s.delta.persistentes.length >= 1);
  assert.strictEqual(s.status, 'VERDE');
});

test('cadeia vinculada: diagnostic_id -> plano_id -> mutacao_id -> reauditoria_id com ARCA preservada', () => {
  const amb = criarAmbiente({ dados: { 'ago.2026': { 'FORMULA42': '=SOMA(A2:A5)', 'FORMULA43': '=SOMA(B2:B5)' } } });
  const s = R.executar(relatorioBase(), planoCom(), amb, { agora: agora, executor: ExecutorNormalizador });
  assert.strictEqual(s.cadeia.length, 2);
  s.cadeia.forEach(c => {
    assert.ok(c.diagnostic_id && c.plano_id && c.mutacao_id && c.reauditoria_id, 'cadeia incompleta');
    assert.strictEqual(c.plano_id, 'PLANO_121');
    assert.strictEqual(c.reauditoria_id, s.reauditoria_id);
    assert.strictEqual(c.regra_arca, 'ARCA-PIP-001');
    assert.strictEqual(c.fonte_regra, 'CANONICAL_SOURCE_CONFIRMED');
  });
});

// ---------- 2. erro persistente ----------
test('erro persistente: alvo continua presente => vermelho, rollback do lote e estado final comprovado', () => {
  const amb = criarAmbiente({}); // celulas seguem nao corrigidas
  const s = R.executar(relatorioBase(), planoCom(), amb, { agora: agora, executor: ExecutorNormalizador });
  assert.strictEqual(s.status, 'ROLLBACK_POR_QUALIDADE');
  assert.strictEqual(s.criterios.ERRO_ALVO_RESOLVIDO, false);
  assert.strictEqual(s.delta.persistentes.length, 2);
  assert.ok(s.rollback && s.rollback.revertidas.length === 2, 'rollback do lote inteiro');
  assert.strictEqual(s.reauditoria_pos_rollback.alvos_de_volta, true, 'defeitos alvo devem estar de volta');
  assert.strictEqual(s.reauditoria_pos_rollback.estado_final_comprovado, true);
});

// ---------- 3. novo erro introduzido ----------
test('novo erro introduzido pela correcao dispara rollback (NOVOS_ERROS_CRIADOS>0)', () => {
  const amb = criarAmbiente({
    dados: { 'ago.2026': { 'FORMULA42': '=SOMA(A2:A5)', 'FORMULA43': '=SOMA(B2:B5)' } },
    extras: [{ linha: 7, codigoRegra: 'MIKE_BOE_DIVERGENTE' }]
  });
  const s = R.executar(relatorioBase(), planoCom(), amb, { agora: agora, executor: ExecutorNormalizador });
  assert.strictEqual(s.criterios.NOVOS_ERROS_CRIADOS, 1);
  assert.strictEqual(s.status, 'ROLLBACK_POR_QUALIDADE');
  assert.strictEqual(s.criterios.REAUDITORIA, 'RED');
  assert.ok(s.resumo_humano.some(l => l.indexOf('NOVOS_ERROS_CRIADOS=1') !== -1));
});

// ---------- 4. perda de auditabilidade ----------
test('perda de auditabilidade: cobertura PARCIAL nao conta como verde mesmo sem diagnostico', () => {
  const amb = criarAmbiente({
    dados: { 'ago.2026': { 'FORMULA42': '=SOMA(A2:A5)', 'FORMULA43': '=SOMA(B2:B5)' } },
    cobertura: { status: 'PARCIAL', regrasNaoAuditadas: [{ regra: 'VALIDACAO_INDICADOR_PIP', motivo: 'CATALOGO_PIP_INDISPONIVEL', tipo: 'LIMITACAO_DE_AUDITORIA' }] }
  });
  const s = R.executar(relatorioBase(), planoCom(), amb, { agora: agora, executor: ExecutorNormalizador });
  assert.strictEqual(s.criterios.REAUDITORIA, 'RED');
  assert.strictEqual(s.status, 'ROLLBACK_POR_QUALIDADE');
  assert.strictEqual(s.delta.nao_auditados.length, 1);
  assert.ok(s.resumo_humano.some(l => l.indexOf('Perda de auditabilidade') !== -1));
});

test('regra alvo declarada NAO_AUDITADA bloqueia o verde', () => {
  const amb = criarAmbiente({
    dados: { 'ago.2026': { 'FORMULA42': '=SOMA(A2:A5)', 'FORMULA43': '=SOMA(B2:B5)' } },
    cobertura: { status: 'COMPLETA', regrasNaoAuditadas: [{ regra: 'FORMULA_AUSENTE', motivo: 'FONTE_INDISPONIVEL', tipo: 'LACUNA_ARCA' }] }
  });
  const s = R.executar(relatorioBase(), planoCom(), amb, { agora: agora, executor: ExecutorNormalizador });
  assert.strictEqual(s.criterios.REAUDITORIA, 'RED');
  assert.strictEqual(s.status, 'ROLLBACK_POR_QUALIDADE');
});

// ---------- 5. escopo / limites ----------
test('escopo mutado acima do limite tambem falha o criterio e reverte', () => {
  const amb = criarAmbiente({ dados: { 'ago.2026': { 'FORMULA42': '=SOMA(A2:A5)', 'FORMULA43': '=SOMA(B2:B5)' } } });
  const s = R.executar(relatorioBase(), planoCom(), amb, { agora: agora, executor: ExecutorNormalizador, limiteEscopo: 1 });
  assert.strictEqual(s.criterios.ESCOPO_MUTADO, 2);
  assert.strictEqual(s.status, 'ROLLBACK_POR_QUALIDADE');
  assert.ok(s.resumo_humano.some(l => l.indexOf('acima do limite') !== -1));
});

// ---------- 6. bordas ----------
test('sem mutacao aplicada nao ha reauditoria (SEM_MUTACAO)', () => {
  const amb = criarAmbiente({});
  const s = R.executar({ status: 'SEM_ACOES', execucao_id: 'E', aplicadas: [] }, planoCom(), amb, { agora: agora, executor: ExecutorNormalizador });
  assert.strictEqual(s.status, 'SEM_MUTACAO');
  assert.strictEqual(amb.chamadas.reauditorias.length, 0);
});

test('rollback desabilitado por opcao: assume explicitamente estado final NAO comprovado', () => {
  const amb = criarAmbiente({});
  const s = R.executar(relatorioBase(), planoCom(), amb, { agora: agora, executor: ExecutorNormalizador, executarRollback: false });
  assert.strictEqual(s.status, 'ROLLBACK_POR_QUALIDADE');
  assert.strictEqual(s.rollback, null);
  assert.ok(s.resumo_humano.some(l => l.indexOf('NAO comprovado') !== -1));
});

test('resumo humano estruturado descreve o delta do lote', () => {
  const amb = criarAmbiente({ dados: { 'ago.2026': { 'FORMULA42': '=SOMA(A2:A5)', 'FORMULA43': '=SOMA(B2:B5)' } } });
  const s = R.executar(relatorioBase(), planoCom(), amb, { agora: agora, executor: ExecutorNormalizador });
  const texto = s.resumo_humano.join('\n');
  assert.ok(texto.indexOf(s.reauditoria_id) !== -1);
  assert.ok(texto.indexOf('2 resolvido') !== -1);
  assert.ok(texto.indexOf('Cobertura depois: COMPLETA') !== -1);
});

test('nucleo puro: nao usa API de planilha direta (reauditoria via adaptador)', () => {
  const fonte = fs.readFileSync(path.join(__dirname, '..', 'Core', 'ReauditoriaNormalizador.js'), 'utf8');
  ['SpreadsheetApp', 'getRange(', 'setValue', 'setValues'].forEach(api => {
    assert.ok(fonte.indexOf(api) === -1, 'API direta encontrada: ' + api);
  });
});

test('reauditoria_id e deterministico para o mesmo lote/instante', () => {
  const s1 = R.executar(relatorioBase(), planoCom(), criarAmbiente({}), { agora: agora, executor: ExecutorNormalizador });
  const s2 = R.executar(relatorioBase(), planoCom(), criarAmbiente({}), { agora: agora, executor: ExecutorNormalizador });
  assert.strictEqual(s1.reauditoria_id, s2.reauditoria_id);
});

console.log(`\nRESULTADOS FINAIS: ${sucessos} PASS / ${falhas} FAIL`);
if (falhas > 0) process.exitCode = 1;
}
