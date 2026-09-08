# SUB-C01-01-01_OCR_E_CONFERENCIA

## Responsabilidade Canônica
Este submódulo é responsável pela extração in-browser de dados do Boletim de Ocorrência (BO/OCR) via Tesseract.js / PDF.js e pela interface assistiva e não bloqueante de conferência do operador no formulário HTML.

## Fluxo Factual da Interface
```text
BO/OCR -> sugestão de natureza -> operador (escolhe ou digita) -> tentativa de salvar
```

## Diretrizes de Comportamento
1. **Assistência Não Bloqueante:** A lista de naturezas obtida da aba mensal atua estritamente como orientação/sugestão (`<datalist>`). A ausência ou falha de carregamento de sugestões nunca desabilita o formulário nem bloqueia a digitação do operador.
2. **Preservação de Dados:** O texto extraído pelo OCR permanece no campo para conferência e edição humana. Se houver correspondência exata por normalização com uma das sugestões, adota-se a grafia canônica; caso contrário, o texto original é preservado.
3. **Porta de Persistência Inalterada:** A interface realiza validação local prévia apenas de preenchimento de `DATA` e `NATUREZA`. A fronteira de validação semântica e gravação segura continua sendo exercida exclusivamente pelo backend (`Entrada/EntradaManual.js`) e pelas validações da planilha. Nenhuma Porta de persistência foi alterada nesta fatia.

---

## Contrato Factual e Operacional: Seção Dados do Fato (Card #56 - T-C01-DADOS-FATO-002)

| CAMPO | ORIGEM OCR / MANUAL | REGRA DE NEGÓCIO / PERSISTÊNCIA | NORMALIZAÇÃO | VALIDAÇÃO | OBRIGATÓRIO? | DESTINO FÍSICO SHEETS |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **DATA** | OCR (regex data) ou Manual | Gravado em todas as linhas da ocorrência. Determina a aba mensal de destino via `localizarAbaMensalTratada()`. | `DD/MM/AAAA` (regex `\d{2}/\d{2}/\d{4}`) | Regex de data válida + bloqueio se aba mensal correspondente não existir na planilha. | **SIM** (Bloqueante no cliente e servidor) | **Coluna B** (todas as linhas) |
| **HORA** | OCR (regex hora) ou Manual | Gravado em todas as linhas da ocorrência. Registro temporal do fato. | `HH:MM` ou `HH:MM:SS` (formato 24h) | Formato de horário válido. Não bloqueia gravação se vazio, mas alertado. | **NÃO** (Recomendado) | **Coluna C** (todas as linhas) |
| **QTD O** | Manual (Default `"1"`) | Gravado **exclusivamente na primeira linha** (`idx === 0`). Nas linhas filhas grava `""` para evitar inflação métrica. | Numérico inteiro string (`"1"`, `"2"`, etc.) | Inteiro positivo. Default `"1"` se omitido. | **NÃO** (Default automático `"1"`) | **Coluna D** (apenas 1ª linha) |
| **MIKE** | OCR (regex código Mike) ou Manual | Gravado em todas as linhas. Chave identificadora única anti-duplicidade da viatura/ocorrência. | Dígitos numéricos limpos (apenas números). | Anti-duplicidade em Coluna E da aba mensal via `verificarDuplicidadeOcorrencia()`. | **NÃO** (Mas obrigatório se BOE ausente) | **Coluna E** (todas as linhas) |
| **NATUREZA** | OCR (regex assistivo) ou Datalist | Gravado em todas as linhas. Datalist assistivo derivado da validação da linha 2 da coluna F da planilha. | String em caixa alta (uppercase), trim, sem pontuação espúria. | Validação assistiva via DataValidation da planilha (`VALUE_IN_LIST`). Se não casar, permite digitação livre do operador (não bloqueante). | **SIM** (Bloqueante no cliente e servidor) | **Coluna F** (todas as linhas) |
| **BOE** | OCR (regex BOE) ou Manual | Gravado em todas as linhas. Chave identificadora oficial anti-duplicidade do Boletim de Ocorrência. | Padrão `\d{2}E\d+` (ex: `24E123456`) ou numérico formatado. | Anti-duplicidade em Coluna G da aba mensal via `verificarDuplicidadeOcorrencia()`. | **NÃO** (Mas obrigatório se MIKE ausente) | **Coluna G** (todas as linhas) |
| **AIS** | Auto-determinado por Cidade/Bairro ou Manual | Gravado **exclusivamente na primeira linha** (`idx === 0`). Determinado reativamente pela cartografia oficial (190 municípios / 97 bairros multi-AIS). | Numérico inteiro string (`"1"` a `"26"`). | De 1 a 26. Em municípios multi-AIS (Recife 1-5), requer bairro para resolução; se indefinido, exige conferência do operador. Soberania humana preservada. | **NÃO** (Pode ficar pendente de conferência) | **Coluna H** (apenas 1ª linha) |
| **CIDADE** | OCR (contextual) ou Manual | Gravado **exclusivamente na primeira linha** (`idx === 0`). Município do fato, base para auto-determinação de AIS. | Caixa alta (uppercase), trim, normalização sem acentos para indexação territorial. | Comparação contra lista oficial de 190 municípios de Pernambuco. | **NÃO** (Opcional, mas chave para AIS) | **Coluna I** (apenas 1ª linha) |
| **BAIRRO** | OCR (contextual) ou Manual | Gravado **exclusivamente na primeira linha** (`idx === 0`). Bairro do fato, desambigua AIS em municípios multi-AIS (Recife). | Caixa alta (uppercase), trim, normalização sem acentos para indexação. | Comparação contra lista de 97 bairros canônicos em municípios multi-AIS. | **NÃO** (Mandatório apenas para auto-AIS em Recife) | **Coluna J** (apenas 1ª linha) |
| **DETIDOS** | Manual ou OCR | Gravado **exclusivamente na primeira linha** (`idx === 0`). Quantidade de pessoas detidas/apreendidas na ocorrência. | Numérico inteiro string (`"0"`, `"1"`, etc.). | Inteiro >= 0. | **NÃO** (Opcional) | **Coluna K** (apenas 1ª linha) |

