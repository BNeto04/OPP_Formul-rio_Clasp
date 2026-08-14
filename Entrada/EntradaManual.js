/**
 * ARQUIVO: Entrada/EntradaManual.js
 * DESCRIÇÃO: Controlador que recebe o JSON do HTML e orquestra o pipeline de entrada manual.
 */

function processarEntradaManual(payload) {
  try {
    const SS_ID = (typeof CONFIG_SYNTHEON !== 'undefined' && CONFIG_SYNTHEON.PLANILHAS && CONFIG_SYNTHEON.PLANILHAS.OCORRENCIAS_ID)
      ? CONFIG_SYNTHEON.PLANILHAS.OCORRENCIAS_ID
      : '1S05sTbd3otgjGjrC-YrzHk7dXp7mzzaw_J2lyQ86hOY';
    const ss = SpreadsheetApp.openById(SS_ID);
    let aba = localizarAbaMensalTratada(ss, payload.data);

    // Verificação Anti-Duplicidade
    verificarDuplicidadeOcorrencia(aba, payload.boe, payload.mike);

    // Montagem das linhas de entrada manual
    const linhasParaInserir = montarLinhasEntradaManual(payload);

    // Gravação em Chunks (Porta M01 → M02/M06)
    gravarLinhasEntradaManual(aba, linhasParaInserir);

    const payloadBoe = payload.boe ? String(payload.boe).trim() : "";
    const payloadMike = payload.mike ? String(payload.mike).trim() : "";
    const identificador = payloadMike || payloadBoe || "sem identificador";
    return `Ocorrência ${identificador} salva com sucesso (${linhasParaInserir.length} registros computados)!`;
  } catch (erro) {
    console.error(`Falha: ${erro.message}`);
    throw new Error(erro.message);
  }
}

/**
 * Resolve o nome da aba mensal (ex: JUL2026) a partir de uma string de data.
 * @param {string} dataStr 
 * @returns {string}
 */
function resolverNomeAbaMensal(dataStr) {
  const meses = ["JAN","FEV","MAR","ABR","MAI","JUN","JUL","AGO","SET","OUT","NOV","DEZ"];
  let nomeAba = "JAN2026";
  if (!dataStr) return nomeAba;
  const partesData = dataStr.split(/[-/]/);
  if (partesData.length === 3) {
     const mesStr = partesData[1];
     const anoStr = partesData[0].length === 4 ? partesData[0] : partesData[2];
     nomeAba = `${meses[parseInt(mesStr, 10) - 1]}${anoStr}`;
  }
  return nomeAba;
}

/**
 * Localiza a aba mensal correspondente a data informada.
 * Tenta buscar primeiro o nome canônico (ex: AGO2026).
 * Se não encontrar, busca em todas as abas e normaliza ignorando acentos, espaços, hífens, barras e pontos.
 * Se nenhuma equivaler, lança erro técnico.
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} ss 
 * @param {string} dataStr 
 * @returns {GoogleAppsScript.Spreadsheet.Sheet}
 */
function localizarAbaMensalTratada(ss, dataStr) {
  const nomeAba = resolverNomeAbaMensal(dataStr);
  let aba = ss.getSheetByName(nomeAba);
  if (aba) return aba;

  const normalizar = str => String(str).normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/[\.\-\/\s]/g, "").toUpperCase();
  const nomeAlvo = normalizar(nomeAba);
  
  const todasAbas = ss.getSheets();
  const nomesExaminados = [];
  
  for (let i = 0; i < todasAbas.length; i++) {
      const n = todasAbas[i].getName();
      nomesExaminados.push(n);
      if (normalizar(n) === nomeAlvo) {
          return todasAbas[i];
      }
  }
  
  throw new Error(`Aba mensal esperada (${nomeAba}) não encontrada. Abas examinadas: [${nomesExaminados.join(", ")}]`);
}

/**
 * Valida a ocorrência contra o BOE e MIKE para evitar duplicidade na aba mensal.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} aba 
 * @param {string|number} boe 
 * @param {string|number} mike 
 */
