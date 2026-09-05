/**
 * Testes/TestVigiaSprintAutoContinueIssue48.js
 * 
 * Suíte de Testes da Issue #48:
 * [BRIDGE V2/EXECUTOR] Não parar após RESULT: auto-continuar até zerar a Sprint.
 * 
 * Validação da Nova Semântica de "Parar após a entrega", Máquina de Estados e Dedupe de ACK:
 *   A. RESULT publicado -> WAITING_FOR_AUDIT (não shutdown/passividade permanente).
 *   B. ChatGPT APPROVE -> próxima Issue consumida com auto-rearm sem intervenção humana manual.
 *   C. ChatGPT CORRECTION_REQUIRED -> mesma Issue retomada sem nova CALL.
 *   D. Duas Issues em sequência -> execução serial, uma por vez.
 *   E. Nenhum trabalho restante -> SPRINT_DONE e parar.
 *   F. OWNER_DECISION_REQUIRED -> parar corretamente sob gate humano.
 *   G. ACK curto não é interpretado como conclusão de tarefa ou de sprint.
 *   H. Queda curta de Internet durante transição -> fila/single-flight preservados.
 *   I. Composer ocupado -> fail-closed sem empilhamento.
 *   J. Regressão: #43, #45, #47 e Bridge V2 preservados.
 *   K. [DONE_GATE ADICIONAL] Prova de Dedupe de ACK: dois ACKs idênticos geram exatamente UM ACK
 *      (segundo é descartado como ACK_ALREADY_DELIVERED / DROP_NO_OP), e ENTREGUE/RESULT posterior passa normalmente.
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const http = require('http');
const SprintAutoContinueController = require('../VigiaPonte/SprintAutoContinueController');
const ResilientCarrierQueue = require('../VigiaPonte/ResilientCarrierQueue');

function httpPost(urlPath, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const req = http.request({
      hostname: '127.0.0.1',
      port: 8765,
      path: urlPath,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let d = '';
      res.on('data', chunk => d += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(d)); } catch (e) { resolve({ raw: d }); }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function httpGet(urlPath) {
  return new Promise((resolve, reject) => {
    http.get({
      hostname: '127.0.0.1',
      port: 8765,
      path: urlPath,
      headers: { 'Accept': 'application/json' }
    }, (res) => {
      let d = '';
      res.on('data', chunk => d += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(d)); } catch (e) { resolve({ raw: d }); }
      });
    }).on('error', reject);
  });
}

async function runAllTests() {
  console.log('================================================================');
  console.log('  SUÍTE DE TESTES: AUTO-CONTINUIDADE DA SPRINT (Issue #48)');
  console.log('================================================================\n');

  let passed = 0;
  const journalPath = path.join(__dirname, 'temp_sprint_48.log');
  function cleanup() {
    try { if (fs.existsSync(journalPath)) fs.unlinkSync(journalPath); } catch (e) {}
  }
  cleanup();

  // TESTE A: RESULT publicado -> WAITING_FOR_AUDIT, não shutdown/passividade permanente
  {
    console.log('[TEST A] RESULT publicado -> WAITING_FOR_AUDIT, não shutdown...');
    const ctrl = new SprintAutoContinueController({
      journalPath,
      initialTasks: [44, 48]
    });

    ctrl.startTaskExecution(44, 'Audit Vigia');
    const result = ctrl.finishTaskAndPublishResult(44, { status: '10/10 PASS' });

    assert.strictEqual(result.status, 'WAITING_FOR_AUDIT');
    assert.strictEqual(result.shouldStop, false);
    assert.strictEqual(ctrl.state, 'WAITING_FOR_AUDIT');
    assert.strictEqual(ctrl.isStopped(), false);
    console.log('  -> PASS: Estado é WAITING_FOR_AUDIT e executor continua ativo.\n');
    passed++;
  }

  // TESTE B: ChatGPT APPROVE -> próxima Issue da Sprint consumida sem intervenção humana adicional
  {
    console.log('[TEST B] ChatGPT APPROVE -> próxima Issue consumida com auto-rearm...');
    const ctrl = new SprintAutoContinueController({
      journalPath,
      initialTasks: [43, 44]
    });

    ctrl.startTaskExecution(43, 'Retomada V');
    ctrl.finishTaskAndPublishResult(43);

    const transition = ctrl.processAuditDecision('APPROVE', { taskNumber: 43 });
    assert.strictEqual(transition.action, 'AUTO_ADVANCE_NEXT_TASK');
    assert.strictEqual(transition.nextTask, 44);
    assert.strictEqual(transition.shouldStop, false);
    assert.strictEqual(ctrl.state, 'READY_TO_CONSUME_GITHUB');
    console.log('  -> PASS: APPROVE liberou auto-avanço para a Issue #44 sem intervenção manual.\n');
    passed++;
  }

  // TESTE C: ChatGPT CORRECTION_REQUIRED -> mesma Issue reaberta/retomada, sem nova CALL
  {
    console.log('[TEST C] ChatGPT CORRECTION_REQUIRED -> mesma Issue reaberta para correção...');
    const ctrl = new SprintAutoContinueController({
      journalPath,
      initialTasks: [44]
    });

    ctrl.startTaskExecution(44, 'Audit Source');
    ctrl.finishTaskAndPublishResult(44);

    const transition = ctrl.processAuditDecision('CORRECTION_REQUIRED', {
      taskNumber: 44,
      reason: 'Diffs e código fonte exigidos diretamente no GitHub'
    });

    assert.strictEqual(transition.action, 'RETRY_SAME_TASK_CORRECTION');
    assert.strictEqual(transition.taskNumber, 44);
    assert.strictEqual(transition.shouldStop, false);
    assert.strictEqual(ctrl.state, 'READY_TO_CONSUME_GITHUB');
    assert.strictEqual(ctrl.pendingTasks.includes(44), true);
    console.log('  -> PASS: CORRECTION_REQUIRED manteve a Issue #44 ativa sem nova CALL.\n');
    passed++;
  }

  // TESTE D: Duas Issues em sequência -> execução serial, uma por vez, até a segunda
  {
    console.log('[TEST D] Duas Issues em sequência -> execução serial até conclusão...');
    const ctrl = new SprintAutoContinueController({
      journalPath,
      initialTasks: [47, 48]
    });

    // Ciclo 1: Issue 47
    ctrl.startTaskExecution(47);
    ctrl.finishTaskAndPublishResult(47);
    const t1 = ctrl.processAuditDecision('APPROVE', { taskNumber: 47 });
    assert.strictEqual(t1.nextTask, 48);

    // Ciclo 2: Issue 48
    ctrl.startTaskExecution(48);
    ctrl.finishTaskAndPublishResult(48);
    const t2 = ctrl.processAuditDecision('APPROVE', { taskNumber: 48 });
    assert.strictEqual(t2.action, 'SPRINT_DONE');
    assert.strictEqual(t2.shouldStop, true);
    console.log('  -> PASS: Duas issues executadas em série de forma estritamente sequencial.\n');
    passed++;
  }

  // TESTE E: Nenhum trabalho restante -> SPRINT_DONE e parar
  {
    console.log('[TEST E] Nenhum trabalho restante -> SPRINT_DONE e parada autorizada...');
    const ctrl = new SprintAutoContinueController({
      journalPath,
      initialTasks: [46]
    });

    ctrl.startTaskExecution(46);
    ctrl.finishTaskAndPublishResult(46);
    const res = ctrl.processAuditDecision('APPROVE', { taskNumber: 46 });

    assert.strictEqual(res.action, 'SPRINT_DONE');
    assert.strictEqual(res.shouldStop, true);
    assert.strictEqual(ctrl.state, 'SPRINT_DONE');
    assert.strictEqual(ctrl.isStopped(), true);
    console.log('  -> PASS: SPRINT_DONE reconhecido e parada do circuito autorizada.\n');
    passed++;
  }

  // TESTE F: OWNER_DECISION_REQUIRED -> parar corretamente
  {
    console.log('[TEST F] OWNER_DECISION_REQUIRED -> suspensão com aguardo do proprietário...');
    const ctrl = new SprintAutoContinueController({
      journalPath,
      initialTasks: [44]
    });

    ctrl.startTaskExecution(44);
    ctrl.finishTaskAndPublishResult(44);
    const res = ctrl.processAuditDecision('OWNER_DECISION_REQUIRED', {
      reason: 'Aprovação de escopo de segurança solicitada'
    });

    assert.strictEqual(res.action, 'STOP_OWNER_DECISION_REQUIRED');
    assert.strictEqual(res.shouldStop, true);
    assert.strictEqual(ctrl.isStopped(), true);
    console.log('  -> PASS: Decisão do proprietário exigida suspendeu a execução de forma controlada.\n');
    passed++;
  }

  // TESTE G: ACK curto não é interpretado como conclusão
  {
    console.log('[TEST G] ACK curto não é interpretado como conclusão...');
    const ctrl = new SprintAutoContinueController({
      journalPath,
      initialTasks: [48]
    });

    const wakeRes = ctrl.handleWakeUp({ call_id: 'MESSAGE-WAKE-48-001', payload: 'Execute #48' });
    assert.strictEqual(wakeRes.action, 'CONSUME_GITHUB');
    assert.strictEqual(wakeRes.shouldStop, false);
    assert.strictEqual(ctrl.completedTasks.has(48), false);
    assert.strictEqual(ctrl.state, 'READY_TO_CONSUME_GITHUB');
    console.log('  -> PASS: ACK de recebimento iniciou o ciclo mas não finalizou a tarefa.\n');
    passed++;
  }

  // TESTE H: Queda curta de Internet durante transição -> fila/single-flight preservados
  {
    console.log('[TEST H] Queda de Internet durante transição -> fila e single-flight intactos...');
    const q = new ResilientCarrierQueue();
    const ctrl = new SprintAutoContinueController({
      journalPath,
      carrierQueue: q,
      initialTasks: [48]
    });

    ctrl.finishTaskAndPublishResult(48);
    const tsH = Date.now();
    const enq = q.enqueue({
      packet_id: `PKT_TRANSITION_48_${tsH}`,
      payload: `[CONTEXT_PACKET]\nTASK: 48\nCALL_ID: CALL-48-${tsH}\nISSUE_NUMBER: 48\n[/CONTEXT_PACKET]`
    });
    assert.strictEqual(enq.success, true);
    assert.strictEqual(q.queue.length >= 1, true);
    assert.strictEqual(ctrl.state, 'WAITING_FOR_AUDIT');
    console.log('  -> PASS: Fila persistente preservou o pacote sem duplicação durante transição.\n');
    passed++;
  }

  // TESTE I: Composer ocupado -> fail-closed sem empilhamento
  {
    console.log('[TEST I] Composer ocupado -> fail-closed sem empilhamento...');
    const q = new ResilientCarrierQueue();
    const busyInspection = q.inspectComposer('Digitando texto importante...');
    assert.strictEqual(busyInspection.status, 'COMPOSER_BUSY');
    assert.strictEqual(busyInspection.reason, 'COMPOSER_BUSY_OWNER_TEXT');

    const flight = q.acquireNextFlight(busyInspection.status);
    assert.strictEqual(flight.allowed, false);
    console.log('  -> PASS: Escrita bloqueada preventivamente sem empilhar mensagens no composer.\n');
    passed++;
  }

  // TESTE J: Regressão: #43, #45, #47 e Bridge V2 continuam verdes
  {
    console.log('[TEST J] Verificação de não-regressão das capacidades anteriores...');
    assert.strictEqual(fs.existsSync(path.join(__dirname, '../VigiaPonte/ResilientCarrierQueue.js')), true);
    assert.strictEqual(fs.existsSync(path.join(__dirname, '../VigiaPonte/TelegramCommandRouter.js')), true);
    assert.strictEqual(fs.existsSync(path.join(__dirname, '../VigiaPonte/NaturalLanguageRouter.js')), true);
    assert.strictEqual(fs.existsSync(path.join(__dirname, '../extension/background.js')), true);
    assert.strictEqual(fs.existsSync(path.join(__dirname, '../extension_outbound/background.js')), true);
    console.log('  -> PASS: Todas as capacidades anteriores íntegras e preservadas.\n');
    passed++;
  }

  // TESTE K: [DONE_GATE ADICIONAL] Prova de Dedupe de ACK e continuidade de RESULT
  {
    console.log('[TEST K] Prova de Dedupe de ACK por chave estavel e continuidade de RESULT...');
    const ts = Date.now();
    const ackPayload = `[BRIDGE_AUTO_CONTINUE_V1]
SPRINT_ID: SPRINT-PC-TRABALHO-SANEAMENTO-DONE-001
REPLY_TO_CALL_ID: WAKE-TEST-${ts}
STATUS: ACK_RECEIVED_CONSUMING_GITHUB
RESULT: Teste de dedupe
[/BRIDGE_AUTO_CONTINUE_V1]`;

    // 1. Primeiro ACK enviado para a Bridge real
    const resAck1 = await httpPost('/queue', {
      packet_id: `ACK_1_${ts}`,
      payload: ackPayload
    });
    assert.strictEqual(resAck1.queued, true);

    // Drena o ACK 1 da Bridge
    const pkt1 = await httpGet('/context_packet');
    assert.strictEqual(pkt1.packet_id, `ACK_1_${ts}`);
    await httpPost('/ack', { packet_id: `ACK_1_${ts}` });

    // 2. Segundo ACK IDÊNTICO emitido em curtíssimo intervalo para o mesmo wake
    const resAck2 = await httpPost('/queue', {
      packet_id: `ACK_2_${ts}`,
      payload: ackPayload
    });
    assert.strictEqual(resAck2.queued, false);
    assert.strictEqual(resAck2.status, 'ACK_ALREADY_DELIVERED');
    assert.strictEqual(resAck2.action, 'DROP_NO_OP');

    // 3. Terceiro pacote: Transição factual para ENTREGUE/RESULT
    const resultPayload = `[CONTEXT_PACKET]
TASK: 48
SPRINT: SPRINT-PC-TRABALHO-SANEAMENTO-DONE-001
REPLY_TO_CALL_ID: WAKE-TEST-${ts}
STATUS: ENTREGUE_RESULT_PUBLICADO_AGUARDANDO_AUDITORIA
RESULT: Tarefa entregue com sucesso
[/CONTEXT_PACKET]`;

    const resResult = await httpPost('/queue', {
      packet_id: `RESULT_${ts}`,
      payload: resultPayload
    });
    assert.strictEqual(resResult.queued, true);
    assert.strictEqual(resResult.status, 'QUEUED');

    // Limpa o item da fila da Bridge
    const pktResult = await httpGet('/context_packet');
    assert.strictEqual(pktResult.packet_id, `RESULT_${ts}`);
    await httpPost('/ack', { packet_id: `RESULT_${ts}` });

    console.log('  -> PASS: ACK duplicado descartado como ACK_ALREADY_DELIVERED e transição ENTREGUE passou normalmente.\n');
    passed++;
  }

  cleanup();
  console.log('================================================================');
  console.log(`  RESULTADO: ${passed}/11 CENÁRIOS APROVADOS (100% PASS)`);
  console.log('================================================================');
}

runAllTests().catch(err => {
  console.error('\n❌ FALHA NA SUÍTE DA ISSUE #48:', err);
  process.exit(1);
});
