const { execSync, spawn } = require('child_process');
const fs = require('fs');

class RecoveryManager {
  constructor(options = {}) {
    this.customProcessChecker = options.customProcessChecker || null;
    this.customSpawner = options.customSpawner || null;

    // Inventário factual de componentes autorizados no nó DESKTOP-URNBR9C
    this.authorizedComponents = {
      'antigravity': {
        name: 'Antigravity',
        executable: 'C:\\Users\\Bneto04\\AppData\\Local\\Programs\\Antigravity\\Antigravity.exe',
        processFilter: 'Antigravity.exe',
        type: 'GUI_SESSION',
        requiresLogonSession: true
      },
      'hermes_gateway': {
        name: 'HermesGateway',
        executable: 'wscript.exe',
        args: ['C:\\Users\\Bneto04\\AppData\\Local\\hermes\\gateway-service\\Hermes_Gateway.vbs'],
        processFilter: 'python.exe',
        cmdPattern: 'hermes_cli.main gateway run',
        type: 'BACKGROUND_DAEMON',
        requiresLogonSession: false
      }
    };
  }

  isProcessRunning(processName, cmdPattern = null) {
    if (this.customProcessChecker) {
      return this.customProcessChecker(processName, cmdPattern);
    }

    try {
      if (process.platform === 'win32') {
        if (cmdPattern) {
          const out = execSync(
            `powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { \$_.Name -match '${processName}' -and \$_.CommandLine -match '${cmdPattern}' } | Select-Object -ExpandProperty ProcessId"`,
            { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
          ).trim();
          return out.length > 0;
        } else {
          const out = execSync(`tasklist /FI "IMAGENAME eq ${processName}" /NH`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
          return out.toLowerCase().includes(processName.toLowerCase());
        }
      } else {
        const out = execSync(`pgrep -f "${processName}"`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
        return out.trim().length > 0;
      }
    } catch (e) {
      return false;
    }
  }

  inventoryState() {
    const result = {};
    for (const [key, comp] of Object.entries(this.authorizedComponents)) {
      const running = this.isProcessRunning(comp.processFilter, comp.cmdPattern);
      result[key] = {
        name: comp.name,
        running,
        executable: comp.executable,
        requiresLogonSession: comp.requiresLogonSession
      };
    }
    return result;
  }

  restoreComponent(componentKey, dryRun = false) {
    const key = componentKey.toLowerCase();
    const comp = this.authorizedComponents[key];

    if (!comp) {
      // Invariante: unknown_process_is_not_invented = true
      return {
        action: 'REJECTED',
        reason: 'UNKNOWN_PROCESS_REPORTED',
        result: 'ERROR_UNAUTHORIZED_COMPONENT',
        component: componentKey,
        owner_decision_required: false
      };
    }

    const isRunning = this.isProcessRunning(comp.processFilter, comp.cmdPattern);
    if (isRunning) {
      // Invariante: single-instance dos componentes autorizados / NO_OP
      return {
        action: 'NO_OP',
        reason: 'ALREADY_RUNNING',
        result: 'PRESERVED_EXISTING_INSTANCE',
        component: comp.name,
        owner_decision_required: false
      };
    }

    if (dryRun) {
      return {
        action: 'WOULD_START',
        reason: 'COMPONENT_ABSENT_IN_DRY_RUN',
        result: 'SIMULATED_RECOVERY',
        component: comp.name,
        executable: comp.executable,
        owner_decision_required: false
      };
    }

    if (this.customSpawner) {
      return this.customSpawner(comp);
    }

    try {
      if (comp.type === 'GUI_SESSION') {
        // Antigravity: inicia processo desacoplado
        const child = spawn(comp.executable, [], {
          detached: true,
          stdio: 'ignore'
        });
        child.unref();
        return {
          action: 'STARTED_PROCESS',
          reason: 'COMPONENT_WAS_ABSENT',
          result: 'RECOVERY_TRIGGERED',
          component: comp.name,
          pid: child.pid,
          owner_decision_required: false
        };
      } else if (comp.type === 'BACKGROUND_DAEMON') {
        const child = spawn(comp.executable, comp.args, {
          detached: true,
          stdio: 'ignore'
        });
        child.unref();
        return {
          action: 'STARTED_PROCESS',
          reason: 'COMPONENT_WAS_ABSENT',
          result: 'RECOVERY_TRIGGERED',
          component: comp.name,
          pid: child.pid,
          owner_decision_required: false
        };
      }
    } catch (err) {
      return {
        action: 'START_FAILED',
        reason: 'SPAWN_ERROR',
        result: err.message,
        component: comp.name,
        owner_decision_required: true
      };
    }
  }
}

module.exports = RecoveryManager;
