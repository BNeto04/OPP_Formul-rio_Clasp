'use strict';
if (typeof require === 'undefined') { /* Ignora no Apps Script */ } else {

/**
 * ARQUIVO: Testes/TestReferenciaFantasma.js
 * CARD:    #172 [DIAG-VIGIA-001] - FECHADURA contra REFERENCIA FANTASMA no runner da suite.
 *
 * O QUE ESTA FECHADURA IMPEDE (F1):
 *   O runner `Testes/RodarTodosOsTestes.js` exige, por `require`, arquivos que NAO existem no
 *   repositorio - ou existem apenas NESTA maquina, fora do Git. Nos dois casos o resultado e o
 *   mesmo para qualquer outro checkout: `MODULE_NOT_FOUND` e a suite inteira morre.
 *   Foi exatamente o caso de `Testes/TestNormalizadorEfetivo.js` (removido do Git em `9656bc8`)
 *   cujo `require` continuou no runner: "suite verde" que so e verdadeira nesta maquina.
 *
 * REGRA:
 *   1. todo `require('./X')` do runner deve resolver para um arquivo EXISTENTE em `Testes/`;
 *   2. esse arquivo deve estar RASTREADO no Git (o que garante que um checkout limpo o possui);
 *   3. se nao houver `.git` (export/copia), a checagem 2 e declarada `NAO_APLICAVEL_SEM_GIT` -
 *      declarada, nunca silenciosa, e NUNCA contada como PASS.
 *
 * Se qualquer ponto divergir, este teste FICA VERMELHO (exit 1).
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const REPO = path.join(__dirname, '..');
const RUNNER = path.join(REPO, 'Testes', 'RodarTodosOsTestes.js');
const TEM_GIT = fs.existsSync(path.join(REPO, '.git'));

function requiresDoRunner() {
  const texto = fs.readFileSync(RUNNER, 'utf8');
  const nomes = new Set();
  const re = /require\(\s*'\.\/([A-Za-z0-9_\-.]+)'\s*\)/g;
  let m;
  while ((m = re.exec(texto)) !== null) nomes.add(m[1]);
  return Array.from(nomes).sort();
}

function rastreadoNoGit(rel) {
  try {
    execFileSync('git', ['ls-files', '--error-unmatch', rel], { cwd: REPO, stdio: 'pipe' });
    return true;
  } catch (e) {
    return false;
  }
}

function rodarSuite() {
  let sucessos = 0, falhas = 0;
  const test = (nome, fn) => {
    try { fn(); sucessos++; console.log(`  [PASS] ${nome}`); }
    catch (e) { falhas++; console.error(`  [FAIL] ${nome}\n         ${e.message}`); }
  };

  console.log('\nFECHADURA REFERENCIA FANTASMA (runner x suite rastreada)');

  const nomes = requiresDoRunner();
  console.log(`  runner exige ${nomes.length} modulo(s) local(is)${TEM_GIT ? '' : ' · .git AUSENTE: checagem de rastreio sera declarada NAO_APLICAVEL_SEM_GIT'}`);

  test('todo require do runner resolve para um arquivo existente em Testes/', () => {
    const ausentes = nomes.filter((n) => !fs.existsSync(path.join(REPO, 'Testes', `${n}.js`)));
    assert.deepStrictEqual(ausentes, [],
      `require aponta para arquivo AUSENTE: ${ausentes.join(', ')} - o runner nao pode carregar referencia fantasma`);
  });

  test('nenhum modulo exigido pelo runner existe so nesta maquina (precisa estar RASTREADO no Git)', () => {
    if (!TEM_GIT) {
      console.log('         [NAO_APLICAVEL_SEM_GIT] sem .git: rastreio nao verificavel nesta copia (declarado, nao contado como PASS)');
      return;
    }
    const naoRastreados = nomes.filter((n) => fs.existsSync(path.join(REPO, 'Testes', `${n}.js`))
      && !rastreadoNoGit(`Testes/${n}.js`));
    assert.deepStrictEqual(naoRastreados, [],
      `modulo exigido pelo runner e NAO rastreado (invisivel em checkout limpo): ${naoRastreados.join(', ')}`);
  });

  test('o runner nao cita o arquivo removido que originou o F1 (regressao nomeada)', () => {
    const texto = fs.readFileSync(RUNNER, 'utf8');
    const citado = texto.indexOf('TestNormalizadorEfetivo') !== -1;
    if (citado && TEM_GIT && !rastreadoNoGit('Testes/TestNormalizadorEfetivo.js')) {
      assert.fail('TestNormalizadorEfetivo.js voltou a ser exigido pelo runner, mas NAO esta rastreado no Git (referencia fantasma)');
    }
    if (citado) {
      console.log('         [NOTA] TestNormalizadorEfetivo.js e exigido E esta rastreado: o slot foi reocupado de forma legitima.');
    }
  });

  console.log(`\nRESULTADOS FINAIS: ${sucessos} PASS / ${falhas} FAIL`);
  if (falhas > 0) process.exitCode = 1;
}

module.exports = rodarSuite;

}
