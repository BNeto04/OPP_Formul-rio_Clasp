# C05 â€” GuardiÃ£o da Qualidade Operacional (Tasks)

> **Documento:** `02_Comodos/03_TASKS/C05_TASKS.md`  
> **Status da Sprint:** VERIFICADO OFFLINE - Sprint 1 (100% ConcluÃ­do com Sucesso)  
> **Total de Testes:** 64/64 testes aprovados  

---

## ðŸŽ¯ Lista Integrada de Tarefas do C05

### [CONCLUÃDO] TASK-C05.1-01 â€” Infraestrutura de Mensagens e Tipagem do GuardiÃ£o
- Criar `Core/RegrasQualidade.js` com a estrutura padronizada de diagnÃ³sticos.
- Definir enum `SEVERIDADES_GUARDIAO` (`ERRO TECNICO`, `CRITICO`, `ALERTA`, `OBSERVACAO`, `EXCECAO MANUAL`).
- Garantir desacoplamento 100% de APIs legadas e Apps Script.

### [CONCLUÃDO] TASK-C05.1-02 â€” Varredura, Tunelamento e DiagnÃ³stico Curto (Coluna AM)
- Criar `Features/GuardiaoQualidade.js`.
- Escrever apenas texto curto sanitizado na coluna AM.
- Tratar plantÃ£o tranquilo (apenas data) como 100% permitido sem alertas.
- Classificar ocorrÃªncia Ã³rfÃ£ (policial sem MIKE) como `CRITICO`.

### [CONCLUÃDO] TASK-C05.1-03 â€” Identidade e CoerÃªncia do TÃºnel
- Tratar MIKE isolado/suspeito (ex: `2026`) como `ALERTA`, nunca bloqueio.
- Validar coerÃªncia cruzada entre data da planilha e estrutura temporal do MIKE.
- Validar coerÃªncia cruzada de MIKE com BOEs divergentes (`MIKE_BOE_DIVERGENTE`).
- Validar coerÃªncia cruzada de MIKE com datas divergentes (`MIKE_DATAS_DIVERGENTES`).
- Validar simetria dos campos `OCORRÃŠNCIA PIP` (AG) e `IMPUTADO?` (AH).

### [CONCLUÃDO] TASK-C05.1-04 â€” Auditoria de FÃ³rmulas, Rateio, ExceÃ§Ãµes Manuais e CatÃ¡logo PIP
- Validar fÃ³rmulas ausentes sem alterar cÃ©lulas ou fÃ³rmulas.
- Reconhecer notas iniciadas por `EXCECAO:` como `EXCECAO MANUAL`.
- Tratar indicadores de numerÃ¡rio/dinheiro sem valor em reais como `OBSERVACAO` (`FATO_NAO_AUDITAVEL_AUTOMATICAMENTE`).
- Normalizar aba `Tabela PIP` e busca por cabeÃ§alho flexÃ­vel sem fallback perigoso para Coluna A.
- Ativar `MODO_LIMITADO_CATALOGO_PIP` como `OBSERVACAO` quando a aba ou a coluna de indicador nÃ£o for localizada.

### [CONCLUÃDO] TASK-C05.1-04E â€” Fixar Divisor PIP em 4 Independente do Efetivo no TÃºnel
- Atualizar `Core/Constantes.js` definindo `DIVISOR_RATEIO_PIP: 4`.
- Atualizar `Core/RegrasQualidade.js` em `validarTunel` para que `rateioEsperado = totalPontosTunel / DIVISOR_RATEIO_PIP` (onde `DIVISOR_RATEIO_PIP = 4`), desvinculando o rateio da contagem de matrÃ­culas distintas.
- Atualizar evidÃªncia e aÃ§Ã£o recomendada para explicitar a divisÃ£o fixa por 4.
- Adicionar suÃ­te de testes unitÃ¡rios validando 304 pontos com 4, 5 e 10 policiais (76 cada) e 5 policiais com um 0 (alerta apenas na linha zerada).

### [CONCLUÃDO] TASK-C05.1-05 â€” Renderizador de Auditoria e HistÃ³rico Cumulativo
- Criar `Render/RendererAuditoriaSaude.js`.
- Gerar resumo e tabela estruturada de 8 colunas na aba `[AUDITORIA] Ocorrencias`.
- Exibir linha de `SEVERIDADE = APROVADO` e `REGRA = INTEGRIDADE_OK` quando a planilha nÃ£o contiver alertas.
- Criar aba `[HISTORICO] Auditoria Ocorrencias` e acumular registros entre execuÃ§Ãµes sem sobrescrever.
- Bloquear execuÃ§Ã£o do GuardiÃ£o sobre as abas de auditoria e histÃ³rico (`ERRO TECNICO`).

