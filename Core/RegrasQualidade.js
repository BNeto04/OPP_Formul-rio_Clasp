/**
 * ARQUIVO: Core/RegrasQualidade.js
 * DESCRICAO: Núcleo puro de diagnósticos e regras de qualidade do Guardião.
 * 100% desvinculado de APIs do Google Apps Script (Utilities, Session, SpreadsheetApp).
 */

const SEVERIDADES_GUARDIAO = Object.freeze({
  ERRO_TECNICO: 'ERRO TECNICO',
  CRITICO: 'CRITICO',
  ALERTA: 'ALERTA',
  OBSERVACAO: 'OBSERVACAO',
  EXCECAO_MANUAL: 'EXCECAO MANUAL'
});

class RegrasQualidade {
  /**
   * Constrói um objeto padronizado de diagnóstico de auditoria.
   */
  static criarDiagnostico({
    severidade = SEVERIDADES_GUARDIAO.ALERTA,
    codigoRegra = 'REGRA_GERAL',
    linha = 0,
    tunel = '',
    camada = 'SEMANTICA',
    diagnostico = '',
    evidencia = '',
    acaoRecomendada = '',
    sugestaoCorrecao = '',
    condicaoExcecaoManual = false
  }) {
    let arca = null;
    let AdaptadorArcaMod = typeof AdaptadorConsultaArca !== 'undefined' ? AdaptadorConsultaArca : null;
    if (!AdaptadorArcaMod && typeof require !== 'undefined') {
      try {
        AdaptadorArcaMod = require('../Dominio/ARCA/AdaptadorConsultaArca');
      } catch (e) {}
    }

    if (AdaptadorArcaMod && typeof AdaptadorArcaMod.enriquecerDiagnostico === 'function') {
      try {
        arca = AdaptadorArcaMod.enriquecerDiagnostico(codigoRegra, {
          evidencia,
          acaoRecomendada: acaoRecomendada || sugestaoCorrecao
        });
      } catch (e) {
        arca = Object.freeze({ status: 'ARCA_METADATA_UNAVAILABLE' });
      }
    } else {
      arca = Object.freeze({ status: 'ARCA_RULE_NOT_MAPPED' });
    }

    return {
      severidade,
      codigoRegra,
      linha,
      tunel,
      camada,
      diagnostico,
      evidencia,
      acaoRecomendada: acaoRecomendada || sugestaoCorrecao,
      sugestaoCorrecao: sugestaoCorrecao || acaoRecomendada,
      condicaoExcecaoManual: !!condicaoExcecaoManual,
      arca
    };
  }

