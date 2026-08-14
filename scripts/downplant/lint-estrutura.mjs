import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const baseDir = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(__dirname, '../../');

console.log(`\n🔍 Verificando Terreno: ${baseDir}\n`);

let errors = 0;

function reportError(msg) {
  console.error(`❌ ERRO: ${msg}`);
  errors++;
}

// 1. Verificar Manifesto DP-VAULT-1
const manifestoPath = path.join(baseDir, '03_Fundacao', 'ESTRUTURA_DO_COFRE.md');
if (!fs.existsSync(manifestoPath)) {
  reportError('Manifesto ESTRUTURA_DO_COFRE.md nao encontrado.');
} else {
  const content = fs.readFileSync(manifestoPath, 'utf8');
  if (!content.includes('DP-VAULT-1') || !content.includes('2.1')) {
    reportError('Manifesto incompleto: nao possui DP-VAULT-1 ou versao 2.1');
  }
}

// 2. Verificar Slots e Nomenclaturas em Comodos
const comodosDir = path.join(baseDir, '02_Comodos');
if (!fs.existsSync(comodosDir)) {
  reportError('Diretorio 02_Comodos nao encontrado.');
} else {
  const slotsObrigatorios = [
    '00_Visao_Do_Comodo', '01_Dominio', '02_Integracoes',
    '03_Especificacoes', '04_Execucao', '05_Evidencias'
  ];

  const comodos = fs.readdirSync(comodosDir).filter(f => f.startsWith('C') && fs.statSync(path.join(comodosDir, f)).isDirectory());
  
  comodos.forEach(comodo => {
    slotsObrigatorios.forEach(slot => {
      const slotPath = path.join(comodosDir, comodo, slot);
      if (!fs.existsSync(slotPath) || !fs.statSync(slotPath).isDirectory()) {
        reportError(`Comodo ${comodo} nao possui diretorio slot ${slot}`);
      } else {
        const indicePath = path.join(slotPath, 'INDICE.md');
        if (!fs.existsSync(indicePath)) {
          reportError(`Slot ${comodo}/${slot} nao possui INDICE.md`);
        }
      }
    });

    // Modulos e submodulos
    const modulosDir = path.join(comodosDir, comodo, '01_Dominio', 'modulos');
    if (fs.existsSync(modulosDir)) {
      const modulos = fs.readdirSync(modulosDir).filter(f => fs.statSync(path.join(modulosDir, f)).isDirectory());
      modulos.forEach(mod => {
        if (!mod.startsWith('MOD-C')) {
          reportError(`Modulo com ID invalido: ${mod}`);
        }
        const submodulosDir = path.join(modulosDir, mod, 'submodulos');
        if (fs.existsSync(submodulosDir)) {
          const submodulos = fs.readdirSync(submodulosDir).filter(f => fs.statSync(path.join(submodulosDir, f)).isDirectory());
          submodulos.forEach(sub => {
            if (!sub.startsWith('SUB-C')) {
              reportError(`Submodulo com ID invalido: ${sub}`);
            }
          });
        }
      });
    }
  });
}

// 3. Varrer conteudo por MXX, TASK-MXX, planta/
const docsDirs = ['00_Painel', '01_Planta', '02_Comodos', '03_Fundacao', '06_Inventario', '07_Codigo_Leitura', '08_Execucao_Ao_Vivo'];

function walkDir(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walkDir(file));
    } else if (file.endsWith('.md') || file.endsWith('.canvas')) {
      results.push(file);
    }
  });
  return results;
}

let allFiles = [];
docsDirs.forEach(d => {
  allFiles = allFiles.concat(walkDir(path.join(baseDir, d)));
});

const legacyPattern = /(M0[1-58]|M06|TASK-M0[0-9]|planta\/|file:\/\/\/.*\/planta\/)/g;
// also link check
const mdLinkPattern = /\[.*?\]\((.*?)\)/g;

allFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const match = content.match(legacyPattern);
  if (match) {
    reportError(`Legado encontrado em ${file}: ${[...new Set(match)].join(', ')}`);
  }

  // validate links (basic file path validation)
  let m;
  while ((m = mdLinkPattern.exec(content)) !== null) {
    let link = m[1].split('#')[0];
    if (link && link.endsWith('.md')) {
      // simple relative check if it does not start with http or file:
      if (!link.startsWith('http') && !link.startsWith('file:')) {
        let target = path.resolve(path.dirname(file), link);
        if (!fs.existsSync(target)) {
          reportError(`Link quebrado em ${file}: ${link}`);
        }
      }
    }
  }

  // validate canvas
  if (file.endsWith('.canvas')) {
    try {
      JSON.parse(content);
    } catch(e) {
      reportError(`JSON invalido no Canvas ${file}`);
    }
  }
});

if (errors > 0) {
  console.error(`\n🔥 FALHA! ${errors} erro(s) de estrutura encontrados.`);
  process.exit(1);
} else {
  console.log('\n✅ SUCESSO! A arvore documental esta em conformidade com o Down Plant 2.1.');
  process.exit(0);
}
