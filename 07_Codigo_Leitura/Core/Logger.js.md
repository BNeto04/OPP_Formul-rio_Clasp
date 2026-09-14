# ESPELHO — Logger.js

> [!NOTE] Espelho rico de código (Metodo §46.15) — gerado por `scripts/downplant/espelho-rico.mjs`
> Somente leitura. Não editar à mão: qualquer edição é sobrescrita na próxima geração.
> O código abaixo é cópia verbatim do arquivo de origem no commit declarado; divergência entre o embutido e a origem é deriva (§18.1).
> Regra do sha256 declarado: sha256 do conteúdo **normalizado para LF** (igual ao blob do Git). Em arquivo CRLF com terminador final diferente, ele difere do `sha256sum` dos bytes crus — a comparação de deriva é feita conteúdo-contra-conteúdo.
> Papel desta cópia: CANÔNICA (repositório). O derivado navegável no vault é gerado com as mesmas entradas.

- **Endereço Down Plant:** `NÃO RESOLVIDO` — o artefato nao e declarado como artefato fisico em NENHUM endereco da Planta (varredura de 02_Comodos: secoes "Artefatos", tabelas de artefatos e mencoes no diretorio do endereco). O espelho anterior apontava para `_SUP_158/C00_Governanca_Estrutural/01_Dominio/modulos/MOD-C00-01_INFRAESTRUTURA_CORE`, elemento PARADO (arquivado no #158, sem lastro em nenhuma ref do repo). REPORTADO, nao inventado — ver MAPA_ARTEFATO_ENDERECO_162.md.
- Sem link de endereço: não existe elemento da Planta a linkar (não inventado). Ver `MAPA_ARTEFATO_ENDERECO_162.md`.
- **Arquivo de origem (link para o disco):** [`Core/Logger.js`](../../Core/Logger.js)
- **Commit de referência:** `fbb0608e7b98144533628c7f9b773a10505b800d` (`fbb0608`)
- **Data da última sincronização:** 2026-09-13T21:45:06-03:00

## Código-fonte embutido

Verbatim de `Core/Logger.js` em `fbb0608`. sha256 do bloco (LF): `1309998f2067be50b3f7cff6aa3562e6c0a50847be479b725e08d052ada3af65` — 46 linhas.

```javascript
/**
 * Logger central do ecossistema SYNTHEON.
 * Centraliza estatisticas e avisos dos fluxos.
 */
class SyntheonLogger {
  constructor(modo) {
    this.modo = modo;
    this.inicio = new Date();
    this.abasLidas = [];
    this.linhasLidas = 0;
    this.linhasValidas = 0;
    this.linhasIgnoradas = 0;
    this.duplicidades = 0;
    this.policiaisUnicos = 0;
    this.ocorrenciasUnicas = 0;
    this.matriculasNaoEncontradas = new Set();
    this.avisos = [];
  }

  logAba(nomeAba) {
    if (!this.abasLidas.includes(nomeAba)) {
      this.abasLidas.push(nomeAba);
    }
  }

  logAbaDetalhado(nomeAba, linhas, ocorrencias, policiais, tempoSegundos) {
    if (typeof Logger !== 'undefined') {
      Logger.log(`[ABA] ${nomeAba} | ${linhas} linhas | ${ocorrencias} ocorrencias | ${policiais} policiais | Tempo: ${tempoSegundos}s`);
    }
  }

  aviso(mensagem) {
    this.avisos.push(mensagem);
    if (CONFIG_SYNTHEON.DEBUG && typeof Logger !== 'undefined') {
      Logger.log(`[AVISO] ${mensagem}`);
    }
  }

  getTempoExecucaoSegundos() {
    return ((new Date() - this.inicio) / 1000).toFixed(2);
  }

  gravarPlanilha(nomeAbaLog, nomeAbaResultado) {
    RendererAuditoria.render(SpreadsheetApp.getActiveSpreadsheet(), this, nomeAbaLog, nomeAbaResultado);
  }
}
```

## Responsabilidade observada

- _(sem NOTA_DE_RESPONSABILIDADE.md no endereço: responsabilidade não derivável)_
## Portas expostas (se aplicável)

- Superfície exposta no nível do arquivo (nível global): `SyntheonLogger`
- Membros públicos observados: `constructor`, `logAba`, `logAbaDetalhado`, `aviso`, `getTempoExecucaoSegundos`, `gravarPlanilha`

_Extraído por heurística do gerador (globais de nível arquivo + métodos/accessors de 1º–2º nível). Não substitui a declaração de porta da Planta: confirme no endereço acima._

## Divergência com a Planta declarada

Testes mecânicos executados na geração (commit `fbb0608`, 2026-09-13T21:45:06-03:00):

- OK — T3 arquivo presente no commit de referencia (fbb0608:Core/Logger.js)
- OK — T4 conteudo em disco identico ao do commit de referencia (sha256 LF)
- OK — T5 espelho anterior sem deriva de codigo (sha256 do bloco == origem)
- OK — T7 sem duplicidade: exatamente 1 espelho de leitura declara "Core/Logger.js" como origem
- **ACHADO** — T1 endereco NAO RESOLVIDO no Down Plant canonico: o artefato nao e declarado como artefato fisico em NENHUM endereco da Planta (varredura de 02_Comodos: secoes "Artefatos", tabelas de artefatos e mencoes no diretorio do endereco). O espelho anterior apontava para `_SUP_158/C00_Governanca_Estrutural/01_Dominio/modulos/MOD-C00-01_INFRAESTRUTURA_CORE`, elemento PARADO (arquivado no #158, sem lastro em nenhuma ref do repo). REPORTADO, nao inventado — ver MAPA_ARTEFATO_ENDERECO_162.md. (registrado em MAPA_ARTEFATO_ENDERECO_162.md — REPORTADO, nao inventado)
- **ACHADO** — T2 declaracao do artefato nao verificavel: sem endereco canonico nao ha Planta contra a qual conferir "Core/Logger.js"

Veredito mecânico: **2 divergência(s) detectada(s) pelos testes acima**.

Declaração verificada a mão por humano/agente (não derivável automaticamente):

- **Como o endereco foi derivado (nao inventado):** sem derivacao.
- **Ponteiro anterior para elemento PARADO:** o espelho de leitura anterior apontava para `_SUP_158/C00_Governanca_Estrutural/01_Dominio/modulos/MOD-C00-01_INFRAESTRUTURA_CORE`, elemento arquivado no card #158 (sem lastro em nenhuma ref do repo). O endereco acima NAO e uma renomeacao daquele: foi derivado da declaracao do artefato na Planta (medido em `MAPA_ARTEFATO_ENDERECO_162.md`).
- **Nada foi corrigido no artefato:** o gerador nao altera codigo de produto; o arquivo de origem permanece byte a byte como estava.

## Última verificação (data/commit)

- 2026-09-13T21:45:06-03:00 · commit `fbb0608` · sha256 da origem (LF): `1309998f2067be50b3f7cff6aa3562e6c0a50847be479b725e08d052ada3af65`
- Reexecutar: `node scripts/downplant/espelho-rico.mjs gerar --endereco-ausente "o artefato nao e declarado como artefato fisico em NENHUM endereco da Planta (varredura de 02_Comodos: secoes "Artefatos", tabelas de artefatos e mencoes no diretorio do endereco). O espelho anterior apontava para `_SUP_158/C00_Governanca_Estrutural/01_Dominio/modulos/MOD-C00-01_INFRAESTRUTURA_CORE`, elemento PARADO (arquivado no #158, sem lastro em nenhuma ref do repo). REPORTADO, nao inventado — ver MAPA_ARTEFATO_ENDERECO_162.md." --origem Core/Logger.js --saida <caminho>`
- Verificar deriva sem regravar: `node scripts/downplant/espelho-rico.mjs verificar --espelho <caminho>`
