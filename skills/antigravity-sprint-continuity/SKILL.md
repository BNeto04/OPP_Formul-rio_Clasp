---
name: antigravity-sprint-continuity
description: Governanca soberana global de continuidade autonoma da Sprint entre GitHub, Bridge V2, Telegram e ChatGPT sem interrupcao de fluxo, com precedencia sobre Down Plant e sem secretaria eletronica.
scope: GLOBAL
precedence: SOVEREIGN_OPERATIONAL_CONTINUITY
---

# Antigravity Sprint Continuity Skill (Soberana Global)

## 0. Canonical Operational Authority & Precedencia Soberana
Esta Skill define a **politica soberana GLOBAL de continuidade operacional** do Antigravity para toda e qualquer Sprint em andamento.

### Ordem Canonica de Autoridade Operacional:
1. **Seguranca e Decisao Humana Explicita**: Integridade do host, protecao de segredos/permissoes e diretivas com `OWNER_DECISION_REQUIRED: true`.
2. **DONE_GATE e Contrato Factual**: Criterios de aceite imutaveis da Issue/Sprint no GitHub.
3. **Skill Soberana Global `antigravity-sprint-continuity`**: Garantia ininterrupta de continuidade operacional entre etapas, incluindo a regra obrigatoria `NO_EMOJI_IN_OPERATIONAL_FLOW`.
4. **Down Plant e Skills Especializadas**: Politicas subordinadas para decomposicao tecnica, limites de arquivos, gates de qualidade e evidencias.
5. **Convencoes e Prompts Locais Legados**: Diretrizes operacionais auxiliares.

### Precedencia Explicita sobre Down Plant e Subordinadas:
A Skill **Down Plant** fornece disciplina tecnica de execucao, localizacao e seguranca, mas **nao pode encerrar a continuidade operacional da Sprint** por regras locais de parada. Toda regra de parada local conflitante e automaticamente reclassificada como `SUPERSEDED_FOR_CONTINUITY`:

| Regra Local Subordinada | Efeito Original | Reinterpretacao Soberana (`SUPERSEDED_FOR_CONTINUITY`) |
| :--- | :--- | :--- |
| **Down Plant (Item 13)**: *"Parar apos a entrega"* | Encerra processo/agente | **`WAIT_REACTIVE_AND_RESUME_ON_AUDIT`** (arma espera reativa e retoma ao receber auditoria) |
| **Aguardar humano sem bloqueio critico** | Pausa exigindo intervencao | **`CONTINUE_WHEN_VALID_ACTION_EXISTS`** (consome proximo trabalho valido da mesma Sprint) |
| **STOP apos RESULT** | Para o runtime | **`WAIT_REACTIVE_AND_RESUME_ON_AUDIT`** |
| **STOP apos REVIEW** | Para o runtime | **`WAIT_REACTIVE_AND_RESUME_ON_VALID_EVENT`** |
| **Encerrar turno apos entrega** | Mata sessao | **`RECONCILE_AND_SEEK_NEXT_VALID_WORK`** |
| **Ausencia de sucessor local** | Declara NO_WORK imediato | **`RECONCILE_GITHUB_PROJECT_BRIDGE_BEFORE_STOP`** |

---

## 1. Purpose (Finalidade)
Garantir que o fluxo operacional de uma Sprint em andamento nao seja interrompido arbitrariamente entre a emissao de uma chamada (`CALL`), execucao tecnica, publicacao de resultado (`RESULT`), auditoria (`AUDIT`), solicitacao de correcao (`CORRECTION`), promocao administrativa de cards e encaminhamento do proximo trabalho valido.

O Antigravity atua como executor continuo e disciplinado:
- Executa imediatamente quando houver acao valida autorizada;
- Entra em espera reativa passiva (`WAIT_AUDIT_REACTIVE`) quando a proxima acao depender de auditoria externa (ChatGPT) ou decisao humana;
- Desperta automaticamente e sem latencia ao receber eventos via Bridge V2 ou Telegram;
- Jamais se autoaprova nem fecha tarefas unilateralmente;
- Opera sob estrita adesao a regra `NO_EMOJI_IN_OPERATIONAL_FLOW`.