### [CONCLUÃDO] TASK-C05.1-06 â€” HomologaÃ§Ã£o Final Offline e Fixture End-to-End
- Criar fixture E2E cobrindo 10 cenÃ¡rios operacionais simultÃ¢neos em `Testes/TestGuardiao.js`.
- Criar documento de homologaÃ§Ã£o `02_Comodos/C05_GUARDIAO_HOMOLOGACAO.md`.
- Validar integridade dos dados operacionais e aprovaÃ§Ã£o de 64/64 testes.


## Extrato de MOD-C05-01_Sprint.md

# Sprint C05 Ã¢â‚¬â€ GuardiÃƒÂ£o da Qualidade Operacional

> **Documento:** `02_Comodos/01_SPRINTS/SPRINT_C05_GUARDIAO.md`  
> **Status:** VERIFICADO OFFLINE - Sprint 1 (ConcluÃƒÂ­do)  
> **Arquivos Afetados:** `Core/Constantes.js`, `Core/RegrasQualidade.js`, `Features/GuardiaoQualidade.js`, `Render/RendererAuditoriaSaude.js`, `Testes/TestGuardiao.js`, `02_Comodos/C05_GUARDIAO_HOMOLOGACAO.md`, `02_Comodos/03_TASKS/C05_TASKS.md`  
> **Total de Testes:** 64/64 testes aprovados  

---

## Ã°Å¸Å½Â¯ Objetivo da Sprint

Implementar o GuardiÃƒÂ£o da Qualidade Operacional como uma camada passiva, explicativa e auditÃƒÂ¡vel de validaÃƒÂ§ÃƒÂ£o de dados em ambiente offline. O GuardiÃƒÂ£o audita diagnÃƒÂ³sticos estruturados sem alterar fÃƒÂ³rmulas ou dados das cÃƒÂ©lulas operacionais.

---

## Ã°Å¸â€œÅ’ Regras de NegÃƒÂ³cio e PrincÃƒÂ­pios Fundamentais

1. **Leitura Passiva e NÃƒÂ£o IntervenÃƒÂ§ÃƒÂ£o:** O GuardiÃƒÂ£o observa, registra diagnÃƒÂ³sticos em `[AUDITORIA] Ocorrencias`, acumula histÃƒÂ³rico em `[HISTORICO] Auditoria Ocorrencias` e escreve resumos curtos na coluna AM. Ele jamais altera cÃƒÂ©lulas de dados ou fÃƒÂ³rmulas.
2. **DiagnÃƒÂ³sticos Curtos na Coluna AM:** Exibe apenas resumos textuais de diagnÃƒÂ³sticos para facilitar a visualizaÃƒÂ§ÃƒÂ£o rÃƒÂ¡pida pelo operador.
3. **PlantÃƒÂ£o Tranquilo:** Linhas vazias contendo apenas data sÃƒÂ£o tratadas como normais, sem emissÃƒÂ£o de alertas.
4. **Divisor Fixo do Rateio PIP (`DIVISOR_RATEIO_PIP = 4`):** O valor esperado de `PONTOS FICÃƒâ€¡ÃƒÆ’O` para cada policial no tÃƒÂºnel ÃƒÂ© **sempre `totalPontosTunel / 4`**, independentemente do nÃƒÂºmero de policiais vinculados ao tÃƒÂºnel. Se a ocorrÃƒÂªncia pontuou 304, a cota de cada policial ÃƒÂ© 76. Policiais com `0` recebem alerta individual de rateio zerado/incoerente.
5. **CatÃƒÂ¡logo DinÃƒÂ¢mico da Tabela PIP:** Busca flexÃƒÂ­vel por aliases com normalizaÃƒÂ§ÃƒÂ£o de hÃƒÂ­fen/underline. Quando a aba ou o cabeÃƒÂ§alho de indicador nÃƒÂ£o sÃƒÂ£o localizados, ativa `MODO_LIMITADO_CATALOGO_PIP` como `OBSERVACAO`, sem gerar falsos erros.
6. **ExceÃƒÂ§ÃƒÂµes Manuais Justificadas:** CÃƒÂ©lulas calculadas sem fÃƒÂ³rmula iniciadas por nota `EXCECAO:` sÃƒÂ£o tratadas como `EXCECAO MANUAL`, registrando o motivo e dispensando alertas.

