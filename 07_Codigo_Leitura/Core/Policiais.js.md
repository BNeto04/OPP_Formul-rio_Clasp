# ESPELHO — Policiais.js

> [!NOTE] Espelho rico de código (Metodo §46.15) — gerado por `scripts/downplant/espelho-rico.mjs`
> Somente leitura. Não editar à mão: qualquer edição é sobrescrita na próxima geração.
> O código abaixo é cópia verbatim do arquivo de origem no commit declarado; divergência entre o embutido e a origem é deriva (§18.1).
> Regra do sha256 declarado: sha256 do conteúdo **normalizado para LF** (igual ao blob do Git). Em arquivo CRLF com terminador final diferente, ele difere do `sha256sum` dos bytes crus — a comparação de deriva é feita conteúdo-contra-conteúdo.
> Papel desta cópia: CANÔNICA (repositório). O derivado navegável no vault é gerado com as mesmas entradas.

- **Endereço Down Plant:** `C01_Entrada / MOD-C01-01_FORMULARIO_E_MENUS` — [NOTA_DE_RESPONSABILIDADE.md](../../02_Comodos/C01_Entrada/01_Dominio/modulos/MOD-C01-01_FORMULARIO_E_MENUS/NOTA_DE_RESPONSABILIDADE.md)
- **Arquivo de origem (link para o disco):** [`Core/Policiais.js`](../../Core/Policiais.js)
- **Commit de referência:** `fbb0608e7b98144533628c7f9b773a10505b800d` (`fbb0608`)
- **Data da última sincronização:** 2026-09-13T21:45:08-03:00

## Código-fonte embutido

Verbatim de `Core/Policiais.js` em `fbb0608`. sha256 do bloco (LF): `36748bb6eeab3aeaf3a5346c17f0ef22b383a6b9b4bb1aa755e8a149db827f70` — 153 linhas.

