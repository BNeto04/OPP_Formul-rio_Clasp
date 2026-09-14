# CURADOR ESTRUTURAL (§7.7 / §46.13) e o par YAML/Markdown do handoff (§4.5 / §46.11)

## 1. O papel (verbatim do método canônico)

> "O Curador não toma decisões arquiteturais por conta própria:
> OBSERVA → COMPARA → DETECTA → ATUALIZA O QUE FOR MECÂNICO
>                               ou
>                             → REPORTA O QUE EXIGIR DECISÃO"
> — `03_Fundacao/METODO_DOWN_PLANT_PROGRESSIVO_v2.4.md:228-231` (§7.7)

> "YAML e Markdown do handoff divergentes → o YAML vence; a divergência em si é deriva a ser
> reportada pelo Curador (§7.7)"
> — `03_Fundacao/METODO_DOWN_PLANT_PROGRESSIVO_v2.4.md:181` (§4.5)

> "Gerado automaticamente a partir do objeto downplant_handoff (§46.12). Não editar diretamente —
> editar o YAML de origem e regerar."
> — `03_Fundacao/METODO_DOWN_PLANT_PROGRESSIVO_v2.4.md:926` (§46.11)

## 2. O que ele OBSERVA
- o commit observado (hash/branch) e os caminhos que ele tocou;
- o par do handoff: `08_Execucao_Ao_Vivo/downplant_handoff.yaml` (canônico) e
  `08_Execucao_Ao_Vivo/downplant_handoff.md` (espelho);
- os campos do modelo §46.12/§46.11 que o objeto **não** declara;
- as referências declaradas no objeto (existência em disco).

## 3. O que ele COMPARA
`espelho em disco` **x** `espelho DERIVADO do YAML` (byte a byte, sha256 dos dois lados) — §4.5.
Nada mais é comparado: a §32.14 tem um dono só (o validador canônico) e não é duplicada aqui.

## 4. O que ele REPORTA
O relatório na estrutura exata da seção `46.13 Relatório do Curador`
(`METODO_DOWN_PLANT_PROGRESSIVO_v2.4.md:998-1015`): 6 campos de cabeçalho, 7 seções e a saída
`SINCRONIZADO | DIVERGENTE | NENHUMA AÇÃO`.

- `SINCRONIZADO` — o espelho é byte a byte o derivado do YAML e nenhum campo do modelo está ausente.
- `DIVERGENTE` — há qualquer divergência detectada (par divergente, linha do espelho sem derivação,
  campo do modelo ausente, referência quebrada).
- `NENHUMA AÇÃO` — não há objeto `downplant_handoff` materializado no escopo observado.

## 5. A ÚNICA ação mecânica (e por que só ela)
Regerar o espelho a partir do YAML canônico, com `--aplicar`. O Curador **não reimplementa** o
gerador: ele **reusa** `gerarMarkdown` de `scripts/downplant/gerar-handoff-md.mjs` (mecanismo único
do §46.11). Sem `--aplicar` o Curador não escreve nada; sem `--out` não escreve nem o relatório.

## 6. O que ele se RECUSA a fazer
- **NÃO** decide arquitetura, **NÃO** escolhe fonte canônica (§4.5 já decidiu: *o YAML vence*),
  **NÃO** renomeia módulo, **NÃO** reconcilia arquivo divergente — isso é `REPORTA O QUE EXIGIR DECISÃO`;
- **NÃO** inventa dado: campo ausente é medido e reportado como ausente, nunca preenchido;
- **NÃO** cria segundo parser YAML (reusa `parseYaml` do validador canônico) nem segundo gerador;
- recusa com código de saída `!= 0` qualquer pedido de decisão/mutação não-mecânica:
  `--decidir`, `--decisao`, `--resolver`, `--fix`, `--auto`, `--patch`, `--upgrade`.

## 7. Comandos
```bash
# relatório §46.13 (somente leitura):
node scripts/downplant/curador-estrutural.mjs

# materializar o relatório (escreve SOMENTE o arquivo indicado):
node scripts/downplant/curador-estrutural.mjs --out 08_Execucao_Ao_Vivo/RELATORIO_CURADOR_<data>.md

# aplicar a ação mecânica (regerar o espelho do YAML) e reportar a atualização realizada:
node scripts/downplant/curador-estrutural.mjs --aplicar --out 08_Execucao_Ao_Vivo/RELATORIO_CURADOR_<data>.md

# o gerador canônico do espelho (§46.11), isolado:
node scripts/downplant/gerar-handoff-md.mjs --check     # 0 = espelho deriva do YAML | 1 = divergente
node scripts/downplant/gerar-handoff-md.mjs --mapa      # tabela de derivação (linha do .md -> chave do YAML)
node scripts/downplant/gerar-handoff-md.mjs --aplicar   # regera o espelho a partir do YAML
```

O código de saída do Curador **não** é um portão: ele sai `0` sempre que consegue relatar (a
divergência é informada no relatório, não convertida em bloqueio de build). Sai `!= 0` apenas em erro
de uso, erro de leitura/parse ou pedido de decisão recusado. O portão do par é a fechadura.

## 8. Arquivos
- `scripts/downplant/curador-estrutural.mjs` — o mecanismo do relatório §46.13 (somente leitura por padrão).
- `scripts/downplant/gerar-handoff-md.mjs` — o gerador canônico do espelho §46.11 (YAML → Markdown).
- `08_Execucao_Ao_Vivo/RELATORIO_CURADOR_2026-09-14.md` — último relatório materializado (§46.13).
- `Testes/TestCuradorEstrutural.js` — fechadura: prova a derivação, prova os RED (edição manual do
  `.md`; YAML alterado sem regerar), prova o formato §46.13 extraído do próprio método, prova os
  limites §7.7 (não muta sem `--aplicar`; recusa decisão) e homologa o §46.14.

## 9. Proveniência
- Card **#168** (`DP24-005`), pai **#57**; fatia `sprint/g01-guardiao-qualidade-live-001`.
- Bloco 1 da série `DP24`: §46.13 (§46.14 homologado no #167, `DP24-004`).
