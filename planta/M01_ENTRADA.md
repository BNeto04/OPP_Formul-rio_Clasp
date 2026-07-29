# M01 Entrada

## Função do cômodo

M01 Entrada é a porta humana do SYNTHÉON GS. Ele conecta o operador aos fluxos do sistema por menus, formulários e diálogos.

## O que pertence ao M01

- `Entrada/Menu.js`
- `Entrada/Formulario.html`
- `Entrada/DialogComparativo2026.html`
- `Entrada/EntradaManual.js` (controlador de orquestração de entrada)
- abertura do formulário
- criação dos menus
- chamadas `google.script.run` originadas pela interface

## O que não pertence ao M01

- cálculo de produtividade
- cálculo de armas
- cálculo de drogas
- cálculo de PIP
- regras do Guardião
- leitura profunda das abas
- normalização do efetivo
- homologação V1 x V2

Essas responsabilidades pertencem a outros cômodos.

## Portas

- **M01 → M05 Guardião**: `executarGuardiaoQualidade`
- **M01 → M06 Relatórios**: comparativo, PIP, armas, drogas, CPM
- **M01 → M07 Efetivo**: `getEfetivo()` (consulta de militares para o autocomplete do formulário)
- **M01 → M02 Leitura / Escrita**: `gravarLinhasEntradaManual()` (gravação em chunks nas abas mensais)
- **M01 → M08 Homologação**: `rodarTesteDeHomologacao`

## Estado atual (após Mini-sprint M01.2)

- `Entrada/Menu.js`: OPERACIONAL (dono único do `onOpen()`)
- `Entrada/Formulario.html`: OPERACIONAL PARCIAL / EM_REFINO
- `Entrada/EntradaManual.js`: HIGIENIZADO (modularizado em funções pequenas de resolução, validação anti-duplicidade, montagem de matriz e gravação em chunks)
- `Entrada/DialogComparativo2026.html`: OPERACIONAL (renderização de HTML `<?!=` corrigida)
- `Compilador_Armas.js`: menu realocado para M01 via `criarMenuArmas_`

## Dívidas Internas

1. **ID de Planilha Fixo (SS_ID)**:
   - `EntradaManual.js` e `getEfetivo()` utilizam ID fixo rígido (`1S05sTbd3otgjGjrC-YrzHk7dXp7mzzaw_J2lyQ86hOY`). Deve ser parametrizado pelo módulo de `Config` quando M02 for refinado.
2. **Localização de getEfetivo()**:
   - `getEfetivo()` atende diretamente o `Formulario.html`, mas sua implementação de leitura da aba `EFETIVO` pertencerá nativamente ao cômodo **M07 Efetivo / M02 Leitura**.
3. **Escrita em Chunks Rígida**:
   - As posições das colunas (`B..R`, `U..V`, `X..Y`, `AB..AH`) estão hardcoded para respeitar as colunas calculadas de fórmulas da aba mensal. Futuramente essas faixas devem vir de um esquema centralizado (`Schemas/ProdutividadeSchema.js`).

## Regra arquitetural

Somente M01 pode possuir `onOpen()`.

Outros cômodos devem expor funções de menu do tipo:

- `criarMenuArmas_`
- `criarMenuPip_`
- `criarMenuDrogas_`
- `criarMenuCPM_`

M01 chama essas funções de forma defensiva.
