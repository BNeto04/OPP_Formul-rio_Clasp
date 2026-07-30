# Sprint M06.2 — Relatórios Oficiais e Padronização Visual

> **Documento:** `planta/01_SPRINTS/SPRINT_M06.2_RELATORIOS_OFICIAIS.md`  
> **Status:** EM HOMOLOGAÇÃO MANUAL (TASK-M06.2-06A Concluída)  
> **Contexto:** Ecossistema Synthéon GS Down Plant Offline  

---

## 🎯 Objetivo da Sprint

Padronizar a apresentação visual e a legibilidade dos **Relatórios Oficiais de Produtividade** do Synthéon GS (`COMPARATIVO_2026`, `PIP`, `CPM`, `ARMAS` e `DROGAS`), alinhando-os à paleta consagrada de produtividade (Oficiais `#F1C232`, 1º PEL GTAR `#00CC00` bold, 1º PEL `#00FF00`, 2º PEL GTAR `#3C78D8` bold branco, 2º PEL `#6D9EEB`, 3º PEL `#FFFFFF`) e protegendo as regras de negócio de cada módulo.

---

## 📌 Status das Tarefas da Sprint

| Código | Tarefa | Status | Descrição Sintética |
| :--- | :--- | :--- | :--- |
| **M06.2-01** | Captura do Contrato Visual Atual | **CONCLUÍDO** | Mapeamento dos contratos visuais dos 5 relatórios e alinhamento da especificação à paleta consagrada. |
| **M06.2-02** | Suíte de Regressão COMPARATIVO_2026 | **CONCLUÍDO** | Suíte isolada de 6 testes protegendo a referência visual premium sem alterar código produtivo. |
| **M06.2-03** | Padronização Visual PIP e CPM | **CONCLUÍDO** | Padronização visual preservando período de ciclo 29–28 (PIP) e mês civil (CPM). |
| **M06.2-04** | Padronização Visual ARMAS | **CONCLUÍDO** | Aplicação da paleta oficial de pelotões/GTAR e escala de armas com teste de integração real. |
| **M06.2-05** | Padronização Visual DROGAS | **CONCLUÍDO** | Aplicação da paleta oficial de pelotões/GTAR e escala de gramagem em 10 colunas com teste real. |
| **M06.2-06** | Homologação Visual em Cópia | **EM HOMOLOGAÇÃO MANUAL** | Pré-requisitos offline aprovados (85/85); aguardando execução manual em cópia descartável. |

---

## 🛡️ Regras Globais Protegidas

1. **COMPARATIVO_2026 Intocável**: Mantido como referência estética sovereign premium.
2. **Separação PIP x CPM**: PIP em ciclo 29–28 e CPM em mês civil.
3. **Pelotões Especiais**: 1º PEL GTAR (`#00CC00` bold) e 2º PEL GTAR (`#3C78D8` bold branco) preservados com destaque semântico.
4. **Central Analítica Suspensa**: Central Analítica permanece suspensa durante toda a homologação.
5. **Zero Remote Push**: `clasp push` e `git push` desativados e intocáveis.
