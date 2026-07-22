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

    const dados = sheet.getRange(1, 1, lastRow, lastCol).getValues();
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
      alerta: loc('ALERTA_INTEGRIDADE')
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

    return {
      alertas: saida.filter(row => row[0]).length,
      linhas: lastRow - 1,
      tuneis: Object.keys(tuneis).length
    };
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
