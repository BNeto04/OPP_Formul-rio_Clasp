// VigiaPonte/AdaptadorOllama.js
// Adaptador leve com timeout estrito e fallback fail-open para o Ollama local

const http = require('http');
const Config = require('./Config');
const { sanitizarTexto } = require('./SanitizadorSegredos');

/**
 * Consulta o modelo leve Ollama para classificar semanticamente uma mensagem ambígua
 * @param {string} texto Mensagem a classificar
 * @returns {Promise<Object>} Resultado estruturado ou UNKNOWN_NEEDS_REPORT
 */
function classificarComOllama(texto) {
  return new Promise((resolve) => {
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

    const urlObj = new URL(Config.OLLAMA_HOST + '/api/generate');
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
        
        // Fallback elegante
        resolve({
          sucesso: false,
          fonte: 'FALLBACK',
          tipo: 'UNKNOWN_NEEDS_REPORT',
          motivo: 'Resposta do modelo inválida ou não estruturada.',
          ownerDecisionRequired: false
        });
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        sucesso: false,
        fonte: 'FALLBACK',
        tipo: 'UNKNOWN_NEEDS_REPORT',
        motivo: 'Timeout de consulta ao Ollama (' + Config.OLLAMA_TIMEOUT_MS + 'ms excedido). Fail-open mantido.',
        ownerDecisionRequired: false
      });
    });

    req.on('error', (err) => {
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

module.exports = {
  classificarComOllama: classificarComOllama
};