function verificarDuplicidadeOcorrencia(aba, boe, mike) {
  const payloadBoe = boe ? String(boe).trim() : "";
  const payloadMike = mike ? String(mike).trim() : "";

  if (payloadBoe || payloadMike) {
      const colBoe = aba.getRange("G2:G" + aba.getMaxRows()).getValues();
      const colMike = aba.getRange("E2:E" + aba.getMaxRows()).getValues();
      
      for (let i = 0; i < colBoe.length; i++) {
          const boePlanilha = String(colBoe[i][0]).trim();
          const mikePlanilha = String(colMike[i][0]).trim();
          
          if (payloadBoe && boePlanilha && payloadBoe === boePlanilha) {
              throw new Error(`BLOQUEADO: A ocorrência com BOE ${payloadBoe} já consta cadastrada nesta planilha.`);
          }
          if (payloadMike && mikePlanilha && payloadMike === mikePlanilha) {
              throw new Error(`BLOQUEADO: A ocorrência com MIKE ${payloadMike} já consta cadastrada nesta planilha.`);
          }
      }
  }
}

/**
 * Converte o payload em um conjunto de linhas prontas para inserção na planilha.
 * @param {Object} payload 
 * @returns {Array<Array>}
 */
function montarLinhasEntradaManual(payload) {
  const policiais = payload.policiais || [];
  const armas = payload.armas || [];
  const drogas = payload.drogas || [];
  const ocorrenciasPip = payload.ocorrenciasPip || [];

  let maconhaGrama = 0; let maconhaDolar = 0;
  let crackPedra = 0;   let crackGrama = 0;
  let cocainaPino = 0;  let cocainaGrama = 0;

  drogas.forEach(droga => {
      if (droga.tipo === 'MACONHA DOLAR') {
          maconhaDolar += droga.quantidade;
      } else if (droga.tipo === 'MACONHA GRAMA') {
          maconhaGrama += droga.quantidade;
      } else if (droga.tipo === 'COCAINA PINO') {
          cocainaPino += droga.quantidade;
      } else if (droga.tipo === 'COCAINA GRAMA') {
          cocainaGrama += droga.quantidade;
      } else if (droga.tipo === 'CRACK PEDRA') {
          crackPedra += droga.quantidade;
      } else if (droga.tipo === 'CRACK GRAMA') {
          crackGrama += droga.quantidade;
      }
  });

  const linhasParaInserir = [];
  const numLinhas = Math.max(policiais.length, armas.length, ocorrenciasPip.length, drogas.length ? 1 : 0);

  for (let idx = 0; idx < numLinhas; idx++) {
      const isFirst = (idx === 0);
      const policial = policiais[idx] || { pelotao: "", posto: "", matricula: "", nome: "" };
      const arma = armas[idx] || null;
      const eventoPip = ocorrenciasPip[idx] || "";
      const imputadoPip = eventoPip ? (payload.imputado || "SEM IMPUTADO") : "";
      
      let armaTipo = "", armaQtd = "", armaModelo = "", armaCalibre = "", armaMunicao = "";
      if (arma) {
          armaQtd = arma.quantidade;
          armaTipo = arma.tipo;
          armaModelo = arma.modelo;
          armaCalibre = arma.calibre;
          armaMunicao = arma.municao;
      }

      const linha = [
          "", // ORD (A)
          payload.data, // DATA (B)
          payload.hora, // HORA (C)
          isFirst ? (payload.qtd_o || "1") : "", // QTD O (D)
          payload.mike, // MIKE (E)
          payload.natureza, // NATUREZA (F)
          payload.boe, // BOE (G)
          isFirst ? (payload.ais || "") : "", // AIS (H)
          isFirst ? (payload.cidade || "") : "", // CIDADE (I)
          isFirst ? (payload.bairro || "") : "", // BAIRRO (J)
          isFirst ? (payload.detidos || "") : "", // DETIDOS (K)
          armaQtd, // ARMA (L)
          armaTipo, // TIPO (M)
          armaCalibre, // CALIBRE (N)
          armaModelo, // MODELO (O)
          armaMunicao || "", // MUNIÇÃO (P)
          isFirst ? (maconhaDolar || "") : "", // MACONHA DOLAR (Q)
          isFirst ? (maconhaGrama || "") : "", // MACONHA GRAMA (R)
          "", // TOTAL DE MACONHA (S) - preenchido pela Camada Analítica
          "", // Dividido mac (T) - preenchido pela Camada Analítica
          isFirst ? (crackPedra || "") : "", // CRACK PEDRA (U)
          isFirst ? (crackGrama || "") : "", // CRACK GRAMA (V)
          "", // Total CRACK (gr) (W) - preenchido pela Camada Analítica
          isFirst ? (cocainaPino || "") : "", // COCAINA PINO (X)
          isFirst ? (cocainaGrama || "") : "", // COCAINA GRAMA (Y)
          "", // TOTAL DE COCAINA (Z) - preenchido pela Camada Analítica
          "", // Dividido coc (AA) - preenchido pela Camada Analítica
          policial.pelotao, // PELOTÃO (AB)
          policial.posto, // GRAD (AC)
          policial.matricula, // MATRICULA (AD)
          policial.nome, // POLICIAL (AE)
          policial.nome ? (policial.qtd_armas > 0 ? policial.qtd_armas : "") : "", // QDT ARMAS (AF)
          eventoPip, // OCORRÊNCIA PIP (AG)
          imputadoPip, // IMPUTADO? (AH)
          "", // PONTOS TOTAIS (AI) - preenchido pela planilha
          "", // PONTOS FICÇÃO (1/4) (AJ) - preenchido pela planilha
          "" // Chave Ocorrência (AK) - preenchida pela planilha
      ];
      linhasParaInserir.push(linha);
  }

  return linhasParaInserir;
}

