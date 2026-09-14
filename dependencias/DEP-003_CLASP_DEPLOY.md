---
id: DEP-003
nome: "clasp (CLI de deploy)"
tipo: dependencia-de-ferramenta
vinculo: "publicacao do codigo no Apps Script"
estado: ativo
comodos: [C00, C08]
cards: ["#140", "#141", "#142", "#144", "#152", "#153", "#167"]
data_registro: "2026-09-13"
versao: "NAO_COMPROVADA"  <!-- `clasp --version` retornou VAZIO neste ambiente (14/09/2026); registro prematuro do commit 53684b7 corrigido por commit novo, §3.7 -->
fonte: "https://registry.npmjs.org/@google/clasp (dist-tags.latest) + https://github.com/google/clasp/releases"
data_decisao: "2026-09-14"
decisao: "DEC-DEP-003"
vigia: "dependencias/vigia/UPSTREAM_OBSERVADO.json"
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

## Vinculo estrutural (§31.4 / §31.6) - o que esta dependencia cobre

Ligacao de cada dependencia ao **Modulo / Circuito / Porta** cuja funcao ela cobre (§31.2: a dependencia
deixa de ser lista solta e passa a apontar a responsabilidade estrutural que sustenta). `Circuito` e o canvas
do Modulo dono; `AUSENTE_DECLARADO` = alvo que **nao existe** hoje e fica declarado como ausencia, nunca
suprido por inferencia. `Vinculo` e `arquivo:linha`; `SEM_ARQUIVO_46.3` marca Porta declarada apenas na
capsula (nao elegivel ao §12.6), e nesse caso o vinculo cita a linha da capsula. Verificado por
`scripts/downplant/validar-dependencias.mjs`.

| Modulo | Circuito | Porta | Papel da dependencia na Porta | Vinculo (arquivo:linha) |
|---|---|---|---|---|
| MOD-C00-01_ESTRUTURA_DO_COFRE | 02_Comodos/C00_Governanca_Estrutural/01_Dominio/modulos/MOD-C00-01_ESTRUTURA_DO_COFRE/CIR-MOD-C00-01_ESTRUTURA_DO_COFRE.canvas | PORTA-C00-01-P03 | SEM_ARQUIVO_46.3: a fronteira e o `.claspignore`, nao uma travessia de execucao - e o unico mecanismo que impede o cofre de ir para o runtime | 02_Comodos/C00_Governanca_Estrutural/01_Dominio/modulos/MOD-C00-01_ESTRUTURA_DO_COFRE/MOD-C00-01_ESTRUTURA_DO_COFRE.md:33 |
| MOD-C01-01_FORMULARIO_E_MENUS | 02_Comodos/C01_Entrada/01_Dominio/modulos/MOD-C01-01_FORMULARIO_E_MENUS/CIR-MOD-C01-01_FORMULARIO_E_MENUS.canvas | PORTA-C01-01-P05 | execucao remota `clasp run` da prova headless | 02_Comodos/C01_Entrada/01_Dominio/modulos/MOD-C01-01_FORMULARIO_E_MENUS/portas/PORTA-C01-01-P05_ENTRADA_MANUAL_HEADLESS.md:1 |
| MOD-C01-02_NORMALIZADOR_DE_EFETIVO | 02_Comodos/C01_Entrada/01_Dominio/modulos/MOD-C01-02_NORMALIZADOR_DE_EFETIVO/CIR-MOD-C01-02_NORMALIZADOR_DE_EFETIVO.canvas | PORTA-C01-02-P03 | execucao remota do normalizador | 02_Comodos/C01_Entrada/01_Dominio/modulos/MOD-C01-02_NORMALIZADOR_DE_EFETIVO/portas/PORTA-C01-02-P03_NORMALIZADOR_HEADLESS.md:1 |
| MOD-C02-01_LEITURA_E_ADAPTACAO | 02_Comodos/C02_Leitura/01_Dominio/modulos/MOD-C02-01_LEITURA_E_ADAPTACAO/CIR-MOD-C02-01_LEITURA_E_ADAPTACAO.canvas | PORTA-C02-01-P03 | execucao remota da prova binaria | 02_Comodos/C02_Leitura/01_Dominio/modulos/MOD-C02-01_LEITURA_E_ADAPTACAO/portas/PORTA-C02-01-P03_PROVA_HEADLESS.md:1 |
| MOD-C05-01_GUARDIAO_DE_QUALIDADE | 02_Comodos/C05_Guardiao/01_Dominio/modulos/MOD-C05-01_GUARDIAO_DE_QUALIDADE/CIR-MOD-C05-01_GUARDIAO_DE_QUALIDADE.canvas | PORTA-C05-01-P05 | execucao remota do ciclo de auditoria | 02_Comodos/C05_Guardiao/01_Dominio/modulos/MOD-C05-01_GUARDIAO_DE_QUALIDADE/portas/PORTA-C05-01-P05_GUARDIAO_HEADLESS.md:1 |
| MOD-C06-01_RELATORIOS_OFICIAIS | 02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-01_RELATORIOS_OFICIAIS/CIR-MOD-C06-01_RELATORIOS_OFICIAIS.canvas | PORTA-C06-01-P02 | execucao remota do comparativo | 02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-01_RELATORIOS_OFICIAIS/portas/PORTA-C06-01-P02_COMPARATIVO_HEADLESS.md:1 |
| MOD-C06-02_MERITO_DE_ARMAS_GXT | 02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-02_MERITO_DE_ARMAS_GXT/CIR-MOD-C06-02_MERITO_DE_ARMAS_GXT.canvas | PORTA-C06-02-P03 | execucao remota do compilador de armas | 02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-02_MERITO_DE_ARMAS_GXT/portas/PORTA-C06-02-P03_ARMAS_HEADLESS.md:1 |
| MOD-C08-01_HOMOLOGACAO_OFFLINE | 02_Comodos/C08_Homologacao/01_Dominio/modulos/MOD-C08-01_HOMOLOGACAO_OFFLINE/CIR-MOD-C08-01_HOMOLOGACAO_OFFLINE.canvas | PORTA-C08-01-P02 | SEM_ARQUIVO_46.3: agregacao das portas headless (`clasp run` -> portas), declarada no inventario §12.6 | 02_Comodos/C00_Governanca_Estrutural/03_Especificacoes/INVENTARIO_PORTAS_E_CHECKLIST_12_6.md:98 |

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
