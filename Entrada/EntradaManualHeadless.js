/**
 * ARQUIVO: Entrada/EntradaManualHeadless.js
 * DESCRICAO: Porta HEADLESS de validação do caminho de gravação de BO (pedido do proprietário, 12/09/2026).
 * Roda exatamente os MESMOS passos de `processarEntradaManual` — aba mensal, anti-duplicidade (BOE/MIKE),
 * montagem das linhas e TODA a validação de integridade do gravador (linhas preparadas, linha não vazia,
 * fórmula obrigatória, valor permitido pelas validações da planilha) — e para ANTES da escrita física.
 *
 * Serve para testar qualquer BO por linha de comando (`clasp run validarEntradaManualHeadless -p '[{...}]'`)
 * sem sujar a planilha. Nunca lança: devolve STRING JSON (exigência do scripts.run).
 */

function validarEntradaManualHeadless(payload) {
  try {
    if (!payload || typeof payload !== 'object') {
      return JSON.stringify({ status: 'ERRO', gravou: false, mensagem: 'payload ausente ou inválido' });
    }

    const problemas = [];
    const relatorio = {
      data: payload.data || null,
      mike: payload.mike || null,
      boe: payload.boe || null,
      natureza: payload.natureza || null,
      policiais: (payload.policiais || []).length,
      indicadoresPretendidos: (payload.ocorrenciasPip || []).slice()
    };

    const ss = obterSpreadsheetOcorrencias_();

    let aba = null;
    try {
      aba = localizarAbaMensalTratada(ss, payload.data);
      relatorio.aba = aba.getName();
    } catch (e) {
      problemas.push({ codigo: 'ABA_MENSAL', mensagem: String(e && e.message || e) });
    }

    if (aba) {
      try {
        verificarDuplicidadeOcorrencia(aba, payload.boe, payload.mike);
      } catch (e) {
        problemas.push({ codigo: 'DUPLICIDADE', mensagem: String(e && e.message || e) });
      }
    }

    let linhas = [];
    try {
      linhas = montarLinhasEntradaManual(payload);
      relatorio.linhasComputadas = linhas.length;
    } catch (e) {
      problemas.push({ codigo: 'MONTAGEM', mensagem: String(e && e.message || e) });
    }

    if (aba && linhas.length > 0) {
      try {
        const plano = gravarLinhasEntradaManual(aba, linhas, { simular: true });
        relatorio.plano = plano;
      } catch (e) {
        // Aqui caem as travas reais: "Faltam linhas preparadas", "não está vazia na coluna X",
        // "não é permitido pela validação da planilha na coluna Y", "linhas insuficientes".
        problemas.push({ codigo: 'GRAVACAO_BLOQUEADA', mensagem: String(e && e.message || e) });
      }
    }

    return JSON.stringify({
      status: problemas.length === 0 ? 'OK' : 'PROBLEMAS',
      gravou: false,
      problemas: problemas,
      relatorio: relatorio
    });
  } catch (e) {
    return JSON.stringify({ status: 'ERRO', gravou: false, mensagem: String(e && e.message || e) });
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { validarEntradaManualHeadless };
}
