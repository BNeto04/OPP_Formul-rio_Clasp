# DEC-DEP-001 — Adotar Google Apps Script como runtime de execucao do produto

> **Formato:** secao `46.4 Decisao` do metodo canonico (`03_Fundacao/METODO_DOWN_PLANT_PROGRESSIVO_v2.4.md:808-818`),
> com transliteracao ASCII dos rotulos — mesma convencao ja usada nas evidencias §46.5 deste repo.
> **Natureza:** registro **retroativo** do vinculo §31.6. O uso da tecnologia **precede** este documento; o que
> ele faz e declarar, com data, a decisao que sustenta o vinculo hoje. Nao ha decisao nova neste card.

- **Estado:** VIGENTE
- **Data:** 2026-09-14 (data do registro do vinculo; card **#167**)
- **Localizacao:** `dependencias/DEP-001_GOOGLE_APPS_SCRIPT.md` (registro) · Modulos/Circuitos/Portas na secao
  `Vinculo estrutural (§31.4 / §31.6)` do mesmo arquivo
- **Contexto:** o produto nao tem servidor proprio: menus, compiladores, Guardiao e portas headless rodam no
  runtime do projeto Apps Script ligado a planilha (`appsscript.json`: `runtimeVersion: V8`). Nao existe caminho
  alternativo de execucao em producao.
- **Decisao:** **ADOTAR** (manter) o Google Apps Script V8 como runtime unico. Nenhuma biblioteca externa e
  declarada pelo manifesto (`"dependencies": {}`).
- **Alternativas:** (a) **construir** servidor proprio — rejeitada: o produto e uma planilha operacional com UI
  nativa do Workspace, e o proprio metodo §31.2 manda preferir o que ja existe pronto; (b) **adaptar** uma rota
  hibrida (endpoint HTTP + runtime externo) — nao adotada: a rota `Entrada/WebAppExecucao.js` foi removida por
  decisao do Proprietario no `INST-EXEC-001` (codigo latente sem consumidor); (c) migrar de runtime — sem
  alternativa de runtime dentro do Apps Script apos a deprecacao do Rhino (a deprecacao citada nas release notes
  e a do Rhino, **nao** a do V8).
- **Consequencias:** (+) zero infraestrutura propria, UI e dados no mesmo ambiente; (+) portas headless existem
  para rodar sem clique; (−) o produto fica preso a quota e ao ciclo de release de um fornecedor unico; (−) toda
  Porta de produto e, por definicao, uma travessia para dentro do runtime do fornecedor.
- **Riscos:** deprecacao de servico usado (`SpreadsheetApp`, `ContentService`, `PropertiesService`, `ScriptApp`)
  ou do proprio runtime; divergencia de fuso ja declarada (`America/Sao_Paulo` no manifesto x `America/Recife`
  em `Core/Config.js`); quota nao documentada em lugar nenhum do repo.
- **Condicao de revisao:** (1) anuncio upstream de deprecacao de servico ou runtime em uso; (2) mudanca de
  contrato de quota que inviabilize um fluxo; (3) decisao do Proprietario de sair do ambiente Workspace. A
  revisao e disparada pelo **relatorio do Vigia** (§46.14) — o Vigia **nao** aplica a troca.
