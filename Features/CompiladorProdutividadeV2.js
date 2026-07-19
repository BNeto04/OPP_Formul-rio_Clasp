/**
 * ARQUIVO: Features/CompiladorProdutividadeV2.js
 * DESCRIÇÃO: A Orquestração Beta da V2. 
 * Respeita o Princípio da Coexistência: não substitui o V1, mas 
 * executa em paralelo consumindo Adaptador -> Motor -> Modelo -> Renderer.
 */

class CompiladorProdutividadeV2 {
  /**
   * Ponto de entrada da nova arquitetura.
   * Pode ser chamado diretamente no Google Apps Script para testar lado a lado.
   */
  static executar(apenasAnoAtual = false) {
    const planilha = SpreadsheetApp.getActiveSpreadsheet();
    const ui = SpreadsheetApp.getUi();
    
    // Simulação do Fluxo Inflexível (Pipeline)
    // 1. LEITURA (Pilar 1 - Adaptadores)
    const metadado2026 = CatalogoEstruturas[FonteDados.OPP_2026];
    const sheet2026 = planilha.getSheetByName("JAN2026"); // Mock simplificado
    
    // Obter Mapa de Efetivo (Mock idêntico ao original)
    const abaEfetivo = planilha.getSheetByName('Efetivo');
    let mapaEfetivo = {};
    if (abaEfetivo) {
       // mapaEfetivo = carregarEfetivo(abaEfetivo);
    }
    
    let fatosBrutos = [];
    if (sheet2026) {
      // Retorna array de RegistroCanonico
      fatosBrutos = Adaptador2026.extrairFatos(sheet2026, metadado2026, mapaEfetivo); 
    }

    // 2. CÁLCULO (Pilar 3 - Motor Analítico V2)
    // Converte os fatos brutos em Registros Analíticos agregados
    let registrosAnaliticos = MotorAnaliticoV2.processarProdutividadePolicial(fatosBrutos);

    // 3. ESTRUTURA LÓGICA (Pilar 4 - Modelos)
    const modelo = new ModeloProdutividade();
    
    // O Modelo se encarrega de ordenar os dados conforme suas próprias regras de negócio
    registrosAnaliticos = modelo.ordenarDados(registrosAnaliticos);

    // 4. PREPARAÇÃO PARA EXIBIÇÃO (Formatação das linhas via Modelo/Schema)
    const headers = modelo.obterColunas();
    const dadosMapeados = registrosAnaliticos.map(reg => modelo.formatarLinha(reg));

    // 5. RENDERIZAÇÃO LÓGICA / FÍSICA (Pilares 5 e 6)
    // Na Fase 4 criaremos o Driver. Por enquanto usamos o RendererTabela legado
    // para provar a coexistência da camada superior.
    const nomeAbaSaida = modelo.obterTitulo();
    RendererTabela.renderizar(planilha, nomeAbaSaida, headers, dadosMapeados);

    return true;
  }
}
