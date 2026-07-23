/**
 * Constantes Globais do Ecossistema SYNTHÉON
 */
const CONSTANTES_SYNTHEON = {
  // Aba padrão de referência
  ABA_EFETIVO: "EFETIVO",

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
    
    // Métricas
    ARMAS: ['QDT ARMAS', 'QTD ARMAS', 'ARMAS'],
    ARMA_LINHA: ['ARMA'],
    MACONHA: ['TOTAL DE MACONHA', 'MACONHA', 'TOTAL MACONHA', 'DIVIDIDO MAC'],
    COCAINA: ['TOTAL DE COCAINA', 'COCAINA', 'TOTAL COCAINA', 'DIVIDIDO COC'],
    CRACK: ['TOTAL CRACK (GR)', 'CRACK', 'TOTAL CRACK', 'DIVIDIDO CRACK'],
    PONTOS_TOTAIS: ['PONTOS TOTAIS', 'PONTUAÇÃO BRUTA'],
    PONTOS_FICCAO: ['PONTOS FICÇÃO (1/4)', 'PONTOS FICCAO', 'AJ', 'PONTOS'],
    INDICADOR_PIP: ['OCORRÊNCIA PIP', 'OCORRENCIA PIP', 'INDICADOR', 'EVENTO PIP'],
    IMPUTADO: ['IMPUTADO?', 'COM/SEM IMPUTADO', 'IMPUTADO'],
    ALERTA_INTEGRIDADE: ['ALERTA INTEGRIDADE', 'ALERTA', 'OBSERVADOR']
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
