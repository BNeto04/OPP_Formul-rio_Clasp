# ESPELHO — Compatibilidade.js

> [!NOTE] Espelho rico de código (Metodo §46.15) — gerado por `scripts/downplant/espelho-rico.mjs`
> Somente leitura. Não editar à mão: qualquer edição é sobrescrita na próxima geração.
> O código abaixo é cópia verbatim do arquivo de origem no commit declarado; divergência entre o embutido e a origem é deriva (§18.1).
> Regra do sha256 declarado: sha256 do conteúdo **normalizado para LF** (igual ao blob do Git). Em arquivo CRLF com terminador final diferente, ele difere do `sha256sum` dos bytes crus — a comparação de deriva é feita conteúdo-contra-conteúdo.
> Papel desta cópia: CANÔNICA (repositório). O derivado navegável no vault é gerado com as mesmas entradas.

- **Endereço Down Plant:** `C01_Entrada / MOD-C01-01_FORMULARIO_E_MENUS` — [NOTA_DE_RESPONSABILIDADE.md](../02_Comodos/C01_Entrada/01_Dominio/modulos/MOD-C01-01_FORMULARIO_E_MENUS/NOTA_DE_RESPONSABILIDADE.md)
- **Arquivo de origem (link para o disco):** [`Compatibilidade.js`](../Compatibilidade.js)
- **Commit de referência:** `fbb0608e7b98144533628c7f9b773a10505b800d` (`fbb0608`)
- **Data da última sincronização:** 2026-09-13T21:44:57-03:00

## Código-fonte embutido

Verbatim de `Compatibilidade.js` em `fbb0608`. sha256 do bloco (LF): `e433243b0bf1da215f5968f4c46c71d814667fd2f26b24984e074841f81577bf` — 57 linhas.

```javascript
/**
 * ARQUIVO: Entradas/Compatibilidade.js
 * DESCRICAO: Manifesto da API publica do SYNTHEON no Google Apps Script.
 *
 * REGRA DE OURO #5 (compatibilidade operacional): os NOMES chamados pelos menus da planilha NAO mudam.
 * O que este arquivo NAO pode mais fazer e REDEFINIR um simbolo que ja existe em outro arquivo: no
 * Apps Script a ultima definicao carregada vence, entao passar a resolucao a depender da ordem de carga
 * e uma ambiguidade de comportamento. Eliminado no card #134 (COMPAT-FIX-001).
 *
 * IMPORTANTE: as definicoes removidas daqui NAO eram as implementacoes reais - ou eram stubs vazios
 * (`abrirMenuSelecaoLivre`, `iniciarModoAnual`) ou duplicatas de delegacao
 * (`compilarProdutividadeRapida`/`Avancada`) ou uma versao QUEBRADA por depender de modulos que nao
 * sao enviados ao Apps Script (`rodarTesteDeHomologacao`). Os nomes continuam globais e chamáveis.
 *
 * Implementacao canonica UNICA de cada simbolo publico:
 *   abrirFormularioEntrada                       -> Entrada/Menu.js
 *   abrirMenuSelecaoLivre                        -> Compilador_Armas.js        (implementacao real)
 *   iniciarModoAnual                             -> Compilador_Armas.js        (implementacao real)
 *   abrirMenuSelecaoLivreDrogas                  -> Compilador de Entorpecentes.js
 *   iniciarModoAnualDrogas                       -> Compilador de Entorpecentes.js
 *   abrirMenuComparativo2026                     -> Features/CompiladorProdutividade.js
 *   compilarProdutividadeRapida                  -> Features/CompiladorProdutividade.js
 *   compilarProdutividadeAvancada                -> Features/CompiladorProdutividade.js
 *   abrirSeletorMesesGuardiao                    -> Entrada/SeletorMesesGuardiao.js
 *   executarGuardiaoQualidade                    -> Features/GuardiaoQualidade.js
 *   normalizarEfetivo                            -> Features/NormalizadorEfetivo.js
 *   abrirMenuPipMensal / abrirMenuPipLivre / gerarPipAnual -> Compilador PIP.js
 *   abrirMenuCPMMensal / abrirMenuCPMLivre / gerarCPMAnual -> CPM - Compilador de Pontuacao Mensal.js
 *   rodarTesteDeHomologacao                      -> Homologacao/RodarTesteDeHomologacao.js
 *                                                   (NAO enviado ao Apps Script: `Homologacao/**` esta no .claspignore)
 *
 * Consequencia declarada de `rodarTesteDeHomologacao`: como o arcabouco de homologacao nao e enviado,
 * a versao que rodava em producao era a que existia aqui - e ela quebrava no clique, porque instancia
 * `HomologationEngine`/`HomologationSheetsDriver` e usa `testOcorrencias`/`testArmas`/`testDrogas`/
 * `testPontuacao`, todos ausentes do conjunto enviado. O item `[Dev]` do menu P3 e omitido
 * automaticamente em producao (construcao defensiva do #130); no repositorio a funcao existe e e a unica.
 *
 * Guarda automatica: `Testes/TestSemRedefinicaoGlobal.js` falha se qualquer simbolo do produto voltar a
 * ter duas definicoes no conjunto enviado ao Apps Script.
 */

