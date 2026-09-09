/**
 * Syntheon Agentic Layer - Testes do Dispatcher (Card #82)
 * Fixtures em temp dir; modo offline (sem gh, sem chamadas reais; worker com mock_response).
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { dispatch } = require('./dispatch_issue');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) { console.log('  [PASS] ' + message); passed++; }
  else { console.error('  [FAIL] ' + message); failed++; }
}

function mkTmp(p) { return fs.mkdtempSync(path.join(os.tmpdir(), p)); }

const CARD_A = `# EX-A-001
- TASK_ID: EX-A-001
- PARENT: nenhum
- PRIORIDADE: P2
- BRANCH: sprint/h01-colmeia-api-001
- OWNER_DECISION_REQUIRED: NAO
- CLASP_REQUIRED_RULE: CLASP_REQUIRED=false
- RESULT_SCHEMA: syntheon.result.v1
## ENDERECO_DOWN_PLANT
agentic/state/
## ARQUIVOS_ALVO
- agentic/state/exemplo_a.txt
## ARQUIVOS_PROIBIDOS
- .env*
## OBJETIVO
Criar exemplo_a.txt com EXEMPLO_A_OK.
## CONTEXTO_MINIMO
Nenhum.
## CONTRATOS_IMPORTS
- agentic/contracts/a02_canteiro_authority.md
## PASSO_A_PASSO
1. Criar o arquivo.
2. Escrever EXEMPLO_A_OK.
## CRITERIOS_DE_ACEITE
- [ ] arquivo existe com conteudo correto
## TESTES_OBRIGATORIOS
node agentic/scripts/test_exemplo_a.js
## EFEITOS_COLATERAIS_PERMITIDOS
- nenhum
## ESTADO_INICIAL
BACKLOG
`;

const CARD_B_OWNER = CARD_A.replace('EX-A-001', 'EX-B-OWNER').replace('- OWNER_DECISION_REQUIRED: NAO', '- OWNER_DECISION_REQUIRED: SIM').replace('agentic/state/exemplo_a.txt', 'agentic/state/exemplo_b.txt');
const CARD_INCOMPLETO = CARD_A.replace(/## CRITERIOS_DE_ACEITE[\s\S]*?## TESTES_OBRIGATORIOS/, '## TESTES_OBRIGATORIOS');
const CARD_OFFBRANCH = CARD_A.replace('- BRANCH: sprint/h01-colmeia-api-001', '- BRANCH: outra-branch');

function writeCard(tmp, name, content) {
  const f = path.join(tmp, name);
  fs.writeFileSync(f, content, 'utf8');
  return f;
}

const MOCK = '{"ops":[{"op":"write","file":"agentic/state/exemplo_a.txt","content":"EXEMPLO_A_OK"}]}';

console.log('================================================================');
console.log('  TEST SUITE: DISPATCHER (Card #82)');
console.log('================================================================');

async function main() {
  // 1. Card valido -> despacho completo, estados registrados, ISSUE nunca fechada
  {
    const tmp = mkTmp('syn-dispatch-1-');
    try {
      const f = writeCard(tmp, 'ok.md', CARD_A);
      const r = await dispatch({ issueFile: f, mockWorker: MOCK, stateDir: path.join(tmp, 'state'), workspace: path.join(tmp, 'ws') });
      assert(r.status === 'RESULT_PENDING_AUDIT', 'card valido: status RESULT_PENDING_AUDIT');
      assert(r.schema_valid === true, 'card valido: schema OK');
      const states = r.transitions.map((t) => t.state);
      assert(states.join('>') === 'DISPATCHED>EXECUTING>TESTING>RESULT_PENDING_AUDIT', 'transicoes corretas: ' + states.join('>'));
      assert(r.closed === false, 'dispatcher NUNCA fecha a Issue');
      assert(r.worker && r.worker.status === 'SUCCESS' && r.worker.files_changed.length === 1, 'worker executou e produziu manifest');
      assert(fs.existsSync(path.join(tmp, 'ws', 'agentic', 'state', 'exemplo_a.txt')), 'arquivo criado no workspace isolado');
    } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  }

  // 2. Card incompleto -> REJECTED schema
  {
    const tmp = mkTmp('syn-dispatch-2-');
    try {
      const f = writeCard(tmp, 'incompleto.md', CARD_INCOMPLETO);
      const r = await dispatch({ issueFile: f, mockWorker: MOCK, stateDir: path.join(tmp, 'state') });
      assert(r.status === 'REJECTED' && r.reason === 'SCHEMA_INCOMPLETO', 'card incompleto: REJECTED SCHEMA_INCOMPLETO');
      assert(r.schema_missing.includes('CRITERIOS_DE_ACEITE'), 'card incompleto: missing aponta CRITERIOS_DE_ACEITE');
    } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  }

  // 3. Card de outra branch -> REJECTED
  {
    const tmp = mkTmp('syn-dispatch-3-');
    try {
      const f = writeCard(tmp, 'off.md', CARD_OFFBRANCH);
      const r = await dispatch({ issueFile: f, mockWorker: MOCK, stateDir: path.join(tmp, 'state') });
      assert(r.status === 'REJECTED' && r.reason === 'FORA_DA_BRANCH_ATIVA', 'branch errada: REJECTED FORA_DA_BRANCH_ATIVA');
    } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  }

  // 4. OWNER_DECISION_REQUIRED sem aprovacao -> BLOCKED; com aprovacao -> executa
  {
    const tmp = mkTmp('syn-dispatch-4-');
    try {
      const f = writeCard(tmp, 'owner.md', CARD_B_OWNER);
      const r1 = await dispatch({ issueFile: f, mockWorker: MOCK, stateDir: path.join(tmp, 'state1') });
      assert(r1.status === 'BLOCKED' && r1.reason === 'OWNER_DECISION_REQUIRED', 'OWNER_DECISION sem aprovacao: BLOCKED');
      const MOCK_B = '{"ops":[{"op":"write","file":"agentic/state/exemplo_b.txt","content":"X"}]}';
      const r2 = await dispatch({ issueFile: f, mockWorker: MOCK_B, stateDir: path.join(tmp, 'state2'), ownerApproved: true });
      assert(r2.status === 'RESULT_PENDING_AUDIT', 'OWNER_DECISION com aprovacao do proprietario: executa');
    } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  }

  // 5. Idempotencia: mesmo TASK_ID 2x -> REPLAY_SKIPPED (1 unica execucao)
  {
    const tmp = mkTmp('syn-dispatch-5-');
    try {
      const f = writeCard(tmp, 'idem.md', CARD_A);
      const sd = path.join(tmp, 'state');
      const r1 = await dispatch({ issueFile: f, mockWorker: MOCK, stateDir: sd, workspace: path.join(tmp, 'ws1') });
      const r2 = await dispatch({ issueFile: f, mockWorker: MOCK, stateDir: sd, workspace: path.join(tmp, 'ws2') });
      assert(r1.status === 'RESULT_PENDING_AUDIT', 'idempotencia: 1a execucao normal');
      assert(r2.status === 'REPLAY_SKIPPED', 'idempotencia: 2a chamada REPLAY_SKIPPED (sem duplicacao)');
    } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  }

  console.log('\n================================================================');
  console.log('  RESULTADO: ' + passed + ' PASS / ' + failed + ' FAIL');
  console.log('================================================================');
  process.exit(failed === 0 ? 0 : 1);
}

main();
