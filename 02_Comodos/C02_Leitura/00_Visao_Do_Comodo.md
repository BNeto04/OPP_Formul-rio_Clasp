# InventÃ¡rio Geral de Leitores e Adaptadores (Task C02.1-01)

> **Status:** CONCLUÃDO  
> **CÃ´modo:** C02 Leitura & Adaptadores  
> **Data de Mapeamento:** 29/07/2026  

---

## ðŸ“Š Tabela Geral do InventÃ¡rio

| Arquivo | FunÃ§Ã£o / Classe | Fonte Lida | CabeÃ§alhos Esperados | Aliases Existentes | Risco | Destino do Dado | CÃ´modo Consumidor |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `Leitura/Adaptador2026.js` | `Adaptador2026.extrairFatos()` | Abas mensais (`JAN2026`..`DEZ2026`) | `DATA`, `HORA`, `MIKE`, `BOE`, `NATUREZA`, `CIDADE`, `BAIRRO`, `AIS`, `MATRICULA`, `POLICIAL`, `GRAD`, `PELOTAO`, `ARMAS`, `MACONHA`, `COCAINA`, `CRACK`, `PONTOS_TOTAIS`, `PONTOS_FICCAO`, `INDICADOR_PIP`, `IMPUTADO`, `DETIDOS`, `APFD`, `TCO`, `BOC` | Mapeamento dinÃ¢mico por chave normalizada via `SyntheonUtils.localizarColuna` | **MÃ‰DIO** | InstÃ¢ncias de `RegistroCanonico` (Fatos imutÃ¡veis) | C03 DomÃ­nio / C04 Motor |
| `Core/LeitorPlanilhas.js` | `SyntheonLeitor.lerAbas()` | Abas mensais + `EFETIVO` | Mapeados via `_mapearColunas`: `DATA`, `HORA`, `MIKE`, `BOE`, `NATUREZA`, `CIDADE`, `BAIRRO`, `AIS`, `MATRICULA`, `POLICIAL`, `GRAD`, `PELOTAO`, `ARMAS`, `MACONHA`, `COCAINA`, `CRACK`, `PONTOS_TOTAIS`, `PONTOS_FICCAO`, `DETIDOS`, `APFD`, `TCO`, `BOC` | `SyntheonUtils.localizarColuna` em cada chave | **ALTO** | Objeto estruturado por ocorrÃªncia (`vetorOcorrencias`) | C04 Motor (Compilador PIP / Produtividade) |
| `Entrada/EntradaManual.js` | `getEfetivo()` | Aba `EFETIVO` (remota via `SS_ID`) | PosiÃ§Ãµes fixas: Col A (`Nome`), Col D (`Posto`), Col E (`MatrÃ­cula`), Col F (`PelotÃ£o`) | Nenhum (Leitura posicional fixa sem verificaÃ§Ã£o de nomes de cabeÃ§alho) | **ALTO** | Array `{pelotao, posto, matricula, nome}` | C01 Entrada (`Formulario.html`) |
| `Entrada/EntradaManual.js` | `verificarDuplicidadeOcorrencia()` | Abas mensais | Coluna G (`BOE`), Coluna E (`MIKE`) | Nenhum (Acesso direto a intervalos `G2:G` e `E2:E`) | **MÃ‰DIO** | ValidaÃ§Ã£o bloqueante (lanÃ§a erro em duplicidade) | C01 Entrada |
| `Features/NormalizadorEfetivo.js` | `NormalizadorEfetivo.lerPeculio()` | Aba `PECULIO` (planilha QO/PECULIO remota) | PosiÃ§Ãµes fixas da linha 12: Col E (`MatrÃ­cula`), Col F (`Nome Guerra`), Col G (`Subunidade`), Col M (`Nome Completo`), Col D (`GraduaÃ§Ã£o`) | Nenhum (Leitura posicional rÃ­gida a partir da linha 12) | **ALTO** | Array de registros para sincronizaÃ§Ã£o da aba `EFETIVO` | C07 Efetivo |
| `Features/NormalizadorEfetivo.js` | `NormalizadorEfetivo.lerEfetivoAtual()` | Aba `EFETIVO` ativa | Colunas 1 a 7 (A a G) | DetecÃ§Ã£o de linha de cabeÃ§alho via `NOME` + `MATRICULA` | **MÃ‰DIO** | Estrutura `{registros, porMatricula}` | C07 Efetivo |
| `Compilador PIP.js` | `executarCompiladorPip()` | Abas mensais + `EFETIVO` | Mapeados por `ALIASES`: `DATA`, `MATRICULA`, `PONTOS_FICCAO`, `CHAVE_OCORRENCIA` | Objeto `ALIASES` prÃ³prio com variaÃ§Ãµes como `PONTOS FICCAO (1/4)`, `AJ`, `AK` | **MÃ‰DIO** | Matriz para aba de resultado `PIP_ANUAL_2026` | C06 RelatÃ³rios (PIP) |
| `Core/Policiais.js` | `SyntheonPoliciais.carregarEfetivo()` | Aba `EFETIVO` ativa | Col A (`Nome Guerra`), Col B (`Grad+Mat`), Col C (`Nome Completo`), Col D (`Grad`), Col E (`MatrÃ­cula`), Col F (`Subunidade Prod`), Col G (`Subunidade PecÃºlio`) | ValidaÃ§Ã£o de cabeÃ§alho `NOME` + `MATRICULA` | **MÃ‰DIO** | DicionÃ¡rio indexado por matrÃ­cula (`mapa[matricula]`) | C02 Leitura / C03 DomÃ­nio / C04 Motor |
| `Compilador_Armas.js` | `executarCompilador()` | Abas mensais | `BOE`, `PELOTÃƒO`, `MATRICULA`, `POLICIAL`, `GRADUAÃ‡ÃƒO`/`GRAD`, `QDT ARMAS`/`QTD ARMAS` | Buscas ad-hoc `headers.indexOf()` com fallback para `QTD ARMAS` | **ALTO** | Matriz para aba `COMP_ARMAS_2026` | C06 RelatÃ³rios (Armas) / Legado |
| `Compilador de Entorpecentes.js` | `executarCompiladorDrogas()` | Abas mensais | `BOE`, `PELOTÃƒO`, `GRADUAÃ‡ÃƒO`/`GRAD`, `MATRÃCULA`/`MATRICULA`, `POLICIAL`, `DIVIDIDO MAC`, `DIVIDIDO COC` | Buscas ad-hoc `findIndex()` com `.includes()` em cada cabeÃ§alho | **ALTO** | Matriz para aba `COMP_DROGAS_2026` | C06 RelatÃ³rios (Drogas) / Legado |
| `Config/Metamodelos.js` | `CatalogoEstruturas` | N/A (CatÃ¡logo estÃ¡tico) | ObrigatÃ³rios: `MATRICULA`, `DATA`, `MIKE`. Opcionais & MÃ©tricas declarados no objeto. | CatÃ¡logo oficial das fontes (`OPP_2026`) | **BAIXO** | Objeto congelado de configuraÃ§Ã£o das fontes | M00 Config / C02 Leitura |

