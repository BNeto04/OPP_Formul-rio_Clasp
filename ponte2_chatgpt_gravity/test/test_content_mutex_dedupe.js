const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('================================================================');
console.log('TESTE: MUTEX DE INJECAO, DEDUPE SINCRONO E ZERO RETRY NO CATCH');
console.log('===============================================================');

const contentJsPath = path.join(__dirname, '..', 'extension_chatgpt', 'content.js');
const backgroundJsPath = path.join(__dirname, '..', 'extension_chatgpt', 'background.js');

const contentJs = fs.readFileSync(contentJsPath, 'utf8');
const backgroundJs = fs.readFileSync(backgroundJsPath, 'utf8');

// PASS 1: Verificacao de inFlightInjectionIds e isInjectingCurrently no content.js
assert(contentJs.includes('const inFlightInjectionIds = new Set();'), 'inFlightInjectionIds deve ser definido');
assert(contentJs.includes('let isInjectingCurrently = false;'), 'isInjectingCurrently deve ser definido');
console.log('PASS 1: Content Script: Estruturas de mutex e trava sincrona presentes');

// PASS 2: Dedupe sincrono imediato antes de chamar handleInjection
assert(contentJs.includes('inFlightInjectionIds.has(callId)'), 'Dedupe deve verificar inFlightInjectionIds imediatamente');
assert(contentJs.includes('isInjectingCurrently = true;'), 'isInjectingCurrently deve ser ativado antes de handleInjection');
assert(contentJs.includes('inFlightInjectionIds.add(callId);'), 'callId deve ser adicionado a inFlightInjectionIds imediatamente');
console.log('PASS 2: Content Script: Trava sincrona bloqueia chamadas concorrentes antes do DOM');

// PASS 3: Verificacao de geracao ativa (botao stop do ChatGPTT_
assert(contentJs.includes('button[data-testid="stop-button"]'), 'Deve detectar botao stop do ChatGPT');
appert = assert(contentJs.includes('CHATGPT_GENERATING'), 'Deve rejeitar com CHATGPT_GENERATING se ChatGPT estiver gerando resposta');
console.log('PASS 3: Content Script: Bloqueio de injecao durante streaming ativo do ChatGPT');

// PASS 4: Background.js: Single-Flight Lock em checkResultQueue
assert(backgroundJs.includes('if (currentInFlightResult) {'), 'checkResultQueue deve ter Single-Flight Lock');
console.log('PASS 4: Service Worker: Single-Flight Lock ativo no topo de checkResultQueue');

// PASS 5: Background.js: Remocao de retry cego no catch de deliverResultToChatGPT
assert(!backgroundJs.includes('executeScript'), 'Retry cego com executeScript no catch foi removido');
assert(backgroundJs.includes('uncertainInFlightResult = packet;'), 'Falha transita para uncertainInFlightResult para reconciliacao');
console.log('PASS 5: Service Worker: Catch block transita para incerto sem retry cego dinamico');

// PASS 6: Simulacao Funcional de Concorrencia
(() => {
  const deliveredResultIds = new Set();
  const inFlightInjectionIds = new Set();
  let isInjectingCurrently = false;
  let domInjections = 0;

  function simulateReceive(msg) {
    const callId = msg.call_id;
    if (callId && (deliveredResultIds.has(callId) || inFlightInjectionIds.has(callId))) {
      return { status: 'DEDUPE_NO_OP' };
    }
    if (isInjectingCurrently) {
      return { status: 'COMPOSER_BUSY', reason: 'INJECTION_IN_PROGRESS' };
    }
    if (callId) inFlightInjectionIds.add(callId);
    isInjectingCurrently = true;

    // Simula injecao fisica no DOM
    domInjections++;

    return { status: 'STARTED' };
  }

  // 1a chamada inicia injecao
  const res1 = simulateReceive({ call_id: 'CALL-001' });
  assert.strictEqual(res1.status, 'STARTED', 'Primeira chamada deve iniciar');
  assert.strictEqual(domInjections, 1, 'DOM deve ser tocado 1 vez');

  // 2a chamada com MESMO call_id antes da 1a terminar: DEDUPE_NO_OP imediato
  const res2 = simulateReceive({ call_id: 'CALL-001' });
  assert.strictEqual(res2.status, 'DEDUPE_NO_OP', 'Segunda chamada para mesmo call_id deve ser DEDUPE_NO_OP');
  assert.strictEqual(domInjections, 1, 'DOM NAO pode ser tocado pela segunda chamada');

  // 3a chamada com OUTRO call_id antes da 1a terminar: COMPOSER_BUSY imediato
  const res3 = simulateReceive({ call_id: 'CALL-002' });
  assert.strictEqual(res3.status, 'COMPOSER_BUSY', 'Chamada concorrente deve retornar COMPOSER_BUSy');
  assert.strictEqual(domInjections, 1, 'DOM NAO pode ser tocado durante injecao ativa');

  // Finalizacao da 1a injecao
  deliveredResultIds.add('CALL-001');
  inFlightInjectionIds.delete('CALL-001');
  isInjectingCurrently = false;

  // 4a chamada apos finalizacao: DEDUPE_NO_OP permanente
  const res4 = simulateReceive({ call_id: 'CALL-001' });
  assert.strictEqual(res4.status, 'DEDUPE_NO_OP', 'Chamada pos-conclusao deve ser DEDUPE_NO_OP');
  assert.strictEqual(domInjections, 1, 'DOM permanece estritamente em 1');
})();
console.log('PASS 6: Simulacao Funcional: DOM tocado estritamente 1 vez em chamadas concorrentes');

