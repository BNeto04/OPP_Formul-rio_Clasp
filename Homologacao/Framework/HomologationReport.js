/**
 * ARQUIVO: Homologacao/Framework/HomologationReport.js
 * DESCRIÇÃO: DTO abstrato que armazena os resultados da homologação
 * de forma agnóstica em relação ao método de exibição.
 */
class HomologationReport {
  constructor(titulo = "Relatório de Homologação V1 x V2") {
    this.titulo = titulo;
    this.dataHora = new Date().toISOString();
    this.sucessoTotal = true;
    this.resultados = []; // Array de métricas validadas
    this.estatisticas = {
      tempoV1_ms: 0,
      tempoV2_ms: 0
    };
  }

  adicionarResultado(nome, v1, v2, status, diferenca = 0, diagnostico = null) {
    if (status !== 'PASS') {
      this.sucessoTotal = false;
    }
    this.resultados.push({
      nome: nome,
      v1: v1,
      v2: v2,
      status: status, // 'PASS', 'FAIL', 'WARN'
      diferenca: diferenca,
      diagnostico: diagnostico
    });
  }

  setTemposExecucao(tempoV1, tempoV2) {
    this.estatisticas.tempoV1_ms = tempoV1;
    this.estatisticas.tempoV2_ms = tempoV2;
  }
}
