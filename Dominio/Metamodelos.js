/**
 * ARQUIVO: Dominio/Metamodelos.js
 * DEPRECATED: Os metamodelos foram movidos para Config/Metamodelos.js
 * Este arquivo é mantido apenas como ponte de compatibilidade retroativa.
 */
if (typeof FonteDados === 'undefined' && typeof require !== 'undefined') {
  const meta = require('../Config/Metamodelos');
  global.FonteDados = meta.FonteDados;
  global.CatalogoEstruturas = meta.CatalogoEstruturas;
}

