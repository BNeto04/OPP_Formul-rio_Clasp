/**
 * ARQUIVO: Entrada/EntradaManual.js
 * DESCRIÇÃO: Controlador que recebe o JSON do HTML e orquestra o pipeline de entrada manual.
 */

/**
 * QTD O (quantidade de ocorrencias do tunel): padrao fixo 01 (regra do proprietario, 11/09/2026).
 * O OCR nao infere este campo; vazio/0/1 sao normalizados para 01.
 */
function qtdOcorrenciaPadrao_(valor) {
  const v = String(valor === undefined || valor === null ? '' : valor).trim();
  if (!v || v === '0' || v === '1' || v === '01') return '01';
  return v;
}

function obterSpreadsheetOcorrencias_() {
  if (typeof SpreadsheetApp !== 'undefined') {
    try {
      const active = SpreadsheetApp.getActiveSpreadsheet();
      if (active) return active;
    } catch (e) {}
  }
  const SS_ID = (typeof CONFIG_SYNTHEON !== 'undefined' && CONFIG_SYNTHEON.PLANILHAS && CONFIG_SYNTHEON.PLANILHAS.OCORRENCIAS_ID)
    ? CONFIG_SYNTHEON.PLANILHAS.OCORRENCIAS_ID
    : '1S05sTbd3otgjGjrC-YrzHk7dXp7mzzaw_J2lyQ86hOY';
  return SpreadsheetApp.openById(SS_ID);
}

/**
 * Núcleo da entrada manual: NUNCA bloqueia. Validações viram AVISOS (não exceções) e a gravação
 * segue "best effort" — a triagem forte fica com o GUARDIÃO (auditoria), não com a entrada.
 * @param {Object} payload
 * @param {{simular?: boolean}} opcoes simular=true valida e NAO grava (dry-run).
 * @returns {{status: string, registros: number, avisos: string[], identificador: string, aba: string|null}}
 */
function _processarEntradaManual(payload, opcoes) {
  opcoes = opcoes || {};
  const avisos = [];
  const identificador = String(payload && (payload.mike || payload.boe) || 'sem identificador').trim();
  let aba = null;

  try {
    const ss = obterSpreadsheetOcorrencias_();
    try {
      aba = localizarAbaMensalTratada(ss, payload.data);
    } catch (e) {
      avisos.push('ABA_MENSAL: ' + (e && e.message || e));
      return { status: 'NAO_GRAVADO', registros: 0, avisos: avisos, identificador: identificador, aba: null };
    }

    // Anti-duplicidade: vira AVISO, nao bloqueia (a triagem fica no Guardiao).
    verificarDuplicidadeOcorrencia(aba, payload.boe, payload.mike, avisos);

    let linhas = [];
    try {
      linhas = montarLinhasEntradaManual(payload);
    } catch (e) {
      avisos.push('MONTAGEM: ' + (e && e.message || e));
      return { status: 'NAO_GRAVADO', registros: 0, avisos: avisos, identificador: identificador, aba: aba.getName() };
    }

    try {
      gravarLinhasEntradaManual(aba, linhas, { simular: opcoes.simular, avisos: avisos });
    } catch (e) {
      avisos.push('GRAVACAO: ' + (e && e.message || e));
      return { status: 'NAO_GRAVADO', registros: 0, avisos: avisos, identificador: identificador, aba: aba.getName() };
    }

    return {
      status: opcoes.simular ? 'SIMULADO' : 'OK',
      registros: linhas.length,
      avisos: avisos,
      identificador: identificador,
      aba: aba.getName()
    };
  } catch (e) {
    avisos.push('ERRO: ' + (e && e.message || e));
    return { status: 'NAO_GRAVADO', registros: 0, avisos: avisos, identificador: identificador, aba: aba ? aba.getName() : null };
  }
}

/**
 * Porta da UI: devolve mensagem amigavel (nunca lança). Avisos aparecem no texto, sem bloquear.
 */
