/**
 * ARQUIVO: Entradas/Compatibilidade.js
 * DESCRICAO: Manifesto da API publica do SYNTHEON no Google Apps Script.
 *
 * REGRA DE OURO #5 (compatibilidade operacional): os NOMES chamados pelos menus da planilha NAO mudam.
 * O que este arquivo NAO pode mais fazer e REDEFINIR um simbolo que ja existe em outro arquivo: no
 * Apps Script a ultima definicao carregada vence, entao passar a resolucao a depender da ordem de carga
 * e uma ambiguidade de comportamento. Eliminado no card #134 (COMPAT-FIX-001).
 *
 * IMPORTANTE: as definicoes removidas daqui NAO eram as implementacoes reais - ou eram stubs vazios
 * (`abrirMenuSelecaoLivre`, `iniciarModoAnual`) ou duplicatas de delegacao
 * (`compilarProdutividadeRapida`/`Avancada`) ou uma versao QUEBRADA por depender de modulos que nao
 * sao enviados ao Apps Script (`rodarTesteDeHomologacao`). Os nomes continuam globais e chamáveis.
 *
 * Implementacao canonica UNICA de cada simbolo publico:
 *   abrirFormularioEntrada                       -> Entrada/Menu.js
 *   abrirMenuSelecaoLivre                        -> Compilador_Armas.js        (implementacao real)
 *   iniciarModoAnual                             -> Compilador_Armas.js        (implementacao real)
 *   abrirMenuSelecaoLivreDrogas                  -> Compilador de Entorpecentes.js
 *   iniciarModoAnualDrogas                       -> Compilador de Entorpecentes.js
 *   abrirMenuComparativo2026                     -> Features/CompiladorProdutividade.js
 *   compilarProdutividadeRapida                  -> Features/CompiladorProdutividade.js
 *   compilarProdutividadeAvancada                -> Features/CompiladorProdutividade.js
 *   abrirSeletorMesesGuardiao                    -> Entrada/SeletorMesesGuardiao.js
 *   executarGuardiaoQualidade                    -> Features/GuardiaoQualidade.js
 *   normalizarEfetivo                            -> Features/NormalizadorEfetivo.js
 *   abrirMenuPipMensal / abrirMenuPipLivre / gerarPipAnual -> Compilador PIP.js
 *   abrirMenuCPMMensal / abrirMenuCPMLivre / gerarCPMAnual -> CPM - Compilador de Pontuacao Mensal.js
 *   rodarTesteDeHomologacao                      -> Homologacao/RodarTesteDeHomologacao.js
 *                                                   (NAO enviado ao Apps Script: `Homologacao/**` esta no .claspignore)
 *
 * Consequencia declarada de `rodarTesteDeHomologacao`: como o arcabouco de homologacao nao e enviado,
 * a versao que rodava em producao era a que existia aqui - e ela quebrava no clique, porque instancia
 * `HomologationEngine`/`HomologationSheetsDriver` e usa `testOcorrencias`/`testArmas`/`testDrogas`/
 * `testPontuacao`, todos ausentes do conjunto enviado. O item `[Dev]` do menu P3 e omitido
 * automaticamente em producao (construcao defensiva do #130); no repositorio a funcao existe e e a unica.
 *
 * Guarda automatica: `Testes/TestSemRedefinicaoGlobal.js` falha se qualquer simbolo do produto voltar a
 * ter duas definicoes no conjunto enviado ao Apps Script.
 */

// ---------------------------------------------------------
// Simbolos mantidos por compatibilidade (unicos: nenhuma outra definicao no produto)
// Candidatos a obsolescencia: remover exige confirmar que nenhum acionador (trigger) externo aponta
// para eles - nao ha como provar isso por codigo, por isso seguem aqui com zero chamadores.
// ---------------------------------------------------------
function compilarPIP() {
  // Facade legada sem implementacao. O PIP real entra por `abrirMenuPipMensal` (Compilador PIP.js).
}

function compilarCPM() {
  // Facade legada sem implementacao. O CPM real entra por `abrirMenuCPMMensal` (CPM - Compilador de Pontuacao Mensal.js).
}

function compilarProdutividadeBetaV2() {
  // Reservado para a coexistencia V1 x V2 (Fase 4). Sem implementacao ate la.
}
