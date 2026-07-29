# Mapeamento de Tarefas — Cômodo M01 Entrada

> **Status Geral do Cômodo:** VERIFICADO OFFLINE  

---

## SPRINT M01.1 — Centralização do `onOpen()`

| ID | Tarefa | Arquivo(s) Afetado(s) | Status | Commit |
| :--- | :--- | :--- | :--- | :--- |
| `TASK-M01.1-01` | Converter `onOpen()` para `criarMenuArmas_()` e remover chamadas aninhadas | `Compilador_Armas.js` | **CONCLUÍDA** | `ce8e807` |
| `TASK-M01.1-02` | Substituir bloco de menu manual por chamada defensiva `criarMenuArmas_()` | `Entrada/Menu.js` | **CONCLUÍDA** | `ce8e807` |
| `TASK-M01.1-03` | Validar a presença de apenas um `onOpen()` no projeto | `Entrada/Menu.js` | **CONCLUÍDA** | `ce8e807` |

---

## SPRINT M01.2 — Higienização de `EntradaManual.js`

| ID | Tarefa | Arquivo(s) Afetado(s) | Status | Commit |
| :--- | :--- | :--- | :--- | :--- |
| `TASK-M01.2-01` | Extrair `resolverNomeAbaMensal(dataStr)` | `Entrada/EntradaManual.js` | **CONCLUÍDA** | `67f355e` |
| `TASK-M01.2-02` | Extrair `verificarDuplicidadeOcorrencia(aba, boe, mike)` | `Entrada/EntradaManual.js` | **CONCLUÍDA** | `67f355e` |
| `TASK-M01.2-03` | Extrair `montarLinhasEntradaManual(payload)` mantendo matriz idêntica | `Entrada/EntradaManual.js` | **CONCLUÍDA** | `67f355e` |
| `TASK-M01.2-04` | Extrair `gravarLinhasEntradaManual(aba, linhas)` preservando colunas de fórmulas | `Entrada/EntradaManual.js` | **CONCLUÍDA** | `67f355e` |
| `TASK-M01.2-05` | Documentar `getEfetivo()` como Porta M01 → M07 Efetivo | `Entrada/EntradaManual.js` | **CONCLUÍDA** | `67f355e` |
| `TASK-M01.2-06` | Criar documento de regularização de dívidas do cômodo M01 | `planta/M01_ENTRADA.md` | **CONCLUÍDA** | `67f355e` |

---

## Ajustes de Interface & Marcadores

| ID | Tarefa | Arquivo(s) Afetado(s) | Status | Commit |
| :--- | :--- | :--- | :--- | :--- |
| `TASK-M01.0-01` | Trocar tag de escape `<?=` por raw HTML `<?!=` no popup de meses | `Entrada/DialogComparativo2026.html` | **CONCLUÍDA** | `218d341` |
| `TASK-M01.0-02` | Adicionar trava documental contra clasp push inadvertido | `OFFLINE_DOWN_PLANT.md` | **CONCLUÍDA** | `218d341` |
