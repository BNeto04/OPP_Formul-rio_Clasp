---
id: DEP-002
nome: "Google Sheets (planilha operacional)"
tipo: dependencia-externa
vinculo: "fonte e destino operacional do produto"
estado: ativo
comodos: [C01, C02, C03, C04, C05, C06]
cards: ["#140", "#142", "#143", "#144", "#152"]
data_registro: "2026-09-13"
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
