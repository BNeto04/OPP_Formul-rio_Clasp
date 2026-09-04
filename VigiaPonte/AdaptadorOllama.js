// VigiaPonte/AdaptadorOllama.js
// Adaptador leve com timeout estrito, circuit breaker e fallback fail-open para o Ollama local

const http = require('http');
const Config = require('./Config');
const { sanitizarTexto } = require('./SanitizadorSegredos');

// Estado local do Circuit Breaker
let consecutiveFailures = 0;
let circuitBreakerOpenUntil = 0;
const FAILURE_THRESHOLD = 3;
const CIRCUIT_BREAKER_COOLDOWN_MS = 60000; // 60 segundos

/**
 * Reseta o circuit breaker (usado em testes ou recuperação manual)
 */
function resetCircuitBreaker() {
  consecutiveFailures = 0;
  circuitBreakerOpenUntil = 0;
}

/**
 * Registra falha e potencialmente abre o circuit breaker
 */
function registrarFalha() {
  consecutiveFailures += 1;
  if (consecutiveFailures >= FAILURE_THRESHOLD) {
    circuitBreakerOpenUntil = Date.now() + CIRCUIT_BREAKER_COOLDOWN_MS;
  }
}

/**
 * Registra sucesso e reseta contadores de falha
 */
function registrarSucesso() {
  consecutiveFailures = 0;
  circuitBreakerOpenUntil = 0;
}

/**
 * Verifica se o circuit breaker está ativo
 */
function isCircuitBreakerOpen() {
  if (consecutiveFailures >= FAILURE_THRESHOLD) {
    if (Date.now() < circuitBreakerOpenUntil) {
      return true;
    }
    // Janela de cooldown expirou, tenta meia-abertura
    resetCircuitBreaker();
  }
  return false;
}

/**
 * Verifica a disponibilidade do serviço Ollama e modelos locais instalados
 * @param {Object} [customConfig]
 * @returns {Promise<Object>}
 */
function verificarDisponibilidade(customConfig = null) {
  const cfg = customConfig || Config;
  return new Promise((resolve) => {
    if (isCircuitBreakerOpen()) {
      return resolve({
        online: false,
        models: [],
        hasSelectedModel: false,
        selectedModel: cfg.OLLAMA_MODEL,
        circuitBreakerOpen: true,
        reason: 'Circuit breaker ativo devido a falhas consecutivas'
      });
    }

    let urlObj;
    try {
      urlObj = new URL(cfg.OLLAMA_HOST + '/api/tags');
    } catch (e) {
      return resolve({
        online: false,
        models: [],
        hasSelectedModel: false,
        selectedModel: cfg.OLLAMA_MODEL,
        circuitBreakerOpen: false,
        reason: 'URL do Ollama inválida: ' + e.message
      });
    }

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 11434,
      path: urlObj.pathname,
      method: 'GET',
      timeout: 2000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const models = Array.isArray(parsed.models) ? parsed.models.map(m => m.name || m.model || '') : [];
          const hasSelected = models.some(m => m === cfg.OLLAMA_MODEL || m.startsWith(cfg.OLLAMA_MODEL + ':') || cfg.OLLAMA_MODEL.startsWith(m));
          registrarSucesso();
          return resolve({
            online: true,
            models,
            hasSelectedModel: hasSelected,
            selectedModel: cfg.OLLAMA_MODEL,
            circuitBreakerOpen: false
          });
        } catch (err) {
          registrarFalha();
          return resolve({
            online: false,
            models: [],
            hasSelectedModel: false,
            selectedModel: cfg.OLLAMA_MODEL,
            circuitBreakerOpen: isCircuitBreakerOpen(),
            reason: 'Resposta do Ollama inválida: ' + err.message
          });
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      registrarFalha();
      resolve({
        online: false,
        models: [],
        hasSelectedModel: false,
        selectedModel: cfg.OLLAMA_MODEL,
        circuitBreakerOpen: isCircuitBreakerOpen(),
        reason: 'Timeout ao checar disponibilidade do Ollama'
      });
    });

    req.on('error', (err) => {
      registrarFalha();
      resolve({
        online: false,
        models: [],
        hasSelectedModel: false,
        selectedModel: cfg.OLLAMA_MODEL,
        circuitBreakerOpen: isCircuitBreakerOpen(),
        reason: 'Ollama offline ou inacessível: ' + err.message
      });
    });

    req.end();
  });
}

/**
 * Consulta o modelo leve Ollama para classificar semanticamente uma mensagem ambígua
 * @param {string} texto Mensagem a classificar
 * @returns {Promise<Object>} Resultado estruturado ou UNKNOWN_NEEDS_REPORT
 */
