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

    const pelotoes = rankingOrdenado.map(p => p.pelotao || p.lote || p.designacao || p.grupo || '');

    // 5. Criar aba de resultados com a formatação original intocada
    const nomeAbaResultado = criarAbaResultadoCPM_(ss, rankingFormatado, dataInicio, dataFim, modo, pelotoes);

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

/**
 * Retorna a paleta oficial de cores para o CPM com base na graduação e lotação (TASK-M06.2-03A).
 * @param {string} grad 
 * @param {string} pelotao 
 * @returns {{ fundo: string, fonte: string, negrito: boolean }}
 */
function corPorGrupoCpm_(grad, pelotao) {
  const pelStr = String(pelotao || '').toUpperCase().trim();
  const gradStr = String(grad || '').toUpperCase().trim();

  if (pelStr.includes('OFICIAIS') || gradStr.includes('TEN') || gradStr.includes('CAP') || gradStr.includes('MAJ') || gradStr.includes('CEL')) {
    return { fundo: '#F1C232', fonte: '#000000', negrito: false };
  }
  if (pelStr.includes('GTAR')) {
    if (pelStr.includes('1') || pelStr.includes('1º') || pelStr.includes('1º PEL')) {
      return { fundo: '#00CC00', fonte: '#000000', negrito: true };
    }
    return { fundo: '#3C78D8', fonte: '#FFFFFF', negrito: true };
  }
  if (pelStr.includes('1º PEL') || pelStr.includes('1 PEL') || pelStr === '1') {
    return { fundo: '#00FF00', fonte: '#000000', negrito: false };
  }
  if (pelStr.includes('2º PEL') || pelStr.includes('2 PEL') || pelStr === '2') {
    return { fundo: '#6D9EEB', fonte: '#000000', negrito: false };
  }
  return { fundo: '#FFFFFF', fonte: '#000000', negrito: false };
}

function criarAbaResultadoCPM_(ss, ranking, dataInicio, dataFim, modo, pelotoes) {
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

  const borderStyle = (typeof SpreadsheetApp !== 'undefined' && SpreadsheetApp.BorderStyle)
    ? SpreadsheetApp.BorderStyle.SOLID
    : 'SOLID';

  sheet.getRange(1, 1, 1, 6)
    .setValues(cabecalho)
    .setFontFamily('Arial')
    .setFontSize(10)
    .setFontWeight('bold')
    .setBackground('#d9ead3')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setBorder(true, true, true, true, true, true, '#000000', borderStyle);

  if (ranking.length > 0) {
    const rangeDados = sheet.getRange(2, 1, ranking.length, 6);
    rangeDados.setValues(ranking)
      .setFontFamily('Arial')
      .setFontSize(10)
      .setVerticalAlignment('middle')
      .setBorder(true, true, true, true, true, true, '#000000', borderStyle);

    sheet.getRange(2, 1, ranking.length, 3).setHorizontalAlignment('center'); // RANK, GRAD, MAT
    sheet.getRange(2, 4, ranking.length, 1).setHorizontalAlignment('left');   // NOME COMPLETO
    sheet.getRange(2, 5, ranking.length, 1).setHorizontalAlignment('center').setNumberFormat('#,##0');   // OCORRÊNCIAS
    sheet.getRange(2, 6, ranking.length, 1).setHorizontalAlignment('center').setNumberFormat('#,##0.00'); // PONTUAÇÃO

    ranking.forEach((r, idx) => {
      const lin = 2 + idx;
      const grad = r[1];
      const pelotao = (pelotoes && pelotoes[idx]) ? pelotoes[idx] : (r.length > 6 ? r[6] : (r.pelotao || ''));
      const cor = corPorGrupoCpm_(grad, pelotao);
      const rangeLin = sheet.getRange(lin, 1, 1, 6);
      rangeLin.setBackground(cor.fundo).setFontColor(cor.fonte);
      if (cor.negrito) {
        rangeLin.setFontWeight('bold');
      }
    });
  }

  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, Math.max(1, ranking.length + 1), 6).createFilter();
  sheet.autoResizeColumns(1, 6);

  return nomeFinal;
}