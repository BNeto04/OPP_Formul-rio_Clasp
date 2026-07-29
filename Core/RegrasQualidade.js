/**
 * ARQUIVO: Core/RegrasQualidade.js
 * DESCRICAO: Núcleo puro de diagnósticos e regras de qualidade do Guardião.
 * 100% desvinculado de APIs do Google Apps Script (Utilities, Session, SpreadsheetApp).
 */

const SEVERIDADES_GUARDIAO = Object.freeze({
  ERRO_TECNICO: 'ERRO TECNICO',
  CRITICO: 'CRITICO',
  ALERTA: 'ALERTA',
  OBSERVACAO: 'OBSERVACAO',
  EXCECAO_MANUAL: 'EXCECAO MANUAL'
});

class RegrasQualidade {
  /**
   * Constrói um objeto padronizado de diagnóstico de auditoria.
   */
  static criarDiagnostico({
    severidade = SEVERIDADES_GUARDIAO.ALERTA,
    codigoRegra = 'REGRA_GERAL',
    linha = 0,
    tunel = '',
    diagnostico = '',
    evidencia = '',
    acaoRecomendada = '',
    condicaoExcecaoManual = false
  }) {
    return {
      severidade,
      codigoRegra,
      linha,
      tunel,
      diagnostico,
      evidencia,
      acaoRecomendada,
      condicaoExcecaoManual: !!condicaoExcecaoManual
    };
  }

  static validarTunel(tunel) {
    const alertas = [];
    tunel.eventos.forEach(evento => {
      const indicador = typeof SyntheonUtils !== 'undefined' ? SyntheonUtils.normalizarTexto(evento.indicador) : String(evento.indicador).toUpperCase();

      if (indicador.includes('MACONHA') && tunel.fatos.maconha <= 0) {
        alertas.push(RegrasQualidade.criarDiagnostico({
          severidade: SEVERIDADES_GUARDIAO.ALERTA,
          codigoRegra: 'FATO_MACONHA_AUSENTE',
          linha: evento.linha,
          tunel: tunel.chave,
          diagnostico: 'Indicador de maconha sem fato correspondente no túnel.',
          evidencia: `Indicador: "${evento.indicador}" | Maconha no túnel: ${tunel.fatos.maconha}g`,
          acaoRecomendada: 'Preencha a quantidade física de maconha ou revise o indicador OCORRÊNCIA PIP.'
        }));
      }

      if (indicador.includes('CRACK') && tunel.fatos.crack <= 0) {
        alertas.push(RegrasQualidade.criarDiagnostico({
          severidade: SEVERIDADES_GUARDIAO.ALERTA,
          codigoRegra: 'FATO_CRACK_AUSENTE',
          linha: evento.linha,
          tunel: tunel.chave,
          diagnostico: 'Indicador de crack sem fato correspondente no túnel.',
          evidencia: `Indicador: "${evento.indicador}" | Crack no túnel: ${tunel.fatos.crack}g`,
          acaoRecomendada: 'Preencha a quantidade física de crack ou revise o indicador OCORRÊNCIA PIP.'
        }));
      }

      if (indicador.includes('COCAINA') && tunel.fatos.cocaina <= 0) {
        alertas.push(RegrasQualidade.criarDiagnostico({
          severidade: SEVERIDADES_GUARDIAO.ALERTA,
          codigoRegra: 'FATO_COCAINA_AUSENTE',
          linha: evento.linha,
          tunel: tunel.chave,
          diagnostico: 'Indicador de cocaína sem fato correspondente no túnel.',
          evidencia: `Indicador: "${evento.indicador}" | Cocaína no túnel: ${tunel.fatos.cocaina}g`,
          acaoRecomendada: 'Preencha a quantidade física de cocaína ou revise o indicador OCORRÊNCIA PIP.'
        }));
      }

      if ((indicador.includes('ARMA DE FOGO') || indicador.includes('ARMA LONGA')) && tunel.fatos.armas <= 0) {
        alertas.push(RegrasQualidade.criarDiagnostico({
          severidade: SEVERIDADES_GUARDIAO.ALERTA,
          codigoRegra: 'FATO_ARMA_AUSENTE',
          linha: evento.linha,
          tunel: tunel.chave,
          diagnostico: 'Indicador de arma de fogo sem fato correspondente no túnel.',
          evidencia: `Indicador: "${evento.indicador}" | Armas no túnel: ${tunel.fatos.armas}`,
          acaoRecomendada: 'Preencha a quantidade física de armas apreendidas no túnel.'
        }));
      }

      if (indicador.includes('MUNICAO') && tunel.fatos.municao <= 0) {
        alertas.push(RegrasQualidade.criarDiagnostico({
          severidade: SEVERIDADES_GUARDIAO.ALERTA,
          codigoRegra: 'FATO_MUNICAO_AUSENTE',
          linha: evento.linha,
          tunel: tunel.chave,
          diagnostico: 'Indicador de munição sem fato correspondente no túnel.',
          evidencia: `Indicador: "${evento.indicador}" | Munição no túnel: ${tunel.fatos.municao}`,
          acaoRecomendada: 'Preencha a quantidade de munições apreendidas ou revise o indicador.'
        }));
      }
    });
    return alertas;
  }

