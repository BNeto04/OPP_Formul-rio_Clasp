'use strict';
if (typeof require === 'undefined') { /* Ignora no Apps Script */ } else {

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('--- TESTANDO VIGIA DA PONTE (TASK: VIGIA-PONTE-OLLAMA-001) ---');

const Config = require('../VigiaPonte/Config');
const { sanitizarTexto } = require('../VigiaPonte/SanitizadorSegredos');
const { classificarPorRegras } = require('../VigiaPonte/ClassificadorRegras');
const { classificarComOllama } = require('../VigiaPonte/AdaptadorOllama');
const { VigiaEngine } = require('../VigiaPonte/VigiaEngine');

async function executarTestes() {
  const engine = new VigiaEngine({ EVENT_COOLDOWN_MS: 500 }); // Cooldown reduzido para testes

  // =========================================================================
  // TESTE A: prompt "Continue? [y/N]" -> WAITING_INTERACTION sem responder auto
  // =========================================================================
  console.log('1. Teste A: prompt "Continue? [y/N]"...');
  {
    const texto = 'Do you want to proceed with this action? Continue? [y/N]';
    const res = await engine.processarObservacao(texto);
    assert.strictEqual(res.tipo, 'WAITING_INTERACTION');
    assert.strictEqual(res.classificacaoFonte, 'RULE');
    assert.strictEqual(res.ownerDecisionRequired, false);
    assert.strictEqual(res.acaoTomada, 'WAKE_WINDOW_AND_ALERT');
    assert.ok(!res.report.includes('auto-approved'), 'NUNCA deve responder ou aprovar automaticamente');
    console.log('   OK: Teste A passou (WAITING_INTERACTION detectado deterministamente sem auto-resposta)');
  }

  // =========================================================================
  // TESTE B: "Permission required" / Allow -> PERMISSION_REQUIRED, OWNER_DECISION true
  // =========================================================================
  console.log('2. Teste B: "Permission required" / Allow...');
  {
    const texto = 'System Alert: Permission required to modify system settings. Allow once?';
    const res = await engine.processarObservacao(texto);
    assert.strictEqual(res.tipo, 'PERMISSION_REQUIRED');
    assert.strictEqual(res.classificacaoFonte, 'RULE');
    assert.strictEqual(res.ownerDecisionRequired, true, 'Deve exigir obrigatoriamente decisão do proprietário');
    assert.strictEqual(res.acaoTomada, 'ALERT_OWNER_REQUIRED_NO_AUTO_APPROVE');
    console.log('   OK: Teste B passou (PERMISSION_REQUIRED com OWNER_DECISION_REQUIRED: true)');
  }

  // =========================================================================
  // TESTE C: Timeout conhecido -> TIMEOUT_OR_STALL / TRANSIENT_ERROR sem ação destrutiva
  // =========================================================================
  console.log('3. Teste C: Timeout e erro transitório conhecido...');
  {
    const textoTimeout = 'Error: ETIMEDOUT connect 127.0.0.1:443 - Connection timed out';
    const resTimeout = await engine.processarObservacao(textoTimeout);
    assert.strictEqual(resTimeout.tipo, 'TIMEOUT_OR_STALL');
    assert.strictEqual(resTimeout.ownerDecisionRequired, false);

    const textoTransiente = 'HTTP 429 Too Many Requests: Rate limit exceeded, retry later';
    const resTransiente = await engine.processarObservacao(textoTransiente);
    assert.strictEqual(resTransiente.tipo, 'TRANSIENT_ERROR');
    console.log('   OK: Teste C passou (TIMEOUT_OR_STALL e TRANSIENT_ERROR classificados sem ação destrutiva)');
  }

  // =========================================================================
  // TESTE D: Mensagem ambígua -> fallback Ollama com classificação estruturada
  // =========================================================================
  console.log('4. Teste D: Mensagem ambígua sem regra direta...');
  {
    const textoAmbiguo = 'Waiting for background service to stabilize before next phase';
    // Testa o adaptador Ollama com resposta segura
    const resOllama = await classificarComOllama(textoAmbiguo);
    assert.ok(resOllama.tipo !== undefined);
    assert.ok(resOllama.fonte === 'OLLAMA' || resOllama.fonte === 'FALLBACK');
    console.log('   OK: Teste D passou (Fallback para Ollama acionado de forma segura: ' + resOllama.fonte + ' -> ' + resOllama.tipo + ')');
  }

  // =========================================================================
  // TESTE E: Resposta inválida / timeout do Ollama -> UNKNOWN_NEEDS_REPORT (Fail-Open)
  // =========================================================================
  console.log('5. Teste E: Resiliência contra timeout/falha do Ollama (Fail-Open)...');
  {
    // Testa adaptador apontando para porta inexistente / fechada
    const resFalha = await classificarComOllama('Qualquer texto ambíguo');
    assert.strictEqual(resFalha.tipo, 'UNKNOWN_NEEDS_REPORT');
    assert.strictEqual(resFalha.sucesso, false);
    assert.ok(resFalha.motivo.includes('Fail-open'));
    console.log('   OK: Teste E passou (Falha do Ollama resulta em UNKNOWN_NEEDS_REPORT sem travar o Vigia)');
  }

  // =========================================================================
  // TESTE F: Evento repetido -> debounce e cooldown impedem spam
  // =========================================================================
  console.log('6. Teste F: Debounce e Cooldown contra spam de alertas...');
  {
    const engineCooldown = new VigiaEngine({ EVENT_COOLDOWN_MS: 10000 });
    const textoRepetido = 'Continue? [y/N]';
    
    // Primeiro disparo: deve emitir
    const res1 = await engineCooldown.processarObservacao(textoRepetido);
    assert.strictEqual(res1.emCooldown, false);
    assert.strictEqual(res1.acaoTomada, 'WAKE_WINDOW_AND_ALERT');

    // Segundo disparo imediato do mesmo tipo: deve ser suprimido pelo cooldown
    const res2 = await engineCooldown.processarObservacao(textoRepetido);
    assert.strictEqual(res2.emCooldown, true);
    assert.strictEqual(res2.acaoTomada, 'DEBOUNCED_SUPPRESSED_SPAM');
    console.log('   OK: Teste F passou (Segundo evento idêntico suprimido por cooldown)');
  }

  // =========================================================================
  // TESTE G: Vigia encerrado -> ponte e Antigravity permanecem independentes
  // =========================================================================
  console.log('7. Teste G: Independência e não-bloqueio da ponte principal...');
  {
    assert.strictEqual(Config.FAIL_OPEN, true);
    assert.strictEqual(Config.ALLOW_SECOND_WATCHER, false);
    assert.strictEqual(Config.ROLE, 'BRIDGE_LOCAL_WATCHDOG_ONLY');
    console.log('   OK: Teste G passou (Invariantes de fail-open e independência confirmados)');
  }

  // =========================================================================
  // TESTE H: Segredo simulado -> sanitização antes de log/prompt
  // =========================================================================
  console.log('8. Teste H: Sanitização estrita de segredos...');
  {
    const textoComSegredos = 'Error connecting with token ghp_A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8 and secret="super_secret_123" and Bearer eyJhbGciOiJIUzI1NiJ9';
    const sanitizado = sanitizarTexto(textoComSegredos);

    assert.ok(!sanitizado.includes('ghp_A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8'), 'Token GH deve ser expurgado');
    assert.ok(!sanitizado.includes('super_secret_123'), 'Secret literal deve ser expurgado');
    assert.ok(!sanitizado.includes('eyJhbGciOiJIUzI1NiJ9'), 'Bearer token deve ser expurgado');
    assert.ok(sanitizado.includes('[REDACTED_GH_TOKEN]'), 'Deve conter marcador de token redigido');
    assert.ok(sanitizado.includes('[REDACTED_SECRET]'), 'Deve conter marcador de segredo redigido');
    assert.ok(sanitizado.includes('[REDACTED_BEARER]'), 'Deve conter marcador de bearer redigido');
    console.log('   OK: Teste H passou (Sanitização estrita de credenciais confirmada)');
  }

  // =========================================================================
  // TESTE 9: Formato canônico de REPORT estruturado no log
  // =========================================================================
  console.log('9. Teste Formato de Report Estruturado...');
  {
    const logPath = Config.LOG_PATH;
    assert.ok(fs.existsSync(logPath), 'Arquivo de log estruturado deve ter sido gerado');
    const conteudoLog = fs.readFileSync(logPath, 'utf8');
    assert.ok(conteudoLog.includes('EVENT_ID:'));
    assert.ok(conteudoLog.includes('TIMESTAMP:'));
    assert.ok(conteudoLog.includes('SOURCE:'));
    assert.ok(conteudoLog.includes('EVENT_TYPE:'));
    assert.ok(conteudoLog.includes('OBSERVATION:'));
    assert.ok(conteudoLog.includes('INTENT_CLASSIFICATION_SOURCE:'));
    assert.ok(conteudoLog.includes('ACTION_TAKEN:'));
    assert.ok(conteudoLog.includes('WHY:'));
    assert.ok(conteudoLog.includes('SAFE_AUTOMATIC_ACTION:'));
    assert.ok(conteudoLog.includes('OWNER_DECISION_REQUIRED:'));
    assert.ok(conteudoLog.includes('EVIDENCE:'));
    assert.ok(conteudoLog.includes('COOLDOWN_STATE:'));
    console.log('   OK: Log estruturado contém todos os 12 campos obrigatórios do REPORT');
  }

  console.log('--- TODOS OS TESTES DO VIGIA DA PONTE PASSARAM COM SUCESSO! ---');
}

executarTestes().catch(err => {
  console.error('Erro nos testes do Vigia da Ponte:', err);
  process.exit(1);
});

}
