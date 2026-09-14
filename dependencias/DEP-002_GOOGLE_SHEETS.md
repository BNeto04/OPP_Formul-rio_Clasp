---
id: DEP-002
nome: "Google Sheets (planilha operacional)"
tipo: dependencia-externa
vinculo: "fonte e destino operacional do produto"
estado: ativo
comodos: [C00, C01, C02, C03, C04, C05, C06]
cards: ["#140", "#142", "#143", "#144", "#152", "#167"]
data_registro: "2026-09-13"
versao: "NAO_PINADA"
fonte: "planilha viva (abas mensais/EFETIVO) + Google Workspace Updates (https://workspaceupdates.googleblog.com/)"
data_decisao: "2026-09-14"
decisao: "DEC-DEP-002"
vigia: "dependencias/vigia/UPSTREAM_OBSERVADO.json"
---

# DEP-002 - Google Sheets (planilha operacional)

> **Formato declarado como derivado:** o doc do metodo neste repo (`03_Fundacao/ESTRUTURA_DO_COFRE.md`) define os seis slots
> de comodo, os modulos/submodulos e o lint, mas **nao** contem o texto da secao §31.6 nem um template de dependencia.
> O recorte usado aqui (vinculo . evidencia no repo . versao/estado . falha . limite) foi derivado da secao
> `Dependencias (§31.6)` da capsula `MOD-C01-01_FORMULARIO_E_MENUS.md`. **Nao e normativo** - se o Planner escrever
> o template oficial, estes registros devem ser reescritos nele.

## Vinculo
A planilha e **fonte e destino**: as abas mensais guardam o fato (tunel `DATA | MIKE | BOE`), o `EFETIVO` guarda
as pessoas, e os relatorios (comparativo, armas, drogas, CPM, PIP) sao **escritos de volta** na propria planilha.

## Vinculo estrutural (§31.4 / §31.6) - o que esta dependencia cobre

Ligacao de cada dependencia ao **Modulo / Circuito / Porta** cuja funcao ela cobre (§31.2: a dependencia
deixa de ser lista solta e passa a apontar a responsabilidade estrutural que sustenta). `Circuito` e o canvas
do Modulo dono; `AUSENTE_DECLARADO` = alvo que **nao existe** hoje e fica declarado como ausencia, nunca
suprido por inferencia. `Vinculo` e `arquivo:linha`; `SEM_ARQUIVO_46.3` marca Porta declarada apenas na
capsula (nao elegivel ao §12.6), e nesse caso o vinculo cita a linha da capsula. Verificado por
`scripts/downplant/validar-dependencias.mjs`.

