---
id: DEP-004
nome: "Abas e bases canonicas (EFETIVO, catalogo PIP, base territorial AIS)"
tipo: dependencia-de-dados
vinculo: "bases de dominio consultadas pela entrada, pela ARCA e pelo Guardiao"
estado: ativo
comodos: [C01, C03, C05]
cards: ["#140", "#141", "#144", "#146", "#147", "#149", "#152"]
data_registro: "2026-09-13"
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
