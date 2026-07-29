# M06 — Relatórios Oficiais e Formatação Visual (Tasks)

> **Documento:** `planta/03_TASKS/M06_TASKS.md`  
> **Status da Sprint:** EM REVISÃO DOCUMENTAL (TASK-M06.1-01B Pendente de Aprovação)  
> **Contexto:** Ecossistema Synthéon GS Down Plant Offline  

---

## 🎯 Lista Integrada de Tarefas do M06

### [PENDENTE REVISÃO] TASK-M06.1-01B — Revisão Fiel do Inventário do Código e Mapeamento de Módulos
- Atualizar `planta/01_SPRINTS/SPRINT_M06_RELATORIOS.md` com o mapeamento fiel extraído diretamente do código para **COMPARATIVO_2026, PIP, ARMAS, DROGAS e CPM**, registrando funções reais, renderizadores, abas de saída reais (`COMPARATIVO_2026`, `PIP_<período>`, `COMP_ARMAS_<período>`, `COMP_DROGAS_<período>`, `CPM_<mes>`), fonte de dados, período e métricas.
- Separar rigorosamente **Compiladores Visuais de Apresentação** dos **Motores/Métricas Internas** (aclarando que `PluginArmas` e `PluginEntorpecentes` são componentes conceituais do motor V2, não compiladores de tela).
- Indicar para cada regra visual o status preciso: **IMPLEMENTADA NO CÓDIGO ATUAL** ou **CONTRATO VISUAL A IMPLEMENTAR NO M06**.
- Vincular a `REGRA_TRANSVERSAL_FORMATACAO_RELATORIOS.md` registrando as cores oficiais de Pelotões/Oficiais/GTAR e a Escala Oficial de Armas.
- Declarar expressamente o isolamento da paleta de severidades aos relatórios de apoio (`[AUDITORIA]` e `[HISTORICO]`).
- Registrar que a Coluna AM só altera a célula AM e preserva intacta a formatação das colunas A a AL.
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
