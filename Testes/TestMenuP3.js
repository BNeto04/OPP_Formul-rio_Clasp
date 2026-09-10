'use strict';
if (typeof require === 'undefined') { /* Ignora no Apps Script */ } else {

/**
 * ARQUIVO: Testes/TestMenuP3.js
 * DESCRICAO: Suite do menu unico P3 (MENU-P3-002 #130 / MENU-P3-003 #131).
 *
 * Prova, com o CODIGO REAL do produto carregado num sandbox (vm) e um SpreadsheetApp FALSO:
 *  1. existe UM unico menu superior, chamado P3;
 *  2. os submenus seguem a arvore canonica do #129 (8 grupos, na ordem);
 *  3. TODO item aponta para uma funcao que existe de fato (nenhum alvo morto);
 *  4. nenhum menu superior legado (Formulario/Armas/Drogas/Produtividade/Pip) e criado;
 *  5. construcao DEFENSIVA: derrubar uma funcao alvo omite apenas aquele item;
 *  6. os entrypoints criticos continuam alcancaveis (normalizarEfetivo, abrirSeletorMesesGuardiao,
 *     executarGuardiaoQualidade, PIP/CPM, comparativo) e as features ABANDONADAS (GXT, Central Analitica)
 *     permanecem FORA do menu, com o codigo intacto no repositorio.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('Iniciando Testes: Menu unico P3 (MENU-P3 #130/#131)...\n');

let sucessos = 0;
let falhas = 0;
function test(nome, fn) {
  try { fn(); console.log(`  [PASS] ${nome}`); sucessos++; }
  catch (err) { console.error(`  [FAIL] ${nome}:`, err.message); falhas++; }
}

const REPO = path.join(__dirname, '..');
const IGNORAR_DIR = new Set(['.git', 'node_modules', 'agentic', 'ponte1_telegram_chatgpt', 'ponte2_chatgpt_gravity',
  'VigiaPonte', 'extension', 'extension_outbound', '02_Comodos', '06_Inventario', '01_Planta', 'scratch',
  'planta', 'Testes', 'Homologacao', 'scripts', 'Schemas', 'Temas']);

function arquivosProduto() {
  const lista = [];
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.isDirectory()) {
        if (IGNORAR_DIR.has(e.name)) continue;
        walk(path.join(dir, e.name));
      } else if (e.name.endsWith('.js')) {
        lista.push(path.join(dir, e.name));
      }
    }
  })(REPO);
  return lista;
}

/** Cria o sandbox com SpreadsheetApp falso e carrega o produto real. */
function carregarProduto() {
  const registro = { menusCriados: [], addToUi: [], dialogos: [] };

  function criarMenuFalso(nome) {
    const node = { nome, itens: [], submenus: [], separadores: 0 };
    registro.menusCriados.push(node);
    const api = {
      addItem(rotulo, alvo) { node.itens.push({ rotulo, alvo }); return api; },
      addSeparator() { node.separadores++; return api; },
      addSubMenu(sub) { node.submenus.push(sub.__node); return api; },
      addToUi() { registro.addToUi.push(node); return api; },
      __node: node
    };
    return api;
  }

  const contexto = {
    console,
    Logger: { log() {} },
    SpreadsheetApp: {
      getUi: () => ({ createMenu: criarMenuFalso, showModalDialog: (h, t) => registro.dialogos.push(t), alert: () => {} }),
      getActiveSpreadsheet: () => ({ getSheetByName: () => null, getSheets: () => [], getName: () => 'TESTE' })
    },
    HtmlService: { createTemplateFromFile: () => ({ evaluate: () => ({ setTitle: function () { return this; }, setWidth: function () { return this; }, setHeight: function () { return this; } }) }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => null, setProperty: () => {} }), getDocumentProperties: () => ({ getProperty: () => null, setProperty: () => {} }), getUserProperties: () => ({ getProperty: () => null, setProperty: () => {} }) },
    CacheService: { getScriptCache: () => ({ get: () => null, put: () => {}, remove: () => {} }) },
    LockService: { getDocumentLock: () => ({ tryLock: () => true, releaseLock: () => {} }), getScriptLock: () => ({ tryLock: () => true, releaseLock: () => {} }) },
    Utilities: { formatDate: () => '01/01/2026', sleep: () => {}, getUuid: () => 'uuid-teste', base64Encode: () => '' },
    Session: { getScriptTimeZone: () => 'America/Sao_Paulo', getActiveUser: () => ({ getEmail: () => 'teste@teste' }) },
    DriveApp: {}, MailApp: { sendEmail: () => {} }, UrlFetchApp: { fetch: () => ({ getContentText: () => '{}' }) }
  };
  contexto.globalThis = contexto;
  contexto.global = contexto;
  const sandbox = vm.createContext(contexto);

  const falhasCarga = [];
  arquivosProduto().forEach(arquivo => {
    try {
      vm.runInContext(fs.readFileSync(arquivo, 'utf8'), sandbox, { filename: arquivo });
    } catch (e) {
      falhasCarga.push(path.relative(REPO, arquivo).replace(/\\/g, '/') + ': ' + e.message);
    }
  });
  return { ctx: contexto, registro, falhasCarga };
}

