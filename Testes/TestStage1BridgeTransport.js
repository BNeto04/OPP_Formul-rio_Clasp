const assert = require('assert');
const path = require('path');
const fs = require('fs');

const projectRoot = path.resolve(__dirname, '..');
const Stage1BridgeTransport = require(path.join(projectRoot, 'VigiaPonte', 'Stage1BridgeTransport'));
const ContextHub = require(path.join(projectRoot, 'VigiaPonte', 'ContextHub'));

console.log('=== TESTES DE UNIDADE: ETAPA 1 TRANSPORTE DIRETO TELEGRAM <-> CHATGPT ===\n');

async function main() {
  const testStorage = path.join(__dirname, 'temp_context_hub_stage1.json');
  if (fs.existsSync(testStorage)) fs.unlinkSync(testStorage);

  const contextHub = new ContextHub({ storagePath: testStorage });
  const queuedBridge = [];
  const sentTelegram = [];

  const mockClient = {
    sendMessage: async (chatId, text, parseMode, replyToMessageId) => {
      sentTelegram.push({ chatId, text, replyTo: replyToMessageId, id: 1000 + sentTelegram.length });
      return { ok: true, result: { message_id: 1000 + sentTelegram.length } };
    }
  };

  const mockAllowlist = {
    getAuthorizedUser: () => ({ authorized_chat_id: 6857459665 })
  };

  const transport = new Stage1BridgeTransport({
    contextHub,
    allowlist: mockAllowlist,
    telegramClient: mockClient
  });

  transport.queueBridgePacket = async (p) => {
    queuedBridge.push(p);
    return { queued: true };
  };

  // Teste 1: Ingestão Telegram -> Fila Bridge para ChatGPT
  console.log('Teste 1: Ingestão Telegram -> Fila Bridge para ChatGPT...');
  await transport.processTelegramUpdate({
    update_id: 9901,
    message: {
      message_id: 701,
      chat: { id: 6857459665 },
      from: { first_name: 'Manoel' },
      text: 'Olá ChatGPT pelo Telegram!'
    }
  });

  assert.strictEqual(queuedBridge.length, 1);
  assert.strictEqual(queuedBridge[0].type, 'OWNER_MESSAGE');
  assert.ok(queuedBridge[0].payload.includes('Olá ChatGPT pelo Telegram!'));
  console.log('  [PASS] Teste 1 OK.');

  // Teste 2: Dedupe de mensagem do Telegram
  console.log('Teste 2: Dedupe de mensagem idêntica do Telegram...');
  await transport.processTelegramUpdate({
    update_id: 9902,
    message: {
      message_id: 701,
      chat: { id: 6857459665 },
      from: { first_name: 'Manoel' },
      text: 'Olá ChatGPT pelo Telegram!'
    }
  });
  assert.strictEqual(queuedBridge.length, 1); // Não aumentou
  console.log('  [PASS] Teste 2 OK.');

  // Teste 3: Outbound do ChatGPT -> Entrega direta ao Telegram
  console.log('Teste 3: Outbound do ChatGPT -> Entrega direta ao Telegram...');
  await transport.processChatGPTOutbound({
    call_id: 'CALL-GPT-REPLY-701',
    payload: 'Olá Manoel! Resposta direta do ChatGPT recebida via ponte local.'
  });

  assert.strictEqual(sentTelegram.length, 1);
  assert.strictEqual(sentTelegram[0].replyTo, 701);
  assert.ok(sentTelegram[0].text.startsWith('CHATGPT > '));
  assert.ok(sentTelegram[0].text.includes('Resposta direta do ChatGPT'));
  console.log('  [PASS] Teste 3 OK (reply_to=701 confirmado).');

  // Teste 4: Dedupe de resposta do ChatGPT
  console.log('Teste 4: Dedupe de resposta do ChatGPT...');
  await transport.processChatGPTOutbound({
    call_id: 'CALL-GPT-REPLY-701',
    payload: 'Olá Manoel! Resposta direta do ChatGPT recebida via ponte local.'
  });
  assert.strictEqual(sentTelegram.length, 1); // Não aumentou
  console.log('  [PASS] Teste 4 OK.');

  // Limpeza
  if (fs.existsSync(testStorage)) fs.unlinkSync(testStorage);
  console.log('\n=== TODOS OS TESTES DA ETAPA 1 APROVADOS (4/4 PASS)! ===\n');
}

main().catch(err => {
  console.error('Falha:', err);
  process.exit(1);
});
