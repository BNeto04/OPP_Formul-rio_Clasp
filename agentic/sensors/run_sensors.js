/**
 * Syntheon Agentic Layer - Runner de Sensores Local/Git (Colmeia H01)
 * Card: #95 H01-004
 *
 * Uso:
 *   node agentic/sensors/run_sensors.js [--scope all|local|git]
 *     [--repo <dir-repo-git>] [--targets p1,p2,...] [--hash] [--since ISO] [--max N]
 *
 * Saida: JSON tipado em stdout (evidencia reproduzivel). Nao escreve em disco.
 */

const path = require('path');
const localSensor = require('./local_sensor');
const gitSensor = require('./git_sensor');

function parseArgs(argv) {
  const args = { scope: 'all', repo: process.cwd(), targets: [], hash: false, since: null, max: null };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--scope') args.scope = (argv[++i] || 'all').toLowerCase();
    else if (a === '--repo') args.repo = argv[++i];
    else if (a === '--targets') args.targets = String(argv[++i] || '').split(',').filter(Boolean);
    else if (a === '--since') args.since = argv[++i];
    else if (a === '--max') args.max = Number(argv[++i]);
    else if (a === '--hash') args.hash = true;
    else if (a === '--base') args.base = argv[++i];
  }
  if (!['all', 'local', 'git'].includes(args.scope)) args.scope = 'all';
  return args;
}

function main() {
  const args = parseArgs(process.argv);
  const output = {
    generated_by: 'hermes-sensor-runner',
    card: '#95 H01-004',
    scope: args.scope,
    read_only: true,
    observed_at: new Date().toISOString(),
    local: null,
    git: null,
    errors: []
  };

  if (args.scope === 'all' || args.scope === 'local') {
    const targets = args.targets.length
      ? args.targets
      : [path.resolve(args.repo)];
    output.local = {
      schema: localSensor.SCHEMA,
      targets: localSensor.observe(targets, { hash: args.hash })
    };
    if (args.since) {
      output.local.recent_files = localSensor.listRecent(args.repo, {
        sinceIso: args.since,
        max: args.max || 100
      });
    }
  }

  if (args.scope === 'all' || args.scope === 'git') {
    output.git = gitSensor.observe(args.repo, args.base ? { base: args.base } : {});
    if (output.git.errors && output.git.errors.length) {
      output.errors.push(...output.git.errors);
    }
  }

  process.stdout.write(JSON.stringify(output, null, 2) + '\n');
}

main();