const ambiente = carregarProduto();
const ctx = ambiente.ctx;
const registro = ambiente.registro;

console.log(`  (arquivos carregados: ${arquivosProduto().length}; falhas de carga: ${ambiente.falhasCarga.length})`);
if (ambiente.falhasCarga.length) {
  ambiente.falhasCarga.slice(0, 5).forEach(f => console.log('     carga-falha: ' + f.substring(0, 120)));
}

// ---------- 1. estrutura ----------
function executarOnOpen() {
  registro.menusCriados.length = 0; registro.addToUi.length = 0;
  ctx.onOpen();
  return registro;
}

test('existe UM unico menu superior e ele se chama P3', () => {
  const r = executarOnOpen();
  // So o que chega a `addToUi` e exibido na planilha; submenus vazios criados e descartados pelo
  // builder (construcao defensiva) nao contam como menu superior.
  assert.strictEqual(r.addToUi.length, 1, 'exatamente um menu deve chegar ao addToUi');
  assert.strictEqual(r.addToUi[0].nome, 'P3');
});

test('nenhum menu superior legado e criado (Formulario/Produtividade/Pip + builders mortos)', () => {
  const r = executarOnOpen();
  // nomes dos menus superiores ANTIGOS e dos builders mortos (criarMenuPip_/criarMenuCPM_) nao podem existir
  const proibidos = ['Formulario', 'Formulário', 'Produtividade', 'Pip', '🏆 PIP', '⭐ CPM'];
  // apenas menus de TOPO importam: submenus do P3 podem se chamar Armas/Drogas/Formulario legitimamente
  const filhos = new Set();
  r.menusCriados.forEach(m => m.submenus.forEach(s => filhos.add(s)));
  const raizes = r.menusCriados.filter(m => !filhos.has(m));
  raizes.forEach(m => assert.strictEqual(proibidos.indexOf(m.nome), -1, 'menu superior legado criado: ' + m.nome));
  assert.strictEqual(r.addToUi.length, 1);
  // Armas/Drogas existem APENAS como submenu do P3 (nao como menu superior)
  const raiz = r.addToUi[0];
  ['Armas', 'Drogas'].forEach(nome => {
    const comoRaiz = r.addToUi.some(m => m.nome === nome);
    assert.strictEqual(comoRaiz, false, nome + ' nao pode ser menu superior');
    assert.ok(raiz.submenus.some(s => s.nome === nome), nome + ' deve ser submenu do P3');
  });
});

test('submenus seguem a arvore canonica do #129 (grupos na ordem; Desenvolvimento so se o harness existir)', () => {
  const r = executarOnOpen();
  const grupos = r.addToUi[0].submenus.map(s => s.nome);
  const canonicos = ['Formulário', 'Armas', 'Drogas', 'Produtividade / Comparativo',
    'Guardião da Qualidade', 'Efetivo', 'PIP / CPM'];
  assert.deepStrictEqual(grupos.slice(0, 7), canonicos, 'os 7 grupos canonicos devem vir nesta ordem');
  // `Desenvolvimento` e o unico grupo opcional: ele existe apenas se o arcabouco de homologacao estiver
  // carregado (em producao ele NAO vai: `Homologacao/**` esta no .claspignore). Card #134.
  assert.ok(grupos.length === 7 || (grupos.length === 8 && grupos[7] === 'Desenvolvimento'),
    'composicao inesperada de grupos: ' + grupos.join(' | '));
});

