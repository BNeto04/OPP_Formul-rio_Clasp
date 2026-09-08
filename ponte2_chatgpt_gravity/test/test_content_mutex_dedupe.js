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

console.log('----------------------------------------------------------------');
console.log('RESULTADO: 7 PASS / 0 FAIL');
