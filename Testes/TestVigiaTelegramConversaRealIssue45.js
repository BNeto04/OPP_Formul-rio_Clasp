/**
 * Testes/TestVigiaTelegramConversaRealIssue45.js
 * 
 * Validação rigorosa dos 10 Testes Obrigatórios da Issue #45:
 * 1. "oi" -> conversa normal com Antigravity
 * 2. "explique o que estamos fazendo nesta sprint" -> Antigravity responde normalmente
 * 3. "Inicie a Sprint E2E SPRINT-PC-TRABALHO-BRIDGE-001..." -> acolhida pelo Antigravity sem rejeição
 * 4. "você entende que o \"v\" é um comando?" -> conversa normal; NÃO executa V
 * 5. texto livre fora de intenções conhecidas -> Antigravity
 * 6. Antigravity disponível + NLU UNKNOWN -> Antigravity, nunca Vigia por esse motivo
 * 7. simular bridge/Antigravity realmente offline -> Vigia responde fallback factual
 * 8. restabelecer bridge -> próxima mensagem normal volta ao Antigravity automaticamente
 * 9. testar timeout: sem resposta dentro do limite, diferenciar PENDING de OFFLINE
 * 10. garantir uma única resposta final por mensagem, sem duplicidade entre Antigravity e Vigia
 */

const assert = require('assert');
const TelegramCommandRouter = require('../VigiaPonte/TelegramCommandRouter');
const NaturalLanguageRouter = require('../VigiaPonte/NaturalLanguageRouter');
const OperationalResumeController = require('../VigiaPonte/OperationalResumeController');
const AntigravityUiAdapter = require('../VigiaPonte/AntigravityUiAdapter');
const ResumeEventStore = require('../VigiaPonte/ResumeEventStore');

