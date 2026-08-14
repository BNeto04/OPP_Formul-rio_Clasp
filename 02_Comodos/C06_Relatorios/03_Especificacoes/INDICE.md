# EspecificaÃ§Ã£o TÃ©cnica de RelatÃ³rios e Regras Visuais (C06)

> **Documento:** `02_Comodos/02_SPECS/C06_RELATORIOS_SPEC.md`  
> **Status:** TASK-C06.1-01C CONCLUÃDA  
> **ReferÃªncia Transversal:** `REGRA_TRANSVERSAL_FORMATACAO_RELATORIOS.md`  
> **Escopo:** Design System, Paletas de Cores de Produtividade vs Severidade, Layouts de Tabelas e Mapeamento de ImplementaÃ§Ã£o  

---

## ðŸŽ¨ 1. Paletas de Cores e Design System Protegido

### 1.1 Paleta Oficial de Produtividade (RelatÃ³rios Oficiais)
As cores a seguir sÃ£o **consagradas no projeto** para a apresentaÃ§Ã£o de produtividade (Comparativo 2026, PIP, Armas, Drogas e CPM). Elas **nunca** podem ser substituÃ­das por cores de auditoria.

#### Cores de PelotÃµes e GraduaÃ§Ãµes
| Grupo / PelotÃ£o | Cor de Fundo (HEX) | Cor da Fonte (HEX) | Estilo Fonte | Status da ImplementaÃ§Ã£o no CÃ³digo |
| :--- | :--- | :--- | :--- | :--- |
| **Oficiais** | `#F1C232` (Amarelo Ouro) | `#000000` (Preto) | Normal | **IMPLEMENTADA NO CÃ“DIGO ATUAL** (`RendererComparativo2026.js`, `Compilador_Armas.js`, `Compilador de Entorpecentes.js`) |
| **1Âº PEL GTAR** | `#00CC00` (Verde Escuro) | `#000000` (Preto) | **Negrito** | **IMPLEMENTADA NO CÃ“DIGO ATUAL** (`RendererComparativo2026.js`) / *A padronizar nos demais no C06* |
| **1Âº PEL** | `#00FF00` (Verde Claro) | `#000000` (Preto) | Normal | **IMPLEMENTADA NO CÃ“DIGO ATUAL** (`RendererComparativo2026.js`, `Compilador_Armas.js`, `Compilador de Entorpecentes.js`) |
| **2Âº PEL GTAR** | `#3C78D8` (Azul Escuro) | `#FFFFFF` (Branco) | **Negrito** | **IMPLEMENTADA NO CÃ“DIGO ATUAL** (`RendererComparativo2026.js`) / *A padronizar nos demais no C06* |
| **2Âº PEL** | `#6D9EEB` (Azul Claro) | `#000000` (Preto) | Normal | **IMPLEMENTADA NO CÃ“DIGO ATUAL** (`RendererComparativo2026.js`, `Compilador_Armas.js`, `Compilador de Entorpecentes.js`) |
| **3Âº PEL** | `#FFFFFF` (Branco) | `#000000` (Preto) | Normal | **IMPLEMENTADA NO CÃ“DIGO ATUAL** (`RendererComparativo2026.js`, `Compilador_Armas.js`) |

#### Escala Oficial de Destaque de Armas
| Faixa de Armas | Cor de Fundo (HEX) | Cor da Fonte (HEX) | DescriÃ§Ã£o | Status da ImplementaÃ§Ã£o no CÃ³digo |
| :--- | :--- | :--- | :--- | :--- |
| **0 armas** | `#FF0000` (Vermelho) | `#FF0000` (Vermelho) | CÃ©lula totalmente em destaque de atenÃ§Ã£o | **IMPLEMENTADA NO CÃ“DIGO ATUAL** (`RendererComparativo2026.js`) |
| **1 a 3 armas** | `#FF9900` (Laranja) | `#000000` (Preto) | Faixa inicial de apreensÃ£o | **IMPLEMENTADA NO CÃ“DIGO ATUAL** (`RendererComparativo2026.js`) |
| **4 a 5 armas** | `#FFFF00` (Amarelo) | `#000000` (Preto) | Faixa intermediÃ¡ria de apreensÃ£o | **IMPLEMENTADA NO CÃ“DIGO ATUAL** (`RendererComparativo2026.js`) |
| **6 a 9 armas** | `#93C47D` (Verde MÃ©dio) | `#000000` (Preto) | Faixa alta de apreensÃ£o | **IMPLEMENTADA NO CÃ“DIGO ATUAL** (`RendererComparativo2026.js`) |
| **10+ armas** | `#38761D` (Verde Folha) | `#FFFFFF` (Branco Bold) | Destaque mÃ¡ximo de apreensÃ£o | **IMPLEMENTADA NO CÃ“DIGO ATUAL** (`RendererComparativo2026.js`) |

---

### 1.2 Paleta de Severidades (Exclusiva para RelatÃ³rios de Apoio e Auditoria)
Esta paleta se aplica **exclusivamente** Ã s abas `[AUDITORIA] Ocorrencias` e `[HISTORICO] Auditoria Ocorrencias`. **Proibido aplicar em relatÃ³rios oficiais de produtividade.**

