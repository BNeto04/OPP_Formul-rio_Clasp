// VigiaPonte/ClassificadorRegras.js
// Motor determinístico prioritário de classificação de eventos e mensagens locais

const REGRAS_DETERMINISTICAS = [
  // 1. Prompts interativos de espera por confirmação
  {
    tipo: 'WAITING_INTERACTION',
    padroes: [
      /Continue\?\s*\[y\/N\]/i,
      /\(y\/n\)/i,
      /Press enter to continue/i,
      /Pressione qualquer tecla/i,
      /Deseja continuar\?/i,
      /Are you sure\?/i
    ],
    ownerDecision: false,
    acaoSegura: 'NOTIFY_AND_FOCUS',
    motivo: 'Prompt interativo aguardando confirmação simples do operador.'
  },

  // 2. Permissão de segurança ou ação sensível
  {
    tipo: 'PERMISSION_REQUIRED',
    padroes: [
      /Permission required/i,
      /Permiss[aã]o necess[aá]ria/i,
      /Allow\s+(?:once|always)?/i,
      /Grant access/i,
      /Acesso negado/i,
      /Requires elevation/i,
      /Run as administrator/i,
      /UAC/i
    ],
    ownerDecision: true,
    acaoSegura: 'ALERT_OWNER_DECISION',
    motivo: 'Evento requer autorização explícita do proprietário (ação sensível/administrativa).'
  },

  // 3. Timeout ou estagnação operacional
  {
    tipo: 'TIMEOUT_OR_STALL',
    padroes: [
      /ETIMEDOUT/i,
      /Connection timed out/i,
      /Timeout awaiting response/i,
      /Tempo limite excedido/i,
      /No progress detected within threshold/i,
      /Operation timed out/i
    ],
    ownerDecision: false,
    acaoSegura: 'REPORT_AND_LOG',
    motivo: 'Tempo limite ou ausência de progresso observável sem ação destrutiva.'
  },

  // 4. Erros transitórios de rede/API
  {
    tipo: 'TRANSIENT_ERROR',
    padroes: [
      /ECONNREFUSED/i,
      /ECONNRESET/i,
      /socket hang up/i,
      /429 Too Many Requests/i,
      /Rate limit exceeded/i,
      /503 Service Unavailable/i,
      /502 Bad Gateway/i
    ],
    ownerDecision: false,
    acaoSegura: 'REPORT_AND_LOG',
    motivo: 'Falha transitória de conectividade ou taxa de requisições.'
  },

  // 5. Processo esperado encerrado ou abortado
  {
    tipo: 'PROCESS_STOPPED',
    padroes: [
      /Process exited with code/i,
      /Processo finalizado/i,
      /Terminated by signal/i,
      /Killed/i,
      /Command failed with exit code/i
    ],
    ownerDecision: false,
    acaoSegura: 'REPORT_AND_LOG',
    motivo: 'Encerramento factual de processo local observado.'
  }
];

function classificarPorRegras(texto) {
  if (!texto || typeof texto !== 'string') return null;

  for (let i = 0; i < REGRAS_DETERMINISTICAS.length; i++) {
    const regra = REGRAS_DETERMINISTICAS[i];
    for (let j = 0; j < regra.padroes.length; j++) {
      if (regra.padroes[j].test(texto)) {
        return {
          classificado: true,
          fonte: 'RULE',
          tipo: regra.tipo,
          ownerDecisionRequired: regra.ownerDecision,
          acaoSegura: regra.acaoSegura,
          motivo: regra.motivo,
          padraoIdentificado: regra.padroes[j].toString()
        };
      }
    }
  }

  return null; // Não identificado deterministamente -> aciona fallback Ollama ou UNKNOWN
}

module.exports = {
  classificarPorRegras: classificarPorRegras
};
