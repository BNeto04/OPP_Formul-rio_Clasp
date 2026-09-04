const SanitizadorSegredos = require('./SanitizadorSegredos');
const AntigravityObserver = require('./AntigravityObserver');

class NaturalLanguageRouter {
  constructor(options = {}) {
    this.healthMonitor = options.healthMonitor;
    this.recoveryManager = options.recoveryManager;
    this.internetMonitor = options.internetMonitor;
    this.journal = options.journal;
    this.antigravityObserver = options.antigravityObserver || new AntigravityObserver({
      recoveryManager: this.recoveryManager,
      journal: this.journal
    });
    this.ollamaAdapter = options.ollamaAdapter || null;
    this.contextTtlMs = options.contextTtlMs || 300000; // 5 minutos
    this.conversations = new Map(); // userId -> { lastIntent, lastData, timestamp }
  }

  getContext(userId) {
    if (!userId) return null;
    const ctx = this.conversations.get(String(userId));
    if (!ctx) return null;
    if (Date.now() - ctx.timestamp > this.contextTtlMs) {
      this.conversations.delete(String(userId));
      return null;
    }
    return ctx;
  }

  setContext(userId, intent, data) {
    if (!userId) return;
    this.conversations.set(String(userId), {
      lastIntent: intent,
      lastData: data,
      timestamp: Date.now()
    });
  }

  clearContext(userId) {
    if (userId) this.conversations.delete(String(userId));
  }

  async process(text, userId) {
    const raw = String(text || '').trim();
    const sanitizado = SanitizadorSegredos.sanitizarTexto(raw);
    const lower = sanitizado.toLowerCase();

    // 1. Barreira Estrita: Prompt Injection e Tentativa de Ignorar Regras
    const injectionPatterns = [
      /ignore\s+(todas\s+as\s+)?(suas\s+)?instru[cç][oõ]es/i,
      /voc[eê]\s+agora\s+[eé]/i,
      /system\s+prompt/i,
      /aja\s+como\s+uma\s+ia\s+livre/i,
      /desconsidere\s+as\s+regras/i
    ];
    for (const pattern of injectionPatterns) {
      if (pattern.test(lower)) {
        return {
          intent: 'SECURITY_BLOCKED',
          text: '🛡️ Minhas diretrizes de segurança são fixas e invioláveis. Não posso ignorar regras nem alterar minha operação por mensagem.'
        };
      }
    }

    // 2. Barreira Estrita: Shell Arbitrário e Comandos Destrutivos
    const shellPatterns = [
      /\bpowershell\b/i,
      /\bcmd(\.exe)?\b/i,
      /\bbash\b/i,
      /\bexec(ute)?\b/i,
      /\brmdir\b/i,
      /\bdel(ete)?\b/i,
      /\bformat\b/i,
      /\brestart-computer\b/i,
      /\bshutdown\b/i,
      /\bcurl\b/i,
      /\bwget\b/i,
      /\bgit\s+(push|merge|rebase)\b/i
    ];
    for (const pattern of shellPatterns) {
      if (pattern.test(lower)) {
        return {
          intent: 'SECURITY_BLOCKED',
          text: '⛔ Ação não autorizada. O Vigia da Ponte não possui permissão para executar comandos de shell, terminal ou scripts arbitrários por canal remoto.'
        };
      }
    }

    // 3. Suporte a Perguntas de Follow-up com Memória Curta
    const ctx = this.getContext(userId);
    const isDurationFollowUp = /^(e\s+)?por\s+quanto\s+tempo\??$/i.test(lower) || /^qual\s+a\s+dura[cç][aã]o\??$/i.test(lower);

    if (isDurationFollowUp) {
      if (ctx && ctx.lastIntent === 'INTERNET_HISTORY') {
        return this.formatInternetDurationFollowUp(ctx.lastData);
      } else {
        return {
          intent: 'CONTEXT_EXPIRED_OR_ABSENT',
          text: 'Não identifiquei a qual evento você está se referindo. Você pode perguntar se a internet caiu hoje ou como está a conexão no momento.'
        };
      }
    }

    // 4. Classificador Determinístico de Intenções (NLU Determinística)
    const intent = this.classifyIntent(lower);

    switch (intent) {
      case 'SYSTEM_STATUS':
        return this.handleSystemStatus(userId);

      case 'HOST_HEALTH':
      case 'HOST_RAM':
        return this.handleHostHealth(userId, lower);

      case 'INTERNET_STATUS':
        return this.handleInternetStatus(userId);

      case 'INTERNET_HISTORY':
        return this.handleInternetHistory(userId);

      case 'AUTHORIZED_PROCESSES':
        return this.handleAuthorizedProcesses(userId, lower);

      case 'LAST_ERROR':
        return this.handleLastError(userId);

      case 'RECOVERY_HISTORY':
        return this.handleRecoveryHistory(userId);

      case 'WAKE_ANTIGRAVITY_REQUEST':
        return this.handleWakeAntigravity(userId);

      case 'ANTIGRAVITY_ACTIVITY_STATUS':
        return this.handleAntigravityActivity(userId);

      case 'ANTIGRAVITY_CURRENT_TASK':
        return this.handleAntigravityCurrentTask(userId);

      case 'ANTIGRAVITY_LAST_ACTION':
        return this.handleAntigravityLastAction(userId);

      case 'ANTIGRAVITY_OWNER_WAIT':
        return this.handleAntigravityOwnerWait(userId);

      case 'HELP_CAPABILITIES':
        return this.handleHelpCapabilities(userId);

      case 'UNKNOWN_OR_UNSUPPORTED':
      default:
        // Se houver adaptador Ollama operacional, tentar categorização
        if (this.ollamaAdapter) {
          try {
            const ollamaRes = await this.ollamaAdapter.classificar(lower);
            if (ollamaRes && ollamaRes.sucesso && ollamaRes.categoria && ollamaRes.categoria !== 'UNKNOWN_NEEDS_REPORT') {
              // Roteia se o Ollama mapeou para algo conhecido
            }
          } catch (e) {}
        }
        return {
          intent: 'UNKNOWN_OR_UNSUPPORTED',
          text: 'Não tenho dados suficientes para responder a essa pergunta. Posso informar sobre o status da máquina, saúde/RAM, conexão de internet, processos autorizados ou histórico de recuperações.'
        };
    }
  }

