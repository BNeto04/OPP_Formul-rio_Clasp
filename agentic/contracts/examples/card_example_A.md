# [EX-A-001] - Card ficticio A: ajuste pontual de um arquivo

- TASK_ID: EX-A-001
- PARENT: nenhum
- PRIORIDADE: P2
- BRANCH: sprint/h01-colmeia-api-001
- OWNER_DECISION_REQUIRED: NAO
- CLASP_REQUIRED_RULE: CLASP_REQUIRED=false
- RESULT_SCHEMA: syntheon.result.v1

## ENDERECO_DOWN_PLANT
agentic/ (camada transversal)

## ARQUIVOS_ALVO
- agentic/state/exemplo_a.txt

## ARQUIVOS_PROIBIDOS
- .env*
- config/*.token
- agentic/config/providers.json

## OBJETIVO
Criar o arquivo exemplo_a.txt com o conteudo fixo "EXEMPLO_A_OK".

## CONTEXTO_MINIMO
Nenhum arquivo existente necessario. Conteudo alvo exato: EXEMPLO_A_OK (sem quebra de linha extra).

## CONTRATOS_IMPORTS
- agentic/contracts/a02_canteiro_authority.md

## PASSO_A_PASSO
1. Criar o arquivo agentic/state/exemplo_a.txt.
2. Escrever exatamente EXEMPLO_A_OK.
3. Conferir conteudo com leitura (evidencia local).

## CRITERIOS_DE_ACEITE
- [ ] agentic/state/exemplo_a.txt existe com conteudo EXEMPLO_A_OK

## TESTES_OBRIGATORIOS
node agentic/scripts/test_exemplo_a.js

## EFEITOS_COLATERAIS_PERMITIDOS
- nenhum

## ESTADO_INICIAL
BACKLOG
