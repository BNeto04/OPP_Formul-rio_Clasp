/**
 * Syntheon Agentic Layer - Testes do circuito canteiro (Card #86)
 * Dry-run Telegram (sem rede) + verificacao de autoridade (worker nao fala com Telegram).
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const cc = require('./canteiro_circuit');

let passed = 0;
let failed = 0;
function assert(condition, message) {
  if (condition) { console.log('  [PASS] ' + message); passed++; }
  else { console.error('  [FAIL] ' + message); failed++; }
}

async function main() {
  console.log('================================================================');
  console.log('  TEST SUITE: CIRCUITO CANTEIRO (Card #86)');
  console.log('================================================================');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'syn-cc-'));

  // 1. Envelope CALL com Issue/TASK_ID/CALL_ID
  {
    const call = cc.buildCall({ issueRef: 85, taskId: 'T85-001', callId: 'CALL-85-001', instruction: 'x' });
    assert(call.envelope === 'CALL' && call.call_id === 'CALL-85-001' && call.issue_ref === 85 && call.task_id === 'T85-001', 'CALL carrega Issue/TASK_ID/CALL_ID');
    const res = cc.buildResult({ call, status: 'SUCCESS', provider_used: 'deepseek', files_changed: ['mod.js'], commit_sha: 'abc' });
    assert(res.envelope === 'RESULT' && res.call_id === call.call_id && res.status === 'SUCCESS' && res.commit_sha === 'abc', 'RESULT estruturado ligado ao CALL');
  }

  // 2. Dedup/replay por CALL_ID: 1a registra, 2a REPLAY
  {
    const sd = path.join(tmp, 'dedupe');
    const a = cc.dedupe('CALL-85-001', sd);
    const b = cc.dedupe('CALL-85-001', sd);
    assert(a.replay === false && b.replay === true, 'dedup: 1a executa, replay detectado na 2a (sem duplicacao)');
    const c = cc.dedupe('CALL-85-002', sd);
    assert(c.replay === false, 'dedup: CALL_ID diferente nao e replay');
  }

  // 3. Telegram dry-run: payload correto, nada enviado
  {
    const r = cc.notifyTelegram('[CANTEIRO] prova circuito', { dryRun: true, chatId: '6857459665' });
    assert(r.ok === true && r.dry_run === true && r.text.includes('[CANTEIRO]'), 'telegram dry-run: payload montado sem envio');
  }

  // 4. Autoridade: worker NAO fala com Telegram (fonte do worker sem referencia a telegram/api.telegram)
  {
    const workerSrc = fs.readFileSync('C:/Users/Bneto04/Documents/Codex/syntheon-gs-downplant-offline/agentic/workers/syntheon_worker.js', 'utf8');
    assert(!/api\.telegram\.org|sendMessage|notifyTelegram/i.test(workerSrc), 'worker sem codigo de comunicacao Telegram (so lista telegram.token como PROIBIDO)');
    const notifySrc = fs.readFileSync('C:/Users/Bneto04/Documents/Codex/syntheon-gs-downplant-offline/agentic/scripts/canteiro_circuit.js', 'utf8');
    assert(/notifyTelegram/.test(notifySrc), 'notify existe SOMENTE no modulo do circuito (Mestre de Obras/dispatcher)');
  }

  fs.rmSync(tmp, { recursive: true, force: true });

  console.log('\n================================================================');
  console.log('  RESULTADO: ' + passed + ' PASS / ' + failed + ' FAIL');
  console.log('================================================================');
  process.exit(failed === 0 ? 0 : 1);
}

main();
