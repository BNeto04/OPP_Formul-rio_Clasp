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

  // TESTE A: "Oi" (conversacional) -> ISOLAMENTO DE CANAL: silencio no Telegram
  // (design vigente desde 70659aa/06-09: conversa livre e exclusiva do ChatGPT)
  console.log('TESTE A: "Oi" conversacional -> isolamento estrito do canal...');
  driver.running = true;
  const resA = await commandRouter.processUpdate({
    message: { from: { id: 100 }, chat: { id: 100 }, text: 'Oi' }
  });
  assert.strictEqual(resA, null, 'Conversa livre no Telegram deve ser silenciosa (não devolve resposta)');
  console.log('  [PASS] Teste A: Conversa livre silenciada por design (isolamento estrito do Telegram).');

  // TESTE B: Pergunta livre -> tambem silenciosa (isolamento de canal)
  console.log('\nTESTE B: Pergunta livre de acompanhamento -> silencio por design...');
  const resB = await commandRouter.processUpdate({
    message: { from: { id: 100 }, chat: { id: 100 }, text: 'como vão as coisas por aí?' }
  });
  assert.strictEqual(resB, null, 'Pergunta livre no Telegram nao recebe resposta conversacional');
  console.log('  [PASS] Teste B: Pergunta livre silenciada por design.');

  // TESTE C: Antigravity indisponível -> VIGIA/FALLBACK >
  console.log('\nTESTE C: Antigravity indisponível controladamente -> VIGIA/FALLBACK >...');
  driver.running = false;
  const resC = await commandRouter.processUpdate({
    message: { from: { id: 100 }, chat: { id: 100 }, text: 'Oi' }
  });
  assert.ok(resC.text.startsWith('VIGIA/FALLBACK >'), `Deve iniciar com "VIGIA/FALLBACK >". Recebido: ${resC.text}`);
  assert.ok(resC.text.includes('Antigravity não está em execução') || resC.text.includes('indisponível'));
  console.log('  [PASS] Teste C: Queda do Antigravity acionou fallback imediato do Vigia.');

  // TESTE D: Apos recuperacao -> canal continua isolado (silencio), sem conversa
  console.log('\nTESTE D: Após restauração do processo -> canal segue isolado...');
  driver.running = true;
  const resD = await commandRouter.processUpdate({
    message: { from: { id: 100 }, chat: { id: 100 }, text: 'Olá, voltou?' }
  });
  assert.strictEqual(resD, null, 'Recuperacao do processo nao reabre canal conversacional no Telegram');
  console.log('  [PASS] Teste D: Canal permanece isolado apos restauracao do processo.');

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
  assert.ok(resE2.text.startsWith('ANTIGRAVITY > V recebido; iniciando percepção factual'));
  assert.ok(resE2.text.includes('Comando V enviado'));
  assert.strictEqual(driver.sends.length, 2);
  console.log('  [PASS] Teste E: Comandos "V" e "v" dispararam retomada autorizada com ACK imediato.');

  // TESTE F: Sessão gráfica bloqueada -> DEFER_LOCKED sem digitar
  console.log('\nTESTE F: Sessão gráfica bloqueada (Windows Locked) -> DEFER_LOCKED com ACK...');
  driver.locked = true;
  driver.sends = [];
  const resF = await commandRouter.processUpdate({
    message: { from: { id: 100 }, chat: { id: 100 }, text: 'V' }
  });
  assert.ok(resF.text.startsWith('ANTIGRAVITY > V recebido; iniciando percepção factual'), 'Deve conter ACK do Antigravity');
  assert.ok(resF.text.includes('deferido') || resF.text.includes('bloqueada'), 'Deve avisar sobre deferimento');
  assert.strictEqual(driver.sends.length, 0, 'NENHUM input pode ser enviado em tela bloqueada');
  console.log('  [PASS] Teste F: Tela bloqueada deferiu envio sem digitar às cegas e com feedback claro.');

  // TESTE G: Pergunta semantica sobre o "v" -> silencio no Telegram e SEM disparo
  console.log('\nTESTE G: Pergunta discutindo semântica de V -> silêncio e nenhum disparo...');
  driver.locked = false;
  driver.running = true;
  driver.sends = [];
  const resG = await commandRouter.processUpdate({
    message: { from: { id: 100 }, chat: { id: 100 }, text: 'você entende que o "v" é um comando para verificar as issues no repo do git?' }
  });
  assert.strictEqual(resG, null, 'Pergunta conversacional no Telegram fica silenciosa');
  assert.strictEqual(driver.sends.length, 0, 'Discussão sobre V não pode disparar envio de V à UI');
  console.log('  [PASS] Teste G: Discussão semântica não dispara trigger e fica silenciosa por design.');

  // TESTE H: "vamos continuar" -> não é interpretado como V
  console.log('\nTESTE H: Frase iniciada em "v" ("vamos continuar") -> não aciona máquina de V...');
  driver.sends = [];
  const resH = await commandRouter.processUpdate({
    message: { from: { id: 100 }, chat: { id: 100 }, text: 'vamos continuar' }
  });
  assert.strictEqual(resH, null, 'Frase conversacional no Telegram fica silenciosa');
  assert.strictEqual(driver.sends.length, 0, '"vamos continuar" não pode disparar comando V');
  console.log('  [PASS] Teste H: Frases começando com "v" não são confundidas com o comando canônico V.');

  // TESTE I: isCanonicalVCommand allowlist estrita
  console.log('\nTESTE I: isCanonicalVCommand valida allowlist estrita fechada...');
  assert.strictEqual(TelegramCommandRouter.isCanonicalVCommand('v'), true);
  assert.strictEqual(TelegramCommandRouter.isCanonicalVCommand('V'), true);
  assert.strictEqual(TelegramCommandRouter.isCanonicalVCommand('/v'), true);
  assert.strictEqual(TelegramCommandRouter.isCanonicalVCommand('/retomar'), true);
  assert.strictEqual(TelegramCommandRouter.isCanonicalVCommand('retomar'), true);
  assert.strictEqual(TelegramCommandRouter.isCanonicalVCommand('você entende que o "v" é um comando?'), false);
  assert.strictEqual(TelegramCommandRouter.isCanonicalVCommand('vamos continuar'), false);
  assert.strictEqual(TelegramCommandRouter.isCanonicalVCommand('verifique as issues'), false);
  assert.strictEqual(TelegramCommandRouter.isCanonicalVCommand('v1'), false);
  console.log('  [PASS] Teste I: Allowlist canônica fechada comprovada sem matching difuso.');

  // TESTE J: Metadados route_reason e antigravity_available em fallback factual
  console.log('\nTESTE J: Verificação de route_reason e antigravity_available...');
  driver.running = false;
  const resJ = await commandRouter.processUpdate({
    message: { from: { id: 100 }, chat: { id: 100 }, text: 'como vão as coisas?' }
  });
  assert.ok(resJ.text.startsWith('VIGIA/FALLBACK >'));
  assert.strictEqual(resJ.antigravity_available, false);
  assert.strictEqual(resJ.route_reason, 'ANTIGRAVITY_PROCESS_DOWN');
  console.log('  [PASS] Teste J: Fallback devidamente justificado com metadados factuais.');

  // TESTE K: Janela minimizada → Vigia deve aceitar, restaurar e enviar V
  console.log('\nTESTE K: Janela minimizada → aceita como GUI_READY, V enviado com sucesso...');
  driver.running = true;
  driver.locked = false;
  driver.windows = [{ hwnd: 20, visible: false, minimized: true, className: 'Chrome_WidgetWin_1', title: 'OPP Formulário' }];
  driver.sends = [];
  const resK = await commandRouter.processUpdate({
    message: { from: { id: 100 }, chat: { id: 100 }, text: 'v' }
  });
  assert.ok(resK.text.startsWith('ANTIGRAVITY > V recebido'), `Deve conter ACK. Recebido: ${resK.text}`);
  assert.ok(resK.text.includes('Comando V enviado'), 'Deve confirmar envio de V');
  assert.strictEqual(driver.sends.length, 1, 'Deve ter enviado V mesmo com janela minimizada');
  assert.strictEqual(driver.sends[0].payload, 'V');
  console.log('  [PASS] Teste K: Janela minimizada restaurada e V enviado autonomamente.');

  // TESTE L: Nenhuma janela (nem visível nem minimizada) → GUI_NOT_READY
  console.log('\nTESTE L: Nenhuma janela detectável → GUI_NOT_READY sem confusão de autoridade...');
  driver.windows = [];
  driver.sends = [];
  const resL = await commandRouter.processUpdate({
    message: { from: { id: 100 }, chat: { id: 100 }, text: 'v' }
  });
  assert.ok(resL.text.startsWith('ANTIGRAVITY > V recebido'), `Deve conter ACK. Recebido: ${resL.text}`);
  assert.ok(resL.text.includes('não encontrada') || resL.text.includes('não está visível'), 'Deve indicar janela não encontrada');
  assert.ok(!resL.text.includes('suspenso por segurança'), 'NÃO pode conter frase enganosa sobre segurança');
  assert.strictEqual(driver.sends.length, 0, 'Nenhum envio sem janela detectável');
  console.log('  [PASS] Teste L: Sem janela → mensagem clara sem confusão de autorização.');

  // Restaurar estado padrão do driver
  driver.windows = [{ hwnd: 10, visible: true, minimized: false, className: 'Chrome_WidgetWin_1', title: 'OPP Formulário' }];

  console.log('\n====================================================');
  console.log('✨ TESTES DE INTERLOCUÇÃO E PRIORIDADE DE CANAL APROVADOS (A a L)!');
  console.log('====================================================\n');
}

if (require.main === module) {
  testSuite().catch(err => {
    console.error('Falha:', err);
    process.exit(1);
  });
}

module.exports = { testSuite };
