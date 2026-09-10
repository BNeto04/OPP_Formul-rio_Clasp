/**
 * ARQUIVO: Render/PainelSaude.js
 * DESCRICAO: Painel de saude + drill-down do Guardiao da Qualidade (G01 #116).
 * Núcleo 100% puro de MONTAGEM de dados/texto (o desenho na planilha continua no
 * RendererAuditoriaSaude e nos avisos de UI do SeletorMesesGuardiao).
 *
 * Hierarquia do drill-down: MES -> TUNEL/MIKE -> LINHAS -> DIAGNOSTICO
 * (codigo, severidade, explicacao humana, metadados ARCA e acao recomendada).
 */

class PainelSaude {
  static severidadePeso(sev) {
    return ({ 'CRITICO': 5, 'ERRO TECNICO': 6, 'EXCECAO MANUAL': 4, 'ALERTA': 3, 'OBSERVACAO': 1 })[sev] || 2;
  }

  /** Resumo de UM mes a partir do retorno de GuardiaoQualidade.varrerAba. */
  static construirResumoMes(nomeMes, resultado) {
    const saude = (resultado && resultado.saude) || null;
    const contagem = (saude && saude.contagem) || { total: 0, saudaveis: 0, alertas: 0, criticos: 0, incompletos: 0, naoAuditaveis: 0 };
    const cobertura = (resultado && resultado.cobertura) || { status: 'INDISPONIVEL', regrasNaoAuditadas: [] };
    return {
      mes: nomeMes,
      tuneisTotal: contagem.total,
      saudaveis: contagem.saudaveis,
      alertas: contagem.alertas,
      criticos: contagem.criticos,
      incompletos: contagem.incompletos,
      naoAuditaveis: contagem.naoAuditaveis,
      linhas: (resultado && resultado.linhas) || 0,
      ocorrenciasOrfas: (saude && saude.orfaos && saude.orfaos.ocorrenciasSemMike) || 0,
      duplicados: (saude && saude.duplicados) ? saude.duplicados.length : 0,
      fragmentados: (saude && saude.fragmentados) ? saude.fragmentados.length : 0,
      coberturaStatus: cobertura.status,
      regrasNaoAuditadas: (cobertura.regrasNaoAuditadas || []).map(r => r.regra)
    };
  }

  /** Resumo global (varios meses) somando os resumos por mes. */
  static construirResumoGlobal(resumosPorMes) {
    const lista = resumosPorMes || [];
    const total = {
      meses: lista.length,
      tuneisTotal: 0, saudaveis: 0, alertas: 0, criticos: 0, incompletos: 0, naoAuditaveis: 0,
      linhas: 0, ocorrenciasOrfas: 0, duplicados: 0, fragmentados: 0
    };
    const mesesNaoAuditados = [];
    lista.forEach(r => {
      total.tuneisTotal += r.tuneisTotal;
      total.saudaveis += r.saudaveis;
      total.alertas += r.alertas;
      total.criticos += r.criticos;
      total.incompletos += r.incompletos;
      total.naoAuditaveis += r.naoAuditaveis;
      total.linhas += r.linhas;
      total.ocorrenciasOrfas += r.ocorrenciasOrfas;
      total.duplicados += r.duplicados;
      total.fragmentados += r.fragmentados;
      if (r.coberturaStatus && r.coberturaStatus !== 'COMPLETA') mesesNaoAuditados.push(r.mes);
    });
    return { total, mesesNaoAuditados };
  }

  /**
   * Drill-down: MES -> TUNEL/MIKE -> LINHAS -> DIAGNOSTICO.
   * @returns {Array<{mes, tunel, mike, classificacao, motivo, linhas, diagnosticos:Array}>}
   */
  static construirDrillDown(nomeMes, resultado) {
    const saude = (resultado && resultado.saude) || null;
    if (!saude || !Array.isArray(saude.tuneis)) return [];
    const diags = (resultado && resultado.diagnosticos) || [];
    return saude.tuneis.map(t => {
      const diagsTunel = diags.filter(d => (d.tunel || '') === t.chave)
        .sort((a, b) => PainelSaude.severidadePeso(b.severidade) - PainelSaude.severidadePeso(a.severidade));
      return {
        mes: nomeMes,
        tunel: t.chave,
        mike: t.mike || '',
        classificacao: t.classificacao,
        motivo: t.motivo,
        linhas: t.linhas || [],
        diagnosticos: diagsTunel.map(d => ({
          codigo: d.codigoRegra || '',
          severidade: d.severidade || '',
          linha: d.linha || 0,
          explicacao: d.diagnostico || '',
          evidencia: d.evidencia || '',
          acao: d.acaoRecomendada || d.sugestaoCorrecao || '',
          arca: (d.arca && (d.arca.id || d.arca.codigo || d.arca.status)) || null
        }))
      };
    });
  }

  /** Tuneis que exigem acao, na ordem CRITICO -> ALERTA -> NAO_AUDITAVEL -> INCOMPLETO. */
  static listarTuneisPrioritarios(drillDown, limite = 10) {
    const peso = { 'CRITICO': 0, 'ALERTA': 1, 'NAO_AUDITAVEL': 2, 'INCOMPLETO': 3, 'SAUDAVEL': 4 };
    return (drillDown || [])
      .slice()
      .sort((a, b) => (peso[a.classificacao] - peso[b.classificacao]) || (a.mes < b.mes ? -1 : 1))
      .filter(t => t.classificacao !== 'SAUDAVEL')
      .slice(0, limite);
  }

  /** Texto consolidado para o dialogo de UI (mensal + global + limitacoes). */
  static formatarPainelTexto(resumosPorMes, global) {
    const linhas = (resumosPorMes || []).map(r => {
      const flag = r.coberturaStatus === 'COMPLETA' ? '' : ` | NAO_AUDITADO: ${r.regrasNaoAuditadas.join(', ') || r.coberturaStatus}`;
      return `${r.mes}: tuneis ${r.tuneisTotal} | saudaveis ${r.saudaveis} | alerta ${r.alertas} | critico ${r.criticos} | incompleto ${r.incompletos} | nao auditavel ${r.naoAuditaveis} | orfaos ${r.ocorrenciasOrfas}${flag}`;
    });
    const g = (global && global.total) || {};
    linhas.push('');
    linhas.push(`TOTAL GERAL: ${g.meses || 0} mes(es) | tuneis ${g.tuneisTotal || 0} | saudaveis ${g.saudaveis || 0} | alerta ${g.alertas || 0} | critico ${g.criticos || 0} | incompleto ${g.incompletos || 0} | nao auditavel ${g.naoAuditaveis || 0}`);
    if (global && global.mesesNaoAuditados && global.mesesNaoAuditados.length) {
      linhas.push(`MESES COM COBERTURA PARCIAL (NAO_AUDITADO): ${global.mesesNaoAuditados.join(', ')}`);
    }
    return linhas.join('\n');
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PainelSaude };
}