function classificarComOllama(texto) {
  return new Promise((resolve) => {
    if (isCircuitBreakerOpen()) {
      return resolve({
        sucesso: false,
        fonte: 'FALLBACK',
        tipo: 'UNKNOWN_NEEDS_REPORT',
        motivo: 'Circuit breaker ativo para chamadas ao modelo. Fail-open mantido.',
        ownerDecisionRequired: false
      });
    }

    const textoSanitizado = sanitizarTexto(texto);

    const prompt = `Voce e um classificador operacional de terminal.
Analise a mensagem abaixo e classifique estritamente em UMA das seguintes categorias:
- WAITING_INTERACTION (se o terminal estiver esperando confirmacao do usuario)
- PERMISSION_REQUIRED (se exigir permissao de seguranca, admin ou autorizacao)
- TRANSIENT_ERROR (se for erro transitorio de rede ou conexao)
- TIMEOUT_OR_STALL (se for timeout ou travamento)
- PROCESS_STOPPED (se processo morreu)
- INFO (se for apenas informativo)
- UNKNOWN_NEEDS_REPORT (qualquer outra situacao)

Responda APENAS um JSON no formato:
{"categoria": "CATEGORIA", "motivo": "explicacao curta", "decisao_proprietario": true|false}

Mensagem:
${textoSanitizado}`;

    const requestData = JSON.stringify({
      model: Config.OLLAMA_MODEL,
      prompt: prompt,
      stream: false,
      options: {
        num_ctx: 2048,
        temperature: 0.1
      }
    });

    let urlObj;
    try {
      urlObj = new URL(Config.OLLAMA_HOST + '/api/generate');
    } catch (e) {
      registrarFalha();
      return resolve({
        sucesso: false,
        fonte: 'FALLBACK',
        tipo: 'UNKNOWN_NEEDS_REPORT',
        motivo: 'URL do Ollama inválida (' + e.message + '). Fail-open mantido.',
        ownerDecisionRequired: false
      });
    }

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 11434,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestData)
      },
      timeout: Config.OLLAMA_TIMEOUT_MS
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          const responseText = parsed.response || '';
          
          // Extrair JSON da resposta
          const jsonMatch = responseText.match(/\{[\s\S]*?\}/);
          if (jsonMatch) {
            const data = JSON.parse(jsonMatch[0]);
            const catValida = ['WAITING_INTERACTION', 'PERMISSION_REQUIRED', 'TRANSIENT_ERROR', 'TIMEOUT_OR_STALL', 'PROCESS_STOPPED', 'INFO', 'UNKNOWN_NEEDS_REPORT'];
            const categoriaFinal = catValida.includes(data.categoria) ? data.categoria : 'UNKNOWN_NEEDS_REPORT';
            
            registrarSucesso();
            return resolve({
              sucesso: true,
              fonte: 'OLLAMA',
              tipo: categoriaFinal,
              motivo: data.motivo || 'Classificado pelo modelo ' + Config.OLLAMA_MODEL,
              ownerDecisionRequired: data.decisao_proprietario === true || categoriaFinal === 'PERMISSION_REQUIRED',
              respostaBruta: responseText.trim()
            });
          }
        } catch (e) {
          // Resposta com erro ou formato inválido
        }
        
        registrarFalha();
        resolve({
          sucesso: false,
          fonte: 'FALLBACK',
          tipo: 'UNKNOWN_NEEDS_REPORT',
          motivo: 'Resposta do modelo inválida ou não estruturada. Fail-open mantido.',
          ownerDecisionRequired: false
        });
      });
    });

    req.on('timeout', () => {
      req.destroy();
      registrarFalha();
      resolve({
        sucesso: false,
        fonte: 'FALLBACK',
        tipo: 'UNKNOWN_NEEDS_REPORT',
        motivo: 'Timeout de consulta ao Ollama (' + Config.OLLAMA_TIMEOUT_MS + 'ms excedido). Fail-open mantido.',
        ownerDecisionRequired: false
      });
    });

    req.on('error', (err) => {
      registrarFalha();
      resolve({
        sucesso: false,
        fonte: 'FALLBACK',
        tipo: 'UNKNOWN_NEEDS_REPORT',
        motivo: 'Ollama indisponível (' + err.message + '). Fail-open mantido.',
        ownerDecisionRequired: false
      });
    });

    req.write(requestData);
    req.end();
  });
}

/**
 * Interpreta intenção de mensagem com auxílio do modelo local em caso de ambiguidade
 * @param {string} texto Mensagem do usuário
 * @param {Object} [contexto] Contexto conversacional sanitizado
 * @returns {Promise<Object>} Intenção sugerida ou fallback
 */
