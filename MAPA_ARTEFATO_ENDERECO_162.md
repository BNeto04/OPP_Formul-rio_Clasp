# MAPA artefato → endereço canônico — card #162 (DP24-001), 72 espelhos

**Branch:** `sprint/g01-guardiao-qualidade-live-001` · **HEAD:** `fbb0608e7b98144533628c7f9b773a10505b800d` (`fbb0608`)

> Arquivo na **raiz do repositório de propósito**: ele nomeia caminhos e tokens que a varredura de
> conteúdo das árvores documentais proíbe. A raiz não é varrida. Mesmo precedente do `RELATORIO_162_PILOTO.md`.

## Como este mapa foi derivado (nunca inventado)

Fonte única: a **Planta canônica do repositório** (`02_Comodos/**`). Para cada artefato, o mapa registra o
endereço que a própria Planta declara, com a evidência (arquivo e linha). Os níveis de evidência são declarados:

| Nível | Evidência | Força |
| :--- | :--- | :--- |
| **1** | seção `## Artefatos` da cápsula do módulo (formato §46.2) ou da NOTA do submódulo | declaração de artefato |
| **2** | linha de tabela do próprio endereço com coluna de submódulo | declaração de artefato com precisão de submódulo |
| **3** | citação do caminho em arquivo **dentro do diretório do endereço** (circuito `.canvas`, cápsula, índice do endereço) | menção qualificada |
| — | nenhuma das anteriores | **NÃO RESOLVIDO** (reportado, não inventado) |

Onde mais de um endereço declara o mesmo artefato, o mapa registra o **primário** (melhor nível; empate
desempatado pelo módulo já declarado no espelho anterior) e lista os **concorrentes** — não é erro de
endereço, é declaração concorrente da própria Planta.

## Resumo

| Situação | Nós |
| :--- | ---: |
| Endereço único derivado (**OK**) | 29 |
| Endereço primário derivado com **endereços concorrentes declarados** | 35 |
| **NÃO RESOLVIDO** (nenhuma declaração na Planta) | 7 |
| **Não é espelho de artefato** (índice derivado) | 1 |
| **Total de nós de `07_Codigo_Leitura/`** | **72** |

**Elemento parado:** 15 dos 72 nós ainda carregam ponteiro para `_SUP_158/C00_Governanca_Estrutural/01_Dominio/modulos/MOD-C00-01_INFRAESTRUTURA_CORE`
(medido nos espelhos de leitura **antes** desta escala). O briefing afirmava 69 de 72 — **não reproduzido**:
a medição deu **15** (14 espelhos de arquivo + o índice antigo). Divergência declarada, não maquiada.

## Tabela completa — 72/72

