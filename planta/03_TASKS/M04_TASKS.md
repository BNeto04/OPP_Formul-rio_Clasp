# Mapeamento de Tarefas — Cômodo M04 Motor Analítico

> **Status Geral do Cômodo:** EM EXECUÇÃO (TASK-M04.1-01 e TASK-M04.1-02 CONCLUÍDAS)  

---

## 🛑 Regra de Preservação Transversal

> **IMPORTANTE:** O Motor Analítico calcula os totais sem alterar ou descartar informações de pelotão/subunidade e escala de armas necessárias ao M06 Relatórios:  
> [planta/02_SPECS/REGRA_TRANSVERSAL_FORMATACAO_RELATORIOS.md](file:///C:/Users/Bneto04/Documents/Codex/syntheon-gs-downplant-offline/planta/02_SPECS/REGRA_TRANSVERSAL_FORMATACAO_RELATORIOS.md)

---

## SPRINT M04.1 — Purificação & Organização do Motor Analítico

| ID | Tarefa | Arquivo(s) Afetado(s) | Status | Commit |
| :--- | :--- | :--- | :--- | :--- |
| `TASK-M04.1-01` | Inventário detalhado do Motor Analítico V2 e Plugins | `planta/M04_MOTOR_INVENTARIO.md` | **CONCLUÍDA** | `3a50786` |
| `TASK-M04.1-02` | Auditoria de pureza do Motor e Plugins (isolar I/O e GAS) | `planta/M04_MOTOR_PUREZA.md`, `Motor/*.js`, `Plugins/*.js` | **CONCLUÍDA** | `em_progresso` |
| `TASK-M04.1-03` | Blindar contratos e testes unitários dos plugins de métrica | `Testes/TestPlugins.js` | **PENDENTE** | - |
| `TASK-M04.1-04` | Regressão da matemática homologada V1/V2 e deduplicação por túnel | `Testes/*.js` | **PENDENTE** | - |
| `TASK-M04.1-05` | Registrar invariantes finais do Motor e declarar congelamento | `planta/02_SPECS/M04_MOTOR_SPEC.md` | **PENDENTE** | - |
