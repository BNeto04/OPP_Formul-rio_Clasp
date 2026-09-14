# ESPELHO — RegistroAnalitico.js

> [!NOTE] Espelho rico de código (Metodo §46.15) — gerado por `scripts/downplant/espelho-rico.mjs`
> Somente leitura. Não editar à mão: qualquer edição é sobrescrita na próxima geração.
> O código abaixo é cópia verbatim do arquivo de origem no commit declarado; divergência entre o embutido e a origem é deriva (§18.1).
> Regra do sha256 declarado: sha256 do conteúdo **normalizado para LF** (igual ao blob do Git). Em arquivo CRLF com terminador final diferente, ele difere do `sha256sum` dos bytes crus — a comparação de deriva é feita conteúdo-contra-conteúdo.
> Papel desta cópia: CANÔNICA (repositório). O derivado navegável no vault é gerado com as mesmas entradas.

- **Endereço Down Plant:** `C04_Motor / MOD-C04-01_MOTOR_ANALITICO` — [NOTA_DE_RESPONSABILIDADE.md](../../02_Comodos/C04_Motor/01_Dominio/modulos/MOD-C04-01_MOTOR_ANALITICO/NOTA_DE_RESPONSABILIDADE.md)
- **Arquivo de origem (link para o disco):** [`Dominio/RegistroAnalitico.js`](../../Dominio/RegistroAnalitico.js)
- **Commit de referência:** `fbb0608e7b98144533628c7f9b773a10505b800d` (`fbb0608`)
- **Data da última sincronização:** 2026-09-13T21:45:22-03:00

## Código-fonte embutido

Verbatim de `Dominio/RegistroAnalitico.js` em `fbb0608`. sha256 do bloco (LF): `128452bd4332a9d54cf1a038a66c6872f617d274afd3fcca66d10773ce78b88c` — 68 linhas.

