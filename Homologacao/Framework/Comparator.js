/**
 * ARQUIVO: Homologacao/Framework/Comparator.js
 * DESCRIÇÃO: Módulo responsável por orquestrar a execução bruta
 * da V1 e V2 e comparar registro por registro.
 */
class Comparator {
  constructor() {
    this.errosDeIntegridade = []; // Casos onde o PM falta em um dos lados
  }

  /**
   * Executa os pipelines e gera um dicionário pareado de resultados.
   * Na vida real (GAS), extrairá de uma aba.
   */
  extrairDatasets(sheet, metadado, mapaEfetivo) {
    const tempos = {};

    // 1. Extração V1 real usando os motores legados
    const t0_v1 = new Date().getTime();
    const loggerV1 = new SyntheonLogger('HOMOLOGACAO');
    const ss = sheet.getParent();
    const ocorrenciasV1 = SyntheonLeitor.lerAbas(ss, [sheet.getName()], null, null, loggerV1);
    const mapaProdV1 = SyntheonMetricas.consolidarPoliciais(ocorrenciasV1);
    const arrayV1 = Object.values(mapaProdV1);
    tempos.tempoV1 = new Date().getTime() - t0_v1;

    // 2. Extração V2
    const t0_v2 = new Date().getTime();
    const fatosBrutos = Adaptador2026.extrairFatos(sheet, metadado, mapaEfetivo);
    const arrayV2 = MotorAnaliticoV2.processarProdutividadePolicial(fatosBrutos);
    tempos.tempoV2 = new Date().getTime() - t0_v2;

    return { arrayV1, arrayV2, tempos };
  }

  /**
   * Cria mapas indexados pela matrícula para comparação O(1).
   */
  parearDatasets(arrayV1, arrayV2) {
    const mapaV1 = {};
    const mapaV2 = {};
    
    arrayV1.forEach(reg => mapaV1[reg.matricula] = reg);
    arrayV2.forEach(reg => mapaV2[reg.matricula] = reg);
    
    return { mapaV1, mapaV2 };
  }
}
