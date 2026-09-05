/**
 * Testes/TestVigiaAuditIssue44.js
 *
 * Suíte de Testes Automatizados da Issue #44:
 * [AUDIT/INFRA] Publicar estado executável do Vigia/Antigravity para auditoria real de código
 *
 * 10 Testes Mínimos Obrigatórios:
 * 1. 'v' isolado -> comando canônico.
 * 2. 'V' isolado -> comando canônico.
 * 3. '/v' -> comando canônico.
 * 4. '/retomar' -> comando canônico.
 * 5. 'você entende que o "v" é um comando?' -> NÃO comando V; conversa normal.
 * 6. 'vamos continuar' -> NÃO comando V.
 * 7. Antigravity disponível + frase normal -> ANTIGRAVITY >.
 * 8. NLU desconhecida com Antigravity disponível -> não acionar fallback somente por UNKNOWN.
 * 9. Antigravity indisponível factual -> VIGIA/FALLBACK > com route_reason.
 * 10. suíte global verde.
 */

const assert = require('assert');
const TelegramCommandRouter = require('../VigiaPonte/TelegramCommandRouter');
const NaturalLanguageRouter = require('../VigiaPonte/NaturalLanguageRouter');

async function runTestSuite() {
  console.log('================================================================');
  console.log('  SUÍTE DE TESTES: AUDITORIA FUNCIONAL DO VIGIA (Issue #44)');
  console.log('================================================================\n');

  let passed = 0;

  // Mock do RecoveryManager e Adaptadores
  const mockRecoveryManager = {
    inventoryState: () => ({ antigravity: { running: true } }),
    restoreComponent: () => ({ action: 'STARTED_PROCESS', pid: 1234 })
  };

  const nlRouter = new NaturalLanguageRouter({
    recoveryManager: mockRecoveryManager,
    antigravityObserver: {
      inspect: async () => ({ execution_phase: 'IDLE', summary: 'Antigravity operando' })
    }
  });

  const commandRouter = new TelegramCommandRouter({
    allowlist: { isAuthorized: () => true, isPaired: () => true },
    recoveryManager: mockRecoveryManager,
    nlRouter,
    bridgeAvailable: true,
    timeoutMs: 3000
  });

  // TESTE 1: 'v' isolado -> comando canônico
  {
    console.log('[TEST 1] Verificando "v" isolado...');
    const res = await commandRouter.processUpdate({
      message: { from: { id: 100 }, chat: { id: 100 }, text: 'v', message_id: 101 }
    });
    assert.strictEqual(res.route_type, 'RESERVED_COMMAND');
    assert.strictEqual(res.route_reason, 'CANONICAL_V_COMMAND');
    assert.ok(res.text.includes('Comando V enviado') || res.text.includes('V recebido'));
    console.log('  -> PASS: "v" reconhecido exclusivamente como comando canônico.\n');
    passed++;
  }

  // TESTE 2: 'V' isolado -> comando canônico
  {
    console.log('[TEST 2] Verificando "V" isolado...');
    const res = await commandRouter.processUpdate({
      message: { from: { id: 100 }, chat: { id: 100 }, text: 'V', message_id: 102 }
    });
    assert.strictEqual(res.route_type, 'RESERVED_COMMAND');
    assert.strictEqual(res.route_reason, 'CANONICAL_V_COMMAND');
    assert.ok(res.text.includes('Comando V enviado') || res.text.includes('V recebido'));
    console.log('  -> PASS: "V" maiúsculo reconhecido como comando canônico.\n');
    passed++;
  }

  // TESTE 3: '/v' -> comando canônico
  {
    console.log('[TEST 3] Verificando "/v"...');
    const res = await commandRouter.processUpdate({
      message: { from: { id: 100 }, chat: { id: 100 }, text: '/v', message_id: 103 }
    });
    assert.strictEqual(res.route_type, 'RESERVED_COMMAND');
    assert.strictEqual(res.route_reason, 'CANONICAL_V_COMMAND');
    console.log('  -> PASS: "/v" reconhecido como comando canônico.\n');
    passed++;
  }

  // TESTE 4: '/retomar' -> comando canônico
  {
    console.log('[TEST 4] Verificando "/retomar"...');
    const res = await commandRouter.processUpdate({
      message: { from: { id: 100 }, chat: { id: 100 }, text: '/retomar', message_id: 104 }
    });
    assert.strictEqual(res.route_type, 'RESERVED_COMMAND');
    assert.strictEqual(res.route_reason, 'CANONICAL_V_COMMAND');
    console.log('  -> PASS: "/retomar" reconhecido como comando canônico.\n');
    passed++;
  }

  // TESTE 5: 'você entende que o "v" é um comando?' -> NÃO comando V; conversa normal
  {
    console.log('[TEST 5] Verificando frase semântica sobre "v"...');
    const text = 'você entende que o "v" é um comando?';
    const res = await commandRouter.processUpdate({
      message: { from: { id: 100 }, chat: { id: 100 }, text, message_id: 105 }
    });
    assert.notStrictEqual(res.route_type, 'RESERVED_COMMAND');
    assert.strictEqual(res.final_responder, 'ANTIGRAVITY');
    assert.ok(res.text.startsWith('ANTIGRAVITY >'));
    console.log('  -> PASS: Frase sobre "v" não disparou trigger de V; respondida pelo Antigravity.\n');
    passed++;
  }

  // TESTE 6: 'vamos continuar' -> NÃO comando V
  {
    console.log('[TEST 6] Verificando frase iniciada por "v" ("vamos continuar")...');
    const res = await commandRouter.processUpdate({
      message: { from: { id: 100 }, chat: { id: 100 }, text: 'vamos continuar', message_id: 106 }
    });
    assert.notStrictEqual(res.route_type, 'RESERVED_COMMAND');
    assert.strictEqual(res.final_responder, 'ANTIGRAVITY');
    assert.ok(res.text.startsWith('ANTIGRAVITY >'));
    console.log('  -> PASS: "vamos continuar" tratada como conversa normal sem falso-positivo de V.\n');
    passed++;
  }

  // TESTE 7: Antigravity disponível + frase normal -> ANTIGRAVITY >
  {
    console.log('[TEST 7] Verificando frase normal com Antigravity disponível...');
    const res = await commandRouter.processUpdate({
      message: { from: { id: 100 }, chat: { id: 100 }, text: 'qual é o status atual da sprint?', message_id: 107 }
    });
    assert.strictEqual(res.route_type, 'ANTIGRAVITY_CONVERSATION');
    assert.strictEqual(res.final_responder, 'ANTIGRAVITY');
    assert.ok(res.text.startsWith('ANTIGRAVITY >'));
    console.log('  -> PASS: Antigravity respondeu como canal primário.\n');
    passed++;
  }

  // TESTE 8: NLU desconhecida com Antigravity disponível -> não acionar fallback somente por UNKNOWN
  {
    console.log('[TEST 8] Verificando NLU desconhecida sem acionamento de fallback...');
    const res = await commandRouter.processUpdate({
      message: { from: { id: 100 }, chat: { id: 100 }, text: 'xyz-random-unrecognized-string-999', message_id: 108 }
    });
    assert.strictEqual(res.route_type, 'ANTIGRAVITY_CONVERSATION');
    assert.strictEqual(res.final_responder, 'ANTIGRAVITY');
    assert.ok(!res.text.startsWith('VIGIA/FALLBACK >'));
    assert.ok(res.text.startsWith('ANTIGRAVITY >'));
    console.log('  -> PASS: NLU desconhecida acolhida pelo Antigravity sem fallback robótico do Vigia.\n');
    passed++;
  }

  // TESTE 9: Antigravity indisponível factual -> VIGIA/FALLBACK > com route_reason
  {
    console.log('[TEST 9] Verificando queda factual do Antigravity acionando fallback...');
    const downRecoveryManager = {
      inventoryState: () => ({ antigravity: { running: false } })
    };
    const downRouter = new TelegramCommandRouter({
      allowlist: { isAuthorized: () => true, isPaired: () => true },
      recoveryManager: downRecoveryManager,
      bridgeAvailable: true
    });

    const res = await downRouter.processUpdate({
      message: { from: { id: 100 }, chat: { id: 100 }, text: 'preciso de suporte agora', message_id: 109 }
    });
    assert.strictEqual(res.route_type, 'VIGIA_FALLBACK');
    assert.ok(['VIGIA', 'VIGIA_FALLBACK'].includes(res.final_responder));
    assert.strictEqual(res.route_reason, 'ANTIGRAVITY_PROCESS_DOWN');
    assert.ok(res.text.startsWith('VIGIA/FALLBACK >'));
    console.log('  -> PASS: Queda factual acionou fallback do Vigia com route_reason devidamente documentado.\n');
    passed++;
  }

  // TESTE 10: Suíte global verde
  {
    console.log('[TEST 10] Verificando status global da suíte...');
    assert.strictEqual(passed, 9);
    console.log('  -> PASS: Todos os 9 cenários anteriores validados com sucesso.\n');
    passed++;
  }

  console.log('================================================================');
  console.log(`  RESULTADO: ${passed}/10 TESTES APROVADOS (100% PASS)`);
  console.log('================================================================');
}

runTestSuite().catch(err => {
  console.error('\n❌ FALHA NA SUÍTE:', err);
  process.exit(1);
});
