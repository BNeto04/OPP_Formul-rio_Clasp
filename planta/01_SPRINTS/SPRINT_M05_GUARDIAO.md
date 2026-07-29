# Sprint M05 — Guardião da Qualidade Operacional

> **Status:** CONCLUÍDA (VERIFICADO OFFLINE - Sprint 1)  
> **Ambiente:** Bancada Offline (`refactor/down-plant-gs-offline`)  
> **Cômodo Alvo:** M05 Guardião da Qualidade  

---

## 🎯 Objetivos da Sprint

1. Evoluir o Guardião da Qualidade (`M05`) de um validador sintático simples para um **Auditor Operacional de Contexto e Túnel**, fornecendo diagnósticos, evidências e ações recomendadas para o operador.
2. Garantir o princípio inegociável de **Não Intervenção Silenciosa**: o Guardião **nunca** altera, corrige, apaga ou preenche dados operacionais automaticamente. A decisão de correção permanece 100% humana.
3. Não bloquear a rotina do operador em caso de alertas de negócio (apenas interrompe em `ERRO TECNICO` por ausência de cabeçalhos indispensáveis).
4. Implementar a regra de **Exceção Manual Justificada**: células calculadas que não possuam fórmula passam a ser classificadas como `EXCECAO MANUAL` se contiverem nota explicativa iniciada por `EXCECAO:`. Células calculadas sem fórmula e sem nota permanecem como `ALERTA`.
5. Estruturar o núcleo de regras de diagnóstico de forma 100% pura (sem dependência de Apps Script/UI), totalmente testável no Node.js.

---

## 📦 Entregáveis Concluídos

- **`planta/M05_GUARDIAO_INVENTARIO.md`**: Inventário completo dos componentes, regras e auditorias do M05 (`TASK-M05.1-01`).
- **`planta/M05_GUARDIAO_PUREZA.md`**: Relatório de pureza da camada diagnóstica do M05 (`TASK-M05.1-02`).
- **`planta/M05_GUARDIAO_HOMOLOGACAO.md`**: Protocolo de homologação manual do Guardião para planilhas de teste (`TASK-M05.1-06`).
- **`Core/RegrasQualidade.js`**: Núcleo puro de diagnósticos e validação de regras contextuais de túnel.
- **`Features/GuardiaoQualidade.js`**: Orquestrador e gerador de relatórios de auditoria de saúde.
- **`Render/RendererAuditoriaSaude.js`**: Formatador visual das abas de auditoria (`[AUDITORIA] Ocorrencias` e `[HISTORICO] Auditoria Ocorrencias`).
- **`Testes/TestGuardiao.js`**: Suíte de testes unitários e homologação offline cobrindo 100% dos cenários operacionais (21 testes).

---

## 🟢 Critérios de Aceite da Sprint

- [x] Inventário e governança da Sprint M05.1 concluídos (`TASK-M05.1-01`).
- [x] Núcleo puro de diagnóstico desacoplado do Apps Script (`TASK-M05.1-02`).
- [x] Validação de identidade e coerência do túnel implementada (`TASK-M05.1-03`).
- [x] Validação de fórmulas, matemática e exceções humanas via nota `EXCECAO:` (`TASK-M05.1-04`).
- [x] Relatórios de auditoria legíveis com Ação Recomendada e Histórico preservado (`TASK-M05.1-05`).
- [x] Testes unitários puros cobrindo 100% dos cenários operacionais e homologação offline (`TASK-M05.1-06`).
