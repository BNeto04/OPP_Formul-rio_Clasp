/**
 * ARQUIVO: Dominio/RegistroAnalitico.js
 * DESCRIÇÃO: Entidade canônica que consolida a produção de um policial ou entidade,
 * gerando e disponibilizando os Indicadores Chave de Desempenho (KPIs).
 */
class RegistroAnalitico {
  constructor(dados) {
    this.matricula = dados.matricula || '';
    this.nome = dados.nome || '';
    this.grad = dados.grad || '';
    this.pelotao = dados.pelotao || '';
    
    this.ocorrencias = dados.ocorrencias || 0;
    this.qtdBoe = dados.qtdBoe || 0;
    this.pontosTotais = dados.pontosTotais || 0;
    
    this.armas = dados.armas || 0;
    this.maconha = dados.maconha || 0;
    this.cocaina = dados.cocaina || 0;
    this.crack = dados.crack || 0;
    this.drogasTotal = dados.drogasTotal || 0;
    
    this.detidos = dados.detidos || 0;
    this.apfd = dados.apfd || 0;
    this.tco = dados.tco || 0;
    this.boc = dados.boc || 0;

    this.ocorrenciasComArma = dados.ocorrenciasComArma || 0;
    this.ocorrenciasComDroga = dados.ocorrenciasComDroga || 0;
  }

  // --- KPIs Derivados --- //

  get mediaPontos() {
    return this.ocorrencias > 0 ? parseFloat((this.pontosTotais / this.ocorrencias).toFixed(2)) : 0;
  }

  get mediaArmas() {
    return this.ocorrencias > 0 ? parseFloat((this.armas / this.ocorrencias).toFixed(2)) : 0;
  }

  get mediaDrogas() {
    return this.ocorrencias > 0 ? parseFloat((this.drogasTotal / this.ocorrencias).toFixed(2)) : 0;
  }

  get percentualArmas() {
    return this.ocorrencias > 0 ? parseFloat((this.ocorrenciasComArma / this.ocorrencias).toFixed(2)) : 0;
  }
  
  get percentualDrogas() {
    return this.ocorrencias > 0 ? parseFloat((this.ocorrenciasComDroga / this.ocorrencias).toFixed(2)) : 0;
  }
}
