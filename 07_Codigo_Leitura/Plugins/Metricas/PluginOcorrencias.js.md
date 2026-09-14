# ESPELHO — PluginOcorrencias.js

> [!NOTE] Espelho rico de código (Metodo §46.15) — gerado por `scripts/downplant/espelho-rico.mjs`
> Somente leitura. Não editar à mão: qualquer edição é sobrescrita na próxima geração.
> O código abaixo é cópia verbatim do arquivo de origem no commit declarado; divergência entre o embutido e a origem é deriva (§18.1).
> Regra do sha256 declarado: sha256 do conteúdo **normalizado para LF** (igual ao blob do Git). Em arquivo CRLF com terminador final diferente, ele difere do `sha256sum` dos bytes crus — a comparação de deriva é feita conteúdo-contra-conteúdo.
> Papel desta cópia: CANÔNICA (repositório). O derivado navegável no vault é gerado com as mesmas entradas.

- **Endereço Down Plant:** `C04_Motor / MOD-C04-01_MOTOR_ANALITICO` — [NOTA_DE_RESPONSABILIDADE.md](../../../02_Comodos/C04_Motor/01_Dominio/modulos/MOD-C04-01_MOTOR_ANALITICO/NOTA_DE_RESPONSABILIDADE.md)
- **Arquivo de origem (link para o disco):** [`Plugins/Metricas/PluginOcorrencias.js`](../../../Plugins/Metricas/PluginOcorrencias.js)
- **Commit de referência:** `fbb0608e7b98144533628c7f9b773a10505b800d` (`fbb0608`)
- **Data da última sincronização:** 2026-09-13T21:45:43-03:00

## Código-fonte embutido

Verbatim de `Plugins/Metricas/PluginOcorrencias.js` em `fbb0608`. sha256 do bloco (LF): `5b3d6336b95c7be54b187d57e86f2d3e92c9c71c2a28b01dc54f3e7793d0b8d1` — 31 linhas.

```javascript
/**
 * ARQUIVO: Plugins/Metricas/PluginOcorrencias.js
 * DESCRIÇÃO: Plugin responsável por contabilizar a quantidade de ocorrências
 * e BOEs participados pelo policial.
 */
class PluginOcorrencias extends IPluginMetrica {
  inicializar(consolidado) {
    if (!consolidado.fatos) consolidado.fatos = {};
    consolidado.fatos.ocorrencias = 0;
    consolidado.fatos.qtdBoe = 0;
  }

  processar(fato, pmFato, consolidado, chaveAtuacao, primeiraVezNaOcorrencia) {
    if (primeiraVezNaOcorrencia) {
      consolidado.fatos.ocorrencias++;
      if (fato.ocorrencia.boe) {
        consolidado.fatos.qtdBoe++;
      }
    }
  }

  finalizar(consolidado) {}
}

if (typeof module !== 'undefined' && module.exports) {
  if (typeof IPluginMetrica === 'undefined') {
    global.IPluginMetrica = require('../IPluginMetrica');
  }
  module.exports = PluginOcorrencias;
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

- Superfície exposta no nível do arquivo (nível global): `PluginOcorrencias`
- Membros públicos observados: `inicializar`, `processar`, `finalizar`

_Extraído por heurística do gerador (globais de nível arquivo + métodos/accessors de 1º–2º nível). Não substitui a declaração de porta da Planta: confirme no endereço acima._

## Divergência com a Planta declarada

Testes mecânicos executados na geração (commit `fbb0608`, 2026-09-13T21:45:43-03:00):

- OK — T1 endereco existe: NOTA_DE_RESPONSABILIDADE.md do modulo presente
- OK — T3 arquivo presente no commit de referencia (fbb0608:Plugins/Metricas/PluginOcorrencias.js)
- OK — T4 conteudo em disco identico ao do commit de referencia (sha256 LF)
- OK — T5 espelho anterior sem deriva de codigo (sha256 do bloco == origem)
- OK — T6 endereco declarado no espelho anterior corresponde ao endereco canonico atual
- OK — T7 sem duplicidade: exatamente 1 espelho de leitura declara "Plugins/Metricas/PluginOcorrencias.js" como origem
- **ACHADO** — T2 artefato NAO declarado no endereco: "Plugins/Metricas/PluginOcorrencias.js" nao aparece nas NOTAS/capsula de C04_Motor / MOD-C04-01_MOTOR_ANALITICO

Veredito mecânico: **1 divergência(s) detectada(s) pelos testes acima**.

Declaração verificada a mão por humano/agente (não derivável automaticamente):

- **Como o endereco foi derivado (nao inventado):** secao Artefatos; fonte `02_Comodos/C04_Motor/01_Dominio/modulos/MOD-C04-01_MOTOR_ANALITICO/MOD-C04-01_MOTOR_ANALITICO.md`:60.
- **Nada foi corrigido no artefato:** o gerador nao altera codigo de produto; o arquivo de origem permanece byte a byte como estava.

## Última verificação (data/commit)

- 2026-09-13T21:45:43-03:00 · commit `fbb0608` · sha256 da origem (LF): `5b3d6336b95c7be54b187d57e86f2d3e92c9c71c2a28b01dc54f3e7793d0b8d1`
- Reexecutar: `node scripts/downplant/espelho-rico.mjs gerar --endereco C04_Motor/MOD-C04-01_MOTOR_ANALITICO --origem Plugins/Metricas/PluginOcorrencias.js --saida <caminho>`
- Verificar deriva sem regravar: `node scripts/downplant/espelho-rico.mjs verificar --espelho <caminho>`
