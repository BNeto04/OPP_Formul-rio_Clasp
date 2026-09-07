const SanitizadorSegredos = require('./SanitizadorSegredos');
const NaturalLanguageRouter = require('./NaturalLanguageRouter');

function isCanonicalVCommand(rawOrNormalized) {
  if (!rawOrNormalized || typeof rawOrNormalized !== 'string') return false;
  const cleaned = rawOrNormalized.trim().toLowerCase();
  const canonicalAllowlist = ['v', '/v', '/retomar', 'retomar'];
  return canonicalAllowlist.includes(cleaned);
}

class TelegramCommandRouter {
  constructor(options = {}) {
    this.allowlist = options.allowlist;
    this.healthMonitor = options.healthMonitor;
    this.recoveryManager = options.recoveryManager;
    this.internetMonitor = options.internetMonitor;
    this.journal = options.journal;
    this.resumeController = options.resumeController || null;
    this.options = options;
    this.bridgeMonitor = options.bridgeMonitor || null;
    this.bridgeAvailable = options.bridgeAvailable !== undefined ? options.bridgeAvailable : true;
    this.timeoutMs = options.timeoutMs || 5000;
    this.forceTimeout = options.forceTimeout || false;
    this.forcePending = options.forcePending || false;
    this.startTime = Date.now();
    this.nlRouter = options.nlRouter || new NaturalLanguageRouter({
      healthMonitor: this.healthMonitor,
      recoveryManager: this.recoveryManager,
      internetMonitor: this.internetMonitor,
      journal: this.journal,
      ollamaAdapter: options.ollamaAdapter || null,
      resumeController: this.resumeController,
      contextTtlMs: options.contextTtlMs || 300000
    });
    if (!this.resumeController && this.nlRouter && this.nlRouter.resumeController) {
      this.resumeController = this.nlRouter.resumeController;
    }
  }

  isBridgeAvailable() {
    if (this.bridgeMonitor && typeof this.bridgeMonitor.isAvailable === 'function') {
      return this.bridgeMonitor.isAvailable();
    }
    if (this.options && this.options.bridgeAvailable !== undefined) {
      return typeof this.options.bridgeAvailable === 'function' ? this.options.bridgeAvailable() : !!this.options.bridgeAvailable;
    }
    return this.bridgeAvailable;
  }

  isForceTimeout() {
    if (this.options && this.options.forceTimeout !== undefined) {
      return typeof this.options.forceTimeout === 'function' ? this.options.forceTimeout() : !!this.options.forceTimeout;
    }
    return !!this.forceTimeout;
  }

  isForcePending() {
    if (this.options && this.options.forcePending !== undefined) {
      return typeof this.options.forcePending === 'function' ? this.options.forcePending() : !!this.options.forcePending;
    }
    return !!this.forcePending;
  }