| Severidade | Cor de Fundo (HEX) | Cor da Fonte (HEX) | AplicaÃ§Ã£o em Auditoria | Status no CÃ³digo |
| :--- | :--- | :--- | :--- | :--- |
| **ERRO TECNICO** | `#900C3F` (Vinho/BordÃ´) | `#FFFFFF` (Branco Bold) | Erro tÃ©cnico de execuÃ§Ã£o | **CONTRATO VISUAL A IMPLEMENTAR NO C06** |
| **CRITICO** | `#D9534F` (Vermelho) | `#FFFFFF` (Branco Bold) | OcorrÃªncia Ã³rfÃ£ | **CONTRATO VISUAL A IMPLEMENTAR NO C06** |
| **ALERTA** | `#F0AD4E` (Laranja/Amarelo) | `#212529` (Preto Bold) | DivergÃªncia de MIKE/Data/Rateio | **CONTRATO VISUAL A IMPLEMENTAR NO C06** |
| **OBSERVACAO** | `#5BC0DE` (Azul Claro) | `#212529` (Preto) | Fato nÃ£o auditÃ¡vel, modo limitado PIP | **CONTRATO VISUAL A IMPLEMENTAR NO C06** |
| **EXCECAO MANUAL**| `#6F42C1` (Roxo/PÃºrpura) | `#FFFFFF` (Branco Bold) | Ajuste justificado por nota `EXCECAO:` | **CONTRATO VISUAL A IMPLEMENTAR NO C06** |
| **APROVADO / OK** | `#28A745` (Verde) | `#FFFFFF` (Branco Bold) | Sem inconformidades encontradas | **CONTRATO VISUAL A IMPLEMENTAR NO C06** |

---

## ðŸ“ 2. Estrutura Visual, Congelamento e Formatos NumÃ©ricos

### 2.1 PadrÃ£o Visual do Comparativo 2026 (`Features/CompiladorProdutividade.js` $\rightarrow$ `Render/RendererComparativo2026.js`)
- **Gatilhos / FunÃ§Ãµes Reais:** `abrirMenuComparativo2026()`, `gerarComparativo2026Premium()`
- **Aba de SaÃ­da:** `COMPARATIVO_2026` (**IMPLEMENTADA NO CÃ“DIGO ATUAL**)
- **TÃ­tulo Principal (Linha 2):** Fonte Arial 20pt Negrito, Centralizado, Borda Espessa `#000000`, Fundo Branco (**IMPLEMENTADA NO CÃ“DIGO ATUAL**).
- **Linha de Metadados (Linha 4):** Fonte Arial 10pt Cor `#4B5563`, Centralizado (`Ano base | Periodo | Policiais`) (**IMPLEMENTADA NO CÃ“DIGO ATUAL**).
- **Linha de Grupos (Linha 5):** Fundo `#9E9E9E`, Texto Preto Negrito, Centralizado (**IMPLEMENTADA NO CÃ“DIGO ATUAL**).
- **Linha de CabeÃ§alhos (Linha 6):** Fundo `#F3F4F6`, Texto Preto Negrito, Centralizado (**IMPLEMENTADA NO CÃ“DIGO ATUAL**).
- **Congelamento:** `sheet.setFrozenRows(6)` (**IMPLEMENTADA NO CÃ“DIGO ATUAL**).
- **Gridlines:** Ocultas via `sheet.setHiddenGridlines(true)` (**IMPLEMENTADA NO CÃ“DIGO ATUAL**).
- **AutoFiltro:** `createFilter()` aplicado sobre a linha de cabeÃ§alho (**IMPLEMENTADA NO CÃ“DIGO ATUAL**).
- **Larguras Fixas de Colunas:** Col 1 (44px), Col 2 (70px), Col 3 (92px), Col 4 (260px), Col 5 (86px), Col 6 (72px), Col 7 (112px), Col 8 (92px), Col 9 (140px) (**IMPLEMENTADA NO CÃ“DIGO ATUAL**).
- **Formatos NumÃ©ricos:** PontuaÃ§Ã£o (`#,##0.00`), Entorpecentes (`#,##0.00`) (**IMPLEMENTADA NO CÃ“DIGO ATUAL**).

### 2.2 PadrÃ£o Visual do PIP (`Compilador PIP.js`)
- **Gatilhos / FunÃ§Ãµes Reais:** `criarMenuPip_()`, `abrirMenuPipMensal()`, `abrirMenuPipLivre()`, `gerarPipAnual()`, `criarAbaResultado_()`
- **Regra Temporal PIP:** PerÃ­odo de apuraÃ§Ã£o de 29 do mÃªs anterior a 28 do mÃªs atual.
- **Abas de SaÃ­da:** `PIP_<perÃ­odo>`, `PIP_ANUAL_2026`, `PIP_SELECAO_LIVRE` (**IMPLEMENTADAS NO CÃ“DIGO ATUAL**).
- **Estrutura Atual:** CabeÃ§alho de 7 colunas em `#D9EAD3` negrito centralizado, `setFrozenRows(1)`, AutoFiltro, formato `#,##0.00` na Coluna 6 (PontuaÃ§Ã£o) (**IMPLEMENTADA NO CÃ“DIGO ATUAL**).
- **Contrato C06:** PadronizaÃ§Ã£o visual completa no Design System SynthÃ©on (**CONTRATO VISUAL A IMPLEMENTAR NO C06**).

### 2.3 PadrÃ£o Visual do CPM (`CPM â€“ Compilador de PontuaÃ§Ã£o Mensal.js`)
- **Gatilhos / FunÃ§Ãµes Reais:** `criarMenuCPM_()`, `abrirMenuCPMMensal()`, `abrirMenuCPMLivre()`, `gerarCPMAnual()`, `criarAbaResultadoCPM_()`
- **Regra Temporal CPM:** PerÃ­odo de apuraÃ§Ã£o do mÃªs civil (1Âº ao Ãºltimo dia do mÃªs).
- **Abas de SaÃ­da:** `CPM_<mes>`, `CPM_ANUAL_2026`, `CPM_SELECAO_LIVRE` (**IMPLEMENTADAS NO CÃ“DIGO ATUAL**).
- **Estrutura Atual:** CabeÃ§alho 6 colunas em `#D9EAD3` negrito centralizado, `setFrozenRows(1)`, AutoFiltro, formato `#,##0.00` na Coluna 6 (**IMPLEMENTADA NO CÃ“DIGO ATUAL**).
- **Contrato C06:** PadronizaÃ§Ã£o visual no Design System SynthÃ©on (**CONTRATO VISUAL A IMPLEMENTAR NO C06**).