### Efeito Colateral Factual: Detidos -> Imputado (Coluna AH)
Conforme comprovado no código fonte de `Entrada/EntradaManual.js` (linhas 184–188):
- Se o operador não definir explicitamente o campo `imputado`, a presença de `detidos > 0` infere automaticamente `"COM IMPUTADO"`; caso contrário, infere `"SEM IMPUTADO"`.
- O valor resultante é gravado na **Coluna AH** (`OCORRÊNCIA PIP / IMPUTADO?`) na primeira linha da ocorrência (ou nas linhas filhas onde houver evento PIP associado).

---

## Circuito Factual e Operacional: OCR e Conferência (Card #60 - T-C01-OCR-CONFERENCIA-003)

### Circuito Canônico
```text
DOCUMENTO -> OCR_RAW -> EXTRAÇÃO -> PREFILL -> CONFERÊNCIA -> PAYLOAD
```

1. **DOCUMENTO (Upload / Drop):**
   - Suporte a PDF e imagens (PNG, JPG, etc.) via drop zone ou seletor de arquivo no painel esquerdo.
   - Prevenção ativa de drag&drop espúrio na janela do navegador.

2. **OCR_RAW (Motor 100% In-Browser):**
   - PDFs processados via PDF.js (`pdfjsLib.getDocument`). Se contiver texto digital nativo (> 30 caracteres), extrai diretamente; caso contrário, renderiza a página em `<canvas>` com escala 2.0 para leitura óptica.
   - Imagens e canvas processados localmente via Tesseract.js (`Tesseract.createWorker('por')`).
   - O texto bruto consolidado é exibido no terminal/console visual da interface.
   - **Zero tráfego de documentos para o backend:** Nenhum arquivo ou imagem é enviado ao servidor.

3. **EXTRAÇÃO (Heurísticas Determinísticas na UI):**
   - `parseAndFill(text, ocrId)` extrai campos por regex especializadas:
     - `DATA` e `HORA` do fato;
     - `MIKE` (número do BO PM) e `BOE` (padrão `\d{2}E\d+`);
     - `CIDADE` e `BAIRRO` (contextual);
     - `NATUREZA` da ocorrência (assistiva com validação cruzada com a planilha);
     - `ARMAS` e `DROGAS` apreendidas;
     - `EQUIPE` (policiais por matrícula/nome);
     - `TITULOS PIP` (conciliação por regras de negócio);
     - `IMPUTADO` (inferência por detidos > 0 ou termos flagrante/preso).

4. **PREFILL (Preenchimento Assistivo):**
   - Popula reativamente os inputs da interface.
   - Desencadeia o cálculo territorial de AIS (`atualizarAisPorLocalizacao()`).
   - Município mono-AIS preenche AIS diretamente; município multi-AIS (Recife) preenche se o bairro for reconhecido. Se o bairro for ambíguo ou ausente, mantém o campo vazio com status visual `Pendente de conferência`.

5. **CONFERÊNCIA (`ocrConferenceCard`):**
   - Card visual exibido após o processamento do OCR.
   - Apresenta resumo estruturado em grid: Data/Hora, Mike/Boe, Cidade/Bairro, AIS Prevista, Equipe Detectada e status da Natureza.
   - Permite ao operador humano auditar visualmente a fidelidade da extração.