| Modulo | Circuito | Porta | Papel da dependencia na Porta | Vinculo (arquivo:linha) |
|---|---|---|---|---|
| MOD-C00-03_INFRAESTRUTURA_CORE | AUSENTE_DECLARADO | PORTA-C00-03-P01 | grava a aba de log/auditoria na propria planilha | 02_Comodos/C00_Governanca_Estrutural/01_Dominio/modulos/MOD-C00-03_INFRAESTRUTURA_CORE/portas/PORTA-C00-03-P01_LOG_DE_AUDITORIA.md:1 |
| MOD-C01-01_FORMULARIO_E_MENUS | 02_Comodos/C01_Entrada/01_Dominio/modulos/MOD-C01-01_FORMULARIO_E_MENUS/CIR-MOD-C01-01_FORMULARIO_E_MENUS.canvas | PORTA-C01-01-P03 | grava a linha do BO na aba mensal (fonte e destino) | 02_Comodos/C01_Entrada/01_Dominio/modulos/MOD-C01-01_FORMULARIO_E_MENUS/portas/PORTA-C01-01-P03_ENTRADA_MANUAL_BO.md:1 |
| MOD-C01-02_NORMALIZADOR_DE_EFETIVO | 02_Comodos/C01_Entrada/01_Dominio/modulos/MOD-C01-02_NORMALIZADOR_DE_EFETIVO/CIR-MOD-C01-02_NORMALIZADOR_DE_EFETIVO.canvas | PORTA-C01-02-P02 | reescreve a referencia `EFETIVO` no Sheets | 02_Comodos/C01_Entrada/01_Dominio/modulos/MOD-C01-02_NORMALIZADOR_DE_EFETIVO/portas/PORTA-C01-02-P02_ESCRITA_EFETIVO.md:1 |
| MOD-C02-01_LEITURA_E_ADAPTACAO | 02_Comodos/C02_Leitura/01_Dominio/modulos/MOD-C02-01_LEITURA_E_ADAPTACAO/CIR-MOD-C02-01_LEITURA_E_ADAPTACAO.canvas | PORTA-C02-01-P01 | le abas mensais e `EFETIVO` (fonte do fato) | 02_Comodos/C02_Leitura/01_Dominio/modulos/MOD-C02-01_LEITURA_E_ADAPTACAO/portas/PORTA-C02-01-P01_LEITURA_DE_PLANILHA.md:1 |
| MOD-C05-01_GUARDIAO_DE_QUALIDADE | 02_Comodos/C05_Guardiao/01_Dominio/modulos/MOD-C05-01_GUARDIAO_DE_QUALIDADE/CIR-MOD-C05-01_GUARDIAO_DE_QUALIDADE.canvas | PORTA-C05-01-P02 | grava `[AUDITORIA]`/`[HISTORICO]` na planilha | 02_Comodos/C05_Guardiao/01_Dominio/modulos/MOD-C05-01_GUARDIAO_DE_QUALIDADE/portas/PORTA-C05-01-P02_ABAS_DE_AUDITORIA.md:1 |
| MOD-C05-01_GUARDIAO_DE_QUALIDADE | 02_Comodos/C05_Guardiao/01_Dominio/modulos/MOD-C05-01_GUARDIAO_DE_QUALIDADE/CIR-MOD-C05-01_GUARDIAO_DE_QUALIDADE.canvas | PORTA-C05-01-P03 | grava a coluna `AM` da aba auditada | 02_Comodos/C05_Guardiao/01_Dominio/modulos/MOD-C05-01_GUARDIAO_DE_QUALIDADE/portas/PORTA-C05-01-P03_COLUNA_ALERTA_AM.md:1 |
| MOD-C06-01_RELATORIOS_OFICIAIS | 02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-01_RELATORIOS_OFICIAIS/CIR-MOD-C06-01_RELATORIOS_OFICIAIS.canvas | PORTA-C06-01-P01 | escreve a aba `COMPARATIVO_2026` | 02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-01_RELATORIOS_OFICIAIS/portas/PORTA-C06-01-P01_MENU_COMPARATIVO.md:1 |
| MOD-C06-01_RELATORIOS_OFICIAIS | 02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-01_RELATORIOS_OFICIAIS/CIR-MOD-C06-01_RELATORIOS_OFICIAIS.canvas | PORTA-C06-01-P02 | mesma escrita da aba `COMPARATIVO_2026`, por rota headless | 02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-01_RELATORIOS_OFICIAIS/portas/PORTA-C06-01-P02_COMPARATIVO_HEADLESS.md:1 |
| MOD-C06-02_MERITO_DE_ARMAS_GXT | 02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-02_MERITO_DE_ARMAS_GXT/CIR-MOD-C06-02_MERITO_DE_ARMAS_GXT.canvas | PORTA-C06-02-P01 | escreve o relatorio de armas em aba | 02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-02_MERITO_DE_ARMAS_GXT/portas/PORTA-C06-02-P01_MENU_SELECAO_LIVRE.md:1 |
| MOD-C06-02_MERITO_DE_ARMAS_GXT | 02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-02_MERITO_DE_ARMAS_GXT/CIR-MOD-C06-02_MERITO_DE_ARMAS_GXT.canvas | PORTA-C06-02-P03 | mesma escrita por rota headless | 02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-02_MERITO_DE_ARMAS_GXT/portas/PORTA-C06-02-P03_ARMAS_HEADLESS.md:1 |

## Vigia (§7.8 / §46.14)
- **Fonte observada upstream:** campo `fonte` do cabecalho deste registro - e o que o Vigia le fora do projeto
  (release notes / changelog / advisory).
