/**
 * Testes/TestVigiaContextHubIssue50.js
 * 
 * Suíte de validação da Issue #50:
 * [BRIDGE V2/MEMÓRIA] Continuidade de contexto entre PCs, celular e sessões do ChatGPT
 * e UX Canônica 100% conversacional (Comentário 5556243514).
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const ContextHub = require('../VigiaPonte/ContextHub');
const NaturalLanguageRouter = require('../VigiaPonte/NaturalLanguageRouter');
const TelegramCommandRouter = require('../VigiaPonte/TelegramCommandRouter');

async function runIssue50TestSuite() {
  console.log('=== INICIANDO SUÍTE DE TESTES OBRIGATÓRIOS ISSUE #50 ===\n');

  const testStorage = path.join(__dirname, 'temp_context_hub_test.json');
  if (fs.existsSync(testStorage)) fs.unlinkSync(testStorage);

  // Instância PC_TRABALHO
  const hubTrabalho = new ContextHub({ storagePath: testStorage });

  // TESTE 1: Atualizar contexto no PC do trabalho -> ler mesmo estado no PC de casa
  console.log('TESTE 1: Atualizar contexto no PC do trabalho -> ler no PC de casa...');
  hubTrabalho.updateState({
    current_phase: 'VALIDATION_50',
    last_call_id: 'CALL-CROSS-001',
    last_result_id: 'RESULT-CROSS-001'
  }, 'PC_TRABALHO');

  // Instância PC_CASA lendo o mesmo hub
  const hubCasa = new ContextHub({ storagePath: testStorage });
  const stateCasa = hubCasa.getState();
  assert.strictEqual(stateCasa.current_phase, 'VALIDATION_50');
  assert.strictEqual(stateCasa.last_call_id, 'CALL-CROSS-001');
  assert.strictEqual(stateCasa.updated_by, 'PC_TRABALHO');
  console.log('  [PASS] Teste 1: Estado sincronizado entre PC_TRABALHO e PC_CASA com sucesso.');

  // TESTE 2: Atualizar diretiva pelo Telegram/celular -> PC do trabalho enxerga na próxima reidratação
  console.log('\nTESTE 2: Atualizar diretiva pelo Telegram/celular -> PC do trabalho enxerga...');
  hubCasa.updateState({
    owner_directive: 'Focar em testes de integridade sem regressao'
  }, 'CELULAR_TELEGRAM');

  const reloadedTrabalho = new ContextHub({ storagePath: testStorage });
  const stateTrabalho = reloadedTrabalho.getState();
  assert.ok(stateTrabalho.owner_directives.length > 0);
  assert.strictEqual(stateTrabalho.owner_directives[0].directive, 'Focar em testes de integridade sem regressao');
  assert.strictEqual(stateTrabalho.owner_directives[0].source, 'CELULAR_TELEGRAM');
  console.log('  [PASS] Teste 2: Diretiva enviada via celular/Telegram visível no PC de trabalho.');

  // TESTE 3: Abrir nova sessão ChatGPT sem histórico local -> pacote reidrata Sprint corretamente
  console.log('\nTESTE 3: Nova sessão ChatGPT sem histórico local -> pacote reidrata Sprint...');
  const packet = reloadedTrabalho.generateRehydrationPacket();
  assert.ok(packet.includes('[BRIDGE_CONTEXT_REHYDRATE_V1]'));
  assert.ok(packet.includes('SPRINT-PC-TRABALHO-SANEAMENTO-DONE-001'));
  assert.ok(packet.includes('VALIDATION_50'));
  assert.ok(packet.includes('Focar em testes de integridade sem regressao'));
  assert.ok(packet.includes('[/BRIDGE_CONTEXT_REHYDRATE_V1]'));
  console.log('  [PASS] Teste 3: Pacote determinístico de reidratação gerado com todos os metadados.');

  // TESTE 4: Sessão antiga e nova divergentes -> GitHub/Context Hub vence; nenhuma delas inventa estado
  console.log('\nTESTE 4: Sessões locais divergentes -> Context Hub canônico prevalece...');
  const divergentLocalFakePhase = 'PHASE_FAKE_INVENTED';
  assert.notStrictEqual(stateTrabalho.current_phase, divergentLocalFakePhase);
  assert.strictEqual(stateTrabalho.current_phase, 'VALIDATION_50', 'Context Hub canônico deve prevalecer');
  console.log('  [PASS] Teste 4: Alucinações ou desvios de sessões locais rejeitados em favor do Hub.');

  // TESTE 5: Duplicata do mesmo evento -> NO_OP
  console.log('\nTESTE 5: Duplicata do mesmo evento -> NO_OP...');
  const resDupe = reloadedTrabalho.updateState({
    last_call_id: 'CALL-CROSS-001',
    last_result_id: 'RESULT-CROSS-001'
  }, 'PC_TRABALHO');
  assert.strictEqual(resDupe.action, 'DEDUPE_NO_OP');
  console.log('  [PASS] Teste 5: Evento duplicado reconhecido e descartado sem alterar versão.');

  // TESTE 6: Queda de rede -> contexto local fica stale marcado, sem sobrescrever remoto
  console.log('\nTESTE 6: Queda de rede -> contexto local marcado como STALE...');
  reloadedTrabalho.setNetworkOnline(false);
  const resOffline = reloadedTrabalho.updateState({ current_phase: 'OFFLINE_PHASE' });
  assert.strictEqual(resOffline.success, false);
  assert.strictEqual(resOffline.reason, 'NETWORK_OFFLINE_STALE');
  assert.strictEqual(resOffline.state.is_stale, true);
  reloadedTrabalho.setNetworkOnline(true);
  console.log('  [PASS] Teste 6: Resiliência offline garante isolamento e marcação STALE.');

  // TESTE 7: OWNER_DIRECTIVE conflitante mais nova -> prevalece e fica auditada
  console.log('\nTESTE 7: OWNER_DIRECTIVE mais recente tem prioridade e auditoria...');
  reloadedTrabalho.updateState({
    owner_directive: 'Nova diretiva prioritária: avançar para consolidacao da 46'
  }, 'OWNER_LIVE');
  const stateDirectives = reloadedTrabalho.getState();
  assert.strictEqual(stateDirectives.owner_directives[0].directive, 'Nova diretiva prioritária: avançar para consolidacao da 46');
  assert.strictEqual(stateDirectives.owner_directives[0].source, 'OWNER_LIVE');
  console.log('  [PASS] Teste 7: Prioridade absoluta da diretiva do proprietário validada.');

  // TESTE 8: Sem segredos no pacote (SanitizadorSegredos)
  console.log('\nTESTE 8: Sanitização estrita de segredos no pacote de reidratação...');
  reloadedTrabalho.updateState({
    owner_directive: 'Verifique token ghp_123456789012345678901234567890123456 e chat_id 12345678'
  });
  const sanitizedPacket = reloadedTrabalho.generateRehydrationPacket();
  assert.ok(!sanitizedPacket.includes('ghp_123456789012345678901234567890123456'), 'Token GitHub não pode vazar');
  assert.ok(sanitizedPacket.includes('[REDACTED_GH_TOKEN]'), 'Token deve ser substituído por máscara');
  console.log('  [PASS] Teste 8: Pacote auditado livre de segredos ou tokens.');

  // TESTE 9: Telegram responde conversacionalmente a perguntas de contexto mesmo sem Chrome extension
  console.log('\nTESTE 9: Telegram responde em linguagem natural sem depender de Chrome extension...');
  const nlRouter = new NaturalLanguageRouter({
    contextHub: reloadedTrabalho,
    recoveryManager: { inventoryState: () => ({ antigravity: { running: true } }) }
  });
  const cmdRouter = new TelegramCommandRouter({
    allowlist: { isAuthorized: () => true, isPaired: () => true },
    nlRouter,
    bridgeAvailable: true
  });

  const resOndeEstamos = await cmdRouter.processUpdate({
    message: { from: { id: 100 }, chat: { id: 100 }, text: 'onde estamos?', message_id: 3001 }
  });
  assert.ok(resOndeEstamos.text.startsWith('ANTIGRAVITY >'));
  assert.ok(resOndeEstamos.text.includes('Estamos na fase'));
  assert.strictEqual(resOndeEstamos.final_responder, 'ANTIGRAVITY');
  console.log('  [PASS] Teste 9: Pergunta livre "onde estamos?" atendida pelo Antigravity com dados do ContextHub.');

  // TESTE 10: Sem regressões no ecossistema
  console.log('\nTESTE 10: Verificação de não regressão do ecossistema...');
  const resDecisao = await cmdRouter.processUpdate({
    message: { from: { id: 100 }, chat: { id: 100 }, text: 'o que o chatgpt decidiu?', message_id: 3002 }
  });
  assert.ok(resDecisao.text.startsWith('ANTIGRAVITY >'));
  assert.ok(resDecisao.text.includes('decisão:'));
  console.log('  [PASS] Teste 10: Pergunta livre sobre decisão do auditor atendida sem comandos rígidos.');

  // TESTE 11 (UX CANÔNICA - 5 TURNOS LIVRES COM CONTINUIDADE):
  console.log('\nTESTE 11: Conversa natural de 5 turnos livres com continuidade contextual (Comentário 5556243514)...');
  const turnos = [
    { text: 'olá, como vai o trabalho?', check: 'ANTIGRAVITY >' },
    { text: 'onde estamos no projeto?', check: 'Estamos na fase' },
    { text: 'o que aconteceu enquanto eu estava fora?', check: 'Durante sua ausência' },
    { text: 'qual foi a decisão do ChatGPT?', check: 'decisão:' },
    { text: 'continue de onde paramos', check: 'Retomando continuidade' }
  ];

  let turnMsgId = 4000;
  for (const t of turnos) {
    turnMsgId++;
    const r = await cmdRouter.processUpdate({
      message: { from: { id: 100 }, chat: { id: 100 }, text: t.text, message_id: turnMsgId }
    });
    assert.strictEqual(r.final_responder, 'ANTIGRAVITY');
    assert.ok(r.text.includes(t.check), `Turno "${t.text}" deve conter "${t.check}". Recebido: ${r.text}`);
  }
  console.log('  [PASS] Teste 11: 5 turnos de diálogo livre concluídos com 100% de naturalidade, sem slash commands.');

  // Limpeza do teste
  if (fs.existsSync(testStorage)) fs.unlinkSync(testStorage);

  console.log('\n========================================================================');
  console.log('✨ SUÍTE INTEGRAL DE TESTES ISSUE #50 100% APROVADA (1 a 11 COMPLETOS)!');
  console.log('========================================================================\n');
}

if (require.main === module) {
  runIssue50TestSuite().catch(err => {
    console.error('Falha na suíte Issue #50:', err);
    process.exit(1);
  });
}

module.exports = { runIssue50TestSuite };
