---
card: "153"
cards_relacionados: ["150"]
comodo: C00_Governanca_Estrutural
modulos: [MOD-C00-01_ESTRUTURA_DO_COFRE, MOD-C00-02_VALIDACAO_ESTRUTURAL]
tipo: evidencia
formato: "46.5 - commit . ambiente . entrada . resultado . limite"
data: "2026-09-13"
---

# EV-C00-001 - Estrutura do cofre e validacao estrutural

> **Formato declarado:** o doc do metodo (`03_Fundacao/ESTRUTURA_DO_COFRE.md`) define os seis slots
> obrigatorios e o lint `scripts/downplant/lint-estrutura.mjs`, mas **nao** traz template de evidencia.
> O recorte **commit . ambiente . entrada . resultado . limite** e o adotado na capsula de referencia
> `MOD-C01-01_FORMULARIO_E_MENUS.md`. Nao existe no repo fonte para um template mais rico - por isso
> este formato e declarado como derivado, nao como normativo.

## Commit
| Hash | Mensagem | Papel neste registro |
|---|---|---|
| `98f5c8d` | `fix(legenda): rotulo DENTRO do quadrado de cor e ARMAS sobre a cor - layout legivel (#152)` | HEAD de referencia no momento do registro |
| `d4f6c0c` | `docs(arca): levantamento das 45 regras + fluxo visual` | inventario ARCA - insumo do comodo Governanca |
| `4dcdab5` | `docs(agentic): RESULT retroativo do trabalho sem Planner - ref #150` | registro retroativo que sustenta o fechamento do #150 |
| `a2a06b2`, `74842d2` | formatacao condicional do tunel + `aplicarFormatacaoTodosMesesHeadless` | trabalho sem card, fechado dentro do #150 |
| (pendente) | `docs(down-plant): #153 ...` | **nao commitado** - proibido neste card |

## Ambiente
| Item | Valor |
|---|---|
| Host | Windows 10; shell git-bash/MSYS |
| Runtime | Node.js `v24.14.0` |
| Comando | `node scripts/downplant/lint-estrutura.mjs` |
| Repo canonico | `syntheon-gs-downplant-offline` (branch `sprint/g01-guardiao-qualidade-live-001`, HEAD `98f5c8d`) |
| Espelho | `Obsidian_Brain/Syntheon` - **divergente** (sem `05_Evidencias`, taxonomia de modulos diferente; tratado no #154) |
| Google Apps Script | **nao aplicavel** - nenhuma alteracao de runtime neste card |
| Google Sheets | **nao aplicavel** - nenhuma leitura/escrita de planilha neste card |

## Entrada
- Arvore documental `02_Comodos/**`: 8 comodos ativos x 6 slots obrigatorios, cada slot com `INDICE.md`.
- Manifesto `03_Fundacao/ESTRUTURA_DO_COFRE.md` (DP-VAULT-1, version 2.1, profile P1, 8 comodos ativos,
  `C07_Efetivo` condicional/pendente).
- Fundacao: `03_Fundacao/CONSTITUICAO.md`, `03_Fundacao/LEXICO.md`.
- Card #150 (ARCA-GOV-001) - fechado por ordem direta do proprietario em 13/09/2026.
- Card #153 (DP-SYNC-DOC-001) - este registro.

## Resultado
| Verificacao | Resultado |
|---|---|
| Lint estrutural | exit 0 - `SUCESSO! A arvore documental esta em estrita conformidade com o Down Plant 2.1.` |
| Regra 1 - manifesto | DP-VAULT-1 / 2.1 / P1 presentes |
| Regra 2 - slots + INDICE por comodo | 8 comodos x 6 slots, todos com `INDICE.md` |
| Regra 2 - nomenclatura | modulos `MOD-C...` e submodulos `SUB-C...` validos |
| Regra 3 - padroes legados (`M` + 2 digitos, `TASK` + `-M`, pasta legada de planta, URI local) | 0 ocorrencias |
| Regra 3 - links markdown | 0 quebrados |
| Regra 3 - wikilinks | 0 quebrados |
| Regra 3 - JSON de Canvas | validos; nos de arquivo com destino existente |

## Limite
- O lint valida **estrutura, nomenclatura, legado, links e JSON de canvas** - **nao** valida conteudo
  semantico (nao verifica se uma capsula descreve o codigo real).
- **Nao verificado aqui:** paridade byte-a-byte repo x espelho (declarada divergente) e o estado remoto
  do Apps Script. A ultima medicao registrada de deploy e **81/81 arquivos byte-iguais ao HEAD** (cards #140/#141/#144).
- O comodo `C07_Efetivo` **nao existe** (condicional "Pendente de Fronteira Comprovada" no manifesto).
- O fechamento do #150 e **por ordem do proprietario**, nao por prova de spec: a especificacao formal do
  comodo Governanca permanece nao escrita neste repo.
