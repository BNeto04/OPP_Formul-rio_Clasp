---
id: DEP-001
nome: "Google Apps Script"
tipo: dependencia-externa
vinculo: "runtime de execucao do produto"
estado: ativo
comodos: [C00, C01, C02, C03, C04, C05, C06, C08]
cards: ["#140", "#141", "#142", "#144", "#152", "#150", "#153", "#167"]
data_registro: "2026-09-13"
versao: "V8"
fonte: "https://developers.google.com/apps-script/release-notes (feed oficial: https://developers.google.com/feeds/apps-script-release-notes.xml)"
data_decisao: "2026-09-14"
decisao: "DEC-DEP-001"
vigia: "dependencias/vigia/UPSTREAM_OBSERVADO.json"
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

## Vinculo estrutural (§31.4 / §31.6) - o que esta dependencia cobre

Ligacao de cada dependencia ao **Modulo / Circuito / Porta** cuja funcao ela cobre (§31.2: a dependencia
deixa de ser lista solta e passa a apontar a responsabilidade estrutural que sustenta). `Circuito` e o canvas
do Modulo dono; `AUSENTE_DECLARADO` = alvo que **nao existe** hoje e fica declarado como ausencia, nunca
suprido por inferencia. `Vinculo` e `arquivo:linha`; `SEM_ARQUIVO_46.3` marca Porta declarada apenas na
capsula (nao elegivel ao §12.6), e nesse caso o vinculo cita a linha da capsula. Verificado por
`scripts/downplant/validar-dependencias.mjs`.

