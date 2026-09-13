/**
 * ARQUIVO: Render/RendererComparativo2026.js
 * DESCRICAO: Renderiza uma saida visual premium para o comparativo anual de 2026.
 */
const RendererComparativo2026 = {
  render(ss, nomeAba, registros, metadata) {
    let sheet = ss.getSheetByName(nomeAba);
    if (!sheet) {
      sheet = ss.insertSheet(nomeAba);
    } else {
      sheet.clear();
      if (sheet.getFilter()) sheet.getFilter().remove();
      sheet.clearConditionalFormatRules();
    }

    const dados = RendererComparativo2026.montarDados(registros);
    const totalColunas = 9;
    const linhaTitulo = 2;
    const linhaGrupo = 5;
    const linhaCabecalho = 6;
    const linhaDados = 7;
    const ultimaLinhaDados = linhaDados + Math.max(dados.length, 1) - 1;
    const linhaLegenda = ultimaLinhaDados + 3;
    const linhaCarimbo = linhaLegenda + 7;

    sheet.setHiddenGridlines(true);
    sheet.setFrozenRows(linhaCabecalho);

    sheet.getRange(linhaTitulo, 1, 2, totalColunas).merge()
      .setValue('Comparativo de produtividade 2026')
      .setFontFamily('Arial')
      .setFontSize(20)
      .setFontWeight('bold')
      .setHorizontalAlignment('center')
      .setVerticalAlignment('middle')
      .setBackground('#ffffff')
      .setBorder(true, true, true, true, false, false, '#000000', SpreadsheetApp.BorderStyle.SOLID_THICK);

    sheet.getRange(4, 1, 1, totalColunas).merge()
      .setValue(`Ano base: 2026 | Periodo: ${metadata.periodo || '-'} | Policiais: ${metadata.policiais || 0}`)
      .setFontFamily('Arial')
      .setFontSize(10)
      .setFontColor('#4b5563')
      .setHorizontalAlignment('center');

    sheet.getRange(linhaGrupo, 1, 1, 5).merge().setValue('IDENTIFICACAO');
    sheet.getRange(linhaGrupo, 6).setValue('QTD. O');
    sheet.getRange(linhaGrupo, 7).setValue('Pontuacao');
    sheet.getRange(linhaGrupo, 8).setValue('QTD. ARMAS');
    sheet.getRange(linhaGrupo, 9).setValue('ENTORPECENTES (g)');
    sheet.getRange(linhaGrupo, 1, 1, totalColunas)
      .setBackground('#9e9e9e')
      .setFontColor('#000000')
      .setFontWeight('bold')
      .setHorizontalAlignment('center')
      .setBorder(true, true, true, true, true, true, '#000000', SpreadsheetApp.BorderStyle.SOLID);

    sheet.getRange(linhaCabecalho, 1, 1, totalColunas).setValues([[
      'N', 'Grad', 'Matricula', 'N GUERRA', 'ESCALA', '2026', '2026', '2026', '2026'
    ]]);
    sheet.getRange(linhaCabecalho, 1, 1, totalColunas)
      .setBackground('#f3f4f6')
      .setFontWeight('bold')
      .setHorizontalAlignment('center')
      .setBorder(true, true, true, true, true, true, '#000000', SpreadsheetApp.BorderStyle.SOLID);

    if (dados.length > 0) {
      const rangeDados = sheet.getRange(linhaDados, 1, dados.length, totalColunas);
      rangeDados.setValues(dados)
        .setFontFamily('Arial')
        .setFontSize(10)
        .setVerticalAlignment('middle')
        .setBorder(true, true, true, true, true, true, '#000000', SpreadsheetApp.BorderStyle.SOLID);

      RendererComparativo2026.aplicarCoresOperacionais(sheet, registros, linhaDados);
      sheet.getRange(linhaCabecalho, 1, dados.length + 1, totalColunas).createFilter();
    } else {
      sheet.getRange(linhaDados, 1, 1, totalColunas).merge()
        .setValue('Nenhum dado de produtividade encontrado para 2026.')
        .setHorizontalAlignment('center');
    }

    sheet.getRange(linhaDados, 1, Math.max(dados.length, 1), 1).setHorizontalAlignment('center');
    sheet.getRange(linhaDados, 2, Math.max(dados.length, 1), 2).setHorizontalAlignment('center');
    sheet.getRange(linhaDados, 5, Math.max(dados.length, 1), 1).setHorizontalAlignment('center');
    sheet.getRange(linhaDados, 6, Math.max(dados.length, 1), 4).setHorizontalAlignment('center');
    sheet.getRange(linhaDados, 7, Math.max(dados.length, 1), 1).setNumberFormat('#,##0.00');
    sheet.getRange(linhaDados, 9, Math.max(dados.length, 1), 1).setNumberFormat('#,##0.00');

    RendererComparativo2026.renderizarLegenda(sheet, linhaLegenda);
    RendererComparativo2026.renderizarCarimbo(sheet, linhaCarimbo, totalColunas, metadata);
    RendererComparativo2026.ajustarLayout(sheet);
  },

  montarDados(registros) {
    return registros.map((reg, index) => [
      index + 1,
      reg.grad || '',
      reg.matricula || '',
      reg.nome || '',
      reg.pelotao || '',
      reg.fatos.ocorrencias || 0,
      reg.indicadores.pontosTotais || 0,
      reg.fatos.armas || 0,
      reg.fatos.drogasTotal || 0
    ]);
  },

  aplicarCoresOperacionais(sheet, registros, linhaInicial) {
    registros.forEach((reg, index) => {
      const linha = linhaInicial + index;
      const corLinha = RendererComparativo2026.corPorGrupo(reg);
      const rangeLinha = sheet.getRange(linha, 1, 1, 9);
      rangeLinha.setBackground(corLinha.fundo).setFontColor(corLinha.fonte).setFontWeight(corLinha.negrito ? 'bold' : 'normal');

      const armas = Number(reg.fatos.armas || 0);
      const corArmas = RendererComparativo2026.corPorArmas(armas);
      if (corArmas) {
        sheet.getRange(linha, 8).setBackground(corArmas.fundo).setFontColor(corArmas.fonte);
      }
    });
  },

  corPorGrupo(reg) {
    const grad = SyntheonUtils.normalizarTexto(reg.grad || '');
    const pelotao = SyntheonUtils.normalizarTexto(reg.pelotao || '');

    if (/(MAJ|CAP|TEN|ASP|CEL|TC)/.test(grad)) {
      return { fundo: '#f1c232', fonte: '#000000' };
    }
    if (pelotao.includes('GTAR') && pelotao.includes('1')) {
      return { fundo: '#00cc00', fonte: '#000000', negrito: true };
    }
    if (pelotao.includes('GTAR') && pelotao.includes('2')) {
      return { fundo: '#3c78d8', fonte: '#ffffff', negrito: true };
    }
    if (pelotao.includes('1') && pelotao.includes('PEL')) {
      return { fundo: '#00ff00', fonte: '#000000' };
    }
    if (pelotao.includes('2') && pelotao.includes('PEL')) {
      return { fundo: '#6d9eeb', fonte: '#000000' };
    }
    return { fundo: '#ffffff', fonte: '#000000' };
  },

  grupoOrdenacao(reg) {
    const grad = SyntheonUtils.normalizarTexto(reg.grad || '');
    const pelotao = SyntheonUtils.normalizarTexto(reg.pelotao || '');

    if (/(MAJ|CAP|TEN|ASP|CEL|TC)/.test(grad)) return 0;
    if (pelotao.includes('GTAR') && pelotao.includes('1')) return 1;
    if (pelotao.includes('1') && pelotao.includes('PEL')) return 2;
    if (pelotao.includes('GTAR') && pelotao.includes('2')) return 3;
    if (pelotao.includes('2') && pelotao.includes('PEL')) return 4;
    if (pelotao.includes('3') && pelotao.includes('PEL')) return 5;
    return 9;
  },

  corPorArmas(qtd) {
    if (qtd === 0) return { fundo: '#ff0000', fonte: '#ff0000' };
    if (qtd >= 10) return { fundo: '#38761d', fonte: '#ffffff' };
    if (qtd >= 6) return { fundo: '#93c47d', fonte: '#000000' };
    if (qtd >= 4) return { fundo: '#ffff00', fonte: '#000000' };
    if (qtd >= 1) return { fundo: '#ff9900', fonte: '#000000' };
    return null;
  },

  renderizarLegenda(sheet, linhaInicial) {
    sheet.getRange(linhaInicial, 1).setValue('LEGENDA').setFontWeight('bold');

    // #152: ordem identica a `grupoOrdenacao` (GTAR ANTES do PEL) - a legenda espelha a tabela.
    const legendaPel = [
      ['Oficiais', '#f1c232'],
      ['1o PEL GTAR', '#00cc00'],
      ['1o PEL', '#00ff00'],
      ['2o PEL GTAR', '#3c78d8'],
      ['2o PEL', '#6d9eeb'],
      ['3o PEL', '#ffffff']
    ];
    legendaPel.forEach((item, index) => {
      const linha = linhaInicial + 1 + index;
      sheet.getRange(linha, 1).setBackground(item[1]).setBorder(true, true, true, true, false, false, '#000000', SpreadsheetApp.BorderStyle.SOLID);
      sheet.getRange(linha, 2).setValue(item[0]).setBorder(true, true, true, true, false, false, '#000000', SpreadsheetApp.BorderStyle.SOLID);
    });

    sheet.getRange(linhaInicial, 5).setValue('ARMAS').setFontWeight('bold').setHorizontalAlignment('center');
    // #152: a faixa ZERO estava AUSENTE - a tabela pinta zero de VERMELHO e nada explicava.
    // A regra de cores e a mesma de `corPorArmas` (0 / 1-3 / 4-5 / 6-9 / 10+).
    const legendaArmas = [
      ['0 (nenhuma)', '#ff0000', '#ffffff'],
      ['1 a 3', '#ff9900', '#000000'],
      ['4 a 5', '#ffff00', '#000000'],
      ['6 a 9', '#93c47d', '#000000'],
      ['10+', '#38761d', '#ffffff']
    ];
    legendaArmas.forEach((item, index) => {
      const linha = linhaInicial + 1 + index;
      sheet.getRange(linha, 4).setValue(item[0]);
      sheet.getRange(linha, 5).setBackground(item[1]).setFontColor(item[2])
        .setBorder(true, true, true, true, false, false, '#000000', SpreadsheetApp.BorderStyle.SOLID);
    });
  },

  renderizarCarimbo(sheet, linha, totalColunas, metadata) {
    const texto = [
      `Gerado em: ${metadata.atualizado || '-'}`,
      `Periodo: ${metadata.periodo || '-'}`,
      `Abas lidas: ${metadata.abasLidas || 0}`,
      `Ocorrencias: ${metadata.ocorrencias || 0}`,
      `Fonte: PRODUTIVIDADE_GERAL / SYNTHÉON V2`
    ].join(' | ');

    sheet.getRange(linha, 1, 1, totalColunas).merge()
      .setValue(texto)
      .setFontSize(9)
      .setFontColor('#4b5563')
      .setHorizontalAlignment('center')
      .setBackground('#f8fafc')
      .setBorder(true, true, true, true, false, false, '#cbd5e1', SpreadsheetApp.BorderStyle.SOLID);
  },

  ajustarLayout(sheet) {
    sheet.setColumnWidth(1, 44);
    sheet.setColumnWidth(2, 70);
    sheet.setColumnWidth(3, 92);
    sheet.setColumnWidth(4, 260);
    sheet.setColumnWidth(5, 86);
    sheet.setColumnWidth(6, 72);
    sheet.setColumnWidth(7, 112);
    sheet.setColumnWidth(8, 92);
    sheet.setColumnWidth(9, 140);
    sheet.getRange(1, 1, sheet.getMaxRows(), 9).setFontFamily('Arial');
  }
};
