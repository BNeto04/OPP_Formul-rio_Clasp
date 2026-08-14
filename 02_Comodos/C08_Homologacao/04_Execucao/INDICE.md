# 04_Execucao.md

NÃO APLICÁVEL.


## Extrato de MOD-C08-06-03_Protocolo.md

# Protocolo de HomologaÃ§Ã£o Manual â€” RelatÃ³rio Trimestral Gxt (MÃ©rito por Armas)

> **Documento:** `02_Comodos/04_PROTOCOLS/C06.3_PROTOCOLO_HOMOLOGACAO_GXT.md`  
> **Status:** EM HOMOLOGAÃ‡ÃƒO MANUAL (TASK-C06-05B)  
> **Contexto:** Ecossistema SynthÃ©on GS Down Plant Offline (MÃ£o de Obra e MÃ©rito)  

---

## 1. Regras Fundamentais de SeguranÃ§a e Isolamento

1. **Uso Exclusivo de CÃ³pia DescartÃ¡vel**:
   - O procedimento de homologaÃ§Ã£o e teste visual/matemÃ¡tico em ambiente Google Sheets deve ser realizado **exclusivamente em uma cÃ³pia descartÃ¡vel** da planilha de produÃ§Ã£o.
   - **URL da CÃ³pia DescartÃ¡vel**: `https://docs.google.com/spreadsheets/d/16mSKBXoqQuwxTdPxSQjl2v0cJAZjjHIh7N3UNo0KWAg/edit`

2. **ProibiÃ§Ã£o Absoluta de AlteraÃ§Ã£o na Planilha Oficial**:
   - Ã‰ **rigorosamente proibido** alterar, executar scripts ou publicar dados na planilha oficial de produÃ§Ã£o durante a fase de homologaÃ§Ã£o.

3. **Garantia de NÃ£o-PublicaÃ§Ã£o (`git push` e `clasp push`)**:
   - Ã‰ **estritamente proibido** executar `git push` no repositÃ³rio.
   - Qualquer envio experimental por `clasp push` deve ter o seu `scriptId` no arquivo `.clasp.json` verificado e confirmado como pertencente **exclusivamente Ã  cÃ³pia descartÃ¡vel**, nunca ao projeto oficial.

---

## 2. PrÃ©-requisitos de ExecuÃ§Ã£o

1. **Branch Offline Limpa**:
   - RepositÃ³rio na branch `refactor/down-plant-gs-offline` em estado limpo (`working tree clean`).
2. **SuÃ­te de Testes 100% Verde (117/117)**:
   - ExecuÃ§Ã£o local do comando `node Testes/RodarTodosOsTestes.js` com aprovaÃ§Ã£o integral de todos os 117 testes unitÃ¡rios, integrados e de regressÃ£o visual.
3. **Fontes de Dados do PecÃºlio e ReferÃªncia**:
   - **Antiguidade N**: Fonte oficial do PecÃºlio via `CONFIG_SYNTHEON.obterIdPeculio()` (`1PJnA8d9sf5CNj0-rt3yIxnwS8BEGfqxRvoyOjCtVHNE`), cuja regra e prova foram validadas na aba modelo `CÃ³pia de PecÃºlio com PontuaÃ§Ã£o`.
   - **RelatÃ³rio HistÃ³rico de ReferÃªncia**: Aba `GTAR X PEL 2Âº TRIMESTRE` do arquivo `GTAR X TROPA ARMAS 2026.xlsx` (contÃ©m os trÃªs blocos mensais de Abril, Maio e Junho de 2026 e os lÃ­deres histÃ³ricos jÃ¡ atribuÃ­dos).

---

## 3. Roteiro PrÃ¡tico de ExecuÃ§Ã£o na CÃ³pia DescartÃ¡vel

### 3.1. ExecuÃ§Ã£o 1: SeleÃ§Ã£o Livre (`ABR2026`, `MAI2026`, `JUN2026`)
1. Abrir o menu **Gxt > Selecao livre**.
2. No modal interativo `DialogGxtSelecaoLivre`, marcar as caixas correspondentes a `ABR2026`, `MAI2026` e `JUN2026`.
3. Clicar no botÃ£o **Gerar**.
4. **Resultado Esperado**:
   - CriaÃ§Ã£o da aba `GXT_ACUMULADO_ABR2026_JUN2026`.
   - ExibiÃ§Ã£o dos 3 blocos mensais lado a lado para Abril, Maio e Junho de 2026.
   - ComparaÃ§Ã£o direta com a aba histÃ³rica de referÃªncia **`GTAR X PEL 2Âº TRIMESTRE`** do arquivo `GTAR X TROPA ARMAS 2026.xlsx`.
