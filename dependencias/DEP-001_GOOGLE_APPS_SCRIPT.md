---
id: DEP-001
nome: "Google Apps Script"
tipo: dependencia-externa
vinculo: "runtime de execucao do produto"
estado: ativo
comodos: [C01, C02, C03, C04, C05, C06, C08]
cards: ["#140", "#141", "#142", "#144", "#152", "#150", "#153"]
data_registro: "2026-09-13"
---

# DEP-001 - Google Apps Script (runtime do produto)

> **Formato declarado como derivado:** o doc do metodo neste repo (`03_Fundacao/ESTRUTURA_DO_COFRE.md`) define os seis slots
> de comodo, os modulos/submodulos e o lint, mas **nao** contem o texto da secao §31.6 nem um template de dependencia.
> O recorte usado aqui (vinculo . evidencia no repo . versao/estado . falha . limite) foi derivado da secao
> `Dependencias (§31.6)` da capsula `MOD-C01-01_FORMULARIO_E_MENUS.md`. **Nao e normativo** - se o Planner escrever
> o template oficial, estes registros devem ser reescritos nele.

## Vinculo
O produto **roda dentro do Google Apps Script**: as funcoes de menu, os compiladores, o Guardiao e as portas
headless sao carregadas no runtime do projeto vinculado a planilha. Nao ha servidor proprio.

## Evidencia no repo
| Evidencia | Onde |
|---|---|
| Manifesto do projeto | `appsscript.json` - `"runtimeVersion": "V8"`, `"timeZone": "America/Sao_Paulo"`, `"exceptionLogging": "STACKDRIVER"`, `"executionApi": {"access": "MYSELF"}`, `"dependencies": {}` |
| APIs usadas | `SpreadsheetApp`, `ContentService`, `PropertiesService`, `ScriptApp` - presentes em **45** arquivos `.js` do projeto |
| Servico de UI | `SpreadsheetApp.getUi()` em `Entrada/Menu.js`, `Compilador_Armas.js`, `Homologacao/RodarTesteDeHomologacao.js` |
| Web app | `Entrada/WebAppExecucao.js` (endpoint HTTP headless, token em Script Properties) - commit `a1de4bf` |
| Execucao remota | `clasp run <funcao> -p '<json>'` - retorno obrigatorio como **STRING JSON** (`Entrada/EntradaManualHeadless.js`, `Features/GuardiaoHeadless.js`, `Entrada/WebAppExecucao.js`) |

## Versao / estado
| Item | Valor | Fonte |
|---|---|---|
| Engine | **V8** | `appsscript.json` |
| Bibliotecas externas | **nenhuma** (`"dependencies": {}`) | `appsscript.json` |
| Fuso | `America/Sao_Paulo` no manifesto; `America/Recife` em `Core/Config.js` | ambos no repo - **divergencia declarada, nao resolvida** |
| Estado | ativo | cards #140/#141/#144 registraram deploy remoto bem-sucedido |

## Falha / efeito
Ausencia do runtime derruba **todo** o produto: nao existe caminho alternativo de execucao em producao. As portas
headless existem justamente para rodar sem clique, mas **continuam** dependendo do runtime Apps Script.

## Limite
- Nao existe, no repo, versao **pinada** de engine alem do rotulo `V8` nem controle de versao do runtime.
- A divergencia de fuso (`America/Sao_Paulo` no manifesto x `America/Recife` no config) esta **visivel no repo** e
  **nao foi avaliada** quanto a efeito real - declarada, nao explicada.
- A quota/limite de execucao do Apps Script **nao** esta documentada em lugar nenhum do repo.
- **Nao verificado neste registro:** o estado remoto do projeto Apps Script, o conteudo atual das planilhas e a
  paridade byte-a-byte repo x espelho Obsidian. A ultima medicao de deploy registrada nos cards e **81/81 arquivos
  byte-iguais ao HEAD** (#140/#141/#144) e a ultima contagem de publicacao citada em log interno e de **68 arquivos
  canonicos** (`ponte2_chatgpt_gravity/server/send_audit_fix_result.js`) - **os dois numeros nao foram reconciliados**
  neste card e ficam declarados como divergencia.