  classifyIntent(lower) {
    // SYSTEM_STATUS
    if (
      /como\s+est[aá]\s+(a\s+)?m[aá]quina/i.test(lower) ||
      /status\s+(do\s+)?sistema/i.test(lower) ||
      /tudo\s+bem\s+por\s+a[ií]/i.test(lower) ||
      /qual\s+o\s+status(\s+geral)?/i.test(lower)
    ) {
      return 'SYSTEM_STATUS';
    }

    // HOST_RAM / HOST_HEALTH
    if (
      /quanto\s+(de\s+)?mem[oó]ria/i.test(lower) ||
      /uso\s+de\s+ram/i.test(lower) ||
      /como\s+est[aá]\s+a\s+mem[oó]ria/i.test(lower) ||
      /sa[uú]de\s+(do\s+host|da\s+m[aá]quina)/i.test(lower) ||
      /como\s+est[aá]\s+o\s+consumo/i.test(lower)
    ) {
      return 'HOST_HEALTH';
    }

    // INTERNET_HISTORY (perguntas temporais sobre queda)
    if (
      /(a\s+)?internet\s+caiu\s+hoje/i.test(lower) ||
      /teve\s+queda\s+de\s+internet/i.test(lower) ||
      /hist[oó]rico\s+de\s+conex[aã]o/i.test(lower) ||
      /caiu\s+hoje/i.test(lower) ||
      /quantas\s+vezes\s+(a\s+internet\s+)?caiu/i.test(lower)
    ) {
      return 'INTERNET_HISTORY';
    }

    // INTERNET_STATUS (tempo presente)
    if (
      /internet\s+est[aá]\s+(funcionando|ativa|online|boa)/i.test(lower) ||
      /est[aá]\s+online/i.test(lower) ||
      /tem\s+internet/i.test(lower) ||
      /estamos\s+com\s+internet/i.test(lower) ||
      /como\s+est[aá]\s+a\s+internet\s+agora/i.test(lower)
    ) {
      return 'INTERNET_STATUS';
    }

    // ANTIGRAVITY_OWNER_WAIT (verificação global de decisão pendente)
    if (
      /decis[aã]o\s+(pendente|sua|minha)/i.test(lower) ||
      /esperando\s+(minha\s+decis[aã]o|por\s+mim)/i.test(lower) ||
      /tem\s+alguma\s+coisa\s+esperando/i.test(lower)
    ) {
      return 'ANTIGRAVITY_OWNER_WAIT';
    }

    // ----------------------------------------------------
    // Detecção Semântica Estendida de Intenções do Antigravity
    // ----------------------------------------------------
    const hasAntigravity = /antigrav[a-z]*/i.test(lower) || (/\bele\b/i.test(lower) && !lower.includes('internet'));

    if (hasAntigravity) {
      // 1. Ação de despertar / abrir
      if (
        /acorde\s+(o\s+)?antigrav[a-z]*/i.test(lower) ||
        /acordar\s+(o\s+)?antigrav[a-z]*/i.test(lower) ||
        /abra\s+(o\s+)?antigrav[a-z]*/i.test(lower) ||
        /inicie\s+(o\s+)?antigrav[a-z]*/i.test(lower)
      ) {
        return 'WAKE_ANTIGRAVITY_REQUEST';
      }

      // 2. Tarefa / Issue específica
      if (
        /(em\s+que\s+|qual\s+)tarefa/i.test(lower) ||
        /qual\s+issue/i.test(lower) ||
        /qual\s+o\s+card/i.test(lower)
      ) {
        return 'ANTIGRAVITY_CURRENT_TASK';
      }

      // 3. Última ação
      if (
        /[uú]ltima\s+a[cç][aã]o/i.test(lower) ||
        /fez\s+por\s+[uú]ltimo/i.test(lower) ||
        /[uú]ltimo\s+passo/i.test(lower)
      ) {
        return 'ANTIGRAVITY_LAST_ACTION';
      }

      // 4. Atividade geral / Como está / Ver estado / O que está fazendo
      if (
        /como\s+est[aá]/i.test(lower) ||
        /o\s+que\s+.*fazendo/i.test(lower) ||
        /(consigo\s+)?ver\s+(o\s+)?/i.test(lower) ||
        /mostr(e|a)/i.test(lower) ||
        /parado|trabalhando|ocupado/i.test(lower) ||
        /atividade/i.test(lower) ||
        /status/i.test(lower) ||
        /vivo|ativo|aberto|rodando|funcionando/i.test(lower) ||
        /antigrav[a-z]*/i.test(lower)
      ) {
        return 'ANTIGRAVITY_ACTIVITY_STATUS';
      }
    }

    // AUTHORIZED_PROCESSES
    if (
      /o\s+antigravity\s+est[aá]\s+(aberto|rodando|ativo|vivo|funcionando)/i.test(lower) ||
      /o\s+hermes\s+est[aá]\s+(aberto|rodando|ativo)/i.test(lower) ||
      /quais\s+processos\s+est[aã]o\s+rodando/i.test(lower) ||
      /processos\s+autorizados/i.test(lower)
    ) {
      return 'AUTHORIZED_PROCESSES';
    }

    // LAST_ERROR
    if (
      /qual\s+(foi\s+)?(o\s+)?[uú]ltimo\s+erro/i.test(lower) ||
      /teve\s+algum\s+erro/i.test(lower) ||
      /alguma\s+falha\s+recente/i.test(lower)
    ) {
      return 'LAST_ERROR';
    }

    // RECOVERY_HISTORY
    if (
      /o\s+que\s+voc[eê]\s+recuperou\s+hoje/i.test(lower) ||
      /hist[oó]rico\s+de\s+recupera[cç][aã]o/i.test(lower) ||
      /recuperou\s+algo\s+hoje/i.test(lower) ||
      /teve\s+recupera[cç][aã]o\s+hoje/i.test(lower)
    ) {
      return 'RECOVERY_HISTORY';
    }

    // WAKE_ANTIGRAVITY_REQUEST
    if (
      /acorde\s+(o\s+)?antigravity/i.test(lower) ||
      /acordar\s+(o\s+)?antigravity/i.test(lower) ||
      /abra\s+(o\s+)?antigravity/i.test(lower) ||
      /inicie\s+(o\s+)?antigravity/i.test(lower)
    ) {
      return 'WAKE_ANTIGRAVITY_REQUEST';
    }

    // HELP_CAPABILITIES
    if (
      /o\s+que\s+voc[eê]\s+(pode|sabe)\s+fazer/i.test(lower) ||
      /quais\s+s[aã]o\s+suas\s+capacidades/i.test(lower) ||
      /como\s+voc[eê]\s+funciona/i.test(lower) ||
      /ajuda/i.test(lower)
    ) {
      return 'HELP_CAPABILITIES';
    }

    return 'UNKNOWN_OR_UNSUPPORTED';
  }

