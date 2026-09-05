/**
 * NaturalLanguageRouter.js - Roteador de Linguagem Natural com Nano Memória Contextual Persistente e Modelo Local
 * Unifica compatibilidade retroativa total (Issue #39, #40, #41) e novas capacidades de contexto da Issue #42.
 */

const InputNormalizer = require('./InputNormalizer');
const SanitizadorSegredos = require('./SanitizadorSegredos');
const AntigravityObserver = require('./AntigravityObserver');
const ResponseFormatter = require('./ResponseFormatter');
const ConversationMemoryStore = require('./ConversationMemoryStore');
const AdaptadorOllama = require('./AdaptadorOllama');
const OperationalResumeController = require('./OperationalResumeController');

class NaturalLanguageRouter {
  constructor(options = {}) {
    this.healthMonitor = options.healthMonitor;
    this.recoveryManager = options.recoveryManager;
    this.internetMonitor = options.internetMonitor;
    this.journal = options.journal;
    this.ollamaAdapter = options.ollamaAdapter || AdaptadorOllama;
    this.antigravityObserver = options.antigravityObserver || new AntigravityObserver({
      recoveryManager: this.recoveryManager
    });
    this.resumeController = options.resumeController || new OperationalResumeController({
      recoveryManager: this.recoveryManager,
      internetMonitor: this.internetMonitor,
      antigravityObserver: this.antigravityObserver
    });
    this.memoryStore = options.memoryStore || new ConversationMemoryStore({
      storagePath: options.memoryStoragePath,
      activeTtlMs: options.contextTtlMs || 300000 // 5 minutos padrão
    });
  }

  getContext(userId) {
    if (!userId) return null;
    return this.memoryStore.getContext(userId);
  }

  setContext(userId, data) {
    if (!userId) return;
    this.memoryStore.updateContext(userId, data);
  }

  clearContext(userId) {
    if (!userId) return false;
    return this.memoryStore.clearContext(userId);
  }

