/**
 * ARQUIVO: Features/CompiladorGxt.js
 * DESCRIÇÃO: Compilador do Relatório Trimestral de Mérito por Armas (GTAR X TROPA ARMAS) (TASK-M06.3-05I.2).
 * REGRA DE OURO: Traduz os Registros Canônicos para o DTO esperado pela Política de Armas.
 * ARMA (coluna 11) é a fonte de arma de fogo física (numérica). QDT ARMAS (coluna 31) não entra na soma.
 * Indicadores textuais ("ARTESANAL") definem armas artesanais.
 * Pecúlio externo fornece apenas ORD; nome, graduação e pelotão do líder vêm da ocorrência mensal.
 * Resumos e cards somam apenas armas de fogo numéricas: Abril 40, Maio 27, Junho 21, Total 88.
 */

class CompiladorGxt {
  /**
   * Normaliza o nome de uma aba removendo acentos, pontuações, espaços e caracteres especiais.
   */
  static normalizarNomeAba(nome) {
    return String(nome || '')
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Z0-9]/g, '')
      .trim();
  }

  /**
   * Localiza a aba do mês na planilha por nome exato ou por aproximação normalizada.
   */
  static localizarAbaMes(fonte, nomeSolicitado) {
    if (!fonte) return null;
    if (typeof fonte.getSheetByName === 'function') {
      let sh = fonte.getSheetByName(nomeSolicitado);
      if (sh) return sh;

      if (typeof fonte.getSheets === 'function') {
        const targetNorm = this.normalizarNomeAba(nomeSolicitado);
        try {
          const allSheets = fonte.getSheets();
          for (const s of allSheets) {
            if (s && typeof s.getName === 'function') {
              if (this.normalizarNomeAba(s.getName()) === targetNorm) {
                return s;
              }
            }
          }
        } catch (e) {}
      }
    } else if (Array.isArray(fonte)) {
      return fonte;
    } else if (typeof fonte === 'object') {
      if (fonte[nomeSolicitado]) return fonte[nomeSolicitado];
      const targetNorm = this.normalizarNomeAba(nomeSolicitado);
      for (const k of Object.keys(fonte)) {
        if (this.normalizarNomeAba(k) === targetNorm) {
          return fonte[k];
        }
      }
    }
    return null;
  }

  /**
   * Executa a compilação do relatório Gxt para uma lista de nomes de abas mensais.
   * @param {SpreadsheetApp.Spreadsheet|Array<Object>} fonte - Planilha ativa ou matriz/mock de dados.
   * @param {Array<string>} listaMeses - Nomes das abas mensais (ex: ['ABR2026', 'MAI2026', 'JUN2026']).
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

    // 1. Carrega o mapa de antiguidade N oficial do Pecúlio (para ORD)
    let resPeculio = { mapa: {}, mapaCompleto: {} };
    if (LeitorPeculioMod) {
      let fPeculio = fontePeculio;
      if (!fPeculio && typeof CONFIG_SYNTHEON !== 'undefined' && typeof CONFIG_SYNTHEON.obterIdPeculio === 'function') {
        const idPeculio = CONFIG_SYNTHEON.obterIdPeculio();
        if (idPeculio && typeof SpreadsheetApp !== 'undefined' && typeof SpreadsheetApp.openById === 'function') {
          try {
            fPeculio = SpreadsheetApp.openById(idPeculio);
          } catch (e) {
            resPeculio = {
              mapa: {},
              mapaCompleto: {},
              erro: 'PECULIO_ACESSO_NEGADO',
              detalheErro: e.message || String(e),
              estatisticas: { lidos: 0, validos: 0, invalidos: 0, duplicados: 0 }
            };
          }
        }
      }

      if (!resPeculio.erro) {
        if (fPeculio) {
          resPeculio = LeitorPeculioMod.lerMapaAntiguidade(fPeculio);
        } else {
          resPeculio = {
            mapa: {},
            mapaCompleto: {},
            erro: 'PECULIO_ACESSO_NEGADO',
            estatisticas: { lidos: 0, validos: 0, invalidos: 0, duplicados: 0 }
          };
        }
      }
    }

    const mapaAntiguidade = resPeculio.mapa || {};
    const mapaCompleto = resPeculio.mapaCompleto || {};
    const erroPeculio = resPeculio.erro || (Object.keys(mapaAntiguidade).length === 0 ? 'PECULIO_SEM_REGISTROS_VALIDOS' : null);

    const resultadoPorMes = {};
    const logMeses = [];
    const diagnosticoGxt = {
      peculioValido: !erroPeculio && Object.keys(mapaAntiguidade).length > 0,
      peculioErro: erroPeculio,
      peculioDetalhe: resPeculio.detalheErro || '',
      totalFatosLidos: 0,
      totalTuneisArmados: 0,
      totalTuneisProcessados: 0,
      totalTuneisPendentes: 0,
      motivosPendencia: {}
    };

    resultadoPorMes._diagnostico = diagnosticoGxt;

    // 2. Processa cada mês selecionado
    listaMeses.forEach(nomeAba => {
      let sheetData = CompiladorGxt.localizarAbaMes(fonte, nomeAba);
      const abaLocNome = (sheetData && typeof sheetData.getName === 'function')
        ? sheetData.getName()
        : (sheetData ? nomeAba : 'NÃO LOCALIZADA');

      if (!sheetData) {
        resultadoPorMes[nomeAba] = { registros: [], resumo: {} };
        logMeses.push({
          mes: nomeAba,
          abaLocalizada: 'NÃO LOCALIZADA',
          fatosLidos: 0,
          tuneisArmados: 0,
          processados: 0,
          pendentes: 0,
          armasFogo: 0,
          armasArtesanais: 0,
          diagnostico: 'ABA_MENSAL_NAO_LOCALIZADA'
        });
        return;
      }

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
            const idxArmaFato = h.findIndex(c => c === 'ARMA');
            const idxTipo = h.findIndex(c => c === 'TIPO');
            const idxModelo = h.findIndex(c => c === 'MODELO');

            for (let r = 1; r < raw.length; r++) {
              const row = raw[r];
              const mat = idxMat !== -1 ? String(row[idxMat] || '').trim() : '';
              if (!mat) continue;

              const valArmaFato = idxArmaFato !== -1 ? row[idxArmaFato] : 0;
              const valTipo = idxTipo !== -1 ? String(row[idxTipo] || '') : '';
              const valModelo = idxModelo !== -1 ? String(row[idxModelo] || '') : '';

              const strArma = String(valArmaFato || '').toUpperCase();
              const isArtesanal = strArma.includes('ARTESANAL') || valTipo.toUpperCase().includes('ARTESANAL') || valModelo.toUpperCase().includes('ARTESANAL');

              let numFogo = 0;
              if (!isArtesanal) {
                const nVal = Number(valArmaFato);
                if (!isNaN(nVal) && nVal > 0) numFogo = nVal;
              } else {
                const nVal = Number(valArmaFato);
                if (!isNaN(nVal) && nVal > 0) numFogo = nVal;
              }

              ocorrenciasBrutas.push({
                data: idxData !== -1 ? row[idxData] : '',
                mike: idxMike !== -1 ? row[idxMike] : '',
                boe: idxBoe !== -1 ? row[idxBoe] : '',
                armas: numFogo,
                isArtesanal: isArtesanal,
                tipoArma: isArtesanal ? 'ARTESANAL' : (valTipo || 'FOGO'),
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
        const ocInfo = reg.ocorrencia || {};
        const pmsRaw = Array.isArray(reg.policiais) ? reg.policiais : [];

        let totalArmasFogo = 0;
        let totalArmasArtesanais = 0;
        let tipoArmaDetectado = ocInfo.tipoArma || reg.tipoArma || '';

        const pmsFormatados = pmsRaw.map(p => {
          const armasP = Number(p.armaFato !== undefined ? p.armaFato : (ocInfo.armaFato !== undefined ? ocInfo.armaFato : (p.armas !== undefined ? p.armas : 0)));
          const valArmaFisica = isNaN(armasP) ? 0 : armasP;

          const tipoP = p.tipoArma || ocInfo.tipoArma || reg.tipoArma || '';
          const modeloP = p.modeloArma || p.modelo || ocInfo.modeloArma || reg.modelo || '';
          const strCheck = `${tipoP} ${modeloP} ${p.descricaoArma || ''} ${p.arma || ''} ${ocInfo.natureza || ''}`.toUpperCase();

          if (p.isArtesanal || strCheck.includes('ARTESANAL')) {
            totalArmasArtesanais += 1;
            if (valArmaFisica > 0) {
              totalArmasFogo += valArmaFisica;
            }
            tipoArmaDetectado = 'ARTESANAL';
          } else {
            if (valArmaFisica > 0) {
              totalArmasFogo += valArmaFisica;
            }
          }

          return {
            matricula: p.matricula || '',
            nome: p.nome || p.militar || p.policial || '',
            grad: p.graduacao || p.grad || '',
            pelotao: p.pelotao || p.designacao || ''
          };
        });

        const rawArmaFato = ocInfo.armaFato !== undefined ? ocInfo.armaFato : (reg.armaFato !== undefined ? reg.armaFato : reg.armas);
        const strRegCheck = `${tipoArmaDetectado} ${ocInfo.modeloArma || ''} ${reg.indicadorPip || ''} ${ocInfo.natureza || ''}`.toUpperCase();
        if (reg.isArtesanal || strRegCheck.includes('ARTESANAL')) {
          if (totalArmasArtesanais === 0) totalArmasArtesanais = 1;
          tipoArmaDetectado = 'ARTESANAL';
        } else if (totalArmasFogo === 0 && !isNaN(Number(rawArmaFato)) && Number(rawArmaFato) > 0) {
          totalArmasFogo = Number(rawArmaFato);
        }

        return {
          data: ocInfo.data || reg.data || '',
          mike: ocInfo.mike || ocInfo.chaveOcorrencia || reg.mike || '',
          boe: ocInfo.boe || ocInfo.numeroBOE || reg.boe || '',
          armas: totalArmasFogo,
          armasFogo: totalArmasFogo,
          armasArtesanais: totalArmasArtesanais,
          tipoArma: tipoArmaDetectado,
          isArtesanal: tipoArmaDetectado === 'ARTESANAL',
          policiais: pmsFormatados
        };
      });

      const fatosLidosMes = ocorrenciasNormalizadas.length;
      diagnosticoGxt.totalFatosLidos += fatosLidosMes;

      if (!diagnosticoGxt.peculioValido) {
        logMeses.push({
          mes: nomeAba,
          abaLocalizada: abaLocNome,
          fatosLidos: fatosLidosMes,
          tuneisArmados: 0,
          processados: 0,
          pendentes: 0,
          armasFogo: 0,
          armasArtesanais: 0,
          diagnostico: erroPeculio || 'PECULIO_ACESSO_NEGADO'
        });
        resultadoPorMes[nomeAba] = { registros: [], resumo: {} };
        return;
      }

      if (PoliticaMeritoMod) {
        const resultadosTuneis = PoliticaMeritoMod.processarMeritoArmas(ocorrenciasNormalizadas, mapaAntiguidade);
        
        diagnosticoGxt.totalTuneisArmados += resultadosTuneis.length;

        // FILTRO ESTRITO: Envia APENAS itens com status 'PROCESSADO' ao renderizador
        const processados = resultadosTuneis.filter(item => item.status === 'PROCESSADO');
        const pendentes = resultadosTuneis.filter(item => item.status !== 'PROCESSADO');

        diagnosticoGxt.totalTuneisProcessados += processados.length;
        diagnosticoGxt.totalTuneisPendentes += pendentes.length;

        pendentes.forEach(p => {
          const st = p.motivoPendente || p.status;
          diagnosticoGxt.motivosPendencia[st] = (diagnosticoGxt.motivosPendencia[st] || 0) + 1;
        });

        // Formata cada registro processado mantendo nome, grad e designação da ocorrência mensal
        const registrosFormatados = processados.map((item, idxSeq) => {
          const gradFinal = item.grad || item.lider?.grad || item.lider?.graduacao || '';
          const nomeFinal = item.lider || item.lider?.nome || item.lider?.policial || item.matricula;
          const designacaoFinal = item.designacao || item.lider?.pelotao || item.lider?.designacao || '';

          return {
            numSeq: idxSeq + 1, // Nº sequencial numérico por mês (1, 2, 3...)
            data: item.data,
            mike: item.mike,
            boe: item.boe,
            matricula: item.matricula,
            grad: gradFinal,
            nome: nomeFinal,
            qtdArmas: item.armasFogo, // Armas de fogo numéricas para resumos/cards
            armasFogo: item.armasFogo,
            armasArtesanais: item.armasArtesanais,
            totalFatosFisicos: item.totalFatosFisicos,
            designacao: designacaoFinal,
            chaveTunel: item.chaveTunel
          };
        });

        // Resumo por pelotão/GTAR do mês (soma APENAS armas de fogo numéricas para cards)
        const resumoMes = {
          '1º PEL GTAR': 0,
          '2º PEL GTAR': 0,
          '1º PEL': 0,
          '2º PEL': 0,
          '3º PEL': 0,
          'TOTAL': 0
        };

        let sumFogoMes = 0;
        let sumArtMes = 0;

        registrosFormatados.forEach(reg => {
          const desNorm = String(reg.designacao || '').toUpperCase().trim();
          let chaveGrupo = '3º PEL';

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

          const numFogo = Number(reg.armasFogo || reg.qtdArmas || 0);
          resumoMes[chaveGrupo] = (resumoMes[chaveGrupo] || 0) + numFogo;
          resumoMes['TOTAL'] += numFogo;

          sumFogoMes += numFogo;
          sumArtMes += Number(reg.armasArtesanais || 0);
        });

        let diagMes = 'APROVADO';
        if (resultadosTuneis.length === 0) {
          diagMes = 'SEM_TUNEIS_ARMADOS';
        } else if (pendentes.length > 0) {
          const p1 = pendentes[0];
          diagMes = p1.motivoPendente || p1.status || 'ANTIGUIDADE_AUSENTE';
        }

        logMeses.push({
          mes: nomeAba,
          abaLocalizada: abaLocNome,
          fatosLidos: fatosLidosMes,
          tuneisArmados: resultadosTuneis.length,
          processados: processados.length,
          pendentes: pendentes.length,
          armasFogo: sumFogoMes,
          armasArtesanais: sumArtMes,
          diagnostico: diagMes
        });

        resultadoPorMes[nomeAba] = {
          registros: registrosFormatados,
          resumo: resumoMes
        };
      } else {
        logMeses.push({
          mes: nomeAba,
          abaLocalizada: abaLocNome,
          fatosLidos: fatosLidosMes,
          tuneisArmados: 0,
          processados: 0,
          pendentes: 0,
          armasFogo: 0,
          armasArtesanais: 0,
          diagnostico: 'SEM_TUNEIS_ARMADOS'
        });
        resultadoPorMes[nomeAba] = { registros: [], resumo: {} };
      }
    });

    resultadoPorMes._logMeses = logMeses;
    return resultadoPorMes;
  }

  /**
   * Helper estático para gerar ou atualizar a aba única descartável [LOG] Gxt.
   * Não acumula histórico e escreve o relatório de diagnóstico por mês.
   */
  static gerarLogOperacionalGxt(ss, dadosLog = {}) {
    if (!ss || typeof ss.getSheetByName !== 'function') return null;

    const NOME_ABA_LOG = '[LOG] Gxt';
    let sheetLog = ss.getSheetByName(NOME_ABA_LOG);

    if (!sheetLog && typeof ss.insertSheet === 'function') {
      sheetLog = ss.insertSheet(NOME_ABA_LOG);
    }

    if (!sheetLog) return null;

    // Limpa a aba [LOG] Gxt completamente para reutilização limpa
    if (typeof sheetLog.clear === 'function') {
      sheetLog.clear();
    } else if (typeof sheetLog.clearContents === 'function') {
      sheetLog.clearContents();
    }

    const dataHora = dadosLog.dataHora || new Date().toLocaleString('pt-BR');
    const status = dadosLog.status || 'CONCLUÍDO';
    const modo = dadosLog.modo || 'SELEÇÃO LIVRE';
    const mesesSolicitados = Array.isArray(dadosLog.meses) ? dadosLog.meses.join(', ') : String(dadosLog.meses || '');
    const peculioStatus = dadosLog.peculioStatus || 'DISPONÍVEL';
    const abasGeradas = Array.isArray(dadosLog.abasGeradas) ? dadosLog.abasGeradas.join(', ') : String(dadosLog.abasGeradas || 'NENHUMA');
    const detalheFinal = dadosLog.detalheFinal || 'Execução concluída com sucesso.';

    const matrizLog = [
      ['PAINEL DE CONTROLE OPERACIONAL — GXT', '', '', '', '', '', '', '', ''],
      ['Data/Hora:', dataHora, '', '', '', '', '', '', ''],
      ['Status:', status, '', '', '', '', '', '', ''],
      ['Modo:', modo, '', '', '', '', '', '', ''],
      ['Meses Solicitados:', mesesSolicitados, '', '', '', '', '', '', ''],
      ['Pecúlio:', peculioStatus, '', '', '', '', '', '', ''],
      ['Abas Geradas:', abasGeradas, '', '', '', '', '', '', ''],
      ['Detalhe Final:', detalheFinal, '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '', ''],
      ['Mês', 'Aba Localizada', 'Fatos Lidos', 'Túneis Armados', 'Processados', 'Pendentes', 'Armas de Fogo', 'Artesanais', 'Diagnóstico & Ação']
    ];

    const tabelaMensal = Array.isArray(dadosLog.tabelaMensal) ? dadosLog.tabelaMensal : [];

    let sumFatos = 0;
    let sumArmados = 0;
    let sumProc = 0;
    let sumPend = 0;
    let sumFogo = 0;
    let sumArt = 0;

    tabelaMensal.forEach(m => {
      const numFatos = Number(m.fatosLidos || 0);
      const numArmados = Number(m.tuneisArmados || 0);
      const numProc = Number(m.processados || 0);
      const numPend = Number(m.pendentes || 0);
      const numFogo = Number(m.armasFogo || 0);
      const numArt = Number(m.armasArtesanais || 0);

      sumFatos += numFatos;
      sumArmados += numArmados;
      sumProc += numProc;
      sumPend += numPend;
      sumFogo += numFogo;
      sumArt += numArt;

      matrizLog.push([
        m.mes || '',
        m.abaLocalizada || '—',
        numFatos,
        numArmados,
        numProc,
        numPend,
        numFogo,
        numArt,
        CompiladorGxt.formatarDiagnosticoEAcao(m.diagnostico)
      ]);
    });

    matrizLog.push([
      'TOTAL',
      '—',
      sumFatos,
      sumArmados,
      sumProc,
      sumPend,
      sumFogo,
      sumArt,
      '—'
    ]);

    if (typeof sheetLog.getRange === 'function') {
      const numRows = matrizLog.length;
      const numCols = 9;
      const range = sheetLog.getRange(1, 1, numRows, numCols);
      if (typeof range.setValues === 'function') {
        range.setValues(matrizLog);
      }

      try {
        if (typeof sheetLog.setFrozenRows === 'function') {
          sheetLog.setFrozenRows(10);
        }
        if (typeof sheetLog.setFrozenColumns === 'function') {
          sheetLog.setFrozenColumns(1);
        }
        const rangeTitulo = sheetLog.getRange(1, 1, 1, numCols);
        if (rangeTitulo && typeof rangeTitulo.setFontWeight === 'function') {
          rangeTitulo.setFontWeight('bold');
        }
        const rangeHeader = sheetLog.getRange(10, 1, 1, numCols);
        if (rangeHeader && typeof rangeHeader.setFontWeight === 'function') {
          rangeHeader.setFontWeight('bold');
        }
        const rangeTotal = sheetLog.getRange(numRows, 1, 1, numCols);
        if (rangeTotal && typeof rangeTotal.setFontWeight === 'function') {
          rangeTotal.setFontWeight('bold');
        }
      } catch (eFmt) {}
    }

    return sheetLog;
  }

  static formatarDiagnosticoEAcao(cod) {
    const mapa = {
      'APROVADO': 'APROVADO — Nenhuma ação necessária',
      'SEM_TUNEIS_ARMADOS': 'SEM_TUNEIS_ARMADOS — Nenhuma apreensão de armas registrada no mês',
      'PECULIO_ACESSO_NEGADO': 'PECULIO_ACESSO_NEGADO — Autorizar permissão de acesso ao arquivo do Pecúlio',
      'PECULIO_ABA_NAO_LOCALIZADA': 'PECULIO_ABA_NAO_LOCALIZADA — Verificar se a aba chama-se EFETIVO, PECULIO ou CÓPIA DE PECÚLIO COM PONTUAÇÃO',
      'PECULIO_CABECALHO_NAO_LOCALIZADO': 'PECULIO_CABECALHO_NAO_LOCALIZADO — Verificar se os cabeçalhos ORD/N e MAT./MATRÍCULA existem',
      'PECULIO_SEM_REGISTROS_VALIDOS': 'PECULIO_SEM_REGISTROS_VALIDOS — Verificar se a aba do Pecúlio contém linhas válidas',
      'ANTIGUIDADE_AUSENTE': 'ANTIGUIDADE_AUSENTE — Cadastrar militar no Pecúlio com número N válido',
      'EMPATE_ANTIGUIDADE': 'EMPATE_ANTIGUIDADE — Resolver empate de antiguidade N no cadastro do Pecúlio',
      'ABA_MENSAL_NAO_LOCALIZADA': 'ABA_MENSAL_NAO_LOCALIZADA — Verificar se a aba do mês existe na planilha',
      'EXCECAO_EXECUCAO': 'EXCECAO_EXECUCAO — Verificar log de execução'
    };
    if (mapa[cod]) return mapa[cod];
    if (!cod) return 'APROVADO — Nenhuma ação necessária';
    return `${cod} — Verificar pendência registrada`;
  }
}

