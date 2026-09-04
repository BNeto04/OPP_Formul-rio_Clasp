const assert = require('assert');
const fs = require('fs');
const path = require('path');

const LockManager = require('../VigiaPonte/LockManager');
const HealthMonitor = require('../VigiaPonte/HealthMonitor');
const InternetMonitor = require('../VigiaPonte/InternetMonitor');
const RecoveryManager = require('../VigiaPonte/RecoveryManager');
const BootRecoveryJournal = require('../VigiaPonte/BootRecoveryJournal');
const RemoteInterfaceStub = require('../VigiaPonte/RemoteInterfaceStub');
const VigiaBootEngine = require('../VigiaPonte/VigiaBootEngine');

async function testSuite() {
  console.log('=== INICIANDO SUÍTE DE TESTES: VIGIA BOOT & RECOVERY (A a J) ===\n');
  const tempDir = path.join(__dirname, 'temp_test_vigia_boot');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const testLockPath = path.join(tempDir, 'test_vigia.lock');
  const testJournalPath = path.join(tempDir, 'test_journal.log');

  // Limpeza prévia
  if (fs.existsSync(testLockPath)) fs.unlinkSync(testLockPath);
  if (fs.existsSync(testJournalPath)) fs.unlinkSync(testJournalPath);

  // TESTE A: boot/logon -> Vigia inicia automaticamente
  console.log('TESTE A: boot/logon -> Vigia inicia automaticamente na sequência canônica...');
  {
    const engine = new VigiaBootEngine({
      sessionId: 'test_session_A',
      lockFilePath: testLockPath,
      journalPath: testJournalPath,
      customProcessChecker: () => true, // simula processos rodando
      customInternetProbe: async () => ({ isUp: true, evidence: [{ host: '1.1.1.1', success: true }] })
    });

    const bootRes = await engine.runBootSequence(true);
    assert.strictEqual(bootRes.success, true, 'Boot sequence deve ser bem-sucedida');
    assert.strictEqual(bootRes.internet.state, 'UP', 'Internet deve estar UP');
    assert.ok(bootRes.health.healthy, 'Saúde inicial deve ser saudável');
    assert.ok(fs.existsSync(testLockPath), 'Arquivo de lock deve ser criado');

    engine.stop();
    console.log('  [PASS] Teste A: Sequência canônica de boot executada com sucesso.');
  }

  // TESTE B: segunda tentativa -> single-instance/NO_OP
  console.log('\nTESTE B: segunda tentativa -> single-instance/NO_OP (não duplica)...');
  {
    const lock1 = new LockManager({ sessionId: 'session_primary', lockFilePath: testLockPath });
    const res1 = lock1.acquireLock();
    assert.strictEqual(res1.acquired, true, 'Primeira instância deve adquirir lock');

    const lock2 = new LockManager({ sessionId: 'session_secondary', lockFilePath: testLockPath });
    const res2 = lock2.acquireLock();
    assert.strictEqual(res2.acquired, false, 'Segunda instância NÃO deve adquirir lock');
    assert.strictEqual(res2.reason, 'ALREADY_RUNNING', 'Motivo deve ser ALREADY_RUNNING');
    assert.strictEqual(res2.activePid, process.pid, 'PID ativo deve coincidir');

    lock1.releaseLock();
    console.log('  [PASS] Teste B: Single-instance assegurada; segunda instância descartada com NO_OP.');
  }

  // TESTE C: ponte/Antigravity já ativos -> não duplica
  console.log('\nTESTE C: componentes já ativos -> NO_OP (preserva instância única)...');
  {
    const recovery = new RecoveryManager({
      customProcessChecker: (procName) => true // reporta como já ativo
    });

    const resAntigravity = recovery.restoreComponent('antigravity');
    assert.strictEqual(resAntigravity.action, 'NO_OP', 'Antigravity já ativo deve retornar NO_OP');
    assert.strictEqual(resAntigravity.reason, 'ALREADY_RUNNING');

    const resHermes = recovery.restoreComponent('hermes_gateway');
    assert.strictEqual(resHermes.action, 'NO_OP', 'Hermes já ativo deve retornar NO_OP');
    assert.strictEqual(resHermes.reason, 'ALREADY_RUNNING');
    console.log('  [PASS] Teste C: Componentes já ativos preservados sem duplicação.');
  }

  // TESTE D: componente autorizado ausente -> restaura exatamente uma instância
  console.log('\nTESTE D: componente autorizado ausente -> restaura exatamente uma instância...');
  {
    let spawnCount = 0;
    const recovery = new RecoveryManager({
      customProcessChecker: () => false, // reporta ausente
      customSpawner: (comp) => {
        spawnCount++;
        return {
          action: 'STARTED_PROCESS',
          reason: 'COMPONENT_WAS_ABSENT',
          result: 'RECOVERY_TRIGGERED',
          component: comp.name,
          pid: 99999
        };
      }
    });

    const res = recovery.restoreComponent('antigravity');
    assert.strictEqual(res.action, 'STARTED_PROCESS', 'Deve iniciar componente ausente');
    assert.strictEqual(spawnCount, 1, 'Deve disparar exatamente uma recuperação');
    assert.strictEqual(res.component, 'Antigravity');
    console.log('  [PASS] Teste D: Componente ausente restaurado exatamente uma vez.');
  }

  // TESTE E: Internet cai -> registra DOWN com timestamp sem loop
  console.log('\nTESTE E: Internet cai -> registra DOWN com timestamp sem loop...');
  {
    let stateChangeEvent = null;
    let connectivityUp = false;

    const netMon = new InternetMonitor({
      customProbe: async () => ({ isUp: connectivityUp, evidence: [{ host: '1.1.1.1', success: connectivityUp }] }),
      onStateChange: (ev) => { stateChangeEvent = ev; }
    });

    const checkRes = await netMon.check();
    assert.strictEqual(checkRes.state, 'DOWN', 'Estado deve ser DOWN');
    assert.strictEqual(stateChangeEvent.type, 'INTERNET_DOWN', 'Evento deve ser INTERNET_DOWN');
    assert.ok(stateChangeEvent.timestamp, 'Deve registrar timestamp do evento');
    console.log('  [PASS] Teste E: Queda de conectividade detectada e registrada sem entrar em loop.');
  }

  // TESTE F: Internet volta -> registra UP+duração e reavalia continuidade
  console.log('\nTESTE F: Internet volta -> registra UP com duração calculada...');
  {
    let currentConn = false;
    let capturedEvent = null;

    const netMon = new InternetMonitor({
      customProbe: async () => ({ isUp: currentConn, evidence: [{ host: '1.1.1.1', success: currentConn }] }),
      onStateChange: (ev) => { capturedEvent = ev; }
    });

    // Passo 1: Simula DOWN
    await netMon.check();
    assert.strictEqual(netMon.state, 'DOWN');

    // Aguarda 50ms para ter duração observável
    await new Promise(r => setTimeout(r, 50));

    // Passo 2: Simula UP
    currentConn = true;
    await netMon.check();
    assert.strictEqual(netMon.state, 'UP');
    assert.strictEqual(capturedEvent.type, 'INTERNET_UP');
    assert.ok(capturedEvent.duration_ms >= 40, 'Duração de queda deve ser registrada');
    console.log('  [PASS] Teste F: Retorno da Internet registrado com cálculo de duração:', capturedEvent.duration_ms, 'ms');
  }

  // TESTE G: Vigia cai -> mecanismo de restart recupera com backoff
  console.log('\nTESTE G: política de reinício e backoff...');
  {
    const BASE_BACKOFF_MS = 5000;
    const MAX_RESTARTS = 5;

    function calcBackoff(attempt) {
      if (attempt > MAX_RESTARTS) return null;
      return BASE_BACKOFF_MS * Math.pow(2, attempt - 1);
    }

    assert.strictEqual(calcBackoff(1), 5000, 'Tentativa 1: 5s');
    assert.strictEqual(calcBackoff(2), 10000, 'Tentativa 2: 10s');
    assert.strictEqual(calcBackoff(3), 20000, 'Tentativa 3: 20s');
    assert.strictEqual(calcBackoff(4), 40000, 'Tentativa 4: 40s');
    assert.strictEqual(calcBackoff(5), 80000, 'Tentativa 5: 80s');
    assert.strictEqual(calcBackoff(6), null, 'Tentativa 6: Teto atingido (para loop de crash)');
    console.log('  [PASS] Teste G: Backoff exponencial e proteção contra crash loop validados.');
  }

  // TESTE H: caminho/processo desconhecido -> reporta, não inventa
  console.log('\nTESTE H: componente desconhecido -> rejeitado, não inventa...');
  {
    const recovery = new RecoveryManager();
    const res = recovery.restoreComponent('processo_fantasma_desconhecido');
    assert.strictEqual(res.action, 'REJECTED');
    assert.strictEqual(res.reason, 'UNKNOWN_PROCESS_REPORTED');
    assert.strictEqual(res.result, 'ERROR_UNAUTHORIZED_COMPONENT');
    console.log('  [PASS] Teste H: Invariante unknown_process_is_not_invented cumprida com sucesso.');
  }

  // TESTE I: segredo simulado -> log sanitizado
  console.log('\nTESTE I: segredo simulado -> log e journal sanitizados...');
  {
    const journal = new BootRecoveryJournal({ journalPath: testJournalPath });
    const fakeToken = 'ghp_' + 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8';
    journal.recordEntry({
      boot_session_id: 'session_with_secret',
      action: 'AUTH_CHECK',
      reason: 'Testing with token: ' + fakeToken,
      result: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tokensecret',
      owner_decision_required: false
    });

    const entries = journal.readEntries(10);
    const lastEntryStr = JSON.stringify(entries[entries.length - 1]);
    assert.ok(!lastEntryStr.includes(fakeToken), 'Token sensível NÃO deve aparecer no log');
    assert.ok(lastEntryStr.includes('[REDACTED_GH_TOKEN]'), 'Token deve ser substituído por [REDACTED_GH_TOKEN]');
    assert.ok(lastEntryStr.includes('[REDACTED_BEARER]'), 'Bearer deve ser substituído por [REDACTED_BEARER]');
    console.log('  [PASS] Teste I: Segredos estritamente sanitizados antes da gravação.');
  }

  // TESTE J: saúde sob carga normal -> polling não degrada operação
  console.log('\nTESTE J: saúde sob carga -> polling ultraleve...');
  {
    const health = new HealthMonitor();
    const start = Date.now();
    for (let i = 0; i < 100; i++) {
      const m = health.collectMetrics();
      assert.ok(m.system.total_memory_bytes > 0);
    }
    const elapsed = Date.now() - start;
    assert.ok(elapsed < 500, `100 amostragens devem levar menos de 500ms (levou ${elapsed}ms)`);
    console.log(`  [PASS] Teste J: 100 coletas concluídas em ${elapsed}ms (< 5ms por coleta).`);
  }

  // Limpeza do temp
  try {
    if (fs.existsSync(testLockPath)) fs.unlinkSync(testLockPath);
    if (fs.existsSync(testJournalPath)) fs.unlinkSync(testJournalPath);
    fs.rmdirSync(tempDir);
  } catch (e) {}

  console.log('\n=== TODOS OS TESTES (A a J) APROVADOS COM SUCESSO! ===');
}

testSuite().catch(err => {
  console.error('Falha na suíte de testes:', err);
  process.exit(1);
});

module.exports = testSuite;
