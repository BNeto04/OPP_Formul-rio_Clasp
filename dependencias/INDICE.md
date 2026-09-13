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
| ID | Dependencia | Vinculo | Estado |
|---|---|---|---|
| [DEP-001](DEP-001_GOOGLE_APPS_SCRIPT.md) | Google Apps Script | runtime de execucao do produto | ativo |
| [DEP-002](DEP-002_GOOGLE_SHEETS.md) | Google Sheets (planilha operacional) | fonte e destino operacional | ativo |
| [DEP-003](DEP-003_CLASP_DEPLOY.md) | clasp (CLI de deploy) | publicacao do codigo no Apps Script | ativo |
| [DEP-004](DEP-004_ABAS_E_BASES_CANONICAS.md) | EFETIVO . catalogo PIP . base territorial AIS . peculio | bases de dominio consultadas | ativo |

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
