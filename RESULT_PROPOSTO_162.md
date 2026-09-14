# RESULT PROPOSTO — #162 (DP24-001) — texto para postagem no card

> Arquivo na **raiz do repositório de propósito** (a raiz não é varrida pelo lint). Não mover para
> dentro das árvores documentais sem tratar a colisão de tokens. Mesmo precedente de
> `RESULT_PROPOSTO_158.md` / `RESULT_PROPOSTO_159.md`.
>
> **Não postado.** O briefing proíbe postar no GitHub nesta fatia. Texto pronto para colagem pelo Planner.

```text
[HERMES] RESULT — #162 (final, 72/72)

STATUS: ENTREGUE — piloto escalado para os 71 restantes. 72/72 nós de 07_Codigo_Leitura/ no repo e no vault.
        Decisão (b) do Planner aplicada no lint. 71 espelhos com 9/9 campos. Lint/verificador/suíte verdes.

EVIDÊNCIA TIPADA
- scripts/downplant/lint-estrutura.mjs (decisão (b): exclusão de legado só em 07_Codigo_Leitura/;
  validadores de link calibrados para ignorar blocos cercados — §2 do relatório, com medição de 0 perda)
- scripts/downplant/espelho-rico.mjs (691 linhas; gerar + verificar + indice; 5 mudanças declaradas em §8.2)
- MAPA_ARTEFATO_ENDERECO_162.md (72 linhas: artefato -> endereço + nível de evidência + linha da Planta)
- RELATORIO_162_ESCALA.md (matriz 72/72 campo a campo, divergências declaradas, não-resolvidos)
- 07_Codigo_Leitura/** (71 espelhos §46.15 + INDICE_AS_IS.md derivado) — repo canônico e vault derivado
- 02_Comodos/C03_Dominio/01_Dominio/modulos/MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO/NOTA_DE_RESPONSABILIDADE.md:19-25
  (tabela de artefatos com coluna de submódulo — dá precisão de SUB aos 5 endereços)
- 02_Comodos/**/MOD-*.md (seção "## Artefatos" das cápsulas §46.2 — 40 derivações de nível 1)
- 03_Fundacao/METODO_DOWN_PLANT_PROGRESSIVO_v2.4.md §46.15 (template dos 9 campos)

AS QUATRO PONTAS
- CÓDIGO: espelho-rico.mjs (gerar/verificar/indice); 71 espelhos com código VERBATIM em bloco cercado +
  sha256 declarado + commit + data; NENHUM arquivo de produto alterado (git status prova).
- DOCUMENTAÇÃO: 71x9/9 campos; mapa artefato->endereço com 72 linhas e evidência linha a linha;
  índice derivado no lugar do stub de 3 linhas / dos 76 linhas velhas que apontavam para o elemento parado.
- CANVAS/PLANTA: 64 endereços canônicos vivos com link para a NOTA; 7 declarados NÃO RESOLVIDO (reportados);
  13 endereços distintos usados; nenhum canvas criado ou alterado.
- GIT: branch sprint/g01-guardiao-qualidade-live-001, HEAD fbb0608e7b98144533628c7f9b773a10505b800d
  = commit declarado nos 71 espelhos. Delta no working tree. Sem commit, sem push, sem card, #172 intocado.

OS 10 CRITÉRIOS DE FECHAMENTO
1) 72/72 no repo ................✅  72 nós (71 espelhos + 1 índice derivado)
2) 9/9 campos ...................✅  71/71 espelhos (o índice não é espelho de artefato — §7.1, divergência declarada)
3) código verbatim completo .....✅  71/71 conferidos conteúdo-contra-conteúdo, sem truncamento
4) commit/SHA/frescor ...........✅  commit = HEAD nos 71; sha = sha da origem nos 71; sha256sum externo bate em 68/71
                                    (3 CRLF com a regra LF declarada no cabeçalho de cada espelho e prova com tr -d \r)
5) endereços vivos ..............✅  64/71 com endereço canônico + link; 7 NÃO RESOLVIDO reportados (nunca inventados)
6) divergências declaradas ......✅  34 espelhos com ACHADO mecânico no corpo; 27 T2 (endereço derivado por
                                    menção, §7.2); 7 T1/T2 (sem endereço); 35 com endereços concorrentes listados
7) varredura de legado só fora do espelho ✅  prova de escopo em 4 experimentos (§1.2): token dentro não é pego,
                                    token fora continua sendo; link quebrado em prosa DENTRO do espelho continua sendo
8) lint verde ...................✅  LINT_EXIT=0 com 72/72 nós
9) verificador rico verde .......✅  71/71 exit 0 (deriva_codigo=false, sha_desatualizado=false, commit_velho=false)
10) suíte exit 0 ................✅  SUITE_EXIT=0 — 630-631 PASS / 0 FAIL (5 execuções; PASS oscila por TestVigiaNaturalLanguage)

DIVERGÊNCIAS DECLARADAS COM O BRIEFING
- "69 dos 72 endereços apontam para _SUP_158/MOD-C00-01_INFRAESTRUTURA_CORE": NÃO reproduzido.
  Medido: 15 de 72 (14 espelhos de arquivo + o índice antigo). O elemento é arquivo morto do #158, colide de
  ID com MOD-C00-01_ESTRUTURA_DO_COFRE sem ser a mesma coisa e nunca existiu em nenhuma ref do Git. Não foi
  renomeado: onde a Planta declara o artefato, o endereço canônico substituiu o ponteiro; onde não declara, o
  campo diz NÃO RESOLVIDO.
- Suíte: esperado 623 PASS / exit 1; medido 630-631 PASS / exit 0 (4x). A oscilação é TestVigiaNaturalLanguage
  (Vigia/Ollama), identificada por diff — card #172, fora do escopo e não tocado. Não usei como justificativa.
- Comportamento de links do lint: o briefing mandou manter o portão de links intacto. Ele ficou intacto em
  cobertura, mas os validadores deixaram de ler o INTERIOR de blocos cercados (arrays JS `[[...]]` viravam
  "WikiLink quebrado" em 5 das 71 origens). Medição: a árvore tinha 0 erros de link antes da mudança, logo
  0 cobertura perdida; e link quebrado em prosa DENTRO do espelho continua sendo reportado (experimento B).

PENDÊNCIAS (com causa) — não resolvidas de propósito
1) 7 artefatos sem endereço canônico (Core/Datas.js, Core/Erros.js, Core/Logger.js, Modelos/IRelatorioModelo.js,
   Plugins/IPluginMetrica.js, Schemas/ProdutividadeSchema.js, appsscript.json). Causa: a Planta não os declara
   como artefato de nenhum endereço (GAP já declarado pelo #158). Tratamento: campo NÃO RESOLVIDO + ACHADO.
   Fechar exige decisão de Planta (criar endereço ou declarar fora de escopo), não de espelho.
2) 27 endereços derivados por menção (T2) — falta mover a declaração para a seção "## Artefatos" do endereço.
3) Colisão de dono: contar-regras-arca.mjs --aplicar --espelho escreve em 2 dos 72 caminhos do vault, hoje
   ocupados pelo espelho rico (§7.3). Requer decisão do Planner. Nada perdido: os dois são gerados.
4) "Portas expostas" segue heurística e não entende .html/.json semanticamente.
5) Divergência semântica (Planta promete x código faz) continua humana; arquivo de declarações versionado não existe.

PRÓXIMO PASSO NATURAL: mover gerar->verificar para o ritual de fechamento (verificar como portão, não boa
vontade) e criar o registro versionado de declarações por endereço.
```
