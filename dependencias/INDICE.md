# dependencias - Registro de dependencias (§31.6)

Registro das dependencias **externas** e **de dados** das quais o produto depende, no recorte da secao
`Dependencias (§31.6)` da capsula `MOD-C01-01_FORMULARIO_E_MENUS.md`.

> **Formato declarado como derivado.** O doc do metodo neste repo (`03_Fundacao/ESTRUTURA_DO_COFRE.md`) descreve os
> seis slots de comodo, os modulos/submodulos e o lint `scripts/downplant/lint-estrutura.mjs` - **nao** contem o texto
> da §31.6 nem um template de dependencia. O recorte usado aqui (**vinculo . evidencia no repo . versao/estado . falha .
> limite**) foi derivado da capsula de referencia acima. **Nao e normativo.**
> Regra aplicada: **nenhuma dependencia entra aqui sem evidencia citavel no repositorio**; ausencia de dado e declarada
> como ausencia, nunca preenchida por plausibilidade.

## Registros
| ID | Dependencia | Vinculo | Versao | Fonte observada (§7.8) | Decisao (§46.4) | Estado |
|---|---|---|---|---|---|---|
| [DEP-001](DEP-001_GOOGLE_APPS_SCRIPT.md) | Google Apps Script | runtime de execucao do produto | `V8` | release notes oficiais | [DEC-DEP-001](decisoes/DEC-DEP-001_RUNTIME_GOOGLE_APPS_SCRIPT.md) | ativo |
| [DEP-002](DEP-002_GOOGLE_SHEETS.md) | Google Sheets (planilha operacional) | fonte e destino operacional | `NAO_PINADA` | planilha viva + Workspace Updates | [DEC-DEP-002](decisoes/DEC-DEP-002_PLANILHA_OPERACIONAL.md) | ativo |
| [DEP-003](DEP-003_CLASP_DEPLOY.md) | clasp (CLI de deploy) | publicacao do codigo no Apps Script | `AUSENTE_DECLARADO` | registry npm + releases do GitHub | [DEC-DEP-003](decisoes/DEC-DEP-003_CLASP_PUBLICACAO.md) | ativo |
| [DEP-004](DEP-004_ABAS_E_BASES_CANONICAS.md) | EFETIVO . catalogo PIP . base territorial AIS . peculio | bases de dominio consultadas | `1.0.0 (AIS)` | `Dominio/tabela_territorial_ais.json` + abas vivas | [DEC-DEP-004](decisoes/DEC-DEP-004_BASES_CANONICAS.md) | ativo |

Cada registro completou o **vinculo §31.6** exigido pelo metodo (`nome`, `versao`, `fonte`, `data_decisao`,
`decisao`) e a secao `Vinculo estrutural (§31.4 / §31.6)`, que liga a dependencia ao **Modulo / Circuito /
Porta** cuja funcao ela cobre - 37 vinculos declarados, todos verificaveis por `arquivo:linha`.
O que ja existia desde o **#153** (vinculo . evidencia . versao/estado . falha . limite) foi **preservado**;
o #167 **acrescentou** os campos e a secao de vinculo estrutural (integrar, nao recriar).

## Decisoes associadas (§46.4)
`decisoes/DEC-DEP-001` · `decisoes/DEC-DEP-002` · `decisoes/DEC-DEP-003` · `decisoes/DEC-DEP-004` -
uma por registro, no formato da secao `46.4 Decisao` do metodo. Sem decisao associada o registro **nao**
passa no validador (`scripts/downplant/validar-dependencias.mjs`), que operacionaliza o achado do §40.8
("dependencia vinculada sem registro de decisao").

## Vigia de dependencias (§7.8 / §46.14)
- Mecanismo: `scripts/downplant/vigia-dependencias.mjs` - **observa, compara e reporta**; **nao decide** e
  **nao aplica** atualizacao (recusa `--aplicar`, `--atualizar`, `--fix`, `--auto`).
- Insumo de observacao: `vigia/UPSTREAM_OBSERVADO.json` (mantido por quem observa - humano/agente sob card).
- Ultimo relatorio: `vigia/RELATORIO_VIGIA_2026-09-14.md` (formato §46.14; estado `DEFASADO` - ver `DEP-003`).
- Como opera: `vigia/LEIAME_VIGIA.md`.
- Fechadura: `Testes/TestVigiaDependencias.js` (28 PASS / 0 FAIL - prova o vinculo, o formato, a NAO-mutacao
  por sha256 e a recusa de flags de mutacao).

## Divergencias declaradas (nao resolvidas neste card)
- **Contagem de arquivos publicados:** `81/81 byte-iguais ao HEAD` (cards #140/#141/#144) x `68 arquivos canonicos`
  (`ponte2_chatgpt_gravity/server/send_audit_fix_result.js`). Medicoes de momentos/metodos diferentes, **nao reconciliadas**.
- **Fuso horario:** `America/Sao_Paulo` em `appsscript.json` x `America/Recife` em `Core/Config.js`. Visivel no repo,
  **nao avaliado** quanto a efeito real.
- **Paridade repo x espelho Obsidian:** o espelho `Obsidian_Brain/Syntheon` esta **divergente** (nao possui
  `05_Evidencias` e usa taxonomia de modulos diferente) - tratado no card **#154**, fora do escopo do #153.

## Fora de escopo
Este diretorio registra dependencias **declaradas e citaveis**. Nao sustenta:
versao de `clasp`, credenciais, quotas do Apps Script, nem o conteudo vivo das planilhas - todos **declarados como
ausentes** no repositorio.
