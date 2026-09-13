/**
 * Leitor Universal de dados do ecossistema SYNTHEON.
 * Le as planilhas, mapeia os cabecalhos por alias, remove duplicidades e devolve objetos canonicos padronizados.
 */
const SyntheonLeitor = {
  /**
   * Le uma lista de abas mensais e retorna um vetor de ocorrencias consolidadas.
   * @param {SpreadsheetApp.Spreadsheet} ss - Planilha ativa.
   * @param {Array<string>} abasAlvo - Nomes das abas de meses.
   * @param {Date|null} dataInicio - Filtro de data inicial.
   * @param {Date|null} dataFim - Filtro de data final.
   * @param {SyntheonLogger} logger - Instancia do logger do fluxo.
   * @return {Array<Object>} Lista de ocorrencias estruturadas.
   */
  lerAbas(ss, abasAlvo, dataInicio, dataFim, logger) {
    const mapaEfetivo = SyntheonPoliciais.carregarEfetivo(ss);
    const ocorrenciasPorChave = {};

    abasAlvo.forEach(nomeAba => {
      const inicioAba = Date.now();
      const estatisticasAba = {
        linhas: 0,
        ocorrencias: new Set(),
        policiais: new Set()
      };

      const sheet = ss.getSheetByName(nomeAba);
      if (!sheet) {
        logger.aviso(`Aba ${nomeAba} nao encontrada e foi pulada.`);
        return;
      }
      logger.logAba(nomeAba);

      const lastRow = sheet.getLastRow();
      const lastCol = sheet.getLastColumn();
      if (lastRow < 2 || lastCol < 1) return;

      const dados = sheet.getRange(1, 1, lastRow, lastCol).getValues();
      const headers = dados[0];
      const idx = SyntheonLeitor._mapearColunas(headers);
      logger.linhasLidas += (dados.length - 1);

      if (idx.matricula === -1) {
        logger.aviso(`Coluna MATRICULA nao localizada na aba ${nomeAba}. Aba pulada.`);
        return;
      }
      if (idx.mike === -1 && idx.boe === -1) {
        logger.aviso(`Colunas identificadoras de ocorrencia (MIKE/BOE) ausentes na aba ${nomeAba}. Aba pulada.`);
        return;
      }

      for (let i = 1; i < dados.length; i++) {
        const linha = SyntheonLeitor._processarLinha(dados[i], idx, mapaEfetivo, logger, {
          nomeAba,
          linhaReal: i + 1,
          dataInicio,
          dataFim,
          estatisticas: estatisticasAba
        });

        if (!linha) continue;

        if (!ocorrenciasPorChave[linha.chave]) {
          ocorrenciasPorChave[linha.chave] = {
            chave: linha.chave,
            mike: linha.mike,
            boe: linha.boe,
            data: linha.data,
            hora: linha.hora,
            natureza: linha.natureza,
            cidade: linha.cidade,
            bairro: linha.bairro,
            ais: linha.ais,
            policiais: {},
            pontosTotaisOcorrencia: 0
          };
        }

        const ocorrencia = ocorrenciasPorChave[linha.chave];
        ocorrencia.pontosTotaisOcorrencia = Math.max(ocorrencia.pontosTotaisOcorrencia, linha.pontosTotais);

        const policialExistia = !!ocorrencia.policiais[linha.matricula];
        if (!policialExistia) {
          ocorrencia.policiais[linha.matricula] = {
            matricula: linha.matricula,
            nome: linha.nomePolicial,
            grad: linha.gradPolicial,
            pelotao: linha.pelotaoPolicial,
            pontosFiccao: 0,
            armas: 0,
            participacaoArmas: 0,
            maconha: 0,
            cocaina: 0,
            crack: 0,
            detidos: 0,
            apfd: 0,
            tco: 0,
            boc: 0,
            qtdBoe: linha.boe ? 1 : 0
          };
          logger.linhasValidas++;
        } else {
          logger.duplicidades++;
        }

        SyntheonLeitor._acumularMetricasPolicial(ocorrencia.policiais[linha.matricula], linha);
      }

      const tempoAba = ((Date.now() - inicioAba) / 1000).toFixed(2);
      if (typeof logger.logAbaDetalhado === 'function') {
        logger.logAbaDetalhado(
          nomeAba,
          estatisticasAba.linhas,
          estatisticasAba.ocorrencias.size,
          estatisticasAba.policiais.size,
          tempoAba
        );
      }
    });

    const vetorOcorrencias = Object.values(ocorrenciasPorChave);
    logger.ocorrenciasUnicas = vetorOcorrencias.length;

    const matriculasUnicas = new Set();
    vetorOcorrencias.forEach(oc => {
      Object.keys(oc.policiais).forEach(mat => matriculasUnicas.add(mat));
    });
    logger.policiaisUnicos = matriculasUnicas.size;

    return vetorOcorrencias;
  },

  _mapearColunas(headers) {
    const loc = (chaveAlias) => (typeof SyntheonCabecalhos !== 'undefined')
      ? SyntheonCabecalhos.encontrar(headers, chaveAlias)
      : SyntheonUtils.localizarColuna(headers.map(h => SyntheonUtils.normalizarTexto(h)), chaveAlias);

    return {
      data: loc('DATA'),
      hora: loc('HORA'),
      mike: loc('MIKE'),
      boe: loc('BOE'),
      natureza: loc('NATUREZA'),
      cidade: loc('CIDADE'),
      bairro: loc('BAIRRO'),
      ais: loc('AIS'),
      matricula: loc('MATRICULA'),
      militar: loc('POLICIAL'),
      grad: loc('GRAD'),
      pelotao: loc('PELOTAO'),
      armas: loc('ARMAS'),
      // #152: PARTICIPACAO de arma (QDT ARMAS, coluna AF) - e o que mede produtividade.
      participacaoArmas: loc('QDT_ARMAS'),
      maconha: loc('MACONHA'),
      cocaina: loc('COCAINA'),
      crack: loc('CRACK'),
      pontosTotais: loc('PONTOS_TOTAIS'),
      pontosFiccao: loc('PONTOS_FICCAO'),
      detidos: loc('DETIDOS'),
      apfd: loc('APFD'),
      tco: loc('TCO'),
      boc: loc('BOC')
    };
  },

  _processarLinha(row, idx, mapaEfetivo, logger, contexto) {
    const rawMat = row[idx.matricula];
    const matricula = SyntheonUtils.limparMatricula(rawMat);

    if (!matricula) {
      logger.linhasIgnoradas++;
      return null;
    }

    if (!SyntheonValidador.validarMatricula(matricula)) {
      logger.aviso(`Matricula invalida na aba ${contexto.nomeAba}, linha ${contexto.linhaReal}: "${rawMat}".`);
      logger.linhasIgnoradas++;
      return null;
    }

    // #152: a linha FILHA herda a DATA da linha mestra do seu tunel.
    // O formulario grava a DATA apenas na mestra (DATA|MIKE|BOE). Sem herdar, TODA linha filha
    // era descartada aqui - e a participacao de arma (que vive nas filhas) desaparecia do produto.
    const rawData = idx.data !== -1 ? row[idx.data] : null;
    let dataObjeto = converterDataUnificada(rawData);
    const memoriaAba = contexto.estatisticas ? contexto.estatisticas : contexto;
    if (SyntheonValidador.validarData(dataObjeto)) {
      memoriaAba.dataCorrente = dataObjeto;          // mestra define a data corrente do tunel
    } else if (SyntheonValidador.validarData(memoriaAba.dataCorrente)) {
      dataObjeto = memoriaAba.dataCorrente;          // filha herda a data da mestra
    }
    if (!SyntheonValidador.validarData(dataObjeto)) {
      logger.aviso(`Data invalida ou ausente na aba ${contexto.nomeAba}, linha ${contexto.linhaReal}: "${rawData}".`);
      logger.linhasIgnoradas++;
      return null;
    }

    if (contexto.dataInicio && contexto.dataFim) {
      if (dataObjeto < contexto.dataInicio || dataObjeto > contexto.dataFim) {
        logger.linhasIgnoradas++;
        return null;
      }
    }

    if (contexto.estatisticas) {
      contexto.estatisticas.linhas++;
    }

    const mike = idx.mike !== -1 ? String(row[idx.mike]).trim() : '';
    if (!mike) {
      logger.linhasIgnoradas++;
      return null;
    }

    const boe = idx.boe !== -1 ? String(row[idx.boe]).trim() : '';
    const dataStr = formatarDataBR(dataObjeto);
    const chave = `${dataStr}|${mike}|${boe}`;
    const cadastro = mapaEfetivo[matricula];

    if (contexto.estatisticas) {
      contexto.estatisticas.ocorrencias.add(chave);
      contexto.estatisticas.policiais.add(matricula);
    }

    let nomePolicial = idx.militar !== -1 ? String(row[idx.militar]).trim().toUpperCase() : 'N/I';
    let gradPolicial = idx.grad !== -1 ? String(row[idx.grad]).trim().toUpperCase() : 'N/I';
    let pelotaoPolicial = idx.pelotao !== -1 ? String(row[idx.pelotao]).trim() : 'N/I';

    if (cadastro) {
      nomePolicial = cadastro.nome.toUpperCase();
      gradPolicial = cadastro.graduacao;
      pelotaoPolicial = cadastro.pelotao || pelotaoPolicial;
    } else {
      logger.matriculasNaoEncontradas.add(matricula);
    }

    pelotaoPolicial = SyntheonNormalizador.normalizarPelotao(pelotaoPolicial);
    gradPolicial = SyntheonNormalizador.normalizarGraduacao(gradPolicial);

    const linha = {
      chave,
      mike,
      boe,
      data: dataObjeto,
      hora: idx.hora !== -1 ? String(row[idx.hora]).trim() : '',
      natureza: idx.natureza !== -1 ? String(row[idx.natureza]).trim() : '',
      cidade: idx.cidade !== -1 ? String(row[idx.cidade]).trim() : '',
      bairro: idx.bairro !== -1 ? String(row[idx.bairro]).trim() : '',
      ais: idx.ais !== -1 ? SyntheonUtils.converterNumero(row[idx.ais]) : 0,
      matricula,
      nomePolicial,
      gradPolicial,
      pelotaoPolicial,
      armas: idx.armas !== -1 ? SyntheonUtils.converterNumero(row[idx.armas]) : 0,
      participacaoArmas: idx.participacaoArmas !== -1 ? SyntheonUtils.converterNumero(row[idx.participacaoArmas]) : 0,
      maconha: idx.maconha !== -1 ? SyntheonUtils.converterNumero(row[idx.maconha]) : 0,
      cocaina: idx.cocaina !== -1 ? SyntheonUtils.converterNumero(row[idx.cocaina]) : 0,
      crack: idx.crack !== -1 ? SyntheonUtils.converterNumero(row[idx.crack]) : 0,
      pontosTotais: idx.pontosTotais !== -1 ? SyntheonUtils.converterNumero(row[idx.pontosTotais]) : 0,
      pontosFiccao: idx.pontosFiccao !== -1 ? SyntheonUtils.converterNumero(row[idx.pontosFiccao]) : 0,
      detidos: idx.detidos !== -1 ? SyntheonUtils.converterNumero(row[idx.detidos]) : 0,
      apfd: idx.apfd !== -1 ? SyntheonUtils.converterNumero(row[idx.apfd]) : 0,
      tco: idx.tco !== -1 ? SyntheonUtils.converterNumero(row[idx.tco]) : 0,
      boc: idx.boc !== -1 ? SyntheonUtils.converterNumero(row[idx.boc]) : 0
    };

    if (!SyntheonValidador.validarQuantidadeNaoNegativa(linha.armas) ||
        !SyntheonValidador.validarQuantidadeNaoNegativa(linha.maconha) ||
        !SyntheonValidador.validarQuantidadeNaoNegativa(linha.cocaina) ||
        !SyntheonValidador.validarQuantidadeNaoNegativa(linha.crack)) {
      logger.aviso(`Valores negativos ignorados na aba ${contexto.nomeAba}, linha ${contexto.linhaReal} para policial ${matricula}.`);
      logger.linhasIgnoradas++;
      return null;
    }

    return linha;
  },

  _acumularMetricasPolicial(policial, dadosLinha) {
    policial.armas += dadosLinha.armas;
    // #152: acumula a PARTICIPACAO de arma (QDT ARMAS) - e o que o produto mede.
    policial.participacaoArmas = (policial.participacaoArmas || 0) + (dadosLinha.participacaoArmas || 0);
    policial.maconha += dadosLinha.maconha;
    policial.cocaina += dadosLinha.cocaina;
    policial.crack += dadosLinha.crack;
    policial.detidos += dadosLinha.detidos;
    policial.apfd += dadosLinha.apfd;
    policial.tco += dadosLinha.tco;
    policial.boc += dadosLinha.boc;
    policial.pontosFiccao = Math.max(policial.pontosFiccao, dadosLinha.pontosFiccao);
  }
};