function abrirMenuGxtSelecaoLivre() {
  if (typeof HtmlService !== 'undefined' && typeof SpreadsheetApp !== 'undefined' && SpreadsheetApp.getUi) {
    const html = HtmlService.createHtmlOutputFromFile('Entrada/DialogGxtSelecaoLivre')
      .setWidth(450)
      .setHeight(350)
      .setTitle('Gxt - Seleção Livre');
    SpreadsheetApp.getUi().showModalDialog(html, 'Gxt - Seleção Livre');
  }
}

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

  let dados = {};
  try {
    dados = CompiladorGxt.compilar(ss, mesesOrdenados, fontePeculio);
  } catch (e) {
    dados = {
      _diagnostico: {
        peculioValido: false,
        peculioErro: 'EXCECAO_EXECUCAO',
        peculioDetalhe: e.message || String(e)
      },
      _logMeses: mesesOrdenados.map(m => ({
        mes: m,
        abaLocalizada: '—',
        fatosLidos: 0,
        tuneisArmados: 0,
        processados: 0,
        pendentes: 0,
        armasFogo: 0,
        armasArtesanais: 0,
        diagnostico: 'EXCECAO_EXECUCAO'
      }))
    };
  }

  const diag = dados._diagnostico || {};

  if (!diag.peculioValido) {
    let acaoRecomendada = '';
    const codErro = diag.peculioErro || 'PECULIO_ABA_NAO_LOCALIZADA';

    if (codErro === 'PECULIO_ACESSO_NEGADO') {
      acaoRecomendada = 'Ação recomendada: Autorizar a execução do script e verificar as permissões de compartilhamento do arquivo do Pecúlio no Google Drive.';
    } else if (codErro === 'PECULIO_ABA_NAO_LOCALIZADA') {
      acaoRecomendada = 'Ação recomendada: Verificar se a aba contendo a lista de antiguidade no arquivo do Pecúlio chama-se EFETIVO, PECULIO ou CÓPIA DE PECÚLIO COM PONTUAÇÃO.';
    } else if (codErro === 'PECULIO_CABECALHO_NAO_LOCALIZADO') {
      acaoRecomendada = 'Ação recomendada: Verificar se os cabeçalhos ORD (ou N) e MAT. (ou MATRÍCULA) existem nas primeiras 25 linhas da aba do Pecúlio.';
    } else if (codErro === 'PECULIO_SEM_REGISTROS_VALIDOS') {
      acaoRecomendada = 'Ação recomendada: Verificar se a aba do Pecúlio contém linhas válidas com valores de ORD e MAT. preenchidos.';
    } else {
      acaoRecomendada = `Ação recomendada: Verificar a integridade do arquivo do Pecúlio (${codErro}).`;
    }

    if (ss) {
      CompiladorGxt.gerarLogOperacionalGxt(ss, {
        dataHora: new Date().toLocaleString('pt-BR'),
        status: 'FALHA',
        modo: 'SELEÇÃO LIVRE',
        meses: mesesOrdenados,
        peculioStatus: codErro,
        abasGeradas: [],
        detalheFinal: `FALHA NO GXT: Pecúlio indisponível (${codErro}).`,
        tabelaMensal: dados._logMeses || []
      });
    }

    const msgErro = `FALHA NO GXT: A fonte oficial de antiguidade do Pecúlio não pôde ser processada.\n\nDiagnóstico: ${codErro}\n${diag.peculioDetalhe ? 'Detalhe: ' + diag.peculioDetalhe + '\n' : ''}${acaoRecomendada}\n\nNenhum relatório foi alterado. Veja a aba [LOG] Gxt para detalhes.`;

    if (typeof SpreadsheetApp !== 'undefined' && SpreadsheetApp.getUi) {
      SpreadsheetApp.getUi().alert(msgErro);
    }
    return dados;
  }

  if (diag.totalTuneisArmados > 0 && diag.totalTuneisProcessados === 0) {
    if (ss) {
      CompiladorGxt.gerarLogOperacionalGxt(ss, {
        dataHora: new Date().toLocaleString('pt-BR'),
        status: 'CONCLUÍDO COM PENDÊNCIAS',
        modo: 'SELEÇÃO LIVRE',
        meses: mesesOrdenados,
        peculioStatus: 'DISPONÍVEL',
        abasGeradas: [],
        detalheFinal: 'ATENÇÃO: Todos os túneis armados possuem pendências de antiguidade.',
        tabelaMensal: dados._logMeses || []
      });
    }

    const msgAviso = `ATENÇÃO GXT: Nenhum registro pôde ser processado para o relatório.\n- Fatos lidos: ${diag.totalFatosLidos}\n- Túneis armados encontrados: ${diag.totalTuneisArmados}\n- Túneis processados: 0\n- Túneis pendentes: ${diag.totalTuneisPendentes}\nMotivo: Todos os túneis armados possuem pendências de antiguidade. Veja a aba [LOG] Gxt.`;
    if (typeof SpreadsheetApp !== 'undefined' && SpreadsheetApp.getUi) {
      SpreadsheetApp.getUi().alert(msgAviso);
    }
    return dados;
  }

  let abasGeradas = [];
  let erroRender = null;

  if (RendererMod && ss) {
    try {
      RendererMod.renderizar(ss, dados, nomeAbaSaida);
      abasGeradas.push(nomeAbaSaida);
    } catch (eR) {
      erroRender = eR;
    }
  }

  let statusFinal = 'CONCLUÍDO';
  let detalheFinal = 'Execução concluída com sucesso. Veja o detalhamento na aba [LOG] Gxt.';

  if (erroRender) {
    statusFinal = 'FALHA';
    detalheFinal = `FALHA NA RENDERIZAÇÃO: ${erroRender.message || String(erroRender)}`;
    abasGeradas = [];
  } else if (diag.totalTuneisPendentes > 0) {
    statusFinal = 'CONCLUÍDO COM PENDÊNCIAS';
    detalheFinal = 'Execução concluída com pendências auditadas. Veja a aba [LOG] Gxt.';
  }

  if (ss) {
    CompiladorGxt.gerarLogOperacionalGxt(ss, {
      dataHora: new Date().toLocaleString('pt-BR'),
      status: statusFinal,
      modo: 'SELEÇÃO LIVRE',
      meses: mesesOrdenados,
      peculioStatus: 'DISPONÍVEL',
      abasGeradas: abasGeradas,
      detalheFinal: detalheFinal,
      tabelaMensal: dados._logMeses || []
    });
  }

  if (erroRender && typeof SpreadsheetApp !== 'undefined' && SpreadsheetApp.getUi) {
    SpreadsheetApp.getUi().alert(`FALHA NA RENDERIZAÇÃO GXT: ${erroRender.message || String(erroRender)}. Veja a aba [LOG] Gxt.`);
  }

  return dados;
}

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
  const todasLinhasLog = [];
  const abasGeradasSucesso = [];
  let todosPeculiosValidos = true;
  let erroPeculioGlobal = null;
  let erroRenderGlobal = null;
  let temPendenciasGerais = false;

  trimestres.forEach(tri => {
    let dadosTri = {};
    try {
      dadosTri = CompiladorGxt.compilar(ss, tri.meses, fontePeculio);
    } catch (e) {
      dadosTri = {
        _diagnostico: {
          peculioValido: false,
          peculioErro: 'EXCECAO_EXECUCAO',
          peculioDetalhe: e.message || String(e)
        },
        _logMeses: tri.meses.map(m => ({
          mes: m,
          abaLocalizada: '—',
          fatosLidos: 0,
          tuneisArmados: 0,
          processados: 0,
          pendentes: 0,
          armasFogo: 0,
          armasArtesanais: 0,
          diagnostico: 'EXCECAO_EXECUCAO'
        }))
      };
    }

    resultadosTrimestrais[tri.nomeAba] = dadosTri;
    const diag = dadosTri._diagnostico || {};

    if (Array.isArray(dadosTri._logMeses)) {
      todasLinhasLog.push(...dadosTri._logMeses);
    }

    if (!diag.peculioValido) {
      todosPeculiosValidos = false;
      erroPeculioGlobal = diag.peculioErro || 'PECULIO_ACESSO_NEGADO';
    } else {
      if (diag.totalTuneisPendentes > 0 || (diag.totalTuneisArmados > 0 && diag.totalTuneisProcessados === 0)) {
        temPendenciasGerais = true;
      }
      if (RendererMod && ss) {
        try {
          RendererMod.renderizar(ss, dadosTri, tri.nomeAba);
          abasGeradasSucesso.push(tri.nomeAba);
        } catch (eR) {
          erroRenderGlobal = eR;
        }
      }
    }
  });

  const todosMeses = [
    'JAN2026', 'FEV2026', 'MAR2026', 'ABR2026', 'MAI2026', 'JUN2026',
    'JUL2026', 'AGO2026', 'SET2026', 'OUT2026', 'NOV2026', 'DEZ2026'
  ];

  let statusAnual = 'CONCLUÍDO';
  let detalheAnual = 'Execução anual concluída com sucesso (4 trimestres gerados). Veja o detalhamento na aba [LOG] Gxt.';

  if (!todosPeculiosValidos) {
    statusAnual = 'FALHA';
    detalheAnual = `FALHA NO GXT ANUAL: Pecúlio inacessível (${erroPeculioGlobal}).`;
  } else if (erroRenderGlobal) {
    statusAnual = 'FALHA';
    detalheAnual = `FALHA NA RENDERIZAÇÃO ANUAL: ${erroRenderGlobal.message || String(erroRenderGlobal)}`;
  } else if (temPendenciasGerais) {
    statusAnual = 'CONCLUÍDO COM PENDÊNCIAS';
    detalheAnual = 'Execução anual concluída com pendências auditadas. Veja a aba [LOG] Gxt.';
  }

  const dadosLogAnual = {
    dataHora: new Date().toLocaleString('pt-BR'),
    status: statusAnual,
    modo: 'ANUAL',
    meses: todosMeses,
    peculioStatus: todosPeculiosValidos ? 'DISPONÍVEL' : (erroPeculioGlobal || 'PECULIO_ACESSO_NEGADO'),
    abasGeradas: abasGeradasSucesso,
    detalheFinal: detalheAnual,
    tabelaMensal: todasLinhasLog
  };

  if (ss) {
    CompiladorGxt.gerarLogOperacionalGxt(ss, dadosLogAnual);
  }

  if ((!todosPeculiosValidos || erroRenderGlobal) && typeof SpreadsheetApp !== 'undefined' && SpreadsheetApp.getUi) {
    SpreadsheetApp.getUi().alert(`FALHA NO GXT ANUAL: ${erroPeculioGlobal || erroRenderGlobal}. Veja a aba [LOG] Gxt.`);
  }

  return resultadosTrimestrais;
}