```javascript
/**
 * Modulo de gestao de Policiais e Efetivo do ecossistema SYNTHEON.
 */
const SyntheonPoliciais = {
  /**
   * Carrega a base oficial de policiais da aba EFETIVO.
   * Estrutura esperada:
   * A Nome guerra | B Grad+Mat | C Nome completo | D Grad | E Matricula | F Subunidade produtividade | G Subunidade peculio
   * @param {SpreadsheetApp.Spreadsheet} ss
   * @return {Object.<string, {nome: string, graduacao: string, pelotao: string}>}
   */
  carregarEfetivo(ss) {
    const lista = SyntheonPoliciais.carregarListaEfetivo(ss);
    const mapa = {};
    const erros = [];
    const matriculasVistas = new Set();

    lista.forEach(reg => {
      if (!reg.matricula) {
        erros.push(`EFETIVO linha ${reg.linha}: matricula vazia.`);
        return;
      }
      if (!reg.nome) {
        erros.push(`EFETIVO linha ${reg.linha}: nome vazio (matricula ${reg.matricula}).`);
      }
      if (!reg.grad) {
        erros.push(`EFETIVO linha ${reg.linha}: graduacao vazia (matricula ${reg.matricula}).`);
      }
      if (matriculasVistas.has(reg.matricula)) {
        erros.push(`EFETIVO linha ${reg.linha}: matricula duplicada (${reg.matricula}).`);
      }

      matriculasVistas.add(reg.matricula);
      const cadastro = {
        nome: reg.nome,
        graduacao: SyntheonNormalizador.normalizarGraduacao(reg.grad),
        pelotao: reg.pelotao
      };
      mapa[reg.matricula] = cadastro;
      if (reg.matricula.length > 1) {
        mapa[reg.matricula.slice(0, -1) + '-' + reg.matricula.slice(-1)] = cadastro;
      }
    });

    if (erros.length > 0) {
      throw new ErroValidacaoDominio(
        'Efetivo',
        'dados',
        `A aba EFETIVO contem inconsistencias criticas e o fluxo foi interrompido:\n\n` + erros.join('\n')
      );
    }

    return mapa;
  },

  carregarListaEfetivo(ss) {
    const sheet = ss.getSheetByName(CONSTANTES_SYNTHEON.ABA_EFETIVO);
    if (!sheet) {
      throw new ErroLeituraAba(CONSTANTES_SYNTHEON.ABA_EFETIVO, 'Aba nao encontrada.');
    }
    if (sheet.getLastRow() < 1) {
      throw new ErroLeituraAba(CONSTANTES_SYNTHEON.ABA_EFETIVO, 'Aba sem dados cadastrados.');
    }

    const dadosBrutos = sheet.getRange(1, 1, sheet.getLastRow(), Math.max(sheet.getLastColumn(), 7)).getValues();
    const dados = SyntheonPoliciais.removerCabecalhoEfetivo(dadosBrutos);

    return dados.map(item => {
      const row = item.row;
      return {
        linha: item.linha,
        nomeGuerra: String(row[0] || '').trim(),
        gradMat: String(row[1] || '').trim(),
        nome: String(row[2] || '').trim(),
        grad: String(row[3] || '').trim(),
        matricula: SyntheonUtils.limparMatricula(row[4]),
        pelotao: String(row[5] || '').trim(),
        subunidadePeculio: String(row[6] || '').trim()
      };
    }).filter(reg => reg.matricula);
  },

  removerCabecalhoEfetivo(dados) {
    return dados
      .map((row, index) => ({ row, linha: index + 1 }))
      .filter(item => {
        const texto = item.row.slice(0, 7).map(valor => SyntheonUtils.normalizarTexto(valor)).join('|');
        return !(texto.includes('NOME') && texto.includes('MATRICULA'));
      });
  }
};

/**
 * Ordem canonica (copia identica do servidor de antiguidade por posto/graduacao (mais ANTIGO primeiro) - regra do proprietario, 11/09/2026.
 * Empate de graduacao e resolvido por MATRICULA: a mais antiga (menor numero) vem primeiro.
 * A MESMA logica existe no cliente (Entrada/Formulario.html) e nao pode divergir dela.
 */
var ORDEM_POSTOS_ANTIGUIDADE_ = [
  [/^(CEL|CORONEL)/, 1],
  [/^(TENCEL|TENENTECORONEL)/, 2],
  [/^(MAJ|MAJOR)/, 3],
  [/^(CAP|CAPITAO)/, 4],
  [/^(1TEN|1TENENTE|TEN|TENENTE)/, 5],
  [/^(2TEN|2TENENTE)/, 6],
  [/^(ASP|ASPIRANTE)/, 7],
  [/^(SUBTEN|SUBTENENTE)/, 8],
  [/^(1SGT|1SARGENTO|SARGENTO1)/, 9],
  [/^(2SGT|2SARGENTO|SARGENTO2)/, 10],
  [/^(3SGT|3SARGENTO|SARGENTO3)/, 11],
  [/^(CB|CABO)/, 12],
  [/^(SD|SOLDADO)/, 13]
];

/** Normaliza a graduacao para comparacao (sem acento, pontuacao e espaco). */
function normalizarGraduacaoAntiguidade_(grad) {
  return String(grad === undefined || grad === null ? '' : grad)
    .replace(/[ºª°]/g, '')   // "1º TEN" / "3ºSGT" nao podem virar "1OTEN" / "3OSGT"
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/** Indice de antiguidade do posto (1 = mais antigo). Graduacao desconhecida vai para o fim. */
function indiceAntiguidadePosto_(grad) {
  const g = normalizarGraduacaoAntiguidade_(grad);
  for (let i = 0; i < ORDEM_POSTOS_ANTIGUIDADE_.length; i++) {
    if (ORDEM_POSTOS_ANTIGUIDADE_[i][0].test(g)) return ORDEM_POSTOS_ANTIGUIDADE_[i][1];
  }
  return 99;
}

/** Matricula como numero (desempate de antiguidade). */
function matriculaNumerica_(mat) {
  const n = parseInt(String(mat === undefined || mat === null ? '' : mat).replace(/\D/g, ''), 10);
  return isNaN(n) ? Number.MAX_SAFE_INTEGER : n;
}

/**
 * Ordena a equipe na ordem correta de antiguidade: primeiro a PATENTE (mais antigo primeiro) e, em caso
 * de empate de graduacao, a MATRICULA mais antiga (menor) primeiro. Ordenacao estavel.
 */
function ordenarEquipePorAntiguidade_(lista) {
  return (Array.isArray(lista) ? lista.slice() : []).map(function (p, i) { return { p: p, i: i }; })
    .sort(function (a, b) {
      const dg = indiceAntiguidadePosto_(a.p && (a.p.posto || a.p.graduacao)) - indiceAntiguidadePosto_(b.p && (b.p.posto || b.p.graduacao));
      if (dg !== 0) return dg;
      const dm = matriculaNumerica_(a.p && a.p.matricula) - matriculaNumerica_(b.p && b.p.matricula);
      if (dm !== 0) return dm;
      return a.i - b.i;
    })
    .map(function (x) { return x.p; });
}

// FIM-ORDEM-ANTIGUIDADE
```

## Responsabilidade observada

Fonte: `02_Comodos/C01_Entrada/01_Dominio/modulos/MOD-C01-01_FORMULARIO_E_MENUS/MOD-C01-01_FORMULARIO_E_MENUS.md` — CAPSULA do modulo (formato 46.2), "## Responsabilidade".