/**
 * Localiza um bloco contíguo de linhas pré-formatadas prontas para uso.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} aba
 * @param {number} quantidade
 * @returns {GoogleAppsScript.Spreadsheet.Range}
 */
function localizarBlocoModeloDisponivel_(aba, quantidade) {
  const colB = aba.getRange("B1:B" + aba.getMaxRows()).getValues();
  let ultimaLinha = 0;
  for (let i = colB.length - 1; i >= 0; i--) {
      if (String(colB[i][0]).trim() !== "") {
          ultimaLinha = i + 1;
          break;
      }
  }
  
  const linhaParaEscrever = ultimaLinha > 0 ? ultimaLinha + 1 : 2; 
  const numColunas = aba.getLastColumn();
  
  if (linhaParaEscrever + quantidade - 1 > aba.getMaxRows()) {
      throw new Error(`A aba não possui linhas suficientes para inserir ${quantidade} registros.`);
  }

  const targetRange = aba.getRange(linhaParaEscrever, 1, quantidade, numColunas);
  const targetFormulas = targetRange.getFormulas();
  const targetValues = targetRange.getValues();
  const headers = aba.getRange(1, 1, 1, numColunas).getValues()[0];
  
  const SyntheonCabecalhosObj = typeof SyntheonCabecalhos !== 'undefined' ? SyntheonCabecalhos : (typeof require !== 'undefined' ? require('../Core/Cabecalhos').SyntheonCabecalhos || require('../Core/Cabecalhos') : null);
  if (!SyntheonCabecalhosObj) throw new Error("Dependência SyntheonCabecalhos não encontrada.");
  const headersIndex = SyntheonCabecalhosObj.criarIndice(headers);
  const colunasFormulaObrigatoriaNomes = ["TOTAL DE MACONHA", "DIVIDIDO MAC", "TOTAL CRACK (GR)", "TOTAL DE COCAINA", "DIVIDIDO COC", "PONTOS TOTAIS", "PONTOS FICÇÃO (1/4)", "CHAVE OCORRÊNCIA"];

  for (let rowIdx = 0; rowIdx < quantidade; rowIdx++) {
     const rowFormulas = targetFormulas[rowIdx];
     for (let i = 0; i < colunasFormulaObrigatoriaNomes.length; i++) {
        const nomeF = colunasFormulaObrigatoriaNomes[i];
        const colIdx = SyntheonCabecalhosObj.encontrar(headersIndex, nomeF);
        if (colIdx === -1) throw new Error(`Coluna obrigatória de cálculo '${nomeF}' não encontrada na aba.`);
        if (!rowFormulas[colIdx] || !rowFormulas[colIdx].toString().startsWith('=')) {
            throw new Error(`Linha ${linhaParaEscrever + rowIdx} da aba não possui as fórmulas pré-formatadas requeridas na coluna '${nomeF}'. Faltam linhas preparadas.`);
        }
     }
  }

  for (let rowIdx = 0; rowIdx < quantidade; rowIdx++) {
     for (let colIdx = 0; colIdx < numColunas; colIdx++) {
         const valStr = String(targetValues[rowIdx][colIdx]).trim();
         const isFormula = targetFormulas[rowIdx][colIdx] && targetFormulas[rowIdx][colIdx].toString().startsWith('=');
         if (!isFormula && valStr !== "") {
             throw new Error(`Linha ${linhaParaEscrever + rowIdx} da aba não está vazia na coluna ${colIdx + 1}. Garanta linhas em branco antes de gravar.`);
         }
     }
  }

  return targetRange;
}

