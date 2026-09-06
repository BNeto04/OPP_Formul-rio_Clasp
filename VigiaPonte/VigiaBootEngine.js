const LockManager = require('./LockManager');
const HealthMonitor = require('./HealthMonitor');
const InternetMonitor = require('./InternetMonitor');
const RecoveryManager = require('./RecoveryManager');
const BootRecoveryJournal = require('./BootRecoveryJournal');
const RemoteInterfaceStub = require('./RemoteInterfaceStub');
const TelegramConfig = require('./TelegramConfig');
const TelegramClient = require('./TelegramClient');
const TelegramAllowlist = require('./TelegramAllowlist');
const TelegramCommandRouter = require('./TelegramCommandRouter');
const TelegramAlertManager = require('./TelegramAlertManager');
const TelegramPoller = require('./TelegramPoller');
const OperationalResumeController = require('./OperationalResumeController');
const BridgeTelegramCallObserver = require('./BridgeTelegramCallObserver');

class VigiaBootEngine {
  constructor(options = {}) {
    this.sessionId = options.sessionId || `boot_${Date.now()}_${process.pid}`;
    this.lockManager = new LockManager({ sessionId: this.sessionId, lockFilePath: options.lockFilePath });
    this.healthMonitor = new HealthMonitor();
    this.internetMonitor = new InternetMonitor({
      timeoutMs: options.internetTimeoutMs || 2500,
      customProbe: options.customInternetProbe
    });
    this.recoveryManager = new RecoveryManager({
      customProcessChecker: options.customProcessChecker,
      customSpawner: options.customSpawner
    });
    this.journal = new BootRecoveryJournal({ journalPath: options.journalPath });
    this.remoteStub = new RemoteInterfaceStub();

    // Integração Telegram (fail-open para o watchdog local)
    try {
      const token = options.telegramToken || TelegramConfig.getBotToken();
      if (token) {
        this.telegramClient = new TelegramClient(token);
        this.telegramAllowlist = new TelegramAllowlist({
          allowlistPath: options.telegramAllowlistPath || TelegramConfig.getAllowlistPath()
        });
        this.telegramAlertManager = new TelegramAlertManager({
          client: this.telegramClient,
          allowlist: this.telegramAllowlist
        });
        this.resumeController = options.resumeController || new OperationalResumeController({
          recoveryManager: this.recoveryManager,
          internetMonitor: this.internetMonitor,
          telegramAlertManager: this.telegramAlertManager,
          journalPath: options.resumeJournalPath
        });
        this.telegramRouter = new TelegramCommandRouter({
          allowlist: this.telegramAllowlist,
          healthMonitor: this.healthMonitor,
          recoveryManager: this.recoveryManager,
          internetMonitor: this.internetMonitor,
          journal: this.journal,
          resumeController: this.resumeController
        });
        this.telegramPoller = new TelegramPoller({
          client: this.telegramClient,
          router: this.telegramRouter
        });
        this.bridgeCallObserver = new BridgeTelegramCallObserver({
          client: this.telegramClient,
          allowlist: this.telegramAllowlist,
          recoveryManager: this.recoveryManager,
          bridgeAvailable: options.bridgeAvailable !== undefined ? options.bridgeAvailable : true
        });
      }
    } catch (err) {
      // remote_fail_open_for_local_watchdog = true
    }

    if (!this.resumeController) {
      this.resumeController = options.resumeController || new OperationalResumeController({
        recoveryManager: this.recoveryManager,
        internetMonitor: this.internetMonitor,
        telegramAlertManager: this.telegramAlertManager || null,
        journalPath: options.resumeJournalPath
      });
    }

    this.pollIntervalMs = options.pollIntervalMs || 15000;
    this.isRunning = false;
    this.timer = null;
    this.retryCount = 0;
  }

  async runBootSequence(dryRun = false) {
    // 1. Single-Instance Check
    const lockResult = this.lockManager.acquireLock();
    if (!lockResult.acquired) {
      this.journal.recordEntry({
        boot_session_id: this.sessionId,
        action: 'NO_OP',
        reason: 'DUPLICATE_INSTANCE_PREVENTED',
        result: `Active PID: ${lockResult.activePid}`,
        owner_decision_required: false
      });
      return {
        success: false,
        reason: 'ALREADY_RUNNING',
        activePid: lockResult.activePid
      };
    }

    if (lockResult.recoveredOrphan) {
      this.journal.recordEntry({
        boot_session_id: this.sessionId,
        action: 'RECOVER_ORPHAN_LOCK',
        reason: 'PREVIOUS_PID_DEAD',
        result: `Recovered from PID: ${lockResult.previousPid}`,
        owner_decision_required: false
      });
    }

    // 2. Health Check
    const health = this.healthMonitor.collectMetrics();

    // 3. Internet Connectivity Check
    const netStatus = await this.internetMonitor.check();

    // 4. Inventory Authorized Components
    const procStateBefore = this.recoveryManager.inventoryState();

    // 5. Recovery of Authorized Components
    const recoveryResults = {};
    for (const compKey of Object.keys(this.recoveryManager.authorizedComponents)) {
      const rec = this.recoveryManager.restoreComponent(compKey, dryRun);
      recoveryResults[compKey] = rec;
    }

    // 6. Inventory After Recovery
    const procStateAfter = this.recoveryManager.inventoryState();

    // 7. Journal Entry
    this.journal.recordEntry({
      boot_session_id: this.sessionId,
      internet_state: netStatus.state,
      process_state_before: procStateBefore,
      process_state_after: procStateAfter,
      action: 'BOOT_RECOVERY_SEQUENCE_COMPLETED',
      reason: 'SYSTEM_BOOT_OR_STARTUP',
      result: 'RECOVERY_EVALUATED',
      retry_count: this.retryCount,
      owner_decision_required: false
    });

    // 8. Ciclo de Retomada Operacional Canônico pós-boot
    let resumeResult = null;
    if (this.resumeController && typeof this.resumeController.triggerResume === 'function') {
      try {
        resumeResult = await this.resumeController.triggerResume('BOOT_RECOVERY', {
          resume_event_id: `boot_${this.sessionId}`
        });
      } catch (e) {
        // fail-open
      }
    }

    return {
      success: true,
      sessionId: this.sessionId,
      health,
      internet: netStatus,
      procStateBefore,
      recoveryResults,
      procStateAfter,
      resumeResult
    };
  }

