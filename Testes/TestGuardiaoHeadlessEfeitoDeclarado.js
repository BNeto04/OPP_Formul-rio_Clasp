'use strict';
if (typeof require === 'undefined') { /* Ignora no Apps Script */ } else {

/**
 * ARQUIVO: Testes/TestGuardiaoHeadlessEfeitoDeclarado.js
 * CARD:    #164 [DP24-003] — FECHADURA da decisao do Planner sobre D-164-04 / D-164-04b
 *          (14/09/2026), medida contra o diagnostico DIAGNOSTICO_D_164_04.md.
 *
 * O que esta fechadura impede:
 *   (a) auditoria que ABORTA por cabecalho obrigatorio ausente deixar efeito (D-164-04b: hoje
 *       `GuardiaoQualidade.js:199-201` grava `AM1` ANTES de `:204 validarCabecalhosObrigatorios`);
 *   (b) a coluna de alerta ser resolvida por ALIAS SOLTO ('ALERTA', `Core/Constantes.js:61`) com
 *       match PARCIAL (`Core/Utils.js:70-73`) — o unico caminho pelo qual o Guardiao alcancaria
 *       uma coluna de A:AL e gravaria dado operacional (§4.3 do diagnostico);
 *   (c) a coluna de alerta ser resolvida por POSICAO FIXA (fallback cego `idx = 38`);
 *   (d) qualquer escrita em A:AL (o sentido tecnico de "nao altera dados operacionais":
 *       `Core/ContratoMutacaoSegura.js:58-61`);
 *   (e) o docblock de `Features/GuardiaoHeadless.js` voltar a OMITIR a coluna AM entre os efeitos.
 *
 * Como ela funciona: dirige a cadeia REAL (`GuardiaoHeadless.executar` -> `SeletorMesesGuardiao`
 * -> `GuardiaoQualidade.varrerAba`) sobre um mock INSTRUMENTADO que registra TODA escrita com a
 * aba de destino, o A1, a operacao e os valores — mesmo padrao de mock de `Testes/TestGuardiao.js`,
 * acrescido do registro de efeitos. Nada e simulado no codigo de produto.
 *
 * Casos (a) a (e) = os 5 obrigatorios da decisao; (f) e (g) sao anti-ornamento declarados.
 *
 * Se qualquer ponto divergir, este teste FICA VERMELHO (exit 1).
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const REPO = path.join(__dirname, '..');

// --- cadeia REAL do runtime (nao ha fake de modulo de produto) ---------------
// Outras suites do runner deixam STUBS PARCIAIS em globais compartilhados (ex.:
// `Testes/TestNormalizadorEfetivo.js` substitui `global.SyntheonUtils` por um objeto sem
// `localizarColuna` e `global.CONSTANTES_SYNTHEON` por um objeto sem ALIASES). Esta fechadura
// dirige a cadeia real do Guardiao, entao instala os modulos CANONICOS durante a propria
// execucao e RESTAURA os globais anteriores no fim — sem alterar o resto do runner.
const globaisSalvos = {
  SyntheonUtils: global.SyntheonUtils,
  CONSTANTES_SYNTHEON: global.CONSTANTES_SYNTHEON,
  RegrasQualidade: global.RegrasQualidade,
  SEVERIDADES_GUARDIAO: global.SEVERIDADES_GUARDIAO,
  RendererAuditoriaSaude: global.RendererAuditoriaSaude,
  GuardiaoQualidade: global.GuardiaoQualidade
};

const UtilsMod = require(path.join(REPO, 'Core', 'Utils'));
global.SyntheonUtils = UtilsMod.SyntheonUtils || UtilsMod;
global.CONSTANTES_SYNTHEON = require(path.join(REPO, 'Core', 'Constantes'));
const RQ = require(path.join(REPO, 'Core', 'RegrasQualidade'));
global.RegrasQualidade = RQ.RegrasQualidade;
global.SEVERIDADES_GUARDIAO = RQ.SEVERIDADES_GUARDIAO;
global.RendererAuditoriaSaude = require(path.join(REPO, 'Render', 'RendererAuditoriaSaude'));
global.GuardiaoQualidade = require(path.join(REPO, 'Features', 'GuardiaoQualidade'));
const SeletorMesesGuardiao = require(path.join(REPO, 'Entrada', 'SeletorMesesGuardiao'));
const GuardiaoHeadless = require(path.join(REPO, 'Features', 'GuardiaoHeadless'));

console.log('Iniciando Testes: efeito declarado x efeito medido do Guardiao (D-164-04 / D-164-04b)...\n');

let sucessos = 0;
let falhas = 0;
function test(nome, fn) {
  try {
    fn();
    console.log(`  [PASS] ${nome}`);
    sucessos++;
  } catch (err) {
    console.error(`  [FAIL] ${nome}: ${err.message}`);
    falhas++;
  }
}

// ---------------------------------------------------------------------------
// Helpers de endereco
// ---------------------------------------------------------------------------
function a1(row, col) {
  let s = '';
  let c = col - 1;
  do { s = String.fromCharCode(65 + (c % 26)) + s; c = Math.floor(c / 26) - 1; } while (c >= 0);
  return s + row;
}
function letraDaColuna(col) {
  return a1(1, col).replace(/\d+$/, '');
}
function normalizar(v) {
  return String(v === undefined || v === null ? '' : v)
    .trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
/** Indices (0-based) em que o cabecalho canonico aparece EXATAMENTE. */
function colunasDoCabecalhoCanonico(headers) {
  const alvo = normalizar('Alerta Integridade');
  const out = [];
  headers.forEach((h, i) => { if (normalizar(h) === alvo) out.push(i); });
  return out;
}
/** Copia rasa de uma matriz (para comparar antes/depois sem alias). */
function copiarMatriz(m) { return JSON.parse(JSON.stringify(m || [])); }

// ---------------------------------------------------------------------------
// Mock instrumentado: separa a matriz da aba MENSAL das abas de APOIO e
// registra TODA escrita (aba + A1 + operacao + valores).
// ---------------------------------------------------------------------------
const ABA_MENSAL_PADRAO = 'AGO2026';

function criarCenario(headers, dadosLinhas, formulasLinhas) {
  const nCols = headers.length;
  const matrizMensal = [headers.slice()];
  (dadosLinhas || []).forEach(l => {
    const linha = l.slice();
    while (linha.length < nCols) linha.push('');
    matrizMensal.push(linha);
  });
  const formulasMensal = [headers.map(() => '')];
  (formulasLinhas || []).forEach(f => {
    const linha = f.slice();
    while (linha.length < nCols) linha.push('');
    formulasMensal.push(linha);
  });

  const escritas = [];
  const registra = (aba, op, row, col, nr, nc, payload) => {
    escritas.push({
      aba, op, row, col, nr, nc, coluna: col,
      a1: (nr > 1 || nc > 1) ? `${a1(row, col)}:${a1(row + nr - 1, col + nc - 1)}` : a1(row, col),
      valores: payload === undefined ? null : payload
    });
  };

  const criarRange = (aba, store, row, col, nr, nc) => {
    const range = {
      getValues: () => store.ler(row, col, nr, nc),
      getFormulas: () => store.lerFormulas(row, col, nr, nc),
      getNotes: () => Array.from({ length: nr }, () => Array.from({ length: nc }, () => '')),
      getA1Notation: () => ((nr > 1 || nc > 1) ? `${a1(row, col)}:${a1(row + nr - 1, col + nc - 1)}` : a1(row, col)),
      setValue: (v) => { registra(aba, 'setValue', row, col, 1, 1, v); store.escreverValor(row, col, v); return range; },
      setValues: (vals) => { registra(aba, 'setValues', row, col, vals.length, (vals[0] || []).length, vals); store.escreverValores(row, col, vals); return range; },
      setFormula: (f) => { registra(aba, 'setFormula', row, col, 1, 1, f); store.escreverValor(row, col, f); return range; },
      setFormulas: (f) => { registra(aba, 'setFormulas', row, col, f.length, (f[0] || []).length, f); return range; },
      clearContent: () => { registra(aba, 'clearContent', row, col, nr, nc, null); store.limpar(row, col, nr, nc); return range; },
      clearDataValidations: () => { registra(aba, 'clearDataValidations', row, col, nr, nc, null); return range; },
      clear: () => { registra(aba, 'clear', row, col, nr, nc, null); store.limpar(row, col, nr, nc); return range; },
      clearNote: () => range,
      setNote: () => range,
      setBackground: () => { registra(aba, 'setBackground', row, col, nr, nc, null); return range; },
      setFontColor: () => { registra(aba, 'setFontColor', row, col, nr, nc, null); return range; },
      setFontWeight: () => range,
      setFontSize: () => range,
      setFontFamily: () => range,
      setHorizontalAlignment: () => range,
      setVerticalAlignment: () => range,
      setBorder: () => range,
      createFilter: () => range,
      setDataValidation: () => range,
      setNumberFormat: () => range
    };
    return range;
  };

  const criarStoreMensal = (matriz, formulas) => ({
    ler: (row, col, nr, nc) => {
      const out = [];
      for (let i = 0; i < nr; i++) {
        const src = matriz[row - 1 + i] || [];
        const linha = [];
        for (let j = 0; j < nc; j++) linha.push(src[col - 1 + j] === undefined ? '' : src[col - 1 + j]);
        out.push(linha);
      }
      return out;
    },
    lerFormulas: (row, col, nr, nc) => {
      const out = [];
      for (let i = 0; i < nr; i++) {
        const src = formulas[row - 1 + i] || [];
        const linha = [];
        for (let j = 0; j < nc; j++) linha.push(src[col - 1 + j] === undefined ? '' : src[col - 1 + j]);
        out.push(linha);
      }
      return out;
    },
    escreverValor: (row, col, v) => { if (!matriz[row - 1]) matriz[row - 1] = []; matriz[row - 1][col - 1] = v; },
    escreverValores: (row, col, vals) => {
      vals.forEach((linha, ri) => {
        if (!matriz[row - 1 + ri]) matriz[row - 1 + ri] = [];
        linha.forEach((v, ci) => { matriz[row - 1 + ri][col - 1 + ci] = v; });
      });
    },
    limpar: (row, col, nr, nc) => {
      for (let i = 0; i < nr; i++) {
        const linha = matriz[row - 1 + i];
        if (!linha) continue;
        for (let j = 0; j < nc; j++) linha[col - 1 + j] = '';
      }
    }
  });

  const storeMensal = criarStoreMensal(matrizMensal, formulasMensal);

  const sheetMensal = {
    getName: () => ABA_MENSAL_PADRAO,
    getLastRow: () => matrizMensal.length,
    getLastColumn: () => headers.length,
    getRange: (r, c, nR, nC) => criarRange(ABA_MENSAL_PADRAO, storeMensal, r, c, nR || 1, nC || 1),
    getParent: () => parentMock,
    setFrozenRows: () => {},
    setHiddenGridlines: () => {},
    setColumnWidth: () => {},
    setRowHeight: () => {},
    autoResizeColumns: () => {}
  };

  const abasApoio = {};
  const criarAbaApoio = (nome) => {
    const storage = [];
    const storeApoio = {
      ler: (row, col, nr, nc) => {
        const out = [];
        for (let i = 0; i < nr; i++) {
          const src = storage[row - 1 + i] || [];
          const linha = [];
          for (let j = 0; j < nc; j++) linha.push(src[col - 1 + j] === undefined ? '' : src[col - 1 + j]);
          out.push(linha);
        }
        return out;
      },
      lerFormulas: (row, col, nr, nc) => storeApoio.ler(row, col, nr, nc),
      escreverValor: (row, col, v) => { if (!storage[row - 1]) storage[row - 1] = []; storage[row - 1][col - 1] = v; },
      escreverValores: (row, col, vals) => {
        vals.forEach((linha, ri) => {
          if (!storage[row - 1 + ri]) storage[row - 1 + ri] = [];
          linha.forEach((v, ci) => { storage[row - 1 + ri][col - 1 + ci] = v; });
        });
      },
      limpar: (row, col, nr, nc) => {
        for (let i = 0; i < nr; i++) {
          const linha = storage[row - 1 + i];
          if (!linha) continue;
          for (let j = 0; j < nc; j++) linha[col - 1 + j] = '';
        }
      }
    };
    abasApoio[nome] = {
      storage,
      getName: () => nome,
      getLastRow: () => storage.length,
      getLastColumn: () => storage.reduce((m, l) => Math.max(m, (l || []).length), 0),
      getRange: (r, c, nR, nC) => criarRange(nome, storeApoio, r, c, nR || 1, nC || 1),
      clear: () => { storage.length = 0; },
      setFrozenRows: () => {},
      setHiddenGridlines: () => {},
      setColumnWidth: () => {},
      setRowHeight: () => {},
      autoResizeColumns: () => {},
      setFontWeight: () => {}
    };
    return abasApoio[nome];
  };

  const parentMock = {
    getSheets: () => [sheetMensal],
    getSheetByName: (n) => (abasApoio[n] || null),
    insertSheet: (n) => criarAbaApoio(n)
  };

  return { ss: parentMock, sheet: sheetMensal, escritas, matrizMensal, formulasMensal, abasApoio };
}

/** Executa a cadeia REAL (headless) sobre o cenario. */
function rodarCadeia(cenario, selecao) {
  const out = GuardiaoHeadless.executar(selecao === undefined ? 'TODOS' : selecao, {
    obterSS: () => cenario.ss,
    modulo: SeletorMesesGuardiao
  });
  const json = JSON.parse(out);
  const escritasMensal = cenario.escritas.filter(e => e.aba === ABA_MENSAL_PADRAO);
  const escritasApoio = cenario.escritas.filter(e => e.aba !== ABA_MENSAL_PADRAO);
  return {
    json,
    resumo: (json.resumo && json.resumo[0]) || {},
    escritasMensal,
    escritasApoio,
    todas: cenario.escritas
  };
}

// ---------------------------------------------------------------------------
// Cenarios (A:AL = 38 colunas = A..AL; AM = 39a coluna)
// ---------------------------------------------------------------------------
const OBRIGATORIOS = ['OCORRÊNCIA PIP', 'IMPUTADO?'];
function cabecalhoAteAL(comObrigatorios) {
  const base = ['DATA', 'NÚMERO MIKE', 'BOE', 'MATRÍCULA', 'POLICIAL'];
  const resto = comObrigatorios ? OBRIGATORIOS.slice() : ['COLAB_06', 'COLAB_07'];
  const cab = base.concat(resto);
  let i = cab.length + 1;
  while (cab.length < 38) { cab.push('COLAB_' + (i++)); }
  return cab; // 38 colunas A..AL
}
const CAB_A_AL_OK = cabecalhoAteAL(true);
const CAB_A_AL_SEM_OBRIGATORIOS = cabecalhoAteAL(false);
const LINHAS_DADOS = [
  ['15/07/2026', '', '26E100', '113920-7', 'SD SILVA'],
  ['15/07/2026', '202607150001', '26E100', '113920-7', 'SD SILVA']
];
const FORMULAS = [];
for (let i = 0; i < 2; i++) {
  const f = ['', '', '', '=VLOOKUP(E' + (i + 2) + ';PECULIO!$A:$E;3;0)', '', '', '', '', '=H' + (i + 2) + '/2', '=I' + (i + 2) + '', '=J' + (i + 2) + '', '=K' + (i + 2) + '/2', '=L' + (i + 2) + '', '=M' + (i + 2) + '/4', '=N' + (i + 2) + '', '=O' + (i + 2) + ''];
  FORMULAS.push(f);
}

// ---------------------------------------------------------------------------
// (a) cabecalho obrigatorio ausente => ERRO_TECNICO e ZERO escrita (inclusive AM1)
//     [D-164-04b — nasce VERMELHO antes da correcao: gravava AM1]
// ---------------------------------------------------------------------------
test('(a) cabecalho obrigatorio ausente: auditoria aborta com ERRO_TECNICO e NAO deixa nenhuma escrita (nem AM1)', () => {
  const c = criarCenario(CAB_A_AL_SEM_OBRIGATORIOS, LINHAS_DADOS, FORMULAS);
  const r = rodarCadeia(c);
  assert.strictEqual(r.resumo.status, 'ERRO', 'a auditoria deve abortar com status ERRO');
  assert.ok(/Cabeçalhos obrigatórios não encontrados/.test(r.resumo.mensagem || ''),
    'diagnostico deve ser o de cabecalhos obrigatorios (lido: ' + r.resumo.mensagem + ')');
  assert.ok(/OCORRENCIA PIP/.test(r.resumo.mensagem || ''), 'diagnostico deve citar OCORRENCIA PIP');
  assert.deepStrictEqual(r.todas.map(e => e.op + ' ' + e.aba + '!' + e.a1), [],
    'auditoria que falha nao pode deixar NENHUMA escrita');
});

// ---------------------------------------------------------------------------
// (b) coluna de alerta AUSENTE => diagnostico e ZERO escrita (sem criar AM1, sem fallback 38)
// ---------------------------------------------------------------------------
test('(b) coluna de alerta ausente: fail-safe emite diagnostico e NAO escreve nada (sem criacao de AM1)', () => {
  const c = criarCenario(CAB_A_AL_OK, LINHAS_DADOS, FORMULAS); // 38 colunas: A..AL, sem AM
  const r = rodarCadeia(c);
  assert.strictEqual(r.resumo.status, 'ERRO', 'ausencia do endereco canonico da AM deve abortar a publicacao');
  assert.ok(/Alerta Integridade/.test(r.resumo.mensagem || ''), 'diagnostico deve citar o cabecalho canonico da AM');
  assert.ok(/ausente/i.test(r.resumo.mensagem || ''), 'diagnostico deve declarar AUSENTE (lido: ' + r.resumo.mensagem + ')');
  assert.deepStrictEqual(r.todas, [], 'fail-safe exige ZERO escrita em qualquer aba');
  assert.deepStrictEqual(copiarMatriz(c.matrizMensal), copiarMatriz([CAB_A_AL_OK].concat(LINHAS_DADOS.map(l => { const x = l.slice(); while (x.length < 38) x.push(''); return x; }))),
    'a aba mensal nao pode ter sido mutada');
});

// ---------------------------------------------------------------------------
// (c) cabecalho canonico AMBIGUO (duas colunas) => ZERO escrita (nenhuma escolha por posicao)
// ---------------------------------------------------------------------------
test('(c) cabecalho canonico ambiguo: duas colunas declaram "ALERTA INTEGRIDADE" -> ZERO escrita', () => {
  const cab = CAB_A_AL_OK.slice();
  cab[10] = 'ALERTA INTEGRIDADE';              // 11a coluna (K) — DENTRO de A:AL
  const headers = cab.concat(['ALERTA INTEGRIDADE']); // + AM (39a coluna)
  const c = criarCenario(headers, LINHAS_DADOS, FORMULAS);
  const r = rodarCadeia(c);
  assert.strictEqual(r.resumo.status, 'ERRO', 'ambiguidade deve abortar a publicacao');
  assert.ok(/amb/i.test(r.resumo.mensagem || ''), 'diagnostico deve declarar AMBIGUA (lido: ' + r.resumo.mensagem + ')');
  assert.deepStrictEqual(r.todas, [], 'ambiguidade exige ZERO escrita — nunca escolher por posicao');
  assert.strictEqual(c.matrizMensal[0][10], 'ALERTA INTEGRIDADE', 'a coluna de A:AL permanece intacta');
});

// ---------------------------------------------------------------------------
// (d) estrutura valida => escrita SOMENTE na coluna de alerta (AM)
// ---------------------------------------------------------------------------
test('(d) estrutura valida: toda escrita cai na coluna de alerta (AM) e a auditoria publica o alerta', () => {
  const headers = CAB_A_AL_OK.concat(['ALERTA INTEGRIDADE']); // AM = coluna 39
  const c = criarCenario(headers, LINHAS_DADOS, FORMULAS);
  const r = rodarCadeia(c);
  assert.strictEqual(r.resumo.status, 'OK', 'estrutura canonica deve auditar (lido: ' + JSON.stringify(r.resumo) + ')');
  assert.ok(r.escritasMensal.length > 0, 'anti-ornamento: a publicacao na AM precisa ter acontecido');
  const foraDaAM = r.escritasMensal.filter(e => e.coluna !== 39);
  assert.deepStrictEqual(foraDaAM.map(e => e.op + ' ' + e.a1), [],
    'nenhuma escrita pode sair da coluna de alerta (AM)');
  const escritaDeValores = r.escritasMensal.filter(e => e.op === 'setValues' && e.col === 39 && e.row === 2);
  assert.strictEqual(escritaDeValores.length, 1, 'a publicacao e um bloco unico em AM2:AMn');
  assert.ok(/^ALERTA INTEGRIDADE$/i.test(String(c.matrizMensal[0][38] || '')), 'AM1 continua com o cabecalho canonico');
});

// ---------------------------------------------------------------------------
// (e) nenhuma celula de A:AL alterada (valores e formulas) — no sucesso e na falha
// ---------------------------------------------------------------------------
test('(e) nenhuma celula de A:AL e alterada: matriz A:AL identica antes/depois em toda a cadeia', () => {
  const headers = CAB_A_AL_OK.concat(['ALERTA INTEGRIDADE']);
  const c = criarCenario(headers, LINHAS_DADOS, FORMULAS);
  const antes = copiarMatriz(c.matrizMensal).map(l => l.slice(0, 38));
  const antesFormulas = copiarMatriz(c.formulasMensal).map(l => l.slice(0, 38));
  rodarCadeia(c);
  const depois = copiarMatriz(c.matrizMensal).map(l => l.slice(0, 38));
  const depoisFormulas = copiarMatriz(c.formulasMensal).map(l => l.slice(0, 38));
  assert.deepStrictEqual(depois, antes, 'A:AL (valores) sofreu mutacao');
  assert.deepStrictEqual(depoisFormulas, antesFormulas, 'A:AL (formulas) sofreu mutacao');

  // e o mesmo nos cenarios de falha (a)(b)(c)(f) — inclusive no hazard do alias solto,
  // que e o unico caminho pelo qual o Guardiao alcancaria uma coluna de A:AL
  const cabHazard = CAB_A_AL_OK.slice();
  cabHazard[10] = 'ALERTA OPERACIONAL';
  cabHazard[20] = 'OBSERVADOR';
  const cenariosFalha = [
    criarCenario(CAB_A_AL_SEM_OBRIGATORIOS, LINHAS_DADOS, FORMULAS),
    criarCenario(CAB_A_AL_OK, LINHAS_DADOS, FORMULAS),
    criarCenario(cabHazard, LINHAS_DADOS, FORMULAS)
  ];
  cenariosFalha.forEach(cen => {
    const a = copiarMatriz(cen.matrizMensal).map(l => l.slice(0, 38));
    rodarCadeia(cen);
    assert.deepStrictEqual(copiarMatriz(cen.matrizMensal).map(l => l.slice(0, 38)), a,
      'cenario de falha NAO pode mutar A:AL');
  });
});

// ---------------------------------------------------------------------------
// (f) ANTI-ORNAMENTO: o alias solto 'ALERTA' (match parcial) e 'OBSERVADOR' numa
//     coluna de A:AL nunca podem virar alvo da escrita — o hazard de §4.3.
// ---------------------------------------------------------------------------
test('(f) alias solto nao e endereco: "ALERTA OPERACIONAL"/"OBSERVADOR" em A:AL nao recebem escrita nem cabecalho', () => {
  const cab = CAB_A_AL_OK.slice();
  cab[10] = 'ALERTA OPERACIONAL';   // contem 'ALERTA' -> casaria por match parcial
  cab[20] = 'OBSERVADOR';           // alias literal de Core/Constantes.js:61
  const c = criarCenario(cab, LINHAS_DADOS, FORMULAS); // 38 colunas, SEM o cabecalho canonico da AM
  const r = rodarCadeia(c);
  assert.deepStrictEqual(r.todas, [], 'nenhuma escrita (nem cabecalho) quando o alvo nao e o endereco canonico');
  assert.strictEqual(c.matrizMensal[0][10], 'ALERTA OPERACIONAL', 'a coluna de A:AL preserva o proprio cabecalho');
  assert.strictEqual(c.matrizMensal[0][20], 'OBSERVADOR', 'a coluna de A:AL preserva o proprio cabecalho');
  assert.ok(/ausente/i.test(r.resumo.mensagem || ''), 'o desfecho e o fail-safe (AUSENTE) — nunca escrita em coluna suposta');
});

// ---------------------------------------------------------------------------
// (g) DECLARACAO x DOCUMENTACAO: o docblock de `Features/GuardiaoHeadless.js`
//     tem de citar a coluna AM e dizer que A:AL e somente leitura.
// ---------------------------------------------------------------------------
test('(g) docblock do arquivo headless cita a coluna AM e declara A:AL somente leitura', () => {
  const fonte = fs.readFileSync(path.join(REPO, 'Features', 'GuardiaoHeadless.js'), 'utf8');
  const bloco = /Escopo:[\s\S]*?\*\//.exec(fonte);
  assert.ok(bloco, 'o arquivo headless deve declarar o escopo em docblock');
  const texto = bloco[0];
  assert.ok(/\bAM\b/.test(texto), 'o escopo declarado deve citar a coluna AM entre os efeitos');
  assert.ok(/A:AL/.test(texto), 'o escopo declarado deve citar A:AL');
  assert.ok(/SOMENTE LEITURA/i.test(texto), 'o escopo declarado deve dizer que A:AL e somente leitura');
});

// Restaura os globais como estavam antes desta suite (o runner compartilha o processo).
Object.keys(globaisSalvos).forEach(function (chave) {
  if (globaisSalvos[chave] === undefined) delete global[chave];
  else global[chave] = globaisSalvos[chave];
});

console.log(`\nRESULTADOS FINAIS: ${sucessos} PASS / ${falhas} FAIL`);
if (falhas > 0) {
  console.error('\n❌ FECHADURA D-164-04/D-164-04b FALHOU — efeito medido diverge do declarado.');
  process.exitCode = 1;
} else {
  console.log('✅ FECHADURA D-164-04/D-164-04b: efeito declarado == efeito medido (A:AL intocadas, AM canonica).');
}

}
