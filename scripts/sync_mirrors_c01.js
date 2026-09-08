const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const repoRoot = 'C:\\Users\\Bneto04\\Documents\\Codex\\syntheon-gs-downplant-offline';
const vaultRoot = 'C:\\Users\\Bneto04\\Documents\\Obsidian\\Obsidian_Brain\\Syntheon';
const head = 'ebb0c69';

function updateMirror(relRepo, relVault, lang, submodulo) {
  const src = path.join(repoRoot, relRepo);
  const dst = path.join(vaultRoot, relVault);
  const content = fs.readFileSync(src, 'utf8');
  const hash = crypto.createHash('sha256').update(Buffer.from(content)).digest('hex');
  const baseName = path.basename(relRepo);

  const header = [
    '# ' + baseName,
    '',
    '> [!NOTE] Espelho de Leitura Unidirecional',
    '> - **Caminho Real no Repositório:** `' + relRepo + '`',
    '> - **Commit HEAD:** `' + head + '`',
    '> - **SHA-256:** `' + hash + '`',
    '> - **Status:** RECONCILIADO NO BASELINE (#55)',
    '> - **Endereço Canônico Down Plant:** [[02_Comodos/C01_Entrada/01_Dominio/modulos/MOD-C01-01_FORMULARIO_E_MENUS/submodulos/' + submodulo + '/NOTA_DE_RESPONSABILIDADE.md|' + submodulo + ']]',
    '> - **Aviso:** Arquivo estritamente somente-leitura gerado para inspeção no Obsidian. Alterações não sincronizam de volta ao repositório.',
    '',
    '## Código Fonte',
    '```' + lang,
    content,
    '```',
    ''
  ].join('\n');

  fs.writeFileSync(dst, header, 'utf8');
  console.log('Atualizado com sucesso:', dst, 'Hash:', hash);
}

updateMirror('Entrada/Formulario.html', '07_Codigo_Leitura/Entrada/Formulario.html.md', 'html', 'SUB-C01-01-01_OCR_E_CONFERENCIA');
updateMirror('Entrada/EntradaManual.js', '07_Codigo_Leitura/Entrada/EntradaManual.js.md', 'javascript', 'SUB-C01-01-02_PERSISTENCIA_MANUAL');
