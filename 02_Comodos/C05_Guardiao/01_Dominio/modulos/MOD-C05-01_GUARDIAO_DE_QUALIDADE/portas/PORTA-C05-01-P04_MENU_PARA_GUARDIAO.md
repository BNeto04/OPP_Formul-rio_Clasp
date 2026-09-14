# PORTA C05/MOD-C05-01/P04 — Menu do Sheets → Guardiao (seletor de meses e auditoria da aba atual)

- **Endereço global:** `C05_Guardiao/MOD-C05-01_GUARDIAO_DE_QUALIDADE/P04`
- **Escala:** modulo
- **Origem:** menu unico P3 (C01): itens `Auditar (seletor de meses)` → `abrirSeletorMesesGuardiao` (`Entrada/SeletorMesesGuardiao.js:329`) e `Auditar aba atual` → `executarGuardiaoQualidade` (`Features/GuardiaoQualidade.js:688`); declarados em `Entrada/Menu.js:39-45`
- **Destino:** ciclo de auditoria de C05 — `executarSelecaoGuardiao` (`Entrada/SeletorMesesGuardiao.js:352`) → `SeletorMesesGuardiao.auditarMeses` (`:208`) → `GuardiaoQualidade.varrerAba` (`Features/GuardiaoQualidade.js:78`)
- **Elegibilidade (§12.6):** ELEGÍVEL — (A) cruza Comodo: origem no menu de C01, destino em C05; (B) o dialogo dispara efeito de escrita nas abas de auditoria e na coluna AM
- **Estado:** VERDE — checklist §12.6 sem itens pendentes

## Payload
`abrirSeletorMesesGuardiao`: sem payload de entrada — devolve `{status:'NAO_AUDITAVEL'|'DIALOGO_ABERTO', abas}` (`Entrada/SeletorMesesGuardiao.js:337-350`). `executarSelecaoGuardiao(selecionados)`: lista de nomes de abas mensais marcadas → consolidado + painel (`:352-377`).

## require
1. existe ao menos uma aba mensal valida: sem ela o retorno e `NAO_AUDITAVEL` e **nada e auditado** (`Entrada/SeletorMesesGuardiao.js:33-39`).
2. abas auxiliares (`AUDITORIA`/`HISTORICO`/`PIP`) ficam **fora** da lista de alvos (`Entrada/SeletorMesesGuardiao.js:334-337`; `Features/GuardiaoQualidade.js:80`).
3. o motor `varrerAba` esta disponivel (`Entrada/SeletorMesesGuardiao.js:209-212`).

## ensure
1. **cancelar nao produz efeito** e selecao vazia nao audita (`Entrada/SeletorMesesGuardiao.js:29,359-365`).
2. a selecao do operador e resolvida contra as abas realmente existentes (`resolverSelecaoDialogo`), e nomes invalidos ficam explicitos (`:362`).
3. o resultado apresentado ao operador e o mesmo consolidado que originou os efeitos (o alvo da UI e o alvo da escrita — `:369-376`).

## invariant
1. esta Porta nao executa auditoria por conta propria: delega ao motor canonico de C05.
2. nenhum efeito ocorre antes da confirmacao do operador.

## Checklist de produção (§12.6)

| Item | Estado | Resposta (fato medido) |
|---|---|---|
| idempotente | aplicavel | abrir o dialogo nao produz efeito; cancelar e selecao vazia nao auditam (`Entrada/SeletorMesesGuardiao.js:29,359-365`) — a repeticao do gesto nao acumula estado. |
| deduplicacao | aplicavel | a lista de alvos e resolvida contra as abas existentes e nomes invalidos sao explicitados, nao duplicados (`Entrada/SeletorMesesGuardiao.js:362`). |
| rate_limit | nao_aplicavel | gesto humano no menu; nao ha volume externo. |
| paginacao | nao_aplicavel | a selecao e uma lista de abas mensais (no maximo 12) apresentada em dialogo (`Entrada/SeletorMesesGuardiao.js:345-347`). |
| validacao_entrada | aplicavel | abas auxiliares nao entram na selecao (`Entrada/Menu.js`/`SeletorMesesGuardiao.js:334-337`); `AUDITORIA`/`HISTORICO` sao recusadas como alvo (`Features/GuardiaoQualidade.js:80`); sem aba valida ⇒ `NAO_AUDITAVEL`. |
| operacao_atomica | aplicavel | **Referencia:** o efeito pertence as Portas C05/MOD-C05-01/P02 e P03, que declaram a contratacao de cada passo; esta Porta nao adiciona efeito proprio. |
| race_condition | aplicavel | **Referencia:** o risco concorrente esta declarado e **ja e pendente** nas Portas P02 (abas de auditoria) e P03 (coluna AM). Esta Porta nao cria risco adicional: e o mesmo efeito, com outro gatilho. |
| cache | nao_aplicavel | sem leitura cara repetida. |
| retry_pelo_cliente | aplicavel | o cliente e o operador: refazer a selecao e a forma contratada de repetir, e cancelar e neutro (`Entrada/SeletorMesesGuardiao.js:29`). |

## Erros
`NAO_AUDITAVEL` (`Entrada/SeletorMesesGuardiao.js:338`) · `SEM_SELECAO` (`:360`) · `CANCELADO`/`SELECAO_INVALIDA` na variante headless (`Features/GuardiaoHeadless.js:69,72`).

## Efeitos
Nenhum efeito proprio; dispara os efeitos das Portas C05/MOD-C05-01/P02 e P03.

## Seguranca
Roda como o usuario da planilha; nao recebe dado externo.

## Observabilidade
Dialogo e alerta com o resumo da auditoria (`Entrada/SeletorMesesGuardiao.js:158-163,370-375`).

## Implementacao
`Entrada/Menu.js:39-45` · `Entrada/SeletorMesesGuardiao.js:320-377` · `Features/GuardiaoQualidade.js:688-700`.

## Testes
`Testes/TestSeletorMesesGuardiao.js` · `Testes/TestMenuP3.js`.

## Evidencia
Leitura direta do codigo nesta sessao (13/09/2026): `Entrada/Menu.js:39-45`; `Entrada/SeletorMesesGuardiao.js:208,224,329,337,352,360,369`.

## Estado
Contrato declarado. Checklist §12.6 completo (0 pendentes) — os itens que dependem do efeito sao **referenciados** nas Portas P02 e P03, onde o efeito realmente acontece. Antes deste card a Porta existia como linha **`Menu -> Guardiao`** na capsula de C05.


> **Reconciliação D-164-04 (13-14/09/2026):** esta Porta descrevia o comportamento anterior (`idx=38` + criação de `AM1`). O comportamento vigente é: **validar completamente antes de qualquer escrita**; coluna de alerta resolvida por **cabeçalho canônico**; ausente/ambígua ⇒ **`ERRO_TECNICO`, diagnóstico e nenhuma escrita**. Ver `DIAGNOSTICO_D_164_04.md`, `RELATORIO_164_FIX.md` e `Features/GuardiaoQualidade.js:resolverColunaAlerta`.
