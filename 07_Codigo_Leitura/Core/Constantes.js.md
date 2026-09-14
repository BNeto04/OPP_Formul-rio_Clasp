# ESPELHO — Constantes.js

> [!NOTE] Espelho rico de código (Metodo §46.15) — gerado por `scripts/downplant/espelho-rico.mjs`
> Somente leitura. Não editar à mão: qualquer edição é sobrescrita na próxima geração.
> O código abaixo é cópia verbatim do arquivo de origem no commit declarado; divergência entre o embutido e a origem é deriva (§18.1).
> Regra do sha256 declarado: sha256 do conteúdo **normalizado para LF** (igual ao blob do Git). Em arquivo CRLF com terminador final diferente, ele difere do `sha256sum` dos bytes crus — a comparação de deriva é feita conteúdo-contra-conteúdo.
> Papel desta cópia: CANÔNICA (repositório). O derivado navegável no vault é gerado com as mesmas entradas.

- **Endereço Down Plant:** `C01_Entrada / MOD-C01-02_NORMALIZADOR_DE_EFETIVO` — [NOTA_DE_RESPONSABILIDADE.md](../../02_Comodos/C01_Entrada/01_Dominio/modulos/MOD-C01-02_NORMALIZADOR_DE_EFETIVO/NOTA_DE_RESPONSABILIDADE.md)
- **Arquivo de origem (link para o disco):** [`Core/Constantes.js`](../../Core/Constantes.js)
- **Commit de referência:** `fbb0608e7b98144533628c7f9b773a10505b800d` (`fbb0608`)
- **Data da última sincronização:** 2026-09-13T21:45:03-03:00

## Código-fonte embutido

Verbatim de `Core/Constantes.js` em `fbb0608`. sha256 do bloco (LF): `86b83b5604a7c541cca18ef28471405b8b671ed74187c2e1b6aeb057668579cf` — 110 linhas.

