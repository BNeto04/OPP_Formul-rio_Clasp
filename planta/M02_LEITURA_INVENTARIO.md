# Inventário Geral de Leitores e Adaptadores (Task M02.1-01)

> **Status:** CONCLUÍDO  
> **Cômodo:** M02 Leitura & Adaptadores  
> **Data de Mapeamento:** 29/07/2026  

---

## 📊 Tabela Geral do Inventário

| Arquivo | Função / Classe | Fonte Lida | Cabeçalhos Esperados | Aliases Existentes | Risco | Destino do Dado | Cômodo Consumidor |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `Leitura/Adaptador2026.js` | `Adaptador2026.extrairFatos()` | Abas mensais (`JAN2026`..`DEZ2026`) | `DATA`, `HORA`, `MIKE`, `BOE`, `NATUREZA`, `CIDADE`, `BAIRRO`, `AIS`, `MATRICULA`, `POLICIAL`, `GRAD`, `PELOTAO`, `ARMAS`, `MACONHA`, `COCAINA`, `CRACK`, `PONTOS_TOTAIS`, `PONTOS_FICCAO`, `INDICADOR_PIP`, `IMPUTADO`, `DETIDOS`, `APFD`, `TCO`, `BOC` | Mapeamento dinâmico por chave normalizada via `SyntheonUtils.localizarColuna` | **MÉDIO** | Instâncias de `RegistroCanonico` (Fatos imutáveis) | M03 Domínio / M04 Motor |
| `Core/LeitorPlanilhas.js` | `SyntheonLeitor.lerAbas()` | Abas mensais + `EFETIVO` | Mapeados via `_mapearColunas`: `DATA`, `HORA`, `MIKE`, `BOE`, `NATUREZA`, `CIDADE`, `BAIRRO`, `AIS`, `MATRICULA`, `POLICIAL`, `GRAD`, `PELOTAO`, `ARMAS`, `MACONHA`, `COCAINA`, `CRACK`, `PONTOS_TOTAIS`, `PONTOS_FICCAO`, `DETIDOS`, `APFD`, `TCO`, `BOC` | `SyntheonUtils.localizarColuna` em cada chave | **ALTO** | Objeto estruturado por ocorrência (`vetorOcorrencias`) | M04 Motor (Compilador PIP / Produtividade) |
| `Entrada/EntradaManual.js` | `getEfetivo()` | Aba `EFETIVO` (remota via `SS_ID`) | Posições fixas: Col A (`Nome`), Col D (`Posto`), Col E (`Matrícula`), Col F (`Pelotão`) | Nenhum (Leitura posicional fixa sem verificação de nomes de cabeçalho) | **ALTO** | Array `{pelotao, posto, matricula, nome}` | M01 Entrada (`Formulario.html`) |
| `Entrada/EntradaManual.js` | `verificarDuplicidadeOcorrencia()` | Abas mensais | Coluna G (`BOE`), Coluna E (`MIKE`) | Nenhum (Acesso direto a intervalos `G2:G` e `E2:E`) | **MÉDIO** | Validação bloqueante (lança erro em duplicidade) | M01 Entrada |
| `Features/NormalizadorEfetivo.js` | `NormalizadorEfetivo.lerPeculio()` | Aba `PECULIO` (planilha QO/PECULIO remota) | Posições fixas da linha 12: Col E (`Matrícula`), Col F (`Nome Guerra`), Col G (`Subunidade`), Col M (`Nome Completo`), Col D (`Graduação`) | Nenhum (Leitura posicional rígida a partir da linha 12) | **ALTO** | Array de registros para sincronização da aba `EFETIVO` | M07 Efetivo |
| `Features/NormalizadorEfetivo.js` | `NormalizadorEfetivo.lerEfetivoAtual()` | Aba `EFETIVO` ativa | Colunas 1 a 7 (A a G) | Detecção de linha de cabeçalho via `NOME` + `MATRICULA` | **MÉDIO** | Estrutura `{registros, porMatricula}` | M07 Efetivo |
| `Compilador PIP.js` | `executarCompiladorPip()` | Abas mensais + `EFETIVO` | Mapeados por `ALIASES`: `DATA`, `MATRICULA`, `PONTOS_FICCAO`, `CHAVE_OCORRENCIA` | Objeto `ALIASES` próprio com variações como `PONTOS FICCAO (1/4)`, `AJ`, `AK` | **MÉDIO** | Matriz para aba de resultado `PIP_ANUAL_2026` | M06 Relatórios (PIP) |
| `Core/Policiais.js` | `SyntheonPoliciais.carregarEfetivo()` | Aba `EFETIVO` ativa | Col A (`Nome Guerra`), Col B (`Grad+Mat`), Col C (`Nome Completo`), Col D (`Grad`), Col E (`Matrícula`), Col F (`Subunidade Prod`), Col G (`Subunidade Pecúlio`) | Validação de cabeçalho `NOME` + `MATRICULA` | **MÉDIO** | Dicionário indexado por matrícula (`mapa[matricula]`) | M02 Leitura / M03 Domínio / M04 Motor |
| `Compilador_Armas.js` | `executarCompilador()` | Abas mensais | `BOE`, `PELOTÃO`, `MATRICULA`, `POLICIAL`, `GRADUAÇÃO`/`GRAD`, `QDT ARMAS`/`QTD ARMAS` | Buscas ad-hoc `headers.indexOf()` com fallback para `QTD ARMAS` | **ALTO** | Matriz para aba `COMP_ARMAS_2026` | M06 Relatórios (Armas) / Legado |
| `Compilador de Entorpecentes.js` | `executarCompiladorDrogas()` | Abas mensais | `BOE`, `PELOTÃO`, `GRADUAÇÃO`/`GRAD`, `MATRÍCULA`/`MATRICULA`, `POLICIAL`, `DIVIDIDO MAC`, `DIVIDIDO COC` | Buscas ad-hoc `findIndex()` com `.includes()` em cada cabeçalho | **ALTO** | Matriz para aba `COMP_DROGAS_2026` | M06 Relatórios (Drogas) / Legado |
| `Config/Metamodelos.js` | `CatalogoEstruturas` | N/A (Catálogo estático) | Obrigatórios: `MATRICULA`, `DATA`, `MIKE`. Opcionais & Métricas declarados no objeto. | Catálogo oficial das fontes (`OPP_2026`) | **BAIXO** | Objeto congelado de configuração das fontes | M00 Config / M02 Leitura |

