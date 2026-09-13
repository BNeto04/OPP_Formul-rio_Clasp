/**
 * PONTO DE ACIONAMENTO SOB DEMANDA — GRAPHIFY CARTOGRAFIA ESTRUTURAL
 * GPS Down Plant: PC_TRABALHO / GOVERNANCA_CAPACIDADES / EXTERNAL_CAPABILITY_REGISTRY / GRAPHIFY
 * Porta: GRAPHIFY-ON-DEMAND
 *
 * Regras:
 * 1. Exige obrigatoriamente --task-id <ID_AUTORIZADO>. Rejeita execuções anônimas ou implícitas.
 * 2. Opera em modo somente leitura (local AST --code-only).
 * 3. Zero daemons, zero serviços de background, zero envio externo de código.
 */

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Parser mínimo de argumentos CLI
const args = process.argv.slice(2);
let taskId = null;
let targetPath = path.resolve(__dirname, '..');
let outDir = path.resolve(__dirname, '../.graphify_ondemand_out');

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--task-id' && args[i + 1]) {
    taskId = args[i + 1];
    i++;
  } else if (args[i] === '--scope' && args[i + 1]) {
    targetPath = path.resolve(args[i + 1]);
    i++;
  } else if (args[i] === '--out' && args[i + 1]) {
    outDir = path.resolve(args[i + 1]);
    i++;
  }
}

// 1. GATE DE AUTORIZAÇÃO: Exige TASK_ID explícito
if (!taskId) {
  console.error("ERRO [FAIL-CLOSED]: Execução não autorizada. O parâmetro --task-id <ID> é obrigatório.");
  console.error("Exemplo de uso: node scripts/graphify-cartografia.js --task-id GRAPHIFY-WORK-GATE-001 [--scope <dir>]");
  process.exit(1);
}

// 2. LOCALIZAÇÃO DO EXECUTÁVEL ISOLADO
const venvGraphify = path.resolve(
  process.env.USERPROFILE || 'C:\\Users\\Bneto04',
  '.gemini/antigravity/brain/12c01fbc-a38a-4145-95b5-4cca16e100da/scratch/venv_graphify/Scripts/graphify.exe'
);

if (!fs.existsSync(venvGraphify)) {
  console.error(`ERRO: Ambiente virtual isolado do Graphify não encontrado em: ${venvGraphify}`);
  process.exit(2);
}

console.log(`=== ACIONAMENTO SOB DEMANDA: GRAPHIFY ===`);
console.log(`TASK_ID: ${taskId}`);
console.log(`ESCOPO:  ${targetPath}`);
console.log(`SAÍDA:   ${outDir}`);
console.log(`MODO:    Local-First AST (--code-only, somente leitura)`);

const startTime = Date.now();

// 3. EXECUÇÃO REVERSÍVEL E ISOLADA
const child = spawnSync(
  venvGraphify,
  ['extract', targetPath, '--code-only', '--out', outDir],
  { encoding: 'utf-8', stdio: 'pipe' }
);

const durationMs = Date.now() - startTime;

if (child.error) {
  console.error(`ERRO NA EXECUÇÃO: ${child.error.message}`);
  process.exit(3);
}

if (child.status !== 0) {
  console.error(`EXECUÇÃO FALHOU COM CÓDIGO ${child.status}:`);
  console.error(child.stderr);
  process.exit(child.status);
}

// 4. LEITURA DE RESULTADOS GERADOS
const graphJsonPath = path.join(outDir, 'graphify-out', 'graph.json');
let nodeCount = 0;
let edgeCount = 0;

if (fs.existsSync(graphJsonPath)) {
  try {
    const graphData = JSON.parse(fs.readFileSync(graphJsonPath, 'utf-8'));
    nodeCount = (graphData.nodes || []).length;
    edgeCount = (graphData.links || []).length;
  } catch (e) {
    console.warn("Aviso ao ler graph.json:", e.message);
  }
}

console.log(`\n=== CARTOGRAFIA CONCLUÍDA COM SUCESSO ===`);
console.log(`Duração: ${durationMs} ms`);
console.log(`Nós extraídos: ${nodeCount}`);
console.log(`Arestas extraídas: ${edgeCount}`);
console.log(`Arquivo gerado: ${graphJsonPath}`);
console.log(`Processos persistentes ativos: ZERO (execução pontual encerrada)`);