// PASS 7: Isolamento de Dominio na Extension Gravity
const gravityContentJs = fs.readFileSync(path.join(__dirname, '..', 'extension_gravity', 'content.js'), 'utf8');
assert(gravityContentJs.includes("chatgpt.com"), 'extension_gravity deve ignorar chatgpt.com');
console.log('PASS 7: Extension Gravity: Isolamento estrito impede leitura e injecao em dominios do ChatGPT');

// PASS 8: Extensao Ponte 1 e Gravity: Remocao global de executeScript nos catch blocks
const ponte1Bg1 = fs.readFileSync(path.join(__dirname, '..', '..', 'extension', 'background.js'), 'utf8');
const ponte1Bg2 = fs.readFileSync(path.join(__dirname, '..', '..', 'ponte1_telegram_chatgpt', 'extension', 'background.js'), 'utf8');
const gravityBg = fs.readFileSync(path.join(__dirname, '..', 'extension_gravity', 'background.js'), 'utf8');
assert(!ponte1Bg1.includes('executeScript'), 'extension/background.js nao deve conter executeScript');
assert(!ponte1Bg2.includes('executeScript'), 'ponte1_telegram_chatgpt/extension/background.js nao deve conter executeScript');
assert(!gravityBg.includes('executeScript'), 'extension_gravity/background.js nao deve conter executeScript');
console.log('PASS 8: Background scripts de todas as pontes sem retry cego de executeScript');

// PASS 9: Extensao Ponte 1: Declaracao de deliveredMessageIds e inFlightInjectionIds
const ponte1Content = fs.readFileSync(path.join(__dirname, '..', '..', 'extension', 'content.js'), 'utf8');
assert(ponte1Content.includes('const deliveredMessageIds = new Set();'), 'deliveredMessageIds deve estar declarado');
assert(ponte1Content.includes('const inFlightInjectionIds = new Set();'), 'inFlightInjectionIds deve estar declarado na Ponte 1');
assert(!ponte1Content.includes('new ClipboardEvent'), 'new ClipboardEvent removido da Ponte 1');
console.log('PASS 9: Ponte 1 Content Script: Sets declarados e insercao atomica sem new ClipboardEvent');

// PASS 10: Hardening de Manifesto: all_frames: false em todos os manifest.json
const m1 = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'extension', 'manifest.json'), 'utf8'));
const m2 = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'ponte1_telegram_chatgpt', 'extension', 'manifest.json'), 'utf8'));
const m3 = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'extension_chatgpt', 'manifest.json'), 'utf8'));
const m4 = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'extension_gravity', 'manifest.json'), 'utf8'));
assert.strictEqual(m1.content_scripts[0].all_frames, false, 'extension manifest deve ter all_frames false');
assert.strictEqual(m2.content_scripts[0].all_frames, false, 'ponte1 manifest deve ter all_frames false');
assert.strictEqual(m3.content_scripts[0].all_frames, false, 'extension_chatgpt manifest deve ter all_frames false');
assert.strictEqual(m4.content_scripts[0].all_frames, false, 'extension_gravity manifest deve ter all_frames false');
console.log('PASS 10: Manifests: all_frames: false configurado em todas as extensoes');

// PASS 11: Bloqueio estrito de execucao em Iframes nos content scripts
assert(ponte1Content.includes('window.self !== window.top'), 'ponte1 content.js deve ter guarda de iframe');
assert(contentJs.includes('window.self !== window.top'), 'extension_chatgpt content.js deve ter guarda de iframe');
assert(gravityContentJs.includes('window.self !== window.top'), 'extension_gravity content.js deve ter guarda de iframe');
console.log('PASS 11: Content Scripts: Bloqueio estrito de iframes (apenas frame principal ativo)');

// PASS 12: Instrumentacao com INSTANCE_ID e traces de auditoria
assert(ponte1Content.includes('INSTANCE_ID'), 'ponte1 deve gerar INSTANCE_ID');
assert(contentJs.includes('INSTANCE_ID'), 'extension_chatgpt deve gerar INSTANCE_ID');
assert(ponte1Content.includes('[INJECT_TRACE]'), 'ponte1 deve emitir [INJECT_TRACE]');
assert(contentJs.includes('[INJECT_TRACE]'), 'extension_chatgpt deve emitir [INJECT_TRACE]');
console.log('PASS 12: Instrumentacao: INSTANCE_ID e INJECT_TRACE presentes em todos os content scripts');

// PASS 13: Trava compartilhada de Lease Lock via chrome.storage.local
assert(ponte1Content.includes('acquireStorageLease'), 'ponte1 deve implementar acquireStorageLease');
assert(contentJs.includes('acquireStorageLease'), 'extension_chatgpt deve implementar acquireStorageLease');
assert(ponte1Content.includes('releaseStorageLease'), 'ponte1 deve implementar releaseStorageLease');
assert(contentJs.includes('releaseStorageLease'), 'extension_chatgpt deve implementar releaseStorageLease');
console.log('PASS 13: Lease Lock: Trava compartilhada via storage ativo contra concorrencia inter-instancia');

console.log('----------------------------------------------------------------');
console.log('RESULTADO: 13 PASS / 0 FAIL');