6. **PAYLOAD (Convergência e Soberania do Operador):**
   - **Soberania Manual:** Todos os campos permanecem livres para edição, correção ou exclusão humana. A digitação do operador sobrepõe o OCR.
   - **Proteção Assíncrona:** A variável de controle `execucaoOcrId` invalida callbacks de OCR tardios, impedindo que uma extração demorada sobrescreva alterações do operador.
   - **Zero Escrita Direta do OCR no Sheets:** O OCR não tem permissão nem capacidade de gravar na planilha.
   - **Porta Canônica Única:** A persistência ocorre exclusivamente no clique do botão "Salvar", que valida os campos obrigatórios e despacha o payload uniforme para `processarEntradaManual(payload)` em `Entrada/EntradaManual.js`.

---

## Contrato Factual e Operacional: Equipe e Policiais (Card #61 - T-C01-EQUIPE-004)

### Circuito Canônico
```text
MATRÍCULA/OCR -> RESOLUÇÃO DO POLICIAL -> LISTA DA EQUIPE -> ORDENAÇÃO/EDIÇÃO -> PAYLOAD -> SHEETS
```

1. **Campo de Matrícula e Inclusão Manual:**
   - Input `#policeInput` no formulário HTML com botão `+ Adicionar` (e gatilho por tecla `Enter`).
   - Normalização estrita: apenas dígitos (`/^\d+$/`). Rejeita caracteres alfanuméricos ou especiais.
   - Verificação anti-duplicidade em memória via `policiaisSet.has(mat)`. Emite alerta visual e não duplica se já constar na lista.

2. **Inclusão via OCR:**
   - Heurística determinística de regex `/Matr[íi]cula[:\s]+(\d{5,8})/gi` aplicada ao texto do BO.
   - Extrai matrículas únicas (`new Set(...)`).
   - Insere na lista da equipe apenas matrículas ainda não adicionadas (`!policiaisSet.has(m)`).

3. **Resolução do Policial (`getEfetivo`):**
   - Função de backend `getEfetivo()` em `Entrada/EntradaManual.js` lê a aba `EFETIVO` da planilha (colunas Nome de guerra, Posto/Graduação, Matrícula, Pelotão).
   - O formulário consome via `google.script.run.getEfetivo()` e indexa em `efetivoPorMat`.
   - Se o efetivo for retornado de forma assíncrona após o OCR ter adicionado as linhas, o formulário atualiza dinamicamente os textos das linhas já existentes em tela (`tr[data-mat]`).

4. **Remoção e Reordenação (Drag&Drop):**
   - Remoção: botão `&times;` aciona `removerPolicial(mat)`, retirando do `policiaisSet`, eliminando o nó do DOM e restaurando mensagem informativa se a tabela ficar vazia.
   - Reordenação: linhas com classe `police-draggable` e suporte a Drag&Drop HTML5 (`dragstart`, `dragover`, `drop`). Permite ao operador reordenar visualmente a ordem de precedência da equipe.

5. **Quantidade de Armas por Policial (`qtd_armas`):**
   - Campo numérico `.qtd-armas-policial` por policial, inicializado com a contagem total de armas da ocorrência e editável pelo operador humano.

6. **Estrutura do Payload e Destino Físico Sheets (Colunas AB a AF):**
   - Ao salvar (`salvarDados`), a lista de policiais é lida na ordem visual exata do DOM:
     `{ pelotao, posto, matricula, nome, qtd_armas }`.
   - Em `Entrada/EntradaManual.js` (linhas 178–237):
     - **Coluna AB (`PELOTÃO`):** Gravada como `""` (vazio no payload). Fórmulas PROCV da linha 2 clonadas via `copyTo`.
     - **Coluna AC (`GRAD`):** Gravada como `""` (vazio no payload). Fórmulas PROCV da linha 2 clonadas via `copyTo`.
     - **Coluna AD (`MATRÍCULA`):** Gravada como `""` (vazio no payload). Fórmulas PROCV da linha 2 clonadas via `copyTo`.
     - **Coluna AE (`POLICIAL`):** Recebe `policial.nome` (string textual do nome de guerra), alimentando a chave de busca do PROCV da planilha.
     - **Coluna AF (`QDT ARMAS`):** Recebe `policial.qtd_armas > 0 ? policial.qtd_armas : ""` (string vazia se 0).
   - **Proteção Total de Fórmulas:** Se qualquer tentativa for feita de passar valor literal para as colunas AB, AC ou AD, a Fase 1 de validação (`EntradaManual.js` linhas 349-354) aborta com erro fatal: `Tentativa de sobrescrever a fórmula da coluna '${headerOrig}'`. Fórmulas PROCV nativas são estritamente preservadas.

---

## Contrato Factual e Operacional: Armas Apreendidas (Card #62 - T-C01-ARMAS-005)

### Circuito Canônico
```text
OCR/MANUAL -> ITEM DE ARMA -> NORMALIZAÇÃO/VALIDAÇÃO -> LISTA DINÂMICA -> PAYLOAD -> SHEETS
```

