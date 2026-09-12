/**
 * ARQUIVO: Entrada/Menu.js
 * DESCRICAO: Porta unica de navegacao do produto (menu P3) - card #130 (MENU-P3-002).
 *
 * Regras deste arquivo:
 *  - UM unico menu superior (`P3`), com submenus por grupo; nenhum menu superior legado;
 *  - cada item aponta para uma FUNCAO JA EXISTENTE no projeto (nenhum alvo inventado);
 *  - construcao DEFENSIVA: se uma funcao alvo nao existir (feature opcional ausente, arquivo com
 *    erro de sintaxe), o item e omitido com log e TODO O RESTANTE DO MENU CONTINUA sendo criado;
 *  - nenhuma regra de negocio aqui: este arquivo so navega.
 *
 * Inventario que fundamenta a arvore: MOD-C01-01_FORMULARIO_E_MENUS/INVENTARIO_MENUS_E_CONTRATO_P3.md (#129).
 */

var MENU_P3_NOME = 'P3';

/**
 * Arvore canonica do P3. Cada item: { rotulo, alvo }. Grupos na ordem do contrato (#129).
 */
function arvoreMenuP3_() {
  return [
    { grupo: 'Formulário', itens: [
      { rotulo: 'Nova ocorrência (formulário)', alvo: 'abrirFormularioEntrada' }
    ]},
    { grupo: 'Armas', itens: [
      { rotulo: 'Seleção livre', alvo: 'abrirMenuSelecaoLivre' },
      { rotulo: 'Anual', alvo: 'iniciarModoAnual' }
    ]},
    { grupo: 'Drogas', itens: [
      { rotulo: 'Seleção livre', alvo: 'abrirMenuSelecaoLivreDrogas' },
      { rotulo: 'Anual', alvo: 'iniciarModoAnualDrogas' }
    ]},
    { grupo: 'Produtividade / Comparativo', itens: [
      { rotulo: 'Gerar produtividade / comparativo 2026', alvo: 'abrirMenuComparativo2026' }
      // GXT e Central Analítica NAO entram no menu: features ABANDONADAS por decisao do proprietario
      // (GXT tera planilha propria; Central Analítica entra na migracao para banco de dados).
      // O codigo permanece no repositorio - nao expomos, nao removemos.
    ]},
    { grupo: 'Guardião da Qualidade', itens: [
      { rotulo: 'Auditar (seletor de meses)', alvo: 'abrirSeletorMesesGuardiao' },
      { rotulo: 'Auditar aba atual', alvo: 'executarGuardiaoQualidade' },
      { rotulo: 'Corrigir fórmulas da aba', alvo: 'corrigirFormulasAbaAtual' }
      // Normalizador Seguro (#122) entra AQUI quando a funcao existir de fato: nada de item apontando para funcao inexistente.
    ]},
    { grupo: 'Efetivo', itens: [
      { rotulo: 'Sincronizar efetivo pelo pécúlio', alvo: 'normalizarEfetivo' }
    ]},
    { grupo: 'PIP / CPM', subgrupos: [
      { rotulo: 'PIP | Ciclo 29–28', itens: [
        { rotulo: 'Gerar mensal', alvo: 'abrirMenuPipMensal' },
        { rotulo: 'Seleção livre', alvo: 'abrirMenuPipLivre' },
        { rotulo: 'Anual', alvo: 'gerarPipAnual' }
      ]},
      { rotulo: 'CPM | Mês civil', itens: [
        { rotulo: 'Gerar mensal', alvo: 'abrirMenuCPMMensal' },
        { rotulo: 'Seleção livre', alvo: 'abrirMenuCPMLivre' },
        { rotulo: 'Anual', alvo: 'gerarCPMAnual' }
      ]}
    ]},
    { grupo: 'Desenvolvimento', itens: [
      { rotulo: '[Dev] Teste de homologação V1 x V2', alvo: 'rodarTesteDeHomologacao' }
    ]}
  ];
}

/** A funcao alvo existe no escopo global (V8/Apps Script e Node)? */
function alvoMenuExiste_(nome) {
  try {
    return typeof globalThis !== 'undefined' && typeof globalThis[nome] === 'function';
  } catch (e) {
    return false;
  }
}

/**
 * Adiciona itens a um menu, omitindo (com log) os que apontam para funcao ausente.
 * @returns {number} quantidade efetivamente adicionada
 */
function adicionarItensMenu_(menu, itens) {
  let adicionados = 0;
  (itens || []).forEach(function (item) {
    if (!alvoMenuExiste_(item.alvo)) {
      Logger.log('Menu P3: item omitido (funcao ausente): ' + item.alvo);
      return;
    }
    menu.addItem(item.rotulo, item.alvo);
    adicionados++;
  });
  return adicionados;
}

/** Constroi o menu unico P3. Retorna um resumo (usado tambem pelos testes). */
function construirMenuP3_() {
  const ui = SpreadsheetApp.getUi();
  const raiz = ui.createMenu(MENU_P3_NOME);
  const resumo = { grupos: [], itens: 0, omitidos: [] };

  arvoreMenuP3_().forEach(function (grupo) {
    const sub = ui.createMenu(grupo.grupo);
    let adicionados = 0;

    if (grupo.subgrupos) {
      grupo.subgrupos.forEach(function (sg) {
        const neto = ui.createMenu(sg.rotulo);
        adicionados += adicionarItensMenu_(neto, sg.itens);
        sub.addSubMenu(neto);
      });
    }
    if (grupo.itens) {
      adicionados += adicionarItensMenu_(sub, grupo.itens);
    }

    if (adicionados === 0) {
      Logger.log('Menu P3: grupo sem itens disponiveis, omitido: ' + grupo.grupo);
      return;
    }
    raiz.addSubMenu(sub);
    resumo.grupos.push(grupo.grupo);
    resumo.itens += adicionados;
  });

  raiz.addToUi();
  Logger.log('Menu P3 construido: ' + resumo.grupos.length + ' grupos, ' + resumo.itens + ' itens.');
  return resumo;
}

function onOpen() {
  try {
    construirMenuP3_();
  } catch (e) {
    Logger.log('Erro ao construir o menu P3: ' + e.message);
    // Rede de seguranca minima: se ate o P3 falhar, o formulario continua alcancavel.
    try {
      SpreadsheetApp.getUi().createMenu('P3')
        .addItem('Nova ocorrência (formulário)', 'abrirFormularioEntrada')
        .addToUi();
    } catch (e2) {
      Logger.log('Falha tambem no menu minimo: ' + e2.message);
    }
  }
}

function abrirFormularioEntrada() {
  const html = HtmlService.createTemplateFromFile('Entrada/Formulario').evaluate();
  html.setTitle('SYNTHEON - Registro Operacional')
      .setWidth(980)
      .setHeight(750);

  SpreadsheetApp.getUi().showModalDialog(html, 'Formulario');
}
