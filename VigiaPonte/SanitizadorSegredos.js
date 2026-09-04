// VigiaPonte/SanitizadorSegredos.js
// Higienização estrita de segredos, tokens e credenciais antes de logs ou LLM

const PADROES_SECRETOS = [
  /ghp_[a-zA-Z0-9]{36,255}/g,                     // GitHub Personal Access Token
  /github_pat_[a-zA-Z0-9_]{36,255}/g,              // GitHub Fine-grained PAT
  /Bearer\s+[a-zA-Z0-9_\-\.]+/gi,               // Authorization Bearer token
  /Basic\s+[a-zA-Z0-9_\-\.\=]+/gi,             // Authorization Basic header
  /["']?(?:password|senha|secret|token|api[_-]?key)["']?\s*[:=]\s*["']?([^"'\s,]+)["']?/gi // Pares chave-valor de segredo
];

function sanitizarTexto(texto) {
  if (!texto || typeof texto !== 'string') return '';
  let limpo = texto;

  // Substituir tokens GitHub
  limpo = limpo.replace(/ghp_[a-zA-Z0-9]{20,}/g, '[REDACTED_GH_TOKEN]');
  limpo = limpo.replace(/github_pat_[a-zA-Z0-9_]{20,}/g, '[REDACTED_GH_PAT]');
  
  // Substituir cabeçalhos Authorization
  limpo = limpo.replace(/Bearer\s+[a-zA-Z0-9_\-\.]+/gi, 'Bearer [REDACTED_BEARER]');
  limpo = limpo.replace(/Basic\s+[a-zA-Z0-9_\-\.\=]+/gi, 'Basic [REDACTED_BASIC]');

  // Substituir chaves literais
  limpo = limpo.replace(/(?:password|senha|secret|token|api[_-]?key)\s*[:=]\s*["']?([a-zA-Z0-9_\-\.]+)["']?/gi, function(match, secretVal) {
    return match.replace(secretVal, '[REDACTED_SECRET]');
  });

  return limpo;
}

module.exports = {
  sanitizarTexto: sanitizarTexto
};
