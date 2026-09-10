# MOD-C01-01_FORMULARIO_E_MENUS

Responsabilidade canonica do modulo.

## Porta de navegacao unica P3 (cards #130/#131/#132)
`Entrada/Menu.js` e a **porta unica de navegacao** do produto: `onOpen` cria UM menu superior `P3` cujos submenus sao os 8 grupos do contrato do #129 (Formulario, Armas, Drogas, Produtividade/Comparativo, Guardiao da Qualidade, Efetivo, PIP/CPM, Desenvolvimento). O circuito esta em `CIR-MOD-C01-01_FORMULARIO_E_MENUS.canvas`.

Mapa grupo -> endereco (evidencia de codigo):
| Grupo P3 | Alvo(s) | Endereco / arquivo |
|---|---|---|
| Formulario | `abrirFormularioEntrada` | C01 / MOD-C01-01 (`Entrada/Formulario.html`) |
| Armas | `abrirMenuSelecaoLivre`, `iniciarModoAnual` | `Compilador_Armas.js` (menu realocado para C01) |
| Drogas | `abrirMenuSelecaoLivreDrogas`, `iniciarModoAnualDrogas` | `Compilador de Entorpecentes.js` |
| Produtividade / Comparativo | `abrirMenuComparativo2026`, `abrirMenuGxtSelecaoLivre`, `gerarGxtAnual`, `rodarCentralAnaliticaAnual`, `abrirMenuCentralAnaliticaSelecaoLivre` | C06 / `Features/CompiladorProdutividade.js`, `Features/CompiladorGxt.js`; C04 / `Features/CentralAnalitica.js` |
| Guardiao da Qualidade | `abrirSeletorMesesGuardiao`, `executarGuardiaoQualidade` | C05 / MOD-C05-01 (`Features/GuardiaoQualidade.js`) |
| Efetivo | `normalizarEfetivo` | C01 / MOD-C01-02 (`Features/NormalizadorEfetivo.js`) |
| PIP / CPM | `abrirMenuPipMensal/Livre`, `gerarPipAnual`, `abrirMenuCPMMensal/Livre`, `gerarCPMAnual` | C02 / `Compilador PIP.js`, CPM (compilador de pontuacao mensal) |
| Desenvolvimento | `rodarTesteDeHomologacao` | C08 / `Homologacao/` (fora do push) |

Invariantes da porta:
- nenhuma funcao alvo foi renomeada; nenhuma regra de negocio vive neste arquivo (so navegacao);
- item cuja funcao alvo nao existe e OMITIDO com log (`[MENU_P3] item omitido`) - menu nao quebra;
- itens `[Dev]` ficam isolados no grupo Desenvolvimento;
- **Normalizador Seguro nao tem item ativo** enquanto nao existir funcao real de execucao (#122);
- GXT e Central Analitica passaram a ter entrada de menu (antes nao tinham nenhuma).

Evidencia: `Testes/TestMenuP3.js` (12 PASS) carrega o produto real num sandbox `vm` com `SpreadsheetApp` falso e valida a arvore, os alvos vivos e a construcao defensiva.
Rollback: `git revert` do commit do #130 (`Entrada/Menu.js`) restaura os menus superiores anteriores.

## Inventario de menus e contrato do P3 (card #129)
O levantamento factual dos 5 menus atuais, da matriz ITEM_ATUAL -> FUNCAO -> MENU_P3_ALVO e da arvore canonica do menu unico `P3` esta em `INVENTARIO_MENUS_E_CONTRATO_P3.md` (nesta pasta). Nenhum comportamento foi alterado neste card.
