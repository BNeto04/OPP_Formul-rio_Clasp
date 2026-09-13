---
id: DEP-003
nome: "clasp (CLI de deploy)"
tipo: dependencia-de-ferramenta
vinculo: "publicacao do codigo no Apps Script"
estado: ativo
comodos: [C00, C08]
cards: ["#140", "#141", "#142", "#144", "#152", "#153"]
data_registro: "2026-09-13"
---

# DEP-003 - clasp (CLI de deploy / publicacao)

> **Formato declarado como derivado:** o doc do metodo neste repo (`03_Fundacao/ESTRUTURA_DO_COFRE.md`) define os seis slots
> de comodo, os modulos/submodulos e o lint, mas **nao** contem o texto da secao §31.6 nem um template de dependencia.
> O recorte usado aqui (vinculo . evidencia no repo . versao/estado . falha . limite) foi derivado da secao
> `Dependencias (§31.6)` da capsula `MOD-C01-01_FORMULARIO_E_MENUS.md`. **Nao e normativo** - se o Planner escrever
> o template oficial, estes registros devem ser reescritos nele.

## Vinculo
`clasp` e a **unica via de publicacao**: liga o checkout local ao projeto Apps Script e e usado tanto para
`push`/`pull` quanto para `run` (execucao remota das portas headless).

## Evidencia no repo
| Evidencia | Onde |
|---|---|
| Vinculo do projeto | `.clasp.json` - `scriptId`, `rootDir: ""`, extensoes `.js`/`.gs`/`.html`/`.json`, `skipSubdirectories: false` |
| Regras de exclusao | `.claspignore` - exclui `Testes/**`, `Homologacao/**`, `agentic/**`, `scripts/**`, `VigiaPonte/**`, as pontes, `extension*/**`, `02_Comodos/**`, `06_Inventario/**`, `Dominio/ARCA/*.md`, `*.log`, `**/state/**`, `**/logs/**` |
| Medicao de deploy | cards #140, #141 e #144 registram **81/81 arquivos remotos byte-iguais ao HEAD** |
| Execucao remota | `clasp run ... -p '<json>'` (portas headless) - exigencia de retorno STRING JSON |
| Contagem divergente | `ponte2_chatgpt_gravity/server/send_audit_fix_result.js` cita publicacao de **68 arquivos canonicos** |

## Versao / estado
| Item | Valor | Fonte |
|---|---|---|
| Versao do clasp | **nao registrada** no repo | ausencia declarada |
| Autenticacao | **nao documentada** no repo | ausencia declarada |
| Estado | ativo | `push` + verificacao byte-a-byte nos cards |
| Efeito na documentacao | `02_Comodos/**` esta no `.claspignore` -> escrever no cofre **nao** publica nada no Apps Script | #142 |

## Falha / efeito
`clasp push` e o ponto onde **codigo local vira produto**. As regras de bloqueio do card #153 (nao commitar,
nao empurrar, nao postar) protegem exatamente essa fronteira.

## Limite
- **Nao ha versao pinada de clasp** nem registro de credencial no repositorio.
- Os dois numeros de arquivos publicados (**81/81** x **68**) **nao foram reconciliados** neste card: sao medicoes
  de momentos/metodos diferentes e ficam como divergencia declarada.
- Nao existe verificacao automatizada de paridade repo x remoto no repositorio: a medicao 81/81 e **manual/por card**.
- Propriedade util e nao verificada aqui: `02_Comodos/**` no `.claspignore` e o **unico** mecanismo que impede a
  documentacao Down Plant de ir para o Apps Script.
- **Nao verificado neste registro:** o estado remoto do projeto Apps Script, o conteudo atual das planilhas e a
  paridade byte-a-byte repo x espelho Obsidian. A ultima medicao de deploy registrada nos cards e **81/81 arquivos
  byte-iguais ao HEAD** (#140/#141/#144) e a ultima contagem de publicacao citada em log interno e de **68 arquivos
  canonicos** (`ponte2_chatgpt_gravity/server/send_audit_fix_result.js`) - **os dois numeros nao foram reconciliados**
  neste card e ficam declarados como divergencia.
