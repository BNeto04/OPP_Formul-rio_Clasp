'use strict';
if (typeof require === 'undefined') { /* Ignora no Apps Script */ } else {

/**
 * ARQUIVO: Testes/TestDryRunNormalizador.js
 * DESCRICAO: Suite do dry-run e plano deterministico do Normalizador Seguro (G01-007 / #119).
 * Prova: zero escrita, plano idempotente (mesmo estado => mesmo plano/hash), rastreabilidade por acao,
 * deteccao de plano vazio/conflito/ambiguidade/whitelist/fonte insuficiente/limite e preview legivel.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { DryRunNormalizador } = require('../Core/DryRunNormalizador');
const { ContratoMutacaoSegura } = require('../Core/ContratoMutacaoSegura');

console.log('Iniciando Testes: Dry-run e plano deterministico do Normalizador (G01-007 / #119)...\n');

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

const D = DryRunNormalizador;
const arcaOk = { rule_id: 'ARCA-PIP-001', status: 'MAPPED', fonte_status: 'CANONICAL_SOURCE_CONFIRMED' };

function diagFormula(linha, valor) {
  return {
    codigoRegra: 'FORMULA_AUSENTE', aba: 'ago.2026', linha: linha, coluna: 'FORMULA',
    severidade: 'ALERTA', camada: 'ESTRUTURAL', tunel: 'MIKE-' + linha,
    diagnostico: 'Formula ausente na coluna calculada.', evidencia: 'Celula vazia',
    valorAtual: '', valorProposto: valor === undefined ? '=SOMA(A2:A5)' : valor, arca: arcaOk
  };
}

// ---------- 1. plano vazio ----------
test('plano vazio e detectado explicitamente', () => {
  const p = D.gerarPlano([], {});
  assert.strictEqual(p.resumo.total_acoes, 0);
  assert.ok(p.problemas.some(x => x.tipo === 'PLANO_VAZIO'));
  assert.strictEqual(D.autorizarExecucao(p, { kill_switch: false, lock_adquirido: true, dry_run_executado: true, snapshot_disponivel: true, reauditoria_disponivel: true }).autorizado, false);
});

// ---------- 2. determinismo / idempotencia ----------
test('duas geracoes sobre o mesmo estado produzem o MESMO plano (mesmo hash)', () => {
  const entrada = [diagFormula(42), diagFormula(43, '=SOMA(B2:B5)')];
  const p1 = D.gerarPlano(entrada, {});
  const p2 = D.gerarPlano(entrada, {});
  assert.strictEqual(p1.plano_id, p2.plano_id);
  assert.strictEqual(D.serializarCanonico(p1.acoes), D.serializarCanonico(p2.acoes));
  assert.strictEqual(p1.preview.join('\n'), p2.preview.join('\n'));
});

test('plano nao depende da ordem de entrada (ordenacao canonica)', () => {
  const a = D.gerarPlano([diagFormula(43), diagFormula(42)], {});
  const b = D.gerarPlano([diagFormula(42), diagFormula(43)], {});
  assert.strictEqual(a.plano_id, b.plano_id);
});

test('hash e sensivel ao conteudo (mudar o valor proposto muda o plano_id)', () => {
  const p1 = D.gerarPlano([diagFormula(42, '=SOMA(A2:A5)')], {});
  const p2 = D.gerarPlano([diagFormula(42, '=SOMA(A2:A9)')], {});
  assert.notStrictEqual(p1.plano_id, p2.plano_id);
});

// ---------- 3. zero escrita e entrada intacta ----------
test('modulo nao expoe escrita e nao usa API de planilha', () => {
  const verbos = /^(escrever|gravar|aplicar|salvar|persistir|atualizar|set|update|delete|remove|clear|mutar)/i;
  const metodos = Object.getOwnPropertyNames(D).filter(n => typeof D[n] === 'function');
  assert.deepStrictEqual(metodos.filter(m => verbos.test(m)), []);
  const fonte = fs.readFileSync(path.join(__dirname, '..', 'Core', 'DryRunNormalizador.js'), 'utf8');
  ['SpreadsheetApp', 'setValue', 'setValues', 'setFormula', 'appendRow', 'clearContent'].forEach(api => {
    assert.ok(fonte.indexOf(api) === -1, 'API de escrita encontrada: ' + api);
  });
});

test('dry-run nao altera os diagnosticos de entrada (estado operacional intacto)', () => {
  const entrada = [diagFormula(42), diagFormula(43)];
  const snapshot = JSON.stringify(entrada);
  const p = D.gerarPlano(entrada, {});
  assert.strictEqual(JSON.stringify(entrada), snapshot, 'entrada foi mutada');
  assert.strictEqual(p.escrito, false);
  assert.strictEqual(p.dry_run, true);
});

// ---------- 4. rastreabilidade ----------
test('toda acao carrega diagnostic_id, regra, aba, range, valores, classe e justificativa', () => {
  const p = D.gerarPlano([diagFormula(42)], {});
  const a = p.acoes[0];
  assert.strictEqual(a.diagnostic_id, 'FORMULA_AUSENTE');
  assert.strictEqual(a.regra.rule_id, 'ARCA-PIP-001');
  assert.strictEqual(a.aba, 'ago.2026');
  assert.strictEqual(a.range, 'ago.2026!FORMULA42');
  assert.strictEqual(a.valor_proposto, '=SOMA(A2:A5)');
  assert.strictEqual(a.classe, 'CONFIRM_FIX');
  assert.ok(a.justificativa && a.justificativa.indexOf('FORMULA_AUSENTE') !== -1);
});

// ---------- 5. problemas detectados ----------
test('conflito de alvo (mesma celula, valores diferentes) bloqueia as acoes e a execucao', () => {
  const p = D.gerarPlano([diagFormula(42, '=SOMA(A2:A5)'), diagFormula(42, '=SOMA(A2:A9)')], {});
  assert.ok(p.problemas.some(x => x.tipo === 'CONFLITO_DE_ALVO'));
  assert.strictEqual(p.resumo.mutaveis, 0);
  const aut = D.autorizarExecucao(p, { kill_switch: false, lock_adquirido: true, dry_run_executado: true, snapshot_disponivel: true, reauditoria_disponivel: true });
  assert.strictEqual(aut.autorizado, false);
  assert.ok(aut.motivos.indexOf('CONFLITO_DE_ALVO_NO_PLANO') !== -1);
});

test('ambiguidade (mesma celula, mesmo valor em dois diagnosticos) e sinalizada', () => {
  const p = D.gerarPlano([diagFormula(42), diagFormula(42)], {});
  assert.ok(p.problemas.some(x => x.tipo === 'AMBIGUIDADE_DE_ALVO'));
});

test('alvo fora da whitelist aparece como problema e nao entra em mutaveis', () => {
  const p = D.gerarPlano([{
    codigoRegra: 'MIKE_BOE_DIVERGENTE', aba: 'ago.2026', linha: 10, coluna: 'MIKE',
    diagnostico: 'MIKE divergente do BOE.', valorProposto: '202609011653443710', arca: arcaOk
  }], {});
  assert.ok(p.problemas.some(x => x.tipo === 'ALVO_FORA_DA_WHITELIST' || x.tipo === 'BLOQUEIO_CONTRATO'));
  assert.strictEqual(p.resumo.mutaveis, 0);
  assert.strictEqual(p.resumo.por_classe.MANUAL_ONLY, 1);
});

test('fonte insuficiente: formula sem valor canonico e sem resolvedor bloqueia', () => {
  const d = diagFormula(42, null);
  const p = D.gerarPlano([d], {});
  assert.ok(p.problemas.some(x => x.tipo === 'FONTE_INSUFICIENTE'));
  assert.strictEqual(p.resumo.mutaveis, 0);
});

test('fonte insuficiente e resolvida por resolvedor explicito e deterministico', () => {
  const d = diagFormula(42, null);
  const resolver = (diag) => (diag.codigoRegra === 'FORMULA_AUSENTE' ? '=SOMA(A2:A5)' : null);
  const p1 = D.gerarPlano([d], { resolverValorCanonico: resolver });
  const p2 = D.gerarPlano([d], { resolverValorCanonico: resolver });
  assert.strictEqual(p1.resumo.mutaveis, 1);
  assert.strictEqual(p1.plano_id, p2.plano_id);
});

test('coluna de alerta (AM) e blacklist permanecem bloqueadas no plano', () => {
  const p = D.gerarPlano([
    { codigoRegra: 'FORMULA_AUSENTE', aba: 'ago.2026', linha: 5, coluna: 'AM', diagnostico: 'x', valorProposto: 'y', arca: arcaOk },
    { codigoRegra: 'FORMULA_AUSENTE', aba: 'ago.2026', linha: 6, coluna: 'MATRICULA', diagnostico: 'x', valorProposto: 'y', arca: arcaOk }
  ], {});
  assert.strictEqual(p.resumo.mutaveis, 0);
});

test('limite de lote excedido e sinalizado e trava a autorizacao (kill-switch do executor)', () => {
  const entrada = [diagFormula(42), diagFormula(43), diagFormula(44)];
  const p = D.gerarPlano(entrada, { maxAcoes: 2 });
  assert.strictEqual(p.limites.excedeu_limite, true);
  assert.ok(p.problemas.some(x => x.tipo === 'LIMITE_EXCEDIDO'));
  const aut = D.autorizarExecucao(p, { kill_switch: false, lock_adquirido: true, dry_run_executado: true, snapshot_disponivel: true, reauditoria_disponivel: true });
  assert.strictEqual(aut.autorizado, false);
  assert.ok(aut.motivos.indexOf('LIMITE_DE_LOTE_EXCEDIDO') !== -1);
});

// ---------- 6. resumo, preview e autorizacao ----------
test('resumo consolida contagem por classe e exigencias globais', () => {
  const p = D.gerarPlano([diagFormula(42), diagFormula(43), { codigoRegra: 'MATRICULA_AUSENTE', aba: 'ago.2026', linha: 7, coluna: 'MATRICULA', diagnostico: 'sem matricula', valorProposto: '123', arca: arcaOk }], {});
  assert.strictEqual(p.resumo.total_acoes, 3);
  assert.strictEqual(p.resumo.por_classe.CONFIRM_FIX, 2);
  assert.strictEqual(p.resumo.por_classe.MANUAL_ONLY, 1);
  assert.strictEqual(p.resumo.mutaveis, 2);
  ['DRY_RUN_OBRIGATORIO', 'LOCK_SINGLE_FLIGHT', 'SNAPSHOT_ANTES', 'KILL_SWITCH_RESPEITADO', 'REAUDITORIA_APOS', 'NOVOS_ERROS_CRIADOS_IGUAL_ZERO'].forEach(ex => {
    assert.ok(p.exigencias_globais.indexOf(ex) !== -1, 'exigencia ausente: ' + ex);
  });
});

test('preview legivel mostra classe, endereco, transicao de valor e regra', () => {
  const p = D.gerarPlano([diagFormula(42)], {});
  const texto = p.preview.join('\n');
  assert.ok(texto.indexOf('dry-run') !== -1);
  assert.ok(texto.indexOf('ago.2026!FORMULA42') !== -1);
  assert.ok(texto.indexOf('CONFIRM_FIX') !== -1);
  assert.ok(texto.indexOf('ARCA-PIP-001') !== -1);
  assert.ok(texto.indexOf('=SOMA(A2:A5)') !== -1);
});

test('autorizacao exige todas as travas do contrato + plano sem problema critico', () => {
  const p = D.gerarPlano([diagFormula(42)], {});
  const negado = D.autorizarExecucao(p, {});
  assert.strictEqual(negado.autorizado, false);
  assert.ok(negado.motivos.length >= 4);
  const ok = D.autorizarExecucao(p, { kill_switch: false, lock_adquirido: true, dry_run_executado: true, snapshot_disponivel: true, reauditoria_disponivel: true });
  assert.strictEqual(ok.autorizado, true, 'motivos: ' + ok.motivos.join(', '));
});

console.log(`\nRESULTADOS FINAIS: ${sucessos} PASS / ${falhas} FAIL`);
if (falhas > 0) process.exitCode = 1;
}
