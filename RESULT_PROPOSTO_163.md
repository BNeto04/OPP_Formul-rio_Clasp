# RESULT PROPOSTO — #163 (DP24-002) — texto para postagem no card

> Arquivo na **raiz do repositório de propósito** (mesmo precedente de `RESULT_PROPOSTO_158.md`,
> `RESULT_PROPOSTO_159.md` e `RESULT_PROPOSTO_162.md`).
>
> **Não postado.** O briefing proíbe postar no GitHub nesta fatia. Texto pronto para colagem pelo Planner.
> Relatório completo com a medição campo a campo: `RELATORIO_163.md`.

```text
[HERMES] RESULT — #163 (DP24-002)

STATUS: ENTREGUE — §32.14 integrada ao validador CANÔNICO de handoff que já existia (#156). Nenhum
        segundo validador criado. Delta medido: 13 verificações do contrato (7 require + 2 ensure +
        1 invariant + reuso/portão) sobre 27 verificações antigas intactas.
        Validador 40 PASS / 0 FAIL (exit 0) · teste 18 PASS / 0 FAIL (exit 0) · lint exit 0 ·
        suíte 648-649 PASS / 0 FAIL (exit 0, duas execuções).

EVIDÊNCIA TIPADA
- 03_Fundacao/METODO_DOWN_PLANT_PROGRESSIVO_v2.4.md:577-593 — require/ensure/invariant da §32.14,
  citados verbatim no relatório (fonte: texto canônico versionado no repo, commit 42ca47e)
- 03_Fundacao/METODO_DOWN_PLANT_PROGRESSIVO_v2.4.md:969-996 — objeto §46.12, usado como fixture
  positivo VERBATIM (diff vazio contra Testes/Fixtures/handoff_32_14/exemplo_46_12.yaml, 26 linhas)
- scripts/downplant/validar-handoff.mjs:212-333 (validarContrato32_14: 7 require + 2 ensure),
  :168-210 (projetar32_14 + enums), :328-341 (vizinhosDe), :346 (portão isMain — reuso sem segundo
  validador), :44-62 (--handoff), :74-84 (semComentario), :456-470 (seção 8 no CLI = o invariante)
- 08_Execucao_Ao_Vivo/downplant_handoff.yaml:51-63 — os 6 campos que faltavam (escala, task.id,
  task.acao, task.alvo, escopo.pode_expandir, estado.portao_destino); os demais campos do require
  são PROJETADOS de contexto_de_task, sem duplicação (mapa em validar-handoff.mjs:183-193)
- Testes/TestValidarHandoffContrato32_14.js (190 linhas) + 9 fixtures em Testes/Fixtures/handoff_32_14/
  (duplicado/{a,b}.handoff.yaml; negativos de escala, task.id, pode_expandir, portões, escopo.arquivos)
- Testes/RodarTodosOsTestes.js:102 — portão do contrato dentro da suíte
- RELATORIO_163.md (medição antes/depois campo a campo + mapa §32.14 → implementação)

TESTE RED → GREEN (saída do teste)
- VERMELHO (antes do delta): node Testes/TestValidarHandoffContrato32_14.js → 13 FAIL / 3 PASS.
  Amostra: "[FAIL] sem escala -> rejeitado: esperado exit 1 ..., obtido 2"; "[FAIL] o YAML de exemplo
  do §46.12 passa o contrato de entrada (§32.14): esperado exit 0, obtido 2". Antes, handoff inválido
  pela §32.14 NÃO era rejeitado pelo contrato (exit 2 = arquivo não encontrado): era aceito por omissão.
- VERDE (depois do delta): 18 PASS / 0 FAIL, exit 0 — casos: sem escala, task.id ausente, task.id
  duplicado, sem pode_expandir, sem portões, escopo.arquivos vazio com ação de mutação, task.id não
  rastreável, Task com handoff inexistente → TODOS exit 1 com o campo nomeado e
  "§32.14 invariant — Executor BLOQUEADO"; e exemplo §46.12 → exit 0.
- Não-regressão byte a byte: o validador de HEAD rodado contra o repo produz PASS idênticas às 27
  primeiras do validador novo (diff vazio).

AS QUATRO PONTAS
- CÓDIGO: validar-handoff.mjs estendido (1 arquivo, mesmas 27 verificações + 13 do §32.14, exit 0);
  parser do §46.12 verbatim; nenhum arquivo de produto alterado (Core/, Features/, Entrada/, Render/,
  Dominio/ intocados — git status prova).
- DOCUMENTAÇÃO: RELATORIO_163.md (medição antes/depois + mapa §32.14 → arquivo:linha + pendências);
  08_Execucao_Ao_Vivo/downplant_handoff.md derivado (§3.1 nova, §7 corrigida — o 2.4 canônico tem
  §46.11/§46.12/§32.14, resolvendo a divergência registrada no #156).
- CANVAS/PLANTA: sem delta estrutural — nenhum cômodo, módulo, porta, circuito ou nó criado/alterado;
  nenhum .canvas tocado.
- GIT: branch sprint/g01-guardiao-qualidade-live-001, HEAD c7dd84bc7b7e5171aec57a2b8e1c177f326975bb.
  Delta só no working tree (6 modificados + Testes/Fixtures/handoff_32_14/ e Testes/
  TestValidarHandoffContrato32_14.js novos). Sem commit, sem push, sem postagem, sem card novo, #172
  intocado.

DIVERGÊNCIAS DECLARADAS COM O BRIEFING
- "hoje verde (28 PASS / 0 FAIL)": medido 27 PASS / 0 FAIL no validador do #156 (contagem de linhas
  "  PASS  "). A diferença é de contagem, não de cobertura: nenhuma verificação antiga foi removida
  (diff da saída do validador de HEAD contra as 27 primeiras linhas do novo é vazio).
- "suíte": esperado falha por TestVigiaNaturalLanguage (#172); medido exit 0 nas três execuções
  (antes 630 [PASS]/0 FAIL; depois 648 e 649 [PASS]/0 FAIL) e o NLU passou — não usei a oscilação
  como justificativa. A variação de 1 PASS entre as duas execuções pós-delta é do texto do NLU.

PENDÊNCIAS (com causa) — não resolvidas de propósito
1) Espelho .md do handoff sem gerador versionado → a derivação do §3.1 foi manual (contraria o §46.11
   na forma). O gerador/verificador do par downplant_handoff.{yaml,md} não existe; o espelho-rico.mjs
   do #162 cobre §46.15 (código), não este par. Fora do delta.
2) Unicidade de task.id é verificada entre handoffs do MESMO diretório (não há registro central de
   Tasks no repo). Ponto de extensão declarado: vizinhosDe().
3) campos legados do objeto (fatia_ativa/card_origem = #156+#157; arquivos_permitidos da fatia do #156)
   seguem como estavam: atualizá-los não é exigência do 2.4 e mexeria na narrativa do objeto.
4) ensure 2 satisfeita por declaração (GIT_STATE: PENDENTE, sem commit por regra do card): a
   verificação roda sobre o histórico real (400 commits) e reporta 0 commit atribuído à Task.

PRÓXIMO PASSO NATURAL: rodar o validador como PORTÃO antes de cada aceitação de Task (exit != 0 =
não inicia) e, quando o Planner emitir handoffs §46.12 por Task, alimentá-los por --handoff — sem
criar validador paralelo.
```
