# AUDITORIA — Governança da ARCA sobre Formulário/OCR e regras de veículo

Card: **#135** (OCR-ARCA-001) | Branch: `sprint/g01-guardiao-qualidade-live-001` | Regra ADM: #57
Módulo: `MOD-C01-01_FORMULARIO_E_MENUS` → submódulo `SUB-C01-01-01_OCR_E_CONFERENCIA`
**Nenhuma mudança funcional nesta task** (auditoria somente-leitura; o documento é o produto).

## 1. Fotografia do circuito

`BO/PDF → Tesseract (iniciarOCR/rodarTesseract) → parseAndFill (heurísticas de extração) → conferência humana (montarConferenciaOcrHtml) → conciliarTitulosPipOcr (títulos PIP) → payload → EntradaManual.js → Sheets`

Tudo o que decide **o que entra** no payload vive em `Entrada/Formulario.html` (1.692 linhas, cliente). `Entrada/EntradaManual.js` (636 linhas) faz validação/anti-duplicidade/montagem/gravação em chunks.

## 2. Consumo real da ARCA pelo Formulário/OCR

| Verificação | Resultado |
|---|---|
| Referências a `ARCA` / `AdaptadorConsultaArca` / `consultarPorRuleId` em `Entrada/` | **NENHUMA** (as 2 ocorrências são texto de mensagem do Seletor do Guardião, `Entrada/SeletorMesesGuardiao.js:162` e `:313`) |
| `consumidores` declarados nas regras da ARCA | `GuardiaoQualidade`, `CoberturaAuditoria`, `PainelSaude`, `PluginPontuacao`, `CompiladorProdutividade`, `CompiladorGxt`, `PoliticaMeritoArmas`, `MotorAnaliticoV2` — **o Formulário/OCR não aparece em nenhuma** |

**Conclusão factual: o Formulário/OCR hoje NÃO é consumidor da ARCA.** O C01 opera com regras locais/hardcoded no HTML, exatamente como o Planner suspeitou.

## 3. Matriz factual `REGRA | LOCAL_ATUAL | ARCA_RULE_ID | CONSUMO_REAL | TIPO | LACUNA | IMPACTO`

### 3.1 Extração OCR (heurísticas de leitura do BO)

| REGRA | LOCAL_ATUAL | ARCA_RULE_ID | CONSUMO_REAL | TIPO | LACUNA | IMPACTO |
|---|---|---|---|---|---|---|
| Extração de MIKE/BO/BOEPM | `Formulario.html:480-482` | — | não | HEURISTICA_OCR | ARCA não rege identificação de BO | baixo |
| Extração de BOE | `Formulario.html:489` | — | não | HEURISTICA_OCR | idem | baixo |
| **Extração de NATUREZA** | `Formulario.html:496-499` | — | não | HEURISTICA_OCR | **LACUNA_ARCA**: não existe regra canônica de natureza; é o campo que dispara ou inibe títulos PIP | **ALTO** |
| Extração de data/hora do fato | `Formulario.html:503-508` | — | não | HEURISTICA_OCR | sem regra ARCA de temporalidade no payload | baixo |
| Extração de bairro/cidade/local | `Formulario.html:517,538,545` (+`limparLocalFato_`) | — | não | HEURISTICA_OCR | sem regra ARCA de endereço | baixo |
| Extração de matrículas | `Formulario.html:616` | — | não | HEURISTICA_OCR | ARCA trata matrícula só na auditoria (Guardião) | baixo |
| Detecção de armas (catálogo local) | `Formulario.html:587-604` | ARCA-ARMAS-002 | não | REGRA_ARCA_NAO_CONSUMIDA + HARDCODED_FORA_ARCA | regra existe na ARCA com consumidores reais `CompiladorGxt`/`PoliticaMeritoArmas`, **não** o formulário | MÉDIO (risco de divergência form × GXT) |
| Detecção de drogas (gramas vs quilos) | `Formulario.html:622-669` | ARCA-DROGAS-001 | não | REGRA_ARCA_NAO_CONSUMIDA + HARDCODED_FORA_ARCA | idem (a ARCA valida material por tipo, o form só normaliza unidade) | MÉDIO |
| Exibição da conferência | `Formulario.html:454-473,697-719` | — | não | NAO_APLICAVEL_ARCA | é UI de conferência humana, não regra de domínio | baixo |

### 3.2 Conciliação de títulos PIP (`conciliarTitulosPipOcr`, `Formulario.html:870-987`)

