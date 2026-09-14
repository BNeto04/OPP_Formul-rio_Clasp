# ESPELHO — CompiladorProdutividade.js

> [!NOTE] Espelho rico de código (Metodo §46.15) — gerado por `scripts/downplant/espelho-rico.mjs`
> Somente leitura. Não editar à mão: qualquer edição é sobrescrita na próxima geração.
> O código abaixo é cópia verbatim do arquivo de origem no commit declarado; divergência entre o embutido e a origem é deriva (§18.1).
> Regra do sha256 declarado: sha256 do conteúdo **normalizado para LF** (igual ao blob do Git). Em arquivo CRLF com terminador final diferente, ele difere do `sha256sum` dos bytes crus — a comparação de deriva é feita conteúdo-contra-conteúdo.
> Papel desta cópia: CANÔNICA (repositório). O derivado navegável no vault é gerado com as mesmas entradas.

- **Endereço Down Plant:** `C06_Relatorios / MOD-C06-01_RELATORIOS_OFICIAIS` — [NOTA_DE_RESPONSABILIDADE.md](../../02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-01_RELATORIOS_OFICIAIS/NOTA_DE_RESPONSABILIDADE.md)
- **Arquivo de origem (link para o disco):** [`Features/CompiladorProdutividade.js`](../../Features/CompiladorProdutividade.js)
- **Commit de referência:** `fbb0608e7b98144533628c7f9b773a10505b800d` (`fbb0608`)
- **Data da última sincronização:** 2026-09-13T21:45:31-03:00

## Código-fonte embutido

Verbatim de `Features/CompiladorProdutividade.js` em `fbb0608`. sha256 do bloco (LF): `e536db911698cdd184599b85c08dc405daa9c3511938aa753645391918b99acb` — 228 linhas.