| # | Nó em `07_Codigo_Leitura/` | Artefato de origem | Endereço canônico (primário) | Nível | Evidência da derivação | Concorrentes | Ponteiro parado (antes) |
| ---: | :--- | :--- | :--- | :---: | :--- | ---: | :---: |
| 1 | `07_Codigo_Leitura/CPM – Compilador de Pontuação Mensal.js.md` | `CPM – Compilador de Pontuação Mensal.js` | `C06_Relatorios/MOD-C06-01_RELATORIOS_OFICIAIS` | 1 | `02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-01_RELATORIOS_OFICIAIS/MOD-C06-01_RELATORIOS_OFICIAIS.md`:60 (secao Artefatos) | 1 | — |
| 2 | `07_Codigo_Leitura/Compatibilidade.js.md` | `Compatibilidade.js` | `C01_Entrada/MOD-C01-01_FORMULARIO_E_MENUS` | 3 | `02_Comodos/C01_Entrada/01_Dominio/modulos/MOD-C01-01_FORMULARIO_E_MENUS/INVENTARIO_MENUS_E_CONTRATO_P3.md` (menção em arquivo do próprio endereço) | — | — |
| 3 | `07_Codigo_Leitura/Compilador PIP.js.md` | `Compilador PIP.js` | `C06_Relatorios/MOD-C06-01_RELATORIOS_OFICIAIS` | 1 | `02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-01_RELATORIOS_OFICIAIS/MOD-C06-01_RELATORIOS_OFICIAIS.md`:60 (secao Artefatos) | 1 | — |
| 4 | `07_Codigo_Leitura/Compilador de Entorpecentes.js.md` | `Compilador de Entorpecentes.js` | `C06_Relatorios/MOD-C06-01_RELATORIOS_OFICIAIS` | 3 | `02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-01_RELATORIOS_OFICIAIS/CIR-MOD-C06-01_RELATORIOS_OFICIAIS.canvas` (menção em arquivo do próprio endereço) | 1 | — |
| 5 | `07_Codigo_Leitura/Compilador_Armas.js.md` | `Compilador_Armas.js` | `C06_Relatorios/MOD-C06-02_MERITO_DE_ARMAS_GXT` | 1 | `02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-02_MERITO_DE_ARMAS_GXT/MOD-C06-02_MERITO_DE_ARMAS_GXT.md`:62 (secao Artefatos) | 2 | — |
| 6 | `07_Codigo_Leitura/Config/Metamodelos.js.md` | `Config/Metamodelos.js` | `C02_Leitura/MOD-C02-01_LEITURA_E_ADAPTACAO` | 3 | `02_Comodos/C02_Leitura/01_Dominio/modulos/MOD-C02-01_LEITURA_E_ADAPTACAO/CIR-MOD-C02-01_LEITURA_E_ADAPTACAO.canvas` (menção em arquivo do próprio endereço) | — | — |
| 7 | `07_Codigo_Leitura/Core/Cabecalhos.js.md` | `Core/Cabecalhos.js` | `C02_Leitura/MOD-C02-01_LEITURA_E_ADAPTACAO` | 1 | `02_Comodos/C02_Leitura/01_Dominio/modulos/MOD-C02-01_LEITURA_E_ADAPTACAO/MOD-C02-01_LEITURA_E_ADAPTACAO.md`:62 (secao Artefatos) | — | SIM |
| 8 | `07_Codigo_Leitura/Core/Config.js.md` | `Core/Config.js` | `C02_Leitura/MOD-C02-01_LEITURA_E_ADAPTACAO` | 3 | `02_Comodos/C02_Leitura/01_Dominio/modulos/MOD-C02-01_LEITURA_E_ADAPTACAO/CIR-MOD-C02-01_LEITURA_E_ADAPTACAO.canvas` (menção em arquivo do próprio endereço) | — | SIM |
| 9 | `07_Codigo_Leitura/Core/Constantes.js.md` | `Core/Constantes.js` | `C01_Entrada/MOD-C01-02_NORMALIZADOR_DE_EFETIVO` | 1 | `02_Comodos/C01_Entrada/01_Dominio/modulos/MOD-C01-02_NORMALIZADOR_DE_EFETIVO/NOTA_DE_RESPONSABILIDADE.md`:20 (secao Artefatos) | 4 | SIM |
| 10 | `07_Codigo_Leitura/Core/Datas.js.md` | `Core/Datas.js` | **NÃO RESOLVIDO** | — | — | — | SIM |
| 11 | `07_Codigo_Leitura/Core/Erros.js.md` | `Core/Erros.js` | **NÃO RESOLVIDO** | — | — | — | SIM |
| 12 | `07_Codigo_Leitura/Core/LeitorPlanilhas.js.md` | `Core/LeitorPlanilhas.js` | `C02_Leitura/MOD-C02-01_LEITURA_E_ADAPTACAO` | 1 | `02_Comodos/C02_Leitura/01_Dominio/modulos/MOD-C02-01_LEITURA_E_ADAPTACAO/MOD-C02-01_LEITURA_E_ADAPTACAO.md`:61 (secao Artefatos) | 3 | — |
| 13 | `07_Codigo_Leitura/Core/Logger.js.md` | `Core/Logger.js` | **NÃO RESOLVIDO** | — | — | — | SIM |
| 14 | `07_Codigo_Leitura/Core/Metricas.js.md` | `Core/Metricas.js` | `C02_Leitura/MOD-C02-01_LEITURA_E_ADAPTACAO` | 1 | `02_Comodos/C02_Leitura/01_Dominio/modulos/MOD-C02-01_LEITURA_E_ADAPTACAO/MOD-C02-01_LEITURA_E_ADAPTACAO.md`:62 (secao Artefatos) | 1 | SIM |
| 15 | `07_Codigo_Leitura/Core/Normalizador.js.md` | `Core/Normalizador.js` | `C02_Leitura/MOD-C02-01_LEITURA_E_ADAPTACAO` | 3 | `02_Comodos/C02_Leitura/01_Dominio/modulos/MOD-C02-01_LEITURA_E_ADAPTACAO/CIR-MOD-C02-01_LEITURA_E_ADAPTACAO.canvas` (menção em arquivo do próprio endereço) | 1 | SIM |
| 16 | `07_Codigo_Leitura/Core/Policiais.js.md` | `Core/Policiais.js` | `C01_Entrada/MOD-C01-01_FORMULARIO_E_MENUS` | 1 | `02_Comodos/C01_Entrada/01_Dominio/modulos/MOD-C01-01_FORMULARIO_E_MENUS/MOD-C01-01_FORMULARIO_E_MENUS.md`:57 (secao Artefatos) | 1 | SIM |
| 17 | `07_Codigo_Leitura/Core/Ranking.js.md` | `Core/Ranking.js` | `C04_Motor/MOD-C04-01_MOTOR_ANALITICO` | 3 | `02_Comodos/C04_Motor/01_Dominio/modulos/MOD-C04-01_MOTOR_ANALITICO/CIR-MOD-C04-01_MOTOR_ANALITICO.canvas` (menção em arquivo do próprio endereço) | — | SIM |
| 18 | `07_Codigo_Leitura/Core/RegrasQualidade.js.md` | `Core/RegrasQualidade.js` | `C05_Guardiao/MOD-C05-01_GUARDIAO_DE_QUALIDADE` | 1 | `02_Comodos/C05_Guardiao/01_Dominio/modulos/MOD-C05-01_GUARDIAO_DE_QUALIDADE/MOD-C05-01_GUARDIAO_DE_QUALIDADE.md`:62 (secao Artefatos) | 3 | SIM |
| 19 | `07_Codigo_Leitura/Core/Utils.js.md` | `Core/Utils.js` | `C01_Entrada/MOD-C01-02_NORMALIZADOR_DE_EFETIVO` | 1 | `02_Comodos/C01_Entrada/01_Dominio/modulos/MOD-C01-02_NORMALIZADOR_DE_EFETIVO/NOTA_DE_RESPONSABILIDADE.md`:20 (secao Artefatos) | 2 | SIM |
| 20 | `07_Codigo_Leitura/Core/Validador.js.md` | `Core/Validador.js` | `C02_Leitura/MOD-C02-01_LEITURA_E_ADAPTACAO` | 3 | `02_Comodos/C02_Leitura/01_Dominio/modulos/MOD-C02-01_LEITURA_E_ADAPTACAO/CIR-MOD-C02-01_LEITURA_E_ADAPTACAO.canvas` (menção em arquivo do próprio endereço) | — | SIM |
| 21 | `07_Codigo_Leitura/Dominio/ARCA/ARCA_COBERTURA.md` | `Dominio/ARCA/ARCA_COBERTURA.md` | `C03_Dominio/MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO/SUB-C03-02-03_COBERTURA_E_LACUNAS` | 2 | `02_Comodos/C03_Dominio/01_Dominio/modulos/MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO/NOTA_DE_RESPONSABILIDADE.md`:26 (tabela de artefatos) | 1 | — |
| 22 | `07_Codigo_Leitura/Dominio/ARCA/ARCA_FONTES.md` | `Dominio/ARCA/ARCA_FONTES.md` | `C03_Dominio/MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO/SUB-C03-02-02_FONTES_E_PROVENIENCIA` | 2 | `02_Comodos/C03_Dominio/01_Dominio/modulos/MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO/NOTA_DE_RESPONSABILIDADE.md`:25 (tabela de artefatos) | 1 | — |
| 23 | `07_Codigo_Leitura/Dominio/ARCA/ARCA_REGRAS_DOMINIO.md` | `Dominio/ARCA/ARCA_REGRAS_DOMINIO.md` | `C03_Dominio/MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO/SUB-C03-02-01_CATALOGO_DE_REGRAS` | 2 | `02_Comodos/C03_Dominio/01_Dominio/modulos/MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO/NOTA_DE_RESPONSABILIDADE.md`:24 (tabela de artefatos) | 2 | — |
| 24 | `07_Codigo_Leitura/Dominio/ARCA/AdaptadorConsultaArca.js.md` | `Dominio/ARCA/AdaptadorConsultaArca.js` | `C03_Dominio/MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO/SUB-C03-02-04_ADAPTADOR_PORTA_DE_CONSULTA` | 2 | `02_Comodos/C03_Dominio/01_Dominio/modulos/MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO/NOTA_DE_RESPONSABILIDADE.md`:27 (tabela de artefatos) | 2 | — |
| 25 | `07_Codigo_Leitura/Dominio/ARCA/arca_regras_dominio.json.md` | `Dominio/ARCA/arca_regras_dominio.json` | `C03_Dominio/MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO/SUB-C03-02-01_CATALOGO_DE_REGRAS` | 2 | `02_Comodos/C03_Dominio/01_Dominio/modulos/MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO/NOTA_DE_RESPONSABILIDADE.md`:23 (tabela de artefatos) | 1 | — |
| 26 | `07_Codigo_Leitura/Dominio/Arma.js.md` | `Dominio/Arma.js` | `C03_Dominio/MOD-C03-01_MODELO_DE_OCORRENCIA` | 3 | `02_Comodos/C03_Dominio/01_Dominio/modulos/MOD-C03-01_MODELO_DE_OCORRENCIA/CIR-MOD-C03-01_MODELO_DE_OCORRENCIA.canvas` (menção em arquivo do próprio endereço) | — | — |
| 27 | `07_Codigo_Leitura/Dominio/Droga.js.md` | `Dominio/Droga.js` | `C03_Dominio/MOD-C03-01_MODELO_DE_OCORRENCIA` | 3 | `02_Comodos/C03_Dominio/01_Dominio/modulos/MOD-C03-01_MODELO_DE_OCORRENCIA/CIR-MOD-C03-01_MODELO_DE_OCORRENCIA.canvas` (menção em arquivo do próprio endereço) | — | — |
| 28 | `07_Codigo_Leitura/Dominio/Equipe.js.md` | `Dominio/Equipe.js` | `C03_Dominio/MOD-C03-01_MODELO_DE_OCORRENCIA` | 3 | `02_Comodos/C03_Dominio/01_Dominio/modulos/MOD-C03-01_MODELO_DE_OCORRENCIA/CIR-MOD-C03-01_MODELO_DE_OCORRENCIA.canvas` (menção em arquivo do próprio endereço) | — | — |
| 29 | `07_Codigo_Leitura/Dominio/Metamodelos.js.md` | `Dominio/Metamodelos.js` | `C02_Leitura/MOD-C02-01_LEITURA_E_ADAPTACAO` | 3 | `02_Comodos/C02_Leitura/01_Dominio/modulos/MOD-C02-01_LEITURA_E_ADAPTACAO/CIR-MOD-C02-01_LEITURA_E_ADAPTACAO.canvas` (menção em arquivo do próprio endereço) | — | — |
| 30 | `07_Codigo_Leitura/Dominio/Ocorrencia.js.md` | `Dominio/Ocorrencia.js` | `C03_Dominio/MOD-C03-01_MODELO_DE_OCORRENCIA` | 3 | `02_Comodos/C03_Dominio/01_Dominio/modulos/MOD-C03-01_MODELO_DE_OCORRENCIA/CIR-MOD-C03-01_MODELO_DE_OCORRENCIA.canvas` (menção em arquivo do próprio endereço) | — | — |
| 31 | `07_Codigo_Leitura/Dominio/OcorrenciaFactory.js.md` | `Dominio/OcorrenciaFactory.js` | `C03_Dominio/MOD-C03-01_MODELO_DE_OCORRENCIA` | 3 | `02_Comodos/C03_Dominio/01_Dominio/modulos/MOD-C03-01_MODELO_DE_OCORRENCIA/CIR-MOD-C03-01_MODELO_DE_OCORRENCIA.canvas` (menção em arquivo do próprio endereço) | — | — |
| 32 | `07_Codigo_Leitura/Dominio/Policial.js.md` | `Dominio/Policial.js` | `C03_Dominio/MOD-C03-01_MODELO_DE_OCORRENCIA` | 3 | `02_Comodos/C03_Dominio/01_Dominio/modulos/MOD-C03-01_MODELO_DE_OCORRENCIA/CIR-MOD-C03-01_MODELO_DE_OCORRENCIA.canvas` (menção em arquivo do próprio endereço) | — | — |
| 33 | `07_Codigo_Leitura/Dominio/RegistroAnalitico.js.md` | `Dominio/RegistroAnalitico.js` | `C04_Motor/MOD-C04-01_MOTOR_ANALITICO` | 1 | `02_Comodos/C04_Motor/01_Dominio/modulos/MOD-C04-01_MOTOR_ANALITICO/MOD-C04-01_MOTOR_ANALITICO.md`:61 (secao Artefatos) | — | — |
| 34 | `07_Codigo_Leitura/Dominio/RegistroCanonico.js.md` | `Dominio/RegistroCanonico.js` | `C03_Dominio/MOD-C03-01_MODELO_DE_OCORRENCIA` | 3 | `02_Comodos/C03_Dominio/01_Dominio/modulos/MOD-C03-01_MODELO_DE_OCORRENCIA/CIR-MOD-C03-01_MODELO_DE_OCORRENCIA.canvas` (menção em arquivo do próprio endereço) | 1 | — |
| 35 | `07_Codigo_Leitura/Dominio/ValueObjects/ChaveOcorrencia.js.md` | `Dominio/ValueObjects/ChaveOcorrencia.js` | `C03_Dominio/MOD-C03-01_MODELO_DE_OCORRENCIA` | 3 | `02_Comodos/C03_Dominio/01_Dominio/modulos/MOD-C03-01_MODELO_DE_OCORRENCIA/CIR-MOD-C03-01_MODELO_DE_OCORRENCIA.canvas` (menção em arquivo do próprio endereço) | — | — |
| 36 | `07_Codigo_Leitura/Drivers/GoogleSheetsDriver.js.md` | `Drivers/GoogleSheetsDriver.js` | `C02_Leitura/MOD-C02-01_LEITURA_E_ADAPTACAO` | 1 | `02_Comodos/C02_Leitura/01_Dominio/modulos/MOD-C02-01_LEITURA_E_ADAPTACAO/MOD-C02-01_LEITURA_E_ADAPTACAO.md`:62 (secao Artefatos) | — | — |
| 37 | `07_Codigo_Leitura/Entrada/DialogComparativo2026.html.md` | `Entrada/DialogComparativo2026.html` | `C06_Relatorios/MOD-C06-01_RELATORIOS_OFICIAIS` | 1 | `02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-01_RELATORIOS_OFICIAIS/MOD-C06-01_RELATORIOS_OFICIAIS.md`:61 (secao Artefatos) | — | — |
| 38 | `07_Codigo_Leitura/Entrada/DialogGxtSelecaoLivre.html.md` | `Entrada/DialogGxtSelecaoLivre.html` | `C06_Relatorios/MOD-C06-02_MERITO_DE_ARMAS_GXT` | 1 | `02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-02_MERITO_DE_ARMAS_GXT/MOD-C06-02_MERITO_DE_ARMAS_GXT.md`:63 (secao Artefatos) | — | — |
| 39 | `07_Codigo_Leitura/Entrada/EntradaManual.js.md` | `Entrada/EntradaManual.js` | `C01_Entrada/MOD-C01-01_FORMULARIO_E_MENUS` | 1 | `02_Comodos/C01_Entrada/01_Dominio/modulos/MOD-C01-01_FORMULARIO_E_MENUS/MOD-C01-01_FORMULARIO_E_MENUS.md`:57 (secao Artefatos) | 3 | — |
| 40 | `07_Codigo_Leitura/Entrada/Formulario.html.md` | `Entrada/Formulario.html` | `C01_Entrada/MOD-C01-01_FORMULARIO_E_MENUS` | 1 | `02_Comodos/C01_Entrada/01_Dominio/modulos/MOD-C01-01_FORMULARIO_E_MENUS/MOD-C01-01_FORMULARIO_E_MENUS.md`:57 (secao Artefatos) | 1 | — |
| 41 | `07_Codigo_Leitura/Entrada/Menu.js.md` | `Entrada/Menu.js` | `C01_Entrada/MOD-C01-01_FORMULARIO_E_MENUS` | 1 | `02_Comodos/C01_Entrada/01_Dominio/modulos/MOD-C01-01_FORMULARIO_E_MENUS/MOD-C01-01_FORMULARIO_E_MENUS.md`:57 (secao Artefatos) | 1 | — |
| 42 | `07_Codigo_Leitura/Features/CentralAnalitica.js.md` | `Features/CentralAnalitica.js` | `C04_Motor/MOD-C04-01_MOTOR_ANALITICO` | 1 | `02_Comodos/C04_Motor/01_Dominio/modulos/MOD-C04-01_MOTOR_ANALITICO/MOD-C04-01_MOTOR_ANALITICO.md`:61 (secao Artefatos) | 2 | — |
| 43 | `07_Codigo_Leitura/Features/CompiladorGxt.js.md` | `Features/CompiladorGxt.js` | `C06_Relatorios/MOD-C06-02_MERITO_DE_ARMAS_GXT` | 3 | `02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-02_MERITO_DE_ARMAS_GXT/CIR-MOD-C06-02_MERITO_DE_ARMAS_GXT.canvas` (menção em arquivo do próprio endereço) | 2 | — |
| 44 | `07_Codigo_Leitura/Features/CompiladorProdutividade.js.md` | `Features/CompiladorProdutividade.js` | `C06_Relatorios/MOD-C06-01_RELATORIOS_OFICIAIS` | 1 | `02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-01_RELATORIOS_OFICIAIS/MOD-C06-01_RELATORIOS_OFICIAIS.md`:59 (secao Artefatos) | 2 | — |
| 45 | `07_Codigo_Leitura/Features/CompiladorProdutividadeV2.js.md` | `Features/CompiladorProdutividadeV2.js` | `C06_Relatorios/MOD-C06-01_RELATORIOS_OFICIAIS` | 1 | `02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-01_RELATORIOS_OFICIAIS/MOD-C06-01_RELATORIOS_OFICIAIS.md`:59 (secao Artefatos) | — | — |
| 46 | `07_Codigo_Leitura/Features/GuardiaoQualidade.js.md` | `Features/GuardiaoQualidade.js` | `C05_Guardiao/MOD-C05-01_GUARDIAO_DE_QUALIDADE` | 1 | `02_Comodos/C05_Guardiao/01_Dominio/modulos/MOD-C05-01_GUARDIAO_DE_QUALIDADE/MOD-C05-01_GUARDIAO_DE_QUALIDADE.md`:62 (secao Artefatos) | 2 | — |
| 47 | `07_Codigo_Leitura/Features/NormalizadorEfetivo.js.md` | `Features/NormalizadorEfetivo.js` | `C01_Entrada/MOD-C01-02_NORMALIZADOR_DE_EFETIVO` | 1 | `02_Comodos/C01_Entrada/01_Dominio/modulos/MOD-C01-02_NORMALIZADOR_DE_EFETIVO/NOTA_DE_RESPONSABILIDADE.md`:18 (secao Artefatos) | 3 | — |
| 48 | `07_Codigo_Leitura/INDICE_AS_IS.md` | `— (índice)` | **NÃO RESOLVIDO** | — | — | — | SIM |
| 49 | `07_Codigo_Leitura/Leitura/Adaptador2026.js.md` | `Leitura/Adaptador2026.js` | `C02_Leitura/MOD-C02-01_LEITURA_E_ADAPTACAO` | 1 | `02_Comodos/C02_Leitura/01_Dominio/modulos/MOD-C02-01_LEITURA_E_ADAPTACAO/MOD-C02-01_LEITURA_E_ADAPTACAO.md`:61 (secao Artefatos) | — | — |
| 50 | `07_Codigo_Leitura/Leitura/LeitorAntiguidadePeculio.js.md` | `Leitura/LeitorAntiguidadePeculio.js` | `C02_Leitura/MOD-C02-01_LEITURA_E_ADAPTACAO` | 1 | `02_Comodos/C02_Leitura/01_Dominio/modulos/MOD-C02-01_LEITURA_E_ADAPTACAO/MOD-C02-01_LEITURA_E_ADAPTACAO.md`:61 (secao Artefatos) | 1 | — |
| 51 | `07_Codigo_Leitura/Modelos/IRelatorioModelo.js.md` | `Modelos/IRelatorioModelo.js` | **NÃO RESOLVIDO** | — | — | — | — |
| 52 | `07_Codigo_Leitura/Modelos/ModeloProdutividade.js.md` | `Modelos/ModeloProdutividade.js` | `C06_Relatorios/MOD-C06-01_RELATORIOS_OFICIAIS` | 3 | `02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-01_RELATORIOS_OFICIAIS/CIR-MOD-C06-01_RELATORIOS_OFICIAIS.canvas` (menção em arquivo do próprio endereço) | 1 | — |
| 53 | `07_Codigo_Leitura/Motor/DiagnosticoDeterministicoGxt.js.md` | `Motor/DiagnosticoDeterministicoGxt.js` | `C04_Motor/MOD-C04-01_MOTOR_ANALITICO` | 1 | `02_Comodos/C04_Motor/01_Dominio/modulos/MOD-C04-01_MOTOR_ANALITICO/MOD-C04-01_MOTOR_ANALITICO.md`:59 (secao Artefatos) | 1 | — |
| 54 | `07_Codigo_Leitura/Motor/MotorAnaliticoV2.js.md` | `Motor/MotorAnaliticoV2.js` | `C04_Motor/MOD-C04-01_MOTOR_ANALITICO` | 1 | `02_Comodos/C04_Motor/01_Dominio/modulos/MOD-C04-01_MOTOR_ANALITICO/MOD-C04-01_MOTOR_ANALITICO.md`:59 (secao Artefatos) | — | — |
| 55 | `07_Codigo_Leitura/Motor/PoliticaMeritoArmas.js.md` | `Motor/PoliticaMeritoArmas.js` | `C04_Motor/MOD-C04-01_MOTOR_ANALITICO` | 1 | `02_Comodos/C04_Motor/01_Dominio/modulos/MOD-C04-01_MOTOR_ANALITICO/MOD-C04-01_MOTOR_ANALITICO.md`:59 (secao Artefatos) | 2 | — |
| 56 | `07_Codigo_Leitura/Plugins/IPluginMetrica.js.md` | `Plugins/IPluginMetrica.js` | **NÃO RESOLVIDO** | — | — | — | — |
| 57 | `07_Codigo_Leitura/Plugins/Metricas/PluginArmas.js.md` | `Plugins/Metricas/PluginArmas.js` | `C04_Motor/MOD-C04-01_MOTOR_ANALITICO` | 1 | `02_Comodos/C04_Motor/01_Dominio/modulos/MOD-C04-01_MOTOR_ANALITICO/MOD-C04-01_MOTOR_ANALITICO.md`:60 (secao Artefatos) | — | — |
| 58 | `07_Codigo_Leitura/Plugins/Metricas/PluginEntorpecentes.js.md` | `Plugins/Metricas/PluginEntorpecentes.js` | `C04_Motor/MOD-C04-01_MOTOR_ANALITICO` | 1 | `02_Comodos/C04_Motor/01_Dominio/modulos/MOD-C04-01_MOTOR_ANALITICO/MOD-C04-01_MOTOR_ANALITICO.md`:60 (secao Artefatos) | — | — |
| 59 | `07_Codigo_Leitura/Plugins/Metricas/PluginOcorrencias.js.md` | `Plugins/Metricas/PluginOcorrencias.js` | `C04_Motor/MOD-C04-01_MOTOR_ANALITICO` | 1 | `02_Comodos/C04_Motor/01_Dominio/modulos/MOD-C04-01_MOTOR_ANALITICO/MOD-C04-01_MOTOR_ANALITICO.md`:60 (secao Artefatos) | — | — |
| 60 | `07_Codigo_Leitura/Plugins/Metricas/PluginPontuacao.js.md` | `Plugins/Metricas/PluginPontuacao.js` | `C04_Motor/MOD-C04-01_MOTOR_ANALITICO` | 1 | `02_Comodos/C04_Motor/01_Dominio/modulos/MOD-C04-01_MOTOR_ANALITICO/MOD-C04-01_MOTOR_ANALITICO.md`:60 (secao Artefatos) | 1 | — |
| 61 | `07_Codigo_Leitura/Plugins/Metricas/PluginPrisoes.js.md` | `Plugins/Metricas/PluginPrisoes.js` | `C04_Motor/MOD-C04-01_MOTOR_ANALITICO` | 1 | `02_Comodos/C04_Motor/01_Dominio/modulos/MOD-C04-01_MOTOR_ANALITICO/MOD-C04-01_MOTOR_ANALITICO.md`:61 (secao Artefatos) | — | — |
| 62 | `07_Codigo_Leitura/Render/DocumentoLogico.js.md` | `Render/DocumentoLogico.js` | `C06_Relatorios/MOD-C06-01_RELATORIOS_OFICIAIS` | 3 | `02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-01_RELATORIOS_OFICIAIS/CIR-MOD-C06-01_RELATORIOS_OFICIAIS.canvas` (menção em arquivo do próprio endereço) | — | — |
| 63 | `07_Codigo_Leitura/Render/RendererAuditoria.js.md` | `Render/RendererAuditoria.js` | `C05_Guardiao/MOD-C05-01_GUARDIAO_DE_QUALIDADE` | 1 | `02_Comodos/C05_Guardiao/01_Dominio/modulos/MOD-C05-01_GUARDIAO_DE_QUALIDADE/MOD-C05-01_GUARDIAO_DE_QUALIDADE.md`:63 (secao Artefatos) | 1 | — |
| 64 | `07_Codigo_Leitura/Render/RendererAuditoriaSaude.js.md` | `Render/RendererAuditoriaSaude.js` | `C05_Guardiao/MOD-C05-01_GUARDIAO_DE_QUALIDADE` | 1 | `02_Comodos/C05_Guardiao/01_Dominio/modulos/MOD-C05-01_GUARDIAO_DE_QUALIDADE/MOD-C05-01_GUARDIAO_DE_QUALIDADE.md`:64 (secao Artefatos) | 1 | — |
| 65 | `07_Codigo_Leitura/Render/RendererCA.js.md` | `Render/RendererCA.js` | `C06_Relatorios/MOD-C06-01_RELATORIOS_OFICIAIS` | 1 | `02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-01_RELATORIOS_OFICIAIS/MOD-C06-01_RELATORIOS_OFICIAIS.md`:61 (secao Artefatos) | — | — |
| 66 | `07_Codigo_Leitura/Render/RendererComparativo2026.js.md` | `Render/RendererComparativo2026.js` | `C06_Relatorios/MOD-C06-01_RELATORIOS_OFICIAIS` | 1 | `02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-01_RELATORIOS_OFICIAIS/MOD-C06-01_RELATORIOS_OFICIAIS.md`:60 (secao Artefatos) | 1 | — |
| 67 | `07_Codigo_Leitura/Render/RendererGxt.js.md` | `Render/RendererGxt.js` | `C06_Relatorios/MOD-C06-02_MERITO_DE_ARMAS_GXT` | 3 | `02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-02_MERITO_DE_ARMAS_GXT/CIR-MOD-C06-02_MERITO_DE_ARMAS_GXT.canvas` (menção em arquivo do próprio endereço) | — | — |
| 68 | `07_Codigo_Leitura/Render/RendererLogico.js.md` | `Render/RendererLogico.js` | `C06_Relatorios/MOD-C06-01_RELATORIOS_OFICIAIS` | 3 | `02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-01_RELATORIOS_OFICIAIS/CIR-MOD-C06-01_RELATORIOS_OFICIAIS.canvas` (menção em arquivo do próprio endereço) | 1 | — |
| 69 | `07_Codigo_Leitura/Render/RendererTabela.js.md` | `Render/RendererTabela.js` | `C06_Relatorios/MOD-C06-01_RELATORIOS_OFICIAIS` | 3 | `02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-01_RELATORIOS_OFICIAIS/CIR-MOD-C06-01_RELATORIOS_OFICIAIS.canvas` (menção em arquivo do próprio endereço) | — | — |
| 70 | `07_Codigo_Leitura/Schemas/ProdutividadeSchema.js.md` | `Schemas/ProdutividadeSchema.js` | **NÃO RESOLVIDO** | — | — | — | — |
| 71 | `07_Codigo_Leitura/Temas/TemaPMPE.js.md` | `Temas/TemaPMPE.js` | `C06_Relatorios/MOD-C06-01_RELATORIOS_OFICIAIS` | 3 | `02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-01_RELATORIOS_OFICIAIS/CIR-MOD-C06-01_RELATORIOS_OFICIAIS.canvas` (menção em arquivo do próprio endereço) | 1 | — |
| 72 | `07_Codigo_Leitura/appsscript.json.md` | `appsscript.json` | **NÃO RESOLVIDO** | — | — | — | SIM |

