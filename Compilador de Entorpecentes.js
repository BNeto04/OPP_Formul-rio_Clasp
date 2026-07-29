/**
 * PROJETO: Compilador de Entorpecentes GS
 * LOTE: Ocorrência por PEL 2026
 * DESCRIÇÃO: Consolidação robusta de produtividade de entorpecentes.
 */

// ============================================================================
// MENU
// ============================================================================
function criarMenuDrogas_() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('💊 DROGAS')
    .addItem('📅 Seleção Livre', 'abrirMenuSelecaoLivreDrogas')
    .addItem('📊 Anual', 'iniciarModoAnualDrogas')
    .addToUi();
}

// ============================================================================
// FLUXO ANUAL
// ============================================================================
function iniciarModoAnualDrogas() {
  const ui = SpreadsheetApp.getUi();
  const meses = ['JAN2026','FEV2026','MAR2026','ABR2026','MAI2026','JUN2026','JUL2026','AGO2026','SET2026','OUT2026','NOV2026','DEZ2026'];
  
  const response = ui.alert('Compilador de Entorpecentes - Modo Anual', 
    'Deseja processar todos os meses de 2026?', ui.ButtonSet.YES_NO);
    
  if (response === ui.Button.YES) {
    executarCompiladorDrogas(meses, 'ANUAL');
  }
}

// ============================================================================
// FLUXO SELEÇÃO LIVRE
// ============================================================================
function abrirMenuSelecaoLivreDrogas() {
  const htmlOutput = HtmlService.createHtmlOutput(`
    <div style="font-family: Arial, sans-serif; padding: 15px;">
      <h4>Selecione os meses para compilar (Entorpecentes):</h4>
      <form id="mesesForm">
        <label><input type="checkbox" name="mes" value="JAN2026"> JAN2026</label><br>
        <label><input type="checkbox" name="mes" value="FEV2026"> FEV2026</label><br>
        <label><input type="checkbox" name="mes" value="MAR2026"> MAR2026</label><br>
        <label><input type="checkbox" name="mes" value="ABR2026"> ABR2026</label><br>
        <label><input type="checkbox" name="mes" value="MAI2026"> MAI2026</label><br>
        <label><input type="checkbox" name="mes" value="JUN2026"> JUN2026</label><br>
        <label><input type="checkbox" name="mes" value="JUL2026"> JUL2026</label><br>
        <label><input type="checkbox" name="mes" value="AGO2026"> AGO2026</label><br>
        <label><input type="checkbox" name="mes" value="SET2026"> SET2026</label><br>
        <label><input type="checkbox" name="mes" value="OUT2026"> OUT2026</label><br>
        <label><input type="checkbox" name="mes" value="NOV2026"> NOV2026</label><br>
        <label><input type="checkbox" name="mes" value="DEZ2026"> DEZ2026</label><br>
        <br>
        <button type="button" onclick="enviar()" 
          style="padding: 10px 20px; background: #d93025; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Compilar Entorpecentes
        </button>
      </form>
      <script>
        function enviar() {
          const checkboxes = document.querySelectorAll('input[name="mes"]:checked');
          const selecionados = Array.from(checkboxes).map(cb => cb.value);
          if (selecionados.length === 0) {
            alert('Selecione pelo menos um mês!');
            return;
          }
          google.script.run.withSuccessHandler(google.script.host.close)
            .processarMenuLivreDrogas(selecionados);
        }
      </script>
    </div>
  `).setWidth(320).setHeight(460);
  
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Seleção Livre - Entorpecentes');
}

function processarMenuLivreDrogas(mesesSelecionados) {
  executarCompiladorDrogas(mesesSelecionados, 'LIVRE');
}