5. **Checagem Detalhada MÃªs a MÃªs (Abril, Maio, Junho)**:
   - **LÃ­der Selecionado**: Verificar se o lÃ­der indicado em cada tÃºnel Ã© o militar com menor **N** na lista do PecÃºlio.
   - **Quantidade de Armas**: Confirmar se 100% das armas fÃ­sicas do tÃºnel (fogo + artesanal, 1 artesanal = 1) foram atribuÃ­das ao lÃ­der.
   - **DesignaÃ§Ã£o**: Confirmar o pelotÃ£o/lotaÃ§Ã£o do militar.
   - **Total do Bloco**: Conferir a soma mensal total e os resumos por 1Âº PEL GTAR, 2Âº PEL GTAR, 1Âº PEL, 2Âº PEL e 3Âº PEL.

### 3.2. ExecuÃ§Ã£o 2: Modo Anual (`Gxt > Anual`)
1. Abrir o menu **Gxt > Anual**.
2. **Resultado Esperado**:
   - GeraÃ§Ã£o de 4 abas trimestrais de saÃ­da: `GXT_1T_2026`, `GXT_2T_2026`, `GXT_3T_2026` e `GXT_4T_2026`.
   - Cada aba contÃ©m exatamente 3 blocos mensais lado a lado, preservando a legibilidade e sem poluir uma Ãºnica tela com 12 meses.

---

## 4. Matriz e Checklist de CritÃ©rios de AprovaÃ§Ã£o

A homologaÃ§Ã£o na cÃ³pia descartÃ¡vel serÃ¡ considerada **APROVADA** quando todos os itens abaixo forem validados:

| CritÃ©rio | DescriÃ§Ã£o e Regra de NegÃ³cio | Status na CÃ³pia |
| :--- | :--- | :--- |
| **Unicidade por TÃºnel** | Cada tÃºnel armado (`DATA \| MIKE \| BOE`) gera um Ãºnico registro no relatÃ³rio mensal. | â³ Em HomologaÃ§Ã£o |
| **DefiniÃ§Ã£o de LideranÃ§a** | O lÃ­der contemplado Ã© o militar de menor **N** (mais antigo) no PecÃºlio entre **todos** os policiais participantes do tÃºnel (`CÃ³pia de PecÃºlio com PontuaÃ§Ã£o` usada como prova da regra N). | â³ Em HomologaÃ§Ã£o |
| **PrecisÃ£o MatemÃ¡tica** | A soma mensal das armas bate 100% com a base fÃ­sica de ocorrÃªncias (1 artesanal = 1). | â³ Em HomologaÃ§Ã£o |
| **Conformidade com HistÃ³rico** | LÃ­der, quantidade de armas, designaÃ§Ã£o e totais por bloco coincidem com a aba de referÃªncia `GTAR X PEL 2Âº TRIMESTRE` (`GTAR X TROPA ARMAS 2026.xlsx`) ou possuem divergÃªncia explicada por auditoria tÃ©cnica. | â³ Em HomologaÃ§Ã£o |
| **PadrÃ£o Visual Gxt** | 3 blocos mensais lado a lado por painel, cores de PelotÃ£o/GTAR, destaque na escala de armas (0 em vermelho, 10+ verde escuro negrito), negritos e congelamento na linha 2. | â³ Em HomologaÃ§Ã£o |
| **Estabilidade de RelatÃ³rios** | PIP, CPM, COMPARATIVO_2026, COMP_ARMAS_2026 e COMP_DROGAS_2026 permanecem intactos. | â³ Em HomologaÃ§Ã£o |

---

## 5. PrÃ³ximos Passos
ApÃ³s a validaÃ§Ã£o manual visual e matemÃ¡tica nesta cÃ³pia descartÃ¡vel pelo operador, a sprint **C06** poderÃ¡ ser formalmente concluÃ­da e selada para produÃ§Ã£o.


