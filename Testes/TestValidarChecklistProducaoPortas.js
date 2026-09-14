'use strict';
if (typeof require === 'undefined') { /* Ignora no Apps Script */ } else {

/**
 * ARQUIVO: Testes/TestValidarChecklistProducaoPortas.js
 * CARD:    #164 [DP24-003] - FECHADURA do checklist de producao da Porta (§12.6).
 *
 * O que esta fechadura impede (regra do §12.6):
 *   uma Porta que cruza Comodo, expoe efeito externo ou lida com concorrencia passar por
 *   "verificada" SEM declarar o checklist de producao — e um item `pendente` sem justificativa
 *   passar como se fosse resposta (o metodo diz que `pendente` bloqueia a Porta em G7, com o
 *   mesmo peso de um `ensure` nao satisfeito).
 *
 * Como ela funciona (sem segundo validador):
 *   1. chama o validador canonico UNICO (scripts/downplant/validar-portas.mjs) como CLI e exige
 *      exit 0 no repositorio real e exit 1 em cada cenario de RED (fixtures + mini-repo);
 *   2. exercita as mesmas funcoes exportadas (`validarPortaArquivo`) sobre fixtures negativas,
 *      uma por defeito de completude (secao ausente, item ausente, pendente sem justificativa,
 *      estado invalido, referencia a Instalacao transversal inexistente);
 *   3. prova dentes no artefato REAL: copia uma Porta real e remove um item do checklist —
 *      o validador tem de acusar;
 *   4. confere o MAPA de pendencias do inventario contra os arquivos das Portas, item a item.
 *
 * Se qualquer ponto divergir, este teste FICA VERMELHO (exit 1).
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { pathToFileURL } = require('url');

const REPO = path.join(__dirname, '..');
const VALIDADOR = path.join(REPO, 'scripts', 'downplant', 'validar-portas.mjs');
const FIX = path.join(REPO, 'Testes', 'Fixtures', 'portas_12_6');
const MINI = path.join(FIX, 'mini_repo');
const INVENTARIO = path.join('02_Comodos', 'C00_Governanca_Estrutural', '03_Especificacoes',
  'INVENTARIO_PORTAS_E_CHECKLIST_12_6.md');

let sucessos = 0;
let falhas = 0;
function test(nome, fn) {
  try { fn(); console.log(`  [PASS] ${nome}`); sucessos++; }
  catch (err) { console.error(`  [FAIL] ${nome}: ${err.message}`); falhas++; }
}

// --- o MESMO validador, chamado como CLI -------------------------------------
function rodar(baseDir, registryRel) {
  const args = [VALIDADOR, baseDir];
  if (registryRel) args.push('--registry', registryRel);
  try {
    const saida = execFileSync(process.execPath, args, { cwd: REPO, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
    return { exit: 0, saida };
  } catch (err) {
    return {
      exit: err.status === undefined || err.status === null ? -1 : err.status,
      saida: `${err.stdout || ''}${err.stderr || ''}`
    };
  }
}

function numeros(saida) {
  const g = (rotulo) => {
    const m = saida.match(new RegExp(`${rotulo}[^\\n]*?\\.{2,}\\s*(\\d+)`));
    return m ? Number(m[1]) : null;
  };
  return {
    registros: g('Portas no inventario'),
    elegiveis: g('Portas ELEGIVEIS'),
    naoElegiveis: g('Portas nao elegiveis'),
    arquivos: g('Arquivos de Porta no cofre'),
    pendentes: g("Itens 'pendente' declarados"),
    pass: g('Verificacoes')
  };
}

/** Le a secao 4 do inventario (mapa Porta x item pendente). */
function mapaDePendencias(texto) {
  const linhas = texto.replace(/\r\n/g, '\n').split('\n');
  const i = linhas.findIndex(l => /^## 4\./.test(l.trim()));
  if (i === -1) throw new Error('inventario sem a secao 4 (mapa de pendencias)');
  const fim = linhas.findIndex((l, n) => n > i && /^###\s/.test(l.trim()));
  const corpo = linhas.slice(i + 1, fim === -1 ? linhas.length : fim);
  const mapa = [];
  corpo.forEach(l => {
    const t = l.trim();
    if (!t.startsWith('|')) return;
    const c = t.replace(/^\|/, '').replace(/\|$/, '').split('|').map(x => x.trim());
    if (c.length < 3) return;
    if (/^-+$/.test(c[0]) || /^porta$/i.test(c[0])) return;
    mapa.push({ porta: c[0], itens: c[1].split(',').map(x => x.trim()).filter(Boolean) });
  });
  return mapa;
}

async function rodarSuite() {
  console.log('=== TESTES: CHECKLIST DE PRODUCAO DA PORTA §12.6 (#164 DP24-003) ===\n');

  // ---------------------------------------------------------------------------
  // 1. Verdadeiro no repositorio real
  // ---------------------------------------------------------------------------
  console.log('1) Verde no repositorio real (inventario + 25 Portas elegiveis)');
  const repo = rodar(REPO);
  test('o validador do §12.6 fica VERDE no repositorio real (exit 0)', () => {
    assert.strictEqual(repo.exit, 0, `esperado exit 0, obtido ${repo.exit}\n${repo.saida}`);
    assert.ok(/SUCESSO/.test(repo.saida), repo.saida);
    assert.ok(!/  FAIL  /.test(repo.saida), `nao pode haver FAIL no repo real:\n${repo.saida}`);
  });

  const n = numeros(repo.saida);
  test('o resumo conta as Portas: 45 no inventario, 25 elegiveis, 20 nao elegiveis, 25 arquivos', () => {
    assert.strictEqual(n.registros, 45, `Portas no inventario = ${n.registros}, esperado 45`);
    assert.strictEqual(n.elegiveis, 25, `Portas elegiveis = ${n.elegiveis}, esperado 25`);
    assert.strictEqual(n.naoElegiveis, 20, `Portas nao elegiveis = ${n.naoElegiveis}, esperado 20`);
    assert.strictEqual(n.arquivos, 25, `arquivos de Porta = ${n.arquivos}, esperado 25`);
  });

  test('o validador confere os 9 itens nas 25 Portas elegiveis (>= 225 verificacoes de item)', () => {
    assert.ok(n.pass >= 225, `verificacoes = ${n.pass}, esperado >= 225 (25 Portas x 9 itens)`);
    const blocos = (repo.saida.match(/os 9 itens do §12\.6 estao presentes/g) || []).length;
    assert.strictEqual(blocos, 25, `blocos de 9 itens verificados = ${blocos}, esperado 25`);
  });

  // ---------------------------------------------------------------------------
  // 2. RED — o estado ANTES do card e os defeitos de completude
  // ---------------------------------------------------------------------------
  console.log('\n2) RED — cenarios em que o §12.6 NAO esta satisfeito (exit 1 obrigatorio)');
  const REG = (nome) => path.join('02_Comodos', 'C00_Governanca_Estrutural', '03_Especificacoes', nome);

  {
    const r = rodar(MINI, REG('inventario_antes_do_card.md'));
    test('RED (estado antes do card): Portas elegiveis sem arquivo §46.3 -> exit 1', () => {
      assert.strictEqual(r.exit, 1, `esperado exit 1, obtido ${r.exit}\n${r.saida}`);
      assert.ok(/ELEGIVEL sem 'arquivo_porta'/.test(r.saida), r.saida);
      assert.ok(/C00\/MOD-C00-99\/P01/.test(r.saida) && /C00\/MOD-C00-99\/P02/.test(r.saida),
        `a falha deve nomear cada Porta sem checklist:\n${r.saida}`);
    });
  }

  {
    const r = rodar(MINI, REG('inventario_porta_sem_arquivo.md'));
    test('RED: Porta elegivel declarada com arquivo inexistente -> exit 1 nomeando a Porta', () => {
      assert.strictEqual(r.exit, 1, `esperado exit 1, obtido ${r.exit}\n${r.saida}`);
      assert.ok(/arquivo declarado NAO EXISTE/.test(r.saida), r.saida);
      assert.ok(/C00\/MOD-C00-99\/P02/.test(r.saida), r.saida);
    });
  }

  {
    const r = rodar(MINI, REG('inventario_ornamental.md'));
    test('RED: arquivo de Porta fora do inventario (Porta ornamental) -> exit 1', () => {
      assert.strictEqual(r.exit, 1, `esperado exit 1, obtido ${r.exit}\n${r.saida}`);
      assert.ok(/ornamental/i.test(r.saida), r.saida);
      assert.ok(/PORTA-C00-99-P02_NAO_DECLARADA\.md/.test(r.saida), r.saida);
    });
  }

  {
    const r = rodar(MINI, REG('inventario_ok.md'));
    test('CONTROLE: o mesmo mini-repo com inventario coerente -> exit 0 (o RED acima nao e ruido)', () => {
      assert.strictEqual(r.exit, 0, `esperado exit 0, obtido ${r.exit}\n${r.saida}`);
    });
  }

  // ---------------------------------------------------------------------------
  // 3. Defeitos de completude, um a um, pelo MESMO validador (sem segundo validador)
  // ---------------------------------------------------------------------------
  console.log('\n3) Defeitos de completude do checklist, um a um');
  const mod = await import(pathToFileURL(VALIDADOR).href);
  assert.strictEqual(typeof mod.validarPortaArquivo, 'function',
    'o validador canonico deve expor validarPortaArquivo (reuso, sem segundo validador)');
  assert.deepStrictEqual(mod.ITENS_12_6,
    ['idempotente', 'deduplicacao', 'rate_limit', 'paginacao', 'validacao_entrada',
     'operacao_atomica', 'race_condition', 'cache', 'retry_pelo_cliente'],
    'os 9 itens do §12.6 devem ser exatamente os declarados no metodo 2.4');

  const validar = (arquivo) => {
    const rel = path.join('Testes', 'Fixtures', 'portas_12_6', arquivo);
    return mod.validarPortaArquivo(rel, fs.readFileSync(path.join(FIX, arquivo), 'utf8'), REPO);
  };

  test('fixture completa -> nenhuma falha (o validador nao reprova checklist correto)', () => {
    const r = validar('porta_valida.md');
    assert.deepStrictEqual(r.falhas, [], JSON.stringify(r.falhas));
  });

  test('secao `## Checklist de produção (§12.6)` ausente -> falha nomeando a secao', () => {
    const r = validar('porta_sem_secao.md');
    assert.ok(r.falhas.some(f => /Checklist de produção \(§12\.6\)' ausente/.test(f)), JSON.stringify(r.falhas));
  });

  test('item do §12.6 removido (cache) -> falha nomeando o item ausente', () => {
    const r = validar('porta_sem_item.md');
    assert.ok(r.falhas.some(f => /itens do §12\.6 AUSENTES: cache/.test(f)), JSON.stringify(r.falhas));
  });

  test('`pendente` sem justificativa -> falha (o metodo exige justificativa escrita)', () => {
    const r = validar('porta_pendente_sem_justificativa.md');
    assert.ok(r.falhas.some(f => /'pendente' SEM justificativa/.test(f)), JSON.stringify(r.falhas));
  });

  test('estado fora de {aplicavel|nao_aplicavel|pendente} -> falha nomeando o estado', () => {
    const r = validar('porta_estado_invalido.md');
    assert.ok(r.falhas.some(f => /estado invalido/.test(f)), JSON.stringify(r.falhas));
  });

  test('referencia a Instalacao transversal inexistente (§8.11) -> falha nomeando o INST', () => {
    const r = validar('porta_inst_inexistente.md');
    assert.ok(r.falhas.some(f => /INST-NAO-EXISTE-999/.test(f)), JSON.stringify(r.falhas));
  });

  // ---------------------------------------------------------------------------
  // 4. Dentes no artefato REAL (copia em temp: nada e escrito no repositorio)
  // ---------------------------------------------------------------------------
  console.log('\n4) Dentes no artefato real (copia temporaria, repositorio intacto)');
  const REAL = path.join(REPO, '02_Comodos', 'C01_Entrada', '01_Dominio', 'modulos',
    'MOD-C01-01_FORMULARIO_E_MENUS', 'portas', 'PORTA-C01-01-P01_MENU_P3.md');
  const realTxt = fs.readFileSync(REAL, 'utf8');

  test('a Porta real P3 passa o validador (baseline)', () => {
    const r = mod.validarPortaArquivo('copia.md', realTxt, REPO);
    assert.deepStrictEqual(r.falhas, [], JSON.stringify(r.falhas));
  });

  test('removendo o item `cache` da Porta real, o validador acusa (o teste tem dentes)', () => {
    const mutado = realTxt.split('\n').filter(l => !/^\|\s*cache\s*\|/.test(l.trim())).join('\n');
    assert.notStrictEqual(mutado, realTxt, 'a fixture mutada deve diferir da real');
    const r = mod.validarPortaArquivo('copia_mutada.md', mutado, REPO);
    assert.ok(r.falhas.some(f => /AUSENTES: cache/.test(f)), JSON.stringify(r.falhas));
  });

  test('removendo a secao do checklist da Porta real, o validador acusa (fim do "aceito por omissao")', () => {
    const mutado = realTxt.replace(/^## Checklist de produção \(§12\.6\)$/m, '## Checklist removido');
    assert.notStrictEqual(mutado, realTxt, 'a fixture mutada deve diferir da real');
    const r = mod.validarPortaArquivo('copia_sem_secao.md', mutado, REPO);
    assert.ok(r.falhas.some(f => /ausente — a Porta nao declara o checklist/.test(f)), JSON.stringify(r.falhas));
  });

  // ---------------------------------------------------------------------------
  // 5. O mapa de pendencias do inventario bate item a item com os arquivos
  // ---------------------------------------------------------------------------
  console.log('\n5) Mapa de pendencias (inventario) x arquivos das Portas');
  const invTxt = fs.readFileSync(path.join(REPO, INVENTARIO), 'utf8');

  test('todo item declarado como pendente no inventario esta marcado `pendente` na Porta dona', () => {
    const mapa = mapaDePendencias(invTxt);
    assert.ok(mapa.length >= 10, `mapa de pendencias com ${mapa.length} linhas — esperado >= 10`);
    const regs = mod.parseInventario(invTxt).registros;
    mapa.forEach(({ porta, itens }) => {
      const row = regs.find(r => r.porta === porta);
      assert.ok(row, `inventario do mapa de pendencias aponta Porta inexistente no registro: ${porta}`);
      const abs = path.join(REPO, row.arquivo_porta);
      const { itens: marcados } = mod.lerItensChecklist(fs.readFileSync(abs, 'utf8'));
      itens.forEach(item => {
        assert.ok(marcados[item], `item '${item}' nao existe na Porta ${porta}`);
        assert.strictEqual(marcados[item].estado, 'pendente',
          `${porta}: item '${item}' esta '${marcados[item].estado}' no arquivo mas o inventario o declara pendente`);
      });
    });
  });

  test('nenhum item `pendente` existe em arquivo de Porta sem constar do mapa do inventario', () => {
    const mapa = mapaDePendencias(invTxt);
    const declarados = mapa.reduce((acc, { porta, itens }) => {
      acc.set(porta, (acc.get(porta) || []).concat(itens));
      return acc;
    }, new Map());
    const regs = mod.parseInventario(invTxt).registros.filter(r => String(r.elegivel).toUpperCase() === 'SIM');
    regs.forEach(r => {
      const { itens } = mod.lerItensChecklist(fs.readFileSync(path.join(REPO, r.arquivo_porta), 'utf8'));
      Object.keys(itens).forEach(k => {
        if (itens[k].estado !== 'pendente') return;
        const lista = declarados.get(r.porta) || [];
        assert.ok(lista.includes(k),
          `${r.porta}: item '${k}' esta pendente no arquivo e NAO consta do mapa de pendencias do inventario`);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // 6. Resultado
  // ---------------------------------------------------------------------------
  console.log(`\nRESULTADOS FINAIS: ${sucessos} PASS / ${falhas} FAIL`);
  if (falhas > 0) process.exitCode = 1;
}

module.exports = rodarSuite;

if (require.main === module) {
  rodarSuite().catch(err => {
    console.error('Falha na fechadura do checklist §12.6:', err);
    process.exit(1);
  });
}

}