1. **Estrutura da Seção Armas no Formulario.html:**
   - Contêiner dinâmico `#armasList` com botão `+ Adicionar Arma` (`adicionarArmaField()`).
   - Cada item de arma (`.dynamic-item`) é composto por:
     - `tipo` (select `.arma-tipo` populado de `opcoesFormulario.armasTipos`, ex: `'INDUSTRIAL'`, `'FABRICAÇÃO CASEIRA'`);
     - `modelo` (select `.arma-modelo` populado de `opcoesFormulario.armasModelos`, ex: `'REVÓLVER'`, `'PISTOLA'`, `'ESPINGARDA'`, `'FUZIL'`);
     - `calibre` (input text `.arma-calibre`, ex: `'.40'`, `'.38'`, `'9mm'`);
     - `municao` (input number `.arma-municao`, min 0, default 0);
     - `quantidade` (input number `.arma-qtd`, min 1, default 1);
     - botão de remoção rápida `&times;` (`onclick="document.getElementById('${id}').remove();"`).

2. **Inclusão Derivada do OCR:**
   - Heurística determinística no `parseAndFill()` varre o texto linha a linha em caixa alta.
   - Pula menções isoladas a "munição" ou "peças para armas".
   - Identifica modelos (`REVÓLVER`, `PISTOLA`, `ESPINGARDA`, `FUZIL`) e tipos (`FABRICAÇÃO CASEIRA` vs `INDUSTRIAL`).
   - Deduplica em memória por chave composta `tipo + '|' + modelo`.
   - Limita a até 3 armas sugeridas na tela (`armasDetectadas.slice(0,3)`), preenchendo automaticamente a lista com quantidade 1 e munição 0.

3. **Inclusão Manual, Edição e Remoção:**
   - Operador pode incluir manualmente qualquer número de armas clicando em `+ Adicionar Arma`.
   - Todos os campos são editáveis em tempo real.
   - Itens com `quantidade <= 0` são automaticamente filtrados na extração de `obterArmas()`.
   - Soberania total do operador: dados do OCR podem ser alterados, completados (ex: calibre/munição) ou excluídos.

4. **Payload Final de Armas:**
   - Função `obterArmas()` gera array de objetos:
     `{ tipo: string, modelo: string, calibre: string, municao: number, quantidade: number }`.

5. **Destino Físico no Sheets (Colunas L a P):**
   - Comprovado em `Entrada/EntradaManual.js` (linhas 190–215):
     - **Coluna L (`ARMA`):** `arma.quantidade` (número inteiro);
     - **Coluna M (`TIPO`):** `arma.tipo` (string de validação permitida);
     - **Coluna N (`CALIBRE`):** `arma.calibre` (string);
     - **Coluna O (`MODELO`):** `arma.modelo` (string de validação permitida);
     - **Coluna P (`MUNIÇÃO`):** `arma.municao` (número inteiro).

6. **Regra de Combinação Multi-Linhas e Ausência de Vínculo com Policial:**
   - O número total de linhas da ocorrência é expandido por `numLinhas = Math.max(policiais.length, armas.length, ocorrenciasPip.length, ...)`.
   - A combinação é estritamente **posicional pelo índice `idx`** na aba mensal.
   - **NÃO EXISTE VÍNCULO DIRETO ENTRE ARMA E POLICIAL NA PLANILHA OPP:** Se houver 2 armas e 1 policial, a linha 0 conterá o policial 0 e a arma 0; a linha 1 conterá a arma 1 e policial vazio `""`. O único vínculo individual de pontuação é a coluna AF (`QDT ARMAS`), onde o operador define a contagem agregada de armas creditadas àquele policial para mérito/produtividade individual.

---

## Contrato Factual e Operacional: Drogas Apreendidas (Card #63 - T-C01-DROGAS-006)

### Circuito Canônico
```text
OCR/MANUAL -> DROGA/UNIDADE/QUANTIDADE -> NORMALIZAÇÃO/CONVERSÃO -> PAYLOAD -> SHEETS
```

1. **Estrutura da Seção Drogas no Formulario.html:**
   - Contêiner dinâmico `#drogasList` com botão `+ Adicionar Droga` (`adicionarDrogaField()`).
   - Cada item dinâmico (`.dynamic-item`) possui:
     - Select `.droga-tipo` com 6 opções fechadas:
       1. `MACONHA DOLAR` (Label: `MACONHA DÓLAR`)
       2. `MACONHA GRAMA` (Label: `MACONHA GRAMA`)
       3. `CRACK PEDRA` (Label: `CRACK PEDRA`)
       4. `CRACK GRAMA` (Label: `CRACK GRAMA`)
       5. `COCAINA PINO` (Label: `COCAÍNA PINO`)
       6. `COCAINA GRAMA` (Label: `COCAÍNA GRAMA`)
     - Input numérico `.droga-qtd` com `min="0" step="0.01"`;
     - Botão de remoção rápida `&times;` (`onclick="document.getElementById('${id}').remove();"`).

