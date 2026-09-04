/**
 * NaturalLanguageRouter.js - Roteador de Linguagem Natural Segura (pt-BR)
 * 
 * Camadas e Responsabilidades:
 * 1. Sanitização Prévia na Ingestão (SanitizadorSegredos)
 * 2. Normalização pt-BR Centralizada (InputNormalizer)
 * 3. Classificação Semântica Leve de Intenções (IntentClassifier)
 * 4. Preservação de Contexto de Sessão (Follow-up com pronomes como "e o que ele fez depois?")
 * 5. Consulta Factual e Resposta Formatada (AntigravityObserver + ResponseFormatter)
 * 6. Sanitização de Saída Estrita antes do envio ao Telegram
 */

const InputNormalizer = require('./InputNormalizer');
const SanitizadorSegredos = require('./SanitizadorSegredos');
const AntigravityObserver = require('./AntigravityObserver');
const ResponseFormatter = require('./ResponseFormatter');

class NaturalLanguageRouter {
  constructor(options = {}) {
    this.healthMonitor = options.healthMonitor;
    this.recoveryManager = options.recoveryManager;
    this.internetMonitor = options.internetMonitor;
    this.journal = options.journal;
    this.ollamaAdapter = options.ollamaAdapter || null;
    this.antigravityObserver = options.antigravityObserver || new AntigravityObserver({
      recoveryManager: this.recoveryManager
    });
    this.userSessions = new Map();
    this.contextTtlMs = options.contextTtlMs || 300000; // 5 minutos
  }

  getContext(userId) {
    if (!userId) return null;
    const session = this.userSessions.get(userId);
    if (!session) return null;
    if (Date.now() - session.timestamp > this.contextTtlMs) {
      this.userSessions.delete(userId);
      return null;
    }
    return session;
  }

  setContext(userId, data) {
    if (!userId) return;
    this.userSessions.set(userId, {
      ...data,
      timestamp: Date.now()
    });
  }

  classifyIntent(normalizedText, userId = null) {
    const tokens = InputNormalizer.tokenize(normalizedText);
    const hasAntigravity = InputNormalizer.hasAntigravityMention(normalizedText);
    const hasPronoun = InputNormalizer.hasPronounReference(normalizedText);
    const lastContext = this.getContext(userId);

    // Follow-up contextual com pronome (ex: "e o que ele fez depois?")
    const isAntigravitySubject = hasAntigravity || (hasPronoun && lastContext && lastContext.subject === 'ANTIGRAVITY');

    // 1. Ação de despertar / focar Antigravity
    if (isAntigravitySubject && /(acorde|acordar|abra|abrir|inicie|iniciar)/i.test(normalizedText)) {
      return 'WAKE_ANTIGRAVITY_REQUEST';
    }

    // 2. Erros ou incidentes
    if (isAntigravitySubject && /(erro|falha|problema|incidente|quebrou|travou)/i.test(normalizedText)) {
      return 'ANTIGRAVITY_LAST_ERROR';
    }

    // 3. O que fez por último / histórico recente
    if (isAntigravitySubject && /(ultimo|ultimamente|fez por ultimo|passado|concluiu|entregou)/i.test(normalizedText)) {
      return 'ANTIGRAVITY_LAST_ACTION';
    }

    // 4. Decisão do proprietário / aprovação pendente
    if (
      (isAntigravitySubject || /(esperando|decisao|minha|proprietario)/i.test(normalizedText)) &&
      /(esperando|decisao|aprova|pendente|precisa de mim|esperando por mim|aguardando)/i.test(normalizedText)
    ) {
      return 'ANTIGRAVITY_OWNER_WAIT';
    }

    // 5. Qual tarefa / issue atual
    if (isAntigravitySubject && /(tarefa|issue|fazendo|trabalhando|executando|mexendo)/i.test(normalizedText)) {
      return 'ANTIGRAVITY_CURRENT_TASK';
    }

    // 6. Status / Atividade geral do Antigravity
    if (
      isAntigravitySubject &&
      (
        /(como esta|status|atividade|situacao|vivo|ativo|aberto|rodando|funcionando|ver)/i.test(normalizedText) ||
        tokens.length <= 4 // Frases curtas contendo antigravity (ex: "ver o antigravity", "antigravity")
      )
    ) {
      return 'ANTIGRAVITY_ACTIVITY_STATUS';
    }

    // 7. Saúde da Máquina
    if (/(saude|cpu|ram|memoria|temperatura|disco|uptime|computador|maquina|sistema)/i.test(normalizedText)) {
      return 'SYSTEM_HEALTH';
    }

    // 8. Conectividade Internet
    if (/(internet|conexao|conectividade|online|offline|rede|wifi)/i.test(normalizedText)) {
      return 'INTERNET_STATUS';
    }

    // 9. Processos Inventariados
    if (/(processo|processos|servico|servicos|daemon)/i.test(normalizedText)) {
      return 'PROCESS_INVENTORY';
    }

    // 10. Último Erro do Sistema Geral
    if (/(ultimo erro|qual o erro|teve erro|houve erro)/i.test(normalizedText)) {
      return 'LAST_ERROR';
    }

    // 11. Ajuda
    if (/(ajuda|help|socorro|como uso|o que voce faz)/i.test(normalizedText)) {
      return 'HELP_REQUEST';
    }

    return 'UNKNOWN_OR_UNSUPPORTED';
  }

