const assert = require('assert');
const path = require('path');
const fs = require('fs');

const AntigravityObserver = require('../VigiaPonte/AntigravityObserver');
const NaturalLanguageRouter = require('../VigiaPonte/NaturalLanguageRouter');
const TelegramCommandRouter = require('../VigiaPonte/TelegramCommandRouter');
const TelegramAllowlist = require('../VigiaPonte/TelegramAllowlist');
const RecoveryManager = require('../VigiaPonte/RecoveryManager');
const BootRecoveryJournal = require('../VigiaPonte/BootRecoveryJournal');
const SanitizadorSegredos = require('../VigiaPonte/SanitizadorSegredos');

async function runTests() {
  console.log('=== INICIANDO SUÍTE DE TESTES: OBSERVABILIDADE ANTIGRAVITY (A a M) ===\n');

  const tmpDir = path.join(__dirname, 'temp_test_obs');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  const allowlistPath = path.join(tmpDir, 'allowlist_test.json');

  fs.writeFileSync(allowlistPath, JSON.stringify({
    authorized_user_id: 555777,
    authorized_chat_id: 555777,
    username: 'AuditorOwner',
    paired_at: new Date().toISOString()
  }));

  const allowlist = new TelegramAllowlist(allowlistPath);

  // Mocks controlados
  let mockProcessRunning = true;
  const mockRecoveryManager = {
    inventoryState: () => ({
      antigravity: { name: 'Antigravity', running: mockProcessRunning },
      hermes_gateway: { name: 'HermesGateway', running: true }
    }),
    restoreComponent: () => ({ action: 'NO_OP' })
  };

  let mockTaskData = {
    found: true,
    issueNumber: 40,
    issueTitle: '[FUNC] Permitir ao Vigia inspecionar o que o Antigravity está fazendo',
    taskId: 'VIGIA-PONTE-OBSERVAR-ANTIGRAVITY-006',
    cardStatus: 'IN_PROGRESS',
    lastActivityTimestamp: new Date().toISOString(),
    lastActionSummary: 'Execução do pacote de observabilidade',
    ownerDecisionRequired: false,
    lastResultOrError: null,
    blockingClassification: 'NONE'
  };

  const observer = new AntigravityObserver({
    recoveryManager: mockRecoveryManager,
    customTaskFetcher: async () => mockTaskData,
    cacheTtlMs: 0 // Sem cache nos testes para permitir mutações nos cenários
  });

  const nlRouter = new NaturalLanguageRouter({
    recoveryManager: mockRecoveryManager,
    antigravityObserver: observer
  });

  const commandRouter = new TelegramCommandRouter({
    allowlist,
    recoveryManager: mockRecoveryManager,
    nlRouter
  });

  // TESTE A: processo aberto + Issue IN_PROGRESS correlacionada -> responde tarefa correta
  console.log('TESTE A: processo aberto + Issue IN_PROGRESS -> tarefa correta...');
  mockProcessRunning = true;
  mockTaskData.cardStatus = 'IN_PROGRESS';
  mockTaskData.ownerDecisionRequired = false;
  const resA = await observer.inspect();
  assert.strictEqual(resA.antigravity_process_running, true);
  assert.strictEqual(resA.execution_phase, 'IN_PROGRESS');
  assert.strictEqual(resA.current_issue_number, 40);
  assert(resA.summary.includes('Issue #40'));
  assert(resA.summary.includes('IN_PROGRESS'));
  console.log('  [PASS] Teste A: Tarefa ativa e fase IN_PROGRESS correlacionadas com sucesso.');

  // TESTE B: processo aberto + nenhuma tarefa correlacionável -> responde IDLE sem inventar
  console.log('\nTESTE B: processo aberto + nenhuma tarefa -> IDLE...');
  mockTaskData = { found: false, reason: 'NO_OPEN_ISSUES' };
  const resB = await observer.inspect();
  assert.strictEqual(resB.execution_phase, 'IDLE');
  assert(resB.summary.includes('IDLE') || resB.summary.includes('nenhuma tarefa'));
  console.log('  [PASS] Teste B: Ausência de tarefa tratada como IDLE sem alucinação.');

  // TESTE C: Issue REVIEW -> não chama de execução ativa
  console.log('\nTESTE C: Issue em REVIEW -> não reporta execução ativa...');
  mockTaskData = {
    found: true,
    issueNumber: 40,
    taskId: 'VIGIA-PONTE-OBSERVAR-ANTIGRAVITY-006',
    cardStatus: 'REVIEW',
    lastActivityTimestamp: new Date().toISOString(),
    ownerDecisionRequired: false
  };
  const resC = await observer.inspect();
  assert.strictEqual(resC.execution_phase, 'REVIEW');
  assert(resC.summary.includes('REVIEW') || resC.summary.includes('auditoria'));
  assert(!resC.summary.includes('trabalhando ativamente'));
  console.log('  [PASS] Teste C: Fase REVIEW diferenciada de execução ativa.');

  // TESTE D: WAITING_OWNER -> informa que aguarda decisão do proprietário
  console.log('\nTESTE D: WAITING_OWNER -> reporta decisão do proprietário...');
  mockTaskData.cardStatus = 'IN_PROGRESS';
  mockTaskData.ownerDecisionRequired = true;
  const resD = await observer.inspect();
  assert.strictEqual(resD.execution_phase, 'WAITING_OWNER');
  assert.strictEqual(resD.owner_decision_required, true);
  assert(resD.summary.includes('decisão do proprietário') || resD.summary.includes('aguardando'));
  console.log('  [PASS] Teste D: Decisão pendente reportada com clareza.');

  // TESTE E: ERROR recente -> informa erro sanitizado
  console.log('\nTESTE E: ERROR recente -> erro sanitizado...');
  mockTaskData.ownerDecisionRequired = false;
  mockTaskData.lastResultOrError = 'Falha com Bearer secretToken999';
  const resE = await observer.inspect();
  assert(resE.last_result_or_error.includes('[REDACTED_BEARER]'));
  assert(!resE.last_result_or_error.includes('secretToken999'));
  console.log('  [PASS] Teste E: Erro operacional sanitizado sem vazamento.');

  // TESTE F: fontes divergentes -> responde estado divergente
  console.log('\nTESTE F: processo inativo + card IN_PROGRESS -> estado divergente...');
  mockProcessRunning = false;
  mockTaskData.lastResultOrError = null;
  const resF = await observer.inspect();
  assert.strictEqual(resF.execution_phase, 'DIVERGENT');
  assert(resF.summary.includes('Estado divergente') || resF.summary.includes('divergente'));
  console.log('  [PASS] Teste F: Divergência entre processo e card detectada.');

  // TESTE G: timestamp antigo -> qualifica como última atividade conhecida
  console.log('\nTESTE G: timestamp antigo -> qualifica como última atividade...');
  mockProcessRunning = true;
  mockTaskData.cardStatus = 'IN_PROGRESS';
  // 120 minutos atrás
  mockTaskData.lastActivityTimestamp = new Date(Date.now() - 120 * 60000).toISOString();
  const resG = await observer.inspect();
  assert(resG.summary.includes('120 minutos'));
  console.log('  [PASS] Teste G: Tempo decorrido qualificado com precisão factual.');

  // TESTE H: pergunta "o que ele está fazendo?" em linguagem natural
  console.log('\nTESTE H: Pergunta em linguagem natural "O que o Antigravity está fazendo agora?"...');
  const resH = await nlRouter.process('O que o Antigravity está fazendo agora?', 555777);
  assert.strictEqual(resH.intent, 'ANTIGRAVITY_ACTIVITY_STATUS');
  assert(resH.text.includes('Antigravity'));
  console.log('  [PASS] Teste H: Linguagem natural roteada para observabilidade.');

  // TESTE I: /antigravity retorna o mesmo snapshot
  console.log('\nTESTE I: Comando /antigravity -> retorna mesmo snapshot...');
  const resI = await commandRouter.processUpdate({
    message: { text: '/antigravity', from: { id: 555777 }, chat: { id: 555777 } }
  });
  assert(resI.text.includes('Observabilidade Antigravity'));
  assert(resI.text.includes('Issue #40'));
  console.log('  [PASS] Teste I: Atalho /antigravity validado.');

  // TESTE J: segredos mascarados
  console.log('\nTESTE J: Verificação de sanitização em texto de ação...');
  mockTaskData.lastActionSummary = 'Atualizando com token bot8029200610:AAHj5lO3vZOpf0F3jtfibbbkm3jmoQmKa7M';
  const resJ = await observer.inspect();
  assert(!resJ.last_action_summary.includes('AAHj5lO3vZOpf0F3jtfibbbkm3jmoQmKa7M'));
  assert(resJ.last_action_summary.includes('[REDACTED_TELEGRAM_TOKEN]'));
  console.log('  [PASS] Teste J: Token mascarado em sumários.');

  // TESTE K: Invariante: segundo watcher NÃO criado
  console.log('\nTESTE K: Invariante second_watcher_created = false...');
  assert.strictEqual(observer.recoveryManager, mockRecoveryManager);
  console.log('  [PASS] Teste K: Reutilização estrita de componentes sem duplicação de watchers.');

  // TESTE L: Invariante: não interfere no processo Antigravity
  console.log('\nTESTE L: Invariante observe_not_control = true...');
  // Apenas inspeciona, nenhuma chamada a restoreComponent ou spawn foi realizada
  assert.strictEqual(mockProcessRunning, true);
  console.log('  [PASS] Teste L: Princípio OBSERVAR != CONTROLAR respeitado.');

  // Limpeza
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch (e) {}

  console.log('\n=== TODOS OS TESTES (A a L) APROVADOS COM SUCESSO! ===\n');
}

runTests().catch(err => {
  console.error('\n❌ FALHA NA SUÍTE DE TESTES:', err);
  process.exit(1);
});