## Endereços concorrentes (declarados, não resolvidos por decreto)

| Artefato | Endereço primário | Concorrentes |
| :--- | :--- | :--- |
| `CPM – Compilador de Pontuação Mensal.js` | `C06_Relatorios/MOD-C06-01_RELATORIOS_OFICIAIS` | `C01_Entrada/MOD-C01-01_FORMULARIO_E_MENUS` |
| `Compilador PIP.js` | `C06_Relatorios/MOD-C06-01_RELATORIOS_OFICIAIS` | `C01_Entrada/MOD-C01-01_FORMULARIO_E_MENUS` |
| `Compilador de Entorpecentes.js` | `C06_Relatorios/MOD-C06-01_RELATORIOS_OFICIAIS` | `C01_Entrada/MOD-C01-01_FORMULARIO_E_MENUS` |
| `Compilador_Armas.js` | `C06_Relatorios/MOD-C06-02_MERITO_DE_ARMAS_GXT` | `C01_Entrada/MOD-C01-01_FORMULARIO_E_MENUS`, `C06_Relatorios/MOD-C06-01_RELATORIOS_OFICIAIS` |
| `Core/Constantes.js` | `C01_Entrada/MOD-C01-02_NORMALIZADOR_DE_EFETIVO` | `C01_Entrada/MOD-C01-01_FORMULARIO_E_MENUS`, `C02_Leitura/MOD-C02-01_LEITURA_E_ADAPTACAO`, `C03_Dominio/MOD-C03-01_MODELO_DE_OCORRENCIA`, `C04_Motor/MOD-C04-01_MOTOR_ANALITICO` |
| `Core/LeitorPlanilhas.js` | `C02_Leitura/MOD-C02-01_LEITURA_E_ADAPTACAO` | `C03_Dominio/MOD-C03-01_MODELO_DE_OCORRENCIA`, `C04_Motor/MOD-C04-01_MOTOR_ANALITICO`, `C06_Relatorios/MOD-C06-01_RELATORIOS_OFICIAIS` |
| `Core/Metricas.js` | `C02_Leitura/MOD-C02-01_LEITURA_E_ADAPTACAO` | `C04_Motor/MOD-C04-01_MOTOR_ANALITICO` |
| `Core/Normalizador.js` | `C02_Leitura/MOD-C02-01_LEITURA_E_ADAPTACAO` | `C05_Guardiao/MOD-C05-02_NORMALIZADOR_DE_ABA` |
| `Core/Policiais.js` | `C01_Entrada/MOD-C01-01_FORMULARIO_E_MENUS` | `C02_Leitura/MOD-C02-01_LEITURA_E_ADAPTACAO` |
| `Core/RegrasQualidade.js` | `C05_Guardiao/MOD-C05-01_GUARDIAO_DE_QUALIDADE` | `C01_Entrada/MOD-C01-01_FORMULARIO_E_MENUS/SUB-C01-01-01_OCR_E_CONFERENCIA`, `C03_Dominio/MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO`, `C04_Motor/MOD-C04-01_MOTOR_ANALITICO` |
| `Core/Utils.js` | `C01_Entrada/MOD-C01-02_NORMALIZADOR_DE_EFETIVO` | `C01_Entrada/MOD-C01-01_FORMULARIO_E_MENUS/SUB-C01-01-01_OCR_E_CONFERENCIA`, `C02_Leitura/MOD-C02-01_LEITURA_E_ADAPTACAO` |
| `Dominio/ARCA/ARCA_COBERTURA.md` | `C03_Dominio/MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO/SUB-C03-02-03_COBERTURA_E_LACUNAS` | `C03_Dominio/MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO` |
| `Dominio/ARCA/ARCA_FONTES.md` | `C03_Dominio/MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO/SUB-C03-02-02_FONTES_E_PROVENIENCIA` | `C03_Dominio/MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO` |
| `Dominio/ARCA/ARCA_REGRAS_DOMINIO.md` | `C03_Dominio/MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO/SUB-C03-02-01_CATALOGO_DE_REGRAS` | `C01_Entrada/MOD-C01-01_FORMULARIO_E_MENUS/SUB-C01-01-01_OCR_E_CONFERENCIA`, `C03_Dominio/MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO` |
| `Dominio/ARCA/AdaptadorConsultaArca.js` | `C03_Dominio/MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO/SUB-C03-02-04_ADAPTADOR_PORTA_DE_CONSULTA` | `C03_Dominio/MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO`, `C05_Guardiao/MOD-C05-01_GUARDIAO_DE_QUALIDADE` |
| `Dominio/ARCA/arca_regras_dominio.json` | `C03_Dominio/MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO/SUB-C03-02-01_CATALOGO_DE_REGRAS` | `C03_Dominio/MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO` |
| `Dominio/RegistroCanonico.js` | `C03_Dominio/MOD-C03-01_MODELO_DE_OCORRENCIA` | `C02_Leitura/MOD-C02-01_LEITURA_E_ADAPTACAO` |
| `Entrada/EntradaManual.js` | `C01_Entrada/MOD-C01-01_FORMULARIO_E_MENUS` | `C01_Entrada/MOD-C01-01_FORMULARIO_E_MENUS/SUB-C01-01-01_OCR_E_CONFERENCIA`, `C01_Entrada/MOD-C01-01_FORMULARIO_E_MENUS/SUB-C01-01-02_PERSISTENCIA_MANUAL`, `C03_Dominio/MOD-C03-01_MODELO_DE_OCORRENCIA` |
| `Entrada/Formulario.html` | `C01_Entrada/MOD-C01-01_FORMULARIO_E_MENUS` | `C01_Entrada/MOD-C01-01_FORMULARIO_E_MENUS/SUB-C01-01-01_OCR_E_CONFERENCIA` |
| `Entrada/Menu.js` | `C01_Entrada/MOD-C01-01_FORMULARIO_E_MENUS` | `C01_Entrada/MOD-C01-02_NORMALIZADOR_DE_EFETIVO` |
| `Features/CentralAnalitica.js` | `C04_Motor/MOD-C04-01_MOTOR_ANALITICO` | `C01_Entrada/MOD-C01-01_FORMULARIO_E_MENUS`, `C06_Relatorios/MOD-C06-01_RELATORIOS_OFICIAIS` |
| `Features/CompiladorGxt.js` | `C06_Relatorios/MOD-C06-02_MERITO_DE_ARMAS_GXT` | `C01_Entrada/MOD-C01-01_FORMULARIO_E_MENUS`, `C03_Dominio/MOD-C03-01_MODELO_DE_OCORRENCIA` |
| `Features/CompiladorProdutividade.js` | `C06_Relatorios/MOD-C06-01_RELATORIOS_OFICIAIS` | `C01_Entrada/MOD-C01-01_FORMULARIO_E_MENUS`, `C01_Entrada/MOD-C01-01_FORMULARIO_E_MENUS/SUB-C01-01-01_OCR_E_CONFERENCIA` |
| `Features/GuardiaoQualidade.js` | `C05_Guardiao/MOD-C05-01_GUARDIAO_DE_QUALIDADE` | `C01_Entrada/MOD-C01-01_FORMULARIO_E_MENUS`, `C03_Dominio/MOD-C03-01_MODELO_DE_OCORRENCIA` |
| `Features/NormalizadorEfetivo.js` | `C01_Entrada/MOD-C01-02_NORMALIZADOR_DE_EFETIVO` | `C01_Entrada/MOD-C01-01_FORMULARIO_E_MENUS`, `C01_Entrada/MOD-C01-01_FORMULARIO_E_MENUS/SUB-C01-01-01_OCR_E_CONFERENCIA`, `C08_Homologacao/MOD-C08-01_HOMOLOGACAO_OFFLINE` |
| `Leitura/LeitorAntiguidadePeculio.js` | `C02_Leitura/MOD-C02-01_LEITURA_E_ADAPTACAO` | `C04_Motor/MOD-C04-01_MOTOR_ANALITICO` |
| `Modelos/ModeloProdutividade.js` | `C06_Relatorios/MOD-C06-01_RELATORIOS_OFICIAIS` | `C04_Motor/MOD-C04-01_MOTOR_ANALITICO` |
| `Motor/DiagnosticoDeterministicoGxt.js` | `C04_Motor/MOD-C04-01_MOTOR_ANALITICO` | `C06_Relatorios/MOD-C06-02_MERITO_DE_ARMAS_GXT` |
| `Motor/PoliticaMeritoArmas.js` | `C04_Motor/MOD-C04-01_MOTOR_ANALITICO` | `C06_Relatorios/MOD-C06-02_MERITO_DE_ARMAS_GXT`, `C03_Dominio/MOD-C03-01_MODELO_DE_OCORRENCIA` |
| `Plugins/Metricas/PluginPontuacao.js` | `C04_Motor/MOD-C04-01_MOTOR_ANALITICO` | `C01_Entrada/MOD-C01-01_FORMULARIO_E_MENUS/SUB-C01-01-01_OCR_E_CONFERENCIA` |
| `Render/RendererAuditoria.js` | `C05_Guardiao/MOD-C05-01_GUARDIAO_DE_QUALIDADE` | `C06_Relatorios/MOD-C06-01_RELATORIOS_OFICIAIS` |
| `Render/RendererAuditoriaSaude.js` | `C05_Guardiao/MOD-C05-01_GUARDIAO_DE_QUALIDADE` | `C06_Relatorios/MOD-C06-01_RELATORIOS_OFICIAIS` |
| `Render/RendererComparativo2026.js` | `C06_Relatorios/MOD-C06-01_RELATORIOS_OFICIAIS` | `C06_Relatorios/MOD-C06-02_MERITO_DE_ARMAS_GXT` |
| `Render/RendererLogico.js` | `C06_Relatorios/MOD-C06-01_RELATORIOS_OFICIAIS` | `C04_Motor/MOD-C04-01_MOTOR_ANALITICO` |
| `Temas/TemaPMPE.js` | `C06_Relatorios/MOD-C06-01_RELATORIOS_OFICIAIS` | `C04_Motor/MOD-C04-01_MOTOR_ANALITICO` |

