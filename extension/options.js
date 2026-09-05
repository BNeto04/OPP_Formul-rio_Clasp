const DEFAULT_CONFIG = {
  bridgeEndpoint: 'http://127.0.0.1:8765',
  pollIntervalMs: 3000,
  autoSubmit: true,
  enabled: true
};

document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(DEFAULT_CONFIG, (items) => {
    document.getElementById('bridgeEndpoint').value = items.bridgeEndpoint;
    document.getElementById('pollIntervalMs').value = items.pollIntervalMs;
    document.getElementById('autoSubmit').checked = items.autoSubmit;
    document.getElementById('enabled').checked = items.enabled;
  });

  document.getElementById('saveBtn').addEventListener('click', () => {
    const bridgeEndpoint = document.getElementById('bridgeEndpoint').value.trim();
    const pollIntervalMs = parseInt(document.getElementById('pollIntervalMs').value, 10) || 3000;
    const autoSubmit = document.getElementById('autoSubmit').checked;
    const enabled = document.getElementById('enabled').checked;

    chrome.storage.local.set({
      bridgeEndpoint,
      pollIntervalMs,
      autoSubmit,
      enabled
    }, () => {
      const status = document.getElementById('status');
      status.textContent = 'Configurações salvas com sucesso!';
      setTimeout(() => {
        status.textContent = '';
      }, 2500);
    });
  });
});
