# ESPELHO — ProdutividadeSchema.js

> [!NOTE] Espelho rico de código (Metodo §46.15) — gerado por `scripts/downplant/espelho-rico.mjs`
> Somente leitura. Não editar à mão: qualquer edição é sobrescrita na próxima geração.
> O código abaixo é cópia verbatim do arquivo de origem no commit declarado; divergência entre o embutido e a origem é deriva (§18.1).
> Regra do sha256 declarado: sha256 do conteúdo **normalizado para LF** (igual ao blob do Git). Em arquivo CRLF com terminador final diferente, ele difere do `sha256sum` dos bytes crus — a comparação de deriva é feita conteúdo-contra-conteúdo.
> Papel desta cópia: CANÔNICA (repositório). O derivado navegável no vault é gerado com as mesmas entradas.

- **Endereço Down Plant:** `NÃO RESOLVIDO` — o artefato nao e declarado como artefato fisico em NENHUM endereco da Planta (varredura de 02_Comodos: secoes "Artefatos", tabelas de artefatos e mencoes no diretorio do endereco). O espelho anterior nao declarava endereco utilizavel. REPORTADO, nao inventado — ver MAPA_ARTEFATO_ENDERECO_162.md.
- Sem link de endereço: não existe elemento da Planta a linkar (não inventado). Ver `MAPA_ARTEFATO_ENDERECO_162.md`.
- **Arquivo de origem (link para o disco):** [`Schemas/ProdutividadeSchema.js`](../../Schemas/ProdutividadeSchema.js)
- **Commit de referência:** `fbb0608e7b98144533628c7f9b773a10505b800d` (`fbb0608`)
- **Data da última sincronização:** 2026-09-13T21:45:56-03:00

## Código-fonte embutido

Verbatim de `Schemas/ProdutividadeSchema.js` em `fbb0608`. sha256 do bloco (LF): `c1cddb36ca7b57cb8e7144f7cefb4f087005f269e2bc6a49535b79433501aa7b` — 56 linhas.

```javascript
/**
 * ARQUIVO: Schemas/ProdutividadeSchema.js
 * DESCRIÇÃO: Define a estrutura, cabeçalhos e formatação do relatório de produtividade
 */
const ProdutividadeSchema = {
  HEADERS: [
    "MATRÍCULA",
    "NOME",
    "GRADUAÇÃO",
    "PELOTÃO",
    "QTD O",
    "QTD BOE",
    "PONTUAÇÃO",
    "MÉDIA PONTOS/O",
    "ARMAS",
    "ARMAS/O",
    "MACONHA (G)",
    "CRACK (G)",
    "COCAÍNA (G)",
    "TOTAL DROGAS",
    "DROGAS/O",
    "DETIDOS"
  ],

  getHeaders() {
    return this.HEADERS;
  },
  
  /**
   * Converte o RegistroAnalítico para o array ordenado conforme HEADERS
   */
  extrairLinha(registro) {
    return [
      registro.matricula,
      registro.nome,
      registro.grad,
      registro.pelotao,
      registro.fatos.ocorrencias,
      registro.fatos.qtdBoe,
      registro.indicadores.pontosTotais,
      registro.mediaPontos,
      registro.fatos.armas,
      registro.mediaArmas,
      registro.fatos.maconha,
      registro.fatos.crack,
      registro.fatos.cocaina,
      registro.fatos.drogasTotal,
      registro.mediaDrogas,
      registro.fatos.detidos
    ];
  },

  formatarLinha(registro) {
    return this.extrairLinha(registro);
  }
};
```

## Responsabilidade observada

- _(sem NOTA_DE_RESPONSABILIDADE.md no endereço: responsabilidade não derivável)_
## Portas expostas (se aplicável)

- Superfície exposta no nível do arquivo (nível global): `ProdutividadeSchema`
- Membros públicos observados: `getHeaders`, `extrairLinha`, `formatarLinha`

_Extraído por heurística do gerador (globais de nível arquivo + métodos/accessors de 1º–2º nível). Não substitui a declaração de porta da Planta: confirme no endereço acima._

## Divergência com a Planta declarada

Testes mecânicos executados na geração (commit `fbb0608`, 2026-09-13T21:45:56-03:00):

- OK — T3 arquivo presente no commit de referencia (fbb0608:Schemas/ProdutividadeSchema.js)
- OK — T4 conteudo em disco identico ao do commit de referencia (sha256 LF)
- OK — T5 espelho anterior sem deriva de codigo (sha256 do bloco == origem)
- OK — T7 sem duplicidade: exatamente 1 espelho de leitura declara "Schemas/ProdutividadeSchema.js" como origem
- **ACHADO** — T1 endereco NAO RESOLVIDO no Down Plant canonico: o artefato nao e declarado como artefato fisico em NENHUM endereco da Planta (varredura de 02_Comodos: secoes "Artefatos", tabelas de artefatos e mencoes no diretorio do endereco). O espelho anterior nao declarava endereco utilizavel. REPORTADO, nao inventado — ver MAPA_ARTEFATO_ENDERECO_162.md. (registrado em MAPA_ARTEFATO_ENDERECO_162.md — REPORTADO, nao inventado)
- **ACHADO** — T2 declaracao do artefato nao verificavel: sem endereco canonico nao ha Planta contra a qual conferir "Schemas/ProdutividadeSchema.js"

Veredito mecânico: **2 divergência(s) detectada(s) pelos testes acima**.

Declaração verificada a mão por humano/agente (não derivável automaticamente):

- **Como o endereco foi derivado (nao inventado):** sem derivacao.
- **Nada foi corrigido no artefato:** o gerador nao altera codigo de produto; o arquivo de origem permanece byte a byte como estava.

## Última verificação (data/commit)

- 2026-09-13T21:45:56-03:00 · commit `fbb0608` · sha256 da origem (LF): `c1cddb36ca7b57cb8e7144f7cefb4f087005f269e2bc6a49535b79433501aa7b`
- Reexecutar: `node scripts/downplant/espelho-rico.mjs gerar --endereco-ausente "o artefato nao e declarado como artefato fisico em NENHUM endereco da Planta (varredura de 02_Comodos: secoes "Artefatos", tabelas de artefatos e mencoes no diretorio do endereco). O espelho anterior nao declarava endereco utilizavel. REPORTADO, nao inventado — ver MAPA_ARTEFATO_ENDERECO_162.md." --origem Schemas/ProdutividadeSchema.js --saida <caminho>`
- Verificar deriva sem regravar: `node scripts/downplant/espelho-rico.mjs verificar --espelho <caminho>`
