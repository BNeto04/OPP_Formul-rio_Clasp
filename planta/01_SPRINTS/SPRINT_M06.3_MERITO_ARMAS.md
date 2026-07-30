# Sprint M06.3 — Relatório de Mérito de Equipe por Armas

> **Documento:** `planta/01_SPRINTS/SPRINT_M06.3_MERITO_ARMAS.md`  
> **Status:** EM ESPECIFICAÇÃO (TASK-M06.3-01)  
> **Contexto:** Ecossistema Synthéon GS Down Plant Offline  

---

## 🎯 Objetivo da Sprint

Implementar o módulo de **Mérito de Equipe por Armas**, responsável por consolidar e atribuir integralmente as apreensões de armas de fogo e artesanais de um mesmo túnel de ocorrência (`DATA | MIKE | BOE`) ao integrante de **maior antiguidade** (líder da equipe).

O módulo abrange:
- **M04 (Motor & Regra Pura)**: Agrupamento por túnel e atribuição total das armas ao líder mais antigo.
- **M05 (Guardião da Qualidade)**: Diagnóstico e alertas auditáveis em caso de empate ou ausência de antiguidade válida.
- **M06 (Renderizador Visal)**: Geração do relatório de mérito trimestral e resumo mensal por pelotão.

---

## 📌 Status das Tarefas da Sprint M06.3

| Código | Tarefa | Status | Descrição Sintética |
| :--- | :--- | :--- | :--- |
| **M06.3-01** | Especificação e Inventário de Antiguidade | **EM ESPECIFICAÇÃO** | Criação da spec contratual, levantamento das fontes de antiguidade e detalhamento das tarefas. |
| **M06.3-02** | Motor de Atribuição por Antiguidade (M04) | **A INICIAR** | Implementação e testes unitários do algoritmo de seleção de líder por túnel. |
| **M06.3-03** | Diagnósticos e Alertas do Guardião (M05) | **A INICIAR** | Detecção de ocorrências com armas sem antiguidade resolvida ou em empate. |
| **M06.3-04** | Renderizador Trimestral e Resumo (M06) | **A INICIAR** | Geração das abas de saída no formato trimestral lado a lado e resumos por pelotão. |
| **M06.3-05** | Homologação Visual e Testes de Regressão | **A INICIAR** | Validação integrada dos resultados em cópia descartável e automação de testes. |

---

## 🛡️ Regras de Negócio e Princípios Protegidos

1. **Isolamento de Outros Relatórios**: PIP, CPM, COMPARATIVO_2026 e o Relatório Geral de Armas permanecem 100% intocados e independentes.
2. **Unicidade de Atribuição por Túnel**: Um túnel `DATA | MIKE | BOE` gera um único líder contemplado; a soma total das armas físicas do túnel vai integralmente para esse militar.
3. **Contagem de Armas Artesanais**: Cada arma artesanal conta como 1 arma de mérito.
4. **Sem Escolha Silenciosa**: Ausência de dados de antiguidade ou empate de antiguidade gera alerta auditável do Guardião da Qualidade, nunca uma decisão arbitrária ou omissão silenciosa.
