/**
 * ARQUIVO: Render/RendererCA.js
 * PILAR 3: Apresentação e Renderização Premium
 * DESCRIÇÃO: Renderizador Master da Central Analítica (CA).
 * Incorpora 100% da tecnologia visual operacional do PMPE (Cores por Pelotão/GTAR,
 * Destaques de Armas, Legenda Visual, Carimbo Institucional e Formatação Fina de Larguras).
 */
const RendererCA = {
  /**
   * Renderiza o Painel Mestre da Central Analítica com toda a tecnologia visual PMPE.
   * @param {SpreadsheetApp.Spreadsheet} ss - Planilha ativa.
   * @param {string} nomeAba - Nome da aba (ex: CA_2026 ou CA_JAN2026_JUL2026).
   * @param {Array<Object>} registros - Lista de RegistroAnalitico ordenados.
   * @param {Object} metadata - Informações da execução.
   */
  renderizar(ss, nomeAba, registros, metadata) {
    let sheet = ss.getSheetByName(nomeAba);
    if (!sheet) {
      sheet = ss.insertSheet(nomeAba);
    } else {
      sheet.clear();
      if (sheet.getFilter()) sheet.getFilter().remove();
      sheet.clearConditionalFormatRules();
    }

    const totalColunas = 16; // 16 Colunas da Central Analítica Mestre
    const linhaTitulo = 2;
    const linhaSubtitulo = 4;
    const linhaGrupo = 5;
    const linhaCabecalho = 6;
    const linhaDados = 7;
    const dados = registros || [];
    const ultimaLinhaDados = linhaDados + Math.max(dados.length, 1) - 1;
    const linhaLegenda = ultimaLinhaDados + 3;
    const linhaCarimbo = linhaLegenda + 8;

    // Configurações Globais de Exibição
    sheet.setHiddenGridlines(true);
    sheet.setFrozenRows(linhaCabecalho);

    // 1. Banner Principal de Título Institucional (Linhas 2-3)
    sheet.getRange(linhaTitulo, 1, 2, totalColunas).merge()
      .setValue('CENTRAL ANALÍTICA — PAINEL MESTRE (ERA 3)')
      .setFontFamily('Arial')
      .setFontSize(20)
      .setFontWeight('bold')
      .setHorizontalAlignment('center')
      .setVerticalAlignment('middle')
      .setBackground('#064e3b')
      .setFontColor('#ffffff')
      .setBorder(true, true, true, true, false, false, '#000000', SpreadsheetApp.BorderStyle.SOLID_THICK);

    // 2. Subtítulo com Metadados da Apuração (Linha 4)
    const textoSubtitulo = `Período: ${metadata.periodo || '2026'} | Policiais Consolidados: ${metadata.totalPoliciais || 0} | Ocorrências Únicas: ${metadata.totalOcorrencias || 0} | Processado em: ${metadata.tempoSegundos || 0}s`;
    sheet.getRange(linhaSubtitulo, 1, 1, totalColunas).merge()
      .setValue(textoSubtitulo)
      .setFontFamily('Arial')
      .setFontSize(10)
      .setFontColor('#374151')
      .setHorizontalAlignment('center');

    // 3. Cabeçalho de Agrupamento das Colunas (Linha 5)
    sheet.getRange(linhaGrupo, 1, 1, 5).merge().setValue('IDENTIFICAÇÃO OPERACIONAL');
    sheet.getRange(linhaGrupo, 6).setValue('OCORRÊNCIAS');
    sheet.getRange(linhaGrupo, 7).setValue('PONTUAÇÃO');
    sheet.getRange(linhaGrupo, 8).setValue('ARMAS');
    sheet.getRange(linhaGrupo, 9, 1, 4).merge().setValue('ENTORPECENTES (GRAMAS)');
    sheet.getRange(linhaGrupo, 13, 1, 4).merge().setValue('PROCEDIMENTOS & DETIDOS');

    sheet.getRange(linhaGrupo, 1, 1, totalColunas)
      .setBackground('#334155')
      .setFontColor('#ffffff')
      .setFontWeight('bold')
      .setHorizontalAlignment('center')
      .setVerticalAlignment('middle')
      .setBorder(true, true, true, true, true, true, '#000000', SpreadsheetApp.BorderStyle.SOLID);

    // 4. Cabeçalho Detalhado (Linha 6)
    const headers = [
      'RANK', 'GRAD', 'MATRÍCULA', 'NOME DE GUERRA', 'ESCALA / PEL',
      '2026', 'PONTOS', 'ARMAS', 'MACONHA', 'CRACK', 'COCAÍNA', 'TOTAL DROGAS',
      'DETIDOS', 'APFD', 'TCO', 'BOC'
    ];

    sheet.getRange(linhaCabecalho, 1, 1, totalColunas).setValues([headers]);
    sheet.getRange(linhaCabecalho, 1, 1, totalColunas)
      .setBackground('#f1f5f9')
      .setFontColor('#0f172a')
      .setFontWeight('bold')
      .setHorizontalAlignment('center')
      .setVerticalAlignment('middle')
      .setBorder(true, true, true, true, true, true, '#000000', SpreadsheetApp.BorderStyle.SOLID);

    // 5. Preenchimento de Dados com Cores Operacionais PMPE (Linha 7+)
    if (dados.length > 0) {
      const matrizDados = dados.map((reg, idx) => [
        idx + 1,
        reg.grad || reg.graduacao || 'N/I',
        reg.matricula || 'N/I',
        reg.nome || 'N/I',
        reg.pelotao || 'N/I',
        reg.fatos ? reg.fatos.ocorrencias : (reg.ocorrencias || 0),
        reg.indicadores ? reg.indicadores.pontosTotais : (reg.pontosTotais || 0),
        reg.fatos ? reg.fatos.armas : (reg.armas || 0),
        reg.fatos ? reg.fatos.maconha : (reg.maconha || 0),
        reg.fatos ? reg.fatos.crack : (reg.crack || 0),
        reg.fatos ? reg.fatos.cocaina : (reg.cocaina || 0),
        reg.fatos ? reg.fatos.drogasTotal : (reg.drogasTotal || 0),
        reg.fatos ? reg.fatos.detidos : (reg.detidos || 0),
        reg.fatos ? reg.fatos.apfd : (reg.apfd || 0),
        reg.fatos ? reg.fatos.tco : (reg.tco || 0),
        reg.fatos ? reg.fatos.boc : (reg.boc || 0)
      ]);

      const rangeDados = sheet.getRange(linhaDados, 1, dados.length, totalColunas);
      rangeDados.setValues(matrizDados)
        .setFontFamily('Arial')
        .setFontSize(10)
        .setVerticalAlignment('middle')
        .setBorder(true, true, true, true, true, true, '#000000', SpreadsheetApp.BorderStyle.SOLID);

      // Aplicar Sistema de Cores Operacionais PMPE (Pelotões & Armas)
      RendererCA.aplicarCoresOperacionais(sheet, dados, linhaDados);
      sheet.getRange(linhaCabecalho, 1, dados.length + 1, totalColunas).createFilter();
    } else {
      sheet.getRange(linhaDados, 1, 1, totalColunas).merge()
        .setValue('Nenhum dado de produtividade encontrado para o período.')
        .setHorizontalAlignment('center');
    }

    // 6. Alinhamentos e Formatação Numérica
    sheet.getRange(linhaDados, 1, Math.max(dados.length, 1), 1).setHorizontalAlignment('center'); // Rank
    sheet.getRange(linhaDados, 2, Math.max(dados.length, 1), 2).setHorizontalAlignment('center'); // Grad / Matrícula
    sheet.getRange(linhaDados, 5, Math.max(dados.length, 1), 1).setHorizontalAlignment('center'); // Pelotão
    sheet.getRange(linhaDados, 6, Math.max(dados.length, 1), 10).setHorizontalAlignment('center'); // Números gerais

    // Formatação de Pontuação (Col 7) e Drogas (Cols 9, 10, 11, 12)
    sheet.getRange(linhaDados, 7, Math.max(dados.length, 1), 1).setNumberFormat('#,##0.00');
    sheet.getRange(linhaDados, 9, Math.max(dados.length, 1), 4).setNumberFormat('#,##0.00');

    // 7. Legenda e Carimbo de Autenticidade Institucional
    RendererCA.renderizarLegenda(sheet, linhaLegenda);
    RendererCA.renderizarCarimbo(sheet, linhaCarimbo, totalColunas, metadata);
    RendererCA.ajustarLayout(sheet);
  },

  /**
   * Aplica as cores operacionais por Pelotão/GTAR e destaque de Armas.
   */
  aplicarCoresOperacionais(sheet, registros, linhaInicial) {
    registros.forEach((reg, index) => {
      const linha = linhaInicial + index;
      const corLinha = RendererCA.corPorGrupo(reg);
      const rangeLinha = sheet.getRange(linha, 1, 1, 16);
      
      rangeLinha.setBackground(corLinha.fundo)
                .setFontColor(corLinha.fonte)
                .setFontWeight(corLinha.negrito ? 'bold' : 'normal');

      // Destaque Operacional para Coluna de Armas (Coluna 8)
      const armas = Number(reg.fatos ? reg.fatos.armas : (reg.armas || 0));
      const corArmas = RendererCA.corPorArmas(armas);
      if (corArmas) {
        sheet.getRange(linha, 8).setBackground(corArmas.fundo).setFontColor(corArmas.fonte).setFontWeight('bold');
      }
    });
  },

  /**
   * Mapeia as cores institucionais do PMPE por Graduação / Pelotão.
   */
  corPorGrupo(reg) {
    const grad = (reg.grad || reg.graduacao || '').toUpperCase();
    const pelotao = (reg.pelotao || '').toUpperCase();

    if (/(MAJ|CAP|TEN|ASP|CEL|TC)/.test(grad)) {
      return { fundo: '#f1c232', fonte: '#000000' }; // Oficiais (Amarelo Ouro)
    }
    if (pelotao.includes('GTAR') && pelotao.includes('1')) {
      return { fundo: '#00cc00', fonte: '#000000', negrito: true }; // 1º PEL GTAR (Verde Forte)
    }
    if (pelotao.includes('GTAR') && pelotao.includes('2')) {
      return { fundo: '#3c78d8', fonte: '#ffffff', negrito: true }; // 2º PEL GTAR (Azul Escuro)
    }
    if (pelotao.includes('1') && pelotao.includes('PEL')) {
      return { fundo: '#00ff00', fonte: '#000000' }; // 1º PEL (Verde Claro)
    }
    if (pelotao.includes('2') && pelotao.includes('PEL')) {
      return { fundo: '#6d9eeb', fonte: '#000000' }; // 2º PEL (Azul Claro)
    }
    return { fundo: '#ffffff', fonte: '#000000' }; // Padrão
  },

  /**
   * Mapeia as cores de destaque por faixas de apreensão de armas.
   */
  corPorArmas(qtd) {
    if (qtd === 0) return { fundo: '#fee2e2', fonte: '#991b1b' }; // 0 Armas (Vermelho Suave)
    if (qtd >= 10) return { fundo: '#38761d', fonte: '#ffffff' }; // 10+ (Verde Escuro)
    if (qtd >= 6) return { fundo: '#93c47d', fonte: '#000000' };  // 6 a 9 (Verde Médio)
    if (qtd >= 4) return { fundo: '#ffff00', fonte: '#000000' };  // 4 a 5 (Amarelo)
    if (qtd >= 1) return { fundo: '#ff9900', fonte: '#000000' };  // 1 a 3 (Laranja)
    return null;
  },

  /**
   * Desenha a Legenda Visual Institucional no rodapé do relatório.
   */
  renderizarLegenda(sheet, linhaInicial) {
    sheet.getRange(linhaInicial, 1).setValue('LEGENDA DE LOTAÇÃO & ESCALAS').setFontWeight('bold');

    const legendaPel = [
      ['Oficiais', '#f1c232', '#000000'],
      ['1º PEL', '#00ff00', '#000000'],
      ['1º PEL GTAR', '#00cc00', '#000000'],
      ['2º PEL', '#6d9eeb', '#000000'],
      ['2º PEL GTAR', '#3c78d8', '#ffffff'],
      ['3º PEL', '#ffffff', '#000000']
    ];
    legendaPel.forEach((item, index) => {
      const linha = linhaInicial + 1 + index;
      sheet.getRange(linha, 1).setBackground(item[1]).setBorder(true, true, true, true, false, false, '#000000', SpreadsheetApp.BorderStyle.SOLID);
      sheet.getRange(linha, 2).setValue(item[0]).setFontColor(item[2]).setBorder(true, true, true, true, false, false, '#000000', SpreadsheetApp.BorderStyle.SOLID);
    });

    sheet.getRange(linhaInicial, 5).setValue('DESTAQUE DE ARMAS').setFontWeight('bold').setHorizontalAlignment('center');
    const legendaArmas = [
      ['1 a 3 Armas', '#ff9900', '#000000'],
      ['4 a 5 Armas', '#ffff00', '#000000'],
      ['6 a 9 Armas', '#93c47d', '#000000'],
      ['10+ Armas', '#38761d', '#ffffff']
    ];
    legendaArmas.forEach((item, index) => {
      const linha = linhaInicial + 1 + index;
      sheet.getRange(linha, 4).setValue(item[0]);
      sheet.getRange(linha, 5).setBackground(item[1]).setFontColor(item[2]).setFontWeight('bold')
        .setBorder(true, true, true, true, false, false, '#000000', SpreadsheetApp.BorderStyle.SOLID);
    });
  },

  /**
   * Imprime o Carimbo de Autenticidade e Rastreabilidade na última linha.
   */
  renderizarCarimbo(sheet, linha, totalColunas, metadata) {
    const texto = [
      `Gerado em: ${formatarDataBR(new Date())} ${new Date().toLocaleTimeString('pt-BR')}`,
      `Período: ${metadata.periodo || '2026'}`,
      `Abas Processadas: ${metadata.abasLidas ? metadata.abasLidas.join(', ') : '-'}`,
      `Policiais Consolidados: ${metadata.totalPoliciais || 0}`,
      `Ocorrências Únicas: ${metadata.totalOcorrencias || 0}`,
      `Fonte: CENTRAL ANALÍTICA / SYNTHÉON ERA 3`
    ].join(' | ');

    sheet.getRange(linha, 1, 1, totalColunas).merge()
      .setValue(texto)
      .setFontSize(9)
      .setFontColor('#4b5563')
      .setHorizontalAlignment('center')
      .setBackground('#f8fafc')
      .setBorder(true, true, true, true, false, false, '#cbd5e1', SpreadsheetApp.BorderStyle.SOLID);
  },

  /**
   * Ajusta as larguras de coluna e tipografia Arial.
   */
  ajustarLayout(sheet) {
    sheet.setColumnWidth(1, 48);  // Rank
    sheet.setColumnWidth(2, 72);  // Grad
    sheet.setColumnWidth(3, 96);  // Matrícula
    sheet.setColumnWidth(4, 240); // Nome
    sheet.setColumnWidth(5, 110); // Pelotão
    sheet.setColumnWidth(6, 72);  // Ocorrências
    sheet.setColumnWidth(7, 100); // Pontuação
    sheet.setColumnWidth(8, 80);  // Armas
    sheet.setColumnWidth(9, 90);  // Maconha
    sheet.setColumnWidth(10, 80); // Crack
    sheet.setColumnWidth(11, 80); // Cocaína
    sheet.setColumnWidth(12, 110); // Total Drogas
    sheet.setColumnWidth(13, 72); // Detidos
    sheet.setColumnWidth(14, 68); // APFD
    sheet.setColumnWidth(15, 68); // TCO
    sheet.setColumnWidth(16, 68); // BOC

    sheet.getRange(1, 1, sheet.getMaxRows(), 16).setFontFamily('Arial');
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = RendererCA;
}