```javascript
/**
 * ARQUIVO: Dominio/RegistroAnalitico.js
 * DESCRIÇÃO: Entidade canônica que consolida a produção de um policial ou entidade.
 * Segue estritamente a Regra #1 (Separação de Fatos vs Indicadores) e Rastreabilidade.
 */
class RegistroAnalitico {
  constructor(dados) {
    // Rastreabilidade e Identificação
    this.matricula = dados.matricula || '';
    this.nome = dados.nome || '';
    this.grad = dados.grad || '';
    this.pelotao = dados.pelotao || '';
    this.historicoEscalas = dados.historicoEscalas || [];

    // Fatos (Imutáveis: Quantidades extraídas diretamente da Fonte)
    this.fatos = {
      ocorrencias: dados.fatos?.ocorrencias ?? dados.ocorrencias ?? 0,
      qtdBoe: dados.fatos?.qtdBoe ?? dados.qtdBoe ?? 0,
      armas: dados.fatos?.armas ?? dados.armas ?? 0,
      // #152: PARTICIPACAO de arma (QDT ARMAS). Esta reconstrucao do registro descartava o campo.
      participacaoArmas: dados.fatos?.participacaoArmas ?? dados.participacaoArmas ?? 0,
      maconha: dados.fatos?.maconha ?? dados.maconha ?? 0,
      cocaina: dados.fatos?.cocaina ?? dados.cocaina ?? 0,
      crack: dados.fatos?.crack ?? dados.crack ?? 0,
      drogasTotal: dados.fatos?.drogasTotal ?? dados.drogasTotal ?? 0,
      detidos: dados.fatos?.detidos ?? dados.detidos ?? 0,
      apfd: dados.fatos?.apfd ?? dados.apfd ?? 0,
      tco: dados.fatos?.tco ?? dados.tco ?? 0,
      boc: dados.fatos?.boc ?? dados.boc ?? 0,
      ocorrenciasComArma: dados.fatos?.ocorrenciasComArma ?? dados.ocorrenciasComArma ?? 0,
      ocorrenciasComDroga: dados.fatos?.ocorrenciasComDroga ?? dados.ocorrenciasComDroga ?? 0
    };

    // Indicadores (Variáveis calculadas pelo Motor Analítico)
    this.indicadores = {
      pontosTotais: dados.indicadores?.pontosTotais ?? dados.pontosTotais ?? 0,
      pontosPIP: dados.indicadores?.pontosPIP ?? dados.pontosPIP ?? 0,
      pontosCPM: dados.indicadores?.pontosCPM ?? dados.pontosCPM ?? 0
    };
  }

  // --- KPIs Derivados Dinamicamente (Indicadores Computados) --- //

  get mediaPontos() {
    return this.fatos.ocorrencias > 0 ? parseFloat((this.indicadores.pontosTotais / this.fatos.ocorrencias).toFixed(2)) : 0;
  }

  get mediaArmas() {
    return this.fatos.ocorrencias > 0 ? parseFloat((this.fatos.armas / this.fatos.ocorrencias).toFixed(2)) : 0;
  }

  get mediaDrogas() {
    return this.fatos.ocorrencias > 0 ? parseFloat((this.fatos.drogasTotal / this.fatos.ocorrencias).toFixed(2)) : 0;
  }

  get percentualArmas() {
    return this.fatos.ocorrencias > 0 ? parseFloat((this.fatos.ocorrenciasComArma / this.fatos.ocorrencias).toFixed(2)) : 0;
  }
  
  get percentualDrogas() {
    return this.fatos.ocorrencias > 0 ? parseFloat((this.fatos.ocorrenciasComDroga / this.fatos.ocorrencias).toFixed(2)) : 0;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = RegistroAnalitico;
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

- Superfície exposta no nível do arquivo (nível global): `RegistroAnalitico`
- Membros públicos observados: `mediaPontos`, `mediaArmas`, `mediaDrogas`, `percentualArmas`, `percentualDrogas`, `constructor`

_Extraído por heurística do gerador (globais de nível arquivo + métodos/accessors de 1º–2º nível). Não substitui a declaração de porta da Planta: confirme no endereço acima._

## Divergência com a Planta declarada

Testes mecânicos executados na geração (commit `fbb0608`, 2026-09-13T21:45:22-03:00):

- OK — T1 endereco existe: NOTA_DE_RESPONSABILIDADE.md do modulo presente
- OK — T2 artefato declarado no endereco: "Dominio/RegistroAnalitico.js" aparece na Planta
- OK — T3 arquivo presente no commit de referencia (fbb0608:Dominio/RegistroAnalitico.js)
- OK — T4 conteudo em disco identico ao do commit de referencia (sha256 LF)
- OK — T5 espelho anterior sem deriva de codigo (sha256 do bloco == origem)
- OK — T6 endereco declarado no espelho anterior corresponde ao endereco canonico atual
- OK — T7 sem duplicidade: exatamente 1 espelho de leitura declara "Dominio/RegistroAnalitico.js" como origem

Veredito mecânico: **nenhuma divergência detectada pelos testes acima**.

Declaração verificada a mão por humano/agente (não derivável automaticamente):

- **Como o endereco foi derivado (nao inventado):** secao Artefatos; fonte `02_Comodos/C04_Motor/01_Dominio/modulos/MOD-C04-01_MOTOR_ANALITICO/MOD-C04-01_MOTOR_ANALITICO.md`:61.
- **Divergencia com o espelho anterior:** o espelho antigo declarava o modulo `MOD-C03-01_MODELO_DE_OCORRENCIA`; a derivacao atual chega a `C04_Motor/MOD-C04-01_MOTOR_ANALITICO`. Divergencia declarada, nao sobrescrita em silencio.
- **Nada foi corrigido no artefato:** o gerador nao altera codigo de produto; o arquivo de origem permanece byte a byte como estava.

## Última verificação (data/commit)

- 2026-09-13T21:45:22-03:00 · commit `fbb0608` · sha256 da origem (LF): `128452bd4332a9d54cf1a038a66c6872f617d274afd3fcca66d10773ce78b88c`
- Reexecutar: `node scripts/downplant/espelho-rico.mjs gerar --endereco C04_Motor/MOD-C04-01_MOTOR_ANALITICO --origem Dominio/RegistroAnalitico.js --saida <caminho>`
- Verificar deriva sem regravar: `node scripts/downplant/espelho-rico.mjs verificar --espelho <caminho>`
