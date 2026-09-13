# MOD-C00-02_VALIDACAO_ESTRUTURAL

- **ID:** MOD-C00-02
- **Endereco Down Plant:** `C00_Governanca_Estrutural / MOD-C00-02_VALIDACAO_ESTRUTURAL` (escala: modulo) . circuito `CIR-MOD-C00-02_VALIDACAO_ESTRUTURAL.canvas`
- **Estado (§19):** Codigo 🟢 (`scripts/downplant/lint-estrutura.mjs`) . Teste 🟢 (o lint **e** o teste) . Contrato 🟢 . Integracao 🟡 . Visual - . Publicacao - . Documentacao 🟢 *(esta capsula; evidencia EVD-C00-001)*
- **Perfil:** P1 (operacao recorrente; sem dados sensiveis)
- **Responsavel:** Proprietario (Manoel) - execucao por agentes sob card

## Responsabilidade
Prover a **validacao estrutural automatizada e deterministica** do cofre: verificar manifesto, slots,
nomenclatura, padroes legados, links e JSON de Canvas. E o portao que impede a arvore documental de degradar
em silencio.

## Limites
- **Nao** valida semantica: nao verifica se uma capsula descreve o codigo real; nao compara codigo x documentacao.
- **Nao** valida o espelho Obsidian nem a paridade com o remoto Apps Script.
- **Nao** corrige nada: apenas reporta e sai com codigo de erro.

## Entradas
A arvore `02_Comodos/**`, `03_Fundacao/**` e os diretorios documentais raiz, alem do proprio manifesto.

## Saidas
Relatorio no console e **codigo de saida** (`0` = sucesso; `1` + `FALHA! N erro(s)`) - apto a virar gate de CI.

## Portas
| Porta | Direcao | Contrato (resumo) |
|---|---|---|
| Manifesto -> lint (regra 1) | leitura | exige `DP-VAULT-1`, `version: "2.1"`, `profile: "P1"` no frontmatter |
| Arvore -> lint (regra 2) | leitura | 8 comodos esperados; 6 slots por comodo; `INDICE.md` em cada slot; prefixos `MOD-C`/`SUB-C` |
| Conteudo -> lint (regra 3) | leitura | padroes legados, links markdown, wikilinks e JSON de Canvas |

## Conexoes
`C00 -> MOD-C00-01` (valida o que o irmao declara) . `C00 -> C08` (a bancada roda a suite; o lint roda a estrutura).

## Invariantes
1. **Determinismo:** mesma arvore -> mesmo resultado; sem rede, sem relogio, sem aleatoriedade.
2. **Somente leitura:** o lint **nunca** escreve na arvore.
3. **Falha ruidosa:** qualquer desvio gera `ERRO` e codigo de saida `1` - nao ha aviso silencioso.

## Regras (dominio x heuristica)
| Regra | Onde rege | Artefato |
|---|---|---|
| Manifesto obrigatorio com 3 chaves | lint regra 1 | `scripts/downplant/lint-estrutura.mjs` |
| Slots + `INDICE.md` por comodo | lint regra 2 | idem |
| Nomenclatura `MOD-C`/`SUB-C` | lint regra 2 | idem |
| Ausencia de padroes legados | lint regra 3 | idem |

## Tecnologia existente avaliada (§31.4)
Node.js + `fs`/`path` nativos (ESM) . **nenhuma** dependencia npm adicionada.

## Artefatos
`scripts/downplant/lint-estrutura.mjs` (186 linhas) . submodulo `SUB-C00-02-01_LINT`.

## Dependencias (§31.6)
| Dependencia | Vinculo | Versao/estado |
|---|---|---|
| Runtime Node.js | execucao do lint (fora do produto) | binario disponivel no host; **versao nao pinada no repo** |
| Arvore documental | objeto validado | versionada no Git |
| [DEP-003](../../../../../dependencias/DEP-003_CLASP_DEPLOY.md) | fronteira de publicacao | `scripts/**` esta no `.claspignore` - o lint **nao** vai ao Apps Script |

## Erros
Erros de manifesto . comodo esperado ausente . slot ausente . `INDICE.md` ausente . ID de modulo/submodulo
invalido . padrao legado encontrado . link markdown quebrado . wikilink quebrado . JSON invalido . no de
arquivo de Canvas com destino inexistente.

## Observabilidade
Saida textual no console + codigo de saida. **Limite declarado:** as 3 regras **nao** tem numero por regra no
relatorio - o relatorio lista erro a erro com prefixo `ERRO`.

## Testes (fechaduras)
O proprio lint. Medicao do #153: **exit 0**, `SUCESSO! A arvore documental esta em estrita conformidade com o
Down Plant 2.1.`

## Evidencias
- [EVD-C00-001](../../../05_Evidencias/EVD-C00-001_ESTRUTURA_E_VALIDACAO.md) - resultado do lint e os limites do que ele cobre.
- Card: **#153** (DP-SYNC-DOC-001). Nao ha commit associado a este modulo no ciclo recente (o script e de 14/08).

## Divergencias conhecidas
- **O lint nao cobre 5 dos 7 diretorios raiz documentais de forma semantica:** ele varre `00_Painel`, `01_Planta`,
  `02_Comodos`, `03_Fundacao`, `06_Inventario`, `07_Codigo_Leitura` e `08_Execucao_Ao_Vivo` **por conteudo**, mas
  `dependencias/` (criado no #153) **nao esta na lista de varredura** - decisao declarada, nao esquecimento.
- `SUB-C00-02-01_LINT` continua como **stub de 3 linhas** - fora do escopo do #153 (que cobriu modulos).
- O espelho Obsidian **nao** roda este lint; a divergencia repo x espelho fica no **#154**.

## Critérios de verde
Lint exit 0 sobre o repo canonico . nenhum erro das 3 regras . rodada reproduzivel sem rede.
