/**
 * ARQUIVO: Entrada/Menu.js
 * DESCRICAO: Conecta a interface grafica ao Google Sheets.
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();

  ui.createMenu('Formulario')
    .addItem('Nova Ocorrencia (Formulario)', 'abrirFormularioEntrada')
    .addToUi();

  ui.createMenu('ARMAS')
    .addItem('Selecao Livre', 'abrirMenuSelecaoLivre')
    .addItem('Anual', 'iniciarModoAnual')
    .addToUi();

  ui.createMenu('PRODUTIVIDADE')
    .addItem('Gerar Produtividade / Comparativo 2026', 'abrirMenuComparativo2026')
    .addSeparator()
    .addItem('Executar Guardiao da Qualidade', 'executarGuardiaoQualidade')
    .addItem('Sincronizar EFETIVO pelo PECULIO', 'normalizarEfetivo')
    .addSeparator()
    .addItem('[DEV] Rodar Teste Homologacao V1 x V2', 'rodarTesteDeHomologacao')
    .addToUi();

  criarMenuPip_();
  criarMenuDrogas_();
  criarMenuCPM_();
}

function abrirFormularioEntrada() {
  const html = HtmlService.createTemplateFromFile('Entrada/Formulario').evaluate();
  html.setTitle('SYNTHEON - Registro Operacional')
      .setWidth(980)
      .setHeight(750);

  SpreadsheetApp.getUi().showModalDialog(html, 'Formulario');
}