/**
 * Executa o Diagnóstico Determinístico de Túneis GXT para um mês específico
 * e escreve o resultado exclusivamente na aba descartável [DIAGNOSTICO] Gxt.
 */
function diagnosticarGxtMes_(nomeMes = 'ABR2026', fonteSS = null, fontePeculio = null) {
  let DiagnosticoMod = typeof DiagnosticoDeterministicoGxt !== 'undefined' ? DiagnosticoDeterministicoGxt : null;
  if (!DiagnosticoMod && typeof require !== 'undefined') {
    try { DiagnosticoMod = require('../Motor/DiagnosticoDeterministicoGxt').DiagnosticoDeterministicoGxt; } catch (e) {}
  }

  let LeitorPeculioMod = typeof LeitorAntiguidadePeculio !== 'undefined' ? LeitorAntiguidadePeculio : null;
  if (!LeitorPeculioMod && typeof require !== 'undefined') {
    try { LeitorPeculioMod = require('../Leitura/LeitorAntiguidadePeculio'); } catch (e) {}
  }

  const ss = fonteSS || ((typeof SpreadsheetApp !== 'undefined' && typeof SpreadsheetApp.getActiveSpreadsheet === 'function')
    ? SpreadsheetApp.getActiveSpreadsheet()
    : null);

  if (!ss) return null;

  const sheetMes = CompiladorGxt.localizarAbaMes(ss, nomeMes);
  if (!sheetMes) {
    if (typeof SpreadsheetApp !== 'undefined' && SpreadsheetApp.getUi) {
      SpreadsheetApp.getUi().alert(`Aba do mês ${nomeMes} não foi localizada na planilha.`);
    }
    return null;
  }

  let mapAntiguidade = {};
  let metaPeculio = { erro: null, detalheErro: '' };

  if (LeitorPeculioMod) {
    let fPeculio = fontePeculio;
    if (!fPeculio && typeof CONFIG_SYNTHEON !== 'undefined' && typeof CONFIG_SYNTHEON.obterIdPeculio === 'function') {
      const idPeculio = CONFIG_SYNTHEON.obterIdPeculio();
      if (idPeculio && typeof SpreadsheetApp !== 'undefined' && typeof SpreadsheetApp.openById === 'function') {
        try {
          fPeculio = SpreadsheetApp.openById(idPeculio);
        } catch (e) {
          metaPeculio = { erro: 'PECULIO_ACESSO_NEGADO', detalheErro: e.message || String(e) };
        }
      }
    }
    if (fPeculio && !metaPeculio.erro) {
      const resP = LeitorPeculioMod.lerMapaAntiguidade(fPeculio);
      mapAntiguidade = resP.mapa || {};
      if (resP.erro) {
        metaPeculio = { erro: resP.erro, detalheErro: resP.detalheErro || '' };
      }
    } else if (!fPeculio && !metaPeculio.erro) {
      metaPeculio = { erro: 'PECULIO_ACESSO_NEGADO', detalheErro: 'Fonte do Pecúlio não fornecida' };
    }
  }

  const diagRes = DiagnosticoMod.diagnosticarMes(sheetMes, mapAntiguidade, nomeMes, metaPeculio);
  const matriz = DiagnosticoMod.montarMatrizDiagnostico(diagRes);

  const NOME_ABA_DIAG = '[DIAGNOSTICO] Gxt';
  let sheetDiag = ss.getSheetByName(NOME_ABA_DIAG);
  if (!sheetDiag && typeof ss.insertSheet === 'function') {
    sheetDiag = ss.insertSheet(NOME_ABA_DIAG);
  }

  if (sheetDiag) {
    if (typeof sheetDiag.clear === 'function') {
      sheetDiag.clear();
    } else if (typeof sheetDiag.clearContents === 'function') {
      sheetDiag.clearContents();
    }

    if (typeof sheetDiag.getRange === 'function') {
      const numRows = matriz.length;
      const numCols = 12;
      const range = sheetDiag.getRange(1, 1, numRows, numCols);
      if (typeof range.setValues === 'function') {
        range.setValues(matriz);
      }

      try {
        if (typeof sheetDiag.setFrozenRows === 'function') sheetDiag.setFrozenRows(10);
        if (typeof sheetDiag.setFrozenColumns === 'function') sheetDiag.setFrozenColumns(1);
        const rTit = sheetDiag.getRange(1, 1, 1, numCols);
        if (rTit && typeof rTit.setFontWeight === 'function') rTit.setFontWeight('bold');
        const rHead = sheetDiag.getRange(10, 1, 1, numCols);
        if (rHead && typeof rHead.setFontWeight === 'function') rHead.setFontWeight('bold');
        const rTot = sheetDiag.getRange(numRows, 1, 1, numCols);
        if (rTot && typeof rTot.setFontWeight === 'function') rTot.setFontWeight('bold');
      } catch (eFmt) {}
    }
  }

  if (typeof SpreadsheetApp !== 'undefined' && SpreadsheetApp.getUi) {
    SpreadsheetApp.getUi().alert(`DIAGNOSTICO GXT (${nomeMes}):\n${diagRes.reconciliacaoTexto}\n\nVeja o detalhamento na aba [DIAGNOSTICO] Gxt.`);
  }

  return diagRes;
}

/**
 * Função global específica para diagnosticar ABR2026.
 */
function diagnosticarGxtAbril_(fonteSS = null, fontePeculio = null) {
  return diagnosticarGxtMes_('ABR2026', fonteSS, fontePeculio);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CompiladorGxt,
    abrirMenuGxtSelecaoLivre,
    gerarGxtSelecaoLivre,
    gerarGxtAnual,
    diagnosticarGxtMes_,
    diagnosticarGxtAbril_
  };
}

