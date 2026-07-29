# M01 Entrada

## Função do cômodo

M01 Entrada é a porta humana do SYNTHÉON GS. Ele conecta o operador aos fluxos do sistema por menus, formulários e diálogos.

## O que pertence ao M01

- `Entrada/Menu.js`
- `Entrada/Formulario.html`
- `Entrada/DialogComparativo2026.html`
- `Entrada/EntradaManual.js`
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

- M01 → M05 Guardião: `executarGuardiaoQualidade`
- M01 → M06 Relatórios: comparativo, PIP, armas, drogas, CPM
- M01 → M07 Efetivo: `getEfetivo`, `normalizarEfetivo`
- M01 → M08 Homologação: `rodarTesteDeHomologacao`

## Estado atual

- `Entrada/Menu.js`: OPERACIONAL
- `Entrada/Formulario.html`: OPERACIONAL PARCIAL / EM_REFINO
- `Entrada/EntradaManual.js`: OPERACIONAL COM DÍVIDA
- `Entrada/DialogComparativo2026.html`: OPERACIONAL
- `Compilador_Armas.js`: menu realocado para M01 via `criarMenuArmas_`

## Regra arquitetural

Somente M01 pode possuir `onOpen()`.

Outros cômodos devem expor funções de menu do tipo:

- `criarMenuArmas_`
- `criarMenuPip_`
- `criarMenuDrogas_`
- `criarMenuCPM_`

M01 chama essas funções de forma defensiva.