### 2.4 PadrÃ£o Visual de Armas (`Compilador_Armas.js`)
- **Gatilhos / FunÃ§Ãµes Reais:** `criarMenuArmas_()`, `abrirMenuSelecaoLivre()`
- **Abas de SaÃ­da:** `COMP_ARMAS_2026`, `COMP_ARMAS_<perÃ­odo>` (**IMPLEMENTADAS NO CÃ“DIGO ATUAL**).
- **Estrutura Atual:** CabeÃ§alho 5 colunas em `#E0E0E0` negrito, cores bÃ¡sicas de PelotÃ£o (`#F1C232` Oficiais, `#00FF00` 1Âº PEL, `#6D9EEB` 2Âº PEL, `#FFFFFF` 3Âº PEL) (**IMPLEMENTADA NO CÃ“DIGO ATUAL**).
- **Contrato C06:** Incorporar escala de destaque de armas, GTAR e carimbo de auditoria (**CONTRATO VISUAL A IMPLEMENTAR NO C06**).

### 2.5 PadrÃ£o Visual de Entorpecentes / Drogas (`Compilador de Entorpecentes.js`)
- **Gatilhos / FunÃ§Ãµes Reais:** `criarMenuDrogas_()`, `abrirMenuSelecaoLivreDrogas()`
- **Abas de SaÃ­da:** `COMP_DROGAS_2026`, `COMP_DROGAS_<perÃ­odo>` (**IMPLEMENTADAS NO CÃ“DIGO ATUAL**).
- **Estrutura Atual:** CabeÃ§alho 10 colunas em `#E0E0E0` negrito, cores bÃ¡sicas de PelotÃ£o (**IMPLEMENTADA NO CÃ“DIGO ATUAL**).
- **Contrato C06:** PadronizaÃ§Ã£o com GTAR, alinhamentos Ã  direita e formatos `#,##0.00`g estritos (**CONTRATO VISUAL A IMPLEMENTAR NO C06**).

---

## ðŸ›¡ï¸ 3. Regra de FormataÃ§Ã£o da Coluna AM (`Alerta Integridade`)

- **PreservaÃ§Ã£o Estrutural da Linha:** Ao escrever um diagnÃ³stico ou limpar o alerta na Coluna AM das abas mensais, o script **jamais pode resetar a cor de fundo, bordas ou fonte dos dados das colunas A atÃ© AL**.
- **AÃ§Ã£o Restrita Ã  CÃ©lula AM:**
  - **Com Alerta:** Aplica destaque Amarelo/Laranja (`#FFF3CD` / `#856404`) **exclusivamente na cÃ©lula AM** da linha auditada.
  - **Sem Alerta (Limpa):** Reseta o fundo e limpa o texto **exclusivamente na cÃ©lula AM** da linha auditada, mantendo o zebrado e as bordas originais da planilha intactos.

---

## ðŸ”’ 4. RestriÃ§Ãµes de GovernanÃ§a
- A **Central AnalÃ­tica** permanece **SUSPENSA**. Nenhuma regra de relatÃ³rio deve invocar ou depender da Central AnalÃ­tica nesta sprint.
- Toda modificaÃ§Ã£o visual deve manter conformidade com as suÃ­tes de testes unitÃ¡rios offline em Node.js.


## Extrato de MOD-C06-00_Transversal.md

# Regra Transversal Ã¢â‚¬â€ FormataÃƒÂ§ÃƒÂ£o Dos RelatÃƒÂ³rios

## Status

ATIVA / OBRIGATÃƒâ€œRIA

## Objetivo

Preservar a aparÃƒÂªncia operacional dos relatÃƒÂ³rios jÃƒÂ¡ aprovados visualmente na planilha, especialmente o `COMPARATIVO_2026` e relatÃƒÂ³rios derivados.

## Regra

Nenhuma refatoraÃƒÂ§ÃƒÂ£o de leitura, domÃƒÂ­nio, motor, guardiÃƒÂ£o ou relatÃƒÂ³rio pode remover, simplificar ou alterar silenciosamente as regras visuais jÃƒÂ¡ empregadas nos relatÃƒÂ³rios oficiais.

## FormataÃƒÂ§ÃƒÂµes Protegidas

### PelotÃƒÂµes / Subunidades

As cores por grupo devem ser preservadas:

- Oficiais
- 1Ã‚Âº PEL
- 2Ã‚Âº PEL
- 3Ã‚Âº PEL
- 1Ã‚Âº PEL GTAR
- 2Ã‚Âº PEL GTAR
- Registros fora do PecÃƒÂºlio, quando aplicÃƒÂ¡vel

### Armas

A escala visual de quantidade de armas deve ser preservada:

- 0 armas: destaque quando a regra do relatÃƒÂ³rio exigir chamar atenÃƒÂ§ÃƒÂ£o
- 1 a 3
- 4 a 5
- 6 a 9
- 10+

A formataÃƒÂ§ÃƒÂ£o deve continuar permitindo leitura rÃƒÂ¡pida de quem participou ou nÃƒÂ£o de apreensÃƒÂ£o de arma.

### Comparativo 2026

O relatÃƒÂ³rio `COMPARATIVO_2026` deve preservar:

