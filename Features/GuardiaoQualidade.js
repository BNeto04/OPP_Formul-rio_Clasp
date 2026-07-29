/**
 * ARQUIVO: Features/GuardiaoQualidade.js
 * DESCRICAO: Observador de boas práticas de preenchimento das ocorrências.
 * Trabalha internamente com objetos de diagnóstico estruturados.
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

  static varrerAba(sheet) {
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
          const aliasesAbaPIP = ['TABELA PIP', 'PIP', 'TABELA DE INDICADORES'];
          let abaPIP = null;

          if (typeof parent.getSheets === 'function') {
            const todasAbas = parent.getSheets();
            abaPIP = todasAbas.find(s => {
              const nomeNorm = GuardiaoQualidade.normalizarNomeFlexivel(s.getName());
              return aliasesAbaPIP.some(alias => nomeNorm === alias || nomeNorm.includes(alias));
            });
          }

          if (!abaPIP && typeof parent.getSheetByName === 'function') {
            for (const alias of aliasesAbaPIP) {
              abaPIP = parent.getSheetByName(alias);
              if (abaPIP) break;
            }
          }

          if (abaPIP) {
            const valsPIP = abaPIP.getDataRange().getValues();
            if (valsPIP && valsPIP.length > 0) {
              const headersPIP = valsPIP[0].map(h => GuardiaoQualidade.normalizarNomeFlexivel(h));
              const aliasesColIndicador = ['INDICADOR PIP', 'INDICADOR', 'OCORRENCIA PIP', 'OCORRENCIA'];

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

              // Se não encontrou cabeçalho válido de indicador, NÃO assume coluna A!
              if (colIdx !== -1) {
                const listaIndicadores = valsPIP.slice(1).map(r => String(r[colIdx] || '').trim()).filter(Boolean);
                if (listaIndicadores.length > 0) {
                  catalogoPIP = listaIndicadores;
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
        RegrasQualidade.validarFormulasObrigatorias(formulas[i], notes[i], idx.calculadas).forEach(diag => {
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
            linha,
            diagnostico: 'Ocorrencia orfa: linha com participacao/evento sem MIKE.',
            evidencia: `Policial: "${policial}", Matrícula: "${matricula}", Indicador: "${indicador}"`,
            acaoRecomendada: 'Preencha o MIKE completo da ocorrência; a linha possui participação ou evento registrado.'
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

      if (RegrasQualidade.mikeSuspeito(mike)) {
        alertasPorLinha[i - 1].push(RegrasQualidade.criarDiagnostico({
          severidade: typeof SEVERIDADES_GUARDIAO !== 'undefined' ? SEVERIDADES_GUARDIAO.ALERTA : 'ALERTA',
          codigoRegra: 'MIKE_SUSPEITO',
          linha,
          tunel: chave,
          diagnostico: `MIKE suspeito: ${mike}.`,
          evidencia: `MIKE lido: "${mike}"`,
          acaoRecomendada: 'Confirme o MIKE: número formatado ou tamanho de dígitos fora do padrão.'
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
          linha,
          tunel: chave,
          diagnostico: 'Evento incompleto: AG preenchido sem IMPUTADO?.',
          evidencia: `OCORRÊNCIA PIP (AG): "${indicador}" | IMPUTADO? (AH): vazio`,
          acaoRecomendada: 'Revise AG/AH: o evento foi declarado sem definir COM IMPUTADO ou SEM IMPUTADO em AH.'
        }));
      }

      if (imputado && !indicador) {
        alertasPorLinha[i - 1].push(RegrasQualidade.criarDiagnostico({
          severidade: typeof SEVERIDADES_GUARDIAO !== 'undefined' ? SEVERIDADES_GUARDIAO.ALERTA : 'ALERTA',
          codigoRegra: 'IMPUTADO_SEM_EVENTO_AH',
          linha,
          tunel: chave,
          diagnostico: 'Imputado sem evento: AH preenchido sem OCORRENCIA PIP.',
          evidencia: `IMPUTADO? (AH): "${imputado}" | OCORRÊNCIA PIP (AG): vazio`,
          acaoRecomendada: 'Preencha o indicador OCORRÊNCIA PIP em AG ou limpe o campo IMPUTADO? em AH.'
        }));
      }

      if (imputado && !RegrasQualidade.imputadoValido(imputado)) {
        alertasPorLinha[i - 1].push(RegrasQualidade.criarDiagnostico({
          severidade: typeof SEVERIDADES_GUARDIAO !== 'undefined' ? SEVERIDADES_GUARDIAO.ALERTA : 'ALERTA',
          codigoRegra: 'IMPUTADO_INVALIDO',
          linha,
          tunel: chave,
          diagnostico: `Valor de imputado invalido: ${imputado}.`,
          evidencia: `IMPUTADO? lido: "${imputado}"`,
          acaoRecomendada: 'Selecione "COM IMPUTADO" ou "SEM IMPUTADO" na coluna AH.'
        }));
      }

      if (indicador && !RegrasQualidade.indicadorConhecido(indicador, catalogoPIP)) {
        alertasPorLinha[i - 1].push(RegrasQualidade.criarDiagnostico({
          severidade: typeof SEVERIDADES_GUARDIAO !== 'undefined' ? SEVERIDADES_GUARDIAO.OBSERVACAO : 'OBSERVACAO',
          codigoRegra: 'INDICADOR_DESCONHECIDO',
          linha,
          tunel: chave,
          diagnostico: `Indicador PIP não mapeado na tabela padrão: "${indicador}". Registrado como observação.`,
          evidencia: `Indicador: "${indicador}"`,
          acaoRecomendada: 'Verifique se o indicador está correto ou se necessita inclusão na Tabela PIP.'
        }));
      }

      if (policial && !matricula) {
        alertasPorLinha[i - 1].push(RegrasQualidade.criarDiagnostico({
          severidade: typeof SEVERIDADES_GUARDIAO !== 'undefined' ? SEVERIDADES_GUARDIAO.ALERTA : 'ALERTA',
          codigoRegra: 'MATRICULA_AUSENTE',
          linha,
          tunel: chave,
          diagnostico: 'Matricula ausente: linha com policial sem matricula.',
          evidencia: `Policial: "${policial}" | Matrícula: vazia`,
          acaoRecomendada: 'Preencha a matrícula funcional do policial para garantir o cômputo da produtividade.'
        }));
      }

      if (!tuneis[chave]) {
        tuneis[chave] = RegrasQualidade.criarTunel(chave);
      }
      RegrasQualidade.acumularLinhaTunel(tuneis[chave], row, idx, linha, indicador);
    }

    // Validações por túnel (fatos vs indicadores e rateio matemático)
    Object.values(tuneis).forEach(tunel => {
      RegrasQualidade.validarTunel(tunel).forEach(diag => {
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

    const saida = alertasPorLinha.map(diagnosticos => {
      const textos = RegrasQualidade.unicos(
        diagnosticos.map(d => typeof d === 'object' && d !== null ? (d.diagnostico || d.mensagem || '') : String(d))
      ).filter(Boolean);
      return [textos.join(' | ')];
    });

    RendererAuditoriaSaude.prepararColunaAlertas(sheet, idx.alerta, saida.length);
    sheet.getRange(2, idx.alerta + 1, saida.length, 1).setValues(saida);

    RendererAuditoriaSaude.renderizarLog(sheet, saida, tuneis);

    const todosDiagnosticos = alertasPorLinha.flat();

    return {
      alertas: saida.filter(row => row[0]).length,
      linhas: lastRow - 1,
      tuneis: Object.keys(tuneis).length,
      diagnosticos: todosDiagnosticos
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