function interpretarNLU(texto, contexto = null) {
  return new Promise((resolve) => {
    if (isCircuitBreakerOpen()) {
      return resolve({
        sucesso: false,
        fonte: 'FALLBACK',
        intent: 'UNKNOWN_OR_UNSUPPORTED',
        motivo: 'Circuit breaker ativo para interpretação de NLU.'
      });
    }

    const textoSanitizado = sanitizarTexto(texto);
    const subjectContext = contexto && contexto.subject ? `Assunto anterior: ${contexto.subject}` : 'Sem assunto anterior';

    const prompt = `Voce e o modulo de NLU do Vigia Sentinela.
Classifique a solicitacao do usuario em uma das seguintes intencoes autorizadas:
- ANTIGRAVITY_ACTIVITY_STATUS (como esta o antigravity, status)
- ANTIGRAVITY_CURRENT_TASK (o que esta fazendo, tarefa atual)
- ANTIGRAVITY_LAST_ACTION (o que fez antes, acao anterior)
- ANTIGRAVITY_LAST_ERROR (deu erro, incidentes)
- ANTIGRAVITY_DURATION_QUERY (ha quanto tempo, duracao)
- ANTIGRAVITY_OWNER_WAIT (esperando por mim, decisao minha)
- SYSTEM_HEALTH (saude da maquina, cpu, memoria, sistema)
- INTERNET_STATUS (status da internet, conexao)
- PROCESS_INVENTORY (processos ativos)
- FORGET_CONTEXT (esquecer contexto, limpar memoria)
- UNKNOWN_OR_UNSUPPORTED (outros assuntos)

${subjectContext}
Mensagem: "${textoSanitizado}"

Responda APENAS um JSON no formato:
{"intent": "INTENT_ESCOLHIDO", "confidence": "HIGH"|"LOW"}`;

    const requestData = JSON.stringify({
      model: Config.OLLAMA_MODEL,
      prompt: prompt,
      stream: false,
      options: {
        num_ctx: 1024,
        temperature: 0.1
      }
    });

    let urlObj;
    try {
      urlObj = new URL(Config.OLLAMA_HOST + '/api/generate');
    } catch (e) {
      registrarFalha();
      return resolve({
        sucesso: false,
        fonte: 'FALLBACK',
        intent: 'UNKNOWN_OR_UNSUPPORTED',
        motivo: 'URL inválida: ' + e.message
      });
    }

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 11434,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestData)
      },
      timeout: Config.OLLAMA_TIMEOUT_MS
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          const responseText = parsed.response || '';
          const match = responseText.match(/\{[\s\S]*?\}/);
          if (match) {
            const data = JSON.parse(match[0]);
            const allowedIntents = [
              'ANTIGRAVITY_ACTIVITY_STATUS', 'ANTIGRAVITY_CURRENT_TASK', 'ANTIGRAVITY_LAST_ACTION',
              'ANTIGRAVITY_LAST_ERROR', 'ANTIGRAVITY_DURATION_QUERY', 'ANTIGRAVITY_OWNER_WAIT',
              'SYSTEM_HEALTH', 'INTERNET_STATUS', 'PROCESS_INVENTORY', 'FORGET_CONTEXT',
              'UNKNOWN_OR_UNSUPPORTED'
            ];
            const finalIntent = allowedIntents.includes(data.intent) ? data.intent : 'UNKNOWN_OR_UNSUPPORTED';
            registrarSucesso();
            return resolve({
              sucesso: true,
              fonte: 'OLLAMA',
              intent: finalIntent,
              confidence: data.confidence || 'MEDIUM'
            });
          }
        } catch (e) {
          // Erro de parse
        }
        registrarFalha();
        resolve({
          sucesso: false,
          fonte: 'FALLBACK',
          intent: 'UNKNOWN_OR_UNSUPPORTED',
          motivo: 'Resposta inválida do modelo'
        });
      });
    });

    req.on('timeout', () => {
      req.destroy();
      registrarFalha();
      resolve({
        sucesso: false,
        fonte: 'FALLBACK',
        intent: 'UNKNOWN_OR_UNSUPPORTED',
        motivo: 'Timeout excedido'
      });
    });

    req.on('error', (err) => {
      registrarFalha();
      resolve({
        sucesso: false,
        fonte: 'FALLBACK',
        intent: 'UNKNOWN_OR_UNSUPPORTED',
        motivo: 'Ollama offline: ' + err.message
      });
    });

    req.write(requestData);
    req.end();
  });
}

module.exports = {
  classificarComOllama,
  verificarDisponibilidade,
  interpretarNLU,
  resetCircuitBreaker,
  isCircuitBreakerOpen
};
