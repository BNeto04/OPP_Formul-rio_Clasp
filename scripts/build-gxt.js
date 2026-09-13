if (typeof require !== 'undefined') {
  const fs = require('fs');
  const path = require('path');
  const { execSync } = require('child_process');

  const sourceDir = path.resolve(__dirname, '..');
  const targetDir = path.resolve(__dirname, '../../pacote_descartavel_gxt');

  const excludeList = [
    'Debug.js',
    'DebugFormulas.js',
    'Homologacao',
    'Testes',
    'scripts',
    'planta',
    '.git',
    'node_modules',
    'pacote_descartavel_gxt',
    'build-gxt.js'
  ];

  function copyFolderSync(from, to) {
    if (!fs.existsSync(to)) {
      fs.mkdirSync(to, { recursive: true });
    }

    const items = fs.readdirSync(from);
    items.forEach(item => {
      if (excludeList.includes(item)) return;

      const ext = path.extname(item).toLowerCase();
      const srcPath = path.join(from, item);
      const destPath = path.join(to, item);
      const stat = fs.statSync(srcPath);

      if (stat.isDirectory()) {
        if (item === '.git') return;
        if (item === 'temp_clasp_descartavel_check') return;
        if (item === 'temp_clasp_prod_check') return;
        copyFolderSync(srcPath, destPath);
      } else {
        if (item === '.clasp.json' || item === '.claspignore') return;
        if (ext === '.js' || ext === '.json' || ext === '.html' || ext === '.md' || ext === '.py') {
          fs.copyFileSync(srcPath, destPath);
        }
      }
    });
  }

  console.log('Limpando diretório de destino...');
  if (fs.existsSync(targetDir)) {
    const targetItems = fs.readdirSync(targetDir);
    targetItems.forEach(item => {
      if (item === '.clasp.json' || item === '.claspignore') return;
      fs.rmSync(path.join(targetDir, item), { recursive: true, force: true });
    });
  }

  console.log('Copiando arquivos...');
  copyFolderSync(sourceDir, targetDir);

  console.log('Publicando no Apps Script...');
  try {
    execSync('clasp push -f', { cwd: targetDir, stdio: 'inherit' });
    console.log('Deploy concluído com sucesso!');
  } catch (error) {
    console.error('Falha ao executar clasp push:', error.message);
    process.exit(1);
  }
}