/**
 * Escreve as linhas formatadas apenas em colunas permitidas, baseando-se nos nomes dos cabeçalhos.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} aba 
 * @param {Array<Array>} linhasParaInserir 
 */
function gravarLinhasEntradaManual(aba, linhasParaInserir) {
  if (!linhasParaInserir || linhasParaInserir.length === 0) return;

  const totalLinhas = linhasParaInserir.length;
  const targetRange = localizarBlocoModeloDisponivel_(aba, totalLinhas);
  const linhaParaEscrever = targetRange.getRow();
  
  const SyntheonCabecalhosObj = typeof SyntheonCabecalhos !== 'undefined' ? SyntheonCabecalhos : (typeof require !== 'undefined' ? require('../Core/Cabecalhos').SyntheonCabecalhos || require('../Core/Cabecalhos') : null);
  const headers = aba.getRange(1, 1, 1, aba.getLastColumn()).getValues()[0];
  const headersIndex = SyntheonCabecalhosObj.criarIndice(headers);
  
  const targetFormulas = targetRange.getFormulas();
  const targetValidations = targetRange.getDataValidations();

  const CABECALHOS_ORIGINAIS = [
    "ORD", "DATA", "HORA", "QTD O", "MIKE", "NATUREZA", "BOE", "AIS", "CIDADE", "BAIRRO", "DETIDOS",
    "ARMA", "TIPO", "CALIBRE", "MODELO", "MUNIÇÃO", 
    "MACONHA DOLAR", "MACONHA GRAMA", "TOTAL DE MACONHA", "DIVIDIDO MAC",
    "CRACK PEDRA", "CRACK GRAMA", "TOTAL CRACK (GR)", 
    "COCAINA PINO", "COCAINA GRAMA", "TOTAL DE COCAINA", "DIVIDIDO COC",
    "PELOTÃO", "GRAD", "MATRICULA", "POLICIAL", "QDT ARMAS", 
    "OCORRÊNCIA PIP", "IMPUTADO?", "PONTOS TOTAIS", "PONTOS FICÇÃO (1/4)", "CHAVE OCORRÊNCIA"
  ];
  
  const controlados = ["NATUREZA", "TIPO", "MODELO", "OCORRÊNCIA PIP"];

  // Fase 1: Validação Total de Integridade
  for (let rowIdx = 0; rowIdx < totalLinhas; rowIdx++) {
     const rowFormulas = targetFormulas[rowIdx];
     const rowValidations = targetValidations[rowIdx];
     
     // 1.2 Validações de Dados para Valores Inseridos na Linha
     for (let origIdx = 0; origIdx < CABECALHOS_ORIGINAIS.length; origIdx++) {
         const headerOrig = CABECALHOS_ORIGINAIS[origIdx];
         const colIdx = SyntheonCabecalhosObj.encontrar(headersIndex, headerOrig);
         if (colIdx === -1) continue;
         
         const valorPretendido = linhasParaInserir[rowIdx][origIdx];
         
         if (rowFormulas[colIdx] && rowFormulas[colIdx].toString().startsWith('=')) {
             if (valorPretendido) {
                 throw new Error(`Tentativa de sobrescrever a fórmula da coluna '${headerOrig}' na linha ${linhaParaEscrever + rowIdx}.`);
             }
         }

         const dv = rowValidations[colIdx];
         if (dv && valorPretendido) {
             const type = dv.getCriteriaType();
             const args = dv.getCriteriaValues();
             let valid = true;
             
             if (type === SpreadsheetApp.DataValidationCriteria.VALUE_IN_LIST) {
                const lista = args[0].map(String);
                if (!lista.includes(String(valorPretendido))) valid = false;
             } else if (type === SpreadsheetApp.DataValidationCriteria.VALUE_IN_RANGE) {
                if (args[0] && typeof args[0].getValues === 'function') {
                    const vals = args[0].getValues().map(function(r){ return String(r[0]); });
                    if (!vals.includes(String(valorPretendido))) valid = false;
                }
             } else {
                throw new Error(`Validação de tipo desconhecido na coluna '${headerOrig}'. Gravação abortada.`);
             }

             if (!valid) {
                throw new Error(`O valor '${valorPretendido}' não é permitido pela validação da planilha na coluna '${headerOrig}'. Gravação abortada.`);
             }
         } else if (!dv && valorPretendido && controlados.includes(headerOrig)) {
             throw new Error(`Validação ausente na coluna controlada '${headerOrig}'.`);
         }
     }
  }

  // Fase 2: Gravação Física
  const colsPermitidasNomes = [
    "DATA", "HORA", "QTD O", "MIKE", "NATUREZA", "BOE", "AIS", "CIDADE", "BAIRRO", "DETIDOS",
    "ARMA", "TIPO", "CALIBRE", "MODELO", "MUNIÇÃO", 
    "MACONHA DOLAR", "MACONHA GRAMA", "CRACK PEDRA", "CRACK GRAMA", "COCAINA PINO", "COCAINA GRAMA", 
    "PELOTÃO", "GRAD", "MATRICULA", "POLICIAL", "QDT ARMAS", "OCORRÊNCIA PIP", "IMPUTADO?"
  ];
  
  for (let i = 0; i < colsPermitidasNomes.length; i++) {
     const nomeCol = colsPermitidasNomes[i];
     const targetColIdx = SyntheonCabecalhosObj.encontrar(headersIndex, nomeCol);
     const sourceColIdx = CABECALHOS_ORIGINAIS.indexOf(nomeCol);
     
     if (targetColIdx === -1 || sourceColIdx === -1) continue;
     
     let temFormula = false;
     for (let r = 0; r < totalLinhas; r++) {
         const form = targetFormulas[r][targetColIdx];
         if (form && form.toString().startsWith('=')) {
             temFormula = true;
         }
     }
     if (temFormula) {
         continue; // Proteção extra
     }
     
     const rangeCol = aba.getRange(linhaParaEscrever, targetColIdx + 1, totalLinhas, 1);
     const valoresCol = [];
     for (let r = 0; r < totalLinhas; r++) {
         valoresCol.push([linhasParaInserir[r][sourceColIdx]]);
     }
     rangeCol.setValues(valoresCol);
  }
}

