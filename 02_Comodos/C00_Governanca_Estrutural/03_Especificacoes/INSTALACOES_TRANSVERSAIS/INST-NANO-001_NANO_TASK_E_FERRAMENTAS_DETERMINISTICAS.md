# INST-NANO-001 — Nano Task e ferramentas determinísticas NM-OBS-* (bancada de agentes)

- **Identificador:** `INST-NANO-001`
- **Documento:** classificação de instalação transversal + decisão (card **#169** / `DP24-006`, pai **#57**)
- **Estado:** **INSTALADO — ativo** (colheita dentro do repositório; bancada de origem preservada intacta)
- **Versão:** 1.0
- **Âncora:** `C00_Governanca_Estrutural` (Cômodo técnico), conforme §8.11 do método (âncora declarada)
- **Endereço Canônico Down Plant:** `Terreno SYNTHÉON GS -> C00_Governanca_Estrutural -> 03_Especificacoes -> INSTALACOES_TRANSVERSAIS -> INST-NANO-001`
- **Artefato:** `scripts/dp24-nano/**` — **20 arquivos · 1021 linhas** (tabela de proveniência por hash na seção 8)
- **Teste (fechadura):** `Testes/TestNanoMachines.js` (6 testes · executa a bancada da própria instalação)
- **Bancada da instalação:** `scripts/dp24-nano/tests/**` — **20 testes** (`python -m unittest discover -s tests`, exit 0)
- **Responsável técnico:** Proprietário (Manoel) — execução por agentes sob card
- **Data desta versão:** 15/09/2026 · Branch `sprint/g01-guardiao-qualidade-live-001` · HEAD anterior à colheita `4276429`

> **Declaração de derivação do formato (obrigatória).** O formato deste documento foi **derivado do que já
> existe no repositório + do método**, nunca inventado:
> 1. **estrutura de seções** dos dois precedentes de instalação transversal já instalados neste repo:
>    `INST-EXEC-001_ENDPOINT_DE_EXECUCAO.md` e `INST-SERIALIZACAO-001_ESCRITA_GLOBAL.md` (que por sua vez
>    derivam de §46.7 / `03_Fundacao/ESTRUTURA_DO_COFRE.md`: Estado/Versão/Âncora/Responsável + Contrato e
>    Portas / Consumidores / Dados / Falhas / Observabilidade / Implementação / Testes / Migração);
> 2. **família de identificador `INST-<TOKEN>-001`** já usada no repositório (`INST-EXEC-001`,
>    `INST-SERIALIZACAO-001`) — **nenhuma família paralela foi criada**;
> 3. **local** `02_Comodos/C00_Governanca_Estrutural/03_Especificacoes/INSTALACOES_TRANSVERSAIS/` — a pasta
>    existente, criada pelo #155 para exatamente este tipo de capacidade;
> 4. **decisão ontológica** registrada em documento próprio do §46.4:
>    `DEC-INST-NANO-001_NANO_TASK_COMO_INSTALACAO_TRANSVERSAL.md`.
>
> **Proveniência:** a bancada de origem (`C:\Users\Bneto04\Documents\Codex\dp24-nano-lab`, 24/08/2026)
> **não possui histórico Git próprio** — a proveniência é, portanto, **por hash SHA-256 arquivo a arquivo**
> (seção 8), medido na origem e conferido após a colheita.

---

## 1. Natureza do artefato (por que é instalação transversal, e não Módulo do produto)

A bancada `dp24-nano-lab` fornece **infraestrutura determinística compartilhada a agentes**: contrato de
Nano Task (9 blocos), gateway de acionamento com autoridade declarada, caminho seguro (`safe_path`) e seis
ferramentas determinísticas `NM-OBS-*` (`write`, `read`, `patch`, `verify_file`, `parse_canvas`,
`build_canvas`). Ela **não representa capacidade funcional do produto OPP**: nenhum fluxo de operador
(ocorrência, comparativo, armas, drogas, PIP/CPM) a utiliza.

Transformá-la em **Módulo** confundiria **infraestrutura do método/agentes** com **capacidade entregue ao
usuário** — exatamente o que o §8.11 separa ao definir instalação transversal como *capacidade técnica
compartilhada* (transporte, autenticação, auditoria, configuração, tratamento de erro, observabilidade).

Portanto: **Instalação transversal (§8.11)**, com âncora declarada no Cômodo técnico `C00_Governanca_Estrutural`.
Ela **não entra na Planta como Módulo de produto nem como Circuito funcional do OPP** (decisão do Planner,
15/09/2026 — ver `DEC-INST-NANO-001`).

## 2. Contrato da Porta

O contrato é o **envelope de ferramenta** (`schemas/tool_envelope.schema.json`) executado pelo gateway
(`nano_machines/tool_gateway.py`). A Nano Task que o consome é definida por **9 blocos**
(`schemas/nano_task.schema.json`, preservado verbatim do laboratório):

`identity` · `gps` · `input` · `operation` · `contract` · `authority` · `transition` · `evidence` · `stop`

Regras contratadas (do laboratório, preservadas):
- `operation` usa **`tool`**, nunca `capability` — capacidade é do agente, ferramenta é externa e determinística;
- `authority` declara `allowed_paths`, `effects` e `expand_scope` — **sem autoridade declarada, não executa**;
- toda execução devolve **evidência** (status, `changed`, `diagnostics`, `evidence`, `result`).

## 3. Como se instala

1. **Dependência declarada:** **Python 3** (medido nesta máquina: `python` = 3.11.16). Não há dependência de
   pacote externo — a bancada usa apenas biblioteca padrão.
2. **Execução da bancada da instalação:**
   `cd scripts/dp24-nano && python -m unittest discover -s tests` → **20 testes · OK · exit 0**.
3. **CLI de ferramenta:** `python run_tool.py <envelope.json|->`; piloto: `python run_pilot.py`.
4. **Fechadura no repositório:** `node Testes/TestNanoMachines.js` (e, no todo, `node Testes/RodarTodosOsTestes.js`).
5. Se `python` não estiver no PATH, usar `PYTHON=<caminho do interpretador>`. **A ausência de Python é falha
   RUIDOSA** (§3.5): a fechadura falha declarando o motivo — instalação que não roda não está instalada.

## 4. Consumidores reais

- **Consumidores de produto (runtime OPP): 0 (zero).** Nenhum arquivo de `Core/`, `Entrada/`, `Features/`,
  `Motor/`, `Render/`, `Dominio/`, `Drivers/`, `Leitura/` importa ou chama esta instalação.
- **Consumidores legítimos:** **agentes/executores** que operam o projeto sob card (o §32 trata a governança
  de agentes). Declarar consumidor é o que impede que a instalação vire capacidade órfã.

## 5. Dados e segurança

- **Caminho seguro:** `nano_machines/safe_path.py` resolve alvo **dentro da raiz declarada**; tentativa de
  escapar da raiz é recusada (fail-closed).
- **Autoridade explícita:** `authority.allowed_paths` / `effects` / `expand_scope` — o gateway recusa
  operação cujo efeito não esteja autorizado; `dry_run` está no contrato.
- **Dados permitidos:** apenas arquivos sob a raiz declarada no envelope. Nenhum dado de produção do OPP.
- **Escrita no produto:** **nenhuma**. A instalação não toca `Core/`, `Entrada/`, `Features/`, `Motor/`,
  `Render/`, `Dominio/`, `Drivers/`, `Leitura/`, nem abas da planilha operacional.

## 6. Falhas (comportamento contratado)

- **Fail-closed:** sem autoridade, sem caminho válido ou com operação proibida, a resposta é `REJECTED`/
  `DENIED` e **nada é escrito**.
- **Falha ruidosa:** envelope inválido → `INVALID_JSON` com `ok: false`; erro de caminho → diagnóstico nomeado.
- **Limite declarado:** a bancada **não executa agente local** (o `README.md` do laboratório é explícito), não
  decide prioridade e não substitui o Guardião da Qualidade nem qualquer Porta do produto.

## 7. Observabilidade

Toda chamada devolve envelope com `ok`, `status`, `operation`, `caller`, `dry_run`, `changed`,
`diagnostics[]`, `evidence` (inclusive `sha256` do alvo) e `result`. É o mesmo princípio do §46.3: a prova
viaja com a execução.

## 8. Implementação — tabela de proveniência (origem: `dp24-nano-lab`, sem histórico Git)

| Arquivo no repositório | SHA-256 (conteudo com fim de linha normalizado para LF = o blob do Git) | Linhas |
| :--- | :--- | ---: |
| `scripts/dp24-nano/nano_machines/__init__.py` | `3badaa0fac8b80210abf4719bcd435a723f3554e7702d24ff13c357b2ae33439` | 1 |
| `scripts/dp24-nano/nano_machines/nano_task_contract.py` | `ae0f9ad19c68f0b6769bbeeb71413ca400623fc214ab133e79d0970dce04326d` | 51 |
| `scripts/dp24-nano/nano_machines/nm_obs_build_canvas.py` | `0362d262b6aecf966ff447479f0f512a44b6ecfbbecdf64533a1db86bac63366` | 32 |
| `scripts/dp24-nano/nano_machines/nm_obs_parse_canvas.py` | `9505984ba0034ca4878a96cdff6ada2bc9552a7c65e92fd8f7ee81e98d1474a5` | 52 |
| `scripts/dp24-nano/nano_machines/nm_obs_patch.py` | `76fb8aeb761211f0c819736801d47d0d04063f1142c699c38b6c1d3f650efa44` | 19 |
| `scripts/dp24-nano/nano_machines/nm_obs_read.py` | `f641a6f071b6295181990c5d1a70b06aaec8550f2cbcc6348bd364edc22f6597` | 15 |
| `scripts/dp24-nano/nano_machines/nm_obs_verify_file.py` | `8be69d7ebd49018501ee914af84307430a9c938311d92ad9742ada86dd9f2b9f` | 44 |
| `scripts/dp24-nano/nano_machines/nm_obs_write.py` | `a417b543119eda8d00a21811bf472e329758632c779d7c6d26af71543d1e154a` | 27 |
| `scripts/dp24-nano/nano_machines/safe_path.py` | `9934b279f2d4b9cfcae793291304e03e200e01f512ad300e804e82460e02aaff` | 27 |
| `scripts/dp24-nano/nano_machines/tool_gateway.py` | `042c1fa0cd798756b65f344da77ab2fc0cb5fb865266db0ac65fa15ffe1ef448` | 174 |
| `scripts/dp24-nano/ONTOLOGIA_EXPERIMENTAL.md` | `4c2ba4d85181b2f76f762cb8aeae3cdbcb106c8b251df09b9c3d5d849b2ef287` | 30 |
| `scripts/dp24-nano/README.md` | `9eab30d5f1cf3a4ab8d0dd7d9ccbf67d409f378d56099fadea36515faff2f15b` | 7 |
| `scripts/dp24-nano/run_pilot.py` | `2f1dba799ecdbcd5d377c6c6eb630739a573ee6584155eae7e1937c57d4201ca` | 42 |
| `scripts/dp24-nano/run_tool.py` | `cc7606e4c67e819adebbe95f013bec8aa88a0878c9c4c9d36b555e39f6495775` | 48 |
| `scripts/dp24-nano/schemas/nano_task.schema.json` | `18c0e71cf8f55c16c4853e961364939ee23c4616623e6e976761ed4fca06dbee` | 112 |
| `scripts/dp24-nano/schemas/tool_envelope.schema.json` | `042c86bbb5a597a614372231d6f1c4a629c7a064c97707d8c8e40344e99f5763` | 20 |
| `scripts/dp24-nano/tests/test_nano_machines.py` | `29d0081caf21b82cbfff0ceba2b9490573d01b4548b4b438dcd9a277b0fb4422` | 98 |
| `scripts/dp24-nano/tests/test_nano_task_contract.py` | `8869bc69c93d478aecce5854dbc12135cae5367c5d6c1cf45aec8d4f6c2e7b95` | 61 |
| `scripts/dp24-nano/tests/test_run_tool_cli.py` | `a4a6abd90ed800c1e890025f667ee6a9666e433d6e3259c0bce507d1fc4fa623` | 77 |
| `scripts/dp24-nano/tests/test_tool_gateway.py` | `d3e1a8e5ff11d736ad18841207650277026795212291fad1c595f37ee46a506d` | 84 |

**Excluído deliberadamente da colheita:** `C99-LAB-FANTASMA/piloto.canvas` (SHA-256 `80e025d2538cd31f3ee20fb7a2d385b622883a2182fbb0f9c4ddcbf3a8162c09`) — é
**fixture do terreno fictício do laboratório** (`C99-LAB-FANTASMA`), não capacidade; mantê-lo no repositório
poderia ser lido como Canvas do produto. O hash fica registrado para recuperação, se algum dia for necessário.

**Não reimplementado:** os arquivos acima são a **cópia integral** do laboratório (conferida byte a byte por
`diff` de hashes; o **unico** ajuste e a normalizacao de fim de linha para LF (laboratorio em CRLF, repositorio em LF), sem alteracao de conteudo). Nenhuma linha de Python foi reescrita — o §31.2 proíbe reimplementar capacidade existente.

## 9. Testes (a fechadura)

- **Bancada da instalação (a prova de que roda):** `scripts/dp24-nano/tests/**` — **20 testes**, exit 0.
- **Fechadura no repositório:** `Testes/TestNanoMachines.js` — confere (1) existência no endereço declarado,
  (2) natureza transversal + DEC, (3) **proveniência por hash arquivo a arquivo contra esta tabela**,
  (4) os **9 blocos** do schema com `operation.tool`, (5) presença das 6 `NM-OBS-*`, (6) **execução real da
  bancada com veredito por exit code**, (7) **não-mutação** da árvore colhida após rodar.
- Registrada em `Testes/RodarTodosOsTestes.js` (contador único da suíte).

## 10. Migração e reversão

- **Migração:** nenhuma sobre o produto — a instalação é aditiva. A bancada de origem
  (`C:\Users\Bneto04\Documents\Codex\dp24-nano-lab`) permanece **intacta**.
- **Reversão:** `git revert <commit-da-colheita>` (ou apagar `scripts/dp24-nano/`, `Testes/TestNanoMachines.js`
  e este documento). Sem efeito sobre runtime, planilha ou publicação.
- **Condição de revisão:** se algum **fluxo do produto** passar a consumir a instalação, a natureza deve ser
  reavaliada (deixa de ser apenas infraestrutura de agentes).
