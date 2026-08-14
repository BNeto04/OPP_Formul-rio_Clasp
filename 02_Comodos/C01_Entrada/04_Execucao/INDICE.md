# Mapeamento de Tarefas â€” CÃ´modo C01 Entrada

> **Status Geral do CÃ´modo:** VERIFICADO OFFLINE  

---

## SPRINT C01.1 â€” CentralizaÃ§Ã£o do `onOpen()`

| ID | Tarefa | Arquivo(s) Afetado(s) | Status | Commit |
| :--- | :--- | :--- | :--- | :--- |
| `TASK-C01.1-01` | Converter `onOpen()` para `criarMenuArmas_()` e remover chamadas aninhadas | `Compilador_Armas.js` | **CONCLUÃDA** | `ce8e807` |
| `TASK-C01.1-02` | Substituir bloco de menu manual por chamada defensiva `criarMenuArmas_()` | `Entrada/Menu.js` | **CONCLUÃDA** | `ce8e807` |
| `TASK-C01.1-03` | Validar a presenÃ§a de apenas um `onOpen()` no projeto | `Entrada/Menu.js` | **CONCLUÃDA** | `ce8e807` |

---

## SPRINT C01.2 â€” HigienizaÃ§Ã£o de `EntradaManual.js`

| ID | Tarefa | Arquivo(s) Afetado(s) | Status | Commit |
| :--- | :--- | :--- | :--- | :--- |
| `TASK-C01.2-01` | Extrair `resolverNomeAbaMensal(dataStr)` | `Entrada/EntradaManual.js` | **CONCLUÃDA** | `67f355e` |
| `TASK-C01.2-02` | Extrair `verificarDuplicidadeOcorrencia(aba, boe, mike)` | `Entrada/EntradaManual.js` | **CONCLUÃDA** | `67f355e` |
| `TASK-C01.2-03` | Extrair `montarLinhasEntradaManual(payload)` mantendo matriz idÃªntica | `Entrada/EntradaManual.js` | **CONCLUÃDA** | `67f355e` |
| `TASK-C01.2-04` | Extrair `gravarLinhasEntradaManual(aba, linhas)` preservando colunas de fÃ³rmulas | `Entrada/EntradaManual.js` | **CONCLUÃDA** | `67f355e` |
| `TASK-C01.2-05` | Documentar `getEfetivo()` como Porta C01 â†’ C07 Efetivo | `Entrada/EntradaManual.js` | **CONCLUÃDA** | `67f355e` |
| `TASK-C01.2-06` | Criar documento de regularizaÃ§Ã£o de dÃ­vidas do cÃ´modo C01 | `02_Comodos/C01_ENTRADA.md` | **CONCLUÃDA** | `67f355e` |

---

## SPRINT C01.3 â€” UnificaÃ§Ã£o de Interface PIP & CPM

| ID | Tarefa | Arquivo(s) Afetado(s) | Status | Commit |
| :--- | :--- | :--- | :--- | :--- |
| `TASK-C01.3-01` | Unificar acesso aos relatÃ³rios PIP (Ciclo 29-28) e CPM (MÃªs civil) sob menu `ðŸ† PIP` com submenus | `Entrada/Menu.js` | **CONCLUÃDA** | Local |

---

## Ajustes de Interface & Marcadores

| ID | Tarefa | Arquivo(s) Afetado(s) | Status | Commit |
| :--- | :--- | :--- | :--- | :--- |
| `TASK-C01.0-01` | Trocar tag de escape `<?=` por raw HTML `<?!=` no popup de meses | `Entrada/DialogComparativo2026.html` | **CONCLUÃDA** | `218d341` |
| `TASK-C01.0-02` | Adicionar trava documental contra clasp push inadvertido | `OFFLINE_DOWN_PLANT.md` | **CONCLUÃDA** | `218d341` |


## Extrato de MOD-C01-01_Sprint.md

# Sprint C01 Ã¢â‚¬â€ Entrada (RegularizaÃƒÂ§ÃƒÂ£o Retroativa)

> **Status:** VERIFICADO OFFLINE  
> **Ambiente:** Bancada Offline (`refactor/down-plant-gs-offline`)  
> **Data de ConclusÃƒÂ£o:** 29/07/2026  

