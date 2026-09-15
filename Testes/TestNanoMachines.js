'use strict';
if (typeof require === 'undefined') { /* Ignora no Apps Script */ } else {

/**
 * ARQUIVO: Testes/TestNanoMachines.js
 * CARD:    #169 [DP24-006] - FECHADURA da instalacao transversal INST-NANO-001
 *          (Nano Task de 9 blocos + 6 ferramentas deterministicas NM-OBS-*), colhida do
 *          laboratorio `dp24-nano-lab` para dentro do repositorio.
 *
 * O QUE ESTA FECHADURA IMPEDE:
 *   1. instalacao colhida SEM o documento INST-* no endereco canonico (instalacao sem endereco);
 *   2. colheita SEM decisao ontologica registrada (DEC-*) - o card #169 proibe presumir a natureza
 *      da bancada (instalacao transversal §8.11 vs Modulo de produto);
 *   3. arquivo colhido que DIVIRJA do hash de proveniencia declarado no documento (proveniencia
 *      por hash e obrigatoria: a bancada de origem NAO possui historico Git proprio);
 *   4. schema da Nano Task ADULTERADO (o laboratorio declara 9 blocos e exige `operation.tool`,
 *      nunca `operation.capability`);
 *   5. instalacao que "existe" mas NAO RODA: a bancada de testes da propria instalacao e executada
 *      aqui e o exit code dela e o veredito (contador de PASS nao substitui exit code);
 *   6. execucao que MUTA a arvore do repositorio (a bancada roda sobre diretorios temporarios).
 *
 * Se qualquer ponto divergir, este teste FICA VERMELHO (exit 1).
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const REPO = path.join(__dirname, '..');
const LAB = path.join(REPO, 'scripts', 'dp24-nano');
const DOC = path.join(REPO, '02_Comodos', 'C00_Governanca_Estrutural', '03_Especificacoes',
  'INSTALACOES_TRANSVERSAIS', 'INST-NANO-001_NANO_TASK_E_FERRAMENTAS_DETERMINISTICAS.md');
const DEC = path.join(REPO, '02_Comodos', 'C00_Governanca_Estrutural', '03_Especificacoes',
  'INSTALACOES_TRANSVERSAIS', 'DEC-INST-NANO-001_NANO_TASK_COMO_INSTALACAO_TRANSVERSAL.md');

const BLOCOS = ['identity', 'gps', 'input', 'operation', 'contract', 'authority', 'transition', 'evidence', 'stop'];
const FERRAMENTAS = ['nm_obs_write.py', 'nm_obs_read.py', 'nm_obs_patch.py', 'nm_obs_verify_file.py',
  'nm_obs_parse_canvas.py', 'nm_obs_build_canvas.py'];

/**
 * NOTA DE REPRODUTIBILIDADE (aprendizado de F1/F2 do #172):
 * o hash de proveniencia e calculado sobre o CONTEUDO com fim de linha normalizado para LF —
 * exatamente o que o Git armazena. Assim a fechadura passa tanto na working copy CRLF desta
 * maquina quanto num checkout limpo (LF), sem depender de `core.autocrlf`.
 */
function sha256(arq) {
  const bruto = fs.readFileSync(arq).toString('binary');
  const normalizado = Buffer.from(bruto.replace(/\r\n/g, '\n'), 'binary');
  return crypto.createHash('sha256').update(normalizado).digest('hex');
}

function arvore(dir, base) {
  base = base || dir;
  const out = {};
  for (const nome of fs.readdirSync(dir).sort()) {
    const p = path.join(dir, nome);
    const st = fs.statSync(p);
    if (st.isDirectory()) {
      if (nome === '__pycache__') continue;
      Object.assign(out, arvore(p, base));
    } else {
      out[path.relative(base, p).split(path.sep).join('/')] = sha256(p);
    }
  }
  return out;
}

function rodarSuite() {
  let sucessos = 0, falhas = 0;
  const test = (nome, fn) => {
    try { fn(); sucessos++; console.log(`  [PASS] ${nome}`); }
    catch (e) { falhas++; console.error(`  [FAIL] ${nome}\n         ${e.message}`); }
  };

  console.log('\nFECHADURA INST-NANO-001 (instalacao transversal: Nano Task 9 blocos + NM-OBS-*)');

  test('a instalacao existe no endereco declarado, com o documento INST-* e a DEC-*', () => {
    assert.ok(fs.existsSync(DOC), `documento da instalacao ausente: ${path.relative(REPO, DOC)}`);
    assert.ok(fs.existsSync(DEC), `decisao ontologica ausente: ${path.relative(REPO, DEC)}`);
    assert.ok(fs.existsSync(LAB), `arvore colhida ausente: ${path.relative(REPO, LAB)}`);
    const doc = fs.readFileSync(DOC, 'utf8');
    assert.ok(/INST-NANO-001/.test(doc), 'documento nao declara o identificador INST-NANO-001');
    assert.ok(/INSTALACAO TRANSVERSAL|Instalação transversal|instalação transversal/.test(doc),
      'documento nao declara a natureza: instalacao transversal (§8.11)');
    assert.ok(/8\.11/.test(doc), 'documento nao cita o §8.11');
  });

  test('a arvore colhida preserva o laboratorio (pacote, 6 NM-OBS-*, schemas, testes, CLI)', () => {
    const t = arvore(LAB);
    for (const f of FERRAMENTAS) {
      assert.ok(t[`nano_machines/${f}`], `ferramenta ausente na colheita: nano_machines/${f}`);
    }
    for (const f of ['safe_path.py', 'tool_gateway.py', 'nano_task_contract.py', '__init__.py']) {
      assert.ok(t[`nano_machines/${f}`], `arquivo ausente na colheita: nano_machines/${f}`);
    }
    for (const f of ['schemas/nano_task.schema.json', 'schemas/tool_envelope.schema.json',
      'run_tool.py', 'run_pilot.py', 'ONTOLOGIA_EXPERIMENTAL.md']) {
      assert.ok(t[f], `arquivo ausente na colheita: ${f}`);
    }
    const testes = Object.keys(t).filter(k => k.startsWith('tests/test_'));
    assert.strictEqual(testes.length, 4, `esperava 4 arquivos de teste, achei ${testes.length}`);
  });

  test('a proveniencia por hash declarada no documento bate arquivo a arquivo', () => {
    const doc = fs.readFileSync(DOC, 'utf8');
    const linhas = doc.split(/\r?\n/).filter(l => /^\|\s*`[^`]+`\s*\|\s*`?[0-9a-f]{64}`?\s*\|/.test(l));
    assert.ok(linhas.length >= 16, `tabela de proveniencia curta demais (${linhas.length} linhas)`);
    const t = arvore(LAB);
    let conferidos = 0;
    for (const l of linhas) {
      const m = l.match(/^\|\s*`([^`]+)`\s*\|\s*`?([0-9a-f]{64})`?\s*\|/);
      const rel = m[1].replace(/^scripts\/dp24-nano\//, '');
      assert.ok(t[rel], `proveniencia cita arquivo que nao existe na colheita: ${rel}`);
      assert.strictEqual(t[rel], m[2], `hash divergente em ${rel}: arquivo ${t[rel]} x documento ${m[2]}`);
      conferidos++;
    }
    assert.ok(conferidos >= 16, `so ${conferidos} arquivos conferidos por hash`);
  });

  test('o schema da Nano Task preserva os 9 blocos e PROIBE operation.capability', () => {
    const s = JSON.parse(fs.readFileSync(path.join(LAB, 'schemas', 'nano_task.schema.json'), 'utf8'));
    const props = (s.properties) || (s.items && s.items.properties) || {};
    for (const b of BLOCOS) assert.ok(props[b], `bloco ausente no schema: ${b}`);
    assert.ok(props.operation, 'bloco operation ausente');
    const op = props.operation;
    const opProps = op.properties || {};
    assert.ok(opProps.tool, 'operation nao declara a propriedade `tool`');
    assert.ok(opProps.max_calls, 'operation nao declara `max_calls`');
    assert.ok(!opProps.capability, 'operation declara a propriedade `capability` (proibida pelo laboratorio)');
    const proibicao = JSON.stringify(op.not || {});
    assert.ok(/capability/.test(proibicao),
      'operation nao proibe `capability` explicitamente (o laboratorio exige operation.tool, nunca capability)');
    const ferramentas = JSON.stringify(opProps.tool);
    for (const nome of ['NM-OBS-READ', 'NM-OBS-WRITE', 'NM-OBS-PATCH', 'NM-OBS-PARSE-CANVAS',
      'NM-OBS-BUILD-CANVAS', 'NM-OBS-VERIFY-FILE']) {
      assert.ok(ferramentas.includes(nome), `enum de operation.tool nao cita ${nome}`);
    }
    assert.ok(/required/.test(JSON.stringify(s)), 'schema nao declara campos obrigatorios');
  });

  test('a bancada RODA: python -m unittest discover -s tests -> exit 0', () => {
    const py = process.env.PYTHON || 'python';
    if (!fs.existsSync(LAB)) assert.fail(`arvore colhida ausente: ${path.relative(REPO, LAB)} (nada a rodar)`);
    const r = spawnSync(py, ['-m', 'unittest', 'discover', '-s', 'tests'], { cwd: LAB, encoding: 'utf8' });
    if (r.error) {
      assert.fail(`nao consegui executar a bancada com '${py}': ${r.error.code || ''} ${r.error.message}. ` +
        `A instalacao INST-NANO-001 exige Python 3 (declarado em "Como se instala"). Falha RUIDOSA de ` +
        `proposito (§3.5): instalacao que nao roda nao esta instalada.`);
    }
    const saida = `${r.stdout || ''}${r.stderr || ''}`;
    assert.strictEqual(r.status, 0, `exit ${r.status} da bancada:\n${saida}`);
    assert.ok(/Ran \d+ tests/.test(saida), `bancada nao reportou os testes executados:\n${saida}`);
    const n = Number((saida.match(/Ran (\d+) tests/) || [])[1]);
    assert.ok(n >= 20, `esperava >= 20 testes na bancada, rodei ${n}`);
  });

  test('rodar a bancada NAO altera a arvore colhida (nenhuma mutacao no repositorio)', () => {
    const antes = arvore(LAB);
    const py = process.env.PYTHON || 'python';
    spawnSync(py, ['-m', 'unittest', 'discover', '-s', 'tests'], { cwd: LAB, encoding: 'utf8' });
    const depois = arvore(LAB);
    assert.deepStrictEqual(depois, antes, 'a execucao da bancada mutou a arvore colhida');
  });

  console.log(`\nRESULTADOS FINAIS: ${sucessos} PASS / ${falhas} FAIL`);
  if (falhas > 0) process.exitCode = 1;
}

module.exports = rodarSuite;

}