  static validarDataMike(data, mike, linha, tunel) {
    if (!data || !mike) return null;
    const somenteNumeros = String(mike).replace(/\D/g, '');
    if (somenteNumeros.length < 8) return null; // Não exige tamanho fixo de MIKE

    let diaData = 0, mesData = 0, anoData = 0;
    if (data instanceof Date && !isNaN(data.getTime())) {
      diaData = data.getDate();
      mesData = data.getMonth() + 1;
      anoData = data.getFullYear();
    } else {
      const matchData = String(data).trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (matchData) {
        diaData = parseInt(matchData[1], 10);
        mesData = parseInt(matchData[2], 10);
        anoData = parseInt(matchData[3], 10);
      }
    }

    if (!anoData || !mesData || !diaData) return null;

    // Se o MIKE começa no padrão YYYYMMDD (ex: 20260715...)
    const mikeAno = parseInt(somenteNumeros.substring(0, 4), 10);
    const mikeMes = parseInt(somenteNumeros.substring(4, 6), 10);
    const mikeDia = parseInt(somenteNumeros.substring(6, 8), 10);

    if (mikeAno >= 2020 && mikeAno <= 2030 && mikeMes >= 1 && mikeMes <= 12 && mikeDia >= 1 && mikeDia <= 31) {
      if (mikeAno !== anoData || mikeMes !== mesData || mikeDia !== diaData) {
        return RegrasQualidade.criarDiagnostico({
          severidade: SEVERIDADES_GUARDIAO.ALERTA,
          codigoRegra: 'MIKE_DATA_DIVERGENTE',
          linha,
          tunel,
          diagnostico: 'Divergência entre data da planilha e estrutura temporal do MIKE.',
          evidencia: `DATA na coluna: ${String(diaData).padStart(2,'0')}/${String(mesData).padStart(2,'0')}/${anoData} | Data no MIKE: ${String(mikeDia).padStart(2,'0')}/${String(mikeMes).padStart(2,'0')}/${mikeAno}`,
          acaoRecomendada: 'Confirme a data e o MIKE da ocorrência para sanar a incompatibilidade cronológica.'
        });
      }
    }

    return null;
  }

  static validarCoerenciaCruzadaMikes(mikesMapa) {
    const diagnosticos = [];
    Object.values(mikesMapa).forEach(entry => {
      if (entry.boes.size > 1) {
        entry.linhas.forEach(item => {
          diagnosticos.push(RegrasQualidade.criarDiagnostico({
            severidade: SEVERIDADES_GUARDIAO.ALERTA,
            codigoRegra: 'MIKE_BOE_DIVERGENTE',
            linha: item.linha,
            tunel: item.chave,
            diagnostico: `Mesmo MIKE (${entry.mike}) associado a BOEs diferentes: ${Array.from(entry.boes).join(', ')}.`,
            evidencia: `MIKE: ${entry.mike} | BOEs encontrados: ${Array.from(entry.boes).join(', ')}`,
            acaoRecomendada: 'Confirme o BOE: o mesmo MIKE aparece associado a códigos de ocorrência/BOE diferentes.'
          }));
        });
      }

      if (entry.datas.size > 1) {
        entry.linhas.forEach(item => {
          diagnosticos.push(RegrasQualidade.criarDiagnostico({
            severidade: SEVERIDADES_GUARDIAO.ALERTA,
            codigoRegra: 'MIKE_DATAS_DIVERGENTES',
            linha: item.linha,
            tunel: item.chave,
            diagnostico: `Mesmo MIKE (${entry.mike}) utilizado em datas incompatíveis: ${Array.from(entry.datas).join(', ')}.`,
            evidencia: `MIKE: ${entry.mike} | Datas encontradas: ${Array.from(entry.datas).join(', ')}`,
            acaoRecomendada: 'Verifique a data da ocorrência: o mesmo MIKE foi registrado em datas diferentes.'
          }));
        });
      }
    });
    return diagnosticos;
  }