- CabeÃƒÂ§alho institucional;
- OrdenaÃƒÂ§ÃƒÂ£o definida;
- Cores por pelotÃƒÂ£o/subunidade;
- Destaque visual de armas;
- Formatos numÃƒÂ©ricos legÃƒÂ­veis;
- Congelamento/organizaÃƒÂ§ÃƒÂ£o visual;
- Carimbo/metadados no local definido;
- Layout compatÃƒÂ­vel com a apresentaÃƒÂ§ÃƒÂ£o operacional.

### PIP / PrÃƒÂ©via

RelatÃƒÂ³rios PIP e prÃƒÂ©vias devem preservar:

- PontuaÃƒÂ§ÃƒÂ£o formatada de forma legÃƒÂ­vel;
- DesignaÃƒÂ§ÃƒÂ£o/subunidade quando necessÃƒÂ¡ria;
- OrdenaÃƒÂ§ÃƒÂ£o por pontuaÃƒÂ§ÃƒÂ£o;
- Filtros ÃƒÂºteis para Looker Studio;
- Campos necessÃƒÂ¡rios para conferÃƒÂªncia pelos policiais.

## CritÃƒÂ©rio de Aceite

Qualquer alteraÃƒÂ§ÃƒÂ£o em renderizadores deve ser validada visualmente contra uma versÃƒÂ£o anterior aprovada.

A alteraÃƒÂ§ÃƒÂ£o sÃƒÂ³ ÃƒÂ© aceita se:

- Os dados continuam corretos;
- A formataÃƒÂ§ÃƒÂ£o operacional foi preservada;
- A leitura humana nÃƒÂ£o piorou;
- Nenhuma cor semÃƒÂ¢ntica foi perdida;
- Os testes automatizados continuam passando.

## CÃƒÂ´modo Dono

C06 RelatÃƒÂ³rios.

## CÃƒÂ´modos Obrigados a Respeitar

- C01 Entrada
- C02 Leitura
- C03 DomÃƒÂ­nio
- C04 Motor
- C05 GuardiÃƒÂ£o
- C06 RelatÃƒÂ³rios
- C07 Efetivo
- C08 HomologaÃƒÂ§ÃƒÂ£o/Testes



## Extrato de MOD-C06-02_Especificacoes.md

# EspecificaÃƒÂ§ÃƒÂ£o TÃƒÂ©cnica Ã¢â‚¬â€ Sprint C06: RelatÃƒÂ³rios Oficiais e PadronizaÃƒÂ§ÃƒÂ£o Visual

> **Documento:** `02_Comodos/02_SPECS/C06.2_RELATORIOS_OFICIAIS_SPEC.md`  
> **Status:** EM ANDAMENTO (TASK-C06-05)  
> **Contexto:** Ecossistema SynthÃƒÂ©on GS Down Plant Offline  

---

## 1. VisÃƒÂ£o Geral

Esta especificaÃƒÂ§ÃƒÂ£o tÃƒÂ©cnica detalha os requisitos de apresentaÃƒÂ§ÃƒÂ£o visual, paletas institucionais consagradas, formatos numÃƒÂ©ricos, legenda oficial de armas, alinhamentos e preservaÃƒÂ§ÃƒÂ£o de regras protegidas para os **RelatÃƒÂ³rios Oficiais de Produtividade** do SynthÃƒÂ©on GS.

---

## 2. Paleta Oficial Consagrada de Produtividade

Conforme registrado em `C06_RELATORIOS_SPEC.md` (seÃƒÂ§ÃƒÂ£o 1.1), a paleta oficial de pelotÃƒÂµes e graduaÃƒÂ§ÃƒÂµes ÃƒÂ© estritamente a seguinte:

| Grupo / PelotÃƒÂ£o | Cor de Fundo (HEX) | Cor da Fonte (HEX) | Estilo Fonte |
| :--- | :--- | :--- | :--- |
| **Oficiais** | `#F1C232` (Amarelo Ouro) | `#000000` (Preto) | Normal |
| **1Ã‚Âº PEL GTAR** | `#00CC00` (Verde Escuro) | `#000000` (Preto) | **Negrito** |
| **1Ã‚Âº PEL** | `#00FF00` (Verde Claro) | `#000000` (Preto) | Normal |
| **2Ã‚Âº PEL GTAR** | `#3C78D8` (Azul Escuro) | `#FFFFFF` (Branco) | **Negrito** |
| **2Ã‚Âº PEL** | `#6D9EEB` (Azul Claro) | `#000000` (Preto) | Normal |
| **3Ã‚Âº PEL** | `#FFFFFF` (Branco) | `#000000` (Preto) | Normal |

> **Nota de GovernanÃƒÂ§a:** CPM (Compilador de PontuaÃƒÂ§ÃƒÂ£o Mensal) ÃƒÂ© um mÃƒÂ³dulo compilador civil de mÃƒÂªs civil, nÃƒÂ£o constituindo categoria ou cor de pelotÃƒÂ£o.

---

## 3. Escala Oficial de Destaque de Armas

| Faixa de Armas | Cor de Fundo (HEX) | Cor da Fonte (HEX) | DescriÃƒÂ§ÃƒÂ£o |
| :--- | :--- | :--- | :--- |
| **0 armas** | `#FF0000` (Vermelho) | `#FF0000` (Vermelho) | Destaque de atenÃƒÂ§ÃƒÂ£o quando a contagem ÃƒÂ© zero |
| **1 a 3 armas** | `#FF9900` (Laranja) | `#000000` (Preto) | Faixa inicial de apreensÃƒÂ£o |
| **4 a 5 armas** | `#FFFF00` (Amarelo) | `#000000` (Preto) | Faixa intermediÃƒÂ¡ria de apreensÃƒÂ£o |
| **6 a 9 armas** | `#93C47D` (Verde MÃƒÂ©dio) | `#000000` (Preto) | Faixa alta de apreensÃƒÂ£o |
| **10+ armas** | `#38761D` (Verde Folha) | `#FFFFFF` (Branco Bold) | Destaque mÃƒÂ¡ximo de apreensÃƒÂ£o |

