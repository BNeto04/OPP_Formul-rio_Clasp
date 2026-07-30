/**
 * ARQUIVO: Leitura/LeitorAntiguidadePeculio.js
 * DESCRIÇÃO: Leitor oficial do mapa de antiguidade N a partir do Pecúlio / Efetivo (TASK-M06.3-03A).
 * REGRA: Extrai a coluna N (Senioridade/Ordem) e normaliza a matrícula (removendo hífens, pontos e espaços)
 * para garantir busca exata na resolução de líderes por antiguidade.
 */

const LeitorAntiguidadePeculio = {
  /**
   * Normaliza a matrícula removendo pontuação, hífens, pontos e espaços.
   * Exemplo: '108.394-5' -> '1083945'
   * @param {string|number} mat 
   * @returns {string} Matrícula limpa contendo apenas caracteres alfanuméricos.
   */
  normalizarMatricula(mat) {
    if (mat === null || mat === undefined) return '';
    return String(mat).replace(/[^a-zA-Z0-9]/g, '').toUpperCase().trim();
  },

  /**
   * Lê o mapa de antiguidade a partir de uma planilha (objeto SpreadsheetApp.Spreadsheet ou matriz 2D).
   * @param {SpreadsheetApp.Spreadsheet|Array<Array>} fonte - Planilha do Google Sheets ou matriz 2D.
   * @param {string} [nomeAbaAlvo='EFETIVO'] - Nome da aba a procurar no projeto.
   * @returns {{ mapa: Object.<string, number>, mapaCompleto: Object.<string, Object>, estatisticas: Object }}
   */
  lerMapaAntiguidade(fonte, nomeAbaAlvo = 'EFETIVO') {
    let dados = [];

    if (Array.isArray(fonte)) {
      dados = fonte;
    } else if (fonte && typeof fonte.getSheetByName === 'function') {
      let sheet = fonte.getSheetByName(nomeAbaAlvo);
      if (!sheet) {
        // Aliases de aba defensivos para localização do Pecúlio/Efetivo
        const aliasesAbas = ['EFETIVO', 'PECULIO', 'PECÚLIO', 'EFETIVO 2026', 'Cópia de Pecúlio com Pontuação '];
        for (const alias of aliasesAbas) {
          sheet = fonte.getSheetByName(alias);
          if (sheet) break;
        }
      }

      if (!sheet && typeof fonte.getSheets === 'function') {
        const sheets = fonte.getSheets();
        if (sheets.length > 0) sheet = sheets[0];
      }

      if (sheet) {
        const lastRow = sheet.getLastRow();
        const lastCol = sheet.getLastColumn();
        if (lastRow >= 2 && lastCol >= 1) {
          dados = sheet.getRange(1, 1, lastRow, lastCol).getValues();
        }
      }
    }

    if (!Array.isArray(dados) || dados.length < 2) {
      return { mapa: {}, mapaCompleto: {}, estatisticas: { lidos: 0, validos: 0, invalidos: 0, duplicados: 0 } };
    }

    // Tenta encontrar a linha do cabeçalho nas primeiras 5 linhas
    let idxCabecalho = 0;
    let colMatricula = -1;
    let colN = -1;
    let colNome = -1;
    let colGrad = -1;
    let colPelotao = -1;

    for (let r = 0; r < Math.min(5, dados.length); r++) {
      const linha = dados[r].map(c => String(c || '').toUpperCase().trim());
      
      // Localização de colunas por cabeçalhos conhecidos
      colMatricula = linha.findIndex(h => h === 'MATRICULA' || h === 'MATRÍCULA' || h === 'MAT.' || h === 'MAT');
      colN = linha.findIndex(h => h === 'N' || h === 'Nº' || h === 'ANTIGUIDADE' || h === 'ORDEM' || h === 'POSIÇÃO' || h === 'POSICAO');
      colNome = linha.findIndex(h => h === 'NOME' || h === 'N GUERRA' || h === 'NOME COMPLETO' || h === 'POLICIAL');
      colGrad = linha.findIndex(h => h === 'GRAD' || h === 'GRADUAÇÃO' || h === 'GRADUACAO');
      colPelotao = linha.findIndex(h => h === 'P' || h === 'PELOTÃO' || h === 'PELOTAO' || h === 'DESIGNAÇÃO' || h === 'DESIGNACAO' || h === 'LOTAÇÃO');

      if (colMatricula !== -1 && (colN !== -1 || colNome !== -1)) {
        idxCabecalho = r;
        break;
      }
    }

    // Fallbacks padrão de índices caso o cabeçalho explícito não seja localizado
    if (colMatricula === -1) colMatricula = 1; // Coluna B (0-indexed 1)
    if (colN === -1) colN = 0;                  // Coluna A (0-indexed 0)
    if (colNome === -1) colNome = 3;               // Coluna D (0-indexed 3)
    if (colGrad === -1) colGrad = 2;               // Coluna C (0-indexed 2)
    if (colPelotao === -1) colPelotao = 5;            // Coluna F (0-indexed 5)

    const mapa = {};
    const mapaCompleto = {};
    const estatisticas = { lidos: 0, validos: 0, invalidos: 0, duplicados: 0 };

    for (let i = idxCabecalho + 1; i < dados.length; i++) {
      const linha = dados[i];
      if (!linha || linha.length === 0) continue;

      estatisticas.lidos++;

      const rawMat = linha[colMatricula];
      const matNorm = this.normalizarMatricula(rawMat);

      if (!matNorm) {
        estatisticas.invalidos++;
        continue;
      }

      const rawN = linha[colN];
      const numN = Number(rawN);

      if (rawN === undefined || rawN === null || rawN === '' || isNaN(numN) || numN <= 0) {
        estatisticas.invalidos++;
        continue;
      }

      // Trata duplicidade de matrícula (preserva a primeira ocorrência válida de N)
      if (mapa[matNorm] !== undefined) {
        estatisticas.duplicados++;
        continue;
      }

      const nome = colNome !== -1 ? String(linha[colNome] || '').trim() : '';
      const grad = colGrad !== -1 ? String(linha[colGrad] || '').trim() : '';
      const designacao = colPelotao !== -1 ? String(linha[colPelotao] || '').trim() : '';

      mapa[matNorm] = numN;
      mapaCompleto[matNorm] = {
        matricula: matNorm,
        matriculaOriginal: String(rawMat).trim(),
        numN: numN,
        nome: nome,
        grad: grad,
        designacao: designacao
      };

      estatisticas.validos++;
    }

    return { mapa, mapaCompleto, estatisticas };
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = LeitorAntiguidadePeculio;
}
