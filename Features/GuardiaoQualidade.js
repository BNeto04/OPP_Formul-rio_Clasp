/**
 * ARQUIVO: Features/GuardiaoQualidade.js
 * DESCRICAO: Observador de boas praticas de preenchimento das ocorrencias.
 */
class GuardiaoQualidade {
  static varrerAba(sheet) {
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    if (lastRow < 2 || lastCol < 1) {
      return { alertas: 0, linhas: 0, tuneis: 0 };
    }

    const rangeDados = sheet.getRange(1, 1, lastRow, lastCol);
    const dados = rangeDados.getValues();
    const formulas = rangeDados.getFormulas();
    const headers = dados[0].map(h => SyntheonUtils.normalizarTexto(h));
    const loc = (chaveAlias) => SyntheonUtils.localizarColuna(headers, chaveAlias);

    const idx = {
      data: loc('DATA'),
      mike: loc('MIKE'),
      boe: loc('BOE'),
      matricula: loc('MATRICULA'),
      policial: loc('POLICIAL'),
      armaLinha: loc('ARMA_LINHA'),
      armas: loc('ARMAS'),
      municao: GuardiaoQualidade.localizarPorAliases(headers, ['MUNICAO']),
      maconha: loc('MACONHA'),
      crack: loc('CRACK'),
      cocaina: loc('COCAINA'),
      indicador: loc('INDICADOR_PIP'),
      imputado: loc('IMPUTADO'),
      alerta: loc('ALERTA_INTEGRIDADE'),
      calculadas: GuardiaoQualidade.localizarColunasCalculadas(headers)
    };

    if (idx.alerta === -1) {
      idx.alerta = 38; // Coluna AM (0-based: 38)
      sheet.getRange(1, idx.alerta + 1).setValue('Alerta Integridade');
    }

    GuardiaoQualidade.validarCabecalhosObrigatorios(idx);

    const alertasPorLinha = Array.from({ length: lastRow - 1 }, () => []);
    const tuneis = {};

    for (let i = 1; i < dados.length; i++) {
      const row = dados[i];
      const linha = i + 1;
      const mike = GuardiaoQualidade.texto(row[idx.mike]);
      const boe = idx.boe !== -1 ? GuardiaoQualidade.texto(row[idx.boe]) : '';
      const data = idx.data !== -1 ? row[idx.data] : '';
      const matricula = GuardiaoQualidade.texto(row[idx.matricula]);
      const policial = idx.policial !== -1 ? GuardiaoQualidade.texto(row[idx.policial]) : '';
      const indicador = GuardiaoQualidade.texto(row[idx.indicador]);
      const imputado = GuardiaoQualidade.texto(row[idx.imputado]);
      const temFato = GuardiaoQualidade.temFatoOperacional(row, idx);
      const temParticipacao = !!matricula || !!policial;
      const temEvento = !!indicador || !!imputado || temFato;
      const temLinhaOperacional = !!mike || temParticipacao || temEvento;

      if (temLinhaOperacional) {
        GuardiaoQualidade.validarFormulasObrigatorias(formulas[i], idx.calculadas).forEach(alerta => {
          alertasPorLinha[i - 1].push(alerta);
        });
      }

      if (!mike) {
        if (temParticipacao || temEvento) {
          alertasPorLinha[i - 1].push('Ocorrencia orfa: linha com participacao/evento sem MIKE.');
        }
        continue;
      }

      if (GuardiaoQualidade.mikeSuspeito(mike)) {
        alertasPorLinha[i - 1].push(`MIKE suspeito: ${mike}.`);
      }

      if (indicador && !imputado) {
        alertasPorLinha[i - 1].push('Evento incompleto: AG preenchido sem IMPUTADO?.');
      }

      if (imputado && !indicador) {
        alertasPorLinha[i - 1].push('Imputado sem evento: AH preenchido sem OCORRENCIA PIP.');
      }

      if (imputado && !GuardiaoQualidade.imputadoValido(imputado)) {
        alertasPorLinha[i - 1].push(`Valor de imputado invalido: ${imputado}.`);
      }

      if (policial && !matricula) {
        alertasPorLinha[i - 1].push('Matricula ausente: linha com policial sem matricula.');
      }

      const chave = GuardiaoQualidade.chaveTunel(data, mike, boe);
      if (!tuneis[chave]) {
        tuneis[chave] = GuardiaoQualidade.criarTunel(chave);
      }
      GuardiaoQualidade.acumularLinhaTunel(tuneis[chave], row, idx, linha, indicador);
    }

    Object.values(tuneis).forEach(tunel => {
      GuardiaoQualidade.validarTunel(tunel).forEach(alerta => {
        alertasPorLinha[alerta.linha - 2].push(alerta.mensagem);
      });
    });

    const saida = alertasPorLinha.map(alertas => [GuardiaoQualidade.unicos(alertas).join(' | ')]);
    sheet.getRange(2, idx.alerta + 1, saida.length, 1).clearContent();
    sheet.getRange(2, idx.alerta + 1, saida.length, 1).setValues(saida);

    GuardiaoQualidade.renderizarLog(sheet, saida, tuneis);

    return {
      alertas: saida.filter(row => row[0]).length,
      linhas: lastRow - 1,
      tuneis: Object.keys(tuneis).length
    };
  }

