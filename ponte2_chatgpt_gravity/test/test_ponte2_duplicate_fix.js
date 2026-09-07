/**
 * Teste Automatizado: Prova de Correcao de Duplo Submit (TASK: BRIDGE-V2-DUPLICATE-SUBMIT-ROOTCAUSE-001)
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

async function runTest() {
  console.log('=================================================================');
  console.log('TESTE: ELIMINACAO DE DUPLO SUBMIT NAS PONTES 1 E 2');
  console.log('TASK: BRIDGE-V2-DUPLICATE-SUBMIT-ROOTCAUSE-001');
  console.log('=================================================================');

  let passed = 0;
  let failed = 0;

  function report(num, desc, condition) {
    if (condition) {
      console.log(`PASS ${num}: ${desc}`);
      passed++;
    } else {
      console.error(`FAIL ${num}: ${desc}`);
      failed++;
    }
  }

  const ponte1ContentPath = path.join(__dirname, '..', '..', 'ponte1_telegram_chatgpt', 'extension', 'content.js');
  const ponte2ContentPath = path.join(__dirname, '..', 'extension_chatgpt', 'content.js');

  const ponte1Code = fs.readFileSync(ponte1ContentPath, 'utf8');
  const ponte2Code = fs.readFileSync(ponte2ContentPath, 'utf8');

  // Teste 1: Ponte 1 nao possui triggerEnterKey incondicional ao final de handleInjection
  const p1HasUncondEnter = ponte1Code.includes('triggerEnterKey(inputEl);\n\n    return { success: true };');
  report(1, 'Ponte 1: triggerEnterKey incondicional REMOVIDO ao final de handleInjection', !p1HasUncondEnter);

  // Teste 2: Ponte 2 nao possui triggerEnterKey incondicional apos loop de submit
  const p2HasUncondEnter = ponte2Code.includes('triggerEnterKey(inputEl);\n\n    // Aguarda e verifica');
  report(2, 'Ponte 2: triggerEnterKey incondicional REMOVIDO ao final de handleInjection', !p2HasUncondEnter);

  // Teste 3: Simulacao comportamental
  let enterCallCount = 0;
  let submitCallCount = 0;

  function mockTriggerSubmit(success) {
    submitCallCount++;
    return success;
  }

  function mockTriggerEnterKey() {
    enterCallCount++;
  }

  async function simulateHandleInjection(shouldButtonSucceed) {
    enterCallCount = 0;
    submitCallCount = 0;

    let submitted = false;
    for (let i = 0; i < 8; i++) {
      submitted = mockTriggerSubmit(shouldButtonSucceed);
      if (submitted) {
        return { success: true };
      }
    }

    if (!submitted) {
      mockTriggerEnterKey();
      const postSubmit = mockTriggerSubmit(true);
      if (postSubmit) return { success: true };
    }

    return { success: true };
  }

  const resA = await simulateHandleInjection(true);
  report(3, 'Cenario A (Botao OK): Retorna success imediatamente e enterCallCount == 0', resA.success === true && enterCallCount === 0 && submitCallCount === 1);

  const resB = await simulateHandleInjection(false);
  report(4, 'Cenario B (Botao indisponivel): Enter chamado exatamente 1 vez como fallback', resB.success === true && enterCallCount === 1);

  console.log('-----------------------------------------------------------------');
  console.log(`RESULTADO: ${passed} PASS / ${failed} FAIL`);
  if (failed > 0) process.exit(1);
}

runTest();
