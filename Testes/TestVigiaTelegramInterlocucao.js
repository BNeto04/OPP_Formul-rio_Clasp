/**
 * Testes/TestVigiaTelegramInterlocucao.js
 * 
 * Validação rigorosa dos requisitos de prioridade de canal e interlocução:
 * 1. ANTIGRAVITY como interlocutor principal no Telegram (ANTIGRAVITY >)
 * 2. VIGIA como monitor e fallback (VIGIA/FALLBACK >)
 * 3. Oi / saudações com Antigravity disponível recebem resposta do Antigravity
 * 4. Pergunta livre de acompanhamento recebida pelo Antigravity
 * 5. Indisponibilidade controlada do Antigravity cai em VIGIA/FALLBACK >
 * 6. Retomada/recuperação volta para Antigravity
 * 7. Envio de "V" ou "v" reconhecido como retomada autorizada
 * 8. Sessão bloqueada (Windows Locked) defere envio de V (DEFER_LOCKED)
 */

const assert = require('assert');
const TelegramCommandRouter = require('../VigiaPonte/TelegramCommandRouter');
const NaturalLanguageRouter = require('../VigiaPonte/NaturalLanguageRouter');
const OperationalResumeController = require('../VigiaPonte/OperationalResumeController');
const AntigravityUiAdapter = require('../VigiaPonte/AntigravityUiAdapter');
const ResumeEventStore = require('../VigiaPonte/ResumeEventStore');

async function testSuite() {
  console.log('=== INICIANDO TESTES: TELEGRAM INTERLOCUÇÃO E PRIORIDADE DE CANAL (A a F) ===\n');

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
      current_issue_number: 43,
      current_task_id: 'TASK-43',
      summary: 'Executando testes da Issue #43'
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

  const commandRouter = new TelegramCommandRouter({
    allowlist: { isAuthorized: () => true, isPaired: () => true },
    recoveryManager,
    resumeController,
    nlRouter
  });

  // TESTE A: "Oi" com Antigravity disponível -> ANTIGRAVITY >
  console.log('TESTE A: "Oi" com Antigravity disponível -> resposta com prefixo ANTIGRAVITY >...');
  driver.running = true;
  const resA = await commandRouter.processUpdate({
    message: { from: { id: 100 }, chat: { id: 100 }, text: 'Oi' }
  });
  assert.ok(resA.text.startsWith('ANTIGRAVITY >'), `Deve iniciar com "ANTIGRAVITY >". Recebido: ${resA.text}`);
  assert.ok(!resA.text.includes('Não tenho dados suficientes'), 'Não pode conter mensagem genérica antiga');
  assert.ok(resA.text.includes('Issue #43') || resA.text.includes('Olá'), 'Deve conter saudação ou tarefa');
  console.log('  [PASS] Teste A: Saudação "Oi" respondida diretamente pelo Antigravity.');

  // TESTE B: Pergunta livre de acompanhamento -> ANTIGRAVITY >
  console.log('\nTESTE B: Pergunta livre de acompanhamento -> ANTIGRAVITY >...');
  const resB = await commandRouter.processUpdate({
    message: { from: { id: 100 }, chat: { id: 100 }, text: 'como vão as coisas por aí?' }
  });
  assert.ok(resB.text.startsWith('ANTIGRAVITY >'), `Deve iniciar com "ANTIGRAVITY >". Recebido: ${resB.text}`);
  assert.ok(!resB.text.includes('Não tenho dados suficientes'));
  console.log('  [PASS] Teste B: Pergunta livre respondida com contexto pelo Antigravity.');

  // TESTE C: Antigravity indisponível -> VIGIA/FALLBACK >
  console.log('\nTESTE C: Antigravity indisponível controladamente -> VIGIA/FALLBACK >...');
  driver.running = false;
  const resC = await commandRouter.processUpdate({
    message: { from: { id: 100 }, chat: { id: 100 }, text: 'Oi' }
  });
  assert.ok(resC.text.startsWith('VIGIA/FALLBACK >'), `Deve iniciar com "VIGIA/FALLBACK >". Recebido: ${resC.text}`);
  assert.ok(resC.text.includes('Antigravity não está em execução') || resC.text.includes('indisponível'));
  console.log('  [PASS] Teste C: Queda do Antigravity acionou fallback imediato do Vigia.');

  // TESTE D: Após recuperação -> conversa volta para ANTIGRAVITY >
  console.log('\nTESTE D: Após restauração do processo -> conversa volta para ANTIGRAVITY >...');
  driver.running = true;
  const resD = await commandRouter.processUpdate({
    message: { from: { id: 100 }, chat: { id: 100 }, text: 'Olá, voltou?' }
  });
  assert.ok(resD.text.startsWith('ANTIGRAVITY >'), `Deve voltar para "ANTIGRAVITY >". Recebido: ${resD.text}`);
  console.log('  [PASS] Teste D: Retorno do processo restaura canal primário com Antigravity.');

  // TESTE E: "V" puro ou "/v" -> aciona retomada autorizada
  console.log('\nTESTE E: Envio de "V" e "v" -> aciona ciclo de retomada autorizada...');
  driver.sends = [];
  const resE1 = await commandRouter.processUpdate({
    message: { from: { id: 100 }, chat: { id: 100 }, text: 'V' }
  });
  assert.ok(resE1.text.startsWith('ANTIGRAVITY >'), 'Envio de V confirmado deve vir com ANTIGRAVITY >');
  assert.ok(resE1.text.includes('Comando V enviado'), 'Deve informar envio de V');
  assert.strictEqual(driver.sends.length, 1);
  assert.strictEqual(driver.sends[0].payload, 'V');

  // Com "v" minúsculo
  const resE2 = await commandRouter.processUpdate({
    message: { from: { id: 100 }, chat: { id: 100 }, text: 'v' }
  });
  assert.ok(resE2.text.includes('Comando V enviado'));
  assert.strictEqual(driver.sends.length, 2);
  console.log('  [PASS] Teste E: Comandos "V" e "v" dispararam retomada autorizada com sucesso.');

  // TESTE F: Sessão gráfica bloqueada -> DEFER_LOCKED sem digitar
  console.log('\nTESTE F: Sessão gráfica bloqueada (Windows Locked) -> DEFER_LOCKED...');
  driver.locked = true;
  driver.sends = [];
  const resF = await commandRouter.processUpdate({
    message: { from: { id: 100 }, chat: { id: 100 }, text: 'V' }
  });
  assert.ok(resF.text.startsWith('VIGIA/FALLBACK >'), 'Deve vir com fallback do sentinela');
  assert.ok(resF.text.includes('GRAPHICAL_SESSION_LOCKED') || resF.text.includes('bloqueada'), 'Deve avisar sobre bloqueio');
  assert.strictEqual(driver.sends.length, 0, 'NENHUM input pode ser enviado em tela bloqueada');
  console.log('  [PASS] Teste F: Tela bloqueada deferiu envio sem digitar às cegas.');

  console.log('\n====================================================');
  console.log('✨ TESTES DE INTERLOCUÇÃO E PRIORIDADE DE CANAL APROVADOS!');
  console.log('====================================================\n');
}

if (require.main === module) {
  testSuite().catch(err => {
    console.error('Falha:', err);
    process.exit(1);
  });
}

module.exports = { testSuite };
