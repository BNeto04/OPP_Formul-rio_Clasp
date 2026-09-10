/**
 * ARQUIVO: Features/NormalizadorEfetivo.js
 * DESCRICAO: Sincroniza a aba EFETIVO a partir do QO/PECULIO sem apagar registros extras.
 */
class NormalizadorEfetivo {
  static executar() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const peculioId = CONFIG_SYNTHEON.PLANILHAS && CONFIG_SYNTHEON.PLANILHAS.PECULIO_ID;
    if (!peculioId) throw new Error('ID da planilha do PECULIO nao configurado.');

    const sheetEfetivo = ss.getSheetByName(CONSTANTES_SYNTHEON.ABA_EFETIVO) || ss.insertSheet(CONSTANTES_SYNTHEON.ABA_EFETIVO);
    const existentes = NormalizadorEfetivo.lerEfetivoAtual(sheetEfetivo);
    NormalizadorEfetivo.renderizarLog(ss, {
      status: 'INICIADO',
      peculio: 0,
      mantidos: 0,
      alertas: 0,
      linhas: existentes.registros.length,
      log: [['SISTEMA', '-', 'INICIADO', 'Sincronizacao iniciada; se falhar, o erro sera registrado nesta aba.']]
    });

    const ssPeculio = SpreadsheetApp.openById(peculioId);
    const sheetPeculio = NormalizadorEfetivo.localizarAba(ssPeculio, 'PECULIO');
    if (!sheetPeculio) throw new Error('Aba PECULIO nao encontrada na planilha QO/PECULIO.');

    const peculio = NormalizadorEfetivo.lerPeculio(sheetPeculio, existentes.porMatricula);
    const matriculasPeculio = {};
    const saida = [];
    const log = [];

    // Desambiguação automática por antiguidade N (1º NOME, 2º NOME., 3º NOME:)
    NormalizadorEfetivo.desambiguarNomesGuerra(peculio, log);

    peculio.forEach(reg => {
      if (matriculasPeculio[reg.matricula]) {
        log.push(['PECULIO', reg.linhaOrigem, 'CRITICO', `Matricula duplicada no PECULIO: ${reg.matricula}.`]);
        return;
      }
      matriculasPeculio[reg.matricula] = true;
      saida.push(NormalizadorEfetivo.linhaEfetivo(reg));
    });

    existentes.registros.forEach(reg => {
      if (!reg.matricula) {
        saida.push(reg.valores);
        log.push(['EFETIVO', reg.linhaOrigem, 'MANTIDO', 'Registro sem matricula mantido ao final para revisao manual.']);
        return;
      }
      if (!matriculasPeculio[reg.matricula]) {
        saida.push(reg.valores);
        log.push(['EFETIVO', reg.linhaOrigem, 'MANTIDO', `Fora do PECULIO atual, mantido ao final: ${reg.matricula}.`]);
      }
    });

    NormalizadorEfetivo.escreverEfetivo(sheetEfetivo, saida);
    NormalizadorEfetivo.renderizarLog(ss, {
      peculio: peculio.length,
      mantidos: log.filter(item => item[2] === 'MANTIDO').length,
      alertas: log.length,
      linhas: saida.length,
      log
    });

