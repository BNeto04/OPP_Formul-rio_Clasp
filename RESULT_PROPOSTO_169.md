# RESULT — #169 (DP24-006) · Instalação transversal INST-NANO-001 (Nano Task 9 blocos + 6 NM-OBS-*)

**Localização Down Plant:** `Terreno SYNTHÉON GS -> C00_Governanca_Estrutural -> 03_Especificacoes -> INSTALACOES_TRANSVERSAIS -> INST-NANO-001`
**Task:** #169 / `DP24-006` (pai #57) — *"Colher o `dp24-nano-lab` (Nano Task 9 blocos + 6 NM-OBS-*)"*
**Branch:** `sprint/g01-guardiao-qualidade-live-001` · **HEAD anterior:** `4276429` · **commit desta fatia:** `2a97746`
**Ambiente:** Windows · node v24.14.0 · `python` = 3.11.16 (biblioteca padrão apenas)

---

## 1. Decisão ontológica (exigida pelo card: registrada, não presumida)

**Decisão do Planner, 15/09/2026 — opção (a): INSTALAÇÃO TRANSVERSAL §8.11.**
Justificativa (verbatim): *"o dp24-nano-lab fornece infraestrutura determinística compartilhada — contrato Nano Task, gateway, safe path e ferramentas NM-OBS-* — mas não representa uma capacidade funcional do produto OPP. Transformá-lo em Módulo confundiria infraestrutura do método/agentes com capacidade entregue ao usuário."*

Registrada em **`DEC-INST-NANO-001`** (`.../INSTALACOES_TRANSVERSAIS/DEC-INST-NANO-001_NANO_TASK_COMO_INSTALACAO_TRANSVERSAL.md`), no formato §46.4. A instalação **não entra na Planta como Módulo de produto nem como Circuito funcional do OPP** — **consumidores de produto = 0** (nenhum arquivo de `Core/`, `Entrada/`, `Features/`, `Motor/`, `Render/`, `Dominio/`, `Drivers/`, `Leitura/` a importa).

**ID/âncora:** `INST-NANO-001`, âncora `C00_Governanca_Estrutural` — **família existente** (`INST-EXEC-001`, `INST-SERIALIZACAO-001`), **nenhuma família paralela criada**.

## 2. ANTES → DEPOIS

| | ANTES | DEPOIS |
|---|---|---|
| Onde | `C:\Users\Bneto04\Documents\Codex\dp24-nano-lab` (fora do repo) | `scripts/dp24-nano/**` (dentro do repo, endereçado) |
| Tamanho | 852 linhas Python (medido na bancada) | **20 arquivos · 1.021 linhas** colhidos |
| Endereço Down Plant | nenhum | `INST-NANO-001` + DEC (endereço canônico declarado) |
| Teste | 20 testes rodando fora do contador | 20 testes **+ fechadura no contador único** (`Testes/TestNanoMachines.js`) |
| Proveniência | nenhuma (bancada sem histórico Git) | **hash SHA-256 por arquivo**, declarado no documento e conferido no arquivo |
| Reprodução em checkout limpo | não aplicável | **provada** (ver §5) |

## 3. Arquivos alterados

- **Novos (colheita):** `scripts/dp24-nano/**` (20 arquivos: pacote `nano_machines/` com 6 `NM-OBS-*` + `safe_path.py` + `tool_gateway.py` + `nano_task_contract.py`; `schemas/` ×2; `tests/` ×4; `run_tool.py`; `run_pilot.py`; `README.md`; `ONTOLOGIA_EXPERIMENTAL.md`).
- **Novos (documentação):** `02_Comodos/C00_Governanca_Estrutural/03_Especificacoes/INSTALACOES_TRANSVERSAIS/INST-NANO-001_NANO_TASK_E_FERRAMENTAS_DETERMINISTICAS.md` e `.../DEC-INST-NANO-001_NANO_TASK_COMO_INSTALACAO_TRANSVERSAL.md`.
- **Novo (fechadura):** `Testes/TestNanoMachines.js`.
- **Alterados:** `Testes/RodarTodosOsTestes.js` (registro da fechadura) · `.gitignore` (`scripts/dp24-nano/**/__pycache__/`).
- `git diff --stat` do commit: **25 arquivos, +1.389 −0**.

**Não reimplementado (§31.2):** `diff` de hashes provou colheita **idêntica** ao laboratório, sendo o **único** ajuste a normalização de fim de linha **CRLF → LF** (laboratório em CRLF; repositório armazena LF) — sem alteração de conteúdo.

## 4. Contratos e invariantes

