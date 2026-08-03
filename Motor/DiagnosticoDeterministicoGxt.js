/**
 * ARQUIVO: Motor/DiagnosticoDeterministicoGxt.js
 * DESCRIÇÃO: Motor puro de Diagnóstico Determinístico de Túneis do GXT (TASK-M06.3-05I.3B).
 * REGRA DE OURO: Reutiliza estritamente as regras de normalização, chave de túnel (DATA|MIKE|BOE),
 * e a Política de Armas (PoliticaMeritoArmas) sem criar regras paralelas ou inventar agrupamentos.
 * Reconcilia a equação de fatos físicos (armaFato > 0 ou artesanal) contra os registros computados no GXT.
 * Operação 100% somente-leitura. Produz a matriz para a aba descartável [DIAGNOSTICO] Gxt.
 */

let AdaptadorMod = typeof Adaptador2026 !== 'undefined' ? Adaptador2026 : null;
if (!AdaptadorMod && typeof require !== 'undefined') {
  try { AdaptadorMod = require('../Leitura/Adaptador2026'); } catch (e) {}
}

let LeitorPeculioMod = typeof LeitorAntiguidadePeculio !== 'undefined' ? LeitorAntiguidadePeculio : null;
if (!LeitorPeculioMod && typeof require !== 'undefined') {
  try { LeitorPeculioMod = require('../Leitura/LeitorAntiguidadePeculio'); } catch (e) {}
}

let PoliticaMeritoMod = typeof PoliticaMeritoArmas !== 'undefined' ? PoliticaMeritoArmas : null;
if (!PoliticaMeritoMod && typeof require !== 'undefined') {
  try { PoliticaMeritoMod = require('./PoliticaMeritoArmas'); } catch (e) {}
}

class DiagnosticoDeterministicoGxt {
  /**
   * Converte uma data em string ISOYYYY-MM-DD padronizada ou vazia.
   */
  static formatarDataIso(dt) {
    if (!dt) return '';
    if (dt instanceof Date) {
      if (isNaN(dt.getTime())) return '';
      return dt.toISOString().split('T')[0];
    }
    const str = String(dt).trim();
    if (str.includes('T')) return str.split('T')[0];
    return str;
  }