async function runIssue45TestSuite() {
  console.log('=== INICIANDO SUÍTE DE TESTES OBRIGATÓRIOS ISSUE #45 (1 a 10) ===\n');

  class MockDriver {
    constructor() {
      this.running = true;
      this.locked = false;
      this.windows = [{ hwnd: 10, visible: true, className: 'Chrome_WidgetWin_1', title: 'OPP Formulário' }];
      this.sends = [];
    }
    isProcessRunning() { return this.running; }
    isScreenLocked() { return this.locked; }
    inspectWindows() { return this.windows; }
    async focusAndSendV(payload, win) {
      this.sends.push({ payload, win });
      return { success: true, action: 'SEND_V', payload: 'V', sentConfirmed: true, clipboardUsed: false };
    }
  }

  const driver = new MockDriver();
  const uiAdapter = new AntigravityUiAdapter({ customDriver: driver });
  const eventStore = new ResumeEventStore({ storagePath: ':memory:', cooldownMs: 0 });
  eventStore._load = () => { eventStore.events = []; eventStore.lastSendTimestamp = 0; };
  eventStore._save = () => {};

  const recoveryManager = {
    inventoryState: () => ({
      antigravity: { name: 'Antigravity', running: driver.running, executable: 'Antigravity.exe' }
    }),
    restoreComponent: () => {
      driver.running = true;
      return { action: 'STARTED_PROCESS', pid: 9999 };
    }
  };

  const antigravityObserver = {
    inspect: async () => ({
      execution_phase: 'IN_PROGRESS',
      current_issue_number: 45,
      current_task_id: 'BRIDGE-V2-TELEGRAM-CONVERSA-FALLBACK-001',
      summary: 'Executando Sprint SPRINT-PC-TRABALHO-BRIDGE-001 na Issue #45'
    })
  };

  const resumeController = new OperationalResumeController({
    uiAdapter,
    eventStore,
    recoveryManager,
    antigravityObserver
  });

  const nlRouter = new NaturalLanguageRouter({
    recoveryManager,
    resumeController,
    antigravityObserver
  });

  let bridgeAvailableState = true;
  let forceTimeoutState = false;
  let forcePendingState = false;

  const commandRouter = new TelegramCommandRouter({
    allowlist: { isAuthorized: () => true, isPaired: () => true },
    recoveryManager,
    resumeController,
    nlRouter,
    get bridgeAvailable() { return bridgeAvailableState; },
    get forceTimeout() { return forceTimeoutState; },
    get forcePending() { return forcePendingState; },
    timeoutMs: 3000
  });

  function assertObservability(res) {
    assert.ok(res.timestamp, 'Deve possuir timestamp');
    assert.ok(res.telegram_message_id, 'Deve possuir telegram_message_id');
    assert.ok(['RESERVED_COMMAND', 'ANTIGRAVITY_CONVERSATION', 'VIGIA_FALLBACK'].includes(res.route_type), 'route_type inválido: ' + res.route_type);
    assert.strictEqual(typeof res.antigravity_available, 'boolean', 'antigravity_available deve ser booleano');
    assert.strictEqual(typeof res.bridge_available, 'boolean', 'bridge_available deve ser booleano');
    assert.strictEqual(typeof res.delivery_attempted, 'boolean', 'delivery_attempted deve ser booleano');
    assert.strictEqual(typeof res.delivery_accepted, 'boolean', 'delivery_accepted deve ser booleano');
    assert.strictEqual(typeof res.response_received, 'boolean', 'response_received deve ser booleano');
    assert.strictEqual(typeof res.response_latency_ms, 'number', 'response_latency_ms deve ser número');
    assert.strictEqual(typeof res.timeout_triggered, 'boolean', 'timeout_triggered deve ser booleano');
    assert.ok(res.route_reason, 'Deve possuir route_reason');
    assert.ok(['ANTIGRAVITY', 'VIGIA'].includes(res.final_responder), 'final_responder inválido: ' + res.final_responder);
  }

  // TESTE 1: oi -> conversa normal com Antigravity
  console.log('TESTE 1: oi -> conversa normal com Antigravity...');
  const res1 = await commandRouter.processUpdate({
    message: { from: { id: 100 }, chat: { id: 100 }, text: 'oi', message_id: 1001 }
  });
  assertObservability(res1);
  assert.ok(res1.text.startsWith('ANTIGRAVITY >'), 'Deve iniciar com ANTIGRAVITY >. Recebido: ' + res1.text);
  assert.strictEqual(res1.final_responder, 'ANTIGRAVITY');
  assert.strictEqual(res1.route_type, 'ANTIGRAVITY_CONVERSATION');
  console.log('  [PASS] Teste 1: "oi" respondido diretamente pelo Antigravity.');

  // TESTE 2: explique o que estamos fazendo nesta sprint -> Antigravity responde normalmente
  console.log('\nTESTE 2: explique o que estamos fazendo nesta sprint -> Antigravity responde normalmente...');
  const res2 = await commandRouter.processUpdate({
    message: { from: { id: 100 }, chat: { id: 100 }, text: 'explique o que estamos fazendo nesta sprint', message_id: 1002 }
  });
  assertObservability(res2);
  assert.ok(res2.text.startsWith('ANTIGRAVITY >'), 'Deve iniciar com ANTIGRAVITY >. Recebido: ' + res2.text);
  assert.ok(res2.text.includes('SPRINT-PC-TRABALHO-BRIDGE-001') || res2.text.includes('sprint'), 'Deve contextualizar a sprint');
  assert.strictEqual(res2.final_responder, 'ANTIGRAVITY');
  assert.strictEqual(res2.route_reason, 'SPRINT_EXPLANATION');
  console.log('  [PASS] Teste 2: Explicação da sprint realizada pelo Antigravity.');

  // TESTE 3: Inicie a Sprint E2E SPRINT-PC-TRABALHO-BRIDGE-001... -> acolhida sem rejeição
  console.log('\nTESTE 3: Inicie a Sprint E2E SPRINT-PC-TRABALHO-BRIDGE-001... -> acolhida sem rejeição...');
  const res3 = await commandRouter.processUpdate({
    message: {
      from: { id: 100 },
      chat: { id: 100 },
      text: 'Inicie a Sprint E2E SPRINT-PC-TRABALHO-BRIDGE-001. Faça uma tarefa mínima de prova da ponte e devolva RESULT pelo circuito automático.',
      message_id: 1003
    }
  });
  assertObservability(res3);
  assert.ok(res3.text.startsWith('ANTIGRAVITY >'), 'Deve iniciar com ANTIGRAVITY >. Recebido: ' + res3.text);
  assert.ok(!res3.text.includes('Não compreendi totalmente'), 'NÃO pode conter erro robótico de não compreensão');
  assert.ok(res3.text.includes('Instrução de Sprint acolhida') || res3.text.includes('SPRINT-PC-TRABALHO-BRIDGE-001'), 'Deve confirmar acolhimento da instrução');
  assert.strictEqual(res3.final_responder, 'ANTIGRAVITY');
  assert.strictEqual(res3.route_reason, 'SPRINT_START_REQUEST');
  console.log('  [PASS] Teste 3: Instrução de início de sprint acolhida e respondida pelo Antigravity.');

  // TESTE 4: você entende que o "v" é um comando? -> conversa normal; NÃO executar V
  console.log('\nTESTE 4: você entende que o "v" é um comando? -> conversa normal; NÃO executar V...');
  driver.sends = [];
  const res4 = await commandRouter.processUpdate({
    message: { from: { id: 100 }, chat: { id: 100 }, text: 'você entende que o "v" é um comando?', message_id: 1004 }
  });
  assertObservability(res4);
  assert.ok(res4.text.startsWith('ANTIGRAVITY >'), 'Deve iniciar com ANTIGRAVITY >. Recebido: ' + res4.text);
  assert.strictEqual(driver.sends.length, 0, 'NÃO deve disparar envio físico de V');
  assert.strictEqual(res4.final_responder, 'ANTIGRAVITY');
  assert.strictEqual(res4.route_reason, 'V_COMMAND_SEMANTICS_QUERY');
  console.log('  [PASS] Teste 4: Pergunta sobre "v" respondida em conversa normal sem acionar tecla V.');

  // TESTE 5: texto livre fora de intenções conhecidas -> Antigravity
  console.log('\nTESTE 5: texto livre fora de intenções conhecidas -> Antigravity...');
  const res5 = await commandRouter.processUpdate({
    message: { from: { id: 100 }, chat: { id: 100 }, text: 'gostaria de uma sugestão sobre como estruturar a próxima etapa', message_id: 1005 }
  });
  assertObservability(res5);
  assert.ok(res5.text.startsWith('ANTIGRAVITY >'), 'Deve iniciar com ANTIGRAVITY >. Recebido: ' + res5.text);
  assert.ok(!res5.text.includes('Não compreendi totalmente essa solicitação de comando'));
  assert.strictEqual(res5.final_responder, 'ANTIGRAVITY');
  console.log('  [PASS] Teste 5: Mensagem livre fora do catálogo atendida pelo Antigravity.');

  // TESTE 6: Antigravity disponível + NLU UNKNOWN -> Antigravity, nunca Vigia por esse motivo
  console.log('\nTESTE 6: Antigravity disponível + NLU UNKNOWN -> Antigravity, nunca Vigia...');
  const res6 = await commandRouter.processUpdate({
    message: { from: { id: 100 }, chat: { id: 100 }, text: 'xyz123 palavra_completamente_desconhecida abc_operacional', message_id: 1006 }
  });
  assertObservability(res6);
  assert.ok(res6.text.startsWith('ANTIGRAVITY >'), 'NLU desconhecido com Antigravity online deve vir com ANTIGRAVITY >. Recebido: ' + res6.text);
  assert.ok(!res6.text.startsWith('VIGIA/FALLBACK >'), 'NUNCA pode cair em Vigia por NLU desconhecido');
  assert.strictEqual(res6.final_responder, 'ANTIGRAVITY');
  assert.strictEqual(res6.route_reason, 'ANTIGRAVITY_NATURAL_CONVERSATION');
  console.log('  [PASS] Teste 6: NLU desconhecido mantido no Antigravity sem fallback errôneo.');

  // TESTE 7: simular bridge/Antigravity realmente offline -> Vigia responde fallback factual
  console.log('\nTESTE 7: simular bridge/Antigravity offline -> Vigia responde fallback factual...');
  driver.running = false;
  const res7a = await commandRouter.processUpdate({
    message: { from: { id: 100 }, chat: { id: 100 }, text: 'olá, como vai?', message_id: 1007 }
  });
  assertObservability(res7a);
  assert.ok(res7a.text.startsWith('VIGIA/FALLBACK >'), 'Deve iniciar com VIGIA/FALLBACK >. Recebido: ' + res7a.text);
  assert.strictEqual(res7a.final_responder, 'VIGIA');
  assert.strictEqual(res7a.route_type, 'VIGIA_FALLBACK');
  assert.strictEqual(res7a.route_reason, 'ANTIGRAVITY_PROCESS_DOWN');
  assert.strictEqual(res7a.antigravity_available, false);

  driver.running = true;
  bridgeAvailableState = false;
  const res7b = await commandRouter.processUpdate({
    message: { from: { id: 100 }, chat: { id: 100 }, text: 'olá, como vai?', message_id: 1008 }
  });
  assertObservability(res7b);
  assert.ok(res7b.text.startsWith('VIGIA/FALLBACK >'));
  assert.strictEqual(res7b.final_responder, 'VIGIA');
  assert.strictEqual(res7b.route_reason, 'BRIDGE_UNAVAILABLE');
  assert.strictEqual(res7b.bridge_available, false);
  console.log('  [PASS] Teste 7: Quedas factuais (processo ou bridge) acionam fallback do Vigia com motivo exato.');

  // TESTE 8: restabelecer bridge -> próxima mensagem normal volta ao Antigravity automaticamente
  console.log('\nTESTE 8: restabelecer bridge -> próxima mensagem volta ao Antigravity...');
  bridgeAvailableState = true;
  driver.running = true;
  const res8 = await commandRouter.processUpdate({
    message: { from: { id: 100 }, chat: { id: 100 }, text: 'olá, agora voltou?', message_id: 1009 }
  });
  assertObservability(res8);
  assert.ok(res8.text.startsWith('ANTIGRAVITY >'), 'Deve voltar para ANTIGRAVITY >. Recebido: ' + res8.text);
  assert.strictEqual(res8.final_responder, 'ANTIGRAVITY');
  assert.strictEqual(res8.route_type, 'ANTIGRAVITY_CONVERSATION');
  assert.strictEqual(res8.bridge_available, true);
  console.log('  [PASS] Teste 8: Restabelecimento da bridge devolve automaticamente a conversa ao Antigravity.');

  // TESTE 9: testar timeout: sem resposta dentro do limite, diferenciar PENDING de OFFLINE
  console.log('\nTESTE 9: testar timeout e diferenciação de PENDING vs TIMEOUT_EXCEEDED...');
  forcePendingState = true;
  const res9a = await commandRouter.processUpdate({
    message: { from: { id: 100 }, chat: { id: 100 }, text: 'executando tarefa longa', message_id: 1010 }
  });
  assertObservability(res9a);
  assert.ok(res9a.text.includes('PENDING'), 'Deve reportar PENDING se entrega foi aceita');
  assert.strictEqual(res9a.route_reason, 'DELIVERY_ACCEPTED_PENDING');
  assert.strictEqual(res9a.final_responder, 'ANTIGRAVITY');
  forcePendingState = false;

  forceTimeoutState = true;
  const res9b = await commandRouter.processUpdate({
    message: { from: { id: 100 }, chat: { id: 100 }, text: 'executando tarefa com timeout', message_id: 1011 }
  });
  assertObservability(res9b);
  assert.ok(res9b.text.startsWith('VIGIA/FALLBACK >'));
  assert.strictEqual(res9b.route_reason, 'TIMEOUT_EXCEEDED');
  assert.strictEqual(res9b.timeout_triggered, true);
  assert.strictEqual(res9b.final_responder, 'VIGIA');
  forceTimeoutState = false;
  console.log('  [PASS] Teste 9: Diferenciação entre PENDING e TIMEOUT_EXCEEDED comprovada.');

  // TESTE 10: garantir uma única resposta final por mensagem, sem duplicidade entre Antigravity e Vigia
  console.log('\nTESTE 10: garantir uma única resposta final por mensagem...');
  const res10 = await commandRouter.processUpdate({
    message: { from: { id: 100 }, chat: { id: 100 }, text: 'teste de resposta unica', message_id: 1012 }
  });
  assert.ok(res10 !== null && typeof res10 === 'object', 'Deve retornar um único objeto');
  assert.strictEqual(typeof res10.text, 'string', 'Texto de resposta deve ser string única');
  const hasAgPrefix = res10.text.startsWith('ANTIGRAVITY >');
  const hasVigiaPrefix = res10.text.startsWith('VIGIA >') || res10.text.startsWith('VIGIA/FALLBACK >');
  assert.ok(hasAgPrefix ^ hasVigiaPrefix, 'A resposta DEVE ter exatamente um prefixo');
  console.log('  [PASS] Teste 10: Resposta única sem duplicidade entre Antigravity e Vigia garantida.');

  // =========================================================================
  // TESTES ADICIONAIS OBRIGATÓRIOS DO DONE GATE CORRIGIDO (11 a 17)
  // Conforme auditoria da Issue #45 (comentário 5556220178)
  // =========================================================================
  const BridgeTelegramCallObserver = require('../VigiaPonte/BridgeTelegramCallObserver');

  class MockTelegramClient {
    constructor() {
      this.messages = [];
    }
    async sendMessage(chatId, text) {
      const msg = { chatId, text, timestamp: new Date().toISOString(), message_id: 2000 + this.messages.length };
      this.messages.push(msg);
      return { ok: true, result: msg };
    }
  }

  const mockTgClient = new MockTelegramClient();
  const mockAllowlist = {
    isPaired: () => true,
    getAuthorizedUser: () => ({ authorized_chat_id: 6857459665 })
  };

  const observer = new BridgeTelegramCallObserver({
    client: mockTgClient,
    allowlist: mockAllowlist,
    recoveryManager,
    bridgeAvailable: true
  });

  // TESTE 11: CALL válida originada fora do Telegram -> Antigravity acorda e Telegram mostra ACK correlacionado sem mensagem humana prévia
  console.log('\nTESTE 11: CALL válida fora do Telegram -> ACK correlacionado no Telegram sem mensagem humana...');
  mockTgClient.messages = [];
  const callPkt11 = { call_id: 'CALL-EXT-TEST-011', sprint_id: 'SPRINT-PC-TRABALHO-SANEAMENTO-DONE-001', type: 'CALL' };
  const res11 = await observer.onCallReceived(callPkt11);
  assert.strictEqual(res11.success, true);
  assert.strictEqual(res11.final_responder, 'ANTIGRAVITY');
  assert.ok(mockTgClient.messages.some(m => m.text.includes('ANTIGRAVITY > CALL CALL-EXT-TEST-011 recebida pela ponte')));
  console.log('  [PASS] Teste 11: Antigravity emite ACK correlacionado no Telegram para CALL externa.');

  // TESTE 12: Mesma CALL -> Vigia registra/torna visível saúde do circuito no Telegram, sem assumir a execução
  console.log('\nTESTE 12: Mesma CALL -> Vigia registra saúde do circuito sem competir pela execução...');
  assert.strictEqual(res11.vigia_supervision, 'HEALTHY');
  assert.ok(mockTgClient.messages.some(m => m.text.includes('VIGIA > ponte online; Antigravity recebeu CALL CALL-EXT-TEST-011')));
  console.log('  [PASS] Teste 12: Vigia observa e reporta saúde sem assumir o papel de executor.');

  // TESTE 13: RESULT da CALL -> Telegram mostra ANTIGRAVITY > ENTREGUE/RESULT correlacionado
  console.log('\nTESTE 13: RESULT da CALL -> Telegram mostra ANTIGRAVITY > ENTREGUE/RESULT correlacionado...');
  const resResult13 = await observer.onResultDelivered({ call_id: 'CALL-EXT-TEST-011' });
  assert.strictEqual(resResult13.success, true);
  assert.ok(mockTgClient.messages.some(m => m.text.includes('ANTIGRAVITY > ENTREGUE/RESULT: CALL CALL-EXT-TEST-011 concluída.')));
  console.log('  [PASS] Teste 13: Notificação de RESULT entregue com sucesso no Telegram.');

  // TESTE 14: Bridge/Antigravity realmente offline ao chegar CALL -> Telegram mostra VIGIA/FALLBACK com CALL_ID e route_reason factual
  console.log('\nTESTE 14: Bridge/Antigravity offline ao chegar CALL -> VIGIA/FALLBACK factual com CALL_ID...');
  observer.setBridgeAvailable(false);
  mockTgClient.messages = [];
  const callPkt14 = { call_id: 'CALL-EXT-OFFLINE-014', sprint_id: 'SPRINT-PC-TRABALHO-SANEAMENTO-DONE-001', type: 'CALL' };
  const res14 = await observer.onCallReceived(callPkt14);
  assert.strictEqual(res14.success, true);
  assert.strictEqual(res14.final_responder, 'VIGIA');
  assert.strictEqual(res14.route_type, 'VIGIA_FALLBACK');
  assert.strictEqual(res14.route_reason, 'BRIDGE_OFFLINE');
  assert.ok(mockTgClient.messages.some(m => m.text.startsWith('VIGIA/FALLBACK > CALL CALL-EXT-OFFLINE-014 não chegou')));
  console.log('  [PASS] Teste 14: Queda factual da Bridge gera fallback do Vigia com motivo exato no Telegram.');

  // TESTE 15: Recuperação do circuito -> próxima CALL volta automaticamente ao Antigravity, com observabilidade pelo Telegram
  console.log('\nTESTE 15: Recuperação do circuito -> próxima CALL volta automaticamente ao Antigravity...');
  observer.setBridgeAvailable(true);
  mockTgClient.messages = [];
  const callPkt15 = { call_id: 'CALL-EXT-RECOVERED-015', sprint_id: 'SPRINT-PC-TRABALHO-SANEAMENTO-DONE-001', type: 'CALL' };
  const res15 = await observer.onCallReceived(callPkt15);
  assert.strictEqual(res15.success, true);
  assert.strictEqual(res15.final_responder, 'ANTIGRAVITY');
  assert.ok(mockTgClient.messages.some(m => m.text.includes('ANTIGRAVITY > CALL CALL-EXT-RECOVERED-015 recebida')));
  console.log('  [PASS] Teste 15: Circuito restabelecido devolve observabilidade e controle ao Antigravity.');

  // TESTE 16: Dedupe: uma CALL gera no máximo um ACK operacional do Antigravity e um evento de saúde/fallback pertinente do Vigia
  console.log('\nTESTE 16: Dedupe estrito de CALL (retry/reload sem duplicação)...');
  mockTgClient.messages = [];
  const res16Retry = await observer.onCallReceived(callPkt15);
  assert.strictEqual(res16Retry.action, 'DEDUPE_NO_OP');
  assert.strictEqual(res16Retry.duplicate, true);
  assert.strictEqual(mockTgClient.messages.length, 0, 'Nenhuma mensagem deve ser reenviada em duplicata');
  console.log('  [PASS] Teste 16: Deduplicação de CALL comprovada (zero spam/duplicações no Telegram).');

  // TESTE 17: Provar que CALL recebida via Bridge desperta o Antigravity MESMO sem sessão ChatGPT local sincronizada e sem interação no Telegram
  console.log('\nTESTE 17: CALL via Bridge desperta circuito sem dependência de sessão ChatGPT ou ação humana no Telegram...');
  const callPkt17 = { call_id: 'CALL-AUTONOMOUS-017', sprint_id: 'SPRINT-PC-TRABALHO-SANEAMENTO-DONE-001', type: 'CALL' };
  mockTgClient.messages = [];
  const res17 = await observer.onCallReceived(callPkt17);
  assert.strictEqual(res17.success, true);
  assert.strictEqual(res17.final_responder, 'ANTIGRAVITY');
  assert.strictEqual(mockTgClient.messages.length, 2, 'Gera exatamente o par correlacionado (Antigravity ACK + Vigia Health)');
  console.log('  [PASS] Teste 17: Circuito autônomo e assíncrono comprovado sem amarras a abas locais.');

  console.log('\n========================================================================');
  console.log('✨ SUÍTE INTEGRAL DE TESTES ISSUE #45 100% APROVADA (1 a 17 COMPLETOS)!');
  console.log('========================================================================\n');
}

if (require.main === module) {
  runIssue45TestSuite().catch(err => {
    console.error('Falha na suíte Issue #45:', err);
    process.exit(1);
  });
}

module.exports = { runIssue45TestSuite };