2. **Estrutura Factual do Objeto de Drogas:**
   - Objeto individual no array `drogas`:
     `{ tipo: string, quantidade: number }`.
   - Gerado pela função `obterDrogas()` em `Formulario.html`:
     `[...document.querySelectorAll('#drogasList .dynamic-item')].map(...).filter(d => d.quantidade > 0)`.
   - Filtro ativo: itens com quantidade `<= 0` são automaticamente excluídos do payload.

3. **Inclusão Derivada do OCR:**
   - 5 padrões contextuais inteligentes por regex varrem o texto do BO em busca de termos de drogas (`MACONHA`, `CRACK`, `COCAÍNA`):
     1. Padrão estruturado BOE (`CATEGORIA: COCAINA ... QUANTIDADE: 500`);
     2. Padrão imagens complementares (`ENTORPECENTE/COCAINA, 500 UNIDADE`);
     3. Peso antes (`50g de maconha`);
     4. Unidades antes (`497 ziplocks de cocaína`, papelotes, pedras, invólucros, etc.);
     5. Peso depois (`cocaína 50 g`).
   - Deduplicação em memória via `drogasMap` por tipo normalizado (`MACONHA`, `CRACK`, `COCAÍNA`), preservando o maior valor encontrado.
   - Heurística de classificação de unidades no preenchimento de `adicionarDrogaField(tipoRaw, quantidade, unidade)`:
     - `MACONHA`: `UNIDADES` ou `DÓLAR` -> `MACONHA DOLAR`; caso contrário -> `MACONHA GRAMA`.
     - `CRACK`: `UNIDADES` ou `PEDRAS` -> `CRACK PEDRA`; caso contrário -> `CRACK GRAMA`.
     - `COCAINA`: `UNIDADES` ou `PINO` -> `COCAINA PINO`; caso contrário -> `COCAINA GRAMA`.

4. **Regras de Normalização, Conversão e Valores de Entrada vs Derivados:**
   - **Zero fatores de conversão em código/memória:** O código não possui multiplicadores ou fatores de conversão empíricos (ex: converter dólar em gramas ou pedra em gramas). Cada valor é preservado estritamente na unidade de entrada designada.
   - **Campos de Entrada Literal:**
     - Papelote / Dólar: `MACONHA DOLAR`
     - Gramas: `MACONHA GRAMA`
     - Pedra: `CRACK PEDRA`
     - Gramas: `CRACK GRAMA`
     - Pino: `COCAINA PINO`
     - Gramas: `COCAINA GRAMA`
   - **Campos Derivados (Fórmulas):**
     - `TOTAL DE MACONHA` (Coluna S)
     - `DIVIDIDO MAC` (Coluna T)
     - `TOTAL CRACK (GR)` (Coluna W)
     - `TOTAL DE COCAINA` (Coluna Z)
     - `DIVIDIDO COC` (Coluna AA)
     Esses campos são cálculos analíticos ou fórmulas nativas da planilha. O código `EntradaManual.js` envia estritamente string vazia `""` para não sobrescrever as fórmulas preexistentes.
   - **Acumulação por Tipo:** Se o operador inserir múltiplos itens do mesmo tipo (ex: duas linhas de `MACONHA DOLAR`), `Entrada/EntradaManual.js` soma as quantidades na mesma ocorrência antes de gravar.

5. **Mapeamento Físico no Sheets (Colunas Q a AA):**
   - Comprovado em `Entrada/EntradaManual.js` (linhas 155–173 e 216–226):
     - **Coluna Q (`MACONHA DOLAR`, idx 16):** `isFirst ? (maconhaDolar || "") : ""` (Literal)
     - **Coluna R (`MACONHA GRAMA`, idx 17):** `isFirst ? (maconhaGrama || "") : ""` (Literal)
     - **Coluna S (`TOTAL DE MACONHA`, idx 18):** `""` (Preservado para Fórmula)
     - **Coluna T (`DIVIDIDO MAC`, idx 19):** `""` (Preservado para Fórmula)
     - **Coluna U (`CRACK PEDRA`, idx 20):** `isFirst ? (crackPedra || "") : ""` (Literal)
     - **Coluna V (`CRACK GRAMA`, idx 21):** `isFirst ? (crackGrama || "") : ""` (Literal)
     - **Coluna W (`TOTAL CRACK (GR)`, idx 22):** `""` (Preservado para Fórmula)
     - **Coluna X (`COCAINA PINO`, idx 23):** `isFirst ? (cocainaPino || "") : ""` (Literal)
     - **Coluna Y (`COCAINA GRAMA`, idx 24):** `isFirst ? (cocainaGrama || "") : ""` (Literal)
     - **Coluna Z (`TOTAL DE COCAINA`, idx 25):** `""` (Preservado para Fórmula)
     - **Coluna AA (`DIVIDIDO COC`, idx 26):** `""` (Preservado para Fórmula)