  // --- Handlers de Intenções Factuais ---

  async handleSystemStatus(userId) {
    const health = this.healthMonitor ? this.healthMonitor.collectMetrics() : null;
    const net = this.internetMonitor ? await this.internetMonitor.check() : null;
    const procs = this.recoveryManager ? this.recoveryManager.inventoryState() : {};

    const netTxt = (net && net.state === 'UP') ? 'conectada e estável' : 'instável ou offline';
    let ramTxt = 'indisponível';
    if (health && health.system) {
      const usedMb = Math.round(health.system.used_memory_bytes / 1048576);
      const totalMb = Math.round(health.system.total_memory_bytes / 1048576);
      ramTxt = `${health.system.memory_usage_percent}% (${usedMb} MB de ${totalMb} MB)`;
    }
    
    let agTxt = 'fechado';
    if (procs.antigravity) {
      agTxt = procs.antigravity.running ? 'ativo em execução' : 'parado';
    }

    const text = `A máquina está operacional no momento. A internet está ${netTxt}, o consumo de memória RAM está em ${ramTxt} e o Antigravity está ${agTxt}.`;
    
    this.setContext(userId, 'SYSTEM_STATUS', { health, net, procs });
    return { intent: 'SYSTEM_STATUS', text };
  }

  handleHostHealth(userId, lower) {
    const health = this.healthMonitor ? this.healthMonitor.collectMetrics() : null;
    if (!health || !health.system) {
      return {
        intent: 'HOST_HEALTH',
        text: 'Não tenho dados suficientes de telemetria de saúde no momento.'
      };
    }

    const sys = health.system;
    const usedMb = Math.round(sys.used_memory_bytes / 1048576);
    const totalMb = Math.round(sys.total_memory_bytes / 1048576);
    const uptimeHours = (sys.uptime_seconds / 3600).toFixed(1);

    const isOnlyRam = /mem[oó]ria|ram/i.test(lower);
    let text;
    if (isOnlyRam) {
      text = `O sistema está utilizando ${usedMb} MB de memória RAM, o que corresponde a ${sys.memory_usage_percent}% do total de ${totalMb} MB.`;
    } else {
      text = `O host está ativo há ${uptimeHours} horas. O uso de memória RAM está em ${sys.memory_usage_percent}% (${usedMb} MB / ${totalMb} MB).`;
    }

    this.setContext(userId, 'HOST_HEALTH', health);
    return { intent: 'HOST_HEALTH', text };
  }

