const DEFAULT_CONFIG = {
  bridgeEndpoint: 'http://127.0.0.1:8765',
  enabled: true
};

document.addEventListener('DOMContentLoaded', () => {
  const bridgeEndpointEl = document.getElementById('bridgeEndpoint');
  const enabledEl = document.getElementById('enabled');
  const saveBtn = document.getElementById('saveBtn');
  const statusEl = document.getElementById('status');

  chrome.storage.local.get(DEFAULT_CONFIG, (cfg) => {
    bridgeEndpointEl.value = cfg.bridgeEndpoint || DEFAULT_CONFIG.bridgeEndpoint;
    enabledEl.checked = cfg.enabled !== undefined ? cfg.enabled : DEFAULT_CONFIG.enabled;
  });

  saveBtn.addEventListener('click', () => {
    const bridgeEndpoint = bridgeEndpointEl.value.trim() || DEFAULT_CONFIG.bridgeEndpoint;
    const enabled = enabledEl.checked;

    chrome.storage.local.set({ bridgeEndpoint, enabled }, () => {
      statusEl.textContent = 'Configurações salvas com sucesso!';
      setTimeout(() => { statusEl.textContent = ''; }, 3000);
    });
  });
});