  static validarTunel(tunel) {
    const alertas = [];

    // 1. Validação Fatos Físicos vs Indicadores
    tunel.eventos.forEach(evento => {
      const indicador = typeof SyntheonUtils !== 'undefined' ? SyntheonUtils.normalizarTexto(evento.indicador) : String(evento.indicador).toUpperCase();

      if (indicador.includes('MACONHA') && tunel.fatos.maconha <= 0) {
        alertas.push(RegrasQualidade.criarDiagnostico({
          severidade: SEVERIDADES_GUARDIAO.ALERTA,
          codigoRegra: 'FATO_MACONHA_AUSENTE',
          camada: 'SEMANTICA',
          linha: evento.linha,
          tunel: tunel.chave,
          diagnostico: 'Indicador de maconha sem fato correspondente no túnel.',
          evidencia: `Indicador: "${evento.indicador}" | Maconha no túnel: ${tunel.fatos.maconha}g`,
          acaoRecomendada: 'Preencha a quantidade física de maconha ou revise o indicador OCORRÊNCIA PIP.',
          sugestaoCorrecao: 'Inserir a pesagem/unidades de maconha nas colunas Q/R ou alterar o indicador em AG.'
        }));
      }

      if (indicador.includes('CRACK') && tunel.fatos.crack <= 0) {
        alertas.push(RegrasQualidade.criarDiagnostico({
          severidade: SEVERIDADES_GUARDIAO.ALERTA,
          codigoRegra: 'FATO_CRACK_AUSENTE',
          camada: 'SEMANTICA',
          linha: evento.linha,
          tunel: tunel.chave,
          diagnostico: 'Indicador de crack sem fato correspondente no túnel.',
          evidencia: `Indicador: "${evento.indicador}" | Crack no túnel: ${tunel.fatos.crack}g`,
          acaoRecomendada: 'Preencha a quantidade física de crack ou revise o indicador OCORRÊNCIA PIP.',
          sugestaoCorrecao: 'Preencher pedras/gramas de crack nas colunas S/T.'
        }));
      }

      if (indicador.includes('COCAINA') && tunel.fatos.cocaina <= 0) {
        alertas.push(RegrasQualidade.criarDiagnostico({
          severidade: SEVERIDADES_GUARDIAO.ALERTA,
          codigoRegra: 'FATO_COCAINA_AUSENTE',
          camada: 'SEMANTICA',
          linha: evento.linha,
          tunel: tunel.chave,
          diagnostico: 'Indicador de cocaína sem fato correspondente no túnel.',
          evidencia: `Indicador: "${evento.indicador}" | Cocaína no túnel: ${tunel.fatos.cocaina}g`,
          acaoRecomendada: 'Preencha a quantidade física de cocaína ou revise o indicador OCORRÊNCIA PIP.',
          sugestaoCorrecao: 'Preencher pinos/gramas de cocaína nas colunas U/V.'
        }));
      }

      if ((indicador.includes('ARMA DE FOGO') || indicador.includes('ARMA LONGA')) && tunel.fatos.armas <= 0) {
        alertas.push(RegrasQualidade.criarDiagnostico({
          severidade: SEVERIDADES_GUARDIAO.ALERTA,
          codigoRegra: 'FATO_ARMA_AUSENTE',
          camada: 'SEMANTICA',
          linha: evento.linha,
          tunel: tunel.chave,
          diagnostico: 'Indicador de arma de fogo sem fato correspondente no túnel.',
          evidencia: `Indicador: "${evento.indicador}" | Armas no túnel: ${tunel.fatos.armas}`,
          acaoRecomendada: 'Preencha a quantidade física de armas apreendidas no túnel.',
          sugestaoCorrecao: 'Informar o tipo e modelo da arma nas colunas K a N.'
        }));
      }

      if (indicador.includes('MUNICAO') && tunel.fatos.municao <= 0) {
        alertas.push(RegrasQualidade.criarDiagnostico({
          severidade: SEVERIDADES_GUARDIAO.ALERTA,
          codigoRegra: 'FATO_MUNICAO_AUSENTE',
          camada: 'SEMANTICA',
          linha: evento.linha,
          tunel: tunel.chave,
          diagnostico: 'Indicador de munição sem fato correspondente no túnel.',
          evidencia: `Indicador: "${evento.indicador}" | Munição no túnel: ${tunel.fatos.municao}`,
          acaoRecomendada: 'Preencha a quantidade de munições apreendidas ou revise o indicador.',
          sugestaoCorrecao: 'Inserir a contagem de munições na coluna O.'
        }));
      }

      if (indicador.includes('NUMERARIO') || indicador.includes('DINHEIRO')) {
        if (tunel.fatos.numerario <= 0) {
          alertas.push(RegrasQualidade.criarDiagnostico({
            severidade: SEVERIDADES_GUARDIAO.OBSERVACAO,
            codigoRegra: 'FATO_NAO_AUDITAVEL_AUTOMATICAMENTE',
            camada: 'SEMANTICA',
            linha: evento.linha,
            tunel: tunel.chave,
            diagnostico: 'Ocorrência com indicador de numerário sem valor físico registrado. Classificado como NÃO AUDITÁVEL AUTOMATICAMENTE.',
            evidencia: `Indicador: "${evento.indicador}" | Valor numérico lido: R$ 0,00`,
            acaoRecomendada: 'Preservada decisão humana: revise os recibos e BOE para registrar o valor apreendido.',
            sugestaoCorrecao: 'Confirmar nos autos se houve apreensão de numerário e anotar justificativa.'
          }));
        }
      }
    });

    // 2. Validação Matemática do Rateio de PONTOS FICÇÃO por Túnel (Divisor PIP sempre igual a 4)
    const DIVISOR_RATEIO_PIP = (typeof CONSTANTES_SYNTHEON !== 'undefined' && CONSTANTES_SYNTHEON.DIVISOR_RATEIO_PIP)
      ? CONSTANTES_SYNTHEON.DIVISOR_RATEIO_PIP
      : 4;

    // Calcula o total do túnel somando os pontos dos fatos únicos/válidos no túnel
    const pontosFatosUnicos = new Map();
    tunel.linhasFatos.forEach(lf => {
      if (lf.pontosTotaisLido > 0) {
        const chaveFato = lf.indicador ? `${lf.indicador}_${lf.pontosTotaisLido}` : `FATO_${lf.pontosTotaisLido}`;
        if (!pontosFatosUnicos.has(chaveFato)) {
          pontosFatosUnicos.set(chaveFato, lf.pontosTotaisLido);
        }
      }
    });

    let totalPontosTunel = 0;
    pontosFatosUnicos.forEach(p => { totalPontosTunel += p; });

    if (totalPontosTunel === 0 && tunel.linhasFatos.length > 0) {
      const valoresUnicos = Array.from(new Set(tunel.linhasFatos.map(lf => lf.pontosTotaisLido).filter(p => p > 0)));
      totalPontosTunel = valoresUnicos.reduce((a, b) => a + b, 0);
    }

    if (totalPontosTunel > 0) {
      const rateioEsperado = totalPontosTunel / DIVISOR_RATEIO_PIP;

      // Valida CADA valor de PONTOS FICÇÃO preenchido ou zerado nas linhas de policiais do túnel
      tunel.linhasFatos.forEach(lf => {
        if (lf.matricula) {
          const diff = Math.abs(lf.pontosFiccaoLido - rateioEsperado);
          if (lf.pontosFiccaoLido === 0 || diff > 0.01) {
            alertas.push(RegrasQualidade.criarDiagnostico({
              severidade: SEVERIDADES_GUARDIAO.ALERTA,
              codigoRegra: 'RATEIO_PONTOS_INCOERENTE',
              camada: 'SEMANTICA',
              linha: lf.linha,
              tunel: tunel.chave,
              diagnostico: 'Rateio de PONTOS FICÇÃO incoerente ou zerado para policial no túnel.',
              evidencia: `Pontos Totais do túnel: ${totalPontosTunel} | Divisor PIP: ${DIVISOR_RATEIO_PIP} | Rateio lido na linha: ${lf.pontosFiccaoLido} | Rateio esperado: ${rateioEsperado.toFixed(2)}`,
              acaoRecomendada: `Ajuste a pontuação da linha para ${rateioEsperado.toFixed(2)} pts (total de pontos da ocorrência dividido por ${DIVISOR_RATEIO_PIP}).`,
              sugestaoCorrecao: `Copiar a fórmula de rateio (=PONTOS_TOTAIS/4) para a coluna AJ da linha ${lf.linha}.`
            }));
          }
        }
      });
    }

    // 3. Classificação Estrutural de Integridade do Túnel
    const temPolicial = tunel.matriculas && tunel.matriculas.size > 0;
    const temFatos = [tunel.fatos.armas, tunel.fatos.municao, tunel.fatos.maconha, tunel.fatos.crack, tunel.fatos.cocaina].some(v => v > 0);
    const temEventos = tunel.eventos && tunel.eventos.length > 0;

    if (!temPolicial && (temFatos || temEventos)) {
      tunel.statusClassificacao = 'INVALIDO_SEM_EQUIPE';
      alertas.push(RegrasQualidade.criarDiagnostico({
        severidade: SEVERIDADES_GUARDIAO.CRITICO,
        codigoRegra: 'TUNEL_SEM_EQUIPE',
        camada: 'SEMANTICA',
        linha: (tunel.linhasFatos && tunel.linhasFatos[0]) ? tunel.linhasFatos[0].linha : 2,
        tunel: tunel.chave,
        diagnostico: 'Túnel com fatos ou indicadores registrados, mas sem nenhum policial com matrícula vinculada.',
        evidencia: `Fatos registrados sem efetivo no túnel "${tunel.chave}"`,
        acaoRecomendada: 'Adicione pelo menos um policial com matrícula funcional participante da ocorrência.',
        sugestaoCorrecao: 'Inserir a matrícula e nome do policial nas colunas AD/AE.'
      }));
    } else if (temPolicial && !temFatos && !temEventos) {
      tunel.statusClassificacao = 'INVALIDO_SEM_FATOS';
      alertas.push(RegrasQualidade.criarDiagnostico({
        severidade: SEVERIDADES_GUARDIAO.ALERTA,
        codigoRegra: 'TUNEL_SEM_FATOS',
        camada: 'SEMANTICA',
        linha: (tunel.linhasFatos && tunel.linhasFatos[0]) ? tunel.linhasFatos[0].linha : 2,
        tunel: tunel.chave,
        diagnostico: 'Túnel com policiais alocados, mas sem nenhum fato físico ou indicador PIP correspondente.',
        evidencia: `Equipe presente (${tunel.matriculas.size} integrantes), mas nenhum fato em "${tunel.chave}"`,
        acaoRecomendada: 'Preencha os dados de apreensão/indicador ou confirme se a ocorrência é de natureza sem apreensão.',
        sugestaoCorrecao: 'Preencher a apreensão correspondente ou o indicador PIP em AG.'
      }));
    } else if (temPolicial && (temFatos || temEventos)) {
      tunel.statusClassificacao = 'VALIDO';
    } else {
      tunel.statusClassificacao = 'VAZIO';
    }

    return alertas;
  }

