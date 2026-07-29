# Mapeamento de Tarefas — Cômodo M02 Leitura

> **Status Geral do Cômodo:** EM EXECUÇÃO (M02.1-01, M02.1-02 e M02.1-04 CONCLUÍDAS)  

---

## SPRINT M02.1 — Mapeamento & Encapsulamento dos Adaptadores de Leitura

| ID | Tarefa | Arquivo(s) Afetado(s) | Status | Commit |
| :--- | :--- | :--- | :--- | :--- |
| `TASK-M02.1-01` | Inventariar e analisar funções de leitura | `planta/M02_LEITURA_INVENTARIO.md` | **CONCLUÍDA** | `e171759` |
| `TASK-M02.1-02` | Centralizar IDs de planilha, aliases da aba EFETIVO e meses 2026 | `Core/Config.js`, `Entrada/EntradaManual.js`, `Compilador PIP.js` | **CONCLUÍDA** | `1c1de6f` |
| `TASK-M02.1-03` | Mapear e refatorar `Core/LeitorPlanilhas.js` para abstrair acesso a `SpreadsheetApp` | `Core/LeitorPlanilhas.js` | **PENDENTE** | - |
| `TASK-M02.1-04` | Padronizar busca flexível de colunas por apelidos/aliases de cabeçalho com módulo `Core/Cabecalhos.js` | `Core/Cabecalhos.js`, `Leitura/Adaptador2026.js`, `Core/LeitorPlanilhas.js` | **CONCLUÍDA** | `4de23b2` |
| `TASK-M02.1-05` | Criar testes unitários/offline para os adaptadores de leitura | `Testes/TestAdaptador2026.js` | **PENDENTE** | - |
