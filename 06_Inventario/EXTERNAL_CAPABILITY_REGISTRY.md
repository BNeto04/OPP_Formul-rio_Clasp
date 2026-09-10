# EXTERNAL CAPABILITY REGISTRY & INTEGRAÇÃO SOB DEMANDA

> **GPS Down Plant:**
> - **Terreno:** `PC_TRABALHO`
> - **Cômodo:** `GOVERNANCA_CAPACIDADES`
> - **Módulo:** `EXTERNAL_CAPABILITY_REGISTRY`
> - **Submódulo:** `REGISTRO_E_POLITICA`
> - **Circuito:** `REUSE_FIRST_BUILD_LAST`
> - **Porta:** `EXTERNAL-CAPABILITY-GATE`

---

## 1. Princípios Operacionais

1. **REUSE_FIRST_BUILD_LAST:** Antes de construir qualquer nova capacidade estrutural, verificar se existe ferramenta externa ou módulo reutilizável já catalogado.
2. **REUSE != TRUST:** Nenhuma ferramenta externa entra diretamente em produção ou executa no ecossistema sem triagem, auditoria de segurança e aprovação formal.
3. **Fail-Closed & Raio Mínimo:** Nenhuma dependência externa deve comprometer o isolamento da planta. A ausência de evidência ou divergência de contrato bloqueia a integração (`BLOCKED`).
4. **Realidade == Mapa:** Toda e qualquer ferramenta integrada deve estar estritamente documentada neste registro com seu consumidor factual, permissões e estado atual.

---

## 2. Estados Canônicos de Ciclo de Vida

```text
DISCOVERED ──> AUDITING ──> POC ──> APPROVED ──> ACTIVE ──> SUSPENDED / RETIRED
```

* **`DISCOVERED`:** Ferramenta identificada como potencial candidata; ainda não analisada.
* **`AUDITING`:** Sob auditoria de código, segurança, licença e dependências.
* **`POC`:** Em teste isolado de prova de conceito em branch/scratch sem impacto produtivo.
* **`APPROVED`:** Homologada pelo Verifier/Auditor para integração sob demanda.
* **`ACTIVE`:** Integrada e em operação para um consumidor/cômodo específico e autorizado.
* **`SUSPENDED / RETIRED`:** Desativada temporariamente ou aposentada do projeto.

---

## 3. Registro Canônico de Capacidades Iniciais