| Modulo | Circuito | Porta | Papel da dependencia na Porta | Vinculo (arquivo:linha) |
|---|---|---|---|---|
| MOD-C00-03_INFRAESTRUTURA_CORE | AUSENTE_DECLARADO | PORTA-C00-03-P01 | grava a aba de log/auditoria dentro do runtime | 02_Comodos/C00_Governanca_Estrutural/01_Dominio/modulos/MOD-C00-03_INFRAESTRUTURA_CORE/portas/PORTA-C00-03-P01_LOG_DE_AUDITORIA.md:1 |
| MOD-C01-01_FORMULARIO_E_MENUS | 02_Comodos/C01_Entrada/01_Dominio/modulos/MOD-C01-01_FORMULARIO_E_MENUS/CIR-MOD-C01-01_FORMULARIO_E_MENUS.canvas | PORTA-C01-01-P01 | ponto de entrada do operador no runtime (menu P3) | 02_Comodos/C01_Entrada/01_Dominio/modulos/MOD-C01-01_FORMULARIO_E_MENUS/portas/PORTA-C01-01-P01_MENU_P3.md:1 |
| MOD-C01-01_FORMULARIO_E_MENUS | 02_Comodos/C01_Entrada/01_Dominio/modulos/MOD-C01-01_FORMULARIO_E_MENUS/CIR-MOD-C01-01_FORMULARIO_E_MENUS.canvas | PORTA-C01-01-P05 | chamador externo `clasp run` - o runtime e o alvo remoto | 02_Comodos/C01_Entrada/01_Dominio/modulos/MOD-C01-01_FORMULARIO_E_MENUS/portas/PORTA-C01-01-P05_ENTRADA_MANUAL_HEADLESS.md:1 |
| MOD-C01-02_NORMALIZADOR_DE_EFETIVO | 02_Comodos/C01_Entrada/01_Dominio/modulos/MOD-C01-02_NORMALIZADOR_DE_EFETIVO/CIR-MOD-C01-02_NORMALIZADOR_DE_EFETIVO.canvas | PORTA-C01-02-P03 | prova headless do normalizador | 02_Comodos/C01_Entrada/01_Dominio/modulos/MOD-C01-02_NORMALIZADOR_DE_EFETIVO/portas/PORTA-C01-02-P03_NORMALIZADOR_HEADLESS.md:1 |
| MOD-C02-01_LEITURA_E_ADAPTACAO | 02_Comodos/C02_Leitura/01_Dominio/modulos/MOD-C02-01_LEITURA_E_ADAPTACAO/CIR-MOD-C02-01_LEITURA_E_ADAPTACAO.canvas | PORTA-C02-01-P03 | prova headless binaria das abas | 02_Comodos/C02_Leitura/01_Dominio/modulos/MOD-C02-01_LEITURA_E_ADAPTACAO/portas/PORTA-C02-01-P03_PROVA_HEADLESS.md:1 |
| MOD-C05-01_GUARDIAO_DE_QUALIDADE | 02_Comodos/C05_Guardiao/01_Dominio/modulos/MOD-C05-01_GUARDIAO_DE_QUALIDADE/CIR-MOD-C05-01_GUARDIAO_DE_QUALIDADE.canvas | PORTA-C05-01-P04 | menu do Sheets abre o dialogo do Guardiao no runtime | 02_Comodos/C05_Guardiao/01_Dominio/modulos/MOD-C05-01_GUARDIAO_DE_QUALIDADE/portas/PORTA-C05-01-P04_MENU_PARA_GUARDIAO.md:1 |
| MOD-C05-01_GUARDIAO_DE_QUALIDADE | 02_Comodos/C05_Guardiao/01_Dominio/modulos/MOD-C05-01_GUARDIAO_DE_QUALIDADE/CIR-MOD-C05-01_GUARDIAO_DE_QUALIDADE.canvas | PORTA-C05-01-P05 | prova headless do Guardiao | 02_Comodos/C05_Guardiao/01_Dominio/modulos/MOD-C05-01_GUARDIAO_DE_QUALIDADE/portas/PORTA-C05-01-P05_GUARDIAO_HEADLESS.md:1 |
| MOD-C06-01_RELATORIOS_OFICIAIS | 02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-01_RELATORIOS_OFICIAIS/CIR-MOD-C06-01_RELATORIOS_OFICIAIS.canvas | PORTA-C06-01-P01 | menu do Sheets dispara o comparativo | 02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-01_RELATORIOS_OFICIAIS/portas/PORTA-C06-01-P01_MENU_COMPARATIVO.md:1 |
| MOD-C06-01_RELATORIOS_OFICIAIS | 02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-01_RELATORIOS_OFICIAIS/CIR-MOD-C06-01_RELATORIOS_OFICIAIS.canvas | PORTA-C06-01-P02 | prova headless do comparativo | 02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-01_RELATORIOS_OFICIAIS/portas/PORTA-C06-01-P02_COMPARATIVO_HEADLESS.md:1 |
| MOD-C06-02_MERITO_DE_ARMAS_GXT | 02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-02_MERITO_DE_ARMAS_GXT/CIR-MOD-C06-02_MERITO_DE_ARMAS_GXT.canvas | PORTA-C06-02-P01 | menu `Armas` -> selecao livre | 02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-02_MERITO_DE_ARMAS_GXT/portas/PORTA-C06-02-P01_MENU_SELECAO_LIVRE.md:1 |
| MOD-C06-02_MERITO_DE_ARMAS_GXT | 02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-02_MERITO_DE_ARMAS_GXT/CIR-MOD-C06-02_MERITO_DE_ARMAS_GXT.canvas | PORTA-C06-02-P02 | menu `Armas` -> anual | 02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-02_MERITO_DE_ARMAS_GXT/portas/PORTA-C06-02-P02_MENU_ANUAL.md:1 |
| MOD-C06-02_MERITO_DE_ARMAS_GXT | 02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-02_MERITO_DE_ARMAS_GXT/CIR-MOD-C06-02_MERITO_DE_ARMAS_GXT.canvas | PORTA-C06-02-P03 | prova headless do compilador de armas | 02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-02_MERITO_DE_ARMAS_GXT/portas/PORTA-C06-02-P03_ARMAS_HEADLESS.md:1 |

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