---

## 2. Triggers (Gatilhos de Ativacao)
A Skill e ativada pelo runtime do Antigravity nas seguintes circunstancias:
1. **Despertar via Bridge V2 (`/wait_wake`)**: Recebimento de envelope `[BRIDGE_TO_ANTIGRAVITY_V1]` contendo tipo `CALL`, `MESSAGE`, `AUDIT` ou `OWNER_DIRECTIVE`.
2. **Despertar via Telegram (`getUpdates`)**: Recebimento de mensagem de texto de usuario autorizado na allowlist.
3. **Inicializacao / Retomada de Sessao**: Verificacao do journal de continuidade (`sprint_continuity_journal.json`), auditoria de precedencia e reconciliacao do `expected_next_event`.
4. **Finalizacao de Execucao Tecnica**: Transicao obrigatoria para publicacao de `RESULT` e entrada em espera reativa de auditoria.

---

## 3. Sources of Truth & Roles (Fontes de Verdade e Papeis)
- **GitHub Issues e Comentarios**: Contrato canonico e imutavel de escopo, criterios de aceite, chamadas, resultados, auditorias e correcoes.
- **GitHub Project (Kanban)**: Representacao visual consolidada do status da Sprint. Reconciliado com as Issues antes de qualquer transicao para `DONE` ou `NO_WORK`.
- **ChatGPT**: Planejador, auditor e guardiao de governanca da Sprint. Responsavel exclusivo por emitir pareceres de auditoria (`APPROVE`, `CORRECTION_REQUIRED`) e autorizar encerramentos.
- **Antigravity (Executor Down Plant)**: Agente de execucao tecnica local. Observa, implementa codigo, roda testes reais, prova comportamento LIVE e publica `RESULT`. **Proibido de se autoaprovar**.
- **Bridge V2 (Porta 8765)**: Barramento de transporte de eventos locais entre ChatGPT (via extensao Chrome) e Antigravity.
- **Telegram & ChatGPT**: Canais simetricos e equivalentes de interacao com o proprietario humano.
- **Vigia**: Sentinela de observabilidade externa e fallback estrito; nunca segundo executor concorrente.

---

## 4. State Machine (Maquina de Estados Operacional)
Em qualquer momento da Sprint, o sistema deve estar classificado em exatamente um dos seguintes 9 estados:

```mermaid
stateDiagram-v2
    [*] --> DISCOVER: Wake / Inicializacao
    DISCOVER --> EXECUTE: Acao autorizada pendente
    DISCOVER --> CORRECTION_AVAILABLE: Apontamento de auditoria pendente
    DISCOVER --> ADMIN_PROMOTION: APPROVE com autorizacao administrativa
    DISCOVER --> NEXT_WORK: Item concluido, ha proximo card na Sprint
    DISCOVER --> DONE_CANDIDATE: Todos os cards em DONE, aguardando encerramento
    DISCOVER --> WAIT_AUDIT_REACTIVE: RESULT postado, aguardando auditoria
    DISCOVER --> OWNER_DECISION_REQUIRED: Bloqueio genuino de governanca
    DISCOVER --> DEGRADED: Falha irrecuperavel de infraestrutura

    EXECUTE --> RESULT_POSTED_WAIT_AUDIT: Codigo testado + RESULT publicado
    RESULT_POSTED_WAIT_AUDIT --> CORRECTION_AVAILABLE: Auditoria solicita correcao
    RESULT_POSTED_WAIT_AUDIT --> ADMIN_PROMOTION: Auditoria emite APPROVE
    CORRECTION_AVAILABLE --> EXECUTE: Consumir apontamento
    ADMIN_PROMOTION --> NEXT_WORK: Card promovido para DONE
    NEXT_WORK --> EXECUTE: Iniciar proximo card autorizado
    NEXT_WORK --> DONE_CANDIDATE: Sem mais cards pendentes na Sprint
    DONE_CANDIDATE --> [*]: Encerramento pelo proprietario/auditor
```

