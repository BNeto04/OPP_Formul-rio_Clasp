'use strict';

/**
 * ARQUIVO: Entrada/SeletorMesesGuardiao.js
 * DESCRICAO: Seletor de abas mensais auditaveis do Guardiao da Qualidade (G01 #113).
 * Lista SOMENTE abas mensais validas (exclui AUDITORIA/HISTORICO/Tabela PIP e auxiliares),
 * permite UM mes, VARIOS meses ou TODOS, consolida por mes e nunca esconde falha de uma aba.
 *
 * Regra do produto: o Guardiao NAO corrige dados. Detecta, explica e localiza.
 * Regra #115 antecipada: se nada for auditavel, responde NAO_AUDITAVEL (nunca falso verde).
 */

const MESES_ABREV = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

// Padroes de nome de aba que NUNCA sao abas mensais auditaveis.
const PADROES_EXCLUSAO = [
  'AUDITORIA', 'HISTORICO', 'TABELA PIP', 'PIP', 'PECULIO', 'AUX',
  'CONTROLE', 'MODELO', 'EXEMPLO', 'TESTE', 'GABARITO', 'BKP', 'BACKUP', 'RASCUNHO', 'GRAVITY', 'LOG'
];

class SeletorMesesGuardiao {
  /**
   * Normaliza para comparacao flexivel sem depender de SyntheonUtils (uso em Node e Apps Script).
   */
  static normalizar(nome) {
    if (!nome) return '';
    return String(nome).toUpperCase().trim().replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  static ehAbaExcluida(nomeNorm) {
    return PADROES_EXCLUSAO.some(p => nomeNorm.includes(p));
  }

  /**
   * Tenta interpretar um nome de aba como mes valido.
   * Formatos aceitos: JUL2026 / JUL 2026 / JULHO 2026 / 2026-07 / 2026 07 / JUL/2026.
   * @returns {null|{nome, ano:number, mes:number, ordem:number}}
   */
  static nomeMensalValido(nome) {
    const norm = SeletorMesesGuardiao.normalizar(nome);
    if (!norm || SeletorMesesGuardiao.ehAbaExcluida(norm)) return null;

    let ano = null;
    let mes = null;

    // 1) ABREV + ano: JUL2026, JUL 2026, JULHO 2026, JUL/2026
    const mAbv = norm.match(/^(JANEIRO|FEVEREIRO|MARCO|ABRIL|MAIO|JUNHO|JULHO|AGOSTO|SETEMBRO|OUTUBRO|NOVEMBRO|DEZEMBRO|JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)[ /]?((?:19|20)\d{2})$/);
    if (mAbv) {
      mes = SeletorMesesGuardiao.mesParaNumero(mAbv[1]);
      ano = parseInt(mAbv[2], 10);
    }

    // 2) ISO/numero: 2026-07, 2026 07, 202607
    if (!mes) {
      const mIso = norm.match(/^(20\d{2}) ?(0?[1-9]|1[0-2])$/);
      if (mIso) {
        ano = parseInt(mIso[1], 10);
        mes = parseInt(mIso[2], 10);
      }
    }

    if (!mes || !ano) return null;
    return { nome, ano, mes, ordem: ano * 100 + mes };
  }

  static mesParaNumero(token) {
    if (/^\d+$/.test(token)) return parseInt(token, 10);
    const idx = MESES_ABREV.findIndex((m, i) => token.slice(0, 3) === m);
    return idx === -1 ? null : idx + 1;
  }

  /**
   * Lista abas mensais validas de uma planilha, ordenadas cronologicamente.
   * @param {object} ss fake ou Spreadsheet com getSheets()
   * @returns {Array<{nome:string, ano:number, mes:number, ordem:number, sheet:object}>}
   */
  static listarAbasMensais(ss) {
    const todas = (ss && typeof ss.getSheets === 'function') ? ss.getSheets() : [];
    return todas
      .map(sheet => {
        const parsed = SeletorMesesGuardiao.nomeMensalValido(sheet.getName());
        return parsed ? { nome: sheet.getName(), sheet, ...parsed } : null;
      })
      .filter(Boolean)
      .sort((a, b) => a.ordem - b.ordem);
  }

  /**
   * Interpreta a resposta do usuario: TODOS | lista de abas validas.
   * @returns {{modo:'TODOS'|'LISTA', alvos:Array<object>, invalidos:Array<string>, cancelado:boolean}}
   */
  static parseSelecao(texto, validas) {
    if (texto === null || texto === undefined) {
      return { modo: null, alvos: [], invalidos: [], cancelado: true };
    }
    const t = String(texto).trim();
    if (!t) return { modo: null, alvos: [], invalidos: [], cancelado: false };
    if (/^(TODOS|TODAS|ALL|TODOS OS MESES)$/i.test(t)) {
      return { modo: 'TODOS', alvos: validas.slice(), invalidos: [], cancelado: false };
    }
    const tokens = t.split(',').map(s => s.trim()).filter(Boolean);
    const alvos = [];
    const invalidos = [];
    for (const token of tokens) {
      let alvo = validas.find(v => SeletorMesesGuardiao.normalizar(v.nome) === SeletorMesesGuardiao.normalizar(token));
      if (!alvo && /^\d+$/.test(token)) {
        const idx = parseInt(token, 10) - 1;
        alvo = validas[idx];
      }
      if (alvo) {
        if (!alvos.includes(alvo)) alvos.push(alvo);
      } else {
        invalidos.push(token);
      }
    }
    return { modo: alvos.length ? 'LISTA' : null, alvos, invalidos, cancelado: false };
  }

  /**
   * Monta a mensagem legivel com as abas validas (para dialogo do usuario).
   */
  static montarListaLegivel(validas) {
    if (!validas.length) return '(nenhuma aba mensal valida encontrada)';
    return validas.map((v, i) => `${i + 1}. ${v.nome} (${String(v.mes).padStart(2, '0')}/${v.ano})`).join('\n');
  }

  /**
   * Executa a auditoria sobre as abas selecionadas usando o motor canonico varrerAba.
   * Falha em UMA aba NAO esconde o resultado das demais: cada aba vira entrada propria
   * com status OK ou ERRO explicito. Nunca produz verde sem auditar.
   *
   * @param {object} selecao parseSelecao()
   * @param {object} ss planilha
   * @param {object} [motor] injecao p/ teste (default: GuardiaoQualidade global)
   * @returns {{porMes:Object, resumo:Object}}
   */
  static auditarMeses(selecao, ss, motor) {
    const motorReal = motor || (typeof GuardiaoQualidade !== 'undefined' ? GuardiaoQualidade : null);
    if (!motorReal || typeof motorReal.varrerAba !== 'function') {
      throw new Error('Motor do Guardiao indisponivel (varrerAba ausente).');
    }
    if (!selecao || selecao.cancelado || !selecao.alvos.length) {
      return { porMes: {}, resumo: { total: 0, ok: 0, comErro: 0, alertas: 0, tuneis: 0, diagnosticos: 0, status: 'NAO_EXECUTADO' } };
    }
    const porMes = {};
    let ok = 0;
    let comErro = 0;
    let alertasTotal = 0;
    let tuneisTotal = 0;
    let diagnosticosTotal = 0;
    for (const alvo of selecao.alvos) {
      try {
        const r = motorReal.varrerAba(alvo.sheet);
        const diagnosticoCount = Array.isArray(r.diagnosticos) ? r.diagnosticos.length : (r.diagnosticos || 0);
        porMes[alvo.nome] = { status: 'OK', resultado: { alertas: r.alertas, linhas: r.linhas, tuneis: r.tuneis, diagnosticos: diagnosticoCount } };
        ok++;
        alertasTotal += r.alertas || 0;
        tuneisTotal += r.tuneis || 0;
        diagnosticosTotal += diagnosticoCount;
      } catch (erro) {
        comErro++;
        porMes[alvo.nome] = { status: 'ERRO', mensagem: (erro && erro.message) ? erro.message : String(erro) };
      }
    }
    const resumo = {
      total: selecao.alvos.length,
      ok,
      comErro,
      alertas: alertasTotal,
      tuneis: tuneisTotal,
      diagnosticos: diagnosticosTotal,
      status: comErro === 0 ? (ok > 0 ? 'OK' : 'NAO_EXECUTADO') : 'PARCIAL_COM_ERRO'
    };
    return { porMes, resumo };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SeletorMesesGuardiao;
}

/**
 * Fluxo de UI (Apps Script): descobrir abas validas -> prompt 1/N/TODOS -> auditar -> consolidar.
 * Cancelar em qualquer ponto retorna sem efeito colateral. Sem abas validas => NAO_AUDITAVEL.
 */
function abrirSeletorMesesGuardiao() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();

  const validas = SeletorMesesGuardiao.listarAbasMensais(ss);
  if (!validas.length) {
    const msg = 'NAO_AUDITAVEL: nenhuma aba mensal valida encontrada.\n' +
      'Abas auxiliares (AUDITORIA/HISTORICO/PIP etc.) sao ignoradas.\n' +
      'Nomes validos: ex. JUL2026, 2026-07.';
    ui.alert('Guardiao da Qualidade', msg, ui.ButtonSet.OK);
    return { status: 'NAO_AUDITAVEL', motivo: 'NENHUMA_ABA_MENSAL' };
  }

  const legivel = SeletorMesesGuardiao.montarListaLegivel(validas);
  const instrucao = 'Abas mensais auditaveis:\n' + legivel +
    '\n\nDigite: TODOS  |  ou nomes separados por virgula (ex.: JUL2026, AGO2026).\n' +
    'Pode usar tambem o numero da lista.\n(Cancelar = sair sem efeito)';

  let selecao = null;
  for (let tentativa = 0; tentativa < 3 && !selecao; tentativa++) {
    const resposta = ui.prompt('Guardiao - Seletor de meses', instrucao, ui.ButtonSet.OK_CANCEL);
    if (resposta.getSelectedButton() === ui.Button.CANCEL || resposta.getSelectedButton() === ui.Button.CLOSE) {
      return { status: 'CANCELADO' };
    }
    const texto = resposta.getResponseText();
    const rascunho = SeletorMesesGuardiao.parseSelecao(texto, validas);
    if (rascunho.cancelado) return { status: 'CANCELADO' };
    if (rascunho.invalidos.length) {
      ui.alert('Guardiao - Selecao invalida',
        'Nao reconhecidos: ' + rascunho.invalidos.join(', ') + '\n\n' + instrucao,
        ui.ButtonSet.OK);
      continue;
    }
    selecao = rascunho;
  }
  if (!selecao) return { status: 'CANCELADO', motivo: 'TENTATIVAS_ESGOTADAS' };

  const consolidado = SeletorMesesGuardiao.auditarMeses(selecao, ss);
  const linhasResumo = Object.keys(consolidado.porMes).map(nome => {
    const p = consolidado.porMes[nome];
    return p.status === 'OK'
      ? `  ${nome}: tuneis ${p.resultado.tuneis} | linhas ${p.resultado.linhas} | linhas c/ alerta ${p.resultado.alertas}`
      : `  ${nome}: ERRO -> ${p.mensagem}`;
  });
  ui.alert(
    'Guardiao da Qualidade - Resultado',
    linhasResumo.join('\n') +
    '\n\nTotal: ' + consolidado.resumo.total + ' mes(es) | OK: ' + consolidado.resumo.ok +
    ' | com erro: ' + consolidado.resumo.comErro +
    '\nAlertas: ' + consolidado.resumo.alertas + ' | Tuneis: ' + consolidado.resumo.tuneis +
    ' | Diagnosticos: ' + consolidado.resumo.diagnosticos,
    ui.ButtonSet.OK
  );
  return consolidado;
}
