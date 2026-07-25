/**
 * ARQUIVO: Entrada/Menu.js
 * DESCRICAO: Conecta a interface grafica ao Google Sheets com tratamento defensivo de menus.
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();

  try {
    ui.createMenu('Formulario')
      .addItem('Nova Ocorrencia (Formulario)', 'abrirFormularioEntrada')
      .addToUi();
  } catch (e) {
    Logger.log('Erro ao criar menu Formulario: ' + e.message);
  }

  try {
    ui.createMenu('ARMAS')
      .addItem('Selecao Livre', 'abrirMenuSelecaoLivre')
      .addItem('Anual', 'iniciarModoAnual')
      .addToUi();
  } catch (e) {
    Logger.log('Erro ao criar menu ARMAS: ' + e.message);
  }

  try {
    ui.createMenu('PRODUTIVIDADE')
      .addItem('Gerar Produtividade / Comparativo 2026', 'abrirMenuComparativo2026')
      .addSeparator()
      .addItem('Executar Guardiao da Qualidade', 'executarGuardiaoQualidade')
      .addItem('Sincronizar EFETIVO pelo PECULIO', 'normalizarEfetivo')
      .addSeparator()
      .addItem('[DEV] Rodar Teste Homologacao V1 x V2', 'rodarTesteDeHomologacao')
      .addToUi();
  } catch (e) {
    Logger.log('Erro ao criar menu PRODUTIVIDADE: ' + e.message);
  }

  try {
    ui.createMenu('CENTRAL ANALITICA')
      .addItem('Rodar Anual 2026', 'rodarCentralAnaliticaAnual')
      .addItem('Selecao Livre', 'abrirMenuCentralAnaliticaSelecaoLivre')
      .addToUi();
  } catch (e) {
    Logger.log('Erro ao criar menu CENTRAL ANALITICA: ' + e.message);
  }

  if (typeof criarMenuPip_ === 'function') {
    try { criarMenuPip_(); } catch (e) { Logger.log('Erro ao criar menu PIP: ' + e.message); }
  }

  if (typeof criarMenuDrogas_ === 'function') {
    try { criarMenuDrogas_(); } catch (e) { Logger.log('Erro ao criar menu Drogas: ' + e.message); }
  }

  if (typeof criarMenuCPM_ === 'function') {
    try { criarMenuCPM_(); } catch (e) { Logger.log('Erro ao criar menu CPM: ' + e.message); }
  }
}

function abrirFormularioEntrada() {
  const html = HtmlService.createTemplateFromFile('Entrada/Formulario').evaluate();
  html.setTitle('SYNTHEON - Registro Operacional')
      .setWidth(980)
      .setHeight(750);

  SpreadsheetApp.getUi().showModalDialog(html, 'Formulario');
}
