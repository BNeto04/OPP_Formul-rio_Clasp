/**
 * ARQUIVO: Features/CentralAnalitica.js
 * PILAR 2 & 3: Central Analítica (CA) — Painel Mestre
 * DESCRIÇÃO: Consolidador Único da Era 3. Lê os fatos uma única vez via
 * Adaptador2026 + MotorAnaliticoV2 e gera o painel mestre oficial de produtividade.
 */

function rodarCentralAnaliticaAnual() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const abas = ss.getSheets()
    .map(s => s.getName())
    .filter(nome => /^[A-Z]{3}2026$/i.test(nome))
    .sort();

  if (abas.length === 0) {
    SpreadsheetApp.getUi().alert("Nenhuma aba mensal de 2026 encontrada para a Central Analítica.");
    return;
  }

  processarCentralAnalitica(abas, "CA_2026");
}

function abrirMenuCentralAnaliticaSelecaoLivre() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const abas = ss.getSheets()
    .map(s => s.getName())
    .filter(nome => /^[A-Z]{3}\d{4}$/i.test(nome))
    .sort();

  if (abas.length === 0) {
    SpreadsheetApp.getUi().alert("Nenhuma aba mensal encontrada.");
    return;
  }

  const opcoes = abas.map(nome => `
    <label class="mes">
      <input type="checkbox" name="mes" value="${nome}">
      <span>${nome}</span>
    </label>`).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
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
        <h3>📊 Central Analítica — Seleção Livre</h3>
        <p>Selecione uma ou mais abas para consolidar no Painel Mestre.</p>
        <div class="grid">${opcoes}</div>
        <div class="actions">
          <button class="secondary" onclick="marcarTodos()">Todos</button>
          <button class="secondary" onclick="google.script.host.close()">Cancelar</button>
          <button class="primary" onclick="gerar()">Consolidar</button>
        </div>
        <script>
          function marcarTodos() {
            document.querySelectorAll('input[name="mes"]').forEach(cb => cb.checked = true);
          }
          function gerar() {
            const selecionados = Array.from(document.querySelectorAll('input[name="mes"]:checked')).map(cb => cb.value);
            if (selecionados.length === 0) {
              alert('Selecione pelo menos uma aba.');
              return;
            }
            google.script.run
              .withSuccessHandler(() => google.script.host.close())
              .withFailureHandler(err => alert('Erro: ' + err.message))
              .processarCentralAnaliticaSelecaoLivre(selecionados);
          }
        </script>
      </body>
    </html>
  `;

  const htmlOutput = HtmlService.createHtmlOutput(htmlContent).setWidth(440).setHeight(380);
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Central Analítica');
}

function processarCentralAnaliticaSelecaoLivre(abasSelecionadas) {
  if (!abasSelecionadas || abasSelecionadas.length === 0) return;
  const nomeAbaSaida = `CA_${abasSelecionadas[0]}_${abasSelecionadas[abasSelecionadas.length - 1]}`;
  return processarCentralAnalitica(abasSelecionadas, nomeAbaSaida);
}

function processarCentralAnalitica(abas, nomeAbaSaida) {
  const t0 = Date.now();
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Carregar base do Efetivo para enriquecimento
  const mapaEfetivo = SyntheonPoliciais.carregarEfetivo(ss);
  const metadado = { versao: "2026", coberturaHistorica: {} };

  // 2. Extrair fatos canônicos de cada aba mensal selecionada
  let todosFatos = [];
  abas.forEach(nomeAba => {
    const sheet = ss.getSheetByName(nomeAba);
    if (sheet) {
      metadado.aba = nomeAba;
      const fatosAba = Adaptador2026.extrairFatos(sheet, metadado, mapaEfetivo);
      todosFatos = todosFatos.concat(fatosAba);
    }
  });

  if (todosFatos.length === 0) {
    SpreadsheetApp.getUi().alert("Nenhum fato operacional válido foi encontrado nas abas selecionadas.");
    return;
  }

  // 3. Processar produtividade consolidada via Motor V2
  const registros = MotorAnaliticoV2.processarProdutividadePolicial(todosFatos);

  // 4. Ordenação determinística: Pontuação (↓) > Ocorrências (↓) > Armas (↓) > Drogas (↓) > Nome (↑)
  registros.sort((a, b) => {
    const ptsA = a.indicadores ? a.indicadores.pontosTotais : (a.pontosTotais || 0);
    const ptsB = b.indicadores ? b.indicadores.pontosTotais : (b.pontosTotais || 0);
    if (ptsB !== ptsA) return ptsB - ptsA;

    const ocA = a.fatos ? a.fatos.ocorrencias : (a.ocorrencias || 0);
    const ocB = b.fatos ? b.fatos.ocorrencias : (b.ocorrencias || 0);
    if (ocB !== ocA) return ocB - ocA;

    const armA = a.fatos ? a.fatos.armas : (a.armas || 0);
    const armB = b.fatos ? b.fatos.armas : (b.armas || 0);
    if (armB !== armA) return armB - armA;

    const drgA = a.fatos ? a.fatos.drogasTotal : (a.drogasTotal || 0);
    const drgB = b.fatos ? b.fatos.drogasTotal : (b.drogasTotal || 0);
    if (drgB !== drgA) return drgB - drgA;

    return (a.nome || '').localeCompare(b.nome || '', 'pt-BR');
  });

  // 5. Renderizar na aba dedicada
  const tempoSegundos = ((Date.now() - t0) / 1000).toFixed(2);
  const totalOcorrencias = new Set(todosFatos.map(f => f.ocorrencia.chave)).size;

  RendererCA.renderizar(ss, nomeAbaSaida, registros, {
    periodo: abas.length === 1 ? abas[0] : `${abas[0]} a ${abas[abas.length - 1]}`,
    abasLidas: abas,
    totalPoliciais: registros.length,
    totalOcorrencias,
    tempoSegundos
  });

  SpreadsheetApp.getUi().alert(
    `Central Analítica gerada com sucesso! ✅\n\n` +
    `Aba: ${nomeAbaSaida}\n` +
    `Policiais: ${registros.length}\n` +
    `Ocorrências: ${totalOcorrencias}\n` +
    `Tempo: ${tempoSegundos}s`
  );
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    rodarCentralAnaliticaAnual,
    abrirMenuCentralAnaliticaSelecaoLivre,
    processarCentralAnaliticaSelecaoLivre,
    processarCentralAnalitica
  };
}
