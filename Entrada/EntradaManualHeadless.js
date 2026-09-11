/**
 * ARQUIVO: Entrada/EntradaManualHeadless.js
 * DESCRICAO: Porta HEADLESS de validação do caminho de gravação de BO (pedido do proprietário, 12/09/2026).
 * Reusa o NÚCLEO permissivo `_processarEntradaManual` em modo simulação: roda aba mensal, anti-duplicidade,
 * montagem das linhas e TODA a validação (que agora só GERA AVISOS, nunca bloqueia) e NÃO grava.
 *
 * Uso: `clasp run validarEntradaManualHeadless -p '[{...}]'` — devolve STRING JSON (exigência do scripts.run).
 */

function validarEntradaManualHeadless(payload) {
  try {
    if (!payload || typeof payload !== 'object') {
      return JSON.stringify({ status: 'ERRO', gravou: false, mensagem: 'payload ausente ou inválido' });
    }

    const r = _processarEntradaManual(payload, { simular: true });

    return JSON.stringify({
      status: r.avisos.length ? 'PROBLEMAS' : (r.status === 'SIMULADO' ? 'OK' : r.status),
      gravou: false,
      problemas: r.avisos.map(function (a) {
        return { codigo: a.split(':')[0].trim(), mensagem: a };
      }),
      relatorio: {
        data: payload.data || null,
        mike: payload.mike || null,
        boe: payload.boe || null,
        natureza: payload.natureza || null,
        policiais: (payload.policiais || []).length,
        indicadoresPretendidos: (payload.ocorrenciasPip || []).slice(),
        aba: r.aba || null,
        linhasComputadas: r.registros
      }
    });
  } catch (e) {
    return JSON.stringify({ status: 'ERRO', gravou: false, mensagem: String(e && e.message || e) });
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { validarEntradaManualHeadless };
}