    return {
      peculio: peculio.length,
      mantidos: log.filter(item => item[2] === 'MANTIDO').length,
      alertas: log.length,
      linhas: saida.length
    };
  }

  static lerPeculio(sheet, existentesPorMatricula) {
    const lastRow = sheet.getLastRow();
    if (lastRow < 12) return [];

    const dados = sheet.getRange(12, 1, lastRow - 11, Math.max(sheet.getLastColumn(), 13)).getValues();
    const registros = [];

    dados.forEach((row, index) => {
      const matricula = SyntheonUtils.limparMatricula(row[4]);
      const nomeGuerra = NormalizadorEfetivo.texto(row[5]).toUpperCase();
      const nomeCompleto = NormalizadorEfetivo.texto(row[12]).toUpperCase();
      const grad = NormalizadorEfetivo.normalizarGraduacao(row[3]);
      const subunidadePeculio = NormalizadorEfetivo.texto(row[6]).toUpperCase();

      if (!matricula || (!nomeGuerra && !nomeCompleto)) return;

      const existente = existentesPorMatricula[matricula] || null;
      const subunidadeProdutividade = NormalizadorEfetivo.definirSubunidadeProdutividade({
        subunidadePeculio,
        subunidadeExistente: existente ? existente.subunidadeProdutividade : ''
      });

      const antiguidadeN = parseInt(row[0] || row[1] || row[2], 10);
      registros.push({
        linhaOrigem: index + 12,
        antiguidadeN: !isNaN(antiguidadeN) ? antiguidadeN : (index + 1),
        nomeGuerra,
        grad,
        matricula,
        gradMat: NormalizadorEfetivo.montarGradMat(grad, matricula, existente ? existente.gradMat : ''),
        nomeCompleto,
        subunidadeProdutividade,
        subunidadePeculio
      });
    });

    return registros;
  }

  static lerEfetivoAtual(sheet) {
    const lastRow = sheet.getLastRow();
    const lastCol = Math.max(sheet.getLastColumn(), 7);
    const registros = [];
    const porMatricula = {};
    if (lastRow < 1) return { registros, porMatricula };

    const dados = sheet.getRange(1, 1, lastRow, lastCol).getValues();
    dados.forEach((row, index) => {
      if (NormalizadorEfetivo.ehCabecalho(row)) return;
      const valores = NormalizadorEfetivo.normalizarLinhaExistente(row);
      const matricula = SyntheonUtils.limparMatricula(valores[4]);
      const reg = {
        linhaOrigem: index + 1,
        valores,
        matricula,
        gradMat: NormalizadorEfetivo.texto(valores[1]),
        subunidadeProdutividade: NormalizadorEfetivo.texto(valores[5])
      };
      if (!valores.some(valor => NormalizadorEfetivo.texto(valor))) return;
      registros.push(reg);
      if (matricula && !porMatricula[matricula]) porMatricula[matricula] = reg;
    });

    return { registros, porMatricula };
  }

  static escreverEfetivo(sheet, saida) {
    const linhasParaLimpar = Math.max(sheet.getLastRow(), saida.length, 1);
    sheet.getRange(1, 1, linhasParaLimpar, 7).clearContent();
    if (saida.length > 0) {
      sheet.getRange(1, 1, saida.length, 7).setValues(saida);
    }
    sheet.setFrozenRows(0);
    sheet.autoResizeColumns(1, 7);
  }

  static linhaEfetivo(reg) {
    return [
      reg.nomeGuerra,
      reg.gradMat,
      reg.nomeCompleto,
      reg.grad,
      reg.matricula,
      reg.subunidadeProdutividade,
      reg.subunidadePeculio
    ];
  }

  static normalizarLinhaExistente(row) {
    const valores = row.slice(0, 7);
    while (valores.length < 7) valores.push('');
    valores[0] = NormalizadorEfetivo.texto(valores[0]).toUpperCase();
    valores[2] = NormalizadorEfetivo.texto(valores[2]).toUpperCase();
    valores[3] = NormalizadorEfetivo.normalizarGraduacao(valores[3]);
    valores[4] = SyntheonUtils.limparMatricula(valores[4]);
    valores[5] = NormalizadorEfetivo.normalizarSubunidadeProdutividade(valores[5]);
    valores[6] = NormalizadorEfetivo.texto(valores[6]).toUpperCase();
    return valores;
  }

  static definirSubunidadeProdutividade(dados) {
    const existente = NormalizadorEfetivo.normalizarSubunidadeProdutividade(dados.subunidadeExistente);
    if (existente.includes('GTAR')) return existente;

    const peculio = SyntheonUtils.normalizarTexto(dados.subunidadePeculio);
    if (peculio.includes('GTAR') && peculio.includes('1')) return '1º PEL GTAR';
    if (peculio.includes('GTAR') && peculio.includes('2')) return '2º PEL GTAR';
    if (peculio.includes('1') && peculio.includes('PEL')) return '1º PEL';
    if (peculio.includes('2') && peculio.includes('PEL')) return '2º PEL';
    return '3º PEL';
  }

  static normalizarSubunidadeProdutividade(valor) {
    const texto = SyntheonUtils.normalizarTexto(valor);
    if (!texto) return '';
    if (texto.includes('GTAR') && texto.includes('1')) return '1º PEL GTAR';
    if (texto.includes('GTAR') && texto.includes('2')) return '2º PEL GTAR';
    if (texto.includes('1') && texto.includes('PEL')) return '1º PEL';
    if (texto.includes('2') && texto.includes('PEL')) return '2º PEL';
    if (texto.includes('3') && texto.includes('PEL')) return '3º PEL';
    return texto;
  }

  static montarGradMat(grad, matricula, existente) {
    if (existente) return existente;
    const gradCompacta = NormalizadorEfetivo.texto(grad).replace(/\s+/g, '');
    if (!gradCompacta || !matricula) return `${gradCompacta}${matricula}`;
    if (gradCompacta.length <= 3) return `${gradCompacta}${matricula}`;
    return `${gradCompacta} ${matricula}`;
  }

  static normalizarGraduacao(valor) {
    return SyntheonNormalizador.normalizarGraduacao(NormalizadorEfetivo.texto(valor));
  }

  static ehCabecalho(row) {
    const joined = row.slice(0, 7).map(valor => SyntheonUtils.normalizarTexto(valor)).join('|');
    return joined.includes('NOME') && joined.includes('MATRICULA');
  }

  static localizarAba(ss, nomeNormalizado) {
    return ss.getSheets().find(sheet => SyntheonUtils.normalizarTexto(sheet.getName()) === nomeNormalizado) || null;
  }

  static renderizarLog(ss, resultado) {
    const nomeLog = '[AUDITORIA] Efetivo';
    let logSheet = ss.getSheetByName(nomeLog);
    if (!logSheet) logSheet = ss.insertSheet(nomeLog);

    const agora = Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone() || 'America/Sao_Paulo',
      'dd/MM/yyyy HH:mm:ss'
    );

    const dados = [
      ['Sincronizacao do EFETIVO pelo PECULIO', agora, resultado.status || (resultado.alertas ? 'COM OBSERVACOES' : 'APROVADO'), ''],
      ['Registros do PECULIO', resultado.peculio, 'Registros mantidos fora do PECULIO', resultado.mantidos],
      ['Linhas finais do EFETIVO', resultado.linhas, 'Observacoes', resultado.alertas],
      ['', '', '', ''],
      ['ORIGEM', 'LINHA', 'STATUS', 'DIAGNOSTICO']
    ];

    if (resultado.log.length > 0) {
      resultado.log.forEach(item => dados.push(item));
    } else {
      dados.push(['-', '-', 'OK', 'Nenhuma observacao na sincronizacao.']);
    }

    logSheet.clear();
    logSheet.getRange(1, 1, dados.length, 4).setValues(dados);
    logSheet.getRange(1, 1, 5, 4).setFontWeight('bold');
    logSheet.autoResizeColumns(1, 4);
  }

  static renderizarErro(ss, erro) {
    const mensagem = erro && erro.stack ? erro.stack : String(erro);
    NormalizadorEfetivo.renderizarLog(ss, {
      status: 'ERRO',
      peculio: 0,
      mantidos: 0,
      alertas: 1,
      linhas: 0,
      log: [['SISTEMA', '-', 'ERRO', mensagem]]
    });
  }

  /**
   * Desambigua policiais com o mesmo nome de guerra com base na antiguidade N.
   * Regra militar:
   * - 1º Mais antigo (menor N): Nome limpo (ex: 'SILVA')
   * - 2º Intermediário / Mais recruta (sem intermediário): 'SILVA.' (adiciona ponto '.')
   * - 3º Mais recruta (havendo intermediário): 'SILVA:' (adiciona dois pontos ':')
   * @param {Array<Object>} registros
   * @param {Array<Array>} log
   * @returns {Array<Object>}
   */
  static desambiguarNomesGuerra(registros, log = []) {
    if (!Array.isArray(registros)) return registros;

    const grupos = {};
    registros.forEach(reg => {
      const nomeBase = String(reg.nomeGuerra || '').replace(/[.:]+$/g, '').trim().toUpperCase();
      if (!nomeBase) return;
      if (!grupos[nomeBase]) grupos[nomeBase] = [];
      grupos[nomeBase].push(reg);
    });

    Object.keys(grupos).forEach(nomeBase => {
      const grupo = grupos[nomeBase];
      if (grupo.length > 1) {
        // Ordena por antiguidadeN crescente (menor N = mais antigo)
        grupo.sort((a, b) => {
          const nA = (a.antiguidadeN !== undefined && a.antiguidadeN !== null && !isNaN(a.antiguidadeN)) ? Number(a.antiguidadeN) : Number(a.linhaOrigem || 0);
          const nB = (b.antiguidadeN !== undefined && b.antiguidadeN !== null && !isNaN(b.antiguidadeN)) ? Number(b.antiguidadeN) : Number(b.linhaOrigem || 0);
          return nA - nB;
        });

        grupo.forEach((reg, idx) => {
          let sufixo = '';
          if (idx === 1) {
            sufixo = '.'; // 2º (ou único recruta se grupo de 2)
          } else if (idx >= 2) {
            sufixo = ':'; // 3º mais recruta (ou superior)
          }

          reg.nomeGuerra = nomeBase + sufixo;

          if (idx > 0 && Array.isArray(log)) {
            const rotulo = idx === 1 ? '2º (Mais recruta / Intermediário)' : `${idx + 1}º (Mais recruta)`;
            log.push([
              'DESAMBIGUACAO',
              reg.linhaOrigem || '-',
              'INFO',
              `Homônimo detectado para '${nomeBase}': militar matrícula ${reg.matricula} (${rotulo}, N=${reg.antiguidadeN || reg.linhaOrigem}) normalizado para '${reg.nomeGuerra}'.`
            ]);
          }
        });
      }
    });

    return registros;
  }

  static texto(valor) {
    return String(valor || '').trim();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = NormalizadorEfetivo;
}

function normalizarEfetivo() {
  const ui = SpreadsheetApp.getUi();
  try {
    const resultado = NormalizadorEfetivo.executar();
    ui.alert(
      'Sincronizacao do EFETIVO',
      `Auditoria atualizada.\nRegistros do PECULIO: ${resultado.peculio}\nMantidos fora do PECULIO: ${resultado.mantidos}\nLinhas finais: ${resultado.linhas}\nObservacoes: ${resultado.alertas}`,
      ui.ButtonSet.OK
    );
    return resultado;
  } catch (erro) {
    const mensagem = erro && erro.stack ? erro.stack : String(erro);
    Logger.log(mensagem);
    try {
      NormalizadorEfetivo.renderizarErro(SpreadsheetApp.getActiveSpreadsheet(), erro);
    } catch (erroLog) {
      Logger.log(`Falha ao registrar auditoria do erro: ${erroLog}`);
    }
    ui.alert('Erro na Sincronizacao do EFETIVO', mensagem, ui.ButtonSet.OK);
    throw erro;
  }
}
