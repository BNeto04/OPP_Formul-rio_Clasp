/**
 * ARQUIVO: Entrada/Menu.js
 * DESCRICAO: Conecta a interface grafica ao Google Sheets com tratamento defensivo de menus.
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();

  try {
    ui.createMenu('Formulario')
      .addItem('Nova ocorrencia (formulario)', 'abrirFormularioEntrada')
      .addToUi();
  } catch (e) {
    Logger.log('Erro ao criar menu Formulario: ' + e.message);
  }

  if (typeof criarMenuArmas_ === 'function') {
    try { criarMenuArmas_(); } catch (e) { Logger.log('Erro ao criar menu Armas: ' + e.message); }
  }

  try {
    ui.createMenu('Produtividade')
      .addItem('Gerar produtividade / comparativo 2026', 'abrirMenuComparativo2026')
      .addSeparator()
      .addItem('Executar guardiao da qualidade', 'executarGuardiaoQualidade')
      .addItem('Sincronizar efetivo pelo peculio', 'normalizarEfetivo')
      .addSeparator()
      .addItem('[Dev] Rodar teste de homologacao V1 x V2', 'rodarTesteDeHomologacao')
      .addToUi();
  } catch (e) {
    Logger.log('Erro ao criar menu Produtividade: ' + e.message);
  }

  try {
    criarMenuUnificadoPipCPM_();
  } catch (e) {
    Logger.log('Erro ao criar menu unificado PIP/CPM: ' + e.message);
  }

  if (typeof criarMenuDrogas_ === 'function') {
    try { criarMenuDrogas_(); } catch (e) { Logger.log('Erro ao criar menu Drogas: ' + e.message); }
  }

  try {
    criarMenuGxt_();
  } catch (e) {
    Logger.log('Erro ao criar menu Gxt: ' + e.message);
  }
}

/**
 * Menu do Relatório Trimestral Gxt (TASK-M06.3-04D).
 * Itens em caixa normal, sem emojis.
 */
function criarMenuGxt_() {
  const ui = SpreadsheetApp.getUi();

  ui.createMenu('Gxt')
    .addItem('Selecao livre', 'abrirMenuGxtSelecaoLivre')
    .addItem('Anual', 'gerarGxtAnual')
    .addToUi();
}

/**
 * Menu Unificado PIP e CPM (TASK-M01.3-01 / TASK-M01.3-02).
 * Unifica o acesso sob um único menu principal "Pip", sem alterar
 * os compiladores, regras de apuração (29-28 vs Mês Civil) ou abas de saída.
 */
function criarMenuUnificadoPipCPM_() {
  const ui = SpreadsheetApp.getUi();

  const subMenuPip = ui.createMenu('Pip | Ciclo 29–28')
    .addItem('Gerar mensal', 'abrirMenuPipMensal')
    .addItem('Selecao livre', 'abrirMenuPipLivre')
    .addItem('Anual', 'gerarPipAnual');

  const subMenuCpm = ui.createMenu('Cpm | Mes civil')
    .addItem('Gerar mensal', 'abrirMenuCPMMensal')
    .addItem('Selecao livre', 'abrirMenuCPMLivre')
    .addItem('Anual', 'gerarCPMAnual');

  ui.createMenu('Pip')
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