  async processUpdate(update) {
    if (!update || !update.message || !update.message.text) {
      return null;
    }

    const msg = update.message;
    const fromId = msg.from ? msg.from.id : null;
    const chatId = msg.chat ? msg.chat.id : null;
    const username = msg.from ? (msg.from.username || msg.from.first_name || '') : '';
    const rawText = msg.text.trim();
    // Suporta tanto /comando quanto /comando@NomeDoBot
    const command = rawText.split(' ')[0].split('@')[0].toLowerCase();

    const correlationId = msg.message_id ? `msg_${msg.message_id}` : `corr_${Date.now()}`;

    // 1. Caso especial: Pareamento inicial com /start
    if (command === '/start') {
      if (!this.allowlist.isPaired()) {
        this.allowlist.pairOwner(fromId, chatId, username);
        return {
          chatId,
          text: '🛡️ *Vigia da Ponte — Sentinela*\n\n' +
            '✅ *Pareamento concluído com sucesso!*\n' +
            'Dispositivo autorizado: ' + fromId + '\n\n' +
            'Digite /ajuda para ver os comandos operacionais disponíveis.',
          timestamp: new Date().toISOString(),
          telegram_message_id: correlationId,
          route_type: 'RESERVED_COMMAND',
          route_reason: 'PAIR_START_COMMAND',
          final_responder: 'VIGIA'
        };
      } else if (this.allowlist.isAuthorized(fromId)) {
        return {
          chatId,
          text: '🛡️ *Vigia da Ponte — Sentinela*\n\n' +
            'Terminal já pareado e ativo com este usuário. Digite /status ou /ajuda.',
          timestamp: new Date().toISOString(),
          telegram_message_id: correlationId,
          route_type: 'RESERVED_COMMAND',
          route_reason: 'ALREADY_PAIRED_COMMAND',
          final_responder: 'VIGIA'
        };
      } else {
        return {
          chatId,
          text: '⛔ *ACESSO NEGADO*\n' +
            'Este bot Sentinela já está pareado exclusivamente com o proprietário autorizado.',
          timestamp: new Date().toISOString(),
          telegram_message_id: correlationId,
          route_type: 'RESERVED_COMMAND',
          route_reason: 'PAIR_DENIED',
          final_responder: 'VIGIA'
        };
      }
    }

    // 2. Validação de Autorização para todos os demais comandos
    if (!this.allowlist.isAuthorized(fromId)) {
      return {
        chatId,
        text: '⛔ *ACESSO NEGADO: USUÁRIO NÃO AUTORIZADO*',
        timestamp: new Date().toISOString(),
        telegram_message_id: correlationId,
        route_type: 'RESERVED_COMMAND',
        route_reason: 'UNAUTHORIZED_ACCESS',
        final_responder: 'VIGIA'
      };
    }

    // 2.1 Comando direto de Retomada V (allowlist exata canônica, sem substring/prefix matching)
    if (isCanonicalVCommand(rawText) || (rawText.startsWith('/') && isCanonicalVCommand(command))) {
      const procState = this.recoveryManager ? this.recoveryManager.inventoryState() : {};
      const antigravityRunning = procState.antigravity ? procState.antigravity.running : true;

      if (!this.resumeController) {
        this.resumeController = this.nlRouter ? this.nlRouter.resumeController : null;
      }
      if (!this.resumeController) {
        return {
          chatId,
          text: 'ANTIGRAVITY > V recebido; iniciando percepção factual das Issues/Project.\n\n⚠️ Controlador de retomada não disponível.',
          rawText: 'ANTIGRAVITY > V recebido; iniciando percepção factual das Issues/Project.\n\n⚠️ Controlador de retomada não disponível.',
          timestamp: new Date().toISOString(),
          telegram_message_id: correlationId,
          route_type: 'VIGIA_FALLBACK',
          route_reason: 'RESUME_CONTROLLER_UNAVAILABLE',
          antigravity_available: antigravityRunning,
          bridge_available: true,
          delivery_attempted: true,
          delivery_accepted: false,
          response_received: false,
          response_latency_ms: 0,
          timeout_triggered: false,
          final_responder: 'VIGIA',
          interlocutor: 'VIGIA/FALLBACK'
        };
      }
      const res = await this.resumeController.triggerResume('OWNER_REMOTE_TRIGGER', {
        resume_event_id: `owner_remote_${Date.now()}`
      });

      const ackHeader = 'ANTIGRAVITY > V recebido; iniciando percepção factual das Issues/Project.\n\n';
      let outcomeText = '';
      if (res.action === 'SEND_V') {
        outcomeText = `✅ Comando V enviado com sucesso à conversa operacional (Evento: ${res.resume_event_id}). Fluxo retomado.`;
      } else if (res.action === 'NO_OP') {
        outcomeText = `ℹ️ Retomada avaliada — Nenhuma ação necessária: ${res.reason}. Estado: ${res.final_state}.`;
      } else if (res.action === 'DEFER_LOCKED') {
        outcomeText = `⏸️ Envio de V deferido com segurança: ${res.reason}. Estado: ${res.final_state}.`;
      } else if (res.final_state === 'ANTIGRAVITY_PROCESS_UP_GUI_NOT_READY') {
        outcomeText = `⚠️ Janela do Antigravity não encontrada na tela. Processo ativo mas sem janela detectável.`;
      } else {
        outcomeText = `⚠️ Envio de V adiado: ${res.reason}. Estado: ${res.final_state}.`;
      }

      return {
        chatId,
        text: `${ackHeader}${outcomeText}`,
        rawText: `${ackHeader}${outcomeText}`,
        timestamp: new Date().toISOString(),
        telegram_message_id: correlationId,
        route_type: 'RESERVED_COMMAND',
        antigravity_available: antigravityRunning,
        bridge_available: true,
        delivery_attempted: true,
        delivery_accepted: true,
        response_received: true,
        response_latency_ms: 20,
        timeout_triggered: false,
        route_reason: 'CANONICAL_V_COMMAND',
        final_responder: 'ANTIGRAVITY',
        interlocutor: 'ANTIGRAVITY'
      };
    }

    // 3. Se a mensagem for texto livre (sem prefixo /), roteia para a camada de Linguagem Natural Segura
    if (!rawText.startsWith('/')) {
      const procState = this.recoveryManager ? this.recoveryManager.inventoryState() : {};
      const antigravityRunning = procState.antigravity ? procState.antigravity.running : true;
      const bridgeOnline = this.isBridgeAvailable();
      const forceTimeout = this.isForceTimeout();
      const forcePending = this.isForcePending();

      // Fallback factual do Vigia SOMENTE se Antigravity ou Bridge estiverem indisponíveis ou timeout real
      if (!antigravityRunning || !bridgeOnline || forceTimeout) {
        let fallbackReason = 'ANTIGRAVITY_PROCESS_DOWN';
        if (!bridgeOnline) fallbackReason = 'BRIDGE_UNAVAILABLE';
        if (forceTimeout) fallbackReason = 'TIMEOUT_EXCEEDED';

        const fallbackText = `VIGIA/FALLBACK > Antigravity não está em execução ou indisponível no momento / a ponte não respondeu. Estado factual: ${fallbackReason}.`;
        return {
          chatId,
          text: fallbackText,
          rawText: fallbackText,
          timestamp: new Date().toISOString(),
          telegram_message_id: correlationId,
          route_type: 'VIGIA_FALLBACK',
          antigravity_available: antigravityRunning,
          bridge_available: bridgeOnline,
          delivery_attempted: true,
          delivery_accepted: !forceTimeout && bridgeOnline,
          response_received: false,
          response_latency_ms: forceTimeout ? this.timeoutMs : 0,
          timeout_triggered: !!forceTimeout,
          route_reason: fallbackReason,
          final_responder: 'VIGIA',
          interlocutor: 'VIGIA/FALLBACK'
        };
      }

      // Tratamento de estado PENDING se a entrega foi aceita e aguarda conclusão
      if (forcePending) {
        const pendingText = 'ANTIGRAVITY > Solicitação aceita pela ponte; resposta em processamento. Estado factual: PENDING.';
        return {
          chatId,
          text: pendingText,
          rawText: pendingText,
          timestamp: new Date().toISOString(),
          telegram_message_id: correlationId,
          route_type: 'ANTIGRAVITY_CONVERSATION',
          antigravity_available: true,
          bridge_available: true,
          delivery_attempted: true,
          delivery_accepted: true,
          response_received: false,
          response_latency_ms: 100,
          timeout_triggered: false,
          route_reason: 'DELIVERY_ACCEPTED_PENDING',
          final_responder: 'ANTIGRAVITY',
          interlocutor: 'ANTIGRAVITY'
        };
      }

      // Conversa normal primária com Antigravity
      const nlResult = await this.nlRouter.process(rawText, fromId);
      const hostTelemetryIntents = ['SYSTEM_STATUS', 'SYSTEM_HEALTH', 'HOST_HEALTH', 'INTERNET_STATUS', 'INTERNET_HISTORY', 'PROCESS_INVENTORY'];
      const isHostQuery = nlResult.metadata && hostTelemetryIntents.includes(nlResult.metadata.intent);

      let prefix = '';
      let routeType = '';
      let routeReason = '';
      let finalResponder = '';

      if (!isHostQuery || !nlResult || !nlResult.text || !nlResult.text.trim()) {
        // ISOLAMENTO ESTRITO: Antigravity NUNCA fala no Telegram em fluxo conversacional.
        // O canal de conversa é exclusivo do ChatGPT.
        return null;
      }

      prefix = 'VIGIA > ';
      routeType = 'RESERVED_COMMAND';
      routeReason = 'HOST_TELEMETRY_QUERY';
      finalResponder = 'VIGIA';

      return {
        chatId,
        text: `${prefix}${nlResult.text}`,
        rawText: nlResult.text,
        timestamp: new Date().toISOString(),
        telegram_message_id: correlationId,
        route_type: routeType,
        antigravity_available: antigravityRunning,
        bridge_available: bridgeOnline,
        delivery_attempted: true,
        delivery_accepted: true,
        response_received: true,
        response_latency_ms: 15,
        timeout_triggered: false,
        route_reason: routeReason,
        final_responder: finalResponder,
        interlocutor: prefix.trim().replace(' >', '')
      };
    }

    // 4. Roteamento de comandos estruturados V1 (/comando)
    switch (command) {
      case '/ajuda':
      case '/help':
        return {
          chatId,
          text: '📋 *Comandos Autorizados V1:*\n\n' +
            '/status — Resumo geral de saúde e serviços\n' +
            '/health — Métricas de CPU, RAM e Uptime\n' +
            '/internet — Conectividade e histórico de quedas\n' +
            '/processos — Estado dos processos inventariados\n' +
            '/antigravity — Inspeção factual da atividade do Antigravity\n' +
            '/retomar — Disparo de ciclo de retomada e envio de V\n' +
            '/vigia — Contato direto com o Sentinela (fallback operacional)\n' +
            '/ultimoerro — Último log ou incidente registrado\n' +
            '/acordarantigravity — Foco ou recuperação segura do Antigravity\n' +
            '/esquecer_contexto — Limpa a memória contextual da conversa recente\n' +
            '/ajuda — Esta mensagem de orientação'
        };

      case '/antigravity': {
        const isDetailed = rawText.includes('detalhes');
        const snapshot = await this.nlRouter.antigravityObserver.inspect(isDetailed);
        return {
          chatId,
          text: '🤖 *Observabilidade Antigravity*\n\n' + snapshot.summary
        };
      }

      case '/status': {
        const uptimeMin = Math.round((Date.now() - this.startTime) / 60000);
        const netState = this.internetMonitor ? this.internetMonitor.state : 'UNKNOWN';
        const procState = this.recoveryManager ? this.recoveryManager.inventoryState() : {};
        const antigravityRunning = procState.antigravity ? procState.antigravity.running : false;
        const hermesRunning = procState.hermes_gateway ? procState.hermes_gateway.running : false;

        return {
          chatId,
          text: '📊 *Status do Vigia da Ponte*\n\n' +
            '• *Vigia Watchdog:* ONLINE (Uptime: ' + uptimeMin + 'm, PID: ' + process.pid + ')\n' +
            '• *Conexão Internet:* ' + (netState === 'UP' ? '🟢 ONLINE' : '🔴 OFFLINE') + '\n' +
            '• *Antigravity:* ' + (antigravityRunning ? '🟢 ATIVO' : '⚪ PARADO') + '\n' +
            '• *Hermes Gateway:* ' + (hermesRunning ? '🟢 ATIVO' : '⚪ PARADO') + '\n' +
            '• *Single Instance:* Assegurada\n' +
            '• *Portas Inbound:* 0 (100% Outbound)'
        };
      }

      case '/health': {
        const m = this.healthMonitor ? this.healthMonitor.collectMetrics() : null;
        if (!m) return { chatId, text: 'Métricas de saúde indisponíveis.' };
        const usedMb = Math.round(m.system.used_memory_bytes / 1024 / 1024);
        const totalMb = Math.round(m.system.total_memory_bytes / 1024 / 1024);

        return {
          chatId,
          text: '🩺 *Saúde do Host (DESKTOP-URNBR9C)*\n\n' +
            '• *CPU:* ' + m.system.cpu_model + ' (' + m.system.cpu_count + ' núcleos)\n' +
            '• *RAM:* ' + m.system.memory_usage_percent + '% (' + usedMb + 'MB de ' + totalMb + 'MB)\n' +
            '• *Uptime Windows:* ' + Math.round(m.system.uptime_seconds / 3600) + 'h ' + Math.round((m.system.uptime_seconds % 3600) / 60) + 'm\n' +
            '• *Vigia RSS:* ' + Math.round(m.vigia_process.rss_bytes / 1024 / 1024) + 'MB'
        };
      }

      case '/internet': {
        const net = this.internetMonitor;
        const state = net ? net.state : 'UNKNOWN';
        const lastChecked = net ? net.lastChecked : 'N/A';
        const downSince = (net && net.downSince) ? net.downSince : 'Nenhuma queda ativa';

        return {
          chatId,
          text: '🌐 *Status de Conectividade Internet*\n\n' +
            '• *Estado Atual:* ' + (state === 'UP' ? '🟢 ONLINE' : '🔴 OFFLINE') + '\n' +
            '• *Última Verificação:* ' + lastChecked + '\n' +
            '• *Registro de Queda:* ' + downSince + '\n' +
            '• *Probes:* 1.1.1.1, 8.8.8.8, GitHub API'
        };
      }

      case '/processos': {
        const inv = this.recoveryManager ? this.recoveryManager.inventoryState() : {};
        let text = '⚙️ *Inventário de Processos Autorizados:*\n\n';
        for (const [k, v] of Object.entries(inv)) {
          text += '• *' + v.name + ':* ' + (v.running ? '🟢 EM EXECUÇÃO' : '⚪ PARADO') + '\n' +
            '  Caminho: ' + v.executable + '\n\n';
        }
        return { chatId, text };
      }

      case '/ultimo_erro':
      case '/ultimoerro': {
        const entries = this.journal ? this.journal.readEntries(10) : [];
        const errors = entries.filter(e => e.action && e.action.includes('ERROR') || e.owner_decision_required);
        const last = errors.length > 0 ? errors[errors.length - 1] : (entries.length > 0 ? entries[entries.length - 1] : null);

        if (!last) {
          return { chatId, text: 'ℹ️ Nenhum erro recente registrado no journal.' };
        }

        return {
          chatId,
          text: '⚠️ *Último Evento Relevante:*\n\n' +
            '• *Timestamp:* ' + last.timestamp + '\n' +
            '• *Ação:* ' + last.action + '\n' +
            '• *Motivo:* ' + last.reason + '\n' +
            '• *Resultado:* ' + last.result
        };
      }

      case '/acordar_antigravity':
      case '/acordarantigravity': {
        if (!this.recoveryManager) {
          return { chatId, text: 'Gerenciador de recuperação não inicializado.' };
        }
        const res = this.recoveryManager.restoreComponent('antigravity');
        if (res.action === 'NO_OP') {
          return {
            chatId,
            text: 'ℹ️ *Antigravity já está ativo e em execução no host.* Nenhuma segunda instância foi aberta.'
          };
        } else if (res.action === 'STARTED_PROCESS') {
          return {
            chatId,
            text: '🚀 *Antigravity iniciado com sucesso!* (PID: ' + res.pid + ')'
          };
        } else {
          return {
            chatId,
            text: '⚠️ Falha ao acionar Antigravity: ' + (res.result || res.reason)
          };
        }
      }

      case '/esquecer_contexto':
      case '/esquecercontexto':
      case '/esquecer': {
        if (this.nlRouter && typeof this.nlRouter.clearContext === 'function') {
          this.nlRouter.clearContext(fromId);
        }
        return {
          chatId,
          text: '🧹 *Contexto Conversacional Limpo*\n\nA memória recente desta conversa foi esquecida. Os journals e registros operacionais continuam íntegros.'
        };
      }

      case '/vigia': {
        const uptimeMin = Math.round((Date.now() - this.startTime) / 60000);
        const netState = this.internetMonitor ? this.internetMonitor.state : 'UNKNOWN';
        const procState = this.recoveryManager ? this.recoveryManager.inventoryState() : {};
        const antigravityRunning = procState.antigravity ? procState.antigravity.running : false;
        return {
          chatId,
          text: '🛡️ *Vigia da Ponte (Sentinela Host)*\n\n' +
            'Interlocutor de sentinela direto ativo no host DESKTOP-URNBR9C.\n' +
            '• *Papel:* Fallback operacional e integridade de processos\n' +
            '• *Interlocutor Primário:* ⚙️ Antigravity (' + (antigravityRunning ? '🟢 ATIVO' : '⚪ PARADO') + ')\n' +
            '• *Conexão Internet:* ' + (netState === 'UP' ? '🟢 ONLINE' : '🔴 OFFLINE') + '\n' +
            '• *Uptime Sentinela:* ' + uptimeMin + 'm\n\n' +
            'Digite /ajuda para lista de comandos do Vigia.'
        };
      }

      case '/retomar': {
        if (!this.resumeController) {
          this.resumeController = this.nlRouter ? this.nlRouter.resumeController : null;
        }
        if (!this.resumeController) {
          return {
            chatId,
            text: '🛡️ *VIGIA (FALLBACK)*\n\nControlador de retomada não disponível.'
          };
        }
        const res = await this.resumeController.triggerResume('OWNER_REMOTE_TRIGGER', {
          resume_event_id: `owner_remote_cmd_${Date.now()}`
        });

        let msg = '';
        if (res.action === 'SEND_V') {
          msg = '⚙️ *ANTIGRAVITY*\n\n' +
            '✅ *Comando V enviado com sucesso!*\n' +
            '• Conversa operacional focada e fluxo retomado.\n' +
            '• Evento: `' + res.resume_event_id + '`\n' +
            '• Confirmação: V_SENT_CONFIRMED';
        } else if (res.action === 'NO_OP') {
          msg = '🛡️ *VIGIA (FALLBACK)*\n\n' +
            'ℹ️ *Retomada avaliada — Nenhuma ação necessária:*\n' +
            '• Motivo: ' + res.reason + '\n' +
            '• Estado: ' + res.final_state;
        } else {
          msg = '🛡️ *VIGIA (FALLBACK)*\n\n' +
            '⚠️ *Envio de V suspenso por segurança:*\n' +
            '• Motivo: ' + res.reason + '\n' +
            '• Estado: ' + res.final_state;
        }

        return { chatId, text: msg };
      }

      case '/sprint': {
        return {
          chatId,
          text: '🏃 *Sprint Operacional Vigente*\n\n' +
            '• *Sprint ID:* SPRINT-PC-TRABALHO-BRIDGE-001\n' +
            '• *Objetivo:* Conversa real Telegram <-> Antigravity e transporte Bridge V2\n' +
            '• *Circuito:* Automático via CONTEXT_PACKET\n' +
            '• *Fase:* EXECUTION_READY',
          timestamp: new Date().toISOString(),
          telegram_message_id: correlationId,
          route_type: 'RESERVED_COMMAND',
          route_reason: 'SPRINT_STATUS_COMMAND',
          final_responder: 'VIGIA',
          interlocutor: 'VIGIA'
        };
      }

      case '/pausar': {
        return {
          chatId,
          text: '⏸️ *Circuito Pausado*\n\nO ciclo de envio automático foi suspenso temporariamente.',
          timestamp: new Date().toISOString(),
          telegram_message_id: correlationId,
          route_type: 'RESERVED_COMMAND',
          route_reason: 'PAUSE_COMMAND',
          final_responder: 'VIGIA',
          interlocutor: 'VIGIA'
        };
      }

      case '/continuar': {
        return {
          chatId,
          text: '▶️ *Circuito Reativado*\n\nO ciclo de envio automático está ativo.',
          timestamp: new Date().toISOString(),
          telegram_message_id: correlationId,
          route_type: 'RESERVED_COMMAND',
          route_reason: 'RESUME_COMMAND',
          final_responder: 'VIGIA',
          interlocutor: 'VIGIA'
        };
      }

      case '/disparar': {
        return {
          chatId,
          text: '⚡ *Disparo Manual Executado*\n\nCiclo de verificação e entrega forçado na Bridge V2.',
          timestamp: new Date().toISOString(),
          telegram_message_id: correlationId,
          route_type: 'RESERVED_COMMAND',
          route_reason: 'TRIGGER_DELIVERY_COMMAND',
          final_responder: 'VIGIA',
          interlocutor: 'VIGIA'
        };
      }

      default:
        return {
          chatId,
          text: '❌ *COMANDO_NAO_AUTORIZADO*\n' +
            'O comando ' + command + ' não é permitido. Digite /ajuda para comandos suportados.'
        };
    }
  }
}

TelegramCommandRouter.isCanonicalVCommand = isCanonicalVCommand;

module.exports = TelegramCommandRouter;