  /**
   * Valida a política de mérito por armas para um túnel de ocorrência (TASK-M06.3-03C).
   * @param {Object} tunel - Objeto do túnel acumulado pelo Guardião.
   * @param {Object} resPeculio - Resultado do LeitorAntiguidadePeculio.lerMapaAntiguidade.
   * @param {boolean} [jaEmitiuObservacaoFonte=false] - Se true, não reemite a observação de fonte indisponível.
   * @returns {Array<Object>} Lista de diagnósticos de mérito por armas.
   */
  static validarMeritoArmasTunel(tunel, resPeculio, jaEmitiuObservacaoFonte = false) {
    if (!tunel || !tunel.fatos) return [];

    // Regra estrita: audita APENAS túneis com arma física (fogo ou artesanal)
    const qtdFogo = Number(tunel.fatos.armas || 0);
    const qtdArtesanais = Number(tunel.fatos.armasArtesanais || 0);
    if (qtdFogo <= 0 && qtdArtesanais <= 0) {
      return []; // Túnel sem arma -> Zero diagnósticos de mérito
    }

    const linhaAlvo = (tunel.linhasFatos && tunel.linhasFatos.length > 0)
      ? tunel.linhasFatos[0].linha
      : (tunel.eventos && tunel.eventos.length > 0 ? tunel.eventos[0].linha : 2);

    // Se a fonte oficial de antiguidade não foi localizada
    if (resPeculio && resPeculio.erro) {
      if (jaEmitiuObservacaoFonte) {
        return []; // Garante emissão ÚNICA por varredura de auditoria
      }
      return [RegrasQualidade.criarDiagnostico({
        severidade: SEVERIDADES_GUARDIAO.OBSERVACAO,
        codigoRegra: 'ANTIGUIDADE_FONTE_NAO_LOCALIZADA',
        linha: linhaAlvo,
        tunel: tunel.chave,
        diagnostico: 'Fonte oficial de antiguidade (EFETIVO / PECÚLIO) não localizada na planilha.',
        evidencia: `Túnel: "${tunel.chave}" | Ocorrência armada sem acesso ao mapa de antiguidade N.`,
        acaoRecomendada: 'Disponibilize a aba EFETIVO ou PECÚLIO com as colunas N e MATRÍCULA.'
      })];
    }

    const mapa = resPeculio?.mapa || resPeculio || {};

    // Reconstrói a lista de TODOS os policiais participantes do túnel (inclusive os de linhas sem armas)
    const integrantesMap = {};
    const adicionarPolicial = (p) => {
      if (!p) return;
      const mat = String(p.matricula || p.mat || '').trim();
      if (!mat) return;
      if (!integrantesMap[mat]) {
        integrantesMap[mat] = {
          matricula: mat,
          nome: p.policial || p.nome || '',
          grad: p.grad || p.graduacao || '',
          pelotao: p.pelotao || p.designacao || ''
        };
      } else {
        if (!integrantesMap[mat].nome && (p.policial || p.nome)) integrantesMap[mat].nome = p.policial || p.nome;
        if (!integrantesMap[mat].grad && (p.grad || p.graduacao)) integrantesMap[mat].grad = p.grad || p.graduacao;
        if (!integrantesMap[mat].pelotao && (p.pelotao || p.designacao)) integrantesMap[mat].pelotao = p.pelotao || p.designacao;
      }
    };

    if (Array.isArray(tunel.linhasFatos)) {
      tunel.linhasFatos.forEach(adicionarPolicial);
    }
    if (Array.isArray(tunel.policiais)) {
      tunel.policiais.forEach(adicionarPolicial);
    }

    const listaIntegrantes = Object.values(integrantesMap);
    if (listaIntegrantes.length === 0) return [];

    // Constrói objeto de ocorrência sintético para o PoliticaMeritoArmas
    const ocorrenciaSintetica = {
      data: tunel.data || '',
      mike: tunel.mike || '',
      boe: tunel.boe || '',
      armas: qtdFogo,
      armasArtesanais: qtdArtesanais,
      policiais: listaIntegrantes
    };

    let PoliticaMod = typeof PoliticaMeritoArmas !== 'undefined' ? PoliticaMeritoArmas : null;
    if (!PoliticaMod && typeof require !== 'undefined') {
      try { PoliticaMod = require('../Motor/PoliticaMeritoArmas'); } catch (e) {}
    }

    if (!PoliticaMod) return [];

    const resMerito = PoliticaMod.processarMeritoArmas([ocorrenciaSintetica], mapa);
    if (!Array.isArray(resMerito) || resMerito.length === 0) return [];

    const item = resMerito[0];
    if (item.status === 'PROCESSADO') {
      return []; // Líder resolvido sem alerta
    }

    const alertas = [];

    if (item.motivoPendente === 'ANTIGUIDADE_AUSENTE') {
      const pmsSemN = (item.integrantes || []).filter(p => p.numN === null || p.numN === undefined);
      const nomesSemN = pmsSemN.map(p => `${p.grad ? p.grad + ' ' : ''}${p.nome || ''} (${p.matricula})`.trim()).join(', ');

      alertas.push(RegrasQualidade.criarDiagnostico({
        severidade: SEVERIDADES_GUARDIAO.CRITICO,
        codigoRegra: 'MERITO_ARMAS_ANTIGUIDADE_AUSENTE',
        linha: linhaAlvo,
        tunel: tunel.chave,
        diagnostico: 'Antiguidade N ausente no Pecúlio para integrante(s) de ocorrência com arma.',
        evidencia: `Túnel: "${tunel.chave}" | Integrante(s) sem N: "${nomesSemN}"`,
        acaoRecomendada: 'Cadastre a antiguidade N dos policiais envolvidos na aba EFETIVO/PECÚLIO para permitir o cômputo do mérito.'
      }));
    } else if (item.motivoPendente === 'EMPATE_ANTIGUIDADE') {
      const pmsComN = (item.integrantes || []).filter(p => p.numN !== null && p.numN !== undefined);
      const menorNVal = pmsComN.length > 0 ? Math.min(...pmsComN.map(p => Number(p.numN))) : (item.menorN || '');
      const pmsEmpatados = (item.integrantes || []).filter(p => Number(p.numN) === Number(menorNVal));
      const nomesEmpatados = pmsEmpatados.map(p => `${p.grad ? p.grad + ' ' : ''}${p.nome || ''} (${p.matricula})`.trim()).join(', ');

      alertas.push(RegrasQualidade.criarDiagnostico({
        severidade: SEVERIDADES_GUARDIAO.CRITICO,
        codigoRegra: 'MERITO_ARMAS_EMPATE_ANTIGUIDADE',
        linha: linhaAlvo,
        tunel: tunel.chave,
        diagnostico: 'Empate de antiguidade N entre integrantes de ocorrência com arma.',
        evidencia: `Túnel: "${tunel.chave}" | Policiais empatados no menor N (${menorNVal}): "${nomesEmpatados}"`,
        acaoRecomendada: 'Ajuste a ordem N dos integrantes no Pecúlio para desempate do líder.'
      }));
    }

    return alertas;
  }