| # | REGRA | LOCAL_ATUAL | ARCA_RULE_ID | CONSUMO_REAL | TIPO | LACUNA | IMPACTO |
|---|---|---|---|---|---|---|---|
| 1 | Armas → título PIP (artesanal/revólver/pistola/12/fuzil) | `:890-907` | ARCA-ARMAS-002/003 | não | HARDCODED_FORA_ARCA | regra de mérito de armas existe na ARCA e não é consultada | MÉDIO |
| 2 | Munições → título PIP (fuzil/.12) | `:909-915` | ARCA-MUNICOES-001 | não | HARDCODED_FORA_ARCA | idem | MÉDIO |
| 3 | Drogas → título PIP | `:917-955` | ARCA-DROGAS-001 | não | HARDCODED_FORA_ARCA | idem | MÉDIO |
| **4** | **Veículo recuperado → "Apreensão de veículo furtado ou roubado" SOMENTE se a natureza confirmar** | **`:957-965`** | **—** | **não** | **HARDCODED_FORA_ARCA + HEURISTICA_OCR** | **LACUNA_ARCA: não existe regra de veículo/roubo/furto/recuperação na ARCA (40 regras, nenhuma sobre veículo)** | **ALTO — é a regra do defeito reportado** |
| 5 | Mandado de prisão → título PIP | `:967-969` | — | não | HARDCODED_FORA_ARCA | sem regra ARCA de mandado | MÉDIO |
| 6 | Fallback por natureza (tráfico/entorpecentes/arma/veículo) | `:972-987` | — | não | HARDCODED_FORA_ARCA | fallback heurístico sem fonte canônica declarada | ALTO (risco de falso positivo) |

### 3.3 Catálogo e rateio

| REGRA | LOCAL_ATUAL | ARCA_RULE_ID | CONSUMO_REAL | TIPO | LACUNA | IMPACTO |
|---|---|---|---|---|---|---|
| Catálogo de naturezas e títulos PIP usado para validar opções | `Formulario.html:702,877-888,997-1014` | ARCA-PIP-003 (catálogo oficial de indicadores PIP) | não | REGRA_ARCA_NAO_CONSUMIDA | o formulário valida contra o catálogo **sem** os metadados da ARCA | MÉDIO |
| Rateio/pontos PIP (quota /4, teto por atuação) | `Features/CompiladorProdutividade.js`, `Plugins/Metricas/PluginPontuacao.js` | ARCA-PIP-001, ARCA-PIP-002 | **sim (fora do form)** | REGRA_ARCA_CONSUMIDA | o payload do formulário não recebe validação de rateio | MÉDIO |

### 3.4 Persistência (`Entrada/EntradaManual.js`)

| REGRA | LOCAL_ATUAL | ARCA_RULE_ID | CONSUMO_REAL | TIPO | LACUNA | IMPACTO |
|---|---|---|---|---|---|---|
| Anti-duplicidade de ocorrência | `EntradaManual.js` | ARCA-OCORRENCIA-002 (ocorrência órfã) | não | NAO_APLICAVEL_ARCA (checagem de gravação) | escopo de persistência, não de domínio | baixo |
| Montagem da matriz + gravação em chunks | `EntradaManual.js` | — | não | NAO_APLICAVEL_ARCA | transporte | baixo |

## 4. Cenário do defeito: BO de veículo roubado

Fatos apurados (somente leitura):

1. A regra existe, é única e está hardcoded: `Formulario.html:960-965`. Ela exige que a **natureza** contenha, na mesma string, um termo de recuperação `(RECUPERAÇÃO|APREENSÃO|LOCALIZAÇÃO)` **e** `(VEÍCULO|MOTO|CARRO)` **e** `(ROUBADO|FURTADO)`, em uma de duas ordens admitidas.
2. A natureza que alimenta essa regra vem de **uma heurística de texto** (`:496-499`, primeira linha após o rótulo "Natureza da Ocorrência|Tipo de Ocorrência|Naturezas") e é depois reescrita pela conciliação de opções em `:702-715`.
3. **Nenhuma regra da ARCA rege veículo, roubo, furto, recuperação ou escolha de natureza** (confirmado nas 40 regras de `Dominio/ARCA/arca_regras_dominio.json`).
4. O título PIP "Apreensão de veículo furtado ou roubado" só é emitido por essa heurística — não há segunda porta.

**Portanto o ponto de falha é a heurística de natureza × regex de veículo, no cliente**, e não há governança canônica da ARCA sobre esse trecho. A causa exata (extração parcial da natureza, variação lexical do BO, reescrita da natureza na conciliação, ou quebra de linha na regex) deve ser provada no #136 com fixture, não inferida.

## 5. Recomendação de fronteira (para #137/#138)

- **Vai para a ARCA (regra de domínio):** a condição canônica que autoriza o título PIP de veículo ("título de veículo só com natureza de recuperação/apreensão/localização de veículo roubado/furtado"), incluindo as variações lexicais aceitas e a proibição de derivar título de menção solta no histórico.
- **Permanece no parser (heurística OCR):** ler o BO, extrair o texto da natureza, normalizar caixa/acentos, tokenizar. **A ARCA não vira motor de OCR.**
- **Fronteira declarada:** o parser entrega a natureza **bruta normalizada**; a decisão "esta natureza autoriza o título de veículo?" passa a ser consulta à porta canônica (`AdaptadorConsultaArca.consultarPorRuleId`), com fallback fail-soft explícito, como já feito no Normalizador de Efetivo (#127).
