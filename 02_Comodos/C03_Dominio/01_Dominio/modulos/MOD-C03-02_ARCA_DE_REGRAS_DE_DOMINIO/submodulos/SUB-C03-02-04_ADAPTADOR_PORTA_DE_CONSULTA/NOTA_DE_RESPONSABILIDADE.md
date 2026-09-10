# SUB-C03-02-04_ADAPTADOR_PORTA_DE_CONSULTA

Responsabilidade canonica do submodulo.

## Papel
PORTA DE SAIDA read-only da ARCA: enriquecerDiagnostico(codigoRegra, contexto) devolve metadados (rule_id, fonte, tipo, excecoes, human_action). Mapeia 26 codigos -> 20 das 31 regras; codigo sem mapeamento retorna ARCA_RULE_NOT_MAPPED (o consumidor deve reportar LACUNA_ARCA, nunca assumir verde).

## Artefatos
Dominio/ARCA/AdaptadorConsultaArca.js

## Limites
- Nao altera diagnostico; nao decide severidade; nao fecha lacuna por omissao.
- Read-only sobre dados operacionais; nenhum acesso a planilha.
