'use strict';

/**
 * ARQUIVO: Testes/Fixtures/MeritoArmasFixture.js
 * DESCRIÇÃO: Dados de teste simulados para validação do Motor de Mérito de Equipe por Armas (TASK-M06.3-02).
 */

const MeritoArmasFixture = {
  // Mapa de Antiguidade N (menor número N = mais antigo)
  mapaAntiguidade: {
    '101001-0': 1,  // MAJ CORREIA (Mais antigo da unidade, N=1)
    '102002-8': 4,  // 2º TEN ALISSON (N=4)
    '108394-5': 10, // 3º SGT IRAN (GTAR, N=10)
    '102950-9': 12, // 2º SGT SAULO (GTAR, N=12)
    '113920-7': 25, // CB MARCONI (1º PEL, N=25)
    '118108-4': 30, // CB TORRES (2º PEL, N=30)
    '121034-3': 45, // SD SAMPAIO (2º PEL, N=45)
    '120151-4': 50, // SD VITAL (1º PEL, N=50)
    '115984-4': 50, // SD ANDRADE (Empate com Vital, N=50)
    // Nota: '999999-9' (SD DESCONHECIDO) intencionalmente não possui N cadastrado!
  },

  // Cenário 1: Túnel com várias linhas (duplicidades de ocorrência) e 1 arma de fogo
  tunelVariasLinhasUmaArma: [
    {
      data: '2026-07-15',
      mike: '26E100',
      boe: '10001',
      armas: 1,
      policiais: [
        { matricula: '108394-5', nome: 'SGT IRAN', grad: '3º SGT', pelotao: '1º PEL GTAR' },
        { matricula: '113920-7', nome: 'CB MARCONI', grad: 'CB', pelotao: '1º PEL' }
      ]
    },
    {
      data: '2026-07-15',
      mike: '26E100',
      boe: '10001',
      armas: 0, // Linha de rateio da mesma ocorrência
      policiais: [
        { matricula: '118108-4', nome: 'CB TORRES', grad: 'CB', pelotao: '2º PEL' }
      ]
    }
  ],

  // Cenário 2: Túnel com 3 armas de fogo
  tunelTresArmas: [
    {
      data: '2026-07-18',
      mike: '26E200',
      boe: '20002',
      armas: 3,
      policiais: [
        { matricula: '102950-9', nome: 'SGT SAULO', grad: '2º SGT', pelotao: '2º PEL GTAR' },
        { matricula: '121034-3', nome: 'SD SAMPAIO', grad: 'SD', pelotao: '2º PEL' }
      ]
    }
  ],

  // Cenário 3: Arma Artesanal (tipoArma: 'ARTESANAL', armas: 1 -> total 1)
  tunelArmaArtesanal: [
    {
      data: '2026-07-20',
      mike: '26E300',
      boe: '30003',
      tipoArma: 'ARTESANAL',
      armas: 1,
      policiais: [
        { matricula: '108394-5', nome: 'SGT IRAN', grad: '3º SGT', pelotao: '1º PEL GTAR' }
      ]
    }
  ],

  // Cenário 4: Equipe com 5 ou mais integrantes
  tunelEquipeCincoIntegrantes: [
    {
      data: '2026-07-22',
      mike: '26E400',
      boe: '40004',
      armas: 2,
      policiais: [
        { matricula: '108394-5', nome: 'SGT IRAN', grad: '3º SGT', pelotao: '1º PEL GTAR' },
        { matricula: '102950-9', nome: 'SGT SAULO', grad: '2º SGT', pelotao: '2º PEL GTAR' },
        { matricula: '113920-7', nome: 'CB MARCONI', grad: 'CB', pelotao: '1º PEL' },
        { matricula: '118108-4', nome: 'CB TORRES', grad: 'CB', pelotao: '2º PEL' },
        { matricula: '121034-3', nome: 'SD SAMPAIO', grad: 'SD', pelotao: '2º PEL' }
      ]
    }
  ],

  // Cenário 5: Líder que NÃO pertence ao GTAR (ex.: Oficial ou 3º PEL)
  tunelLiderForaGtar: [
    {
      data: '2026-07-25',
      mike: '26E500',
      boe: '50005',
      armas: 1,
      policiais: [
        { matricula: '101001-0', nome: 'MAJ CORREIA', grad: 'MAJ', pelotao: '3º PEL' },
        { matricula: '108394-5', nome: 'SGT IRAN', grad: '3º SGT', pelotao: '1º PEL GTAR' }
      ]
    }
  ],

  // Cenário 6: Integrante com antiguidade ausente no cadastro
  tunelAntiguidadeAusente: [
    {
      data: '2026-07-28',
      mike: '26E600',
      boe: '60006',
      armas: 1,
      policiais: [
        { matricula: '999999-9', nome: 'SD DESCONHECIDO', grad: 'SD', pelotao: '1º PEL' }
      ]
    }
  ],

  // Cenário 7: Empate estrito de antiguidade N entre dois integrantes
  tunelEmpateAntiguidade: [
    {
      data: '2026-07-29',
      mike: '26E700',
      boe: '70007',
      armas: 1,
      policiais: [
        { matricula: '120151-4', nome: 'SD VITAL', grad: 'SD', pelotao: '1º PEL' },
        { matricula: '115984-4', nome: 'SD ANDRADE', grad: 'SD', pelotao: '2º PEL' }
      ]
    }
  ]
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MeritoArmasFixture;
}
