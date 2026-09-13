# MOD-C00-01_ESTRUTURA_DO_COFRE

- **ID:** MOD-C00-01
- **Endereco Down Plant:** `C00_Governanca_Estrutural / MOD-C00-01_ESTRUTURA_DO_COFRE` (escala: modulo) . circuito `CIR-MOD-C00-01_ESTRUTURA_DO_COFRE.canvas`
- **Estado (§19):** Codigo - (nao ha codigo de produto) . Teste 🟡 (via lint do modulo irmao) . Contrato 🟢 . Integracao 🟡 . Visual - . Publicacao - . Documentacao 🟢 *(esta capsula; evidencia EV-C00-001)*
- **Perfil:** P1 (operacao recorrente; sem dados sensiveis)
- **Responsavel:** Proprietario (Manoel) - execucao por agentes sob card

## Responsabilidade
Fixar e manter a **estrutura canonica** do cofre Down Plant: o manifesto (`DP-VAULT-1`, versao 2.1, perfil P1),
os seis slots obrigatorios de cada comodo, o padrao de nomes (`CXX`, `MOD-CXX-NN`, `SUB-CXX-NN-NN`) e as regras
de fundacao. Nao executa regra de negocio: **governa onde cada coisa mora**.

## Limites
- **Nao** valida conteudo: quem valida e o modulo irmao `MOD-C00-02_VALIDACAO_ESTRUTURAL`.
- **Nao** cria comodo por conveniencia: `C07_Efetivo` esta declarado **condicional** ("Pendente de Fronteira
  Comprovada") e **nao existe** no repo.
- **Nao** substitui a Planta: a Constituicao e explicita - "O codigo e a implementacao, a Planta e o mapa".

## Entradas
Documentacao da metodologia (`ESTRUTURA_DO_COFRE.md`, `CONSTITUICAO.md`, `LEXICO.md`) . decisoes do Planner
nos cards . acervo existente (`02_Comodos/**`).

## Saidas
Arvore documental conforme (8 comodos x 6 slots) . manifesto vigente . este registro de dependencias
(`dependencias/`, §31.6).

## Portas
| Porta | Direcao | Contrato (resumo) |
|---|---|---|
| Manifesto -> lint | declarativa | o lint le `ESTRUTURA_DO_COFRE.md` e exige `DP-VAULT-1`, `2.1`, `P1` |
| Estrutura -> todo o repo | normativa | todo artefato tem localizacao canonica ("nenhuma acao sem localizacao") |
| Documentacao -> Apps Script | **bloqueada** | `02_Comodos/**` esta no `.claspignore` - o cofre **nao** vai para o runtime |

## Conexoes
`C00 -> todos os comodos` (a estrutura os contem) . `C00 -> C08` (a bancada de testes roda sobre o repo) .
`C00 -> dependencias/` (as dependencias declaradas no §31.6 nasceram aqui no #153).

## Invariantes
1. **Todo comodo tem os seis slots com `INDICE.md`** - sem excecao.
2. **Todo modulo/submodulo tem `NOTA_DE_RESPONSABILIDADE.md`** e, quando maduro, capsula §46.2.
3. **O manifesto e a fonte unica** da estrutura: mudar a arvore sem mudar o manifesto e divergencia.
4. **O cofre nao e o produto**: documentacao nao e publicada no Apps Script (`.claspignore`).

## Regras (dominio x heuristica)
| Regra | Onde rege | Artefato |
|---|---|---|
| Sete diretorios raiz canonicos | manifesto | `03_Fundacao/ESTRUTURA_DO_COFRE.md` |
| Seis slots por comodo | manifesto + lint | idem / `scripts/downplant/lint-estrutura.mjs` |
| Nomenclatura de modulo/submodulo | manifesto + lint | idem |
| "Nenhuma acao sem localizacao" | Constituicao | `03_Fundacao/CONSTITUICAO.md` |

## Tecnologia existente avaliada (§31.4)
Markdown + JSON de Canvas como suporte documental . Node.js apenas para o lint do modulo irmao .
**nenhuma** ferramenta nova introduzida por este modulo.

## Artefatos
`03_Fundacao/ESTRUTURA_DO_COFRE.md` . `03_Fundacao/CONSTITUICAO.md` . `03_Fundacao/LEXICO.md` .
`02_Comodos/C00..C08/**` (a arvore) . `dependencias/**` (registro §31.6, criado no #153).

## Dependencias (§31.6)
| Dependencia | Vinculo | Versao/estado |
|---|---|---|
| Nenhuma dependencia externa de runtime | - | este modulo nao roda no produto |
| Ferramenta de escrita/teste documental | `scripts/downplant/lint-estrutura.mjs` (Node.js) | ver [DEP-003](../../../../../dependencias/DEP-003_CLASP_DEPLOY.md) para a fronteira de publicacao |

## Erros
Slot ausente ou sem `INDICE.md` . nome de modulo fora do padrao `MOD-C...` . padrao legado no texto .
link markdown/wikilink quebrado . JSON de Canvas invalido - **todos** detectados pelo lint do `MOD-C00-02`.

## Observabilidade
Saida do lint (`SUCESSO` / `FALHA! N erro(s)`), versionada pelo repo; sem telemetria propria.

## Testes (fechaduras)
`scripts/downplant/lint-estrutura.mjs` (executado no #153: exit 0, "estrita conformidade com o Down Plant 2.1").

## Evidencias
- [EV-C00-001](../../../05_Evidencias/EV-C00-001_ESTRUTURA_E_VALIDACAO.md) - estrutura, lint e fechamento do comunicado #150.
- Cards: **#153** (DP-SYNC-DOC-001, este trabalho), **#150** (ARCA-GOV-001, fechado por ordem do proprietario em 13/09/2026).
- Branch canonico no momento do registro: `sprint/g01-guardiao-qualidade-live-001`, HEAD `98f5c8d`.

## Divergencias conhecidas
- `SUB-C00-01-01_MIGRACAO_DP21` e `SUB-C00-01-02_PLANTA_MESTRA` continuam como **stub de 3 linhas** - fora do
  escopo do #153 (que cobriu **modulos**), declarados aqui como pendencia.
- O espelho Obsidian (`Obsidian_Brain/Syntheon`) esta **divergente** do repo canonico: nao possui `05_Evidencias` e
  usa outra taxonomia de modulos (ex.: `MOD-C00-01_INFRAESTRUTURA_CORE`). Tratado no **#154**.
- O diretorio `dependencias/` **nao** estava no manifesto antes do #153 e foi acrescentado a ele no mesmo card - a
  adicao esta declarada no relatorio de diferencas.

## Critérios de verde
Manifesto vigente . lint exit 0 . 8 comodos x 6 slots com `INDICE.md` . nenhuma divergencia repo x manifesto .
capsula e evidencia presentes.