  static indicadorConhecido(indicador) {
    if (!indicador) return true;
    const norm = typeof SyntheonUtils !== 'undefined' ? SyntheonUtils.normalizarTexto(indicador) : String(indicador).toUpperCase().trim();
    const padroesConhecidos = [
      'PORTE', 'POSSE', 'TRAFICO', 'CUMPRIMENTO', 'MANDADO', 'MACONHA', 'CRACK',
      'COCAINA', 'ARMA', 'MUNICAO', 'VEICULO', 'RECUPERADO', 'DETENCAO', 'PRISAO',
      'APFD', 'TCO', 'BOC', 'AAFAI', 'HOMICIDIO', 'ROUBO', 'FURTO', 'RECEPTACAO',
      'FLAGRANTE', 'OCORRENCIA PIP'
    ];
    return padroesConhecidos.some(p => norm.includes(p));
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
        alertas.push(RegrasQualidade.criarDiagnostico({
          severidade: SEVERIDADES_GUARDIAO.ALERTA,
          codigoRegra: 'FORMULA_AUSENTE',
          linha: 0,
          diagnostico: `Fórmula ausente em coluna calculada: ${coluna.nome}.`,
          evidencia: `Coluna: ${coluna.nome} (índice: ${coluna.indice}) sem fórmula`,
          acaoRecomendada: `Restaure a fórmula de ${coluna.nome} a partir de uma linha válida ou justifique com nota EXCECAO:.`
        }));
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
      const err = new Error(`Cabeçalhos obrigatórios não encontrados: ${faltantes.join(', ')}`);
      err.severidade = SEVERIDADES_GUARDIAO.ERRO_TECNICO;
      throw err;
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
    const norm = (t) => typeof SyntheonUtils !== 'undefined' ? SyntheonUtils.normalizarTexto(t) : String(t).toUpperCase().trim();
    const opcoes = aliases.map(alias => norm(alias));
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
    let dataTexto = '';
    if (data instanceof Date && !isNaN(data.getTime())) {
      const dia = String(data.getDate()).padStart(2, '0');
      const mes = String(data.getMonth() + 1).padStart(2, '0');
      const ano = data.getFullYear();
      dataTexto = `${dia}/${mes}/${ano}`;
    } else {
      dataTexto = RegrasQualidade.texto(data);
    }
    return `${dataTexto}|${mike}|${boe}`;
  }

  static mikeSuspeito(mike) {
    const somenteNumeros = String(mike).replace(/\D/g, '');
    return somenteNumeros === '2026' || (somenteNumeros.length > 0 && somenteNumeros.length < 8);
  }

  static imputadoValido(valor) {
    const normalizado = typeof SyntheonUtils !== 'undefined' ? SyntheonUtils.normalizarTexto(valor) : String(valor).toUpperCase().trim();
    return normalizado === 'COM IMPUTADO' || normalizado === 'SEM IMPUTADO';
  }

  static texto(valor) {
    return String(valor || '').trim();
  }

  static numero(valor) {
    return typeof SyntheonUtils !== 'undefined' ? SyntheonUtils.converterNumero(valor) : (Number(valor) || 0);
  }

  static unicos(alertas) {
    return alertas.filter((alerta, index) => alertas.indexOf(alerta) === index);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { RegrasQualidade, SEVERIDADES_GUARDIAO };
}
