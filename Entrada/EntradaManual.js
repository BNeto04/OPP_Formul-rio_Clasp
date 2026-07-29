/**
 * ARQUIVO: Entrada/EntradaManual.js
 * DESCRIÇÃO: Controlador que recebe o JSON do HTML e orquestra o pipeline de entrada manual.
 */

function processarEntradaManual(payload) {
  try {
    const nomeAba = resolverNomeAbaMensal(payload.data);

    const SS_ID = '1S05sTbd3otgjGjrC-YrzHk7dXp7mzzaw_J2lyQ86hOY';
    const ss = SpreadsheetApp.openById(SS_ID);
    let aba = ss.getSheetByName(nomeAba);
    if (!aba) throw new Error("Aba mensal " + nomeAba + " não encontrada!");

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
 * Escreve as linhas formatadas em chunks na aba alvo para não sobrescrever fórmulas calculadas.
 * Porta de gravação: M01 → M02/M06.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} aba 
 * @param {Array<Array>} linhasParaInserir 
 */
function gravarLinhasEntradaManual(aba, linhasParaInserir) {
  if (!linhasParaInserir || linhasParaInserir.length === 0) return;

  const colB = aba.getRange("B1:B" + aba.getMaxRows()).getValues();
  let ultimaLinha = 0;
  for (let i = colB.length - 1; i >= 0; i--) {
      if (String(colB[i][0]).trim() !== "") {
          ultimaLinha = i + 1;
          break;
      }
  }
  
  const linhaParaEscrever = ultimaLinha > 0 ? ultimaLinha + 2 : 2; 

  const chunks = [
      { start: 2, end: 18 },  // B até R
      { start: 21, end: 22 }, // U até V
      { start: 24, end: 25 }, // X até Y
      { start: 28, end: 34 }  // AB até AH
  ];

  chunks.forEach(chunk => {
      const numCols = chunk.end - chunk.start + 1;
      const chunkData = linhasParaInserir.map(row => row.slice(chunk.start - 1, chunk.end));
      const targetRange = aba.getRange(linhaParaEscrever, chunk.start, linhasParaInserir.length, numCols);
      
      targetRange.clearDataValidations();
      targetRange.setValues(chunkData);
  });
}

/**
 * PORTA: M01 → M07 Efetivo
 * Lê a aba de efetivo e retorna array de policiais para alimentar a interface Formulario.html.
 * Chamado via google.script.run.getEfetivo() pelo Formulario.html.
 * @returns {Array<{pelotao:string, posto:string, matricula:string, nome:string}>}
 */
function getEfetivo() {
  try {
    const SS_ID  = '1S05sTbd3otgjGjrC-YrzHk7dXp7mzzaw_J2lyQ86hOY';
    const ss     = SpreadsheetApp.openById(SS_ID);

    const sheet = ss.getSheetByName('EFETIVO')
               || ss.getSheetByName('Efetivo')
               || ss.getSheetByName('efetivo')
               || ss.getSheets()[0];

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
