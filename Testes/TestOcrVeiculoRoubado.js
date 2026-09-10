'use strict';
if (typeof require === 'undefined') { /* Ignora no Apps Script */ } else {

/**
 * ARQUIVO: Testes/TestOcrVeiculoRoubado.js
 * DESCRICAO: Reproducao deterministica do defeito reportado pelo proprietario — BO de veiculo roubado
 * processado por OCR (card #136 OCR-ARCA-002). Teste de REGRESSAO que nasce VERMELHO: so fica verde
 * quando a causa for corrigida (#138).
 *
 * Como o teste carrega o codigo: extrai a funcao REAL `conciliarTitulosPipOcr` de `Entrada/Formulario.html`
 * (extracao por balanceamento de chaves) — nada de copia/paralelo da regra.
 *
 * Fonte dos casos: padrao factual documentado — a regra vigente e `Formulario.html:957-965`; a documentacao
 * do proprietario/Planner registra que palavras soltas como "vítima de roubo" devem ser ignoradas e que o
 * titulo de veiculo so surge quando a NATUREZA confirma recuperacao de veiculo roubado. As variacoes abaixo
 * sao rotulos reais de natureza usados em BO (mesmo vocabulario: RECUPERACAO/APREENSACAO/LOCALIZACAO +
 * VEICULO/MOTO/CARRO + ROUBO/ROUBADO/FURTO/FURTADO). Nenhum campo operacional e inventado: so o rotulo de
 * natureza e a narrativa textual.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('Iniciando Testes: OCR de veiculo roubado no Formulario (OCR-ARCA-002 / #136)...\n');

const REPO = path.join(__dirname, '..');

// ---------- carrega a FUNCAO REAL de Entrada/Formulario.html ----------
function extrairFuncao(html, nome) {
  const marca = 'function ' + nome + '(';
  const i = html.indexOf(marca);
  if (i === -1) throw new Error('funcao nao encontrada no HTML: ' + nome);
  const inicioChaves = html.indexOf('{', i);
  let nivel = 0;
  for (let j = inicioChaves; j < html.length; j++) {
    const c = html[j];
    if (c === '{') nivel++;
    else if (c === '}') { nivel--; if (nivel === 0) return html.slice(i, j + 1); }
  }
  throw new Error('nao foi possivel delimitar a funcao: ' + nome);
}

const html = fs.readFileSync(path.join(REPO, 'Entrada/Formulario.html'), 'utf8');
const fonteConcil = extrairFuncao(html, 'conciliarTitulosPipOcr');

// catalogo identico ao usado em producao (rotulos oficiais da tabela PIP)
const CATALOGO = [
  'Apreensão de arma de fogo revólver',
  'Apreensão de arma de fogo pistola',
  'Apreensão de munição revólver/pistola',
  'Apreensão de maconha por grama (invólucro ou papelote)',
  'Prisão por mandado',
  'Apreensão de veículo furtado ou roubado'
];

global.window = { opcoesFormulario: { ocorrenciasPip: CATALOGO } };
const conciliarTitulosPipOcr = new Function('return ' + fonteConcil)();

const TITULO_VEICULO = 'Apreensão de veículo furtado ou roubado';

let passou = 0, falhou = 0;
function checar(nome, condicao, detalhe) {
  if (condicao) { console.log(`  [PASS] ${nome}`); passou++; }
  else { console.error(`  [FAIL] ${nome}${detalhe ? ' — ' + detalhe : ''}`); falhou++; }
}

console.log(`  (funcao sob teste: Entrada/Formulario.html -> conciliarTitulosPipOcr; ${fonteConcil.split('\n').length} linhas)\n`);

// ---------- A. naturezas que CONFIRMAM recuperacao de veiculo -> DEVEM gerar o titulo ----------
const casosPositivos = [
  { nat: 'RECUPERAÇÃO DE VEÍCULO ROUBADO', obs: 'rotulo canonico (ja coberto hoje)' },
  { nat: 'APREENSÃO DE VEÍCULO FURTADO', obs: 'apreensao + furtado' },
  { nat: 'LOCALIZAÇÃO DE MOTO ROUBADA', obs: 'localizacao + moto' },
  { nat: 'RECUPERAÇÃO DE CARRO ROUBADO', obs: 'carro roubado' },
  { nat: 'ROUBO E RECUPERAÇÃO DE VEÍCULO', obs: 'rotulo composto real de BO (crime + recuperacao)' },
  { nat: 'FURTO E RECUPERAÇÃO DE VEÍCULO', obs: 'rotulo composto real de BO (furto + recuperacao)' },
  { nat: 'RECUPERAÇÃO DE VEÍCULO PRODUTO DE ROUBO', obs: 'terminologia real: "produto de roubo"' },
  { nat: 'VEÍCULO PRODUTO DE ROUBO RECUPERADO', obs: 'ordem inversa com "produto de roubo"' },
  { nat: 'RECUPERAÇÃO DE VEÍCULO ROUBADO/FURTADO', obs: 'dois adjetivos' },
  { nat: 'RECUPERAÇÃO DE VEÍCULO\nROUBADO', obs: 'natureza quebrada em duas linhas no BO' }
];

casosPositivos.forEach(function (caso) {
  const titulos = conciliarTitulosPipOcr('', [], [], caso.nat);
  checar(`NATUREZA "${caso.nat.replace(/\n/g, '\\n')}" deve gerar o titulo de veiculo (${caso.obs})`,
    titulos.indexOf(TITULO_VEICULO) !== -1, 'titulos obtidos: ' + JSON.stringify(titulos));
});

// ---------- B. natureza SEM confirmacao -> NAO pode gerar titulo (defesa anti-falso-positivo) ----------
const casosNegativos = [
  { nat: 'ROUBO DE VEÍCULO', texto: '' },
  { nat: 'FURTO DE VEÍCULO', texto: '' },
  { nat: 'ROUBO A TRANSEUNTE', texto: '' },
  { nat: 'PORTE ILEGAL DE ARMA DE FOGO', texto: 'Durante a busca pessoal, não foram encontrados mandados de prisão em aberto contra o indivíduo, que alegou ser vítima de roubo.' },
  { nat: 'PORTE ILEGAL DE ARMA DE FOGO', texto: 'O conduzido relatou que seu veículo foi roubado há dois dias.' }
];

casosNegativos.forEach(function (caso) {
  const titulos = conciliarTitulosPipOcr(caso.texto, [], [], caso.nat);
  checar(`NATUREZA "${caso.nat}" (${caso.texto ? 'com narrativa de roubo' : 'sem recuperacao'}) NAO pode gerar titulo de veiculo`,
    titulos.indexOf(TITULO_VEICULO) === -1, 'titulos obtidos: ' + JSON.stringify(titulos));
});

console.log(`\nRESULTADOS FINAIS: ${passou} PASS / ${falhou} FAIL`);
if (falhou > 0) {
  console.error('\n>>> TESTE VERMELHO POR DESIGN (card #136): reproduz o defeito do BO de veiculo roubado.');
  console.error('>>> A suite NAO entra no runner ate o #138 corrigir a causa.');
  process.exitCode = 1;
}
}