/**
 * BISTURI (#152): mostra o valor da PARTICIPACAO de arma em CADA elo da corrente do comparativo.
 * Nao conserta nada - so mede. Uso: diagnosticarCaminhoArmasHeadless('1133306')
 */
function diagnosticarCaminhoArmasHeadless(matriculaAlvo) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const aba = ss.getSheetByName('SET2026');
  const out = { matricula: String(matriculaAlvo), aba: 'SET2026' };

  const lastCol = aba.getLastColumn();
  const headers = aba.getRange(1, 1, 1, lastCol).getValues()[0];
  out.elo1_encontrar_QDT = SyntheonCabecalhos.encontrar(headers, 'QDT_ARMAS');
  out.elo1_encontrar_ARMAS = SyntheonCabecalhos.encontrar(headers, 'ARMAS');

  const idx = SyntheonLeitor._mapearColunas(headers);
  out.elo2_idx_participacaoArmas = idx.participacaoArmas;
  out.elo2_idx_armas = idx.armas;

  const dados = aba.getRange(2, 1, aba.getLastRow() - 1, lastCol).getValues();
  for (let i = 0; i < dados.length; i++) {
    if (String(dados[i][idx.matricula]).trim() === String(matriculaAlvo)) {
      out.elo3_linha_fonte = {
        linha: i + 2,
        valor_na_coluna_QDT: idx.participacaoArmas > -1 ? String(dados[i][idx.participacaoArmas]) : 'INDICE NAO ENCONTRADO'
      };
      break;
    }
  }

  try {
    const ocorrencias = SyntheonLeitor.lerAbas(ss, ['SET2026'], null, null, new SyntheonLogger('DIAG_ARMA'));
    const mapa = SyntheonMetricas.consolidarPoliciais(ocorrencias);
    const chaves = Object.keys(mapa);
    const chave = chaves.filter(function (k) { return String(k).indexOf(String(matriculaAlvo)) !== -1; })[0];
    if (chave) {
      const reg = mapa[chave];
      out.elo4_metricas = {
        chave: chave,
        armas: reg.fatos ? reg.fatos.armas : reg.armas,
        participacaoArmas: reg.fatos ? reg.fatos.participacaoArmas : reg.participacaoArmas
      };
    } else {
      out.elo4_metricas = 'matricula ausente nas metricas';
    }
    out.elo5_total_registros = chaves.length;
  } catch (e) {
    out.elo4_erro = String(e && e.message || e);
  }
  return JSON.stringify(out);
}