  async handleInternetStatus(userId) {
    if (!this.internetMonitor) {
      return {
        intent: 'INTERNET_STATUS',
        text: 'Não tenho dados suficientes para verificar o estado da internet agora.'
      };
    }

    const net = await this.internetMonitor.check();
    let text;
    if (net.state === 'UP') {
      text = 'Sim, a internet está funcionando normalmente agora e a conectividade com os servidores externos está ativa.';
    } else {
      text = 'A internet não está respondendo no momento. O monitor registrou perda de conectividade externa.';
    }

    this.setContext(userId, 'INTERNET_STATUS', net);
    return { intent: 'INTERNET_STATUS', text };
  }

  handleInternetHistory(userId) {
    if (!this.journal) {
      return {
        intent: 'INTERNET_HISTORY',
        text: 'Não tenho dados suficientes no histórico de rede para responder.'
      };
    }

    const entries = this.journal.readEntries(100);
    const today = new Date().toISOString().split('T')[0];
    const todayDowns = entries.filter(e => {
      const isToday = e.timestamp && e.timestamp.startsWith(today);
      return isToday && e.action === 'INTERNET_DOWN';
    });
    const todayUps = entries.filter(e => {
      const isToday = e.timestamp && e.timestamp.startsWith(today);
      return isToday && e.action === 'INTERNET_UP';
    });

    let text;
    if (todayDowns.length === 0) {
      text = 'Não houve nenhuma queda de internet registrada no journal hoje.';
    } else {
      text = `Hoje foi registrada ${todayDowns.length} ocorrência(s) de queda na conexão.`;
      if (todayUps.length > 0) {
        text += ' A conectividade foi restabelecida com sucesso pelo monitor.';
      }
    }

    const data = { todayDowns, todayUps, entriesCount: entries.length };
    this.setContext(userId, 'INTERNET_HISTORY', data);
    return { intent: 'INTERNET_HISTORY', text };
  }

