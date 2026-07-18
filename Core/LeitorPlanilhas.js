/**
 * Leitor Universal de dados do ecossistema SYNTHÉON.
 * Lê as planilhas, mapeia os cabeçalhos por alias, remove duplicidades e devolve objetos canônicos padronizados.
 */
const SyntheonLeitor = {
  /**
   * Lê uma lista de abas mensais e retorna um vetor de ocorrências consolidadas.
   * @param {SpreadsheetApp.Spreadsheet} ss - Planilha ativa.
   * @param {Array<string>} abasAlvo - Nomes das abas de meses.
   * @param {Date|null} dataInicio - Filtro de data inicial.
   * @param {Date|null} dataFim - Filtro de data final.
   * @param {SyntheonLogger} logger - Instância do logger do fluxo.
   * @return {Array<OcorrenciaPadronizada>} Lista de ocorrências estruturadas.
   */
  lerAbas(ss, abasAlvo, dataInicio, dataFim, logger) {
    const mapaEfetivo = SyntheonPoliciais.carregarEfetivo(ss);
    const ocorrenciasPorChave = {}; // chave -> OcorrenciaPadronizada
    
    abasAlvo.forEach(nomeAba => {
      const sheet = ss.getSheetByName(nomeAba);
      if (!sheet) {
        logger.aviso(`Aba ${nomeAba} não encontrada e foi pulada.`);
        return;
      }
      logger.logAba(nomeAba);

      const lastRow = sheet.getLastRow();
      const lastCol = sheet.getLastColumn();
      if (lastRow < 2 || lastCol < 1) return;

      const dados = sheet.getRange(1, 1, lastRow, lastCol).getValues();
      const headers = dados[0].map(h => SyntheonUtils.normalizarTexto(h));
      logger.linhasLidas += (dados.length - 1);

      // Localizar índices das colunas utilizando aliases
      const idx = {
        data: SyntheonUtils.localizarColuna(headers, 'DATA'),
        hora: SyntheonUtils.localizarColuna(headers, 'HORA'),
        mike: SyntheonUtils.localizarColuna(headers, 'MIKE'),
        boe: SyntheonUtils.localizarColuna(headers, 'BOE'),
        natureza: SyntheonUtils.localizarColuna(headers, 'NATUREZA'),
        cidade: SyntheonUtils.localizarColuna(headers, 'CIDADE'),
        bairro: SyntheonUtils.localizarColuna(headers, 'BAIRRO'),
        ais: SyntheonUtils.localizarColuna(headers, 'AIS'),
        matricula: SyntheonUtils.localizarColuna(headers, 'MATRICULA'),
        militar: SyntheonUtils.localizarColuna(headers, 'POLICIAL'),
        grad: SyntheonUtils.localizarColuna(headers, 'GRAD'),
        pelotao: SyntheonUtils.localizarColuna(headers, 'PELOTAO'),
        
        // Métricas
        armas: SyntheonUtils.localizarColuna(headers, 'ARMAS'),
        maconha: SyntheonUtils.localizarColuna(headers, 'MACONHA'),
        cocaina: SyntheonUtils.localizarColuna(headers, 'COCAINA'),
        crack: SyntheonUtils.localizarColuna(headers, 'CRACK'),
        pontosTotais: SyntheonUtils.localizarColuna(headers, 'PONTOS_TOTAIS'),
        pontosFiccao: SyntheonUtils.localizarColuna(headers, 'PONTOS_FICCAO')
      };

      // Validação básica do cabeçalho
      if (idx.matricula === -1) {
        logger.aviso(`Coluna MATRÍCULA não localizada na aba ${nomeAba}. Aba pulada.`);
        return;
      }
      if (idx.mike === -1 && idx.boe === -1) {
        logger.aviso(`Colunas identificadoras de ocorrência (MIKE/BOE) ausentes na aba ${nomeAba}. Aba pulada.`);
        return;
      }

      for (let i = 1; i < dados.length; i++) {
        const row = dados[i];
        const rawMat = row[idx.matricula];
        const matricula = SyntheonUtils.limparMatricula(rawMat);
        const linhaReal = i + 1;

        // Pular matrículas nulas
        if (!matricula) {
          logger.linhasIgnoradas++;
          continue;
        }

        // Validar formato da matrícula
        if (!SyntheonValidador.validarMatricula(matricula)) {
          logger.aviso(`Matrícula inválida na aba ${nomeAba}, linha ${linhaReal}: "${rawMat}".`);
          logger.linhasIgnoradas++;
          continue;
        }

        // Tratar conversão da data
        const rawData = idx.data !== -1 ? row[idx.data] : null;
        const dataObjeto = converterDataUnificada(rawData);
        if (!SyntheonValidador.validarData(dataObjeto)) {
          logger.aviso(`Data inválida ou ausente na aba ${nomeAba}, linha ${linhaReal}: "${rawData}".`);
          logger.linhasIgnoradas++;
          continue;
        }

        // Filtrar período de data se fornecido
        if (dataInicio && dataFim) {
          if (dataObjeto < dataInicio || dataObjeto > dataFim) {
            logger.linhasIgnoradas++;
            continue;
          }
        }

        // Mapear chaves identificadoras
        const mike = idx.mike !== -1 ? String(row[idx.mike]).trim() : '';
        const boe = idx.boe !== -1 ? String(row[idx.boe]).trim() : '';
        const chave = (mike && boe) ? `${mike}|${boe}` : (mike || boe || `L${linhaReal}_${nomeAba}`);

        // Cruzamento com a base de Efetivo
        const cadastro = mapaEfetivo[matricula];
        let nomePolicial = idx.militar !== -1 ? String(row[idx.militar]).trim().toUpperCase() : 'N/I';
        let gradPolicial = idx.grad !== -1 ? String(row[idx.grad]).trim().toUpperCase() : 'N/I';
        let pelotaoPolicial = idx.pelotao !== -1 ? String(row[idx.pelotao]).trim() : 'N/I';

        if (cadastro) {
          nomePolicial = cadastro.nome.toUpperCase();
          gradPolicial = cadastro.graduacao;
        } else {
          logger.matriculasNaoEncontradas.add(matricula);
        }

        // Normalização das propriedades
        pelotaoPolicial = SyntheonNormalizador.normalizarPelotao(pelotaoPolicial);
        gradPolicial = SyntheonNormalizador.normalizarGraduacao(gradPolicial);

        // Extrair valores numéricos das colunas
        const armas = idx.armas !== -1 ? SyntheonUtils.converterNumero(row[idx.armas]) : 0;
        const mac = idx.maconha !== -1 ? SyntheonUtils.converterNumero(row[idx.maconha]) : 0;
        const coc = idx.cocaina !== -1 ? SyntheonUtils.converterNumero(row[idx.cocaina]) : 0;
        const crack = idx.crack !== -1 ? SyntheonUtils.converterNumero(row[idx.crack]) : 0;
        const pontosTotais = idx.pontosTotais !== -1 ? SyntheonUtils.converterNumero(row[idx.pontosTotais]) : 0;
        const pontosFiccao = idx.pontosFiccao !== -1 ? SyntheonUtils.converterNumero(row[idx.pontosFiccao]) : 0;

        // Validar que quantidades não são negativas
        if (!SyntheonValidador.validarQuantidadeNaoNegativa(armas) ||
            !SyntheonValidador.validarQuantidadeNaoNegativa(mac) ||
            !SyntheonValidador.validarQuantidadeNaoNegativa(coc) ||
            !SyntheonValidador.validarQuantidadeNaoNegativa(crack)) {
          logger.aviso(`Valores negativos ignorados na aba ${nomeAba}, linha ${linhaReal} para policial ${matricula}.`);
          logger.linhasIgnoradas++;
          continue;
        }

        // Inicializar ocorrência canônica se não existir no mapa
        if (!ocorrenciasPorChave[chave]) {
          ocorrenciasPorChave[chave] = {
            chave: chave,
            mike: mike,
            boe: boe,
            data: dataObjeto,
            hora: idx.hora !== -1 ? String(row[idx.hora]).trim() : '',
            natureza: idx.natureza !== -1 ? String(row[idx.natureza]).trim() : '',
            cidade: idx.cidade !== -1 ? String(row[idx.cidade]).trim() : '',
            bairro: idx.bairro !== -1 ? String(row[idx.bairro]).trim() : '',
            ais: idx.ais !== -1 ? SyntheonUtils.converterNumero(row[idx.ais]) : 0,
            policiais: {},
            pontosTotaisOcorrencia: 0
          };
        }

        const oc = ocorrenciasPorChave[chave];
        oc.pontosTotaisOcorrencia = Math.max(oc.pontosTotaisOcorrencia, pontosTotais);

        // Adicionar ou mesclar o policial na ocorrência (deduplicando e consolidando linhas correlacionadas)
        if (!oc.policiais[matricula]) {
          oc.policiais[matricula] = {
            matricula: matricula,
            nome: nomePolicial,
            grad: gradPolicial,
            pelotao: pelotaoPolicial,
            pontosFiccao: 0,
            armas: 0,
            maconha: 0,
            cocaina: 0,
            crack: 0
          };
          logger.linhasValidas++;
        } else {
          logger.duplicidades++;
        }

        const pol = oc.policiais[matricula];
        
        // Acumular quantidades físicas
        pol.armas += armas;
        pol.maconha += mac;
        pol.cocaina += coc;
        pol.crack += crack;

        // Prevenir duplicação da pontuação rateada no mesmo evento
        pol.pontosFiccao = Math.max(pol.pontosFiccao, pontosFiccao);
      }
    });

    // Converter mapa estruturado em vetor
    const vetorOcorrencias = Object.values(ocorrenciasPorChave);
    logger.ocorrenciasUnicas = vetorOcorrencias.length;
    
    // Contar total de policiais únicos
    const matriculasUnicas = new Set();
    vetorOcorrencias.forEach(oc => {
      Object.keys(oc.policiais).forEach(mat => matriculasUnicas.add(mat));
    });
    logger.policiaisUnicos = matriculasUnicas.size;

    return vetorOcorrencias;
  }
};