// ============================================================================
// MOTOR PRINCIPAL
// ============================================================================
function executarCompiladorDrogas(mesesAlvo, modo) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  const startTime = new Date();

  let logs = {
    abasProcessadas: [],
    linhasLidas: 0,
    policiaisUnicos: 0,
    linhasIgnoradas: 0,
    avisosGerados: [],
    totalMac: 0,
    totalCoc: 0
  };

  let dadosBrutos = [];

  try {
    mesesAlvo.forEach(nomeAba => {
      const sheet = ss.getSheetByName(nomeAba);
      if (!sheet) {
        logs.avisosGerados.push(`Aba '${nomeAba}' não encontrada.`);
        return;
      }

      logs.abasProcessadas.push(nomeAba);
      const lastCol = sheet.getLastColumn();
      const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

      const loc = (chaveAlias) => (typeof SyntheonCabecalhos !== 'undefined')
        ? SyntheonCabecalhos.encontrar(headers, chaveAlias)
        : SyntheonUtils.localizarColuna(headers.map(h => SyntheonUtils.normalizarTexto(h)), chaveAlias);

      const idxBoe = loc('BOE');
      const idxPelotao = loc('PELOTAO');
      const idxGrad = loc('GRAD');
      const idxMat = loc('MATRICULA');
      const idxPolicial = loc('POLICIAL');
      const idxMac = loc('MACONHA');
      const idxCoc = loc('COCAINA');

      if ([idxPelotao, idxMat, idxPolicial, idxMac, idxCoc].some(i => i === -1)) {
        throw new Error(`Cabeçalhos obrigatórios não encontrados na aba ${nomeAba}.`);
      }

      const numRows = sheet.getLastRow() - 1;
      if (numRows <= 0) return;

      const data = sheet.getRange(2, 1, numRows, lastCol).getValues();
      logs.linhasLidas += data.length;

      data.forEach(row => {
        const matricula = String(row[idxMat]).trim();
        const policial = String(row[idxPolicial]).trim();

        if (!matricula || !policial) {
          logs.linhasIgnoradas++;
          return;
        }

        const pelotao = row[idxPelotao];
        const graduacao = idxGrad !== -1 ? row[idxGrad] : "";
        const mac = Number(row[idxMac]) || 0;
        const coc = Number(row[idxCoc]) || 0;
        const boe = idxBoe !== -1 ? String(row[idxBoe]).trim() : "";

        dadosBrutos.push({
          chave: matricula + "|" + policial,
          matricula,
          policial,
          pelotao,
          graduacao,
          mac,
          coc,
          boe
        });
      });
    });

    if (dadosBrutos.length === 0) {
      ui.alert('Aviso', 'Nenhum registro válido encontrado.', ui.ButtonSet.OK);
      return;
    }

    const produtividade = {};
    dadosBrutos.forEach(item => {
      if (!produtividade[item.chave]) {
        produtividade[item.chave] = {
          matricula: item.matricula,
          nome: item.policial,
          pelotao: item.pelotao,
          graduacao: item.graduacao,
          mac: 0,
          coc: 0,
          ocorrencias: 0,
          boes: new Set()
        };
        logs.policiaisUnicos++;
      }

      const p = produtividade[item.chave];
      p.mac += item.mac;
      p.coc += item.coc;
      p.ocorrencias++;
      if (item.boe) p.boes.add(item.boe);

      logs.totalMac += item.mac;
      logs.totalCoc += item.coc;
    });

    let ranking = Object.values(produtividade).map(p => {
      const total = p.mac + p.coc;
      return [p.pelotao, p.graduacao, p.matricula, p.nome, p.mac, p.coc, total, p.ocorrencias, p.boes.size];
    });

    ranking.sort((a, b) => b[6] - a[6]);

    let nomeBase = modo === 'ANUAL' ? 'COMP_DROGAS_2026' : `COMP_DROGAS_${logs.abasProcessadas[0]}_${logs.abasProcessadas.at(-1) || ''}`;
    let nomeFinal = nomeBase;
    let versao = 1;
    while (ss.getSheetByName(nomeFinal)) {
      nomeFinal = `${nomeBase}.v${versao}`;
      versao++;
    }

    const novaAba = ss.insertSheet(nomeFinal);
    const cabecalho = [['POS', 'PELOTÃO', 'GRADUAÇÃO', 'MATRÍCULA', 'POLICIAL', 'MACONHA (g)', 'COCAÍNA (g)', 'TOTAL (g)', 'OCORRÊNCIAS', 'BOEs']];
    
    novaAba.getRange(1, 1, 1, 10).setValues(cabecalho).setFontWeight("bold").setBackground("#e0e0e0");

    if (ranking.length > 0) {
      const dadosFormatados = ranking.map((row, i) => [i + 1, ...row]);
      novaAba.getRange(2, 1, dadosFormatados.length, 10).setValues(dadosFormatados);

      let backgrounds = [];
      let fontColors = [];

      ranking.forEach(row => {
        const pelStr = String(row[0]).toUpperCase();
        const total = row[6];

        let corPel = '#FFFFFF';
        if (pelStr.includes('OFICIAIS')) corPel = '#F1C232';
        else if (/1[º°]?\s*PEL/.test(pelStr)) corPel = '#00FF00';
        else if (/2[º°]?\s*PEL/.test(pelStr)) corPel = '#6D9EEB';

        let corTotal = '#FFFFFF', corFonte = '#000000';
        if (total >= 1000) { corTotal = '#38761D'; corFonte = '#FFFFFF'; }
        else if (total >= 500) corTotal = '#93C47D';
        else if (total >= 200) corTotal = '#FFFF00';
        else if (total >= 50) corTotal = '#FF9900';

        backgrounds.push([corPel, corPel, corPel, corPel, corPel, corPel, corPel, corTotal, corPel, corPel]);
        fontColors.push(Array(10).fill('#000000').map((v, i) => i === 7 ? corFonte : v));
      });

      const range = novaAba.getRange(2, 1, ranking.length, 10);
      range.setBackgrounds(backgrounds);
      range.setFontColors(fontColors);
      range.setHorizontalAlignment("center");
      novaAba.getRange(2, 5, ranking.length, 1).setHorizontalAlignment("left");
    }

    novaAba.autoResizeColumns(1, 10);

    const duration = (new Date() - startTime) / 1000;
    const nomeLog = modo === 'ANUAL' ? 'LOG_DROGAS_ANUAL' : 'LOG_DROGAS_LIVRE';
    let abaLog = ss.getSheetByName(nomeLog) || ss.insertSheet(nomeLog);
    abaLog.clear();

    const conteudoLog = [
      ['RELATÓRIO DE EXECUÇÃO - COMPILADOR DE ENTORPECENTES'],
      ['Modo:', modo],
      ['Data/Hora:', Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss")],
      ['Duração:', duration.toFixed(2) + ' segundos'],
      ['Aba Gerada:', nomeFinal],
      ['Meses Processados:', logs.abasProcessadas.length],
      [''],
      ['ESTATÍSTICAS GERAIS'],
      ['Linhas Lidas:', logs.linhasLidas],
      ['Policiais Únicos:', logs.policiaisUnicos],
      ['Linhas Ignoradas:', logs.linhasIgnoradas],
      ['Total Maconha:', logs.totalMac.toFixed(2) + ' g'],
      ['Total Cocaína:', logs.totalCoc.toFixed(2) + ' g'],
      ['Total Geral:', (logs.totalMac + logs.totalCoc).toFixed(2) + ' g'],
      [''],
      ['AVISOS']
    ];

    logs.avisosGerados.forEach(aviso => conteudoLog.push(['•', aviso]));

    abaLog.getRange(1, 1, conteudoLog.length, 2).setValues(conteudoLog.map(l => l.length === 1 ? [l[0], ''] : l));
    abaLog.autoResizeColumns(1, 2);

    ui.alert('✅ Sucesso!', `Compilação finalizada!\nAba gerada: ${nomeFinal}`, ui.ButtonSet.OK);

  } catch (error) {
    ui.alert('🛑 ERRO BLOQUEANTE', error.message, ui.ButtonSet.OK);
  }
}