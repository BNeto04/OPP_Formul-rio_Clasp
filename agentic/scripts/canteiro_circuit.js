/**
 * Syntheon Agentic Layer - Circuito Canteiro: envelopes CALL/RESULT, dedup e
 * retorno Telegram via Ponte 1 (Canteiro A02)
 * Card: #86 T-A02-BRIDGES-008
 *
 * Regras do circuito:
 * - CALL carrega Issue/TASK_ID + CALL_ID unico; RESULT devolve estruturado;
 * - dedup/replay por CALL_ID/TASK_ID (nunca duplica execucao);
 * - retorno ao proprietario via Telegram E OBRIGATORIO e usa SOMENTE o bot da
 *   Ponte 1 (token do arquivo gitignored da ponte1); worker NAO fala com Telegram
 *   como autoridade (notify e chamado pelo Mestre de Obras/dispatcher, nunca pelo worker).
 * - elos indisponiveis sao registrados NOT_EXERCISED/BLOCKED factualmente, nunca simulados.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const https = require('https');

const SCHEMA = 'syntheon.canteiro_circuit.v1';

function stateDirFor(dir) {
  const d = path.resolve(dir || path.join(os.tmpdir(), 'syntheon_circuit'));
  fs.mkdirSync(d, { recursive: true });
  return d;
}
function markerFile(dir, key) {
  return path.join(dir, key.replace(/[^A-Za-z0-9_-]/g, '_') + '.json');
}

/** Dedup/replay: retorna {replay:boolean, first_at?} e marca a chave na primeira vez. */
function dedupe(key, stateDir) {
  const dir = stateDirFor(stateDir);
  const f = markerFile(dir, key);
  if (fs.existsSync(f)) {
    let first = null;
    try { first = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { /* noop */ }
    return { replay: true, first_at: first ? first.at : null };
  }
  fs.writeFileSync(f, JSON.stringify({ key, at: new Date().toISOString() }, null, 2), 'utf8');
  return { replay: false };
}

/** Envelope tipado minimo de CALL (ChatGPT -> Gravity/worker). */
function buildCall({ issueRef, taskId, callId, instruction, context }) {
  if (!callId || !taskId) throw new Error('CALL exige callId e taskId unicos');
  return {
    envelope: 'CALL',
    call_id: callId,
    task_id: taskId,
    issue_ref: issueRef || null,
    instruction: instruction || null,
    context: context || null,
    created_at: new Date().toISOString()
  };
}

/** Envelope tipado de RESULT (worker/Gravity -> ChatGPT). */
function buildResult({ call, status, provider_used, fallback_used, fallback_reason, attempts, files_changed, commit_sha, evidence }) {
  return {
    envelope: 'RESULT',
    call_id: call.call_id,
    task_id: call.task_id,
    issue_ref: call.issue_ref,
    status: status || 'FAILED',
    provider_used: provider_used || null,
    fallback_used: fallback_used || false,
    fallback_reason: fallback_reason || null,
    attempts: attempts || null,
    files_changed: files_changed || [],
    commit_sha: commit_sha || null,
    evidence: evidence || null,
    created_at: new Date().toISOString()
  };
}

/** Token do bot da Ponte 1 (arquivo gitignored). Nunca logar o valor. */
function telegramToken() {
  const p = process.env.TELEGRAM_TOKEN_FILE || 'C:/Users/Bneto04/Documents/Codex/syntheon-gs-downplant-offline/ponte1_telegram_chatgpt/config/telegram.token';
  try { return fs.readFileSync(p, 'utf8').trim(); }
  catch (e) { return null; }
}

/**
 * Envia mensagem Telegram via API do bot da Ponte 1.
 * TELEGRAM_DRY_RUN=1 => nao envia (testes). sender injetavel para testes.
 * Retorna {ok, telegram_message_id?}
 */
function notifyTelegram(text, opts = {}) {
  const chatId = opts.chatId || process.env.TELEGRAM_AUTHORIZED_CHAT || '6857459665';
  if (process.env.TELEGRAM_DRY_RUN === '1' || opts.dryRun) {
    return { ok: true, dry_run: true, chat_id: chatId, text };
  }
  if (opts.sender) return opts.sender({ chat_id: chatId, text });
  const token = opts.token || telegramToken();
  if (!token) return { ok: false, error: 'TOKEN_INDISPONIVEL' };
  return new Promise((resolve) => {
    const payload = JSON.stringify({ chat_id: chatId, text });
    const req = https.request({
      hostname: 'api.telegram.org',
      path: '/bot' + token + '/sendMessage',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    }, (res) => {
      let raw = '';
      res.on('data', (c) => { raw += c; });
      res.on('end', () => {
        try {
          const d = JSON.parse(raw);
          resolve(d.ok ? { ok: true, telegram_message_id: d.result.message_id } : { ok: false, error: 'TELEGRAM_API: ' + (d.description || 'erro') });
        } catch (e) { resolve({ ok: false, error: 'PARSE' }); }
      });
    });
    req.on('error', (e) => resolve({ ok: false, error: String(e.message) }));
    req.write(payload);
    req.end();
  });
}

module.exports = { SCHEMA, dedupe, buildCall, buildResult, notifyTelegram };
