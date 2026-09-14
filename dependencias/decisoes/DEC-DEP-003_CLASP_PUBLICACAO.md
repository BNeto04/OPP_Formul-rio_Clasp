# DEC-DEP-003 — Adotar `clasp` como unica via de publicacao e de execucao remota

> **Formato:** secao `46.4 Decisao` do metodo canonico (`03_Fundacao/METODO_DOWN_PLANT_PROGRESSIVO_v2.4.md:808-818`),
> com transliteracao ASCII dos rotulos — mesma convencao ja usada nas evidencias §46.5 deste repo.
> **Natureza:** registro **retroativo** do vinculo §31.6. O uso precede este documento.

- **Estado:** VIGENTE — com **defasagem de registro declarada** (ver `Riscos`)
- **Data:** 2026-09-14 (data do registro do vinculo; card **#167**)
- **Localizacao:** `dependencias/DEP-003_CLASP_DEPLOY.md` (registro) · Modulos/Circuitos/Portas na secao
  `Vinculo estrutural (§31.4 / §31.6)` do mesmo arquivo
- **Contexto:** `clasp` liga o checkout local ao projeto Apps Script (`.clasp.json`, `scriptId`) e e usado tanto
  para `push`/`pull` quanto para `run` (execucao remota das portas headless). E tambem o ponto onde **codigo
  local vira produto**.
- **Decisao:** **ADOTAR** (manter) `clasp` como unica via de publicacao e de execucao remota. Nenhuma outra
  ferramenta de publicacao e usada ou mantida em paralelo.
- **Alternativas:** (a) **construir** publicador proprio sobre a Apps Script API — rejeitada: seria reimplementar
  capacidade existente pronta (proibido pelo §31.2) sem requisito que a justifique; (b) publicar manualmente pelo
  editor do Apps Script — rejeitada: perde reprodutibilidade, versionamento e a rota `run` usada pelas portas
  headless; (c) trocar por ferramenta equivalente — sem ganho medido; permanece como alternativa aberta.
- **Consequencias:** (+) uma unica fronteira de publicacao, auditavel por `.claspignore`; (+) rota `run` habilita
  as provas headless das Portas; (−) escrever no cofre **nao** publica nada (`02_Comodos/**` esta no
  `.claspignore`) — documentacao e produto sao publicados por caminhos diferentes.
- **Riscos:** **(R1 — defasagem real, medida em 2026-09-14)** a **versao do `clasp` nunca foi registrada no
  repositorio**, embora o §31.6 exija versao no vinculo; a observacao upstream registra `dist-tags.latest =
  3.4.1` (npm) e releases do GitHub parando em `v3.3.0` (2026-03-12) — **os dois numeros divergem entre si** e
  nenhum deles corresponde a uma versao instalada comprovada. **(R2)** credenciais nao documentadas no repo.
  **(R3)** os dois numeros de arquivos publicados registrados nos cards (**81/81** x **68**) nunca foram
  reconciliados.
- **Condicao de revisao:** (1) versao instalada registrada no vinculo (fecha R1); (2) qualquer alteracao de
  `.claspignore`; (3) reconciliacao de 81 x 68. Revisao disparada pelo relatorio do Vigia (§46.14) — o Vigia
  **nao** instala, nao atualiza e nao registra versao por conta propria.