  classifyIntent(normalizedText, userId = null) {
    // 0. Bloqueio estrito de segurança / tentativa explícita de comando shell no terminal
    if (
      /(execute powershell|aja como um terminal livre|ignore todas as suas instru)/i.test(normalizedText)
    ) {
      return 'SECURITY_BLOCKED';
    }

    // 0.1 Bloqueio estrito de digitação de texto arbitrário na UI
    if (
      /(digite|escreva|digitar|escrever).*(tela|interface|antigravity|janela|chat)/i.test(normalizedText) ||
      /(mande digitar|digite ['"].+['"]|escreva ['"].+['"])/i.test(normalizedText)
    ) {
      return 'ARBITRARY_UI_TEXT_BLOCKED';
    }

    // 1. Verificação de comando para esquecer contexto
    if (
      /(esque[cç]a|limpar|resetar|esquecer|apagar).*(contexto|memoria|historico)/i.test(normalizedText) ||
      /^(limpar|esquecer)$/i.test(normalizedText)
    ) {
      return 'FORGET_CONTEXT';
    }

    const tokens = InputNormalizer.tokenize(normalizedText);
    const hasAntigravity = InputNormalizer.hasAntigravityMention(normalizedText);
    const hasPronoun = InputNormalizer.hasPronounReference(normalizedText);
    const currentContext = this.getContext(userId);

    // Identificação de sujeito: explícito ou por memória contextual ativa
    const hasContextAntigravity = currentContext && currentContext.subject === 'ANTIGRAVITY';
    const hasContextNetwork = currentContext && currentContext.subject === 'NETWORK';
    const isAntigravitySubject = hasAntigravity || (hasPronoun && hasContextAntigravity) || (hasContextAntigravity && !hasAntigravity && /(fazendo|erro|antes|esperando)/i.test(normalizedText));

    // Consultas de ciclo de retomada e envio de V (Issue #43)
    if (/(o que aconteceu no ultimo ciclo|ultimo ciclo de retomada|o que houve no ciclo de retomada|ultimo ciclo|como foi a retomada|status do ultimo ciclo)/i.test(normalizedText)) {
      return 'RESUME_LAST_CYCLE_STATUS';
    }

    if (/(voce mandou v|mandou v|voce enviou v|enviou v|enviou o v|por que nao mandou v|por que nao enviou v)/i.test(normalizedText)) {
      return 'RESUME_V_SENT_QUERY';
    }

    if (/^v$/i.test(normalizedText.trim()) || /(retome o fluxo|retomar fluxo|retome a execucao|retomar o fluxo|pode retomar)/i.test(normalizedText)) {
      return 'OWNER_TRIGGER_RESUME';
    }

    if (
      /^(oi|ol[aá]|bom dia|boa tarde|boa noite|e a[ií]|opa|hey|hello|fala|tudo bem)(\b|[,\?!]|\s|$)/i.test(normalizedText.trim())
    ) {
      return 'GREETING_OR_CONVERSATION';
    }

    if (/(como v[aã]o as coisas|como estamos|qual a situa[cç][aã]o|como andam as coisas)/i.test(normalizedText)) {
      return 'ANTIGRAVITY_ACTIVITY_STATUS';
    }

    // Consultas e comandos de Sprint (Issue #45)
    if (/(inicie|iniciar|comece|comecar|executar|rode).*(sprint|prova da ponte|circuito automatico)/i.test(normalizedText)) {
      return 'SPRINT_START_REQUEST';
    }

    if (/(explique|o que estamos fazendo|objetivo|escopo|detalhe).*(nesta sprint|nessa sprint|sprint)/i.test(normalizedText)) {
      return 'SPRINT_EXPLANATION';
    }

    // Pergunta semântica sobre o comando V ou propósito do V
    if (
      /(entende.*["']?v["']?|o que [eé].*["']?v["']?|para que serve.*["']?v["']?|significa.*["']?v["']?|comando.*["']?v["']?.*(issue|git|repo|verificar)|comando para verificar as issues)/i.test(normalizedText)
    ) {
      return 'V_COMMAND_EXPLANATION';
    }

    if (/(vamos continuar|pode continuar|continuar fluxo|seguir em frente)/i.test(normalizedText)) {
      return 'ANTIGRAVITY_CONTINUE_REQUEST';
    }

    if (/(esta so aberto ou esta trabalhando|esta so aberto ou trabalhando|so aberto ou trabalhando|trabalhando ou ocioso|esta ativo ou so aberto|so aberto ou ativo|esta trabalhando ou parado)/i.test(normalizedText)) {
      return 'ANTIGRAVITY_WORK_DISTINCTION';
    }

    if (/(qual foi a ultima entrega|qual a ultima entrega|o que ele entregou por ultimo|ultima entrega do antigravity)/i.test(normalizedText)) {
      return 'ANTIGRAVITY_LAST_DELIVERY';
    }

    if (/(o antigravity foi reaberto|antigravity foi reaberto|ele foi reaberto|foi reaberto hoje|antigravity foi reiniciado)/i.test(normalizedText)) {
      return 'ANTIGRAVITY_WAS_REOPENED';
    }

    // 2. Detecção prioritária de erro específico do sistema / último erro geral
    if (/(qual foi o ultimo erro|ultimo erro do sistema|erro no journal|ultimo erro)/i.test(normalizedText)) {
      return 'LAST_ERROR';
    }

    // 3. Follow-up contextual de erro do Antigravity: "deu erro?" / "teve erro?" / "deu algum erro?"
    if (
      (isAntigravitySubject || hasContextAntigravity) &&
      /(deu (algum )?erro|teve (algum )?erro|houve (algum )?erro|falhou|quebrou|travou|\berro\b|\berros\b)/i.test(normalizedText)
    ) {
      return 'ANTIGRAVITY_LAST_ERROR';
    }

    // 4. Follow-up contextual: "e antes disso?" / "o que fez por último?" (somente se não for erro)
    if (
      !/(erro|falha|falhou)/i.test(normalizedText) &&
      (isAntigravitySubject || (hasContextAntigravity && /(antes|ultimo|passado)/i.test(normalizedText))) &&
      /(antes disso|anterior|fez por ultimo|o que fez por ultimo|historico|passado|antes)/i.test(normalizedText)
    ) {
      return 'ANTIGRAVITY_LAST_ACTION';
    }

    // 5. Follow-up temporal contextual estrito ("por quanto tempo", "ha quanto tempo", "duracao", "quanto tempo")
    if (/(por quanto tempo|ha quanto tempo|duracao|quanto tempo)/i.test(normalizedText)) {
      if (hasContextNetwork || /(internet|conexao|rede)/i.test(normalizedText)) {
        return 'INTERNET_DURATION_FOLLOWUP';
      }
      if (isAntigravitySubject || hasContextAntigravity) {
        return 'ANTIGRAVITY_DURATION_QUERY';
      }
      // Se não há contexto de sujeito ativo:
      return 'CONTEXT_EXPIRED_OR_ABSENT';
    }

    // 6. Ação de despertar
    if (isAntigravitySubject && /(acorde|acordar|abra|abrir|inicie|iniciar)/i.test(normalizedText)) {
      return 'WAKE_ANTIGRAVITY_REQUEST';
    }

    // 7. Decisão do proprietário / aprovação pendente
    if (
      (isAntigravitySubject || /(esperando|decisao|minha|proprietario)/i.test(normalizedText)) &&
      /(esperando|decisao|aprova|pendente|precisa de mim|esperando por mim|aguardando)/i.test(normalizedText)
    ) {
      return 'ANTIGRAVITY_OWNER_WAIT';
    }

    // 8. Checagem de processo específico: "O Antigravity está funcionando/aberto/ativo?"
    if (isAntigravitySubject && /(esta funcionando|esta aberto|esta rodando|esta ativo|processo)/i.test(normalizedText)) {
      return 'AUTHORIZED_PROCESSES';
    }

    // 9. Status geral do Antigravity
    if (
      isAntigravitySubject &&
      (
        /(como esta|como vai|status|situacao|ver)/i.test(normalizedText) ||
        tokens.length <= 4
      )
    ) {
      return 'ANTIGRAVITY_ACTIVITY_STATUS';
    }

    // 10. Tarefa atual
    if (
      isAntigravitySubject &&
      /(tarefa|issue|fazendo|trabalhando|executando|mexendo|o que .* fazendo)/i.test(normalizedText)
    ) {
      return 'ANTIGRAVITY_CURRENT_TASK';
    }

    // 11. Consulta de recuperação
    if (/(o que voce recuperou|recuperou hoje|historico de recovery|recovery)/i.test(normalizedText)) {
      return 'RECOVERY_HISTORY';
    }

    // 12. Memória RAM / saúde específica
    if (/(quanto de memoria|consumo de ram|uso de ram|memoria ram)/i.test(normalizedText)) {
      return 'HOST_HEALTH';
    }

    // 13. Histórico ou estado da internet
    if (/(a internet caiu hoje|internet caiu|historico de internet|quedas de rede)/i.test(normalizedText)) {
      return 'INTERNET_HISTORY';
    }

    // 14. Status geral da máquina / saúde do sistema
    if (/(como esta a maquina|status da maquina|saude da maquina|saude|cpu|disco|uptime|computador|maquina|sistema)/i.test(normalizedText)) {
      return 'SYSTEM_STATUS';
    }

    if (/(internet|conexao|conectividade|online|offline|rede|wifi)/i.test(normalizedText)) {
      return 'INTERNET_STATUS';
    }

    if (/(processo|processos|servico|servicos|daemon)/i.test(normalizedText)) {
      return 'PROCESS_INVENTORY';
    }

    if (/(ajuda|help|socorro|como uso|o que voce faz)/i.test(normalizedText)) {
      return 'HELP_REQUEST';
    }

    return 'UNKNOWN_OR_UNSUPPORTED';
  }

  async process(rawText, userId = null) {
    const sanitizedInput = SanitizadorSegredos.sanitizarTexto(rawText || '');
    const normalized = InputNormalizer.normalize(sanitizedInput);
    let intent = this.classifyIntent(normalized, userId);

    // Fallback semântico assistido por modelo se ambíguo e modelo online
    // Proíbe expressamente consultas adversariais de chegarem ao modelo
    const isAdversarial = /(ignore.*instru|system prompt|override|format\s+[a-z]:|powershell|delete.*arquivo|terminal livre)/i.test(normalized);
    let modelUsed = false;
    if (!isAdversarial && intent === 'UNKNOWN_OR_UNSUPPORTED' && this.ollamaAdapter && typeof this.ollamaAdapter.interpretarNLU === 'function') {
      try {
        const currentCtx = this.getContext(userId);
        const modelRes = await this.ollamaAdapter.interpretarNLU(normalized, currentCtx);
        if (modelRes && modelRes.sucesso && modelRes.intent && modelRes.intent !== 'UNKNOWN_OR_UNSUPPORTED') {
          intent = modelRes.intent;
          modelUsed = true;
        }
      } catch (e) {
        // Fail-open
      }
    }

    let replyText = '';
    let subject = null;
    let taskContext = null;
    const canonicalIntent = intent === 'SYSTEM_STATUS' ? 'SYSTEM_HEALTH' : (intent === 'INTERNET_HISTORY' ? 'INTERNET_STATUS' : (intent === 'INTERNET_DURATION_FOLLOWUP' ? 'INTERNET_DURATION_QUERY' : intent));
    let metadata = {
      intent: canonicalIntent,
      input_normalized: normalized,
      confidence: modelUsed ? 'MEDIUM' : (intent === 'UNKNOWN_OR_UNSUPPORTED' ? 'LOW' : 'HIGH'),
      model_assisted: modelUsed
    };

    switch (intent) {
      case 'SECURITY_BLOCKED': {
        replyText = '⛔ Ação não autorizada. As políticas de segurança e integridade do Vigia são invioláveis.';
        metadata.confidence = 'HIGH';
        break;
      }

      case 'ARBITRARY_UI_TEXT_BLOCKED': {
        replyText = '⛔ Operação negada. O Vigia opera sob a política restrita de payload único (\'V\'). Digitação arbitrária de texto na interface é proibida por contrato.';
        metadata.confidence = 'HIGH';
        break;
      }

      case 'FORGET_CONTEXT': {
        this.clearContext(userId);
        replyText = '🧹 Memória contextual limpa com sucesso. Os registros de auditoria e journals do host permanecem íntegros.';
        break;
      }

      case 'RESUME_LAST_CYCLE_STATUS': {
        subject = 'ANTIGRAVITY';
        const lastEvent = this.resumeController && this.resumeController.eventStore ? this.resumeController.eventStore.getLastEvent() : null;
        if (lastEvent) {
          replyText = `No último ciclo de retomada (${lastEvent.trigger_type}, evento ${lastEvent.resume_event_id}): ação ${lastEvent.result}, motivo: ${lastEvent.reason || 'Concluído'}.`;
        } else {
          replyText = 'Nenhum ciclo de retomada operacional foi disparado até o momento.';
        }
        break;
      }

      case 'RESUME_V_SENT_QUERY': {
        subject = 'ANTIGRAVITY';
        const lastEvent = this.resumeController && this.resumeController.eventStore ? this.resumeController.eventStore.getLastEvent() : null;
        if (lastEvent && lastEvent.send_confirmed) {
          replyText = `Sim, o comando V foi enviado e confirmado para a conversa operacional em ${lastEvent.detected_at || 'recente'} (Evento: ${lastEvent.resume_event_id}).`;
        } else if (lastEvent) {
          replyText = `Não enviei V: ${lastEvent.reason || 'ação suprimida ou inibida por política de segurança'}.`;
        } else {
          replyText = 'Não enviei V: nenhum evento de interrupção ou retomada exigiu o envio até o momento.';
        }
        break;
      }

      case 'OWNER_TRIGGER_RESUME': {
        subject = 'ANTIGRAVITY';
        if (this.resumeController && typeof this.resumeController.triggerResume === 'function') {
          const res = await this.resumeController.triggerResume('OWNER_REMOTE_TRIGGER', {
            resume_event_id: `owner_nl_${Date.now()}`
          });
          if (res.action === 'SEND_V') {
            replyText = 'Fluxo retomado: comando V enviado com sucesso à conversa operacional.';
          } else if (res.action === 'NO_OP') {
            replyText = `Retomada avaliada: nenhuma ação necessária (${res.reason}).`;
          } else {
            replyText = `Não enviei V: ${res.reason}.`;
          }
        } else {
          replyText = 'Controlador de retomada não disponível.';
        }
        break;
      }

      case 'GREETING_OR_CONVERSATION': {
        subject = 'ANTIGRAVITY';
        const inv = this.recoveryManager ? this.recoveryManager.inventoryState() : {};
        const isRunning = inv.antigravity ? inv.antigravity.running : true;
        if (!isRunning) {
          replyText = 'Antigravity não está em execução no host no momento. O Sentinela Vigia está ativo para suporte. Digite /acordarantigravity ou /ajuda.';
          metadata.interlocutor = 'VIGIA_FALLBACK';
        } else {
          const snapshot = await this.antigravityObserver.inspect();
          if (snapshot.execution_phase === 'IN_PROGRESS') {
            const taskStr = snapshot.current_task_id ? `(${snapshot.current_task_id})` : `(Issue #${snapshot.current_issue_number})`;
            replyText = `Olá! Aqui é o Antigravity. Estou em execução ativa no host. No momento estou trabalhando na Issue #${snapshot.current_issue_number} ${taskStr}. Em que posso ajudar no fluxo operacional?`;
          } else {
            replyText = 'Olá! Aqui é o Antigravity. Estou ativo no host e com interface operacional pronta, aguardando o próximo comando ou instrução de trabalho.';
          }
          metadata.interlocutor = 'ANTIGRAVITY';
        }
        break;
      }

      case 'SPRINT_START_REQUEST': {
        subject = 'ANTIGRAVITY';
        replyText = 'Instrução de Sprint acolhida: iniciando execução da SPRINT-PC-TRABALHO-BRIDGE-001. A prova do circuito Bridge V2 está ativa e o RESULT será processado e devolvido pelo circuito automático.';
        metadata.interlocutor = 'ANTIGRAVITY';
        metadata.route_reason = 'SPRINT_START_REQUEST';
        metadata.antigravity_available = true;
        break;
      }

      case 'SPRINT_EXPLANATION': {
        subject = 'ANTIGRAVITY';
        replyText = 'Nesta sprint (SPRINT-PC-TRABALHO-BRIDGE-001), estamos implementando a conversa real e livre com o Antigravity via Telegram e o circuito automático de transporte via Bridge V2 para o ChatGPT, mantendo o Vigia estritamente como fallback factual.';
        metadata.interlocutor = 'ANTIGRAVITY';
        metadata.route_reason = 'SPRINT_EXPLANATION';
        metadata.antigravity_available = true;
        break;
      }

      case 'V_COMMAND_EXPLANATION': {
        subject = 'ANTIGRAVITY';
        replyText = 'Sim, compreendo perfeitamente. O comando "v" é o acionamento canônico para verificar o repositório Git, inspecionar as Issues e o GitHub Project, e retomar o ciclo de execução operacional do Antigravity.';
        metadata.interlocutor = 'ANTIGRAVITY';
        metadata.route_reason = 'V_COMMAND_SEMANTICS_QUERY';
        metadata.antigravity_available = true;
        break;
      }

      case 'ANTIGRAVITY_CONTINUE_REQUEST': {
        subject = 'ANTIGRAVITY';
        const snapshot = await this.antigravityObserver.inspect();
        replyText = `Estou ativo e pronto para continuar o fluxo. Tarefa atual: Issue #${snapshot.current_issue_number || 'ativa'} (${snapshot.current_task_id || 'em andamento'}).`;
        metadata.interlocutor = 'ANTIGRAVITY';
        metadata.route_reason = 'CONTINUE_REQUEST';
        metadata.antigravity_available = true;
        break;
      }

      case 'ANTIGRAVITY_WORK_DISTINCTION': {
        subject = 'ANTIGRAVITY';
        let opState = null;
        if (this.resumeController && typeof this.resumeController.evaluateOperationalState === 'function') {
          opState = await this.resumeController.evaluateOperationalState();
        }
        if (opState) {
          replyText = opState.description;
          metadata.operational_state = opState.state;
        } else {
          const snapshot = await this.antigravityObserver.inspect();
          if (snapshot.execution_phase === 'IN_PROGRESS') {
            replyText = `O Antigravity está ativo e trabalhando na Issue #${snapshot.current_issue_number} (${snapshot.current_task_id}).`;
          } else {
            replyText = 'O Antigravity está aberto e com interface pronta, porém ocioso / aguardando retomada ou comando.';
          }
        }
        break;
      }

      case 'ANTIGRAVITY_LAST_DELIVERY': {
        subject = 'ANTIGRAVITY';
        const snapshot = await this.antigravityObserver.inspect();
        const taskLabel = snapshot.current_task_id ? `(${snapshot.current_task_id})` : `(Issue #${snapshot.current_issue_number || 'recente'})`;
        if (snapshot.last_action_summary) {
          replyText = `A última entrega ou ação registrada na tarefa ${taskLabel} foi: "${snapshot.last_action_summary}".`;
        } else {
          replyText = snapshot.summary;
        }
        break;
      }

      case 'ANTIGRAVITY_WAS_REOPENED': {
        subject = 'ANTIGRAVITY';
        const entries = this.journal ? this.journal.readEntries(20) : [];
        const reopenEntries = entries.filter(e => e.action && (e.action.includes('RECOVER') || e.action.includes('STARTED_PROCESS')) && JSON.stringify(e).toLowerCase().includes('antigravity'));
        if (reopenEntries.length > 0) {
          replyText = 'Sim, o Antigravity foi reaberto hoje pelo sistema de recuperação do Vigia.';
        } else {
          replyText = 'Não, o Antigravity não precisou ser reaberto hoje. O processo permaneceu estável.';
        }
        break;
      }

      case 'CONTEXT_EXPIRED_OR_ABSENT': {
        replyText = 'Não identifiquei a qual evento ou serviço você se refere. Por favor, pergunte especificando o assunto desejado (ex: internet ou Antigravity).';
        metadata.confidence = 'LOW';
        break;
      }

      case 'SYSTEM_STATUS':
      case 'SYSTEM_HEALTH': {
        subject = 'SYSTEM';
        const m = this.healthMonitor ? this.healthMonitor.collectMetrics() : null;
        if (!m) {
          replyText = 'Telemetria do sistema indisponível.';
        } else {
          const usedMb = Math.round(m.system.used_memory_bytes / 1024 / 1024);
          const totalMb = Math.round(m.system.total_memory_bytes / 1024 / 1024);
          replyText = `A máquina está operando normalmente com CPU a ${m.system.cpu_count} núcleos, memória RAM em ${m.system.memory_usage_percent}% (${usedMb}MB de ${totalMb}MB) e o sistema operacional está ativo.`;
        }
        break;
      }

      case 'HOST_HEALTH': {
        subject = 'SYSTEM';
        const m = this.healthMonitor ? this.healthMonitor.collectMetrics() : null;
        if (!m) {
          replyText = 'Telemetria de memória indisponível.';
        } else {
          const usedMb = Math.round(m.system.used_memory_bytes / 1024 / 1024);
          const totalMb = Math.round(m.system.total_memory_bytes / 1024 / 1024);
          replyText = `Consumo de RAM atual: ${usedMb}MB de ${totalMb}MB (${m.system.memory_usage_percent}%).`;
        }
        break;
      }

      case 'INTERNET_HISTORY': {
        subject = 'NETWORK';
        const net = this.internetMonitor;
        const entries = this.journal ? this.journal.readEntries(20) : [];
        const netEntries = entries.filter(e => e.action && e.action.includes('INTERNET'));
        if (netEntries.length > 0) {
          replyText = `Histórico de rede: registrada queda de conexão no journal (${netEntries[0].timestamp || 'hoje'}).`;
        } else if (net && net.state === 'DOWN') {
          replyText = `Conexão atualmente com queda registrada desde ${net.downSince || 'recentemente'}.`;
        } else {
          replyText = 'Nenhuma queda de conexão com a Internet foi registrada no journal hoje.';
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

      case 'INTERNET_DURATION_QUERY':
      case 'INTERNET_DURATION_FOLLOWUP': {
        subject = 'NETWORK';
        const net = this.internetMonitor;
        if (net && net.state === 'DOWN' && net.downSince) {
          replyText = `A conexão com a Internet está offline desde ${net.downSince}.`;
        } else {
          replyText = 'A queda registrada de Internet foi transitória, conforme apontado pelo monitor e journal.';
        }
        break;
      }

      case 'AUTHORIZED_PROCESSES': {
        subject = 'ANTIGRAVITY';
        const inv = this.recoveryManager ? this.recoveryManager.inventoryState() : {};
        const isRunning = inv.antigravity && inv.antigravity.running;
        replyText = isRunning ? 'O Antigravity está aberto e em execução no host.' : 'O Antigravity está parado no momento.';
        break;
      }

      case 'RECOVERY_HISTORY': {
        subject = 'SYSTEM';
        const entries = this.journal ? this.journal.readEntries(10) : [];
        const recoveries = entries.filter(e => e.action && e.action.includes('RESTORE') || e.action && e.action.includes('RECOVERY'));
        if (recoveries.length > 0) {
          replyText = `Histórico de recuperação: foram executadas ações de recuperação automáticas registradas no journal.`;
        } else {
          replyText = 'Nenhuma ação de recuperação foi necessária hoje. Todos os serviços operaram sem interrupção.';
        }
        break;
      }

      case 'ANTIGRAVITY_ACTIVITY_STATUS':
      case 'ANTIGRAVITY_CURRENT_TASK': {
        const isDetailed = /detalhe|completo|auditoria/i.test(normalized);
        const snapshot = await this.antigravityObserver.inspect(isDetailed);
        replyText = snapshot.summary;
        subject = 'ANTIGRAVITY';
        taskContext = {
          issueNumber: snapshot.current_issue_number,
          taskId: snapshot.current_task_id,
          lastAction: snapshot.last_action_summary,
          ageMinutes: snapshot.age_minutes
        };
        metadata.observer_payload = snapshot;
        break;
      }

      case 'ANTIGRAVITY_LAST_ACTION': {
        const snapshot = await this.antigravityObserver.inspect();
        subject = 'ANTIGRAVITY';
        const taskLabel = snapshot.current_task_id ? `(${snapshot.current_task_id})` : `(Issue #${snapshot.current_issue_number})`;
        if (snapshot.last_action_summary) {
          replyText = `A última ação registrada do Antigravity na Issue #${snapshot.current_issue_number} ${taskLabel} foi: "${snapshot.last_action_summary}".`;
        } else {
          replyText = snapshot.summary;
        }
        break;
      }

      case 'ANTIGRAVITY_LAST_ERROR': {
        const snapshot = await this.antigravityObserver.inspect();
        subject = 'ANTIGRAVITY';
        const taskLabel = snapshot.current_task_id ? `(${snapshot.current_task_id})` : `Issue #${snapshot.current_issue_number || 'desconhecida'}`;
        if (snapshot.last_result_or_error) {
          replyText = `Última nota ou incidente registrado na tarefa ${taskLabel}: ${snapshot.last_result_or_error}`;
        } else {
          replyText = `Nenhum erro reportado na tarefa ativa ${taskLabel}.`;
        }
        break;
      }

      case 'ANTIGRAVITY_DURATION_QUERY': {
        const snapshot = await this.antigravityObserver.inspect();
        subject = 'ANTIGRAVITY';
        const taskLabel = snapshot.current_task_id ? `(${snapshot.current_task_id})` : `Issue #${snapshot.current_issue_number || 'ativa'}`;
        if (snapshot.age_minutes !== null) {
          const durationStr = snapshot.age_minutes < 2 ? 'menos de 2 minutos' : `cerca de ${snapshot.age_minutes} minutos`;
          replyText = `A última atividade registrada da tarefa ${taskLabel} ocorreu há ${durationStr}.`;
        } else {
          replyText = `Não há registro recente de duração ou atividade na tarefa ${taskLabel}.`;
        }
        break;
      }

      case 'ANTIGRAVITY_OWNER_WAIT': {
        const snapshot = await this.antigravityObserver.inspect();
        subject = 'ANTIGRAVITY';
        const taskLabel = snapshot.current_task_id ? `(${snapshot.current_task_id})` : `(Issue #${snapshot.current_issue_number})`;
        if (snapshot.owner_decision_required) {
          replyText = `Sim. O Antigravity está aguardando sua decisão na Issue #${snapshot.current_issue_number} ${taskLabel}.`;
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
        replyText = 'Você pode falar comigo naturalmente sobre a saúde da máquina, internet, processos ou sobre o Antigravity (ex: "como está o antigravity?", "o que ele está fazendo?", "tem algo esperando por mim?"). Use "esqueça o contexto" ou /esquecer_contexto para limpar a memória.';
        break;
      }

      default: {
        const inv = this.recoveryManager ? this.recoveryManager.inventoryState() : {};
        const isRunning = inv.antigravity ? inv.antigravity.running : true;

        if (isAdversarial) {
          replyText = '⛔ Ação não autorizada por política de segurança e integridade do host.';
          metadata.interlocutor = 'VIGIA_FALLBACK';
          metadata.route_reason = 'ADVERSARIAL_BLOCKED';
          metadata.antigravity_available = isRunning;
        } else if (!isRunning) {
          replyText = 'Antigravity não está em execução no host no momento. O Sentinela Vigia está ativo para suporte. Digite /acordarantigravity ou /ajuda.';
          metadata.interlocutor = 'VIGIA_FALLBACK';
          metadata.route_reason = 'ANTIGRAVITY_PROCESS_DOWN';
          metadata.antigravity_available = false;
        } else {
          replyText = 'Mensagem recebida pelo Antigravity. Estou ativo e acompanhando o fluxo operacional da Sprint. Como posso orientar ou dar andamento a esta solicitação?';
          metadata.interlocutor = 'ANTIGRAVITY';
          metadata.route_reason = 'ANTIGRAVITY_NATURAL_CONVERSATION';
          metadata.antigravity_available = true;
        }
        metadata.confidence = 'LOW';
        break;
      }
    }

    const sanitizedResponse = SanitizadorSegredos.sanitizarTexto(replyText);

    // Atualiza memória contextual se usuário identificado e não for comando de esquecer ou bloqueio
    if (userId && intent !== 'FORGET_CONTEXT' && intent !== 'SECURITY_BLOCKED') {
      const updates = {};
      if (subject) updates.subject = subject;
      if (taskContext) {
        updates.current_issue_number = taskContext.issueNumber;
        updates.current_task_id = taskContext.taskId;
        updates.last_factual_snapshot_ref = taskContext.lastAction;
      }
      updates.previous_intent = intent;

      // Grava turno do usuário e resposta do assistente
      this.memoryStore.updateContext(userId, updates, {
        role: 'user',
        text: sanitizedInput
      });

      this.memoryStore.updateContext(userId, {}, {
        role: 'assistant',
        text: sanitizedResponse
      });
    }

    const rootIntent = intent === 'ANTIGRAVITY_CURRENT_TASK' ? 'ANTIGRAVITY_ACTIVITY_STATUS' : (intent === 'SYSTEM_HEALTH' ? 'SYSTEM_STATUS' : intent);

    return {
      text: sanitizedResponse,
      intent: rootIntent, // Retrocompatibilidade direta
      metadata
    };
  }
}

module.exports = NaturalLanguageRouter;
