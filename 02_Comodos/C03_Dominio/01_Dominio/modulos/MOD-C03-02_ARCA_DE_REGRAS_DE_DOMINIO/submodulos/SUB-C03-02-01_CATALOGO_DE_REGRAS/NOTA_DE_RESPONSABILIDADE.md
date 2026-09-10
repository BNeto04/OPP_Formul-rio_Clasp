# SUB-C03-02-01_CATALOGO_DE_REGRAS

Responsabilidade canonica do submodulo.

## Papel
Mantem o catalogo canonico legivel por maquina (JSON) e humano (MD). 31 regras com 22 campos por regra: rule_id, titulo, descricao_humana, categoria, subdominio, tipo_regra, fonte_status, fontes, evidencia_codigo, evidencia_testes, condicao, resultado_esperado, excecoes, parametros, hardcoded, vigencia, confianca, consumidores, alcance, riscos, status_cobertura, observacoes.

## Artefatos
Dominio/ARCA/arca_regras_dominio.json + Dominio/ARCA/ARCA_REGRAS_DOMINIO.md

## Limites
- Nao cria regra nova; nao altera regra vigente; nao promove heuristica.
- Read-only sobre dados operacionais; nenhum acesso a planilha.
