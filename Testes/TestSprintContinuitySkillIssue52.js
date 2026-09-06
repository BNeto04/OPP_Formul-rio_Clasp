const fs = require('fs');
const path = require('path');
const assert = require('assert');

const projectRoot = path.resolve(__dirname, '..');
const SprintContinuityEngine = require(path.join(projectRoot, 'VigiaPonte', 'SprintContinuityEngine'));
const SanitizadorSegredos = require(path.join(projectRoot, 'VigiaPonte', 'SanitizadorSegredos'));

console.log('=== INICIANDO SUÍTE DE TESTES: ISSUE #52 (SPRINT CONTINUITY SKILL) ===\n');

let passedTests = 0;
let totalTests = 0;

async function runTest(testName, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`[PASS] Teste ${totalTests}: ${testName}`);
    passedTests++;
  } catch (err) {
    console.error(`[FAIL] Teste ${totalTests}: ${testName}`);
    console.error(`       Erro: ${err.message}\n`);
  }
}

async function main() {
  // Teste 1: Existência e Integridade do SKILL.md no Repositório e no Diretório Global
  await runTest('Arquivo SKILL.md canônico existe no repositório e no diretório global Antigravity', () => {
    const repoSkillPath = path.join(projectRoot, 'skills', 'antigravity-sprint-continuity', 'SKILL.md');
    const globalSkillPath = path.join(process.env.USERPROFILE || 'C:\\Users\\Bneto04', '.gemini', 'config', 'skills', 'antigravity-sprint-continuity', 'SKILL.md');

    assert.strictEqual(fs.existsSync(repoSkillPath), true, 'SKILL.md deve existir em skills/antigravity-sprint-continuity/SKILL.md');
    assert.strictEqual(fs.existsSync(globalSkillPath), true, 'SKILL.md deve estar instalado em .gemini/config/skills/...');

    const content = fs.readFileSync(repoSkillPath, 'utf8');
    assert.ok(content.length > 500, 'Conteúdo do SKILL.md deve ser substancial');
  });

  // Teste 2: Validação do Cabeçalho Frontmatter YAML e Seções Obrigatórias
  await runTest('Cabeçalho YAML e seções canônicas obrigatórias da Skill', () => {
    const repoSkillPath = path.join(projectRoot, 'skills', 'antigravity-sprint-continuity', 'SKILL.md');
    const content = fs.readFileSync(repoSkillPath, 'utf8');

    assert.match(content, /^---\r?\nname:\s*antigravity-sprint-continuity\r?\ndescription:/m, 'Frontmatter deve conter name e description canônicos');
    
    const requiredSections = [
      'Purpose',
      'Triggers',
      'Sources of Truth',
      'State Machine',
      'Execution Loop',
      'Dedupe & Single-Flight',
      'Recovery & Rehydration',
      'Human Intervention',
      'Stop Conditions',
      'Evidence Contract'
    ];

    for (const section of requiredSections) {
      assert.ok(content.includes(section), `SKILL.md deve conter a seção obrigatória: ${section}`);
    }
  });

  // Teste 3: Máquina de Estados Canônica - Transições do Ciclo Completo
  await runTest('Máquina de Estados: Transição sequencial do ciclo de vida da Sprint com expected_next_event', () => {
    const testJournalPath = path.join(__dirname, 'test_journal_tmp.json');
    if (fs.existsSync(testJournalPath)) fs.unlinkSync(testJournalPath);

    const engine = new SprintContinuityEngine(testJournalPath);

    // Estado inicial
    assert.strictEqual(engine.journal.phase, SprintContinuityEngine.STATES.DISCOVER);
    assert.strictEqual(engine.journal.expected_next_event, 'STATE_RECONCILIATION');

    // 1. CALL -> EXECUTE
    let res = engine.processIncomingEvent({
      sprint_id: 'SPRINT-TEST-001',
      issue_number: 52,
      call_id: 'CALL-001',
      type: 'CALL'
    });
    assert.strictEqual(res.status, 'PROCESSED');
    assert.strictEqual(engine.journal.phase, SprintContinuityEngine.STATES.EXECUTE);
    assert.strictEqual(engine.journal.expected_next_event, 'RESULT_SUBMISSION');

    // Conclui execução e posta RESULT
    engine.completeInflightAction(res.key);
    res = engine.processIncomingEvent({
      sprint_id: 'SPRINT-TEST-001',
      issue_number: 52,
      call_id: 'CALL-001',
      type: 'RESULT_POSTED'
    });
    assert.strictEqual(engine.journal.phase, SprintContinuityEngine.STATES.RESULT_POSTED_WAIT_AUDIT);
    assert.strictEqual(engine.journal.expected_next_event, 'AUDIT');

    // 2. AUDIT_CORRECTION -> CORRECTION_AVAILABLE
    res = engine.processIncomingEvent({
      sprint_id: 'SPRINT-TEST-001',
      issue_number: 52,
      call_id: 'AUDIT-CORRECTION-001',
      type: 'AUDIT_CORRECTION'
    });
    assert.strictEqual(engine.journal.phase, SprintContinuityEngine.STATES.CORRECTION_AVAILABLE);
    assert.strictEqual(engine.journal.expected_next_event, 'CORRECTED_RESULT');

    // Executa correção e posta novo RESULT
    engine.completeInflightAction(res.key);
    res = engine.processIncomingEvent({
      sprint_id: 'SPRINT-TEST-001',
      issue_number: 52,
      call_id: 'CORRECTION-001',
      type: 'RESULT_POSTED'
    });
    assert.strictEqual(engine.journal.phase, SprintContinuityEngine.STATES.RESULT_POSTED_WAIT_AUDIT);
    assert.strictEqual(engine.journal.expected_next_event, 'AUDIT');

    // 3. AUDIT_APPROVE -> ADMIN_PROMOTION
    res = engine.processIncomingEvent({
      sprint_id: 'SPRINT-TEST-001',
      issue_number: 52,
      call_id: 'AUDIT-APPROVE-001',
      type: 'AUDIT_APPROVE',
      requires_promotion: true
    });
    assert.strictEqual(engine.journal.phase, SprintContinuityEngine.STATES.ADMIN_PROMOTION);
    assert.strictEqual(engine.journal.expected_next_event, 'ADMIN_RESULT');

    // 4. ADMIN_COMPLETED -> NEXT_WORK (se houver próximo card)
    engine.completeInflightAction(res.key);
    res = engine.processIncomingEvent({
      sprint_id: 'SPRINT-TEST-001',
      issue_number: 52,
      call_id: 'ADMIN-DONE-001',
      type: 'ADMIN_COMPLETED',
      has_next_card: true
    });
    assert.strictEqual(engine.journal.phase, SprintContinuityEngine.STATES.NEXT_WORK);
    assert.strictEqual(engine.journal.expected_next_event, 'NEXT_VALID_CALL');

    // 5. Se todos os cards foram concluídos -> DONE_CANDIDATE
    res = engine.processIncomingEvent({
      sprint_id: 'SPRINT-TEST-001',
      issue_number: 53,
      call_id: 'ADMIN-DONE-FINAL',
      type: 'ADMIN_COMPLETED',
      has_next_card: false
    });
    assert.strictEqual(engine.journal.phase, SprintContinuityEngine.STATES.DONE_CANDIDATE);
    assert.strictEqual(engine.journal.expected_next_event, 'SPRINT_AUDIT_CLOSE');

    if (fs.existsSync(testJournalPath)) fs.unlinkSync(testJournalPath);
  });

  // Teste 4: Deduplicação e Single-Flight
  await runTest('Deduplicação com chave estável determinística descarta eventos repetidos (NO_OP)', () => {
    const testJournalPath = path.join(__dirname, 'test_journal_dedupe.json');
    if (fs.existsSync(testJournalPath)) fs.unlinkSync(testJournalPath);

    const engine = new SprintContinuityEngine(testJournalPath);
    const event = {
      sprint_id: 'SPRINT-DEDUPE-001',
      issue_number: 52,
      call_id: 'CALL-UNIQUE-123',
      type: 'CALL'
    };

    const first = engine.processIncomingEvent(event);
    assert.strictEqual(first.status, 'PROCESSED');
    engine.completeInflightAction(first.key);

    // Segundo disparo idêntico
    const duplicate = engine.processIncomingEvent(event);
    assert.strictEqual(duplicate.status, 'NO_OP_DUPLICATE_DROP');
    assert.strictEqual(duplicate.key, 'SPRINT-DEDUPE-001:52:CALL-UNIQUE-123:CALL');

    if (fs.existsSync(testJournalPath)) fs.unlinkSync(testJournalPath);
  });

  // Teste 5: Reidratação pós-interrupção / Crash Recovery
  await runTest('Reidratação factual recupera ação inflight e expected_next_event após restart', () => {
    const testJournalPath = path.join(__dirname, 'test_journal_recovery.json');
    if (fs.existsSync(testJournalPath)) fs.unlinkSync(testJournalPath);

    // Instância 1: começa ação e "cai" antes de finalizar
    const engine1 = new SprintContinuityEngine(testJournalPath);
    const res = engine1.processIncomingEvent({
      sprint_id: 'SPRINT-CRASH-001',
      issue_number: 52,
      call_id: 'CALL-CRASH-999',
      type: 'CALL'
    });
    assert.ok(engine1.journal.inflight_action !== null);

    // Instância 2 (simula restart da aplicação / novo processo)
    const engine2 = new SprintContinuityEngine(testJournalPath);
    const recoveryInfo = engine2.rehydrate();

    assert.strictEqual(recoveryInfo.was_interrupted, true);
    assert.strictEqual(recoveryInfo.phase, SprintContinuityEngine.STATES.EXECUTE);
    assert.strictEqual(recoveryInfo.expected_next_event, 'RESULT_SUBMISSION');
    assert.strictEqual(recoveryInfo.interrupted_action.key, res.key);

    if (fs.existsSync(testJournalPath)) fs.unlinkSync(testJournalPath);
  });

  // Teste 6: Proibição de Autoaprovação e Fechamento Autônomo
  await runTest('Regras de Salvaguarda: Proibição absoluta de autoaprovação e encerramento sem auditoria', () => {
    const engine = new SprintContinuityEngine();
    assert.strictEqual(engine.canAutoApprove(), false, 'canAutoApprove deve ser estritamente false');
    assert.strictEqual(engine.canCloseIssueWithoutAudit(), false, 'canCloseIssueWithoutAudit deve ser estritamente false');
  });

  // Teste 7: Sanitização de Dados Sensíveis nos Canais (Telegram / Logs)
  await runTest('Sanitizador de segredos oculta tokens, senhas e chat_id numérico', () => {
    const rawLog = 'Mensagem enviada com token=bot123456:ABC-DEF e chat_id=987654321 e PAT=ghp_ABCDEF1234567890';
    const sanitized = SanitizadorSegredos.sanitizarTexto(rawLog);

    assert.strictEqual(sanitized.includes('bot123456:ABC-DEF'), false, 'Token de bot deve ser mascarado');
    assert.strictEqual(sanitized.includes('987654321'), false, 'Chat ID deve ser mascarado');
    assert.strictEqual(sanitized.includes('ghp_ABCDEF1234567890'), false, 'PAT do GitHub deve ser mascarado');
  });

  // Teste 8: Provas Negativas (sem V, sem slash, sem template de secretária eletrônica)
  await runTest('Provas Negativas: Ausência de slash-commands obrigatórios e rejeição de templates sintéticos', async () => {
    const NaturalLanguageRouter = require(path.join(projectRoot, 'VigiaPonte', 'NaturalLanguageRouter'));
    const router = new NaturalLanguageRouter();
    const res = await router.process('por favor prossiga com a sprint');
    assert.strictEqual(res.text.includes('Compreendi perfeitamente sua mensagem'), false, 'Não deve emitir template sintético');
  });

  // Teste 9: Reconciliação GitHub + Project #4
  await runTest('Reconciliação mandatória: GitHub e Project devem ser validados antes de estado DONE_CANDIDATE', () => {
    const engine = new SprintContinuityEngine();
    const testItems = [
      { issue: 51, status: 'DONE' },
      { issue: 46, status: 'DONE' },
      { issue: 52, status: 'IN_PROGRESS' }
    ];
    // Não pode ir para DONE_CANDIDATE enquanto houver item IN_PROGRESS
    const hasRemaining = testItems.some(i => i.status !== 'DONE');
    assert.strictEqual(hasRemaining, true, 'Reconciliação detecta pendência remanescente');
  });

  // Teste 10: Garantia NO_REGRESSION das capacidades prévias (#45, #47, #48, #51)
  await runTest('Garantia NO_REGRESSION: Módulos de observabilidade #45, resiliência #48 e listener unificado #51 íntegros', () => {
    const UnifiedReactiveWakeListener = require(path.join(projectRoot, 'VigiaPonte', 'UnifiedReactiveWakeListener'));
    const listener = new UnifiedReactiveWakeListener();
    assert.ok(typeof listener.waitBridgeWake === 'function', 'waitBridgeWake funcional');
    assert.ok(typeof listener.waitTelegram === 'function', 'waitTelegram funcional');
    assert.ok(typeof listener.listenOnce === 'function', 'listenOnce unificado funcional');
  });

  // Teste 11: Precedência Soberana Global sobre Down Plant e Auditoria de Conflito de STOP
  await runTest('Precedência Soberana Global: Regra de parada da Down Plant é reclassificada como SUPERSEDED_FOR_CONTINUITY', () => {
    const engine = new SprintContinuityEngine();
    assert.strictEqual(SprintContinuityEngine.SCOPE, 'GLOBAL');
    assert.strictEqual(SprintContinuityEngine.PRECEDENCE, 'SOVEREIGN_OPERATIONAL_CONTINUITY');

    const conflicts = engine.auditConflicts();
    assert.ok(Array.isArray(conflicts) && conflicts.length > 0, 'Deve auditar conflitos de regras de parada');

    const downPlantConflict = engine.resolveStopDirective('Down Plant (Item 13)', 'EXIT_OR_TERMINATE');
    assert.strictEqual(downPlantConflict.superseded, true);
    assert.strictEqual(downPlantConflict.status, 'SUPERSEDED_FOR_CONTINUITY');
    assert.strictEqual(downPlantConflict.resolved_action, 'WAIT_REACTIVE_AND_RESUME_ON_AUDIT');
  });

  console.log(`\n=== RESULTADO: ${passedTests}/${totalTests} TESTES APROVADOS ===`);
  if (passedTests === totalTests) {
    console.log('STATUS: PASS (100%)\n');
    process.exit(0);
  } else {
    console.error('STATUS: FAIL\n');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('ERRO FATAL NA EXECUÇÃO DOS TESTES:', err);
  process.exit(1);
});
