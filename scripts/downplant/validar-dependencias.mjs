#!/usr/bin/env node
/**
 * ARQUIVO: scripts/downplant/validar-dependencias.mjs
 * CARD:    #167 [DP24-004] - validador canonico do vinculo de tecnologia existente (§31.4/§31.6)
 *          e da presenca do Vigia de dependencias (§7.8 / §46.14).
 *
 * POR QUE ESTE ARQUIVO EXISTE: o §40.8 manda o lint detectar "dependencia vinculada sem registro de decisao
 * (§31.4)". O lint estrutural (`lint-estrutura.mjs`) varre a ARVORE; o manifesto declara `dependencias/`
 * fora daquela varredura (`03_Fundacao/ESTRUTURA_DO_COFRE.md:37`). Este e o validador canonico da FAMILIA
 * dependencia - mesmo padrao de `validar-portas.mjs` (checklist §12.6) e `validar-handoff.mjs` (§32.14):
 * um validador por familia de contrato, chamado como CLI pela fechadura.
 *
 * O QUE ELE EXIGE, POR REGISTRO `dependencias/DEP-*.md`:
 *   1. os campos do vinculo §31.6 no cabecalho: nome, versao, fonte, data_decisao, decisao, vigia;
 *   2. a Decisao associada (§46.4) EXISTE em `dependencias/decisoes/` e tem os campos do template;
 *   3. a secao `## Vinculo estrutural (§31.4 / §31.6)` existe, com a tabela e >= 1 linha;
 *   4. cada linha: Modulo real no cofre; Circuito existente (ou AUSENTE_DECLARADO); Porta real; o vinculo
 *      `arquivo:linha` existe, a linha existe e, quando a Porta tem artefato §46.3, o vinculo aponta ESSE
 *      artefato - vinculo para outro arquivo e bloqueante, nao "aproximacao aceitavel";
 *   5. a secao `## Vigia (§7.8 / §46.14)` existe, cita o mecanismo real e declara a recusa de aplicar.
 *
 * ESTADOS (mesma semantica de `validar-portas.mjs`): OK | PENDENTE_DECLARADA | BLOQUEANTE.
 * `AUSENTE_DECLARADO` (circuito que nao existe, declarado) e `SEM_ARQUIVO_46.3` (Porta sem artefato, declarada)
 * contam como PENDENTE_DECLARADA - o metodo aceita ausencia DECLARADA, nao aceita ausencia silenciosa.
 * CODIGO DE SAIDA: 1 se houver qualquer BLOQUEANTE; 0 caso contrario.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO = path.resolve(__dirname, '..', '..');
const argv = process.argv.slice(2);
const iRegistro = argv.indexOf('--registro');
const dirRegistroForcado = iRegistro >= 0 ? argv[iRegistro + 1] : null;
const baseDir = argv[0] && !argv[0].startsWith('--') ? path.resolve(argv[0]) : REPO;

const resultado = { ok: 0, pendenteDeclarada: 0, bloqueante: 0 };
const linhas = [];

function bloqueante(msg) { resultado.bloqueante++; linhas.push(`  [BLOQUEANTE] ${msg}`); }
function pendente(msg) { resultado.pendenteDeclarada++; linhas.push(`  [PENDENTE_DECLARADA] ${msg}`); }
function ok(msg) { resultado.ok++; linhas.push(`  [OK] ${msg}`); }

const CAMPOS_VINCULO = ['id', 'nome', 'tipo', 'vinculo', 'estado', 'versao', 'fonte', 'data_decisao',
  'decisao', 'vigia', 'data_registro'];
const CAMPOS_DEC = ['Estado', 'Data', 'Localizacao', 'Contexto', 'Decisao', 'Alternativas', 'Consequencias',
  'Riscos', 'Condicao de revisao'];
const MECANISMO = 'scripts/downplant/vigia-dependencias.mjs';
const CABECALHO_TABELA = '| Modulo | Circuito | Porta | Papel da dependencia na Porta | Vinculo (arquivo:linha) |';
const SECAO_VINCULO = '## Vinculo estrutural (§31.4 / §31.6)';
const SECAO_VIGIA = '## Vigia (§7.8 / §46.14)';

function lerFrontmatter(texto) {
  const m = texto.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  const fm = {};
  m[1].split(/\r?\n/).forEach((linha) => {
    const i = linha.indexOf(':');
    if (i <= 0) return;
    const chave = linha.slice(0, i).trim();
    let valor = linha.slice(i + 1).trim();
    if (valor.startsWith('"') && valor.endsWith('"')) valor = valor.slice(1, -1);
    fm[chave] = valor;
  });
  return fm;
}

// resolve 'caminho/arquivo.md:12' -> { arquivo, linha }
function partirVinculo(celula) {
  const limpo = celula.replace(/`/g, '').trim();
  const m = limpo.match(/^(.*):(\d+)$/);
  if (!m) return null;
  return { arquivo: m[1].trim(), linha: parseInt(m[2], 10) };
}

// O artefato §46.3 titula a linha 1 como `# PORTA C01/MOD-C01-01/P05 — ...` (endereco com barras),
// enquanto o id canonico usa hifens (`PORTA-C01-01-P05`). O validador aceita as duas formas na linha
// citada: exige que a linha contenha o IDENTIFICADOR da Porta, na forma que o artefato realmente usa.
function idsDaPorta(id) {
  const p = id.split('-');
  const alternativo = (p.length === 4 && p[0] === 'PORTA')
    ? `${p[1]}/MOD-${p[1]}-${p[2]}/${p[3]}`
    : null;
  return [id, alternativo].filter(Boolean);
}

function moduloDir(nome) {
  const raiz = path.join(baseDir, '02_Comodos');
  if (!fs.existsSync(raiz)) return null;
  for (const comodo of fs.readdirSync(raiz)) {
    const mods = path.join(raiz, comodo, '01_Dominio', 'modulos');
    if (!fs.existsSync(mods)) continue;
    for (const mod of fs.readdirSync(mods)) {
      if (mod === nome) return path.join(mods, mod);
    }
  }
  return null;
}

function artefatoDaPorta(dirModulo, portaId) {
  const dirPortas = path.join(dirModulo, 'portas');
  if (!fs.existsSync(dirPortas)) return null;
  const alvo = fs.readdirSync(dirPortas).find((f) => f.startsWith(`${portaId}_`) || f === `${portaId}.md`);
  return alvo ? path.join(dirPortas, alvo) : null;
}

function validarRegistro(arquivoDep, dirRegistro) {
  const rel = path.relative(baseDir, arquivoDep).split(path.sep).join('/');
  const texto = fs.readFileSync(arquivoDep, 'utf8');
  const fm = lerFrontmatter(texto);

  CAMPOS_VINCULO.forEach((campo) => {
    if (!fm[campo] || !String(fm[campo]).trim()) {
      bloqueante(`${rel}: campo do vinculo §31.6 ausente ou vazio: "${campo}"`);
    }
  });

  // 2. Decisao associada (§46.4)
  if (fm.decisao) {
    const dirDec = path.join(dirRegistro, 'decisoes');
    const achado = fs.existsSync(dirDec)
      ? fs.readdirSync(dirDec).find((f) => f.startsWith(fm.decisao) && f.endsWith('.md'))
      : null;
    if (!achado) {
      bloqueante(`${rel}: Decisao associada "${fm.decisao}" (§46.4) nao existe em dependencias/decisoes/`);
    } else {
      const textoDec = fs.readFileSync(path.join(dirDec, achado), 'utf8');
      const faltando = CAMPOS_DEC.filter((c) => !new RegExp(`\\*\\*${c}:\\*\\*`).test(textoDec));
      if (faltando.length) {
        bloqueante(`${rel}: Decisao "${fm.decisao}" sem os campos do template §46.4: ${faltando.join(', ')}`);
      } else {
        ok(`${rel}: Decisao §46.4 "${fm.decisao}" presente e completa (${faltando.length === 0 ? 9 : 0}/9 campos)`);
      }
    }
  }

  // 3. Secao de vinculo estrutural + tabela
  const iSec = texto.indexOf(SECAO_VINCULO);
  if (iSec < 0) {
    bloqueante(`${rel}: secao "${SECAO_VINCULO}" ausente`);
  } else if (!texto.includes(CABECALHO_TABELA)) {
    bloqueante(`${rel}: tabela do vinculo estrutural ausente (cabecalho canonico esperado)`);
  } else {
    const resto = texto.slice(iSec + SECAO_VINCULO.length);
    const fim = resto.indexOf('\n## ');
    const bloco = fim >= 0 ? resto.slice(0, fim) : resto;
    const linhasTabela = bloco.split(/\r?\n/)
      .filter((l) => l.trim().startsWith('|'))
      .filter((l) => !/^\|\s*-{2,}/.test(l.trim()))
      .filter((l) => !l.includes('| Modulo | Circuito |'));
    if (!linhasTabela.length) bloqueante(`${rel}: tabela do vinculo estrutural sem linhas`);

    linhasTabela.forEach((linhaTab, idx) => {
      const celulas = linhaTab.split('|').slice(1, -1).map((c) => c.trim());
      if (celulas.length < 5) { bloqueante(`${rel}: linha ${idx + 1} da tabela com ${celulas.length} colunas (esperado 5)`); return; }
      const [modulo, circuito, porta, papel, vinculoCel] = celulas;
      const rotulo = `${rel} linha ${idx + 1} (${porta})`;

      const dirModulo = moduloDir(modulo);
      if (!dirModulo) bloqueante(`${rotulo}: Modulo "${modulo}" nao existe no cofre`);
      if (!/^PORTA-/.test(porta)) bloqueante(`${rotulo}: identificador de Porta invalido "${porta}"`);

      if (circuito === 'AUSENTE_DECLARADO') {
        const alternativa = dirModulo ? path.join(dirModulo, `CIR-MOD-${modulo.replace(/^MOD-/, '')}.canvas`) : null;
        if (alternativa && fs.existsSync(alternativa)) {
          bloqueante(`${rotulo}: declara circuito AUSENTE_DECLARADO, mas ${path.relative(baseDir, alternativa)} existe`);
        } else {
          pendente(`${rotulo}: circuito AUSENTE_DECLARADO (ausencia declarada, aceita)`);
        }
      } else {
        const circuitoAbs = path.join(baseDir, circuito);
        if (!fs.existsSync(circuitoAbs)) bloqueante(`${rotulo}: circuito inexistente "${circuito}"`);
        else if (dirModulo && !circuitoAbs.startsWith(dirModulo + path.sep)) {
          bloqueante(`${rotulo}: circuito "${circuito}" nao pertence ao Modulo declinado`);
        } else ok(`${rotulo}: circuito existe`);
      }

      if (dirModulo && /^PORTA-/.test(porta)) {
        const artefato = artefatoDaPorta(dirModulo, porta);
        if (artefato) {
          if (papel.includes('SEM_ARQUIVO_46.3')) {
            bloqueante(`${rotulo}: declara SEM_ARQUIVO_46.3, mas o artefato ${path.relative(baseDir, artefato)} existe`);
          }
          const p = partirVinculo(vinculoCel);
          if (!p) bloqueante(`${rotulo}: vinculo "${vinculoCel}" fora do formato arquivo:linha`);
          else if (path.basename(p.arquivo) !== path.basename(artefato)) {
            bloqueante(`${rotulo}: vinculo aponta "${p.arquivo}" em vez do artefato da Porta ${path.relative(baseDir, artefato)}`);
          } else {
            const abs = path.join(baseDir, p.arquivo);
            if (!fs.existsSync(abs)) bloqueante(`${rotulo}: vinculo aponta arquivo inexistente "${p.arquivo}"`);
            else {
              const conteudo = fs.readFileSync(abs, 'utf8').split(/\r?\n/);
              if (p.linha < 1 || p.linha > conteudo.length) bloqueante(`${rotulo}: linha ${p.linha} fora de "${p.arquivo}" (${conteudo.length} linhas)`);
              else if (!idsDaPorta(porta).some((v) => conteudo[p.linha - 1].includes(v))) bloqueante(`${rotulo}: linha ${p.linha} de "${p.arquivo}" nao contem o identificador da Porta`);
              else ok(`${rotulo}: vinculo confere — ${p.arquivo}:${p.linha}`);
            }
          }
        } else if (!papel.includes('SEM_ARQUIVO_46.3')) {
          bloqueante(`${rotulo}: a Porta nao tem artefato §46.3 e a linha nao declara SEM_ARQUIVO_46.3`);
        } else {
          const p = partirVinculo(vinculoCel);
          if (!p) bloqueante(`${rotulo}: vinculo "${vinculoCel}" fora do formato arquivo:linha`);
          else if (!fs.existsSync(path.join(baseDir, p.arquivo))) bloqueante(`${rotulo}: vinculo aponta arquivo inexistente "${p.arquivo}"`);
          else pendente(`${rotulo}: SEM_ARQUIVO_46.3 declarado, vinculo em ${p.arquivo}:${p.linha}`);
        }
      }
    });
  }

  // 5. Vigia declarado no registro
  if (!texto.includes(SECAO_VIGIA)) {
    bloqueante(`${rel}: secao "${SECAO_VIGIA}" ausente`);
  } else {
    if (!texto.includes(MECANISMO)) bloqueante(`${rel}: secao do Vigia nao cita o mecanismo ${MECANISMO}`);
    else if (!fs.existsSync(path.join(baseDir, MECANISMO))) bloqueante(`${rel}: mecanismo ${MECANISMO} nao existe`);
    else if (!/nao aplica|NAO aplica|não aplica/i.test(texto)) bloqueante(`${rel}: secao do Vigia nao declara a recusa de aplicar a atualizacao (§7.8)`);
    else ok(`${rel}: Vigia declarado com mecanismo existente e recusa de aplicar`);
  }

  if (fm.vigia) {
    const absSnap = path.join(baseDir, fm.vigia);
    if (!fs.existsSync(absSnap)) bloqueante(`${rel}: observacao upstream "${fm.vigia}" nao existe`);
    else {
      try {
        const j = JSON.parse(fs.readFileSync(absSnap, 'utf8'));
        if (!j.observado_em) bloqueante(`${rel}: observacao upstream sem "observado_em"`);
        else ok(`${rel}: observacao upstream valida (${j.observado_em})`);
      } catch (e) {
        bloqueante(`${rel}: observacao upstream com JSON invalido - ${e.message}`);
      }
    }
  }
}

function principal() {
  const dir = dirRegistroForcado ? path.resolve(dirRegistroForcado) : path.join(baseDir, 'dependencias');
  if (!fs.existsSync(dir)) {
    process.stderr.write(`dependencias/ inexistente em ${baseDir}\n`);
    process.exit(1);
  }
  const registros = fs.readdirSync(dir).filter((f) => /^DEP-\d+.*\.md$/.test(f)).sort();
  if (!registros.length) {
    process.stderr.write('nenhum registro DEP-*.md encontrado\n');
    process.exit(1);
  }
  linhas.push(`Validando ${registros.length} registro(s) §31.6 em ${path.relative(REPO, dir) || dir}`);
  registros.forEach((f) => {
    linhas.push(`\n[${f}]`);
    validarRegistro(path.join(dir, f), dir);
  });

  process.stdout.write(linhas.join('\n') + '\n');
  process.stdout.write(
    `\nRESULTADO §31.6/§7.8: ${resultado.ok} OK / ${resultado.pendenteDeclarada} PENDENTE_DECLARADA / ${resultado.bloqueante} BLOQUEANTE\n`
  );
  if (resultado.bloqueante > 0) {
    process.stdout.write('\nFALHA: o vinculo §31.6 ou o Vigia (§7.8/§46.14) tem pendencia BLOQUEANTE.\n');
    process.exit(1);
  }
  process.stdout.write('\nSUCESSO: vinculos §31.6 completos e Vigia §7.8 declarado, sem pendencia bloqueante.\n');
  process.exit(0);
}

try {
  principal();
} catch (err) {
  process.stderr.write(`erro no validador: ${err.stack || err.message}\n`);
  process.exit(1);
}
