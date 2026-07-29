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

  if (typeof criarMenuArmas_ === 'function') {
    try { criarMenuArmas_(); } catch (e) { Logger.log('Erro ao criar menu ARMAS: ' + e.message); }
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
    criarMenuUnificadoPipCPM_();
  } catch (e) {
    Logger.log('Erro ao criar menu unificado PIP/CPM: ' + e.message);
  }

  if (typeof criarMenuDrogas_ === 'function') {
    try { criarMenuDrogas_(); } catch (e) { Logger.log('Erro ao criar menu Drogas: ' + e.message); }
  }
}

/**
 * Menu Unificado PIP e CPM (TASK-M01.3-01).
 * Unifica o acesso sob um único menu principal "🏆 PIP", sem alterar
 * os compiladores, regras de apuração (29-28 vs Mês Civil) ou abas de saída.
 */
function criarMenuUnificadoPipCPM_() {
  const ui = SpreadsheetApp.getUi();

  const subMenuPip = ui.createMenu('PIP | Ciclo 29–28')
    .addItem('▶ Gerar Mensal', 'abrirMenuPipMensal')
    .addItem('📅 Seleção Livre', 'abrirMenuPipLivre')
    .addItem('📊 Anual', 'gerarPipAnual');

  const subMenuCpm = ui.createMenu('CPM | Mês civil')
    .addItem('▶ Gerar Mensal', 'abrirMenuCPMMensal')
    .addItem('📅 Seleção Livre', 'abrirMenuCPMLivre')
    .addItem('📊 Anual', 'gerarCPMAnual');

  ui.createMenu('🏆 PIP')
    .addSubMenu(subMenuPip)
    .addSubMenu(subMenuCpm)
    .addToUi();
}

function abrirFormularioEntrada() {
  const html = HtmlService.createTemplateFromFile('Entrada/Formulario').evaluate();
  html.setTitle('SYNTHEON - Registro Operacional')
      .setWidth(980)
      .setHeight(750);

  SpreadsheetApp.getUi().showModalDialog(html, 'Formulario');
}