  async startContinuousMonitoring(dryRun = false) {
    if (this.isRunning) return { success: false, reason: 'ALREADY_MONITORING' };
    this.isRunning = true;

    const bootRes = await this.runBootSequence(dryRun);
    if (!bootRes || !bootRes.success) {
      this.isRunning = false;
      return bootRes;
    }

    if (this.telegramPoller) {
      try {
        this.telegramPoller.start();
        if (this.telegramAlertManager) {
          this.telegramAlertManager.sendAlert('VIGIA_ONLINE', '🛡️ *Vigia da Ponte ativo e conectado.*\n\nSistema online e monitoramento contínuo iniciado.');
        }
      } catch (e) {
        // fail-open
      }
    }

    this.timer = setInterval(async () => {
      if (!this.isRunning) return;
      try {
        // 1. Verificação de Conectividade
        const netStatus = await this.internetMonitor.check();
        if (netStatus.event) {
          this.journal.recordEntry({
            boot_session_id: this.sessionId,
            internet_state: netStatus.state,
            action: netStatus.event.type,
            reason: netStatus.event.type === 'INTERNET_DOWN' ? 'CONNECTIVITY_LOST' : 'CONNECTIVITY_RESTORED',
            result: `Evidence probes evaluated: ${JSON.stringify(netStatus.evidence)}`,
            retry_count: 0,
            owner_decision_required: false
          });

          if (this.telegramAlertManager) {
            if (netStatus.event.type === 'INTERNET_DOWN') {
              this.telegramAlertManager.sendAlert('INTERNET_DOWN', '⚠️ *ALERTA DE CONECTIVIDADE*\n\nConexão com a Internet perdida no host.');
            } else if (netStatus.event.type === 'INTERNET_UP') {
              this.telegramAlertManager.sendAlert('INTERNET_UP', '✅ *CONECTIVIDADE RESTAURADA*\n\nConexão com a Internet restabelecida com sucesso.');
            }
          }

          if (netStatus.event.type === 'INTERNET_UP') {
            if (this.resumeController && typeof this.resumeController.triggerResume === 'function') {
              try {
                await this.resumeController.triggerResume('INTERNET_RETURN', {
                  resume_event_id: `net_return_${Date.now()}`
                });
              } catch (e) {}
            }
          }
        }

        // 2. Verificação de Processos Autorizados
        const procNow = this.recoveryManager.inventoryState();
        if (!procNow.antigravity || !procNow.antigravity.running) {
          const recRes = this.recoveryManager.restoreComponent('antigravity', dryRun);
          if (recRes && recRes.action === 'STARTED_PROCESS') {
            if (this.resumeController && typeof this.resumeController.triggerResume === 'function') {
              try {
                await this.resumeController.triggerResume('ANTIGRAVITY_RECOVERY', {
                  resume_event_id: `ag_recovery_${Date.now()}`
                });
              } catch (e) {}
            }
          }
        }
      } catch (err) {
        // fail-open: não morre nem trava
      }
    }, this.pollIntervalMs);
  }

  async notifyCallReceived(callPacket) {
    if (this.bridgeCallObserver) {
      return await this.bridgeCallObserver.onCallReceived(callPacket);
    }
    return { handled: false, reason: 'NO_OBSERVER' };
  }

  async notifyResultDelivered(resultPacket) {
    if (this.bridgeCallObserver) {
      return await this.bridgeCallObserver.onResultDelivered(resultPacket);
    }
    return { handled: false, reason: 'NO_OBSERVER' };
  }

  stop() {
    this.isRunning = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.telegramPoller) {
      try {
        this.telegramPoller.stop();
      } catch (e) {}
    }
    this.lockManager.releaseLock();
  }
}

module.exports = VigiaBootEngine;

if (require.main === module) {
  const engine = new VigiaBootEngine();
  engine.startContinuousMonitoring().then(res => {
    if (res && res.success === false) {
      console.warn(`[VigiaBootEngine] Instância duplicada evitada: ${res.reason} (PID ativo: ${res.activePid}). Encerrando processo.`);
      process.exit(0);
    }
  }).catch(err => {
    console.error(`[VigiaBootEngine] Falha fatal no boot:`, err);
    process.exit(1);
  });

  process.on('SIGINT', () => { engine.stop(); process.exit(0); });
  process.on('SIGTERM', () => { engine.stop(); process.exit(0); });
}