6. **Preservação das Fórmulas Derivadas e Proteção Estrita:**
   - As colunas de fórmulas obrigatórias (`TOTAL DE MACONHA`, `DIVIDIDO MAC`, `TOTAL CRACK (GR)`, `TOTAL DE COCAINA`, `DIVIDIDO COC`) NÃO constam no array `colsPermitidasNomes` de `EntradaManual.js`.
   - Na Fase 1 de validação (`EntradaManual.js` linhas 349-354), qualquer tentativa de passar valor literal para uma célula que contenha fórmula (`=...`) lança imediatamente uma exceção fatal: `Tentativa de sobrescrever a fórmula da coluna '${headerOrig}'`.

7. **Comportamento Multi-Linhas e Fluxo Sem Drogas:**
   - **Multi-Linhas:** Drogas são gravadas exclusivamente na primeira linha da ocorrência (`isFirst === true`). Linhas subsequentes da mesma ocorrência (expansão de múltiplos policiais ou armas) recebem strings vazias `""` em todas as colunas Q:AA, eliminando qualquer risco de contabilidade duplicada.
   - **Fluxo Sem Drogas:** Se o formulário não contiver drogas (`payload.drogas = []` ou omitido), todos os acumuladores permanecem `0`, resultando em strings vazias `""` em todas as colunas Q a AA. Além disso, a ausência de drogas não expande desnecessariamente o número de linhas da planilha (`drogas.length ? 1 : 0`).

8. **Soberania Manual e Precedência do Operador:**
   - O OCR apenas sugere valores nos campos de drogas da interface. O operador humano possui total liberdade para alterar tipos, ajustar gramagens ou contagens, excluir itens clicando em `&times;` ou adicionar drogas omitidas pelo scanner.

---

## Contrato Factual e Operacional: Ocorrências PIP e Imputado (Card #64 - T-C01-PIP-007)

### Circuito Canônico
```text
OCR/MANUAL -> TÍTULO PIP -> CONCILIAÇÃO/EDIÇÃO -> IMPUTADO -> PAYLOAD -> SHEETS
```

1. **Estrutura da Seção PIP no Formulario.html:**
   - Campo select `#imputado` com opções explícitas: `SEM IMPUTADO` (padrão) e `COM IMPUTADO`.
   - Contêiner dinâmico `#pipList` com botão `+ Adicionar Título PIP` (`adicionarPipField()`).
   - Cada item dinâmico (`.dynamic-item`) possui:
     - Select `.pip-tipo` populado a partir de `opcoesFormulario.ocorrenciasPip` (ou `naturezas`);
     - Botão de remoção rápida `&times;` (`onclick="document.getElementById('${id}').remove()"`).

2. **Inclusão Derivada do OCR e Função `conciliarTitulosPipOcr`:**
   - Função canônica `conciliarTitulosPipOcr(text, armasDetectadas, drogasDetectadas, natSelecionada)` analisa o texto e as apreensões contextuais:
     - **Armas:** Mapeia modelos detectados para os títulos canônicos PIP (`Apreensão de arma de fogo revólver`, `pistola`, `artesanal`, `12 industrial`, `fuzil`).
     - **Munições:** Se o texto citar munição/cartuchos, mapeia para calibre .12, fuzil ou revólver/pistola.
     - **Drogas:** Avalia a grandeza da apreensão (`qtd >= 1000` ou unidade em KG/QUILOGRAMAS):
       - Maconha: `Apreensão de maconha (1Kg)` vs `Apreensão de maconha por grama (invólucro ou papelote)`.
       - Cocaína: `Apreensão de cocaína por grama (kg)` vs `Apreensão de cocaína por grama (invólucro)`.
       - Crack: `Apreensão de crack (1Kg)` vs `Apreensão de crack por grama`.
     - **Veículos e Mandados (Proteção de Narrativa Negativa/Ambígua):**
       - Palavras soltas no corpo do BO (ex: "vítima de roubo" ou "não foram encontrados mandados de prisão") são estritamente ignoradas para evitar falsos positivos.
       - Apenas geram títulos PIP se confirmados por regex diretamente no campo `natureza` selecionado (`RECUPERAÇÃO DE VEÍCULO ROUBADO` ou `MANDADO DE PRISÃO`).
     - **Não Invenção de Títulos (`encontrarOpcaoValida`):**
       - Função interna normaliza e valida cada título contra a lista oficial `opcoesFormulario.ocorrenciasPip` (busca exata e depois parcial).

