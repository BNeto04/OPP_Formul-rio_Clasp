/**
 * PROJETO: CPM - COMPILADOR DE PONTUAÇÃO MENSAL GS
 * VERSÃO: 2.0 (com aliases de cabeçalho, validação rígida do EFETIVO e auditoria de integridade)
 * REGRA: período de apuração mensal fechado, do dia 1º ao último dia do mês.
 * BASE:
 * - Abas mensais: matrícula, data, AJ = Pontos Ficção, AK = Chave da Ocorrência.
 * - Aba EFETIVO: Coluna C = Nome completo, D = Graduação, E = Matrícula.
 */


// IMPORTANTE:
// Para exibir este menu junto dos demais, adicione a linha abaixo dentro do seu onOpen() principal:
// criarMenuCPM_();

function criarMenuCPM_() {
  SpreadsheetApp.getUi()
    .createMenu('⭐ CPM')
    .addItem('▶ Gerar Mensal', 'abrirMenuCPMMensal')
    .addItem('📅 Seleção Livre', 'abrirMenuCPMLivre')
    .addItem('📊 Anual', 'gerarCPMAnual')
    .addToUi();
}

// ============================================================================
// CONFIGURAÇÕES
// ============================================================================

const CONFIG_CPM = {
  abaEfetivo: 'EFETIVO',

  // EFETIVO
  efetivoNomeCol: 3,       // C
  efetivoGradCol: 4,       // D
  efetivoMatriculaCol: 5,  // E

  meses: [
    { nome: 'JAN2026', mes: 0, ano: 2026, label: 'JAN' },
    { nome: 'FEV2026', mes: 1, ano: 2026, label: 'FEV' },
    { nome: 'MAR2026', mes: 2, ano: 2026, label: 'MAR' },
    { nome: 'ABR2026', mes: 3, ano: 2026, label: 'ABR' },
    { nome: 'MAI2026', mes: 4, ano: 2026, label: 'MAI' },
    { nome: 'JUN2026', mes: 5, ano: 2026, label: 'JUN' },
    { nome: 'JUL2026', mes: 6, ano: 2026, label: 'JUL' },
    { nome: 'AGO2026', mes: 7, ano: 2026, label: 'AGO' },
    { nome: 'SET2026', mes: 8, ano: 2026, label: 'SET' },
    { nome: 'OUT2026', mes: 9, ano: 2026, label: 'OUT' },
    { nome: 'NOV2026', mes: 10, ano: 2026, label: 'NOV' },
    { nome: 'DEZ2026', mes: 11, ano: 2026, label: 'DEZ' }
  ]
};

// Dicionário de aliases — basta acrescentar uma string nova caso o cabeçalho mude no futuro.
const ALIASES_CPM = {
  DATA: ['DATA', 'DT'],
  MATRICULA: ['MATRICULA', 'MAT.', 'MAT', 'MATR'],
  PONTOS_FICCAO: ['PONTOS FICCAO (1/4)', 'PONTOS FICCAO', 'AJ', 'PONTOS'],
  CHAVE_OCORRENCIA: ['CHAVE OCORRENCIA', 'CHAVE', 'AK']
};

// ============================================================================
// MENUS
// ============================================================================

function abrirMenuCPMMensal() {
  const html = HtmlService.createHtmlOutput(`
    <div style="font-family: Arial; padding: 10px;">
      <h3>Gerar Mensal</h3>
      <p>O sistema usará o mês fechado: dia 1º até o último dia do mês escolhido.</p>

      <select id="mes" style="width:100%; padding:6px;">
        ${CONFIG_CPM.meses.map(m => `<option value="${m.nome}">${m.nome}</option>`).join('')}
      </select>

      <br><br>

      <button onclick="executar()" style="padding:8px 14px; background:#0f9d58; color:white; border:0; border-radius:4px;">
        Gerar Mensal
      </button>

      <script>
        function executar() {
          const mes = document.getElementById('mes').value;
          google.script.run.withSuccessHandler(google.script.host.close).gerarCPMMensal(mes);
        }
      </script>
    </div>
  `).setWidth(350).setHeight(220);

  SpreadsheetApp.getUi().showModalDialog(html, '⭐ CPM');
}

