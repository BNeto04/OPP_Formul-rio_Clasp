# INST-EXEC-001 — Endpoint de Execução Headless (Web App)

- **Identificador:** `INST-EXEC-001`
- **Documento:** classificação de instalação transversal + decisão (card **#155** / `DP-INST-EXEC-001`, pai **#57**)
- **Estado:** **RETIRADO — remoção proposta, NÃO instalado** (código preservado; mutação não executada)
- **Versão:** 1.0
- **Âncora:** `C00_Governanca_Estrutural` (Cômodo técnico), conforme §8.10 do método (âncora no Terreno ou em Cômodo técnico declarado)
- **Endereço Canônico Down Plant:** `Terreno SYNTHÉON GS -> C00_Governanca_Estrutural -> 03_Especificacoes -> INSTALACOES_TRANSVERSAIS -> INST-EXEC-001`
- **Artefato:** `Entrada/WebAppExecucao.js` (119 linhas · SHA-256 `14dc8b86ecf5d492be2b6ebbbf4bbaaa7da8bb540efc3b6cdd0b8b0621377fd2`)
- **Teste:** `Testes/TestWebAppExecucao.js` (11 PASS / 0 FAIL, medido em 13/09/2026)
- **Responsável técnico:** Proprietário (Manoel) — execução por agentes sob card
- **Data desta versão:** 13/09/2026 · Branch `sprint/g01-guardiao-qualidade-live-001` · HEAD `98f5c8d`

> **Declaração de derivação do formato (obrigatória).** Não existia, neste repositório, nenhum lugar
> canônico para instalação transversal: nenhum identificador `INST-*`, nenhuma pasta `instalacoes/`.
> O formato deste documento foi **derivado do que já existe no repositório + do método**, nunca inventado:
> 1. estrutura de seções de `03_Fundacao/ESTRUTURA_DO_COFRE.md` (§46.7 do método: Estado/Versão/Âncora/Responsável
>    + Contrato e Portas / Consumidores / Dados / Falhas / Observabilidade / Implementação / Testes / Migração);
> 2. campo-tipo `CURRENT_STATUS` com ciclo de vida (`DISCOVERED..RETIRED`) e `PORT`/`EVIDENCE`/`DECISION`
>    já usados em `06_Inventario/EXTERNAL_CAPABILITY_REGISTRY.md` (o precedente real de registro de capacidade
>    com porta e estado no projeto);
> 3. cabeçalho de rastreabilidade dos espelhos AS-IS (`07_Codigo_Leitura/**`: caminho real, commit, SHA-256,
>    endereço canônico) — §8.11 do método.
> O local (`02_Comodos/C00_Governanca_Estrutural/03_Especificacoes/INSTALACOES_TRANSVERSAIS/`) foi **criado**
> por não existir; a árvore do repositório ficou válida no lint — **exit 0** na abertura e **exit 0** no
> fechamento (3 execuções consecutivas de `node scripts/downplant/lint-estrutura.mjs`). Houve **falha
> transitória** no meio da execução, causada por **outro card** (#153) escrevendo em paralelo; nenhuma
> falha apontou para os artefatos do #155 e ela se resolveu quando o #153 corrigiu o próprio caminho.
> Ver a nota de concorrência no `RELATORIO_DE_DIFERENCIAS_155.md`.

---

## 1. Natureza do artefato (por que é candidato a instalação transversal)

`Entrada/WebAppExecucao.js` não pertence a nenhum Módulo funcional: é uma **porta de transporte
HTTPS que atravessa Cômodos**. Ela executa, por token e por lista branca, funções de propriedade de
C01 (`Entrada/EntradaManual.js`) sem que nenhum dos Cômodos seja seu dono. Isso é exatamente a
definição de **instalação transversal** do método (§8.10): capacidade técnica que atravessa Cômodos
sem se tornar artificialmente propriedade de cada um — transporte, segurança, tratamento de erros.
Por natureza, portanto, **classifica-se como instalação transversal**; o que se decide abaixo é o
**estado operacional** dela.

## 2. Contrato da Porta

| Porta | Direção | Contrato (fato, medido no código) |
|---|---|---|
| `doGet` | cliente → serviço | health check; **não exige token** e não executa nada; devolve `{ ok, servico:'execucao-headless', funcoes, tokenConfigurado }` (`Entrada/WebAppExecucao.js:100-103`) |
| `doPost` | cliente → serviço | execução; corpo JSON (`postData.contents`) **ou** parâmetros de formulário (`token`, `funcao`, `params`); devolve sempre JSON (`Entrada/WebAppExecucao.js:106-108`, `111-119`) |

**Lista branca (exaustiva, 4 funções):** `getEfetivo`, `obterOpcoesValidacao`,
`obterTabelaTerritorialAIS`, `resolverAISTerritorial` (`WebAppExecucao.js:25-30`).
Todas as quatro **existem de fato** em `Entrada/EntradaManual.js` (linhas 611, 533, 663, 685) e são
exportadas no mesmo arquivo (linhas 784-787).

**Códigos de erro contratados:** `NAO_AUTORIZADO` · `FUNCAO_NAO_PERMITIDA` · `FUNCAO_INEXISTENTE` ·
`CORPO_INVALIDO` · `FALHA_EXECUCAO` (`WebAppExecucao.js:73, 82, 86, 91, 95`).

**Dados permitidos:** nome de guerra, posto, matrícula e pelotão (efetivo); opções de validação de
natureza; base territorial AIS; resolução cidade+bairro → AIS.
**Dados proibidos:** token em resposta (nunca ecoado), stack trace, nomes de função privados
(sufixo `_`), qualquer função fora da lista branca.

## 3. Como se instala

Conforme o cabeçalho do próprio artefato (`WebAppExecucao.js:16-22`), a instalação é **manual e
exclusiva do dono do script** (`manoel.b.neto007@gmail.com`), em três passos:
1. Propriedades do script → `TOKEN_EXECUCAO = <segredo combinado com o agente>`;
2. Implantar → Nova implantação → tipo **App da Web**, “Executar como: Eu”, “Quem tem acesso: Qualquer pessoa”;
3. Informar a URL do app da Web ao agente.

**Fato medido:** nenhum dos três passos foi executado. O arquivo é `push`ado ao Apps Script
(não está no `.claspignore`), mas **não há implantação de App da Web** — logo **não existe
endereço/URL do endpoint**. O manifesto habilita apenas `executionApi: MYSELF`
(`appsscript.json`), que é a rota do `clasp run`, não a do App da Web.

## 4. Consumidores reais

Varredura de todo o repositório por `WebAppExecucao`, `TOKEN_EXECUCAO` e `EXECUCAO_LISTA_BRANCA` retorna,
no **código de runtime**, **três arquivos, todos autorreferentes**: o próprio `Entrada/WebAppExecucao.js`,
o seu teste `Testes/TestWebAppExecucao.js` e a linha que registra o teste no runner
(`Testes/RodarTodosOsTestes.js:99`). **Nenhum** módulo, ponte, UI ou camada agêntica chama o endpoint.

> **Referências documentais (registro, não consumo).** Artigos de **outros cards** (executados em
> paralelo a este) passaram a **citar** o artefato como endereço/registro, sem chamá-lo:
> `dependencias/DEP-001_GOOGLE_APPS_SCRIPT.md:30` (“Web app — endpoint HTTP headless…”),
> `MOD-C08-01_HOMOLOGACAO_OFFLINE.md:63` e `EV-C08-001_SUITES_E_PORTAS_HEADLESS.md:29` (listam o
> arquivo entre as “portas headless”). **Citar não é consumir** — e essas listas **confundem o
> endpoint com a rota `clasp run`** (que é a rota headless real). Divergência registrada em
> `RELATORIO_DE_DIFERENCIAS_155.md` (D10).

| Consumidor | Existe? | Evidência |
|---|---|---|
| Módulo/Cômodo de produto (runtime) | **não** | nenhuma referência de código fora dos 3 arquivos acima |
| UI (`Entrada/Formulario.html`) | **não** | a UI já chama `getEfetivo`/`obterOpcoesValidacao` pela ponte oficial `google.script.run` (linhas 957-959, 1266-1268) |
| Ponte 1 / Ponte 2 / VigiaPonte | **não** | zero referências de código |
| Camada agêntica (`agentic/**`) | **não** | zero referências de código |
| Cliente externo / URL | **não** | sem implantação, sem endereço |
| Documentação | **só registro** | citações de endereço (D10), nenhuma cita uma URL do endpoint |

**Consumidores reais (runtime) = 0.** A única menção documental anterior ao card #155 era a citação do
commit `a1de4bf` como “(endpoint/INST)” em `[[MOD-C01-01_FORMULARIO_E_MENUS]]` — que **não** é uso, é registro.

## 5. Segurança (token secreto em Script Properties + lista branca)

Controles implementados (fato, no código):
- token **fora do código-fonte**, em Script Properties `TOKEN_EXECUCAO` (`WebAppExecucao.js:33-41`);
- comparação em **tempo constante** (`tokenConfere_`, linhas 44-53) — mitiga timing attack;
- **fail-closed**: sem token válido nada roda (linha 82);
- **lista branca fechada** + recusa de nomes privados `*_` (linha 85);
- retorno só JSON, sem eco de segredo e sem stack (linhas 93-95, 111-119);
- o teste **prova** esses limites com spies, inclusive que a função não é chamada quando não deve
  (`Testes/TestWebAppExecucao.js:59-84`) e que não há token embutido (linhas 123-126).

Risco de instalar: o passo 2 do SETUP publica um endpoint **acessível por “Qualquer pessoa”**
(“Executar como: Eu”) cuja única barreira é um **segredo compartilhado**. Em termos do §26
(segurança por construção) e do §8.10, expor uma porta pública que executa funções de produto em
nome do dono do script é **aumento de superfície de ataque sem consumidor que o justifique**.

## 6. Fronteira com a rota `clasp run`

| | `clasp run` (executionApi MYSELF) | `INST-EXEC-001` (App da Web) |
|---|---|---|
| Estado hoje | **FUNCIONANDO** | **INERTE** (nunca implantado) |
| Evidência | `clasp run executarGuardiaoHeadless -p '["SET2026"]'` → `status OK`, 12 túneis, 213 linhas, 33 alertas (`agentic/state/RESULT_CORRECAO_145_146_148_CLASP.md:29`) | sem implantação; sem endereço; zero consumidores |
| Como autoriza | escopos + posse da conta + `executionApi MYSELF` (`appsscript.json`) | token em Script Properties |
| Requer sessão local | sim (clasp autenticado) | não (por desenho) |
| Consumido por | **toda a metodologia headless** (p.ex. `executarGuardiaoHeadless`, `abrirCompiladorArmasHeadless`, `verificarParticipacaoArmasHeadless`, `gerarComparativo2026Headless`) | **ninguém** |
| Risco de exposição | nenhum (API privada do dono) | endpoint público autenticado por segredo |

**História factual (medida no Git):**
- `10/09/2026` — `d3d2ec5` habilita `executionApi MYSELF` “para execução headless”;
- `11/09/2026` — `b4931d1` cria a porta headless `executarGuardiaoHeadless`;
- `11/09/2026` — `a1de4bf` cria **este endpoint** porque o `clasp run` recusava a conta com
  `403 The caller does not have permission` (motivo escrito no próprio commit);
- `12–13/09/2026` — **dezenas de portas headless são executadas pela rota `clasp run`**, e a
  correção de domínio é publicada e validada no remoto por `clasp run` — **sem uma única chamada
  ao endpoint**.

A rota `clasp run` cobre, no ambiente real de operação (esta máquina, conta autenticada), a mesma
necessidade que motivou o endpoint. A premissa que justificava o endpoint **não se sustenta mais**.

## 7. Critério objetivo de quando ele passa a ser usado

O gatilho de uso do endpoint, escrito de forma verificável, seria:

> **USAR quando** (a) o `clasp run` voltar a falhar de forma **reproduzível** com
> `403 The caller does not have permission` na conta do dono, medido por comando; **e**
> (b) existir um **consumidor remoto** que não disponha de sessão `clasp` local — por exemplo um
> executor em nuvem — que precise executar funções do produto.

Hoje **nenhuma das duas condições se verifica**: (a) o `clasp run` está funcionando (evidência §6);
(b) não existe consumidor remoto sem sessão local (o executor roda nesta máquina e usa `clasp`).
Enquanto o gatilho não ocorrer, o artefato é **capacidade antecipada** — proibida pelo §14.1
(Proibição de antecipação) e não contratada como fallback pelo §13.2 (um fallback precisa ser
**contratado**, isto é, implantado com gatilho definido — e este nunca foi implantado).

## 8. DECISÃO: RETIRAR (remoção proposta) — e o que sustenta exatamente a escolha

A evidência **sustenta remoção**, e não a manutenção como instalação transversal instalada.
O que sustenta, item por item:

1. **A razão de existir é factualmente refutada.** O único motivo registrado para o arquivo existir é
   a falha do `clasp run` (`WebAppExecucao.js:5-8`; corpo do commit `a1de4bf`). Essa falha **não se
   reproduz**: o `clasp run` executa headless com saída real (`RESULT_CORRECAO_145_146_148_CLASP.md:29`).
2. **Nunca foi instalado, portanto nunca foi porta.** Sem implantação de App da Web não há endereço;
   sem endereço não há porta operacional — há código latente. Em vocabulário do método, não é
   instalação: é candidato retirado (§19.3 Estacionado / `RETIRED` no registro de capacidades).
3. **Consumidores reais = 0** (§4). Função sem consumidor não tem dono nem contrato em uso.
4. **Redundância medida, não suposta.** As 4 funções da lista branca já são alcançáveis por dois
   caminhos vivos: a ponte oficial da UI (`google.script.run` em `Entrada/Formulario.html:957-959, 1266-1268`)
   e a rota headless (`clasp run`).
5. **Superação prática documentada.** Após `a1de4bf`, toda a cadeia headless (12–13/09) passou pelo
   `clasp run`, com **zero** uso do endpoint (§6).
6. **Segurança por construção.** Instalá-lo abriria um endpoint público autenticado só por segredo,
   executando funções de produto em nome do dono — superfície de ataque sem consumidor que a justifique (§5).
7. **Proibição de antecipação (§14.1).** Mantê-lo “para o caso de o `clasp run` quebrar de novo” é
   exatamente construir para uma necessidade futura hipotética. Se o gatilho do §7 ocorrer, a porta
   pode ser **recriada a partir do histórico do Git** (o commit `a1de4bf` está preservado) — mais um
   argumento para não carregar o código latente agora.
8. **Custo vs. retorno.** O que se perderia com a remoção é código sem consumidor; o que se ganha é
   coerência REALIDADE == MAPA (some o artefato órfão que o mapa não sabia onde colocar) e a remoção
   da tentação de implantar uma porta pública.

**Contra-argumento considerado e por que não vence:** “manter como fallback contratado”. Um fallback
só é legítimo quando **implantado e com gatilho** (§13.2). Este não foi implantado em ~2 dias,
inclusive enquanto o `clasp run` ainda falhava — o dono resolveu a rota canônica (`clasp run`), não
implantou o App da Web. Manter o código sem implantação não é fallback; é dívida.

**Consequência sobre as alternativas do card:** o card admitia “registrar como INST transversal (§8.11)
**se continua necessário**”. A evidência mostra que **não é necessário** — logo registra-se a
**decisão documentada de remoção**, que é o outro resultado admitido pelo critério DONE do card
(“endpoint possui endereço/contrato factual **ou** decisão documentada de remoção”).

## 9. Plano de remoção (NÃO executado neste card) e reversão

Por ordem expressa do card (“propor remoção **antes de mutar**”) e da restrição “não alterar código
funcional”, **nada foi removido**. O plano fica registrado para execução sob autorização do Planner/dono:

1. remover `Entrada/WebAppExecucao.js`;
2. remover `Testes/TestWebAppExecucao.js` e a linha `require('./TestWebAppExecucao')` de
   `Testes/RodarTodosOsTestes.js:99`;
3. confirmar remoto: `clasp push -f` seguido de verificação de que o endpoint não existe mais no projeto Apps Script;
4. rodar a suíte integral; o teste guarda `Testes/TestMenuP3.js:190-202` **não** é afetado (o endpoint não é item de menu).

**Reversão:** `git revert <commit-da-remocao>` (ou restaurar de `a1de4bf`). O artefato é integralmente recuperável do histórico.

## 10. Testes e evidências

- `node Testes/TestWebAppExecucao.js` → **11 PASS / 0 FAIL** (13/09/2026).
- `node scripts/downplant/lint-estrutura.mjs` → **exit 0** na abertura **e exit 0** no fechamento (3 execuções
  consecutivas). Falha transitória no meio, por cápsulas de OUTRO card (#153) em escrita concorrente —
  nenhuma apontando para este documento (ver `RELATORIO_DE_DIFERENCIAS_155.md`).
- Commit de origem do artefato: `a1de4bf` (11/09/2026).
- Prova de que a rota canônica funciona: `agentic/state/RESULT_CORRECAO_145_146_148_CLASP.md:29`.

## 11. Quatro pontas (#57)

| Ponta | Estado |
|---|---|
| CÓDIGO | ALINHADO — artefato intacto (`Entrada/WebAppExecucao.js`, SHA-256 `14dc8b86…`); nenhum código funcional alterado |
| DOCUMENTAÇÃO | ALINHADO — este documento + derivação no espelho + `RELATORIO_DE_DIFERENCAS_155.md` |
| CANVAS / PLANTA | **ALTERADO** — nasce o endereço `C00_Governanca_Estrutural/03_Especificacoes/INSTALACOES_TRANSVERSAIS` (antes inexistente: o artefato era órfão no mapa). Sem cômodo novo; nenhum canvas editado |
| GIT | **PENDENTE** — nada commitado (ordem do card: não commitar, não push, não postar) |
