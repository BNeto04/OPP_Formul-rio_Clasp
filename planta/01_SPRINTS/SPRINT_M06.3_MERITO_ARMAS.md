# Sprint M06.3 — Relatório de Mérito de Equipe por Armas

> **Documento:** `planta/01_SPRINTS/SPRINT_M06.3_MERITO_ARMAS.md`  
> **Status:** EM HOMOLOGAÇÃO MANUAL (TASK-M06.3-05A)  
> **Contexto:** Ecossistema Synthéon GS Down Plant Offline  

---

## 🎯 Objetivo da Sprint

Implementar o módulo de **Mérito de Equipe por Armas**, responsável por consolidar e atribuir integralmente as apreensões de armas de fogo e artesanais de um mesmo túnel de ocorrência (`DATA | MIKE | BOE`) ao integrante de **maior antiguidade** (líder da equipe).

O módulo abrange:
- **M04 (Motor & Regra Pura)**: Agrupamento por túnel e atribuição total das armas ao líder mais antigo.
- **M05 (Guardião da Qualidade)**: Diagnóstico e alertas auditáveis em caso de empate ou ausência de antiguidade válida.
- **M06 (Renderizador Visual)**: Geração do relatório de mérito trimestral e resumo mensal por pelotão.

---

## 📌 Status das Tarefas da Sprint M06.3

| Código | Tarefa | Status | Descrição Sintética |
| :--- | :--- | :--- | :--- |
| **M06.3-01** | Especificação e Inventário de Antiguidade | **CONCLUÍDO** | Criação da spec contratual, levantamento das fontes de antiguidade e detalhamento das tarefas. |
| **M06.3-02** | Motor de Atribuição por Antiguidade (M04) | **CONCLUÍDO** | Implementação e testes unitários do algoritmo de seleção de líder por túnel por menor N. |
| **M06.3-03** | Diagnósticos e Alertas do Guardião (M05) | **CONCLUÍDO** | Detecção de ocorrências com armas sem antiguidade resolvida, empate ou fonte ausente. |
| **M06.3-04** | Renderizador Trimestral, Escala e UI (M06) | **CONCLUÍDO** | Geração do relatório trimestral, escala oficial de armas, menu UI e empilhamento vertical. |
| **M06.3-05** | Homologação Visual e Testes de Regressão | **EM HOMOLOGAÇÃO MANUAL** | Protocolo em `planta/04_PROTOCOLS/M06.3_PROTOCOLO_HOMOLOGACAO_GXT.md` para testes em cópia descartável. |

---

## 🛡️ Regras de Negócio e Princípios Protegidos

1. **Isolamento de Outros Relatórios**: PIP, CPM, COMPARATIVO_2026 e o Relatório Geral de Armas permanecem 100% intocados e independentes.
2. **Unicidade de Atribuição por Túnel**: Um túnel `DATA | MIKE | BOE` gera um único líder contemplado; a soma total das armas físicas do túnel vai integralmente para esse militar.
3. **Contagem de Armas Artesanais**: Cada arma artesanal conta como 1 arma de mérito.
4. **Sem Escolha Silenciosa**: Ausência de dados de antiguidade ou empate de antiguidade gera alerta auditável do Guardião da Qualidade, nunca uma decisão arbitrária ou omissão silenciosa.