---

## Ã°Å¸â€œÅ  Entregas Realizadas

- `Core/Constantes.js`: Adicionado `DIVISOR_RATEIO_PIP: 4`.
- `Core/RegrasQualidade.js`: Implementados motores de auditoria, diagnÃƒÂ³sticos estruturados, verificaÃƒÂ§ÃƒÂ£o cruzada de tÃƒÂºneis e rateio fixo dividido por 4.
- `Features/GuardiaoQualidade.js`: Controlador principal de varredura, sanitizaÃƒÂ§ÃƒÂ£o e atualizaÃƒÂ§ÃƒÂ£o da Coluna AM e abas de auditoria.
- `Render/RendererAuditoriaSaude.js`: Formatador da aba `[AUDITORIA] Ocorrencias` (com linha APROVADO se zerado) e acumulador de `[HISTORICO] Auditoria Ocorrencias`.
- `Testes/TestGuardiao.js`: 23 testes unitÃƒÂ¡rios e homologaÃƒÂ§ÃƒÂ£o E2E cobrindo 10 cenÃƒÂ¡rios operacionais simultÃƒÂ¢neos.

---

## Ã°Å¸â€â€™ Status Final

A Sprint C05 estÃƒÂ¡ **100% selada, verificada e aprovada offline** em conformidade com as diretrizes do ecossistema SynthÃƒÂ©on.



---

## Fluxo Operacional com Normalizacao (G01 - MOD-C05-02)

1. `MENU -> Auditar Guardiao (seletor de meses)` e escolher UM, VARIOS ou TODOS os meses.
2. O MOD-C05-01 audita cada aba mensal (mesmo motor canonico) e apresenta: saude por mes, saude por tunel/MIKE, diagnosticos com codigo/severidade/ARCA e cobertura (o que NAO foi possivel auditar).
3. O painel gera a lista de TUNEIS PRIORITARIOS; detalhe completo em `[AUDITORIA] Ocorrencias`; execucao registrada em `[HISTORICO] Auditoria Ocorrencias`.
4. A partir dos diagnosticos, montar o **PLANO DE CORRECAO** (MOD-C05-02): cada item classificado como AUTO_FIX, CONFIRM_FIX ou MANUAL_ONLY.
5. PREVIEW do plano (celula atual -> proposta) e aplicacao somente do que a politica autoriza; CONFIRM_FIX exige aprovacao do operador.
6. Toda aplicacao grava LOG (antes/depois) e mantem ROLLBACK da execucao.
7. REAUDITORIA automatica do mesmo periodo e comparacao SAUDE INICIAL x SAUDE FINAL.
8. Historico atualizado; itens MANUAL_ONLY permanecem sinalizados para tratativa humana.

Nota: as etapas 4 a 8 pertencem ao Lote B (#112) e ainda nao estao implementadas; o Lote A entrega as etapas 1 a 3.

---

## Fluxo refinado do NORMALIZADOR SEGURO (Lote B — G01 #112)

O Lote B e o **Normalizador Seguro**: os mecanismos de contencao sao requisitos de arquitetura.

```
GUARDIAO -> DIAGNOSTICO -> CLASSIFICACAO -> DRY-RUN -> PLANO -> VALIDACAO DE ESCOPO
-> LOCK -> APLICACAO -> LOG ANTES/DEPOIS -> REAUDITORIA -> COMPARACAO DE DELTA
-> COMMIT OU ROLLBACK
```

- Regra de formula: FORMULA = CONFIRM_FIX por padrao; AUTO_FIX somente com fonte canonica + contexto compativel (mesmo tunel/coluna/mes) + reauditoria imediata.
- Mecanismos obrigatorios: rollback de lote, dry-run, lock single-flight, whitelist de colunas, comparacao de delta com rastreabilidade e kill-switch por limite maximo de celulas.
- Criterio de sucesso (todos obrigatorios; falha em qualquer um = rollback automatico do lote): ERRO_ALVO_RESOLVIDO=true; NOVOS_ERROS_CRIADOS=0; ESCOPO_MUTADO<=LIMITE; REAUDITORIA=GREEN.
- Cards: G01-006 (contrato de mutacao + whitelist), G01-007 (dry-run + plano deterministico), G01-008 (executor com lock/limite/snapshot/rollback de lote), G01-009 (reauditoria + delta + rastreabilidade), G01-010 (E2E GS + testes + Git + CLASP). Pai: #112; Depende de: #117.
