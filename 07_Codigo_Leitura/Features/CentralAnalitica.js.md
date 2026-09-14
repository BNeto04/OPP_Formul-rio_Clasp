# ESPELHO — CentralAnalitica.js

> [!NOTE] Espelho rico de código (Metodo §46.15) — gerado por `scripts/downplant/espelho-rico.mjs`
> Somente leitura. Não editar à mão: qualquer edição é sobrescrita na próxima geração.
> O código abaixo é cópia verbatim do arquivo de origem no commit declarado; divergência entre o embutido e a origem é deriva (§18.1).
> Regra do sha256 declarado: sha256 do conteúdo **normalizado para LF** (igual ao blob do Git). Em arquivo CRLF com terminador final diferente, ele difere do `sha256sum` dos bytes crus — a comparação de deriva é feita conteúdo-contra-conteúdo.
> Papel desta cópia: CANÔNICA (repositório). O derivado navegável no vault é gerado com as mesmas entradas.

- **Endereço Down Plant:** `C04_Motor / MOD-C04-01_MOTOR_ANALITICO` — [NOTA_DE_RESPONSABILIDADE.md](../../02_Comodos/C04_Motor/01_Dominio/modulos/MOD-C04-01_MOTOR_ANALITICO/NOTA_DE_RESPONSABILIDADE.md)
- **Arquivo de origem (link para o disco):** [`Features/CentralAnalitica.js`](../../Features/CentralAnalitica.js)
- **Commit de referência:** `fbb0608e7b98144533628c7f9b773a10505b800d` (`fbb0608`)
- **Data da última sincronização:** 2026-09-13T21:45:29-03:00

## Código-fonte embutido

Verbatim de `Features/CentralAnalitica.js` em `fbb0608`. sha256 do bloco (LF): `5abc2b850fadd7f6211d1588f2928664f5ffa15232ad698495db9c0310b89cce` — 196 linhas.

```javascript
/**
 * ARQUIVO: Features/CentralAnalitica.js
 * PILAR 2 & 3: Central Analítica (CA) — Painel Mestre
 * DESCRIÇÃO: Consolidador Único da Era 3. Lê os fatos uma única vez via
 * Adaptador2026 + MotorAnaliticoV2 e gera o painel mestre oficial de produtividade.
 */

const ORDEM_MESES_SYNTHEON = {
  JAN: 1, FEV: 2, MAR: 3, ABR: 4, MAI: 5, JUN: 6,
  JUL: 7, AGO: 8, SET: 9, OUT: 10, NOV: 11, DEZ: 12
};

function ordenarAbasCronologicamente(abas) {
  return abas.sort((a, b) => {
    const mesA = (a.match(/^[A-Z]{3}/i) || [''])[0].toUpperCase();
    const mesB = (b.match(/^[A-Z]{3}/i) || [''])[0].toUpperCase();
    const anoA = parseInt((a.match(/\d{4}$/) || ['0'])[0], 10);
    const anoB = parseInt((b.match(/\d{4}$/) || ['0'])[0], 10);

    if (anoA !== anoB) return anoA - anoB;
    return (ORDEM_MESES_SYNTHEON[mesA] || 99) - (ORDEM_MESES_SYNTHEON[mesB] || 99);
  });
}

function rodarCentralAnaliticaAnual() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let abas = ss.getSheets()
    .map(s => s.getName())
    .filter(nome => /^[A-Z]{3}2026$/i.test(nome));

  abas = ordenarAbasCronologicamente(abas);

  if (abas.length === 0) {
    SpreadsheetApp.getUi().alert("Nenhuma aba mensal de 2026 encontrada para a Central Analítica.");
    return;
  }

  processarCentralAnalitica(abas, "CA_2026");
}

function abrirMenuCentralAnaliticaSelecaoLivre() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let abas = ss.getSheets()
    .map(s => s.getName())
    .filter(nome => /^[A-Z]{3}\d{4}$/i.test(nome));

  abas = ordenarAbasCronologicamente(abas);

  if (abas.length === 0) {
    SpreadsheetApp.getUi().alert("Nenhuma aba mensal encontrada.");
    return;
  }

  const opcoes = abas.map(nome => `
    <label class="mes">
      <input type="checkbox" name="mes" value="${nome}">
      <span>${nome}</span>
    </label>`).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <base target="_top">
        <style>
          body { font-family: Arial, sans-serif; padding: 18px; color: #111827; }
          h3 { margin: 0 0 6px; font-size: 17px; }
          p { margin: 0 0 14px; color: #4b5563; font-size: 13px; line-height: 1.35; }
          .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 14px; }
          .mes { display: flex; align-items: center; gap: 7px; border: 1px solid #d1d5db; border-radius: 6px; padding: 8px; cursor: pointer; }
          .mes:hover { background: #f3f4f6; }
          .actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 12px; }
          button { border: 0; border-radius: 6px; padding: 8px 12px; font-weight: 700; cursor: pointer; }
          .secondary { background: #e5e7eb; color: #111827; }
          .primary { background: #064e3b; color: white; }
        </style>
      </head>
      <body>
        <h3>📊 Central Analítica — Seleção Livre</h3>
        <p>Selecione uma ou mais abas para consolidar no Painel Mestre.</p>
        <div class="grid">${opcoes}</div>
        <div class="actions">
          <button class="secondary" onclick="marcarTodos()">Todos</button>
          <button class="secondary" onclick="google.script.host.close()">Cancelar</button>
          <button class="primary" onclick="gerar()">Consolidar</button>
        </div>
        <script>
          function marcarTodos() {
            document.querySelectorAll('input[name="mes"]').forEach(cb => cb.checked = true);
          }
          function gerar() {
            const selecionados = Array.from(document.querySelectorAll('input[name="mes"]:checked')).map(cb => cb.value);
            if (selecionados.length === 0) {
              alert('Selecione pelo menos uma aba.');
              return;
            }
            google.script.run
              .withSuccessHandler(() => google.script.host.close())
              .withFailureHandler(err => alert('Erro: ' + err.message))
              .processarCentralAnaliticaSelecaoLivre(selecionados);
          }
        </script>
      </body>
    </html>
  `;

  const htmlOutput = HtmlService.createHtmlOutput(htmlContent).setWidth(440).setHeight(380);
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Central Analítica');
}

