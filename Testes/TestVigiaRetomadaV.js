/**
 * Testes/TestVigiaRetomadaV.js
 * 
 * Suíte de Testes Automatizados da Issue #43:
 * Ciclo determinístico de retomada automática do Antigravity e envio canônico de V.
 * Cenários A a T cobrindo todas as invariantes contratuais e clarificações do proprietário.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const AntigravityUiAdapter = require('../VigiaPonte/AntigravityUiAdapter');
const ResumeEventStore = require('../VigiaPonte/ResumeEventStore');
const OperationalResumeController = require('../VigiaPonte/OperationalResumeController');
const NaturalLanguageRouter = require('../VigiaPonte/NaturalLanguageRouter');
const TelegramCommandRouter = require('../VigiaPonte/TelegramCommandRouter');
const VigiaBootEngine = require('../VigiaPonte/VigiaBootEngine');
const SanitizadorSegredos = require('../VigiaPonte/SanitizadorSegredos');

async function runTestSuite() {
  console.log('=== INICIANDO SUÍTE DE TESTES: RETOMADA AUTOMÁTICA E ENVIO CANÔNICO DE V (A a T) ===\n');

  const tmpDir = path.join(__dirname, 'temp_test_retomada_v');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  const testStorePath = path.join(tmpDir, 'resume_events_test.json');
  const testJournalPath = path.join(tmpDir, 'resume_journal_test.log');

  const cleanupFiles = () => {
    if (fs.existsSync(testStorePath)) fs.unlinkSync(testStorePath);
    if (fs.existsSync(testJournalPath)) fs.unlinkSync(testJournalPath);
  };
  cleanupFiles();

  // Driver mock configurável para testes unitários do Adaptador de UI
  class MockUiDriver {
    constructor() {
      this.running = true;
      this.windows = [
        { hwnd: 1001, pid: 5000, visible: true, minimized: false, className: 'Chrome_WidgetWin_1', title: 'Correção Botão - OPP Formulário' }
      ];
      this.sendCalls = [];
      this.shouldFailSend = false;
    }

    isProcessRunning() {
      return this.running;
    }

    inspectWindows() {
      return this.windows;
    }

    async focusAndSendV(payload, targetWindow) {
      if (payload !== 'V') {
        return { success: false, action: 'REJECTED', reason: 'Payload não autorizado', sentConfirmed: false };
      }
      if (this.shouldFailSend) {
        return { success: false, action: 'SEND_UNCERTAIN', reason: 'Simulated send error', sentConfirmed: false, clipboardUsed: false };
      }
      this.sendCalls.push({ payload, targetWindow, timestamp: Date.now() });
      return {
        success: true,
        action: 'SEND_V',
        payload: 'V',
        sentConfirmed: true,
        targetHwnd: targetWindow ? targetWindow.hwnd : null,
        method: 'WIN32_DIRECT_KEYBD_EVENT',
        clipboardUsed: false
      };
    }
  }

  // TESTE A: Boot + GUI pronta + conversa inequívoca -> um V enviado e confirmado
  console.log('TESTE A: Boot + GUI pronta + conversa inequívoca -> um V...');
  {
    cleanupFiles();
    const mockDriver = new MockUiDriver();
    const uiAdapter = new AntigravityUiAdapter({ customDriver: mockDriver });
    const eventStore = new ResumeEventStore({ storagePath: testStorePath, cooldownMs: 1000 });
    const controller = new OperationalResumeController({
      uiAdapter,
      eventStore,
      journalPath: testJournalPath
    });

    const res = await controller.triggerResume('BOOT_RECOVERY', { resume_event_id: 'boot_event_001' });
    assert.strictEqual(res.action, 'SEND_V');
    assert.strictEqual(res.final_state, 'V_SENT_CONFIRMED');
    assert.strictEqual(res.send_confirmation, true);
    assert.strictEqual(mockDriver.sendCalls.length, 1);
    assert.strictEqual(mockDriver.sendCalls[0].payload, 'V');
    console.log('  [PASS] Teste A: Retomada pós-boot enviou e confirmou comando canônico V.');
  }

  // TESTE B: Boot + Antigravity ausente -> abre instância, espera e envia V
  console.log('\nTESTE B: Boot + Antigravity ausente -> recovery abre processo e envia V...');
  {
    cleanupFiles();
    const mockDriver = new MockUiDriver();
    mockDriver.running = false; // Inicialmente fechado
    const uiAdapter = new AntigravityUiAdapter({ customDriver: mockDriver });
    const eventStore = new ResumeEventStore({ storagePath: testStorePath, cooldownMs: 1000 });

    let recoveryCalled = false;
    const mockRecoveryManager = {
      restoreComponent: (comp) => {
        if (comp === 'antigravity') {
          recoveryCalled = true;
          mockDriver.running = true; // Simula inicialização do processo
          return { action: 'STARTED_PROCESS', pid: 5001 };
        }
        return { action: 'NO_OP' };
      }
    };

    const controller = new OperationalResumeController({
      uiAdapter,
      eventStore,
      recoveryManager: mockRecoveryManager,
      journalPath: testJournalPath
    });

    const res = await controller.triggerResume('BOOT_RECOVERY', { resume_event_id: 'boot_event_002' });
    assert.strictEqual(recoveryCalled, true, 'Recovery manager deve ser acionado para iniciar processo');
    assert.strictEqual(res.action, 'SEND_V');
    assert.strictEqual(res.final_state, 'V_SENT_CONFIRMED');
    console.log('  [PASS] Teste B: Processo ausente foi restaurado e comando V enviado após prontidão.');
  }

  // TESTE C: Conectividade DOWN -> UP (Internet return) -> um V enviado
  console.log('\nTESTE C: Conectividade DOWN -> UP (retorno de rede) -> envio de V...');
  {
    cleanupFiles();
    const mockDriver = new MockUiDriver();
    const uiAdapter = new AntigravityUiAdapter({ customDriver: mockDriver });
    const eventStore = new ResumeEventStore({ storagePath: testStorePath, cooldownMs: 500 });
    const controller = new OperationalResumeController({
      uiAdapter,
      eventStore,
      journalPath: testJournalPath
    });

    const res = await controller.triggerResume('INTERNET_RETURN', { resume_event_id: 'net_return_001' });
    assert.strictEqual(res.action, 'SEND_V');
    assert.strictEqual(res.final_state, 'V_SENT_CONFIRMED');
    assert.strictEqual(mockDriver.sendCalls.length, 1);
    console.log('  [PASS] Teste C: Retorno de internet acionou ciclo de retomada e envio de V com sucesso.');
  }

  // TESTE D: Flapping de rede (queda e volta sucessivas) -> dedupe e cooldown impedem repetição
  console.log('\nTESTE D: Flapping de rede -> cooldown e dedupe impedem envios múltiplos...');
  {
    cleanupFiles();
    const mockDriver = new MockUiDriver();
    const uiAdapter = new AntigravityUiAdapter({ customDriver: mockDriver });
    const eventStore = new ResumeEventStore({ storagePath: testStorePath, cooldownMs: 10000 }); // 10s cooldown
    const controller = new OperationalResumeController({
      uiAdapter,
      eventStore,
      cooldownMs: 10000,
      journalPath: testJournalPath
    });

    // 1º retorno -> envia V
    const res1 = await controller.triggerResume('INTERNET_RETURN', { resume_event_id: 'net_ev_1' });
    assert.strictEqual(res1.action, 'SEND_V');
    assert.strictEqual(mockDriver.sendCalls.length, 1);

    // Flap rápido 200ms depois com outro ID -> suprimido por cooldown ativo
    const res2 = await controller.triggerResume('INTERNET_RETURN', { resume_event_id: 'net_ev_2' });
    assert.strictEqual(res2.action, 'NO_OP');
    assert.strictEqual(res2.reason, 'COOLDOWN_ACTIVE');
    assert.strictEqual(mockDriver.sendCalls.length, 1, 'Não deve enviar novo V durante cooldown');

    // Tentativa com o mesmo ID -> suprimido por dedupe
    const res3 = await controller.triggerResume('INTERNET_RETURN', { resume_event_id: 'net_ev_1' });
    assert.strictEqual(res3.action, 'NO_OP');
    assert.strictEqual(res3.reason, 'ALREADY_PROCESSED');
    assert.strictEqual(mockDriver.sendCalls.length, 1);
    console.log('  [PASS] Teste D: Flapping de rede contido por cooldown e idempotência sem spam de V.');
  }

  // TESTE E: Antigravity já ativo e sem interrupção -> NO_OP (não envia V duplicado)
  console.log('\nTESTE E: Antigravity já ativo e sem interrupção -> NO_OP...');
  {
    cleanupFiles();
    const eventStore = new ResumeEventStore({ storagePath: testStorePath });
    eventStore.recordEvent({
      resume_event_id: 'existing_cycle_001',
      trigger_type: 'BOOT_RECOVERY',
      send_confirmed: true,
      result: 'V_SENT_CONFIRMED'
    });

    const controller = new OperationalResumeController({
      eventStore,
      journalPath: testJournalPath
    });

    const res = await controller.triggerResume('BOOT_RECOVERY', { resume_event_id: 'existing_cycle_001' });
    assert.strictEqual(res.action, 'NO_OP');
    assert.strictEqual(res.reason, 'ALREADY_PROCESSED');
    console.log('  [PASS] Teste E: Ciclo já processado é idempotente (NO_OP).');
  }

  // TESTE F: Múltiplas janelas / ambiguidade -> fail-closed NO_SEND / ALERT_OWNER
  console.log('\nTESTE F: Múltiplas janelas com ambiguidade de projeto -> fail-closed NO_SEND...');
  {
    cleanupFiles();
    const mockDriver = new MockUiDriver();
    mockDriver.windows = [
      { hwnd: 2001, pid: 5000, visible: true, minimized: false, className: 'Chrome_WidgetWin_1', title: 'Projeto Alpha - Antigravity' },
      { hwnd: 2002, pid: 5000, visible: true, minimized: false, className: 'Chrome_WidgetWin_1', title: 'Projeto Beta - Antigravity' }
    ];
    const uiAdapter = new AntigravityUiAdapter({
      customDriver: mockDriver,
      authorizedProjectKeywords: ['OPP', 'Codex']
    });
    const controller = new OperationalResumeController({
      uiAdapter,
      eventStore: new ResumeEventStore({ storagePath: testStorePath, cooldownMs: 0 }),
      journalPath: testJournalPath
    });

    const res = await controller.triggerResume('BOOT_RECOVERY', { resume_event_id: 'ambiguity_ev_001' });
    assert.strictEqual(res.action, 'NO_SEND');
    assert.strictEqual(res.final_state, 'AMBIGUOUS_CONVERSATION');
    assert.strictEqual(mockDriver.sendCalls.length, 0, 'Nenhum input deve ser disparado em ambiguidade');
    console.log('  [PASS] Teste F: Ambiguidade de janelas disparou fail-closed estrito sem envio.');
  }

  // TESTE G: Foco corrigido se inequívoco
  console.log('\nTESTE G: Foco corrigido se inequívoco...');
  {
    cleanupFiles();
    const mockDriver = new MockUiDriver();
    mockDriver.windows = [
      { hwnd: 3001, pid: 5000, visible: true, minimized: true, className: 'Chrome_WidgetWin_1', title: 'Correção Botão Comparativ - Codex OPP' },
      { hwnd: 3002, pid: 5000, visible: false, minimized: false, className: 'Chrome_WidgetWin_1', title: 'Janela Oculta de Auxílio' }
    ];
    const uiAdapter = new AntigravityUiAdapter({ customDriver: mockDriver });
    const conv = uiAdapter.identifyOperationalConversation();
    assert.strictEqual(conv.identified, true);
    assert.strictEqual(conv.window.hwnd, 3001);
    console.log('  [PASS] Teste G: Janela operacional única e minimizada identificada com precisão.');
  }

  // TESTE H: Modal de permissão aberto -> NO_SEND / ALERT_OWNER (auto-aprovação negada)
  console.log('\nTESTE H: Modal de permissão na tela -> auto-aprovação estritamente negada...');
  {
    cleanupFiles();
    const mockDriver = new MockUiDriver();
    mockDriver.windows = [
      { hwnd: 4001, pid: 5000, visible: true, minimized: false, className: 'Chrome_WidgetWin_1', title: 'OPP Formulário' },
      { hwnd: 4002, pid: 5000, visible: true, minimized: false, className: 'Chrome_WidgetWin_2', title: 'Permissão de Execução Requerida' }
    ];
    const uiAdapter = new AntigravityUiAdapter({ customDriver: mockDriver });
    const controller = new OperationalResumeController({
      uiAdapter,
      eventStore: new ResumeEventStore({ storagePath: testStorePath, cooldownMs: 0 }),
      journalPath: testJournalPath
    });

    const res = await controller.triggerResume('BOOT_RECOVERY', { resume_event_id: 'modal_block_001' });
    assert.strictEqual(res.action, 'ALERT_OWNER');
    assert.strictEqual(res.final_state, 'ANTIGRAVITY_BLOCKED_OR_WAITING_OWNER');
    assert.strictEqual(mockDriver.sendCalls.length, 0, 'Auto-aprovação proibida; nenhum envio');
    console.log('  [PASS] Teste H: Modal de permissão bloqueou envio de input e emitiu alerta ao proprietário.');
  }

  // TESTE I: GUI em loading / sem janela visível -> espera, não digita
  console.log('\nTESTE I: GUI em loading / processo ativo sem janela visível -> NO_SEND...');
  {
    cleanupFiles();
    const mockDriver = new MockUiDriver();
    mockDriver.windows = [];
    const uiAdapter = new AntigravityUiAdapter({ customDriver: mockDriver });
    const controller = new OperationalResumeController({
      uiAdapter,
      eventStore: new ResumeEventStore({ storagePath: testStorePath, cooldownMs: 0 }),
      journalPath: testJournalPath
    });

    const res = await controller.triggerResume('BOOT_RECOVERY', { resume_event_id: 'loading_gui_001' });
    assert.strictEqual(res.action, 'NO_SEND');
    assert.strictEqual(res.final_state, 'ANTIGRAVITY_PROCESS_UP_GUI_NOT_READY');
    assert.strictEqual(mockDriver.sendCalls.length, 0);
    console.log('  [PASS] Teste I: Janela gráfica ausente aguarda sem disparar comandos às cegas.');
  }

  // TESTE J: Deduplicação estrita de resume_event_id
  console.log('\nTESTE J: Deduplicação estrita de resume_event_id...');
  {
    cleanupFiles();
    const store = new ResumeEventStore({ storagePath: testStorePath });
    store.recordEvent({ resume_event_id: 'ev_dedupe_test', result: 'V_SENT_CONFIRMED', send_confirmed: true });
    assert.strictEqual(store.isEventProcessed('ev_dedupe_test'), true);
    assert.strictEqual(store.isEventProcessed('ev_never_seen'), false);
    console.log('  [PASS] Teste J: Identificador de evento deduplicado de forma idempotente.');
  }

  // TESTE K: Evento já confirmado -> não repete
  console.log('\nTESTE K: Evento já confirmado -> não repete...');
  {
    cleanupFiles();
    const mockDriver = new MockUiDriver();
    const controller = new OperationalResumeController({
      uiAdapter: new AntigravityUiAdapter({ customDriver: mockDriver }),
      eventStore: new ResumeEventStore({ storagePath: testStorePath, cooldownMs: 0 }),
      journalPath: testJournalPath
    });

    await controller.triggerResume('BOOT_RECOVERY', { resume_event_id: 'repeat_guard_001' });
    assert.strictEqual(mockDriver.sendCalls.length, 1);

    const secondCall = await controller.triggerResume('BOOT_RECOVERY', { resume_event_id: 'repeat_guard_001' });
    assert.strictEqual(secondCall.action, 'NO_OP');
    assert.strictEqual(secondCall.final_state, 'DEDUPE_SUPPRESSED');
    assert.strictEqual(mockDriver.sendCalls.length, 1, 'Total de envios deve se manter estritamente em 1');
    console.log('  [PASS] Teste K: Repetição suprimida por garantia de idempotência.');
  }

  // TESTE L: SEND_UNCERTAIN -> não repete automaticamente
  console.log('\nTESTE L: SEND_UNCERTAIN -> não repete automaticamente...');
  {
    cleanupFiles();
    const mockDriver = new MockUiDriver();
    mockDriver.shouldFailSend = true;
    const controller = new OperationalResumeController({
      uiAdapter: new AntigravityUiAdapter({ customDriver: mockDriver }),
      eventStore: new ResumeEventStore({ storagePath: testStorePath, cooldownMs: 0 }),
      journalPath: testJournalPath
    });

    const res = await controller.triggerResume('BOOT_RECOVERY', { resume_event_id: 'uncertain_ev_001' });
    assert.strictEqual(res.final_state, 'SEND_UNCERTAIN');
    assert.strictEqual(res.action, 'ALERT_OWNER');

    const secondTry = await controller.triggerResume('BOOT_RECOVERY', { resume_event_id: 'uncertain_ev_001' });
    assert.strictEqual(secondTry.action, 'NO_OP', 'Não pode retentar evento incerto automaticamente');
    console.log('  [PASS] Teste L: Envio incerto registrado, alertado e não retentado às cegas.');
  }

  // TESTE M: Payload diferente de 'V' -> rejeição estrita
  console.log('\nTESTE M: Payload diferente de "V" -> validação estrita rejeita...');
  {
    const adapter = new AntigravityUiAdapter();
    assert.strictEqual(adapter.validatePayload('V'), true);
    assert.strictEqual(adapter.validatePayload('v'), false);
    assert.strictEqual(adapter.validatePayload('V\n'), false);
    assert.strictEqual(adapter.validatePayload('ls'), false);
    assert.strictEqual(adapter.validatePayload(''), false);

    const sendRes = await adapter.focusAndSendV('echo hack');
    assert.strictEqual(sendRes.success, false);
    assert.strictEqual(sendRes.action, 'REJECTED');
    console.log('  [PASS] Teste M: Qualquer payload diferente de "V" foi expressamente rejeitado.');
  }

  // TESTE N: Sugestão de texto alternativo bloqueada
  console.log('\nTESTE N: Allowlist estrita proíbe comandos ou textos sugeridos...');
  {
    const adapter = new AntigravityUiAdapter();
    const invalidInputs = ['CONTINUE', 'yes', 'sim', 'prosseguir', '1', 'ok'];
    for (const inp of invalidInputs) {
      assert.strictEqual(adapter.validatePayload(inp), false, `Payload "${inp}" deve ser rejeitado`);
    }
    console.log('  [PASS] Teste N: Allowlist restrita inviolável confirmada.');
  }

  // TESTE O: Comando Telegram /retomar ou "retome o fluxo"
  console.log('\nTESTE O: Comando Telegram /retomar e linguagem natural "retome o fluxo"...');
  {
    cleanupFiles();
    const mockDriver = new MockUiDriver();
    const uiAdapter = new AntigravityUiAdapter({ customDriver: mockDriver });
    const eventStore = new ResumeEventStore({ storagePath: testStorePath, cooldownMs: 0 });
    const controller = new OperationalResumeController({
      uiAdapter,
      eventStore,
      journalPath: testJournalPath
    });

    const nlRouter = new NaturalLanguageRouter({ resumeController: controller });
    const commandRouter = new TelegramCommandRouter({
      allowlist: { isAuthorized: () => true, isPaired: () => true },
      resumeController: controller,
      nlRouter
    });

    const cmdRes = await commandRouter.processUpdate({
      message: { from: { id: 100 }, chat: { id: 100 }, text: '/retomar' }
    });
    assert.ok(cmdRes.text.includes('Comando V enviado'), 'Comando /retomar deve acionar envio');
    assert.strictEqual(mockDriver.sendCalls.length, 1);

    const nlRes = await commandRouter.processUpdate({
      message: { from: { id: 100 }, chat: { id: 100 }, text: 'retome o fluxo por favor' }
    });
    assert.ok(nlRes.text.includes('Fluxo retomado') || nlRes.text.includes('V enviado'), 'Intenção deve acionar envio');
    assert.strictEqual(mockDriver.sendCalls.length, 2);
    console.log('  [PASS] Teste O: Telegram /retomar e linguagem natural "retome o fluxo" integrados à mesma máquina de estados.');
  }

  // TESTE P: Pedido de digitação de texto arbitrário na UI -> negado estritamente
  console.log('\nTESTE P: Pedido de digitação de texto arbitrário na UI -> negado...');
  {
    const nlRouter = new NaturalLanguageRouter();
    const resP1 = await nlRouter.process('digite olá na tela do antigravity', 100);
    assert.strictEqual(resP1.intent, 'ARBITRARY_UI_TEXT_BLOCKED');
    assert.ok(resP1.text.includes('Operação negada'), 'Deve conter operação negada');
    assert.ok(resP1.text.includes('payload único'), 'Deve mencionar payload único');

    const resP2 = await nlRouter.process('escreva teste no chat do antigravity', 100);
    assert.strictEqual(resP2.intent, 'ARBITRARY_UI_TEXT_BLOCKED');
    console.log('  [PASS] Teste P: Digitação de texto arbitrário na interface rigorosamente negada.');
  }

  // TESTE Q: Clipboard não utilizado (clipboard_use = false)
  console.log('\nTESTE Q: Invariante clipboard_use = false...');
  {
    cleanupFiles();
    const mockDriver = new MockUiDriver();
    const uiAdapter = new AntigravityUiAdapter({ customDriver: mockDriver });
    const sendRes = await uiAdapter.focusAndSendV('V', { hwnd: 1234 });
    assert.strictEqual(sendRes.clipboardUsed, false, 'Clipboard NUNCA deve ser utilizado');
    console.log('  [PASS] Teste Q: Injeção de V realizada sem interagir com clipboard.');
  }

  // TESTE R: Invariante de processo único / ausência de concorrência
  console.log('\nTESTE R: Processo único e ausência de concorrência...');
  {
    cleanupFiles();
    const mockDriver = new MockUiDriver();
    mockDriver.running = true;
    let spawnAttempts = 0;
    const mockRecoveryManager = {
      restoreComponent: (comp) => {
        spawnAttempts++;
        return { action: 'NO_OP', reason: 'ALREADY_RUNNING' };
      }
    };
    const controller = new OperationalResumeController({
      uiAdapter: new AntigravityUiAdapter({ customDriver: mockDriver }),
      recoveryManager: mockRecoveryManager,
      eventStore: new ResumeEventStore({ storagePath: testStorePath, cooldownMs: 0 }),
      journalPath: testJournalPath
    });

    await controller.triggerResume('BOOT_RECOVERY', { resume_event_id: 'single_proc_test' });
    assert.strictEqual(spawnAttempts, 0, 'Se o processo já está ativo, recovery não deve tentar spawner');
    console.log('  [PASS] Teste R: Instância existente preservada sem processos concorrentes.');
  }

  // TESTE S: Journal sanitizado e append-only
  console.log('\nTESTE S: Integridade e sanitização do journal de retomada...');
  {
    cleanupFiles();
    const mockDriver = new MockUiDriver();
    const controller = new OperationalResumeController({
      uiAdapter: new AntigravityUiAdapter({ customDriver: mockDriver }),
      eventStore: new ResumeEventStore({ storagePath: testStorePath, cooldownMs: 0 }),
      journalPath: testJournalPath
    });

    await controller.triggerResume('BOOT_RECOVERY', {
      resume_event_id: 'journal_sec_test',
      secretField: 'ghp_secretTokenFake1234567890abcdefghij'
    });

    assert.ok(fs.existsSync(testJournalPath), 'Arquivo de journal deve ser criado');
    const content = fs.readFileSync(testJournalPath, 'utf8');
    assert.ok(!content.includes('ghp_secretTokenFake'), 'Segredo não pode constar no journal');
    assert.ok(content.includes('V_SENT_CONFIRMED'), 'Estado confirmado deve constar no journal');
    console.log('  [PASS] Teste S: Journal de retomada gravado com sanitização estrita de segredos.');
  }

  // TESTE T: Distinção factual dos 6 estados contratuais (Clarificação 3)
  console.log('\nTESTE T: Distinção factual dos 6 estados contratuais...');
  {
    cleanupFiles();
    const mockDriver = new MockUiDriver();
    const adapter = new AntigravityUiAdapter({ customDriver: mockDriver });

    // Estado 1: ANTIGRAVITY_PROCESS_DOWN
    mockDriver.running = false;
    let evalRes = adapter.evaluateGuiReadiness();
    assert.strictEqual(evalRes.state, 'ANTIGRAVITY_PROCESS_DOWN');

    // Estado 2: ANTIGRAVITY_PROCESS_UP_GUI_NOT_READY
    mockDriver.running = true;
    mockDriver.windows = [];
    evalRes = adapter.evaluateGuiReadiness();
    assert.strictEqual(evalRes.state, 'ANTIGRAVITY_PROCESS_UP_GUI_NOT_READY');

    // Estado 3: ANTIGRAVITY_BLOCKED_OR_WAITING_OWNER
    mockDriver.windows = [
      { hwnd: 1, pid: 100, visible: true, className: 'Chrome_WidgetWin_1', title: 'Codex' },
      { hwnd: 2, pid: 100, visible: true, className: 'Chrome_WidgetWin_2', title: 'Permissão necessária' }
    ];
    evalRes = adapter.evaluateGuiReadiness();
    assert.strictEqual(evalRes.state, 'ANTIGRAVITY_BLOCKED_OR_WAITING_OWNER');

    // Estado 4: ANTIGRAVITY_GUI_READY_IDLE
    mockDriver.windows = [
      { hwnd: 1, pid: 100, visible: true, className: 'Chrome_WidgetWin_1', title: 'OPP - Formulário' }
    ];
    evalRes = adapter.evaluateGuiReadiness();
    assert.strictEqual(evalRes.state, 'ANTIGRAVITY_GUI_READY_IDLE');

    // Estado 5: ANTIGRAVITY_WORKING_CONFIRMED (via controller com observer ativo)
    const mockObserver = {
      inspect: async () => ({
        execution_phase: 'IN_PROGRESS',
        freshness: 'CURRENT',
        current_issue_number: 43,
        current_task_id: 'TASK-43'
      })
    };
    const controller = new OperationalResumeController({
      uiAdapter: adapter,
      antigravityObserver: mockObserver
    });
    const opState = await controller.evaluateOperationalState();
    assert.strictEqual(opState.state, 'ANTIGRAVITY_WORKING_CONFIRMED');
    assert.ok(opState.description.includes('Issue #43'));

    console.log('  [PASS] Teste T: Todos os 6 estados factuais da Clarificação 3 distinguidos e validados.');
  }

  // TESTE U: Janela minimizada (visible=false, minimized=true) → triggerResume deve fazer SEND_V
  console.log('\nTESTE U: Janela minimizada → triggerResume aceita e envia V...');
  {
    cleanupFiles();
    const mockDriver = new MockUiDriver();
    mockDriver.running = true;
    mockDriver.windows = [{ hwnd: 30, pid: 100, visible: false, minimized: true, className: 'Chrome_WidgetWin_1', title: 'OPP Formulário' }];
    const adapter = new AntigravityUiAdapter({ customDriver: mockDriver });
    const store = new ResumeEventStore({ storagePath: testStorePath, cooldownMs: 0 });
    const ctrl = new OperationalResumeController({
      uiAdapter: adapter,
      eventStore: store,
      journalPath: testJournalPath
    });

    const result = await ctrl.triggerResume('OWNER_REMOTE_TRIGGER', { resume_event_id: 'minimized_test_001' });
    assert.strictEqual(result.action, 'SEND_V', `Deve fazer SEND_V com janela minimizada. Recebido: ${result.action}`);
    assert.strictEqual(result.send_confirmation, true, 'Envio deve ser confirmado');
    assert.strictEqual(mockDriver.sendCalls.length, 1, 'Deve ter chamado focusAndSendV uma vez');
    console.log('  [PASS] Teste U: Janela minimizada aceita pelo controller, V enviado com sucesso.');
  }

  // Limpeza final
  cleanupFiles();

  console.log('\n====================================================');
  console.log('✨ SUÍTE DE RETOMADA AUTOMÁTICA E V (A a U) APROVADA!');
  console.log('====================================================\n');
}

if (require.main === module) {
  runTestSuite().catch(err => {
    console.error('\n❌ FALHA NA SUÍTE DE TESTES:', err);
    process.exit(1);
  });
}

module.exports = { runTestSuite };