---

## 4. Contratos Visuais dos RelatÃƒÂ³rios Oficiais

### 4.1. COMPARATIVO_2026 (ReferÃƒÂªncia Premium ImutÃƒÂ¡vel)
- **FunÃƒÂ§ÃƒÂµes ExecutÃƒÂ¡veis:** `abrirMenuComparativo2026()`, `gerarComparativo2026Premium()`
- **Compilador Visual:** `Features/CompiladorProdutividade.js` / `Render/RendererComparativo2026.js`
- **Aba de SaÃƒÂ­da:** `COMPARATIVO_2026`
- **EstilizaÃƒÂ§ÃƒÂ£o Preservada:**
  - TÃƒÂ­tulo e cabeÃƒÂ§alhos em Azul Marinho `#1C3144` e `#2C4257`.
  - Cores consagradas dos PelotÃƒÂµes (1Ã‚Âº PEL `#00FF00`, 2Ã‚Âº PEL `#6D9EEB`, 3Ã‚Âº PEL `#FFFFFF`), GTAR (1Ã‚Âº PEL GTAR `#00CC00` bold, 2Ã‚Âº PEL GTAR `#3C78D8` bold branco) e OFICIAIS (`#F1C232`).
  - Escala oficial de cores para quantidade de armas apreendidas (zero em vermelho `#FF0000`).
  - Carimbo institucional e congelamento de cabeÃƒÂ§alhos.
  - Formatos numÃƒÂ©ricos `#,##0.00` para pontuaÃƒÂ§ÃƒÂ£o e nÃƒÂºmeros inteiros `#,##0` para ocorrÃƒÂªncias/armas.

### 4.2. PIP (Programa de Incentivo ÃƒÂ  Produtividade)
- **FunÃƒÂ§ÃƒÂµes ExecutÃƒÂ¡veis:** `criarMenuPip_()`, `abrirMenuPipMensal()`, `abrirMenuPipLivre()`, `gerarPipAnual()`
- **Compilador Visual:** `Compilador PIP.js` (`criarAbaResultado_()`)
- **Abas de SaÃƒÂ­da:** `PIP_<perÃƒÂ­odo>`, `PIP_ANUAL_2026`, `PIP_SELECAO_LIVRE`
- **PerÃƒÂ­odo Protegido:** Ciclo operacional do dia 29 do mÃƒÂªs anterior ao dia 28 do mÃƒÂªs corrente.
- **EspecificaÃƒÂ§ÃƒÂ£o Visual:**
  - Preserva o layout estrutural e cabeÃƒÂ§alho existente no cÃƒÂ³digo atual (`Compilador PIP.js`), sem alteraÃƒÂ§ÃƒÂµes cosmÃƒÂ©ticas arbitrÃƒÂ¡rias.
  - FormataÃƒÂ§ÃƒÂ£o numÃƒÂ©rica de pontuaÃƒÂ§ÃƒÂ£o em `#,##0.00`.
  - Alinhamentos: Rank, MatrÃƒÂ­cula, GraduaÃƒÂ§ÃƒÂ£o centralizados; Nome e DesignaÃƒÂ§ÃƒÂ£o alinhados ÃƒÂ  esquerda; PontuaÃƒÂ§ÃƒÂ£o e OcorrÃƒÂªncias alinhados ÃƒÂ  direita.

### 4.3. CPM (Compilador de PontuaÃƒÂ§ÃƒÂ£o Mensal)
- **FunÃƒÂ§ÃƒÂµes ExecutÃƒÂ¡veis:** `criarMenuCPM_()`, `abrirMenuCPMMensal()`, `abrirMenuCPMLivre()`, `gerarCPMAnual()`
- **Compilador Visual:** `CPM Ã¢â‚¬â€œ Compilador de PontuaÃƒÂ§ÃƒÂ£o Mensal.js` (`criarAbaResultadoCPM_()`)
- **Abas de SaÃƒÂ­da:** `CPM_<mes>`, `CPM_ANUAL_2026`, `CPM_SELECAO_LIVRE`
- **PerÃƒÂ­odo Protegido:** MÃƒÂªs civil (dia 1Ã‚Âº ao ÃƒÂºltimo dia do mÃƒÂªs).
- **EspecificaÃƒÂ§ÃƒÂ£o Visual:**
  - FormataÃƒÂ§ÃƒÂ£o numÃƒÂ©rica de pontuaÃƒÂ§ÃƒÂ£o em `#,##0.00`.
  - Manter rigorosamente a separaÃƒÂ§ÃƒÂ£o de perÃƒÂ­odo em relaÃƒÂ§ÃƒÂ£o ao PIP.

### 4.4. ARMAS (RelatÃƒÂ³rio de Armas Apreendidas)
- **FunÃƒÂ§ÃƒÂµes ExecutÃƒÂ¡veis:** `criarMenuArmas_()`, `abrirMenuSelecaoLivre()`
- **Compilador Visual:** `Compilador_Armas.js`
- **Abas de SaÃƒÂ­da:** `COMP_ARMAS_2026`, `COMP_ARMAS_<perÃƒÂ­odo>`
- **EspecificaÃƒÂ§ÃƒÂ£o Visual:**
  - Aplicar as cores oficiais consagradas de PelotÃƒÂµes, incluindo 1Ã‚Âº PEL GTAR (`#00CC00` bold), 2Ã‚Âº PEL GTAR (`#3C78D8` bold branco) e OFICIAIS (`#F1C232`).
  - Aplicar a escala oficial de armas apreendidas (destaque vermelho `#FF0000` quando a contagem for zero).
  - FormataÃƒÂ§ÃƒÂ£o inteira `#,##0` para quantidades.

