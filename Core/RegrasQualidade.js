/**
 * ARQUIVO: Core/RegrasQualidade.js
 * DESCRICAO: Regras puras do Guardiao da Qualidade.
 */
class RegrasQualidade {
  static validarTunel(tunel) {
    const alertas = [];
    tunel.eventos.forEach(evento => {
      const indicador = SyntheonUtils.normalizarTexto(evento.indicador);
      if (indicador.includes('MACONHA') && tunel.fatos.maconha <= 0) {
        alertas.push({ linha: evento.linha, mensagem: 'Indicador sem fato correspondente: maconha zerada no tunel.' });
      }
      if (indicador.includes('CRACK') && tunel.fatos.crack <= 0) {
        alertas.push({ linha: evento.linha, mensagem: 'Indicador sem fato correspondente: crack zerado no tunel.' });
      }
      if (indicador.includes('COCAINA') && tunel.fatos.cocaina <= 0) {
        alertas.push({ linha: evento.linha, mensagem: 'Indicador sem fato correspondente: cocaina zerada no tunel.' });
      }
      if ((indicador.includes('ARMA DE FOGO') || indicador.includes('ARMA LONGA')) && tunel.fatos.armas <= 0) {
        alertas.push({ linha: evento.linha, mensagem: 'Indicador sem fato correspondente: arma zerada no tunel.' });
      }
      if (indicador.includes('MUNICAO') && tunel.fatos.municao <= 0) {
        alertas.push({ linha: evento.linha, mensagem: 'Indicador sem fato correspondente: municao zerada no tunel.' });
      }
    });
    return alertas;
  }

  static localizarColunasCalculadas(headers) {
    const colunas = [
      { nome: 'TOTAL DE MACONHA', indicePadrao: 18, aliases: ['TOTAL DE MACONHA'] },
      { nome: 'DIVIDIDO MAC', indicePadrao: 19, aliases: ['DIVIDIDO MAC'] },
      { nome: 'TOTAL CRACK', indicePadrao: 22, aliases: ['TOTAL CRACK (GR)', 'TOTAL CRACK'] },
      { nome: 'TOTAL DE COCAINA', indicePadrao: 25, aliases: ['TOTAL DE COCAINA', 'TOTAL COCAINA'] },
      { nome: 'DIVIDIDO COC', indicePadrao: 26, aliases: ['DIVIDIDO COC'] },
      { nome: 'PONTOS TOTAIS', indicePadrao: 34, aliases: ['PONTOS TOTAIS', 'PONTUACAO BRUTA'] },
      { nome: 'PONTOS FICCAO', indicePadrao: 35, aliases: ['PONTOS FICCAO (1/4)', 'PONTOS FICCAO'] },
      { nome: 'CHAVE OCORRENCIA', indicePadrao: 36, aliases: ['CHAVE OCORRENCIA', 'CHAVE'] }
    ];

    return colunas.map(coluna => {
      const encontrado = RegrasQualidade.localizarPorAliases(headers, coluna.aliases);
      return {
        nome: coluna.nome,
        indice: encontrado !== -1 ? encontrado : coluna.indicePadrao
      };
    });
  }

  static validarFormulasObrigatorias(formulaRow, colunasCalculadas) {
    const alertas = [];
    colunasCalculadas.forEach(coluna => {
      if (!formulaRow || coluna.indice < 0 || coluna.indice >= formulaRow.length) return;
      if (!formulaRow[coluna.indice]) {
        alertas.push(`Formula ausente em coluna calculada: ${coluna.nome}.`);
      }
    });
    return alertas;
  }

  static criarTunel(chave) {
    return {
      chave,
      fatos: { armas: 0, municao: 0, maconha: 0, crack: 0, cocaina: 0 },
      eventos: []
    };
  }

  static acumularLinhaTunel(tunel, row, idx, linha, indicador) {
    tunel.fatos.armas += RegrasQualidade.numero(row[idx.armaLinha]) + RegrasQualidade.numero(row[idx.armas]);
    tunel.fatos.municao += RegrasQualidade.numero(row[idx.municao]);
    tunel.fatos.maconha += RegrasQualidade.numero(row[idx.maconha]);
    tunel.fatos.crack += RegrasQualidade.numero(row[idx.crack]);
    tunel.fatos.cocaina += RegrasQualidade.numero(row[idx.cocaina]);

    if (indicador) {
      tunel.eventos.push({ linha, indicador });
    }
  }

  static validarCabecalhosObrigatorios(idx) {
    const faltantes = [];
    if (idx.mike === -1) faltantes.push('MIKE');
    if (idx.matricula === -1) faltantes.push('MATRICULA');
    if (idx.indicador === -1) faltantes.push('OCORRENCIA PIP');
    if (idx.imputado === -1) faltantes.push('IMPUTADO?');
    if (faltantes.length > 0) {
      throw new Error(`Cabecalhos obrigatorios nao encontrados: ${faltantes.join(', ')}`);
    }
  }

  static temFatoOperacional(row, idx) {
    return [
      idx.armaLinha,
      idx.armas,
      idx.municao,
      idx.maconha,
      idx.crack,
      idx.cocaina
    ].some(col => RegrasQualidade.numero(row[col]) > 0);
  }

  static localizarPorAliases(headers, aliases) {
    const opcoes = aliases.map(alias => SyntheonUtils.normalizarTexto(alias));
    for (const opcao of opcoes) {
      const idx = headers.indexOf(opcao);
      if (idx !== -1) return idx;
    }
    for (const opcao of opcoes) {
      const idx = headers.findIndex(h => h.includes(opcao));
      if (idx !== -1) return idx;
    }
    return -1;
  }

  static chaveTunel(data, mike, boe) {
    const dataTexto = data instanceof Date
      ? Utilities.formatDate(data, Session.getScriptTimeZone() || 'America/Sao_Paulo', 'dd/MM/yyyy')
      : RegrasQualidade.texto(data);
    return `${dataTexto}|${mike}|${boe}`;
  }

  static mikeSuspeito(mike) {
    const somenteNumeros = String(mike).replace(/\D/g, '');
    return somenteNumeros === '2026' || somenteNumeros.length < 8;
  }

  static imputadoValido(valor) {
    const normalizado = SyntheonUtils.normalizarTexto(valor);
    return normalizado === 'COM IMPUTADO' || normalizado === 'SEM IMPUTADO';
  }

  static texto(valor) {
    return String(valor || '').trim();
  }

  static numero(valor) {
    return SyntheonUtils.converterNumero(valor);
  }

  static unicos(alertas) {
    return alertas.filter((alerta, index) => alertas.indexOf(alerta) === index);
  }
}