---

## ⚠️ Diagnóstico de Riscos & Pontos Rígidos Encontrados

1. **Planilhas Remotas e IDs Rígidos (`SS_ID` / `peculioId`)**:
   - `EntradaManual.js` utiliza `SS_ID = '1S05sTbd3otgjGjrC-YrzHk7dXp7mzzaw_J2lyQ86hOY'` hardcoded.
   - `NormalizadorEfetivo.js` requer `CONFIG_SYNTHEON.PLANILHAS.PECULIO_ID`.
   - **Risco:** Quebra silenciosa ou erro de permissão ao alterar ambientes ou fazer testes fora da planilha oficial.

2. **Leitura Posicional Rígida sem Verificação de Cabeçalho**:
   - `Entrada/EntradaManual.js` (`getEfetivo` e `verificarDuplicidadeOcorrencia`) acessa colunas fixas `G2:G` e `E2:E` ou posições `0, 3, 4, 5`.
   - `Features/NormalizadorEfetivo.js` lê a partir da linha 12 nas posições `3, 4, 5, 6, 12`.
   - **Risco:** Se uma coluna for inserida ou reposicionada na planilha física, o leitor quebrará ou lerá dados trocados.

3. **Multiplicidade de Mapeadores de Cabeçalho**:
   - O ecossistema possui **3 formas concorrentes** de resolver nomes de colunas:
     1. `SyntheonUtils.localizarColuna(headers, chaveAlias)` (usado por `Adaptador2026` e `SyntheonLeitor`).
     2. Dicionário local `ALIASES` em `Compilador PIP.js`.
     3. Buscas ad-hoc com `.indexOf()` / `.includes()` em `Compilador_Armas.js` e `Compilador de Entorpecentes.js`.
   - **Risco:** Divergência de cabeçalhos entre relatórios e compiladores.

---

## 🎯 Recomendações para a Próxima Refatoração (Task M02.1-02)

1. Centralizar a resolução de aliases de cabeçalhos no `SyntheonUtils.localizarColuna` unificado.
2. Migrar leitores legados (`Compilador_Armas.js` e `Compilador de Entorpecentes.js`) para consumirem a camada unificada do M02 Leitura.
3. Parametrizar IDs de planilhas via módulo de `Config`.
