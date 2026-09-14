'use strict';
if (typeof require === 'undefined') { /* Ignora no Apps Script */ } else {

/**
 * ARQUIVO: Testes/TestValidarHandoffContrato32_14.js
 * CARD:    #163 [DP24-002] - FECHADURA do contrato de entrada §32.14.
 *
 * O que esta fechadura impede (invariante da §32.14):
 *   um Executor iniciar execucao com um downplant_handoff que falhe o require
 *   do contrato de entrada (§32.14) - campo ausente sempre seria "aceito por
 *   omissao" enquanto o unico validador do repo (#156) so olhasse o schema
 *   DP-HANDOFF-1 e a coerencia factual.
 *
 * Como ela funciona (sem reimplementar validacao):
 *   1. aponta o validador canonico UNICO (scripts/downplant/validar-handoff.mjs)
 *      para fixtures por `--handoff` e exige exit 0 (aceito) ou exit 1 (rejeitado),
 *      com a mensagem nomeando o campo do require;
 *   2. exercita o mesmo modulo (funcao `validarContrato32_14`) para as
 *      pos-condicoes (ensure), inclusive a que le o historico Git;
 *   3. prova nao-regressao: o handoff real do repo continua aceito pelo
 *      validador do #156 (exit 0) e agora tambem satisfaz a §32.14.
 *
 * Se qualquer ponto divergir, este teste FICA VERMELHO (exit 1).
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { pathToFileURL } = require('url');

const REPO = path.join(__dirname, '..');
const VALIDADOR = path.join(REPO, 'scripts', 'downplant', 'validar-handoff.mjs');
const FIX = path.join(REPO, 'Testes', 'Fixtures', 'handoff_32_14');

let sucessos = 0;
let falhas = 0;
function test(nome, fn) {
  try { fn(); console.log(`  [PASS] ${nome}`); sucessos++; }
  catch (err) { console.error(`  [FAIL] ${nome}: ${err.message}`); falhas++; }
}

// --- o MESMO validador, chamado como CLI -------------------------------------
function rodar(handoffRel) {
  const args = [VALIDADOR];
  if (handoffRel) args.push('--handoff', handoffRel);
  try {
    const saida = execFileSync(process.execPath, args, { cwd: REPO, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
    return { exit: 0, saida };
  } catch (err) {
    return { exit: err.status === undefined || err.status === null ? -1 : err.status, saida: `${err.stdout || ''}${err.stderr || ''}` };
  }
}

function aceita(nome, handoffRel, trechoEsperado) {
  test(nome, () => {
    const r = rodar(handoffRel);
    assert.strictEqual(r.exit, 0, `esperado exit 0 (handoff aceito), obtido ${r.exit}\n${r.saida}`);
    if (trechoEsperado) {
      assert.ok(r.saida.includes(trechoEsperado), `saida nao contem "${trechoEsperado}"\n${r.saida}`);
    }
  });
}

function rejeita(nome, handoffRel, trechoEsperado) {
  test(nome, () => {
    const r = rodar(handoffRel);
    assert.strictEqual(r.exit, 1, `esperado exit 1 (handoff REJEITADO pelo contrato), obtido ${r.exit}\n${r.saida}`);
    assert.ok(/32\.14/.test(r.saida), `a rejeicao deve ser do contrato §32.14\n${r.saida}`);
    const alvo = String(trechoEsperado).toUpperCase();
    assert.ok(r.saida.toUpperCase().includes(alvo), `a rejeicao deve nomear "${trechoEsperado}"\n${r.saida}`);
  });
}

async function rodarSuite() {
  console.log('=== TESTES: CONTRATO DE ENTRADA §32.14 NO VALIDADOR CANONICO DE HANDOFF (#163 DP24-002) ===\n');

  // ---------------------------------------------------------------------------
  // 1. Positivo: o proprio YAML de exemplo do §46.12 satisfaz o require
  // ---------------------------------------------------------------------------
  console.log('1) Require §32.14 - objeto canonico §46.12 e handoff real do repo');
  aceita('o YAML de exemplo do §46.12 passa o contrato de entrada (§32.14)',
    path.join('Testes', 'Fixtures', 'handoff_32_14', 'exemplo_46_12.yaml'), '§32.14');
  aceita('o handoff real do repo continua aceito no inicio de uma task (nao-regressao do #156)',
    null, 'SUCESSO');
  aceita('o handoff real do repo satisfaz o §32.14 (escala, task.id, pode_expandir, portoes)',
    null, '§32.14 invariant');

  {
    const r = rodar(null);
    test('nao-regressao: as verificacoes do validador antigo continuam todas PASS e nenhuma FAIL', () => {
      const linhas = r.saida.split(/\r?\n/);
      const pass = linhas.filter(l => l.includes('  PASS  ')).length;
      const fail = linhas.filter(l => l.includes('  FAIL  ')).length;
      assert.ok(fail === 0, `validador acusou FAIL no handoff real: ${fail}`);
      assert.ok(pass >= 28, `o handoff real perdeu verificacoes do #156 (PASS=${pass}, esperado >= 28)`);
    });
  }

  // ---------------------------------------------------------------------------
  // 2. Negativos exigidos pelo card - cada um viola exatamente um require
  // ---------------------------------------------------------------------------
  console.log('\n2) Negativos - o require violado e nomeado e nao ha execucao (invariante)');
  const F = (n) => path.join('Testes', 'Fixtures', 'handoff_32_14', n);
  rejeita('sem escala -> rejeitado', F('sem_escala.yaml'), 'escala');
  rejeita('task.id ausente -> rejeitado', F('sem_task_id.yaml'), 'task.id');
  rejeita('task.id duplicado -> rejeitado',
    path.join('Testes', 'Fixtures', 'handoff_32_14', 'duplicado', 'a.handoff.yaml'), 'duplicado');
  rejeita('sem pode_expandir -> rejeitado', F('sem_pode_expandir.yaml'), 'pode_expandir');
  rejeita('sem portoes -> rejeitado', F('sem_portoes.yaml'), 'portao');
  rejeita('acao que altera arquivo com escopo.arquivos vazio -> rejeitado', F('sem_escopo_arquivos.yaml'), 'escopo.arquivos');
  rejeita('task.id nao rastreavel ao comodo declarado -> rejeitado', F('task_id_nao_rastreavel.yaml'), 'rastreavel');
  rejeita('Task apontando para handoff inexistente (ensure) -> rejeitada', F('tarefa_sem_handoff_apontado.yaml'), 'handoff');

  {
    const r = rodar(path.join('Testes', 'Fixtures', 'handoff_32_14', 'duplicado', 'b.handoff.yaml'));
    test('os dois lados do id duplicado sao rejeitados (nao e sorte de ordem de leitura)', () => {
      assert.strictEqual(r.exit, 1, `esperado exit 1, obtido ${r.exit}\n${r.saida}`);
      assert.ok(r.saida.toUpperCase().includes('DUPLICADO'), r.saida);
    });
  }

  {
    const r = rodar(path.join('Testes', 'Fixtures', 'handoff_32_14', 'sem_portoes.yaml'));
    test('invariante §32.14: handoff invalido bloqueia a execucao (exit 1, nao "aceito por omissao")', () => {
      assert.strictEqual(r.exit, 1, `esperado exit 1, obtido ${r.exit}`);
      assert.ok(/BLOQUEADO|NAO esta|invariant/i.test(r.saida), r.saida);
    });
  }

  // ---------------------------------------------------------------------------
  // 3. Pos-condicoes (ensure) - o mesmo modulo do validador, sem segundo validador
  // ---------------------------------------------------------------------------
  console.log('\n3) Ensure §32.14 - pos-condicoes verificadas pelo mesmo validador');
  const mod = await import(pathToFileURL(VALIDADOR).href);
  assert.strictEqual(typeof mod.validarContrato32_14, 'function',
    'o validador canonico deve expor validarContrato32_14 (reuso, sem segundo validador)');

  const doc46 = mod.parseYaml(fs.readFileSync(path.join(FIX, 'exemplo_46_12.yaml'), 'utf8'));

  test('ensure: commit atribuido a Task (trailer Handoff:) sem task.id no historico -> violacao', () => {
    const gitLog = 'a1b2c3d4e5f6\tDP24-002: integra contrato §32.14\n\nHandoff: downplant_handoff.yaml\n\x02';
    const r = mod.validarContrato32_14(doc46, { gitLog, vizinhos: [] });
    assert.ok(r.falhas.some(f => /commit/i.test(f) && /task\.id/i.test(f)), `esperado violacao de commit sem task.id, obtido: ${JSON.stringify(r.falhas)}`);
  });

  test('ensure: commit que carrega o task.id no historico -> conforme', () => {
    const gitLog = 'a1b2c3d4e5f6\t[TASK-C00-042] corrige comportamento definido\n\n\x02';
    const r = mod.validarContrato32_14(doc46, { gitLog, vizinhos: [] });
    assert.deepStrictEqual(r.falhas, [], `nao deveria haver violacao: ${JSON.stringify(r.falhas)}`);
  });

  test('ensure: handoff sem historico (nenhum commit da Task ainda) -> nao inventa violacao', () => {
    const r = mod.validarContrato32_14(doc46, { gitLog: '', vizinhos: [] });
    assert.deepStrictEqual(r.falhas, [], `historico vazio nao pode gerar violacao: ${JSON.stringify(r.falhas)}`);
  });

  test('require: os oito campos exigidos sao verificados um a um (sem aceitar por omissao)', () => {
    const minimo = mod.parseYaml([
      'downplant:', '  terreno: SYN', '  comodo: C00', '  modulo: MOD-C00-01',
      '  submodulo: null', '  escala: modulo', '  circuito: CIR-1', '  porta: P00',
      'task:', '  id: TASK-C00-050', '  acao: corrigir', '  alvo: comportamento definido',
      'escopo:', '  arquivos:', '    - arquivo-a', '  pode_expandir: false',
      'estado:', '  portao_atual: G4', '  portao_destino: G7'
    ].join('\n'));
    const r = mod.validarContrato32_14(minimo, { gitLog: '', vizinhos: [] });
    assert.deepStrictEqual(r.falhas, [], `objeto minimo completo deveria passar: ${JSON.stringify(r.falhas)}`);
    ['comodo', 'modulo', 'escala', 'task.id', 'escopo.arquivos', 'pode_expandir', 'portao_atual', 'portao_destino']
      .forEach(campo => {
        assert.ok(r.passes.some(p => p.includes(campo)), `o require deve declarar a verificacao de ${campo}: ${JSON.stringify(r.passes)}`);
      });
  });

  // ---------------------------------------------------------------------------
  // 4. Resultado
  // ---------------------------------------------------------------------------
  console.log(`\nRESULTADOS FINAIS: ${sucessos} PASS / ${falhas} FAIL`);
  if (falhas > 0) process.exit(1);
}

module.exports = rodarSuite;

if (require.main === module) {
  rodarSuite().catch(err => {
    console.error('Falha na fechadura do contrato §32.14:', err);
    process.exit(1);
  });
}

}
