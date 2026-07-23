/**
 * Modulo de gestao de Policiais e Efetivo do ecossistema SYNTHEON.
 */
const SyntheonPoliciais = {
  /**
   * Carrega a base oficial de policiais da aba EFETIVO.
   * Estrutura esperada:
   * A Nome guerra | B Grad+Mat | C Nome completo | D Grad | E Matricula | F Subunidade produtividade | G Subunidade peculio
   * @param {SpreadsheetApp.Spreadsheet} ss
   * @return {Object.<string, {nome: string, graduacao: string, pelotao: string}>}
   */
  carregarEfetivo(ss) {
    const lista = SyntheonPoliciais.carregarListaEfetivo(ss);
    const mapa = {};
    const erros = [];
    const matriculasVistas = new Set();

    lista.forEach(reg => {
      if (!reg.matricula) {
        erros.push(`EFETIVO linha ${reg.linha}: matricula vazia.`);
        return;
      }
      if (!reg.nome) {
        erros.push(`EFETIVO linha ${reg.linha}: nome vazio (matricula ${reg.matricula}).`);
      }
      if (!reg.grad) {
        erros.push(`EFETIVO linha ${reg.linha}: graduacao vazia (matricula ${reg.matricula}).`);
      }
      if (matriculasVistas.has(reg.matricula)) {
        erros.push(`EFETIVO linha ${reg.linha}: matricula duplicada (${reg.matricula}).`);
      }

      matriculasVistas.add(reg.matricula);
      const cadastro = {
        nome: reg.nome,
        graduacao: SyntheonNormalizador.normalizarGraduacao(reg.grad),
        pelotao: reg.pelotao
      };
      mapa[reg.matricula] = cadastro;
      if (reg.matricula.length > 1) {
        mapa[reg.matricula.slice(0, -1) + '-' + reg.matricula.slice(-1)] = cadastro;
      }
    });

    if (erros.length > 0) {
      throw new Error(
        `A aba EFETIVO contem inconsistencias criticas e o fluxo foi interrompido:\n\n` + erros.join('\n')
      );
    }

    return mapa;
  },

  carregarListaEfetivo(ss) {
    const sheet = ss.getSheetByName(CONSTANTES_SYNTHEON.ABA_EFETIVO);
    if (!sheet) {
      throw new Error(`Aba ${CONSTANTES_SYNTHEON.ABA_EFETIVO} nao encontrada.`);
    }
    if (sheet.getLastRow() < 1) {
      throw new Error('Aba EFETIVO sem dados cadastrados.');
    }

    const dadosBrutos = sheet.getRange(1, 1, sheet.getLastRow(), Math.max(sheet.getLastColumn(), 7)).getValues();
    const dados = SyntheonPoliciais.removerCabecalhoEfetivo(dadosBrutos);

    return dados.map(item => {
      const row = item.row;
      return {
        linha: item.linha,
        nomeGuerra: String(row[0] || '').trim(),
        gradMat: String(row[1] || '').trim(),
        nome: String(row[2] || '').trim(),
        grad: String(row[3] || '').trim(),
        matricula: SyntheonUtils.limparMatricula(row[4]),
        pelotao: String(row[5] || '').trim(),
        subunidadePeculio: String(row[6] || '').trim()
      };
    }).filter(reg => reg.matricula);
  },

  removerCabecalhoEfetivo(dados) {
    return dados
      .map((row, index) => ({ row, linha: index + 1 }))
      .filter(item => {
        const texto = item.row.slice(0, 7).map(valor => SyntheonUtils.normalizarTexto(valor)).join('|');
        return !(texto.includes('NOME') && texto.includes('MATRICULA'));
      });
  }
};
