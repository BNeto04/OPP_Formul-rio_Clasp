/**
 * ARQUIVO: Entrada/EntradaManual.js
 * DESCRIÇÃO: Controlador que recebe o JSON do HTML e orquestra o pipeline.
 */

function processarEntradaManual(payload) {
  try {
    const imputado = payload.detidos > 0;
    const isImputadoStr = imputado ? "COM IMPUTADO" : "SEM IMPUTADO";

    let totalPontos = 0;
    let totalArmas = 0;
    
    // Calcular Pontos das Armas
    payload.armas.forEach(arma => {
       let pts = 0;
       if (arma.tipo === 'FABRICAÇÃO CASEIRA') pts = imputado ? 8000 : 4000;
       else if (arma.modelo === 'REVÓLVER') pts = imputado ? 24000 : 12000;
       else if (arma.modelo === 'PISTOLA') pts = imputado ? 32000 : 16000;
       else if (arma.modelo === 'ESPINGARDA') pts = imputado ? 40000 : 20000;
       else if (arma.modelo === 'FUZIL') pts = imputado ? 80000 : 40000;
       else pts = imputado ? 40000 : 20000;
       
       totalPontos += pts * arma.quantidade;
       totalArmas += arma.quantidade;
    });

    // Calcular Pontos das Drogas
    let maconhaGrama = 0; let maconhaDolar = 0;
    let crackPedra = 0;   let crackGrama = 0;
    let cocainaPino = 0;  let cocainaGrama = 0;
    let totalMaconha = 0; let totalCrack = 0; let totalCocaina = 0;

    payload.drogas.forEach(droga => {
        let gramasParaPonto = 0;
        
        if (droga.tipo === 'MACONHA DOLAR') {
            maconhaDolar += droga.quantidade;
            gramasParaPonto = droga.quantidade * 3;
            totalMaconha += gramasParaPonto;
            totalPontos += gramasParaPonto * (imputado ? 2.666666667 : 1.333333333);
        } else if (droga.tipo === 'MACONHA GRAMA') {
            maconhaGrama += droga.quantidade;
            gramasParaPonto = droga.quantidade;
            totalMaconha += gramasParaPonto;
            totalPontos += gramasParaPonto * (imputado ? 2.666666667 : 1.333333333);
        } else if (droga.tipo === 'COCAINA PINO') {
            cocainaPino += droga.quantidade;
            gramasParaPonto = droga.quantidade * 1;
            totalCocaina += gramasParaPonto;
            totalPontos += gramasParaPonto * (imputado ? 10.66666667 : 5.333333333);
        } else if (droga.tipo === 'COCAINA GRAMA') {
            cocainaGrama += droga.quantidade;
            gramasParaPonto = droga.quantidade;
            totalCocaina += gramasParaPonto;
            totalPontos += gramasParaPonto * (imputado ? 10.66666667 : 5.333333333);
        } else if (droga.tipo === 'CRACK PEDRA') {
            crackPedra += droga.quantidade;
            gramasParaPonto = droga.quantidade * 0.25;
            totalCrack += gramasParaPonto;
            totalPontos += gramasParaPonto * (imputado ? 10.66666667 : 5.333333333);
        } else if (droga.tipo === 'CRACK GRAMA') {
            crackGrama += droga.quantidade;
            gramasParaPonto = droga.quantidade;
            totalCrack += gramasParaPonto;
            totalPontos += gramasParaPonto * (imputado ? 10.66666667 : 5.333333333);
        }
    });

    const numPoliciais = payload.policiais.length;
    const divididoMac = numPoliciais > 0 ? (totalMaconha / numPoliciais) : 0;
    const divididoCoc = numPoliciais > 0 ? (totalCocaina / numPoliciais) : 0;
    
    // Pontos Ficção (Sempre dividido por 4, independente do número de policiais na equipe)
    const pontosFiccao = totalPontos / 4;

    const chave = `${payload.data.replace(/-/g,'')}${payload.hora.replace(/:/g,'')}00|${payload.boe}`;
    
    // Definir aba mensal (ex: JUL2026)
    const meses = ["JAN","FEV","MAR","ABR","MAI","JUN","JUL","AGO","SET","OUT","NOV","DEZ"];
    const partesData = payload.data.split('-');
    let nomeAba = "JAN2026";
    if (partesData.length === 3) {
       nomeAba = `${meses[parseInt(partesData[1], 10) - 1]}${partesData[0]}`;
    }

    const SS_ID = '1S05sTbd3otgjGjrC-YrzHk7dXp7mzzaw_J2lyQ86hOY';
    const ss = SpreadsheetApp.openById(SS_ID);
    let aba = ss.getSheetByName(nomeAba);
    if (!aba) throw new Error("Aba mensal " + nomeAba + " não encontrada!");

    const linhasParaInserir = [];
    const numLinhas = Math.max(payload.policiais.length, payload.armas.length);
    
    for (let idx = 0; idx < numLinhas; idx++) {
        const isFirst = (idx === 0);
        const policial = payload.policiais[idx] || { pelotao: "", posto: "", matricula: "", nome: "" };
        const arma = payload.armas[idx] || null;
        
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
            payload.qtd_o || "1.0", // QTD O (D)
            payload.mike, // MIKE (E)
            payload.natureza, // NATUREZA (F)
            payload.boe, // BOE (G)
            payload.ais, // AIS (H)
            payload.cidade, // CIDADE (I)
            payload.bairro, // BAIRRO (J)
            payload.detidos, // DETIDOS (K)
            armaQtd, // ARMA (L)
            armaTipo, // TIPO (M)
            armaCalibre, // CALIBRE (N)
            armaModelo, // MODELO (O)
            armaMunicao || "", // MUNIÇÃO (P)
            isFirst ? (maconhaDolar || "") : "", // MACONHA DOLAR (Q)
            isFirst ? (maconhaGrama || "") : "", // MACONHA GRAMA (R)
            isFirst ? (totalMaconha || "") : "", // TOTAL DE MACONHA (S)
            divididoMac || "", // Dividido mac (T)
            isFirst ? (crackPedra || "") : "", // CRACK PEDRA (U)
            isFirst ? (crackGrama || "") : "", // CRACK GRAMA (V)
            isFirst ? (totalCrack || "") : "", // Total CRACK (gr) (W)
            isFirst ? (cocainaPino || "") : "", // COCAINA PINO (X)
            isFirst ? (cocainaGrama || "") : "", // COCAINA GRAMA (Y)
            isFirst ? (totalCocaina || "") : "", // TOTAL DE COCAINA (Z)
            divididoCoc || "", // Dividido coc (AA)
            policial.pelotao, // PELOTÃO (AB)
            policial.posto, // GRAD (AC)
            policial.matricula, // MATRICULA (AD)
            policial.nome, // POLICIAL (AE)
            policial.nome ? (totalArmas || "") : "", // QDT ARMAS (AF)
              (payload.ocorrenciaPip || "OCORRÊNCIA LANÇADA VIA SISTEMA"), // OCORRÊNCIA PIP (AG)
            isImputadoStr, // IMPUTADO? (AH)
              isFirst ? (payload.pontosTotais || totalPontos) : "", // PONTOS TOTAIS (AI)
              policial.matricula ? (payload.pontosFiccao || pontosFiccao) : "", // PONTOS FICÇÃO (1/4) (AJ)
              (payload.chaveOcorrencia || chave) // Chave Ocorrência (AK)
        ];
        linhasParaInserir.push(linha);
    }

    if (linhasParaInserir.length > 0) {
        // Encontrar a última linha com dados na coluna B (Data)
        const colB = aba.getRange("B1:B" + aba.getMaxRows()).getValues();
        let ultimaLinha = 0;
        for (let i = colB.length - 1; i >= 0; i--) {
            if (colB[i][0] !== "") {
                ultimaLinha = i + 1; // i é zero-based, linha é 1-based
                break;
            }
        }
        
        // Se a aba estiver vazia, escreve na linha 2. Se já tiver dados, pula 1 linha.
        const linhaParaEscrever = ultimaLinha > 0 ? ultimaLinha + 2 : 2; 

        aba.getRange(linhaParaEscrever, 1, linhasParaInserir.length, linhasParaInserir[0].length).setValues(linhasParaInserir);
    }
    return `Ocorrência ${chave} salva com sucesso (${linhasParaInserir.length} registros computados)!`;
  } catch (erro) {
    console.error(`Falha: ${erro.message}`);
    throw new Error(erro.message);
  }
}

