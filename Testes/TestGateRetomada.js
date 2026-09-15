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

  test('Condicao 3 so vale CONFIRMADO com registro de confirmacao do Proprietario declarado', () => {
    const { json } = rodarGate();
    const c3 = json.condicao_3;
    assert.ok(c3 && typeof c3 === 'object', 'condicao_3 ausente');
    assert.ok(['PENDENTE', 'CONFIRMADO'].indexOf(c3.valor) !== -1,
      `condicao_3 so pode ser PENDENTE ou CONFIRMADO (veio: ${c3.valor})`);
    if (c3.valor === 'CONFIRMADO') {
      assert.ok(c3.fonte && String(c3.fonte).trim().length > 20, 'CONFIRMADO sem fonte declarada');
      assert.ok(c3.fonte_arquivo && fs.existsSync(path.join(REPO, c3.fonte_arquivo)),
        `CONFIRMADO apontando registro inexistente: ${c3.fonte_arquivo}`);
      assert.ok(Array.isArray(c3.ressalvas) && c3.ressalvas.some((r) => /C2/.test(r)),
        'CONFIRMADO sem declarar a ressalva de C2');
    } else {
      assert.ok(!c3.fonte, 'PENDENTE nao pode declarar fonte de confirmacao');
    }
  });

  test('vermelho global por LACUNA_DE_GOVERNANCA: C1 VERDE + C3 CONFIRMADO + C2 nao mensuravel', () => {
    const { json } = rodarGate();
    assert.ok(Array.isArray(json.gate_global_motivo), 'placar sem gate_global_motivo');
    if (json.condicao_1.valor === 'VERDE' && json.condicao_3.valor === 'CONFIRMADO' && json.condicao_2.valor !== 'VERDE') {
      assert.strictEqual(json.gate_global, 'VERMELHO',
        'C1 VERDE + C3 CONFIRMADO + C2 nao mensuravel tem de manter GATE_GLOBAL = VERMELHO');
      assert.ok(json.gate_global_motivo.some((m) => /C2/.test(m) && /LACUNA_DE_GOVERNANCA/.test(m)),
        `motivo do vermelho nao declara C2/LACUNA_DE_GOVERNANCA: ${JSON.stringify(json.gate_global_motivo)}`);
      assert.ok(!json.gate_global_motivo.some((m) => /^C1/.test(m)),
        'C1 nao pode constar como bloqueio enquanto C1 = VERDE');
    }
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

  test('a medicao e READ-ONLY (o gate numa COPIA PRIVADA da arvore nao altera nada)', () => {
    // A copia privada isola a prova de escritores externos (VigiaPonte/ponte1/state) que tocam o repo
    // de verdade durante a suite: aqui, QUALQUER diferenca so pode ter sido causada pelo gate.
    const os = require('os');
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gate-ro-'));
    try {
      fs.cpSync(REPO, tmp, { recursive: true,
        filter: (src) => !/(^|[\\/])(\.git|node_modules|__pycache__)([\\/]|$)/.test(src) });
      const antes = hashArvore(tmp);
      const gateCopia = path.join(tmp, 'scripts', 'downplant', 'gate-retomada.mjs');
      assert.ok(fs.existsSync(gateCopia), 'copia da arvore sem o instrumento');
      const r = spawnSync(process.execPath, [gateCopia, '--json'], { cwd: tmp, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
      assert.ok(r.stdout && r.stdout.trim().startsWith('{'), `gate nao emitiu JSON na copia: ${(r.stderr || '').slice(0, 300)}`);
      const depois = hashArvore(tmp);
      const mudou = Object.keys({ ...antes, ...depois }).filter((k) => antes[k] !== depois[k]);
      assert.strictEqual(mudou.length, 0, `o gate mutou a arvore durante a medicao: ${mudou.slice(0, 8).join(', ')}`);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('o gate e determinista (duas execucoes seguidas dao o mesmo placar)', () => {
    const a = rodarGate().json, b = rodarGate().json;
    assert.ok(a && b, 'sem JSON em uma das execucoes');
    assert.strictEqual(JSON.stringify(a.gate_global), JSON.stringify(b.gate_global));
    assert.strictEqual(JSON.stringify(a.condicao_1), JSON.stringify(b.condicao_1));
    assert.strictEqual(JSON.stringify(a.condicao_2), JSON.stringify(b.condicao_2));
    assert.strictEqual(JSON.stringify(a.condicao_3), JSON.stringify(b.condicao_3));
  });

  test('C1 separa a NATUREZA das pendencias e a soma dos baldes fecha com o medido', () => {
    const { json } = rodarGate();
    const sep = json.condicao_1 && json.condicao_1.separacao;
    assert.ok(sep && sep.baldes, 'condicao_1 sem o bloco separacao.baldes');
    for (const k of ['PRODUTO', 'IDENTIDADE', 'ALOCACAO', 'HOMOLOGACAO_INFRA', 'DONO_CONSUMIDOR', 'NAO_APLICAVEL']) {
      assert.ok(Object.prototype.hasOwnProperty.call(sep.baldes, k), `separacao.baldes sem o balde ${k}`);
    }
    const b = sep.baldes;
    const soma = b.PRODUTO.total + b.IDENTIDADE.total + b.ALOCACAO.total + b.HOMOLOGACAO_INFRA.total
      + b.DONO_CONSUMIDOR.total + b.NAO_APLICAVEL.total;
    assert.strictEqual(soma, json.condicao_1.medido.pendentes,
      `baldes (${soma}) nao fecham com as pendencias medidas (${json.condicao_1.medido.pendentes})`);
    const alocEmDono = (b.DONO_CONSUMIDOR.casos || []).filter((c) => c.natureza === 'ALOCACAO')
      .reduce((n, c) => n + c.pendencias, 0);
    assert.strictEqual(sep.cartografia.total, b.IDENTIDADE.total + b.ALOCACAO.total + alocEmDono,
      'visao cartografia nao fecha com IDENTIDADE + ALOCACAO (incluindo os casos de alocacao em DONO_CONSUMIDOR)');
  });

  test('ausencia de capsula NAO pontua no C1 (nao e requisito do §21.2)', () => {
    const { json } = rodarGate();
    const c1 = json.condicao_1;
    const pend = [];
    (c1.comodos || []).forEach((c) => c.modulos.forEach((m) => m.pendentes.forEach((p) => pend.push(p))));
    assert.ok(!pend.some((p) => p.classe === 'CAPSULA' || p.balde === 'CAPSULA'),
      'a ausencia de capsula ainda contamina as pendencias do C1');
    assert.ok(Array.isArray(c1.separacao.estrutura_modulo.modulos), 'separacao.estrutura_modulo sem lista de modulos');
    assert.strictEqual(c1.separacao.estrutura_modulo.modulos.length, c1.medido.modulos_sem_capsula,
      'estrutura_modulo nao casa com medido.modulos_sem_capsula');
    assert.ok(json.capsula && json.capsula.resposta && json.capsula.fontes.length >= 5,
      'o placar tem de declarar o veredito da reconciliacao da capsula com as fontes citadas');
  });

  test('Condicao 2 NAO_MENSURAVEL declara a CAUSA medida (lacuna de governanca, nao de estrutura)', () => {
    const { json } = rodarGate();
    const c2 = json.condicao_2;
    if (c2.mensuravel !== true) {
      assert.strictEqual(c2.causa, 'AUSENCIA_DE_FONTE_CANONICA_DE_ESTADO_DE_AUDITORIA',
        `causa inesperada para C2: ${c2.causa}`);
      assert.strictEqual(c2.natureza, 'LACUNA_DE_GOVERNANCA',
        `natureza inesperada para C2: ${c2.natureza}`);
      assert.ok(Array.isArray(c2.candidatos_avaliados_e_descartados) && c2.candidatos_avaliados_e_descartados.length >= 3,
        'C2 tem de registrar os candidatos avaliados e descartados');
    }
  });

  test('DONO x CONSUMIDOR: artefato em 2 Modulos nunca ganha dono escolhido pelo instrumento', () => {
    const { json } = rodarGate();
    const casos = (json.condicao_1.separacao.baldes.DONO_CONSUMIDOR || {}).casos || [];
    assert.ok(casos.length > 0, 'nenhum caso DONO x CONSUMIDOR medido (o achado do diagnostico desapareceu)');
    casos.forEach((c) => {
      assert.ok(Array.isArray(c.modulos) && c.modulos.length >= 2,
        `caso DONO x CONSUMIDOR sem os Modulos declarantes: ${JSON.stringify(c)}`);
      assert.ok(!c.dono_escolhido, 'o gate escolheu dono por conta propria (decisao do Planner/#176)');
      assert.ok(['AUSENCIA_MATERIAL', 'ALOCACAO', 'IDENTIDADE'].indexOf(c.natureza) !== -1,
        `caso DONO x CONSUMIDOR sem natureza declarada: ${JSON.stringify(c)}`);
    });
  });

  test('HOMOLOGACAO/INFRA e DONO x CONSUMIDOR ficam FORA do veredito do C1', () => {
    const { json } = rodarGate();
    const b = json.condicao_1.separacao.baldes;
    const contam = b.PRODUTO.total + b.IDENTIDADE.total + b.ALOCACAO.total;
    assert.strictEqual(json.condicao_1.medido.contam_no_veredito, contam, 'contam_no_veredito divergente de PRODUTO+IDENTIDADE+ALOCACAO');
    assert.strictEqual(b.HOMOLOGACAO_INFRA.aplicabilidade, 'A_DECIDIR', 'HOMOLOGACAO/INFRA tem de declarar aplicabilidade A_DECIDIR');
    assert.strictEqual(json.condicao_1.valor, contam === 0 ? 'VERDE' : 'VERMELHO');
  });

  console.log(`\nRESULTADOS FINAIS: ${sucessos} PASS / ${falhas} FAIL`);
  if (falhas > 0) process.exitCode = 1;
}

module.exports = rodarSuite;

}
