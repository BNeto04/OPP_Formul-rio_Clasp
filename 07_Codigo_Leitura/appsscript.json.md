# ESPELHO — appsscript.json

> [!NOTE] Espelho rico de código (Metodo §46.15) — gerado por `scripts/downplant/espelho-rico.mjs`
> Somente leitura. Não editar à mão: qualquer edição é sobrescrita na próxima geração.
> O código abaixo é cópia verbatim do arquivo de origem no commit declarado; divergência entre o embutido e a origem é deriva (§18.1).
> Regra do sha256 declarado: sha256 do conteúdo **normalizado para LF** (igual ao blob do Git). Em arquivo CRLF com terminador final diferente, ele difere do `sha256sum` dos bytes crus — a comparação de deriva é feita conteúdo-contra-conteúdo.
> Papel desta cópia: CANÔNICA (repositório). O derivado navegável no vault é gerado com as mesmas entradas.

- **Endereço Down Plant:** `C00_Governanca_Estrutural / MOD-C00-03_INFRAESTRUTURA_CORE` — [NOTA_DE_RESPONSABILIDADE.md](../02_Comodos/C00_Governanca_Estrutural/01_Dominio/modulos/MOD-C00-03_INFRAESTRUTURA_CORE/NOTA_DE_RESPONSABILIDADE.md)
- **Arquivo de origem (link para o disco):** [`appsscript.json`](../appsscript.json)
- **Commit de referência:** `fbb0608e7b98144533628c7f9b773a10505b800d` (`fbb0608`)
- **Data da última sincronização:** 2026-09-13T22:05:08-03:00

## Código-fonte embutido

Verbatim de `appsscript.json` em `fbb0608`. sha256 do bloco (LF): `a1bc419a4f9bafa13b43f15e698480549e38af666f4d36b2fb668485e14a4dc6` — 10 linhas.

```json
{
  "timeZone": "America/Sao_Paulo",
  "dependencies": {
  },
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "executionApi": {
    "access": "MYSELF"
  }
}
```

## Responsabilidade observada

Fonte: `02_Comodos/C00_Governanca_Estrutural/01_Dominio/modulos/MOD-C00-03_INFRAESTRUTURA_CORE/MOD-C00-03_INFRAESTRUTURA_CORE.md` — CAPSULA do modulo (formato 46.2), "## Responsabilidade".

Enderecar a **infraestrutura transversal de runtime** do produto: utilitarios deterministicos de data, classes
de erro padronizadas, logger operacional e o **manifesto de ambiente** do projeto Google Apps Script. E a casa
canonica dos recursos de `Core/` que **nao pertencem a nenhum modulo de negocio** (GAP declarado no #158).
Nao executa regra de negocio: prove infraestrutura.

Fonte: `02_Comodos/C00_Governanca_Estrutural/01_Dominio/modulos/MOD-C00-03_INFRAESTRUTURA_CORE/MOD-C00-03_INFRAESTRUTURA_CORE.md` — CAPSULA do modulo (formato 46.2), "## Limites".

- **Nao** decide regra de dominio: constantes, tabelas e limiares vivem na ARCA e nos modulos consumidores.
- **Nao** re-declara os utilitarios de `Core/` que **ja possuem endereco canonico proprio** em outros modulos
  (identificadores de configuracao, constantes e utils). Re-declara-los aqui moveria um endereco primario **ja
  fixado** — ver `MAPA_ARTEFATO_ENDERECO_162.md`.
- **Nao** publica o cofre: a fronteira de publicacao e do `MOD-C00-01_ESTRUTURA_DO_COFRE` (`.claspignore`).
- **Nao** altera codigo de produto: o modulo endereca; quem prova o verbatim e o espelho (§46.15).

## Portas expostas (se aplicável)

Não aplicável: nenhuma superfície exportada reconhecida no arquivo.

## Divergência com a Planta declarada

Testes mecânicos executados na geração (commit `fbb0608`, 2026-09-13T22:05:08-03:00):

- OK — T1 endereco existe: NOTA_DE_RESPONSABILIDADE.md do modulo presente
- OK — T2 artefato declarado no endereco: "appsscript.json" aparece na Planta
- OK — T3 arquivo presente no commit de referencia (fbb0608:appsscript.json)
- OK — T4 conteudo em disco identico ao do commit de referencia (sha256 LF)
- OK — T5 espelho anterior sem deriva de codigo (sha256 do bloco == origem)
- OK — T6 endereco declarado no espelho anterior corresponde ao endereco canonico atual
- OK — T7 sem duplicidade: exatamente 1 espelho de leitura declara "appsscript.json" como origem

Veredito mecânico: **nenhuma divergência detectada pelos testes acima**.

Declaração verificada a mão por humano/agente (não derivável automaticamente):

- **Como o endereco foi derivado (nao inventado):** declaracao de artefato na secao "## Artefatos" da capsula §46.2 do endereco `C00_Governanca_Estrutural / MOD-C00-03_INFRAESTRUTURA_CORE` (linha 61 de `02_Comodos/C00_Governanca_Estrutural/01_Dominio/modulos/MOD-C00-03_INFRAESTRUTURA_CORE/MOD-C00-03_INFRAESTRUTURA_CORE.md`) — nivel 1 do MAPA_ARTEFATO_ENDERECO_162.md. O modulo materializa, com ID canonico novo (`MOD-C00-03`, proximo livre do comodo na sequencia existente 01/02), o conteudo PARADO do card #158 `MOD-C00-01_INFRAESTRUTURA_CORE` (arquivado no espelho por colisao de ID com `MOD-C00-01_ESTRUTURA_DO_COFRE`).
- **Ponteiro anterior para elemento PARADO:** o espelho de leitura anterior apontava para `_SUP_158/.../MOD-C00-01_INFRAESTRUTURA_CORE`. O endereco acima NAO e renomeacao daquele elemento: o ID mudou (colisao) e o endereco foi declarado na Planta canonica do repositorio.
- **Nada foi corrigido no artefato:** o gerador nao altera codigo de produto; o arquivo de origem permanece byte a byte como estava.

## Última verificação (data/commit)

- 2026-09-13T22:05:08-03:00 · commit `fbb0608` · sha256 da origem (LF): `a1bc419a4f9bafa13b43f15e698480549e38af666f4d36b2fb668485e14a4dc6`
- Reexecutar: `node scripts/downplant/espelho-rico.mjs gerar --endereco C00_Governanca_Estrutural/MOD-C00-03_INFRAESTRUTURA_CORE --origem appsscript.json --saida <caminho>`
- Verificar deriva sem regravar: `node scripts/downplant/espelho-rico.mjs verificar --espelho <caminho>`
