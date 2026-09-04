// VigiaPonte/AcoesLocais.js
// Ações locais seguras, testáveis e estritamente reversíveis

function emitirAlertaVisualSonoro(tipo, mensagem) {
  // Emite feedback no console e sinaliza de forma reversível
  const ts = new Date().toISOString();
  console.log(`[VIGIA-ALERTA ${ts}] [${tipo}]: ${mensagem}`);
  
  // Emissão de som discreto via escape de terminal se suportado
  if (process.stdout.isTTY) {
    process.stdout.write('\x07');
  }
}

function despertarFocoJanela(nomeAlvo) {
  // Ação de wake/focus segura e reversível
  console.log(`[VIGIA-WAKE] Sinalizando necessidade de atenção para: ${nomeAlvo || 'Terminal Operacional'}`);
  return {
    sucesso: true,
    alvo: nomeAlvo || 'Terminal Operacional',
    acao: 'WINDOW_SIGNAL_DISPATCHED'
  };
}

module.exports = {
  emitirAlertaVisualSonoro: emitirAlertaVisualSonoro,
  despertarFocoJanela: despertarFocoJanela
};
