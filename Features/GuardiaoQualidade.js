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
      municao: RegrasQualidade.localizarPorAliases(headers, ['MUNICAO']),
      maconha: loc('MACONHA'),
      crack: loc('CRACK'),
      cocaina: loc('COCAINA'),
      indicador: loc('INDICADOR_PIP'),
      imputado: loc('IMPUTADO'),
      alerta: loc('ALERTA_INTEGRIDADE'),
      calculadas: RegrasQualidade.localizarColunasCalculadas(headers)
    };

    if (idx.alerta === -1) {
      idx.alerta = 38; // Coluna AM (0-based: 38)
      sheet.getRange(1, idx.alerta + 1).setValue('Alerta Integridade');
    }

    RegrasQualidade.validarCabecalhosObrigatorios(idx);

    const alertasPorLinha = Array.from({ length: lastRow - 1 }, () => []);
    const tuneis = {};

    for (let i = 1; i < dados.length; i++) {
      const row = dados[i];
      const linha = i + 1;
      const mike = RegrasQualidade.texto(row[idx.mike]);
      const boe = idx.boe !== -1 ? RegrasQualidade.texto(row[idx.boe]) : '';
      const data = idx.data !== -1 ? row[idx.data] : '';
      const matricula = RegrasQualidade.texto(row[idx.matricula]);
      const policial = idx.policial !== -1 ? RegrasQualidade.texto(row[idx.policial]) : '';
      const indicador = RegrasQualidade.texto(row[idx.indicador]);
      const imputado = RegrasQualidade.texto(row[idx.imputado]);
      const temFato = RegrasQualidade.temFatoOperacional(row, idx);
      const temParticipacao = !!matricula || !!policial;
      const temEvento = !!indicador || !!imputado || temFato;
      const temLinhaOperacional = !!mike || temParticipacao || temEvento;

      if (temLinhaOperacional) {
        RegrasQualidade.validarFormulasObrigatorias(formulas[i], idx.calculadas).forEach(alerta => {
          alertasPorLinha[i - 1].push(alerta);
        });
      }

      if (!mike) {
        if (temParticipacao || temEvento) {
          alertasPorLinha[i - 1].push('Ocorrencia orfa: linha com participacao/evento sem MIKE.');
        }
        continue;
      }

      if (RegrasQualidade.mikeSuspeito(mike)) {
        alertasPorLinha[i - 1].push(`MIKE suspeito: ${mike}.`);
      }

      if (indicador && !imputado) {
        alertasPorLinha[i - 1].push('Evento incompleto: AG preenchido sem IMPUTADO?.');
      }

      if (imputado && !indicador) {
        alertasPorLinha[i - 1].push('Imputado sem evento: AH preenchido sem OCORRENCIA PIP.');
      }

      if (imputado && !RegrasQualidade.imputadoValido(imputado)) {
        alertasPorLinha[i - 1].push(`Valor de imputado invalido: ${imputado}.`);
      }

      if (policial && !matricula) {
        alertasPorLinha[i - 1].push('Matricula ausente: linha com policial sem matricula.');
      }

      const chave = RegrasQualidade.chaveTunel(data, mike, boe);
      if (!tuneis[chave]) {
        tuneis[chave] = RegrasQualidade.criarTunel(chave);
      }
      RegrasQualidade.acumularLinhaTunel(tuneis[chave], row, idx, linha, indicador);
    }

    Object.values(tuneis).forEach(tunel => {
      RegrasQualidade.validarTunel(tunel).forEach(alerta => {
        alertasPorLinha[alerta.linha - 2].push(alerta.mensagem);
      });
    });

    const saida = alertasPorLinha.map(alertas => [RegrasQualidade.unicos(alertas).join(' | ')]);
    RendererAuditoriaSaude.prepararColunaAlertas(sheet, idx.alerta, saida.length);
    sheet.getRange(2, idx.alerta + 1, saida.length, 1).setValues(saida);

    RendererAuditoriaSaude.renderizarLog(sheet, saida, tuneis);

    return {
      alertas: saida.filter(row => row[0]).length,
      linhas: lastRow - 1,
      tuneis: Object.keys(tuneis).length
    };
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
