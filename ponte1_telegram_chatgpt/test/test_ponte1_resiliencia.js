'use strict';
/**
 * PROVA DE RESILIENCIA DA PONTE 1 (10/09/2026)
 *
 * Motivo: respostas do ChatGPT se perdiam quando o envio ao Telegram estourava o timeout
 * ("Erro ao processar /reply: TIMEOUT"). Correcoes provadas aqui:
 *   A) TelegramClient: retry com backoff para erros transitorios (DNS/timeout) + keep-alive.
 *   B) Ponte1Daemon: caixa de saida persistente (ponte1_outbox.json) - resposta que falha
 *      e reenviada nos ciclos seguintes, nunca mais descartada.
 *
 * Execucao: `node test/test_ponte1_resiliencia.js`
 * O teste e AUTO-SANDBOX: copia server/*.js para uma pasta temporaria e roda as provas ali,
 * para nao escrever em ponte1_outbox.json / ponte1_delivery_history.json reais.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

const ORIGEM = path.join(__dirname, '..', 'server');
const SANDBOX = fs.mkdtempSync(path.join(os.tmpdir(), 'ponte1_prova_'));
fs.mkdirSync(path.join(SANDBOX, 'server'), { recursive: true });
['ponte1_daemon.js', 'telegram_client.js'].forEach(f => {
  fs.copyFileSync(path.join(ORIGEM, f), path.join(SANDBOX, 'server', f));
});

const TelegramClient = require(path.join(SANDBOX, 'server', 'telegram_client.js'));
const Ponte1Daemon = require(path.join(SANDBOX, 'server', 'ponte1_daemon.js'));

let passou = 0, falhou = 0;
function check(nome, cond, extra) {
  if (cond) { passou++; console.log(`[PASS] ${nome}`); }
  else { falhou++; console.log(`[FAIL] ${nome}${extra ? ' -> ' + extra : ''}`); }
}

(async () => {
  // ---------- A) retry do cliente (erro transitorio de DNS) ----------
  const capturados = [];
  const logOriginal = console.log;
  console.log = (...a) => { capturados.push(a.join(' ')); logOriginal(...a); };
  const cliente = new TelegramClient('000:token-de-teste-invalido');
  cliente.baseUrl = 'https://host-que-nao-existe-hermes-test.invalid/bot000';
  const t0 = Date.now();
  let erroFinal = null;
  try { await cliente.sendMessage(123, 'teste'); } catch (e) { erroFinal = e; }
  console.log = logOriginal;

  const retries = capturados.filter(l => l.includes('Falha transitoria')).length;
  check('A1 retry: erro transitorio gera 2 retries antes de desistir', retries === 2, `retries=${retries}`);
  check('A2 retry: excecao final propagada apos esgotar as tentativas', erroFinal !== null);
  check('A3 retry: backoff respeitado (>= 5s nas 3 tentativas)', Date.now() - t0 >= 5000);

  // ---------- B) caixa de saida persistente ----------
  const daemon = new Ponte1Daemon();
  daemon.outbox = [];
  daemon.saveOutbox();
  let deveFalhar = true;
  daemon.client = {
    sendMessage: async () => {
      if (deveFalhar) throw new Error('TIMEOUT');
      return { ok: true, result: { message_id: 987654 } };
    }
  };
  daemon.authorizedChatId = 123;

  const replyKey = 'REPLY_TESTE_SANDBOX';
  try { await daemon.client.sendMessage(123, 'texto'); } catch (e) { daemon.enfileirarOutbox(replyKey, 999, 'texto da resposta', e.message); }

  check('B1 outbox: resposta que falhou foi enfileirada', daemon.outbox.length === 1);
  const arquivo = path.join(SANDBOX, 'server', 'ponte1_outbox.json');
  check('B2 outbox: persistida em disco', fs.existsSync(arquivo));
  const emDisco = JSON.parse(fs.readFileSync(arquivo, 'utf8'));
  check('B3 outbox: payload preservado integralmente', emDisco.pendentes[0].payload === 'texto da resposta');
  check('B4 outbox: erro registrado para auditoria', emDisco.pendentes[0].ultimo_erro === 'TIMEOUT');

  await daemon.flushOutbox();
  check('B5 outbox: nova falha mantem a resposta na fila e conta a tentativa', daemon.outbox.length === 1 && daemon.outbox[0].tentativas === 1);

  deveFalhar = false;
  await daemon.flushOutbox();
  check('B6 outbox: reenvio bem-sucedido esvazia a fila', daemon.outbox.length === 0);
  const hist = JSON.parse(fs.readFileSync(path.join(SANDBOX, 'server', 'ponte1_delivery_history.json'), 'utf8'));
  check('B7 outbox: entrega do reenvio registrada no historico de entregas', !!(hist[replyKey] && hist[replyKey].telegram_message_id === 987654));

  fs.rmSync(SANDBOX, { recursive: true, force: true });
  console.log(`\nRESULTADOS FINAIS: ${passou} PASS / ${falhou} FAIL`);
  process.exit(falhou ? 1 : 0);
})();