/**
 * PROVA DA PARTE 1 (#152): confere, mes a mes, a PARTICIPACAO de arma de uma matricula
 * na FONTE contra o valor que o PRODUTO publica. Uso: verificarParticipacaoArmasHeadless('1133306')
 */
function verificarParticipacaoArmasHeadless(matriculaAlvo) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const meses = ['JAN2026','FEV2026','MAR2026','ABR2026','MAI2026','JUN2026','JUL2026','AGO2026','SET2026'];
  const alvo = String(matriculaAlvo).trim();
  const out = { matricula: alvo, porMes: {}, totalFonte: 0 };

  meses.forEach(function (nome) {
    const aba = ss.getSheetByName(nome);
    if (!aba) { out.porMes[nome] = 'aba ausente'; return; }
    const lastCol = aba.getLastColumn();
    const headers = aba.getRange(1, 1, 1, lastCol).getValues()[0];
    const idxMat = SyntheonCabecalhos.encontrar(headers, 'MATRICULA');
    const idxQdt = SyntheonCabecalhos.encontrar(headers, 'QDT_ARMAS');
    if (idxMat === -1 || idxQdt === -1) { out.porMes[nome] = 'coluna ausente'; return; }
    const dados = aba.getRange(2, 1, aba.getLastRow() - 1, lastCol).getValues();
    let soma = 0, linhas = 0;
    dados.forEach(function (r) {
      if (String(r[idxMat]).trim() === alvo) { soma += Number(r[idxQdt]) || 0; linhas++; }
    });
    out.porMes[nome] = { soma: soma, linhas: linhas };
    out.totalFonte += soma;
  });

  try {
    const occ = SyntheonLeitor.lerAbas(ss, meses, null, null, new SyntheonLogger('VERIF_ARMA'));
    const mapa = SyntheonMetricas.consolidarPoliciais(occ);
    const reg = mapa[alvo];
    out.produto = reg ? (reg.fatos ? reg.fatos.participacaoArmas : reg.participacaoArmas) : 'ausente';
  } catch (e) {
    out.produto = 'erro: ' + (e && e.message || e);
  }
  out.confere = (out.totalFonte === out.produto);
  return JSON.stringify(out);
}