  formatInternetDurationFollowUp(data) {
    if (!data || !data.todayDowns || data.todayDowns.length === 0) {
      return {
        intent: 'INTERNET_DURATION_FOLLOWUP',
        text: 'Não houve queda de internet hoje para mensurar duração.'
      };
    }

    const ups = data.todayUps || [];
    if (ups.length > 0) {
      return {
        intent: 'INTERNET_DURATION_FOLLOWUP',
        text: 'A indisponibilidade de rede foi transitória e durou poucos segundos até a recomposição dos probes.'
      };
    }

    return {
      intent: 'INTERNET_DURATION_FOLLOWUP',
      text: 'A queda foi registrada no journal e o sistema continuou operando localmente.'
    };
  }

  handleAuthorizedProcesses(userId, lower) {
    if (!this.recoveryManager) {
      return {
        intent: 'AUTHORIZED_PROCESSES',
        text: 'Não tenho dados suficientes dos processos autorizados no momento.'
      };
    }

    const procs = this.recoveryManager.inventoryState();
    const isAntigravitySpecific = /antigravity/i.test(lower);

    if (isAntigravitySpecific) {
      const ag = procs.antigravity;
      if (ag && ag.running) {
        return {
          intent: 'AUTHORIZED_PROCESSES',
          text: 'Sim, o Antigravity está aberto e em execução normal no host.'
        };
      } else {
        return {
          intent: 'AUTHORIZED_PROCESSES',
          text: 'Não, o Antigravity não está em execução no momento. Você pode pedir para acordá-lo se desejar.'
        };
      }
    }

    const components = Object.keys(procs).map(k => {
      const p = procs[k];
      return `${p.name}: ${p.running ? 'ativo' : 'parado'}`;
    }).join(', ');

    const text = `Estado dos processos autorizados monitorados: ${components}.`;
    this.setContext(userId, 'AUTHORIZED_PROCESSES', procs);
    return { intent: 'AUTHORIZED_PROCESSES', text };
  }

  handleLastError(userId) {
    if (!this.journal) {
      return {
        intent: 'LAST_ERROR',
        text: 'Não há journal disponível para consultar erros operacionais.'
      };
    }

    const entries = this.journal.readEntries(50);
    const errors = entries.filter(e => e.action && (e.action.includes('ERROR') || e.action.includes('FAIL')));

    if (errors.length === 0) {
      return {
        intent: 'LAST_ERROR',
        text: 'Nenhum erro operacional recente foi registrado no journal.'
      };
    }

    const last = errors[errors.length - 1];
    const safeResult = SanitizadorSegredos.sanitizarTexto(last.result || last.reason || 'Erro não especificado');
    const text = `O último erro registrado ocorreu em ${last.timestamp}: ${safeResult}.`;

    this.setContext(userId, 'LAST_ERROR', last);
    return { intent: 'LAST_ERROR', text };
  }

  handleRecoveryHistory(userId) {
    if (!this.journal) {
      return {
        intent: 'RECOVERY_HISTORY',
        text: 'Não há registro de recuperações disponível no journal.'
      };
    }

    const entries = this.journal.readEntries(100);
    const today = new Date().toISOString().split('T')[0];
    const recoveries = entries.filter(e => {
      const isToday = e.timestamp && e.timestamp.startsWith(today);
      return isToday && e.action && (e.action.includes('RECOVERY') || e.action.includes('RECOVER'));
    });

    if (recoveries.length === 0) {
      return {
        intent: 'RECOVERY_HISTORY',
        text: 'Nenhuma recuperação automática de processo foi necessária hoje. Todos os componentes autorizados operaram sem falha.'
      };
    }

    const text = `Hoje foram realizadas ${recoveries.length} ações de recuperação no sistema pelo Vigia.`;
    this.setContext(userId, 'RECOVERY_HISTORY', recoveries);
    return { intent: 'RECOVERY_HISTORY', text };
  }

  handleWakeAntigravity(userId) {
    if (!this.recoveryManager) {
      return {
        intent: 'WAKE_ANTIGRAVITY_REQUEST',
        text: 'Não foi possível acionar a recuperação: RecoveryManager indisponível.'
      };
    }

    const res = this.recoveryManager.restoreComponent('antigravity');
    let text;
    if (res.action === 'NO_OP') {
      text = 'O Antigravity já está ativo e em execução no sistema. A instância única foi preservada sem duplicações.';
    } else if (res.action === 'SPAWNED') {
      text = 'O Antigravity foi inicializado com sucesso em primeiro plano.';
    } else {
      text = `Solicitação processada: ${res.reason || res.action}.`;
    }

    this.setContext(userId, 'WAKE_ANTIGRAVITY_REQUEST', res);
    return { intent: 'WAKE_ANTIGRAVITY_REQUEST', text };
  }

