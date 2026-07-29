# M06 — Relatórios Oficiais e Formatação Visual (Tasks)

> **Documento:** `planta/03_TASKS/M06_TASKS.md`  
> **Status da Sprint:** EM ANDAMENTO (TASK-M06.1-01 Concluída)  
> **Contexto:** Ecossistema Synthéon GS Down Plant Offline  

---

## 🎯 Lista Integrada de Tarefas do M06

### [CONCLUÍDO] TASK-M06.1-01 — Inventário de Relatórios e Regras Visuais
- Criar `planta/01_SPRINTS/SPRINT_M06_RELATORIOS.md` definindo o escopo da sprint.
- Criar `planta/02_SPECS/M06_RELATORIOS_SPEC.md` definindo o Design System, paletas de cores por severidade, alinhamentos, fontes e formatos numéricos.
- Criar `planta/03_TASKS/M06_TASKS.md` estruturando o backlog do cômodo M06.
- Garantir a suspensão explícita da **Central Analítica** e o respeito ao limite máximo de 5 arquivos por turno.

### [PENDENTE] TASK-M06.1-02 — Estilização e Formatação Visual da Aba [AUDITORIA] Ocorrencias
- Atualizar `Render/RendererAuditoriaSaude.js` para aplicar cores por severidade (`CRITICO`, `ALERTA`, `OBSERVACAO`, `EXCECAO MANUAL`, `APROVADO`).
- Ajustar formatação do Card de Resumo das Linhas 1-3.
- Ajustar congelamento de painéis, larguras de coluna e zebrado visual.

### [PENDENTE] TASK-M06.1-03 — Estilização e Formatação Visual da Aba [HISTORICO] Auditoria Ocorrencias
- Atualizar o gerador de histórico em `Render/RendererAuditoriaSaude.js` para aplicar formatação de cabeçalho e zebrado cumulativo.
- Preservar alinhamentos e destaque visual de severidades nas execuções arquivadas.

### [PENDENTE] TASK-M06.1-04 — Padronização Visual das Abas Mensais e Coluna AM
- Aplicar destaque visual discreto na Coluna AM (`Alerta Integridade`) das abas operacionais mensais.
- Garantir que células limpas fiquem sem formatação ou alertas falsos.

### [PENDENTE] TASK-M06.1-05 — Suíte de Testes Visuais e Homologação Offline do M06
- Criar testes em `Testes/TestRenderers.js` ou equivalente validando a estrutura de estilos (cores, formatos, alinhamentos).
- Executar a suíte integral de testes garantindo 100% de aprovação.
- Elaborar o protocolo de homologação em `planta/M06_RELATORIOS_HOMOLOGACAO.md`.