  static validarDataMike(data, mike, linha, tunel) {
    if (!data || !mike) return null;
    const somenteNumeros = String(mike).replace(/\D/g, '');
    if (somenteNumeros.length < 8) return null;

    let diaData = 0, mesData = 0, anoData = 0;
    if (data instanceof Date && !isNaN(data.getTime())) {
      diaData = data.getDate();
      mesData = data.getMonth() + 1;
      anoData = data.getFullYear();
    } else {
      const matchData = String(data).trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (matchData) {
        diaData = parseInt(matchData[1], 10);
        mesData = parseInt(matchData[2], 10);
        anoData = parseInt(matchData[3], 10);
      }
    }

    if (!anoData || !mesData || !diaData) return null;

    const mikeAno = parseInt(somenteNumeros.substring(0, 4), 10);
    const mikeMes = parseInt(somenteNumeros.substring(4, 6), 10);
    const mikeDia = parseInt(somenteNumeros.substring(6, 8), 10);

    if (mikeAno >= 2020 && mikeAno <= 2030 && mikeMes >= 1 && mikeMes <= 12 && mikeDia >= 1 && mikeDia <= 31) {
      if (mikeAno !== anoData || mikeMes !== mesData || mikeDia !== diaData) {
        return RegrasQualidade.criarDiagnostico({
          severidade: SEVERIDADES_GUARDIAO.ALERTA,
          codigoRegra: 'MIKE_DATA_DIVERGENTE',
          linha,
          tunel,
          diagnostico: 'Divergência entre data da planilha e estrutura temporal do MIKE.',
          evidencia: `DATA na coluna: ${String(diaData).padStart(2,'0')}/${String(mesData).padStart(2,'0')}/${anoData} | Data no MIKE: ${String(mikeDia).padStart(2,'0')}/${String(mikeMes).padStart(2,'0')}/${mikeAno}`,
          acaoRecomendada: 'Confirme a data e o MIKE da ocorrência para sanar a incompatibilidade cronológica.'
        });
      }
    }

    return null;
  }

