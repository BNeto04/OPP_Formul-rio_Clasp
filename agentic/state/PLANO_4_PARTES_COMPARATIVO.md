# PLANO — DIVISÃO EM 4 PARTES (direção do proprietário, 12/09/2026)

**Origem**: *"você jamais vai conseguir isso de uma vez; vai ter que focar em partes. No começo,
dividindo o script em 4 partes — a que puxa armas, que já tem pronto, e depois o outro e o outro,
usando um como referência do outro."*

**Card**: #152 (PROD-ARMAS-001)

---

## O princípio

**Não corrigir a corrente inteira de uma vez.** A corrente atual do Comparativo tem 5 elos
encadeados (Leitor → Linha → Policial → Métricas → Comparativo) e um único elo quebrado zera
o número. Hoje eu corrigi 5 elos e o zero persistiu — prova de que **consertar elo por elo, sem
referência, é chute**.

**A referência existe e está provada:** o **Compilador de Armas**. A lista do SET2026 foi
conferida linha por linha contra a fonte (`SET2026!AD:AF`) e bateu — todos os participantes,
com as participações corretas, agregando as duplicadas (NOGUEIRA 1+1 = 2) e excluindo quem não
participou (MACHADO/JONG LIU = entorpecentes).

## As 4 partes

Cada parte é **um número** do Comparativo, calculado pelo **seu próprio caminho** — curto,
direto, igual ao caminho provado das armas. Sem corrente longa compartilhada.

| # | Parte | Estado | Caminho de referência |
|---|---|---|---|
| **1** | **QTD. ARMAS** — participações de arma | ✅ **caminho provado** (compilador de armas) | ler a coluna direto pelo alias `QDT_ARMAS`, agregar por matrícula |
| **2** | **QTD. O** — ocorrências | 🟡 funciona, falta provar contra a fonte | mesma técnica: contar por matrícula direto da aba |
| **3** | **Pontuação** | 🟡 funciona, falta provar contra a fonte | mesma técnica: somar a coluna de pontos |
| **4** | **ENTORPECENTES (g)** | 🟡 funciona, falta provar contra a fonte | mesma técnica: somar maconha/crack/cocaína |

**A Parte 1 é o modelo.** As partes 2, 3 e 4 são construídas **copiando a forma** da Parte 1,
não reescrevendo a corrente antiga.

## Como cada parte é dada por provada

O mesmo método que provou as armas:

1. **Medir** o valor na fonte, por matrícula (o bisturi).
2. **Comparar** com o valor no produto, para o mesmo policial.
3. **Prova objetiva**: um caso nomeado onde o número tem de ser igual (o FERNANDES 1133306 =
   `QDT ARMAS 1` foi o que expôs o defeito).
4. Só então passar para a próxima parte.

## Estado do diagnóstico (o que já se sabe, sem chute)

Do bisturi `diagnosticarCaminhoArmasHeadless('1133306')`:

| Elo | Medição |
|---|---|
| 1. alias `QDT_ARMAS` no cabeçalho | ✅ índice 31 (coluna AF) |
| 2. índice dentro do Leitor | ✅ 31 |
| 3. **valor na fonte** (SET2026, linha 57) | ✅ **`1`** |
| 4. Métricas | ❌ `fatos.participacaoArmas` chega **undefined** (o `fatos.armas` = 1 chega) |

**Conclusão provada:** a leitura está correta; o valor morre **depois** da linha 70 da
`Core/Metricas.js`, numa montagem final do registro que reconstrói o objeto `fatos` e descarta
o campo novo. **Último elo a inspecionar — não corrigir antes de medir.**

## Regra de trabalho (aprendida hoje)

- **Nada de rodar às cegas em planilha real.** Simular → mostrar → executar.
  (A inserção indevida de 191 linhas no ABR2026 veio de rodar sem simular.)
- **Nada de editar por tentativa.** Medir antes; se não sabe qual elo quebra, instrumentar.
- **Um número provado vale mais que dez verdes.** O teste que importa é
  `valor_na_fonte == valor_no_produto`, com nome e matrícula.
