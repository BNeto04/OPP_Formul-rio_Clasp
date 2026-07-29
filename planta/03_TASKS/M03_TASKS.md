# Mapeamento de Tarefas — Cômodo M03 Domínio

> **Status Geral do Cômodo:** EM EXECUÇÃO (TASK-M03.1-01, TASK-M03.1-02 e TASK-M03.1-03 CONCLUÍDAS)  

---

## 🛑 Regra de Preservação Transversal

> **IMPORTANTE:** Toda alteração no M03 deve preservar integralmente os contratos e dados necessários para os relatórios visuais definidos em:  
> [planta/02_SPECS/REGRA_TRANSVERSAL_FORMATACAO_RELATORIOS.md](file:///C:/Users/Bneto04/Documents/Codex/syntheon-gs-downplant-offline/planta/02_SPECS/REGRA_TRANSVERSAL_FORMATACAO_RELATORIOS.md)  
> *O Domínio não formata a célula, mas é obrigado a preservar os dados fiéis que permitem ao M06 aplicar as cores de pelotões e escalas de armas.*

---

## SPRINT M03.1 — Purificação & Organização do Domínio

| ID | Tarefa | Arquivo(s) Afetado(s) | Status | Commit |
| :--- | :--- | :--- | :--- | :--- |
| `TASK-M03.1-01` | Inventário detalhado das entidades e Value Objects | `planta/M03_DOMINIO_INVENTARIO.md` | **CONCLUÍDA** | `a01d1b9` |
| `TASK-M03.1-02` | Blindar contratos semânticos do Domínio e testes de preservação visual | `Testes/TestDominio.js` | **CONCLUÍDA** | `5e44488` |
| `TASK-M03.1-03` | Auditoria de pureza arquitetural da camada de Domínio (isolar I/O e GAS) | `planta/M03_DOMINIO_PUREZA.md`, `Dominio/*.js` | **CONCLUÍDA** | `em_progresso` |
| `TASK-M03.1-04` | Auditar entidades secundárias (`Policial`, `Ocorrencia`, `Equipe`, `Arma`, `Droga`) | `Dominio/*.js` | **PENDENTE** | - |
| `TASK-M03.1-05` | Garantir suíte de testes do Domínio cobrindo a integridade dos dados visuais | `Testes/TestDominio.js` | **PENDENTE** | - |