  static validarCoerenciaCruzadaMikes(mikesMapa) {
    const diagnosticos = [];
    Object.values(mikesMapa).forEach(entry => {
      if (entry.boes.size > 1) {
        entry.linhas.forEach(item => {
          diagnosticos.push(RegrasQualidade.criarDiagnostico({
            severidade: SEVERIDADES_GUARDIAO.ALERTA,
            codigoRegra: 'MIKE_BOE_DIVERGENTE',
            linha: item.linha,
            tunel: item.chave,
            diagnostico: `Mesmo MIKE (${entry.mike}) associado a BOEs diferentes: ${Array.from(entry.boes).join(', ')}.`,
            evidencia: `MIKE: ${entry.mike} | BOEs encontrados: ${Array.from(entry.boes).join(', ')}`,
            acaoRecomendada: 'Confirme o BOE: o mesmo MIKE aparece associado a códigos de ocorrência/BOE diferentes.'
          }));
        });
      }

      if (entry.datas.size > 1) {
        entry.linhas.forEach(item => {
          diagnosticos.push(RegrasQualidade.criarDiagnostico({
            severidade: SEVERIDADES_GUARDIAO.ALERTA,
            codigoRegra: 'MIKE_DATAS_DIVERGENTES',
            linha: item.linha,
            tunel: item.chave,
            diagnostico: `Mesmo MIKE (${entry.mike}) utilizado em datas incompatíveis: ${Array.from(entry.datas).join(', ')}.`,
            evidencia: `MIKE: ${entry.mike} | Datas encontradas: ${Array.from(entry.datas).join(', ')}`,
            acaoRecomendada: 'Verifique a data da ocorrência: o mesmo MIKE foi registrado em datas diferentes.'
          }));
        });
      }
    });
    return diagnosticos;
  }