// ---------------------------------------------------------
// Simbolos mantidos por compatibilidade (unicos: nenhuma outra definicao no produto)
// Candidatos a obsolescencia: remover exige confirmar que nenhum acionador (trigger) externo aponta
// para eles - nao ha como provar isso por codigo, por isso seguem aqui com zero chamadores.
// ---------------------------------------------------------
function compilarPIP() {
  // Facade legada sem implementacao. O PIP real entra por `abrirMenuPipMensal` (Compilador PIP.js).
}

function compilarCPM() {
  // Facade legada sem implementacao. O CPM real entra por `abrirMenuCPMMensal` (CPM - Compilador de Pontuacao Mensal.js).
}

function compilarProdutividadeBetaV2() {
  // Reservado para a coexistencia V1 x V2 (Fase 4). Sem implementacao ate la.
}
```

## Responsabilidade observada

Fonte: `02_Comodos/C01_Entrada/01_Dominio/modulos/MOD-C01-01_FORMULARIO_E_MENUS/MOD-C01-01_FORMULARIO_E_MENUS.md` — CAPSULA do modulo (formato 46.2), "## Responsabilidade".

Receber o texto do BO (colagem/OCR), transformá-lo em **payload conferível** e entregá-lo à persistência (`SUB-C01-01-02_PERSISTENCIA_MANUAL`). Não decide pontuação, não corrige dado: **sugere e deixa conferir**. Também expõe a **porta única de navegação P3** do produto.

Fonte: `02_Comodos/C01_Entrada/01_Dominio/modulos/MOD-C01-01_FORMULARIO_E_MENUS/MOD-C01-01_FORMULARIO_E_MENUS.md` — CAPSULA do modulo (formato 46.2), "## Limites".

- **Não** grava direto na aba mensal: o payload passa por `Entrada/EntradaManual.js` (validação de coluna, anti-duplicidade, fórmula).
- **Não** decide imputado (`IMPUTADO?` é escolha do operador; DETIDOS nunca é inferido).
- **Não** aplica regra de domínio nova por heurística: consulta a ARCA quando a regra existe (fail-soft).
- **Não** inventa valor: campo sem evidência fica pendente e **explícito** (ex.: alerta `CONFERIR AIS`).

## Portas expostas (se aplicável)

- Superfície exposta no nível do arquivo (nível global): `compilarPIP`, `compilarCPM`, `compilarProdutividadeBetaV2`
- Membros públicos observados: —

_Extraído por heurística do gerador (globais de nível arquivo + métodos/accessors de 1º–2º nível). Não substitui a declaração de porta da Planta: confirme no endereço acima._

## Divergência com a Planta declarada

Testes mecânicos executados na geração (commit `fbb0608`, 2026-09-13T21:44:57-03:00):

- OK — T1 endereco existe: NOTA_DE_RESPONSABILIDADE.md do modulo presente
- OK — T3 arquivo presente no commit de referencia (fbb0608:Compatibilidade.js)
- OK — T4 conteudo em disco identico ao do commit de referencia (sha256 LF)
- OK — T5 espelho anterior sem deriva de codigo (sha256 do bloco == origem)
- OK — T6 endereco declarado no espelho anterior corresponde ao endereco canonico atual
- OK — T7 sem duplicidade: exatamente 1 espelho de leitura declara "Compatibilidade.js" como origem
- **ACHADO** — T2 artefato NAO declarado no endereco: "Compatibilidade.js" nao aparece nas NOTAS/capsula de C01_Entrada / MOD-C01-01_FORMULARIO_E_MENUS

Veredito mecânico: **1 divergência(s) detectada(s) pelos testes acima**.

Declaração verificada a mão por humano/agente (não derivável automaticamente):

- **Como o endereco foi derivado (nao inventado):** menção em arquivo do próprio endereço; fonte `02_Comodos/C01_Entrada/01_Dominio/modulos/MOD-C01-01_FORMULARIO_E_MENUS/INVENTARIO_MENUS_E_CONTRATO_P3.md`.
- **Divergencia com o espelho anterior:** o espelho antigo declarava o modulo `MOD-C06-01_RELATORIOS_OFICIAIS`; a derivacao atual chega a `C01_Entrada/MOD-C01-01_FORMULARIO_E_MENUS`. Divergencia declarada, nao sobrescrita em silencio.
- **Nada foi corrigido no artefato:** o gerador nao altera codigo de produto; o arquivo de origem permanece byte a byte como estava.

## Última verificação (data/commit)

- 2026-09-13T21:44:57-03:00 · commit `fbb0608` · sha256 da origem (LF): `e433243b0bf1da215f5968f4c46c71d814667fd2f26b24984e074841f81577bf`
- Reexecutar: `node scripts/downplant/espelho-rico.mjs gerar --endereco C01_Entrada/MOD-C01-01_FORMULARIO_E_MENUS --origem Compatibilidade.js --saida <caminho>`
- Verificar deriva sem regravar: `node scripts/downplant/espelho-rico.mjs verificar --espelho <caminho>`