/**
 * Retorna as opções válidas das caixas suspensas da aba mensal correspondente.
 * @param {string} dataStr 
 * @returns {Object} {naturezas: [], armasTipos: [], armasModelos: [], ocorrenciasPip: [], detidos: []}
 */
function obterOpcoesValidacao(dataStr) {
  try {
    if (!dataStr) throw new Error("Data inválida ou não informada.");
    const SS_ID = (typeof CONFIG_SYNTHEON !== 'undefined' && CONFIG_SYNTHEON.PLANILHAS && CONFIG_SYNTHEON.PLANILHAS.OCORRENCIAS_ID)
      ? CONFIG_SYNTHEON.PLANILHAS.OCORRENCIAS_ID
      : '1S05sTbd3otgjGjrC-YrzHk7dXp7mzzaw_J2lyQ86hOY';
    const ss = SpreadsheetApp.openById(SS_ID);
    const aba = localizarAbaMensalTratada(ss, dataStr);
    const nomeAba = aba.getName();

    const SyntheonCabecalhosObj = typeof SyntheonCabecalhos !== 'undefined' ? SyntheonCabecalhos : (typeof require !== 'undefined' ? require('../Core/Cabecalhos').SyntheonCabecalhos || require('../Core/Cabecalhos') : null);

    const numColunas = aba.getLastColumn();
    const headers = aba.getRange(1, 1, 1, numColunas).getValues()[0];
    const headersIndex = SyntheonCabecalhosObj ? SyntheonCabecalhosObj.criarIndice(headers) : {};

    const maxRows = aba.getMaxRows();

    function extrairValores(nomeCabecalho) {
      let colIdx = -1;
      if (SyntheonCabecalhosObj) {
         colIdx = SyntheonCabecalhosObj.encontrar(headersIndex, nomeCabecalho);
      } else {
         const hs = headers.map(h => String(h).trim().toUpperCase());
         colIdx = hs.indexOf(nomeCabecalho.toUpperCase());
      }
      
      if (colIdx === -1) return [];
      if (maxRows < 2) return [];

      const validationsCol = aba.getRange(2, colIdx + 1, maxRows - 1, 1).getDataValidations();
      let dv = null;
      let examinedRows = 0;
      
      for (let r = validationsCol.length - 1; r >= 0; r--) {
         examinedRows++;
         if (validationsCol[r][0] != null) {
             dv = validationsCol[r][0];
             break;
         }
      }
      
      if (!dv) return [];
      
      const criteria = dv.getCriteriaType();
      const args = dv.getCriteriaValues();
      if (criteria === SpreadsheetApp.DataValidationCriteria.VALUE_IN_LIST) {
        return args[0].map(String);
      } else if (criteria === SpreadsheetApp.DataValidationCriteria.VALUE_IN_RANGE) {
        if (args[0] && typeof args[0].getValues === 'function') {
           const values = args[0].getValues();
           const list = [];
           for (let r=0; r<values.length; r++) {
              if(values[r][0]) list.push(String(values[r][0]));
           }
           return list;
        }
      }
      return [];
    }

    const ret = {
      data: dataStr,
      naturezas: extrairValores("NATUREZA"),
      armasTipos: extrairValores("TIPO"),
      armasModelos: extrairValores("MODELO"),
      ocorrenciasPip: extrairValores("OCORRÊNCIA PIP"),
      detidos: extrairValores("DETIDOS")
    };
    
    if (!ret.naturezas || !ret.naturezas.length) {
        throw new Error("Aba " + nomeAba + " encontrada, mas sem validações formatadas (provavelmente faltam linhas preparadas).");
    }
    
    return ret;
  } catch(e) {
    console.error("obterOpcoesValidacao erro: " + e.message);
    throw new Error(e.message);
  }
}