### 3.1. Graphify
* **NAME:** Graphify
* **REPO:** `Graphify-Labs/graphify` (PyPI: `graphifyy` v0.9.53)
* **PURPOSE:** Cartografia estrutural e grafo de dependências do código.
* **CONSUMER:** Planner / Arquiteto Down Plant
* **CAPABILITY:** Mapeamento topológico, análise de conexões entre cômodos/módulos e visualização de impacto.
* **CURRENT_STATUS:** `ACTIVE_ON_DEMAND` (Semântica: Capacidade homologada disponível sob demanda; zero processos residentes, zero daemons, zero MCP permanente)
* **GATE_STATUS:** `ACTIVATION_HOMOLOGATED` (Gate de ativação sob demanda homologado na Task #19)
* **ON_DEMAND_RUNNER:** `node scripts/graphify-cartografia.js --task-id <ID> [--scope <dir>] [--out <dir>]`
* **SECURITY_GATE:** Exige obrigatoriamente `--task-id <ID>` válido; fail-closed em execuções anônimas.
* **USAGE_POLICY:** Cada uso futuro exige card próprio no Project, GPS Down Plant, escopo autorizado delimitado e registro de evidência. Proibida execução implícita ou automática.
* **RISKS:** Parsing de dialetos dinâmicos específicos; dependência de runtime local isolado (Python + Tree-sitter em scratch venv).
* **LICENSE:** Dual-licensed Apache-2.0 / MIT
* **INTEGRATION_MODE:** EXTERNAL_ON_DEMAND (Script pontual acionado exclusivamente sob demanda de task autorizada)
* **PLANT_ADDRESS:** `PC_TRABALHO / 00_Painel / CARTOGRAFIA`
* **PORT:** `GRAPHIFY-ON-DEMAND`
* **EVIDENCE:** Task #15 (POC global: 474 nós, 622 arestas), Task #16 (Gate sob demanda: runner `scripts/graphify-cartografia.js` testado com fail-closed, smoke do Core com 61 nós em 14s, 0 daemons), Task #19 (Homologação formal de disponibilidade sob demanda; 0 processos ativos).
* **DECISION:** `ACTIVATE_ON_DEMAND` (Capacidade disponível sob demanda estrita para futuras tasks autorizadas).

---

### 3.2. Improve
* **NAME:** Improve
* **REPO:** `ferramentas de auditoria e qualidade sintética`
* **PURPOSE:** Auditoria estática profunda de qualidade de código, complexidade ciclomática e aderência a padrões.
* **CONSUMER:** Verifier / Revisor de Código
* **CAPABILITY:** Análise de linters, detecção de código morto, métricas de manutenibilidade.
* **CURRENT_STATUS:** `NOT_INTEGRATED`
* **POC_STATUS:** `CANDIDATE`
* **RISKS:** Falsos positivos em dialeto Google Apps Script; interferência em código legado intencional.
* **LICENSE:** A ser auditada
* **INTEGRATION_MODE:** EXTERNAL (Execução sob demanda de auditoria)
* **PLANT_ADDRESS:** `PC_TRABALHO / 02_Comodos / C00_Governanca_Estrutural / QUALIDADE`
* **PORT:** `PORT_QUAL_001`
* **EVIDENCE:** Requisito de validação estática de PRs.
* **DECISION:** Aguardando task específica de homologação de auditoria de qualidade.

---

### 3.3. Ponytail
* **NAME:** Ponytail
* **REPO:** `utilitários de refatoração enxuta`
* **PURPOSE:** Refatoração, simplificação cirúrgica e enxugamento de código redundante.
* **CONSUMER:** Executor Down Plant
* **CAPABILITY:** Transformação AST determinística para remoção de wrappers desnecessários e dead code.
* **CURRENT_STATUS:** `NOT_INTEGRATED`
* **POC_STATUS:** `CANDIDATE`
* **RISKS:** Quebra de contratos implícitos do Apps Script; alteração indesejada de semântica.
* **LICENSE:** A ser auditada
* **INTEGRATION_MODE:** INTERNAL (Script helper sob estrito diff check)
* **PLANT_ADDRESS:** `PC_TRABALHO / scripts / REFACTOR`
* **PORT:** `PORT_REFACTOR_001`
* **EVIDENCE:** Necessidade de simplificação de arquivos legados como `Compatibilidade.js`.
* **DECISION:** Requer criação de card atômico de POC antes de qualquer adoção.

---

### 3.4. Ruflo
* **NAME:** Ruflo
* **REPO:** `orquestração multiagente assíncrona`
* **PURPOSE:** Orquestração de múltiplos agentes especializados para tarefas coordenadas.
* **CONSUMER:** Antigravity / Syntheon Orchestrator
* **CAPABILITY:** Roteamento de mensagens, paralelismo supervisionado e despacho de subagentes.
* **CURRENT_STATUS:** `NOT_INTEGRATED`
* **POC_STATUS:** `CANDIDATE`
* **RISKS:** Sobrecarga de contexto, risco de alucinação cruzada, conflito com o protocolo Down Plant.
* **LICENSE:** A ser auditada
* **INTEGRATION_MODE:** HYBRID
* **PLANT_ADDRESS:** `PC_TRABALHO / Orquestracao / RUFLO`
* **PORT:** `PORT_ORCH_001`
* **EVIDENCE:** Discussões arquiteturais de pontes assíncronas.
* **DECISION:** Proibida ativação automática; subordinado estritamente à governança central do projeto.

---

### 3.5. Open Design
* **NAME:** Open Design
* **REPO:** `especificações de representação e design arquitetural`
* **PURPOSE:** Design, arquitetura visual e representação de interfaces e fluxos.
* **CONSUMER:** Planner / UI Designer
* **CAPABILITY:** Padronização de componentes de formulários HTML, diálogos do Apps Script e layouts.
* **CURRENT_STATUS:** `NOT_INTEGRATED`
* **POC_STATUS:** `CANDIDATE`
* **RISKS:** Introdução de estilos conflitantes com a interface do Google Workspace.
* **LICENSE:** A ser auditada
* **INTEGRATION_MODE:** EXTERNAL
* **PLANT_ADDRESS:** `PC_TRABALHO / Entrada / DESIGN_SYSTEM`
* **PORT:** `PORT_DESIGN_001`
* **EVIDENCE:** Necessidade de padronização em `Entrada/Formulario.html`.
* **DECISION:** Aguardando task específica de refatoração visual.

---

## 4. Política Obrigatória para Tarefas Futuras

Toda futura tarefa do projeto deve obrigatoriamente seguir este protocolo antes de propor ou implementar capacidades técnicas:

1. **Consulta Prévia ao Registro:** Antes de codificar uma nova funcionalidade de infraestrutura, ferramenta de análise ou biblioteca auxiliar, consultar o `EXTERNAL_CAPABILITY_REGISTRY.md`.
2. **Avaliação REUSE_FIRST_BUILD_LAST:** Se existir ferramenta candidata compatível com a necessidade, o Planner deve avaliar a viabilidade de reúso antes de construir do zero.
3. **Princípio de Desconfiança (REUSE != TRUST):** Nenhuma ferramenta entra em ambiente produtivo ou ganha acesso a dados sem auditoria formal.
4. **Isolamento por Card Atômico:** A integração técnica de qualquer ferramenta do registro exige:
   * Issue dedicada no GitHub Project;
   * POC isolada em ambiente sandbox/scratch;
   * Medição quantitativa de ganho real vs custo de manutenção;
   * Mapeamento explícito de riscos, licença, porta e endereço Down Plant;
   * Decisão fundamentada: `INTERNAL` / `EXTERNAL` / `HYBRID`.
5. **Aderência Estrita ao Escopo:** Proibida a instalação antecipada ou em lote das ferramentas. Apenas a ferramenta estritamente necessária para a task autorizada pode ser objeto de POC.
6. **Soberania do Ecossistema:** Ferramentas externas são sempre subservientes e nunca podem substituir silenciosamente os papéis lógicos (`Planner`, `Executor`, `Verifier`), os agentes oficiais (`Antigravity`, `ChatGPT`) ou a topologia da planta.
7. **Rastreabilidade Contratual:** Toda integração aprovada deve especificar claramente o consumidor, os arquivos permitidos (`ALLOWED_PATHS`), os arquivos proibidos (`FORBIDDEN_PATHS`) e os critérios objetivos de reversão/saída.

---

## 5. Como uma Task Futura Referencia uma Capacidade Candidata

Para referenciar uma ferramenta candidata sem autorizar sua execução ou instalação imediata, a Issue/Contrato da tarefa deve utilizar a seguinte sintaxe canônica:

```markdown
CAPABILITY_REFERENCE:
- NAME: <Nome da Ferramenta> (ex: Graphify)
- REGISTRY_STATUS: CANDIDATE | POC_VALIDATED
- INTENDED_PURPOSE: <Justificativa concreta e delimitada da task>
- SCOPE_AUTHORIZATION: REFERENCE_ONLY (Proibido instalar, empacotar ou executar em produção)
- GATE_REQUIRED: <Identificador do portão de POC> (ex: EXTERNAL-CAPABILITY-GATE)
```

**Regra de Ouro:** Declarar `SCOPE_AUTHORIZATION: REFERENCE_ONLY` assegura que o Executor compreenda o contexto sem que isso constitua permissão para instalar pacotes npm, daemons ou alterar código de produção.