function abrirMenuCPMLivre() {
  const html = HtmlService.createHtmlOutput(`
    <div style="font-family: Arial; padding: 10px;">
      <h3>Seleção Livre</h3>
      <p>Selecione as abas que deseja processar.</p>

      ${CONFIG_CPM.meses.map(m => `
        <label>
          <input type="checkbox" name="mes" value="${m.nome}"> ${m.nome}
        </label><br>
      `).join('')}

      <br>

      <button onclick="executar()" style="padding:8px 14px; background:#0f9d58; color:white; border:0; border-radius:4px;">
        Compilar
      </button>

      <script>
        function executar() {
          const selecionados = Array.from(document.querySelectorAll('input[name="mes"]:checked')).map(c => c.value);

          if (selecionados.length === 0) {
            alert('Selecione pelo menos um mês.');
            return;
          }

          google.script.run.withSuccessHandler(google.script.host.close).executarCompiladorCPM(selecionados, null, null, 'LIVRE');
        }
      </script>
    </div>
  `).setWidth(350).setHeight(430);

  SpreadsheetApp.getUi().showModalDialog(html, 'Seleção Livre CPM');
}

function gerarCPMAnual() {
  const ui = SpreadsheetApp.getUi();

  const resposta = ui.alert(
    'CPM Anual',
    'Deseja processar todas as abas de 2026?',
    ui.ButtonSet.YES_NO
  );

  if (resposta === ui.Button.YES) {
    const meses = CONFIG_CPM.meses.map(m => m.nome);
    executarCompiladorCPM(meses, null, null, 'ANUAL');
  }
}

// ============================================================================
// EXECUÇÃO MENSAL COM MÊS FECHADO
// ============================================================================

function gerarCPMMensal(nomeMesAlvo) {
  const alvo = CONFIG_CPM.meses.find(m => m.nome === nomeMesAlvo);

  if (!alvo) {
    SpreadsheetApp.getUi().alert('Mês inválido.');
    return;
  }

  const periodo = calcularPeriodoCPM(alvo.mes, alvo.ano);
  const abas = obterAbasDoPeriodoCPM(periodo.inicio, periodo.fim);

  executarCompiladorCPM(abas, periodo.inicio, periodo.fim, `CPM_${alvo.label}_${alvo.ano}`);
}

function calcularPeriodoCPM(mes, ano) {
  return {
    inicio: new Date(ano, mes, 1),
    fim: new Date(ano, mes + 1, 0, 23, 59, 59)
  };
}

function obterAbasDoPeriodoCPM(inicio, fim) {
  const abas = new Set();

  CONFIG_CPM.meses.forEach(m => {
    const dataMes = new Date(m.ano, m.mes, 1);
    const mesmoAnoMesInicio = dataMes.getFullYear() === inicio.getFullYear() && dataMes.getMonth() === inicio.getMonth();
    const mesmoAnoMesFim = dataMes.getFullYear() === fim.getFullYear() && dataMes.getMonth() === fim.getMonth();

    if (mesmoAnoMesInicio || mesmoAnoMesFim) {
      abas.add(m.nome);
    }
  });

  return Array.from(abas);
}

// ============================================================================
// MOTOR PRINCIPAL
// ============================================================================

