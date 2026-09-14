# ESPELHO — IPluginMetrica.js

> [!NOTE] Espelho rico de código (Metodo §46.15) — gerado por `scripts/downplant/espelho-rico.mjs`
> Somente leitura. Não editar à mão: qualquer edição é sobrescrita na próxima geração.
> O código abaixo é cópia verbatim do arquivo de origem no commit declarado; divergência entre o embutido e a origem é deriva (§18.1).
> Regra do sha256 declarado: sha256 do conteúdo **normalizado para LF** (igual ao blob do Git). Em arquivo CRLF com terminador final diferente, ele difere do `sha256sum` dos bytes crus — a comparação de deriva é feita conteúdo-contra-conteúdo.
> Papel desta cópia: CANÔNICA (repositório). O derivado navegável no vault é gerado com as mesmas entradas.

- **Endereço Down Plant:** `NÃO RESOLVIDO` — o artefato nao e declarado como artefato fisico em NENHUM endereco da Planta (varredura de 02_Comodos: secoes "Artefatos", tabelas de artefatos e mencoes no diretorio do endereco). O espelho anterior nao declarava endereco utilizavel. REPORTADO, nao inventado — ver MAPA_ARTEFATO_ENDERECO_162.md.
- Sem link de endereço: não existe elemento da Planta a linkar (não inventado). Ver `MAPA_ARTEFATO_ENDERECO_162.md`.
- **Arquivo de origem (link para o disco):** [`Plugins/IPluginMetrica.js`](../../Plugins/IPluginMetrica.js)
- **Commit de referência:** `fbb0608e7b98144533628c7f9b773a10505b800d` (`fbb0608`)
- **Data da última sincronização:** 2026-09-13T21:45:41-03:00

## Código-fonte embutido

Verbatim de `Plugins/IPluginMetrica.js` em `fbb0608`. sha256 do bloco (LF): `cb7c3381e9e5da96facf33fee26d302dbba112d1d1306184796986e6963c7abc` — 41 linhas.

```javascript
/**
 * ARQUIVO: Plugins/IPluginMetrica.js
 * DESCRIÇÃO: Interface/Molde base para todos os plugins de métricas da Central Analítica.
 * Impõe o contrato para inicialização, processamento de linha e consolidação final.
 */
class IPluginMetrica {
  /**
   * Chamado quando um policial é descoberto pela primeira vez no Motor.
   * Útil para injetar as chaves na estrutura (ex: fatos.armas = 0).
   * @param {Object} consolidado O objeto em construção do policial.
   */
  inicializar(consolidado) {
    throw new Error("Metodo inicializar() deve ser implementado pelo Plugin.");
  }

  /**
   * Chamado para cada fato canônico lido na base associado ao policial.
   * @param {RegistroCanonico} fato O fato completo (ocorrência, origem, métricas primárias).
   * @param {Object} pmFato Apenas as métricas do PM nesta linha.
   * @param {Object} consolidado O objeto em construção do policial.
   * @param {string} chaveAtuacao Chave única Ocorrencia+Matricula.
   * @param {boolean} primeiraVezNaOcorrencia True se é a 1ª vez que lemos o PM nesta ocorrência.
   */
  processar(fato, pmFato, consolidado, chaveAtuacao, primeiraVezNaOcorrencia) {
    throw new Error("Metodo processar() deve ser implementado pelo Plugin.");
  }

  /**
   * Chamado após todas as linhas da planilha terem sido lidas.
   * Útil para cálculos finais (ex: somatórios de arrays, médias, rateios finais).
   * @param {Object} consolidado O objeto final do policial.
   */
  finalizar(consolidado) {
    throw new Error("Metodo finalizar() deve ser implementado pelo Plugin.");
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = IPluginMetrica;
}

```

## Responsabilidade observada

- _(sem NOTA_DE_RESPONSABILIDADE.md no endereço: responsabilidade não derivável)_
## Portas expostas (se aplicável)

- Superfície exposta no nível do arquivo (nível global): `IPluginMetrica`
- Membros públicos observados: `inicializar`, `processar`, `finalizar`

_Extraído por heurística do gerador (globais de nível arquivo + métodos/accessors de 1º–2º nível). Não substitui a declaração de porta da Planta: confirme no endereço acima._

## Divergência com a Planta declarada

Testes mecânicos executados na geração (commit `fbb0608`, 2026-09-13T21:45:41-03:00):

- OK — T3 arquivo presente no commit de referencia (fbb0608:Plugins/IPluginMetrica.js)
- OK — T4 conteudo em disco identico ao do commit de referencia (sha256 LF)
- OK — T5 espelho anterior sem deriva de codigo (sha256 do bloco == origem)
- OK — T7 sem duplicidade: exatamente 1 espelho de leitura declara "Plugins/IPluginMetrica.js" como origem
- **ACHADO** — T1 endereco NAO RESOLVIDO no Down Plant canonico: o artefato nao e declarado como artefato fisico em NENHUM endereco da Planta (varredura de 02_Comodos: secoes "Artefatos", tabelas de artefatos e mencoes no diretorio do endereco). O espelho anterior nao declarava endereco utilizavel. REPORTADO, nao inventado — ver MAPA_ARTEFATO_ENDERECO_162.md. (registrado em MAPA_ARTEFATO_ENDERECO_162.md — REPORTADO, nao inventado)
- **ACHADO** — T2 declaracao do artefato nao verificavel: sem endereco canonico nao ha Planta contra a qual conferir "Plugins/IPluginMetrica.js"

Veredito mecânico: **2 divergência(s) detectada(s) pelos testes acima**.

Declaração verificada a mão por humano/agente (não derivável automaticamente):

- **Como o endereco foi derivado (nao inventado):** sem derivacao.
- **Nada foi corrigido no artefato:** o gerador nao altera codigo de produto; o arquivo de origem permanece byte a byte como estava.

## Última verificação (data/commit)

- 2026-09-13T21:45:41-03:00 · commit `fbb0608` · sha256 da origem (LF): `cb7c3381e9e5da96facf33fee26d302dbba112d1d1306184796986e6963c7abc`
- Reexecutar: `node scripts/downplant/espelho-rico.mjs gerar --endereco-ausente "o artefato nao e declarado como artefato fisico em NENHUM endereco da Planta (varredura de 02_Comodos: secoes "Artefatos", tabelas de artefatos e mencoes no diretorio do endereco). O espelho anterior nao declarava endereco utilizavel. REPORTADO, nao inventado — ver MAPA_ARTEFATO_ENDERECO_162.md." --origem Plugins/IPluginMetrica.js --saida <caminho>`
- Verificar deriva sem regravar: `node scripts/downplant/espelho-rico.mjs verificar --espelho <caminho>`
