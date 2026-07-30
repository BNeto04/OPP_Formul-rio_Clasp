# Sprint M06.2 — Relatórios Oficiais e Padronização Visual

> **Documento:** `planta/01_SPRINTS/SPRINT_M06.2_RELATORIOS_OFICIAIS.md`  
> **Status:** EM ANDAMENTO (TASK-M06.2-01)  
> **Contexto:** Ecossistema Synthéon GS Down Plant Offline  

---

## 🎯 Objetivo da Sprint

Padronizar a apresentação visual e a experiência de leitura dos **Relatórios Oficiais de Produtividade** (`COMPARATIVO_2026`, `PIP`, `CPM`, `ARMAS` e `DROGAS`) do ecossistema Synthéon GS em ambiente offline.

A referência visual soberana e premium a ser preservada integralmente é o **`COMPARATIVO_2026`**. Nenhuma regra de negócio, cálculo matemático, filtro de data, período ou nome de aba gerada será alterado.

---

## 📊 Mapeamento dos Relatórios Oficiais de Produtividade

| Relatório | Abas Geradas | Função / Menu Executável | Período Operacional | Regras Visuais & Estilização a Aplicar |
| :--- | :--- | :--- | :--- | :--- |
| **COMPARATIVO_2026** | `COMPARATIVO_2026` | `abrirMenuComparativo2026()`, `gerarComparativo2026Premium()` | Anual 2026 / Seleção Livre | **REFERÊNCIA VISUAL IMUTÁVEL** (Cores consagradas de Pelotão: Oficiais `#F1C232`, 1º PEL GTAR `#00CC00` bold, 1º PEL `#00FF00`, 2º PEL GTAR `#3C78D8` bold branco, 2º PEL `#6D9EEB`, 3º PEL `#FFFFFF`; Escala Oficial de Armas com zero em vermelho `#FF0000`; Carimbo e Formatos `#,##0.00`) |
| **PIP** | `PIP_<período>`, `PIP_ANUAL_2026`, `PIP_SELECAO_LIVRE` | `criarMenuPip_()`, `abrirMenuPipMensal()`, `abrirMenuPipLivre()`, `gerarPipAnual()` | Ciclo 29 do mês anterior a 28 do mês | Preserva estado atual do compilador e formatação `#,##0.00`, mantendo rigorosamente a regra de ciclo 29–28 |
| **CPM** | `CPM_<mes>`, `CPM_ANUAL_2026`, `CPM_SELECAO_LIVRE` | `criarMenuCPM_()`, `abrirMenuCPMMensal()`, `abrirMenuCPMLivre()`, `gerarCPMAnual()` | Mês Civil (dia 1º ao último dia) | Preserva estado atual do compilador e formatação `#,##0.00`, mantendo rigorosamente a regra de mês civil |
| **ARMAS** | `COMP_ARMAS_2026`, `COMP_ARMAS_<período>` | `criarMenuArmas_()`, `abrirMenuSelecaoLivre()` | Mensal / Seleção / Anual | Pelotões oficiais (Oficiais `#F1C232`, 1º PEL GTAR `#00CC00`, 1º PEL `#00FF00`, 2º PEL GTAR `#3C78D8`, 2º PEL `#6D9EEB`, 3º PEL `#FFFFFF`) e escala oficial de armas com zero em vermelho (`#FF0000`) |
| **DROGAS** | `COMP_DROGAS_2026`, `COMP_DROGAS_<período>` | `criarMenuDrogas_()`, `abrirMenuSelecaoLivreDrogas()` | Mensal / Seleção / Anual | Pelotões oficiais (Oficiais `#F1C232`, 1º PEL GTAR `#00CC00`, 1º PEL `#00FF00`, 2º PEL GTAR `#3C78D8`, 2º PEL `#6D9EEB`, 3º PEL `#FFFFFF`), alinhamentos à direita e gramaturas formatadas em `#,##0.00`g |

---

## 🛑 Regras Inegociáveis e Governança

1. **Intocabilidade Matemática e Lógica:** É terminantemente proibido alterar fórmulas, filtros, períodos, acumuladores ou matemática de produtividade dos compiladores.
2. **Preservação do `COMPARATIVO_2026` e Paleta Consagrada:** O relatório `COMPARATIVO_2026` e a paleta oficial de pelotões (Oficiais `#F1C232`, 1º PEL GTAR `#00CC00`, 1º PEL `#00FF00`, 2º PEL GTAR `#3C78D8`, 2º PEL `#6D9EEB`, 3º PEL `#FFFFFF`) registrada em `M06_RELATORIOS_SPEC.md` são soberanos. CPM não é categoria de pelotão.
3. **Respeito aos Períodos Distintos (PIP vs CPM):**
   - **PIP**: Usa estritamente o ciclo operacional do dia 29 do mês anterior ao dia 28 do mês corrente.
   - **CPM**: Usa estritamente o mês civil (dia 1º ao último dia do mês).
4. **Suspensão da Central Analítica:** A Central Analítica permanece 100% suspensa (`SUSPENSA`).
5. **Diretriz Zero Push:** Nenhuma publicação remota (`git push` ou `clasp push`). Todos os commits são mantidos localmente na branch `refactor/down-plant-gs-offline`.

---

## 🗓️ Estrutura de Tarefas da Sprint M06.2

- **`TASK-M06.2-01`**: Capturar o contrato visual atual de Comparativo, PIP, CPM, Armas e Drogas.
- **`TASK-M06.2-02`**: Criar suíte de regressão visual para o `COMPARATIVO_2026`.
- **`TASK-M06.2-03`**: Padronizar PIP e CPM respeitando as diferenças de ciclo (29–28 vs mês civil).
- **`TASK-M06.2-04`**: Padronizar ARMAS (pelotões oficiais, GTAR, escala oficial e zero em vermelho).
- **`TASK-M06.2-05`**: Padronizar DROGAS (pelotões oficiais, GTAR, alinhamentos e gramaturas `#,##0.00`g).
- **`TASK-M06.2-06`**: Homologação visual em cópia descartável da planilha e atualização final das regressões.
