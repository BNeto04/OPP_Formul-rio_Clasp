// VigiaPonte/VigiaLogger.js
// Logger append-only estruturado no formato REPORT oficial do Vigia da Ponte

const fs = require('fs');
const Config = require('./Config');
const { sanitizarTexto } = require('./SanitizadorSegredos');

let contadorEventos = 0;

function gerarReportFormatado(dados) {
  contadorEventos++;
  const eventId = `EVT-${Date.now()}-${String(contadorEventos).padStart(4, '0')}`;
  const obsSanitizada = sanitizarTexto(dados.observacao || '');

  const report = [
    `EVENT_ID: ${eventId}`,
    `TIMESTAMP: ${new Date().toISOString()}`,
    `SOURCE: ${dados.fonte || 'LOCAL_MONITOR'}`,
    `TASK_ID_IF_KNOWN: ${dados.taskId || 'BRIDGE-OBSERVATION'}`,
    `EVENT_TYPE: ${dados.tipo || 'UNKNOWN_NEEDS_REPORT'}`,
    `OBSERVATION: ${obsSanitizada}`,
    `INTENT_CLASSIFICATION_SOURCE: ${dados.classificacaoFonte || 'RULE'}`,
    `ACTION_TAKEN: ${dados.acaoTomada || 'LOG_ONLY'}`,
    `WHY: ${dados.motivo || 'Observação de evento operacional'}`,
    `SAFE_AUTOMATIC_ACTION: ${dados.acaoSegura || 'NONE'}`,
    `OWNER_DECISION_REQUIRED: ${dados.ownerDecision === true ? 'true' : 'false'}`,
    `EVIDENCE: ${dados.evidencia || 'Event captured by Vigia da Ponte'}`,
    `COOLDOWN_STATE: ${dados.cooldownEstado || 'ACTIVE'}`,
    '---'
  ].join('\n');

  try {
    fs.appendFileSync(Config.LOG_PATH, report + '\n', 'utf8');
  } catch (e) {
    console.error('Falha ao gravar log do Vigia:', e.message);
  }

  return { eventId, report };
}

module.exports = {
  gerarReportFormatado: gerarReportFormatado
};
