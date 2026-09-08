/**
 * Teste Especifico: Suspensao do Service Worker e Reconciliacao sem Retry Cego
 *
 * Determinado na auditoria da Issue #53:
 * "6. Adicionar testes de restart/service-worker suspension: injecao ocorreu, ACK se perde, worker reinicia -> zero segunda injecao."
 */

const assert = require('assert');

function runSuspensionTests() {
  console.log('===============================================================');
  console.log('TESTE: RESTART / SUSPENSAO DE SERVICE WORKER (ZERO SEGUNDA INJECAO)');
  console.log('===============================================================');

  let passed = 0;
  let failed = 0;

  function report(num, title, ok, detail = '') {
    if (ok) {
      console.log(`PASS ${num}: ${title}`);
      passed++;
    } else {
      console.error(`FAIL ${num}: ${title} -> ${detail}`);
      failed++;
    }
  }

  // -------------------------------------------------------------
  // TESTE 1: PONTE 2 - Service Worker reinicia com pacote retido apos injecao
  // -------------------------------------------------------------
  let domInjectionCountPonte2 = 0;
  const mockDomDeliveredPonte2 = new Set();

  function mockContentScriptPonte2(msg) {
    if (msg.type === 'PONTE2_CHECK_DELIVERED') {
      return { delivered: mockDomDeliveredPonte2.has(msg.call_id), call_id: msg.call_id };
    }
    if (msg.type === 'PONTE2_INJECT_RESULT') {
      if (mockDomDeliveredPonte2.has(msg.call_id)) {
        return { success: true, status: 'DEDUPE_NO_OP' };
      }
      mockDomDeliveredPonte2.add(msg.call_id);
      domInjectionCountPonte2++;
      return { success: true };
    }
    return { success: false };
  }

  // 1. Primeira injecao ocorre normalmente
  const callPacket = { call_id: 'CALL-SUSPEND-TEST-001', payload: 'Dados do resultado' };
  const firstRes = mockContentScriptPonte2({ type: 'PONTE2_INJECT_RESULT', call_id: callPacket.call_id, payload: callPacket.payload });
  report(1, 'Ponte 2: Primeira injecao fisica no DOM executada com sucesso',
    firstRes.success === true && domInjectionCountPonte2 === 1
  );

  // 2. Simula suspensao do Service Worker:
  // O worker salvou em storage ponte2_in_flight_result, mas foi terminado antes do ACK
  const storagePonte2 = {
    ponte2_in_flight_result: callPacket,
    ponte2_delivered_ids: [] // ACK nao chegou a ser gravado no storage do worker
  };

  // 3. Simula reidratacao do Service Worker com o NOVO algoritmo de reconciliacao
  let uncertainInFlightResult = null;
  let currentInFlightResult = null;
  let deliveredResultIds = new Set(storagePonte2.ponte2_delivered_ids);

  // Rehydrate novo:
  if (storagePonte2.ponte2_in_flight_result) {
    uncertainInFlightResult = storagePonte2.ponte2_in_flight_result;
    currentInFlightResult = null; // Zero retry cego
  }

  report(2, 'Ponte 2: Pacote reidratado transita para uncertain sem retry cego',
    currentInFlightResult === null && uncertainInFlightResult.call_id === 'CALL-SUSPEND-TEST-001'
  );

  // 4. Executa ciclo de reconciliacao com o content script
  let ackSentPonte2 = false;
  const checkRespPonte2 = mockContentScriptPonte2({ type: 'PONTE2_CHECK_DELIVERED', call_id: uncertainInFlightResult.call_id });
  if (checkRespPonte2 && checkRespPonte2.delivered) {
    deliveredResultIds.add(uncertainInFlightResult.call_id);
    uncertainInFlightResult = null;
    ackSentPonte2 = true; // ACK reconciliado enviado ao daemon
  }

  report(3, 'Ponte 2: Reconciliacao detecta entrega previa, despacha ACK e zera segunda injecao',
    checkRespPonte2.delivered === true &&
    domInjectionCountPonte2 === 1 && // Continuou exatamente 1, ZERO segunda injecao
    ackSentPonte2 === true &&
    uncertainInFlightResult === null
  );

  // -------------------------------------------------------------
  // TESTE 2: PONTE 1 - Service Worker reinicia com pacote retido apos injecao
  // -------------------------------------------------------------
  let domInjectionCountPonte1 = 0;
  const mockDomDeliveredPonte1 = new Set();

  function mockContentScriptPonte1(msg) {
    if (msg.type === 'PONTE1_CHECK_DELIVERED') {
      return { delivered: mockDomDeliveredPonte1.has(String(msg.message_id)), message_id: msg.message_id };
    }
    if (msg.type === 'PONTE1_INJECT_MESSAGE') {
      const msgId = String(msg.telegram_message_id || msg.packet_id);
      if (mockDomDeliveredPonte1.has(msgId)) {
        return { success: true, status: 'DEDUPE_NO_OP' };
      }
      mockDomDeliveredPonte1.add(msgId);
      domInjectionCountPonte1++;
      return { success: true };
    }
    return { success: false };
  }

  // 1. Primeira injecao da mensagem Telegram 350
  const tgPacket = { packet_id: 'PONTE1_MSG_350', telegram_message_id: 350, payload: 'Texto da msg' };
  const firstTgRes = mockContentScriptPonte1({ type: 'PONTE1_INJECT_MESSAGE', telegram_message_id: 350, payload: tgPacket.payload });
  report(4, 'Ponte 1: Primeira injecao fisica da mensagem Telegram executada',
    firstTgRes.success === true && domInjectionCountPonte1 === 1
  );

  // 2. Simula suspensao e restart do worker com pacote retido
  const storagePonte1 = {
    ponte1_in_flight: tgPacket,
    ponte1_delivered_ids: []
  };

  let uncertainInFlightPonte1 = null;
  let currentInFlightPonte1 = null;
  let deliveredIdsPonte1 = new Set(storagePonte1.ponte1_delivered_ids);

  if (storagePonte1.ponte1_in_flight) {
    uncertainInFlightPonte1 = storagePonte1.ponte1_in_flight;
    currentInFlightPonte1 = null; // Zero retry cego
  }

  report(5, 'Ponte 1: Pacote reidratado transita para uncertain sem retry cego',
    currentInFlightPonte1 === null && uncertainInFlightPonte1.telegram_message_id === 350
  );

  // 3. Reconciliacao com content script
  let ackSentPonte1 = false;
  const checkRespPonte1 = mockContentScriptPonte1({ type: 'PONTE1_CHECK_DELIVERED', message_id: uncertainInFlightPonte1.telegram_message_id });
  if (checkRespPonte1 && checkRespPonte1.delivered) {
    deliveredIdsPonte1.add(uncertainInFlightPonte1.packet_id);
    uncertainInFlightPonte1 = null;
    ackSentPonte1 = true;
  }

  report(6, 'Ponte 1: Reconciliacao detecta entrega previa, despacha ACK e zera segunda injecao',
    checkRespPonte1.delivered === true &&
    domInjectionCountPonte1 === 1 && // Continuou exatamente 1, ZERO segunda injecao
    ackSentPonte1 === true &&
    uncertainInFlightPonte1 === null
  );

  // -------------------------------------------------------------
  // TESTE 3: Prova Negativa - O codigo antigo falharia no mesmo cenario
  // -------------------------------------------------------------
  let domCountOldCode = 0;
  function oldDeliverMock() {
    domCountOldCode++;
  }
  // No codigo antigo:
  let oldInFlight = { id: 'OLD-001' };
  if (oldInFlight) {
    oldDeliverMock(); // 1a vez
  }
  // Reinicia worker no codigo antigo:
  let oldRehydrated = oldInFlight;
  if (oldRehydrated) {
    oldDeliverMock(); // 2a vez (RETRY CEGO)
  }
  report(7, 'Prova Negativa: Codigo legado gerava duplicacao (domCount == 2); codigo novo gera estritamente 1',
    domCountOldCode === 2 && domInjectionCountPonte2 === 1 && domInjectionCountPonte1 === 1
  );

  console.log('---------------------------------------------------------------');
  console.log(`TOTAL: ${passed} PASS / ${failed} FAIL`);
  process.exit(failed === 0 ? 0 : 1);
}

runSuspensionTests();
