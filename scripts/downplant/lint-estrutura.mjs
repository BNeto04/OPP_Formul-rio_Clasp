import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve project root independent of cwd
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(__dirname, '../../');

let errors = [];

function checkFile(condition, msg) {
    if (!condition) errors.push('❌ ' + msg);
}

function walkDir(dir, callback) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (file === 'node_modules' || file === '.git' || file === 'Testes' || file === 'scripts') continue;
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath, callback);
        } else {
            callback(fullPath, file);
        }
    }
}

// 1. Taxonomia Documental (Diretórios Raiz)
const requiredRoots = [
    '00_Painel', '01_Planta', '02_Comodos', '03_Fundacao',
    '06_Inventario', '07_Codigo_Leitura', '08_Execucao_Ao_Vivo'
];

requiredRoots.forEach(root => {
    checkFile(fs.existsSync(path.join(ROOT, root)), 'Diretório raiz ausente: ' + root);
});

// 2. Manifesto DP-VAULT-1 em ESTRUTURA_DO_COFRE.md
const cofrePath = path.join(ROOT, '03_Fundacao', 'ESTRUTURA_DO_COFRE.md');
if (fs.existsSync(cofrePath)) {
    const cofreContent = fs.readFileSync(cofrePath, 'utf8');
    checkFile(cofreContent.includes('manifest: "DP-VAULT-1"'), 'Manifesto DP-VAULT-1 ausente em ESTRUTURA_DO_COFRE.md');
} else {
    errors.push('❌ ESTRUTURA_DO_COFRE.md ausente.');
}

// 3. Seis Slots P1
const comodosDir = path.join(ROOT, '02_Comodos');
if (fs.existsSync(comodosDir)) {
    const comodos = fs.readdirSync(comodosDir).filter(c => fs.statSync(path.join(comodosDir, c)).isDirectory());
    const requiredSlots = [
        '00_Visao_Do_Comodo.md', '01_Dominio.md', '02_Integracoes.md', 
        '03_Especificacoes.md', '04_Execucao.md', '05_Evidencias.md'
    ];
    
    comodos.forEach(comodo => {
        checkFile(/^C\d{2}_/.test(comodo), 'Cômodo com ID inválido (esperado CXX_...): ' + comodo);

        requiredSlots.forEach(slot => {
            checkFile(fs.existsSync(path.join(comodosDir, comodo, slot)), 'Slot P1 ausente em ' + comodo + ': ' + slot);
        });
    });
}

// 4. Ausência de MXX/planta em pastas de documentação e validação de links Markdown/WikiLinks
const docRoots = requiredRoots.map(r => path.join(ROOT, r));
if (fs.existsSync(path.join(ROOT, 'README.md'))) docRoots.push(path.join(ROOT, 'README.md'));

const linkRegex = /\[.*?\]\((.*?)\)/g;

docRoots.forEach(docRoot => {
    if (!fs.existsSync(docRoot)) return;
    
    if (fs.statSync(docRoot).isFile()) {
        processFile(docRoot, path.basename(docRoot));
    } else {
        walkDir(docRoot, processFile);
    }
});

function processFile(fullPath, file) {
    checkFile(!file.match(/\bM\d{2}\b/), 'Nome legado MXX não permitido em documentação: ' + fullPath);
    checkFile(!fullPath.includes('/planta/') && !fullPath.includes('\\planta\\'), 'Diretório legado planta/ encontrado: ' + fullPath);
    
    if (fullPath.endsWith('.md') || fullPath.endsWith('.canvas')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        checkFile(!content.match(/\bM0[1-6]\b/), 'Referência legada MXX no conteúdo: ' + fullPath);
        checkFile(!content.match(/\bTASK-M\d{2}\b/), 'Referência legada TASK-MXX no conteúdo: ' + fullPath);
        checkFile(!content.match(/planta\//), 'Referência legada planta/ no conteúdo: ' + fullPath);

        let match;
        while ((match = linkRegex.exec(content)) !== null) {
            const linkTarget = match[1];
            if (linkTarget.startsWith('http') || linkTarget.startsWith('#') || linkTarget.startsWith('mailto:')) continue;
            
            let cleanLink = linkTarget.replace(/^file:\/\/\//, '').replace(/^file:\/\//, '').split('#')[0];
            if (!cleanLink) continue;

            // Converter barras no Windows
            cleanLink = cleanLink.replace(/\//g, path.sep);
            
            let targetPath;
            if (path.isAbsolute(cleanLink)) {
                targetPath = cleanLink;
            } else {
                targetPath = path.resolve(path.dirname(fullPath), cleanLink);
            }
            
            checkFile(fs.existsSync(targetPath), 'Link quebrado em ' + fullPath + ': ' + linkTarget);
        }
    }

    if (fullPath.endsWith('.canvas')) {
        try {
            JSON.parse(fs.readFileSync(fullPath, 'utf8'));
        } catch (e) {
            errors.push('❌ Arquivo .canvas possui JSON inválido: ' + fullPath + ' - ' + e.message);
        }
    }
}

if (errors.length > 0) {
    console.error('\nForam encontrados ' + errors.length + ' erros no Linter Estrutural:\n');
    errors.forEach(e => console.error(e));
    process.exit(1);
} else {
    console.log('\n✅ Estrutura Down Plant 2.1 validada com sucesso! Todos os cômodos e links estão intactos.\n');
    process.exit(0);
}

