---
card: "141"
cards_relacionados: ["146", "147", "148", "149"]
comodo: C05_Guardiao
modulos: [MOD-C05-01_GUARDIAO_DE_QUALIDADE]
tipo: evidencia
formato: "46.5 - commit . ambiente . entrada . resultado . limite"
data: "2026-09-13"
---

# EVD-C05-001 - Guardiao: semantica de armas e invariante de participacao

**Entrega:** #141 (OCR-P3-007) - o Guardiao passa a usar a mesma semantica explicita de
`ARMA` (fisica) x `QDT ARMAS` (participacao); #148/#149 - diagnosticos do bloco ARCA-GUARD.

## Commit
| Hash | Mensagem | Arquivos |
|---|---|---|
| `0c489ad` | `fix(dominio): semantica canonica ARMA (fisica) x QDT ARMAS (#141 OCR-P3-007)` | `Core/Constantes.js`, `Features/CompiladorGxt.js`, ARCA, `Testes/TestSemanticaArmasQdt.js` |
| `fa52c07` | `feat(arca): fluid flow - 17 NAO_AUDITAVEL reclassificadas + diagnostico QDT_ARMAS_DIVERGENTE_NO_TUNEL (ARCA-ARMAS-001)` | `Features/GuardiaoQualidade.js`, `Dominio/ARCA/AdaptadorConsultaArca.js`, `Core/ContratoMutacaoSegura.js`, ARCA JSON, testes |
| `c60aeea` | `feat(guardiao): #146/#147 ARCA-GUARD-002/003 - ORDEM_ANTIGUIDADE_EQUIPE e QTD_O_DIVERGENTE` | `Features/GuardiaoQualidade.js`, ARCA, testes |
| `266a7db` | `feat(guardiao): #149 ARCA-GUARD-005 - diagnostico AIS vs base territorial` | `Features/GuardiaoQualidade.js`, ARCA, testes |
| `b74f9d0` | `fix(suite): suite global 100% verde (620 PASS) - gate 9 do #117` | `Features/GuardiaoQualidade.js`, testes |

## Ambiente
| Item | Valor |
|---|---|
| Runtime de produto | Google Apps Script (fluxo de menu) + porta HEADLESS (`Features/GuardiaoHeadless.js`) |
| Porta headless | orquestra o mesmo fluxo com planilha injetada; retorna **STRING JSON** (exigencia do `scripts.run`) |
| Escopo headless declarado | leitura/diagnostico + efeitos do fluxo oficial; **nao** abre dialogo, **nao** altera dado operacional |
| Deploy | `clasp push` + verificacao remota (**81/81**) |

## Entrada
Defeito provado no #141: `Features/GuardiaoQualidade.js:178-179` lia `armaLinha: loc('ARMA_LINHA')` e
`armas: loc('ARMAS')`, e o alias `ARMAS` resolvia para a **coluna 32** (participacao) porque nao existia
cabecalho literal `ARMAS` - o match exato caia no primeiro alias (`QDT ARMAS`). No tunel real de 4
policiais isso somava **8** (4 x 2) em vez de **2**.
Confirmacao literal do proprietario registrada no #139 (invariante de participacao por tunel).

## Resultado
| Verificacao | Resultado |
|---|---|
| `TestSemanticaArmasQdt.js` | RED **3 PASS / 3 FAIL** -> GREEN **6 PASS / 0 FAIL** |
| Invariante do tunel (`QDT ARMAS` identico entre participantes **e** igual a soma de `ARMA`) | teste explicito verde |
| Varredura de **todos** os aliases | so `QDT_ARMAS` pode listar a coluna de participacao |
| `TestArcaConsumidores` / `TestArcaMapaCobertura` / `TestIntegracaoArca` | 9/9, 11/11, 7/7 |
| `TestGuardiao` | 32 PASS / 0 FAIL (medicao de 12/09) |
| Suite global (gate 9 do #117) | **620 PASS** (`b74f9d0`) |

Diagnosticos acrescentados ao Guardiao no ciclo (todos com regra ARCA mapeada):
`QDT_ARMAS_DIVERGENTE_NO_TUNEL` (ARCA-ARMAS-001) . `ORDEM_ANTIGUIDADE_EQUIPE` (ARCA-ANTIGUIDADE-002) .
`QTD_O_DIVERGENTE` . `AIS_AUSENTE` / `AIS_DIVERGENTE` (ARCA-TERRITORIO-001).
O codigo novo entrou na **blacklist dura** de mutacao (`Core/ContratoMutacaoSegura.js`).

## Limite
- **Numeros diferentes entre cards sao reais, nao contradicao:** o #141 registrou `411 PASS`, o #144 `423 PASS`,
  o `b74f9d0` `620 PASS`. A suite **cresceu** entre as medicoes; cada numero vale para o seu momento.
- O Guardiao **nao se audita** (Governanca fora da propria auditoria) e a porta de entrada e **fail-open**
  enquanto a auditoria e **fail-closed** - decisoes do proprietario (registradas no #150), nao medidas aqui.
- A prova de execucao do Guardiao headless **nao** foi reproduzida neste card: o registro e a declaracao
  de escopo no cabecalho de `Features/GuardiaoHeadless.js` + os numeros dos cards citados.
- O bloco ARCA-GUARD (#145-#149) e um **ciclo anterior**; entra aqui apenas como a terceira ponta do #141
  (Guardiao), nao como escopo novo.
