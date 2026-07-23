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

function abrirMenuComparativo2026() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const meses = obterAbasComparativo2026(ss);

  if (meses.length === 0) {
    SpreadsheetApp.getUi().alert("Nenhuma aba de 2026 encontrada para gerar o comparativo.");
    return;
  }

  const opcoes = meses.map(nome => `
        <label class="mes">
          <input type="checkbox" name="mes" value="${nome}">
          <span>${nome}</span>
        </label>`).join('');

  const htmlOutput = HtmlService.createHtmlOutput(`
    <html>
      <head>
        <base target="_top">
        <style>
          body { font-family: Arial, sans-serif; padding: 18px; color: #111827; }
          h3 { margin: 0 0 6px; font-size: 17px; }
          p { margin: 0 0 14px; color: #4b5563; font-size: 13px; line-height: 1.35; }
          .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 14px; }
          .mes { display: flex; align-items: center; gap: 7px; border: 1px solid #d1d5db; border-radius: 6px; padding: 8px; cursor: pointer; }
          .mes:hover { background: #f3f4f6; }
          .actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 12px; }
          button { border: 0; border-radius: 6px; padding: 8px 12px; font-weight: 700; cursor: pointer; }
          .secondary { background: #e5e7eb; color: #111827; }
          .primary { background: #064e3b; color: white; }
        </style>
      </head>
      <body>
        <h3>Produtividade / Comparativo 2026</h3>
        <p>Selecione um ou mais meses. Para bimestre ou trimestre, marque os meses desejados.</p>
        <div class="grid">${opcoes}</div>
        <div class="actions">
          <button class="secondary" onclick="marcarTodos()">Todos</button>
          <button class="secondary" onclick="google.script.host.close()">Cancelar</button>
          <button class="primary" onclick="gerar()">Gerar</button>
        </div>
        <script>
          function marcarTodos() {
            document.querySelectorAll('input[name="mes"]').forEach(cb => cb.checked = true);
          }
          function gerar() {
            const selecionados = Array.from(document.querySelectorAll('input[name="mes"]:checked')).map(cb => cb.value);
            if (selecionados.length === 0) {
              alert('Selecione pelo menos um mes.');
              return;
            }
            google.script.run
              .withSuccessHandler(() => google.script.host.close())
              .withFailureHandler(err => alert('Erro: ' + err.message))
              .processarComparativo2026Selecionado(selecionados);
          }
        </script>
      </body>
    </html>
  `).setWidth(420).setHeight(360);

  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Produtividade / Comparativo 2026');
}

function processarComparativo2026Selecionado(abasSelecionadas) {
  return gerarComparativo2026Premium(abasSelecionadas);
}

function gerarComparativo2026Premium(abasSelecionadas) {
  const inicioGlobal = Date.now();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const logger = new SyntheonLogger("COMPARATIVO_2026");
  const abas2026 = obterAbasComparativo2026(ss);
  const selecionadas = Array.isArray(abasSelecionadas) ? abasSelecionadas : abas2026;
  const mapaSelecionadas = {};
  selecionadas.forEach(nome => { mapaSelecionadas[String(nome).toUpperCase()] = true; });
  const abasAlvo = abas2026.filter(nome => mapaSelecionadas[nome]);

  if (abasAlvo.length === 0) {
    SpreadsheetApp.getUi().alert("Nenhuma aba de 2026 encontrada para gerar o comparativo.");
    return;
  }

  const ocorrencias = SyntheonLeitor.lerAbas(ss, abasAlvo, null, null, logger);
  const mapaProdutividade = SyntheonMetricas.consolidarPoliciais(ocorrencias);
  const arrayRegistros = montarRegistrosComparativo2026(ss, mapaProdutividade);

  const tempoSegundos = ((Date.now() - inicioGlobal) / 1000).toFixed(2);
  const fuso = typeof CONFIG_SYNTHEON !== 'undefined' ? CONFIG_SYNTHEON.FUSO_HORARIO : "America/Recife";
  const dataAtual = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || fuso, "dd/MM/yyyy HH:mm:ss");

  const metadata = {
    titulo: "COMPARATIVO 2026",
    periodo: abasAlvo.length > 0 ? `${abasAlvo[0]} ate ${abasAlvo[abasAlvo.length - 1]}` : "N/D",
    abasLidas: abasAlvo.length,
    policiais: arrayRegistros.length,
    ocorrencias: ocorrencias.length,
    atualizado: dataAtual,
    tempo: `${tempoSegundos} s`
  };

  RendererComparativo2026.render(ss, "COMPARATIVO_2026", arrayRegistros, metadata);
  logger.gravarPlanilha("LOG_COMPARATIVO_2026", "COMPARATIVO_2026");
  SpreadsheetApp.getUi().alert(`Comparativo 2026 gerado em ${tempoSegundos}s!\nConsulte a aba COMPARATIVO_2026.`);
}

function obterAbasComparativo2026(ss) {
  const ordemMeses = ["JAN","FEV","MAR","ABR","MAI","JUN","JUL","AGO","SET","OUT","NOV","DEZ"];
  return ss.getSheets()
    .map(s => s.getName())
    .filter(nome => /^[A-Z]{3}2026$/.test(nome))
    .sort((a, b) => ordemMeses.indexOf(a.substring(0, 3)) - ordemMeses.indexOf(b.substring(0, 3)));
}

function montarRegistrosComparativo2026(ss, mapaProdutividade) {
  const efetivo = SyntheonPoliciais.carregarListaEfetivo(ss)
    .filter(policial => SyntheonUtils.normalizarTexto(policial.subunidadePeculio));
  const produtividadePorMatricula = {};

  Object.values(mapaProdutividade).forEach(reg => {
    const matricula = SyntheonUtils.limparMatricula(reg.matricula);
    if (matricula) produtividadePorMatricula[matricula] = reg;
  });

  return efetivo.map(policial => {
    const prod = produtividadePorMatricula[policial.matricula] || null;
    return montarRegistroComparativo2026(policial, prod);
  });

}

function montarRegistroComparativo2026(policial, produtividade) {
  const fatos = produtividade ? produtividade.fatos : {};
  const indicadores = produtividade ? produtividade.indicadores : {};

  return {
    matricula: policial.matricula,
    nome: policial.nomeGuerra || policial.nome || '',
    nomeCompleto: policial.nome || '',
    grad: policial.grad || (produtividade ? produtividade.grad : ''),
    pelotao: policial.pelotao || (produtividade ? produtividade.pelotao : ''),
    subunidadePeculio: policial.subunidadePeculio || '',
    fatos: {
      ocorrencias: fatos.ocorrencias || 0,
      qtdBoe: fatos.qtdBoe || 0,
      armas: fatos.armas || 0,
      maconha: fatos.maconha || 0,
      crack: fatos.crack || 0,
      cocaina: fatos.cocaina || 0,
      drogasTotal: fatos.drogasTotal || 0,
      detidos: fatos.detidos || 0
    },
    indicadores: {
      pontosTotais: indicadores.pontosTotais || 0,
      pontosPIP: indicadores.pontosPIP || 0,
      pontosCPM: indicadores.pontosCPM || 0
    }
  };
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
