# ESPELHO — ProdutividadeSchema.js

> [!NOTE] Espelho rico de código (Metodo §46.15) — gerado por `scripts/downplant/espelho-rico.mjs`
> Somente leitura. Não editar à mão: qualquer edição é sobrescrita na próxima geração.
> O código abaixo é cópia verbatim do arquivo de origem no commit declarado; divergência entre o embutido e a origem é deriva (§18.1).
> Regra do sha256 declarado: sha256 do conteúdo **normalizado para LF** (igual ao blob do Git). Em arquivo CRLF com terminador final diferente, ele difere do `sha256sum` dos bytes crus — a comparação de deriva é feita conteúdo-contra-conteúdo.
> Papel desta cópia: CANÔNICA (repositório). O derivado navegável no vault é gerado com as mesmas entradas.

- **Endereço Down Plant:** `C06_Relatorios / MOD-C06-01_RELATORIOS_OFICIAIS` — [NOTA_DE_RESPONSABILIDADE.md](../../02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-01_RELATORIOS_OFICIAIS/NOTA_DE_RESPONSABILIDADE.md)
- **Arquivo de origem (link para o disco):** [`Schemas/ProdutividadeSchema.js`](../../Schemas/ProdutividadeSchema.js)
- **Commit de referência:** `fbb0608e7b98144533628c7f9b773a10505b800d` (`fbb0608`)
- **Data da última sincronização:** 2026-09-13T22:05:10-03:00

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

Fonte: `02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-01_RELATORIOS_OFICIAIS/MOD-C06-01_RELATORIOS_OFICIAIS.md` — CAPSULA do modulo (formato 46.2), "## Responsabilidade".

Gerar e publicar os **relatorios oficiais** do produto - em especial o `COMPARATIVO_2026` (produtividade
consolidada por policial) - a partir dos fatos canonicos, com renderizacao propria.

Fonte: `02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-01_RELATORIOS_OFICIAIS/MOD-C06-01_RELATORIOS_OFICIAIS.md` — CAPSULA do modulo (formato 46.2), "## Limites".

- **Nao decide regra de dominio:** consome o que o C04 consolidou e o que a ARCA declara.
- **Nao corrige a fonte:** quando o valor publicado diverge, o defeito e rastreado ate a origem
  (o #152 separa "defeito do produto" de "defeito da entrada").
- **Nao inventa valor:** a ordem de entrega de armas segue a regra do proprietario (score desc, empate por
  antiguidade - R10) e a divergencia fica **registrada**, nao resolvida por conveniencia.

## Portas expostas (se aplicável)

- Superfície exposta no nível do arquivo (nível global): `ProdutividadeSchema`
- Membros públicos observados: `getHeaders`, `extrairLinha`, `formatarLinha`

_Extraído por heurística do gerador (globais de nível arquivo + métodos/accessors de 1º–2º nível). Não substitui a declaração de porta da Planta: confirme no endereço acima._

## Divergência com a Planta declarada

Testes mecânicos executados na geração (commit `fbb0608`, 2026-09-13T22:05:10-03:00):

- OK — T1 endereco existe: NOTA_DE_RESPONSABILIDADE.md do modulo presente
- OK — T2 artefato declarado no endereco: "Schemas/ProdutividadeSchema.js" aparece na Planta
- OK — T3 arquivo presente no commit de referencia (fbb0608:Schemas/ProdutividadeSchema.js)
- OK — T4 conteudo em disco identico ao do commit de referencia (sha256 LF)
- OK — T5 espelho anterior sem deriva de codigo (sha256 do bloco == origem)
- OK — T6 endereco declarado no espelho anterior corresponde ao endereco canonico atual
- OK — T7 sem duplicidade: exatamente 1 espelho de leitura declara "Schemas/ProdutividadeSchema.js" como origem

Veredito mecânico: **nenhuma divergência detectada pelos testes acima**.

Declaração verificada a mão por humano/agente (não derivável automaticamente):

- **Como o endereco foi derivado (nao inventado):** declaracao de artefato na secao "## Artefatos" da capsula §46.2 do endereco `C06_Relatorios / MOD-C06-01_RELATORIOS_OFICIAIS` (linha 61 de `02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-01_RELATORIOS_OFICIAIS/MOD-C06-01_RELATORIOS_OFICIAIS.md`) — nivel 1 do MAPA_ARTEFATO_ENDERECO_162.md. O par interface+schema serve ao modelo `Modelos/ModeloProdutividade.js`, que ja era declarado neste endereco pelo circuito `CIR-MOD-C06-01_RELATORIOS_OFICIAIS.canvas`.
- **Ponteiro anterior:** nenhum endereco utilizavel. A Planta so mencionava o schema como plano futuro no indice do comodo C01_Entrada (`00_Visao_Do_Comodo/INDICE.md`), que nao e endereco de modulo/submodulo.
- **Nada foi corrigido no artefato:** o gerador nao altera codigo de produto; o arquivo de origem permanece byte a byte como estava.

## Última verificação (data/commit)

- 2026-09-13T22:05:10-03:00 · commit `fbb0608` · sha256 da origem (LF): `c1cddb36ca7b57cb8e7144f7cefb4f087005f269e2bc6a49535b79433501aa7b`
- Reexecutar: `node scripts/downplant/espelho-rico.mjs gerar --endereco C06_Relatorios/MOD-C06-01_RELATORIOS_OFICIAIS --origem Schemas/ProdutividadeSchema.js --saida <caminho>`
- Verificar deriva sem regravar: `node scripts/downplant/espelho-rico.mjs verificar --espelho <caminho>`