```javascript
/**
 * Constantes Globais do Ecossistema SYNTHÉON
 */
const CONSTANTES_SYNTHEON = (() => {
const constantes = {
  // Aba padrão de referência
  ABA_EFETIVO: "EFETIVO",

  // Divisor Fixo Oficial para Rateio PIP de Pontos Ficção (independente da quantidade de policiais no túnel)
  DIVISOR_RATEIO_PIP: 4,

  // Conversoes canonicas das formas de apreensao de drogas para gramas (ARCA-DROGAS-001).
  // O tunel registra as formas; a aba mensal consolida em total: S = MACONHA DOLAR*3 + MACONHA GRAMA,
  // W = CRACK GRAMA + CRACK PEDRA/4 e Z = (COCAINA PINO + COCAINA GRAMA) + (CRACK GRAMA + CRACK PEDRA/4).
  CONVERSOES_DROGAS: {
    CRACK_PEDRA_GRAMA: 0.25,     // 1 pedra de crack = 0,25 g
    MACONHA_PAPELOTE_GRAMA: 3,   // 1 papelote/big de maconha = 3 g
    COCAINA_PINO_GRAMA: 1        // 1 pino/ziplock de cocaína = 1 g
  },
  // Para os escaloes superiores o crack entra no somatorio geral da cocaina (derivado direto dela),
  // ainda que a unidade mantenha as duas contabilidades separadas.
  COCAINA_INCLUI_CRACK_EM_ESCALOES_SUPERIORES: true,

  // Mapeamento de Aliases para Cabeçalhos Dinâmicos
  ALIASES: {
    MATRICULA: ['MATRICULA', 'MAT.', 'MAT', 'MATR'],
    POLICIAL: ['POLICIAL', 'NOME', 'MILITAR', 'NOME COMPLETO'],
    GRAD: ['GRADUAÇÃO', 'GRAD', 'POSTO', 'GRADUACAO'],
    PELOTAO: ['PELOTÃO', 'PELOTAO', 'ESCALA', 'SUBUNIDADE'],
    DATA: ['DATA', 'DT', 'DATA OCORRÊNCIA'],
    HORA: ['HORA', 'HR'],
    BOE: ['BOE', 'BOET'],
    MIKE: ['MIKE', 'NÚMERO MIKE', 'Nº MIKE'],
    NATUREZA: ['NATUREZA DA OCORRÊNCIA', 'NATUREZA', 'FATO'],
    CIDADE: ['CIDADE', 'MUNICIPIO'],
    BAIRRO: ['BAIRRO'],
    AIS: ['AIS'],
    // #147 (ARCA-QTD-O-001): QTD O (quantidade de ocorrencias do tunel) - padrao fixo 01 na primeira linha (fato).
    QTD_O: ['QTD O', 'QTD OCORRENCIA', 'QTD OCORRÊNCIA', 'QTD OCORRENCIAS', 'QTD OCORRÊNCIAS'],

    // Métricas
    ARMA_FATO: ['ARMA'],
    TIPO_ARMA: ['TIPO', 'TIPO ARMA', 'TIPO DE ARMA'],
    MODELO_ARMA: ['MODELO', 'MODELO ARMA', 'MODELO DE ARMA'],
    CALIBRE: ['CALIBRE'],
    MUNICAO: ['MUNIÇÃO', 'MUNICAO', 'QTD MUNIÇÃO'],
    // Participacao por policial (coluna 32 na planilha real). NUNCA entra em soma de arma fisica.
    QDT_ARMAS: ['QDT ARMAS', 'QTD ARMAS'],
    // Arma fisica registrada na linha (coluna 12 na planilha real).
    // Card #141: o alias NAO pode listar 'QDT ARMAS'/'QTD ARMAS' (participacao) - isso fazia o
    // Guardiao e o LeitorPlanilhas somarem participacao como se fosse arma fisica (contagem duplicada).
    ARMAS: ['ARMA', 'ARMAS'],
    ARMA_LINHA: ['ARMA'],
    MACONHA: ['TOTAL DE MACONHA', 'MACONHA', 'TOTAL MACONHA', 'DIVIDIDO MAC'],
    COCAINA: ['TOTAL DE COCAINA', 'COCAINA', 'TOTAL COCAINA', 'DIVIDIDO COC'],
    CRACK: ['TOTAL CRACK (GR)', 'CRACK', 'TOTAL CRACK', 'DIVIDIDO CRACK'],
    PONTOS_TOTAIS: ['PONTOS TOTAIS', 'PONTUACAO BRUTA'],
    PONTOS_FICCAO: ['PONTOS FICÇÃO (1/4)', 'PONTOS FICCAO', 'AJ', 'PONTOS'],
    INDICADOR_PIP: ['OCORRÊNCIA PIP', 'OCORRENCIA PIP', 'INDICADOR', 'EVENTO PIP'],
    IMPUTADO: ['IMPUTADO?', 'COM/SEM IMPUTADO', 'IMPUTADO'],
    ALERTA_INTEGRIDADE: ['ALERTA INTEGRIDADE', 'ALERTA', 'OBSERVADOR'],
    DETIDOS: ['DETIDOS', 'PRESOS', 'CONDUZIDOS'],
    APFD: ['APFD'],
    TCO: ['TCO'],
    BOC: ['BOC'],
    AAFAI: ['AAFAI']
  },

  // Lista de Pelotões Válidos e Normalizados
  PELOTOES: ['1º PEL', '2º PEL', '3º PEL', 'OFICIAIS', 'GTAR', 'CPM'],

  // Tabela de Normalização de Graduações (De -> Para)
  GRADUACOES: {
    'SOLDADO': 'SD', 'SD.': 'SD', 'SD': 'SD',
    'CABO': 'CB', 'CB.': 'CB', 'CB': 'CB',
    '1º SARGENTO': '1ºSGT', '1ºSGT': '1ºSGT', '1º SGT': '1ºSGT',
    '1 SARGENTO': '1ºSGT', '1 SGT': '1ºSGT', '1SGT': '1ºSGT',
    '2º SARGENTO': '2ºSGT', '2ºSGT': '2ºSGT', '2º SGT': '2ºSGT',
    '2 SARGENTO': '2ºSGT', '2 SGT': '2ºSGT', '2SGT': '2ºSGT',
    '3º SARGENTO': '3ºSGT', '3ºSGT': '3ºSGT', '3º SGT': '3ºSGT',
    '3 SARGENTO': '3ºSGT', '3 SGT': '3ºSGT', '3SGT': '3ºSGT',
    'SUBTENENTE': 'SUBTEN', 'SUBTENENTE.': 'SUBTEN', 'SUBTEN': 'SUBTEN',
    'ASPIRANTE': 'ASP', 'ASPIRANTE-A-OFICIAL': 'ASP',
    '1º TENENTE': '1ºTEN', '1ºTEN': '1ºTEN',
    '1 TENENTE': '1ºTEN', '1 TEN': '1ºTEN', '1TEN': '1ºTEN',
    '2º TENENTE': '2ºTEN', '2ºTEN': '2ºTEN',
    '2 TENENTE': '2ºTEN', '2 TEN': '2ºTEN', '2TEN': '2ºTEN',
    'CAPITÃO': 'CAP', 'CAPITAO': 'CAP', 'CAP': 'CAP',
    'MAJOR': 'MAJ', 'MAJ': 'MAJ',
    'TENENTE CORONEL': 'TC', 'TC': 'TC',
    'CORONEL': 'CEL', 'CEL': 'CEL'
  }
};

const deepFreeze = obj => {
  Object.getOwnPropertyNames(obj).forEach(prop => {
    const valor = obj[prop];
    if (valor && typeof valor === 'object' && !Object.isFrozen(valor)) {
      deepFreeze(valor);
    }
  });
  return Object.freeze(obj);
};

return deepFreeze(constantes);
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONSTANTES_SYNTHEON;
}
```

