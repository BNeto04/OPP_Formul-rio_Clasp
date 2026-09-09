/**
 * Syntheon Agentic Layer - Worker Executor (Canteiro A02)
 * Card: #81 T-A02-WORKER-003
 *
 * Recebe task com escopo explicito (TASK_ID, arquivos permitidos/proibidos, contexto,
 * criterios), consome o router A01 (alias syntheon-worker), valida e aplica mudancas
 * APENAS dentro do workspace isolado e do allowlist. NAO executa commit/push/close.
 *
 * Saida estruturada (syntheon.worker_result.v1):
 *   task_id, status: SUCCESS|FAILED|BLOCKED, provider_used, model_used, fallback_used,
 *   fallback_reason, attempts, files_changed (manifest), error (quando houver).
 *
 * Modo offline/deterministico: input.mock_response (string) simula a saida do modelo,
 * usado pela suite de testes sem chamar o router.
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

const RESULT_SCHEMA = 'syntheon.worker_result.v1';
const ROUTER_URL = process.env.SYNTHEON_ROUTER_BASE_URL || 'http://127.0.0.1:4000';

const SECRET_FILE_PATTERNS = [/\.env$/i, /\.env\.[^/\\]+$/i, /\.token$/i, /\.secret$/i, /\.key$/i, /^config\//i, /telegram\.token$/i, /allowlist\.json$/i];

function isForbiddenPath(rel) {
  const n = path.normalize(rel).replace(/\\/g, '/');
  if (n.startsWith('../') || n.includes('/../') || path.isAbsolute(n)) return true;
  if (n === '.git' || n.startsWith('.git/')) return true;
  return SECRET_FILE_PATTERNS.some((re) => re.test(n));
}

function withinAllowed(rel, allowed, forbidden) {
  const n = path.normalize(rel).replace(/\\/g, '/');
  const okAllowed = allowed.length === 0 || allowed.some((a) => n === a || n.startsWith(a.replace(/\/+$/, '') + '/'));
  const okForbidden = !forbidden.some((f) => n === f || n.startsWith(f.replace(/\/+$/, '') + '/'));
  return okAllowed && okForbidden;
}

function callRouter(messages) {
  return new Promise((resolve) => {
    const url = new URL(ROUTER_URL.replace(/\/+$/, '') + '/v1/chat/completions');
    const payload = JSON.stringify({ model: 'syntheon-worker', messages, task_id: 'worker-call' });
    const req = http.request({ host: url.hostname, port: url.port || 80, path: url.pathname, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } },
      (res) => { let raw = ''; res.on('data', (c) => { raw += c; }); res.on('end', () => { let d = null; try { d = JSON.parse(raw); } catch (e) { d = null; } resolve({ status: res.statusCode, data: d }); }); });
    req.on('error', (e) => resolve({ status: 0, data: null, error: String(e.message) }));
    req.write(payload);
    req.end();
  });
}

function extractOps(content) {
  // Modelo responde com bloco JSON de operacoes. Extrai o primeiro objeto/array JSON.
  const start = content.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < content.length; i++) {
    if (content[i] === '{') depth++;
    else if (content[i] === '}') { depth--; if (depth === 0) { try { return JSON.parse(content.slice(start, i + 1)); } catch (e) { return null; } } }
  }
  return null;
}

/**
 * Executa a task do worker.
 * @param {object} input { task_id, workspace, allowed_files[], forbidden_files[],
 *   instruction, context, mock_response?, system_prompt? }
 */
