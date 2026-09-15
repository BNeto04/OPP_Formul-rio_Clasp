'use strict';
if (typeof require === 'undefined') { /* Ignora no Apps Script */ } else {

/**
 * ARQUIVO: Testes/TestGateRetomada.js
 * CARD:    #170 [DP24-007] - FECHADURA do instrumento `scripts/downplant/gate-retomada.mjs`
 *          (métricas §38 + gate formal de retomada §21.2).
 *
 * O QUE ESTA FECHADURA IMPEDE (regras determinadas pelo Planner em 15/09/2026):
 *   1. gate que "mede" e nao declara o resultado de forma objetiva (placar + exit code coerente);
 *   2. gate que INVENTA valor para a Condicao 2: sem fonte canonica legivel por maquina de Auditorias,
 *      a saida tem de ser exatamente `NAO_MENSURAVEL` - nunca inferida de documentos historicos;
 *   3. gate que transforma autorizacao em confirmacao: a Condicao 3 e `PENDENTE` ate o Proprietario
 *      confirmar explicitamente (literalmente, conforme o Planner);
 *   4. gate que transforma CORRESPONDENCIA INCERTA EM PASS: cobertura por nome normalizado so pode
 *      aparecer como `FALLBACK_POR_NOME` (diagnostico) e NUNCA dentro dos cobertos;
 *   5. gate que mexe na arvore enquanto mede (medicao tem de ser read-only);
 *   6. gate nao determinista (duas execucoes seguidas tem de dar o mesmo placar).
 *
 * Se qualquer ponto divergir, este teste FICA VERMELHO (exit 1).
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const REPO = path.join(__dirname, '..');
const GATE = path.join(REPO, 'scripts', 'downplant', 'gate-retomada.mjs');

function rodarGate() {
  const r = spawnSync(process.execPath, [GATE, '--json'], { cwd: REPO, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  let json = null, erroJson = null;
  try { json = JSON.parse(r.stdout); } catch (e) { erroJson = e.message; }
  return { exit: r.status, json, erroJson, saida: `${r.stdout || ''}${r.stderr || ''}` };
}

function hashArvore(dir, base) {
  base = base || dir;
  const out = {};
  for (const nome of fs.readdirSync(dir).sort()) {
    if (nome === '__pycache__' || nome === 'node_modules' || nome === '.git') continue;
    const p = path.join(dir, nome);
    if (fs.statSync(p).isDirectory()) Object.assign(out, hashArvore(p, base));
    else out[path.relative(base, p).split(path.sep).join('/')] = crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
  }
  return out;
}

function rodarSuite() {
  let sucessos = 0, falhas = 0;
  const test = (nome, fn) => {
    try { fn(); sucessos++; console.log(`  [PASS] ${nome}`); }
    catch (e) { falhas++; console.error(`  [FAIL] ${nome}\n         ${e.message}`); }
  };

  console.log('\nFECHADURA GATE DE RETOMADA (§21.2 / §38 — instrumento #170)');

  test('o instrumento existe e emite placar objetivo em JSON', () => {
    assert.ok(fs.existsSync(GATE), `instrumento ausente: ${path.relative(REPO, GATE)}`);
    const { json, erroJson, saida } = rodarGate();
    assert.ok(json, `saida do gate nao e JSON valido (${erroJson})\n${saida.slice(0, 600)}`);
    for (const k of ['gate_global', 'condicao_1', 'condicao_2', 'condicao_3', 'comodos']) {
      assert.ok(Object.prototype.hasOwnProperty.call(json, k), `placar sem a chave obrigatoria '${k}'`);
    }
    assert.ok(['VERDE', 'VERMELHO'].indexOf(json.gate_global) !== -1, `gate_global invalido: ${json.gate_global}`);
  });

  test('exit code e coerente com o placar (exit 0 SOMENTE com GATE_GLOBAL = VERDE)', () => {
    const { exit, json } = rodarGate();
    assert.ok(json, 'sem JSON: nao da para conferir coerencia de exit code');
    if (json.gate_global === 'VERDE') assert.strictEqual(exit, 0, `VERDE com exit ${exit}`);
    else assert.notStrictEqual(exit, 0, `GATE_GLOBAL = VERMELHO com exit 0 (placar mentiria para o shell)`);
  });

  test('Condicao 2 nao e inventada: sem fonte canonica, a saida e NAO_MENSURAVEL', () => {
    const { json } = rodarGate();
    const c2 = json.condicao_2;
    assert.ok(c2 && typeof c2 === 'object', 'condicao_2 ausente');
    if (c2.mensuravel === true) {
      assert.ok(c2.fonte && String(c2.fonte).trim().length > 0,
        'condicao_2 declarada mensuravel SEM declarar a fonte canonica (inferencia disfarcada)');
    } else {
      assert.strictEqual(c2.valor, 'NAO_MENSURAVEL',
        `condicao_2 nao mensuravel deve valer exatamente NAO_MENSURAVEL (veio: ${c2.valor})`);
      assert.ok(c2.motivo && c2.motivo.length > 20, 'condicao_2 NAO_MENSURAVEL sem motivo medido');
    }
  });

  test('Condicao 3 e literal: PENDENTE ate o Proprietario confirmar', () => {
    const { json } = rodarGate();
    const c3 = json.condicao_3;
    assert.ok(c3 && typeof c3 === 'object', 'condicao_3 ausente');
    assert.ok(['PENDENTE', 'CONFIRMADO'].indexOf(c3.valor) !== -1,
      `condicao_3 so pode ser PENDENTE ou CONFIRMADO (veio: ${c3.valor})`);
    assert.notStrictEqual(c3.valor, 'CONFIRMADO',
      'condicao_3 marcada CONFIRMADO sem fonte de confirmacao declarada do Proprietario');
  });

  test('correspondencia incerta NUNCA vira cobertura: fallback por nome fica separado', () => {
    const { json } = rodarGate();
    const fb = json.fallbacks_por_nome || [];
    const cobertos = new Set();
    (json.comodos || []).forEach((c) => (c.artefatos_cobertos || []).forEach((a) => cobertos.add(a)));
    fb.forEach((f) => assert.ok(!cobertos.has(f.artefato),
      `artefato ${f.artefato} esta marcado como COBERTO e tambem listado como fallback por nome`));
    if (fb.length > 0) {
      fb.forEach((f) => assert.ok(f.motivo, `fallback por nome sem motivo declarado: ${JSON.stringify(f)}`));
    }
  });

  test('a medicao e READ-ONLY (none altera a arvore do repositorio)', () => {
    const antes = hashArvore(REPO);
    rodarGate();
    const depois = hashArvore(REPO);
    assert.deepStrictEqual(depois, antes, 'o gate mutou a arvore durante a medicao');
  });

  test('o gate e determinista (duas execucoes seguidas dao o mesmo placar)', () => {
    const a = rodarGate().json, b = rodarGate().json;
    assert.ok(a && b, 'sem JSON em uma das execucoes');
    assert.strictEqual(JSON.stringify(a.gate_global), JSON.stringify(b.gate_global));
    assert.strictEqual(JSON.stringify(a.condicao_1), JSON.stringify(b.condicao_1));
    assert.strictEqual(JSON.stringify(a.condicao_2), JSON.stringify(b.condicao_2));
    assert.strictEqual(JSON.stringify(a.condicao_3), JSON.stringify(b.condicao_3));
  });

  console.log(`\nRESULTADOS FINAIS: ${sucessos} PASS / ${falhas} FAIL`);
  if (falhas > 0) process.exitCode = 1;
}

module.exports = rodarSuite;

}