  /**
   * Consulta o catálogo dinâmico da Tabela PIP.
   * Se o catálogo for null (aba indisponível), retorna true para não gerar falso erro/observação.
   */
  static indicadorConhecido(indicador, catalogoPIP = null) {
    if (!indicador) return true;
    
    if (catalogoPIP === null) {
      return true;
    }

    const norm = typeof SyntheonUtils !== 'undefined' ? SyntheonUtils.normalizarTexto(indicador) : String(indicador).toUpperCase().trim();

    if (Array.isArray(catalogoPIP) && catalogoPIP.length > 0) {
      const normCat = catalogoPIP.map(c => typeof SyntheonUtils !== 'undefined' ? SyntheonUtils.normalizarTexto(c) : String(c).toUpperCase().trim());
      return normCat.some(item => norm.includes(item) || item.includes(norm));
    }

    return false;
  }

  static localizarColunasCalculadas(headers) {
    const colunas = [
      { nome: 'PELOTAO', aliases: ['PELOTAO', 'PELOTÃO'] },
      { nome: 'GRAD', aliases: ['GRAD', 'GRADUACAO', 'GRADUAÇÃO', 'POSTO'] },
      { nome: 'MATRICULA', aliases: ['MATRICULA (FÓRMULA)', 'MATRÍCULA (FÓRMULA)', 'MATRICULA', 'MATRÍCULA'] },
      { nome: 'TOTAL DE MACONHA', indicePadrao: 18, aliases: ['TOTAL DE MACONHA'] },
      { nome: 'DIVIDIDO MAC', indicePadrao: 19, aliases: ['DIVIDIDO MAC'] },
      { nome: 'TOTAL CRACK', indicePadrao: 22, aliases: ['TOTAL CRACK (GR)', 'TOTAL CRACK'] },
      { nome: 'TOTAL DE COCAINA', indicePadrao: 25, aliases: ['TOTAL DE COCAINA', 'TOTAL COCAINA'] },
      { nome: 'DIVIDIDO COC', indicePadrao: 26, aliases: ['DIVIDIDO COC'] },
      { nome: 'PONTOS TOTAIS', indicePadrao: 34, aliases: ['PONTOS TOTAIS', 'PONTUACAO BRUTA'] },
      { nome: 'PONTOS FICCAO', indicePadrao: 35, aliases: ['PONTOS FICCAO (1/4)', 'PONTOS FICCAO'] },
      { nome: 'CHAVE OCORRENCIA', indicePadrao: 36, aliases: ['CHAVE OCORRENCIA', 'CHAVE'] }
    ];

    const resultado = [];
    colunas.forEach(coluna => {
      const encontrado = RegrasQualidade.localizarPorAliases(headers, coluna.aliases);
      if (encontrado !== -1) {
        resultado.push({ nome: coluna.nome, indice: encontrado });
      } else if (typeof coluna.indicePadrao === 'number' && coluna.indicePadrao < headers.length) {
        resultado.push({ nome: coluna.nome, indice: coluna.indicePadrao });
      }
    });
    return resultado;
  }

