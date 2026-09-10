# REPRODUCAO — OCR de BO de veiculo roubado (defeito do proprietario)

Card: **#136** (OCR-ARCA-002) | Suite: `Testes/TestOcrVeiculoRoubado.js` (**VERMELHA por design**)

## 1. Entrada e metodo
- **BO real falho**: NAO esta disponivel localmente (nenhum PDF/txt do caso em disco; historico de sessao nao indexado).
- **Metodo**: fixture construida estritamente sobre o padrao factual documentado (rotulo de natureza + narrativa), sem inventar campos operacionais.
- **Codigo sob teste**: a funcao REAL `conciliarTitulosPipOcr` e extraida de `Entrada/Formulario.html` por balanceamento de chaves (114 linhas) — nao ha copia paralela da regra.
- **Catalogo**: os mesmos rotulos oficiais da tabela PIP usados em producao (inclui `Apreensão de veículo furtado ou roubado`).

## 2. Campos esperados x obtidos

| # | NATUREZA (entrada) | Esperado | Obtido | Situacao |
|---|---|---|---|---|
| 1 | `RECUPERAÇÃO DE VEÍCULO ROUBADO` | titulo de veiculo | titulo gerado | ✓ ja coberto |
| 2 | `APREENSÃO DE VEÍCULO FURTADO` | titulo de veiculo | titulo gerado | ✓ |
| 3 | `LOCALIZAÇÃO DE MOTO ROUBADA` | titulo de veiculo | titulo gerado | ✓ |
| 4 | `RECUPERAÇÃO DE CARRO ROUBADO` | titulo de veiculo | titulo gerado | ✓ |
| 5 | `RECUPERAÇÃO DE VEÍCULO ROUBADO/FURTADO` | titulo de veiculo | titulo gerado | ✓ |
| **6** | **`ROUBO E RECUPERAÇÃO DE VEÍCULO`** | **titulo de veiculo** | **nenhum titulo** | **✗ DEFEITO** |
| **7** | **`FURTO E RECUPERAÇÃO DE VEÍCULO`** | **titulo de veiculo** | **nenhum titulo** | **✗ DEFEITO** |
| **8** | **`RECUPERAÇÃO DE VEÍCULO PRODUTO DE ROUBO`** | **titulo de veiculo** | **nenhum titulo** | **✗ DEFEITO** |
| **9** | **`VEÍCULO PRODUTO DE ROUBO RECUPERADO`** | **titulo de veiculo** | **nenhum titulo** | **✗ DEFEITO** |
| **10** | **`RECUPERAÇÃO DE VEÍCULO\nROUBADO`** (quebrado em 2 linhas) | **titulo de veiculo** | **nenhum titulo** | **✗ DEFEITO** |
| 11 | `ROUBO DE VEÍCULO` (sem recuperacao) | **nenhum titulo** | nenhum titulo | ✓ (sem falso positivo) |
| 12 | `FURTO DE VEÍCULO` (sem recuperacao) | **nenhum titulo** | nenhum titulo | ✓ |
| 13 | `ROUBO A TRANSEUNTE` | **nenhum titulo** | nenhum titulo | ✓ |
| 14 | `PORTE ILEGAL DE ARMA DE FOGO` + narrativa "vítima de roubo" | **nenhum titulo** | nenhum titulo | ✓ |
| 15 | `PORTE ILEGAL DE ARMA DE FOGO` + narrativa "veículo foi roubado" | **nenhum titulo** | nenhum titulo | ✓ |

Resultado bruto: **10 PASS / 5 FAIL**.

## 3. Ponto de divergencia (causa localizada)
`Entrada/Formulario.html:960-965` — a regex da regra de veiculo exige, na MESMA string, um termo de recuperacao
`(RECUPERAÇÃO|APREENSÃO|LOCALIZAÇÃO)` + `(VEÍCULO|MOTO|CARRO)` + **`(ROUBAD[OA]|FURTAD[OA])`**:

1. **Variacao lexical**: o terceiro token aceita apenas os **adjetivos** `ROUBADO/ROUBADA/FURTADO/FURTADA`. Rótulos reais
   de BO usam os **substantivos** `ROUBO`/`FURTO` (`ROUBO E RECUPERAÇÃO DE VEÍCULO`, `... PRODUTO DE ROUBO`). Como o
   token nao casa, a regra inteira falha (casos 6-9).
2. **Quebra de linha**: a regex usa `.*?`, que **nao atravessa `\n`**. Natureza quebrada em duas linhas no PDF perde o
   match na segunda parte (caso 10).
3. A defesa anti-falso-positivo **funciona** (casos 11-15 sem titulo): o defeito e estritamente de **cobertura lexical**,
   nao de disparo indevido.

Nao ha segunda porta para o titulo de veiculo: a heuristica e o unico caminho (`Formulario.html:963`).

## 4. Encaminhamento
- A correcao (#138) deve cobrir substantivos e adjetivos (`ROUBO|FURTO|ROUBAD[OA]|FURTAD[OA]`) **mantendo** a exigencia
  de um termo de recuperacao na mesma string, e tolerar quebra de linha (`[\s\S]` em vez de `.`).
- A suite fica **fora do runner** (vermelha por design) e entra nele no #138, quando ficar verde.
- A condicao canonica deve sair do parser e passar a ser regida pela ARCA (#137): o parser le o BO, a ARCA decide se
  aquela natureza autoriza o titulo.
