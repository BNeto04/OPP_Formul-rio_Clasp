'use strict';
if (typeof require === 'undefined') { /* Ignora no Apps Script */ } else {

/**
 * ARQUIVO: Testes/TestSemRedefinicaoGlobal.js
 * DESCRICAO: Guarda contra redefinicao de simbolos globais no produto Apps Script (card #134 COMPAT-FIX-001).
 *
 * Por que existe: no Apps Script todas as funcoes de topo convivem no MESMO escopo global e a ULTIMA
 * definicao carregada vence. Duas definicoes do mesmo nome = comportamento dependente da ordem de carga.
 * Este teste falha se isso voltar a acontecer, no conjunto efetivamente ENVIADO ao Apps Script.
 *
 * Verifica:
 *  1. nenhum nome de funcao de topo definido em DOIS arquivos enviados;
 *  2. os simbolos do card #134 tem definicao UNICA no produto;
 *  3. `Compatibilidade.js` nao redefine nenhum simbolo vivo (guarda de reintroducao);
 *  4. builders mortos `criarMenuPip_`/`criarMenuCPM_` inexistentes e sem chamadas;
 *  5. todo alvo do menu P3 esta definido no conjunto ENVIADO, exceto `rodarTesteDeHomologacao`,
 *     que e declaradamente fora do push (`Homologacao/**` no .claspignore) e existe uma unica vez no repo.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('Iniciando Testes: Guarda contra redefinicao global (COMPAT-FIX-001)...\n');

let sucessos = 0, falhas = 0;
function test(nome, fn) {
  try { fn(); console.log(`  [PASS] ${nome}`); sucessos++; }
  catch (err) { console.error(`  [FAIL] ${nome}:`, err.message); falhas++; }
}

const REPO = path.join(__dirname, '..');

// ---------- .claspignore: o que NAO e enviado ao Apps Script ----------
function padroesIgnorados() {
  return fs.readFileSync(path.join(REPO, '.claspignore'), 'utf8')
    .split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('#'));
}
function combinaGlob(rel, padrao) {
  const esc = padrao.replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '\u0000').replace(/\*/g, '[^/]*').replace(/\u0000/g, '.*');
  const re = new RegExp('^' + esc + '$');
  if (re.test(rel)) return true;
  // "dir/**" tambem casa tudo dentro de dir
  if (padrao.endsWith('/**') && rel.startsWith(padrao.slice(0, -3) + '/')) return true;
  return false;
}
function ehEnviado(rel) {
  return !padroesIgnorados().some(p => combinaGlob(rel, p) || combinaGlob(rel.split('/').pop(), p));
}

const PULAR_DIR = new Set(['.git', 'node_modules']);
const arquivos = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) { if (!PULAR_DIR.has(e.name)) walk(path.join(dir, e.name)); }
    else if (e.name.endsWith('.js')) arquivos.push(path.relative(REPO, path.join(dir, e.name)).replace(/\\/g, '/'));
  }
})(REPO);

const enviados = arquivos.filter(ehEnviado);
const naoEnviados = arquivos.filter(f => !ehEnviado(f));