// ---------- 2. alvos vivos ----------
test('todo item do menu aponta para funcao existente (nenhum alvo morto)', () => {
  const r = executarOnOpen();
  const raiz = r.addToUi[0];
  const mortos = [];
  (function varrer(menu) {
    menu.itens.forEach(i => { if (typeof ctx[i.alvo] !== 'function') mortos.push(`${menu.nome} > ${i.rotulo} -> ${i.alvo}`); });
    menu.submenus.forEach(varrer);
  })(raiz);
  assert.deepStrictEqual(mortos, [], 'itens apontando para funcao inexistente: ' + mortos.join('; '));
});

test('os 15 entrypoints ENVIADOS continuam alcancaveis pelo P3', () => {
  const r = executarOnOpen();
  const alvos = [];
  (function varrer(menu) { menu.itens.forEach(i => alvos.push(i.alvo)); menu.submenus.forEach(varrer); })(r.addToUi[0]);
  ['abrirFormularioEntrada', 'abrirMenuSelecaoLivre', 'iniciarModoAnual', 'abrirMenuSelecaoLivreDrogas',
   'iniciarModoAnualDrogas', 'abrirMenuComparativo2026', 'abrirSeletorMesesGuardiao', 'executarGuardiaoQualidade',
   'normalizarEfetivo', 'abrirMenuPipMensal', 'abrirMenuPipLivre', 'gerarPipAnual',
   'abrirMenuCPMMensal', 'abrirMenuCPMLivre', 'gerarCPMAnual'].forEach(a => {
    assert.ok(alvos.indexOf(a) !== -1, 'entrypoint perdido no P3: ' + a);
  });
});

test('[Dev] Homologacao: item omitido quando o harness nao esta carregado (declarado, card #134)', () => {
  const r = executarOnOpen();
  const alvos = [];
  (function varrer(menu) { menu.itens.forEach(i => alvos.push(i.alvo)); menu.submenus.forEach(varrer); })(r.addToUi[0]);
  const harnessCarregado = typeof ctx.rodarTesteDeHomologacao === 'function';
  const noMenu = alvos.indexOf('rodarTesteDeHomologacao') !== -1;
  // Regra: o item aparece SOMENTE se a funcao alvo existir (construcao defensiva do #130).
  assert.strictEqual(noMenu, harnessCarregado,
    'item [Dev] deveria acompanhar a existencia da funcao (carregado=' + harnessCarregado + ', noMenu=' + noMenu + ')');
});

test('DECISAO CONGELADA: GXT e Central Analitica NAO aparecem no menu (features abandonadas)', () => {
  const r = executarOnOpen();
  const alvos = [];
  (function varrer(menu) { menu.itens.forEach(i => alvos.push(i.alvo)); menu.submenus.forEach(varrer); })(r.addToUi[0]);
  // Decisao do proprietario: GXT tera planilha propria; Central Analitica entra na migracao p/ banco de dados.
  ['abrirMenuGxtSelecaoLivre', 'gerarGxtSelecaoLivre', 'gerarGxtAnual',
   'rodarCentralAnaliticaAnual', 'abrirMenuCentralAnaliticaSelecaoLivre'].forEach(function (a) {
    assert.strictEqual(alvos.indexOf(a), -1, 'feature abandonada nao pode voltar ao menu: ' + a);
  });
  // o codigo continua no repositorio: nao removemos funcionalidade, apenas nao expomos no menu
  assert.strictEqual(typeof ctx.gerarGxtAnual, 'function', 'codigo do GXT deve permanecer');
  assert.strictEqual(typeof ctx.rodarCentralAnaliticaAnual, 'function', 'codigo da Central deve permanecer');
});

test('PIP/CPM preserva os dois submenus com 3 itens cada (regra de negocio intacta)', () => {
  const r = executarOnOpen();
  const pip = r.addToUi[0].submenus.find(s => s.nome === 'PIP / CPM');
  assert.ok(pip, 'grupo PIP / CPM ausente');
  assert.strictEqual(pip.submenus.length, 2);
  assert.deepStrictEqual(pip.submenus.map(s => s.nome), ['PIP | Ciclo 29–28', 'CPM | Mês civil']);
  pip.submenus.forEach(s => assert.strictEqual(s.itens.length, 3, 'submenu ' + s.nome + ' deve ter 3 itens'));
});

