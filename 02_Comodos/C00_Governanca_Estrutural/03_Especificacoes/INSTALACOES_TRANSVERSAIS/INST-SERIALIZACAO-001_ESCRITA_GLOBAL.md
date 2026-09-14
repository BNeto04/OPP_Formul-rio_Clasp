# INST-SERIALIZACAO-001 — Serialização da Escrita Global (trava por execução)

- **Identificador:** `INST-SERIALIZACAO-001`
- **Documento:** instalação transversal + contrato de concorrência (card **#164** / `DP24-003`, pai **#57**; decisão do Planner de 14/09/2026 — "Opção A como piso")
- **Estado:** **INSTALADO** (em código de produto, com fechadura própria)
- **Versão:** 1.0
- **Âncora:** `C00_Governanca_Estrutural` (Cômodo técnico), conforme §8.10 do método
- **Endereço Canônico Down Plant:** `Terreno SYNTHÉON GS -> C00_Governanca_Estrutural -> 03_Especificacoes -> INSTALACOES_TRANSVERSAIS -> INST-SERIALIZACAO-001`
- **Artefato:** `Core/SerializacaoEscrita.js` (helper único; ~230 linhas)
- **Teste:** `Testes/TestSerializacaoEscrita.js` (fechadura: 17 PASS / 0 FAIL na instalação)
- **Diagnóstico de origem:** `DIAGNOSTICO_164_CONCORRENCIA.md` (9 itens de corrida com `arquivo:linha`, reprodução offline determinística, precedente `VigiaPonte/LockManager.js:28-106`, 6 opções A–F, recomendação A+E)
- **Responsável técnico:** Proprietário (Manoel) — execução por agentes sob card
- **Data desta versão:** 14/09/2026 · Branch `sprint/g01-guardiao-qualidade-live-001`

> **Declaração de derivação do formato (obrigatória).** O formato deste documento deriva do
> precedente real do repositório: `INST-EXEC-001_ENDPOINT_DE_EXECUCAO.md` (mesma pasta, mesma
> estrutura de seções: Identificador / Documento / Estado / Versão / Âncora / Endereço Canônico /
> Artefato / Teste / Responsável / Data + seções de natureza, contrato de Porta, consumidores,
> dados, falhas, observabilidade, implementação, testes). Nada foi inventado: as seções obrigatórias
> são as que o próprio cofre já pratica para instalação transversal (§8.11).

---

## 1. Natureza do artefato (por que é candidato a instalação transversal)

A serialização de escrita **não pertence a nenhum Módulo funcional**: ela atravessa C00 (log de
auditoria), C01 (entrada manual e normalizador de efetivo), C05 (Guardião da Qualidade) e C06
(comparativo 2026, produtividade geral e compilador de armas). Sete arquivos de produto em quatro
Cômodos dependem da mesma capacidade — uma **trava global de escrita por execução** — sem que
nenhum deles seja seu dono. Isso é exatamente a definição de instalação transversal do método
(§8.10): capacidade técnica que atravessa Cômodos sem se tornar artificialmente propriedade de cada
um. Pela regra §3 do diagnóstico (reusar > criar), a implementação **segue o precedente interno**
`VigiaPonte/LockManager.js:28-106`, e não um desenho novo.

## 2. Contrato da Porta

| Porta | Direção | Contrato (fato, medido no código) |
|---|---|---|
| `SyntheonSerializacaoEscrita.executarComLock(fluxo, fn)` | entrypoint mutante → trava | adquire a trava global; se **não** obtiver, **`fn` NÃO roda** e sobe erro tipado `SERIALIZACAO_OCUPADA` (`Core/SerializacaoEscrita.js:198-208`) |
| `adquirir(fluxo)` | chamador → estado | devolve `{ok, motivo, dono, orfao, corrompido, provedor}`; nunca "quase" — `{ok:false}` é terminal (`:150-186`) |
| `liberar()` | dono → trava | libera **somente se for o dono** (`sessionId` confere) e apaga o registro; apagar registro de outro dono é recusado (`:189-200`) |
| `estaAtivo()` / `estadoAtual()` | observabilidade | leitura do estado sem adquirir nada (`:213-231`) |

**Meio de trava (declarado, sem terceira via):** `LockService.getScriptLock()` no runtime Apps
Script (fallback `getDocumentLock`), com `tryLock(0)` — **fail-fast, sem espera longa**. No sandbox
Node (execução offline de teste, sem `LockService`) o domínio de exclusão é o **processo**
(`globalThis.__SYNTHEON_ESCRITA_MUTEX__`). **A ausência de meio de trava nunca
autoriza escrever.**

**Dono, órfão e corrompido (molde `LockManager`):** o dono é registrado com `sessionId + fluxo +
instante`; trava nativa livre com registro presente = execução anterior morreu sem liberar =>
**órfão recuperado** (a trava não fica presa); registro ilegível => **corrompido recuperado**; o
`release` é sempre do dono.

## 3. Como se instala

Não há passo manual: a instalação é **de código**, no mesmo projeto Apps Script (o `clasp push`
publica o helper junto com o restante do produto). O helper é um arquivo único
(`Core/SerializacaoEscrita.js`); cada arquivo consumidor faz uma guarda de TOPO que carrega o helper
na bancada Node **sem criar símbolo global novo** (exigência de `Testes/TestSemRedefinicaoGlobal.js`:

```js
if (typeof SyntheonSerializacaoEscrita === 'undefined' && typeof require !== 'undefined') {
  try { global.SyntheonSerializacaoEscrita = require('../Core/SerializacaoEscrita'); } catch (e) { /* fail-closed no uso */ }
}
```

## 4. Consumidores reais (entrypoints mutantes)

| Consumidor | Arquivo:linha da aquisição | Efeito protegido |
|---|---|---|
| Entrada manual (UI) | `Entrada/EntradaManual.js:132` | gravação do BO na aba mensal (o caso de MAIOR severidade: perda de BO) |
| Entrada manual (núcleo/headless-safe) | `Entrada/EntradaManual.js:80` | escolha da linha livre + gravação em blocos contíguos |
| Normalizador de efetivo (executar) | `Features/NormalizadorEfetivo.js:27` | EFETIVO/EFETIVO_LEGADO em uma chamada de API (`:200`) |
| Normalizador (menu / teste / headless) | `Features/NormalizadorEfetivo.js:440`, `:472`, `:484` | mesmos efeitos |
| Guardião (ciclo) | `Features/GuardiaoQualidade.js:155` | coluna AM + `[AUDITORIA]` + `[HISTORICO]` |
| Guardião (menu) | `Features/GuardiaoQualidade.js:787` | idem |
| Guardião headless | `Features/GuardiaoHeadless.js:70`, `:133` | idem, de fora da UI |
| Seletor de meses | `Entrada/SeletorMesesGuardiao.js:219`, `:310`, `:386` | idem |
| Comparativo 2026 (menu / headless) | `Features/CompiladorProdutividade.js:58`, `:120` | `COMPARATIVO_2026` + log |
| Produtividade geral | `Features/CompiladorProdutividade.js:201` | `PRODUTIVIDADE_GERAL` + log |
| Log de auditoria | `Core/Logger.js:57` | abas de log de NOME FIXO (`Render/RendererAuditoria.js:11,14`) |
| Compilador de armas (menu livre / anual / headless) | `Compilador_Armas.js:105`, `:150`, `:491` (e `executarCompilador`, `:225`) | aba versionada + log (`:378-382`) |

**Chamadores de hoje (medidos, não supostos):** menu (UI) e headless (`clasp run`, mesmo projeto de
script). Um trigger instalado pela UI seria um terceiro chamador — e observaria a **mesma** trava,
porque `clasp run` e triggers rodam no mesmo projeto.

## 5. Dados

Permitidos: nome do fluxo, `sessionId`, instante e endereço do artefato — nada operacional.
Proibidos: dado de ocorrência, matrícula, BOE/MIKE, conteúdo de aba; a trava **não** copia dado de
produto para o registro.

## 6. Falhas (comportamento contratado)

| Situação | Comportamento | Efeito no operador |
|---|---|---|
| Trava ocupada | **fail-closed**: `fn` não roda, `SERIALIZACAO_OCUPADA` | mensagem inconfundível ("ESCRITA BLOQUEADA: o sistema já está executando … NADA foi gravado") / JSON `SERIALIZACAO_OCUPADA` na rota headless |
| Reentrância (menu → função interna) | a trava pertence ao **entrypoint externo**; a chamada aninhada roda sem readquirir (contador de profundidade) | nenhum efeito visível |
| Exceção dentro da seção crítica | `release` em `finally`; o Apps Script também libera no fim da execução | a próxima execução adquire normalmente |
| Trava registrada e nativa livre (execução morta) | **órfão recuperado** | nenhum bloqueio permanente |
| Registro de dono ilegível | **corrompido recuperado** (registro é rastro, não a trava) | nenhum bloqueio |
| Mecanismo de trava indisponível (helper não carregado) | erro explícito `SERIALIZACAO_INDISPONIVEL`, **zero escrita** | mensagem clara, nunca "segue pela metade" |

**Riscos residuais declarados (não silenciados):**

1. **Cobertura parcial = falsa segurança.** Qualquer caminho novo de escrita que não adquira a trava
   reabre a corrida. Mitigação: a fechadura `Testes/TestSerializacaoEscrita.js` lê a FONTE dos
   entrypoints registrados e fica vermelha se um deles perder a trava (controle negativo incluído).
2. **`operacao_atomica` de `C01/MOD-C01-01/P03` (BO na aba mensal).** A aba-alvo do proprietário tem
   colunas de FÓRMULA intercaladas (TOTAL DE MACONHA, DIVIDIDO MAC, TOTAL CRACK (GR), TOTAL DE
   COCAINA, DIVIDIDO COC, PONTOS TOTAIS, PONTOS FICCAO, CHAVE OCORRENCIA), que não podem ser
   sobrescritas por `setValues` de valor; logo o bloco **não** pode ser uma matriz única. Nesta
   fatia: agrupamento em runs contíguos (menos chamadas) + trava global ⇒ nenhum outro **escritor**
   interleava. Residual: um **leitor** pode observar a linha parcialmente escrita. É a única
   pendência do card **com aceite formal (`MARCO:` INST-SERIALIZACAO-001 §6, decisão do Planner de
   14/09/2026)** — declarada, não bloqueante.
3. **Granularidade grossa.** A trava serializa execuções que não disputam o mesmo artefato
   (EFETIVO × COMPARATIVO_2026), reduzindo paralelismo com o agente headless. Aceito como piso da
   opção A; `operacao_atomica` por artefato continua sendo o desenho alvo de fatia futura.
4. **Domínio de exclusão na bancada.** Nos testes Node o meio de trava é o processo (não o projeto
   Apps Script); os casos de corrida usam **duas execuções** isoladas (`vm`) sobre um `LockService`
   compartilhado, que é a topologia real, mas a frequência da colisão em produção não é medida por
   este instrumento (limite declarado no diagnóstico, §2).

## 7. Observabilidade

`estadoAtual()` devolve `{ativo, nomeLock, dono, registroPersistido, registroDono}`; o registro de
dono vive em Script Properties (`SYNTHEON_ESCRITA_LOCK`) e é apagado no release. Não há log
silencioso: quando a trava é recusada, a razão e o dono vão na mensagem/JSON.

## 8. Implementação

`Core/SerializacaoEscrita.js` (helper único) + as aquisições nos entrypoints da tabela do §4.
**Nenhum contrato visível mudou quando não há disputa**: mesmos nomes de aba, mesmos payloads,
mesmos retornos.

## 9. Testes (a fechadura)

`Testes/TestSerializacaoEscrita.js` (registrada em `Testes/RodarTodosOsTestes.js`):

1. **estrutural** — os 21 entrypoints mutantes adquirem a trava ANTES da primeira escrita (lê a
   fonte; controle negativo remove a trava de um entrypoint real e exige RED);
2. **corrida do diagnóstico** — duas execuções concorrentes com intercalamento determinístico na
   janela de gravação: a segunda falha ruidosamente, escreve **zero** e o BO da primeira fica íntegro;
3. **fail-closed** — `tryLock` sempre falso ⇒ **0 escritas** e mensagem clara (pega trava decorativa);
4. **reentrância / release** — menu → função interna adquire **uma única vez**; exceção na seção
   crítica não prende a trava; o registro de dono é apagado no release;
5. **idempotência** — reentrega da mesma operação (MIKE/BOE) recusada; chave de execução estável das
   Armas; escrita do EFETIVO em uma chamada, sem `clearContent`;
6. **anti-ornamento** — as 9 Portas com `race_condition` não estão `pendente`, citam esta INST e o
   helper, e cada `arquivo:linha` citado existe e contém operação de escrita/leitura real.

Além dela: `Testes/TestValidarChecklistProducaoPortas.js` (o validador distingue PASS /
PENDENTE_DECLARADA / PENDENTE_BLOQUEANTE / FAIL) e as fechaduras de efeito do Guardião.

## 10. Migração e reversão

Não há migração de dado. Reversão: remover as aquisições e o helper (o estado volta ao do
diagnóstico; as 9 Portas voltam a `pendente` e a fechadura fica vermelha — o RED é intencional).
