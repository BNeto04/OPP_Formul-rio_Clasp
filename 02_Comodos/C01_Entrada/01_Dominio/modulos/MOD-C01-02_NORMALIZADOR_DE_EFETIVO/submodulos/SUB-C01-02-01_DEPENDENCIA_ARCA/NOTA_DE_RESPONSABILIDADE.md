# SUB-C01-02-01_DEPENDENCIA_ARCA

Responsabilidade canonica do submodulo.

## Papel
Representar a porta de consulta do Normalizador de Efetivo a ARCA (somente leitura de metadados de regra).
Nao altera regra, nao duplica tabela: apenas informa quais regras canonicas sustentam as decisoes.

## Interface
- `NormalizadorEfetivo.regrasArcaAplicaveis()` -> ARCA-EFETIVO-001, ARCA-EFETIVO-002, ARCA-MATRICULA-001, ARCA-ANTIGUIDADE-001
- `NormalizadorEfetivo.obterMetadadosArca()` -> { disponivel, regras[] } via AdaptadorConsultaArca (fail-soft)

## Limites
- Read-only; ausencia da ARCA nunca bloqueia a sincronizacao (devolve ARCA_METADATA_UNAVAILABLE).
