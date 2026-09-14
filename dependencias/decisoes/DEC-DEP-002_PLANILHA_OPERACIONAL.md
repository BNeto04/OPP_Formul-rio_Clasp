# DEC-DEP-002 — Adotar Google Sheets (planilha operacional) como fonte e destino do produto

> **Formato:** secao `46.4 Decisao` do metodo canonico (`03_Fundacao/METODO_DOWN_PLANT_PROGRESSIVO_v2.4.md:808-818`),
> com transliteracao ASCII dos rotulos — mesma convencao ja usada nas evidencias §46.5 deste repo.
> **Natureza:** registro **retroativo** do vinculo §31.6. O uso precede este documento.

- **Estado:** VIGENTE
- **Data:** 2026-09-14 (data do registro do vinculo; card **#167**)
- **Localizacao:** `dependencias/DEP-002_GOOGLE_SHEETS.md` (registro) · Modulos/Circuitos/Portas na secao
  `Vinculo estrutural (§31.4 / §31.6)` do mesmo arquivo
- **Contexto:** a planilha e simultaneamente **fonte do fato** (abas mensais `JAN2026..DEZ2026`, aba `EFETIVO`,
  bases PIP/AIS) e **destino da escrita** (relatorios, abas de auditoria, coluna `AM`). `Core/Config.js` guarda
  os IDs (`OCORRENCIAS_ID`, `PECULIO_ID`).
- **Decisao:** **ADOTAR** (manter) o Google Sheets como fonte canonica e destino operacional. Nao ha banco
  proprio, cache proprio nem copia reconciliada dos dados vivos no repositorio.
- **Alternativas:** (a) **construir** base propria e sincronizar — rejeitada nesta decisao: quebraria o modelo
  de operacao (o operador trabalha dentro da planilha) e nao ha requisito aprovado que a exija; (b) manter
  copia versionada das bases no repo — rejeitada: `.claspignore` mantem `02_Comodos/**` fora do push justamente
  porque **a planilha nao e reconstruivel a partir do repo**; a unica copia versionada existente e a base
  territorial AIS, declarada em `DEP-004`.
- **Consequencias:** (+) zero ETL, zero duplicidade de verdade; (+) a UI do produto e a propria planilha; (−) dado
  sujo na origem contamina o produto (por isso o metodo do #152 separa "erro de origem" de "erro do compilador");
  (−) nao existe prova versionada do conteudo: a prova de producao citada nos cards e **declaracao de card**.
- **Riscos:** alteracao de schema/aba por terceiro fora do controle do projeto; `ANABOLIZANTES` sem coluna de
  destino; 3 celulas com ocorrencias divididas em MIKEs diferentes (decisao de dominio pendente do Proprietario,
  #150); ranges de formula inconsistentes (risco R1 do #142) nao corrigidos.
- **Condicao de revisao:** (1) mudanca de schema das abas canonicas; (2) esgotamento de quota/limite de celulas;
  (3) decisao do Proprietario sobre os 3 casos de MIKE dividido. Revisao disparada pelo relatorio do Vigia
  (§46.14) — o Vigia **nao** altera dados nem schema.