## NÃO RESOLVIDOS — reportados, jamais inventados

| Artefato | Por que não resolve | Ponteiro antigo |
| :--- | :--- | :--- |
| `Core/Datas.js` | varredura completa de `02_Comodos` (seções `## Artefatos`, tabelas de artefatos e menções em arquivo do diretório do endereço) não encontra declaração deste artefato em nenhum endereço | `_SUP_158/…/MOD-C00-01_INFRAESTRUTURA_CORE` (elemento PARADO) |
| `Core/Erros.js` | varredura completa de `02_Comodos` (seções `## Artefatos`, tabelas de artefatos e menções em arquivo do diretório do endereço) não encontra declaração deste artefato em nenhum endereço | `_SUP_158/…/MOD-C00-01_INFRAESTRUTURA_CORE` (elemento PARADO) |
| `Core/Logger.js` | varredura completa de `02_Comodos` (seções `## Artefatos`, tabelas de artefatos e menções em arquivo do diretório do endereço) não encontra declaração deste artefato em nenhum endereço | `_SUP_158/…/MOD-C00-01_INFRAESTRUTURA_CORE` (elemento PARADO) |
| `Modelos/IRelatorioModelo.js` | varredura completa de `02_Comodos` (seções `## Artefatos`, tabelas de artefatos e menções em arquivo do diretório do endereço) não encontra declaração deste artefato em nenhum endereço | nenhum endereço utilizável |
| `Plugins/IPluginMetrica.js` | varredura completa de `02_Comodos` (seções `## Artefatos`, tabelas de artefatos e menções em arquivo do diretório do endereço) não encontra declaração deste artefato em nenhum endereço | nenhum endereço utilizável |
| `Schemas/ProdutividadeSchema.js` | varredura completa de `02_Comodos` (seções `## Artefatos`, tabelas de artefatos e menções em arquivo do diretório do endereço) não encontra declaração deste artefato em nenhum endereço | nenhum endereço utilizável |
| `appsscript.json` | varredura completa de `02_Comodos` (seções `## Artefatos`, tabelas de artefatos e menções em arquivo do diretório do endereço) não encontra declaração deste artefato em nenhum endereço | `_SUP_158/…/MOD-C00-01_INFRAESTRUTURA_CORE` (elemento PARADO) |

Nestes casos o espelho foi **materializado com o campo "Endereço Down Plant" declarando `NÃO RESOLVIDO`** e a
justificativa — os testes T1/T2 entram como **ACHADO**, nunca como OK. Isso é a decisão (b) do método:
reportar. Não houve tentativa de "adivinhar" um módulo próximo.

## Deriva pré-existente medida nos espelhos de leitura (antes desta escala)

Medição feita na geração dos espelhos (§46.15, teste T5), comparando o bloco de código embutido no espelho
antigo com o arquivo de origem real. É a evidência de que o formato antigo mentia sem avisar:

| Artefato | Linhas embutidas (antigo) | Linhas na origem | Veredito |
| :--- | ---: | ---: | :--- |

---

**Arquivos gerados por este mapa:** espelhos em `07_Codigo_Leitura/` (repo, canônicos) e no vault (derivados).
Regeneração: `node scripts/downplant/espelho-rico.mjs gerar --endereco <endereço> --origem <artefato> --saida <destino>`.
