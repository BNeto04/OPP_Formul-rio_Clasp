# ESPELHO — RendererAuditoria.js

> [!NOTE] Espelho rico de código (Metodo §46.15) — gerado por `scripts/downplant/espelho-rico.mjs`
> Somente leitura. Não editar à mão: qualquer edição é sobrescrita na próxima geração.
> O código abaixo é cópia verbatim do arquivo de origem no commit declarado; divergência entre o embutido e a origem é deriva (§18.1).
> Regra do sha256 declarado: sha256 do conteúdo **normalizado para LF** (igual ao blob do Git). Em arquivo CRLF com terminador final diferente, ele difere do `sha256sum` dos bytes crus — a comparação de deriva é feita conteúdo-contra-conteúdo.
> Papel desta cópia: CANÔNICA (repositório). O derivado navegável no vault é gerado com as mesmas entradas.

- **Endereço Down Plant:** `C05_Guardiao / MOD-C05-01_GUARDIAO_DE_QUALIDADE` — [NOTA_DE_RESPONSABILIDADE.md](../../02_Comodos/C05_Guardiao/01_Dominio/modulos/MOD-C05-01_GUARDIAO_DE_QUALIDADE/NOTA_DE_RESPONSABILIDADE.md)
- **Arquivo de origem (link para o disco):** [`Render/RendererAuditoria.js`](../../Render/RendererAuditoria.js)
- **Commit de referência:** `fbb0608e7b98144533628c7f9b773a10505b800d` (`fbb0608`)
- **Data da última sincronização:** 2026-09-13T21:45:49-03:00

## Código-fonte embutido

Verbatim de `Render/RendererAuditoria.js` em `fbb0608`. sha256 do bloco (LF): `06b95fce61923acec7ea01b4bdf535a6e6e973cdb2235c61ef01be96eda3225e` — 65 linhas.

```javascript
/**
 * ARQUIVO: Render/RendererAuditoria.js
 * RESPONSABILIDADE: Materializar logs de auditoria em abas do Google Sheets.
 */
const RendererAuditoria = {
  render(ss, logger, nomeAbaLog, nomeAbaResultado) {
    let sheet = ss.getSheetByName(nomeAbaLog);
    if (!sheet) {
      sheet = ss.insertSheet(nomeAbaLog);
    }
    sheet.clear();

    const linhas = RendererAuditoria.montarLinhas(logger, nomeAbaResultado);
    sheet.getRange(1, 1, linhas.length, 2).setValues(linhas);

    const cores = (typeof CONFIG_SYNTHEON !== 'undefined' && CONFIG_SYNTHEON.RELATORIOS)
      ? CONFIG_SYNTHEON.RELATORIOS
      : {};

    sheet.getRange(1, 1, 1, 2)
      .setFontWeight('bold')
      .setBackground(cores.CABECALHO_BG || '#073763')
      .setFontColor(cores.CABECALHO_TXT || '#ffffff');
    sheet.autoResizeColumns(1, 2);
  },

  montarLinhas(logger, nomeAbaResultado) {
    const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss');
    const linhas = [
      [`RELATORIO DE AUDITORIA E LOG - ${logger.modo}`, ''],
      ['Aba de Resultado Gerada:', nomeAbaResultado],
      ['Data/Hora de Geracao:', timestamp],
      ['Tempo de Processamento:', `${logger.getTempoExecucaoSegundos()} segundos`],
      ['', ''],
      ['ESTATISTICAS DO FLUXO', ''],
      ['Abas Varridas:', logger.abasLidas.join(', ') || 'Nenhuma'],
      ['Total de Linhas Lidas:', logger.linhasLidas],
      ['Linhas Consideradas Validas:', logger.linhasValidas],
      ['Linhas Ignoradas (Filtro/Formato):', logger.linhasIgnoradas],
      ['Duplicidades Eliminadas:', logger.duplicidades],
      ['Policiais Unicos consolidados:', logger.policiaisUnicos],
      ['Ocorrencias Unicas identificadas:', logger.ocorrenciasUnicas],
      ['Membros nao cadastrados no EFETIVO:', logger.matriculasNaoEncontradas.size],
      ['', ''],
      ['MATRICULAS NAO LOCALIZADAS NO EFETIVO', '']
    ];

    logger.matriculasNaoEncontradas.forEach(mat => {
      linhas.push([mat, '']);
    });

    linhas.push(['', '']);
    linhas.push(['AVISOS E INCONSISTENCIAS IDENTIFICADAS', '']);

    if (logger.avisos.length === 0) {
      linhas.push(['Sem alertas de integridade de dados.', '']);
    } else {
      logger.avisos.forEach(aviso => {
        linhas.push(['-', aviso]);
      });
    }

    return linhas.map(row => row.length === 1 ? [row[0], ''] : row);
  }
};
```

