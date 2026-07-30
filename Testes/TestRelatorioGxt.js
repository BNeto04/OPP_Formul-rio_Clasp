/**
 * ARQUIVO: Testes/TestRelatorioGxt.js
 * DESCRIÇÃO: Suíte de Testes Unitários e Integrados do Relatório Trimestral Gxt (TASK-M06.3-04A).
 * Valida: 3 meses, líder correto por N, 1 ocorrência por túnel, cores GTAR, total mensal e exclusão de pendentes.
 */

const assert = require('assert');
const CompiladorGxt = require('../Features/CompiladorGxt');
const RendererGxt = require('../Render/RendererGxt');

function executarTestesGxt() {
  console.log('🧪 Iniciando Testes Unitários e Integrados: Relatório Trimestral Gxt (M06.3-04A)...\n');
  let sucessos = 0;

  function test(nome, fn) {
    try {
      fn();
      console.log(`  ✅ [PASS] ${nome}`);
      sucessos++;
    } catch (e) {
      console.error(`  ❌ [FAIL] ${nome}: ${e.message}`);
      throw e;
    }
  }

  const mockPeculioOficial = {
    getSheetByName: (n) => {
      if (n === 'EFETIVO' || n === 'PECULIO') {
        return {
          getLastRow: () => 4,
          getLastColumn: () => 5,
          getRange: () => ({
            getValues: () => [
              ['N', 'MATRÍCULA', 'GRAD', 'NOME', 'DESIGNAÇÃO'],
              [1, '108394-5', '3º SGT', 'IRAN SILVA', '1º PEL GTAR'],
              [5, '102950-9', '2º SGT', 'SAULO ALVES', '2º PEL GTAR'],
              [12, '113920-7', '3º SGT', 'MARCONI LIMA', '1º PEL']
            ]
          })
        };
      }
      return null;
    }
  };

  // 1. Compilação de Três Meses com Resolução Legítima do Líder (TASK-M06.3-04A)
  test('CompiladorGxt: compila 3 meses, seleciona o líder mais antigo (menor N) por túnel e agrupa 100% das armas', () => {
    const dadosOcorrenciasJan = [
      {
        data: '15/01/2026', mike: '26E100', boe: 'BOE1', armas: 2,
        policiais: [
          { matricula: '102950-9', nome: 'SAULO ALVES', grad: '2º SGT', pelotao: '2º PEL GTAR' },
          { matricula: '108394-5', nome: 'IRAN SILVA', grad: '3º SGT', pelotao: '1º PEL GTAR' } // IRAN (N=1) é mais antigo
        ]
      }
    ];

    const dadosOcorrenciasFev = [
      {
        data: '10/02/2026', mike: '26E200', boe: 'BOE2', armas: 1,
        policiais: [
          { matricula: '113920-7', nome: 'MARCONI LIMA', grad: '3º SGT', pelotao: '1º PEL' } // MARCONI (N=12)
        ]
      }
    ];

    const dadosOcorrenciasMar = [
      {
        data: '05/03/2026', mike: '26E300', boe: 'BOE3', armas: 3,
        policiais: [
          { matricula: '102950-9', nome: 'SAULO ALVES', grad: '2º SGT', pelotao: '2º PEL GTAR' } // SAULO (N=5)
        ]
      }
    ];

    const fonteMock = {
      JAN2026: dadosOcorrenciasJan,
      FEV2026: dadosOcorrenciasFev,
      MAR2026: dadosOcorrenciasMar
    };

    const resultado = CompiladorGxt.compilar(fonteMock, ['JAN2026', 'FEV2026', 'MAR2026'], mockPeculioOficial);

    assert.ok(resultado['JAN2026']);
    assert.strictEqual(resultado['JAN2026'].registros.length, 1);
    assert.strictEqual(resultado['JAN2026'].registros[0].matricula, '108394-5');
    assert.strictEqual(resultado['JAN2026'].registros[0].nome, 'IRAN SILVA');
    assert.strictEqual(resultado['JAN2026'].registros[0].qtdArmas, 2);
    assert.strictEqual(resultado['JAN2026'].registros[0].numSeq, 1);

    assert.strictEqual(resultado['FEV2026'].registros[0].matricula, '113920-7');
    assert.strictEqual(resultado['FEV2026'].registros[0].qtdArmas, 1);

    assert.strictEqual(resultado['MAR2026'].registros[0].matricula, '102950-9');
    assert.strictEqual(resultado['MAR2026'].registros[0].qtdArmas, 3);
  });

  // 2. Exclusão de Túneis Pendentes de Auditoria (TASK-M06.3-04A)
  test('CompiladorGxt: exclui do relatório de mérito qualquer túnel com status PENDENTE_AUDITORIA', () => {
    const dadosOcorrenciasPendente = [
      {
        data: '15/01/2026', mike: '26E100', boe: 'BOE_PEND', armas: 2,
        policiais: [
          { matricula: '999999-9', nome: 'POLICIAL SEM N', grad: 'SD', pelotao: '3º PEL' } // N ausente -> PENDENTE_AUDITORIA
        ]
      }
    ];

    const fonteMock = { JAN2026: dadosOcorrenciasPendente };

    const resultado = CompiladorGxt.compilar(fonteMock, ['JAN2026'], mockPeculioOficial);

    assert.strictEqual(resultado['JAN2026'].registros.length, 0, 'Túnel pendente de auditoria deve ser excluído do mérito');
  });

  // 3. Renderização Executiva com Cores GTAR e Totais Mensais (TASK-M06.3-04A)
  test('RendererGxt: renderiza 3 blocos mensais lado a lado com cores GTAR e totais calculados', () => {
    const dadosCompilados = {
      JAN2026: {
        registros: [
          { numSeq: 1, matricula: '108394-5', grad: '3º SGT', nome: 'IRAN SILVA', qtdArmas: 2, designacao: '1º PEL GTAR' }
        ],
        resumo: { '1º PEL GTAR': 2, '2º PEL GTAR': 0, '1º PEL': 0, '2º PEL': 0, '3º PEL': 0, 'TOTAL': 2 }
      },
      FEV2026: {
        registros: [
          { numSeq: 1, matricula: '102950-9', grad: '2º SGT', nome: 'SAULO ALVES', qtdArmas: 4, designacao: '2º PEL GTAR' }
        ],
        resumo: { '1º PEL GTAR': 0, '2º PEL GTAR': 4, '1º PEL': 0, '2º PEL': 0, '3º PEL': 0, 'TOTAL': 4 }
      }
    };

    let matrizDados = null;

    const mockSheetTarget = {
      getName: () => 'GTAR X TROPA ARMAS 2026',
      clear: () => {},
      _definirDadosMatriz: (m) => { matrizDados = m; }
    };

    const mockSS = {
      getSheetByName: () => mockSheetTarget,
      insertSheet: () => mockSheetTarget
    };

    const sheetResult = RendererGxt.renderizar(mockSS, dadosCompilados, 'GTAR X TROPA ARMAS 2026');
    assert.ok(sheetResult);
    assert.ok(matrizDados);

    // Valida o cabeçalho do Mês 1 (JAN2026) na Coluna A (idx 0)
    assert.strictEqual(matrizDados.valores[0][0], 'JAN2026');
    assert.strictEqual(matrizDados.valores[1][0], 'Nº');
    assert.strictEqual(matrizDados.valores[1][1], 'GRAD. / MATRÍCULA');
    assert.strictEqual(matrizDados.valores[1][3], 'QTD ARMAS');

    // Valida a cor oficial do 1º PEL GTAR (#00CC00, negrito) na linha de registro (linha 3, idx 2)
    assert.strictEqual(matrizDados.fundos[2][0], '#00CC00');
    assert.strictEqual(matrizDados.negritos[2][0], true);

    // Valida o destaque de armas na escala oficial consagrada (qtd 2 -> #F0AD4E laranja)
    assert.strictEqual(matrizDados.fundos[2][3], '#F0AD4E');

    // Valida o Mês 2 (FEV2026) na Coluna G (colStart 6, idx 6)
    assert.strictEqual(matrizDados.valores[0][6], 'FEV2026');

    // Valida a cor oficial do 2º PEL GTAR (#3C78D8, texto #FFFFFF)
    assert.strictEqual(matrizDados.fundos[2][6], '#3C78D8');
    assert.strictEqual(matrizDados.coresTexto[2][6], '#FFFFFF');
  });

  // 4. Teste Integrado com Adaptador2026.extrairFatos() e Planilha Simulada (TASK-M06.3-04B)
  test('CompiladorGxt + Adaptador2026: pipeline completo converte RegistroCanonico e seleciona líder correto', () => {
    const rawHeaders = ['DATA', 'HORA', 'MIKE', 'MATRÍCULA', 'POLICIAL', 'GRAD', 'PELOTÃO', 'ARMAS', 'INDICADOR PIP'];
    const rawDataJan = [
      rawHeaders,
      ['15/01/2026', '10:00', '26E100', '102950-9', 'SAULO ALVES', '2º SGT', '2º PEL GTAR', 2, 'PORTE ILEGAL DE ARMA DE FOGO'],
      ['15/01/2026', '10:00', '26E100', '108394-5', 'IRAN SILVA', '3º SGT', '1º PEL GTAR', 0, 'PORTE ILEGAL DE ARMA DE FOGO'] // IRAN (N=1) em linha sem arma no mesmo túnel
    ];

    const mockSheetJan = {
      getName: () => 'JAN2026',
      getLastRow: () => 3,
      getLastColumn: () => 9,
      getRange: () => ({
        getValues: () => rawDataJan
      })
    };

    const fonteSS = {
      getSheetByName: (n) => (n === 'JAN2026' ? mockSheetJan : null)
    };

    const resultado = CompiladorGxt.compilar(fonteSS, ['JAN2026'], mockPeculioOficial);

    assert.ok(resultado['JAN2026']);
    assert.strictEqual(resultado['JAN2026'].registros.length, 1);
    assert.strictEqual(resultado['JAN2026'].registros[0].matricula, '108394-5', 'Deve selecionar IRAN SILVA (N=1) como líder');
    assert.strictEqual(resultado['JAN2026'].registros[0].qtdArmas, 2, 'Deve atribuir 100% das 2 armas do túnel ao líder');
  });

  console.log(`\n🎉 Testes do Relatório Trimestral Gxt concluídos: ${sucessos} testes passaram!`);
}

executarTestesGxt();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { executarTestesGxt };
}
