/**
 * ARQUIVO: Entradas/Compatibilidade.js
 * DESCRIÇÃO: Este arquivo funciona como a API Pública do SYNTHÉON no Google Apps Script.
 * As assinaturas de função aqui contidas são chamadas diretamente pelos Menus da Planilha
 * e NUNCA devem ser alteradas ou removidas sem um plano de obsolescência claro.
 * O objetivo é garantir a "Regra de Ouro #5 - Compatibilidade Operacional", permitindo 
 * trocar o motor interno (API Interna) sem quebrar o usuário.
 */

// ---------------------------------------------------------
// COMPILADOR PIP (Legado / V1)
// ---------------------------------------------------------
function compilarPIP() {
  // Atualmente aponta para o motor legado. No futuro, apontará para o V2
  // return CompiladorPIP.executar();
}

function compilarCPM() {
  // return CompiladorCPM.executar();
}

// ---------------------------------------------------------
// COMPILADOR ARMAS E ENTORPECENTES (Legado / V1)
// ---------------------------------------------------------
function abrirMenuSelecaoLivre() {
  // Já definido em MenuSelecaoLivre.js, mas listamos aqui a intenção
  // return iniciarProcessoSelecaoLivre();
}

function iniciarModoAnual() {
  // Já definido em outras features
  // return carregarModoAnual();
}

// ---------------------------------------------------------
// COMPILADOR DE PRODUTIVIDADE (V1 Atual)
// ---------------------------------------------------------
function compilarProdutividadeRapida() {
  // Chama a orquestração atual. Pode conviver com uma versão Beta no futuro.
  return iniciarCompiladorProdutividade(false);
}

function compilarProdutividadeAvancada() {
  return iniciarCompiladorProdutividade(true);
}

// ---------------------------------------------------------
// FUTURA IMPLEMENTAÇÃO DA V2 (Exemplo de Coexistência Beta)
// ---------------------------------------------------------
function compilarProdutividadeBetaV2() {
  // Quando a Fase 4 estiver concluída, este método chamará:
  // const modelo = new ModeloProdutividade(TemaPMPE);
  // const dados = MotorAnaliticoV2.processar(Adaptador2026.ler());
  // return GoogleSheetsDriver.imprimir(Renderer.renderizar(dados, modelo));
}