  async process(rawText, userId = null) {
    // 1. Sanitização na ingestão
    const sanitizedInput = SanitizadorSegredos.sanitizarTexto(rawText || '');

    // 2. Normalização pt-BR centralizada
    const normalized = InputNormalizer.normalize(sanitizedInput);

    // 3. Classificação Semântica da Intenção
    const intent = this.classifyIntent(normalized, userId);

    let replyText = '';
    let subject = null;
    let metadata = {
      intent,
      input_normalized: normalized,
      confidence: 'HIGH'
    };

    switch (intent) {
      case 'ANTIGRAVITY_ACTIVITY_STATUS':
      case 'ANTIGRAVITY_CURRENT_TASK': {
        const isDetailed = /detalhe|completo|auditoria/i.test(normalized);
        const snapshot = await this.antigravityObserver.inspect(isDetailed);
        replyText = snapshot.summary;
        subject = 'ANTIGRAVITY';
        metadata.observer_payload = snapshot;
        break;
      }

      case 'ANTIGRAVITY_LAST_ACTION': {
        const snapshot = await this.antigravityObserver.inspect();
        subject = 'ANTIGRAVITY';
        if (snapshot.last_action_summary) {
          replyText = `A última ação registrada do Antigravity foi na Issue #${snapshot.current_issue_number} (${snapshot.current_task_id}): "${snapshot.last_action_summary}".`;
        } else {
          replyText = snapshot.summary;
        }
        break;
      }

      case 'ANTIGRAVITY_LAST_ERROR': {
        const snapshot = await this.antigravityObserver.inspect();
        subject = 'ANTIGRAVITY';
        if (snapshot.last_result_or_error) {
          replyText = `Última nota ou incidente do Antigravity: ${snapshot.last_result_or_error}`;
        } else {
          replyText = `Nenhum erro reportado na tarefa ativa (${snapshot.current_task_id || 'sem tarefa'}).`;
        }
        break;
      }

      case 'ANTIGRAVITY_OWNER_WAIT': {
        const snapshot = await this.antigravityObserver.inspect();
        subject = 'ANTIGRAVITY';
        if (snapshot.owner_decision_required) {
          replyText = `Sim. O Antigravity está aguardando sua decisão na Issue #${snapshot.current_issue_number} (${snapshot.current_task_id}).`;
        } else {
          replyText = 'Não há nenhuma decisão sua pendente no momento. O Antigravity segue operando normalmente.';
        }
        break;
      }

      case 'WAKE_ANTIGRAVITY_REQUEST': {
        subject = 'ANTIGRAVITY';
        if (!this.recoveryManager) {
          replyText = 'Gerenciador de recuperação não disponível no host.';
          break;
        }
        const res = this.recoveryManager.restoreComponent('antigravity');
        if (res.action === 'NO_OP') {
          replyText = 'O Antigravity já está ativo e em execução no host. Nenhuma ação foi necessária.';
        } else if (res.action === 'STARTED_PROCESS') {
          replyText = `Antigravity foi iniciado com sucesso (PID: ${res.pid}).`;
        } else {
          replyText = `Não foi possível acionar o Antigravity: ${res.result || res.reason}`;
        }
        break;
      }

      case 'SYSTEM_HEALTH': {
        subject = 'SYSTEM';
        const m = this.healthMonitor ? this.healthMonitor.collectMetrics() : null;
        if (!m) {
          replyText = 'Telemetria do sistema indisponível.';
        } else {
          const usedMb = Math.round(m.system.used_memory_bytes / 1024 / 1024);
          const totalMb = Math.round(m.system.total_memory_bytes / 1024 / 1024);
          replyText = `A máquina está operando com CPU a ${m.system.cpu_count} núcleos, memória em ${m.system.memory_usage_percent}% (${usedMb}MB de ${totalMb}MB) e Vigia consumindo ${Math.round(m.vigia_process.rss_bytes / 1024 / 1024)}MB.`;
        }
        break;
      }

      case 'INTERNET_STATUS': {
        subject = 'NETWORK';
        const net = this.internetMonitor;
        const state = net ? net.state : 'UNKNOWN';
        replyText = state === 'UP' ? 'A conexão com a Internet está ativa e estável.' : 'A conexão com a Internet está offline no host.';
        break;
      }

      case 'PROCESS_INVENTORY': {
        subject = 'SYSTEM';
        const inv = this.recoveryManager ? this.recoveryManager.inventoryState() : {};
        const procs = Object.values(inv).map(p => `${p.name}: ${p.running ? 'ativo' : 'parado'}`).join(', ');
        replyText = `Estado dos processos: ${procs || 'Nenhum processo inventariado'}.`;
        break;
      }

      case 'LAST_ERROR': {
        const entries = this.journal ? this.journal.readEntries(10) : [];
        const errors = entries.filter(e => (e.action && e.action.includes('ERROR')) || e.owner_decision_required);
        const last = errors.length > 0 ? errors[errors.length - 1] : null;
        if (!last) {
          replyText = 'Nenhum erro recente registrado no histórico do Vigia.';
        } else {
          replyText = `Último evento registrado (${last.timestamp}): ${last.action} - ${last.result || last.reason}`;
        }
        break;
      }

      case 'HELP_REQUEST': {
        replyText = 'Você pode falar comigo naturalmente sobre a saúde da máquina, internet, processos ou sobre o Antigravity (ex: "como está o antigravity?", "o que ele está fazendo?", "tem algo esperando por mim?").';
        break;
      }

      default: {
        replyText = 'Não compreendi sua solicitação. Pergunte sobre a saúde do computador, conectividade, processos ou a atividade do Antigravity.';
        metadata.confidence = 'LOW';
        break;
      }
    }

    // Salva o contexto para follow-ups na mesma sessão
    if (userId && subject) {
      this.setContext(userId, { subject, lastIntent: intent });
    }

    // 4. Dupla Sanitização: Garante que nenhuma chave, token ou dado sensível saia na resposta
    const sanitizedResponse = SanitizadorSegredos.sanitizarTexto(replyText);

    return {
      text: sanitizedResponse,
      metadata
    };
  }
}

module.exports = NaturalLanguageRouter;