---

## Ã°Å¸Å½Â¯ Objetivos da Sprint
1. Transformar o cÃƒÂ´modo **C01 Entrada** na porta humana ÃƒÂºnica do SYNTHÃƒâ€°ON GS.
2. Eliminar concorrÃƒÂªncia de inicializadores (`onOpen()`) espalhados por outros scripts.
3. Refatorar o controlador `EntradaManual.js` sem alterar seu comportamento funcional nem a estrutura das linhas gravadas.
4. Mapear formalmente as portas de comunicaÃƒÂ§ÃƒÂ£o entre C01 e os demais cÃƒÂ´modos (C02, C05, C06, C07, C08).

---

## Ã°Å¸â€œâ€˜ Sprints Menores IncluÃƒÂ­das

### Mini-sprint C01.1 Ã¢â‚¬â€ CentralizaÃƒÂ§ÃƒÂ£o do `onOpen()`
- **Objetivo:** Garantir que apenas `Entrada/Menu.js` possua a funÃƒÂ§ÃƒÂ£o `onOpen()`.
- **Entregas:**
  - RenomeaÃƒÂ§ÃƒÂ£o de `onOpen()` para `criarMenuArmas_()` em `Compilador_Armas.js`.
  - RemoÃƒÂ§ÃƒÂ£o de chamadas aninhadas (`criarMenuPip_`, `criarMenuDrogas_`, `criarMenuCPM_`) de dentro de `Compilador_Armas.js`.
  - Chamada defensiva a `criarMenuArmas_()` em `Entrada/Menu.js`.

### Mini-sprint C01.2 Ã¢â‚¬â€ HigienizaÃƒÂ§ÃƒÂ£o do `EntradaManual.js`
- **Objetivo:** Modularizar o recebimento de payload e orquestraÃƒÂ§ÃƒÂ£o de gravaÃƒÂ§ÃƒÂ£o.
- **Entregas:**
  - ExtraÃƒÂ§ÃƒÂ£o de `resolverNomeAbaMensal(dataStr)`.
  - ExtraÃƒÂ§ÃƒÂ£o de `verificarDuplicidadeOcorrencia(aba, boe, mike)`.
  - ExtraÃƒÂ§ÃƒÂ£o de `montarLinhasEntradaManual(payload)`.
  - ExtraÃƒÂ§ÃƒÂ£o de `gravarLinhasEntradaManual(aba, linhasParaInserir)`.
  - IdentificaÃƒÂ§ÃƒÂ£o e documentaÃƒÂ§ÃƒÂ£o de `getEfetivo()` como Porta C01 Ã¢â€ â€™ C07.

---

## Ã°Å¸Å¸Â¢ CritÃƒÂ©rios de Aceite Atendidos
- [x] Existe apenas um `onOpen()` ativo em todo o ecossistema GS (`Entrada/Menu.js`).
- [x] O fluxo de gravaÃƒÂ§ÃƒÂ£o manual funciona via funÃƒÂ§ÃƒÂµes dedicadas de ÃƒÂºnica responsabilidade.
- [x] A estrutura de colunas e dados gravados nas abas mensais foi mantida 100% idÃƒÂªntica.
- [x] O congelamento offline estÃƒÂ¡ garantido (sem `clasp push` / `git push`).

---

## Ã°Å¸â€œÅ’ EvidÃƒÂªncias de Commits Locais
1. `ce8e807` - `refactor(C01): centraliza abertura de menus na entrada`
2. `218d341` - `chore(offline): registra marcador de seguranca e ajuste no dialog comparativo`
3. `67f355e` - `refactor(C01.2): higieniza EntradaManual e mapeia dividas internas do C01`

---

## Ã°Å¸â€Â® PendÃƒÂªncias Futuras para o C01
- Parametrizar `SS_ID` hardcoded via mÃƒÂ³dulo central de `Config`.
- Mover a implementaÃƒÂ§ÃƒÂ£o concreta de `getEfetivo()` para C07 Efetivo.
- Teste e validaÃƒÂ§ÃƒÂ£o visual das caixas de seleÃƒÂ§ÃƒÂ£o do `DialogComparativo2026.html` ao migrar para a planilha real.


