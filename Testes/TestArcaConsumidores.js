'use strict';
if (typeof require === 'undefined') { /* Ignora no Apps Script */ } else {

/**
 * ARQUIVO: Testes/TestArcaConsumidores.js
 * DESCRICAO: Consistencia da reconciliacao de consumidores da ARCA (G01 / #125 ARCA-FIX-002).
 * Garante que cada regra tem mapa factual (REAL/INDIRETO/DECLARADO/PLANEJADO), que os caminhos
 * citados existem no repositorio e que a lista declarada original foi preservada.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const REPO = path.join(__dirname, '..');
const JSON_PATH = path.join(REPO, 'Dominio', 'ARCA', 'arca_regras_dominio.json');
const MD_PATH = path.join(REPO, 'Dominio', 'ARCA', 'ARCA_REGRAS_DOMINIO.md');

console.log('Iniciando Testes: Consumidores da ARCA (reconciliacao #125)...\n');

let sucessos = 0;
let falhas = 0;
function test(nome, fn) {
  try { fn(); console.log(`  [PASS] ${nome}`); sucessos++; }
  catch (err) { console.error(`  [FAIL] ${nome}:`, err.message); falhas++; }
}

const arca = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
const regras = arca.regras;
const md = fs.readFileSync(MD_PATH, 'utf8');
const CHAVES = ['REAL_CODE_CONSUMER', 'INDIRECT_CONSUMER', 'DECLARED_CONSUMER', 'PLANNED_CONSUMER'];

test('catalogo tem 31 regras e registro de metodo da reconciliacao', () => {
  assert.strictEqual(regras.length, 36);
  assert.ok(arca.meta.consumidores_reconciliacao, 'meta.consumidores_reconciliacao ausente');
  assert.ok(String(arca.meta.consumidores_reconciliacao.card).includes('#125'));
});

test('toda regra tem consumidores estruturado nas 4 classes + OBSERVACAO', () => {
  regras.forEach(r => {
    const c = r.consumidores;
    assert.ok(c && typeof c === 'object' && !Array.isArray(c), `${r.rule_id}: consumidores nao estruturado`);
    CHAVES.forEach(k => assert.ok(Array.isArray(c[k]), `${r.rule_id}: ${k} nao e lista`));
    assert.ok(typeof c.OBSERVACAO === 'string' && c.OBSERVACAO.length > 10, `${r.rule_id}: OBSERVACAO ausente`);
  });
});

test('toda regra tem ao menos 1 consumidor REAL de codigo', () => {
  regras.forEach(r => {
    assert.ok(r.consumidores.REAL_CODE_CONSUMER.length >= 1, `${r.rule_id}: sem consumidor real`);
  });
});

test('caminhos citados existem de fato no repositorio', () => {
  const faltando = [];
  regras.forEach(r => {
    const c = r.consumidores;
    [...c.REAL_CODE_CONSUMER, ...c.INDIRECT_CONSUMER, ...c.PLANNED_CONSUMER].forEach(p => {
      if (!fs.existsSync(path.join(REPO, p))) faltando.push(`${r.rule_id} -> ${p}`);
    });
  });
  assert.deepStrictEqual(faltando, [], 'caminhos inexistentes: ' + faltando.join('; '));
});

test('lista declarada original foi preservada (historico/proveniencia)', () => {
  const comGuardiao = regras.filter(r => r.consumidores.DECLARED_CONSUMER.includes('GuardiaoQualidade')).length;
  assert.ok(comGuardiao >= 20, `esperado >=20 regras com GuardiaoQualidade declarado, obtido ${comGuardiao}`);
  const algumDeclarado = regras.filter(r => r.consumidores.DECLARED_CONSUMER.length > 0).length;
  assert.strictEqual(algumDeclarado, 31, 'toda regra deve preservar a lista declarada');
});

test('gap explicito: NAO_AUDITAVEL nao declara consumidor indireto; MAPEADO com codigo flui pelo caminho', () => {
  const adaptador = fs.readFileSync(path.join(REPO, 'Dominio', 'ARCA', 'AdaptadorConsultaArca.js'), 'utf8');
  const idsMapeados = new Set((adaptador.match(/'ARCA-[A-Z0-9\-]+'/g) || []).map(s => s.replace(/'/g, '')));
  regras.forEach(r => {
    const a = r.auditabilidade_guardiao;
    if (a.status === 'NAO_AUDITAVEL') {
      assert.deepStrictEqual(r.consumidores.INDIRECT_CONSUMER, [], `${r.rule_id}: NAO_AUDITAVEL nao deve ter indireto`);
      assert.ok(a.motivo.length > 20, `${r.rule_id}: NAO_AUDITAVEL exige motivo`);
    } else if (a.codigos.length > 0) {
      assert.ok(idsMapeados.has(r.rule_id), `${r.rule_id}: MAPEADO com codigo deve estar na porta`);
      assert.ok(r.consumidores.INDIRECT_CONSUMER.length > 0, `${r.rule_id}: MAPEADO com codigo deve ter propagacao`);
    } else {
      // regra tecnica do proprio auditor (ARCA-AUDITORIA-00x): descreve comportamento, sem codigo
      assert.ok(r.rule_id.startsWith('ARCA-AUDITORIA-'), `${r.rule_id}: MAPEADO sem codigo so para regras tecnicas do auditor`);
    }
  });
  assert.ok(regras.filter(r => r.auditabilidade_guardiao.status === 'NAO_AUDITAVEL').length >= 1);
});

test('integracao do NormalizadorEfetivo e REAL nas regras de efetivo/matricula/antiguidade (#127)', () => {
  ['ARCA-EFETIVO-001', 'ARCA-EFETIVO-002', 'ARCA-MATRICULA-001', 'ARCA-ANTIGUIDADE-001'].forEach(rid => {
    const r = regras.find(x => x.rule_id === rid);
    assert.ok(r.consumidores.REAL_CODE_CONSUMER.includes('Features/NormalizadorEfetivo.js'), `${rid}: consumidor real ausente`);
    assert.deepStrictEqual(r.consumidores.PLANNED_CONSUMER, [], `${rid}: planejado deveria estar vazio apos #127`);
  });
});

test('MD traz a visao reconciliada em todas as 36 regras', () => {
  const ids = regras.map(r => r.rule_id);
  const faltando = ids.filter(rid => {
    const i = md.indexOf(`[${rid}]`);
    if (i === -1) return true;
    const bloco = md.slice(i, i + 6000);
    return !bloco.includes('reconciliado #125');
  });
  assert.deepStrictEqual(faltando, [], 'sem linha reconciliada: ' + faltando.join(', '));
});

test('MD referencia a nota de reconciliacao das tabelas declaradas', () => {
  assert.ok(md.includes('Nota (#125 ARCA-FIX-002)'), 'nota de reconciliacao ausente no MD');
});

console.log(`\nRESULTADOS FINAIS: ${sucessos} PASS / ${falhas} FAIL`);
if (falhas > 0) process.exit(1);
}
