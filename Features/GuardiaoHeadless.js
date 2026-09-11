/**
 * ARQUIVO: Features/GuardiaoHeadless.js
 * DESCRICAO: Entrada HEADLESS da fase auditora do Guardiao (MOD-C05-01_GUARDIAO_DE_QUALIDADE)
 * para execucao via Apps Script API (`clasp run`). As entradas de menu usam
 * `SpreadsheetApp.getUi()` e `getActiveSpreadsheet()`, inexistentes nesse contexto; aqui a
 * mesma sequencia do fluxo de UI e orquestrada com a planilha injetada por
 * `obterSpreadsheetOcorrencias_()` e o retorno e uma STRING JSON (somente tipos basicos,
 * exigencia do scripts.run).
 *
 * Escopo: leitura/diagnostico + os mesmos efeitos do fluxo oficial (auditarMeses renderiza
 * [AUDITORIA] Ocorrencias e [HISTORICO] Auditoria Ocorrencias). NAO abre dialogo, NAO altera
 * dados operacionais e NAO substitui a selecao do operador.
 */

var GuardiaoHeadless = {
  LIMITE_PRIORITARIOS: 15,
  LIMITE_TEXTO: 4000,

  /** Converte o consolidado em linhas simples (aba/status/tuneis/linhas/alertas). */
  resumir: function (consolidado) {
    const porMes = (consolidado && consolidado.porMes) || {};
    return Object.keys(porMes).map(function (nome) {
      const p = porMes[nome] || {};
      if (p.status === 'OK') {
        const r = p.resultado || {};
        return { aba: nome, status: 'OK', tuneis: r.tuneis, linhas: r.linhas, alertas: r.alertas };
      }
      return { aba: nome, status: 'ERRO', mensagem: p.mensagem || 'erro nao detalhado' };
    });
  },

  /** Prioridades do painel reduzidas a campos serializaveis. */
  prioridades: function (painel) {
    const lista = (painel && painel.prioritarios) || [];
    return lista.slice(0, this.LIMITE_PRIORITARIOS).map(function (t) {
      const d = (t.diagnosticos && t.diagnosticos[0]) || {};
      return {
        classificacao: t.classificacao || null,
        mes: t.mes || null,
        mike: t.mike || null,
        tunel: t.tunel || null,
        linhas: t.linhas || [],
        codigo: d.codigo || null,
        motivo: t.motivo || null
      };
    });
  },

  /**
   * Executa a auditoria headless.
   * @param {string} selecaoTexto TODOS | nomes/indices separados por virgula | vazio = TODOS
   * @param {{obterSS: Function, modulo: Object}} deps injecao (testabilidade)
   * @returns {string} JSON
   */
  executar: function (selecaoTexto, deps) {
    try {
      const ss = deps.obterSS();
      const modulo = deps.modulo;

      const validas = modulo.listarAbasMensais(ss);
      if (!validas.length) {
        return JSON.stringify({ status: 'NAO_AUDITAVEL', motivo: 'NENHUMA_ABA_MENSAL' });
      }

      const vazio = selecaoTexto === null || selecaoTexto === undefined || String(selecaoTexto).trim() === '';
      const texto = vazio ? 'TODOS' : String(selecaoTexto);

      const sel = modulo.parseSelecao(texto, validas);
      if (sel.cancelado) return JSON.stringify({ status: 'CANCELADO' });
      if (sel.invalidos && sel.invalidos.length) {
        // Nenhum efeito colateral: nem chega a auditar.
        return JSON.stringify({ status: 'SELECAO_INVALIDA', invalidos: sel.invalidos, validas: validas });
      }

      const consolidado = modulo.auditarMeses(sel, ss);
      const painel = modulo.montarPainel(consolidado) || {};

      let textoPainel = painel.texto || '';
      if (textoPainel.length > this.LIMITE_TEXTO) {
        textoPainel = textoPainel.slice(0, this.LIMITE_TEXTO) + '\n[...cortado]';
      }

      return JSON.stringify({
        status: 'OK',
        selecionadas: sel.alvos || [],
        resumo: this.resumir(consolidado),
        painel: textoPainel,
        prioritarios: this.prioridades(painel)
      });
    } catch (e) {
      // A porta headless never lanca: erro vira JSON (scripts.run exige resultado serializavel).
      return JSON.stringify({ status: 'ERRO', mensagem: String((e && e.message) || e) });
    }
  }
};

/**
 * Porta headless oficial (chamavel por `clasp run executarGuardiaoHeadless '["AGO2026"]'`).
 * @param {string} selecaoTexto
 * @returns {string} JSON — nunca lanca (erro vira status ERRO).
 */
function executarGuardiaoHeadless(selecaoTexto) {
  try {
    return GuardiaoHeadless.executar(selecaoTexto, {
      obterSS: obterSpreadsheetOcorrencias_,
      modulo: SeletorMesesGuardiao
    });
  } catch (e) {
    return JSON.stringify({ status: 'ERRO', mensagem: String((e && e.message) || e) });
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = GuardiaoHeadless;
}