  static renderizarLog(sheet, saida, tuneis) {
    const ss = sheet.getParent();
    const nomeLog = '[AUDITORIA] Ocorrencias';
    let log = ss.getSheetByName(nomeLog);
    if (!log) {
      log = ss.insertSheet(nomeLog);
    }

    const linhasComAlerta = [];
    saida.forEach((row, index) => {
      if (row[0]) {
        linhasComAlerta.push([sheet.getName(), index + 2, 'ALERTA', row[0]]);
      }
    });

    const agora = Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone() || 'America/Sao_Paulo',
      'dd/MM/yyyy HH:mm:ss'
    );

    const dados = [
      ['Guardiao da Qualidade', agora, sheet.getName(), linhasComAlerta.length ? 'COM ALERTAS' : 'APROVADO'],
      ['Tuneis analisados', Object.keys(tuneis).length, 'Linhas analisadas', saida.length],
      ['Linhas com alerta', linhasComAlerta.length, '', ''],
      ['', '', '', ''],
      ['ABA', 'LINHA', 'STATUS', 'DIAGNOSTICO']
    ];

    if (linhasComAlerta.length > 0) {
      linhasComAlerta.forEach(linha => dados.push(linha));
    } else {
      dados.push([sheet.getName(), '-', 'OK', 'Nenhuma inconsistencia encontrada nas regras ativas.']);
    }

    log.clear();
    log.getRange(1, 1, dados.length, 4).setValues(dados);
    log.getRange(1, 1, 5, 4).setFontWeight('bold');
    log.autoResizeColumns(1, 4);
  }

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
      const encontrado = GuardiaoQualidade.localizarPorAliases(headers, coluna.aliases);
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
    tunel.fatos.armas += GuardiaoQualidade.numero(row[idx.armaLinha]) + GuardiaoQualidade.numero(row[idx.armas]);
    tunel.fatos.municao += GuardiaoQualidade.numero(row[idx.municao]);
    tunel.fatos.maconha += GuardiaoQualidade.numero(row[idx.maconha]);
    tunel.fatos.crack += GuardiaoQualidade.numero(row[idx.crack]);
    tunel.fatos.cocaina += GuardiaoQualidade.numero(row[idx.cocaina]);

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
    ].some(col => GuardiaoQualidade.numero(row[col]) > 0);
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
      : GuardiaoQualidade.texto(data);
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

function executarGuardiaoQualidade() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  const sheet = ss.getActiveSheet();

  try {
    const resultado = GuardiaoQualidade.varrerAba(sheet);
    ui.alert(
      'Guardiao da Qualidade',
      `Aba ${sheet.getName()} auditada.\nTuneis: ${resultado.tuneis}\nLinhas analisadas: ${resultado.linhas}\nLinhas com alerta: ${resultado.alertas}`,
      ui.ButtonSet.OK
    );
    return resultado;
  } catch (erro) {
    const mensagem = erro && erro.stack ? erro.stack : String(erro);
    Logger.log(mensagem);
    ui.alert('Erro no Guardiao da Qualidade', mensagem, ui.ButtonSet.OK);
    throw erro;
  }
}
