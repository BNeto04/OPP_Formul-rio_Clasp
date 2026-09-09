/**
 * Syntheon Agentic Layer - Local Sensor (Colmeia H01)
 * Card: #95 H01-004 - Local: "O que existe no disco?"
 *
 * Read-only por padrao: apenas observa o disco; nao modifica nem julga.
 * Evidencia tipada e reproduzivel (schema syntheon.sensor.local.v1).
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SCHEMA = 'syntheon.sensor.local.v1';
const VERSION = '1.0.0';

function sha256Of(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function observePath(target, options = {}) {
  const hash = Boolean(options.hash);
  const abs = path.resolve(target);
  const entry = { path: abs, exists: false, kind: null };
  try {
    const st = fs.statSync(abs);
    entry.exists = true;
    entry.kind = st.isDirectory() ? 'dir' : st.isFile() ? 'file' : 'other';
    if (entry.kind !== 'dir') entry.size_bytes = st.size;
    entry.mtime_iso = st.mtime.toISOString();
    if (hash && entry.kind === 'file') {
      try { entry.sha256 = sha256Of(abs); } catch (e) { entry.sha256_error = String(e.message || e.code); }
    }
  } catch (e) {
    if (e.code === 'ENOENT') {
      entry.exists = false;
    } else {
      entry.exists = false;
      entry.error = String(e.message || e.code);
    }
  }
  return entry;
}

function observe(targets, options = {}) {
  const list = Array.isArray(targets) ? targets : [targets];
  return list.map((t) => observePath(t, options));
}

/**
 * Lista arquivos modificados recentemente sob um diretorio raiz.
 * Somente leitura; ordena do mais recente para o mais antigo.
 */
function listRecent(rootDir, options = {}) {
  const root = path.resolve(rootDir);
  const sinceMs = options.sinceIso ? new Date(options.sinceIso).getTime() : null;
  const max = Number.isFinite(options.max) ? options.max : 100;
  const out = [];

  const walk = (dir) => {
    let items;
    try {
      items = fs.readdirSync(dir, { withFileTypes: true });
    } catch (e) {
      return;
    }
    for (const it of items) {
      const full = path.join(dir, it.name);
      let st;
      try { st = fs.statSync(full); } catch (e) { continue; }
      if (it.isDirectory()) { walk(full); continue; }
      if (sinceMs !== null && st.mtimeMs < sinceMs) continue;
      out.push({ path: full, kind: 'file', size_bytes: st.size, mtime_iso: st.mtime.toISOString() });
    }
  };

  walk(root);
  out.sort((a, b) => (a.mtime_iso < b.mtime_iso ? 1 : -1));
  return out.slice(0, max);
}

module.exports = { SCHEMA, VERSION, observePath, observe, listRecent };