Receber o texto do BO (colagem/OCR), transformá-lo em **payload conferível** e entregá-lo à persistência (`SUB-C01-01-02_PERSISTENCIA_MANUAL`). Não decide pontuação, não corrige dado: **sugere e deixa conferir**. Também expõe a **porta única de navegação P3** do produto.

Fonte: `02_Comodos/C01_Entrada/01_Dominio/modulos/MOD-C01-01_FORMULARIO_E_MENUS/MOD-C01-01_FORMULARIO_E_MENUS.md` — CAPSULA do modulo (formato 46.2), "## Limites".

- **Não** grava direto na aba mensal: o payload passa por `Entrada/EntradaManual.js` (validação de coluna, anti-duplicidade, fórmula).
- **Não** decide imputado (`IMPUTADO?` é escolha do operador; DETIDOS nunca é inferido).
- **Não** aplica regra de domínio nova por heurística: consulta a ARCA quando a regra existe (fail-soft).
- **Não** inventa valor: campo sem evidência fica pendente e **explícito** (ex.: alerta `CONFERIR AIS`).

## Portas expostas (se aplicável)

- Superfície exposta no nível do arquivo (nível global): `normalizarGraduacaoAntiguidade_`, `indiceAntiguidadePosto_`, `matriculaNumerica_`, `ordenarEquipePorAntiguidade_`, `SyntheonPoliciais`
- Membros públicos observados: `carregarEfetivo`, `carregarListaEfetivo`, `removerCabecalhoEfetivo`

_Extraído por heurística do gerador (globais de nível arquivo + métodos/accessors de 1º–2º nível). Não substitui a declaração de porta da Planta: confirme no endereço acima._

## Divergência com a Planta declarada

Testes mecânicos executados na geração (commit `fbb0608`, 2026-09-13T21:45:08-03:00):

- OK — T1 endereco existe: NOTA_DE_RESPONSABILIDADE.md do modulo presente
- OK — T2 artefato declarado no endereco: "Core/Policiais.js" aparece na Planta
- OK — T3 arquivo presente no commit de referencia (fbb0608:Core/Policiais.js)
- OK — T4 conteudo em disco identico ao do commit de referencia (sha256 LF)
- OK — T5 espelho anterior sem deriva de codigo (sha256 do bloco == origem)
- OK — T6 endereco declarado no espelho anterior corresponde ao endereco canonico atual
- OK — T7 sem duplicidade: exatamente 1 espelho de leitura declara "Core/Policiais.js" como origem

Veredito mecânico: **nenhuma divergência detectada pelos testes acima**.

Declaração verificada a mão por humano/agente (não derivável automaticamente):

- **Como o endereco foi derivado (nao inventado):** secao Artefatos; fonte `02_Comodos/C01_Entrada/01_Dominio/modulos/MOD-C01-01_FORMULARIO_E_MENUS/MOD-C01-01_FORMULARIO_E_MENUS.md`:57.
- **Ponteiro anterior para elemento PARADO:** o espelho de leitura anterior apontava para `_SUP_158/C00_Governanca_Estrutural/01_Dominio/modulos/MOD-C00-01_INFRAESTRUTURA_CORE`, elemento arquivado no card #158 (sem lastro em nenhuma ref do repo). O endereco acima NAO e uma renomeacao daquele: foi derivado da declaracao do artefato na Planta (medido em `MAPA_ARTEFATO_ENDERECO_162.md`).
- **Enderecos concorrentes declarados na Planta (1):** `C02_Leitura/MOD-C02-01_LEITURA_E_ADAPTACAO`. O artefato e referenciado em mais de um endereco; o campo acima registra o endereco PRIMARIO. Nao e erro de endereco — e declaracao concorrente na propria Planta.
- **Divergencia com o espelho anterior:** o espelho antigo declarava o modulo `MOD-C00-01_INFRAESTRUTURA_CORE`; a derivacao atual chega a `C01_Entrada/MOD-C01-01_FORMULARIO_E_MENUS`. Divergencia declarada, nao sobrescrita em silencio.
- **Nada foi corrigido no artefato:** o gerador nao altera codigo de produto; o arquivo de origem permanece byte a byte como estava.

## Última verificação (data/commit)

- 2026-09-13T21:45:08-03:00 · commit `fbb0608` · sha256 da origem (LF): `36748bb6eeab3aeaf3a5346c17f0ef22b383a6b9b4bb1aa755e8a149db827f70`
- Reexecutar: `node scripts/downplant/espelho-rico.mjs gerar --endereco C01_Entrada/MOD-C01-01_FORMULARIO_E_MENUS --origem Core/Policiais.js --saida <caminho>`
- Verificar deriva sem regravar: `node scripts/downplant/espelho-rico.mjs verificar --espelho <caminho>`
