# ESPELHO — RendererTabela.js

> [!NOTE] Espelho rico de código (Metodo §46.15) — gerado por `scripts/downplant/espelho-rico.mjs`
> Somente leitura. Não editar à mão: qualquer edição é sobrescrita na próxima geração.
> O código abaixo é cópia verbatim do arquivo de origem no commit declarado; divergência entre o embutido e a origem é deriva (§18.1).
> Regra do sha256 declarado: sha256 do conteúdo **normalizado para LF** (igual ao blob do Git). Em arquivo CRLF com terminador final diferente, ele difere do `sha256sum` dos bytes crus — a comparação de deriva é feita conteúdo-contra-conteúdo.
> Papel desta cópia: CANÔNICA (repositório). O derivado navegável no vault é gerado com as mesmas entradas.

- **Endereço Down Plant:** `C06_Relatorios / MOD-C06-01_RELATORIOS_OFICIAIS` — [NOTA_DE_RESPONSABILIDADE.md](../../02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-01_RELATORIOS_OFICIAIS/NOTA_DE_RESPONSABILIDADE.md)
- **Arquivo de origem (link para o disco):** [`Render/RendererTabela.js`](../../Render/RendererTabela.js)
- **Commit de referência:** `fbb0608e7b98144533628c7f9b773a10505b800d` (`fbb0608`)
- **Data da última sincronização:** 2026-09-13T21:45:55-03:00

## Código-fonte embutido

Verbatim de `Render/RendererTabela.js` em `fbb0608`. sha256 do bloco (LF): `5049cf5f3c60b6f746bc38b9e15240ef9e01b17668ff00d9cb1d945131308569` — 74 linhas.

```javascript
/**
 * ARQUIVO: Render/RendererTabela.js
 * @deprecated Mantido apenas para fluxos legados de produtividade V1.
 * Prefira renderizadores específicos como RendererComparativo2026.
 * DESCRIÇÃO: Renderizador genérico de tabelas com bloco de metadados.
 * Totalmente isolado das regras de negócio do aplicativo.
 */
const RendererTabela = {
  /**
   * Renderiza os dados em uma aba destino, criando-a ou limpando-a.
   * @param {SpreadsheetApp.Spreadsheet} ss - A planilha ativa.
   * @param {string} nomeAba - Nome da aba de destino.
   * @param {Array<string>} cabecalho - Array com os nomes das colunas.
   * @param {Array<Array<any>>} dados - Matriz 2D com os dados a renderizar.
   * @param {Object} metadata - Objeto com informações do relatório.
   */
  render(ss, nomeAba, cabecalho, dados, metadata) {
    let sheet = ss.getSheetByName(nomeAba);
    if (!sheet) {
      sheet = ss.insertSheet(nomeAba);
    } else {
      sheet.clear();
      // Remove filtros anteriores, se houver
      if (sheet.getFilter()) {
        sheet.getFilter().remove();
      }
    }

    const { titulo, periodo, abasLidas, policiais, ocorrencias, atualizado, tempo } = metadata;

    // Linhas de Metadados
    const linhasMeta = [
      [titulo || "RELATÓRIO CONSOLIDADO", ""],
      ["Período:", periodo || "-"],
      ["Abas lidas:", abasLidas || 0],
      ["Policiais:", policiais || 0],
      ["Ocorrências:", ocorrencias || 0],
      ["Atualizado:", atualizado || ""],
      ["Tempo:", tempo || ""]
    ];

    sheet.getRange(1, 1, linhasMeta.length, 2).setValues(linhasMeta);
    sheet.getRange(1, 1, 1, 2).setFontWeight("bold").setBackground("#073763").setFontColor("#ffffff");
    sheet.getRange(2, 1, linhasMeta.length - 1, 1).setFontWeight("bold");

    // Espaçamento
    const rowCabecalho = linhasMeta.length + 2;
    
    // Escrever Cabeçalho
    if (cabecalho && cabecalho.length > 0) {
      const rangeCabecalho = sheet.getRange(rowCabecalho, 1, 1, cabecalho.length);
      rangeCabecalho.setValues([cabecalho]);
      rangeCabecalho.setFontWeight("bold")
                    .setBackground("#073763")
                    .setFontColor("#ffffff")
                    .setHorizontalAlignment("center");
    }

    // Escrever Dados
    if (dados && dados.length > 0) {
      const colLength = cabecalho.length > 0 ? cabecalho.length : dados[0].length;
      const rangeDados = sheet.getRange(rowCabecalho + 1, 1, dados.length, colLength);
      rangeDados.setValues(dados);
      
      // Auto-resize
      sheet.autoResizeColumns(1, colLength);
      
      // Filtros
      if (cabecalho.length > 0) {
        sheet.getRange(rowCabecalho, 1, dados.length + 1, cabecalho.length).createFilter();
      }
    }
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

- Superfície exposta no nível do arquivo (nível global): `RendererTabela`
- Membros públicos observados: `render`

_Extraído por heurística do gerador (globais de nível arquivo + métodos/accessors de 1º–2º nível). Não substitui a declaração de porta da Planta: confirme no endereço acima._

## Divergência com a Planta declarada

Testes mecânicos executados na geração (commit `fbb0608`, 2026-09-13T21:45:55-03:00):

- OK — T1 endereco existe: NOTA_DE_RESPONSABILIDADE.md do modulo presente
- OK — T3 arquivo presente no commit de referencia (fbb0608:Render/RendererTabela.js)
- OK — T4 conteudo em disco identico ao do commit de referencia (sha256 LF)
- OK — T5 espelho anterior sem deriva de codigo (sha256 do bloco == origem)
- OK — T6 endereco declarado no espelho anterior corresponde ao endereco canonico atual
- OK — T7 sem duplicidade: exatamente 1 espelho de leitura declara "Render/RendererTabela.js" como origem
- **ACHADO** — T2 artefato NAO declarado no endereco: "Render/RendererTabela.js" nao aparece nas NOTAS/capsula de C06_Relatorios / MOD-C06-01_RELATORIOS_OFICIAIS

Veredito mecânico: **1 divergência(s) detectada(s) pelos testes acima**.

Declaração verificada a mão por humano/agente (não derivável automaticamente):

- **Como o endereco foi derivado (nao inventado):** menção em arquivo do próprio endereço; fonte `02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-01_RELATORIOS_OFICIAIS/CIR-MOD-C06-01_RELATORIOS_OFICIAIS.canvas`.
- **Nada foi corrigido no artefato:** o gerador nao altera codigo de produto; o arquivo de origem permanece byte a byte como estava.

## Última verificação (data/commit)

- 2026-09-13T21:45:55-03:00 · commit `fbb0608` · sha256 da origem (LF): `5049cf5f3c60b6f746bc38b9e15240ef9e01b17668ff00d9cb1d945131308569`
- Reexecutar: `node scripts/downplant/espelho-rico.mjs gerar --endereco C06_Relatorios/MOD-C06-01_RELATORIOS_OFICIAIS --origem Render/RendererTabela.js --saida <caminho>`
- Verificar deriva sem regravar: `node scripts/downplant/espelho-rico.mjs verificar --espelho <caminho>`
