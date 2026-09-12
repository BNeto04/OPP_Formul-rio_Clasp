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
