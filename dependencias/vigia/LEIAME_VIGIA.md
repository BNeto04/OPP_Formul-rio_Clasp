# VIGIA DE DEPENDENCIAS (§7.8 / §46.14) - como opera

Papel irmao do Curador Estrutural, voltado para **fora** do projeto
(`03_Fundacao/METODO_DOWN_PLANT_PROGRESSIVO_v2.4.md:232-234`): manter o inventario de tecnologia existente
**vinculada** a Modulos/Circuitos/Portas (§31.4-§31.6) atualizado e sinalizar atualizacao relevante upstream.

## O que ele OBSERVA
- o **vinculo** de cada `dependencias/DEP-*.md` (nome, versao registrada, fonte declarada, decisao associada);
- a **fonte externa declarada** no campo `fonte` de cada registro (release notes / changelog / advisory);
- o que a observacao upstream registrou em `dependencias/vigia/UPSTREAM_OBSERVADO.json`.

## O que ele COMPARA
`versao` registrada no vinculo **x** `versao_observada` da observacao upstream - item a item.

## O que ele REPORTA
O relatorio no formato da secao `46.14 Relatorio do Vigia de dependencias`
(`03_Fundacao/METODO_DOWN_PLANT_PROGRESSIVO_v2.4.md:1016-1028`), com estado final
`SINCRONIZADO | DEFASADO | NENHUMA AÇÃO` e, quando ha defasagem, `Recomendação` +
`Decisão humana necessária`.

## O que ele se RECUSA a fazer (contrato do §7.8)
> "O Vigia nao decide adotar ou trocar uma dependencia por conta propria - apenas observa, compara e reporta
> ao Planejador ou Proprietario." (`METODO...:234`)
> "nunca aplica a atualizacao por conta propria." (`METODO...:508`)

- **NAO** atualiza versao, **NAO** troca dependencia, **NAO** edita o registro, **NAO** resolve a defasagem.
- **NAO** inventa dado upstream: sem observacao registrada, o item sai como `NENHUMA AÇÃO`.
- **NAO** escreve em arquivo nenhum sem `--out` explicito.
- Recusa com codigo de saida != 0 qualquer pedido de mutacao: `--aplicar`, `--atualizar`, `--fix`, `--auto`,
  `--write-registry`, `--escrever`, `--patch`.

## Comandos (rodada periodica declarada - assistida nesta fatia)
```bash
# 1. observacao (agente/humano sob card): consultar a fonte declarada de cada DEP e registrar em
#    dependencias/vigia/UPSTREAM_OBSERVADO.json
# 2. comparacao + relatorio (somente leitura; nao escreve nada):
node scripts/downplant/vigia-dependencias.mjs
# 3. materializar o relatorio (escreve SOMENTE o arquivo indicado):
node scripts/downplant/vigia-dependencias.mjs --out dependencias/vigia/RELATORIO_VIGIA_<data>.md
```

O codigo de saida do Vigia **nao** e um portao: ele sai 0 sempre que consegue relatar (a defasagem e informada
no relatorio, nao convertida em bloqueio de build). Ele sai != 0 apenas em erro de uso ou em pedido de mutacao.

## Arquivos
- `dependencias/vigia/UPSTREAM_OBSERVADO.json` - insumo de observacao (mantido por quem observa).
- `dependencias/vigia/RELATORIO_VIGIA_2026-09-14.md` - ultimo relatorio materializado (§46.14).
- `scripts/downplant/vigia-dependencias.mjs` - o mecanismo (somente leitura).
- `Testes/TestVigiaDependencias.js` - fechadura: prova o formato, prova que nao muta e prova a recusa.
