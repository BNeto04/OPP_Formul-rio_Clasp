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
