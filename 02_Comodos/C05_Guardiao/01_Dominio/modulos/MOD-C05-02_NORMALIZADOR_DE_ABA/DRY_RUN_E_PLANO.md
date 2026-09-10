# DRY-RUN E PLANO DETERMINISTICO — MOD-C05-02_NORMALIZADOR_DE_ABA

Card: **#119** (G01-007, Lote B da Sprint #112) | Branch: `sprint/g01-guardiao-qualidade-live-001`
Artefato de codigo: `Core/DryRunNormalizador.js` | Suíte: `Testes/TestDryRunNormalizador.js`

## O que faz
Consome os diagnosticos do MOD-C05-01 + o contrato do #118 (`ContratoMutacaoSegura`) e gera o **plano de
correcao em modo previa**, sem escrever nada na planilha. A execucao real e do card #120.

## O que cada acao do plano carrega
`diagnostic_id` (codigo do diagnostico), regra/fonte (ARCA ou lacuna declarada), aba, linha/coluna e
`range` legivel (`aba!COLUNAlinha`), valor atual, valor proposto, classe (`AUTO_FIX | CONFIRM_FIX | MANUAL_ONLY`),
motivos da classe, exigencias e bloqueios.

## Idempotencia e hash estavel
As acoes sao ordenadas canonicamente (aba, linha, coluna, id) e serializadas com chaves em ordem fixa; o
`plano_id` e um hash determinista desse conteudo. Consequencias verificadas em teste: **duas geracoes sobre
o mesmo estado produzem o mesmo plano**, a **ordem de entrada nao altera** o plano e **alterar um valor
proposto altera o hash**.

## Problemas detectados (com tipo explicito)
`PLANO_VAZIO`, `CONFLITO_DE_ALVO` (mesma celula com valores divergentes — bloqueia as acoes e a execucao),
`AMBIGUIDADE_DE_ALVO` (mesma celula/valor em dois diagnosticos), `ALVO_FORA_DA_WHITELIST`,
`FONTE_INSUFICIENTE` (sem valor canonico e sem resolvedor), `BLOQUEIO_CONTRATO` e `LIMITE_EXCEDIDO`.

## Limite de lote (kill-switch do executor)
`opcoes.maxAcoes` (padrao 200). Se as acoes mutaveis passarem do limite, o plano marca `limites.excedeu_limite`
e a autorizacao recebe `LIMITE_DE_LOTE_EXCEDIDO` — o executor do #120 nao pode iniciar o lote.

## Portao de execucao
`DryRunNormalizador.autorizarExecucao(plano, estado)` combina o portao do contrato #118 (kill-switch, lock,
dry-run executado, snapshot e reauditoria disponiveis) com as travas proprias do plano (limite, conflito).

## Preview para o operador
`plano.preview` entrega linhas legiveis: cabecalho com `plano_id`/contagens, uma linha por acao
(`[CLASSE] aba!celula | tipo | "atual" -> "proposto" | regra`) e os problemas encontrados.

## Limite deste card
Zero escrita comprovada: o modulo nao expoe nenhum metodo de escrita, nao usa APIs de planilha
(`SpreadsheetApp/setValue/setValues/setFormula/appendRow/clearContent` ausentes do fonte) e o teste prova
que os diagnosticos de entrada permanecem intactos apos a geracao do plano.
