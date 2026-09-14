# ESPELHO — PluginPontuacao.js

> [!NOTE] Espelho rico de código (Metodo §46.15) — gerado por `scripts/downplant/espelho-rico.mjs`
> Somente leitura. Não editar à mão: qualquer edição é sobrescrita na próxima geração.
> O código abaixo é cópia verbatim do arquivo de origem no commit declarado; divergência entre o embutido e a origem é deriva (§18.1).
> Regra do sha256 declarado: sha256 do conteúdo **normalizado para LF** (igual ao blob do Git). Em arquivo CRLF com terminador final diferente, ele difere do `sha256sum` dos bytes crus — a comparação de deriva é feita conteúdo-contra-conteúdo.
> Papel desta cópia: CANÔNICA (repositório). O derivado navegável no vault é gerado com as mesmas entradas.

- **Endereço Down Plant:** `C04_Motor / MOD-C04-01_MOTOR_ANALITICO` — [NOTA_DE_RESPONSABILIDADE.md](../../../02_Comodos/C04_Motor/01_Dominio/modulos/MOD-C04-01_MOTOR_ANALITICO/NOTA_DE_RESPONSABILIDADE.md)
- **Arquivo de origem (link para o disco):** [`Plugins/Metricas/PluginPontuacao.js`](../../../Plugins/Metricas/PluginPontuacao.js)
- **Commit de referência:** `fbb0608e7b98144533628c7f9b773a10505b800d` (`fbb0608`)
- **Data da última sincronização:** 2026-09-13T21:45:46-03:00

## Código-fonte embutido

Verbatim de `Plugins/Metricas/PluginPontuacao.js` em `fbb0608`. sha256 do bloco (LF): `15f95ba28e9c22c2e4566322f14af8be36b48626b75ea20613addb7441c137c8` — 59 linhas.

```javascript
/**
 * ARQUIVO: Plugins/Metricas/PluginPontuacao.js
 * DESCRIÇÃO: Plugin responsável por calcular a pontuação rateada do policial.
 */
class PluginPontuacao extends IPluginMetrica {
  constructor() {
    super();
    this._pontosPorPolicial = new Map();
  }

  inicializar(consolidado) {
    if (!consolidado.indicadores) consolidado.indicadores = {};
    consolidado.indicadores.pontosPIP = 0;
    consolidado.indicadores.pontosCPM = 0;
    consolidado.indicadores.pontosTotais = 0;

    const matricula = consolidado.matricula || 'N/I';
    this._pontosPorPolicial.set(matricula, new Map());
  }

  processar(fato, pmFato, consolidado, chaveAtuacao, primeiraVezNaOcorrencia) {
    const matricula = consolidado.matricula || 'N/I';
    let mapaPontos = this._pontosPorPolicial.get(matricula);
    if (!mapaPontos) {
      mapaPontos = new Map();
      this._pontosPorPolicial.set(matricula, mapaPontos);
    }

    const chavePonto = `pts_${chaveAtuacao}`;
    const pontosLidos = pmFato.pontosRateados || 0;
    const atual = mapaPontos.get(chavePonto) || 0;
    mapaPontos.set(chavePonto, Math.max(atual, pontosLidos));
  }

  finalizar(consolidado) {
    const matricula = consolidado.matricula || 'N/I';
    const mapaPontos = this._pontosPorPolicial.get(matricula);
    let pontos = 0;

    if (mapaPontos) {
      for (const p of mapaPontos.values()) {
        pontos += p;
      }
      this._pontosPorPolicial.delete(matricula);
    }

    consolidado.indicadores.pontosCPM = pontos;
    consolidado.indicadores.pontosPIP = pontos;
    consolidado.indicadores.pontosTotais = pontos;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  if (typeof IPluginMetrica === 'undefined') {
    global.IPluginMetrica = require('../IPluginMetrica');
  }
  module.exports = PluginPontuacao;
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

- Superfície exposta no nível do arquivo (nível global): `PluginPontuacao`
- Membros públicos observados: `constructor`, `super`, `inicializar`, `processar`, `finalizar`

_Extraído por heurística do gerador (globais de nível arquivo + métodos/accessors de 1º–2º nível). Não substitui a declaração de porta da Planta: confirme no endereço acima._

## Divergência com a Planta declarada

Testes mecânicos executados na geração (commit `fbb0608`, 2026-09-13T21:45:46-03:00):

- OK — T1 endereco existe: NOTA_DE_RESPONSABILIDADE.md do modulo presente
- OK — T3 arquivo presente no commit de referencia (fbb0608:Plugins/Metricas/PluginPontuacao.js)
- OK — T4 conteudo em disco identico ao do commit de referencia (sha256 LF)
- OK — T5 espelho anterior sem deriva de codigo (sha256 do bloco == origem)
- OK — T6 endereco declarado no espelho anterior corresponde ao endereco canonico atual
- OK — T7 sem duplicidade: exatamente 1 espelho de leitura declara "Plugins/Metricas/PluginPontuacao.js" como origem
- **ACHADO** — T2 artefato NAO declarado no endereco: "Plugins/Metricas/PluginPontuacao.js" nao aparece nas NOTAS/capsula de C04_Motor / MOD-C04-01_MOTOR_ANALITICO

Veredito mecânico: **1 divergência(s) detectada(s) pelos testes acima**.

Declaração verificada a mão por humano/agente (não derivável automaticamente):

- **Como o endereco foi derivado (nao inventado):** secao Artefatos; fonte `02_Comodos/C04_Motor/01_Dominio/modulos/MOD-C04-01_MOTOR_ANALITICO/MOD-C04-01_MOTOR_ANALITICO.md`:60.
- **Enderecos concorrentes declarados na Planta (1):** `C01_Entrada/MOD-C01-01_FORMULARIO_E_MENUS/SUB-C01-01-01_OCR_E_CONFERENCIA`. O artefato e referenciado em mais de um endereco; o campo acima registra o endereco PRIMARIO. Nao e erro de endereco — e declaracao concorrente na propria Planta.
- **Nada foi corrigido no artefato:** o gerador nao altera codigo de produto; o arquivo de origem permanece byte a byte como estava.

## Última verificação (data/commit)

- 2026-09-13T21:45:46-03:00 · commit `fbb0608` · sha256 da origem (LF): `15f95ba28e9c22c2e4566322f14af8be36b48626b75ea20613addb7441c137c8`
- Reexecutar: `node scripts/downplant/espelho-rico.mjs gerar --endereco C04_Motor/MOD-C04-01_MOTOR_ANALITICO --origem Plugins/Metricas/PluginPontuacao.js --saida <caminho>`
- Verificar deriva sem regravar: `node scripts/downplant/espelho-rico.mjs verificar --espelho <caminho>`
