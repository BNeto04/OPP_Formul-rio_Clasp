/**
 * ResponseFormatter.js - Formatador de Respostas em Português Natural (pt-BR)
 */

const SanitizadorSegredos = require('./SanitizadorSegredos');

class ResponseFormatter {
  static formatAntigravityStatus(inspection, detailed = false) {
    if (!inspection) {
      return 'Não foi possível inspecionar o estado do Antigravity no momento.';
    }

    const {
      antigravity_process_running,
      current_task_id,
      current_issue_number,
      current_card_status,
      is_ambiguous,
      ambiguous_issues,
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

    const activityQualifier = freshness === 'STALE' ? 'A última atividade conhecida foi registrada' : 'A última atividade foi registrada';
    const taskLabel = current_task_id ? `(${current_task_id})` : `(Issue #${current_issue_number})`;

    if (response_mode === 'DEGRADED') {
      text = antigravity_process_running ?
        'O processo Antigravity está aberto e em execução no host, mas o GitHub está indisponível para consulta remota de tarefas. Nenhuma falha local foi detectada no monitoramento.' :
        'O processo Antigravity está fechado no momento. A API do GitHub está indisponível para sincronização.';
    } else if (is_ambiguous) {
      text = `Ambiguidade detectada no Kanban: múltiplas tarefas constam simultaneamente como IN_PROGRESS (Issues: ${ambiguous_issues.join(', ')}). O Vigia não assume tarefa sem correlação única.`;
    } else if (execution_phase === 'WAITING_OWNER') {
      text = `O Antigravity está aguardando uma decisão sua na Issue #${current_issue_number} ${taskLabel}.`;
    } else if (execution_phase === 'IN_PROGRESS') {
      text = `O Antigravity está trabalhando ativamente na Issue #${current_issue_number} ${taskLabel}. O card está IN_PROGRESS no Kanban. ${activityQualifier} ${timePhrase}. Não há decisão sua pendente.`;
    } else if (execution_phase === 'REVIEW') {
      text = `O Antigravity concluiu a execução da Issue #${current_issue_number} ${taskLabel}. O card está em REVIEW, aguardando auditoria.`;
    } else if (execution_phase === 'PROCESS_RUNNING_TASK_UNKNOWN' || execution_phase === 'IDLE') {
      if (current_issue_number && freshness === 'STALE') {
        text = `O Antigravity está aberto, mas não há tarefa em execução ativa no momento. A última atividade conhecida foi na Issue #${current_issue_number} ${taskLabel} ${timePhrase}.`;
      } else {
        text = 'O processo Antigravity está aberto e em execução no computador, mas não há nenhuma tarefa ou Issue ativa em andamento no momento (IDLE).';
      }
    } else if (execution_phase === 'DIVERGENT') {
      text = `Estado divergente detectado: A Issue #${current_issue_number} consta como IN_PROGRESS no GitHub, porém o processo Antigravity não está em execução no host local.`;
    } else if (execution_phase === 'STOPPED') {
      if (current_issue_number && current_card_status === 'REVIEW') {
        text = `A Issue #${current_issue_number} ${taskLabel} foi concluída e está em REVIEW, aguardando auditoria. O processo Antigravity está em repouso no momento.`;
      } else {
        text = 'O Antigravity está fechado (parado) no momento. Nenhuma tarefa está em execução.';
      }
    } else {
      text = 'Não há dados conclusivos suficientes sobre a atividade atual do Antigravity.';
    }

    if (last_result_or_error) {
      text += ` Nota: ${last_result_or_error}`;
    }

    if (detailed) {
      text += `\n\n[Detalhes de Auditoria]\n• Confiança: ${confidence}\n• Modo: ${response_mode}\n• Freshness: ${freshness}\n• Fonte: ${source_of_truth_used}`;
    }

    return SanitizadorSegredos.sanitizarTexto(text);
  }
}

module.exports = ResponseFormatter;