function processarCentralAnaliticaSelecaoLivre(abasSelecionadas) {
  if (!abasSelecionadas || abasSelecionadas.length === 0) return;
  const abasOrdenadas = ordenarAbasCronologicamente(abasSelecionadas);
  const nomeAbaSaida = `CA_${abasOrdenadas[0]}_${abasOrdenadas[abasOrdenadas.length - 1]}`;
  return processarCentralAnalitica(abasOrdenadas, nomeAbaSaida);
}

function processarCentralAnalitica(abas, nomeAbaSaida) {
  const t0 = Date.now();
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Carregar base do Efetivo para enriquecimento
  const mapaEfetivo = SyntheonPoliciais.carregarEfetivo(ss);
  const metadado = { versao: "2026", coberturaHistorica: {} };

  // 2. Extrair fatos canônicos de cada aba mensal selecionada
  let todosFatos = [];
  abas.forEach(nomeAba => {
    const sheet = ss.getSheetByName(nomeAba);
    if (sheet) {
      metadado.aba = nomeAba;
      const fatosAba = Adaptador2026.extrairFatos(sheet, metadado, mapaEfetivo);
      todosFatos = todosFatos.concat(fatosAba);
    }
  });

  if (todosFatos.length === 0) {
    SpreadsheetApp.getUi().alert("Nenhum fato operacional válido foi encontrado nas abas selecionadas.");
    return;
  }

  // 3. Processar produtividade consolidada via Motor V2
  const registros = MotorAnaliticoV2.processarProdutividadePolicial(todosFatos);

  // 4. Ordenação determinística: Pontuação (↓) > Ocorrências (↓) > Armas (↓) > Drogas (↓) > Nome (↑)
  registros.sort((a, b) => {
    const ptsA = a.indicadores ? a.indicadores.pontosTotais : (a.pontosTotais || 0);
    const ptsB = b.indicadores ? b.indicadores.pontosTotais : (b.pontosTotais || 0);
    if (ptsB !== ptsA) return ptsB - ptsA;

    const ocA = a.fatos ? a.fatos.ocorrencias : (a.ocorrencias || 0);
    const ocB = b.fatos ? b.fatos.ocorrencias : (b.ocorrencias || 0);
    if (ocB !== ocA) return ocB - ocA;

    const armA = a.fatos ? a.fatos.armas : (a.armas || 0);
    const armB = b.fatos ? b.fatos.armas : (b.armas || 0);
    if (armB !== armA) return armB - armA;

    const drgA = a.fatos ? a.fatos.drogasTotal : (a.drogasTotal || 0);
    const drgB = b.fatos ? b.fatos.drogasTotal : (b.drogasTotal || 0);
    if (drgB !== drgA) return drgB - drgA;

    return (a.nome || '').localeCompare(b.nome || '', 'pt-BR');
  });

  // 5. Renderizar na aba dedicada
  const tempoSegundos = ((Date.now() - t0) / 1000).toFixed(2);
  const totalOcorrencias = new Set(todosFatos.map(f => f.ocorrencia.chave)).size;

  RendererCA.renderizar(ss, nomeAbaSaida, registros, {
    periodo: abas.length === 1 ? abas[0] : `${abas[0]} a ${abas[abas.length - 1]}`,
    abasLidas: abas,
    totalPoliciais: registros.length,
    totalOcorrencias,
    tempoSegundos
  });

  SpreadsheetApp.getUi().alert(
    `Central Analítica gerada com sucesso! ✅\n\n` +
    `Aba: ${nomeAbaSaida}\n` +
    `Policiais: ${registros.length}\n` +
    `Ocorrências: ${totalOcorrencias}\n` +
    `Tempo: ${tempoSegundos}s`
  );
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ordenarAbasCronologicamente,
    rodarCentralAnaliticaAnual,
    abrirMenuCentralAnaliticaSelecaoLivre,
    processarCentralAnaliticaSelecaoLivre,
    processarCentralAnalitica
  };
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