```javascript
/**
 * ARQUIVO: Features/CompiladorProdutividade.js
 * DESCRIÇÃO: Orquestrador da consolidação de produtividade por policial.
 */

function compilarProdutividadeRapida() {
  iniciarCompiladorProdutividade(false);
}

function compilarProdutividadeAvancada() {
  iniciarCompiladorProdutividade(true);
}

function abrirMenuComparativo2026() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const meses = obterAbasComparativo2026(ss);

  if (meses.length === 0) {
    SpreadsheetApp.getUi().alert("Nenhuma aba de 2026 encontrada para gerar o comparativo.");
    return;
  }

  const opcoes = meses.map(nome => `
        <label class="mes">
          <input type="checkbox" name="mes" value="${nome}">
          <span>${nome}</span>
        </label>`).join('');

  const template = HtmlService.createTemplateFromFile('Entrada/DialogComparativo2026');
  template.opcoes = opcoes;
  const htmlOutput = template.evaluate().setWidth(420).setHeight(360);

  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Produtividade / Comparativo 2026');
}

function processarComparativo2026Selecionado(abasSelecionadas) {
  return gerarComparativo2026Premium(abasSelecionadas);
}

function gerarComparativo2026Premium(abasSelecionadas) {
  const inicioGlobal = Date.now();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const logger = new SyntheonLogger("COMPARATIVO_2026");
  const abas2026 = obterAbasComparativo2026(ss);
  const selecionadas = Array.isArray(abasSelecionadas) ? abasSelecionadas : abas2026;
  const mapaSelecionadas = {};
  selecionadas.forEach(nome => { mapaSelecionadas[String(nome).toUpperCase()] = true; });
  const abasAlvo = abas2026.filter(nome => mapaSelecionadas[nome]);

  if (abasAlvo.length === 0) {
    const uiVazio = _uiSeguraComparativo_();
    if (uiVazio) uiVazio.alert("Nenhuma aba de 2026 encontrada para gerar o comparativo.");
    return { sucesso: false, erro: 'Nenhuma aba de 2026 encontrada', abas: [] };
  }

  const ocorrencias = SyntheonLeitor.lerAbas(ss, abasAlvo, null, null, logger);
  const mapaProdutividade = SyntheonMetricas.consolidarPoliciais(ocorrencias);
  const arrayRegistros = montarRegistrosComparativo2026(ss, mapaProdutividade);

  const tempoSegundos = ((Date.now() - inicioGlobal) / 1000).toFixed(2);
  const fuso = typeof CONFIG_SYNTHEON !== 'undefined' ? CONFIG_SYNTHEON.FUSO_HORARIO : "America/Recife";
  const dataAtual = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || fuso, "dd/MM/yyyy HH:mm:ss");

  const metadata = {
    titulo: "COMPARATIVO 2026",
    periodo: abasAlvo.length > 0 ? `${abasAlvo[0]} ate ${abasAlvo[abasAlvo.length - 1]}` : "N/D",
    abasLidas: abasAlvo.length,
    policiais: arrayRegistros.length,
    ocorrencias: ocorrencias.length,
    atualizado: dataAtual,
    tempo: `${tempoSegundos} s`
  };

  RendererComparativo2026.render(ss, "COMPARATIVO_2026", arrayRegistros, metadata);
  logger.gravarPlanilha("LOG_COMPARATIVO_2026", "COMPARATIVO_2026");
  const uiFim = _uiSeguraComparativo_();
  if (uiFim) uiFim.alert(`Comparativo 2026 gerado em ${tempoSegundos}s!\nConsulte a aba COMPARATIVO_2026.`);
  return { sucesso: true, aba: 'COMPARATIVO_2026', abasLidas: abasAlvo.length,
           policiais: arrayRegistros.length, ocorrencias: ocorrencias.length, tempo: tempoSegundos + 's' };
}

/** UI opcional: em contexto headless (executionApi/trigger) nao existe UI interativa. */
function _uiSeguraComparativo_() {
  try {
    return (typeof SpreadsheetApp !== 'undefined' && SpreadsheetApp.getUi) ? SpreadsheetApp.getUi() : null;
  } catch (e) {
    return null;
  }
}

/** Porta headless (clasp run). Sem abas informadas = todas as abas mensais de 2026. */
function gerarComparativo2026Headless(abas) {
  const lista = (typeof abas === 'string')
    ? (abas ? abas.split(',').map(function (s) { return s.trim(); }).filter(Boolean) : [])
    : (abas || []);
  const r = gerarComparativo2026Premium(lista.length ? lista : null);
  return JSON.stringify(r || { sucesso: null, aviso: 'sem retorno' });
}

function obterAbasComparativo2026(ss) {
  const ordemMeses = ["JAN","FEV","MAR","ABR","MAI","JUN","JUL","AGO","SET","OUT","NOV","DEZ"];
  return ss.getSheets()
    .map(s => s.getName())
    .filter(nome => /^[A-Z]{3}2026$/.test(nome))
    .sort((a, b) => ordemMeses.indexOf(a.substring(0, 3)) - ordemMeses.indexOf(b.substring(0, 3)));
}

function montarRegistrosComparativo2026(ss, mapaProdutividade) {
  const efetivo = SyntheonPoliciais.carregarListaEfetivo(ss)
    .filter(policial => SyntheonUtils.normalizarTexto(policial.subunidadePeculio));
  const produtividadePorMatricula = {};

  Object.values(mapaProdutividade).forEach(reg => {
    const matricula = SyntheonUtils.limparMatricula(reg.matricula);
    if (matricula) produtividadePorMatricula[matricula] = reg;
  });

  return efetivo.map(policial => {
    const prod = produtividadePorMatricula[policial.matricula] || null;
    return montarRegistroComparativo2026(policial, prod);
  });

}

function montarRegistroComparativo2026(policial, produtividade) {
  const fatos = produtividade ? produtividade.fatos : {};
  const indicadores = produtividade ? produtividade.indicadores : {};

  return {
    matricula: policial.matricula,
    nome: policial.nomeGuerra || policial.nome || '',
    nomeCompleto: policial.nome || '',
    grad: policial.grad || (produtividade ? produtividade.grad : ''),
    pelotao: policial.pelotao || (produtividade ? produtividade.pelotao : ''),
    subunidadePeculio: policial.subunidadePeculio || '',
    fatos: {
      ocorrencias: fatos.ocorrencias || 0,
      qtdBoe: fatos.qtdBoe || 0,
      // #152: no COMPARATIVO (produtividade) a arma e a PARTICIPACAO, nao a apreensao fisica.
      armas: fatos.participacaoArmas || 0,
      maconha: fatos.maconha || 0,
      crack: fatos.crack || 0,
      cocaina: fatos.cocaina || 0,
      drogasTotal: fatos.drogasTotal || 0,
      detidos: fatos.detidos || 0
    },
    indicadores: {
      pontosTotais: indicadores.pontosTotais || 0,
      pontosPIP: indicadores.pontosPIP || 0,
      pontosCPM: indicadores.pontosCPM || 0
    }
  };
}

function iniciarCompiladorProdutividade(avancado) {
  const inicioGlobal = Date.now();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const logger = new SyntheonLogger("COMPILADOR_PRODUTIVIDADE");
  
  let abasAlvo = [];
  const todasAbas = ss.getSheets().map(s => s.getName());
  const regexMes = /^[A-Z]{3}\d{4}$/;
  
  if (avancado) {
    const ui = SpreadsheetApp.getUi();
    const prompt = ui.prompt(
      'Compilador Avançado',
      'Digite os meses que deseja compilar, separados por vírgula (Ex: JAN2026, FEV2026):',
      ui.ButtonSet.OK_CANCEL
    );
    
    if (prompt.getSelectedButton() !== ui.Button.OK) return;
    
    const digitadas = prompt.getResponseText().split(',').map(m => m.trim().toUpperCase());
    abasAlvo = digitadas.filter(m => {
      const existe = todasAbas.includes(m);
      if (!existe) logger.aviso(`Aba informada não existe na planilha: ${m}`);
      return existe;
    });
  } else {
    abasAlvo = todasAbas.filter(nome => regexMes.test(nome));
  }
  
  if (abasAlvo.length === 0) {
    SpreadsheetApp.getUi().alert("Nenhuma aba válida encontrada ou selecionada para compilação.");
    return;
  }

  // 1. Leitura
  const ocorrencias = SyntheonLeitor.lerAbas(ss, abasAlvo, null, null, logger);
  
  // 2. Métricas & Domínio
  const mapaProdutividade = SyntheonMetricas.consolidarPoliciais(ocorrencias);
  const arrayRegistros = Object.values(mapaProdutividade);
  
  // Ordenação dinâmica: Pontuação > Armas > Ocorrências > Nome
  arrayRegistros.sort((a, b) => {
    if (b.pontosTotais !== a.pontosTotais) return b.pontosTotais - a.pontosTotais;
    if (b.armas !== a.armas) return b.armas - a.armas;
    if (b.ocorrencias !== a.ocorrencias) return b.ocorrencias - a.ocorrencias;
    return a.nome.localeCompare(b.nome);
  });
  
  // Transformação (Schema)
  const dados = arrayRegistros.map(reg => ProdutividadeSchema.extrairLinha(reg));
  
  // Preparar Metadados
  const tempoSegundos = ((Date.now() - inicioGlobal) / 1000).toFixed(2);
  const fuso = typeof CONFIG_SYNTHEON !== 'undefined' ? CONFIG_SYNTHEON.FUSO_HORARIO : "America/Recife";
  const dataAtual = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || fuso, "dd/MM/yyyy HH:mm:ss");
  
  const metadata = {
    titulo: "PRODUTIVIDADE GERAL",
    periodo: abasAlvo.length > 0 ? `${abasAlvo[0]} até ${abasAlvo[abasAlvo.length - 1]}` : "N/D",
    abasLidas: abasAlvo.length,
    policiais: arrayRegistros.length,
    ocorrencias: ocorrencias.length,
    atualizado: dataAtual,
    tempo: `${tempoSegundos} s`
  };
  
  // 3. Renderização
  RendererTabela.render(ss, "PRODUTIVIDADE_GERAL", ProdutividadeSchema.HEADERS, dados, metadata);
  
  // Finalização (Log)
  logger.gravarPlanilha("LOG_PRODUTIVIDADE", "PRODUTIVIDADE_GERAL");
  SpreadsheetApp.getUi().alert(`Compilação finalizada em ${tempoSegundos}s!\nConsulte a aba PRODUTIVIDADE_GERAL.`);
}
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

- Superfície exposta no nível do arquivo (nível global): `compilarProdutividadeRapida`, `compilarProdutividadeAvancada`, `abrirMenuComparativo2026`, `processarComparativo2026Selecionado`, `gerarComparativo2026Premium`, `_uiSeguraComparativo_`, `gerarComparativo2026Headless`, `obterAbasComparativo2026`, `montarRegistrosComparativo2026`, `montarRegistroComparativo2026`, `iniciarCompiladorProdutividade`
- Membros públicos observados: `iniciarCompiladorProdutividade`

_Extraído por heurística do gerador (globais de nível arquivo + métodos/accessors de 1º–2º nível). Não substitui a declaração de porta da Planta: confirme no endereço acima._

## Divergência com a Planta declarada

Testes mecânicos executados na geração (commit `fbb0608`, 2026-09-13T21:45:31-03:00):

- OK — T1 endereco existe: NOTA_DE_RESPONSABILIDADE.md do modulo presente
- OK — T2 artefato declarado no endereco: "Features/CompiladorProdutividade.js" aparece na Planta
- OK — T3 arquivo presente no commit de referencia (fbb0608:Features/CompiladorProdutividade.js)
- OK — T4 conteudo em disco identico ao do commit de referencia (sha256 LF)
- OK — T5 espelho anterior sem deriva de codigo (sha256 do bloco == origem)
- OK — T6 endereco declarado no espelho anterior corresponde ao endereco canonico atual
- OK — T7 sem duplicidade: exatamente 1 espelho de leitura declara "Features/CompiladorProdutividade.js" como origem

Veredito mecânico: **nenhuma divergência detectada pelos testes acima**.

Declaração verificada a mão por humano/agente (não derivável automaticamente):

- **Como o endereco foi derivado (nao inventado):** secao Artefatos; fonte `02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-01_RELATORIOS_OFICIAIS/MOD-C06-01_RELATORIOS_OFICIAIS.md`:59.
- **Enderecos concorrentes declarados na Planta (2):** `C01_Entrada/MOD-C01-01_FORMULARIO_E_MENUS`, `C01_Entrada/MOD-C01-01_FORMULARIO_E_MENUS/SUB-C01-01-01_OCR_E_CONFERENCIA`. O artefato e referenciado em mais de um endereco; o campo acima registra o endereco PRIMARIO. Nao e erro de endereco — e declaracao concorrente na propria Planta.
- **Nada foi corrigido no artefato:** o gerador nao altera codigo de produto; o arquivo de origem permanece byte a byte como estava.

## Última verificação (data/commit)

- 2026-09-13T21:45:31-03:00 · commit `fbb0608` · sha256 da origem (LF): `e536db911698cdd184599b85c08dc405daa9c3511938aa753645391918b99acb`
- Reexecutar: `node scripts/downplant/espelho-rico.mjs gerar --endereco C06_Relatorios/MOD-C06-01_RELATORIOS_OFICIAIS --origem Features/CompiladorProdutividade.js --saida <caminho>`
- Verificar deriva sem regravar: `node scripts/downplant/espelho-rico.mjs verificar --espelho <caminho>`
