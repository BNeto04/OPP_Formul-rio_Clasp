/**
 * ARQUIVO: Testes/TestRelatorioGxt.js
 * DESCRIÇÃO: Suíte de Testes Unitários e Integrados do Relatório Trimestral Gxt (TASK-M06.3-04A).
 * Valida: 3 meses, líder correto por N, 1 ocorrência por túnel, cores GTAR, total mensal e exclusão de pendentes.
 */

const assert = require('assert');
const ModGxt = require('../Features/CompiladorGxt');
const CompiladorGxt = ModGxt.CompiladorGxt || ModGxt;
const { gerarGxtSelecaoLivre, gerarGxtAnual } = ModGxt;
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

    // Valida o destaque de armas na escala oficial consagrada (qtd 2 -> #FF9900 laranja)
    assert.strictEqual(matrizDados.fundos[2][3], '#FF9900');

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

  // 5. Validação Estrita das Cinco Faixas da Escala Oficial de Armas (TASK-M06.3-04C)
  test('RendererGxt.corPorArmas: valida fielmente as cinco faixas da escala oficial de destaque de armas', () => {
    // Faixa 0: 0 armas -> fundo #FF0000, texto #FF0000
    const f0 = RendererGxt.corPorArmas(0);
    assert.strictEqual(f0.fundo, '#FF0000');
    assert.strictEqual(f0.texto, '#FF0000');

    // Faixa 1-3: 2 armas -> fundo #FF9900, texto #000000
    const f1 = RendererGxt.corPorArmas(2);
    assert.strictEqual(f1.fundo, '#FF9900');
    assert.strictEqual(f1.texto, '#000000');

    // Faixa 4-5: 5 armas -> fundo #FFFF00, texto #000000
    const f2 = RendererGxt.corPorArmas(5);
    assert.strictEqual(f2.fundo, '#FFFF00');
    assert.strictEqual(f2.texto, '#000000');

    // Faixa 6-9: 8 armas -> fundo #93C47D, texto #000000
    const f3 = RendererGxt.corPorArmas(8);
    assert.strictEqual(f3.fundo, '#93C47D');
    assert.strictEqual(f3.texto, '#000000');

    // Faixa 10+: 12 armas -> fundo #38761D, texto #FFFFFF, negrito true
    const f4 = RendererGxt.corPorArmas(12);
    assert.strictEqual(f4.fundo, '#38761D');
    assert.strictEqual(f4.texto, '#FFFFFF');
    assert.strictEqual(f4.negrito, true);
  });

  // 6. Seleção Livre Encaminha Apenas os Meses Marcados para Nome de Saída Padronizado (TASK-M06.3-04D)
  test('gerarGxtSelecaoLivre: encaminha apenas os meses selecionados e cria aba GXT_ACUMULADO_<primeiro>_<ultimo>', () => {
    const abasCriadas = [];
    const mockSS = {
      getSheetByName: (n) => null,
      insertSheet: (n) => {
        abasCriadas.push(n);
        return { clear: () => {}, _definirDadosMatriz: () => {} };
      }
    };

    const resultado = gerarGxtSelecaoLivre(['JAN2026', 'FEV2026'], mockPeculioOficial, mockSS);
    assert.ok(resultado['JAN2026']);
    assert.ok(resultado['FEV2026']);
    assert.strictEqual(resultado['MAR2026'], undefined);
    assert.strictEqual(abasCriadas.length, 1);
    assert.strictEqual(abasCriadas[0], 'GXT_ACUMULADO_JAN2026_FEV2026');
  });

  // 7. Modo Anual Separa os 12 Meses em 4 Saídas Trimestrais (TASK-M06.3-04D)
  test('gerarGxtAnual: divide os 12 meses em 4 saídas trimestrais GXT_1T..4T sem sobrescrever abas existentes', () => {
    const abasCriadas = [];
    const mockSS = {
      getSheetByName: (n) => {
        if (n === 'OUTRO_RELATORIO') return { name: 'OUTRO_RELATORIO' };
        return null;
      },
      insertSheet: (n) => {
        abasCriadas.push(n);
        return { clear: () => {}, _definirDadosMatriz: () => {} };
      }
    };

    const resAnual = gerarGxtAnual(mockSS, mockPeculioOficial);
    assert.ok(resAnual['GXT_1T_2026']);
    assert.ok(resAnual['GXT_2T_2026']);
    assert.ok(resAnual['GXT_3T_2026']);
    assert.ok(resAnual['GXT_4T_2026']);

    assert.strictEqual(abasCriadas.length, 4);
    assert.deepStrictEqual(abasCriadas, ['GXT_1T_2026', 'GXT_2T_2026', 'GXT_3T_2026', 'GXT_4T_2026']);
  });

  // 8. Seleção Livre com 4 ou Mais Meses Empilha Painéis Verticais sem Perda de Dados (TASK-M06.3-04E)
  test('gerarGxtSelecaoLivre: 5 meses desordenados são ordenados e empilhados em painéis verticais na mesma aba acumulada', () => {
    let matrizCompilada = null;
    const mockSheetTarget = {
      getName: () => 'GXT_ACUMULADO_JAN2026_MAI2026',
      clear: () => {},
      _definirDadosMatriz: (m) => { matrizCompilada = m; }
    };

    const mockSS = {
      getSheetByName: () => mockSheetTarget,
      insertSheet: () => mockSheetTarget
    };

    // Operador envia 5 meses fora de ordem
    const mesesDesordenados = ['MAI2026', 'FEV2026', 'JAN2026', 'ABR2026', 'MAR2026'];
    const res = gerarGxtSelecaoLivre(mesesDesordenados, mockPeculioOficial, mockSS);

    assert.ok(res['JAN2026']);
    assert.ok(res['FEV2026']);
    assert.ok(res['MAR2026']);
    assert.ok(res['ABR2026']);
    assert.ok(res['MAI2026']);
    assert.ok(matrizCompilada);

    // Painel 1 (linha 1): JAN2026 na col A (idx 0), FEV2026 na col G (idx 6), MAR2026 na col M (idx 12)
    assert.strictEqual(matrizCompilada.valores[0][0], 'JAN2026');
    assert.strictEqual(matrizCompilada.valores[0][6], 'FEV2026');
    assert.strictEqual(matrizCompilada.valores[0][12], 'MAR2026');

    // Painel 2 (linha empilhada verticalmente): ABR2026 na col A (idx 0), MAI2026 na col G (idx 6)
    const rowPainel2 = 21; // Altura do painel 1 + respiro
    assert.strictEqual(matrizCompilada.valores[rowPainel2][0], 'ABR2026');
    assert.strictEqual(matrizCompilada.valores[rowPainel2][6], 'MAI2026');
  });

  console.log(`\n🎉 Testes do Relatório Trimestral Gxt concluídos: ${sucessos} testes passaram!`);
}

executarTestesGxt();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { executarTestesGxt };
}
