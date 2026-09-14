---
id: DEP-004
nome: "Abas e bases canonicas (EFETIVO, catalogo PIP, base territorial AIS)"
tipo: dependencia-de-dados
vinculo: "bases de dominio consultadas pela entrada, pela ARCA e pelo Guardiao"
estado: ativo
comodos: [C01, C03, C05]
cards: ["#140", "#141", "#144", "#146", "#147", "#149", "#152", "#167"]
data_registro: "2026-09-13"
versao: "1.0.0 (AIS)"
fonte: "Dominio/tabela_territorial_ais.json (versao + fontesOficiais declaradas) + abas vivas EFETIVO/PIP na planilha"
data_decisao: "2026-09-14"
decisao: "DEC-DEP-004"
vigia: "dependencias/vigia/UPSTREAM_OBSERVADO.json"
---

# DEP-004 - Abas e bases canonicas (EFETIVO . catalogo PIP . base territorial AIS)

> **Formato declarado como derivado:** o doc do metodo neste repo (`03_Fundacao/ESTRUTURA_DO_COFRE.md`) define os seis slots
> de comodo, os modulos/submodulos e o lint, mas **nao** contem o texto da secao §31.6 nem um template de dependencia.
> O recorte usado aqui (vinculo . evidencia no repo . versao/estado . falha . limite) foi derivado da secao
> `Dependencias (§31.6)` da capsula `MOD-C01-01_FORMULARIO_E_MENUS.md`. **Nao e normativo** - se o Planner escrever
> o template oficial, estes registros devem ser reescritos nele.

## Vinculo
Tres bases de dados governam o dominio e sao **consultadas, nunca copiadas**: `EFETIVO` (pessoas e antiguidade),
o **catalogo PIP** (pontuacao por indicador) e a **base territorial AIS** (cidade/bairro -> Area Integrada).

## Vinculo estrutural (§31.4 / §31.6) - o que esta dependencia cobre

Ligacao de cada dependencia ao **Modulo / Circuito / Porta** cuja funcao ela cobre (§31.2: a dependencia
deixa de ser lista solta e passa a apontar a responsabilidade estrutural que sustenta). `Circuito` e o canvas
do Modulo dono; `AUSENTE_DECLARADO` = alvo que **nao existe** hoje e fica declarado como ausencia, nunca
suprido por inferencia. `Vinculo` e `arquivo:linha`; `SEM_ARQUIVO_46.3` marca Porta declarada apenas na
capsula (nao elegivel ao §12.6), e nesse caso o vinculo cita a linha da capsula. Verificado por
`scripts/downplant/validar-dependencias.mjs`.

