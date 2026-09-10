# 01_Dominio.md

NÃO APLICÁVEL.


---

## MOD-C01-02_NORMALIZADOR_DE_EFETIVO (G01 #127 / ARCA-FIX-004, 10/09/2026)

- Modulo: `01_Dominio/modulos/MOD-C01-02_NORMALIZADOR_DE_EFETIVO/`
- Circuito: `CIR-MOD-C01-02_NORMALIZADOR_DE_EFETIVO.canvas` | Submodulo: `SUB-C01-02-01_DEPENDENCIA_ARCA`
- Componente: `Features/NormalizadorEfetivo.js` (gatilho em `Entrada/Menu.js`)
- Dependencia factual da ARCA: `obterMetadadosArca()` -> ARCA-EFETIVO-001/002, ARCA-MATRICULA-001, ARCA-ANTIGUIDADE-001 (porta `AdaptadorConsultaArca`, read-only, fail-soft)
- Rastreabilidade: aba `[AUDITORIA] Efetivo` registra a linha "REGRAS ARCA"
- Planta Mestra: node `n_norm` + arestas e7 (ARCA -> normalizador) e e8 (Peculio -> normalizador)
