'use strict';
if (typeof require === 'undefined') { /* Ignora no Apps Script */ } else {

/**
 * ARQUIVO: Testes/TestCuradorEstrutural.js
 * CARD:    #168 [DP24-005] - FECHADURA do §46.11 (Markdown DERIVADO do YAML) e do §46.13
 *          (relatório do Curador). §46.14 entra como homologação (zero delta: já implantado no #167).
 *
 * O QUE ESTA FECHADURA IMPEDE (regras do §4.5 / §7.7 / §46.11 / §46.13):
 *   1. o espelho Markdown ser editado À MÃO (ou o YAML mudar sem regerar): o §46.11 só admite
 *      espelho DERIVADO — "Não editar diretamente — editar o YAML de origem e regerar" (:926);
 *   2. valor do espelho reescrito/normalizado em relação ao YAML: §4.5 (:181) — "o YAML vence";
 *   3. o Curador DECIDIR ou MUTAR o que não é mecânico: §7.7 (:228-231) — só a ação mecânica
 *      (regerar) é do Curador; o resto é "REPORTA O QUE EXIGIR DECISÃO";
 *   4. um segundo parser YAML / segundo gerador do espelho (processo paralelo): os dois scripts
 *      REUSAM `parseYaml` do validador canônico e o Curador reusa o gerador;
 *   5. o relatório do Curador deixar de seguir o formato da §46.13 (:998-1015) — as rubricas são
 *      extraídas DO PRÓPRIO MÉTODO canônico, não de uma cópia digitada neste teste.
 *
 * COMO ELA FUNCIONA: chama os mecanismos como CLI (o que o Executor roda é o que o teste prova),
 * compara byte a byte, mede derivação linha a linha pelo mapa do gerador e cobre cada cenário de
 * RED numa COPIA em diretório temporário — o repositório real nunca é mutado pelo teste.
 *
 * Se qualquer ponto divergir, este teste FICA VERMELHO (exit 1).
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const REPO = path.join(__dirname, '..');
const METODO = path.join(REPO, '03_Fundacao', 'METODO_DOWN_PLANT_PROGRESSIVO_v2.4.md');
const GERADOR = path.join(REPO, 'scripts', 'downplant', 'gerar-handoff-md.mjs');
const CURADOR = path.join(REPO, 'scripts', 'downplant', 'curador-estrutural.mjs');
const VALIDADOR = path.join(REPO, 'scripts', 'downplant', 'validar-handoff.mjs');
const PAR = path.join(REPO, '08_Execucao_Ao_Vivo');
const YAML = path.join(PAR, 'downplant_handoff.yaml');
const MD = path.join(PAR, 'downplant_handoff.md');
const VIGIA = path.join(REPO, 'scripts', 'downplant', 'vigia-dependencias.mjs');
const RELATORIO_VIGIA = path.join(REPO, 'dependencias', 'vigia', 'RELATORIO_VIGIA_2026-09-14.md');

// As rubricas/linhas canonicas sao EXTRAIDAS do metodo (nao digitadas aqui).
// §46.11 (:925-968), §46.13 (:998-1015), §46.14 (:1016-1028) - 1-indexado no arquivo.
function rubricas(inicio, fim) {
  const linhas = fs.readFileSync(METODO, 'utf8').split(/\r?\n/);
  return linhas.slice(inicio - 1, fim).map((l) => l.trim()).filter((l) => l !== '');
}

const RUBRICAS_46_11 = rubricas(926, 968);
const RUBRICAS_46_13 = rubricas(999, 1015);
const RUBRICAS_46_14 = rubricas(1017, 1028);

let sucessos = 0;
let falhas = 0;
function test(nome, fn) {
  try { fn(); console.log(`  [PASS] ${nome}`); sucessos++; }
  catch (err) { console.error(`  [FAIL] ${nome}: ${err.message}`); falhas++; }
}

// --- infraestrutura ----------------------------------------------------------
function rodar(script, args) {
  try {
    const saida = execFileSync(process.execPath, [script].concat(args), {
      cwd: REPO, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024
    });
    return { exit: 0, saida };
  } catch (err) {
    return {
      exit: err.status === undefined || err.status === null ? -1 : err.status,
      saida: `${err.stdout || ''}${err.stderr || ''}`
    };
  }
}

function tempDir(rotulo) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `fechadura168_${rotulo}_`));
}

function hashArvore(dir) {
  const out = {};
  (function walk(d) {
    for (const f of fs.readdirSync(d)) {
      const p = path.join(d, f);
      if (fs.statSync(p).isDirectory()) walk(p);
      else out[path.relative(dir, p)] = crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
    }
  })(dir);
  return out;
}

function sha(arquivo) {
  return crypto.createHash('sha256').update(fs.readFileSync(arquivo, 'utf8'), 'utf8').digest('hex');
}

// Copia o par YAML/Markdown para um tmp e devolve { dir, yaml, md }.
// O espelho é REGERADO para a localização do tmp (os links derivados das referências são
// relativos ao diretório do espelho — é assim que o lint os valida), de modo que o par do tmp
// nasce DERIVADO e cada cenário de RED isola exatamente a mutação que ele planta.
function copiarPar(rotulo) {
  const dir = tempDir(rotulo);
  const yaml = path.join(dir, 'downplant_handoff.yaml');
  const md = path.join(dir, 'downplant_handoff.md');
  fs.copyFileSync(YAML, yaml);
  const g = rodar(GERADOR, ['--yaml', yaml, '--md', md, '--aplicar']);
  if (g.exit !== 0) throw new Error(`não foi possível preparar o par do tmp: ${g.saida}`);
  return { dir, yaml, md };
}

// Fixture minimo com TODOS os campos do modelo §46.12/§46.11 declarados (para o estado SINCRONIZADO).
function fixtureCompleto(dir) {
  const yaml = path.join(dir, 'downplant_handoff.yaml');
  fs.writeFileSync(yaml, [
    'downplant_schema: DP-HANDOFF-1',
    'downplant_version: "2.4"',
    'gerado_em: "2026-09-14"',
    'autor: FECHADURA-168',
    'proposito: fixture da fechadura do §46.11/§46.13',
    'estado_do_handoff: ATIVO',
    'downplant:',
    '  terreno: SYN',
    '  submodulo: SUB-C00-01-01_FIXTURE',
    '  escala: submodulo',
    '  circuito: CIR-SUB-C00-01-01_FIXTURE',
    '  porta: P00',
    'contexto_de_task:',
    '  comodo: C00_Governanca_Estrutural',
    '  modulo_ativo: MOD-C00-01_FIXTURE',
    '  fatia_ativa: "#168 fixture"',
    '  ambiente: local',
    '  portao_atual: G4',
    '  regra_de_parada: parar ao fim da fatia',
    '  arquivos_permitidos:',
    '    - a',
    '  proibicoes:',
    '    - p1',
    '  ids_remotos:',
    '    github_repo: X',
    'task:',
    '  id: TASK-C00-099',
    '  acao: corrigir',
    '  alvo: a',
    'escopo:',
    '  pode_expandir: false',
    '  arquivos:',
    '    - a',
    '  artefatos:',
    '    - art',
    'estado:',
    '  portao_destino: G7',
    'conexoes:',
    '  origem: O',
    '  destino: D',
    '  contrato: C',
    'proibicoes:',
    '  efeitos_externos: nenhum',
    '  publicacao: proibida',
    ''
  ].join('\n'), 'utf8');
  return yaml;
}

function campoDoRelatorio(saida, prefixo) {
  const l = saida.split(/\r?\n/).find((x) => x.startsWith(prefixo));
  return l === undefined ? null : l;
}

function secaoDoRelatorio(saida, titulo) {
  const linhas = saida.split(/\r?\n/);
  const i = linhas.findIndex((l) => l.trim() === titulo);
  if (i === -1) return null;
  const corpo = [];
  for (let k = i + 1; k < linhas.length; k++) {
    if (/^##\s/.test(linhas[k]) || /^SINCRONIZADO \|/.test(linhas[k])) break;
    corpo.push(linhas[k]);
  }
  return corpo.join('\n');
}

function rodarSuite() {
  console.log('====================================================');
  console.log('🔒 FECHADURA #168 - §46.11 (Markdown derivado do YAML) + §46.13 (Curador)');
  console.log('====================================================\n');

  const yamlBruto = fs.readFileSync(YAML, 'utf8');
  const mdBruto = fs.readFileSync(MD, 'utf8');

  // ---------------------------------------------------------------------------
  // 1. §46.11 - o espelho e DERIVADO
  // ---------------------------------------------------------------------------
  test('§46.11 — o espelho contém TODAS as rubricas do modelo canônico (extraídas do método :926-968)', () => {
    assert.ok(RUBRICAS_46_11.length >= 30, `rubricas extraídas do método: ${RUBRICAS_46_11.length} (esperado >= 30)`);
    const faltando = RUBRICAS_46_11.filter((r) => !mdBruto.includes(r));
    assert.deepStrictEqual(faltando, [], `rubricas ausentes no espelho: ${faltando.join(' | ')}`);
  });

  test('§46.11 — o espelho deriva do YAML: --check exit 0 no repositório real', () => {
    const r = rodar(GERADOR, ['--check']);
    assert.strictEqual(r.exit, 0, `exit ${r.exit}\n${r.saida}`);
    assert.ok(/CHECK: IDENTICO/.test(r.saida), r.saida);
  });

  test('§46.11 — geração determinística: duas gerações produzem bytes idênticos', () => {
    const a = rodar(GERADOR, []);
    const b = rodar(GERADOR, []);
    assert.strictEqual(a.exit, 0, a.saida);
    assert.strictEqual(a.saida, b.saida, 'duas gerações divergiram');
    assert.strictEqual(a.saida, mdBruto, 'o espelho em disco difere do gerado');
  });

  test('§46.11 — nenhum valor do espelho é reescrito: toda linha de valor aparece no YAML', () => {
    const r = rodar(GERADOR, ['--mapa']);
    assert.strictEqual(r.exit, 0, r.saida);
    const linhas = r.saida.split(/\r?\n/).filter((l) => l.includes('\t') && !l.startsWith('linha\t') && !l.startsWith('#'));
    assert.ok(linhas.length > 100, `mapa com ${linhas.length} linhas`);
    const derivadas = linhas.map((l) => l.split('\t')).filter((c) => c[2] === 'yaml');
    assert.ok(derivadas.length >= 60, `linhas com valor derivado do YAML: ${derivadas.length}`);
    const suspeitas = derivadas.filter((c) => c[3].split(' ⇢ ').some((v) => v.trim() !== '' && !yamlBruto.includes(v)));
    assert.deepStrictEqual(suspeitas.map((s) => `L${s[0]}:${s[3]}`), [], 'valor no espelho que NÃO existe no YAML canônico');
  });

  test('§46.11 — mapa de derivação: toda linha de valor tem chave declarada (nenhuma linha órfã)', () => {
    const r = rodar(GERADOR, ['--mapa']);
    const linhas = r.saida.split(/\r?\n/).filter((l) => l.includes('\t') && l.startsWith('linha\t') === false && !l.startsWith('#'));
    const orfas = linhas.filter((l) => { const c = l.split('\t'); return c[2] === 'yaml' && (!c[1] || c[1] === '-'); });
    assert.deepStrictEqual(orfas, [], 'linha com valor do YAML sem chave de origem');
    const skeleton = linhas.filter((l) => l.split('\t')[2] === 'skeleton').length;
    assert.ok(skeleton > 0 && skeleton < 60, `linhas de estrutura fixa (modelo §46.11): ${skeleton}`);
  });

  test('RED §46.11 — espelho editado à mão: --check exit 1', () => {
    const p = copiarPar('mao');
    fs.appendFileSync(p.md, '\n- linha digitada à mão que o YAML não declara\n', 'utf8');
    const r = rodar(GERADOR, ['--yaml', p.yaml, '--md', p.md, '--check']);
    assert.strictEqual(r.exit, 1, `exit ${r.exit} (o gerador ACEITOU espelho editado à mão)\n${r.saida}`);
    assert.ok(/DIVERGENTE/.test(r.saida), r.saida);
  });

  test('RED §46.11 — YAML alterado sem regerar: --check exit 1', () => {
    const p = copiarPar('yaml');
    fs.writeFileSync(p.yaml, fs.readFileSync(p.yaml, 'utf8').replace('autor: HERMES', 'autor: OUTRO'), 'utf8');
    const r = rodar(GERADOR, ['--yaml', p.yaml, '--md', p.md, '--check']);
    assert.strictEqual(r.exit, 1, `exit ${r.exit} (YAML mudou e o espelho não regerado passou)\n${r.saida}`);
  });

  test('RED §46.11 — espelho ausente: --check exit 1', () => {
    const p = copiarPar('ausente');
    fs.rmSync(p.md);
    const r = rodar(GERADOR, ['--yaml', p.yaml, '--md', p.md, '--check']);
    assert.strictEqual(r.exit, 1, `exit ${r.exit}\n${r.saida}`);
    assert.ok(/ausente/i.test(r.saida), r.saida);
  });

  test('RED §46.11 — divergência apenas de terminador de linha (CRLF) também é detectada e reportada', () => {
    const p = copiarPar('crlf');
    fs.writeFileSync(p.md, fs.readFileSync(p.md, 'utf8').replace(/\n/g, '\r\n'), 'utf8');
    const r = rodar(GERADOR, ['--yaml', p.yaml, '--md', p.md, '--check']);
    assert.strictEqual(r.exit, 1, `exit ${r.exit}\n${r.saida}`);
    assert.ok(/terminador de linha/.test(r.saida), `esperava diagnóstico de CRLF vs LF:\n${r.saida}`);
  });

  test('§46.11 — o contrato do espelho é a nota verbatim do método (:926)', () => {
    assert.ok(mdBruto.includes(RUBRICAS_46_11[0]), `a primeira rubrica é a nota do §46.11: ${RUBRICAS_46_11[0]}`);
    assert.ok(/downplant_handoff\.yaml/.test(mdBruto) && /gerar-handoff-md\.mjs/.test(mdBruto),
      'o espelho não declara a fonte canônica nem o gerador');
  });

  // ---------------------------------------------------------------------------
  // 2. §46.13 - o relatorio do Curador
  // ---------------------------------------------------------------------------
  const relatorio = rodar(CURADOR, []).saida;

  test('§46.13 — o relatório do Curador contém TODAS as rubricas do modelo (extraídas do método :999-1015)', () => {
    assert.ok(RUBRICAS_46_13.length >= 14, `rubricas extraídas do método: ${RUBRICAS_46_13.length} (esperado >= 14)`);
    const faltando = RUBRICAS_46_13.filter((r) => !relatorio.includes(r));
    assert.deepStrictEqual(faltando, [], `rubricas ausentes no relatório §46.13: ${faltando.join(' | ')}`);
  });

  test('§46.13 — as seções aparecem na ORDEM do método', () => {
    const secoes = RUBRICAS_46_13.filter((r) => r.startsWith('## '));
    let anterior = -1;
    secoes.forEach((s) => {
      const i = relatorio.indexOf(s);
      assert.ok(i > anterior, `seção fora de ordem: ${s}`);
      anterior = i;
    });
  });

  test('§46.13 — os 6 campos de cabeçalho do modelo são preenchidos (nenhum vazio)', () => {
    ['- Commit observado:', '- Cômodos afetados:', '- Módulos afetados:', '- Circuitos afetados:',
      '- Estado anterior:', '- Estado encontrado:'].forEach((p) => {
      const l = campoDoRelatorio(relatorio, p);
      assert.ok(l !== null, `campo ausente: ${p}`);
      assert.ok(l.slice(p.length).trim() !== '', `campo vazio: ${p}`);
    });
  });

  test('§46.13 — par sincronizado: "Handoffs YAML/Markdown divergentes" = sem divergência', () => {
    const secao = secaoDoRelatorio(relatorio, '## Handoffs YAML/Markdown divergentes');
    assert.ok(secao !== null, 'seção ausente');
    assert.ok(/sem divergência/i.test(secao), secao);
    assert.ok(!/DIVERGENTES/.test(secao), `o espelho real está divergente:\n${secao}`);
  });

  test('RED §46.13 — espelho editado à mão: "Handoffs YAML/Markdown divergentes" = DIVERGENTES + ação mecânica listada', () => {
    const p = copiarPar('curador-mao');
    fs.appendFileSync(p.md, '\n- linha digitada à mão\n', 'utf8');
    const r = rodar(CURADOR, ['--par', p.dir]);
    assert.strictEqual(r.exit, 0, `o Curador deve RELATAR (exit 0): ${r.exit}\n${r.saida}`);
    const secao = secaoDoRelatorio(r.saida, '## Handoffs YAML/Markdown divergentes');
    assert.ok(/DIVERGENTES/.test(secao), secao);
    const mec = secaoDoRelatorio(r.saida, '## Alterações mecanicamente reconciliáveis');
    assert.ok(/gerar-handoff-md\.mjs --aplicar/.test(mec), `ação mecânica não listada:\n${mec}`);
    assert.ok(/Linhas presentes só no espelho \(sem derivação no YAML\): 1/.test(mec), `linha órfã não contabilizada:\n${mec}`);
    assert.ok(/\*\*Estado do Curador \(§46\.13\):\*\* `DIVERGENTE`/.test(r.saida), r.saida);
  });

  test('§46.13 — sem objeto materializado: estado NENHUMA AÇÃO', () => {
    const vazio = tempDir('vazio');
    const r = rodar(CURADOR, ['--par', vazio]);
    assert.strictEqual(r.exit, 0, `${r.exit}\n${r.saida}`);
    assert.ok(/\*\*Estado do Curador \(§46\.13\):\*\* `NENHUMA AÇÃO`/.test(r.saida), r.saida);
  });

  test('§46.13 — objeto com todos os campos do modelo + espelho derivado: estado SINCRONIZADO', () => {
    const dir = tempDir('sincronizado');
    const yaml = fixtureCompleto(dir);
    const md = path.join(dir, 'downplant_handoff.md');
    const g = rodar(GERADOR, ['--yaml', yaml, '--md', md, '--aplicar']);
    assert.strictEqual(g.exit, 0, g.saida);
    const r = rodar(CURADOR, ['--par', dir]);
    assert.strictEqual(r.exit, 0, `${r.exit}\n${r.saida}`);
    assert.ok(/\*\*Estado do Curador \(§46\.13\):\*\* `SINCRONIZADO`/.test(r.saida), r.saida);
    assert.ok(/Nenhuma: o espelho em disco já é byte a byte/.test(r.saida), r.saida);
  });

  test('§46.13 — o relatório é determinístico (stdout == arquivo de --out)', () => {
    const dir = tempDir('out');
    const saida = path.join(dir, 'relatorio.md');
    const r = rodar(CURADOR, ['--out', saida]);
    assert.strictEqual(r.exit, 0, r.saida);
    assert.strictEqual(fs.readFileSync(saida, 'utf8'), relatorio, 'o relatório em --out difere do stdout');
  });

  // ---------------------------------------------------------------------------
  // 3. §7.7 - limites do Curador (nao decide, so o mecanico)
  // ---------------------------------------------------------------------------
  test('§7.7 — o Curador NÃO muta nada sem --aplicar (sha256 da árvore antes/depois)', () => {
    const p = copiarPar('nao-muta');
    fs.appendFileSync(p.md, '\n- divergência plantada\n', 'utf8');
    const antes = hashArvore(p.dir);
    const r = rodar(CURADOR, ['--par', p.dir]);
    assert.strictEqual(r.exit, 0, r.saida);
    assert.deepStrictEqual(hashArvore(p.dir), antes, 'o Curador mutou a árvore sem --aplicar');
  });

  test('§7.7 — --aplicar aplica SOMENTE a ação mecânica: regera o espelho e NÃO toca o YAML', () => {
    const p = copiarPar('aplicar');
    fs.appendFileSync(p.md, '\n- divergência plantada\n', 'utf8');
    const shaYamlAntes = sha(p.yaml);
    const r = rodar(CURADOR, ['--par', p.dir, '--aplicar']);
    assert.strictEqual(r.exit, 0, `${r.exit}\n${r.saida}`);
    assert.strictEqual(sha(p.yaml), shaYamlAntes, 'o --aplicar alterou o YAML canônico');
    const check = rodar(GERADOR, ['--yaml', p.yaml, '--md', p.md, '--check']);
    assert.strictEqual(check.exit, 0, `o espelho não foi regerado:\n${check.saida}`);
    assert.ok(/Espelho regerado a partir do YAML canônico/.test(r.saida), r.saida);
    const mec = secaoDoRelatorio(r.saida, '## Atualização realizada');
    assert.ok(/gerar-handoff-md\.mjs/.test(mec), mec);
    assert.ok(/Nenhum outro arquivo foi tocado/.test(mec), mec);
  });

  test('§7.7 — o Curador recusa pedido de DECISÃO (exit != 0) sem tocar a árvore', () => {
    const p = copiarPar('recusa');
    const antes = hashArvore(p.dir);
    ['--decidir', '--fix', '--auto', '--patch', '--upgrade', '--resolver'].forEach((flag) => {
      const r = rodar(CURADOR, ['--par', p.dir, flag]);
      assert.notStrictEqual(r.exit, 0, `pedido de decisão ACEITO: ${flag}`);
      assert.ok(/não toma decisoes arquiteturais|nao toma decisoes arquiteturais/i.test(r.saida), r.saida);
    });
    assert.deepStrictEqual(hashArvore(p.dir), antes, 'a recusa mutou a árvore');
  });

  test('§7.7 — rodar o Curador no repositório real não altera o par, scripts/ nem o método', () => {
    const antesPar = hashArvore(PAR);
    const antesScripts = hashArvore(path.join(REPO, 'scripts', 'downplant'));
    const antesMetodo = sha(METODO);
    const r = rodar(CURADOR, []);
    assert.strictEqual(r.exit, 0, r.saida);
    assert.deepStrictEqual(hashArvore(PAR), antesPar, '08_Execucao_Ao_Vivo/ mudou');
    assert.deepStrictEqual(hashArvore(path.join(REPO, 'scripts', 'downplant')), antesScripts, 'scripts/downplant/ mudou');
    assert.strictEqual(sha(METODO), antesMetodo, 'o método canônico foi tocado');
  });

  test('sem processo paralelo — Curador e gerador REUSAM o validador canônico (nenhum segundo parser YAML)', () => {
    [GERADOR, CURADOR].forEach((arq) => {
      const fonte = fs.readFileSync(arq, 'utf8');
      assert.ok(/from '\.\/validar-handoff\.mjs'/.test(fonte), `${path.basename(arq)} não importa o validador canônico`);
      assert.ok(/import \{ parseYaml \}/.test(fonte), `${path.basename(arq)} não reusa parseYaml`);
      assert.ok(!/function\s+parseYaml/.test(fonte), `${path.basename(arq)} DUPLICA o parser YAML`);
    });
    const curador = fs.readFileSync(CURADOR, 'utf8');
    assert.ok(/from '\.\/gerar-handoff-md\.mjs'/.test(curador), 'o Curador não reusa o gerador (processo paralelo)');
    const gerador = fs.readFileSync(GERADOR, 'utf8');
    assert.ok(/import \{ parseYaml \} from VALIDADOR|import \{ parseYaml \} from '\.\/validar-handoff\.mjs'/.test(gerador) || /validar-handoff\.mjs/.test(gerador), 'gerador sem vínculo com o validador');
  });

  test('§32.14 — o validador canônico do handoff continua verde (não houve regressão no contrato)', () => {
    const r = rodar(VALIDADOR, ['.']);
    assert.strictEqual(r.exit, 0, `${r.exit}\n${r.saida}`);
    const pass = (r.saida.match(/PASS/g) || []).length;
    const fail = (r.saida.match(/FAIL/g) || []).length;
    assert.ok(pass >= 40, `PASS=${pass} (esperado >= 40)`);
    assert.strictEqual(fail, 0, `FAIL=${fail}`);
  });

  // ---------------------------------------------------------------------------
  // 4. §46.14 - homologacao (zero delta: ja implantado no #167)
  // ---------------------------------------------------------------------------
  test('§46.14 — homologado: o relatório do Vigia contém TODAS as rubricas do modelo (:1017-1028)', () => {
    assert.ok(RUBRICAS_46_14.length >= 8, `rubricas extraídas do método: ${RUBRICAS_46_14.length}`);
    const vigia = fs.readFileSync(RELATORIO_VIGIA, 'utf8');
    const faltando = RUBRICAS_46_14.filter((r) => !vigia.includes(r));
    assert.deepStrictEqual(faltando, [], `rubricas ausentes no relatório §46.14: ${faltando.join(' | ')}`);
  });

  test('§46.14 — o mecanismo do Vigia continua sendo o único gerador do relatório :46.14', () => {
    const r = rodar(VIGIA, []);
    assert.strictEqual(r.exit, 0, r.saida);
    assert.ok(/VIGIA DE DEPENDÊNCIAS/.test(r.saida), r.saida);
    assert.ok(/SINCRONIZADO \| DEFASADO \| NENHUMA AÇÃO/.test(r.saida), r.saida);
  });

  // ---------------------------------------------------------------------------
  // 5. Resultado
  // ---------------------------------------------------------------------------
  console.log(`\nRESULTADOS FINAIS: ${sucessos} PASS / ${falhas} FAIL`);
  if (falhas > 0) process.exitCode = 1;
}

module.exports = rodarSuite;

if (require.main === module) {
  try {
    rodarSuite();
  } catch (err) {
    console.error('Falha na fechadura §46.11/§46.13:', err);
    process.exit(1);
  }
}

}
