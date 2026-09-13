const http = require('http');

const payload = [
  'CANONICAL_BRANCH: sprint/c01-ocr-form-sheets-001',
  'BEFORE_LOCAL_BRANCH: audit/vigia-runtime-current',
  'BEFORE_LOCAL_HEAD: 6281e99d175606680695b1938a7e382771e62506',
  'BEFORE_REMOTE_HEAD: b44b6dd30d1d567913ed3923423d7e66eccb0581',
  'RELATION_BETWEEN_BRANCHES: FAST_FORWARD_ANCESTRY. O merge-base entre audit/vigia-runtime-current e origin/sprint/c01-ocr-form-sheets-001 e b44b6dd. O commit 6281e99 e um descendente direto e limpo contendo o hardening das pontes, wake reativo (#59) e a sincronizacao documental (#55).',
  'ACTION_TAKEN: Criada e ativada a branch local sprint/c01-ocr-form-sheets-001 em 6281e99; preservadas todas as modificacoes preexistentes; executado git push origin sprint/c01-ocr-form-sheets-001 com sucesso (exit 0); confirmada paridade LOCAL_HEAD == REMOTE_HEAD; re-executada a suite de testes (exit 0); atualizados AGORA.md, INVENTARIO_AS_IS.md e INICIO.md no Obsidian.',
  'FILES_PRESERVED: Core/RegrasQualidade.js, Core/Utils.js, Features/GuardiaoQualidade.js, Features/NormalizadorEfetivo.js, Render/RendererAuditoriaSaude.js, Testes/TestEntradaManualFormulario.js, Testes/TestGuardiao.js, Testes/TestRenderers.js, VigiaPonte/*, Dominio/ARCA/* (todas as alteracoes preexistentes preservadas intactas).',
  'FILES_CHANGED: 08_Execucao_Ao_Vivo/AGORA.md, 06_Inventario/INVENTARIO_AS_IS.md, 00_Painel/INICIO.md (Obsidian Vault).',
  'TESTS_RERUN: TestEntradaManualFormulario.js (exit 0); TestFormularioAis.js (exit 0); TestFormularioCidadeBairro.js (exit 0); ValidarIntegridadeTabelaAIS.js (exit 0).',
  'AFTER_LOCAL_HEAD: 6281e99d175606680695b1938a7e382771e62506',
  'AFTER_REMOTE_HEAD: 6281e99d175606680695b1938a7e382771e62506',
  'PUSH_CONFIRMED: SIM (b44b6dd..6281e99 sprint/c01-ocr-form-sheets-001 -> sprint/c01-ocr-form-sheets-001, exit 0).',
  'CODE_STATE: ALINHADO (comportamento preservado e verificado; suite 100% verde).',
  'DOC_STATE: ALINHADO (Inventario AS-IS, AGORA.md, INICIO.md e espelhos reconciliados com a branch canonica).',
  'CANVAS_STATE: ALINHADO / NAO_APLICAVEL (Planta Mestra e Planta C01 aderentes ao escopo da Sprint).',
  'GIT_STATE: ALINHADO (branch canonica sprint/c01-ocr-form-sheets-001, LOCAL_HEAD == REMOTE_HEAD == 6281e99).',
  'DIVERGENCES: Nenhuma remanescente. A divergencia de branch e HEAD apontada pela auditoria foi sanada de ponta a ponta.',
  'DONE_GATE: APROVADO. As quatro pontas de icamento (#57) estao 100% coerentes, sincronizadas e versionadas na branch canonica local e remota.',
  'NEXT_ACTION: Iniciar a execucao do Card #56: T-C01-DADOS-FATO-002 (Fechar contrato operacional da secao Dados do Fato).'
].join('\n');

const body = JSON.stringify({
  call_id: 'CALL-T-C01-BASELINE-001-AUDIT-FIX-001',
  task_id: 'T-C01-BASELINE-001',
  type: 'RESULT',
  payload: payload
});

const req = http.request({
  hostname: '127.0.0.1',
  port: 8767,
  path: '/result',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body)
  }
}, res => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    console.log('POST /result response status:', res.statusCode);
    console.log('POST /result response body:', data);
  });
});

req.on('error', err => {
  console.error('POST /result error:', err.message);
});

req.write(body);
req.end();