| Modulo | Circuito | Porta | Papel da dependencia na Porta | Vinculo (arquivo:linha) |
|---|---|---|---|---|
| MOD-C01-01_FORMULARIO_E_MENUS | 02_Comodos/C01_Entrada/01_Dominio/modulos/MOD-C01-01_FORMULARIO_E_MENUS/CIR-MOD-C01-01_FORMULARIO_E_MENUS.canvas | PORTA-C01-01-P04 | resolve cidade/bairro -> AIS pela base territorial | 02_Comodos/C01_Entrada/01_Dominio/modulos/MOD-C01-01_FORMULARIO_E_MENUS/portas/PORTA-C01-01-P04_AIS_TERRITORIAL.md:1 |
| MOD-C01-01_FORMULARIO_E_MENUS | 02_Comodos/C01_Entrada/01_Dominio/modulos/MOD-C01-01_FORMULARIO_E_MENUS/CIR-MOD-C01-01_FORMULARIO_E_MENUS.canvas | PORTA-C01-01-P06 | autocomplete consulta `EFETIVO`/PECULIO | 02_Comodos/C01_Entrada/01_Dominio/modulos/MOD-C01-01_FORMULARIO_E_MENUS/portas/PORTA-C01-01-P06_EFETIVO_AUTOCOMPLETE.md:1 |
| MOD-C01-02_NORMALIZADOR_DE_EFETIVO | 02_Comodos/C01_Entrada/01_Dominio/modulos/MOD-C01-02_NORMALIZADOR_DE_EFETIVO/CIR-MOD-C01-02_NORMALIZADOR_DE_EFETIVO.canvas | PORTA-C01-02-P02 | releitura e reescrita da referencia `EFETIVO` | 02_Comodos/C01_Entrada/01_Dominio/modulos/MOD-C01-02_NORMALIZADOR_DE_EFETIVO/portas/PORTA-C01-02-P02_ESCRITA_EFETIVO.md:1 |
| MOD-C02-01_LEITURA_E_ADAPTACAO | 02_Comodos/C02_Leitura/01_Dominio/modulos/MOD-C02-01_LEITURA_E_ADAPTACAO/CIR-MOD-C02-01_LEITURA_E_ADAPTACAO.canvas | PORTA-C02-01-P01 | le `EFETIVO` e a fonte de antiguidade (PECULIO) | 02_Comodos/C02_Leitura/01_Dominio/modulos/MOD-C02-01_LEITURA_E_ADAPTACAO/portas/PORTA-C02-01-P01_LEITURA_DE_PLANILHA.md:1 |
| MOD-C04-01_MOTOR_ANALITICO | 02_Comodos/C04_Motor/01_Dominio/modulos/MOD-C04-01_MOTOR_ANALITICO/CIR-MOD-C04-01_MOTOR_ANALITICO.canvas | PORTA-C04-01-P01 | recebe fatos enriquecidos com antiguidade do PECULIO | 02_Comodos/C04_Motor/01_Dominio/modulos/MOD-C04-01_MOTOR_ANALITICO/portas/PORTA-C04-01-P01_FATOS_PARA_MOTOR.md:1 |
| MOD-C05-01_GUARDIAO_DE_QUALIDADE | 02_Comodos/C05_Guardiao/01_Dominio/modulos/MOD-C05-01_GUARDIAO_DE_QUALIDADE/CIR-MOD-C05-01_GUARDIAO_DE_QUALIDADE.canvas | PORTA-C05-01-P01 | consome catalogo PIP e base AIS via ARCA (enriquecimento) | 02_Comodos/C05_Guardiao/01_Dominio/modulos/MOD-C05-01_GUARDIAO_DE_QUALIDADE/portas/PORTA-C05-01-P01_GUARDIAO_ARCA.md:1 |
| MOD-C06-02_MERITO_DE_ARMAS_GXT | 02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-02_MERITO_DE_ARMAS_GXT/CIR-MOD-C06-02_MERITO_DE_ARMAS_GXT.canvas | PORTA-C06-02-P01 | selecao livre depende de `EFETIVO`/antiguidade (PECULIO) | 02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-02_MERITO_DE_ARMAS_GXT/portas/PORTA-C06-02-P01_MENU_SELECAO_LIVRE.md:1 |

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
| Base | Evidencia | Detalhe |
|---|---|---|
| **EFETIVO** | `Core/Constantes.js` -> `ABA_EFETIVO: "EFETIVO"`; `Core/Config.js` -> `ABAS.EFETIVO_ALIASES`; `Core/Policiais.js` (`carregarPoliciais`) | e a **chave** do tunel: `PELOTAO`/`GRAD`/`MATRICULA` sao `VLOOKUP(POLICIAL; EFETIVO!$A$1:$W$293; 6/4/5)` (#142). `POLICIAL` gravado e **nome de guerra**; a matricula e a ponte |
| **Catalogo PIP** | `Features/GuardiaoQualidade.js` -> `localizarAbaCatalogoPIP()` | exige `TABELA` **+** `PIP` no nome (`TABELA DE PONTOS PIP`, `TABELA PIP`, `TABELA DE INDICADORES`); o alias solto `PIP` apontava para `PIP_SELECAO_LIVRE` e lia a **aba errada** (fix G01 #117). Ausencia -> `MODO_LIMITADO_CATALOGO_PIP` / `CATALOGO_PIP_INDISPONIVEL` |
| **Base territorial AIS** | `Dominio/tabela_territorial_ais.json` (versao `1.0.0`, publicacao `2026-09-04`), `Dominio/TabelaTerritorialAIS.js`, `Dominio/ResolverAIS.js`, `Dominio/MANUAL_ATUALIZACAO_TERRITORIAL_AIS.md` | fontes oficiais declaradas no JSON: Portaria SDS 1197 de 11/06/2010, Lei Estadual 14.320/2011 (Anexo Unico, alt. 14.890/2012), Portaria SDS 129/2008, Decreto Estadual 26.868/2004. Regra ARCA: **ARCA-TERRITORIO-001** (promovida a MAPEADO no #149) |
| **Peculio (antiguidade `N`)** | `Core/Config.js` -> `PECULIO_ID` / `obterIdPeculio()`; `Leitura/LeitorAntiguidadePeculio.js`; `Core/CoberturaAuditoria.js` | fonte de antiguidade; ausente -> merito por armas **nao avaliado**. Divergencia de regra corrigida no #145/#146: desempate por **matricula mais antiga**, nao por menor `N` (`ARCA-ANTIGUIDADE-002`) |

## Versao / estado
| Item | Valor | Fonte |
|---|---|---|
| Base AIS | `1.0.0`, publicada em `2026-09-04` | `tabela_territorial_ais.json` |
| EFETIVO | aba viva (sem versao); ~293 linhas no range de `VLOOKUP` do #142 | `MAPA_DO_TUNEL_E_FORMULAS.md` |
| Catalogo PIP | aba viva com **linhas de titulo antes do cabecalho** (por isso o fix de `localizarLinhaCabecalho`) | #117 / `Features/GuardiaoQualidade.js` |
| Estado | ativos | consultados com sucesso nos #140, #141, #144, #149 |

## Falha / efeito
Nenhuma das tres bases e bloqueante por si: a entrada e **fail-open** (avisa, nao impede) e a auditoria e
**fail-closed** (nao passa sem). Sem base suficiente, o campo fica **pendente de conferencia** e **nunca** e chutado
(ex.: alerta `CONFERIR AIS`, `AIS_AUSENTE`/`AIS_DIVERGENTE`).

## Limite
- As tres bases **vivem na planilha**; o repo guarda apenas o **codigo que as consulta** e, no caso da AIS, uma
  **copia versionada** (`Dominio/tabela_territorial_ais.json`) - sobre a qual nao ha prova de que espelhe o estado
  atual da planilha.
- `ANABOLIZANTES` **nao tem coluna de destino** na aba mensal: extraido no OCR e declarado **nao suportado** (#144).
- Casos **ambiguos/multi-AIS** permanecem **pendentes de conferencia** por decisao explicita (`MULTI_AIS_BAIRRO_EXATO`
  e o unico criterio de determinacao registrado).
- A base AIS cobre a **Regiao Metropolitana do Recife** conforme as portarias citadas; **bairros fora dessa cobertura
  nao foram avaliados** neste card.
- **Nao verificado neste registro:** o estado remoto do projeto Apps Script, o conteudo atual das planilhas e a
  paridade byte-a-byte repo x espelho Obsidian. A ultima medicao de deploy registrada nos cards e **81/81 arquivos
  byte-iguais ao HEAD** (#140/#141/#144) e a ultima contagem de publicacao citada em log interno e de **68 arquivos
  canonicos** (`ponte2_chatgpt_gravity/server/send_audit_fix_result.js`) - **os dois numeros nao foram reconciliados**
  neste card e ficam declarados como divergencia.
