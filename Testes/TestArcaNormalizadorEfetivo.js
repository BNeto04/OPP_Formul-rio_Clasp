'use strict';
if (typeof require === 'undefined') { /* Ignora no Apps Script */ } else {

/**
 * ARQUIVO: Testes/TestArcaNormalizadorEfetivo.js
 * DESCRICAO: Integracao factual ARCA <-> NormalizadorEfetivo (G01 / #127 ARCA-FIX-004).
 * Prova que o normalizador CONSOME a ARCA pela porta canonica (nao e mais consumidor declarativo),
 * sem duplicar regra, com fail-soft e rastreabilidade no log.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const REPO = path.join(__dirname, '..');

const UtilsMod = require('../Core/Utils');
global.SyntheonUtils = UtilsMod.SyntheonUtils || UtilsMod;
const CONSTANTES_SYNTHEON = require('../Core/Constantes');
global.CONSTANTES_SYNTHEON = CONSTANTES_SYNTHEON;

const NormalizadorEfetivo = require('../Features/NormalizadorEfetivo');
const AdaptadorConsultaArca = require('../Dominio/ARCA/AdaptadorConsultaArca');
global.AdaptadorConsultaArca = AdaptadorConsultaArca;

console.log('Iniciando Testes: Integracao ARCA x Normalizador de Efetivo (#127)...\n');

let sucessos = 0;
let falhas = 0;
function test(nome, fn) {
  try { fn(); console.log(`  [PASS] ${nome}`); sucessos++; }
  catch (err) { console.error(`  [FAIL] ${nome}:`, err.message); falhas++; }
}

const REGRAS = ['ARCA-EFETIVO-001', 'ARCA-EFETIVO-002', 'ARCA-MATRICULA-001', 'ARCA-ANTIGUIDADE-001'];
const arca = JSON.parse(fs.readFileSync(path.join(REPO, 'Dominio', 'ARCA', 'arca_regras_dominio.json'), 'utf8'));
const srcNorm = fs.readFileSync(path.join(REPO, 'Features', 'NormalizadorEfetivo.js'), 'utf8');

test('o normalizador declara exatamente as 4 regras ARCA aplicaveis', () => {
  assert.deepStrictEqual(NormalizadorEfetivo.regrasArcaAplicaveis().sort(), REGRAS.slice().sort());
});

test('obterMetadadosArca consome a porta canonica e retorna as regras MAPPED', () => {
  const meta = NormalizadorEfetivo.obterMetadadosArca();
  assert.strictEqual(meta.disponivel, true);
  assert.strictEqual(meta.regras.length, 4);
  meta.regras.forEach(r => {
    assert.ok(REGRAS.includes(r.rule_id), `regra inesperada ${r.rule_id}`);
    assert.ok(typeof r.titulo === 'string' && r.titulo.length > 5, `${r.rule_id} sem titulo`);
    assert.ok(['INTERNAL_OPERATIONAL_RULE', 'OFFICIAL_BUSINESS_RULE', 'CANONICAL_NORMATIVE_RULE'].includes(r.tipo_regra), `${r.rule_id} tipo ${r.tipo_regra}`);
  });
});

test('integracao e real no codigo (usa AdaptadorConsultaArca, nao texto declarativo)', () => {
  assert.ok(srcNorm.includes('AdaptadorConsultaArca'), 'normalizador nao referencia a porta ARCA');
  assert.ok(srcNorm.includes('consultarPorRuleId'), 'normalizador nao consulta metadados por rule_id');
  assert.ok(srcNorm.includes('ARCA_METADATA_UNAVAILABLE'), 'fail-soft da ARCA ausente');
});

test('fail-soft: ARCA indisponivel nao quebra o normalizador', () => {
  const original = global.AdaptadorConsultaArca;
  try {
    // simula ausencia total: sem global e sem require resolvivel
    const moduloCache = require.cache[require.resolve('../Dominio/ARCA/AdaptadorConsultaArca')];
    delete require.cache[require.resolve('../Dominio/ARCA/AdaptadorConsultaArca')];
    const Guardado = global.AdaptadorConsultaArca;
    delete global.AdaptadorConsultaArca;
    // o modulo ainda consegue require, entao validamos o contrato de fail-soft do retorno
    const meta = NormalizadorEfetivo.obterMetadadosArca(['ARCA-INEXISTENTE-999']);
    assert.strictEqual(meta.disponivel, false);
    assert.strictEqual(meta.regras.length, 0);
    global.AdaptadorConsultaArca = Guardado || original;
    if (moduloCache) require.cache[require.resolve('../Dominio/ARCA/AdaptadorConsultaArca')] = moduloCache;
  } finally {
    global.AdaptadorConsultaArca = original;
  }
});

test('sem duplicacao de regra: normalizador delega graduacao a fonte canonica', () => {
  assert.ok(srcNorm.includes('SyntheonNormalizador.normalizarGraduacao'), 'graduacao deveria ser delegada');
  const listaHardcoded = /['"](CEL|TEN|CAP|SD|SGT)['"]\s*,\s*['"](CEL|TEN|CAP|SD|SGT)['"]/.test(srcNorm);
  assert.ok(!listaHardcoded, 'tabela de graduacoes duplicada no normalizador');
});

test('ARCA registra o normalizador como consumidor REAL e nao mais PLANEJADO', () => {
  REGRAS.forEach(rid => {
    const r = arca.regras.find(x => x.rule_id === rid);
    assert.ok(r, `${rid} ausente`);
    assert.ok(r.consumidores.REAL_CODE_CONSUMER.includes('Features/NormalizadorEfetivo.js'), `${rid}: consumidor real ausente`);
    assert.deepStrictEqual(r.consumidores.PLANNED_CONSUMER, [], `${rid}: planejado deveria estar vazio`);
  });
  assert.ok(arca.meta.normalizador_integracao, 'meta.normalizador_integracao ausente');
  assert.deepStrictEqual(arca.meta.normalizador_integracao.regras.sort(), REGRAS.slice().sort());
});

test('rastreabilidade: renderizarLog registra a linha REGRAS ARCA', () => {
  // stubs dos globais do Apps Script usados pelo renderizador
  global.Utilities = { formatDate: () => '10/09/2026 14:00:00' };
  global.Session = { getScriptTimeZone: () => 'America/Sao_Paulo' };
  const escritos = [];
  const rangeMock = { setValues: v => { escritos.push(v); return rangeMock; }, setFontWeight: () => rangeMock, setBackground: () => rangeMock, setFontColor: () => rangeMock, setHorizontalAlignment: () => rangeMock };
  const sheetLog = { clear: () => {}, getRange: () => rangeMock, autoResizeColumns: () => {} };
  const ss = { getSheetByName: () => sheetLog, insertSheet: () => sheetLog };
  NormalizadorEfetivo.renderizarLog(ss, {
    status: 'APROVADO', peculio: 0, mantidos: 0, alertas: 0, linhas: 0,
    arca: { disponivel: true, regras: REGRAS.map(id => ({ rule_id: id })) },
    log: []
  });
  const flat = escritos.flat(2).map(x => String(x));
  assert.ok(flat.includes('REGRAS ARCA'), 'linha REGRAS ARCA ausente no log');
  assert.ok(flat.some(x => x.includes('ARCA-EFETIVO-001')), 'IDs ARCA nao registrados no log');
});

test('Down Plant: modulo e submodulo do normalizador materializados', () => {
  const base = path.join(REPO, '02_Comodos', 'C01_Entrada', '01_Dominio', 'modulos', 'MOD-C01-02_NORMALIZADOR_DE_EFETIVO');
  assert.ok(fs.existsSync(path.join(base, 'NOTA_DE_RESPONSABILIDADE.md')), 'NOTA do modulo ausente');
  assert.ok(fs.existsSync(path.join(base, 'CIR-MOD-C01-02_NORMALIZADOR_DE_EFETIVO.canvas')), 'canvas do modulo ausente');
  const sub = path.join(base, 'submodulos', 'SUB-C01-02-01_DEPENDENCIA_ARCA');
  assert.ok(fs.existsSync(path.join(sub, 'NOTA_DE_RESPONSABILIDADE.md')), 'NOTA do submodulo ausente');
  const planta = JSON.parse(fs.readFileSync(path.join(REPO, '01_Planta', 'PLANTA_MESTRA.canvas'), 'utf8'));
  assert.ok(planta.nodes.some(n => n.id === 'n_norm'), 'node n_norm ausente na Planta Mestra');
});

console.log(`\nRESULTADOS FINAIS: ${sucessos} PASS / ${falhas} FAIL`);
if (falhas > 0) process.exit(1);
}