## Responsabilidade observada

Fonte: `02_Comodos/C05_Guardiao/01_Dominio/modulos/MOD-C05-01_GUARDIAO_DE_QUALIDADE/MOD-C05-01_GUARDIAO_DE_QUALIDADE.md` — CAPSULA do modulo (formato 46.2), "## Responsabilidade".

Fazer a **varredura estatica de integridade** das abas mensais: detectar, classificar e explicar incoerencias
com diagnosticos estruturados, **sem alterar dado operacional**, e publicar o resultado nas abas
`[AUDITORIA] Ocorrencias` e `[HISTORICO] Auditoria Ocorrencias`. E quem **audita**, nao quem corrige.

Fonte: `02_Comodos/C05_Guardiao/01_Dominio/modulos/MOD-C05-01_GUARDIAO_DE_QUALIDADE/MOD-C05-01_GUARDIAO_DE_QUALIDADE.md` — CAPSULA do modulo (formato 46.2), "## Limites".

- **Nao altera dado operacional** - nem colunas A:AL, nem formula: somente leitura + escrita nas abas de auditoria
  e no destaque da coluna **AM** (39).
- **Nao corrige:** corrigir e do modulo irmao `MOD-C05-02_NORMALIZADOR_DE_ABA` (via plano explicito).
- **Nao promove heuristica a regra:** o que a ARCA nao mapeia aparece como `NAO_AUDITAVEL`, nao como lei.
- **Nao se audita** (Governanca fora da propria auditoria) e a auditoria e **fail-closed** - nao passa sem.

## Portas expostas (se aplicável)

- Superfície exposta no nível do arquivo (nível global): `RendererAuditoria`
- Membros públicos observados: `render`, `montarLinhas`

_Extraído por heurística do gerador (globais de nível arquivo + métodos/accessors de 1º–2º nível). Não substitui a declaração de porta da Planta: confirme no endereço acima._

## Divergência com a Planta declarada

Testes mecânicos executados na geração (commit `fbb0608`, 2026-09-13T21:45:49-03:00):

- OK — T1 endereco existe: NOTA_DE_RESPONSABILIDADE.md do modulo presente
- OK — T2 artefato declarado no endereco: "Render/RendererAuditoria.js" aparece na Planta
- OK — T3 arquivo presente no commit de referencia (fbb0608:Render/RendererAuditoria.js)
- OK — T4 conteudo em disco identico ao do commit de referencia (sha256 LF)
- OK — T5 espelho anterior sem deriva de codigo (sha256 do bloco == origem)
- OK — T6 endereco declarado no espelho anterior corresponde ao endereco canonico atual
- OK — T7 sem duplicidade: exatamente 1 espelho de leitura declara "Render/RendererAuditoria.js" como origem

Veredito mecânico: **nenhuma divergência detectada pelos testes acima**.

Declaração verificada a mão por humano/agente (não derivável automaticamente):

- **Como o endereco foi derivado (nao inventado):** secao Artefatos; fonte `02_Comodos/C05_Guardiao/01_Dominio/modulos/MOD-C05-01_GUARDIAO_DE_QUALIDADE/MOD-C05-01_GUARDIAO_DE_QUALIDADE.md`:63.
- **Enderecos concorrentes declarados na Planta (1):** `C06_Relatorios/MOD-C06-01_RELATORIOS_OFICIAIS`. O artefato e referenciado em mais de um endereco; o campo acima registra o endereco PRIMARIO. Nao e erro de endereco — e declaracao concorrente na propria Planta.
- **Divergencia com o espelho anterior:** o espelho antigo declarava o modulo `MOD-C06-01_RELATORIOS_OFICIAIS`; a derivacao atual chega a `C05_Guardiao/MOD-C05-01_GUARDIAO_DE_QUALIDADE`. Divergencia declarada, nao sobrescrita em silencio.
- **Nada foi corrigido no artefato:** o gerador nao altera codigo de produto; o arquivo de origem permanece byte a byte como estava.

## Última verificação (data/commit)

- 2026-09-13T21:45:49-03:00 · commit `fbb0608` · sha256 da origem (LF): `06b95fce61923acec7ea01b4bdf535a6e6e973cdb2235c61ef01be96eda3225e`
- Reexecutar: `node scripts/downplant/espelho-rico.mjs gerar --endereco C05_Guardiao/MOD-C05-01_GUARDIAO_DE_QUALIDADE --origem Render/RendererAuditoria.js --saida <caminho>`
- Verificar deriva sem regravar: `node scripts/downplant/espelho-rico.mjs verificar --espelho <caminho>`
