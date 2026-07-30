/**
 * ARQUIVO: Features/CompiladorGxt.js
 * DESCRIÇÃO: Compilador do Relatório Trimestral de Mérito por Armas (GTAR X TROPA ARMAS) (TASK-M06.3-04B).
 * REGRA DE OURO: Traduz os Registros Canônicos do Adaptador2026 para o DTO plano esperado pela política,
 * preservando a integridade dos túneis e dos policiais.
 * Envia EXCLUSIVAMENTE os registros com status 'PROCESSADO' para o renderizador.
 */

class CompiladorGxt {
  /**
   * Executa a compilação do relatório Gxt para uma lista de nomes de abas mensais.
   * @param {SpreadsheetApp.Spreadsheet|Array<Object>} fonte - Planilha ativa ou matriz/mock de dados.
   * @param {Array<string>} listaMeses - Nomes das abas mensais (ex: ['JAN2026', 'FEV2026', 'MAR2026']).
   * @param {Object} [fontePeculio=null] - Fonte externa opcional do Pecúlio.
   * @returns {Object} Dados compilados por mês e resumos.
   */
  static compilar(fonte, listaMeses = [], fontePeculio = null) {
    let LeitorPeculioMod = typeof LeitorAntiguidadePeculio !== 'undefined' ? LeitorAntiguidadePeculio : null;
    if (!LeitorPeculioMod && typeof require !== 'undefined') {
      try { LeitorPeculioMod = require('../Leitura/LeitorAntiguidadePeculio'); } catch (e) {}
    }

    let PoliticaMeritoMod = typeof PoliticaMeritoArmas !== 'undefined' ? PoliticaMeritoArmas : null;
    if (!PoliticaMeritoMod && typeof require !== 'undefined') {
      try { PoliticaMeritoMod = require('../Motor/PoliticaMeritoArmas'); } catch (e) {}
    }

    let AdaptadorMod = typeof Adaptador2026 !== 'undefined' ? Adaptador2026 : null;
    if (!AdaptadorMod && typeof require !== 'undefined') {
      try { AdaptadorMod = require('../Leitura/Adaptador2026'); } catch (e) {}
    }

    // 1. Carrega o mapa de antiguidade N oficial do Pecúlio
    let resPeculio = { mapa: {}, mapaCompleto: {} };
    if (LeitorPeculioMod) {
      let fPeculio = fontePeculio;
      if (!fPeculio && typeof CONFIG_SYNTHEON !== 'undefined' && typeof CONFIG_SYNTHEON.obterIdPeculio === 'function') {
        const idPeculio = CONFIG_SYNTHEON.obterIdPeculio();
        if (idPeculio && typeof SpreadsheetApp !== 'undefined' && typeof SpreadsheetApp.openById === 'function') {
          try { fPeculio = SpreadsheetApp.openById(idPeculio); } catch (e) {}
        }
      }
      if (fPeculio) {
        resPeculio = LeitorPeculioMod.lerMapaAntiguidade(fPeculio);
      }
    }

    const mapaAntiguidade = resPeculio.mapa || {};
    const mapaCompleto = resPeculio.mapaCompleto || {};

    const resultadoPorMes = {};

    // 2. Processa cada mês selecionado
    listaMeses.forEach(nomeAba => {
      let sheetData = null;
      if (fonte && typeof fonte.getSheetByName === 'function') {
        sheetData = fonte.getSheetByName(nomeAba);
      } else if (Array.isArray(fonte)) {
        sheetData = fonte;
      } else if (fonte && fonte[nomeAba]) {
        sheetData = fonte[nomeAba];
      }

      if (!sheetData) {
        resultadoPorMes[nomeAba] = { registros: [], resumo: {} };
        return;
      }

      // Extrai fatos/ocorrências do mês
      let ocorrenciasBrutas = [];
      if (Array.isArray(sheetData)) {
        ocorrenciasBrutas = sheetData;
      } else if (AdaptadorMod && typeof AdaptadorMod.extrairFatos === 'function') {
        ocorrenciasBrutas = AdaptadorMod.extrairFatos(sheetData, { aba: nomeAba, versao: '2026' }, {});
      } else if (sheetData && typeof sheetData.getRange === 'function') {
        const lr = sheetData.getLastRow();
        const lc = sheetData.getLastColumn();
        if (lr >= 2 && lc >= 1) {
          const raw = sheetData.getRange(1, 1, lr, lc).getValues();
          if (raw.length >= 2) {
            const h = raw[0].map(c => String(c || '').toUpperCase().trim());
            const idxData = h.findIndex(c => c.includes('DATA'));
            const idxMike = h.findIndex(c => c.includes('MIKE'));
            const idxBoe = h.findIndex(c => c.includes('BOE'));
            const idxMat = h.findIndex(c => c.includes('MATRÍCULA') || c.includes('MATRICULA'));
            const idxPol = h.findIndex(c => c.includes('POLICIAL') || c.includes('NOME'));
            const idxGrad = h.findIndex(c => c.includes('GRAD'));
            const idxPel = h.findIndex(c => c.includes('PELOTÃO') || c.includes('DESIGNAÇÃO'));
            const idxArmas = h.findIndex(c => c === 'QTD ARMAS' || c === 'ARMAS' || c === 'QDT ARMAS');
            const idxArmaLinha = h.findIndex(c => c === 'ARMA');

            for (let r = 1; r < raw.length; r++) {
              const row = raw[r];
              const armasFogo = Number(idxArmas !== -1 ? row[idxArmas] : 0) + Number(idxArmaLinha !== -1 ? row[idxArmaLinha] : 0);
              const mat = idxMat !== -1 ? String(row[idxMat] || '').trim() : '';
              if (!mat) continue;

              ocorrenciasBrutas.push({
                data: idxData !== -1 ? row[idxData] : '',
                mike: idxMike !== -1 ? row[idxMike] : '',
                boe: idxBoe !== -1 ? row[idxBoe] : '',
                armas: armasFogo,
                policiais: [{
                  matricula: mat,
                  nome: idxPol !== -1 ? row[idxPol] : '',
                  grad: idxGrad !== -1 ? row[idxGrad] : '',
                  pelotao: idxPel !== -1 ? row[idxPel] : ''
                }]
              });
            }
          }
        }
      }

      // Converte explicitamente os Registros Canônicos / DTOs brutos no objeto plano esperado pela Política de Armas
      const ocorrenciasNormalizadas = ocorrenciasBrutas.map(reg => {
        // Se já for um objeto totalmente plano com data, mike, boe e policiais
        if (reg.data !== undefined && reg.mike !== undefined && Array.isArray(reg.policiais) && typeof reg.armas === 'number' && reg.ocorrencia === undefined) {
          return reg;
        }

        // Se for um RegistroCanonico (gerado por Adaptador2026)
        const ocInfo = reg.ocorrencia || {};
        const pmsRaw = Array.isArray(reg.policiais) ? reg.policiais : [];

        let totalArmasFogo = 0;
        let totalArmasArtesanais = 0;
        let tipoArmaDetectado = reg.tipoArma || '';

        const pmsFormatados = pmsRaw.map(p => {
          const armasP = Number(p.armas || p.qtdArmas || 0);
          const armasArtP = Number(p.armasArtesanais || p.qtdArtesanal || 0);

          if (p.isArtesanal || String(p.tipoArma || '').toUpperCase() === 'ARTESANAL') {
            totalArmasArtesanais += (armasArtP || armasP || 1);
            tipoArmaDetectado = 'ARTESANAL';
          } else {
            totalArmasFogo += armasP;
            totalArmasArtesanais += armasArtP;
          }

          return {
            matricula: p.matricula || '',
            nome: p.nome || p.militar || p.policial || '',
            grad: p.graduacao || p.grad || '',
            pelotao: p.pelotao || p.designacao || ''
          };
        });

        const indStr = String(reg.eventoPontuavel?.indicador || reg.indicadorPip || '').toUpperCase();
        if (indStr.includes('ARTESANAL')) {
          tipoArmaDetectado = 'ARTESANAL';
        }

        return {
          data: ocInfo.data || reg.data || '',
          mike: ocInfo.mike || ocInfo.chaveOcorrencia || reg.mike || '',
          boe: ocInfo.boe || ocInfo.numeroBOE || reg.boe || '',
          armas: totalArmasFogo,
          armasArtesanais: totalArmasArtesanais,
          tipoArma: tipoArmaDetectado,
          policiais: pmsFormatados
        };
      });

      if (PoliticaMeritoMod) {
        const resultadosTuneis = PoliticaMeritoMod.processarMeritoArmas(ocorrenciasNormalizadas, mapaAntiguidade);
        
        // FILTRO ESTRITO: Envia APENAS itens com status 'PROCESSADO' ao renderizador
        const processados = resultadosTuneis.filter(item => item.status === 'PROCESSADO');

        // Enriquece cada registro processado com os metadados oficiais do Pecúlio/Efetivo se disponíveis
        const registrosFormatados = processados.map((item, idxSeq) => {
          const matNorm = String(item.matricula || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().trim();
          const metaPeculio = mapaCompleto[matNorm] || {};

          const gradFinal = item.lider?.grad || metaPeculio.grad || item.lider?.graduacao || '';
          const nomeFinal = item.lider?.nome || metaPeculio.nome || item.lider?.policial || item.matricula;
          const designacaoFinal = item.lider?.pelotao || metaPeculio.designacao || item.lider?.designacao || '';

          return {
            numSeq: idxSeq + 1, // Nº sequencial numérico por mês (1, 2, 3...)
            data: item.data,
            mike: item.mike,
            boe: item.boe,
            matricula: item.matricula,
            grad: gradFinal,
            nome: nomeFinal,
            qtdArmas: item.qtdArmas,
            armasFogo: item.armasFogo,
            armasArtesanais: item.armasArtesanais,
            designacao: designacaoFinal,
            chaveTunel: item.chaveTunel
          };
        });

        // Calcula o resumo por pelotão/GTAR para o mês
        const resumoMes = {
          '1º PEL GTAR': 0,
          '2º PEL GTAR': 0,
          '1º PEL': 0,
          '2º PEL': 0,
          '3º PEL': 0,
          'TOTAL': 0
        };

        registrosFormatados.forEach(reg => {
          const desNorm = String(reg.designacao || '').toUpperCase().trim();
          let chaveGrupo = '3º PEL'; // Fallback padronizado

          if (desNorm.includes('1º PEL GTAR') || desNorm.includes('1 PEL GTAR') || desNorm.includes('1º PEL/GTAR')) {
            chaveGrupo = '1º PEL GTAR';
          } else if (desNorm.includes('2º PEL GTAR') || desNorm.includes('2 PEL GTAR') || desNorm.includes('2º PEL/GTAR')) {
            chaveGrupo = '2º PEL GTAR';
          } else if (desNorm.includes('1º PEL') || desNorm.includes('1 PEL')) {
            chaveGrupo = '1º PEL';
          } else if (desNorm.includes('2º PEL') || desNorm.includes('2 PEL')) {
            chaveGrupo = '2º PEL';
          } else if (desNorm.includes('3º PEL') || desNorm.includes('3 PEL')) {
            chaveGrupo = '3º PEL';
          }

          resumoMes[chaveGrupo] = (resumoMes[chaveGrupo] || 0) + reg.qtdArmas;
          resumoMes['TOTAL'] += reg.qtdArmas;
        });

        resultadoPorMes[nomeAba] = {
          registros: registrosFormatados,
          resumo: resumoMes
        };
      } else {
        resultadoPorMes[nomeAba] = { registros: [], resumo: {} };
      }
    });

    return resultadoPorMes;
  }
}

/**
 * Entry point para o modal de Seleção Livre do Gxt.
 */
function abrirMenuGxtSelecaoLivre() {
  if (typeof HtmlService !== 'undefined' && typeof SpreadsheetApp !== 'undefined' && SpreadsheetApp.getUi) {
    const html = HtmlService.createHtmlOutputFromFile('Entrada/DialogGxtSelecaoLivre')
      .setWidth(450)
      .setHeight(350)
      .setTitle('Gxt - Seleção Livre');
    SpreadsheetApp.getUi().showModalDialog(html, 'Gxt - Seleção Livre');
  }
}

/**
 * Orquestrador da Seleção Livre do Gxt.
 * Nome de saída: GXT_ACUMULADO_<primeiro_mes>_<ultimo_mes>
 * @param {Array<string>} meses - Lista dos meses selecionados.
 * @param {Object} [fontePeculio=null] - Fonte opcional do Pecúlio.
 */
function gerarGxtSelecaoLivre(meses = [], fontePeculio = null, fonteSS = null) {
  if (!Array.isArray(meses) || meses.length === 0) {
    if (typeof SpreadsheetApp !== 'undefined' && SpreadsheetApp.getUi) {
      SpreadsheetApp.getUi().alert('Selecione pelo menos um mês.');
    }
    return null;
  }

  const ss = fonteSS || ((typeof SpreadsheetApp !== 'undefined' && typeof SpreadsheetApp.getActiveSpreadsheet === 'function')
    ? SpreadsheetApp.getActiveSpreadsheet()
    : null);

  const ORDEM_INSTITUCIONAL_MESES = [
    'JAN2026', 'FEV2026', 'MAR2026', 'ABR2026', 'MAI2026', 'JUN2026',
    'JUL2026', 'AGO2026', 'SET2026', 'OUT2026', 'NOV2026', 'DEZ2026'
  ];

  // Ordenação cronológica institucional independente da ordem recebida do operador
  const mesesOrdenados = [...meses].sort((a, b) => {
    const idxA = ORDEM_INSTITUCIONAL_MESES.indexOf(String(a).toUpperCase().trim());
    const idxB = ORDEM_INSTITUCIONAL_MESES.indexOf(String(b).toUpperCase().trim());
    return (idxA !== -1 ? idxA : 99) - (idxB !== -1 ? idxB : 99);
  });

  const primeiroMes = mesesOrdenados[0];
  const ultimoMes = mesesOrdenados[mesesOrdenados.length - 1];
  const nomeAbaSaida = `GXT_ACUMULADO_${primeiroMes}_${ultimoMes}`;

  let RendererMod = typeof RendererGxt !== 'undefined' ? RendererGxt : null;
  if (!RendererMod && typeof require !== 'undefined') {
    try { RendererMod = require('../Render/RendererGxt'); } catch (e) {}
  }

  const dados = CompiladorGxt.compilar(ss, mesesOrdenados, fontePeculio);
  if (RendererMod && ss) {
    RendererMod.renderizar(ss, dados, nomeAbaSaida);
  }
  return dados;
}

/**
 * Orquestrador do Modo Anual do Gxt.
 * Divide os 12 meses em 4 saídas trimestrais preservando o modelo de 3 blocos mensais por aba:
 * GXT_1T_2026, GXT_2T_2026, GXT_3T_2026 e GXT_4T_2026.
 * @param {Object} [fonteSS=null] - Planilha ou fonte de dados.
 * @param {Object} [fontePeculio=null] - Fonte opcional do Pecúlio.
 */
function gerarGxtAnual(fonteSS = null, fontePeculio = null) {
  const ss = fonteSS || ((typeof SpreadsheetApp !== 'undefined' && typeof SpreadsheetApp.getActiveSpreadsheet === 'function')
    ? SpreadsheetApp.getActiveSpreadsheet()
    : null);

  let RendererMod = typeof RendererGxt !== 'undefined' ? RendererGxt : null;
  if (!RendererMod && typeof require !== 'undefined') {
    try { RendererMod = require('../Render/RendererGxt'); } catch (e) {}
  }

  const trimestres = [
    { nomeAba: 'GXT_1T_2026', meses: ['JAN2026', 'FEV2026', 'MAR2026'] },
    { nomeAba: 'GXT_2T_2026', meses: ['ABR2026', 'MAI2026', 'JUN2026'] },
    { nomeAba: 'GXT_3T_2026', meses: ['JUL2026', 'AGO2026', 'SET2026'] },
    { nomeAba: 'GXT_4T_2026', meses: ['OUT2026', 'NOV2026', 'DEZ2026'] }
  ];

  const resultadosTrimestrais = {};

  trimestres.forEach(tri => {
    const dadosTri = CompiladorGxt.compilar(ss, tri.meses, fontePeculio);
    resultadosTrimestrais[tri.nomeAba] = dadosTri;
    if (RendererMod && ss) {
      RendererMod.renderizar(ss, dadosTri, tri.nomeAba);
    }
  });

  return resultadosTrimestrais;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CompiladorGxt,
    abrirMenuGxtSelecaoLivre,
    gerarGxtSelecaoLivre,
    gerarGxtAnual
  };
}
