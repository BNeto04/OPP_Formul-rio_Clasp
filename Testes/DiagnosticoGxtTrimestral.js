'use strict';

/**
 * ARQUIVO: Testes/DiagnosticoGxtTrimestral.js
 * DESCRIÇÃO: Ferramenta de diagnóstico forense REAL e somente-leitura para o 2º Trimestre (TASK-M06.3-05I.1R).
 * Lê diretamente os arquivos Excel reais disponibilizados pelo usuário:
 * 1. C:\Users\Bneto04\Downloads\SYNTHÉON — HOMOLOGAÇÃO M06.2 — 2026-07-29 (1).xlsx (abas ABR2026, MAI2026, JUN2026)
 * 2. C:\Users\Bneto04\Downloads\GTAR X TROPA ARMAS 2026 (1).xlsx (aba GTAR X PEL 2º TRIMESTRE e Pecúlio)
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

function executarDiagnosticoReal() {
  console.log('========================================================================');
  console.log('🔬 DIAGNÓSTICO FORENSE REAL SOMENTE-LEITURA — 2º TRIMESTRE (TASK-M06.3-05I.1R)');
  console.log('========================================================================\n');

  const fileSynth = 'C:\\Users\\Bneto04\\Downloads\\SYNTHÉON — HOMOLOGAÇÃO M06.2 — 2026-07-29 (1).xlsx';
  const fileGtar = 'C:\\Users\\Bneto04\\Downloads\\GTAR X TROPA ARMAS 2026 (1).xlsx';

  if (!fs.existsSync(fileSynth) || !fs.existsSync(fileGtar)) {
    console.error('❌ Erro: Arquivos Excel reais não foram encontrados na pasta Downloads.');
    process.exit(1);
  }

  const scriptPy = path.join(__dirname, '..', 'scratch', 'analise_real_excel.py');
  
  try {
    const output = execSync(`python "${scriptPy}"`, { encoding: 'utf8' });
    console.log(output);
  } catch (err) {
    console.error('❌ Erro durante a execução da análise forense:', err.message);
    if (err.stdout) console.log(err.stdout);
    if (err.stderr) console.error(err.stderr);
    process.exit(1);
  }
}

if (require.main === module) {
  executarDiagnosticoReal();
}

module.exports = {
  executarDiagnosticoReal
};
