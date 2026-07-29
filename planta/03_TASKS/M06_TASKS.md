# M06 — Relatórios Oficiais e Formatação Visual (Tasks)

> **Documento:** `planta/03_TASKS/M06_TASKS.md`  
> **Status da Sprint:** EM ANDAMENTO (TASK-M06.1-02 Concluída)  
> **Contexto:** Ecossistema Synthéon GS Down Plant Offline  

---

## 🎯 Lista Integrada de Tarefas do M06

### [CONCLUÍDO] TASK-M06.1-01C — Correção e Homologação Fiel das Funções Executáveis do Inventário
- Substituída a `TASK-M06.1-01B` pela **`TASK-M06.1-01C`**.
- Atualizados `planta/01_SPRINTS/SPRINT_M06_RELATORIOS.md` e `planta/02_SPECS/M06_RELATORIOS_SPEC.md` com os nomes executáveis reais verificados no código.
- Separados Compiladores Visuais de Apresentação dos Motores/Métricas Internas.

### [CONCLUÍDO] TASK-M06.1-02 — Estilização e Formatação Visual da Aba [AUDITORIA] Ocorrencias
- Atualizado `Render/RendererAuditoriaSaude.js` implementando o método `estilizarAbaAuditoria_`.
- Aplicada a paleta de severidades exclusiva (`CRITICO` `#D9534F`, `ALERTA` `#F0AD4E`, `OBSERVACAO` `#5BC0DE`, `EXCECAO MANUAL` `#6F42C1`, `ERRO TECNICO` `#900C3F`, `APROVADO` `#28A745`) na coluna de Severidade.
- Aplicado título Azul Escuro (`#1C3144`), cabeçalho Azul Médio (`#2C4257`), congelamento de painéis (`setFrozenRows(5)`), zebrado suave e larguras de colunas recomendadas.
- Preservados 100% intocados os relatórios oficiais de produtividade (Comparativo, PIP, Armas, Drogas e CPM).

### [PENDENTE] TASK-M06.1-03 — Estilização e Formatação Visual da Aba [HISTORICO] Auditoria Ocorrencias
- Atualizar o gerador de histórico em `Render/RendererAuditoriaSaude.js` para aplicar formatação de cabeçalho e zebrado cumulativo.
- Preservar alinhamentos e destaque visual de severidades nas execuções arquivadas.

### [PENDENTE] TASK-M06.1-04 — Padronização Visual das Abas Mensais e Preservação da Coluna AM
- Aplicar destaque visual discreto exclusivamente na célula AM (`Alerta Integridade`) das abas operacionais mensais.
- Garantir que a alteração na Coluna AM preserve intactas as cores, zebrados e bordas das linhas das colunas A até AL.

### [PENDENTE] TASK-M06.1-05 — Suíte de Testes Visuais e Homologação Offline do M06
- Criar testes em `Testes/TestRenderers.js` ou equivalente validando a estrutura de estilos (cores, formatos, alinhamentos).
- Executar a suíte integral de testes garantindo 100% de aprovação.
- Elaborar o protocolo de homologação em `planta/M06_RELATORIOS_HOMOLOGACAO.md`.