async function execute(input) {
  const taskId = input.task_id || 'TASK_UNKNOWN';
  const workspace = path.resolve(input.workspace || '.');
  const allowed = (input.allowed_files || []).map((f) => path.normalize(f).replace(/\\/g, '/'));
  const forbidden = (input.forbidden_files || []).map((f) => path.normalize(f).replace(/\\/g, '/'));

  const result = {
    schema: RESULT_SCHEMA, task_id: taskId, status: 'FAILED', provider_used: null, model_used: null,
    fallback_used: null, fallback_reason: null, attempts: null, files_changed: [], error: null
  };

  const sysPrompt = 'Voce e o worker SYNTHEON. Responda EXCLUSIVAMENTE com um JSON contendo "ops": [ { "op": "write"|"edit", "file": "<caminho relativo dentro do allowlist>", "content": "<conteudo para write>", "search": "<trecho exato para edit>", "replace": "<substituto para edit>" } ]. Nenhum texto fora do JSON. Respeite o allowlist: arquivos proibidos nunca podem ser alvo.';
  const userPrompt = 'TASK_ID: ' + taskId + '\nARQUIVOS_PERMITIDOS:\n' + allowed.join('\n') + '\nARQUIVOS_PROIBIDOS:\n' + forbidden.join('\n') + '\nINSTRUCAO:\n' + input.instruction + '\nCONTEXTO:\n' + (input.context || '') + '\n\nResponda com o JSON de ops.';

  let routerResp = null;
  if (input.mock_response) {
    routerResp = { status: 200, data: { choices: [{ message: { content: input.mock_response } }], provider_used: 'mock', fallback_used: false } };
  } else {
    routerResp = await callRouter([{ role: 'system', content: sysPrompt }, { role: 'user', content: userPrompt }]);
    if (!routerResp.data) {
      result.status = 'FAILED'; result.error = 'ROUTER_UNAVAILABLE: ' + (routerResp.error || 'sem resposta');
      return result;
    }
    result.provider_used = routerResp.data.provider_used || null;
    result.model_used = routerResp.data.model || null;
    result.fallback_used = routerResp.data.fallback_used || false;
    result.fallback_reason = routerResp.data.fallback_reason || null;
    result.attempts = routerResp.data.attempts || null;
    if (routerResp.status !== 200) {
      result.status = 'BLOCKED';
      result.error = (routerResp.data.error && (routerResp.data.error.type || routerResp.data.error.message)) || 'ROUTER_ERROR_' + routerResp.status;
      return result;
    }
  }

  const content = routerResp.data.choices && routerResp.data.choices[0] && routerResp.data.choices[0].message
    ? String(routerResp.data.choices[0].message.content || '') : '';
  const parsed = extractOps(content);
  if (!parsed || !Array.isArray(parsed.ops) || parsed.ops.length === 0) {
    result.status = 'FAILED';
    result.error = 'INVALID_MODEL_OUTPUT: JSON de ops ausente ou malformado';
    return result;
  }

  for (const op of parsed.ops) {
    if (!op || !op.file || !op.op) {
      result.status = 'FAILED'; result.error = 'INVALID_MODEL_OUTPUT: op sem file/op'; return result;
    }
    if (op.op !== 'write' && op.op !== 'edit') {
      result.status = 'FAILED'; result.error = 'INVALID_MODEL_OUTPUT: op desconhecida (' + op.op + ')'; return result;
    }
    if (isForbiddenPath(op.file)) {
      result.status = 'BLOCKED'; result.error = 'FORBIDDEN_PATH_OR_TRAVERSAL: ' + op.file; return result;
    }
    if (!withinAllowed(op.file, allowed, forbidden)) {
      result.status = 'BLOCKED'; result.error = 'PATH_OUTSIDE_ALLOWLIST: ' + op.file; return result;
    }
    const abs = path.join(workspace, op.file);
    if (!abs.startsWith(workspace + path.sep) && abs !== workspace) {
      result.status = 'BLOCKED'; result.error = 'PATH_ESCAPES_WORKSPACE: ' + op.file; return result;
    }
    try {
      if (op.op === 'write') {
        fs.mkdirSync(path.dirname(abs), { recursive: true });
        fs.writeFileSync(abs, op.content === undefined ? '' : String(op.content), 'utf8');
        result.files_changed.push({ file: op.file, action: 'write', size: fs.statSync(abs).size });
      } else {
        if (!fs.existsSync(abs)) { result.status = 'FAILED'; result.error = 'PATCH_NO_MATCH: arquivo inexistente ' + op.file; return result; }
        const current = fs.readFileSync(abs, 'utf8');
        if (op.search === undefined || !current.includes(op.search)) {
          result.status = 'FAILED'; result.error = 'PATCH_NO_MATCH: trecho nao encontrado em ' + op.file; return result;
        }
        const next = current.split(op.search).join(op.replace === undefined ? '' : String(op.replace));
        fs.writeFileSync(abs, next, 'utf8');
        result.files_changed.push({ file: op.file, action: 'edit' });
      }
    } catch (e) {
      result.status = 'FAILED'; result.error = 'PATCH_APPLY_ERROR: ' + e.message; return result;
    }
  }

  result.status = 'SUCCESS';
  return result;
}

module.exports = { execute, isForbiddenPath, withinAllowed, extractOps, RESULT_SCHEMA };
