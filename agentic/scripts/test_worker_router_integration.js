/**
 * Syntheon Agentic Layer - Worker to Router Integration Test
 * Card: #72 T-A01-INTEGRATION-004
 */

const fs = require('fs');
const path = require('path');
const { start } = require('./start_router');
const { stop } = require('./stop_router');
const { executeTask } = require('../workers/syntheon_worker_adapter');

async function run() {
  console.log('=== SYNTHEON AGENTIC LAYER - WORKER ROUTER INTEGRATION AUDIT ===\n');

  // 1. Garantir router ativo
  console.log('[STEP 1] Inicializando Router Local na porta 4000...');
  const startRes = await start();
  console.log(`PASS: Router pronto (${startRes.status}).\n`);

  let allPassed = true;

  // 2. Cenario A: simulate_primary_success
  console.log('[SCENARIO A] Testando Worker -> Router -> Primary (Gemini)...');
  const resA = await executeTask({
    taskId: 'TEST_TASK_PRIMARY_001',
    instruction: 'Realizar calculo deterministico de AIS',
    mockRoutingHeader: 'simulate_primary_success'
  });
  console.log('Resultado Cenário A:', JSON.stringify(resA, null, 2));

  if (
    resA.status === 'COMPLETED' &&
    resA.provider_used === 'gemini' &&
    resA.model_used === 'gemini-3.6-flash' &&
    resA.routing_tier === 'primary' &&
    resA.fallback_used === false
  ) {
    console.log('PASS: Cenário A (Primary Gemini) validado com sucesso.\n');
  } else {
    console.error('FAIL: Cenário A divergiu do esperado.\n');
    allPassed = false;
  }

  // 3. Cenario B: simulate_fallback_1_success
  console.log('[SCENARIO B] Testando Worker -> Router -> Fallback 1 (Groq)...');
  const resB = await executeTask({
    taskId: 'TEST_TASK_FALLBACK_001',
    instruction: 'Processar texto com fallback de baixa latencia',
    mockRoutingHeader: 'simulate_fallback_1_success'
  });
  console.log('Resultado Cenário B:', JSON.stringify(resB, null, 2));

  if (
    resB.status === 'COMPLETED' &&
    resB.provider_used === 'groq' &&
    resB.model_used === 'qwen/qwen3.6-27b' &&
    resB.routing_tier === 'fallback_1' &&
    resB.fallback_used === true
  ) {
    console.log('PASS: Cenário B (Fallback 1 Groq) validado com sucesso.\n');
  } else {
    console.error('FAIL: Cenário B divergiu do esperado.\n');
    allPassed = false;
  }

  // 4. Cenario C: Sem mock e sem credenciais -> Rejeicao segura 401
  console.log('[SCENARIO C] Testando Worker -> Router sem credenciais (Falha Segura)...');
  const resC = await executeTask({
    taskId: 'TEST_TASK_NO_CRED_001',
    instruction: 'Tentativa de execucao real sem chave de API'
  });
  console.log('Resultado Cenário C:', JSON.stringify(resC, null, 2));

  if (
    resC.status === 'FAILED_NO_CREDENTIAL' &&
    resC.error &&
    resC.error.type === 'NO_PROVIDER_CREDENTIAL'
  ) {
    console.log('PASS: Cenário C (Falha Segura NO_PROVIDER_CREDENTIAL) validado com sucesso.\n');
  } else {
    console.error('FAIL: Cenário C nao retornou o erro estruturado esperado.\n');
    allPassed = false;
  }

  // 5. Cenario D: Teste de Bypass Diagnostico
  console.log('[SCENARIO D] Testando mecanismo de Bypass Diagnostico (SYNTHEON_ROUTER_BYPASS)...');
  process.env.SYNTHEON_ROUTER_BYPASS = 'true';
  const resD = await executeTask({
    taskId: 'TEST_TASK_BYPASS_001',
    instruction: 'Comando direto em modo diagnostico'
  });
  delete process.env.SYNTHEON_ROUTER_BYPASS;

  if (resD.status === 'BYPASS_EXECUTED' && resD.routing_tier === 'bypass') {
    console.log('PASS: Cenário D (Bypass Diagnóstico) validado com sucesso.\n');
  } else {
    console.error('FAIL: Cenário D falhou no bypass.\n');
    allPassed = false;
  }

  // 6. Cenario E: Verificacao da integracao e isolamento do Hermes
  console.log('[SCENARIO E] Verificando configuracao do Hermes Agent e preservacao do legado...');
  const hermesDefault = 'C:\\Users\\Bneto04\\AppData\\Local\\hermes\\config.yaml';
  const hermesProfile = 'C:\\Users\\Bneto04\\AppData\\Local\\hermes\\profiles\\syntheon-router\\config.yaml';

  const defaultContent = fs.existsSync(hermesDefault) ? fs.readFileSync(hermesDefault, 'utf8') : '';
  const profileContent = fs.existsSync(hermesProfile) ? fs.readFileSync(hermesProfile, 'utf8') : '';

  const defaultHasOllama = defaultContent.includes('11434');
  const profileHasRouter = profileContent.includes('4000') && profileContent.includes('syntheon-worker');

  if (defaultHasOllama && profileHasRouter) {
    console.log('PASS: Perfil dedicado syntheon-router aponta para porta 4000; config default legada em 11434 preservada.\n');
  } else {
    console.error(`FAIL: Configuracao Hermes inconsistente (defaultHasOllama: ${defaultHasOllama}, profileHasRouter: ${profileHasRouter})\n`);
    allPassed = false;
  }

  // 7. Encerramento do router
  console.log('[STEP 7] Encerrando Router Local...');
  await stop();
  console.log('PASS: Router finalizado com sucesso.\n');

  // 8. Varredura de logs por segredos
  console.log('[STEP 8] Auditando logs por presenca de chaves ou headers sensiveis...');
  const logPath = path.join(__dirname, '..', 'logs', 'router.log');
  if (fs.existsSync(logPath)) {
    const logs = fs.readFileSync(logPath, 'utf8');
    const hasSecretPattern = /AIza[0-9A-Za-z-_]{35}|gsk_[0-9A-Za-z]{20,}|Bearer\s+[A-Za-z0-9-_]{20,}/i.test(logs);
    if (hasSecretPattern) {
      console.error('FAIL: Padrao de secret detectado no arquivo de log!');
      allPassed = false;
    } else {
      console.log('PASS: Zero tokens, chaves ou headers sensiveis nos logs.\n');
    }
  }

  if (allPassed) {
    console.log('=== TESTE DE INTEGRACAO WORKER-ROUTER: 100% PASS ===');
    process.exit(0);
  } else {
    console.error('=== TESTE DE INTEGRACAO: FALHAS DETECTADAS ===');
    process.exit(1);
  }
}

run().catch(err => {
  console.error('\nFATAL:', err.message);
  process.exit(1);
});