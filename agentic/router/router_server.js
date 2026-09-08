/**
 * Syntheon Agentic Layer - Local Unified Router Server
 * Card: #71 T-A01-ROUTER-003
 *
 * RESTRIÇÕES E ARQUITETURA:
 * 1. Endpoint local: http://127.0.0.1:4000/v1
 * 2. Aliases estaveis: syntheon-worker, syntheon-fast, syntheon-reasoning
 * 3. Provedores ordenados: primary (Gemini) -> fallback_1 (Groq) -> fallback_2 (OpenRouter)
 * 4. Zero chamadas de rede em idle ou quando credenciais estao ausentes.
 * 5. Zero exposicao de secrets em logs ou respostas.
 * 6. Suporte a Mock Routing deterministico via header X-Syntheon-Mock-Routing para testes seguros.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '..', 'config', 'providers.json');
const LOG_DIR = path.join(__dirname, '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'router.log');
const PID_FILE = path.join(__dirname, '..', 'logs', 'router.pid');

const HOST = '127.0.0.1';
const PORT = 4000;

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function log(msg) {
  const ts = new Date().toISOString();
  const line = `[${ts}] [ROUTER] ${msg}`;
  console.log(line);
  try {
    fs.appendFileSync(LOG_FILE, line + '\n', 'utf8');
  } catch (e) {}
}

function loadConfig() {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf8').replace(/^\uFEFF/, '');
    return JSON.parse(raw);
  } catch (e) {
    log(`Erro ao carregar configuracao: ${e.message}`);
    return null;
  }
}

function getProviderCredentialsState(config) {
  const state = {};
  if (!config || !config.providers) return state;

  for (const [key, p] of Object.entries(config.providers)) {
    const envVar = p.api_key_env_var;
    const hasKey = envVar ? (Boolean(process.env[envVar]) && process.env[envVar].trim() !== '') : false;
    state[key] = {
      provider_id: p.provider_id,
      name: p.name,
      tier: p.tier,
      model: p.default_model,
      credential_present: hasKey,
      status: hasKey ? 'READY_CREDENTIAL_CONFIGURED' : (p.tier === 'local_diagnostic' ? 'UNAVAILABLE' : 'CONFIG_CONTRACT_READY_NO_CREDENTIAL')
    };
  }
  return state;
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Syntheon-Mock-Routing');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${HOST}:${PORT}`);

  // 1. GET /health ou GET /v1/health -> Diagnostico sem chamadas externas
  if (req.method === 'GET' && (url.pathname === '/health' || url.pathname === '/v1/health')) {
    const config = loadConfig();
    const providersState = getProviderCredentialsState(config);

    const hasAnyCloudCred = Object.values(providersState).some(p => p.credential_present);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      router: 'syntheon-local-router',
      version: '1.0.0',
      host: HOST,
      port: PORT,
      base_url: `http://${HOST}:${PORT}/v1`,
      aliases: ['syntheon-worker', 'syntheon-fast', 'syntheon-reasoning'],
      routing_policy: config ? config.routing_policy : {},
      has_active_cloud_credentials: hasAnyCloudCred,
      providers: providersState,
      idle_llm_calls: 0,
      idle_network_calls: 0
    }, null, 2));
    return;
  }

  // 2. GET /v1/models -> Lista de modelos/aliases OpenAI-compatible
  if (req.method === 'GET' && (url.pathname === '/models' || url.pathname === '/v1/models')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      object: 'list',
      data: [
        { id: 'syntheon-worker', object: 'model', created: 1725800000, owned_by: 'syntheon', permission: [] },
        { id: 'syntheon-fast', object: 'model', created: 1725800000, owned_by: 'syntheon', permission: [] },
        { id: 'syntheon-reasoning', object: 'model', created: 1725800000, owned_by: 'syntheon', permission: [] }
      ]
    }));
    return;
  }

  // 3. POST /v1/chat/completions -> Endpoint principal
  if (req.method === 'POST' && (url.pathname === '/chat/completions' || url.pathname === '/v1/chat/completions')) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const requestedModel = payload.model || 'syntheon-worker';
        const mockHeader = req.headers['x-syntheon-mock-routing'];

        log(`Requisicao de completion recebida para model/alias: ${requestedModel}`);

        // SUPORTE A MOCK ROUTING DETERMINISTICO (Para testes de integracao seguros sem gastar cotas)
        if (mockHeader) {
          if (mockHeader === 'simulate_primary_success') {
            log(`[MOCK_ROUTER] Simulado sucesso no provedor primario (gemini)`);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              id: 'mock-cmpl-' + Date.now(),
              object: 'chat.completion',
              created: Math.floor(Date.now() / 1000),
              model: 'gemini-3.6-flash',
              provider_used: 'gemini',
              routing_tier: 'primary',
              choices: [{
                index: 0,
                message: { role: 'assistant', content: 'Mock response from primary provider (gemini-3.6-flash)' },
                finish_reason: 'stop'
              }]
            }));
            return;
          } else if (mockHeader === 'simulate_fallback_1_success') {
            log(`[MOCK_ROUTER] Primario falhou (simulado); roteado com sucesso para fallback_1 (groq)`);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              id: 'mock-cmpl-' + Date.now(),
              object: 'chat.completion',
              created: Math.floor(Date.now() / 1000),
              model: 'qwen/qwen3.6-27b',
              provider_used: 'groq',
              routing_tier: 'fallback_1',
              choices: [{
                index: 0,
                message: { role: 'assistant', content: 'Mock response from fallback_1 (qwen/qwen3.6-27b)' },
                finish_reason: 'stop'
              }]
            }));
            return;
          }
        }

        // VERIFICAÇÃO REAL DE CREDENCIAIS
        const config = loadConfig();
        const providersState = getProviderCredentialsState(config);

        const routeOrder = ['gemini', 'groq', 'openrouter'];
        let selectedProvider = null;

        for (const provId of routeOrder) {
          if (providersState[provId] && providersState[provId].credential_present) {
            selectedProvider = config.providers[provId];
            break;
          }
        }

        // Se NENHUM provedor possuir credencial configurada:
        if (!selectedProvider) {
          log(`[NO_CREDENTIAL] Rejeicao segura: nenhuma chave de API configurada para [${routeOrder.join(', ')}]. Zero chamadas de rede efetuadas.`);
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: {
              message: 'Nenhum provedor configurado com credencial valida no ambiente. Configure GEMINI_API_KEY, GROQ_API_KEY ou OPENROUTER_API_KEY no arquivo .env local.',
              type: 'NO_PROVIDER_CREDENTIAL',
              code: 'no_credentials_available',
              providers_checked: routeOrder
            }
          }));
          return;
        }

        // Execucao com provider real sera implementada no card #72/#73
        res.writeHead(501, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: {
            message: `Provedor ${selectedProvider.name} possui credencial presente, mas o despacho real pertence ao Card #72/#73.`,
            type: 'PENDING_DISPATCH_IMPLEMENTATION'
          }
        }));
      } catch (err) {
        log(`Erro ao processar request: ${err.message}`);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: { message: err.message, type: 'INVALID_REQUEST' } }));
      }
    });
    return;
  }

  // Rota desconhecida
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: { message: 'Not found', type: 'NOT_FOUND' } }));
});

server.listen(PORT, HOST, () => {
  log(`Syntheon Local Router ativo em http://${HOST}:${PORT}`);
  try {
    fs.writeFileSync(PID_FILE, String(process.pid), 'utf8');
  } catch (e) {}
});

function gracefulShutdown() {
  log('Encerrando Syntheon Local Router...');
  server.close(() => {
    try {
      if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE);
    } catch (e) {}
    log('Syntheon Local Router finalizado com sucesso.');
    process.exit(0);
  });
}

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);