  handleHelpCapabilities(userId) {
    const text = 'Eu sou o Vigia da Ponte. Você pode conversar comigo ou usar comandos:\n\n' +
      '• Você pode me perguntar: "Como está a máquina?", "A internet caiu hoje?", "O que o Antigravity está fazendo agora?", "Em que tarefa ele está trabalhando?", "Tem alguma decisão pendente?", "Quanto de memória está usando?", "O Antigravity está aberto?", ou pedir "Acorde o Antigravity".\n' +
      '• Ou usar comandos diretos: /status, /health, /internet, /processos, /antigravity, /ultimo_erro, /acordar_antigravity e /ajuda.';

    this.setContext(userId, 'HELP_CAPABILITIES', {});
    return { intent: 'HELP_CAPABILITIES', text };
  }

  async handleAntigravityActivity(userId) {
    if (!this.antigravityObserver) {
      return {
        intent: 'ANTIGRAVITY_ACTIVITY_STATUS',
        text: 'Não tenho dados suficientes para observar o Antigravity no momento.'
      };
    }
    const snapshot = await this.antigravityObserver.inspect();
    this.setContext(userId, 'ANTIGRAVITY_ACTIVITY_STATUS', snapshot);
    return {
      intent: 'ANTIGRAVITY_ACTIVITY_STATUS',
      text: snapshot.summary,
      snapshot
    };
  }

  async handleAntigravityCurrentTask(userId) {
    if (!this.antigravityObserver) {
      return {
        intent: 'ANTIGRAVITY_CURRENT_TASK',
        text: 'Não tenho dados suficientes para determinar a tarefa atual do Antigravity.'
      };
    }
    const snapshot = await this.antigravityObserver.inspect();
    let text;
    if (snapshot.current_issue_number) {
      text = `O Antigravity está vinculado à Issue #${snapshot.current_issue_number} (${snapshot.current_task_id}). Status atual do card: ${snapshot.current_card_status}.`;
    } else {
      text = 'Não há nenhuma tarefa ou Issue ativa associada ao Antigravity no momento.';
    }
    this.setContext(userId, 'ANTIGRAVITY_CURRENT_TASK', snapshot);
    return {
      intent: 'ANTIGRAVITY_CURRENT_TASK',
      text,
      snapshot
    };
  }

  async handleAntigravityLastAction(userId) {
    if (!this.antigravityObserver) {
      return {
        intent: 'ANTIGRAVITY_LAST_ACTION',
        text: 'Não há dados da última ação do Antigravity.'
      };
    }
    const snapshot = await this.antigravityObserver.inspect();
    let text;
    if (snapshot.last_action_summary) {
      text = `A última ação registrada do Antigravity foi: "${snapshot.last_action_summary}".`;
      if (snapshot.last_activity_timestamp) {
        text += ` (em ${snapshot.last_activity_timestamp})`;
      }
    } else {
      text = 'Não há registro detalhado da última ação do Antigravity disponível.';
    }
    this.setContext(userId, 'ANTIGRAVITY_LAST_ACTION', snapshot);
    return {
      intent: 'ANTIGRAVITY_LAST_ACTION',
      text,
      snapshot
    };
  }

  async handleAntigravityOwnerWait(userId) {
    if (!this.antigravityObserver) {
      return {
        intent: 'ANTIGRAVITY_OWNER_WAIT',
        text: 'Não tenho dados suficientes para checar decisões pendentes.'
      };
    }
    const snapshot = await this.antigravityObserver.inspect();
    let text;
    if (snapshot.owner_decision_required) {
      text = `Sim, há uma decisão pendente do proprietário na Issue #${snapshot.current_issue_number} (${snapshot.current_task_id}). O Antigravity aguarda sua autorização.`;
    } else {
      text = 'Não há nenhuma decisão sua pendente no momento. O Antigravity está operando dentro do escopo autorizado.';
    }
    this.setContext(userId, 'ANTIGRAVITY_OWNER_WAIT', snapshot);
    return {
      intent: 'ANTIGRAVITY_OWNER_WAIT',
      text,
      snapshot
    };
  }
}

module.exports = NaturalLanguageRouter;
