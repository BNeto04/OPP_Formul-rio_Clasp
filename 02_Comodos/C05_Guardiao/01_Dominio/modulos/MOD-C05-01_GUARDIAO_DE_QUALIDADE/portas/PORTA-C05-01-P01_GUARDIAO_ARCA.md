# PORTA C05/MOD-C05-01/P01 — Guardiao → ARCA (metadados canonicos de cada diagnostico)

- **Endereço global:** `C05_Guardiao/MOD-C05-01_GUARDIAO_DE_QUALIDADE/P01`
- **Escala:** modulo
- **Origem:** construcao de diagnostico do Guardiao — `Core/RegrasQualidade.js:32-44` (`criarDiagnostico`)
- **Destino:** ARCA, fora da Planta — `Dominio/ARCA/AdaptadorConsultaArca.js:210` (`enriquecerDiagnostico`) → `:155` (`consultarPorRuleId`)
- **Elegibilidade (§12.6):** ELEGÍVEL — (A) cruza fronteira: o destino esta **fora da Planta** (a ARCA e dependencia transversal)
- **Estado:** VERDE — checklist §12.6 sem itens pendentes

## Payload
`codigoDiagnostico` + contexto (`evidencia`, `acaoRecomendada`) → estrutura explicavel `{status, rule_id, rule_type, source_status, confidence, expected_rule_summary, is_official, excecoes}` (`Dominio/ARCA/AdaptadorConsultaArca.js:214-263`).

## require
1. `AdaptadorConsultaArca` alcancavel por escopo global ou `require` (`Core/RegrasQualidade.js:32-38`).
2. existe mapeamento `codigoDiagnostico -> rule_id` (`AdaptadorConsultaArca.js:12-78`, `MAPA_DIAGNOSTICO_ARCA`).

## ensure
1. **fail-soft em dois niveis**: adaptador ausente ⇒ `ARCA_RULE_NOT_MAPPED` (`Core/RegrasQualidade.js:44`); excecao ⇒ `ARCA_METADATA_UNAVAILABLE` (`:40-42`). O diagnostico e produzido **sempre**, com ou sem ARCA.
2. codigo sem mapeamento devolve `ARCA_RULE_NOT_MAPPED` explicito, nunca metadado inventado (`AdaptadorConsultaArca.js:214-228`).
3. a distincao oficial x heuristica e explicita: `is_official` so e verdadeiro com `tipo_regra = OFFICIAL_BUSINESS_RULE` **e** `fonte_status = CANONICAL_SOURCE_CONFIRMED` (`AdaptadorConsultaArca.js:174`).

## invariant
1. somente leitura: a ARCA nao e escrita por esta Porta.
2. a ARCA **enriquece** o diagnostico; nao decide o diagnostico (a regra continua no Guardiao).

## Checklist de produção (§12.6)

| Item | Estado | Resposta (fato medido) |
|---|---|---|
| idempotente | aplicavel | somente leitura: o mesmo diagnostico produz o mesmo enriquecimento. |
| deduplicacao | nao_aplicavel | nao cria registro; o enriquecimento acompanha o diagnostico existente. |
| rate_limit | nao_aplicavel | uma consulta por diagnostico, em processo, contra catalogo local. |
| paginacao | nao_aplicavel | a resposta e um metadado por diagnostico (`AdaptadorConsultaArca.js:248-263`). |
| validacao_entrada | aplicavel | codigo sem mapeamento ⇒ `ARCA_RULE_NOT_MAPPED` explicito (`AdaptadorConsultaArca.js:214-228`); o Guardiao nao usa metadado nao mapeado como se fosse regra. |
| operacao_atomica | nao_aplicavel | Sem escrita: a consulta a ARCA e somente-leitura e nao cria estado parcial em recurso. |
| race_condition | nao_aplicavel | catalogo imutavel com cache congelado (`AdaptadorConsultaArca.js:108,137`); sem estado compartilhado mutavel. |
| cache | aplicavel | **Referencia a implementacao existente:** cache de instancia congelada do adaptador (`Dominio/ARCA/AdaptadorConsultaArca.js:108,137`, invalidado por `limparCache()` em `:98`) — nao repetido aqui (§12.6). |
| retry_pelo_cliente | nao_aplicavel | fail-soft entrega diagnostico enriquecido ou nao enriquecido; nao ha re-tentativa contratada (`Core/RegrasQualidade.js:40-44`). |

## Erros
`ARCA_METADATA_UNAVAILABLE` · `ARCA_RULE_NOT_MAPPED` (`Core/RegrasQualidade.js:41,44`; `AdaptadorConsultaArca.js:159,168,216`).

## Efeitos
Nenhum efeito persistente proprio.

## Seguranca
Somente leitura de catalogo local; nenhum dado de pessoa sai da Planta.

## Observabilidade
O enriquecimento acompanha o diagnostico (`Core/RegrasQualidade.js:40-44`) e aparece no log de auditoria e no painel de saude.

## Implementacao
`Core/RegrasQualidade.js:32-44` → `Dominio/ARCA/AdaptadorConsultaArca.js:155-264`.

## Testes
`Testes/TestGuardiao.js` · `Testes/TestArcaConsumidores.js` · `Testes/TestCatalogoPipGuardiao.js`.

## Evidencia
Leitura direta do codigo nesta sessao (13/09/2026): `Core/RegrasQualidade.js:32,35,40,44`; `Dominio/ARCA/AdaptadorConsultaArca.js:174,210,214,230`.

## Estado
Contrato declarado. Checklist §12.6 completo (0 pendentes). Antes deste card a Porta existia como linha **`Guardiao -> ARCA`** na capsula de C05.