3. **Inclusão Manual, Edição e Remoção:**
   - O operador pode clicar em `+ Adicionar Título PIP` para incluir manualmente qualquer título PIP da lista.
   - Qualquer título sugerido pelo OCR pode ser alterado através do `<select class="pip-tipo">` ou removido pelo botão `&times;`.
   - Precedência soberana do operador humano sobre as sugestões da automação.

4. **Regras Factual e Precedência do Campo `imputado`:**
   - **Precedência 1 (Valor Explícito do Operador):** Se `payload.imputado` for fornecido e não-vazio, seu valor literal (`"COM IMPUTADO"` ou `"SEM IMPUTADO"`) é adotado soberanamente, independentemente do valor de `detidos`.
   - **Precedência 2 (Fallback por Detidos):** Se `payload.imputado` for ausente ou vazio (ex: integrações legadas):
     - `parseInt(payload.detidos, 10) > 0` -> `"COM IMPUTADO"`;
     - Caso contrário -> `"SEM IMPUTADO"`.
   - **Distribuição Multi-Linhas:**
     - Linha 0: Recebe `imputadoVal`.
     - Linhas seguintes (`idx > 0`): Se a linha possuir título PIP (`eventoPip`), recebe `imputadoVal`; caso a linha exista apenas para comportar policiais ou armas extras, recebe string vazia `""`.

5. **Estrutura Factual do Payload:**
   - `ocorrenciasPip`: Array de strings correspondentes aos títulos selecionados no DOM (`obterPip()`): `['TÍTULO 1', 'TÍTULO 2', ...]`.
   - `imputado`: String `"COM IMPUTADO"` ou `"SEM IMPUTADO"`.

6. **Mapeamento Físico no Sheets (Colunas AG e AH):**
   - Comprovado em `Entrada/EntradaManual.js` (linhas 180–237):
     - **Coluna AG (`OCORRÊNCIA PIP`, idx 32):** Recebe `eventoPip` (`ocorrenciasPip[idx] || (isFirst && payload.natureza ? payload.natureza : "")`).
     - **Coluna AH (`IMPUTADO?`, idx 33):** Recebe `imputadoPip` (`isFirst ? imputadoVal : (eventoPip ? imputadoVal : "")`).

7. **Expansão Multi-Linhas e Fluxo Sem PIP:**
   - **Expansão Multi-Linhas:** `numLinhas = Math.max(policiais.length, armas.length, ocorrenciasPip.length, drogas.length ? 1 : 0)`.
     Se houver 3 títulos PIP e apenas 1 policial, o sistema gera 3 linhas físicas no Sheets, alinhando posicionalmente cada título PIP em sua respectiva linha.
   - **Fluxo Sem PIP:** Se `payload.ocorrenciasPip` for vazio (`[]`), a Linha 0 assume `payload.natureza` como fallback na Coluna AG, e `imputadoVal` na Coluna AH. Linhas subsequentes recebem strings vazias `""` em ambas as colunas.

---

## Contrato Factual e Operacional: Salvar / Persistência no Sheets (Card #65 - T-C01-PERSISTENCIA-008)

### Circuito Canônico de Persistência
```text
FORMULÁRIO CONFIRMADO -> PAYLOAD -> processarEntradaManual -> ABA MENSAL -> DUPLICIDADE -> MONTAGEM DE LINHAS -> VALIDAÇÃO (FASE 1) -> GRAVAÇÃO (FASE 2) -> FÓRMULAS (FASE 3) -> RETORNO
```

1. **Função de Salvar no Client-Side (`salvarDados` em `Entrada/Formulario.html`):**
   - Disparada pelo clique do usuário no botão `#btnSave` (`.btn-save`).
   - **Validações Locais Obrigatórias:**
     - Verifica preenchimento de `data` e `natureza`. Se ausentes, aborta localmente emitindo mensagem em `#statusMessage` (`>> ERRO: Preencha DATA e NATUREZA antes de salvar.`) sem disparar requisição remota ao backend.
   - **Montagem do Payload Uniforme Completo:**
     - `origem: 'FORMULARIO'`
     - Dados do Fato: `mike`, `boe`, `ais`, `data`, `hora`, `cidade`, `bairro`, `natureza`, `qtd_o`, `detidos`, `imputado`
     - Equipe: lista ordenada com `{ pelotao, posto, matricula, nome, qtd_armas }` extraída de `#policeTableBody`
     - Armas: lista filtrada de `obterArmas()` com `{ tipo, modelo, calibre, municao, quantidade }`
     - Drogas: lista filtrada de `obterDrogas()` com `{ tipo, quantidade }`
     - PIP: lista de títulos de `obterPip()`
   - **Despacho Canônico Único:**
     - `google.script.run.withSuccessHandler(res => { setStatus('>> ' + res, ...); limparFormulario(); }).withFailureHandler(err => setStatus('>> ERRO: ' + err.message, ...)).processarEntradaManual(payload)`