### 4.5. DROGAS (RelatÃƒÂ³rio de Entorpecentes)
- **FunÃƒÂ§ÃƒÂµes ExecutÃƒÂ¡veis:** `criarMenuDrogas_()`, `abrirMenuSelecaoLivreDrogas()`
- **Compilador Visual:** `Compilador de Entorpecentes.js`
- **Abas de SaÃƒÂ­da:** `COMP_DROGAS_2026`, `COMP_DROGAS_<perÃƒÂ­odo>`
- **Estrutura Protegida:** 10 colunas (`POS`, `PELOTÃƒÆ’O`, `GRADUAÃƒâ€¡ÃƒÆ’O`, `MATRÃƒÂCULA`, `POLICIAL`, `MACONHA (g)`, `COCAÃƒÂNA (g)`, `TOTAL (g)`, `OCORRÃƒÅ NCIAS`, `BOEs`).
- **EspecificaÃƒÂ§ÃƒÂ£o Visual:**
  - Aplicar a paleta oficial consagrada de PelotÃƒÂµes nas colunas A:G e I:J, incluindo 1Ã‚Âº PEL GTAR (`#00CC00` bold), 2Ã‚Âº PEL GTAR (`#3C78D8` bold branco) e OFICIAIS (`#F1C232`).
  - Preservar a escala prÃƒÂ³pria do relatÃƒÂ³rio para o `TOTAL (g)` na coluna H (coluna 8).
  - FormataÃƒÂ§ÃƒÂ£o numÃƒÂ©rica de gramatura: `#,##0.00" g"` para Maconha, CocaÃƒÂ­na e Total (g).
  - FormataÃƒÂ§ÃƒÂ£o inteira: `#,##0` para OcorrÃƒÂªncias e BOEs.
  - Alinhamento: Policial ÃƒÂ  esquerda; POS, PelotÃƒÂ£o, GraduaÃƒÂ§ÃƒÂ£o e MatrÃƒÂ­cula centralizados; MÃƒÂ©tricas (Maconha, CocaÃƒÂ­na, Total, OcorrÃƒÂªncias, BOEs) alinhadas ÃƒÂ  direita.

---

## 5. EstratÃƒÂ©gia de RegressÃƒÂ£o Visual e Testes

- Cada compilador receberÃƒÂ¡ suÃƒÂ­te automatizada de testes de regressÃƒÂ£o visual em `Testes/TestRenderers.js` ou em teste dedicado de regressÃƒÂ£o visual, garantindo que as tabelas geradas contÃƒÂªm as cores consagradas, alinhamentos, congelamentos e formatos numÃƒÂ©ricos sem alterar dados operacionais.



## Extrato de MOD-C06-03_Diagnostico_GXT_2T.md

# RelatÃƒÂ³rio de DiagnÃƒÂ³stico Forense Real e Normalizado Ã¢â‚¬â€ 2Ã‚Âº Trimestre (TASK-C06-05I.1S)

> **Documento:** `02_Comodos/C06.3_DIAGNOSTICO_GXT_2T.md`  
> **Status:** CONCLUÃƒÂDO E PROVADO (Analisador Python Versionado `scripts/DiagnosticoGxtTrimestral.py` / ÃƒÂrvore Limpa)  
> **Data de AtualizaÃƒÂ§ÃƒÂ£o:** 01/08/2026  
> **Arquivos Excel Analisados (Busca por Nome Normalizado):**  
> 1. `SYNTHÃƒâ€°ON Ã¢â‚¬â€ HOMOLOGAÃƒâ€¡ÃƒÆ’O C06 Ã¢â‚¬â€ 2026-07-29 (1).xlsx` (abas `ABR2026`, `MAI2026`, `JUN2026`)  
> 2. `GTAR X TROPA ARMAS 2026 (1).xlsx` (abas `GTAR X PEL 2Ã‚Âº TRIMESTRE` e `CÃƒÂ³pia de PecÃƒÂºlio com PontuaÃƒÂ§ÃƒÂ£o `)

---

## Ã°Å¸Ââ€  DESCOBERTA CHAVE E PROVA HISTÃƒâ€œRICA: ARMAS DE FOGO NUMÃƒâ€°RICAS VS ARTESANAIS

| MÃƒÂªs | Target Baseline HistÃƒÂ³rico (`GTAR X PEL`) | GXT Inflado Atual (`QDT ARMAS` / PM) | Armas de Fogo NumÃƒÂ©ricas (Cards/Soma) | Armas Artesanais (Texto no Registro) | Total Fatos FÃƒÂ­sicos (Fogo + Artesanal) | Status do Baseline NumÃƒÂ©rico |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **ABRIL / 2026** | **40** | 183.0 (+143.0) | **40.0** | 1 | **41.0** | **EXATO (40.0)** Ã¢Å“â€¦ |
| **MAIO / 2026** | **27** | 136.0 (+109.0) | **27.0** | 0 | **27.0** | **EXATO (27.0)** Ã¢Å“â€¦ |
| **JUNHO / 2026** | **21** | 129.0 (+107.0) | **21.0** | 1 | **22.0** | **EXATO (21.0)** Ã¢Å“â€¦ (`REGRA_HISTORICA_ARTESANAL`) |
| **TOTAL 2Ã‚Âº TRIMESTRE** | **88** | **448.0 (+360.0)** | **88.0** | **2** | **90.0** | **100% CONVERGENTE (88.0)** Ã¢Å“â€¦ |

---

