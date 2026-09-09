# [EX-B-002] - Card ficticio B: multiplos arquivos + decisao humana

- TASK_ID: EX-B-002
- PARENT: #999
- PRIORIDADE: P0
- BRANCH: sprint/h01-colmeia-api-001
- OWNER_DECISION_REQUIRED: SIM
- CLASP_REQUIRED_RULE: CLASP_REQUIRED=false
- RESULT_SCHEMA: syntheon.result.v1

## ENDERECO_DOWN_PLANT
agentic/state/

## ARQUIVOS_ALVO
- agentic/state/exemplo_b1.txt
- agentic/state/exemplo_b2.txt

## ARQUIVOS_PROIBIDOS
- .env*
- *.token
- .git/

## OBJETIVO
Criar dois arquivos de estado marcando inicio e fim de um experimento ficticio.

## CONTEXTO_MINIMO
Experimento EX-B (ficticio). O card exige decisao humana porque altera a politica de observacao.

## CONTRATOS_IMPORTS
- agentic/contracts/a02_canteiro_authority.md
- agentic/roles/README.md

## PASSO_A_PASSO
1. Criar exemplo_b1.txt com conteudo "EX-B:INICIO".
2. Criar exemplo_b2.txt com conteudo "EX-B:FIM".
3. Reportar manifest dos 2 arquivos.

## CRITERIOS_DE_ACEITE
- [ ] exemplo_b1.txt = EX-B:INICIO
- [ ] exemplo_b2.txt = EX-B:FIM

## TESTES_OBRIGATORIOS
node agentic/scripts/test_exemplo_b.js

## EFEITOS_COLATERAIS_PERMITIDOS
- nenhum

## ESTADO_INICIAL
BACKLOG
