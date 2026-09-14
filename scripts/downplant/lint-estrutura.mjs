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

// 1. Verificar Manifesto DP-VAULT-1 em 03_Fundacao/ESTRUTURA_DO_COFRE.md
const manifestoPath = path.join(baseDir, '03_Fundacao', 'ESTRUTURA_DO_COFRE.md');
if (!fs.existsSync(manifestoPath)) {
  reportError('Manifesto ESTRUTURA_DO_COFRE.md nao encontrado.');
} else {
  const content = fs.readFileSync(manifestoPath, 'utf8');
  if (!content.includes('manifest: "DP-VAULT-1"') || !content.includes('version: "2.1"') || !content.includes('profile: "P1"')) {
    reportError('Manifesto incompleto: requer DP-VAULT-1, versao 2.1 e perfil P1 no frontmatter.');
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

  const comodosEsperados = [
    'C00_Governanca_Estrutural',
    'C01_Entrada',
    'C02_Leitura',
    'C03_Dominio',
    'C04_Motor',
    'C05_Guardiao',
    'C06_Relatorios',
    'C08_Homologacao'
  ];

  comodosEsperados.forEach(c => {
    const cPath = path.join(comodosDir, c);
    if (!fs.existsSync(cPath) || !fs.statSync(cPath).isDirectory()) {
      reportError(`Comodo esperado ausente: ${c}`);
    }
  });

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
          reportError(`Modulo com ID invalido: ${mod} em ${comodo}`);
        }
        const submodulosDir = path.join(modulosDir, mod, 'submodulos');
        if (fs.existsSync(submodulosDir)) {
          const submodulos = fs.readdirSync(submodulosDir).filter(f => fs.statSync(path.join(submodulosDir, f)).isDirectory());
          submodulos.forEach(sub => {
            if (!sub.startsWith('SUB-C')) {
              reportError(`Submodulo com ID invalido: ${sub} em ${mod}`);
            }
          });
        }
      });
    }
  });
}

// 3. Varrer conteudo por M[0-9]{2}, TASK-M, planta/, file:/// e validar links
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

const legacyPattern = /(M[0-9]{2}|TASK-M[0-9]*|planta\/|file:\/\/\/)/g;
const mdLinkPattern = /\[.*?\]\((.*?)\)/g;
const wikiLinkPattern = /\[\[(.*?)\]\]/g;

// ---------------------------------------------------------------------------
// DECISAO DO PLANNER (card #162, rota b): a varredura de CONTEUDO AUTORAL/LEGADO
// nao se aplica ao conteudo ESPELHADO de 07_Codigo_Leitura/.
//
// Porque: o espelho rico (§46.15) tem obrigacao de reproduzir o codigo de origem
// VERBATIM. Token interno da copia nao e prosa autoral — tratar como legado e
// falso positivo estrutural (o espelho nao pode nem documentar a colisao, porque
// o texto de documentacao tambem e varrido).
//
// Escopo da exclusao: SOMENTE a varredura de legado/conteudo autoral desta camada.
// O espelho permanece submetido a TRES portoes proprios:
//   (1) ESTE lint estrutural — links markdown, wikilinks e nos de canvas continuam
//       validados para os arquivos de 07_Codigo_Leitura (blocos abaixo, intactos);
//   (2) o verificador §46.15 (scripts/downplant/espelho-rico.mjs verificar) — 9/9 campos;
//   (3) a prova de frescor — commit + sha256 + codigo embutido == origem real.
const ARVORE_ESPELHO = path.join(baseDir, '07_Codigo_Leitura') + path.sep;
const ehConteudoEspelhado = (arquivo) => arquivo.startsWith(ARVORE_ESPELHO);

// ---------------------------------------------------------------------------
// SEGUNDO FALSO POSITIVO DA MESMA RAIZ (medido, card #162).
// Ao materializar o codigo VERBATIM no repo, o validador de links passa a interpretar
// CONTEUDO DE CODIGO como markup documental: arrays JS aninhados (`[[...]]`) viram
// "WikiLink quebrado" e trechos de codigo viram "Link quebrado".
// Correcao: os validadores de LINK (markdown e wiki) ignoram o interior de blocos
// cercados. Codigo nao e markup de documento.
// Isto NAO afrouxa o portao: link quebrado em PROSA continua sendo reportado, inclusive
// dentro de 07_Codigo_Leitura (era o pedido do Planner). Medicao antes da mudanca:
// a arvore tinha 0 (zero) erros de link — logo a exclusao remove 0 erro real hoje.
// O portao de CANVAS (nos de arquivo + JSON) e o de ESTRUTURA seguem 100% intactos.
const blocosCercados = /(^|\n)(?:```|~~~)[^\n]*\n[\s\S]*?\n(?:```|~~~)[ \t]*(?=\n|$)/g;
function semBlocosCercados(conteudo) {
  return conteudo.replace(blocosCercados, '\n');
}

allFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  if (!ehConteudoEspelhado(file)) {
    const match = content.match(legacyPattern);
    if (match) {
      reportError(`Legado encontrado em ${file}: ${[...new Set(match)].join(', ')}`);
    }
  }

  // Validacao de links: apenas o texto do documento, fora dos blocos cercados.
  const textoDocumental = semBlocosCercados(content);

  // Validate Markdown Links
  let m;
  while ((m = mdLinkPattern.exec(textoDocumental)) !== null) {
    let link = m[1].split('#')[0];
    if (link && !link.startsWith('http') && !link.startsWith('mailto:') && !link.startsWith('#')) {
      let target = path.resolve(path.dirname(file), link);
      if (!fs.existsSync(target)) {
        reportError(`Link quebrado em ${file}: ${link}`);
      }
    }
  }

  // Validate WikiLinks
  let w;
  while ((w = wikiLinkPattern.exec(textoDocumental)) !== null) {
    let link = w[1].split('|')[0].split('#')[0].trim();
    if (link) {
      let found = false;
      // Search in all doc files for match
      for (const targetFile of allFiles) {
        if (path.basename(targetFile, path.extname(targetFile)) === link || path.basename(targetFile) === link) {
          found = true;
          break;
        }
      }
      if (!found) {
        reportError(`WikiLink quebrado em ${file}: [[${w[1]}]]`);
      }
    }
  }

  // Validate Canvas JSON & File Nodes
  if (file.endsWith('.canvas')) {
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed.nodes)) {
        parsed.nodes.forEach(n => {
          if (n.type === 'file' && n.file) {
            const target = path.resolve(baseDir, n.file);
            if (!fs.existsSync(target)) {
              reportError(`Canvas file node destino inexistente em ${file}: ${n.file}`);
            }
          }
        });
      }
    } catch(e) {
      reportError(`JSON invalido no Canvas ${file}: ${e.message}`);
    }
  }
});

if (errors > 0) {
  console.error(`\n🔥 FALHA! ${errors} erro(s) de estrutura encontrados.`);
  process.exit(1);
} else {
  console.log('\n✅ SUCESSO! A arvore documental esta em estrita conformidade com o Down Plant 2.1.');
  process.exit(0);
}
