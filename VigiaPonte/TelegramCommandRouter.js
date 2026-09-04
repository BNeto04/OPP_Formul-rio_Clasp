const SanitizadorSegredos = require('./SanitizadorSegredos');
const NaturalLanguageRouter = require('./NaturalLanguageRouter');

class TelegramCommandRouter {
  constructor(options = {}) {
    this.allowlist = options.allowlist;
    this.healthMonitor = options.healthMonitor;
    this.recoveryManager = options.recoveryManager;
    this.internetMonitor = options.internetMonitor;
    this.journal = options.journal;
    this.startTime = Date.now();
    this.nlRouter = options.nlRouter || new NaturalLanguageRouter({
      healthMonitor: this.healthMonitor,
      recoveryManager: this.recoveryManager,
      internetMonitor: this.internetMonitor,
      journal: this.journal,
      ollamaAdapter: options.ollamaAdapter || null,
      contextTtlMs: options.contextTtlMs || 300000
    });
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

    // 1. Caso especial: Pareamento inicial com /start
    if (command === '/start') {
      if (!this.allowlist.isPaired()) {
        this.allowlist.pairOwner(fromId, chatId, username);
        return {
          chatId,
          text: '🛡️ *Vigia da Ponte — Sentinela*\n\n' +
            '✅ *Pareamento concluído com sucesso!*\n' +
            'Dispositivo autorizado: ' + fromId + '\n\n' +
            'Digite /ajuda para ver os comandos operacionais disponíveis.'
        };
      } else if (this.allowlist.isAuthorized(fromId)) {
        return {
          chatId,
          text: '🛡️ *Vigia da Ponte — Sentinela*\n\n' +
            'Terminal já pareado e ativo com este usuário. Digite /status ou /ajuda.'
        };
      } else {
        return {
          chatId,
          text: '⛔ *ACESSO NEGADO*\n' +
            'Este bot Sentinela já está pareado exclusivamente com o proprietário autorizado.'
        };
      }
    }

    // 2. Validação de Autorização para todos os demais comandos
    if (!this.allowlist.isAuthorized(fromId)) {
      return {
        chatId,
        text: '⛔ *ACESSO NEGADO: USUÁRIO NÃO AUTORIZADO*'
      };
    }

    // 3. Se a mensagem for texto livre (sem prefixo /), roteia para a camada de Linguagem Natural Segura
    if (!rawText.startsWith('/')) {
      const nlResult = await this.nlRouter.process(rawText, fromId);
      return {
        chatId,
        text: nlResult.text
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
            '/ultimoerro — Último log ou incidente registrado\n' +
            '/acordarantigravity — Foco ou recuperação segura do Antigravity\n' +
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

      default:
        return {
          chatId,
          text: '❌ *COMANDO_NAO_AUTORIZADO*\n' +
            'O comando ' + command + ' não é permitido. Digite /ajuda para comandos suportados.'
        };
    }
  }
}

module.exports = TelegramCommandRouter;