/**
 * PROVA DA PARTE 2 (#152): QTD. O = numero de TUNEIS DISTINTOS que o policial participou.
 * Regra dada pelo proprietario: "de quantos tuneis aquele policial participou".
 * Uso: verificarQtdOcorrenciasHeadless('1133306')
 */
function verificarQtdOcorrenciasHeadless(matriculaAlvo) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const meses = ['JAN2026','FEV2026','MAR2026','ABR2026','MAI2026','JUN2026','JUL2026','AGO2026','SET2026'];
  const alvo = String(matriculaAlvo).trim();

  const occ = SyntheonLeitor.lerAbas(ss, meses, null, null, new SyntheonLogger('VERIF_O'));
  let tuneisFonte = 0;
  const porMes = {};
  occ.forEach(function (o) {
    if (o.policiais && o.policiais[alvo]) {
      tuneisFonte++;
      const m = String(o.data || '').substring(3) || 'sem-data';
      porMes[m] = (porMes[m] || 0) + 1;
    }
  });

  const mapa = SyntheonMetricas.consolidarPoliciais(occ);
  const reg = mapa[alvo];
  const produto = reg ? (reg.fatos ? reg.fatos.ocorrencias : reg.ocorrencias) : 'ausente';

  return JSON.stringify({
    matricula: alvo,
    regra: 'tuneis distintos em que participou',
    tuneisFonte: tuneisFonte,
    produto: produto,
    confere: Number(produto) === tuneisFonte,
    totalTuneisAno: occ.length
  });
}

