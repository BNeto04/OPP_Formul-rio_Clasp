/**
 * ResponseFormatter.js - Formatador de Respostas em Português Natural (pt-BR)
 * 
 * Produz mensagens claras, concisas, sem inferências ou falsos positivos.
 * Qualifica a idade dos dados (CURRENT vs STALE) e provê modo detalhes opcional.
 */

const SanitizadorSegredos = require('./SanitizadorSegredos');

class ResponseFormatter {
  /**
   * Formata a resposta da inspeção do Antigravity
   * @param {object} inspection - payload retornado pelo AntigravityObserver.inspect()
   * @param {boolean} detailed - se true, inclui metadados sanitizados
   * @returns {string}
   */
  static formatAntigravityStatus(inspection, detailed = false) {
    if (!inspection) {
      return 'Não foi possível inspecionar o estado do Antigravity no momento.';
    }

    const {
      antigravity_process_running,
      current_task_id,
      current_issue_number,
      current_card_status,
      execution_phase,
      last_activity_timestamp,
      freshness,
      age_minutes,
      owner_decision_required,
      last_result_or_error,
      response_mode,
      source_of_truth_used,
      confidence
    } = inspection;

    let text = '';
    const timePhrase = age_minutes !== null ? 
      (age_minutes < 2 ? 'há instantes' : `há ${age_minutes} minutos`) : '';

    // Qualificador de idade: se for STALE, qualifica como "última atividade conhecida"
    const activityQualifier = freshness === 'STALE' ? 'A última atividade conhecida foi registrada' : 'A última atividade foi registrada';

    if (response_mode === 'DEGRADED') {
      text = antigravity_process_running ?
        'O processo Antigravity está aberto e em execução no host, mas o GitHub está indisponível para consulta remota de tarefas. Nenhuma falha local foi detectada no monitoramento.' :
        'O processo Antigravity está fechado no momento. A API do GitHub está indisponível para sincronização.';
    } else if (execution_phase === 'WAITING_OWNER') {
      text = `O Antigravity está aguardando uma decisão sua na Issue #${current_issue_number} (${current_task_id}).`;
    } else if (execution_phase === 'IN_PROGRESS') {
      text = `O Antigravity está trabalhando ativamente na Issue #${current_issue_number} (${current_task_id}). O card está IN_PROGRESS no Kanban. ${activityQualifier} ${timePhrase}. Não há decisão sua pendente.`;
    } else if (execution_phase === 'REVIEW') {
      text = `O Antigravity concluiu a execução da Issue #${current_issue_number} (${current_task_id}). O card está em REVIEW, aguardando auditoria.`;
    } else if (execution_phase === 'PROCESS_RUNNING_TASK_UNKNOWN' || execution_phase === 'IDLE') {
      text = 'O processo Antigravity está aberto e em execução no computador, mas não há nenhuma tarefa ou Issue ativa em andamento no momento (IDLE).';
    } else if (execution_phase === 'DIVERGENT') {
      text = `Estado divergente detectado: A Issue #${current_issue_number} consta como IN_PROGRESS no GitHub, porém o processo Antigravity não está em execução no host local.`;
    } else if (execution_phase === 'STOPPED') {
      if (current_issue_number && current_card_status === 'REVIEW') {
        text = `A Issue #${current_issue_number} (${current_task_id}) foi concluída e está em REVIEW, aguardando auditoria. O processo Antigravity está em repouso no momento.`;
      } else {
        text = 'O Antigravity está fechado (parado) no momento. Nenhuma tarefa está em execução.';
      }
    } else {
      text = 'Não há dados conclusivos suficientes sobre a atividade atual do Antigravity.';
    }

    if (last_result_or_error) {
      text += ` Nota: ${last_result_or_error}`;
    }

    // Modo detalhado opcional (apenas metadados sanitizados)
    if (detailed) {
      text += `\n\n[Detalhes de Auditoria]\n• Confiança: ${confidence}\n• Modo: ${response_mode}\n• Freshness: ${freshness}\n• Fonte: ${source_of_truth_used}`;
    }

    return SanitizadorSegredos.sanitizarTexto(text);
  }
}

module.exports = ResponseFormatter;
