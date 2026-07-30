/**
 * ARQUIVO: Leitura/LeitorAntiguidadePeculio.js
 * DESCRIÇÃO: Leitor oficial do mapa de antiguidade N a partir do Pecúlio / Efetivo (TASK-M06.3-03B).
 * REGRA ESTRITA: Exige presença explícita de aba válida e colunas de N e MATRÍCULA.
 * Sem fallbacks para primeira aba arbitrária ou índices fixos de colunas.
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
   * @returns {{ mapa: Object.<string, number>, mapaCompleto: Object.<string, Object>, erro?: string, estatisticas: Object }}
   */
  lerMapaAntiguidade(fonte, nomeAbaAlvo = 'EFETIVO') {
    let dados = [];

    if (Array.isArray(fonte)) {
      dados = fonte;
    } else if (fonte && typeof fonte.getSheetByName === 'function') {
      let sheet = fonte.getSheetByName(nomeAbaAlvo);
      if (!sheet) {
        // Aliases de aba reconhecidos exclusivamente para localização do Pecúlio/Efetivo
        const aliasesAbas = [
          'EFETIVO', 'PECULIO', 'PECÚLIO', 'EFETIVO 2026',
          'CÓPIA DE PECÚLIO COM PONTUAÇÃO', 'COPIA DE PECULIO COM PONTUACAO',
          'CÓPIA DE PECÚLIO COM PONTUAÇÃO ', 'PECÚLIO 2026', 'PECULIO 2026'
        ];
        for (const alias of aliasesAbas) {
          sheet = fonte.getSheetByName(alias);
          if (sheet) break;
        }
      }

      // Busca por aproximação normalizada caso não encontre por nome exato (restrito a PECULIO ou EFETIVO)
      if (!sheet && typeof fonte.getSheets === 'function') {
        try {
          const allSheets = fonte.getSheets();
          for (const s of allSheets) {
            if (s && typeof s.getName === 'function') {
              const nameNorm = String(s.getName() || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
              if (nameNorm.includes('PECULIO') || nameNorm.includes('EFETIVO')) {
                sheet = s;
                break;
              }
            }
          }
        } catch (e) {}
      }

      // REGRA ESTRITA: Proibido usar sheets[0] como fallback arbitrário
      if (!sheet) {
        return {
          mapa: {},
          mapaCompleto: {},
          erro: 'ANTIGUIDADE_FONTE_NAO_LOCALIZADA',
          estatisticas: { lidos: 0, validos: 0, invalidos: 0, duplicados: 0 }
        };
      }

      const lastRow = sheet.getLastRow();
      const lastCol = sheet.getLastColumn();
      if (lastRow >= 2 && lastCol >= 1) {
        dados = sheet.getRange(1, 1, lastRow, lastCol).getValues();
      }
    }

    if (!Array.isArray(dados) || dados.length < 2) {
      return {
        mapa: {},
        mapaCompleto: {},
        erro: 'ANTIGUIDADE_FONTE_NAO_LOCALIZADA',
        estatisticas: { lidos: 0, validos: 0, invalidos: 0, duplicados: 0 }
      };
    }

    // Procura a linha do cabeçalho nas primeiras 10 linhas exigindo N e MATRÍCULA explícitos
    let idxCabecalho = -1;
    let colMatricula = -1;
    let colN = -1;
    let colNome = -1;
    let colGrad = -1;
    let colPelotao = -1;

    for (let r = 0; r < Math.min(25, dados.length); r++) {
      const linha = dados[r].map(c => String(c || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim());
      
      const cMat = linha.findIndex(h => h === 'MATRICULA' || h === 'MAT' || h === 'MAT.' || h.includes('MATRICULA'));
      const cN = linha.findIndex(h => h === 'N' || h === 'Nº' || h === 'N°' || h === 'ORD' || h === 'ORD.' || h === 'ANTIGUIDADE' || h === 'ORDEM' || h === 'POSICAO' || h.includes('ANTIGUIDADE'));
      const cNome = linha.findIndex(h => h === 'NOME' || h === 'N GUERRA' || h === 'NOME DE GUERRA' || h === 'NOME COMPLETO' || h === 'POLICIAL' || h === 'MILITAR');
      const cGrad = linha.findIndex(h => h === 'GRAD' || h === 'GRAD.' || h === 'GRADUACAO' || h.includes('GRAD'));
      const cPel = linha.findIndex(h => h === 'P' || h === 'PELOTAO' || h === 'DESIGNACAO' || h === 'LOTACAO' || h.includes('SUB-UNIDADE') || h.includes('UNIDADE'));

      if (cMat !== -1 && cN !== -1) {
        idxCabecalho = r;
        colMatricula = cMat;
        colN = cN;
        colNome = cNome;
        colGrad = cGrad;
        colPelotao = cPel;
        break;
      }
    }

    // REGRA ESTRITA: Sem fallbacks fixos de índices! Se N ou MATRÍCULA não forem encontrados, falha.
    if (idxCabecalho === -1 || colMatricula === -1 || colN === -1) {
      return {
        mapa: {},
        mapaCompleto: {},
        erro: 'ANTIGUIDADE_FONTE_NAO_LOCALIZADA',
        estatisticas: { lidos: 0, validos: 0, invalidos: 0, duplicados: 0 }
      };
    }

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
