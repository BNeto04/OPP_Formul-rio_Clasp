/**
 * ARQUIVO: Dominio/RegistroAnalitico.js
 * DESCRIÇÃO: Entidade canônica que consolida a produção de um policial ou entidade.
 * Segue estritamente a Regra #1 (Separação de Fatos vs Indicadores) e Rastreabilidade.
 */
class RegistroAnalitico {
  constructor(dados) {
    // Rastreabilidade e Identificação
    this.matricula = dados.matricula || '';
    this.nome = dados.nome || '';
    this.grad = dados.grad || '';
    this.pelotao = dados.pelotao || '';
    this.historicoEscalas = dados.historicoEscalas || [];

    // Fatos (Imutáveis: Quantidades extraídas diretamente da Fonte)
    this.fatos = {
      ocorrencias: dados.fatos?.ocorrencias ?? dados.ocorrencias ?? 0,
      qtdBoe: dados.fatos?.qtdBoe ?? dados.qtdBoe ?? 0,
      armas: dados.fatos?.armas ?? dados.armas ?? 0,
      maconha: dados.fatos?.maconha ?? dados.maconha ?? 0,
      cocaina: dados.fatos?.cocaina ?? dados.cocaina ?? 0,
      crack: dados.fatos?.crack ?? dados.crack ?? 0,
      drogasTotal: dados.fatos?.drogasTotal ?? dados.drogasTotal ?? 0,
      detidos: dados.fatos?.detidos ?? dados.detidos ?? 0,
      apfd: dados.fatos?.apfd ?? dados.apfd ?? 0,
      tco: dados.fatos?.tco ?? dados.tco ?? 0,
      boc: dados.fatos?.boc ?? dados.boc ?? 0,
      ocorrenciasComArma: dados.fatos?.ocorrenciasComArma ?? dados.ocorrenciasComArma ?? 0,
      ocorrenciasComDroga: dados.fatos?.ocorrenciasComDroga ?? dados.ocorrenciasComDroga ?? 0
    };

    // Indicadores (Variáveis calculadas pelo Motor Analítico)
    this.indicadores = {
      pontosTotais: dados.indicadores?.pontosTotais ?? dados.pontosTotais ?? 0,
      pontosPIP: dados.indicadores?.pontosPIP ?? dados.pontosPIP ?? 0,
      pontosCPM: dados.indicadores?.pontosCPM ?? dados.pontosCPM ?? 0
    };
  }

  // --- KPIs Derivados Dinamicamente (Indicadores Computados) --- //

  get mediaPontos() {
    return this.fatos.ocorrencias > 0 ? parseFloat((this.indicadores.pontosTotais / this.fatos.ocorrencias).toFixed(2)) : 0;
  }

  get mediaArmas() {
    return this.fatos.ocorrencias > 0 ? parseFloat((this.fatos.armas / this.fatos.ocorrencias).toFixed(2)) : 0;
  }

  get mediaDrogas() {
    return this.fatos.ocorrencias > 0 ? parseFloat((this.fatos.drogasTotal / this.fatos.ocorrencias).toFixed(2)) : 0;
  }

  get percentualArmas() {
    return this.fatos.ocorrencias > 0 ? parseFloat((this.fatos.ocorrenciasComArma / this.fatos.ocorrencias).toFixed(2)) : 0;
  }
  
  get percentualDrogas() {
    return this.fatos.ocorrencias > 0 ? parseFloat((this.fatos.ocorrenciasComDroga / this.fatos.ocorrencias).toFixed(2)) : 0;
  }
}