---

## âš ï¸ DiagnÃ³stico de Riscos & Pontos RÃ­gidos Encontrados

1. **Planilhas Remotas e IDs RÃ­gidos (`SS_ID` / `peculioId`)**:
   - `EntradaManual.js` utiliza `SS_ID = '1S05sTbd3otgjGjrC-YrzHk7dXp7mzzaw_J2lyQ86hOY'` hardcoded.
   - `NormalizadorEfetivo.js` requer `CONFIG_SYNTHEON.PLANILHAS.PECULIO_ID`.
   - **Risco:** Quebra silenciosa ou erro de permissÃ£o ao alterar ambientes ou fazer testes fora da planilha oficial.

2. **Leitura Posicional RÃ­gida sem VerificaÃ§Ã£o de CabeÃ§alho**:
   - `Entrada/EntradaManual.js` (`getEfetivo` e `verificarDuplicidadeOcorrencia`) acessa colunas fixas `G2:G` e `E2:E` ou posiÃ§Ãµes `0, 3, 4, 5`.
   - `Features/NormalizadorEfetivo.js` lÃª a partir da linha 12 nas posiÃ§Ãµes `3, 4, 5, 6, 12`.
   - **Risco:** Se uma coluna for inserida ou reposicionada na planilha fÃ­sica, o leitor quebrarÃ¡ ou lerÃ¡ dados trocados.

3. **Multiplicidade de Mapeadores de CabeÃ§alho**:
   - O ecossistema possui **3 formas concorrentes** de resolver nomes de colunas:
     1. `SyntheonUtils.localizarColuna(headers, chaveAlias)` (usado por `Adaptador2026` e `SyntheonLeitor`).
     2. DicionÃ¡rio local `ALIASES` em `Compilador PIP.js`.
     3. Buscas ad-hoc com `.indexOf()` / `.includes()` em `Compilador_Armas.js` e `Compilador de Entorpecentes.js`.
   - **Risco:** DivergÃªncia de cabeÃ§alhos entre relatÃ³rios e compiladores.

---

## ðŸŽ¯ RecomendaÃ§Ãµes para a PrÃ³xima RefatoraÃ§Ã£o (Task C02.1-02)

1. Centralizar a resoluÃ§Ã£o de aliases de cabeÃ§alhos no `SyntheonUtils.localizarColuna` unificado.
2. Migrar leitores legados (`Compilador_Armas.js` e `Compilador de Entorpecentes.js`) para consumirem a camada unificada do C02 Leitura.
3. Parametrizar IDs de planilhas via mÃ³dulo de `Config`.