2. **Backend Único de Persistência (`processarEntradaManual` em `Entrada/EntradaManual.js`):**
   - **Resolução de Aba Mensal:**
     - Chama `localizarAbaMensalTratada(ss, payload.data)` que deriva o nome canônico do mês (ex: `AGO2026`).
     - Se a aba não existir no arquivo da planilha, lança erro fatal com a lista de abas examinadas: `Aba mensal esperada (...) não encontrada. Abas examinadas: [...]`. A execução é imediatamente abortada com **ZERO ESCRITA**.
   - **Bloqueio Prévio de Duplicidade (`verificarDuplicidadeOcorrencia`):**
     - Varre a coluna G (`BOE`) e a coluna E (`MIKE`) da aba mensal.
     - Se encontrar registro existente coincidente com `payload.boe` ou `payload.mike`, interrompe imediatamente lançando `BLOQUEADO: A ocorrência com BOE/MIKE ... já consta cadastrada nesta planilha.`. A interrupção ocorre antes da criação ou reserva de linhas físicas, garantindo **ZERO ESCRITA**.

3. **Montagem e Expansão Multi-Linhas (`montarLinhasEntradaManual`):**
   - Calcula a dimensão vertical da ocorrência: `numLinhas = Math.max(policiais.length, armas.length, ocorrenciasPip.length, drogas.length ? 1 : 0)`.
   - Normaliza cada linha gerando o vetor contíguo de 37 colunas (A a AK).
   - Dados de cabeçalho do fato (Data, Hora, Qtd O, Mike, Boe, Natureza, Ais, Cidade, Bairro, Detidos) são inseridos ou referenciados de acordo com a regra de primeira linha (`isFirst`).
   - Drogas são agregadas por somatório consolidado na Linha 0 (colunas Q a AA).
   - Policiais, armas e ocorrências PIP são distribuídos ordinalmente nas respectivas linhas (0 a `numLinhas - 1`).

4. **Gravação e Atomicidade Operacional Real (`gravarLinhasEntradaManual`):**
   - **Realidade da Atomicidade no Google Apps Script:** O ambiente Google Apps Script não dispõe de transações ACID nem instruções de `rollback`. A integridade atômica é construída via **arquitetura de duas fases (Pré-Validação em Memória antes da Gravação)**:
     - **Fase 1 (Pré-Validação e Integridade Estrutural):**
       - Localiza o bloco contíguo disponível de linhas na aba (`localizarBlocoModeloDisponivel_`).
       - Lê fórmulas existentes (`getFormulas()`) e validações de dados configuradas (`getDataValidations()`).
       - **Proteção Contra Sobrescrita de Fórmulas:** Se uma coluna configurada com fórmula (ex: colunas analíticas, totais de drogas ou PROCV) for alvo de escrita literal, lança erro fatal e aborta imediatamente.
       - **Validação Semântica de Domínio:** Se qualquer valor a ser inserido violar a lista de validação da célula (`mockDataValidation` / `DataValidation`), lança erro fatal: `O valor 'X' não é permitido pela validação da planilha na coluna 'Y'. Gravação abortada.`.
       - Toda a Fase 1 ocorre estritamente em memória: se qualquer célula falhar, nenhuma linha é gravada (**ZERO ESCRITA COMPROVADA**).
     - **Fase 2 (Gravação Física Seletiva):**
       - Varre apenas as colunas explicitamente permitidas para inserção manual (`colsPermitidasNomes`: ORD, DATA, HORA, QTD O, MIKE, NATUREZA, BOE, AIS, CIDADE, BAIRRO, DETIDOS, ARMA, TIPO, CALIBRE, MODELO, MUNIÇÃO, MACONHA DOLAR, MACONHA GRAMA, CRACK PEDRA, CRACK GRAMA, COCAINA PINO, COCAINA GRAMA, POLICIAL, QDT ARMAS, OCORRÊNCIA PIP, IMPUTADO?).
       - Escreve os valores validados no Sheets via `setValues()`.
     - **Fase 3 (Clonagem e Preservação de Fórmulas):**
       - Clona as fórmulas modelo da linha 2 (Pelotão na coluna AB, Posto na coluna AC, Matrícula na coluna AD) para as linhas inseridas utilizando `copyTo(..., SpreadsheetApp.CopyPasteType.PASTE_FORMULA, false)`.
   - **Retorno Operacional:** Retorna mensagem canônica estruturada: `Ocorrência ${identificador} salva com sucesso (${linhasParaInserir.length} registros computados)!`.
   - **Tratamento de Exceções:** Qualquer erro captura e repassa via `throw new Error(...)`, sendo capturado pelo `withFailureHandler` no cliente para exibição clara ao operador.
