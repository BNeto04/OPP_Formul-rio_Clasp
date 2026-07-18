/**
 * Módulo de gestão de Policiais e Efetivo do ecossistema SYNTHÉON.
 */
const SyntheonPoliciais = {
  /**
   * Carrega a base oficial de policiais da aba EFETIVO.
   * @param {SpreadsheetApp.Spreadsheet} ss - Planilha ativa.
   * @return {Object.<string, {nome: string, graduacao: string}>} Mapa de matrícula -> dados.
   */
  carregarEfetivo(ss) {
    const sheet = ss.getSheetByName(CONSTANTES_SYNTHEON.ABA_EFETIVO);
    if (!sheet) {
      throw new Error(`Aba ${CONSTANTES_SYNTHEON.ABA_EFETIVO} não encontrada.`);
    }

    const lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      throw new Error('Aba EFETIVO sem dados cadastrados.');
    }

    const dados = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
    const mapa = {};
    const erros = [];
    const matriculasVistas = new Set();

    dados.forEach((row, i) => {
      const linhaReal = i + 2;

      // Colunas C, D, E (C=Nome=2, D=Grad=3, E=Matrícula=4)
      const nome = String(row[2] || '').trim();
      const graduacao = String(row[3] || '').trim();
      const matricula = SyntheonUtils.limparMatricula(row[4]);

      // Ignora linhas completamente vazias
      if (!nome && !graduacao && !matricula) return;

      if (!matricula) {
        erros.push(`EFETIVO linha ${linhaReal}: matrícula vazia.`);
        return;
      }

      if (!nome) {
        erros.push(`EFETIVO linha ${linhaReal}: nome vazio (matrícula ${matricula}).`);
      }

      if (!graduacao) {
        erros.push(`EFETIVO linha ${linhaReal}: graduação vazia (matrícula ${matricula}).`);
      }

      if (matriculasVistas.has(matricula)) {
        erros.push(`EFETIVO linha ${linhaReal}: matrícula duplicada (${matricula}).`);
      }

      matriculasVistas.add(matricula);

      // Salva no mapa com a graduação já normalizada
      mapa[matricula] = { 
        nome: nome, 
        graduacao: SyntheonNormalizador.normalizarGraduacao(graduacao)
      };
    });

    if (erros.length > 0) {
      throw new Error(
        `A aba EFETIVO contém inconsistências críticas e o fluxo foi interrompido:\n\n` + erros.join('\n')
      );
    }

    return mapa;
  }
};
