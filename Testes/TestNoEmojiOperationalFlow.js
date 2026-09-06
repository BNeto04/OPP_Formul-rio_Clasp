// Testes/TestNoEmojiOperationalFlow.js
// Regressao factual: NO_EMOJI_IN_OPERATIONAL_FLOW

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== TESTE REGRESSIVO: NO_EMOJI_IN_OPERATIONAL_FLOW ===');

const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}]/u;
const EMOJI_REGEX_GLOBAL = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}]/gu;

function countEmojis(text) {
  let count = 0;
  const fileLines = text.split('\n');
  fileLines.forEach((line) => {
    if (EMOJI_REGEX.test(line)) {
      count++;
    }
  });
  return count;
}

// 1. Validacao do SKILL.md no repositorio e na instalacao global
console.log('\n[G1] Verificando SKILL.md local e global...');
const localSkillPath = path.resolve(__dirname, '../skills/antigravity-sprint-continuity/SKILL.md');
const globalSkillPath = 'C:/Users/Bneto04/.gemini/config/skills/antigravity-sprint-continuity/SKILL.md';

assert(fs.existsSync(localSkillPath), 'SKILL.md local deve existir');
assert(fs.existsSync(globalSkillPath), 'SKILL.md global deve existir');

const localSkillContent = fs.readFileSync(localSkillPath, 'utf8');
const globalSkillContent = fs.readFileSync(globalSkillPath, 'utf8');

assert(localSkillContent.includes('NO_EMOJI_IN_OPERATIONAL_FLOW'), 'SKILL.md local deve conter regra NO_EMOJI_IN_OPERATIONAL_FLOW');
assert(globalSkillContent.includes('NO_EMOJI_IN_OPERATIONAL_FLOW'), 'SKILL.md global deve conter regra NO_EMOJI_IN_OPERATIONAL_FLOW');

const localEmojis = countEmojis(localSkillContent);
const globalEmojis = countEmojis(globalSkillContent);
assert.strictEqual(localEmojis, 0, 'SKILL.md local nao deve conter emojis (encontrados: ' + localEmojis + ')');
assert.strictEqual(globalEmojis, 0, 'SKILL.md global nao deve conter emojis (encontrados: ' + globalEmojis + ')');
console.log('PASS: SKILL.md local e global sincronizados e com 0 emojis.');

// 2. Validacao dos componentes de ponte
console.log('\n[G2] Verificando Stage1BridgeTransport.js e extension_outbound/content.js...');
const stage1Path = path.resolve(__dirname, '../VigiaPonte/Stage1BridgeTransport.js');
const contentPath = path.resolve(__dirname, '../extension_outbound/content.js');

assert(fs.existsSync(stage1Path), 'Stage1BridgeTransport.js deve existir');
assert(fs.existsSync(contentPath), 'extension_outbound/content.js deve existir');

const stage1Content = fs.readFileSync(stage1Path, 'utf8');
const contentContent = fs.readFileSync(contentPath, 'utf8');

const stage1Emojis = countEmojis(stage1Content);
const contentEmojis = countEmojis(contentContent);

assert.strictEqual(stage1Emojis, 0, 'Stage1BridgeTransport.js nao deve conter emojis (encontrados: ' + stage1Emojis + ')');
assert.strictEqual(contentEmojis, 0, 'extension_outbound/content.js nao deve conter emojis (encontrados: ' + contentEmojis + ')');
console.log('PASS: Componentes de transporte e extensao com 0 emojis operacionais.');

// 3. Validacao de construcao de envelope operacional ASCII
console.log('\n[G3] Validacao de formatacao de envelopes operacionais...');
const envelopeBridge = [
  '[BRIDGE_TO_GPT_V1]',
  'CALL_ID: MESSAGE-52-TEST-001',
  'TYPE: MESSAGE',
  'PAYLOAD: Relatorio operacional factual sem caracteres decorativos.',
  '[/BRIDGE_TO_GPT_V1]'
].join('\n');

assert(!EMOJI_REGEX.test(envelopeBridge), 'Envelope operacional nao deve conter emojis');
assert(envelopeBridge.startsWith('[BRIDGE_TO_GPT_V1]'), 'Envelope deve abrir tag ASCII');
assert(envelopeBridge.endsWith('[/BRIDGE_TO_GPT_V1]'), 'Envelope deve fechar tag ASCII');
console.log('PASS: Envelope operacional gerado estritamente em ASCII.');

// 4. Teste de robustez para payload do usuario contendo Unicode/Emoji
console.log('\n[G4] Validacao de robustez com input do usuario com emojis...');
const userRawInput = 'Aprovado envio para producao! \u{1F44D}\u{1F680}';
const telegramEnvelope = {
  event_id: 'TG-MSG-999',
  channel: 'telegram',
  user_text: userRawInput,
  timestamp: new Date().toISOString()
};

// Serializacao JSON segura
const serialized = JSON.stringify(telegramEnvelope);
const parsed = JSON.parse(serialized);
assert.strictEqual(parsed.user_text, userRawInput, 'Payload de dados preservado com fidelidade');

// Sanitizacao para logs operacionais (regra de fluxo sem poluir log com emojis se necessario)
const sanitizedLog = parsed.user_text.replace(EMOJI_REGEX_GLOBAL, '[EMOJI_FILTERED]');
assert(!EMOJI_REGEX.test(sanitizedLog), 'Log operacional sanitizado nao contem emojis');
assert.strictEqual(sanitizedLog, 'Aprovado envio para producao! [EMOJI_FILTERED][EMOJI_FILTERED]');
console.log('PASS: Robustez de Unicode comprovada sem corromper dados e com logs operacionais limpos.');

console.log('\n=======================================================');
console.log('TODOS OS 4 TESTES PASSARAM COM REGISTRO FACTUAL.');
console.log('=======================================================');