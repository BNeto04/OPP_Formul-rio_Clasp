class RemoteInterfaceStub {
  constructor(options = {}) {
    this.options = options;
    // Invariantes estritas de segurança:
    this.opensPublicInboundPort = false;
    this.listensExternalNetwork = false;
    this.listeners = [];
  }

  emitLocalEvent(eventName, payload) {
    for (const listener of this.listeners) {
      try {
        listener(eventName, payload);
      } catch (e) {}
    }
  }

  onLocalEvent(callback) {
    if (typeof callback === 'function') {
      this.listeners.push(callback);
    }
  }

  getStatus() {
    return {
      status: 'PREPARED_LOCAL_ONLY',
      inbound_ports_open: false,
      public_server_active: false,
      firewall_modified: false,
      rdp_exposed: false,
      llm_installed: false,
      message: 'Interface interna isolada. Acesso remoto requer canal seguro aprovado em CALL dedicada.'
    };
  }
}

module.exports = RemoteInterfaceStub;