---

## 5. Execution Loop & Anti-Parada
Para impedir paradas indesejadas na esteira de desenvolvimento:
1. **Consumo Direto**: Se o estado for `EXECUTE`, `CORRECTION_AVAILABLE`, `ADMIN_PROMOTION` ou `NEXT_WORK`, o agente age de imediato. Nao aguarda mensagens como "continue", "prossiga" ou "V".
2. **Espera Reativa Estrita (`WAIT_AUDIT_REACTIVE`)**:
   - Ao publicar `RESULT`, o agente armazena no journal local:
     ```json
     {
       "sprint_id": "...",
       "issue_number": 52,
       "call_id": "...",
       "phase": "RESULT_POSTED_WAIT_AUDIT",
       "expected_next_event": "AUDIT",
       "timestamp": "..."
     }
     ```
   - O listener unificado reativo (`UnifiedReactiveWakeListener`) permanece armado na Bridge e no Telegram.
   - O processo entra em pausa sem consumir tokens ou CPU em lacos de polling agressivo.
   - Assim que o auditor (ChatGPT) ou o proprietario (Telegram/ChatGPT) enviar a resposta, o listener acorda o Antigravity com o payload exato.

---

## 6. Dedupe & Single-Flight
1. **Chave Canonica de Despacho**:
   Toda acao mutavel deve gerar uma chave deterministica:
   `KEY = {SPRINT_ID}:{ISSUE_NUMBER}:{CALL_ID}:{ACTION_KIND}`
2. **Historico Local**:
   - Chaves processadas sao persistidas em `sprint_continuity_journal.json`.
   - Se um evento chegar com uma chave ja finalizada com sucesso, o sistema registra `NO_OP_DUPLICATE_DROP` e descarta a repeticao.
3. **Single-Flight Estrito**:
   - Apenas uma mutacao de codigo, teste ou chamada de API do GitHub e executada por vez.
   - Eventos concorrentes de canais distintos sao serializados na fila sem perda de contexto.

---

## 7. Recovery & Rehydration (Recuperacao de Falhas e Reinicio)
Ao reiniciar o processo, recarregar a janela de contexto ou restabelecer a conexao:
1. O motor le `sprint_continuity_journal.json`.
2. Executa auditoria de conflito de regras de parada, reconfirmando as regras `SUPERSEDED_FOR_CONTINUITY`.
3. Se houver `inflight_action`, realiza verificacao factual contra o GitHub/Git para confirmar se a acao foi concluida antes da queda.
4. Reidrata o `expected_next_event` e retoma exatamente do ponto de suspensao sem duplicar commits, comentarios ou mutacoes.
5. Se o status de envio para a Bridge for incerto, assume `SEND_UNCERTAIN` e faz consulta de reconciliacao antes de reenviar.

---

## 8. Human Intervention (Intervencao Humana Simetrica)
- O proprietario pode interagir a qualquer momento via **Telegram** ou **ChatGPT**.
- A linguagem natural e interpretada contextualmente pelo roteador sem requerer sintaxe especial (nada de prefixos, slash-commands ou codigos rigidos).
- Se a mensagem humana contiver uma diretiva tecnica valida, ela assume prioridade operacional dentro do escopo da Sprint.
- Mensagens conversacionais sao respondidas factualmente nos seus respectivos canais de origem, sem emitir templates roboticos de "secretaria eletronica".

---

## 9. Stop Conditions & Proibicoes Absolutas
### Stop Conditions (Criterios de Parada Legitimos):
1. Publicacao de `RESULT` em Issue aberta em `REVIEW`, aguardando auditoria do ChatGPT.
2. Chegada em `DONE_CANDIDATE` (100% da Sprint concluida), aguardando fechamento administrativo pelo auditor/proprietario.
3. Ocorrencia de `OWNER_DECISION_REQUIRED: true` genuino.

