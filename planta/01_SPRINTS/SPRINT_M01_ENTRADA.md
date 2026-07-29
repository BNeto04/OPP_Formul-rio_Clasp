# Sprint M01 — Entrada (Regularização Retroativa)

> **Status:** VERIFICADO OFFLINE  
> **Ambiente:** Bancada Offline (`refactor/down-plant-gs-offline`)  
> **Data de Conclusão:** 29/07/2026  

---

## 🎯 Objetivos da Sprint
1. Transformar o cômodo **M01 Entrada** na porta humana única do SYNTHÉON GS.
2. Eliminar concorrência de inicializadores (`onOpen()`) espalhados por outros scripts.
3. Refatorar o controlador `EntradaManual.js` sem alterar seu comportamento funcional nem a estrutura das linhas gravadas.
4. Mapear formalmente as portas de comunicação entre M01 e os demais cômodos (M02, M05, M06, M07, M08).

---

## 📑 Sprints Menores Incluídas

### Mini-sprint M01.1 — Centralização do `onOpen()`
- **Objetivo:** Garantir que apenas `Entrada/Menu.js` possua a função `onOpen()`.
- **Entregas:**
  - Renomeação de `onOpen()` para `criarMenuArmas_()` em `Compilador_Armas.js`.
  - Remoção de chamadas aninhadas (`criarMenuPip_`, `criarMenuDrogas_`, `criarMenuCPM_`) de dentro de `Compilador_Armas.js`.
  - Chamada defensiva a `criarMenuArmas_()` em `Entrada/Menu.js`.

### Mini-sprint M01.2 — Higienização do `EntradaManual.js`
- **Objetivo:** Modularizar o recebimento de payload e orquestração de gravação.
- **Entregas:**
  - Extração de `resolverNomeAbaMensal(dataStr)`.
  - Extração de `verificarDuplicidadeOcorrencia(aba, boe, mike)`.
  - Extração de `montarLinhasEntradaManual(payload)`.
  - Extração de `gravarLinhasEntradaManual(aba, linhasParaInserir)`.
  - Identificação e documentação de `getEfetivo()` como Porta M01 → M07.

---

## 🟢 Critérios de Aceite Atendidos
- [x] Existe apenas um `onOpen()` ativo em todo o ecossistema GS (`Entrada/Menu.js`).
- [x] O fluxo de gravação manual funciona via funções dedicadas de única responsabilidade.
- [x] A estrutura de colunas e dados gravados nas abas mensais foi mantida 100% idêntica.
- [x] O congelamento offline está garantido (sem `clasp push` / `git push`).

---

## 📌 Evidências de Commits Locais
1. `ce8e807` - `refactor(m01): centraliza abertura de menus na entrada`
2. `218d341` - `chore(offline): registra marcador de seguranca e ajuste no dialog comparativo`
3. `67f355e` - `refactor(m01.2): higieniza EntradaManual e mapeia dividas internas do M01`

---

## 🔮 Pendências Futuras para o M01
- Parametrizar `SS_ID` hardcoded via módulo central de `Config`.
- Mover a implementação concreta de `getEfetivo()` para M07 Efetivo.
- Teste e validação visual das caixas de seleção do `DialogComparativo2026.html` ao migrar para a planilha real.
