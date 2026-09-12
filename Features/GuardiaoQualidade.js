/**
 * ARQUIVO: Features/GuardiaoQualidade.js
 * DESCRICAO: Motor central do Guardião da Qualidade Operacional (M05/M06).
 * Realiza varreduras estáticas de integridade sobre abas mensais de ocorrências
 * com diagnósticos estruturados e acionamento de renderização e destaques AM.
 */
class GuardiaoQualidade {
  /**
   * Normaliza textos convertendo hífens, underlines e múltiplos espaços para comparação flexível.
   */
  static normalizarNomeFlexivel(texto) {
    if (!texto) return '';
    let norm = typeof SyntheonUtils !== 'undefined'
      ? SyntheonUtils.normalizarTexto(texto)
      : String(texto).toUpperCase().trim();
    return norm.replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  /**
   * Resolve a aba canonica do catalogo PIP (fix do achado de homologacao G01 #117).
   * O alias solto 'PIP' apontava para a PRIMEIRA aba contendo 'PIP' (ex.: PIP_SELECAO_LIVRE),
   * lendo o catalogo errado. Aqui exige-se 'TABELA' + 'PIP' no nome, com prioridade para os
   * nomes canonicos, descartando copias/backups/rascunhos. Sem candidata inequivoca retorna
   * null -> o chamador segue para o modo limitado explicito (nunca catalogo silenciosamente errado).
   * @param {object} parent planilha (Spreadsheet)
   * @returns {object|null} aba do catalogo ou null
   */
  static localizarAbaCatalogoPIP(parent) {
    if (!parent || typeof parent.getSheets !== 'function') return null;
    const norm = n => GuardiaoQualidade.normalizarNomeFlexivel(n);
    const CANONICOS = ['TABELA DE PONTOS PIP', 'TABELA PIP', 'TABELA DE INDICADORES'];
    const DESCARTE = ['COPIA', 'CÓPIA', 'BKP', 'BACKUP', 'RASCUNHO', 'MODELO', 'EXEMPLO', 'TESTE', 'GABARITO'];

    const candidatas = parent.getSheets()
      .map(sheet => ({ sheet, nome: norm(sheet.getName()) }))
      .filter(c => (c.nome.indexOf('TABELA') !== -1 && c.nome.indexOf('PIP') !== -1) || CANONICOS.indexOf(c.nome) !== -1)
      .filter(c => !DESCARTE.some(d => c.nome.indexOf(d) !== -1));

    if (!candidatas.length) return null;

    candidatas.sort((a, b) => {
      const ia = CANONICOS.indexOf(a.nome);
      const ib = CANONICOS.indexOf(b.nome);
      const rankA = ia === -1 ? 99 : ia;
      const rankB = ib === -1 ? 99 : ib;
      if (rankA !== rankB) return rankA - rankB;
      return a.nome.length - b.nome.length;
    });

    return candidatas[0].sheet;
  }

  /**
   * Localiza a LINHA de cabecalho do catalogo PIP (fix complementar G01 #117, 10/09/2026).
   * A aba real do catalogo ("tabela de pontos PIP") tem linhas de titulo/espaco antes da
   * tabela (o cabecalho "Nivel | Ocorrencia | SEM IMPUTADO" esta na 4a linha). Assumir a
   * linha 1 fazia o catalogo sair como indisponivel (MODO_LIMITADO_CATALOGO_PIP) mesmo com
   * a aba correta localizada. Varre as primeiras linhas e devolve o indice do cabecalho.
   * @param {Array<Array>} vals matriz da aba
   * @param {Array<string>} [aliases] aliases da coluna de indicador
   * @returns {number} indice (0-based) da linha de cabecalho, ou -1 se nao encontrada
   */
  static localizarLinhaCabecalhoCatalogo(vals, aliases) {
    const lista = Array.isArray(vals) ? vals : [];
    const aliasesNorm = (aliases || ['INDICADOR PIP', 'INDICADOR', 'OCORRENCIA PIP', 'OCORRENCIA'])
      .map(a => GuardiaoQualidade.normalizarNomeFlexivel(a));
    const limite = Math.min(lista.length, 15);
    for (let i = 0; i < limite; i++) {
      const hs = (lista[i] || []).map(h => GuardiaoQualidade.normalizarNomeFlexivel(h));
      for (const al of aliasesNorm) {
        if (hs.indexOf(al) !== -1) return i;
        if (hs.some(h => h && h.indexOf(al) !== -1)) return i;
      }
    }
    return -1;
  }

  static varrerAba(sheet, fontePeculioExterna = null) {
    const nomeAbaNorm = GuardiaoQualidade.normalizarNomeFlexivel(sheet.getName());
    if (nomeAbaNorm.includes('AUDITORIA') || nomeAbaNorm.includes('HISTORICO')) {
      const err = new Error('O Guardião não deve ser executado sobre abas de relatório ou histórico. Selecione uma aba mensal de ocorrências (ex: JUL2026).');
      err.severidade = typeof SEVERIDADES_GUARDIAO !== 'undefined' ? SEVERIDADES_GUARDIAO.ERRO_TECNICO : 'ERRO TECNICO';
      throw err;
    }

    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    if (lastRow < 2 || lastCol < 1) {
      return { alertas: 0, linhas: 0, tuneis: 0, diagnosticos: [] };
    }

    // Leitura do catálogo da Tabela PIP por aliases flexíveis de aba e coluna
    let catalogoPIP = null;
    let modoLimitadoPIP = false;

    if (sheet && typeof sheet.getParent === 'function') {
      try {
        const parent = sheet.getParent();
        if (parent) {
          // G01 #117 (achado de homologacao 10/09/2026): o alias solto 'PIP' casava com a
          // PRIMEIRA aba contendo 'PIP' (ex.: PIP_SELECAO_LIVRE / PIP_JUL_2026.v5) e o catalogo
          // era lido da aba errada -> indicadores validos viravam INDICADOR_DESCONHECIDO e a
          // cobertura saia PARCIAL por falso motivo. A resolucao agora exige 'TABELA' + 'PIP',
          // prioriza os nomes canonicos e descarta copias/backups; sem match inequivoco => null
          // (modo limitado explicito, nunca catalogo silenciosamente errado).
          let abaPIP = GuardiaoQualidade.localizarAbaCatalogoPIP(parent);

          if (!abaPIP && typeof parent.getSheetByName === 'function') {
            for (const alias of ['TABELA DE PONTOS PIP', 'TABELA PIP', 'TABELA DE INDICADORES']) {
              abaPIP = parent.getSheetByName(alias);
              if (abaPIP) break;
            }
          }

          if (abaPIP) {
            const valsPIP = abaPIP.getDataRange().getValues();
            if (valsPIP && valsPIP.length > 0) {
              const aliasesColIndicador = ['INDICADOR PIP', 'INDICADOR', 'OCORRENCIA PIP', 'OCORRENCIA'];

              // G01 #117 (fix complementar 10/09/2026): a aba real do catalogo tem titulo/espacos
              // antes do cabecalho. Antes assumia-se valsPIP[0]; agora a linha de cabecalho e
              // LOCALIZADA (localizarLinhaCabecalhoCatalogo) e os dados comecam logo apos ela.
              const headerRowIdx = GuardiaoQualidade.localizarLinhaCabecalhoCatalogo(valsPIP, aliasesColIndicador);

              if (headerRowIdx !== -1) {
                const headersPIP = valsPIP[headerRowIdx].map(h => GuardiaoQualidade.normalizarNomeFlexivel(h));

                let colIdx = -1;
                for (const alias of aliasesColIndicador) {
                  const aliasNorm = GuardiaoQualidade.normalizarNomeFlexivel(alias);
                  colIdx = headersPIP.indexOf(aliasNorm);
                  if (colIdx !== -1) break;
                }
                if (colIdx === -1) {
                  for (const alias of aliasesColIndicador) {
                    const aliasNorm = GuardiaoQualidade.normalizarNomeFlexivel(alias);
                    colIdx = headersPIP.findIndex(h => h.includes(aliasNorm));
                    if (colIdx !== -1) break;
                  }
                }

                if (colIdx !== -1) {
                  const listaIndicadores = valsPIP.slice(headerRowIdx + 1).map(r => String(r[colIdx] || '').trim()).filter(Boolean);
                  if (listaIndicadores.length > 0) {
                    catalogoPIP = listaIndicadores;
                  }
                }
              }
            }
          }
        }
      } catch (e) {
        catalogoPIP = null;
      }
    }

    if (!catalogoPIP || catalogoPIP.length === 0) {
      catalogoPIP = null;
      modoLimitadoPIP = true;
    }

    const rangeDados = sheet.getRange(1, 1, lastRow, lastCol);
    const dados = rangeDados.getValues();
    const formulas = rangeDados.getFormulas();
    const notes = (rangeDados.getNotes && typeof rangeDados.getNotes === 'function')
      ? rangeDados.getNotes()
      : Array.from({ length: lastRow }, () => Array(lastCol).fill(''));

    const headers = dados[0].map(h => SyntheonUtils.normalizarTexto(h));
    const loc = (chaveAlias) => SyntheonUtils.localizarColuna(headers, chaveAlias);

    const idx = {
      data: loc('DATA'),
      mike: loc('MIKE'),
      boe: loc('BOE'),
      matricula: loc('MATRICULA'),
      policial: loc('POLICIAL'),
      armaLinha: loc('ARMA_LINHA'),
      tipoArma: loc('TIPO_ARMA'),
      armas: loc('ARMAS'),
      municao: RegrasQualidade.localizarPorAliases(headers, ['MUNICAO']),
      maconha: loc('MACONHA'),
      crack: loc('CRACK'),
      cocaina: loc('COCAINA'),
      indicador: loc('INDICADOR_PIP'),
      imputado: loc('IMPUTADO'),
      pontosTotais: loc('PONTOS_TOTAIS'),
      pontosFiccao: loc('PONTOS_FICCAO'),
      alerta: loc('ALERTA_INTEGRIDADE'),
      calculadas: RegrasQualidade.localizarColunasCalculadas(headers)
    };

    if (idx.alerta === -1) {
      idx.alerta = 38; // Coluna AM (0-based: 38)
      sheet.getRange(1, idx.alerta + 1).setValue('Alerta Integridade');
    }

    RegrasQualidade.validarCabecalhosObrigatorios(idx);

    const alertasPorLinha = Array.from({ length: lastRow - 1 }, () => []);
    const tuneis = {};
    const mikesMapa = {};
    const matriculasOcorrencias = {};

    if (modoLimitadoPIP && alertasPorLinha.length > 0) {
      alertasPorLinha[0].push(RegrasQualidade.criarDiagnostico({
        severidade: typeof SEVERIDADES_GUARDIAO !== 'undefined' ? SEVERIDADES_GUARDIAO.OBSERVACAO : 'OBSERVACAO',
        codigoRegra: 'MODO_LIMITADO_CATALOGO_PIP',
        linha: 2,
        diagnostico: 'Aba "Tabela PIP" não encontrada no arquivo. Auditoria de indicadores operando em modo limitado.',
        evidencia: 'Catálogo PIP indisponível',
        acaoRecomendada: 'Certifique-se de que a aba Tabela PIP esteja presente na planilha para validação de indicadores.'
      }));
    }

    for (let i = 1; i < dados.length; i++) {
      const row = dados[i];
      const linha = i + 1;
      const mike = RegrasQualidade.texto(row[idx.mike]);
      const boe = idx.boe !== -1 ? RegrasQualidade.texto(row[idx.boe]) : '';
      const data = idx.data !== -1 ? row[idx.data] : '';
      const matricula = RegrasQualidade.texto(row[idx.matricula]);
      const policial = idx.policial !== -1 ? RegrasQualidade.texto(row[idx.policial]) : '';
      const indicador = RegrasQualidade.texto(row[idx.indicador]);
      const imputado = RegrasQualidade.texto(row[idx.imputado]);
      const temFato = RegrasQualidade.temFatoOperacional(row, idx);
      const temParticipacao = !!matricula || !!policial;
      const temEvento = !!indicador || !!imputado || temFato;
      const temLinhaOperacional = !!mike || temParticipacao || temEvento;
      const chave = RegrasQualidade.chaveTunel(data, mike, boe);

      if (temLinhaOperacional) {
        RegrasQualidade.validarFormulasObrigatorias(formulas[i], notes[i], idx.calculadas, row).forEach(diag => {
          diag.linha = linha;
          diag.tunel = chave;
          alertasPorLinha[i - 1].push(diag);
        });
      }

      if (!mike) {
        if (temParticipacao || temEvento) {
          alertasPorLinha[i - 1].push(RegrasQualidade.criarDiagnostico({
            severidade: typeof SEVERIDADES_GUARDIAO !== 'undefined' ? SEVERIDADES_GUARDIAO.CRITICO : 'CRITICO',
            codigoRegra: 'OCORRENCIA_ORFA',
            camada: 'SEMANTICA',
            linha,
            diagnostico: 'Ocorrencia orfa: linha com participacao/evento sem MIKE.',
            evidencia: `Policial: "${policial}", Matrícula: "${matricula}", Indicador: "${indicador}"`,
            acaoRecomendada: 'Preencha o MIKE completo da ocorrência; a linha possui participação ou evento registrado.',
            sugestaoCorrecao: 'Inserir o número do MIKE na coluna D.'
          }));
        }
        continue;
      }

      // Mapeamento cruzado do MIKE para validações entre linhas da planilha
      if (!mikesMapa[mike]) {
        mikesMapa[mike] = { mike, boes: new Set(), datas: new Set(), linhas: [] };
      }
      if (boe) mikesMapa[mike].boes.add(boe);
      const dataFormatada = chave.split('|')[0];
      if (dataFormatada) mikesMapa[mike].datas.add(dataFormatada);
      mikesMapa[mike].linhas.push({ linha, boe, dataTexto: dataFormatada, chave });

      // Mapa matricula -> ocorrencias (para deteccao de vinculo multiplo na mesma data - #115)
      if (matricula) {
        if (!matriculasOcorrencias[matricula]) {
          matriculasOcorrencias[matricula] = { linhas: [] };
        }
        matriculasOcorrencias[matricula].linhas.push({ linha, data: dataFormatada, mike });
      }

      if (RegrasQualidade.mikeSuspeito(mike)) {
        alertasPorLinha[i - 1].push(RegrasQualidade.criarDiagnostico({
          severidade: typeof SEVERIDADES_GUARDIAO !== 'undefined' ? SEVERIDADES_GUARDIAO.ALERTA : 'ALERTA',
          codigoRegra: 'MIKE_SUSPEITO',
          camada: 'SINTATICA',
          linha,
          tunel: chave,
          diagnostico: `MIKE suspeito: ${mike}.`,
          evidencia: `MIKE lido: "${mike}"`,
          acaoRecomendada: 'Confirme o MIKE: número formatado ou tamanho de dígitos fora do padrão.',
          sugestaoCorrecao: 'Verificar se o MIKE contém o número de ocorrência completo da PMPE.'
        }));
      }

      const diagDataMike = RegrasQualidade.validarDataMike(data, mike, linha, chave);
      if (diagDataMike) {
        alertasPorLinha[i - 1].push(diagDataMike);
      }

      if (indicador && !imputado) {
        alertasPorLinha[i - 1].push(RegrasQualidade.criarDiagnostico({
          severidade: typeof SEVERIDADES_GUARDIAO !== 'undefined' ? SEVERIDADES_GUARDIAO.ALERTA : 'ALERTA',
          codigoRegra: 'EVENTO_INCOMPLETO_AG',
          camada: 'SEMANTICA',
          linha,
          tunel: chave,
          diagnostico: 'Evento incompleto: AG preenchido sem IMPUTADO?.',
          evidencia: `OCORRÊNCIA PIP (AG): "${indicador}" | IMPUTADO? (AH): vazio`,
          acaoRecomendada: 'Revise AG/AH: o evento foi declared sem definir COM IMPUTADO ou SEM IMPUTADO em AH.',
          sugestaoCorrecao: 'Selecionar "COM IMPUTADO" ou "SEM IMPUTADO" na coluna AH.'
        }));
      }

      if (imputado && !indicador) {
        alertasPorLinha[i - 1].push(RegrasQualidade.criarDiagnostico({
          severidade: typeof SEVERIDADES_GUARDIAO !== 'undefined' ? SEVERIDADES_GUARDIAO.ALERTA : 'ALERTA',
          codigoRegra: 'IMPUTADO_SEM_EVENTO_AH',
          camada: 'SEMANTICA',
          linha,
          tunel: chave,
          diagnostico: 'Imputado sem evento: AH preenchido sem OCORRENCIA PIP.',
          evidencia: `IMPUTADO? (AH): "${imputado}" | OCORRÊNCIA PIP (AG): vazio`,
          acaoRecomendada: 'Preencha o indicador OCORRÊNCIA PIP em AG ou limpe o campo IMPUTADO? em AH.',
          sugestaoCorrecao: 'Preencher o indicador PIP em AG ou limpar AH.'
        }));
      }

      if (imputado && !RegrasQualidade.imputadoValido(imputado)) {
        alertasPorLinha[i - 1].push(RegrasQualidade.criarDiagnostico({
          severidade: typeof SEVERIDADES_GUARDIAO !== 'undefined' ? SEVERIDADES_GUARDIAO.ALERTA : 'ALERTA',
          codigoRegra: 'IMPUTADO_INVALIDO',
          camada: 'SEMANTICA',
          linha,
          tunel: chave,
          diagnostico: `Valor de imputado invalido: ${imputado}.`,
          evidencia: `IMPUTADO? lido: "${imputado}"`,
          acaoRecomendada: 'Selecione "COM IMPUTADO" ou "SEM IMPUTADO" na coluna AH.',
          sugestaoCorrecao: 'Corrigir para "COM IMPUTADO" ou "SEM IMPUTADO".'
        }));
      }

      if (indicador && !RegrasQualidade.indicadorConhecido(indicador, catalogoPIP)) {
        alertasPorLinha[i - 1].push(RegrasQualidade.criarDiagnostico({
          severidade: typeof SEVERIDADES_GUARDIAO !== 'undefined' ? SEVERIDADES_GUARDIAO.OBSERVACAO : 'OBSERVACAO',
          codigoRegra: 'INDICADOR_DESCONHECIDO',
          camada: 'SEMANTICA',
          linha,
          tunel: chave,
          diagnostico: `Indicador PIP não mapeado na tabela padrão: "${indicador}". Registrado como observação.`,
          evidencia: `Indicador: "${indicador}"`,
          acaoRecomendada: 'Verifique se o indicador está correto ou se necessita inclusão na Tabela PIP.',
          sugestaoCorrecao: 'Revisar se o título corresponde à Tabela PIP oficial.'
        }));
      }

      // Regra ARCA-ARMAS-002: arma artesanal NAO entra na quantidade fisica (ARMA). TIPO
      // artesanal com ARMA preenchido e inconsistencia que infla a soma oficial de armas.
      const tipoArmaLinha = idx.tipoArma !== -1 ? RegrasQualidade.texto(row[idx.tipoArma]) : '';
      const armaLinhaValor = idx.armaLinha !== -1 ? RegrasQualidade.texto(row[idx.armaLinha]) : '';
      const tipoEhArtesanal = /ARTESANAL|CASEIR/.test(tipoArmaLinha.toUpperCase());
      const armaPreenchida = armaLinhaValor !== '' && armaLinhaValor !== '0';
      if (tipoEhArtesanal && armaPreenchida) {
        alertasPorLinha[i - 1].push(RegrasQualidade.criarDiagnostico({
          severidade: typeof SEVERIDADES_GUARDIAO !== 'undefined' ? SEVERIDADES_GUARDIAO.ALERTA : 'ALERTA',
          codigoRegra: 'ARMA_ARTESANAL_INCONSISTENTE',
          camada: 'SEMANTICA',
          linha,
          tunel: chave,
          diagnostico: 'Arma artesanal com quantidade fisica (ARMA) preenchida: artesanal nao entra na quantidade fisica (deve ficar vazio).',
          evidencia: `TIPO: "${tipoArmaLinha}" | ARMA: "${armaLinhaValor}"`,
          acaoRecomendada: 'Zere a coluna ARMA na linha da arma artesanal (a participacao em QDT ARMAS permanece intacta).',
          sugestaoCorrecao: 'Limpar ARMA (coluna L) na linha de TIPO artesanal.'
        }));
      }

      if (policial && !matricula) {
        alertasPorLinha[i - 1].push(RegrasQualidade.criarDiagnostico({
          severidade: typeof SEVERIDADES_GUARDIAO !== 'undefined' ? SEVERIDADES_GUARDIAO.ALERTA : 'ALERTA',
          codigoRegra: 'MATRICULA_AUSENTE',
          camada: 'SEMANTICA',
          linha,
          tunel: chave,
          diagnostico: 'Matricula ausente: linha com policial sem matricula.',
          evidencia: `Policial: "${policial}" | Matrícula: vazia`,
          acaoRecomendada: 'Preencha a matrícula funcional do policial para garantir o cômputo da produtividade.',
          sugestaoCorrecao: 'Inserir a matrícula funcional na coluna AD.'
        }));
      } else if (matricula && !policial) {
        alertasPorLinha[i - 1].push(RegrasQualidade.criarDiagnostico({
          severidade: typeof SEVERIDADES_GUARDIAO !== 'undefined' ? SEVERIDADES_GUARDIAO.OBSERVACAO : 'OBSERVACAO',
          codigoRegra: 'POLICIAL_SEM_NOME',
          camada: 'SEMANTICA',
          linha,
          tunel: chave,
          diagnostico: 'Matricula preenchida sem nome de policial na linha.',
          evidencia: `Matrícula: "${matricula}" | Policial: vazio`,
          acaoRecomendada: 'Confirme o nome do policial vinculado à matrícula para rastreabilidade do efetivo.'
        }));
      }

      if (!tuneis[chave]) {
        tuneis[chave] = RegrasQualidade.criarTunel(chave);
      }
      RegrasQualidade.acumularLinhaTunel(tuneis[chave], row, idx, linha, indicador);
    }

    // Leitura oficial de antiguidade N via LeitorAntiguidadePeculio (TASK-M06.3-03D)
    let resPeculio = { mapa: {}, mapaCompleto: {}, erro: 'ANTIGUIDADE_FONTE_NAO_LOCALIZADA' };
    let LeitorMod = typeof LeitorAntiguidadePeculio !== 'undefined' ? LeitorAntiguidadePeculio : null;
    if (!LeitorMod && typeof require !== 'undefined') {
      try { LeitorMod = require('../Leitura/LeitorAntiguidadePeculio'); } catch (e) {}
    }
    if (LeitorMod) {
      let fonteParaPeculio = fontePeculioExterna;

      // Obtém o ID do Pecúlio exclusivamente via CONFIG_SYNTHEON.obterIdPeculio()
      let ConfigMod = typeof CONFIG_SYNTHEON !== 'undefined' ? CONFIG_SYNTHEON : null;
      if (!ConfigMod && typeof require !== 'undefined') {
        try { ConfigMod = require('../Core/Config'); } catch (e) {}
      }

      if (!fonteParaPeculio && ConfigMod && typeof ConfigMod.obterIdPeculio === 'function') {
        const idPeculio = ConfigMod.obterIdPeculio();
        if (idPeculio && typeof SpreadsheetApp !== 'undefined' && typeof SpreadsheetApp.openById === 'function') {
          try {
            fonteParaPeculio = SpreadsheetApp.openById(idPeculio);
          } catch (e) {}
        }
      }

      // PROIBIDO fallback para sheet.getParent()! O Pecúlio NUNCA é lido da planilha de ocorrências.
      if (fonteParaPeculio) {
        resPeculio = LeitorMod.lerMapaAntiguidade(fonteParaPeculio);
      }
    }

    let observacaoFonteEmitida = false;

    // Validações por túnel (fatos vs indicadores, rateio matemático e mérito por armas)
    Object.values(tuneis).forEach(tunel => {
      RegrasQualidade.validarTunel(tunel).forEach(diag => {
        if (diag.linha >= 2 && diag.linha - 2 < alertasPorLinha.length) {
          alertasPorLinha[diag.linha - 2].push(diag);
        }
      });

      // Validação do Mérito por Armas (TASK-M06.3-03C)
      const diagsMerito = RegrasQualidade.validarMeritoArmasTunel(tunel, resPeculio, observacaoFonteEmitida);
      diagsMerito.forEach(diag => {
        if (diag.codigoRegra === 'ANTIGUIDADE_FONTE_NAO_LOCALIZADA') {
          observacaoFonteEmitida = true;
        }
        if (diag.linha >= 2 && diag.linha - 2 < alertasPorLinha.length) {
          alertasPorLinha[diag.linha - 2].push(diag);
        }
      });
    });

    // Validações de coerência cruzada de MIKEs (BOEs e Datas conflitantes entre linhas)
    RegrasQualidade.validarCoerenciaCruzadaMikes(mikesMapa).forEach(diag => {
      if (diag.linha >= 2 && diag.linha - 2 < alertasPorLinha.length) {
        alertasPorLinha[diag.linha - 2].push(diag);
      }
    });

    // Detecção de túnel FRAGMENTADO (#114): mesmo MIKE com BOE/data únicos, porém >1 chave
    let SaudeMod = typeof SaudeTuneis !== 'undefined' ? SaudeTuneis : null;
    if (!SaudeMod && typeof require !== 'undefined') {
      try { SaudeMod = require('../Core/SaudeTuneis').SaudeTuneis; } catch (e) {}
    }
    if (SaudeMod && typeof SaudeMod.detectarFragmentados === 'function') {
      SaudeMod.detectarFragmentados(mikesMapa).forEach(frag => {
        (frag.linhas || []).forEach(linhaFrag => {
          if (linhaFrag >= 2 && linhaFrag - 2 < alertasPorLinha.length) {
            const chaveFrag = String(frag.chaves && frag.chaves[0] || '');
            alertasPorLinha[linhaFrag - 2].push(RegrasQualidade.criarDiagnostico({
              severidade: SEVERIDADES_GUARDIAO.ALERTA,
              codigoRegra: 'TUNEL_FRAGMENTADO',
              camada: 'SINTATICA',
              linha: linhaFrag,
              tunel: chaveFrag,
              diagnostico: `Túnel fragmentado: mesmo MIKE (${frag.mike}) aparece em ${frag.chaves.length} chaves distintas com BOE/data idênticos.`,
              evidencia: `MIKE: ${frag.mike} | Chaves: ${frag.chaves.join(' | ')} | Linhas: ${frag.linhas.join(', ')}`,
              acaoRecomendada: 'Unifique o padrão de data/chave do MIKE (ex.: datas como Date ou texto no MESMO formato) para consolidar o túnel.'
            }));
          }
        });
      });
    }

    // Policial vinculado a 2+ MIKEs na MESMA data exige confirmacao humana (#115)
    let CoberturaMod = typeof CoberturaAuditoria !== 'undefined' ? CoberturaAuditoria : null;
    if (!CoberturaMod && typeof require !== 'undefined') {
      try { CoberturaMod = require('../Core/CoberturaAuditoria').CoberturaAuditoria; } catch (e) {}
    }
    if (CoberturaMod && typeof CoberturaMod.detectarMatriculaMultiplaNaMesmaData === 'function') {
      CoberturaMod.detectarMatriculaMultiplaNaMesmaData(matriculasOcorrencias, RegrasQualidade.criarDiagnostico.bind(RegrasQualidade)).forEach(diagMat => {
        if (diagMat.linha >= 2 && diagMat.linha - 2 < alertasPorLinha.length) {
          alertasPorLinha[diagMat.linha - 2].push(diagMat);
        }
      });
    }

    const saida = alertasPorLinha.map(diagnosticos => {
      const textos = RegrasQualidade.unicos(
        diagnosticos.map(d => typeof d === 'object' && d !== null ? (d.diagnostico || d.mensagem || '') : String(d))
      ).filter(Boolean);
      return [textos.join(' | ')];
    });

    RendererAuditoriaSaude.prepararColunaAlertas(sheet, idx.alerta, saida.length);
    sheet.getRange(2, idx.alerta + 1, saida.length, 1).setValues(saida);

    // Chamada explícita de destaque passando a referência real idx.alerta (0-based) e os textos de saída
    RendererAuditoriaSaude.aplicarDestaquesAlertasAM_(sheet, idx.alerta, saida);

    const todosDiagnosticos = alertasPorLinha.flat();

    RendererAuditoriaSaude.renderizarLog(sheet, todosDiagnosticos, tuneis, lastRow - 1);

    // Quadro de saúde por túnel (#114) - aditivo, nunca substitui o retorno histórico
    let quadroSaude = null;
    if (SaudeMod && typeof SaudeMod.montarQuadroSaude === 'function') {
      quadroSaude = SaudeMod.montarQuadroSaude(tuneis, mikesMapa, todosDiagnosticos);
    }

    // Cobertura de auditoria (#115): o que NAO pôde ser verificado -> nunca falso verde
    let cobertura = null;
    if (CoberturaMod && typeof CoberturaMod.montarCobertura === 'function') {
      cobertura = CoberturaMod.montarCobertura({
        catalogoPIP,
        resPeculio,
        diagnosticos: todosDiagnosticos
      });
    }

    return {
      alertas: saida.filter(row => row[0]).length,
      linhas: lastRow - 1,
      tuneis: Object.keys(tuneis).length,
      diagnosticos: todosDiagnosticos,
      saude: quadroSaude,
      cobertura
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = GuardiaoQualidade;
}

function executarGuardiaoQualidade() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  const sheet = ss.getActiveSheet();

  try {
    const resultado = GuardiaoQualidade.varrerAba(sheet);
    ui.alert(
      'Guardiao da Qualidade',
      `Aba ${sheet.getName()} auditada.\nTuneis: ${resultado.tuneis}\nLinhas analisadas: ${resultado.linhas}\nLinhas com alerta: ${resultado.alertas}`,
      ui.ButtonSet.OK
    );
    return resultado;
  } catch (erro) {
    const mensagem = erro && erro.stack ? erro.stack : String(erro);
    Logger.log(mensagem);
    ui.alert('Erro no Guardiao da Qualidade', mensagem, ui.ButtonSet.OK);
    throw erro;
  }
}
