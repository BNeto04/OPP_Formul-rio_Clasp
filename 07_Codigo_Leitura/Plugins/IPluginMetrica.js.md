# ESPELHO — IPluginMetrica.js

> [!NOTE] Espelho rico de código (Metodo §46.15) — gerado por `scripts/downplant/espelho-rico.mjs`
> Somente leitura. Não editar à mão: qualquer edição é sobrescrita na próxima geração.
> O código abaixo é cópia verbatim do arquivo de origem no commit declarado; divergência entre o embutido e a origem é deriva (§18.1).
> Regra do sha256 declarado: sha256 do conteúdo **normalizado para LF** (igual ao blob do Git). Em arquivo CRLF com terminador final diferente, ele difere do `sha256sum` dos bytes crus — a comparação de deriva é feita conteúdo-contra-conteúdo.
> Papel desta cópia: CANÔNICA (repositório). O derivado navegável no vault é gerado com as mesmas entradas.

- **Endereço Down Plant:** `C04_Motor / MOD-C04-01_MOTOR_ANALITICO` — [NOTA_DE_RESPONSABILIDADE.md](../../02_Comodos/C04_Motor/01_Dominio/modulos/MOD-C04-01_MOTOR_ANALITICO/NOTA_DE_RESPONSABILIDADE.md)
- **Arquivo de origem (link para o disco):** [`Plugins/IPluginMetrica.js`](../../Plugins/IPluginMetrica.js)
- **Commit de referência:** `fbb0608e7b98144533628c7f9b773a10505b800d` (`fbb0608`)
- **Data da última sincronização:** 2026-09-13T22:05:11-03:00

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

Fonte: `02_Comodos/C04_Motor/01_Dominio/modulos/MOD-C04-01_MOTOR_ANALITICO/MOD-C04-01_MOTOR_ANALITICO.md` — CAPSULA do modulo (formato 46.2), "## Responsabilidade".

Consolidar os fatos canonicos em **Registro Analitico** e calcular o **merito por armas**. Depois da
refatoracao, o Motor e um **orquestrador de plugins**: recebe fatos, dispara o ciclo de vida
(`inicializar -> processar -> finalizar`) e consolida o resultado.

Fonte: `02_Comodos/C04_Motor/01_Dominio/modulos/MOD-C04-01_MOTOR_ANALITICO/MOD-C04-01_MOTOR_ANALITICO.md` — CAPSULA do modulo (formato 46.2), "## Limites".

- **Nao le planilha** e **nao grava**: consome fatos e devolve registros.
- **Nao reimplementa regra de dominio:** as tabelas/limiares vivem na ARCA e em `Core/Constantes.js`.
- **Nao usa `QDT ARMAS` como arma fisica.** `ARMA` e a **fonte exclusiva** de arma de fogo fisica; o
  reconhecimento de artesanal vem de indicadores textuais (`TIPO`/`MODELO`/`ARMA`), nunca de `QDT ARMAS`.
- **Nao infere lideranca por outro criterio:** o merito vai ao militar de **menor `N`** (mais antigo).

## Portas expostas (se aplicável)

- Superfície exposta no nível do arquivo (nível global): `IPluginMetrica`
- Membros públicos observados: `inicializar`, `processar`, `finalizar`

_Extraído por heurística do gerador (globais de nível arquivo + métodos/accessors de 1º–2º nível). Não substitui a declaração de porta da Planta: confirme no endereço acima._

## Divergência com a Planta declarada

Testes mecânicos executados na geração (commit `fbb0608`, 2026-09-13T22:05:11-03:00):

- OK — T1 endereco existe: NOTA_DE_RESPONSABILIDADE.md do modulo presente
- OK — T2 artefato declarado no endereco: "Plugins/IPluginMetrica.js" aparece na Planta
- OK — T3 arquivo presente no commit de referencia (fbb0608:Plugins/IPluginMetrica.js)
- OK — T4 conteudo em disco identico ao do commit de referencia (sha256 LF)
- OK — T5 espelho anterior sem deriva de codigo (sha256 do bloco == origem)
- OK — T6 endereco declarado no espelho anterior corresponde ao endereco canonico atual
- OK — T7 sem duplicidade: exatamente 1 espelho de leitura declara "Plugins/IPluginMetrica.js" como origem

Veredito mecânico: **nenhuma divergência detectada pelos testes acima**.

Declaração verificada a mão por humano/agente (não derivável automaticamente):

- **Como o endereco foi derivado (nao inventado):** declaracao de artefato na secao "## Artefatos" da capsula §46.2 do endereco `C04_Motor / MOD-C04-01_MOTOR_ANALITICO` (linha 61 de `02_Comodos/C04_Motor/01_Dominio/modulos/MOD-C04-01_MOTOR_ANALITICO/MOD-C04-01_MOTOR_ANALITICO.md`) — nivel 1 do MAPA_ARTEFATO_ENDERECO_162.md. O contrato e implementado pelos 5 plugins `Plugins/Metricas/*.js` ja declarados neste mesmo endereco; o comodo ja listava `Plugins/IPluginMetrica.js` como artefato em `00_Visao_Do_Comodo/INDICE.md`:14 e `03_Especificacoes/INDICE.md`:15.
- **Ponteiro anterior:** nenhum endereco utilizavel (citado apenas em indices de comodo, nao em endereco de modulo/submodulo).
- **Nada foi corrigido no artefato:** o gerador nao altera codigo de produto; o arquivo de origem permanece byte a byte como estava.

## Última verificação (data/commit)

- 2026-09-13T22:05:11-03:00 · commit `fbb0608` · sha256 da origem (LF): `cb7c3381e9e5da96facf33fee26d302dbba112d1d1306184796986e6963c7abc`
- Reexecutar: `node scripts/downplant/espelho-rico.mjs gerar --endereco C04_Motor/MOD-C04-01_MOTOR_ANALITICO --origem Plugins/IPluginMetrica.js --saida <caminho>`
- Verificar deriva sem regravar: `node scripts/downplant/espelho-rico.mjs verificar --espelho <caminho>`