- Superfície exposta no nível do arquivo (nível global): `ordenarAbasCronologicamente`, `rodarCentralAnaliticaAnual`, `abrirMenuCentralAnaliticaSelecaoLivre`, `processarCentralAnaliticaSelecaoLivre`, `processarCentralAnalitica`, `ORDEM_MESES_SYNTHEON`
- Membros públicos observados: `processarCentralAnalitica`

_Extraído por heurística do gerador (globais de nível arquivo + métodos/accessors de 1º–2º nível). Não substitui a declaração de porta da Planta: confirme no endereço acima._

## Divergência com a Planta declarada

Testes mecânicos executados na geração (commit `fbb0608`, 2026-09-13T21:45:29-03:00):

- OK — T1 endereco existe: NOTA_DE_RESPONSABILIDADE.md do modulo presente
- OK — T2 artefato declarado no endereco: "Features/CentralAnalitica.js" aparece na Planta
- OK — T3 arquivo presente no commit de referencia (fbb0608:Features/CentralAnalitica.js)
- OK — T4 conteudo em disco identico ao do commit de referencia (sha256 LF)
- OK — T5 espelho anterior sem deriva de codigo (sha256 do bloco == origem)
- OK — T6 endereco declarado no espelho anterior corresponde ao endereco canonico atual
- OK — T7 sem duplicidade: exatamente 1 espelho de leitura declara "Features/CentralAnalitica.js" como origem

Veredito mecânico: **nenhuma divergência detectada pelos testes acima**.

Declaração verificada a mão por humano/agente (não derivável automaticamente):

- **Como o endereco foi derivado (nao inventado):** secao Artefatos; fonte `02_Comodos/C04_Motor/01_Dominio/modulos/MOD-C04-01_MOTOR_ANALITICO/MOD-C04-01_MOTOR_ANALITICO.md`:61.
- **Enderecos concorrentes declarados na Planta (2):** `C01_Entrada/MOD-C01-01_FORMULARIO_E_MENUS`, `C06_Relatorios/MOD-C06-01_RELATORIOS_OFICIAIS`. O artefato e referenciado em mais de um endereco; o campo acima registra o endereco PRIMARIO. Nao e erro de endereco — e declaracao concorrente na propria Planta.
- **Divergencia com o espelho anterior:** o espelho antigo declarava o modulo `MOD-C06-01_RELATORIOS_OFICIAIS`; a derivacao atual chega a `C04_Motor/MOD-C04-01_MOTOR_ANALITICO`. Divergencia declarada, nao sobrescrita em silencio.
- **Nada foi corrigido no artefato:** o gerador nao altera codigo de produto; o arquivo de origem permanece byte a byte como estava.

## Última verificação (data/commit)

- 2026-09-13T21:45:29-03:00 · commit `fbb0608` · sha256 da origem (LF): `5abc2b850fadd7f6211d1588f2928664f5ffa15232ad698495db9c0310b89cce`
- Reexecutar: `node scripts/downplant/espelho-rico.mjs gerar --endereco C04_Motor/MOD-C04-01_MOTOR_ANALITICO --origem Features/CentralAnalitica.js --saida <caminho>`
- Verificar deriva sem regravar: `node scripts/downplant/espelho-rico.mjs verificar --espelho <caminho>`
