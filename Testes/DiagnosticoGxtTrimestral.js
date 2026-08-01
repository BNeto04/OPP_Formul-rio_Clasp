'use strict';

/**
 * ARQUIVO: Testes/DiagnosticoGxtTrimestral.js
 * DESCRIÇÃO: Ferramenta de diagnóstico forense REAL e somente-leitura para o 2º Trimestre (TASK-M06.3-05I.1S).
 * Invoca o analisador em scripts/DiagnosticoGxtTrimestral.py que lê diretamente os arquivos Excel reais:
 * 1. SYNTHÉON — HOMOLOGAÇÃO M06.2 — 2026-07-29 (1).xlsx (abas ABR2026, MAI2026, JUN2026)
 * 2. GTAR X TROPA ARMAS 2026 (1).xlsx (aba GTAR X PEL 2º TRIMESTRE e Pecúlio)
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

function executarDiagnosticoReal() {
  console.log('========================================================================');
  console.log('🔬 DIAGNÓSTICO FORENSE REAL SOMENTE-LEITURA — 2º TRIMESTRE (TASK-M06.3-05I.1S)');
  console.log('========================================================================\n');

  const scriptPy = path.join(__dirname, '..', 'scripts', 'DiagnosticoGxtTrimestral.py');
  
  if (!fs.existsSync(scriptPy)) {
    console.error('❌ Erro: O analisador scripts/DiagnosticoGxtTrimestral.py não foi encontrado.');
    process.exit(1);
  }

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
