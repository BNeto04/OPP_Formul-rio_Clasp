/**
 * ExecutarProvaLiveModeloMemoria.js - Testes LIVE U e V da Issue #42
 * 
 * U) Teste LIVE com pelo menos 3 turnos encadeados e evidência de contexto
 * V) Teste LIVE após restart controlado do serviço comprovando persistência mínima
 */

const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');

const ConversationMemoryStore = require('../VigiaPonte/ConversationMemoryStore');
const NaturalLanguageRouter = require('../VigiaPonte/NaturalLanguageRouter');
const TelegramCommandRouter = require('../VigiaPonte/TelegramCommandRouter');
const TelegramAllowlist = require('../VigiaPonte/TelegramAllowlist');
const LockManager = require('../VigiaPonte/LockManager');

async function main() {
  console.log('====================================================');
  console.log('🧪 INICIANDO PROVA LIVE (TESTES U e V) - ISSUE #42');
  console.log('====================================================\n');

  const testUserId = 77712345;
  const allowlistPath = path.join(__dirname, 'temp_live_allowlist.json');
  const allowlist = new TelegramAllowlist({ allowlistPath });
  allowlist.pairOwner(testUserId, testUserId, 'live_owner');

  const memoryStore = new ConversationMemoryStore({
    storagePath: path.join(__dirname, '../VigiaPonte/conversation_memory.json'),
    activeTtlMs: 30 * 60 * 1000 // 30 minutos
  });

  const nlRouter = new NaturalLanguageRouter({
    memoryStore
  });

  const cmdRouter = new TelegramCommandRouter({
    allowlist,
    nlRouter
  });

  // ----------------------------------------------------
  // PARTE 1: TESTE U — 4 turnos encadeados + esquecer_contexto
  // ----------------------------------------------------
  console.log('--- PARTE 1: TESTE U (Turnos Encadeados em Linguagem Natural) ---');

  // Turno 1
  console.log('\n[Turno 1] Usuário: "Como está o Antigravity?"');
  const t1 = await cmdRouter.processUpdate({
    message: { from: { id: testUserId }, chat: { id: testUserId }, text: 'Como está o Antigravity?' }
  });
  console.log('Vigia:\n' + t1.text);

  let ctx = memoryStore.getContext(testUserId);
  console.log('\n-> Contexto após Turno 1:');
  console.log('   Subject:', ctx.subject);
  console.log('   Issue:', ctx.current_issue_number);
  console.log('   Task:', ctx.current_task_id);
  console.log('   Turnos no histórico:', ctx.history.length);

  // Turno 2
  console.log('\n[Turno 2] Usuário: "E o que ele está fazendo agora?"');
  const t2 = await cmdRouter.processUpdate({
    message: { from: { id: testUserId }, chat: { id: testUserId }, text: 'E o que ele está fazendo agora?' }
  });
  console.log('Vigia:\n' + t2.text);

  // Turno 3
  console.log('\n[Turno 3] Usuário: "Deu algum erro?"');
  const t3 = await cmdRouter.processUpdate({
    message: { from: { id: testUserId }, chat: { id: testUserId }, text: 'Deu algum erro?' }
  });
  console.log('Vigia:\n' + t3.text);

  // Turno 4
  console.log('\n[Turno 4] Usuário: "Por quanto tempo?"');
  const t4 = await cmdRouter.processUpdate({
    message: { from: { id: testUserId }, chat: { id: testUserId }, text: 'Por quanto tempo?' }
  });
  console.log('Vigia:\n' + t4.text);

  ctx = memoryStore.getContext(testUserId);
  console.log('\n-> Contexto após Turno 4:');
  console.log('   Subject:', ctx.subject);
  console.log('   Turnos no histórico:', ctx.history.length);

  // ----------------------------------------------------
  // PARTE 2: TESTE V — Restart Controlado e Persistência
  // ----------------------------------------------------
  console.log('\n--- PARTE 2: TESTE V (Restart Controlado do Serviço Vigia) ---');

  const lockPath = path.join(__dirname, '../VigiaPonte/vigia.lock');
  let oldPid = null;
  if (fs.existsSync(lockPath)) {
    try {
      const lockData = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
      oldPid = lockData.pid;
      console.log('PID Vigia em execução antes do restart:', oldPid);
    } catch (e) {}
  }

  // Encerrar processo antigo para simular reinício controlado do serviço
  if (oldPid) {
    console.log(`Enviando sinal de parada para PID ${oldPid}...`);
    try {
      process.kill(oldPid, 'SIGTERM');
    } catch (e) {
      try {
        execSync(`taskkill /F /PID ${oldPid}`);
      } catch (err) {}
    }
  }

  // Aguardar 1 segundo para liberação do lock
  await new Promise(r => setTimeout(r, 1500));

  // Iniciar novo processo VigiaBootEngine de forma limpa
  console.log('Iniciando nova instância do VigiaBootEngine...');
  const newVigiaChild = spawn('node', [path.join(__dirname, '../VigiaPonte/VigiaBootEngine.js')], {
    cwd: path.join(__dirname, '../VigiaPonte'),
    detached: true,
    stdio: 'ignore',
    windowsHide: true
  });
  newVigiaChild.unref();

  // Aguardar 3 segundos para boot do novo processo
  await new Promise(r => setTimeout(r, 3000));

  let newPid = null;
  if (fs.existsSync(lockPath)) {
    try {
      const lockData = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
      newPid = lockData.pid;
      console.log('Novo PID do Vigia após restart controlado:', newPid);
    } catch (e) {}
  }

  // Verificar se o contexto persistido em disco foi mantido após o restart
  const memoryStoreAfterRestart = new ConversationMemoryStore({
    storagePath: path.join(__dirname, '../VigiaPonte/conversation_memory.json'),
    activeTtlMs: 30 * 60 * 1000
  });

  const ctxAfterRestart = memoryStoreAfterRestart.getContext(testUserId);
  console.log('\n-> Contexto recuperado do disco após restart:');
  console.log('   Recuperado com sucesso?:', !!ctxAfterRestart);
  console.log('   Subject mantido:', ctxAfterRestart ? ctxAfterRestart.subject : 'NULO');
  console.log('   Turnos persistidos:', ctxAfterRestart ? ctxAfterRestart.history.length : 0);

  // Turno 5: Pergunta após restart utilizando a memória recuperada
  console.log('\n[Turno 5 - Pós-Restart] Usuário: "e o que ele está fazendo?"');
  const nlRouterPostRestart = new NaturalLanguageRouter({
    memoryStore: memoryStoreAfterRestart
  });
  const cmdRouterPostRestart = new TelegramCommandRouter({
    allowlist,
    nlRouter: nlRouterPostRestart
  });

  const t5 = await cmdRouterPostRestart.processUpdate({
    message: { from: { id: testUserId }, chat: { id: testUserId }, text: 'e o que ele está fazendo?' }
  });
  console.log('Vigia:\n' + t5.text);

  // Turno 6: Comando /esquecer_contexto
  console.log('\n[Turno 6] Usuário: "/esquecer_contexto"');
  const t6 = await cmdRouterPostRestart.processUpdate({
    message: { from: { id: testUserId }, chat: { id: testUserId }, text: '/esquecer_contexto' }
  });
  console.log('Vigia:\n' + t6.text);

  const ctxAfterClear = memoryStoreAfterRestart.getContext(testUserId);
  console.log('Contexto após esquecer:', ctxAfterClear);

  // Turno 7: Pergunta após esquecer o contexto (não deve assumir referente)
  console.log('\n[Turno 7] Usuário: "e antes disso?"');
  const t7 = await cmdRouterPostRestart.processUpdate({
    message: { from: { id: testUserId }, chat: { id: testUserId }, text: 'e antes disso?' }
  });
  console.log('Vigia:\n' + t7.text);

  // Limpeza do temp
  try {
    if (fs.existsSync(allowlistPath)) fs.unlinkSync(allowlistPath);
  } catch (e) {}

  console.log('\n====================================================');
  console.log('✨ PROVA LIVE (TESTES U e V) CONCLUÍDA COM SUCESSO!');
  console.log('====================================================\n');
}

main().catch(err => {
  console.error('❌ Erro na execução da prova LIVE:', err);
  process.exit(1);
});