  static validarFormulasObrigatorias(formulaRow, noteRow, colunasCalculadas, valueRow = null) {
    const alertas = [];
    const ERROS_PLANILHA = ['#NOME?', '#NAME?', '#REF!', '#VALOR!', '#VALUE!', '#N/D', '#N/A', '#DIV/0!', '#NULL!'];

    colunasCalculadas.forEach(coluna => {
      if (!formulaRow || coluna.indice < 0 || coluna.indice >= formulaRow.length) return;
      const formula = String(formulaRow[coluna.indice] || '').trim();
      const valor = valueRow ? String(valueRow[coluna.indice] || '').trim() : '';
      const nota = (noteRow && noteRow[coluna.indice]) ? String(noteRow[coluna.indice]).trim() : '';

      // 1. Checagem de Erros Sintáticos e de Referência (#NOME?, #REF!, etc.)
      const erroEncontrado = ERROS_PLANILHA.find(e => formula.toUpperCase().includes(e) || valor.toUpperCase().includes(e));
      if (erroEncontrado) {
        alertas.push(RegrasQualidade.criarDiagnostico({
          severidade: SEVERIDADES_GUARDIAO.CRITICO,
          codigoRegra: 'FORMULA_CORROMPIDA_ERRO_SINTAXE',
          camada: 'SINTATICA',
          linha: 0,
          diagnostico: `Erro sintático ou de referência (${erroEncontrado}) detectado na fórmula da coluna ${coluna.nome}.`,
          evidencia: `Coluna: ${coluna.nome} | Fórmula/Valor: "${formula || valor}"`,
          acaoRecomendada: `Restaure a fórmula correta clonando da linha 2 (copyTo) ou corrigindo o nome da função/referência.`,
          sugestaoCorrecao: `Copiar a fórmula padrão da célula modelo linha 2 para a coluna ${coluna.nome}.`
        }));
        return;
      }

      // 2. Checagem de Ausência de Fórmula em coluna calculada
      if (!formula) {
        if (nota.toUpperCase().startsWith('EXCECAO:')) {
          const motivo = nota.substring(8).trim();
          alertas.push(RegrasQualidade.criarDiagnostico({
            severidade: SEVERIDADES_GUARDIAO.EXCECAO_MANUAL,
            codigoRegra: 'EXCECAO_MANUAL_JUSTIFICADA',
            camada: 'SINTATICA',
            linha: 0,
            diagnostico: `Ajuste manual em ${coluna.nome} justificado por nota: "${motivo}".`,
            evidencia: `Nota de Exceção: "${nota}"`,
            acaoRecomendada: 'Exceção manual justificada pelo operador. Nenhuma ação necessária.',
            sugestaoCorrecao: 'Preservada decisão manual registrada em nota.',
            condicaoExcecaoManual: true
          }));
        } else {
          alertas.push(RegrasQualidade.criarDiagnostico({
            severidade: SEVERIDADES_GUARDIAO.ALERTA,
            codigoRegra: 'FORMULA_AUSENTE',
            camada: 'SINTATICA',
            linha: 0,
            diagnostico: `Fórmula ausente em coluna calculada: ${coluna.nome}.`,
            evidencia: `Coluna: ${coluna.nome} (índice: ${coluna.indice}) sem fórmula e sem nota EXCECAO:`,
            acaoRecomendada: `Restaure a fórmula de ${coluna.nome} a partir de uma linha válida ou registre uma nota iniciada por EXCECAO: explicando o motivo.`,
            sugestaoCorrecao: `Replicar fórmula da linha 2 para a coluna ${coluna.nome}.`
          }));
        }
      }
    });
    return alertas;
  }

  static criarTunel(chave) {
    return {
      chave,
      fatos: { armas: 0, municao: 0, maconha: 0, crack: 0, cocaina: 0, numerario: 0 },
      matriculas: new Set(),
      linhasFatos: [],
      eventos: []
    };
  }