function executarCompiladorCPM(abasAlvo, dataInicio, dataFim, modo) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  const logger = new SyntheonLogger(modo);

  try {
    // 1. Leitura Universal agrupada e estruturada em ocorrências canônicas
    const ocorrencias = SyntheonLeitor.lerAbas(ss, abasAlvo, dataInicio, dataFim, logger);

    if (ocorrencias.length === 0) {
      ui.alert('Aviso', 'Nenhum registro válido encontrado no período.', ui.ButtonSet.OK);
      return;
    }

    // 2. Acúmulo de métricas por policial (CPM e lotação)
    const produtividade = SyntheonMetricas.consolidarPoliciais(ocorrencias);

    // 3. Classificação pelo Ranking parametrizado por Pontos
    const criterios = ['PONTOS', 'OCORRENCIAS'];
    const rankingOrdenado = SyntheonRanking.gerarRanking(produtividade, criterios);

    // 4. Mapear para o formato legado esperado pelo renderizador de aba
    const rankingFormatado = rankingOrdenado.map(p => [
      p.rank,
      p.grad,
      p.matricula,
      p.nome,
      (p.fatos && p.fatos.ocorrencias !== undefined) ? p.fatos.ocorrencias : (p.ocorrencias || 0),
      (p.indicadores && p.indicadores.pontosCPM !== undefined) ? p.indicadores.pontosCPM : (p.pontosCPM || 0)
    ]);

    // 5. Criar aba de resultados com a formatação original intocada
    const nomeAbaResultado = criarAbaResultadoCPM_(ss, rankingFormatado, dataInicio, dataFim, modo);

    // 6. Gravar log de auditoria estruturado
    logger.gravarPlanilha('LOG_CPM', nomeAbaResultado);

    const tempo = logger.getTempoExecucaoSegundos();

    ui.alert(
      'COMPILAÇÃO CPM CONCLUÍDA',
      `Aba gerada: ${nomeAbaResultado}\n\n` +
      `Policiais processados: ${rankingFormatado.length}\n` +
      `Pontuação distribuída: ${rankingOrdenado.reduce((s, r) => s + ((r.indicadores && r.indicadores.pontosCPM !== undefined) ? r.indicadores.pontosCPM : (r.pontosCPM || 0)), 0).toLocaleString('pt-BR')}\n` +
      `Linhas válidas: ${logger.linhasValidas}\n` +
      `Linhas ignoradas: ${logger.linhasIgnoradas}\n` +
      `Duplicidades eliminadas: ${logger.duplicidades}\n` +
      `Tempo: ${tempo}s`,
      ui.ButtonSet.OK
    );

  } catch (erro) {
    ui.alert('ERRO NO CPM', erro.message, ui.ButtonSet.OK);
  }
}

function criarAbaResultadoCPM_(ss, ranking, dataInicio, dataFim, modo) {
  let nomeBase;

  if (modo && modo.startsWith('CPM_')) {
    nomeBase = modo;
  } else if (modo === 'ANUAL') {
    nomeBase = 'CPM_ANUAL_2026';
  } else {
    nomeBase = 'CPM_SELECAO_LIVRE';
  }

  let nomeFinal = nomeBase;
  let versao = 2;

  while (ss.getSheetByName(nomeFinal)) {
    nomeFinal = `${nomeBase}.v${versao}`;
    versao++;
  }

  const sheet = ss.insertSheet(nomeFinal);

  const cabecalho = [[
    'RANK',
    'GRADUAÇÃO',
    'MATRÍCULA',
    'NOME COMPLETO',
    'OCORRÊNCIAS',
    'PONTUAÇÃO'
  ]];

  sheet.getRange(1, 1, 1, 6)
    .setValues(cabecalho)
    .setFontWeight('bold')
    .setBackground('#d9ead3')
    .setHorizontalAlignment('center');

  if (ranking.length > 0) {
    sheet.getRange(2, 1, ranking.length, 6).setValues(ranking);
    sheet.getRange(2, 6, ranking.length, 1).setNumberFormat('#,##0.00');
    sheet.getRange(2, 1, ranking.length, 3).setHorizontalAlignment('center');
    sheet.getRange(2, 5, ranking.length, 2).setHorizontalAlignment('center');
  }

  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, Math.max(1, ranking.length + 1), 6).createFilter();
  sheet.autoResizeColumns(1, 6);

  return nomeFinal;
}