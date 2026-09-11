'use strict';
if (typeof require === 'undefined') { /* Ignora no Apps Script */ } else {

/**
 * ARQUIVO: Testes/TestWebAppExecucao.js
 * DESCRICAO: Seguranca e comportamento do endpoint HTTP de execucao headless (Entrada/WebAppExecucao.js).
 *
 * O endpoint e infraestrutura: sem token valido nada roda, e so a lista branca e executavel.
 * Este teste prova exatamente isso, com spies para garantir que a funcao NAO foi chamada quando nao deve.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('Iniciando Testes: endpoint de execucao headless (web app)...\n');

let passou = 0, falhou = 0;
function test(nome, fn) {
  chamadas = []; // cada caso comeca limpo (spies zerados)
  try { fn(); console.log(`  [PASS] ${nome}`); passou++; }
  catch (e) { console.error(`  [FAIL] ${nome}:`, e.message); falhou++; }
}

const REPO = path.join(__dirname, '..');
const fonte = fs.readFileSync(path.join(REPO, 'Entrada/WebAppExecucao.js'), 'utf8');

// ---- ambiente Apps Script simulado ----
const TOKEN = 'segredo-de-teste-123';
let chamadas = [];
function instalarGlobais() {
  chamadas = [];
  globalThis.PropertiesService = {
    getScriptProperties: () => ({ getProperty: (k) => (k === 'TOKEN_EXECUCAO' ? TOKEN : null) })
  };
  globalThis.ContentService = {
    MimeType: { JSON: 'application/json' },
    createTextOutput: (t) => ({ _t: t, setMimeType() { return this; }, getContent() { return this._t; } })
  };
  // funcao de lista branca (real no Apps Script) - aqui um stub espiado
  globalThis.getEfetivo = function (limite) { chamadas.push(['getEfetivo', limite]); return [{ nome: 'ANDRESSON', posto: 'CB' }]; };
  globalThis.naoPermitida = function () { chamadas.push(['naoPermitida']); return 'nunca'; };
  globalThis.funcaoPrivada_ = function () { chamadas.push(['funcaoPrivada_']); return 'nunca'; };
}
instalarGlobais();
// carrega o arquivo do endpoint no escopo global (como no Apps Script)
const modulo = new Function(fonte + '\nreturn { doGet: doGet, doPost: doPost, executarComando_: executarComando_, lista: EXECUCAO_LISTA_BRANCA_ };')();

function corpo(obj) { return JSON.parse(obj.getContent ? obj.getContent() : String(obj)); }
function req(body, params) {
  return { postData: body ? { contents: JSON.stringify(body) } : undefined, parameter: params || {} };
}

test('lista branca nao contem funcao privada (terminada em "_")', () => {
  assert.ok(modulo.lista.length > 0, 'lista branca vazia');
  modulo.lista.forEach((f) => assert.ok(!/_$/.test(f), 'funcao privada na lista branca: ' + f));
});

test('sem token: NAO_AUTORIZADO e a funcao NAO e chamada', () => {
  const r = corpo(modulo.doPost(req({ funcao: 'getEfetivo' })));
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.erro, 'NAO_AUTORIZADO');
  assert.strictEqual(chamadas.length, 0, 'chamou a funcao sem token: ' + JSON.stringify(chamadas));
});

test('token errado (mesmo tamanho): NAO_AUTORIZADO e nao chama', () => {
  const errado = 'X'.repeat(TOKEN.length);
  const r = corpo(modulo.doPost(req({ token: errado, funcao: 'getEfetivo' })));
  assert.strictEqual(r.erro, 'NAO_AUTORIZADO');
  assert.strictEqual(chamadas.length, 0);
});

test('token certo + funcao fora da lista: FUNCAO_NAO_PERMITIDA e nao chama', () => {
  const r = corpo(modulo.doPost(req({ token: TOKEN, funcao: 'naoPermitida' })));
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.erro, 'FUNCAO_NAO_PERMITIDA');
  assert.strictEqual(chamadas.length, 0, 'executou funcao fora da lista');
});

test('token certo + funcao privada (nome com "_" no fim): recusada sem executar', () => {
  const r = corpo(modulo.doPost(req({ token: TOKEN, funcao: 'funcaoPrivada_' })));
  assert.strictEqual(r.erro, 'FUNCAO_NAO_PERMITIDA');
  assert.strictEqual(chamadas.length, 0);
});

test('token certo + funcao da lista: executa e devolve o resultado', () => {
  const r = corpo(modulo.doPost(req({ token: TOKEN, funcao: 'getEfetivo', params: [10] })));
  assert.strictEqual(r.ok, true, JSON.stringify(r));
  assert.strictEqual(r.funcao, 'getEfetivo');
  assert.deepStrictEqual(r.resultado, [{ nome: 'ANDRESSON', posto: 'CB' }]);
  assert.deepStrictEqual(chamadas, [['getEfetivo', 10]], 'parametros nao repassados');
});

test('aceita parametros por formulario (sem postData) e token em parameter', () => {
  const r = corpo(modulo.doPost({ parameter: { token: TOKEN, funcao: 'getEfetivo', params: '[7]' } }));
  assert.strictEqual(r.ok, true, JSON.stringify(r));
  assert.deepStrictEqual(chamadas, [['getEfetivo', 7]]);
});

test('corpo JSON invalido: CORPO_INVALIDO, sem executar', () => {
  const r = corpo(modulo.doPost({ postData: { contents: '{nao-e-json' }, parameter: { token: TOKEN, funcao: 'getEfetivo' } }));
  assert.strictEqual(r.erro, 'CORPO_INVALIDO');
  assert.strictEqual(chamadas.length, 0);
});

test('erro dentro da funcao vira FALHA_EXECUCAO com mensagem (nao vaza stack)', () => {
  globalThis.getEfetivo = function () { throw new Error('falha simulada'); };
  const r = corpo(modulo.doPost(req({ token: TOKEN, funcao: 'getEfetivo' })));
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.erro, 'FALHA_EXECUCAO');
  assert.strictEqual(r.mensagem, 'falha simulada');
});

test('doGet e health check: responde sem token e nao executa nada', () => {
  instalarGlobais();
  const r = corpo(modulo.doGet({ parameter: {} }));
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.servico, 'execucao-headless');
  assert.strictEqual(r.tokenConfigurado, true);
  assert.strictEqual(chamadas.length, 0);
});

test('o token NUNCA aparece no codigo-fonte do endpoint (fica em Script Properties)', () => {
  assert.ok(/TOKEN_EXECUCAO/.test(fonte), 'endpoint nao le a propriedade TOKEN_EXECUCAO');
  assert.ok(!/token\s*[:=]\s*['"][A-Za-z0-9\-_]{8,}['"]/i.test(fonte), 'possivel token embutido no codigo');
});

console.log(`\nRESULTADOS FINAIS: ${passou} PASS / ${falhou} FAIL`);
if (falhou > 0) process.exitCode = 1;
}