## Ã°Å¸Å½Â¯ ExplicaÃƒÂ§ÃƒÂ£o TÃƒÂ©cnica da Regra HistÃƒÂ³rica de Armas Artesanais (`REGRA_HISTORICA_ARTESANAL`)

A anÃƒÂ¡lise aprofundada dos registros da coluna `ARMA` (coluna 11), `TIPO` (coluna 12) e `MODELO` (coluna 14) revelou a razÃƒÂ£o exata de Junho apresentar 22 fatos fÃƒÂ­sicos totais mas 21 no resumo numÃƒÂ©rico do baseline:

1. **Arma de Fogo (Valor NumÃƒÂ©rico):**
   - Ãƒâ€° registrada como nÃƒÂºmero (`1.0`, `2.0`, etc.) na coluna `ARMA`.
   - Ãƒâ€° somada automaticamente pelas fÃƒÂ³rmulas numÃƒÂ©ricas (`SOMA`) dos cards e resumos institucionais.
   - **Resultados NumÃƒÂ©ricos:**
     - Abril: **40.0 armas de fogo** (exatamente igual ao target 40).
     - Maio: **27.0 armas de fogo** (exatamente igual ao target 27).
     - Junho: **21.0 armas de fogo** (exatamente igual ao target 21).
     - Total: **88.0 armas de fogo numÃƒÂ©ricas** (100% convergente com o baseline histÃƒÂ³rico de 88 armas!).

2. **Arma Artesanal (Texto `"ARTESANAL"`):**
   - Ãƒâ€° registrada como texto `"ARTESANAL"` no registro da ocorrÃƒÂªncia.
   - Por ser texto, **nÃƒÂ£o ÃƒÂ© computada nas fÃƒÂ³rmulas numÃƒÂ©ricas de soma de cards** (o Excel ignora texto em `SOMA`).
   - Contudo, **o lÃƒÂ­der da guarniÃƒÂ§ÃƒÂ£o recebe o mÃƒÂ©rito da apreensÃƒÂ£o artesanal no registro individual**.
   - **TÃƒÂºnel de Junho Identificado:**
     - `2026-06-17|202606171733263474|26E1174008629` (Linhas 99-105): possui 1 arma de fogo numÃƒÂ©rica + 1 arma artesanal em texto (`is_artesanal = True`). LÃƒÂ­der: WILDSON SANTOS (1Ã‚Âº PEL GTAR).
     - Esse tÃƒÂºnel contribui com **1.0 na soma numÃƒÂ©rica de fogo** e **1 na contagem de artesanais**, totalizando 22 fatos fÃƒÂ­sicos no mÃƒÂªs, mas **21 no card numÃƒÂ©rico estÃƒÂ¡tico de armas de fogo**.

---

## Ã¢Å¡â„¢Ã¯Â¸Â Diretrizes para a Fase 2 (CorreÃƒÂ§ÃƒÂ£o do Motor no Compilador GXT)

A Fase 2 (`TASK-C06-05I.2`) deverÃƒÂ¡ implementar a separaÃƒÂ§ÃƒÂ£o formal no objeto compilado por tÃƒÂºnel/lÃƒÂ­der:

```javascript
{
  qtdArmasFogo: 1.0,        // Quantidade numÃƒÂ©rica de armas de fogo (vai para a soma numÃƒÂ©rica dos cards/painÃƒÂ©is)
  qtdArmasArtesanais: 1,    // Quantidade de armas artesanais em texto (exibida como texto "ARTESANAL")
  totalFatosFisicos: 2      // Total de fatos fÃƒÂ­sicos deduplicados
}
```

- **Cards e Resumos NumÃƒÂ©ricos:** somam apenas `qtdArmasFogo` (reproduzindo 40 em Abril, 27 em Maio, 21 em Junho = **88 total**).
- **Detalhamento Institucional do LÃƒÂ­der:** exibe o texto `"ARTESANAL"` quando `qtdArmasArtesanais > 0` sem contaminar a soma numÃƒÂ©rica.

---

## Ã°Å¸â€â€™ Garantias de GovernanÃƒÂ§a

- **CÃƒÂ³digo de ProduÃƒÂ§ÃƒÂ£o Intacto:** `Features/CompiladorGxt.js`, `Motor/PoliticaMeritoArmas.js` e renderizadores nÃƒÂ£o sofreram qualquer ediÃƒÂ§ÃƒÂ£o.
- **Sem PublicaÃƒÂ§ÃƒÂ£o:** Nenhuma chamada a `clasp push` ou `git push`.
- **ÃƒÂrvore Limpa:** Pasta `scratch/` removida. Analisador robusto em `scripts/DiagnosticoGxtTrimestral.py`.
- **SuÃƒÂ­te de Testes:** 100% Aprovada (`NODE_EXIT=0`).



## Extrato de MOD-C06-03_Especificacoes.md

# EspecificaÃƒÂ§ÃƒÂ£o TÃƒÂ©cnica Ã¢â‚¬â€ MÃƒÂ©rito de Equipe por Armas (C06)

> **Documento:** `02_Comodos/02_SPECS/C06.3_MERITO_ARMAS_SPEC.md`  
> **VersÃƒÂ£o:** 1.0  
> **Status:** APROVADA / EM CONTRATO  
> **Contexto:** Ecossistema SynthÃƒÂ©on GS Down Plant Offline  

---

## 1. VisÃƒÂ£o Geral e Objetivo

O **RelatÃƒÂ³rio de MÃƒÂ©rito de Equipe por Armas** visa premiar e registrar o mÃƒÂ©rito de apreensÃƒÂ£o de armas de fogo e artesanais ao policial **mais antigo** da equipe presente em cada ocorrÃƒÂªncia. 