/**
 * PROVA DA PARTE 4 (#152): ENTROPECENTES - soma das colunas de droga na FONTE por matricula
 * contra o total publicado no PRODUTO. Uso: verificarDrogasHeadless('1133306')
 */
function verificarDrogasHeadless(matriculaAlvo) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const meses = ['JAN2026','FEV2026','MAR2026','ABR2026','MAI2026','JUN2026','JUL2026','AGO2026','SET2026'];
  const alvo = String(matriculaAlvo).trim();
  const out = { matricula: alvo, porMes: {}, totalFonte: 0 };

  meses.forEach(function (nome) {
    const aba = ss.getSheetByName(nome);
    if (!aba) { return; }
    const lastCol = aba.getLastColumn();
    const headers = aba.getRange(1, 1, 1, lastCol).getValues()[0];
    const iMat = SyntheonCabecalhos.encontrar(headers, 'MATRICULA');
    const iMac = SyntheonCabecalhos.encontrar(headers, 'MACONHA');
    const iCoc = SyntheonCabecalhos.encontrar(headers, 'COCAINA');
    const iCra = SyntheonCabecalhos.encontrar(headers, 'CRACK');
    if (iMat === -1) { return; }
    const dados = aba.getRange(2, 1, aba.getLastRow() - 1, lastCol).getValues();
    let soma = 0;
    dados.forEach(function (r) {
      if (String(r[iMat]).trim() === alvo) {
        soma += (Number(iMac > -1 ? r[iMac] : 0) || 0) +
                (Number(iCoc > -1 ? r[iCoc] : 0) || 0) +
                (Number(iCra > -1 ? r[iCra] : 0) || 0);
      }
    });
    out.porMes[nome] = Math.round(soma * 100) / 100;
    out.totalFonte += soma;
  });

  try {
    const occ = SyntheonLeitor.lerAbas(ss, meses, null, null, new SyntheonLogger('VERIF_DROGA'));
    const mapa = SyntheonMetricas.consolidarPoliciais(occ);
    const reg = mapa[alvo];
    out.produto = reg ? (reg.fatos ? reg.fatos.drogasTotal : reg.drogasTotal) : 'ausente';
  } catch (e) { out.produto = 'erro: ' + (e && e.message || e); }
  out.totalFonte = Math.round(out.totalFonte * 100) / 100;
  out.confere = Math.abs(Number(out.produto) - out.totalFonte) < 0.01;
  return JSON.stringify(out);
}