/**
 * Lê a aba de efetivo (GID 112168711) e retorna array de policiais.
 * Chamado via google.script.run.getEfetivo() pelo Formulario.html.
 * @returns {Array<{pelotao:string, posto:string, matricula:string, nome:string}>}
 */
function getEfetivo() {
  try {
    const SS_ID  = '1S05sTbd3otgjGjrC-YrzHk7dXp7mzzaw_J2lyQ86hOY';
    const ss     = SpreadsheetApp.openById(SS_ID);

    // Localiza a aba pelo NOME primeiro (mais seguro que GID caso a aba seja recriada)
    const sheet = ss.getSheetByName('EFETIVO')
               || ss.getSheetByName('Efetivo')
               || ss.getSheetByName('efetivo')
               || ss.getSheets()[0];

    const dados = sheet.getDataRange().getValues();

    // Como a aba não possui linha de cabeçalho, usamos mapeamento fixo absoluto
    // e começamos a ler a partir da linha 0.
    const cNome  = 0; // Coluna A: Nome de guerra
    const cPosto = 3; // Coluna D: Posto/Graduação
    const cMat   = 4; // Coluna E: Matrícula
    const cPel   = 5; // Coluna F: Pelotão

    const resultado = [];
    for (let i = 0; i < dados.length; i++) {
      const row       = dados[i];
      const matricula = String(row[cMat]  || '').replace(/\D/g, '').trim();
      const nome      = String(row[cNome] || '').trim();
      
      // Só ignora se realmente não tiver matrícula ou nome preenchido
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
