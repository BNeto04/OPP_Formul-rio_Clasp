# ESPELHO — Menu.js

> [!NOTE] Espelho rico de código (Metodo §46.15) — gerado por `scripts/downplant/espelho-rico.mjs`
> Somente leitura. Não editar à mão: qualquer edição é sobrescrita na próxima geração.
> O código abaixo é cópia verbatim do arquivo de origem no commit declarado; divergência entre o embutido e a origem é deriva (§18.1).
> Regra do sha256 declarado: sha256 do conteúdo **normalizado para LF** (igual ao blob do Git). Em arquivo CRLF com terminador final diferente, ele difere do `sha256sum` dos bytes crus — a comparação de deriva é feita conteúdo-contra-conteúdo.
> Papel desta cópia: CANÔNICA (repositório). O derivado navegável no vault é gerado com as mesmas entradas.

- **Endereço Down Plant:** `C01_Entrada / MOD-C01-01_FORMULARIO_E_MENUS` — [NOTA_DE_RESPONSABILIDADE.md](../../02_Comodos/C01_Entrada/01_Dominio/modulos/MOD-C01-01_FORMULARIO_E_MENUS/NOTA_DE_RESPONSABILIDADE.md)
- **Arquivo de origem (link para o disco):** [`Entrada/Menu.js`](../../Entrada/Menu.js)
- **Commit de referência:** `fbb0608e7b98144533628c7f9b773a10505b800d` (`fbb0608`)
- **Data da última sincronização:** 2026-09-13T21:45:28-03:00

## Código-fonte embutido

Verbatim de `Entrada/Menu.js` em `fbb0608`. sha256 do bloco (LF): `f37bacf69422a53751dfec796daabb39a669ce6e85c767896a258a9e8e72c58f` — 151 linhas.

```javascript
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
      { rotulo: 'Corrigir fórmulas da aba', alvo: 'corrigirFormulasAbaAtual' },
      { rotulo: 'Corrigir túneis da aba (DATA/BOE)', alvo: 'corrigirTuneisAbaAtual' }
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
```

## Responsabilidade observada

Fonte: `02_Comodos/C01_Entrada/01_Dominio/modulos/MOD-C01-01_FORMULARIO_E_MENUS/MOD-C01-01_FORMULARIO_E_MENUS.md` — CAPSULA do modulo (formato 46.2), "## Responsabilidade".

Receber o texto do BO (colagem/OCR), transformá-lo em **payload conferível** e entregá-lo à persistência (`SUB-C01-01-02_PERSISTENCIA_MANUAL`). Não decide pontuação, não corrige dado: **sugere e deixa conferir**. Também expõe a **porta única de navegação P3** do produto.

Fonte: `02_Comodos/C01_Entrada/01_Dominio/modulos/MOD-C01-01_FORMULARIO_E_MENUS/MOD-C01-01_FORMULARIO_E_MENUS.md` — CAPSULA do modulo (formato 46.2), "## Limites".

- **Não** grava direto na aba mensal: o payload passa por `Entrada/EntradaManual.js` (validação de coluna, anti-duplicidade, fórmula).
- **Não** decide imputado (`IMPUTADO?` é escolha do operador; DETIDOS nunca é inferido).
- **Não** aplica regra de domínio nova por heurística: consulta a ARCA quando a regra existe (fail-soft).
- **Não** inventa valor: campo sem evidência fica pendente e **explícito** (ex.: alerta `CONFERIR AIS`).

## Portas expostas (se aplicável)

- Superfície exposta no nível do arquivo (nível global): `arvoreMenuP3_`, `alvoMenuExiste_`, `adicionarItensMenu_`, `construirMenuP3_`, `onOpen`, `abrirFormularioEntrada`
- Membros públicos observados: `arvoreMenuP3_`, `construirMenuP3_`

_Extraído por heurística do gerador (globais de nível arquivo + métodos/accessors de 1º–2º nível). Não substitui a declaração de porta da Planta: confirme no endereço acima._

## Divergência com a Planta declarada

Testes mecânicos executados na geração (commit `fbb0608`, 2026-09-13T21:45:28-03:00):

- OK — T1 endereco existe: NOTA_DE_RESPONSABILIDADE.md do modulo presente
- OK — T2 artefato declarado no endereco: "Entrada/Menu.js" aparece na Planta
- OK — T3 arquivo presente no commit de referencia (fbb0608:Entrada/Menu.js)
- OK — T4 conteudo em disco identico ao do commit de referencia (sha256 LF)
- OK — T5 espelho anterior sem deriva de codigo (sha256 do bloco == origem)
- OK — T6 endereco declarado no espelho anterior corresponde ao endereco canonico atual
- OK — T7 sem duplicidade: exatamente 1 espelho de leitura declara "Entrada/Menu.js" como origem

Veredito mecânico: **nenhuma divergência detectada pelos testes acima**.

Declaração verificada a mão por humano/agente (não derivável automaticamente):

- **Como o endereco foi derivado (nao inventado):** secao Artefatos; fonte `02_Comodos/C01_Entrada/01_Dominio/modulos/MOD-C01-01_FORMULARIO_E_MENUS/MOD-C01-01_FORMULARIO_E_MENUS.md`:57.
- **Enderecos concorrentes declarados na Planta (1):** `C01_Entrada/MOD-C01-02_NORMALIZADOR_DE_EFETIVO`. O artefato e referenciado em mais de um endereco; o campo acima registra o endereco PRIMARIO. Nao e erro de endereco — e declaracao concorrente na propria Planta.
- **Nada foi corrigido no artefato:** o gerador nao altera codigo de produto; o arquivo de origem permanece byte a byte como estava.

## Última verificação (data/commit)

- 2026-09-13T21:45:28-03:00 · commit `fbb0608` · sha256 da origem (LF): `f37bacf69422a53751dfec796daabb39a669ce6e85c767896a258a9e8e72c58f`
- Reexecutar: `node scripts/downplant/espelho-rico.mjs gerar --endereco C01_Entrada/MOD-C01-01_FORMULARIO_E_MENUS --origem Entrada/Menu.js --saida <caminho>`
- Verificar deriva sem regravar: `node scripts/downplant/espelho-rico.mjs verificar --espelho <caminho>`
