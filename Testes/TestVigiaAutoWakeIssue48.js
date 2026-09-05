const assert = require('assert');
const http = require('http');
const { spawn } = require('child_process');

function httpPost(urlPath, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const req = http.request({
      hostname: '127.0.0.1',
      port: 8765,
      path: urlPath,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let d = '';
      res.on('data', chunk => d += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(d)); } catch (e) { resolve({ raw: d }); }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function launchWakeListener(timeoutSec = 10) {
  const scriptPath = 'C:\\\\Users\\\\Bneto04\\\\.gemini\\\\antigravity\\\\brain\\\\12c01fbc-a38a-4145-95b5-4cca16e100da\\\\scratch\\\\antigravity_wake_listener.py';
  const child = spawn('python', ['-u', scriptPath, String(timeoutSec)], { stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '';
  let errOutput = '';
  child.stdout.on('data', c => output += c.toString());
  child.stderr.on('data', c => errOutput += c.toString());

  const finishedPromise = new Promise((resolve) => {
    child.on('exit', (code) => {
      resolve({ code, output, errOutput });
    });
  });

  return { child, finishedPromise };
}

async function runAutoWakeTests() {
  console.log('================================================================');
  console.log('  SUÍTE DE TESTES: AUTOWAKE BRIDGE -> ANTIGRAVITY (Issue #48)');
  console.log('================================================================\n');

  // Drena qualquer wake pendente inicial
  {
    const drainer = launchWakeListener(1);
    await drainer.finishedPromise;
  }

  // TESTE 1: Semântica estrita de ACK de transporte (BRIDGE_RECEIVED) e entrega imediata
  {
    console.log('[TEST 1] Verificando se POST /outbound_packet responde BRIDGE_RECEIVED...');
    const pkt = {
      packet_id: 'OUTBOUND_TEST_SEMANTICS_001',
      sprint_id: 'SPRINT-PC-TRABALHO-SANEAMENTO-DONE-001',
      call_id: 'CALL-TEST-SEMANTICS-001',
      type: 'MESSAGE',
      payload: 'Teste de semântica estrita de ACK'
    };
    const res = await httpPost('/outbound_packet', pkt);
    assert.strictEqual(res.status, 'BRIDGE_RECEIVED', 'Deveria retornar BRIDGE_RECEIVED e não ANTIGRAVITY_WAKE_ACK');
    assert.strictEqual(res.bridge_ack, true);

    // O listener iniciado logo após consome imediatamente o pacote pendente
    const drainer = launchWakeListener(2);
    const drainRes = await drainer.finishedPromise;
    assert.strictEqual(drainRes.code, 0);
    assert.ok(drainRes.output.includes('CALL-TEST-SEMANTICS-001'));
    console.log('  -> PASS: Semântica estrita de transporte (BRIDGE_RECEIVED) e consumo imediato comprovados.\n');
  }

  // TESTE 2: Ciclo 1 LIVE - Listener aguarda e é acordado instantaneamente por envelope
  {
    console.log('[TEST 2] Ciclo 1 LIVE: Acordando listener em espera com envelope real...');
    const listener1 = launchWakeListener(15);

    // Aguarda 1 segundo para garantir que o listener conectou em /wait_wake
    await new Promise(r => setTimeout(r, 1000));

    const pkt1 = {
      packet_id: 'OUTBOUND_CYCLE_1',
      sprint_id: 'SPRINT-PC-TRABALHO-SANEAMENTO-DONE-001',
      call_id: 'CALL-AUTOWAKE-CYCLE-001',
      type: 'MESSAGE',
      payload: 'Gatilho do ciclo 1 de autowake'
    };

    const postRes = await httpPost('/outbound_packet', pkt1);
    assert.strictEqual(postRes.status, 'BRIDGE_RECEIVED');

    const result1 = await listener1.finishedPromise;
    assert.strictEqual(result1.code, 0, 'Listener deve encerrar com código 0 após acordar');
    assert.ok(result1.output.includes('[AUTOWAKE_TRIGGERED]'), 'Saída deve indicar AUTOWAKE_TRIGGERED');
    assert.ok(result1.output.includes('CALL-AUTOWAKE-CYCLE-001'), 'Saída deve conter o CALL ID correto');
    console.log('  -> PASS: Ciclo 1 completado com sucesso. Listener acordou reativamente sem intervenção humana.\n');
  }

  // TESTE 3: Ciclo 2 LIVE - Segundo listener aguarda e é acordado em seguida (2 ciclos consecutivos)
  {
    console.log('[TEST 3] Ciclo 2 LIVE: Segundo ciclo consecutivo sem intervenção humana...');
    const listener2 = launchWakeListener(15);

    await new Promise(r => setTimeout(r, 1000));

    const pkt2 = {
      packet_id: 'OUTBOUND_CYCLE_2',
      sprint_id: 'SPRINT-PC-TRABALHO-SANEAMENTO-DONE-001',
      call_id: 'CALL-AUTOWAKE-CYCLE-002',
      type: 'MESSAGE',
      payload: 'Gatilho do ciclo 2 de autowake consecutivo'
    };

    const postRes2 = await httpPost('/outbound_packet', pkt2);
    assert.strictEqual(postRes2.status, 'BRIDGE_RECEIVED');

    const result2 = await listener2.finishedPromise;
    assert.strictEqual(result2.code, 0, 'Listener do ciclo 2 deve encerrar com código 0');
    assert.ok(result2.output.includes('[AUTOWAKE_TRIGGERED]'));
    assert.ok(result2.output.includes('CALL-AUTOWAKE-CYCLE-002'));
    console.log('  -> PASS: Ciclo 2 completado com sucesso. 2 ciclos consecutivos provados factualmente.\n');
  }

  // TESTE 4: Timeout controlado quando nenhum envelope chega
  {
    console.log('[TEST 4] Testando timeout gracioso do listener quando nenhum pacote chega...');
    const listener3 = launchWakeListener(2);
    const result3 = await listener3.finishedPromise;
    assert.strictEqual(result3.code, 0);
    assert.ok(result3.output.includes('[AUTOWAKE_TIMEOUT]'));
    console.log('  -> PASS: Timeout gracioso sem erro ou travamento.\n');
  }

  console.log('================================================================');
  console.log('  RESULTADO: 4/4 TESTES DE AUTOWAKE APROVADOS (100% PASS)');
  console.log('================================================================');
}

runAutoWakeTests().catch(err => {
  console.error('FALHA NOS TESTES DE AUTOWAKE:', err);
  process.exit(1);
});
