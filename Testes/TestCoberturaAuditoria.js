'use strict';
if (typeof require === 'undefined') { /* Ignora no Apps Script */ } else {

/**
 * ARQUIVO: Testes/TestCoberturaAuditoria.js
 * DESCRICAO: Suite de cobertura de auditoria (G01 #115): o que NAO pôde ser verificado
 * deve aparecer como NAO_AUDITADO/limitacao explicita - nunca falso verde.
 */

const assert = require('assert');
const { CoberturaAuditoria } = require('../Core/CoberturaAuditoria');

console.log('Iniciando Testes: Cobertura de Auditoria do Guardiao (G01 #115)...\n');

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

function criarDiag(codigoRegra, arcaStatus) {
  return { codigoRegra, severidade: 'ALERTA', arca: arcaStatus ? { status: arcaStatus } : undefined };
}

// ---------- montarCobertura ----------
test('catalogo PIP ausente -> PARCIAL com CATALOGO_PIP_INDISPONIVEL', () => {
  const c = CoberturaAuditoria.montarCobertura({ catalogoPIP: null, resPeculio: { mapa: {}, mapaCompleto: {} }, diagnosticos: [] });
  assert.strictEqual(c.status, 'PARCIAL');
  assert.ok(c.regrasNaoAuditadas.some(r => r.regra === 'VALIDACAO_INDICADOR_PIP' && r.tipo === 'LIMITACAO_DE_AUDITORIA'));
});

test('catalogo PIP presente e tudo avaliado -> COMPLETA', () => {
  const c = CoberturaAuditoria.montarCobertura({ catalogoPIP: ['PORTE ILEGAL'], resPeculio: { mapa: {} }, diagnosticos: [] });
  assert.strictEqual(c.status, 'COMPLETA');
  assert.strictEqual(c.regrasNaoAuditadas.length, 0);
});

test('fonte antiguidade com erro -> PARCIAL MERITO_ARMAS_ANTIGUIDADE', () => {
  const c = CoberturaAuditoria.montarCobertura({ catalogoPIP: ['X'], resPeculio: { erro: 'ANTIGUIDADE_FONTE_NAO_LOCALIZADA' }, diagnosticos: [] });
  assert.ok(c.regrasNaoAuditadas.some(r => r.regra === 'MERITO_ARMAS_ANTIGUIDADE'));
});

test('diagnostico sem mapeamento ARCA -> LACUNA_ARCA listada', () => {
  const c = CoberturaAuditoria.montarCobertura({
    catalogoPIP: ['X'], resPeculio: { mapa: {} },
    diagnosticos: [criarDiag('TUNEL_FRAGMENTADO', 'ARCA_RULE_NOT_MAPPED')]
  });
  assert.ok(c.regrasNaoAuditadas.some(r => r.tipo === 'LACUNA_ARCA' && r.motivo.includes('TUNEL_FRAGMENTADO')));
});

test('codigos de verificabilidade NAO geram LACUNA_ARCA duplicada', () => {
  const c = CoberturaAuditoria.montarCobertura({
    catalogoPIP: null, resPeculio: { mapa: {} },
    diagnosticos: [criarDiag('MODO_LIMITADO_CATALOGO_PIP', 'ARCA_RULE_NOT_MAPPED'), criarDiag('FATO_NAO_AUDITAVEL_AUTOMATICAMENTE', 'ARCA_RULE_NOT_MAPPED')]
  });
  assert.ok(!c.regrasNaoAuditadas.some(r => r.tipo === 'LACUNA_ARCA'));
});

test('diagnosticos com ARCA mapeada nao geram lacuna', () => {
  const c = CoberturaAuditoria.montarCobertura({
    catalogoPIP: ['X'], resPeculio: { mapa: {} },
    diagnosticos: [criarDiag('OCORRENCIA_ORFA', 'ARCA-ORFA-001'), criarDiag('FORMULA_AUSENTE')]
  });
  assert.strictEqual(c.status, 'COMPLETA');
});

// ---------- matricula multipla na mesma data ----------
function criarDiagCtx(opts) {
  return {
    severidade: opts.severidade,
    codigoRegra: opts.codigoRegra,
    linha: opts.linha,
    tunel: opts.tunel || '',
    diagnostico: opts.diagnostico,
    evidencia: opts.evidencia || '',
    acaoRecomendada: opts.acaoRecomendada || ''
  };
}

test('detecta matricula em 2 MIKEs na mesma data -> OBSERVACAO', () => {
  const mapa = {
    '123': { linhas: [{ linha: 2, data: '15/07/2026', mike: '26E100' }, { linha: 3, data: '15/07/2026', mike: '26E200' }] }
  };
  const diags = CoberturaAuditoria.detectarMatriculaMultiplaNaMesmaData(mapa, criarDiagCtx);
  assert.strictEqual(diags.length, 1);
  assert.strictEqual(diags[0].codigoRegra, 'MATRICULA_MULTIPLAS_OCORRENCIAS_MESMA_DATA');
  assert.strictEqual(diags[0].severidade, 'OBSERVACAO');
});

test('matricula em dias diferentes NAO gera alerta', () => {
  const mapa = {
    '123': { linhas: [{ linha: 2, data: '15/07/2026', mike: '26E100' }, { linha: 9, data: '20/07/2026', mike: '26E200' }] }
  };
  assert.strictEqual(CoberturaAuditoria.detectarMatriculaMultiplaNaMesmaData(mapa, criarDiagCtx).length, 0);
});

test('matricula em mesmo MIKE (mesmo tunel) NAO gera alerta', () => {
  const mapa = {
    '123': { linhas: [{ linha: 2, data: '15/07/2026', mike: '26E100' }, { linha: 3, data: '15/07/2026', mike: '26E100' }] }
  };
  assert.strictEqual(CoberturaAuditoria.detectarMatriculaMultiplaNaMesmaData(mapa, criarDiagCtx).length, 0);
});

test('mapa vazio nao estoura', () => {
  const c = CoberturaAuditoria.montarCobertura({ catalogoPIP: ['X'], resPeculio: { mapa: {} }, diagnosticos: [] });
  assert.strictEqual(c.status, 'COMPLETA');
  assert.strictEqual(CoberturaAuditoria.detectarMatriculaMultiplaNaMesmaData({}, criarDiagCtx).length, 0);
});

console.log(`\nRESULTADOS FINAIS: ${sucessos} PASS / ${falhas} FAIL`);
if (falhas > 0) process.exit(1);
}