test('itens de desenvolvimento ficam isolados no grupo Desenvolvimento', () => {
  const r = executarOnOpen();
  const dev = r.addToUi[0].submenus.find(s => s.nome === 'Desenvolvimento');
  if (!dev) { assert.notStrictEqual(typeof ctx.rodarTesteDeHomologacao, 'function', 'grupo ausente embora a funcao alvo exista'); }
  else assert.ok(dev.itens.every(i => i.rotulo.indexOf('[Dev]') === 0), 'item de dev fora do padrao [Dev]');
  const outros = r.addToUi[0].submenus.filter(s => s.nome !== 'Desenvolvimento');
  const vazamento = [];
  (function varrer(menu) { menu.itens.forEach(i => { if (i.rotulo.indexOf('[Dev]') === 0) vazamento.push(menu.nome); }); menu.submenus.forEach(varrer); })({ nome: 'raiz', itens: [], submenus: outros });
  assert.deepStrictEqual(vazamento, [], 'item de dev fora do grupo Desenvolvimento');
});

test('Guardiao tem seletor + aba atual e NAO aponta para funcao inexistente de Normalizador', () => {
  const r = executarOnOpen();
  const g = r.addToUi[0].submenus.find(s => s.nome === 'Guardião da Qualidade');
  const alvos = g.itens.map(i => i.alvo);
  assert.ok(alvos.indexOf('abrirSeletorMesesGuardiao') !== -1);
  assert.ok(alvos.indexOf('executarGuardiaoQualidade') !== -1);
  g.itens.forEach(i => assert.strictEqual(typeof ctx[i.alvo], 'function'));
  assert.ok(!alvos.some(a => /normaliz/i.test(a)), 'nenhum item de normalizacao enquanto nao existir funcao real');
});

// ---------- 3. construcao defensiva ----------
test('DEFENSIVO: funcao alvo ausente omite APENAS aquele item e o menu continua', () => {
  const backup = ctx.gerarPipAnual;
  try {
    ctx.gerarPipAnual = undefined; // funcao global nao e 'deletavel' no sandbox
    const r = executarOnOpen();
    assert.strictEqual(r.addToUi.length, 1, 'o menu deve continuar sendo criado');
    const alvos = [];
    (function varrer(menu) { menu.itens.forEach(i => alvos.push(i.alvo)); menu.submenus.forEach(varrer); })(r.addToUi[0]);
    assert.strictEqual(alvos.indexOf('gerarPipAnual'), -1, 'item sem funcao nao pode aparecer');
    assert.ok(alvos.indexOf('abrirMenuPipMensal') !== -1, 'os demais itens do grupo continuam');
    assert.ok(alvos.indexOf('normalizarEfetivo') !== -1, 'outros grupos continuam intactos');
  } finally {
    ctx.gerarPipAnual = backup;
  }
});

test('DEFENSIVO: grupo inteiro indisponivel nao derruba o restante do menu', () => {
  const backups = { a: ctx.abrirMenuSelecaoLivreDrogas, b: ctx.iniciarModoAnualDrogas };
  try {
    ctx.abrirMenuSelecaoLivreDrogas = undefined;
    ctx.iniciarModoAnualDrogas = undefined;
    const r = executarOnOpen();
    const grupos = r.addToUi[0].submenus.map(s => s.nome);
    assert.strictEqual(grupos.indexOf('Drogas'), -1, 'grupo sem itens nao aparece');
    assert.ok(grupos.indexOf('Armas') !== -1 && grupos.indexOf('Efetivo') !== -1, 'demais grupos presentes');
  } finally {
    ctx.abrirMenuSelecaoLivreDrogas = backups.a;
    ctx.iniciarModoAnualDrogas = backups.b;
  }
});

test('nenhum arquivo do produto falhou ao carregar no sandbox (base confiavel para o menu)', () => {
  assert.deepStrictEqual(ambiente.falhasCarga, [], 'arquivos com erro de carga: ' + ambiente.falhasCarga.slice(0, 3).join(' | '));
});

console.log(`\nRESULTADOS FINAIS: ${sucessos} PASS / ${falhas} FAIL`);
if (falhas > 0) process.exitCode = 1;
}
