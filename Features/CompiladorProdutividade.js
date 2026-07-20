/**
 * ARQUIVO: Features/CompiladorProdutividade.js
 * DESCRIÇÃO: Orquestrador da consolidação de produtividade por policial.
 */

function compilarProdutividadeRapida() {
  iniciarCompiladorProdutividade(false);
}

function compilarProdutividadeAvancada() {
  iniciarCompiladorProdutividade(true);
}

function iniciarCompiladorProdutividade(avancado) {
  const inicioGlobal = Date.now();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const logger = new SyntheonLogger("COMPILADOR_PRODUTIVIDADE");
  
  let abasAlvo = [];
  const todasAbas = ss.getSheets().map(s => s.getName());
  const regexMes = /^[A-Z]{3}\d{4}$/;
  
  if (avancado) {
    const ui = SpreadsheetApp.getUi();
    const prompt = ui.prompt(
      'Compilador Avançado',
      'Digite os meses que deseja compilar, separados por vírgula (Ex: JAN2026, FEV2026):',
      ui.ButtonSet.OK_CANCEL
    );
    
    if (prompt.getSelectedButton() !== ui.Button.OK) return;
    
    const digitadas = prompt.getResponseText().split(',').map(m => m.trim().toUpperCase());
    abasAlvo = digitadas.filter(m => {
      const existe = todasAbas.includes(m);
      if (!existe) logger.aviso(`Aba informada não existe na planilha: ${m}`);
      return existe;
    });
  } else {
    abasAlvo = todasAbas.filter(nome => regexMes.test(nome));
  }
  
  if (abasAlvo.length === 0) {
    SpreadsheetApp.getUi().alert("Nenhuma aba válida encontrada ou selecionada para compilação.");
    return;
  }

  // 1. Leitura
  const ocorrencias = SyntheonLeitor.lerAbas(ss, abasAlvo, null, null, logger);
  
  // 2. Métricas & Domínio
  const mapaProdutividade = SyntheonMetricas.consolidarPoliciais(ocorrencias);
  const arrayRegistros = Object.values(mapaProdutividade);
  
  // Ordenação dinâmica: Pontuação > Armas > Ocorrências > Nome
  arrayRegistros.sort((a, b) => {
    if (b.pontosTotais !== a.pontosTotais) return b.pontosTotais - a.pontosTotais;
    if (b.armas !== a.armas) return b.armas - a.armas;
    if (b.ocorrencias !== a.ocorrencias) return b.ocorrencias - a.ocorrencias;
    return a.nome.localeCompare(b.nome);
  });
  
  // Transformação (Schema)
  const dados = arrayRegistros.map(reg => ProdutividadeSchema.extrairLinha(reg));
  
  // Preparar Metadados
  const tempoSegundos = ((Date.now() - inicioGlobal) / 1000).toFixed(2);
  const fuso = typeof CONFIG_SYNTHEON !== 'undefined' ? CONFIG_SYNTHEON.FUSO_HORARIO : "America/Recife";
  const dataAtual = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || fuso, "dd/MM/yyyy HH:mm:ss");
  
  const metadata = {
    titulo: "PRODUTIVIDADE GERAL",
    periodo: abasAlvo.length > 0 ? `${abasAlvo[0]} até ${abasAlvo[abasAlvo.length - 1]}` : "N/D",
    abasLidas: abasAlvo.length,
    policiais: arrayRegistros.length,
    ocorrencias: ocorrencias.length,
    atualizado: dataAtual,
    tempo: `${tempoSegundos} s`
  };
  
  // 3. Renderização
  RendererTabela.render(ss, "PRODUTIVIDADE_GERAL", ProdutividadeSchema.HEADERS, dados, metadata);
  
  // Finalização (Log)
  logger.gravarPlanilha("LOG_PRODUTIVIDADE", "PRODUTIVIDADE_GERAL");
  SpreadsheetApp.getUi().alert(`Compilação finalizada em ${tempoSegundos}s!\nConsulte a aba PRODUTIVIDADE_GERAL.`);
}
