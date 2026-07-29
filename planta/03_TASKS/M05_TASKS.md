# Mapeamento de Tarefas — Cômodo M05 Guardião da Qualidade

> **Status Geral do Cômodo:** CONCLUÍDO (VERIFICADO OFFLINE - Sprint 1)  

---

## 🛑 Regra de Preservação Transversal

> **IMPORTANTE:** O Guardião audita a integridade sem alterar dados ou regras visuais de relatórios:  
> [planta/02_SPECS/REGRA_TRANSVERSAL_FORMATACAO_RELATORIOS.md](file:///C:/Users/Bneto04/Documents/Codex/syntheon-gs-downplant-offline/planta/02_SPECS/REGRA_TRANSVERSAL_FORMATACAO_RELATORIOS.md)

---

## SPRINT M05.1 — Evolução do Guardião Operacional

| ID | Tarefa | Arquivo(s) Afetado(s) | Status | Commit |
| :--- | :--- | :--- | :--- | :--- |
| `TASK-M05.1-01` | Governança e inventário detalhado do Guardião | `planta/M05_GUARDIAO_INVENTARIO.md` | **CONCLUÍDA** | `0dff947` |
| `TASK-M05.1-02` | Núcleo puro de diagnóstico e desacoplamento de Apps Script | `Core/RegrasQualidade.js`, `planta/M05_GUARDIAO_PUREZA.md` | **CONCLUÍDA** | `64e114e` |
| `TASK-M05.1-02A` | Hotfix: compatibilizar diagnósticos estruturados com o Guardião e criar testes end-to-end | `Features/GuardiaoQualidade.js`, `Render/RendererAuditoriaSaude.js`, `Testes/TestGuardiao.js` | **CONCLUÍDA** | `59a5aeb` |
| `TASK-M05.1-03` | Identidade e coerência do túnel (`MIKE|BOE`, datas, `AG`/`AH`) | `Core/RegrasQualidade.js`, `Features/GuardiaoQualidade.js`, `Testes/TestGuardiao.js` | **CONCLUÍDA** | `6d4a3ea` |
| `TASK-M05.1-03A` | Testes complementares para AH sem AG, MIKE com datas divergentes e objeto Date | `Testes/TestGuardiao.js` | **CONCLUÍDA** | `ecff70a` |
| `TASK-M05.1-04` | Auditoria de fórmulas, matemática e exceções por nota `EXCECAO:` | `Core/RegrasQualidade.js`, `Features/GuardiaoQualidade.js`, `Testes/TestGuardiao.js` | **CONCLUÍDA** | `e89747e` |
| `TASK-M05.1-04A` | Correção da validação matemática do rateio (soma de fatos) e consulta dinâmica ao catálogo PIP | `Core/RegrasQualidade.js`, `Testes/TestGuardiao.js` | **CONCLUÍDA** | `09d1973` |
| `TASK-M05.1-04B` | Integração real do catálogo PIP via aba e cobertura de rateio zerado | `Core/RegrasQualidade.js`, `Features/GuardiaoQualidade.js`, `Testes/TestGuardiao.js` | **CONCLUÍDA** | `fcd914d` |
| `TASK-M05.1-04C` | Localização flexível por aliases da Tabela PIP/coluna e tratamento de catálogo vazio | `Features/GuardiaoQualidade.js`, `Testes/TestGuardiao.js` | **CONCLUÍDA** | `d46b197` |
| `TASK-M05.1-04D` | Normalização estrita de aliases (hífen/underline) e remoção de fallback para Coluna A | `Features/GuardiaoQualidade.js`, `Testes/TestGuardiao.js` | **CONCLUÍDA** | `9c73632` |
| `TASK-M05.1-05` | Formatador de auditoria legível (`Ação Recomendada` e `Histórico`) | `Render/RendererAuditoriaSaude.js`, `Features/GuardiaoQualidade.js`, `Testes/TestGuardiao.js` | **CONCLUÍDA** | `dda60ca` |
| `TASK-M05.1-06` | Homologação final offline do Guardião (Fixture E2E e Protocolo de Homologação) | `Testes/TestGuardiao.js`, `planta/M05_GUARDIAO_HOMOLOGACAO.md` | **CONCLUÍDA** | `em_progresso` |