/**
 * PORTA: M01 → M07 Efetivo
 * Lê a aba de efetivo e retorna array de policiais para alimentar a interface Formulario.html.
 * Chamado via google.script.run.getEfetivo() pelo Formulario.html.
 * @returns {Array<{pelotao:string, posto:string, matricula:string, nome:string}>}
 */
function getEfetivo() {
  try {
    const SS_ID = (typeof CONFIG_SYNTHEON !== 'undefined' && CONFIG_SYNTHEON.PLANILHAS && CONFIG_SYNTHEON.PLANILHAS.OCORRENCIAS_ID)
      ? CONFIG_SYNTHEON.PLANILHAS.OCORRENCIAS_ID
      : '1S05sTbd3otgjGjrC-YrzHk7dXp7mzzaw_J2lyQ86hOY';
    const ss     = SpreadsheetApp.openById(SS_ID);

    const aliasesEfetivo = (typeof CONFIG_SYNTHEON !== 'undefined' && CONFIG_SYNTHEON.ABAS && CONFIG_SYNTHEON.ABAS.EFETIVO_ALIASES)
      ? CONFIG_SYNTHEON.ABAS.EFETIVO_ALIASES
      : ['EFETIVO', 'Efetivo', 'efetivo'];

    let sheet = null;
    for (let i = 0; i < aliasesEfetivo.length; i++) {
      sheet = ss.getSheetByName(aliasesEfetivo[i]);
      if (sheet) break;
    }
    if (!sheet) sheet = ss.getSheets()[0];

    const dados = sheet.getDataRange().getValues();

    const cNome  = 0; // Coluna A: Nome de guerra
    const cPosto = 3; // Coluna D: Posto/Graduação
    const cMat   = 4; // Coluna E: Matrícula
    const cPel   = 5; // Coluna F: Pelotão

    const resultado = [];
    for (let i = 0; i < dados.length; i++) {
      const row       = dados[i];
      const matricula = String(row[cMat]  || '').replace(/\D/g, '').trim();
      const nome      = String(row[cNome] || '').trim();
      
      if (!matricula || !nome) continue;

      resultado.push({
        pelotao:   String(row[cPel]   || '').trim(),
        posto:     String(row[cPosto] || '').trim(),
        matricula: matricula,
        nome:      nome
      });
    }

    console.log(`getEfetivo(): ${resultado.length} policiais carregados da aba "${sheet.getName()}"`);
    return resultado;

  } catch (e) {
    console.error('getEfetivo() falhou: ' + e.message);
    return [];
  }
}
