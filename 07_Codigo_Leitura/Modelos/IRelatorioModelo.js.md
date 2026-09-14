# ESPELHO — IRelatorioModelo.js

> [!NOTE] Espelho rico de código (Metodo §46.15) — gerado por `scripts/downplant/espelho-rico.mjs`
> Somente leitura. Não editar à mão: qualquer edição é sobrescrita na próxima geração.
> O código abaixo é cópia verbatim do arquivo de origem no commit declarado; divergência entre o embutido e a origem é deriva (§18.1).
> Regra do sha256 declarado: sha256 do conteúdo **normalizado para LF** (igual ao blob do Git). Em arquivo CRLF com terminador final diferente, ele difere do `sha256sum` dos bytes crus — a comparação de deriva é feita conteúdo-contra-conteúdo.
> Papel desta cópia: CANÔNICA (repositório). O derivado navegável no vault é gerado com as mesmas entradas.

- **Endereço Down Plant:** `NÃO RESOLVIDO` — o artefato nao e declarado como artefato fisico em NENHUM endereco da Planta (varredura de 02_Comodos: secoes "Artefatos", tabelas de artefatos e mencoes no diretorio do endereco). O espelho anterior nao declarava endereco utilizavel. REPORTADO, nao inventado — ver MAPA_ARTEFATO_ENDERECO_162.md.
- Sem link de endereço: não existe elemento da Planta a linkar (não inventado). Ver `MAPA_ARTEFATO_ENDERECO_162.md`.
- **Arquivo de origem (link para o disco):** [`Modelos/IRelatorioModelo.js`](../../Modelos/IRelatorioModelo.js)
- **Commit de referência:** `fbb0608e7b98144533628c7f9b773a10505b800d` (`fbb0608`)
- **Data da última sincronização:** 2026-09-13T21:45:36-03:00

## Código-fonte embutido

Verbatim de `Modelos/IRelatorioModelo.js` em `fbb0608`. sha256 do bloco (LF): `8533a6bcf83486bf77ca29fd1a3cfd78fa782110dcdc6eea64c2146c3fc67c02` — 25 linhas.

```javascript
/**
 * ARQUIVO: Modelos/IRelatorioModelo.js
 * PILAR 4: Modelos de Relatório (A Estrutura Lógica)
 * DESCRIÇÃO: Interface base para todos os relatórios da Central Analítica.
 * Define o contrato de formatação, agrupamento e ordenação, tirando essa 
 * responsabilidade do orquestrador (Feature).
 */

class IRelatorioModelo {
  obterTitulo() {
    throw new Error("Método 'obterTitulo()' deve ser implementado.");
  }

  obterColunas() {
    throw new Error("Método 'obterColunas()' deve ser implementado.");
  }

  ordenarDados(registrosAnaliticos) {
    throw new Error("Método 'ordenarDados(registrosAnaliticos)' deve ser implementado.");
  }

  formatarLinha(registroAnalitico) {
    throw new Error("Método 'formatarLinha(registroAnalitico)' deve ser implementado.");
  }
}
```

## Responsabilidade observada

- _(sem NOTA_DE_RESPONSABILIDADE.md no endereço: responsabilidade não derivável)_
## Portas expostas (se aplicável)

- Superfície exposta no nível do arquivo (nível global): `IRelatorioModelo`
- Membros públicos observados: `obterTitulo`, `obterColunas`, `ordenarDados`, `formatarLinha`

_Extraído por heurística do gerador (globais de nível arquivo + métodos/accessors de 1º–2º nível). Não substitui a declaração de porta da Planta: confirme no endereço acima._

## Divergência com a Planta declarada

Testes mecânicos executados na geração (commit `fbb0608`, 2026-09-13T21:45:36-03:00):

- OK — T3 arquivo presente no commit de referencia (fbb0608:Modelos/IRelatorioModelo.js)
- OK — T4 conteudo em disco identico ao do commit de referencia (sha256 LF)
- OK — T5 espelho anterior sem deriva de codigo (sha256 do bloco == origem)
- OK — T7 sem duplicidade: exatamente 1 espelho de leitura declara "Modelos/IRelatorioModelo.js" como origem
- **ACHADO** — T1 endereco NAO RESOLVIDO no Down Plant canonico: o artefato nao e declarado como artefato fisico em NENHUM endereco da Planta (varredura de 02_Comodos: secoes "Artefatos", tabelas de artefatos e mencoes no diretorio do endereco). O espelho anterior nao declarava endereco utilizavel. REPORTADO, nao inventado — ver MAPA_ARTEFATO_ENDERECO_162.md. (registrado em MAPA_ARTEFATO_ENDERECO_162.md — REPORTADO, nao inventado)
- **ACHADO** — T2 declaracao do artefato nao verificavel: sem endereco canonico nao ha Planta contra a qual conferir "Modelos/IRelatorioModelo.js"

Veredito mecânico: **2 divergência(s) detectada(s) pelos testes acima**.

Declaração verificada a mão por humano/agente (não derivável automaticamente):

- **Como o endereco foi derivado (nao inventado):** sem derivacao.
- **Nada foi corrigido no artefato:** o gerador nao altera codigo de produto; o arquivo de origem permanece byte a byte como estava.

## Última verificação (data/commit)

- 2026-09-13T21:45:36-03:00 · commit `fbb0608` · sha256 da origem (LF): `8533a6bcf83486bf77ca29fd1a3cfd78fa782110dcdc6eea64c2146c3fc67c02`
- Reexecutar: `node scripts/downplant/espelho-rico.mjs gerar --endereco-ausente "o artefato nao e declarado como artefato fisico em NENHUM endereco da Planta (varredura de 02_Comodos: secoes "Artefatos", tabelas de artefatos e mencoes no diretorio do endereco). O espelho anterior nao declarava endereco utilizavel. REPORTADO, nao inventado — ver MAPA_ARTEFATO_ENDERECO_162.md." --origem Modelos/IRelatorioModelo.js --saida <caminho>`
- Verificar deriva sem regravar: `node scripts/downplant/espelho-rico.mjs verificar --espelho <caminho>`
