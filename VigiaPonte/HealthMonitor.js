const os = require('os');

class HealthMonitor {
  constructor(options = {}) {
    this.options = options;
  }

  collectMetrics() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memUsagePercent = Math.round((usedMem / totalMem) * 100);

    const uptimeSeconds = Math.round(os.uptime());
    const cpus = os.cpus() || [];
    const cpuCount = cpus.length;
    const cpuModel = cpuCount > 0 ? cpus[0].model : 'Unknown';

    const processMem = process.memoryUsage();

    return {
      timestamp: new Date().toISOString(),
      system: {
        total_memory_bytes: totalMem,
        free_memory_bytes: freeMem,
        used_memory_bytes: usedMem,
        memory_usage_percent: memUsagePercent,
        uptime_seconds: uptimeSeconds,
        cpu_count: cpuCount,
        cpu_model: cpuModel
      },
      vigia_process: {
        pid: process.pid,
        rss_bytes: processMem.rss,
        heap_used_bytes: processMem.heapUsed,
        heap_total_bytes: processMem.heapTotal
      },
      healthy: memUsagePercent < 95
    };
  }
}

module.exports = HealthMonitor;
