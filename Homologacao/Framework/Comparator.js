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

    // --- DEPURAÇÃO SOLICITADA: EXPORTAR LISTAS DE PMS PARA ABAS TEMPORÁRIAS ---
    try {
      let abaV1 = ss.getSheetByName('ListaV1_PM');
      if (!abaV1) abaV1 = ss.insertSheet('ListaV1_PM');
      abaV1.clear();
      abaV1.appendRow(['MATRICULA_ORIGINAL', 'MATRICULA_NORMALIZADA', 'NOME', 'QTD_OCORRENCIAS']);
      const dadosAbaV1 = arrayV1.map(p => [
        p.matricula, 
        String(p.matricula).replace(/\\D/g, ''), 
        p.nome, 
        p.fatos ? p.fatos.ocorrencias : (p.ocorrencias || 0)
      ]);
      if (dadosAbaV1.length > 0) abaV1.getRange(2, 1, dadosAbaV1.length, 4).setValues(dadosAbaV1);

      let abaV2 = ss.getSheetByName('ListaV2_PM');
      if (!abaV2) abaV2 = ss.insertSheet('ListaV2_PM');
      abaV2.clear();
      abaV2.appendRow(['MATRICULA_ORIGINAL', 'MATRICULA_NORMALIZADA', 'NOME', 'QTD_OCORRENCIAS']);
      const dadosAbaV2 = arrayV2.map(p => [
        p.matricula, 
        String(p.matricula).replace(/\\D/g, ''), 
        p.nome, 
        p.fatos ? p.fatos.ocorrencias : (p.ocorrencias || 0)
      ]);
      if (dadosAbaV2.length > 0) abaV2.getRange(2, 1, dadosAbaV2.length, 4).setValues(dadosAbaV2);
    } catch (e) {
      Logger.log("Erro ao gerar abas de debug: " + e.message);
    }
    // --- FIM EXPORTAÇÃO DEPURAÇÃO ---

    return { arrayV1, arrayV2, tempos };
  }

  /**
   * Cria mapas indexados pela matrícula para comparação O(1).
   */
  parearDatasets(arrayV1, arrayV2) {
    const mapaV1 = {};
    const mapaV2 = {};
    
    // V1 usa matrícula sem hífen (1139207). V2 usa com hífen (113920-7).
    // O comparador normaliza a chave para garantir o match (Tira tudo que não for número).
    const normalizar = (k) => String(k).replace(/\\D/g, '');
    
    arrayV1.forEach(reg => mapaV1[normalizar(reg.matricula)] = reg);
    arrayV2.forEach(reg => mapaV2[normalizar(reg.matricula)] = reg);
    
    // --- INÍCIO DEPURAÇÃO (SOLICITADA PELO USUÁRIO) ---
    let divergenciasLogadas = 0;
    Object.keys(mapaV2).forEach(chaveV2 => {
       if (!mapaV1[chaveV2] && divergenciasLogadas < 5) {
           divergenciasLogadas++;
           const regV2 = mapaV2[chaveV2];
           
           // Achar correspondente na força bruta (tirando qualquer não-número para garantir que a gente encontre)
           const matriculaV2ApenasNumeros = String(regV2.matricula).replace(/\\D/g, ''); // a regex certa de limpar tudo
           const v1Match = arrayV1.find(r => String(r.matricula).replace(/\\D/g, '') === matriculaV2ApenasNumeros);
           
           Logger.log(`[DEPURAÇÃO DIVERGÊNCIA #${divergenciasLogadas}]`);
           Logger.log(`Matrícula original da V1: ${v1Match ? v1Match.matricula : 'NÃO ENCONTRADO'}`);
           Logger.log(`Matrícula normalizada da V1: ${v1Match ? normalizar(v1Match.matricula) : 'N/A'}`);
           Logger.log(`Matrícula original da V2: ${regV2.matricula}`);
           Logger.log(`Matrícula normalizada da V2: ${normalizar(regV2.matricula)}`);
           Logger.log(`Chave efetivamente usada no Map da V1: ${v1Match ? normalizar(v1Match.matricula) : 'N/A'}`);
           Logger.log(`Chave efetivamente usada no Map da V2: ${chaveV2}`);
           Logger.log(`Chave utilizada na consulta: ${chaveV2}`);
       }
    });
    // --- FIM DEPURAÇÃO ---

    return { mapaV1, mapaV2 };
  }
}
