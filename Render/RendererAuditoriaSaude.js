/**
 * ARQUIVO: Render/RendererAuditoriaSaude.js
 * DESCRICAO: Materializacao visual da auditoria do Guardiao da Qualidade.
 */
class RendererAuditoriaSaude {
  static renderizarLog(sheet, saida, tuneis) {
    const ss = sheet.getParent();
    const nomeLog = '[AUDITORIA] Ocorrencias';
    let log = ss.getSheetByName(nomeLog);
    if (!log) {
      log = ss.insertSheet(nomeLog);
    }

    const linhasComAlerta = RendererAuditoriaSaude.montarLinhasComAlerta(sheet.getName(), saida);
    let agora = '';
    if (typeof Utilities !== 'undefined' && typeof Session !== 'undefined') {
      agora = Utilities.formatDate(
        new Date(),
        Session.getScriptTimeZone() || 'America/Sao_Paulo',
        'dd/MM/yyyy HH:mm:ss'
      );
    } else {
      const d = new Date();
      agora = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
    }

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

  static prepararColunaAlertas(sheet, idxAlerta, linhasDados) {
    const coluna = idxAlerta + 1;
    sheet.getRange(1, coluna)
      .clearDataValidations()
      .setValue('Alerta Integridade');

    if (linhasDados <= 0) return;

    sheet.getRange(2, coluna, linhasDados, 1)
      .clearContent()
      .clearDataValidations();
  }

  static montarLinhasComAlerta(nomeAba, saida) {
    const linhasComAlerta = [];
    saida.forEach((row, index) => {
      if (row[0]) {
        linhasComAlerta.push([nomeAba, index + 2, 'ALERTA', row[0]]);
      }
    });
    return linhasComAlerta;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = RendererAuditoriaSaude;
}
