const LockManager = require('./LockManager');
const HealthMonitor = require('./HealthMonitor');
const InternetMonitor = require('./InternetMonitor');
const RecoveryManager = require('./RecoveryManager');
const BootRecoveryJournal = require('./BootRecoveryJournal');
const RemoteInterfaceStub = require('./RemoteInterfaceStub');

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

    return {
      success: true,
      sessionId: this.sessionId,
      health,
      internet: netStatus,
      procStateBefore,
      recoveryResults,
      procStateAfter
    };
  }

  async startContinuousMonitoring(dryRun = false) {
    if (this.isRunning) return;
    this.isRunning = true;

    await this.runBootSequence(dryRun);

    this.timer = setInterval(async () => {
      if (!this.isRunning) return;
      try {
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
        }
      } catch (err) {
        // fail-open: não morre nem trava
      }
    }, this.pollIntervalMs);
  }

  stop() {
    this.isRunning = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.lockManager.releaseLock();
  }
}

module.exports = VigiaBootEngine;
