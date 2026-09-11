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
      throw new ErroValidacaoDominio(
        'Efetivo',
        'dados',
        `A aba EFETIVO contem inconsistencias criticas e o fluxo foi interrompido:\n\n` + erros.join('\n')
      );
    }

    return mapa;
  },

  carregarListaEfetivo(ss) {
    const sheet = ss.getSheetByName(CONSTANTES_SYNTHEON.ABA_EFETIVO);
    if (!sheet) {
      throw new ErroLeituraAba(CONSTANTES_SYNTHEON.ABA_EFETIVO, 'Aba nao encontrada.');
    }
    if (sheet.getLastRow() < 1) {
      throw new ErroLeituraAba(CONSTANTES_SYNTHEON.ABA_EFETIVO, 'Aba sem dados cadastrados.');
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

/**
 * Ordem canonica (copia identica do servidor de antiguidade por posto/graduacao (mais ANTIGO primeiro) - regra do proprietario, 11/09/2026.
 * Empate de graduacao e resolvido por MATRICULA: a mais antiga (menor numero) vem primeiro.
 * A MESMA logica existe no cliente (Entrada/Formulario.html) e nao pode divergir dela.
 */
var ORDEM_POSTOS_ANTIGUIDADE_ = [
  [/^(CEL|CORONEL)/, 1],
  [/^(TENCEL|TENENTECORONEL)/, 2],
  [/^(MAJ|MAJOR)/, 3],
  [/^(CAP|CAPITAO)/, 4],
  [/^(1TEN|1TENENTE|TEN|TENENTE)/, 5],
  [/^(2TEN|2TENENTE)/, 6],
  [/^(ASP|ASPIRANTE)/, 7],
  [/^(SUBTEN|SUBTENENTE)/, 8],
  [/^(1SGT|1SARGENTO|SARGENTO1)/, 9],
  [/^(2SGT|2SARGENTO|SARGENTO2)/, 10],
  [/^(3SGT|3SARGENTO|SARGENTO3)/, 11],
  [/^(CB|CABO)/, 12],
  [/^(SD|SOLDADO)/, 13]
];

/** Normaliza a graduacao para comparacao (sem acento, pontuacao e espaco). */
function normalizarGraduacaoAntiguidade_(grad) {
  return String(grad === undefined || grad === null ? '' : grad)
    .replace(/[ºª°]/g, '')   // "1º TEN" / "3ºSGT" nao podem virar "1OTEN" / "3OSGT"
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/** Indice de antiguidade do posto (1 = mais antigo). Graduacao desconhecida vai para o fim. */
function indiceAntiguidadePosto_(grad) {
  const g = normalizarGraduacaoAntiguidade_(grad);
  for (let i = 0; i < ORDEM_POSTOS_ANTIGUIDADE_.length; i++) {
    if (ORDEM_POSTOS_ANTIGUIDADE_[i][0].test(g)) return ORDEM_POSTOS_ANTIGUIDADE_[i][1];
  }
  return 99;
}

/** Matricula como numero (desempate de antiguidade). */
function matriculaNumerica_(mat) {
  const n = parseInt(String(mat === undefined || mat === null ? '' : mat).replace(/\D/g, ''), 10);
  return isNaN(n) ? Number.MAX_SAFE_INTEGER : n;
}

/**
 * Ordena a equipe na ordem correta de antiguidade: primeiro a PATENTE (mais antigo primeiro) e, em caso
 * de empate de graduacao, a MATRICULA mais antiga (menor) primeiro. Ordenacao estavel.
 */
function ordenarEquipePorAntiguidade_(lista) {
  return (Array.isArray(lista) ? lista.slice() : []).map(function (p, i) { return { p: p, i: i }; })
    .sort(function (a, b) {
      const dg = indiceAntiguidadePosto_(a.p && (a.p.posto || a.p.graduacao)) - indiceAntiguidadePosto_(b.p && (b.p.posto || b.p.graduacao));
      if (dg !== 0) return dg;
      const dm = matriculaNumerica_(a.p && a.p.matricula) - matriculaNumerica_(b.p && b.p.matricula);
      if (dm !== 0) return dm;
      return a.i - b.i;
    })
    .map(function (x) { return x.p; });
}

// FIM-ORDEM-ANTIGUIDADE