Ao contrÃƒÂ¡rio dos relatÃƒÂ³rios de produtividade individual (onde a pontuaÃƒÂ§ÃƒÂ£o e mÃƒÂ©tricas podem ser rateadas entre os integrantes da guarniÃƒÂ§ÃƒÂ£o), este relatÃƒÂ³rio ÃƒÂ© voltado ao **reconhecimento institucional de mÃƒÂ©rito operacional por equipe**, atribuindo a totalidade das armas do tÃƒÂºnel ao seu lÃƒÂ­der.

---

## 2. Regras de AtribuiÃƒÂ§ÃƒÂ£o e Regra Pura de NegÃƒÂ³cio

1. **Agrupamento por TÃƒÂºnel Operacional**:
   - As ocorrÃƒÂªncias sÃƒÂ£o identificadas e agrupadas pela chave ÃƒÂºnica do tÃƒÂºnel: `DATA | MIKE | BOE`.
2. **Soma Integral de Armas do TÃƒÂºnel**:
   - A quantidade total de armas do tÃƒÂºnel ÃƒÂ© somada uma ÃƒÂºnica vez (incluindo armas de fogo e armas artesanais, onde 1 arma artesanal = 1 arma).
3. **IdentificaÃƒÂ§ÃƒÂ£o da Equipe**:
   - SÃƒÂ£o consultados todos os policiais militares vinculados ÃƒÂ s linhas daquele tÃƒÂºnel.
4. **ResoluÃƒÂ§ÃƒÂ£o de Antiguidade**:
   - Para cada integrante da equipe, ÃƒÂ© consultado o seu nÃƒÂºmero/ÃƒÂ­ndice de antiguidade oficial.
   - O policial com o **menor valor numÃƒÂ©rico de antiguidade** (ou seja, o militar mais antigo da guarniÃƒÂ§ÃƒÂ£o) ÃƒÂ© selecionado como o **LÃƒÂ­der da OcorrÃƒÂªncia**.
5. **AtribuiÃƒÂ§ÃƒÂ£o Exclusiva**:
   - A quantidade total de armas do tÃƒÂºnel ÃƒÂ© atribuÃƒÂ­da em 100% ao LÃƒÂ­der da OcorrÃƒÂªncia.
   - Os demais integrantes nÃƒÂ£o recebem o registro de mÃƒÂ©rito no relatÃƒÂ³rio de equipe (embora mantenham suas mÃƒÂ©tricas de produtividade individual preservadas no PIP/CPM).
6. **Alerta AuditÃƒÂ¡vel de IncoerÃƒÂªncia / Empate**:
   - Se um tÃƒÂºnel contiver armas apreendidas mas nenhum integrante possuir nÃƒÂºmero de antiguidade vÃƒÂ¡lido no cadastro, ou se houver empate estrito de antiguidade entre dois lÃƒÂ­deres sem critÃƒÂ©rio de desempate cadastrado:
     - O GuardiÃƒÂ£o da Qualidade (C05) deve emitir um alerta de severidade `CRITICO` / `ALERTA`.
     - **Regra de Ouro**: Ãƒâ€° proibido realizar escolhas aleatÃƒÂ³rias ou omissÃƒÂµes silenciosas.

---

## 3. Estrutura do RelatÃƒÂ³rio e Formato VisÃƒÂ­vel

1. **Leiaute Lado a Lado (Trimestral)**:
   - ApresentaÃƒÂ§ÃƒÂ£o dos dados organizada por trimestre em trÃƒÂªs blocos mensais paralelos (ex.: JAN, FEV, MAR lado a lado).
   - Colunas por bloco mensal: `GRADUAÃƒâ€¡ÃƒÆ’O`, `POLICIAL / NOME`, `QTD ARMAS`, `DESIGNAÃƒâ€¡ÃƒÆ’O / PELOTÃƒÆ’O`.
   - Coluna de PosiÃƒÂ§ÃƒÂ£o/Item no relatÃƒÂ³rio: O nÃƒÂºmero sequencial ÃƒÂ  esquerda ÃƒÂ© a posiÃƒÂ§ÃƒÂ£o do item no relatÃƒÂ³rio visual (1Ã‚Âº, 2Ã‚Âº, 3Ã‚Âº...), nÃƒÂ£o devendo ser confundido com o ÃƒÂ­ndice de antiguidade.
2. **Resumo Mensal por PelotÃƒÂ£o / GTAR**:
   - PÃƒÂ¡ginas/painÃƒÂ©is de consolidaÃƒÂ§ÃƒÂ£o dos totais de armas de mÃƒÂ©rito acumulados por grupo de lotaÃƒÂ§ÃƒÂ£o (Oficiais, 1Ã‚Âº PEL GTAR, 1Ã‚Âº PEL, 2Ã‚Âº PEL GTAR, 2Ã‚Âº PEL, 3Ã‚Âº PEL).

---

## 4. Fonte de Dados de Antiguidade e InventÃƒÂ¡rio

> **DefiniÃƒÂ§ÃƒÂ£o de Contrato**:
> A ordem de antiguidade deve ser determinada por um nÃƒÂºmero inteiro estritamente positivo (quanto menor o nÃƒÂºmero, mais antigo o policial).

Fontes candidatas a serem validadas com a unidade:
- **OpÃƒÂ§ÃƒÂ£o A**: Ordem fÃƒÂ­sica e sequencial de linhas na aba `EFETIVO`.
- **OpÃƒÂ§ÃƒÂ£o B**: Coluna especÃƒÂ­fica de Antiguidade / Ordem no cadastro de `PECULIO` ou `EFETIVO`.
- **OpÃƒÂ§ÃƒÂ£o C**: Tabela/Lista oficial dedicada mantida pela unidade.