function processarEntradaManual(payload) {
  const r = _processarEntradaManual(payload, {});
  let msg;
  if (r.status === 'OK') {
    msg = 'Ocorrência ' + r.identificador + ' salva (' + r.registros + ' registros).';
  } else if (r.status === 'SIMULADO') {
    msg = 'SIMULAÇÃO (nada gravado) — ocorrência ' + r.identificador + '.';
  } else {
    // NAO_GRAVADO precisa ser INCONFUNDIVEL: o operador tem de perceber que o BO
    // NAO entrou, para nao perder o registro (defeito do BO 04/09).
    msg = '⛔ NÃO GRAVADO — ocorrência ' + r.identificador + ' (status: ' + r.status + ').';
  }
  if (r.avisos.length) {
    msg += '\n⚠️ Avisos (conferir no Guardião):\n' + r.avisos.map(function (a) { return ' • ' + a; }).join('\n');
  }
  return msg;
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
  const limpo = String(dataStr).trim();
  const partesData = limpo.split(/[-/]/);
  if (partesData.length === 3) {
     let mesNum = 1;
     let anoStr = "2026";
     if (partesData[0].length === 4) {
       // Formato ISO: YYYY-MM-DD
       anoStr = partesData[0];
       mesNum = parseInt(partesData[1], 10);
     } else {
       // Formato BR: DD/MM/YYYY ou DD/MM/YY
       mesNum = parseInt(partesData[1], 10);
       anoStr = partesData[2];
       if (anoStr.length === 2) anoStr = "20" + anoStr;
     }
     if (mesNum >= 1 && mesNum <= 12) {
       nomeAba = `${meses[mesNum - 1]}${anoStr}`;
     }
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

  // Fallback: busca por prefixo do mês (ex: "AGO" ou "AGOSTO")
  const prefixoMes = nomeAba.substring(0, 3);
  for (let i = 0; i < todasAbas.length; i++) {
      const nNorm = normalizar(todasAbas[i].getName());
      if (nNorm.startsWith(prefixoMes)) {
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
function verificarDuplicidadeOcorrencia(aba, boe, mike, avisos) {
  avisos = avisos || [];
  const payloadBoe = boe ? String(boe).trim() : "";
  const payloadMike = mike ? String(mike).trim() : "";

  if (payloadBoe || payloadMike) {
      const colBoe = aba.getRange("G2:G" + aba.getMaxRows()).getValues();
      const colMike = aba.getRange("E2:E" + aba.getMaxRows()).getValues();
      
      const total = Math.max(colBoe.length, colMike.length);
      for (let i = 0; i < total; i++) {
          const boePlanilha = colBoe[i] ? String(colBoe[i][0]).trim() : "";
          const mikePlanilha = colMike[i] ? String(colMike[i][0]).trim() : "";
          
          if (payloadBoe && boePlanilha && payloadBoe === boePlanilha) {
              avisos.push('DUPLICIDADE: o BOE ' + payloadBoe + ' já consta cadastrado nesta aba.');
          }
          if (payloadMike && mikePlanilha && payloadMike === mikePlanilha) {
              avisos.push('DUPLICIDADE: o MIKE ' + payloadMike + ' já consta cadastrado nesta aba.');
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
  // Ordem de antiguidade (patente e, no empate, matricula mais antiga) - chega pronta na planilha.
  const policiais = ordenarEquipePorAntiguidade_(payload.policiais || []);
  const armas = payload.armas || [];
  const drogas = payload.drogas || [];
  const ocorrenciasPip = (payload.ocorrenciasPip && payload.ocorrenciasPip.length > 0)
    ? payload.ocorrenciasPip
    : (payload.natureza ? [payload.natureza] : []);

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
      const eventoPip = ocorrenciasPip[idx] || (isFirst && payload.natureza ? payload.natureza : "");
      
      const imputadoVal = (payload.imputado && String(payload.imputado).trim()) 
        ? String(payload.imputado).trim() 
        : ((payload.detidos && parseInt(payload.detidos, 10) > 0) ? "COM IMPUTADO" : "SEM IMPUTADO");
      
      const imputadoPip = isFirst ? imputadoVal : (eventoPip ? imputadoVal : "");
      
      let armaTipo = "", armaQtd = "", armaModelo = "", armaCalibre = "", armaMunicao = "";
      if (arma) {
          armaTipo = arma.tipo;
          // Regra do dono (12/09): arma artesanal NAO entra na quantidade fisica (ARMA) -> forca vazio.
          const ehArtesanal = String(arma.tipo || '').toUpperCase().includes('CASEIRA') || String(arma.tipo || '').toUpperCase().includes('ARTESANAL');
          armaQtd = ehArtesanal ? "" : arma.quantidade;
          armaModelo = arma.modelo;
          armaCalibre = arma.calibre;
          armaMunicao = arma.municao;
      }

      const linha = [
          "", // ORD (A)
          payload.data, // DATA (B)
          payload.hora, // HORA (C)
          isFirst ? qtdOcorrenciaPadrao_(payload.qtd_o) : "", // QTD O (D) - padrao fixo 01
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
          "", // PELOTÃO (AB) - Calculado por fórmula PROCV
          "", // GRAD (AC) - Calculado por fórmula PROCV
          "", // MATRICULA (AD) - Calculado por fórmula PROCV
          policial.nome, // POLICIAL (AE) - Gravado para alimentar o PROCV
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
 * @returns {Object}
 */
function localizarBlocoModeloDisponivel_(aba, quantidade, avisos) {
  avisos = avisos || [];
  const colB = aba.getRange("B1:B" + aba.getMaxRows()).getValues();
  let ultimaLinha = 0;
  for (let i = colB.length - 1; i >= 0; i--) {
      if (String(colB[i][0]).trim() !== "") {
          ultimaLinha = i + 1;
          break;
      }
  }
  
  const linhaParaEscrever = (ultimaLinha > 1) ? (ultimaLinha + 2) : 2; 
  const numColunas = aba.getLastColumn();
  
  // Permissivo: expande a grade em vez de bloquear (o operador insiste e passa).
  const maxRows = aba.getMaxRows();
  const linhasFaltantes = (linhaParaEscrever + quantidade - 1) - maxRows;
  if (linhasFaltantes > 0) {
      avisos.push('LINHAS_INSUFICIENTES: aba ' + aba.getName() + ' expandida em ' + linhasFaltantes + ' linha(s).');
      aba.insertRows(maxRows, linhasFaltantes);
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
        if (colIdx === -1) { avisos.push('COLUNA_FORMULA_AUSENTE: coluna de cálculo \'' + nomeF + '\' não localizada.'); continue; }
        if (!rowFormulas[colIdx] || !rowFormulas[colIdx].toString().startsWith('=')) {
            avisos.push('FALTAM_FORMULAS: linha ' + (linhaParaEscrever + rowIdx) + ' sem fórmula pré-formatada na coluna \'' + nomeF + '\'.');
        }
     }
  }

  const colOrdIdx = SyntheonCabecalhosObj.encontrar(headersIndex, "ORD");

  for (let rowIdx = 0; rowIdx < quantidade; rowIdx++) {
     for (let colIdx = 0; colIdx < numColunas; colIdx++) {
         if (colIdx === colOrdIdx) continue;
         const valStr = String(targetValues[rowIdx][colIdx]).trim();
         const isFormula = targetFormulas[rowIdx][colIdx] && targetFormulas[rowIdx][colIdx].toString().startsWith('=');
         if (!isFormula && valStr !== "") {
             avisos.push('CELULA_NAO_VAZIA: linha ' + (linhaParaEscrever + rowIdx) + ' coluna ' + (colIdx + 1) + ' já contém \'' + valStr.substring(0, 30) + '\'.');
         }
     }
  }

  return {
      range: targetRange,
      startRow: linhaParaEscrever,
      formulas: targetFormulas,
      headersIndex: headersIndex
  };
}

/**
 * Escreve as linhas formatadas apenas em colunas permitidas, baseando-se nos nomes dos cabeçalhos.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} aba 
 * @param {Array<Array>} linhasParaInserir 
 * @param {Object=} opcoes {simular:true} executa TODA a validação e NAO grava (dry-run).
 */
function gravarLinhasEntradaManual(aba, linhasParaInserir, opcoes) {
  const avisos = (opcoes && opcoes.avisos) || [];
  const totalLinhas = linhasParaInserir.length;
  const bloco = localizarBlocoModeloDisponivel_(aba, totalLinhas, avisos);
  
  const linhaParaEscrever = bloco.startRow;
  const targetRange = bloco.range;
  const targetFormulas = bloco.formulas;
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
  
  const SyntheonCabecalhosObj = typeof SyntheonCabecalhos !== 'undefined' ? SyntheonCabecalhos : (typeof require !== 'undefined' ? require('../Core/Cabecalhos').SyntheonCabecalhos || require('../Core/Cabecalhos') : null);
  if (!SyntheonCabecalhosObj) throw new Error("Dependência SyntheonCabecalhos não encontrada.");
  const headersIndex = bloco.headersIndex;

  // Fase 1: Validação Total de Integridade
  for (let rowIdx = 0; rowIdx < totalLinhas; rowIdx++) {
     const rowFormulas = targetFormulas[rowIdx];
     const rowValidations = targetValidations[rowIdx];
     
     for (let origIdx = 0; origIdx < CABECALHOS_ORIGINAIS.length; origIdx++) {
         const headerOrig = CABECALHOS_ORIGINAIS[origIdx];
         const colIdx = SyntheonCabecalhosObj.encontrar(headersIndex, headerOrig);
         if (colIdx === -1) continue;
         
         const valorPretendido = linhasParaInserir[rowIdx][origIdx];
         
         if (rowFormulas[colIdx] && rowFormulas[colIdx].toString().startsWith('=')) {
             if (valorPretendido) {
                 avisos.push('SOBRESCRITA_FORMULA: valor \'' + valorPretendido + '\' ignorado na coluna ' + headerOrig + ' (linha ' + (linhaParaEscrever + rowIdx) + ') que é fórmula.');
             }
         }

          let dv = rowValidations[colIdx];
          if (!dv) {
             try {
               const dvRef = aba.getRange(2, colIdx + 1).getDataValidation();
               if (dvRef) dv = dvRef;
             } catch (e) {}
          }

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
              }

              if (!valid) {
                 avisos.push('VALOR_FORA_LISTA: \'' + valorPretendido + '\' na coluna ' + headerOrig + ' (gravado assim mesmo; conferir no Guardião).');
              }
          }
     }
  }

  // Dry-run (pedido do proprietario, 12/09/2026): validação concluída SEM tocar na planilha.
  if (opcoes && opcoes.simular) {
    return {
      simulado: true,
      aba: aba.getName(),
      linhas: totalLinhas,
      linhaInicial: linhaParaEscrever,
      colunasPermitidas: null
    };
  }

  // Fase 2: Gravação Física (Colunas AB, AC e AD são preenchidas pelas fórmulas PROCV da planilha)
  const colsPermitidasNomes = [
    "DATA", "HORA", "QTD O", "MIKE", "NATUREZA", "BOE", "AIS", "CIDADE", "BAIRRO", "DETIDOS",
    "ARMA", "TIPO", "CALIBRE", "MODELO", "MUNIÇÃO", 
    "MACONHA DOLAR", "MACONHA GRAMA", "CRACK PEDRA", "CRACK GRAMA", "COCAINA PINO", "COCAINA GRAMA", 
    "POLICIAL", "QDT ARMAS", "OCORRÊNCIA PIP", "IMPUTADO?"
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

  // Fase 3: Clonar fórmulas PROCV da linha 2 para as colunas PELOTÃO, GRAD e MATRÍCULA.
  // Usa copyTo da célula modelo, garantindo que a fórmula nativa da planilha
  // (em qualquer idioma) seja replicada com ajuste automático de referências.
  var colsFormula = [
    SyntheonCabecalhosObj.encontrar(headersIndex, "PELOTÃO"),
    SyntheonCabecalhosObj.encontrar(headersIndex, "GRAD"),
    SyntheonCabecalhosObj.encontrar(headersIndex, "MATRICULA")
  ];
  for (var f = 0; f < colsFormula.length; f++) {
    var cIdx = colsFormula[f];
    if (cIdx === -1) continue;
    try {
      var modeloCell = aba.getRange(2, cIdx + 1);
      var modeloFormula = modeloCell.getFormula();
      if (modeloFormula && modeloFormula.toString().startsWith('=')) {
        var destino = aba.getRange(linhaParaEscrever, cIdx + 1, totalLinhas, 1);
        modeloCell.copyTo(destino);
      }
    } catch (e) {
      // Se copyTo falhar, as colunas ficam vazias (sem risco de #NAME?)
      console.log('Fase 3: copyTo falhou para coluna ' + cIdx + ': ' + e.message);
    }
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
    const ss = obterSpreadsheetOcorrencias_();
    const aba = localizarAbaMensalTratada(ss, dataStr);
    const nomeAba = aba.getName();

    const SyntheonCabecalhosObj = typeof SyntheonCabecalhos !== 'undefined' ? SyntheonCabecalhos : (typeof require !== 'undefined' ? require('../Core/Cabecalhos').SyntheonCabecalhos || require('../Core/Cabecalhos') : null);

    const numColunas = aba.getLastColumn() || 39;
    const headers = aba.getRange(1, 1, 1, numColunas).getValues()[0];
    const headersIndex = SyntheonCabecalhosObj ? SyntheonCabecalhosObj.criarIndice(headers) : {};

    const maxRows = Math.min(30, aba.getMaxRows());

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
      
      for (let r = 0; r < validationsCol.length; r++) {
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
    const ss = obterSpreadsheetOcorrencias_();

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

/**
 * PORTA: M01 -> Dominio Territorial AIS
 * Retorna a tabela canônica territorial de AIS para o cliente Formulario.html
 * @returns {Object}
 */
function obterTabelaTerritorialAIS() {
  try {
    if (typeof TABELA_TERRITORIAL_AIS !== 'undefined') {
      return TABELA_TERRITORIAL_AIS;
    }
    if (typeof require !== 'undefined') {
      const { TABELA_TERRITORIAL_AIS: tab } = require('../Dominio/TabelaTerritorialAIS');
      return tab;
    }
  } catch (e) {
    console.error('obterTabelaTerritorialAIS falhou: ' + e.message);
  }
  return null;
}

/**
 * PORTA: M01 -> Dominio Territorial AIS
 * Resolve a AIS no backend caso o cliente prefira delegar
 * @param {string} cidade
 * @param {string} bairro
 * @returns {Object}
 */
function resolverAISTerritorial(cidade, bairro) {
  try {
    if (typeof resolverAIS === 'function') {
      return resolverAIS(cidade, bairro);
    }
    if (typeof require !== 'undefined') {
      const { resolverAIS: resFn } = require('../Dominio/ResolverAIS');
      const { TABELA_TERRITORIAL_AIS: tab } = require('../Dominio/TabelaTerritorialAIS');
      return resFn(cidade, bairro, tab);
    }
  } catch (e) {
    console.error('resolverAISTerritorial falhou: ' + e.message);
  }
  return {
    ais: null,
    sucesso: false,
    criterio: 'ERRO_BACKEND',
    status: 'PENDENTE_CONFERENCIA',
    observacao: 'Falha ao processar resolução de AIS.'
  };
}

/**
 * Corrige a DATA (coluna B) de um bloco de ocorrência já gravado, localizando pelo MIKE.
 * Uso pontual de calibragem (regra do proprietário: madrugada conta no serviço do dia anterior).
 */
function corrigirDataBloco(mike, novaData) {
  const ss = obterSpreadsheetOcorrencias_();
  const abas = ss.getSheets();
  for (const aba of abas) {
    const maxRows = aba.getMaxRows();
    if (maxRows < 2) continue;
    const colMike = aba.getRange('E2:E' + maxRows).getValues();
    const rangeData = aba.getRange('B2:B' + maxRows);
    const dados = rangeData.getValues();
    let mudou = false;
    for (let i = 0; i < colMike.length; i++) {
      if (String(colMike[i][0]).trim() === String(mike).trim()) {
        dados[i][0] = novaData;
        mudou = true;
      }
    }
    if (mudou) {
      rangeData.setValues(dados);
      return 'OK: ' + mike + ' -> ' + novaData + ' em ' + aba.getName();
    }
  }
  return 'MIKE nao encontrado: ' + mike;
}

/**
 * Corrige as colunas de fato/arma de um bloco já gravado (calibragem): primeira linha recebe
 * CIDADE/BAIRRO/DETIDOS/ARMA/TIPO/CALIBRE/MODELO/MUNIÇÃO; todas as linhas recebem QDT ARMAS.
 */
function corrigirBlocoOcorrencia(mike, cidade, bairro, detidos, arma, tipo, calibre, modelo, municao, qtdArmas) {
  const ss = obterSpreadsheetOcorrencias_();
  for (const aba of ss.getSheets()) {
    const maxRows = aba.getMaxRows();
    if (maxRows < 2) continue;
    const colMike = aba.getRange('E2:E' + maxRows).getValues();
    const linhas = [];
    for (let i = 0; i < colMike.length; i++) {
      if (String(colMike[i][0]).trim() === String(mike).trim()) linhas.push(i + 2);
    }
    if (linhas.length === 0) continue;
    // I=9 CIDADE, J=10 BAIRRO, K=11 DETIDOS, L=12 ARMA, M=13 TIPO, N=14 CALIBRE, O=15 MODELO, P=16 MUNIÇÃO
    aba.getRange(linhas[0], 9, 1, 8).setValues([[cidade, bairro, detidos, arma, tipo, calibre, modelo, municao]]);
    linhas.forEach(function (ln) { aba.getRange(ln, 32).setValue(qtdArmas); });
    return 'OK: ' + linhas.length + ' linhas corrigidas em ' + aba.getName();
  }
  return 'MIKE nao encontrado: ' + mike;
}

/**
 * Corrige DETIDOS (coluna K) do bloco, na primeira linha (fato). Uso: operador deixou o padrão TCO.
 */
function corrigirDetidos(mike, detidos) {
  const ss = obterSpreadsheetOcorrencias_();
  for (const aba of ss.getSheets()) {
    const maxRows = aba.getMaxRows();
    if (maxRows < 2) continue;
    const colMike = aba.getRange('E2:E' + maxRows).getValues();
    for (let i = 0; i < colMike.length; i++) {
      if (String(colMike[i][0]).trim() === String(mike).trim()) {
        aba.getRange(i + 2, 11).setValue(detidos); // K=11 DETIDOS
        return 'OK: DETIDOS de ' + mike + ' -> ' + detidos + ' em ' + aba.getName();
      }
    }
  }
  return 'MIKE nao encontrado: ' + mike;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    processarEntradaManual: processarEntradaManual,
    resolverNomeAbaMensal: resolverNomeAbaMensal,
    localizarAbaMensalTratada: localizarAbaMensalTratada,
    verificarDuplicidadeOcorrencia: verificarDuplicidadeOcorrencia,
    montarLinhasEntradaManual: montarLinhasEntradaManual,
    obterOpcoesValidacao: obterOpcoesValidacao,
    getEfetivo: getEfetivo,
    obterTabelaTerritorialAIS: obterTabelaTerritorialAIS,
    resolverAISTerritorial: resolverAISTerritorial
  };
}


/**
 * Porta canonica ARCA para o circuito do Formulario/OCR (card #138 OCR-ARCA-004).
 *
 * Entrega APENAS os metadados da regra canonica (rule_id, rotulo oficial e fronteira declarada).
 * A ARCA NAO le o BO e NAO decide por regex: a leitura do documento e a casagem lexical continuam no parser
 * do formulario (heuristica OCR). Fail-soft: qualquer indisponibilidade devolve `{ ok:false, motivo }` e o
 * cliente segue com o rotulo local.
 *
 * @returns {{ok: boolean, rule_id: string, titulo_pip: (string|null), motivo?: string}}
 */
function obterMetadadosArcaVeiculo() {
  const RULE_ID = 'ARCA-VEICULO-001';
  try {
    if (typeof AdaptadorConsultaArca === 'undefined' || !AdaptadorConsultaArca
        || typeof AdaptadorConsultaArca.consultarPorRuleId !== 'function') {
      return { ok: false, motivo: 'ARCA_METADATA_UNAVAILABLE', rule_id: RULE_ID, titulo_pip: null };
    }
    const regra = AdaptadorConsultaArca.consultarPorRuleId(RULE_ID);
    if (!regra) return { ok: false, motivo: 'ARCA_RULE_NOT_FOUND', rule_id: RULE_ID, titulo_pip: null };
    const parametros = regra.parametros || {};
    return {
      ok: true,
      rule_id: regra.rule_id,
      titulo_pip: parametros.titulo_pip || null,
      campo_avaliado: parametros.campo_avaliado || null,
      campo_proibido_para_inferencia: parametros.campo_proibido_para_inferencia || null,
      fronteira: parametros.fronteira || null,
      origem: 'AdaptadorConsultaArca.consultarPorRuleId'
    };
  } catch (e) {
    return { ok: false, motivo: 'ARCA_METADATA_ERROR: ' + (e && e.message ? e.message : e), rule_id: RULE_ID, titulo_pip: null };
  }
}
