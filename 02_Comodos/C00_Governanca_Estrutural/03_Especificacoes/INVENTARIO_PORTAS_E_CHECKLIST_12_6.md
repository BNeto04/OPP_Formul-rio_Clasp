# INVENTÁRIO DE PORTAS E APLICABILIDADE DO CHECKLIST DE PRODUÇÃO (§12.6)

Card **#164** (`DP24-003`) · Pai **#57** · Método canônico **v2.4**
Branch `sprint/g01-guardiao-qualidade-live-001`

Natureza deste documento: **medição antes** + **registro canônico de elegibilidade**. Nenhum comportamento
de produto foi alterado; nenhum código de runtime foi tocado.

---

## 1. Onde as Portas existem hoje (medido, não suposto)

| Onde | Existe? | Medição |
|---|---|---|
| Cápsulas §46.2, seção `## Portas` | **SIM** | 11 cápsulas + 1 `INDICE.md` de Cômodo com a seção `## Portas` |
| Circuitos `CIR-MOD-*` / `CIR-SUB-*` | **SIM** | nós de texto citam a Porta (ex.: `CIR-MOD-C01-02_NORMALIZADOR_DE_EFETIVO.canvas`, nó `norm-3`) |
| Pastas `portas/` do §40.5 | **SIM, todas VAZIAS** | 15 pastas `portas/` criadas pela migração; **0 arquivos** em todas elas |
| Arquivo de Porta no modelo §46.3 | **NÃO EXISTIA** | nenhum identificador `PORTA-*` no repositório (busca em `.md`/`.canvas`/`.mjs`: 0 ocorrências) |
| Seção `## Checklist de produção (§12.6)` | **NÃO EXISTIA** | única ocorrência de `checklist_producao` no repositório é o próprio método (§12.6) |

Consequência: até este card, **nenhuma Porta do produto possuía descrição formal no modelo §46.3** e
**nenhuma possuía o checklist de produção**. As Portas existiam como **linha de tabela** na cápsula
(`| Porta | Direção | Contrato (resumo) |`) e como nó de circuito.

## 2. Critério de elegibilidade aplicado (§12.6, verbatim)

> "Toda Porta que **cruza Cômodo**, **expõe efeito externo** ou **lida com concorrência** deve declarar,
> como parte do seu `ensure`/`invariant`, o checklist de produção."

Operacionalização declarada (para ser auditável, não interpretável):

| Coluna | `SIM` quando | `NAO` quando |
|---|---|---|
| `cruza_comodo` | origem e destino estão em Cômodos **diferentes**, ou um dos lados é **externo à Planta** (Sheets, ARCA, chamador remoto) | origem e destino são o **mesmo** Cômodo e nenhum lado é externo |
| `efeito_externo` | a execução **grava** em recurso fora do Módulo (aba mensal, aba de auditoria, aba de relatório, log) | a Porta não grava nada |
| `concorrencia` | dois chamadores podem interleavar sobre o **mesmo estado compartilhado** (linhas de planilha) | não há estado compartilhado mutável |

**Leitura declarada (sujeita a contestação do Planner):** travessia **de código** (import de utilitário
puro entre Cômodos, manifesto, regra de lint, fronteira configuracional `.claspignore`) **não** é
contada como travessia **de execução** — nos três casos o efeito de cada item do §12.6 seria
`nao_aplicavel`, e o §40.6 proíbe criar documento vazio para aparentar conformidade. Esses casos ficam
registrados abaixo como `nao_elegivel` com o motivo explícito.

**Elegível = `cruza_comodo = SIM` OU `efeito_externo = SIM` OU `concorrencia = SIM`.**

## 3. Inventário canônico (todas as Portas declaradas hoje)

Colunas: `cruza` / `efeito` / `conc` / `elegivel`. `arquivo_porta` é o arquivo §46.3 criado por este card
(`portas/` do Módulo dono). `-` significa "sem arquivo, por não ser elegível".

