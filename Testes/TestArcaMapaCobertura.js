'use strict';
if (typeof require === 'undefined') { /* Ignora no Apps Script */ } else {

/**
 * ARQUIVO: Testes/TestArcaMapaCobertura.js
 * DESCRICAO: Cobertura Guardiao <-> ARCA (G01 / #126 ARCA-FIX-003).
 * Garante que NENHUM codigo de diagnostico emitido pelo codigo fica sem regra ARCA,
 * que os codigos G01 passaram a ser mapeados (fim do LACUNA_ARCA estrutural) e que
 * toda regra declara auditabilidade explicita (MAPEADO | NAO_AUDITAVEL com motivo).
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const REPO = path.join(__dirname, '..');

const UtilsMod = require('../Core/Utils');
global.SyntheonUtils = UtilsMod.SyntheonUtils || UtilsMod;

const AdaptadorConsultaArca = require('../Dominio/ARCA/AdaptadorConsultaArca');

console.log('Iniciando Testes: Mapa de Cobertura Guardiao x ARCA (#126)...\n');

let sucessos = 0;
let falhas = 0;
function test(nome, fn) {
  try { fn(); console.log(`  [PASS] ${nome}`); sucessos++; }
  catch (err) { console.error(`  [FAIL] ${nome}:`, err.message); falhas++; }
}

const arca = JSON.parse(fs.readFileSync(path.join(REPO, 'Dominio', 'ARCA', 'arca_regras_dominio.json'), 'utf8'));
const regras = arca.regras;
const adaptadorSrc = fs.readFileSync(path.join(REPO, 'Dominio', 'ARCA', 'AdaptadorConsultaArca.js'), 'utf8');
const mapaCodigoRegra = {};
(adaptadorSrc.match(/'([A-Z0-9_]{4,})':\s*'(ARCA-[A-Z0-9\-]+)'/g) || []).forEach(m => {
  const [, cod, rid] = m.match(/'([A-Z0-9_]{4,})':\s*'(ARCA-[A-Z0-9\-]+)'/);
  mapaCodigoRegra[cod] = rid;
});

function codigosEmitidosNoCodigo() {
  const arquivos = ['Core/RegrasQualidade.js', 'Features/GuardiaoQualidade.js', 'Core/SaudeTuneis.js', 'Core/CoberturaAuditoria.js'];
  const achados = new Set();
  arquivos.forEach(f => {
    const src = fs.readFileSync(path.join(REPO, f), 'utf8');
    (src.match(/codigoRegra:\s*'([A-Z0-9_]+)'/g) || []).forEach(m => {
      achados.add(m.match(/'([A-Z0-9_]+)'/)[1]);
    });
  });
  return achados;
}

test('nenhum codigo de diagnostico do Guardiao fica sem regra ARCA (fim do LACUNA_ARCA estrutural)', () => {
  const emitidos = codigosEmitidosNoCodigo();
  const semRegra = [...emitidos].filter(c => !mapaCodigoRegra[c]);
  assert.deepStrictEqual(semRegra, [], 'codigos sem regra: ' + semRegra.join(', '));
  assert.ok(emitidos.size >= 29, 'esperado ao menos 29 codigos emitidos, obtido ' + emitidos.size);
});

test('os 3 codigos G01 passaram a ter regra ARCA dedicada', () => {
  assert.strictEqual(mapaCodigoRegra['TUNEL_FRAGMENTADO'], 'ARCA-MIKE-004');
  assert.strictEqual(mapaCodigoRegra['POLICIAL_SEM_NOME'], 'ARCA-EFETIVO-003');
  assert.strictEqual(mapaCodigoRegra['MATRICULA_MULTIPLAS_OCORRENCIAS_MESMA_DATA'], 'ARCA-MATRICULA-003');
  ['ARCA-MIKE-004', 'ARCA-EFETIVO-003', 'ARCA-MATRICULA-003'].forEach(rid => {
    assert.ok(regras.some(r => r.rule_id === rid), `${rid} ausente do catalogo`);
  });
});

test('porta ARCA responde MAPPED (nao ARCA_RULE_NOT_MAPPED) para os codigos G01', () => {
  ['TUNEL_FRAGMENTADO', 'POLICIAL_SEM_NOME', 'MATRICULA_MULTIPLAS_OCORRENCIAS_MESMA_DATA'].forEach(cod => {
    const meta = AdaptadorConsultaArca.enriquecerDiagnostico(cod, {});
    assert.notStrictEqual(meta.status, 'ARCA_RULE_NOT_MAPPED', `${cod} ainda sem mapeamento`);
    assert.ok(meta.rule_id && meta.rule_id.startsWith('ARCA-'), `${cod} sem rule_id`);
  });
});

test('toda regra declara auditabilidade explicita (MAPEADO | NAO_AUDITAVEL com motivo)', () => {
  regras.forEach(r => {
    const a = r.auditabilidade_guardiao;
    assert.ok(a, `${r.rule_id}: auditabilidade ausente`);
    assert.ok(['MAPEADO', 'NAO_AUDITAVEL'].includes(a.status), `${r.rule_id}: status invalido ${a.status}`);
    assert.ok(typeof a.motivo === 'string' && a.motivo.length > 20, `${r.rule_id}: motivo ausente/curto`);
    if (a.status === 'MAPEADO' && a.codigos.length > 0) {
      a.codigos.forEach(c => assert.ok(mapaCodigoRegra[c] === r.rule_id, `${r.rule_id}: codigo ${c} nao aponta para ela`));
    }
  });
});

test('contagens de cobertura conferem com o meta do catalogo', () => {
  const mapeadas = regras.filter(r => r.auditabilidade_guardiao.status === 'MAPEADO').length;
  const naoAud = regras.filter(r => r.auditabilidade_guardiao.status === 'NAO_AUDITAVEL').length;
  assert.strictEqual(regras.length, 41, 'total de regras deveria ser 41 (40 + ARCA-VEICULO-001 do #137)');
  assert.strictEqual(arca.meta.cobertura_reconciliacao.regras_mapeadas, mapeadas);
  assert.strictEqual(arca.meta.cobertura_reconciliacao.regras_nao_auditaveis, naoAud);
  assert.strictEqual(mapeadas + naoAud, 41);
  assert.strictEqual(mapeadas, 26);
  assert.strictEqual(naoAud, 15, 'ARCA-VEICULO-001 (#137) entra como NAO_AUDITAVEL com motivo');
});

test('nenhuma heuristica foi promovida a regra oficial na reconciliacao', () => {
  const adicionadas = arca.meta.cobertura_reconciliacao.regras_adicionadas_total || arca.meta.cobertura_reconciliacao.regras_adicionadas;
  assert.ok(adicionadas.length === 10, 'esperado 10 regras adicionadas (#126: 5 + #128: 4 + #137: 1)');
  adicionadas.forEach(rid => {
    const r = regras.find(x => x.rule_id === rid);
    assert.ok(['INTERNAL_OPERATIONAL_RULE', 'TECHNICAL_RULE'].includes(r.tipo_regra), `${rid}: tipo ${r.tipo_regra} nao permitido`);
    assert.notStrictEqual(r.tipo_regra, 'OFFICIAL_BUSINESS_RULE');
    assert.ok(r.evidencia_codigo.length > 0 && r.evidencia_testes.length > 0, `${rid}: sem evidencia de codigo/teste`);
  });
});

test('docs refletem o catalogo: MD com secao de todas as 36 regras', () => {
  const md = fs.readFileSync(path.join(REPO, 'Dominio', 'ARCA', 'ARCA_REGRAS_DOMINIO.md'), 'utf8');
  const faltando = regras.map(r => r.rule_id).filter(rid => md.indexOf(`[${rid}]`) === -1);
  assert.deepStrictEqual(faltando, [], 'sem secao no MD: ' + faltando.join(', '));
});

test('docs refletem cobertura: ARCA_COBERTURA com subdominio AUDITORIA e nota de reconciliacao', () => {
  const cov = fs.readFileSync(path.join(REPO, 'Dominio', 'ARCA', 'ARCA_COBERTURA.md'), 'utf8');
  assert.ok(cov.includes('AUDITORIA'), 'linha AUDITORIA ausente');
  assert.ok(cov.includes('#126'), 'nota de reconciliacao ausente');
});

test('docs refletem fontes: ARCA_FONTES lista as regras adicionadas', () => {
  const fnt = fs.readFileSync(path.join(REPO, 'Dominio', 'ARCA', 'ARCA_FONTES.md'), 'utf8');
  arca.meta.cobertura_reconciliacao.regras_adicionadas.forEach(rid => {
    assert.ok(fnt.includes(rid), `${rid} ausente em ARCA_FONTES.md`);
  });
});

test('varredura exaustiva (#128): metadados e reconciliacao comprovados', () => {
  const v = arca.meta.varredura_exaustiva;
  assert.ok(v, 'meta.varredura_exaustiva ausente');
  assert.strictEqual(v.universo.arquivos_totais_repo, 3413);
  assert.strictEqual(v.universo.arquivos_varridos_dominio_js, 127);
  assert.strictEqual(v.lacunas_detectadas, 6);
  assert.strictEqual(v.lacunas_resolvidas, 6);
  assert.strictEqual(v.lacunas_aceitas, 0);
  assert.strictEqual(v.regras_adicionadas.length, 4);
  // os arquivos que eram lacuna passaram a constar em evidencia_codigo de alguma regra
  const arquivosCitados = new Set();
  regras.forEach(r => (r.evidencia_codigo || []).forEach(e => arquivosCitados.add(String(e).split(':')[0].trim())));
  ['Dominio/OcorrenciaFactory.js', 'Motor/MotorAnaliticoV2.js', 'Motor/DiagnosticoDeterministicoGxt.js', 'Dominio/ARCA/AdaptadorConsultaArca.js'].forEach(f => {
    assert.ok(arquivosCitados.has(f), `${f} continua sem regra ARCA`);
  });
});

test('nenhuma regra orfa: toda regra tem evidencia de codigo existente no repositorio', () => {
  const orfas = [];
  regras.forEach(r => {
    (r.evidencia_codigo || []).forEach(e => {
      const arquivo = String(e).split(':')[0].replace(/\(.*\)\s*$/, '').trim();
      if (arquivo && !fs.existsSync(path.join(REPO, arquivo))) orfas.push(`${r.rule_id} -> ${arquivo}`);
    });
  });
  assert.deepStrictEqual(orfas, [], 'evidencias apontando para arquivos inexistentes: ' + orfas.join('; '));
});

console.log(`\nRESULTADOS FINAIS: ${sucessos} PASS / ${falhas} FAIL`);
if (falhas > 0) process.exit(1);
}
