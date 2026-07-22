/**
 * ARQUIVO: Entrada/Menu.js
 * DESCRIÇÃO: Conecta a interface gráfica ao Google Sheets.
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();

  // Menu Central do SYNTHÉON
  ui.createMenu('Formulário')
    .addItem('📝 Nova Ocorrência (Formulário)', 'abrirFormularioEntrada')
    .addToUi();

  // Menus originais do compilador
  ui.createMenu('🔫 ARMAS')
    .addItem('📅 Seleção Livre', 'abrirMenuSelecaoLivre')
    .addItem('📊 Anual', 'iniciarModoAnual')
    .addToUi();

  // Menu do novo framework
  ui.createMenu('🏆 PRODUTIVIDADE')
    .addItem('📊 Rápida (Todas as Abas)', 'compilarProdutividadeRapida')
    .addItem('⚙️ Avançada (Selecionar Meses)', 'compilarProdutividadeAvancada')
    .addSeparator()
    .addItem('✅ Executar Guardião da Qualidade', 'executarGuardiaoQualidade')
    .addSeparator()
    .addItem('🧪 [DEV] Rodar Teste Homologação V1 x V2', 'rodarTesteDeHomologacao')
    .addToUi();

  criarMenuPip_();
  criarMenuDrogas_();   // ← Chamada do menu de Entorpecentes
  criarMenuCPM_();
}

function abrirFormularioEntrada() {
  // Cria o modal com o HTML do formulário
  const html = HtmlService.createTemplateFromFile('Entrada/Formulario').evaluate();
  html.setTitle('SYNTHÉON - Registro Operacional')
      .setWidth(980)
      .setHeight(750);
      
  SpreadsheetApp.getUi().showModalDialog(html, 'Formulário');
}
