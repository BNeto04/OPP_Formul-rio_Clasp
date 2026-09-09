# Template de Card Executavel - Canteiro A02

Card: #80 T-A02-ISSUE-CONTRACT-002 | Pai: #78 | Contrato: a02_canteiro_authority.md (#79)
Como usar: copie este template para o corpo de uma nova Issue e preencha. O dispatcher (#82)
parseia de forma deterministica: metadados no topo como `CHAVE: valor` (uma linha) e blocos
como `## CHAVE` ate o proximo `##`. Listas usam um item por linha com prefixo `- `.
Nenhum contexto externo e necessario para executar: o card e auto-suficiente.

# [TASK_ID] - Titulo curto do card

- TASK_ID: EX-001 (obrigatorio, unico)
- PARENT: #NNN (Issue pai; "nenhum" se raiz)
- PRIORIDADE: P0 | P1 | P2
- BRANCH: nome-da-branch (somente cards desta branch ativa podem ser despachados)
- OWNER_DECISION_REQUIRED: NAO (SIM so quando exigir decisao humana explicita antes de executar)
- CLASP_REQUIRED_RULE: CLASP_REQUIRED=false (regra padrao do canteiro; alterar so com justificativa factual)
- RESULT_SCHEMA: syntheon.result.v1 (schema padrao; ver a02_canteiro_authority.md)

## ENDERECO_DOWN_PLANT
(Endereco canonico no vault quando aplicavel; "NAO_APLICAVEL" se infraestrutura transversal. Uma linha.)

## ARQUIVOS_ALVO
- caminho/relativo/arquivo.ext
- caminho/relativo/outro.ext
(escopo permitido de escrita. Um item por linha, caminho relativo a raiz do repositorio.)

## ARQUIVOS_PROIBIDOS
- .env*
- config/*.token
(protegidos: nenhum item desta lista pode ser alterado, nem via path traversal.)

## OBJETIVO
(Uma frase: o que o card entrega.)

## CONTEXTO_MINIMO
(Informacao indispensavel para executar sem buscar fora do card; sem segredos. Se precisar de
contrato/arquivo existente, referencie por caminho.)

## CONTRATOS_IMPORTS
- caminho/do/contrato.md (regra/contrato a respeitar)
(camada transversal quando aplicavel; "nenhum" se desnecessario.)

## PASSO_A_PASSO
1. (ordem de execucao)
2. (cada passo concreto e verificavel)

## CRITERIOS_DE_ACEITE
- [ ] criterio 1 (verificavel)
- [ ] criterio 2

## TESTES_OBRIGATORIOS
(Uma linha: comando(s) de teste que o Test Runner deve executar; ex.: node agentic/scripts/test_x.js)

## EFEITOS_COLATERAIS_PERMITIDOS
- (ex.: criacao de arquivos de evidencia em agentic/state/; "nenhum" se proibido)
(qualquer efeito fora desta lista e scope creep e reprova o card.)

## ESTADO_INICIAL
BACKLOG (o canteiro transiciona via #79; o worker nunca fecha a Issue)
