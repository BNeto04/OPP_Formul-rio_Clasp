const http = require('http');
const path = require('path');
const HealthMonitor = require('./HealthMonitor');
const TelegramConfig = require('./TelegramConfig');
const TelegramClient = require('./TelegramClient');
const TelegramAllowlist = require('./TelegramAllowlist');
const SanitizadorSegredos = require('./SanitizadorSegredos');

class VigiaHealthWatchdog {
  constructor(options = {}) {
    this.bridgeHost = options.bridgeHost || '127.0.0.1';
    this.bridgePort = options.bridgePort || 8765;
    this.healthMonitor = options.healthMonitor || new HealthMonitor();
    this.telegramClient = options.telegramClient || (TelegramConfig.getBotToken() ? new TelegramClient(TelegramConfig.getBotToken()) : null);
    this.allowlist = options.allowlist || new TelegramAllowlist(TelegramConfig.getAllowlistPath());
    this.currentState = 'HEALTHY_SILENT';
    this.lastDegradedReason = null;
    this.lastCheckResult = null;
    this.healthHistory = [];
  }

  async checkBridgeHealth() {
    return new Promise((resolve) => {
      const req = http.get(`http://${this.bridgeHost}:${this.bridgePort}/status`, (res) => {
        if (res.statusCode === 200) {
          resolve({ healthy: true });
        } else {
          resolve({ healthy: false, reason: `HTTP_${res.statusCode}` });
        }
      });
      req.on('error', (err) => resolve({ healthy: false, reason: err.message }));
      req.setTimeout(2500, () => {
        req.destroy();
        resolve({ healthy: false, reason: 'TIMEOUT' });
      });
    });
  }

  async evaluateHealth(mockOverrides = {}) {
    const sysMetrics = this.healthMonitor.collectMetrics();
    const isSystemHealthy = mockOverrides.systemHealthy !== undefined 
      ? mockOverrides.systemHealthy 
      : sysMetrics.healthy;

    const bridgeCheck = mockOverrides.bridgeHealthy !== undefined 
      ? { healthy: mockOverrides.bridgeHealthy, reason: mockOverrides.bridgeReason || 'SIMULATED_FAILURE' }
      : await this.checkBridgeHealth();

    const networkHealthy = mockOverrides.networkHealthy !== undefined 
      ? mockOverrides.networkHealthy 
      : true;

    const gravityHealthy = mockOverrides.gravityHealthy !== undefined
      ? mockOverrides.gravityHealthy
      : true;

    const allHealthy = isSystemHealthy && bridgeCheck.healthy && networkHealthy && gravityHealthy;

    let failedComponent = null;
    let failureReason = null;

    if (!networkHealthy) {
      failedComponent = 'NETWORK';
      failureReason = mockOverrides.networkReason || 'NETWORK_DISCONNECTED';
    } else if (!bridgeCheck.healthy) {
      failedComponent = 'BRIDGE';
      failureReason = bridgeCheck.reason;
    } else if (!gravityHealthy) {
      failedComponent = 'GRAVITY';
      failureReason = mockOverrides.gravityReason || 'UNRESPONSIVE';
    } else if (!isSystemHealthy) {
      failedComponent = 'SYSTEM_RESOURCES';
      failureReason = 'HIGH_MEMORY_PRESSURE';
    }

    this.lastCheckResult = {
      timestamp: new Date().toISOString(),
      healthy: allHealthy,
      components: {
        network: networkHealthy,
        bridge: bridgeCheck.healthy,
        gravity: gravityHealthy,
        system: isSystemHealthy
      },
      failed_component: failedComponent,
      failure_reason: failureReason
    };

    return this.lastCheckResult;
  }

  async processHealthCycle(mockOverrides = {}, customChatId = null) {
    const evalResult = await this.evaluateHealth(mockOverrides);
    const authorizedUser = this.allowlist.getAuthorizedUser();
    const targetChatId = customChatId || authorizedUser?.authorized_chat_id;

    // Caso 1: Estava degradado e recuperou -> Transição para HEALTHY_SILENT
    if (evalResult.healthy && this.currentState !== 'HEALTHY_SILENT') {
      const recEventId = `EVT_HEALTH_REC_${Date.now()}`;
      const recPayload = `VIGIA/FALLBACK > RECUPERAÇÃO DE SAÚDE: Componente ${this.lastDegradedComponent || 'SUBSYSTEM'} restabelecido. Devolvendo fluxo normal. [${recEventId}]`;

      this.currentState = 'HEALTHY_SILENT';
      this.lastDegradedReason = null;

      let tgSent = false;
      if (targetChatId && this.telegramClient) {
        try {
          const res = await this.telegramClient.sendMessage(targetChatId, recPayload, null);
          tgSent = !!(res && res.ok);
        } catch (e) {}
      }

      return {
        transition: 'RECOVERED_TO_HEALTHY',
        state: 'HEALTHY_SILENT',
        event_id: recEventId,
        telegram_notified: tgSent,
        details: evalResult
      };
    }

    // Caso 2: Falha factual detectada -> Transição para DEGRADED
    if (!evalResult.healthy && this.currentState === 'HEALTHY_SILENT') {
      const degEventId = `EVT_HEALTH_DEG_${Date.now()}`;
      this.currentState = 'DEGRADED';
      this.lastDegradedComponent = evalResult.failed_component;
      this.lastDegradedReason = evalResult.failure_reason;

      const degPayload = `VIGIA/FALLBACK > ALERTA DE SAÚDE: Falha detectada em ${evalResult.failed_component}. Motivo: ${evalResult.failure_reason}. Modo sentinela ativo sem assumir execução. [${degEventId}]`;

      let tgSent = false;
      if (targetChatId && this.telegramClient) {
        try {
          const res = await this.telegramClient.sendMessage(targetChatId, degPayload, null);
          tgSent = !!(res && res.ok);
        } catch (e) {}
      }

      return {
        transition: 'DEGRADED_TRIGGERED',
        state: 'DEGRADED',
        event_id: degEventId,
        component: evalResult.failed_component,
        reason: evalResult.failure_reason,
        telegram_notified: tgSent,
        details: evalResult
      };
    }

    // Caso 3: Permanece saudável e silencioso
    if (evalResult.healthy) {
      return {
        transition: 'NO_OP_SILENT',
        state: 'HEALTHY_SILENT',
        message: 'Vigia permanece silencioso enquanto saudável.'
      };
    }

    // Caso 4: Permanece degradado (evita spam por dedupe de estado)
    return {
      transition: 'ALREADY_DEGRADED_COOLDOWN',
      state: 'DEGRADED',
      component: this.lastDegradedComponent,
      reason: this.lastDegradedReason
    };
  }
}

module.exports = VigiaHealthWatchdog;
