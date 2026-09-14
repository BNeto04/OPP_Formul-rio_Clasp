'use strict';
if (typeof require === 'undefined') { /* Ignora no Apps Script */ } else {

/**
 * ARQUIVO: Testes/TestVigiaDependencias.js
 * CARD:    #167 [DP24-004] - FECHADURA do vinculo de tecnologia existente (§31.4/§31.6) e do
 *          Vigia de dependencias (§7.8 / §46.14).
 *
 * O QUE ESTA FECHADURA IMPEDE (regra do §31.6 + §40.8):
 *   1. dependencia vinculada SEM os campos do vinculo (nome, versao, fonte, data da decisao, Decisao);
 *   2. dependencia vinculada SEM Decisao associada (§46.4) - o §40.8 manda detectar exatamente isso;
 *   3. vinculo que nao aponta Modulo/Circuito/Porta reais - ou que aponta "para perto" em vez do artefato
 *      da Porta (§46.3): vinculo aproximado nao e vinculo;
 *   4. o Vigia DECIDIR ou APLICAR atualizacao por conta propria (proibido pelo §7.8/:234 e §31.6/:508).
 *
 * COMO ELA FUNCIONA (sem segundo validador concorrente):
 *   1. chama o validador canonico UNICO (`scripts/downplant/validar-dependencias.mjs`) como CLI e exige
 *      exit 0 no repositorio real e exit 1 em CADA cenario de RED (mutacao controlada de uma copia);
 *   2. rele os registros por conta propria (independente do validador) e confere campos, Decisao e
 *      existencia dos artefatos citados;
 *   3. exercita o Vigia: formato §46.14, determinismo (regerar == relatorio commitado), NAO-MUTACAO
 *      (sha256 da arvore antes/depois), recusa de flags de mutacao e ausencia de "auto-aplicacao"
 *      (a versao registrada permanece a mesma mesmo com upstream divergente).
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
const VALIDADOR = path.join(REPO, 'scripts', 'downplant', 'validar-dependencias.mjs');
const VIGIA = path.join(REPO, 'scripts', 'downplant', 'vigia-dependencias.mjs');
const REGISTRO = path.join(REPO, 'dependencias');
const SNAPSHOT = path.join(REGISTRO, 'vigia', 'UPSTREAM_OBSERVADO.json');
const RELATORIO = path.join(REGISTRO, 'vigia', 'RELATORIO_VIGIA_2026-09-14.md');

// Secao 46.14 do metodo canonico - headings verbatim, na ordem.
const HEADINGS_46_14 = [
  '# VIGIA DE DEPENDÊNCIAS',
  '## Dependências vinculadas monitoradas',
  '## Atualizações detectadas upstream',
  '## Divergência entre versão registrada e versão atual',
  '## Risco estimado da defasagem',
  '## Recomendação',
  '## Decisão humana necessária'
];
const LEGENDA_ESTADOS = 'SINCRONIZADO | DEFASADO | NENHUMA AÇÃO';
const CAMPOS_VINCULO = ['id', 'nome', 'tipo', 'vinculo', 'estado', 'versao', 'fonte', 'data_decisao',
  'decisao', 'vigia', 'data_registro'];
const CAMPOS_DEC = ['Estado', 'Data', 'Localizacao', 'Contexto', 'Decisao', 'Alternativas', 'Consequencias',
  'Riscos', 'Condicao de revisao'];

let sucessos = 0;
let falhas = 0;
function test(nome, fn) {
  try { fn(); console.log(`  [PASS] ${nome}`); sucessos++; }
  catch (err) { console.error(`  [FAIL] ${nome}: ${err.message}`); falhas++; }
}

// --- infraestrutura ----------------------------------------------------------
function rodar(script, args, cwd) {
  try {
    const saida = execFileSync(process.execPath, [script].concat(args), {
      cwd: cwd || REPO, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024
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
  return fs.mkdtempSync(path.join(os.tmpdir(), `fechadura167_${rotulo}_`));
}

function copiarRegistro(destino) {
  fs.cpSync(REGISTRO, destino, { recursive: true });
  return destino;
}

function arquivosDe(dir) {
  const out = [];
  (function walk(d) {
    for (const f of fs.readdirSync(d)) {
      const p = path.join(d, f);
      if (fs.statSync(p).isDirectory()) walk(p); else out.push(p);
    }
  })(dir);
  return out.sort();
}

function hashArvore(dir) {
  const mapa = {};
  arquivosDe(dir).forEach((p) => {
    mapa[path.relative(dir, p)] = crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
  });
  return mapa;
}

function lerFrontmatter(texto) {
  const m = texto.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  const fm = {};
  m[1].split(/\r?\n/).forEach((l) => {
    const i = l.indexOf(':');
    if (i > 0) {
      let v = l.slice(i + 1).trim();
      if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
      fm[l.slice(0, i).trim()] = v;
    }
  });
  return fm;
}

function registrosReais() {
  return fs.readdirSync(REGISTRO).filter((f) => /^DEP-\d+.*\.md$/.test(f)).sort()
    .map((f) => ({ arquivo: f, caminho: path.join(REGISTRO, f), texto: fs.readFileSync(path.join(REGISTRO, f), 'utf8') }))
    .map((r) => Object.assign(r, { fm: lerFrontmatter(r.texto) }));
}

function linhasTabelaVinculo(texto) {
  const i = texto.indexOf('## Vinculo estrutural');
  if (i < 0) return [];
  const resto = texto.slice(i);
  const fim = resto.indexOf('\n## ', 1);
  const bloco = fim >= 0 ? resto.slice(0, fim) : resto;
  return bloco.split(/\r?\n/)
    .filter((l) => l.trim().startsWith('|'))
    .filter((l) => !/^\|\s*-{2,}/.test(l.trim()))
    .filter((l) => !l.includes('| Modulo | Circuito |'))
    .map((l) => l.split('|').slice(1, -1).map((c) => c.trim()));
}

function rodarSuite() {
  console.log('====================================================');
  console.log('FECHADURA #167 - vinculo §31.4/§31.6 + Vigia de dependencias §7.8');
  console.log('====================================================\n');

  // ---------------------------------------------------------------------------
  // 1. Medicao do estado real: o validador canonico
  // ---------------------------------------------------------------------------
  console.log('[1] validador canonico do vinculo §31.6 (scripts/downplant/validar-dependencias.mjs)');
  const repoVal = rodar(VALIDADOR, []);

  test('o validador passa no repositorio real com exit 0 e 0 pendencia BLOQUEANTE', () => {
    assert.strictEqual(repoVal.exit, 0, `exit ${repoVal.exit}\n${repoVal.saida}`);
    assert.ok(/0 BLOQUEANTE/.test(repoVal.saida), repoVal.saida);
    const m = repoVal.saida.match(/(\d+) OK \/ (\d+) PENDENTE_DECLARADA \/ (\d+) BLOQUEANTE/);
    assert.ok(m, `resumo ausente na saida:\n${repoVal.saida}`);
    assert.ok(Number(m[1]) >= 40, `esperado >= 40 checagens OK, veio ${m[1]}`);
  });

  // ---------------------------------------------------------------------------
  // 2. Presenca dos vinculos, medida de forma independente do validador
  // ---------------------------------------------------------------------------
  console.log('\n[2] presenca dos vinculos §31.6 lida diretamente dos registros');
  const regs = registrosReais();
  let totalLinhas = 0;

  test('os 4 registros §31.6 existem', () => {
    assert.strictEqual(regs.length, 4, `esperado 4 registros DEP-*, veio ${regs.length}`);
  });

  test('todo registro declara nome, versao, fonte, data_decisao e decisao (§31.6)', () => {
    regs.forEach((r) => {
      CAMPOS_VINCULO.forEach((c) => {
        assert.ok(r.fm[c] && String(r.fm[c]).trim(), `${r.arquivo}: campo "${c}" ausente/vazio`);
      });
    });
  });

  test('a Decisao associada (§46.4) existe e tem os 9 campos do template', () => {
    regs.forEach((r) => {
      const alvo = fs.readdirSync(path.join(REGISTRO, 'decisoes'))
        .find((f) => f.startsWith(r.fm.decisao) && f.endsWith('.md'));
      assert.ok(alvo, `${r.arquivo}: Decisao "${r.fm.decisao}" inexistente`);
      const txt = fs.readFileSync(path.join(REGISTRO, 'decisoes', alvo), 'utf8');
      CAMPOS_DEC.forEach((c) => assert.ok(txt.includes(`**${c}:**`), `${alvo}: campo §46.4 "${c}" ausente`));
    });
  });

  test('todo registro vincula Modulo/Circuito/Porta com vinculo arquivo:linha existente', () => {
    regs.forEach((r) => {
      const linhas = linhasTabelaVinculo(r.texto);
      assert.ok(linhas.length >= 1, `${r.arquivo}: tabela de vinculo sem linhas`);
      totalLinhas += linhas.length;
      linhas.forEach((c, i) => {
        assert.ok(c.length === 5, `${r.arquivo} linha ${i + 1}: ${c.length} colunas (esperado 5)`);
        assert.ok(/^MOD-C\d\d-\d\d_/.test(c[0]), `${r.arquivo} linha ${i + 1}: modulo invalido "${c[0]}"`);
        assert.ok(/^PORTA-/.test(c[2]), `${r.arquivo} linha ${i + 1}: porta invalida "${c[2]}"`);
        // todo modulo citado existe de fato no cofre
        const achado = [];
        for (const comodo of fs.readdirSync(path.join(REPO, '02_Comodos'))) {
          const mods = path.join(REPO, '02_Comodos', comodo, '01_Dominio', 'modulos');
          if (fs.existsSync(mods) && fs.readdirSync(mods).includes(c[0])) achado.push(comodo, '01_Dominio', 'modulos', c[0]);
        }
        assert.strictEqual(achado.length, 4, `${r.arquivo} linha ${i + 1}: modulo ${c[0]} nao existe no cofre`);
        const dirMod = path.join(REPO, '02_Comodos', ...achado);
        // circuito: existente ou ausencia declarada
        if (c[1] === 'AUSENTE_DECLARADO') {
          assert.ok(!fs.existsSync(path.join(dirMod, `CIR-MOD-${c[0].replace(/^MOD-/, '')}.canvas`)),
            `${r.arquivo} linha ${i + 1}: declara circuito ausente mas ele existe`);
        } else {
          assert.ok(fs.existsSync(path.join(REPO, c[1])), `${r.arquivo} linha ${i + 1}: circuito inexistente ${c[1]}`);
        }
        // vinculo arquivo:linha
        const m = c[4].replace(/`/g, '').match(/^(.*):(\d+)$/);
        assert.ok(m, `${r.arquivo} linha ${i + 1}: vinculo "${c[4]}" fora do formato arquivo:linha`);
        const abs = path.join(REPO, m[1].trim());
        assert.ok(fs.existsSync(abs), `${r.arquivo} linha ${i + 1}: vinculo aponta arquivo inexistente ${m[1]}`);
        const linhasArq = fs.readFileSync(abs, 'utf8').split(/\r?\n/);
        assert.ok(Number(m[2]) >= 1 && Number(m[2]) <= linhasArq.length,
          `${r.arquivo} linha ${i + 1}: linha ${m[2]} fora de ${m[1]}`);
      });
    });
    assert.ok(totalLinhas >= 30, `esperado >= 30 vinculos declarados no total, veio ${totalLinhas}`);
  });

  test('todo registro aponta o artefato §46.3 da propria Porta (nao um arquivo vizinho)', () => {
    regs.forEach((r) => {
      linhasTabelaVinculo(r.texto).forEach((c, i) => {
        if (c[3].includes('SEM_ARQUIVO_46.3')) return; // ausencia declarada, conferida na secao 3
        const basename = c[4].replace(/`/g, '').replace(/:\d+$/, '').split('/').pop();
        assert.ok(basename.startsWith(c[2] + '_'),
          `${r.arquivo} linha ${i + 1}: vinculo "${basename}" nao e o artefato da Porta ${c[2]}`);
      });
    });
  });

  test('todo registro declara o Vigia, o mecanismo e a recusa de aplicar (§7.8)', () => {
    regs.forEach((r) => {
      assert.ok(r.texto.includes('## Vigia (§7.8 / §46.14)'), `${r.arquivo}: secao do Vigia ausente`);
      assert.ok(r.texto.includes('scripts/downplant/vigia-dependencias.mjs'), `${r.arquivo}: nao cita o mecanismo`);
      assert.ok(/nao aplica|não aplica/i.test(r.texto), `${r.arquivo}: nao declara a recusa de aplicar`);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. RED do validador: cada mutacao controlada tem de acusar
  // ---------------------------------------------------------------------------
  console.log('\n[3] RED do validador - mutacao controlada de uma copia do registro');
  const DEP1 = 'DEP-001_GOOGLE_APPS_SCRIPT.md';
  const DEP4 = 'DEP-004_ABAS_E_BASES_CANONICAS.md';

  function cenarioRed(rotulo, mutador, regexEsperada, alvo) {
    test(rotulo, () => {
      const tmp = tempDir('red');
      const copia = copiarRegistro(path.join(tmp, 'dependencias'));
      const arquivoAlvo = path.join(copia, alvo || DEP1);
      fs.writeFileSync(arquivoAlvo, mutador(fs.readFileSync(arquivoAlvo, 'utf8')), 'utf8');
      const r = rodar(VALIDADOR, ['--registro', copia]);
      assert.strictEqual(r.exit, 1, `esperado exit 1 no RED; veio ${r.exit}\n${r.saida}`);
      assert.ok(regexEsperada.test(r.saida), `RED nao trouxe a mensagem esperada ${regexEsperada}\n${r.saida}`);
    });
  }

  cenarioRed('RED-1: campo "versao" removido do cabecalho',
    (t) => t.replace(/^versao:.*\r?\n/m, ''),
    /campo do vinculo §31\.6 ausente ou vazio: "versao"/);

  cenarioRed('RED-2: campo "fonte" removido do cabecalho',
    (t) => t.replace(/^fonte:.*\r?\n/m, ''),
    /campo do vinculo §31\.6 ausente ou vazio: "fonte"/);

  cenarioRed('RED-3: Decisao associada apontando para DEC inexistente',
    (t) => t.replace('decisao: "DEC-DEP-001"', 'decisao: "DEC-DEP-999"'),
    /Decisao associada "DEC-DEP-999".*nao existe/);

  cenarioRed('RED-4: Decisao existente sem um campo do template §46.4',
    (t) => t.replace('- **Riscos:**', '- Riscos:'),
    /sem os campos do template §46\.4: Riscos/,
    'decisoes/DEC-DEP-001_RUNTIME_GOOGLE_APPS_SCRIPT.md');

  cenarioRed('RED-5: secao do Vigia removida do registro',
    (t) => t.replace(/## Vigia \(§7\.8 \/ §46\.14\)[\s\S]*?(?=\n## )/, ''),
    /secao "## Vigia \(§7\.8 \/ §46\.14\)" ausente/);

  cenarioRed('RED-6: modulo inexistente na tabela de vinculo',
    (t) => t.replace('| MOD-C00-03_INFRAESTRUTURA_CORE |', '| MOD-C00-99_INEXISTENTE |'),
    /Modulo "MOD-C00-99_INEXISTENTE" nao existe/);

  cenarioRed('RED-7: vinculo apontando arquivo que nao existe',
    (t) => t.replace(/portas\/PORTA-C00-03-P01_LOG_DE_AUDITORIA\.md:1/, 'portas/PORTA-C00-03-P01_INEXISTENTE.md:1'),
    /vinculo aponta .*INEXISTENTE\.md.* em vez do artefato da Porta|vinculo aponta arquivo inexistente/);

  cenarioRed('RED-8: tabela de vinculo sem linhas (cabecalho apenas)',
    (t) => t.replace(/(\| Modulo \| Circuito[\s\S]*?\n)((?:\|.*\n)+)/, '$1'),
    /tabela do vinculo estrutural sem linhas/);

  cenarioRed('RED-9: circuito declarado inexistente',
    (t) => t.replace('| AUSENTE_DECLARADO |', '| 02_Comodos/C00_Governanca_Estrutural/CIR-QUE-NAO-EXISTE.canvas |'),
    /circuito inexistente/);

  cenarioRed('RED-10: SEM_ARQUIVO_46.3 declarado para Porta que TEM artefato',
    (t) => t.replace('| grava a aba de log/auditoria dentro do runtime |', '| SEM_ARQUIVO_46.3: declarada ausente |'),
    /declara SEM_ARQUIVO_46\.3, mas o artefato/);

  cenarioRed('RED-11: registro sem a Decisao associada (§40.8)',
    (t) => t.replace(/^decisao:.*\r?\n/m, ''),
    /campo do vinculo §31\.6 ausente ou vazio: "decisao"/,
    DEP4);

  // ---------------------------------------------------------------------------
  // 4. Vigia: formato §46.14, determinismo e recusa
  // ---------------------------------------------------------------------------
  console.log('\n[4] Vigia de dependencias: formato §46.14, determinismo e recusa');
  const vigiaStdout = rodar(VIGIA, []);

  test('o Vigia roda em modo somente-leitura com exit 0', () => {
    assert.strictEqual(vigiaStdout.exit, 0, `exit ${vigiaStdout.exit}\n${vigiaStdout.saida}`);
  });

  test('o relatorio tem as 7 secoes verbatim do §46.14 e a legenda de estados', () => {
    HEADINGS_46_14.forEach((h) => assert.ok(vigiaStdout.saida.includes(h), `heading ausente: ${h}`));
    assert.ok(vigiaStdout.saida.includes(LEGENDA_ESTADOS), 'legenda de estados ausente');
    assert.ok(/\*\*Estado do Vigia \(§46\.14\):\*\* `(SINCRONIZADO|DEFASADO|NENHUMA AÇÃO)`/.test(vigiaStdout.saida),
      'estado do Vigia ausente ou fora do vocabulario do §46.14');
  });

  test('o relatorio commitado e reproduzivel (regerar == arquivo em disco)', () => {
    const commitado = fs.readFileSync(RELATORIO, 'utf8');
    assert.strictEqual(vigiaStdout.saida.replace(/\r\n/g, '\n'), commitado.replace(/\r\n/g, '\n'),
      'o relatorio em disco nao corresponde a uma geracao atual - relatorio desatualizado e deriva');
  });

  test('o Vigia recusa --aplicar, --atualizar, --fix e --auto com exit != 0', () => {
    ['--aplicar', '--atualizar', '--fix', '--auto'].forEach((flag) => {
      const r = rodar(VIGIA, [flag]);
      assert.notStrictEqual(r.exit, 0, `${flag} foi aceito (exit ${r.exit})`);
      assert.ok(/recusado|NAO aplica|NAO decide/i.test(r.saida), `${flag}: mensagem de recusa ausente`);
    });
  });

  // ---------------------------------------------------------------------------
  // 5. O Vigia NAO muta nada (sha256 da arvore antes/depois)
  // ---------------------------------------------------------------------------
  console.log('\n[5] NAO-MUTACAO do Vigia - sha256 da arvore de dependencias antes/depois');

  test('rodar o Vigia no sandbox nao altera, cria nem remove nenhum arquivo', () => {
    const tmp = tempDir('sandbox');
    const copia = copiarRegistro(path.join(tmp, 'dependencias'));
    const antes = hashArvore(copia);
    const r = rodar(VIGIA, ['--registro', copia]);
    assert.strictEqual(r.exit, 0, `exit ${r.exit}\n${r.saida}`);
    const depois = hashArvore(copia);
    assert.deepStrictEqual(depois, antes, 'o Vigia alterou a arvore do registro');
  });

  test('com --out, o Vigia escreve SOMENTE o arquivo indicado e nada mais', () => {
    const tmp = tempDir('out');
    const copia = copiarRegistro(path.join(tmp, 'dependencias'));
    const antes = hashArvore(copia);
    const alvo = path.join(tmp, 'relatorio_fora_do_registro.md');
    const r = rodar(VIGIA, ['--registro', copia, '--out', alvo]);
    assert.strictEqual(r.exit, 0, `exit ${r.exit}\n${r.saida}`);
    assert.ok(fs.existsSync(alvo), 'o relatorio pedido em --out nao foi escrito');
    assert.deepStrictEqual(hashArvore(copia), antes, 'o --out alterou a arvore do registro');
  });

  test('o Vigia NAO aplica a atualizacao: upstream divergente nao muda a versao registrada', () => {
    const tmp = tempDir('divergente');
    const copia = copiarRegistro(path.join(tmp, 'dependencias'));
    const snapshot = path.join(tmp, 'upstream_divergente.json');
    fs.writeFileSync(snapshot, JSON.stringify({
      observado_em: '2026-09-14',
      observador: 'fechadura #167 (fixture)',
      escopo: 'fixture de teste - observacao divergente',
      observacoes: [{ id: 'DEP-001', observado: true, versao_observada: 'V99', origem: 'fixture', risco: 'alto' }]
    }), 'utf8');
    const antes = hashArvore(copia);
    const r = rodar(VIGIA, ['--registro', copia, '--snapshot', snapshot]);
    assert.strictEqual(r.exit, 0, `exit ${r.exit}\n${r.saida}`);
    assert.ok(/DEP-001.*\*\*DEFASADO\*\*/.test(r.saida), `DEFASADO nao reportado:\n${r.saida}`);
    assert.ok(/\*\*Estado do Vigia \(§46\.14\):\*\* `DEFASADO`/.test(r.saida),
      'estado global deveria ser o PIOR observado (DEFASADO)');
    assert.ok(/Decisão humana necessária/.test(r.saida), 'secao de decisao humana ausente');
    assert.deepStrictEqual(hashArvore(copia), antes, 'o Vigia mutou o registro ao detectar defasagem');
    const dep = fs.readFileSync(path.join(copia, DEP1), 'utf8');
    assert.ok(/^versao: "V8"\r?$/m.test(dep), 'a versao registrada foi alterada pelo Vigia - auto-aplicacao proibida (§7.8)');
  });

  test('o Vigia nao inventa dado: registro sem observacao sai como NENHUMA AÇÃO, nunca SINCRONIZADO', () => {
    const tmp = tempDir('semobs');
    const copia = copiarRegistro(path.join(tmp, 'dependencias'));
    const snapshot = path.join(tmp, 'upstream_vazio.json');
    fs.writeFileSync(snapshot, JSON.stringify({ observado_em: '2026-09-14', observador: 'fixture', observacoes: [] }), 'utf8');
    const r = rodar(VIGIA, ['--registro', copia, '--snapshot', snapshot]);
    assert.strictEqual(r.exit, 0, `exit ${r.exit}\n${r.saida}`);
    assert.ok(!/SINCRONIZADO\*\*/.test(r.saida), `sem observacao nao pode haver SINCRONIZADO:\n${r.saida}`);
    assert.ok(/\*\*Estado do Vigia \(§46\.14\):\*\* `NENHUMA AÇÃO`/.test(r.saida), r.saida);
  });

  test('o Vigia recusado nao toca a arvore (fail-closed antes de qualquer leitura/escrita)', () => {
    const tmp = tempDir('recusa');
    const copia = copiarRegistro(path.join(tmp, 'dependencias'));
    const antes = hashArvore(copia);
    const r = rodar(VIGIA, ['--registro', copia, '--aplicar']);
    assert.notStrictEqual(r.exit, 0, 'pedido de mutacao foi aceito');
    assert.deepStrictEqual(hashArvore(copia), antes, 'a recusa mutou a arvore');
  });

  test('rodar o Vigia sobre o repositorio real nao altera dependencias/ nem scripts/downplant/', () => {
    const antesReg = hashArvore(REGISTRO);
    const antesScripts = hashArvore(path.join(REPO, 'scripts', 'downplant'));
    const r = rodar(VIGIA, []);
    assert.strictEqual(r.exit, 0, `exit ${r.exit}\n${r.saida}`);
    assert.deepStrictEqual(hashArvore(REGISTRO), antesReg, 'dependencias/ mudou');
    assert.deepStrictEqual(hashArvore(path.join(REPO, 'scripts', 'downplant')), antesScripts, 'scripts/downplant/ mudou');
  });

  // ---------------------------------------------------------------------------
  // 6. Resultado
  // ---------------------------------------------------------------------------
  console.log(`\nRESULTADOS FINAIS: ${sucessos} PASS / ${falhas} FAIL`);
  if (falhas > 0) process.exitCode = 1;
}

module.exports = rodarSuite;

if (require.main === module) {
  try {
    rodarSuite();
  } catch (err) {
    console.error('Falha na fechadura do vinculo §31.6 / Vigia §7.8:', err);
    process.exit(1);
  }
}

}
