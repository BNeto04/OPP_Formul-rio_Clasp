/**
 * ARQUIVO: Entrada/WebAppExecucao.js
 * DESCRICAO: Endpoint HTTP de execucao headless do produto (web app) - infraestrutura de apoio.
 *
 * Por que existe: o `clasp run` (Apps Script API, executionApi MYSELF) recusa a conta com
 * "The caller does not have permission" mesmo com posse, manifesto, deployment e escopos corretos
 * (verificado 11/09/2026). Este endpoint executa funcoes por HTTPS com a autorizacao do proprio
 * documento, sem depender de sessao de usuario na maquina do agente.
 *
 * SEGURANCA (obrigatoria):
 *  - o token fica em Script Properties (TOKEN_EXECUCAO), NUNCA no codigo/Git;
 *  - sem token valido nada e executado;
 *  - so funcoes da LISTA BRANCA rodam; nomes privados (terminados em "_") sao recusados;
 *  - retorno sempre JSON, sem eco de segredos.
 *
 * SETUP (uma vez, pelo dono do script):
 *  1) Configuracoes do projeto > Propriedades do script > Adicionar propriedade:
 *     TOKEN_EXECUCAO = <segredo combinado com o agente>
 *  2) Implantar > Nova implantacao > Tipo: App da Web
 *     "Executar como": Eu  |  "Quem tem acesso": Qualquer pessoa  -> Implantar
 *  3) Informar a URL do app da Web ao agente.
 */

/** Funcoes expostas ao agente (somente leitura/diagnostico). Ampliar exige decisao explicita. */
var EXECUCAO_LISTA_BRANCA_ = [
  'getEfetivo',
  'obterOpcoesValidacao',
  'obterTabelaTerritorialAIS',
  'resolverAISTerritorial'
];

/** Le a propriedade com o token do endpoint (fail-soft se PropertiesService nao existir). */
function obterTokenExecucao_() {
  try {
    if (typeof PropertiesService === 'undefined') return '';
    const p = PropertiesService.getScriptProperties();
    return (p && p.getProperty('TOKEN_EXECUCAO')) || '';
  } catch (e) {
    return '';
  }
}

/** Comparacao de token em tempo constante (evita timing attack simples). */
function tokenConfere_(informado, esperado) {
  const a = String(informado === undefined || informado === null ? '' : informado);
  const b = String(esperado === undefined || esperado === null ? '' : esperado);
  if (!b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/** Normaliza a requisicao: aceita corpo JSON (postData) ou parametros de formulario. */
function lerRequisicaoExecucao_(e) {
  const req = e || {};
  const params = req.parameter || {};
  let token = params.token || '';
  let funcao = params.funcao || '';
  let args = [];
  try {
    if (req.postData && req.postData.contents) {
      const corpo = JSON.parse(req.postData.contents);
      token = corpo.token || token;
      funcao = corpo.funcao || funcao;
      if (Array.isArray(corpo.params)) args = corpo.params;
    } else if (params.params) {
      const parsed = JSON.parse(params.params);
      if (Array.isArray(parsed)) args = parsed;
    }
  } catch (err) {
    return { ok: false, erro: 'CORPO_INVALIDO' };
  }
  return { ok: true, token: token, funcao: funcao, args: args };
}

/** Executa a funcao pedida, aplicando token + lista branca. Sempre devolve JSON. */
function executarComando_(e) {
  const req = lerRequisicaoExecucao_(e);
  if (!req.ok) return { ok: false, erro: req.erro };
  if (!tokenConfere_(req.token, obterTokenExecucao_())) return { ok: false, erro: 'NAO_AUTORIZADO' };

  const nome = String(req.funcao || '').trim();
  if (!nome || /_$/.test(nome) || EXECUCAO_LISTA_BRANCA_.indexOf(nome) === -1) {
    return { ok: false, erro: 'FUNCAO_NAO_PERMITIDA', funcao: nome };
  }
  try {
    const G = (typeof globalThis !== 'undefined') ? globalThis : this;
    const alvo = G[nome];
    if (typeof alvo !== 'function') return { ok: false, erro: 'FUNCAO_INEXISTENTE', funcao: nome };
    const resultado = alvo.apply(null, req.args || []);
    return { ok: true, funcao: nome, resultado: resultado === undefined ? null : resultado };
  } catch (err) {
    return { ok: false, erro: 'FALHA_EXECUCAO', funcao: nome, mensagem: String(err && err.message ? err.message : err) };
  }
}

/** Health check (nao executa nada e nao exige token). */
function doGet(e) {
  const corpo = { ok: true, servico: 'execucao-headless', funcoes: EXECUCAO_LISTA_BRANCA_.length, tokenConfigurado: !!obterTokenExecucao_() };
  return responderJson_(corpo);
}

/** Execucao. */
function doPost(e) {
  return responderJson_(executarComando_(e));
}

/** Serializa a resposta como JSON (fail-soft se ContentService nao existir - testes). */
function responderJson_(obj) {
  const texto = JSON.stringify(obj);
  try {
    if (typeof ContentService !== 'undefined') {
      return ContentService.createTextOutput(texto).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (err) { /* segue para o retorno simples */ }
  return texto;
}
