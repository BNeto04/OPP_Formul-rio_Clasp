# M06 — Relatórios Oficiais e Formatação Visual (Tasks)

> **Documento:** `planta/03_TASKS/M06_TASKS.md`  
> **Status da Sprint:** EM REVISÃO DOCUMENTAL (TASK-M06.1-01A Pendente de Aprovação)  
> **Contexto:** Ecossistema Synthéon GS Down Plant Offline  

---

## 🎯 Lista Integrada de Tarefas do M06

### [PENDENTE REVISÃO] TASK-M06.1-01A — Correção e Completabilidade do Inventário de Relatórios
- Atualizar `planta/01_SPRINTS/SPRINT_M06_RELATORIOS.md` criando a Tabela de Inventário para **PIP, COMPARATIVO_2026, ARMAS, DROGAS e CPM**, detalhando menu de origem, compilador, renderizador, aba de saída, fonte de dados, período, métricas e regras visuais protegidas.
- Separar claramente **Relatórios Oficiais de Produtividade** (PIP, Comparativo, Armas, Drogas, CPM) dos **Relatórios de Apoio e Diagnóstico** (`[AUDITORIA]` e `[HISTORICO]`).
- Vincular a `REGRA_TRANSVERSAL_FORMATACAO_RELATORIOS.md` registrando as cores oficiais de Pelotões/Oficiais e a Escala Oficial de Armas (0 em vermelho, 1-3, 4-5, 6-9, 10+).
- Declarar expressamente que a paleta de severidades de auditoria **pertence exclusivamente aos relatórios de apoio** e jamais pode substituir a paleta oficial de produtividade.
- Registrar a regra da **Coluna AM**: o alerta não pode limpar formatações estruturais das linhas (A-AL), aplicando/removendo destaque apenas na célula AM.
- Manter a **Central Analítica SUSPENSA**.

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
