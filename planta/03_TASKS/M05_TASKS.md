# M05 — Guardião da Qualidade Operacional (Tasks)

> **Documento:** `planta/03_TASKS/M05_TASKS.md`  
> **Status da Sprint:** VERIFICADO OFFLINE - Sprint 1 (100% Concluído com Sucesso)  
> **Total de Testes:** 64/64 testes aprovados  

---

## 🎯 Lista Integrada de Tarefas do M05

### [CONCLUÍDO] TASK-M05.1-01 — Infraestrutura de Mensagens e Tipagem do Guardião
- Criar `Core/RegrasQualidade.js` com a estrutura padronizada de diagnósticos.
- Definir enum `SEVERIDADES_GUARDIAO` (`ERRO TECNICO`, `CRITICO`, `ALERTA`, `OBSERVACAO`, `EXCECAO MANUAL`).
- Garantir desacoplamento 100% de APIs legadas e Apps Script.

### [CONCLUÍDO] TASK-M05.1-02 — Varredura, Tunelamento e Diagnóstico Curto (Coluna AM)
- Criar `Features/GuardiaoQualidade.js`.
- Escrever apenas texto curto sanitizado na coluna AM.
- Tratar plantão tranquilo (apenas data) como 100% permitido sem alertas.
- Classificar ocorrência órfã (policial sem MIKE) como `CRITICO`.

### [CONCLUÍDO] TASK-M05.1-03 — Identidade e Coerência do Túnel
- Tratar MIKE isolado/suspeito (ex: `2026`) como `ALERTA`, nunca bloqueio.
- Validar coerência cruzada entre data da planilha e estrutura temporal do MIKE.
- Validar coerência cruzada de MIKE com BOEs divergentes (`MIKE_BOE_DIVERGENTE`).
- Validar coerência cruzada de MIKE com datas divergentes (`MIKE_DATAS_DIVERGENTES`).
- Validar simetria dos campos `OCORRÊNCIA PIP` (AG) e `IMPUTADO?` (AH).

### [CONCLUÍDO] TASK-M05.1-04 — Auditoria de Fórmulas, Rateio, Exceções Manuais e Catálogo PIP
- Validar fórmulas ausentes sem alterar células ou fórmulas.
- Reconhecer notas iniciadas por `EXCECAO:` como `EXCECAO MANUAL`.
- Tratar indicadores de numerário/dinheiro sem valor em reais como `OBSERVACAO` (`FATO_NAO_AUDITAVEL_AUTOMATICAMENTE`).
- Normalizar aba `Tabela PIP` e busca por cabeçalho flexível sem fallback perigoso para Coluna A.
- Ativar `MODO_LIMITADO_CATALOGO_PIP` como `OBSERVACAO` quando a aba ou a coluna de indicador não for localizada.

### [CONCLUÍDO] TASK-M05.1-04E — Fixar Divisor PIP em 4 Independente do Efetivo no Túnel
- Atualizar `Core/Constantes.js` definindo `DIVISOR_RATEIO_PIP: 4`.
- Atualizar `Core/RegrasQualidade.js` em `validarTunel` para que `rateioEsperado = totalPontosTunel / DIVISOR_RATEIO_PIP` (onde `DIVISOR_RATEIO_PIP = 4`), desvinculando o rateio da contagem de matrículas distintas.
- Atualizar evidência e ação recomendada para explicitar a divisão fixa por 4.
- Adicionar suíte de testes unitários validando 304 pontos com 4, 5 e 10 policiais (76 cada) e 5 policiais com um 0 (alerta apenas na linha zerada).

### [CONCLUÍDO] TASK-M05.1-05 — Renderizador de Auditoria e Histórico Cumulativo
- Criar `Render/RendererAuditoriaSaude.js`.
- Gerar resumo e tabela estruturada de 8 colunas na aba `[AUDITORIA] Ocorrencias`.
- Exibir linha de `SEVERIDADE = APROVADO` e `REGRA = INTEGRIDADE_OK` quando a planilha não contiver alertas.
- Criar aba `[HISTORICO] Auditoria Ocorrencias` e acumular registros entre execuções sem sobrescrever.
- Bloquear execução do Guardião sobre as abas de auditoria e histórico (`ERRO TECNICO`).

### [CONCLUÍDO] TASK-M05.1-06 — Homologação Final Offline e Fixture End-to-End
- Criar fixture E2E cobrindo 10 cenários operacionais simultâneos em `Testes/TestGuardiao.js`.
- Criar documento de homologação `planta/M05_GUARDIAO_HOMOLOGACAO.md`.
- Validar integridade dos dados operacionais e aprovação de 64/64 testes.