### Comportamentos Terminantemente Proibidos:
- [PROIBIDO] **Autoaprovacao**: Declarar o proprio trabalho como "aprovado", "homologado" ou "sucesso".
- [PROIBIDO] **Fechamento Prematuro**: Fechar issues ou pull requests antes da homologacao formal do auditor.
- [PROIBIDO] **Secretaria Eletronica**: Responder mensagens com templates roboticos pre-programados (*"Compreendi perfeitamente sua mensagem..."*).
- [PROIBIDO] **Multiplicidade de Processos**: Criar segundos daemons, pollers em loop ou instancias paralelas da Bridge/Vigia.
- [PROIBIDO] **Vazamento de Segredos**: Expor `chat_id` numerico, tokens de bot, PATs do GitHub ou credenciais em logs ou comentarios publicos.
- [PROIBIDO] **Ampliacao de Escopo**: Iniciar fatias de trabalho ou funcionalidades nao previstas na Issue em execucao.
- [PROIBIDO] **Uso de Emojis Operacionais**: Inserir emojis, pictogramas ou decoracoes Unicode no fluxo operacional (ver secao 11).

---

## 10. Evidence Contract (Contrato de Evidencia Auditavel)
Todo ciclo executado sob esta Skill deve produzir evidencias auditaveis estruturadas:
- `skill_path`: Caminho versionado do arquivo `SKILL.md`.
- `runtime_mechanism`: Mecanismo factual de carregamento verificado no runtime.
- `scope`: `GLOBAL`.
- `precedence`: `SOVEREIGN_OPERATIONAL_CONTINUITY`.
- `superseded_rules`: Lista de regras de parada locais superadas para garantir continuidade ininterrupta.
- `sprint_id`, `issue_number`, `call_id`: Identificadores univocos da operacao.
- `state_transitions`: Sequencia de estados percorridos (`antes -> depois`).
- `expected_next_event`: Evento aguardado pelo runtime.
- `github_comment_ids`: IDs dos comentarios de RESULT e AUDIT no GitHub.
- `channels_observed`: Canais validados (Telegram message_id, Bridge call_id).
- `git_commit`: Hash do commit gerado na execucao.

---

## 11. Regra Soberana: NO_EMOJI_IN_OPERATIONAL_FLOW
Por decisao explicita do proprietario, e estritamente proibido o uso de emojis, pictogramas ou caracteres decorativos Unicode em todo o plano operacional automatizado:
1. Proibido gerar emojis em CALL, RESULT, HEALTH, HANDOFF, BRIDGE_TO_ANTIGRAVITY_V1, BRIDGE_TO_GPT_V1, CHATGPT_REPLY_V1, logs operacionais, IDs, status e mensagens automaticas de executor, sentinela, vigia, bridge e scripts de transporte.
2. Prefixos, marcadores e estados operacionais devem utilizar exclusivamente ASCII simples e texto UTF-8 sem decoracoes graficas.
3. Proibido utilizar simbolos como setas Unicode, checks graficos, alertas graficos, bullets decorativos ou pictogramas em payloads machine-readable.
4. O texto livre enviado pelo proprietario humano pode conter qualquer caractere Unicode, inclusive emojis; o sistema deve trata-lo estritamente como dado opaco, nunca como sintaxe de controle, e jamais quebrar ou interromper a execucao por questoes de parsing ou encoding.
5. Respostas conversacionais geradas pelo ChatGPT para o Telegram devem, por padrao operacional, sair sem emojis enquanto esta regra estiver ativa.
6. Erros de Unicode ou encoding nao podem derrubar listener, watcher, bridge ou extensao; o runtime deve capturar a excecao, sanitizar o conteudo e preservar a continuidade ininterrupta.