<!-- PORTA-REGISTRY-V1 -->
| porta | modulo | direcao | cruza | efeito | conc | elegivel | motivo | arquivo_porta |
|---|---|---|---|---|---|---|---|---|
| C00/MOD-C00-01/P01 | MOD-C00-01_ESTRUTURA_DO_COFRE | manifesto → lint | NAO | NAO | NAO | NAO | Porta declarativa: o contrato e a propria regra do lint (ferramenta de bancada); nao transporta chamada nem efeito em recurso da Planta | - |
| C00/MOD-C00-01/P02 | MOD-C00-01_ESTRUTURA_DO_COFRE | estrutura → todo o cofre | NAO | NAO | NAO | NAO | Porta normativa ("nenhuma acao sem localizacao"): regra, nao chamada | - |
| C00/MOD-C00-01/P03 | MOD-C00-01_ESTRUTURA_DO_COFRE | documentacao → Apps Script (bloqueada) | SIM | NAO | NAO | NAO | Fronteira configuracional (`.claspignore`): o efeito e IMPEDIR. Os 9 itens seriam todos `nao_aplicavel` (§40.6 proibe documento vazio) | - |
| C00/MOD-C00-02/P01 | MOD-C00-02_VALIDACAO_ESTRUTURAL | manifesto → lint (regra 1) | NAO | NAO | NAO | NAO | idem C00/MOD-C00-01/P01: regra de verificacao, sem efeito | - |
| C00/MOD-C00-02/P02 | MOD-C00-02_VALIDACAO_ESTRUTURAL | arvore → lint (regra 2) | NAO | NAO | NAO | NAO | regra de verificacao, sem efeito | - |
| C00/MOD-C00-02/P03 | MOD-C00-02_VALIDACAO_ESTRUTURAL | conteudo → lint (regra 3) | NAO | NAO | NAO | NAO | regra de verificacao, sem efeito | - |
| C00/MOD-C00-03/P01 | MOD-C00-03_INFRAESTRUTURA_CORE | `Core/Logger.js` → `Render/Auditoria` | NAO | SIM | SIM | SIM | grava abas de log/relatorio no Sheets (efeito externo) e pode ser executada em paralelo por duas varreduras | 02_Comodos/C00_Governanca_Estrutural/01_Dominio/modulos/MOD-C00-03_INFRAESTRUTURA_CORE/portas/PORTA-C00-03-P01_LOG_DE_AUDITORIA.md |
| C00/MOD-C00-03/P02 | MOD-C00-03_INFRAESTRUTURA_CORE | `Core/Datas.js` → consumidores | NAO | NAO | NAO | NAO | funcao pura em processo (conversao/formato de data); travessia de codigo, nao de execucao | - |
| C00/MOD-C00-03/P03 | MOD-C00-03_INFRAESTRUTURA_CORE | `Core/Erros.js` → consumidores | NAO | NAO | NAO | NAO | classes de erro em processo; travessia de codigo | - |
| C00/MOD-C00-03/P04 | MOD-C00-03_INFRAESTRUTURA_CORE | `appsscript.json` → runtime | NAO | NAO | NAO | NAO | manifesto declarativo lido pelo runtime, nao chamado | - |
| C01/MOD-C01-01/P01 | MOD-C01-01_FORMULARIO_E_MENUS | menu do Sheets → produto (P3) | SIM | SIM | NAO | SIM | destino em C05/C06/C02 (cruza Comodo) e entrada de operador no runtime (efeito externo) | 02_Comodos/C01_Entrada/01_Dominio/modulos/MOD-C01-01_FORMULARIO_E_MENUS/portas/PORTA-C01-01-P01_MENU_P3.md |
| C01/MOD-C01-01/P02 | MOD-C01-01_FORMULARIO_E_MENUS | formulario → ARCA (metadados de veiculo) | SIM | NAO | NAO | SIM | destino fora da Planta (ARCA) | 02_Comodos/C01_Entrada/01_Dominio/modulos/MOD-C01-01_FORMULARIO_E_MENUS/portas/PORTA-C01-01-P02_FORMULARIO_ARCA.md |
| C01/MOD-C01-01/P03 | MOD-C01-01_FORMULARIO_E_MENUS | formulario → EntradaManual (payload do BO) | NAO | SIM | SIM | SIM | grava linhas na aba mensal (efeito externo) e dois operadores podem gravar na mesma aba (concorrencia) | 02_Comodos/C01_Entrada/01_Dominio/modulos/MOD-C01-01_FORMULARIO_E_MENUS/portas/PORTA-C01-01-P03_ENTRADA_MANUAL_BO.md |
| C01/MOD-C01-01/P04 | MOD-C01-01_FORMULARIO_E_MENUS | formulario → C03 (AIS territorial) | SIM | NAO | NAO | SIM | destino no Comodo C03 | 02_Comodos/C01_Entrada/01_Dominio/modulos/MOD-C01-01_FORMULARIO_E_MENUS/portas/PORTA-C01-01-P04_AIS_TERRITORIAL.md |
| C01/MOD-C01-01/P05 | MOD-C01-01_FORMULARIO_E_MENUS | prova headless → entrada manual (sem gravar) | SIM | NAO | NAO | SIM | chamador fora da Planta (`clasp run`) | 02_Comodos/C01_Entrada/01_Dominio/modulos/MOD-C01-01_FORMULARIO_E_MENUS/portas/PORTA-C01-01-P05_ENTRADA_MANUAL_HEADLESS.md |
| C01/MOD-C01-01/P06 | MOD-C01-01_FORMULARIO_E_MENUS | formulario → EFETIVO (autocomplete) | SIM | NAO | NAO | SIM | origem externa (Sheets) e destino EFETIVO/PECULIO, ambos fora do Modulo; o Comodo "C07 Efetivo" citado no INDICE de C01 nao existe no cofre (divergencia D-164-03) | 02_Comodos/C01_Entrada/01_Dominio/modulos/MOD-C01-01_FORMULARIO_E_MENUS/portas/PORTA-C01-01-P06_EFETIVO_AUTOCOMPLETE.md |
| C01/MOD-C01-02/P01 | MOD-C01-02_NORMALIZADOR_DE_EFETIVO | normalizador → ARCA (metadados de regra) | SIM | NAO | NAO | SIM | destino fora da Planta (ARCA) | 02_Comodos/C01_Entrada/01_Dominio/modulos/MOD-C01-02_NORMALIZADOR_DE_EFETIVO/portas/PORTA-C01-02-P01_NORMALIZADOR_ARCA.md |
| C01/MOD-C01-02/P02 | MOD-C01-02_NORMALIZADOR_DE_EFETIVO | normalizador → aba EFETIVO (escrita) | NAO | SIM | SIM | SIM | reescreve a referencia EFETIVO no Sheets (efeito externo) com apagamento antes da escrita (concorrencia) | 02_Comodos/C01_Entrada/01_Dominio/modulos/MOD-C01-02_NORMALIZADOR_DE_EFETIVO/portas/PORTA-C01-02-P02_ESCRITA_EFETIVO.md |
| C01/MOD-C01-02/P03 | MOD-C01-02_NORMALIZADOR_DE_EFETIVO | prova headless → normalizador | SIM | SIM | SIM | SIM | chamador fora da Planta e mesmo efeito de escrita em EFETIVO | 02_Comodos/C01_Entrada/01_Dominio/modulos/MOD-C01-02_NORMALIZADOR_DE_EFETIVO/portas/PORTA-C01-02-P03_NORMALIZADOR_HEADLESS.md |
| C01/MOD-C01-02/P04 | MOD-C01-02_NORMALIZADOR_DE_EFETIVO | gatilho de menu → normalizador | NAO | NAO | NAO | NAO | gatilho dentro do mesmo Comodo, sem efeito proprio: a entrada e a Porta C01/MOD-C01-01/P01 (menu P3) e o efeito e a Porta C01/MOD-C01-02/P02 | - |
| C02/MOD-C02-01/P01 | MOD-C02-01_LEITURA_E_ADAPTACAO | planilha → leitura (abas mensais/EFETIVO) | SIM | NAO | NAO | SIM | fonte externa a Planta (Google Sheets) | 02_Comodos/C02_Leitura/01_Dominio/modulos/MOD-C02-01_LEITURA_E_ADAPTACAO/portas/PORTA-C02-01-P01_LEITURA_DE_PLANILHA.md |
| C02/MOD-C02-01/P02 | MOD-C02-01_LEITURA_E_ADAPTACAO | leitura → C03/C04 (fatos canonicos) | SIM | NAO | NAO | SIM | destino em C03 e C04 (cruza Comodo) | 02_Comodos/C02_Leitura/01_Dominio/modulos/MOD-C02-01_LEITURA_E_ADAPTACAO/portas/PORTA-C02-01-P02_FATOS_CANONICOS.md |
| C02/MOD-C02-01/P03 | MOD-C02-01_LEITURA_E_ADAPTACAO | prova headless binaria → abas | SIM | NAO | NAO | SIM | chamador fora da Planta (`clasp run`) | 02_Comodos/C02_Leitura/01_Dominio/modulos/MOD-C02-01_LEITURA_E_ADAPTACAO/portas/PORTA-C02-01-P03_PROVA_HEADLESS.md |
| C02/MOD-C02-01/P04 | MOD-C02-01_LEITURA_E_ADAPTACAO | cabecalho → leitura (resolucao de alias) | NAO | NAO | NAO | NAO | resolucao pura em memoria; sem efeito e sem estado compartilhado | - |
| C02/MOD-C02-01/P05 | MOD-C02-01_LEITURA_E_ADAPTACAO | leitura → participacao (acumulo) | NAO | NAO | NAO | NAO | acumulo em memoria dentro da mesma leitura; sem efeito externo | - |
| C04/MOD-C04-01/P01 | MOD-C04-01_MOTOR_ANALITICO | leitura → motor (fatos) | SIM | NAO | NAO | SIM | destino no Comodo C04 | 02_Comodos/C04_Motor/01_Dominio/modulos/MOD-C04-01_MOTOR_ANALITICO/portas/PORTA-C04-01-P01_FATOS_PARA_MOTOR.md |
| C04/MOD-C04-01/P02 | MOD-C04-01_MOTOR_ANALITICO | motor → plugins (ciclo de vida) | NAO | NAO | NAO | NAO | mesmo Comodo, em processo, sem efeito externo | - |
| C04/MOD-C04-01/P03 | MOD-C04-01_MOTOR_ANALITICO | motor → RegistroAnalitico | NAO | NAO | NAO | NAO | consolidacao em memoria | - |
| C04/MOD-C04-01/P04 | MOD-C04-01_MOTOR_ANALITICO | diagnostico → motor | NAO | NAO | NAO | NAO | mesmo Comodo, em processo | - |
| C05/MOD-C05-01/P01 | MOD-C05-01_GUARDIAO_DE_QUALIDADE | guardiao → ARCA (enriquecimento) | SIM | NAO | NAO | SIM | destino fora da Planta (ARCA) | 02_Comodos/C05_Guardiao/01_Dominio/modulos/MOD-C05-01_GUARDIAO_DE_QUALIDADE/portas/PORTA-C05-01-P01_GUARDIAO_ARCA.md |
| C05/MOD-C05-01/P02 | MOD-C05-01_GUARDIAO_DE_QUALIDADE | guardiao → abas de auditoria e historico | NAO | SIM | SIM | SIM | grava `[AUDITORIA] Ocorrencias` (sobrescreve) e `[HISTORICO]` (acumula); duas execucoes auditando a mesma aba disputam as mesmas linhas | 02_Comodos/C05_Guardiao/01_Dominio/modulos/MOD-C05-01_GUARDIAO_DE_QUALIDADE/portas/PORTA-C05-01-P02_ABAS_DE_AUDITORIA.md |
| C05/MOD-C05-01/P03 | MOD-C05-01_GUARDIAO_DE_QUALIDADE | guardiao → coluna de alerta (AM) da aba auditada | NAO | SIM | SIM | SIM | grava a coluna AM preservando A:AL (efeito externo destrutivo se mal executado) | 02_Comodos/C05_Guardiao/01_Dominio/modulos/MOD-C05-01_GUARDIAO_DE_QUALIDADE/portas/PORTA-C05-01-P03_COLUNA_ALERTA_AM.md |
| C05/MOD-C05-01/P04 | MOD-C05-01_GUARDIAO_DE_QUALIDADE | menu do Sheets → guardiao (seletor de meses) | SIM | SIM | NAO | SIM | origem em C01 (menu) e destino em C05; abre dialogo que dispara a auditoria | 02_Comodos/C05_Guardiao/01_Dominio/modulos/MOD-C05-01_GUARDIAO_DE_QUALIDADE/portas/PORTA-C05-01-P04_MENU_PARA_GUARDIAO.md |
| C05/MOD-C05-01/P05 | MOD-C05-01_GUARDIAO_DE_QUALIDADE | prova headless → guardiao | SIM | SIM | SIM | SIM | chamador fora da Planta e mesmo efeito de escrita (auditoria + historico) | 02_Comodos/C05_Guardiao/01_Dominio/modulos/MOD-C05-01_GUARDIAO_DE_QUALIDADE/portas/PORTA-C05-01-P05_GUARDIAO_HEADLESS.md |
| C06/MOD-C06-01/P01 | MOD-C06-01_RELATORIOS_OFICIAIS | menu do Sheets → comparativo 2026 | SIM | SIM | SIM | SIM | origem em C01 e destino em C06; grava a aba `COMPARATIVO_2026` e o log do comparativo | 02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-01_RELATORIOS_OFICIAIS/portas/PORTA-C06-01-P01_MENU_COMPARATIVO.md |
| C06/MOD-C06-01/P02 | MOD-C06-01_RELATORIOS_OFICIAIS | prova headless → comparativo | SIM | SIM | SIM | SIM | chamador fora da Planta e mesmo efeito de escrita | 02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-01_RELATORIOS_OFICIAIS/portas/PORTA-C06-01-P02_COMPARATIVO_HEADLESS.md |
| C06/MOD-C06-01/P03 | MOD-C06-01_RELATORIOS_OFICIAIS | comparativo → fonte (prova binaria) | NAO | NAO | NAO | NAO | verificacao em processo sobre dado ja carregado | - |
| C06/MOD-C06-01/P04 | MOD-C06-01_RELATORIOS_OFICIAIS | renderer → legenda | NAO | NAO | NAO | NAO | padrao visual interno (`Core/LegendaCores.js`) | - |
| C06/MOD-C06-02/P01 | MOD-C06-02_MERITO_DE_ARMAS_GXT | menu Armas → selecao livre | SIM | SIM | SIM | SIM | origem em C01 e destino em C06; gera lista/aba e le as abas mensais | 02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-02_MERITO_DE_ARMAS_GXT/portas/PORTA-C06-02-P01_MENU_SELECAO_LIVRE.md |
| C06/MOD-C06-02/P02 | MOD-C06-02_MERITO_DE_ARMAS_GXT | menu Armas → anual | SIM | SIM | SIM | SIM | idem P01, no modo anual | 02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-02_MERITO_DE_ARMAS_GXT/portas/PORTA-C06-02-P02_MENU_ANUAL.md |
| C06/MOD-C06-02/P03 | MOD-C06-02_MERITO_DE_ARMAS_GXT | prova headless → compilador de armas | SIM | SIM | SIM | SIM | chamador fora da Planta e mesmo efeito de escrita | 02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-02_MERITO_DE_ARMAS_GXT/portas/PORTA-C06-02-P03_ARMAS_HEADLESS.md |
| C06/MOD-C06-02/P04 | MOD-C06-02_MERITO_DE_ARMAS_GXT | compilador → ARCA (regras de armas) | SIM | NAO | NAO | SIM | destino fora da Planta (ARCA); declarada na capsula SEM chamada correspondente no runtime (divergencia D-164-02) | 02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-02_MERITO_DE_ARMAS_GXT/portas/PORTA-C06-02-P04_COMPILADOR_ARCA.md |
| C06/MOD-C06-02/P05 | MOD-C06-02_MERITO_DE_ARMAS_GXT | compilador → legenda | NAO | NAO | NAO | NAO | padrao visual interno (`Core/LegendaCores.js`) | - |
| C08/MOD-C08-01/P01 | MOD-C08-01_HOMOLOGACAO_OFFLINE | CLI → suite de testes | NAO | NAO | NAO | NAO | bancada (Node), fora do runtime da Planta; nao e Porta de produto | - |
| C08/MOD-C08-01/P02 | MOD-C08-01_HOMOLOGACAO_OFFLINE | `clasp run` → portas headless (generica) | SIM | NAO | NAO | NAO | AGREGACAO: cada Porta headless e declarada no Modulo dono (C01-01/P05, C01-02/P03, C02-01/P03, C05-01/P05, C06-01/P02, C06-02/P03); nao e elemento proprio | - |
<!-- /PORTA-REGISTRY-V1 -->

