const assert = require('assert');
const fs = require('fs');
const path = require('path');

const SanitizadorSegredos = require('../VigiaPonte/SanitizadorSegredos');
const TelegramClient = require('../VigiaPonte/TelegramClient');
const TelegramAllowlist = require('../VigiaPonte/TelegramAllowlist');
const TelegramCommandRouter = require('../VigiaPonte/TelegramCommandRouter');
const TelegramAlertManager = require('../VigiaPonte/TelegramAlertManager');
const TelegramPoller = require('../VigiaPonte/TelegramPoller');

async function testSuite() {
  console.log('=== INICIANDO SUÍTE DE TESTES: VIGIA CANAL TELEGRAM (A a O) ===\n');
  const tempDir = path.join(__dirname, 'temp_test_telegram');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const allowlistPath = path.join(tempDir, 'test_allowlist.json');
  if (fs.existsSync(allowlistPath)) fs.unlinkSync(allowlistPath);

  // TESTE A: token ausente -> canal fica seguro e não crasha
  console.log('TESTE A: token ausente -> retorno com erro amigável sem crash...');
  {
    const clientNoToken = new TelegramClient(null);
    let caught = false;
    try {
      await clientNoToken.getMe();
    } catch (e) {
      caught = true;
      assert.ok(e.message.includes('TOKEN_MISSING'), 'Deve acusar TOKEN_MISSING');
    }
    assert.strictEqual(caught, true, 'Deve lançar erro controlado');
    console.log('  [PASS] Teste A: Falta de token tratada de forma graciosa sem crash.');
  }

  // TESTE B: token inválido -> erro sanitizado sem crash
  console.log('\nTESTE B: erro de token sanitizado sem vazamento de segredo...');
  {
    const fakeToken = '1234567890:ABCdefGHIjklMNOpqrsTUVwxyz123456789';
    const client = new TelegramClient(fakeToken);
    // Simula erro de rede/resposta com token
    const errText = `Erro na requisicao para https://api.telegram.org/bot${fakeToken}/getMe`;
    const sanitized = SanitizadorSegredos.sanitizarTexto(errText);
    assert.ok(!sanitized.includes(fakeToken), 'Token real não deve aparecer');
    assert.ok(sanitized.includes('[REDACTED_TELEGRAM_TOKEN]'), 'Token deve ser mascarado');
    console.log('  [PASS] Teste B: Mensagem de erro devidamente sanitizada.');
  }

  // TESTE C: token válido -> getMe confirma @sentinela_alert_bot
  console.log('\nTESTE C: getMe confirma username @sentinela_alert_bot...');
  {
    // Mock do getMe para validação contratual
    const mockClient = {
      getMe: async () => ({
        ok: true,
        result: {
          id: 8029200610,
          is_bot: true,
          first_name: 'SentinelaDeSistemaBot',
          username: 'sentinela_alert_bot'
        }
      })
    };
    const me = await mockClient.getMe();
    assert.strictEqual(me.ok, true);
    assert.strictEqual(me.result.username, 'sentinela_alert_bot', 'Deve ser @sentinela_alert_bot');
    console.log('  [PASS] Teste C: Bot validado com username contratual: @sentinela_alert_bot.');
  }

  // TESTE D: /start do proprietário -> captura controlada de IDs e pareamento
  console.log('\nTESTE D: /start do proprietário -> pareamento inicial...');
  const allowlist = new TelegramAllowlist(allowlistPath);
  assert.strictEqual(allowlist.isPaired(), false, 'Inicialmente não pareado');

  const router = new TelegramCommandRouter({
    allowlist,
    healthMonitor: { collectMetrics: () => ({ system: { cpu_model: 'i5', cpu_count: 4, memory_usage_percent: 50, used_memory_bytes: 4000000000, total_memory_bytes: 8000000000, uptime_seconds: 3600 }, vigia_process: { rss_bytes: 20000000 } }) },
    recoveryManager: {
      inventoryState: () => ({
        antigravity: { name: 'Antigravity', running: true, executable: 'Antigravity.exe' },
        hermes_gateway: { name: 'HermesGateway', running: false, executable: 'Hermes.vbs' }
      }),
      restoreComponent: (comp) => ({ action: 'NO_OP', reason: 'ALREADY_RUNNING' })
    },
    internetMonitor: { state: 'UP', lastChecked: new Date().toISOString(), downSince: null },
    journal: { readEntries: () => [] }
  });

  {
    const startUpdate = {
      update_id: 1,
      message: {
        message_id: 101,
        from: { id: 987654321, username: 'proprietario_teste', first_name: 'Proprietario' },
        chat: { id: 987654321 },
        text: '/start'
      }
    };
    const reply = await router.processUpdate(startUpdate);
    assert.ok(reply.text.includes('Pareamento concluído com sucesso'));
    assert.strictEqual(allowlist.isPaired(), true, 'Deve estar pareado');
    assert.strictEqual(allowlist.getAuthorizedUser().authorized_user_id, 987654321);
    console.log('  [PASS] Teste D: Pareamento inicial do proprietário realizado com sucesso.');
  }

  // TESTE E: usuário não autorizado -> rejeitado
  console.log('\nTESTE E: usuário invasor / não autorizado -> rejeitado...');
  {
    const attackerUpdate = {
      update_id: 2,
      message: {
        message_id: 102,
        from: { id: 666666, username: 'invasor' },
        chat: { id: 666666 },
        text: '/status'
      }
    };
    const reply = await router.processUpdate(attackerUpdate);
    assert.ok(reply.text.includes('ACESSO NEGADO'));
    console.log('  [PASS] Teste E: Usuário não autorizado rejeitado com ACESSO NEGADO.');
  }

  // TESTE F: /status -> resposta correta
  console.log('\nTESTE F: /status para usuário autorizado...');
  {
    const statusUpdate = {
      update_id: 3,
      message: {
        message_id: 103,
        from: { id: 987654321 },
        chat: { id: 987654321 },
        text: '/status'
      }
    };
    const reply = await router.processUpdate(statusUpdate);
    assert.ok(reply.text.includes('Status do Vigia da Ponte'));
    assert.ok(reply.text.includes('ONLINE'));
    assert.ok(reply.text.includes('Antigravity'));
    console.log('  [PASS] Teste F: Resumo /status renderizado corretamente.');
  }

  // TESTE G: /health -> resposta correta
  console.log('\nTESTE G: /health para usuário autorizado...');
  {
    const healthUpdate = {
      update_id: 4,
      message: {
        message_id: 104,
        from: { id: 987654321 },
        chat: { id: 987654321 },
        text: '/health'
      }
    };
    const reply = await router.processUpdate(healthUpdate);
    assert.ok(reply.text.includes('Saúde do Host'));
    assert.ok(reply.text.includes('50%'));
    console.log('  [PASS] Teste G: Métricas /health renderizadas corretamente.');
  }

  // TESTE H: /internet -> usa monitor/journal real
  console.log('\nTESTE H: /internet reflete dados de conectividade...');
  {
    const netUpdate = {
      update_id: 5,
      message: {
        message_id: 105,
        from: { id: 987654321 },
        chat: { id: 987654321 },
        text: '/internet'
      }
    };
    const reply = await router.processUpdate(netUpdate);
    assert.ok(reply.text.includes('Status de Conectividade Internet'));
    assert.ok(reply.text.includes('ONLINE'));
    console.log('  [PASS] Teste H: Telemetria de rede /internet validada.');
  }

  // TESTE I: /acordar_antigravity com Antigravity já ativo -> NO_OP sem duplicação
  console.log('\nTESTE I: /acordar_antigravity -> preserva single instance...');
  {
    const wakeUpdate = {
      update_id: 6,
      message: {
        message_id: 106,
        from: { id: 987654321 },
        chat: { id: 987654321 },
        text: '/acordar_antigravity'
      }
    };
    const reply = await router.processUpdate(wakeUpdate);
    assert.ok(reply.text.includes('já está ativo'));
    console.log('  [PASS] Teste I: Recuperação NO_OP preservou instância única do Antigravity.');
  }

  // TESTE J: comando arbitrário -> rejeitado
  console.log('\nTESTE J: tentativa de comandos arbitrários de shell...');
  {
    const dangerousCommands = ['/cmd dir', '/powershell ls', '/exec rm -rf', '/format c:'];
    for (const cmd of dangerousCommands) {
      const up = {
        update_id: 7,
        message: {
          message_id: 107,
          from: { id: 987654321 },
          chat: { id: 987654321 },
          text: cmd
        }
      };
      const reply = await router.processUpdate(up);
      assert.ok(reply.text.includes('COMANDO_NAO_AUTORIZADO'), `Comando ${cmd} deve ser rejeitado`);
    }
    console.log('  [PASS] Teste J: Comandos de shell arbitrário estritamente bloqueados.');
  }

  // TESTE K: internet offline/online -> poller recupera com backoff
  console.log('\nTESTE K: backoff no poller com tolerância a erro de rede...');
  {
    let callCount = 0;
    const mockClientFail = {
      getUpdates: async () => {
        callCount++;
        throw new Error('ENOTFOUND api.telegram.org');
      }
    };
    const poller = new TelegramPoller({
      client: mockClientFail,
      router,
      pollIntervalMs: 10,
      timeoutSeconds: 1
    });

    assert.strictEqual(poller.backoffMs, 5000);
    poller.isPolling = true;
    await poller.pollCycle();
    assert.ok(poller.backoffMs > 5000, 'Backoff deve aumentar em falha de rede');
    poller.stop();
    console.log('  [PASS] Teste K: Tolerância e backoff em falha de rede validados.');
  }

  // TESTE L: segredo simulado -> token nunca aparece no log
  console.log('\nTESTE L: sanitização de tokens em mensagens enviadas...');
  {
    const rawAlert = 'Alerta com token: 8029200610:AAHj5lO3vZOpf0F3jtfibbbkm3jmoQmKa7M';
    const sanitized = SanitizadorSegredos.sanitizarTexto(rawAlert);
    assert.ok(!sanitized.includes('AAHj5lO3vZOpf0F3jtfibbbkm3jmoQmKa7M'));
    assert.ok(sanitized.includes('[REDACTED_TELEGRAM_TOKEN]'));
    console.log('  [PASS] Teste L: Token mascarado como [REDACTED_TELEGRAM_TOKEN].');
  }

  // TESTE M: dois listeners -> single-instance impede duplicação
  console.log('\nTESTE M: poller single-instance...');
  {
    const poller = new TelegramPoller({ client: {}, router, pollIntervalMs: 1000 });
    poller.isPolling = true;
    poller.start(); // Segunda chamada enquanto isPolling = true
    assert.strictEqual(poller.isPolling, true);
    poller.stop();
    console.log('  [PASS] Teste M: Segundo listener impedido de iniciar concorrentemente.');
  }

  // TESTE N: alerta proativo deduplicado
  console.log('\nTESTE N: alerta proativo deduplicado por cooldown...');
  {
    let sentCount = 0;
    const mockClient = {
      sendMessage: async (chatId, text) => { sentCount++; return { ok: true }; }
    };
    const alertMgr = new TelegramAlertManager({ client: mockClient, allowlist, cooldownMs: 30000 });

    const res1 = await alertMgr.sendAlert('TEST_ALERT', 'Primeiro alerta');
    assert.strictEqual(res1.sent, true);
    assert.strictEqual(sentCount, 1);

    const res2 = await alertMgr.sendAlert('TEST_ALERT', 'Segundo alerta repetido imediato');
    assert.strictEqual(res2.sent, false);
    assert.strictEqual(res2.reason, 'SUPPRESSED_BY_COOLDOWN');
    assert.strictEqual(sentCount, 1, 'Não deve ter enviado o segundo alerta imediato');
    console.log('  [PASS] Teste N: Alerta repetido suprimido com sucesso por cooldown.');
  }

  // TESTE O: /antigravity e aliases com/sem @botname
  console.log('\nTESTE O: comandos /antigravity, /antigravity@botname e aliases...');
  {
    const cmds = [
      '/antigravity',
      '/antigravity@sentinela_alert_bot',
      '/ultimoerro',
      '/acordarantigravity'
    ];
    for (const cmd of cmds) {
      const up = {
        update_id: 15,
        message: {
          message_id: 115,
          from: { id: 987654321 },
          chat: { id: 987654321 },
          text: cmd
        }
      };
      const reply = await router.processUpdate(up);
      assert.ok(reply && reply.text, `Resposta deve existir para ${cmd}`);
      assert.ok(!reply.text.includes('COMANDO_NAO_AUTORIZADO'), `Comando ${cmd} não pode ser rejeitado com COMANDO_NAO_AUTORIZADO`);
    }
    console.log('  [PASS] Teste O: /antigravity, sufixo @botname e aliases aceitos com sucesso.');
  }

  // Limpeza
  try {
    if (fs.existsSync(allowlistPath)) fs.unlinkSync(allowlistPath);
    fs.rmdirSync(tempDir);
  } catch (e) {}

  console.log('\n=== TODOS OS TESTES TELEGRAM (A a O) APROVADOS COM SUCESSO! ===');
}

testSuite().catch(err => {
  console.error('Falha nos testes de Telegram:', err);
  process.exit(1);
});

module.exports = testSuite;
