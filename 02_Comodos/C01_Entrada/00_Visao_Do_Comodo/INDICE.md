# C01 Entrada

## FunÃ§Ã£o do cÃ´modo

C01 Entrada Ã© a porta humana do SYNTHÃ‰ON GS. Ele conecta o operador aos fluxos do sistema por menus, formulÃ¡rios e diÃ¡logos.

## O que pertence ao C01

- `Entrada/Menu.js`
- `Entrada/Formulario.html`
- `Entrada/DialogComparativo2026.html`
- `Entrada/EntradaManual.js` (controlador de orquestraÃ§Ã£o de entrada)
- abertura do formulÃ¡rio
- criaÃ§Ã£o dos menus
- chamadas `google.script.run` originadas pela interface

## O que nÃ£o pertence ao C01

- cÃ¡lculo de produtividade
- cÃ¡lculo de armas
- cÃ¡lculo de drogas
- cÃ¡lculo de PIP
- regras do GuardiÃ£o
- leitura profunda das abas
- normalizaÃ§Ã£o do efetivo
- homologaÃ§Ã£o V1 x V2

Essas responsabilidades pertencem a outros cÃ´modos.

## Portas

- **C01 â†’ C05 GuardiÃ£o**: `executarGuardiaoQualidade`
- **C01 â†’ C06 RelatÃ³rios**: comparativo, PIP, armas, drogas, CPM
- **C01 â†’ C07 Efetivo**: `getEfetivo()` (consulta de militares para o autocomplete do formulÃ¡rio)
- **C01 â†’ C02 Leitura / Escrita**: `gravarLinhasEntradaManual()` (gravaÃ§Ã£o em chunks nas abas mensais)
- **C01 â†’ C08 HomologaÃ§Ã£o**: `rodarTesteDeHomologacao`

## Estado atual (apÃ³s Mini-sprint C01.2)

- `Entrada/Menu.js`: OPERACIONAL (dono Ãºnico do `onOpen()`)
- `Entrada/Formulario.html`: OPERACIONAL PARCIAL / EM_REFINO
- `Entrada/EntradaManual.js`: HIGIENIZADO (modularizado em funÃ§Ãµes pequenas de resoluÃ§Ã£o, validaÃ§Ã£o anti-duplicidade, montagem de matriz e gravaÃ§Ã£o em chunks)
- `Entrada/DialogComparativo2026.html`: OPERACIONAL (renderizaÃ§Ã£o de HTML `<?!=` corrigida)
- `Compilador_Armas.js`: menu realocado para C01 via `criarMenuArmas_`
- `Entrada/Menu.js`: PORTA UNICA DE NAVEGACAO `P3` (card #130) - 8 grupos, itens `[Dev]` isolados, GXT e Central Analitica FORA do menu (features abandonadas); os menus superiores antigos (Formulario/Armas/Drogas/Produtividade/Pip) nao sao mais criados. Contrato: `MOD-C01-01/INVENTARIO_MENUS_E_CONTRATO_P3.md`; circuito: `CIR-MOD-C01-01_FORMULARIO_E_MENUS.canvas`.

## DÃ­vidas Internas

1. **ID de Planilha Fixo (SS_ID)**:
   - `EntradaManual.js` e `getEfetivo()` utilizam ID fixo rÃ­gido (`1S05sTbd3otgjGjrC-YrzHk7dXp7mzzaw_J2lyQ86hOY`). Deve ser parametrizado pelo mÃ³dulo de `Config` quando C02 for refinado.
2. **LocalizaÃ§Ã£o de getEfetivo()**:
   - `getEfetivo()` atende diretamente o `Formulario.html`, mas sua implementaÃ§Ã£o de leitura da aba `EFETIVO` pertencerÃ¡ nativamente ao cÃ´modo **C07 Efetivo / C02 Leitura**.
3. **Escrita em Chunks RÃ­gida**:
   - As posiÃ§Ãµes das colunas (`B..R`, `U..V`, `X..Y`, `AB..AH`) estÃ£o hardcoded para respeitar as colunas calculadas de fÃ³rmulas da aba mensal. Futuramente essas faixas devem vir de um esquema centralizado (`Schemas/ProdutividadeSchema.js`).

## Regra arquitetural

Somente C01 pode possuir `onOpen()`.

Outros cÃ´modos devem expor funÃ§Ãµes de menu do tipo:

- `criarMenuArmas_`
- `criarMenuPip_`
- `criarMenuDrogas_`
- `criarMenuCPM_`

C01 chama essas funÃ§Ãµes de forma defensiva.

