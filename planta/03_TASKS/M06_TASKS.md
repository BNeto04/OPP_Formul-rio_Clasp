# M06 — Relatórios Oficiais e Formatação Visual (Tasks)

> **Documento:** `planta/03_TASKS/M06_TASKS.md`  
> **Status da Sprint:** TASK-M06.1-01C CONCLUÍDA  
> **Contexto:** Ecossistema Synthéon GS Down Plant Offline  

---

## 🎯 Lista Integrada de Tarefas do M06

### [CONCLUÍDO] TASK-M06.1-01C — Correção e Homologação Fiel das Funções Executáveis do Inventário
- Substituída a `TASK-M06.1-01B` pela **`TASK-M06.1-01C`**.
- Atualizados `planta/01_SPRINTS/SPRINT_M06_RELATORIOS.md` e `planta/02_SPECS/M06_RELATORIOS_SPEC.md` com os nomes executáveis reais verificados diretamente no código:
  - **PIP**: `criarMenuPip_()`, `abrirMenuPipMensal()`, `abrirMenuPipLivre()`, `gerarPipAnual()`.
  - **DROGAS**: `criarMenuDrogas_()`, `abrirMenuSelecaoLivreDrogas()`.
  - **ARMAS**: `criarMenuArmas_()`, `abrirMenuSelecaoLivre()`.
  - **CPM**: `criarMenuCPM_()`, `abrirMenuCPMMensal()`, `abrirMenuCPMLivre()`, `gerarCPMAnual()`, `criarAbaResultadoCPM_()`.
  - **COMPARATIVO**: `abrirMenuComparativo2026()`, `gerarComparativo2026Premium()`.
- Separados **Compiladores Visuais de Apresentação** dos **Motores/Métricas Internas** (`PluginArmas` e `PluginEntorpecentes`).
- Declarado expressamente o status de cada regra visual: **IMPLEMENTADA NO CÓDIGO ATUAL** ou **CONTRATO VISUAL A IMPLEMENTAR NO M06**.
- Mantida a **Central Analítica SUSPENSA**.

### [PENDENTE] TASK-M06.1-02 — Estilização e Formatação Visual da Aba [AUDITORIA] Ocorrencias
- Atualizar `Render/RendererAuditoriaSaude.js` para aplicar cores da paleta de severidades exclusiva (`CRITICO`, `ALERTA`, `OBSERVACAO`, `EXCECAO MANUAL`, `APROVADO`).
- Ajustar formatação do Card de Resumo das Linhas 1-3.
- Ajustar congelamento de painéis, larguras de coluna e zebrado visual sem afetar relatórios oficiais.

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
