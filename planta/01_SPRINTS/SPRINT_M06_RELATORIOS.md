# Sprint M06 — Relatórios Oficiais e Formatação Visual

> **Documento:** `planta/01_SPRINTS/SPRINT_M06_RELATORIOS.md`  
> **Status:** EM ANDAMENTO (TASK-M06.1-01)  
> **Contexto:** Ecossistema Synthéon GS Down Plant Offline  

---

## 🎯 Objetivo da Sprint

Padronizar a apresentação visual, estrutura de tabelas, estilos de cabeçalho, formatação numérica e geração de relatórios oficiais do ecossistema Synthéon em ambiente offline, garantindo legibilidade executiva e rigor técnico sem alterar a lógica de dados operacionais.

---

## 🛑 Regras de Governança e Diretrizes Absolutas

1. **Central Analítica Suspensa:** A Central Analítica permanece estritamente suspensa (`SUSPENSA`) nesta sprint. Não criar integrações ou chamadas ativas para consolidação global da Central Analítica.
2. **Preservação de Dados Operacionais:** As funções de formatação e renderização tratam a formatação visual (cores, bordas, fontes, alinhamentos e formatos numéricos). Elas jamais alteram ou sobrescrevem os valores brutos dos fatos operacionais.
3. **Limite Estrito de Arquivos:** Respeitar o teto máximo de **5 arquivos modificados por turno/checkpoint**. Se uma demanda exigir a alteração de mais de 5 arquivos, o executor deve **solicitar autorização prévia ao usuário**.
4. **Zero Push Rule:** Mantida a restrição total de execução de `git push` ou `clasp push`.

---

## 📦 Inventário Inicial de Relatórios Envolvidos

1. **Aba de Auditoria Atual (`[AUDITORIA] Ocorrencias`)**:
   - Painel resumo de saúde da planilha + Tabela de 8 colunas de diagnósticos.
2. **Aba de Histórico Cumulativo (`[HISTORICO] Auditoria Ocorrencias`)**:
   - Tabela cumulativa de registros históricos de auditorias com data/hora.
3. **Abas Operacionais Mensais (`JAN2026` a `DEZ2026`)**:
   - Padronização de larguras de coluna, alinhamentos, zebrados e destaque visual da Coluna AM (`Alerta Integridade`).
4. **Relatório Consolidado Mensal/Trimestral (Futuro)**:
   - Exportação limpa de métricas produtivas prontas para apresentação aos comandos.

---

## 🗓️ Planejamento de Entregas

- `TASK-M06.1-01`: Inventário de Relatórios e Regras Visuais (**Em Execução**).
- `TASK-M06.1-02`: Estilização e Formatação Visual de `[AUDITORIA] Ocorrencias`.
- `TASK-M06.1-03`: Estilização e Formatação Visual de `[HISTORICO] Auditoria Ocorrencias`.
- `TASK-M06.1-04`: Padronização Visual das Abas Mensais Operacionais e Destaques.
- `TASK-M06.1-05`: Suíte de Testes Visuais e Homologação Offline do M06.