- **9 blocos da Nano Task** preservados no schema, com `operation.tool` (enum das 6 `NM-OBS-*`) e **proibição explícita** de `capability` (`operation.not.required = ["capability"]`).
- **Autoridade explícita** (`allowed_paths` / `effects` / `expand_scope`) e **fail-closed**: sem autoridade declarada nada é escrito.
- **Caminho seguro:** alvo sempre resolvido dentro da raiz; fuga de raiz é recusada.
- **Evidência por execução:** todo envelope devolve `status`, `changed`, `diagnostics[]`, `evidence` (com `sha256`).
- **Nenhuma escrita no produto.** Nenhum arquivo de runtime ou aba da planilha é tocado.

## 5. Comandos, resultados e exit codes (medidos)

| Comando | Resultado |
|---|---|
| `python -m unittest discover -s tests` (em `scripts/dp24-nano`) | **Ran 20 tests · OK · exit 0** |
| `node -e "require('./Testes/TestNanoMachines')()"` **antes da colheita** | **0 PASS / 6 FAIL · exit 1** (RED — nada colhido) |
| `node -e "require('./Testes/TestNanoMachines')()"` **depois** | **6 PASS / 0 FAIL · exit 0** (GREEN) |
| `node Testes/RodarTodosOsTestes.js` | **exit 0 · 760 linhas `[PASS]` · 0 FAIL real** |
| `node scripts/downplant/lint-estrutura.mjs` | **exit 0** (árvore documental em conformidade) |
| **Checkout limpo** (`git archive HEAD` → LF, sem `.git`, em diretório temporário): `node -e "require('./Testes/TestNanoMachines')()"` | **6 PASS / 0 FAIL · exit 0** |
| **Proveniência × blob do Git** (amostra de 4 arquivos: `tool_gateway.py`, `nano_task.schema.json`, `test_tool_gateway.py`, `safe_path.py`) | **IGUAL em 4/4** (hash do documento == blob do repositório) |
| `diff` origem × colheita | **idêntico** (após normalização CRLF→LF) |

> **Nota de reprodutibilidade (aprendizado de F1/F2 do #172):** o hash de proveniência é calculado sobre o conteúdo com **fim de linha normalizado para LF** — exatamente o que o Git armazena. Por isso a fechadura passa **tanto** na working copy CRLF desta máquina **quanto** num checkout limpo (LF). Esta instalação foi construída **reprodutível por construção**; a não-reprodutibilidade do restante da suíte continua registrada no #172.

## 6. Git e publicação (quatro pontas, #57)

- **GIT 🟢:** `2a97746` · `local × remoto = 0 0` (após `push`).
- **CÓDIGO 🟢:** fechadura RED→GREEN; bancada exit 0; suíte integral exit 0; lint exit 0.
- **DOCUMENTAÇÃO 🟢:** `INST-NANO-001` + `DEC-INST-NANO-001` com proveniência conferível.
- **CANVAS / PLANTA ⚪ NÃO_APLICÁVEL (justificado por precedente medido):** busca por `INST-` em **todos** os `.canvas` do repositório → **0 ocorrências**; os dois precedentes (`INST-EXEC-001`, `INST-SERIALIZACAO-001`) também não estão em Canvas. A instalação **não é Módulo nem Circuito de produto** (decisão §1), logo não altera endereço/relação da Planta.
- **CLASP / publicação ⚪ NÃO EXECUTADO (justificado):** `scripts/**` **e** `02_Comodos/**` estão no `.claspignore` — **nada** desta fatia é publicado no Apps Script. Nenhum arquivo de runtime foi alterado (`git diff --name-only | grep -E '^(Core|Entrada|Features|Motor|Render|Dominio|Drivers|Leitura)/'` = vazio).

## 7. Pendências e risco residual

- **(P1)** A instalação cria **dependência de ambiente**: exige Python 3. Declarada em `INST-NANO-001 §3`; ausência → **falha ruidosa** (§3.5), nunca fallback silencioso.
- **(P2)** Fixture `C99-LAB-FANTASMA/piloto.canvas` **não colhida** deliberadamente (terreno fictício do laboratório, não capacidade); hash registrado no documento para recuperação (SHA-256 `80e025d2…`).
- **(P3)** `run_pilot.py` escreve no diretório do piloto quando executado manualmente (comportamento do laboratório, preservado): **não** está no caminho da suíte; a fechadura roda apenas `unittest discover`.
- **Risco residual:** nenhum sobre o produto. O sistema publicado não muda.

## 8. Próximo passo (não iniciado)

- **#170** (métricas §38 + gate §21.2) — conforme a rota do Planner: **somente após** o fechamento do #169.
- **#172** — paralelo e independente, absorvendo **F1** e **F2** (instrumento da suíte).
- **#176** — permanece **experimental**; a decomposição P3→Comparativo com a nova régua (entrar no Circuito = enxergar o trecho completo necessário para a unidade cumprir sua entrega; serviço interno **não** vira automaticamente Circuito novo) segue pendente de comando.
