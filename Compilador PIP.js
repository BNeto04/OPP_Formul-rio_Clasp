/**
 * PROJETO: COMPILADOR PIP GS
 * VERSÃO: 2.0 (com aliases de cabeçalho, validação rígida do EFETIVO e auditoria de integridade)
 * REGRA: período de apuração sempre de 29 do mês anterior até 28 do mês vigente.
 * BASE:
 * - Abas mensais: matrícula, data, AJ = Pontos Ficção, AK = Chave da Ocorrência.
 * - Aba EFETIVO: Coluna C = Nome completo, D = Graduação, E = Matrícula.
 */

// [card #134] `criarMenuPip_()` REMOVIDO: builder de menu morto (zero chamadores; o onOpen unico agora e
// o P3 em Entrada/Menu.js). Os itens do PIP continuam iguais dentro de `P3 > PIP / CPM > PIP | Ciclo 29-28`.

// ============================================================================
// CONFIGURAÇÕES
// ============================================================================

const CONFIG_PIP = {
  abaEfetivo: (typeof CONSTANTES_SYNTHEON !== 'undefined' && CONSTANTES_SYNTHEON.ABA_EFETIVO) || 'EFETIVO',

  // EFETIVO
  efetivoNomeCol: 3,       // C
  efetivoGradCol: 4,       // D
  efetivoMatriculaCol: 5,  // E

  meses: (typeof CONFIG_SYNTHEON !== 'undefined' && CONFIG_SYNTHEON.ABAS && CONFIG_SYNTHEON.ABAS.MESES_2026)
    ? CONFIG_SYNTHEON.ABAS.MESES_2026
    : [
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
const ALIASES = {
  DATA: ['DATA', 'DT'],
  MATRICULA: ['MATRICULA', 'MAT.', 'MAT', 'MATR'],
  PONTOS_FICCAO: ['PONTOS FICCAO (1/4)', 'PONTOS FICCAO', 'AJ', 'PONTOS'],
  CHAVE_OCORRENCIA: ['CHAVE OCORRENCIA', 'CHAVE', 'AK']
};

// ============================================================================
// MENUS
// ============================================================================

function abrirMenuPipMensal() {
  const html = HtmlService.createHtmlOutput(`
    <div style="font-family: Arial; padding: 10px;">
      <h3>Gerar PIP Mensal</h3>
      <p>O sistema usará o ciclo 29 do mês anterior até 28 do mês escolhido.</p>

      <select id="mes" style="width:100%; padding:6px;">
        ${CONFIG_PIP.meses.map(m => `<option value="${m.nome}">${m.nome}</option>`).join('')}
      </select>

      <br><br>

      <button onclick="executar()" style="padding:8px 14px; background:#0f9d58; color:white; border:0; border-radius:4px;">
        Gerar PIP
      </button>

      <script>
        function executar() {
          const mes = document.getElementById('mes').value;
          google.script.run.withSuccessHandler(google.script.host.close).gerarPipMensal(mes);
        }
      </script>
    </div>
  `).setWidth(350).setHeight(220);

  SpreadsheetApp.getUi().showModalDialog(html, 'Compilador PIP');
}

function abrirMenuPipLivre() {
  const html = HtmlService.createHtmlOutput(`
    <div style="font-family: Arial; padding: 10px;">
      <h3>Seleção Livre</h3>
      <p>Selecione as abas que deseja processar.</p>

      ${CONFIG_PIP.meses.map(m => `
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

          google.script.run.withSuccessHandler(google.script.host.close).executarCompiladorPip(selecionados, null, null, 'LIVRE');
        }
      </script>
    </div>
  `).setWidth(350).setHeight(430);

  SpreadsheetApp.getUi().showModalDialog(html, 'Seleção Livre PIP');
}

function gerarPipAnual() {
  const ui = SpreadsheetApp.getUi();

  const resposta = ui.alert(
    'PIP Anual',
    'Deseja processar todas as abas de 2026?',
    ui.ButtonSet.YES_NO
  );

  if (resposta === ui.Button.YES) {
    const meses = CONFIG_PIP.meses.map(m => m.nome);
    executarCompiladorPip(meses, null, null, 'ANUAL');
  }
}

// ============================================================================
// EXECUÇÃO MENSAL COM CICLO 29–28
// ============================================================================

function gerarPipMensal(nomeMesAlvo) {
  const alvo = CONFIG_PIP.meses.find(m => m.nome === nomeMesAlvo);

  if (!alvo) {
    SpreadsheetApp.getUi().alert('Mês inválido.');
    return;
  }

  const periodo = calcularPeriodoPip(alvo.mes, alvo.ano);
  const abas = obterAbasDoPeriodo(periodo.inicio, periodo.fim);

  executarCompiladorPip(abas, periodo.inicio, periodo.fim, `PIP_${alvo.label}_${alvo.ano}`);
}

function calcularPeriodoPip(mes, ano) {
  let mesAnterior = mes - 1;
  let anoAnterior = ano;

  if (mesAnterior < 0) {
    mesAnterior = 11;
    anoAnterior--;
  }

  return {
    inicio: new Date(anoAnterior, mesAnterior, 29),
    fim: new Date(ano, mes, 28, 23, 59, 59)
  };
}

function obterAbasDoPeriodo(inicio, fim) {
  const abas = new Set();

  CONFIG_PIP.meses.forEach(m => {
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

function executarCompiladorPip(abasAlvo, dataInicio, dataFim, modo) {
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

    // 2. Acúmulo de métricas por policial (PIP e lotação)
    const produtividade = SyntheonMetricas.consolidarPoliciais(ocorrencias);

    // 3. Classificação pelo Ranking parametrizado por Pontos
    const criterios = ['PONTOS', 'OCORRENCIAS'];
    const rankingOrdenado = SyntheonRanking.gerarRanking(produtividade, criterios);

    // 4. Mapear para o formato com DESIGNAÇÃO oficial do EFETIVO
    const rankingFormatado = rankingOrdenado.map(p => [
      p.rank,
      p.grad,
      p.matricula,
      p.nome,
      p.pelotao || 'N/I',
      (p.indicadores && p.indicadores.pontosPIP !== undefined) ? p.indicadores.pontosPIP : (p.pontosPIP || 0),
      (p.fatos && p.fatos.ocorrencias !== undefined) ? p.fatos.ocorrencias : (p.ocorrencias || 0)
    ]);

    // 5. Criar aba de resultados com a formatação original intocada
    const nomeAbaResultado = criarAbaResultado_(ss, rankingFormatado, dataInicio, dataFim, modo);

    // 6. Gravar log de auditoria estruturado
    logger.gravarPlanilha('LOG_PIP', nomeAbaResultado);

    const tempo = logger.getTempoExecucaoSegundos();

    ui.alert(
      'COMPILAÇÃO PIP CONCLUÍDA',
      `Aba gerada: ${nomeAbaResultado}\n\n` +
      `Policiais processados: ${rankingFormatado.length}\n` +
      `Pontuação distribuída: ${rankingOrdenado.reduce((s, r) => s + ((r.indicadores && r.indicadores.pontosPIP !== undefined) ? r.indicadores.pontosPIP : (r.pontosPIP || 0)), 0).toLocaleString('pt-BR')}\n` +
      `Linhas válidas: ${logger.linhasValidas}\n` +
      `Linhas ignoradas: ${logger.linhasIgnoradas}\n` +
      `Duplicidades eliminadas: ${logger.duplicidades}\n` +
      `Tempo: ${tempo}s`,
      ui.ButtonSet.OK
    );

  } catch (erro) {
    ui.alert('ERRO NO COMPILADOR PIP', erro.message, ui.ButtonSet.OK);
  }
}

function corPorGrupoPip_(grad, designacao) {
  const g = SyntheonUtils.normalizarTexto(grad || '');
  const d = SyntheonUtils.normalizarTexto(designacao || '');

  if (/(MAJ|CAP|TEN|ASP|CEL|TC)/.test(g)) {
    return { fundo: '#f1c232', fonte: '#000000' };
  }
  if (d.includes('GTAR') && d.includes('1')) {
    return { fundo: '#00cc00', fonte: '#000000', negrito: true };
  }
  if (d.includes('GTAR') && d.includes('2')) {
    return { fundo: '#3c78d8', fonte: '#ffffff', negrito: true };
  }
  if (d.includes('1') && d.includes('PEL')) {
    return { fundo: '#00ff00', fonte: '#000000' };
  }
  if (d.includes('2') && d.includes('PEL')) {
    return { fundo: '#6d9eeb', fonte: '#000000' };
  }
  return { fundo: '#ffffff', fonte: '#000000' };
}

function criarAbaResultado_(ss, ranking, dataInicio, dataFim, modo) {
  let nomeBase;

  if (modo && modo.startsWith('PIP_')) {
    nomeBase = modo;
  } else if (modo === 'ANUAL') {
    nomeBase = 'PIP_ANUAL_2026';
  } else {
    nomeBase = 'PIP_SELECAO_LIVRE';
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
    'DESIGNAÇÃO',
    'PONTUAÇÃO',
    'QTD OC.'
  ]];

  const borderStyle = (typeof SpreadsheetApp !== 'undefined' && SpreadsheetApp.BorderStyle)
    ? SpreadsheetApp.BorderStyle.SOLID
    : 'SOLID';

  sheet.getRange(1, 1, 1, 7)
    .setValues(cabecalho)
    .setFontFamily('Arial')
    .setFontSize(10)
    .setFontWeight('bold')
    .setBackground('#d9ead3')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setBorder(true, true, true, true, true, true, '#000000', borderStyle);

  if (ranking.length > 0) {
    const rangeDados = sheet.getRange(2, 1, ranking.length, 7);
    rangeDados.setValues(ranking)
      .setFontFamily('Arial')
      .setFontSize(10)
      .setVerticalAlignment('middle')
      .setBorder(true, true, true, true, true, true, '#000000', borderStyle);

    sheet.getRange(2, 1, ranking.length, 3).setHorizontalAlignment('center'); // RANK, GRAD, MAT
    sheet.getRange(2, 4, ranking.length, 2).setHorizontalAlignment('left');   // NOME COMPLETO, DESIGNAÇÃO
    sheet.getRange(2, 6, ranking.length, 1).setHorizontalAlignment('right').setNumberFormat('#,##0.00'); // PONTUAÇÃO
    sheet.getRange(2, 7, ranking.length, 1).setHorizontalAlignment('right').setNumberFormat('#,##0'); // QTD OC.

    ranking.forEach((r, idx) => {
      const lin = 2 + idx;
      const cor = corPorGrupoPip_(r[1], r[4]);
      const rangeLin = sheet.getRange(lin, 1, 1, 7);
      rangeLin.setBackground(cor.fundo).setFontColor(cor.fonte);
      if (cor.negrito) {
        rangeLin.setFontWeight('bold');
      }
    });
  }

  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, Math.max(1, ranking.length + 1), 7).createFilter();
  sheet.autoResizeColumns(1, 7);

  return nomeFinal;
}