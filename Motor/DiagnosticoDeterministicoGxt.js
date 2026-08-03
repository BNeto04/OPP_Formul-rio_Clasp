/**
 * ARQUIVO: Motor/DiagnosticoDeterministicoGxt.js
 * DESCRIÇÃO: Motor puro de Diagnóstico Determinístico de Túneis do GXT (TASK-M06.3-05I.3B).
 * REGRA DE OURO: Invoca REALMENTE o Adaptador2026.extrairFatos() para converter os dados da planilha em RegistroCanonico
 * e alimentar a PoliticaMeritoArmas.processarMeritoArmas(), garantindo 100% de rastreabilidade e fidelidade ao pipeline real.
 * Mantém 2 coleções estritamente separadas:
 *   1. fatosFisicos: leitura crua de linhas físicas para exibição e reconciliação (40 = 33 incluídas + 7 não incluídas).
 *   2. ocorrenciasNormalizadas: criada EXCLUSIVAMENTE a partir de Adaptador2026.extrairFatos(), sem qualquer mutação posterior
 *      e SEM NENHUM FALLBACK PARA QDT ARMAS (qtdArmasReplicada).
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
   * Padroniza data para YYYY-MM-DD ou formato BR.
   */
  static formatarData(dt) {
    if (!dt) return '';
    if (dt instanceof Date) {
      if (isNaN(dt.getTime())) return '';
      const d = String(dt.getDate()).padStart(2, '0');
      const m = String(dt.getMonth() + 1).padStart(2, '0');
      const y = dt.getFullYear();
      return `${y}-${m}-${d}`;
    }
    const str = String(dt).trim();
    if (str.includes('T')) return str.split('T')[0];
    return str.split(' ')[0];
  }

  /**
   * Diagnostica a reconciliação determinística para um mês.
   * @param {Object|Array} sheetData - Matriz 2D da aba mensal ou objeto de mock.
   * @param {Object} [mapaAntiguidade={}] - Mapa { matricula: numeroN } do Pecúlio.
   * @param {string} [nomeMes='ABR2026'] - Nome do mês analisado.
   * @param {Object} [metaPeculio={}] - Metadados de status/erro do Pecúlio ({ erro, detalheErro }).
   * @returns {Object} Resultado do diagnóstico com contagens separadas de Fogo e Artesanal.
   */
  static diagnosticarMes(sheetData, mapaAntiguidade = {}, nomeMes = 'ABR2026', metaPeculio = {}) {
    const erroPeculio = metaPeculio ? metaPeculio.erro : null;
    const peculioValido = !erroPeculio && mapaAntiguidade && Object.keys(mapaAntiguidade).length > 0;

    if (!sheetData) {
      return {
        mes: nomeMes,
        peculioValido: false,
        erroPeculio: erroPeculio || 'SEM_DADOS',
        fogoFisicas: 0,
        fogoGxt: 0,
        fogoNaoIncluidas: 0,
        artesanaisFisicas: 0,
        artesanaisGxt: 0,
        fatosFisicos: [],
        resumoMotivos: {},
        reconciliacaoTexto: 'Nenhum dado fornecido para diagnóstico.'
      };
    }

    // 1. INVOCAÇÃO REAL DO ADAPTADOR 2026 — extrai RegistroCanonico exatamente como CompiladorGxt
    let registrosCanonicos = [];
    if (AdaptadorMod && typeof AdaptadorMod.extrairFatos === 'function') {
      try {
        registrosCanonicos = AdaptadorMod.extrairFatos(sheetData, { aba: nomeMes, versao: '2026' }, {});
      } catch (eAdapt) {
        registrosCanonicos = [];
      }
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

    if (rawRows.length < 2 && registrosCanonicos.length === 0) {
      return {
        mes: nomeMes,
        peculioValido: peculioValido,
        erroPeculio: erroPeculio,
        fogoFisicas: 0,
        fogoGxt: 0,
        fogoNaoIncluidas: 0,
        artesanaisFisicas: 0,
        artesanaisGxt: 0,
        fatosFisicos: [],
        resumoMotivos: {},
        reconciliacaoTexto: 'Aba sem dados válidos para diagnóstico.'
      };
    }

    const fatosFisicos = [];
    const ocorrenciasNormalizadas = [];

    // 2. Converte RegistroCanonico retornado pelo Adaptador2026 para ocorrenciasNormalizadas
    // REGRA DE OURO: IDENTICO AO COMPILADOR GXT, SEM MUTACAO POSTERIOR E SEM FALLBACK PARA QDT ARMAS (qtdArmasReplicada)
    if (registrosCanonicos.length > 0) {
      registrosCanonicos.forEach(reg => {
        const ocInfo = reg.payload ? reg.payload.ocorrencia : (reg.ocorrencia || reg);
        const pmsRaw = reg.payload ? reg.payload.policiais : (Array.isArray(reg.policiais) ? reg.policiais : []);

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
            if (valArmaFisica > 0) totalArmasFogo += valArmaFisica;
            tipoArmaDetectado = 'ARTESANAL';
          } else {
            if (valArmaFisica > 0) totalArmasFogo += valArmaFisica;
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

        const dataIso = DiagnosticoDeterministicoGxt.formatarData(ocInfo.data);
        const mike = String(ocInfo.mike || reg.mike || '').trim();
        const boe = String(ocInfo.boe || reg.boe || '').trim();

        ocorrenciasNormalizadas.push({
          data: dataIso || ocInfo.data,
          mike: mike,
          boe: boe,
          armas: totalArmasFogo,
          armasFogo: totalArmasFogo,
          armasArtesanais: totalArmasArtesanais,
          tipoArma: tipoArmaDetectado || 'FOGO',
          isArtesanal: tipoArmaDetectado === 'ARTESANAL',
          policiais: pmsFormatados
        });
      });
    }

    // 3. Varredura auditada de linhas físicas (com propagação de datas) EXCLUSIVAMENTE para fatosFisicos
    if (rawRows.length >= 2) {
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

      let ultimaDataValida = '';

      for (let r = 1; r < rawRows.length; r++) {
        const row = rawRows[r];
        const linhaFisica = r + 1; // 1-indexed

        const rawData = idxData !== -1 ? row[idxData] : '';
        let dataIso = DiagnosticoDeterministicoGxt.formatarData(rawData);
        if (dataIso) {
          ultimaDataValida = dataIso;
        } else if (ultimaDataValida) {
          dataIso = ultimaDataValida;
        }

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
        if (!isNaN(numVal) && numVal > 0 && !isArtesanal) {
          numFogo = numVal;
        }

        const numArtesanal = isArtesanal ? 1 : 0;
        const chaveTunel = `${dataIso}_${mike}_${boe}`.toUpperCase();

        if (numFogo > 0 || numArtesanal > 0) {
          fatosFisicos.push({
            linhaFisica: linhaFisica,
            dataOriginal: rawData || ultimaDataValida,
            dataIso: dataIso,
            mike: mike,
            boe: boe,
            matricula: mat,
            policial: pol,
            grad: grad,
            pelotao: pel,
            armaFogo: numFogo,
            armaArtesanal: numArtesanal,
            isArtesanal: isArtesanal,
            chaveTunel: chaveTunel
          });
        }
      }
    } else if (registrosCanonicos.length > 0 && fatosFisicos.length === 0) {
      registrosCanonicos.forEach((reg, idx) => {
        const oc = reg.payload ? reg.payload.ocorrencia : (reg.ocorrencia || reg);
        const pols = reg.payload ? reg.payload.policiais : (reg.policiais || []);
        const p0 = pols[0] || {};

        const dataIso = DiagnosticoDeterministicoGxt.formatarData(oc.data);
        const mike = String(oc.mike || '').trim();
        const boe = String(oc.boe || '').trim();
        const valArma = oc.armaFato !== undefined ? oc.armaFato : (oc.armas || 0);
        const isArtesanal = !!oc.isArtesanal || String(oc.tipoArma || '').toUpperCase().includes('ARTESANAL');
        const numFogo = (!isNaN(Number(valArma)) && Number(valArma) > 0 && !isArtesanal) ? Number(valArma) : 0;
        const numArtesanal = isArtesanal ? 1 : 0;
        const chaveTunel = `${dataIso}_${mike}_${boe}`.toUpperCase();

        if (numFogo > 0 || numArtesanal > 0) {
          fatosFisicos.push({
            linhaFisica: idx + 2,
            dataOriginal: oc.data,
            dataIso: dataIso,
            mike: mike,
            boe: boe,
            matricula: p0.matricula || '',
            policial: p0.nome || '',
            grad: p0.grad || '',
            pelotao: p0.pelotao || '',
            armaFogo: numFogo,
            armaArtesanal: numArtesanal,
            isArtesanal: isArtesanal,
            chaveTunel: chaveTunel
          });
        }
      });
    }

    // 4. Normaliza mapa de antiguidade para garantir casamento exato com e sem hífen
    const mapaNormPec = {};
    if (mapaAntiguidade) {
      Object.keys(mapaAntiguidade).forEach(k => {
        mapaNormPec[k] = mapaAntiguidade[k];
        const raw = String(k).replace(/[^0-9X]/gi, '').toUpperCase();
        if (raw) {
          mapaNormPec[raw] = mapaAntiguidade[k];
          if (raw.length > 1 && raw.indexOf('-') === -1) {
            const comH = raw.slice(0, -1) + '-' + raw.slice(-1);
            mapaNormPec[comH] = mapaAntiguidade[k];
          }
        }
      });
    }

    // 5. Processamento idêntico ao GXT via PoliticaMeritoArmas (usando ocorrenciasNormalizadas INTACTO)
    let resultadosTuneis = [];
    if (peculioValido && PoliticaMeritoMod && typeof PoliticaMeritoMod.processarMeritoArmas === 'function') {
      resultadosTuneis = PoliticaMeritoMod.processarMeritoArmas(ocorrenciasNormalizadas, mapaNormPec);
    }

    const mapaTuneisGxt = {};
    resultadosTuneis.forEach(t => {
      mapaTuneisGxt[t.chaveTunel] = t;
    });

    let fogoFisicas = 0;
    let fogoGxt = 0;
    let fogoNaoIncluidas = 0;
    let artesanaisFisicas = 0;

    const resumoMotivos = {};

    const falhaAdaptadorSemFatos = (registrosCanonicos.length === 0 && fatosFisicos.length > 0);

    // 6. Cruzamento determinístico linha a linha
    fatosFisicos.forEach(fato => {
      fogoFisicas += fato.armaFogo;
      artesanaisFisicas += fato.armaArtesanal;

      const resTunel = mapaTuneisGxt[fato.chaveTunel];

      let statusFato = 'NÃO INCLUÍDO';
      let motivoFato = '';
      let liderResolvido = '—';
      let numN = '—';
      let ordPeculio = '—';
      let contribFogo = 0;

      if (!peculioValido) {
        statusFato = 'FALHA_PECULIO';
        motivoFato = `PECULIO_INACESSIVEL — ${erroPeculio || 'Fonte do Pecúlio indisponível'}`;
      } else if (!fato.matricula && (!resTunel || !resTunel.lider)) {
        motivoFato = 'MATRICULA_AUSENTE — Linha armada sem matrícula cadastrada na equipe';
      } else if (falhaAdaptadorSemFatos) {
        statusFato = 'FALHA_ADAPTADOR_SEM_FATOS';
        motivoFato = 'FALHA_ADAPTADOR_SEM_FATOS — Adaptador2026 não extraiu fatos canônicos da aba';
      } else if (resTunel && resTunel.status === 'PROCESSADO') {
        statusFato = 'PROCESSADO';
        contribFogo = fato.isArtesanal ? 0 : fato.armaFogo;
        fogoGxt += contribFogo;
        motivoFato = fato.boe
          ? 'INCLUÍDO_COM_SUCESSO — Túnel homologado e mérito atribuído'
          : 'INCLUÍDO_COM_BOE_VAZIO — BOE vazio agrupou por DATA|MIKE| e foi homologado';

        if (resTunel.lider) {
          const nomeL = typeof resTunel.lider === 'string' ? resTunel.lider : (resTunel.lider.nome || resTunel.lider.policial || resTunel.lider.matricula || '');
          const gradL = resTunel.grad || (typeof resTunel.lider === 'object' ? resTunel.lider.grad : '') || '';
          liderResolvido = `${gradL} ${nomeL}`.trim();
          numN = resTunel.numN !== undefined ? resTunel.numN : (resTunel.numeroN !== undefined ? resTunel.numeroN : '—');
          ordPeculio = resTunel.ordPeculio || '—';
        }
      } else if (resTunel) {
        statusFato = resTunel.status || 'PENDENTE_AUDITORIA';
        motivoFato = fato.boe
          ? `${resTunel.motivoPendente || resTunel.status} — Túnel retido por pendência de N no Pecúlio`
          : 'BOE_VAZIO_E_PENDENTE — BOE vazio com pendência de antiguidade N no túnel';
      } else {
        motivoFato = 'TUNEL_NAO_ARMADO — Fato não gerou túnel de mérito no motor';
      }

      if (statusFato !== 'PROCESSADO') {
        fogoNaoIncluidas += fato.armaFogo;
      }

      resumoMotivos[motivoFato] = (resumoMotivos[motivoFato] || 0) + (fato.armaFogo || fato.armaArtesanal);

      fato.statusFato = statusFato;
      fato.motivoFato = motivoFato;
      fato.liderResolvido = liderResolvido;
      fato.numN = numN;
      fato.ordPeculio = ordPeculio;
      fato.contribFogo = contribFogo;
    });

    let reconciliacaoTexto = '';
    if (!peculioValido) {
      reconciliacaoTexto = `ALERTA PECÚLIO (${nomeMes}): Fonte de antiguidade inacessível (${erroPeculio || 'ACESSO_NEGADO'}). 0 de ${fogoFisicas} armas processadas.`;
    } else if (falhaAdaptadorSemFatos) {
      reconciliacaoTexto = `ALERTA ADAPTADOR (${nomeMes}): Adaptador2026 retornou 0 fatos canônicos em aba com dados. 0 de ${fogoFisicas} armas processadas.`;
    } else {
      reconciliacaoTexto = `RECONCILIAÇÃO GXT (${nomeMes}): Armas de Fogo = ${fogoFisicas} físicas [${fogoGxt} incluídas no GXT + ${fogoNaoIncluidas} não incluídas]. Artesanais = ${artesanaisFisicas} descritivas.`;
    }

    return {
      mes: nomeMes,
      peculioValido: peculioValido,
      erroPeculio: erroPeculio,
      falhaAdaptadorSemFatos: falhaAdaptadorSemFatos,
      fogoFisicas: fogoFisicas,
      fogoGxt: fogoGxt,
      fogoNaoIncluidas: fogoNaoIncluidas,
      artesanaisFisicas: artesanaisFisicas,
      artesanaisGxt: 0,
      fatosFisicos: fatosFisicos,
      resumoMotivos: resumoMotivos,
      reconciliacaoTexto: reconciliacaoTexto
    };
  }

  /**
   * Monta a matriz 2D para ser gravada exclusivamente na aba descartável [DIAGNOSTICO] Gxt.
   */
  static montarMatrizDiagnostico(diagRes) {
    const statusPec = diagRes.peculioValido ? 'DISPONÍVEL' : `INACESSÍVEL (${diagRes.erroPeculio || 'FALHA'})`;

    const matriz = [
      ['PAINEL DE DIAGNÓSTICO DETERMINÍSTICO DE TÚNEIS — GXT', '', '', '', '', '', '', '', '', '', '', ''],
      ['Mês Analisado:', diagRes.mes || 'ABR2026', '', '', '', '', '', '', '', '', '', ''],
      ['Status do Pecúlio:', statusPec, '', '', '', '', '', '', '', '', '', ''],
      ['Armas de Fogo Físicas:', diagRes.fogoFisicas || 0, '', '', '', '', '', '', '', '', '', ''],
      ['Armas de Fogo no GXT:', diagRes.fogoGxt || 0, '', '', '', '', '', '', '', '', '', ''],
      ['Armas de Fogo Não Incluídas:', diagRes.fogoNaoIncluidas || 0, '', '', '', '', '', '', '', '', '', ''],
      ['Armas Artesanais Físicas:', `${diagRes.artesanaisFisicas || 0} (Descritivas em texto)`, '', '', '', '', '', '', '', '', '', ''],
      ['Equação de Reconciliação:', diagRes.reconciliacaoTexto || '', '', '', '', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '', '', '', '', ''],
      ['Linha', 'Data Efetiva', 'MIKE', 'BOE', 'Matrícula', 'Policial', 'Arma Fogo', 'Artesanal', 'Chave Túnel GXT', 'Líder Resolvido', 'Status GXT', 'Diagnóstico & Motivo Literal']
    ];

    const fatos = Array.isArray(diagRes.fatosFisicos) ? diagRes.fatosFisicos : [];

    fatos.forEach(f => {
      matriz.push([
        f.linhaFisica,
        f.dataIso || f.dataOriginal || '',
        f.mike || '—',
        f.boe || '—',
        f.matricula || 'NÃO INFORMADA',
        `${f.grad || ''} ${f.policial || ''}`.trim(),
        f.armaFogo,
        f.isArtesanal ? '1 (ARTESANAL)' : '0',
        f.chaveTunel || '—',
        f.liderResolvido || '—',
        f.statusFato || 'NÃO INCLUÍDO',
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
      diagRes.fogoFisicas,
      diagRes.artesanaisFisicas,
      '—',
      '—',
      `Fogo GXT: ${diagRes.fogoGxt}`,
      `Não Incluídas: ${diagRes.fogoNaoIncluidas}`
    ]);

    return matriz;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DiagnosticoDeterministicoGxt };
}
