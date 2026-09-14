# PORTA C01/MOD-C01-02/P01 — Normalizador de Efetivo → ARCA (metadados das regras aplicadas)

- **Endereço global:** `C01_Entrada/MOD-C01-02_NORMALIZADOR_DE_EFETIVO/P01`
- **Escala:** submodulo
- **Submodulo:** SUB-C01-02-01_DEPENDENCIA_ARCA (porta de consulta a ARCA)
- **Origem:** `Features/NormalizadorEfetivo.js:22` (`NormalizadorEfetivo.executar`) → `Features/NormalizadorEfetivo.js:256` (`obterMetadadosArca`)
- **Destino:** ARCA, fora da Planta — `Dominio/ARCA/AdaptadorConsultaArca.js:155` (`consultarPorRuleId`)
- **Elegibilidade (§12.6):** ELEGÍVEL — (A) cruza fronteira: o destino esta **fora da Planta** (ARCA). E a unica Porta da ARCA do normalizador: as regras `ARCA-EFETIVO-001/002`, `ARCA-MATRICULA-001`, `ARCA-ANTIGUIDADE-001`
- **Estado:** VERDE — checklist §12.6 sem itens pendentes

## Payload
Lista de `rule_id` aplicaveis (`regrasArcaAplicaveis()`) → `{ disponivel: boolean, regras: [{rule_id, titulo, tipo_regra, fonte_status}] }` (`Features/NormalizadorEfetivo.js:256-275`).

## require
1. `AdaptadorConsultaArca` alcancavel por escopo global ou `require` (`Features/NormalizadorEfetivo.js:258-261`).
2. existe funcao `consultarPorRuleId` (`:262-264`).

## ensure
1. **fail-soft**: indisponibilidade devolve `{disponivel:false, motivo:'ARCA_METADATA_UNAVAILABLE', regras:[]}` e a sincronizacao **segue** (`Features/NormalizadorEfetivo.js:262-264`; nota de responsabilidade do Modulo).
2. somente regras com `status === 'MAPPED'` entram na lista (`:269`).
3. os `rule_id` efetivamente aplicados sao escritos na aba de auditoria na linha `REGRAS ARCA` (`:296-301`) — rastreabilidade factual.

## invariant
1. a Porta **nao** duplica regra: as tabelas e limiares continuam em `Core/Constantes.js` e `Core/Utils.js` (fonte unica) — declarado na nota do Modulo.
2. a ARCA nunca bloqueia a sincronizacao.

## Checklist de produção (§12.6)

| Item | Estado | Resposta (fato medido) |
|---|---|---|
| idempotente | aplicavel | somente leitura de catalogo; mesma lista de `rule_id` ⇒ mesmo metadado. |
| deduplicacao | nao_aplicavel | nao cria registro; um mesmo `rule_id` repetido na lista produziria duas entradas de metadado, mas nao escrita duplicada (declarado). |
| rate_limit | nao_aplicavel | poucas chamadas por execucao (4 `rule_id` conhecidos), em processo, sem rede. |
| paginacao | nao_aplicavel | a resposta e a lista de metadados das regras aplicaveis (fechada). |
| validacao_entrada | aplicavel | antes de usar, a Porta valida a existencia do adaptador e do metodo (`Features/NormalizadorEfetivo.js:258-264`). |
| operacao_atomica | nao_aplicavel | sem efeito de escrita. |
| race_condition | nao_aplicavel | leitura de catalogo imutavel; cache congelado no adaptador (`AdaptadorConsultaArca.js:108`). |
| cache | aplicavel | **Referencia a implementacao existente:** cache de instancia congelada no proprio adaptador (`Dominio/ARCA/AdaptadorConsultaArca.js:108,137`) — nao repetida aqui (§12.6: referenciar em vez de repetir). |
| retry_pelo_cliente | nao_aplicavel | o consumidor nao re-tenta: segue com `disponivel:false` e loga `INDISPONIVEL` (`Features/NormalizadorEfetivo.js:262-264,298`). |

## Erros
`ARCA_METADATA_UNAVAILABLE` (adaptador ausente) · excecao por regra e engolida em silencio (fail-soft declarado, `Features/NormalizadorEfetivo.js:272`).

## Efeitos
Nenhum efeito persistente proprio (a escrita em `[AUDITORIA] Efetivo` pertence a Porta C01/MOD-C01-02/P02).

## Seguranca
Somente leitura do catalogo local de regras.

## Observabilidade
`disponivel`/`motivo` no retorno (`Features/NormalizadorEfetivo.js:274`) + linha `REGRAS ARCA` no log (`:296-301`).

## Implementacao
`Features/NormalizadorEfetivo.js:252-275` → `Dominio/ARCA/AdaptadorConsultaArca.js:155-202`.

## Testes
`Testes/TestArcaNormalizadorEfetivo.js` · `Testes/TestArcaConsumidores.js`.

## Evidencia
Leitura direta do codigo nesta sessao (13/09/2026): `Features/NormalizadorEfetivo.js:22,256,258,262,269,272,274,298`.

## Estado
Contrato declarado. Checklist §12.6 completo (0 pendentes). Antes deste card a Porta existia apenas como **no do circuito** (`CIR-MOD-C01-02_NORMALIZADOR_DE_EFETIVO.canvas`, no `norm-3`) e como linha de dependencia na NOTA_DE_RESPONSABILIDADE — o Modulo **nao tem capsula §46.2** e nao tinha `## Portas`.