/** Mapa nome -> [arquivo, ...] das funcoes de topo. */
function definicoes(lista) {
  const mapa = {};
  lista.forEach(rel => {
    const src = fs.readFileSync(path.join(REPO, rel), 'utf8');
    src.split(/\r?\n/).forEach((linha, i) => {
      const m = linha.match(/^function\s+([A-Za-z_$][\w$]*)\s*\(/)
             || linha.match(/^(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*function\b/);
      if (m) (mapa[m[1]] = mapa[m[1]] || []).push(`${rel}:${i + 1}`);
    });
  });
  return mapa;
}
const defsEnviados = definicoes(enviados);
const defsProduto = definicoes(enviados.concat(naoEnviados.filter(f => f.startsWith('Homologacao/'))));

console.log(`  (arquivos .js: ${arquivos.length} | enviados ao Apps Script: ${enviados.length} | fora do push: ${naoEnviados.length})\n`);

// ---------- 1. guarda principal ----------
test('nenhuma funcao de topo tem duas definicoes no conjunto ENVIADO ao Apps Script', () => {
  const dups = Object.keys(defsEnviados).filter(n => defsEnviados[n].length > 1);
  const detalhe = dups.map(n => `${n} -> ${defsEnviados[n].join(' , ')}`).join(' ; ');
  assert.deepStrictEqual(dups, [], 'simbolos com definicao duplicada (resolucao depende da ordem de carga): ' + detalhe);
});

// ---------- 2. simbolos do card ----------
test('simbolos do card #134 tem definicao UNICA no produto', () => {
  ['abrirMenuSelecaoLivre', 'iniciarModoAnual', 'compilarProdutividadeRapida',
   'compilarProdutividadeAvancada', 'rodarTesteDeHomologacao'].forEach(function (s) {
    const onde = defsProduto[s] || [];
    assert.strictEqual(onde.length, 1, `${s} deveria ter 1 definicao, tem ${onde.length}: ${onde.join(', ')}`);
  });
});

test('cada simbolo canonico esta no arquivo canonico esperado', () => {
  const esperado = {
    abrirMenuSelecaoLivre: 'Compilador_Armas.js',
    iniciarModoAnual: 'Compilador_Armas.js',
    compilarProdutividadeRapida: 'Features/CompiladorProdutividade.js',
    compilarProdutividadeAvancada: 'Features/CompiladorProdutividade.js',
    rodarTesteDeHomologacao: 'Homologacao/RodarTesteDeHomologacao.js'
  };
  Object.keys(esperado).forEach(function (s) {
    const arquivo = (defsProduto[s] || [''])[0].split(':')[0];
    assert.strictEqual(arquivo, esperado[s], `${s} deveria viver em ${esperado[s]}, vive em ${arquivo}`);
  });
});

// ---------- 3. guarda de reintroducao ----------
test('Compatibilidade.js nao redefine nenhum simbolo vivo (guarda de reintroducao)', () => {
  const fonte = fs.readFileSync(path.join(REPO, 'Compatibilidade.js'), 'utf8');
  const defs = [];
  fonte.split(/\r?\n/).forEach((l, i) => {
    const m = l.match(/^function\s+([A-Za-z_$][\w$]*)\s*\(/);
    if (m) defs.push(`${m[1]}:${i + 1}`);
  });
  const proibidos = ['abrirMenuSelecaoLivre', 'iniciarModoAnual', 'compilarProdutividadeRapida',
    'compilarProdutividadeAvancada', 'rodarTesteDeHomologacao'];
  const reintroduzidos = defs.filter(d => proibidos.indexOf(d.split(':')[0]) !== -1);
  assert.deepStrictEqual(reintroduzidos, [], 'simbolo vivo voltou a ser definido em Compatibilidade.js: ' + reintroduzidos.join(', '));
  // o que sobrou ali sao apenas facades unicas de compatibilidade
  defs.forEach(function (d) {
    const nome = d.split(':')[0];
    assert.ok(['compilarPIP', 'compilarCPM', 'compilarProdutividadeBetaV2'].indexOf(nome) !== -1,
      'simbolo inesperado em Compatibilidade.js: ' + nome);
  });
});

// ---------- 4. builders mortos ----------
test('builders mortos criarMenuPip_ e criarMenuCPM_ foram eliminados e nao tem chamadas', () => {
  ['criarMenuPip_', 'criarMenuCPM_'].forEach(function (s) {
    assert.strictEqual(defsProduto[s], undefined, `${s} ainda esta definido: ${(defsProduto[s] || []).join(', ')}`);
    const chamadas = arquivos.filter(rel => !rel.startsWith('Testes/')).filter(rel => {
      const src = fs.readFileSync(path.join(REPO, rel), 'utf8');
      return src.split(/\r?\n/).some(l => !l.trim().startsWith('//') && new RegExp(s + '\\s*\\(').test(l));
    });
    assert.deepStrictEqual(chamadas, [], `${s} ainda e chamado em: ${chamadas.join(', ')}`);
  });
});

// ---------- 5. menu P3 x conjunto enviado ----------
test('todo alvo do menu P3 existe no conjunto ENVIADO, exceto o [Dev] declaradamente fora do push', () => {
  const menu = fs.readFileSync(path.join(REPO, 'Entrada/Menu.js'), 'utf8');
  const alvos = [];
  menu.replace(/alvo:\s*'([A-Za-z_$][\w$]*)'/g, (_, a) => { alvos.push(a); return _; });
  assert.ok(alvos.length >= 16, 'esperado ao menos 16 alvos no menu, encontrados ' + alvos.length);
  const foraDoPush = ['rodarTesteDeHomologacao'];
  const problemas = [];
  alvos.forEach(function (a) {
    const enviado = !!defsEnviados[a];
    if (foraDoPush.indexOf(a) !== -1) {
      if (enviado) problemas.push(`${a} deveria estar FORA do push mas esta enviado`);
      else if (!(defsProduto[a] || []).length) problemas.push(`${a} nao existe em lugar nenhum`);
    } else if (!enviado) {
      problemas.push(`${a} e alvo do menu mas NAO e enviado ao Apps Script`);
    }
  });
  assert.deepStrictEqual(problemas, [], problemas.join(' ; '));
});

console.log(`\nRESULTADOS FINAIS: ${sucessos} PASS / ${falhas} FAIL`);
if (falhas > 0) process.exitCode = 1;
}