- **Mecanismo:** `scripts/downplant/vigia-dependencias.mjs` - le este registro, **compara** com a observacao
  upstream registrada em `dependencias/vigia/UPSTREAM_OBSERVADO.json` e **reporta** no formato da secao
  `46.14 Relatorio do Vigia de dependencias` do metodo (`SINCRONIZADO | DEFASADO | NENHUMA AÇÃO`).
- **Limite contratual (§7.8):** o Vigia **observa, compara e reporta**; **nao decide**, **nao troca** a
  dependencia e **nao aplica** a atualizacao. Recusa `--aplicar`, `--atualizar`, `--fix` e `--auto` com
  codigo de saida != 0; sem `--out` explicito **nao escreve em arquivo nenhum**.
- **Ultimo relatorio:** `dependencias/vigia/RELATORIO_VIGIA_2026-09-14.md`.

## Evidencia no repo
| Evidencia | Onde |
|---|---|
| IDs das planilhas | `Core/Config.js` -> `CONFIG_SYNTHEON.PLANILHAS` (`OCORRENCIAS_ID`, `PECULIO_ID`) com acessores `obterIdOcorrencias()` / `obterIdPeculio()` |
| Driver de Sheets | `Drivers/GoogleSheetsDriver.js`; homologacao em `Homologacao/Drivers/HomologationSheetsDriver.js` |
| Abas mensais canonicas | `Core/Config.js` -> `ABAS.MESES_2026` (**JAN2026..DEZ2026**) |
| Leitura de formula | `Leitura/Adaptador2026.js` + `Core/LeitorPlanilhas.js` (o #142 leu com `valueRenderOption=FORMULA` **e** `FORMATTED_VALUE`) |
| Abas de auditoria | `[AUDITORIA] Ocorrencias`, `[HISTORICO] Auditoria Ocorrencias`, `[AUDITORIA] Efetivo` |
| Alerta visual | coluna **AM** (39) das abas mensais preservando **A:AL** |
| Producao real | `SET2026` linha 28 - BO `202609042215125692` gravado com `AIS 4`, `CIDADE=RECIFE`, `BAIRRO=SANCHO`, `DETIDOS=TCO` (#140) |

## Versao / estado
| Item | Valor | Fonte |
|---|---|---|
| Formato | 9 abas mensais ativas (JAN..SET2026) no momento dos cards | #142/#144 |
| Gama de formulas | 8 colunas de FORMULA e 3 DERIVADA-EXTERNA (37 colunas no total) | `MAPA_DO_TUNEL_E_FORMULAS.md` (#142) |
| Estado | ativo | leituras e gravacoes reais registradas nos cards |

## Falha / efeito
A planilha e **fonte unica do fato**. Dado sujo na origem contamina o produto: o proprio metodo do #152 separa
"erro de origem" de "erro do compilador" exatamente por isso. O `.claspignore` mantem `02_Comodos/**` fora do push
justamente porque a planilha nao e reconstruivel a partir do repo.

## Limite
- O **conteudo** da planilha nao esta no repositorio: a prova de producao (#140, `SET2026` linha 28) e
  **declaracao do card**, nao artefato versionado.
- Os **ranges de formula inconsistentes** (risco R1 do #142: maconha ate `$S$2012`, cocaina ate `$Z$2014`,
  ficcao so ate `$AI$1209`) continuam **nao corrigidos** e sem causa historica achada.
- **3 celulas** com ocorrencias divididas em MIKEs diferentes permanecem como **decisao de dominio pendente**
  do proprietario (#150) - nao foram unificadas.
- **Nao verificado neste registro:** o estado remoto do projeto Apps Script, o conteudo atual das planilhas e a
  paridade byte-a-byte repo x espelho Obsidian. A ultima medicao de deploy registrada nos cards e **81/81 arquivos
  byte-iguais ao HEAD** (#140/#141/#144) e a ultima contagem de publicacao citada em log interno e de **68 arquivos
  canonicos** (`ponte2_chatgpt_gravity/server/send_audit_fix_result.js`) - **os dois numeros nao foram reconciliados**
  neste card e ficam declarados como divergencia.