  /**
   * Executa o diagnóstico determinístico para um mês específico.
   * @param {Object|Array} sheetData - Matriz 2D da aba mensal ou objeto de mock.
   * @param {Object} [mapaAntiguidade={}] - Mapa { matricula: numeroN } do Pecúlio.
   * @param {string} [nomeMes='ABR2026'] - Nome do mês analisado.
   * @returns {Object} Resultado do diagnóstico com linhas auditadas, totais e reconciliação.
   */
  static diagnosticarMes(sheetData, mapaAntiguidade = {}, nomeMes = 'ABR2026') {
    if (!sheetData) {
      return {
        mes: nomeMes,
        totalArmasFisicas: 0,
        totalArmasGxt: 0,
        totalExcluidas: 0,
        fatosFisicos: [],
        resumoMotivos: {},
        reconciliacaoTexto: 'Nenhum dado fornecido para diagnóstico.'
      };
    }

    let rawRows = [];
    if (Array.isArray(sheetData)) {
      rawRows = sheetData;
    } else if (sheetData && typeof sheetData.getRange === 'function') {
      const lr = sheetData.getLastRow();
      const lc = sheetData.getLastColumn();
      if (lr >= 2 && lc >= 1) {
        rawRows = sheetData.getRange(1, 1, lr, lc).getValues();
      }
    }

    if (rawRows.length < 2) {
      return {
        mes: nomeMes,
        totalArmasFisicas: 0,
        totalArmasGxt: 0,
        totalExcluidas: 0,
        fatosFisicos: [],
        resumoMotivos: {},
        reconciliacaoTexto: 'Aba sem dados válidos para diagnóstico.'
      };
    }

    const headers = rawRows[0].map(h => String(h || '').toUpperCase().trim());

    const idxData = headers.findIndex(c => c.includes('DATA'));
    const idxMike = headers.findIndex(c => c === 'MIKE' || c.includes('MIKE'));
    const idxBoe = headers.findIndex(c => c === 'BOE' || c.includes('BOE'));
    const idxMat = headers.findIndex(c => c.includes('MATRÍCULA') || c.includes('MATRICULA'));
    const idxPol = headers.findIndex(c => c.includes('POLICIAL') || c.includes('NOME') || c === 'MILITAR');
    const idxGrad = headers.findIndex(c => c.includes('GRAD'));
    const idxPel = headers.findIndex(c => c.includes('PELOTÃO') || c.includes('DESIGNAÇÃO') || c.includes('PELOTAO'));
    const idxArmaFato = headers.findIndex(c => c === 'ARMA');
    const idxTipo = headers.findIndex(c => c === 'TIPO');
    const idxModelo = headers.findIndex(c => c === 'MODELO');

    const fatosFisicos = [];
    const ocorrenciasNormalizadas = [];

    // 1. Extração linha por linha dos fatos físicos
    for (let r = 1; r < rawRows.length; r++) {
      const row = rawRows[r];
      const linhaFisica = r + 1; // 1-indexed na planilha

      const rawData = idxData !== -1 ? row[idxData] : '';
      const dataIso = DiagnosticoDeterministicoGxt.formatarDataIso(rawData);
      const mike = idxMike !== -1 ? String(row[idxMike] || '').trim() : '';
      const boe = idxBoe !== -1 ? String(row[idxBoe] || '').trim() : '';
      const mat = idxMat !== -1 ? String(row[idxMat] || '').trim() : '';
      const pol = idxPol !== -1 ? String(row[idxPol] || '').trim() : '';
      const grad = idxGrad !== -1 ? String(row[idxGrad] || '').trim() : '';
      const pel = idxPel !== -1 ? String(row[idxPel] || '').trim() : '';

      const valArmaFato = idxArmaFato !== -1 ? row[idxArmaFato] : 0;
      const valTipo = idxTipo !== -1 ? String(row[idxTipo] || '').trim() : '';
      const valModelo = idxModelo !== -1 ? String(row[idxModelo] || '').trim() : '';

      const strCheck = `${valArmaFato} ${valTipo} ${valModelo}`.toUpperCase();
      const isArtesanal = strCheck.includes('ARTESANAL');

      let numFogo = 0;
      const numVal = Number(valArmaFato);
      if (!isNaN(numVal) && numVal > 0) {
        numFogo = numVal;
      }

      const totalArmaLinha = isArtesanal ? (numFogo > 0 ? numFogo : 1) : numFogo;
      const chaveTunel = `${dataIso}_${mike}_${boe}`.toUpperCase();

      if (totalArmaLinha > 0) {
        fatosFisicos.push({
          linhaFisica: linhaFisica,
          dataOriginal: rawData,
          dataIso: dataIso,
          mike: mike,
          boe: boe,
          matricula: mat,
          policial: pol,
          grad: grad,
          pelotao: pel,
          armaFato: numFogo,
          isArtesanal: isArtesanal,
          totalArmasFisicas: totalArmaLinha,
          chaveTunel: chaveTunel
        });
      }

      ocorrenciasNormalizadas.push({
        data: dataIso || rawData,
        mike: mike,
        boe: boe,
        armas: numFogo,
        armasFogo: numFogo,
        armasArtesanais: isArtesanal ? 1 : 0,
        tipoArma: isArtesanal ? 'ARTESANAL' : (valTipo || 'FOGO'),
        isArtesanal: isArtesanal,
        policiais: mat ? [{
          matricula: mat,
          nome: pol,
          grad: grad,
          pelotao: pel
        }] : []
      });
    }

    // 2. Processa os túneis usando exatamente PoliticaMeritoArmas
    let resultadosTuneis = [];
    if (PoliticaMeritoMod && typeof PoliticaMeritoMod.processarMeritoArmas === 'function') {
      resultadosTuneis = PoliticaMeritoMod.processarMeritoArmas(ocorrenciasNormalizadas, mapaAntiguidade);
    }

    const mapaTuneisGxt = {};
    resultadosTuneis.forEach(t => {
      mapaTuneisGxt[t.chaveTunel] = t;
    });

    let totalArmasFisicas = 0;
    let totalArmasGxt = 0;
    let totalExcluidas = 0;

    const resumoMotivos = {};

    // 3. Mapeia o resultado final de cada fato físico contra os túneis processados
    fatosFisicos.forEach(fato => {
      totalArmasFisicas += fato.totalArmasFisicas;

      const resTunel = mapaTuneisGxt[fato.chaveTunel];

      let statusFato = 'EXCLUÍDO';
      let motivoFato = '';
      let liderResolvido = '—';
      let numN = '—';
      let ordPeculio = '—';
      let contribGxt = 0;

      if (!fato.matricula && (!resTunel || !resTunel.lider)) {
        motivoFato = 'MATRICULA_AUSENTE — Militar sem matrícula cadastrada na linha armada';
      } else if (resTunel && resTunel.status === 'PROCESSADO') {
        statusFato = 'PROCESSADO';
        contribGxt = fato.isArtesanal ? 0 : fato.armaFato;
        totalArmasGxt += contribGxt;
        motivoFato = fato.boe ? 'INCLUÍDO_COM_SUCESSO — Túnel homologado e mérito atribuído' : 'INCLUÍDO_COM_BOE_VAZIO — BOE vazio agrupa por DATA|MIKE|';
        if (resTunel.lider) {
          const nomeL = typeof resTunel.lider === 'string' ? resTunel.lider : (resTunel.lider.nome || resTunel.lider.policial || resTunel.lider.matricula || '');
          const gradL = resTunel.grad || (typeof resTunel.lider === 'object' ? resTunel.lider.grad : '') || '';
          liderResolvido = `${gradL} ${nomeL}`.trim();
          numN = resTunel.numN !== undefined ? resTunel.numN : (resTunel.numeroN !== undefined ? resTunel.numeroN : '—');
          ordPeculio = resTunel.ordPeculio || '—';
        }
      } else if (resTunel) {
        statusFato = resTunel.status || 'PENDENTE_AUDITORIA';
        motivoFato = fato.boe ? `${resTunel.motivoPendente || resTunel.status} — Túnel retido por pendência de antiguidade N no Pecúlio` : 'BOE_VAZIO_E_PENDENTE — BOE vazio com pendência de antiguidade no túnel';
      } else {
        motivoFato = 'TUNEL_NAO_ARMADO — Fato não gerou túnel de mérito no motor';
      }

      if (statusFato !== 'PROCESSADO') {
        totalExcluidas += fato.totalArmasFisicas;
      }

      resumoMotivos[motivoFato] = (resumoMotivos[motivoFato] || 0) + fato.totalArmasFisicas;

      fato.statusFato = statusFato;
      fato.motivoFato = motivoFato;
      fato.liderResolvido = liderResolvido;
      fato.numN = numN;
      fato.ordPeculio = ordPeculio;
      fato.contribGxt = contribGxt;
    });

    const reconciliacaoTexto = `RECONCILIAÇÃO DETERMINÍSTICA (${nomeMes}): ${totalArmasFisicas} armas físicas = ${totalArmasGxt} incluídas no GXT + ${totalExcluidas} excluídas/perdidas.`;

    return {
      mes: nomeMes,
      totalArmasFisicas: totalArmasFisicas,
      totalArmasGxt: totalArmasGxt,
      totalExcluidas: totalExcluidas,
      fatosFisicos: fatosFisicos,
      resumoMotivos: resumoMotivos,
      reconciliacaoTexto: reconciliacaoTexto
    };
  }