  static acumularLinhaTunel(tunel, row, idx, linha, indicador) {
    tunel.fatos.armas += RegrasQualidade.numero(row[idx.armaLinha]) + RegrasQualidade.numero(row[idx.armas]);
    tunel.fatos.municao += RegrasQualidade.numero(row[idx.municao]);
    tunel.fatos.maconha += RegrasQualidade.numero(row[idx.maconha]);
    tunel.fatos.crack += RegrasQualidade.numero(row[idx.crack]);
    tunel.fatos.cocaina += RegrasQualidade.numero(row[idx.cocaina]);

    const matricula = RegrasQualidade.texto(row[idx.matricula]);
    if (matricula) {
      const matSanitizada = typeof SyntheonUtils !== 'undefined' ? SyntheonUtils.limparMatricula(matricula) : matricula.replace(/\D/g, '');
      if (matSanitizada) {
        tunel.matriculas.add(matSanitizada);
      }
    }

    const pontosTotaisLido = idx.pontosTotais !== -1 ? RegrasQualidade.numero(row[idx.pontosTotais]) : 0;
    const pontosFiccaoLido = idx.pontosFiccao !== -1 ? RegrasQualidade.numero(row[idx.pontosFiccao]) : 0;

    const policial = idx.policial !== -1 ? RegrasQualidade.texto(row[idx.policial]) : '';
    const grad = idx.grad !== -1 ? RegrasQualidade.texto(row[idx.grad]) : '';
    const pelotao = idx.pelotao !== -1 ? RegrasQualidade.texto(row[idx.pelotao]) : '';

    tunel.linhasFatos.push({
      linha,
      matricula,
      policial,
      grad,
      pelotao,
      pontosTotaisLido,
      pontosFiccaoLido,
      indicador
    });

    if (indicador) {
      tunel.eventos.push({ linha, indicador });
    }
  }

  static validarCabecalhosObrigatorios(idx) {
    const faltantes = [];
    if (idx.mike === -1) faltantes.push('MIKE');
    if (idx.matricula === -1) faltantes.push('MATRICULA');
    if (idx.indicador === -1) faltantes.push('OCORRENCIA PIP');
    if (idx.imputado === -1) faltantes.push('IMPUTADO?');
    if (faltantes.length > 0) {
      const err = new Error(`Cabeçalhos obrigatórios não encontrados: ${faltantes.join(', ')}`);
      err.severidade = SEVERIDADES_GUARDIAO.ERRO_TECNICO;
      throw err;
    }
  }

  static temFatoOperacional(row, idx) {
    return [
      idx.armaLinha,
      idx.armas,
      idx.municao,
      idx.maconha,
      idx.crack,
      idx.cocaina
    ].some(col => RegrasQualidade.numero(row[col]) > 0);
  }

  static localizarPorAliases(headers, aliases) {
    const norm = (t) => typeof SyntheonUtils !== 'undefined' ? SyntheonUtils.normalizarTexto(t) : String(t).toUpperCase().trim();
    const opcoes = aliases.map(alias => norm(alias));
    for (const opcao of opcoes) {
      const idx = headers.indexOf(opcao);
      if (idx !== -1) return idx;
    }
    for (const opcao of opcoes) {
      const idx = headers.findIndex(h => h.includes(opcao));
      if (idx !== -1) return idx;
    }
    return -1;
  }

  static chaveTunel(data, mike, boe) {
    let dataTexto = '';
    if (data instanceof Date && !isNaN(data.getTime())) {
      const dia = String(data.getDate()).padStart(2, '0');
      const mes = String(data.getMonth() + 1).padStart(2, '0');
      const ano = data.getFullYear();
      dataTexto = `${dia}/${mes}/${ano}`;
    } else {
      dataTexto = RegrasQualidade.texto(data);
    }
    return `${dataTexto}|${mike}|${boe}`;
  }

  static mikeSuspeito(mike) {
    const somenteNumeros = String(mike).replace(/\D/g, '');
    return somenteNumeros === '2026' || (somenteNumeros.length > 0 && somenteNumeros.length < 8);
  }

  static imputadoValido(valor) {
    const normalizado = typeof SyntheonUtils !== 'undefined' ? SyntheonUtils.normalizarTexto(valor) : String(valor).toUpperCase().trim();
    return normalizado === 'COM IMPUTADO' || normalizado === 'SEM IMPUTADO';
  }

  static texto(valor) {
    return String(valor || '').trim();
  }

  static numero(valor) {
    return typeof SyntheonUtils !== 'undefined' ? SyntheonUtils.converterNumero(valor) : (Number(valor) || 0);
  }

  static unicos(alertas) {
    return alertas.filter((alerta, index) => alertas.indexOf(alerta) === index);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { RegrasQualidade, SEVERIDADES_GUARDIAO };
}