## Responsabilidade observada

Fonte: `02_Comodos/C01_Entrada/01_Dominio/modulos/MOD-C01-02_NORMALIZADOR_DE_EFETIVO/NOTA_DE_RESPONSABILIDADE.md` — NOTA_DE_RESPONSABILIDADE.md do modulo, "## Papel".

Sincronizar a aba EFETIVO a partir do QO/PECULIO sem apagar registros extras, normalizando graduacao,
matricula, nome de guerra (desambiguacao por antiguidade N) e subunidade de produtividade.
Acionado pelo menu (Produtividade > "Sincronizar efetivo pelo peculio").

Fonte: `02_Comodos/C01_Entrada/01_Dominio/modulos/MOD-C01-02_NORMALIZADOR_DE_EFETIVO/NOTA_DE_RESPONSABILIDADE.md` — NOTA_DE_RESPONSABILIDADE.md do modulo, "## Limites".

- Nao audita dados; nao corrige valores operacionais fora das colunas do EFETIVO.
- Nao promove heuristica a regra oficial.

## Portas expostas (se aplicável)

- Superfície exposta no nível do arquivo (nível global): `constantes`
- Membros públicos observados: —

_Extraído por heurística do gerador (globais de nível arquivo + métodos/accessors de 1º–2º nível). Não substitui a declaração de porta da Planta: confirme no endereço acima._

## Divergência com a Planta declarada

Testes mecânicos executados na geração (commit `fbb0608`, 2026-09-13T21:45:03-03:00):

- OK — T1 endereco existe: NOTA_DE_RESPONSABILIDADE.md do modulo presente
- OK — T2 artefato declarado no endereco: "Core/Constantes.js" aparece na Planta
- OK — T3 arquivo presente no commit de referencia (fbb0608:Core/Constantes.js)
- OK — T4 conteudo em disco identico ao do commit de referencia (sha256 LF)
- OK — T5 espelho anterior sem deriva de codigo (sha256 do bloco == origem)
- OK — T6 endereco declarado no espelho anterior corresponde ao endereco canonico atual
- OK — T7 sem duplicidade: exatamente 1 espelho de leitura declara "Core/Constantes.js" como origem

Veredito mecânico: **nenhuma divergência detectada pelos testes acima**.

Declaração verificada a mão por humano/agente (não derivável automaticamente):

- **Como o endereco foi derivado (nao inventado):** secao Artefatos; fonte `02_Comodos/C01_Entrada/01_Dominio/modulos/MOD-C01-02_NORMALIZADOR_DE_EFETIVO/NOTA_DE_RESPONSABILIDADE.md`:20.
- **Ponteiro anterior para elemento PARADO:** o espelho de leitura anterior apontava para `_SUP_158/C00_Governanca_Estrutural/01_Dominio/modulos/MOD-C00-01_INFRAESTRUTURA_CORE`, elemento arquivado no card #158 (sem lastro em nenhuma ref do repo). O endereco acima NAO e uma renomeacao daquele: foi derivado da declaracao do artefato na Planta (medido em `MAPA_ARTEFATO_ENDERECO_162.md`).
- **Enderecos concorrentes declarados na Planta (4):** `C01_Entrada/MOD-C01-01_FORMULARIO_E_MENUS`, `C02_Leitura/MOD-C02-01_LEITURA_E_ADAPTACAO`, `C03_Dominio/MOD-C03-01_MODELO_DE_OCORRENCIA`, `C04_Motor/MOD-C04-01_MOTOR_ANALITICO`. O artefato e referenciado em mais de um endereco; o campo acima registra o endereco PRIMARIO. Nao e erro de endereco — e declaracao concorrente na propria Planta.
- **Divergencia com o espelho anterior:** o espelho antigo declarava o modulo `MOD-C00-01_INFRAESTRUTURA_CORE`; a derivacao atual chega a `C01_Entrada/MOD-C01-02_NORMALIZADOR_DE_EFETIVO`. Divergencia declarada, nao sobrescrita em silencio.
- **Nada foi corrigido no artefato:** o gerador nao altera codigo de produto; o arquivo de origem permanece byte a byte como estava.

## Última verificação (data/commit)

- 2026-09-13T21:45:03-03:00 · commit `fbb0608` · sha256 da origem (LF): `86b83b5604a7c541cca18ef28471405b8b671ed74187c2e1b6aeb057668579cf`
- Reexecutar: `node scripts/downplant/espelho-rico.mjs gerar --endereco C01_Entrada/MOD-C01-02_NORMALIZADOR_DE_EFETIVO --origem Core/Constantes.js --saida <caminho>`
- Verificar deriva sem regravar: `node scripts/downplant/espelho-rico.mjs verificar --espelho <caminho>`