  /**
   * Gera a matriz de visualização para ser gravada na aba [DIAGNOSTICO] Gxt.
   * @param {Object} diagRes - Resultado retornado por diagnosticarMes.
   * @returns {Array<Array<string|number>>} Matriz 2D para setValues.
   */
  static montarMatrizDiagnostico(diagRes) {
    const matriz = [
      ['PAINEL DE DIAGNÓSTICO DETERMINÍSTICO DE TÚNEIS — GXT', '', '', '', '', '', '', '', '', '', '', ''],
      ['Mês Analisado:', diagRes.mes || 'ABR2026', '', '', '', '', '', '', '', '', '', ''],
      ['Armas Físicas na Aba:', diagRes.totalArmasFisicas || 0, '', '', '', '', '', '', '', '', '', ''],
      ['Armas Computadas no GXT:', diagRes.totalArmasGxt || 0, '', '', '', '', '', '', '', '', '', ''],
      ['Armas Excluídas/Perdidas:', diagRes.totalExcluidas || 0, '', '', '', '', '', '', '', '', '', ''],
      ['Reconciliação:', diagRes.reconciliacaoTexto || '', '', '', '', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '', '', '', '', ''],
      ['Linha', 'Data Efetiva', 'MIKE', 'BOE', 'Matrícula', 'Policial', 'Fato Físico', 'Chave Túnel GXT', 'Líder Resolvido', 'Nº N', 'Status GXT', 'Diagnóstico & Motivo Literal']
    ];

    const fatos = Array.isArray(diagRes.fatosFisicos) ? diagRes.fatosFisicos : [];

    fatos.forEach(f => {
      const desFato = f.isArtesanal ? '1 (ARTESANAL)' : String(f.armaFato || 1);
      matriz.push([
        f.linhaFisica,
        f.dataIso || f.dataOriginal || '',
        f.mike || '—',
        f.boe || '—',
        f.matricula || 'NÃO INFORMADA',
        `${f.grad || ''} ${f.policial || ''}`.trim(),
        desFato,
        f.chaveTunel || '—',
        f.liderResolvido || '—',
        f.numN || '—',
        f.statusFato || 'EXCLUÍDO',
        f.motivoFato || '—'
      ]);
    });

    matriz.push([
      'TOTAL',
      '—',
      '—',
      '—',
      '—',
      '—',
      diagRes.totalArmasFisicas,
      '—',
      '—',
      '—',
      diagRes.totalArmasGxt,
      `Perdidas: ${diagRes.totalExcluidas}`
    ]);

    return matriz;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DiagnosticoDeterministicoGxt };
}