Totais: **45 Portas** declaradas hoje (**sem** as agregações do `INDICE.md` de C01 e do C08, que
repetem Portas já contadas) · **25 elegíveis** (§12.6 obriga) · **20 não elegíveis** (com motivo
explícito acima).

## 4. Fechamento das 17 pendências (medido; decisão do Planner, 14/09/2026)

O card #164 **não fecha 17 pendências em aberto**: cada uma foi **(i)** resolvida por implementação
(trava global de escrita / política de idempotência), **(ii)** resolvida por **existência real** do
artefato, ou **(iii)** declarada `nao_aplicavel` com justificativa medida. O mapa abaixo é o
`item → estado final → evidência`; o validador confere, item a item, que o arquivo da Porta diz
exatamente isto (`Testes/TestValidarChecklistProducaoPortas.js` §5).

| Porta | Item | Estado final | Evidência (implementação e teste) |
|---|---|---|---|
| C00/MOD-C00-03/P01 | race_condition | aplicavel | trava global no gerador do log: `Core/Logger.js:57` adquire a trava antes de `RendererAuditoria.render` (`Render/RendererAuditoria.js:11,14`). Evidência: `Testes/TestSerializacaoEscrita.js` (corrida do item #1 + fail-closed) e `INST-SERIALIZACAO-001` |
| C01/MOD-C01-01/P03 | idempotente | aplicavel | ENTRADA_OPERACIONAL: identidade `DATA/MIKE/BOE` (regra `ARCA-OCORRENCIA-007`) => reentrega e `REPLAY_RECUSADO` com zero escrita (`Entrada/EntradaManual.js:85`). Evidência: `TestSerializacaoEscrita` + `TestEntradaManualFormulario` (14.2/14.3/15.7) |
| C01/MOD-C01-01/P03 | operacao_atomica | pendente | **PENDENTE_DECLARADA com MARCO** — residual declarado: colunas de FÓRMULA intercaladas impedem uma matriz única; foi feito agrupamento em runs contíguos (`Entrada/EntradaManual.js:604`) + trava global. Marco: `INST-SERIALIZACAO-001` §6 |
| C01/MOD-C01-01/P03 | race_condition | aplicavel | trava global adquirida antes de ler a linha livre e gravar (`Entrada/EntradaManual.js:80`); o BO de nenhum operador se perde. Evidência: `TestSerializacaoEscrita` (caso RED->GREEN da corrida do §2.4 do diagnóstico) |
| C01/MOD-C01-02/P02 | race_condition | aplicavel | trava global (`Features/NormalizadorEfetivo.js:27`) + escrita em UMA chamada (`:200`, sem `clearContent`). Evidência: `TestSerializacaoEscrita` (caso EFETIVO) |
| C01/MOD-C01-02/P03 | race_condition | aplicavel | segunda trava do mesmo efeito (`Features/NormalizadorEfetivo.js:484`); menu e headless não se interleavam. Evidência: `TestSerializacaoEscrita` |
| C05/MOD-C05-01/P02 | race_condition | aplicavel | trava global no ciclo de auditoria (`Features/GuardiaoQualidade.js:155`); `[AUDITORIA]` sobrescrita e `[HISTORICO]` append com leitura sob trava (`Render/RendererAuditoriaSaude.js:122,132`). Evidência: `TestSerializacaoEscrita` + `TestGuardiaoHeadlessEfeitoDeclarado` |
| C05/MOD-C05-01/P03 | race_condition | aplicavel | mesma trava; coluna AM derivada da leitura da mesma aba dentro da seção crítica (`Features/GuardiaoQualidade.js:740,741`). Evidência: `TestSerializacaoEscrita` |
| C05/MOD-C05-01/P05 | race_condition | aplicavel | segunda trava do ciclo (`Features/GuardiaoHeadless.js:70` e `:133`); fail-closed devolve `SERIALIZACAO_OCUPADA` em JSON. Evidência: `TestSerializacaoEscrita` |
| C06/MOD-C06-01/P01 | race_condition | aplicavel | trava global na geração do `COMPARATIVO_2026` (`Features/CompiladorProdutividade.js:58`). Evidência: `TestSerializacaoEscrita` |
| C06/MOD-C06-01/P02 | race_condition | aplicavel | segunda trava da mesma aba (`Features/CompiladorProdutividade.js:120`). Evidência: `TestSerializacaoEscrita` |
| C06/MOD-C06-02/P01 | idempotente | aplicavel | efeito APPEND com chave de execução estável (`Compilador_Armas.js:35`) e rejeição de replay (`:367-375`). Evidência: `TestSerializacaoEscrita` (caso APPEND/chave estável) |
| C06/MOD-C06-02/P02 | idempotente | aplicavel | idem P01, com o modo ANUAL compondo a chave. Evidência: `TestSerializacaoEscrita` |
| C06/MOD-C06-02/P03 | idempotente | aplicavel | idem P01 na rota headless (`Compilador_Armas.js:491`). Evidência: `TestSerializacaoEscrita` |
| C06/MOD-C06-02/P04 | idempotente | nao_aplicavel | consulta à ARCA **não existe** no runtime (0 ocorrências de `AdaptadorConsultaArca`/`consultarPorRuleId` em `Compilador_Armas.js` e `Motor/PoliticaMeritoArmas.js`): item sem objeto. Promessa retirada da cápsula de C06-02 |
| C06/MOD-C06-02/P04 | deduplicacao | nao_aplicavel | idem: não há consumo a deduplicar (mesma medição) |
| C06/MOD-C06-02/P04 | validacao_entrada | nao_aplicavel | idem: sem implementação não há `rule_id` de entrada a validar (divergência D-164-02 fechada por decisão factual) |

**Placar do fechamento** (medido por `node scripts/downplant/validar-portas.mjs .`, 14/09/2026):
**25/25 Portas elegíveis verdes** · **224 itens PASS** · **1 PENDENTE_DECLARADA** (`operacao_atomica`
de `C01/MOD-C01-01/P03`, com `MARCO:`) · **0 PENDENTE_BLOQUEANTE** · **0 FAIL** · exit 0.

### 4.1 As duas causas-raiz do §6 (uma decisão cada) — e como foram resolvidas

| Causa-raiz | Pendências que resolvia | Resolução nesta fatia |
|---|---|---|
| **Não existia serialização no repositório** (0 `LockService` no produto) | 9 × `race_condition` | **Instalação transversal `INST-SERIALIZACAO-001`** (§8.11): helper único `Core/SerializacaoEscrita.js` (dono/órfão/corrompido/release-só-do-dono, molde `VigiaPonte/LockManager.js:28-106`), fail-closed, reentrância e release garantido, aplicado nos entrypoints mutantes (menu + headless) e coberto por `Testes/TestSerializacaoEscrita.js` |
| **Não existia política de idempotência** para artefatos que se acumulam | 5 × `idempotente` | Política mínima verificável, item a item: ENTRADA_OPERACIONAL com identidade de operação (`DATA/MIKE/BOE`) e REPLAY recusado; APPEND (Armas) com chave de execução estável e rejeição de replay; os 3 itens de C06-02/P04 decididos por NÃO_APLICÁVEL medido |
| **(sem causa-raiz comum)** Porta declarada e não implementada em C06-02 | 3 itens da P04 | Promessa **retirada da cápsula** + itens declarados `nao_aplicavel` com a medição (proibido implementar só para satisfazer documentação) |


## 5. Como este inventário é verificado

`scripts/downplant/validar-portas.mjs` lê a tabela acima entre os marcadores `PORTA-REGISTRY-V1` e:

1. exige que **toda** `porta` com `elegivel = SIM` tenha `arquivo_porta` existente e **completo** (§46.3
   + os 9 itens do §12.6, com `pendente` justificado e `nao_aplicavel` com motivo);
2. exige que **toda** `porta` com `elegivel = NAO` tenha `arquivo_porta = -` e um motivo não vazio
   (nenhuma Porta elegível fica sem checklist; nenhuma Porta não elegível ganha checklist ornamental);
3. exige que **nenhum** arquivo `PORTA-*.md` do repositório exista fora do inventário (Porta ornamental
   = falha);
4. exige que toda Instalação transversal referenciada (`INST-*`) **exista** no cofre.
