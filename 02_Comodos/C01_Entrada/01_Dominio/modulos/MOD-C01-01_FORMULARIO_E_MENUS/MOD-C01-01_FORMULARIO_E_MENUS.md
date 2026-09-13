# MOD-C01-01_FORMULARIO_E_MENUS

- **ID:** MOD-C01-01
- **Endereço Down Plant:** `C01_Entrada / MOD-C01-01_FORMULARIO_E_MENUS` (escala: modulo) · circuito `CIR-MOD-C01-01_FORMULARIO_E_MENUS.canvas`
- **Estado (§19):** Código 🟢 · Teste 🟢 · Contrato 🟡 · Integração 🟢 · Visual 🟢 · Publicação 🟢 · Documentação 🟢 *(esta cápsula; evidências §46.5 materializadas no card #153)*
- **Perfil:** P1 (operação recorrente; sem dados sensíveis além do BO)
- **Responsável:** Proprietário (Manoel) — execução por agentes sob card

## Responsabilidade
Receber o texto do BO (colagem/OCR), transformá-lo em **payload conferível** e entregá-lo à persistência (`SUB-C01-01-02_PERSISTENCIA_MANUAL`). Não decide pontuação, não corrige dado: **sugere e deixa conferir**. Também expõe a **porta única de navegação P3** do produto.

## Limites
- **Não** grava direto na aba mensal: o payload passa por `Entrada/EntradaManual.js` (validação de coluna, anti-duplicidade, fórmula).
- **Não** decide imputado (`IMPUTADO?` é escolha do operador; DETIDOS nunca é inferido).
- **Não** aplica regra de domínio nova por heurística: consulta a ARCA quando a regra existe (fail-soft).
- **Não** inventa valor: campo sem evidência fica pendente e **explícito** (ex.: alerta `CONFERIR AIS`).

## Entradas
Texto do BO (SEI/CIODS/PMPE) · EFETIVO (nome de guerra, posto, pelotão) · catálogo PIP (`tabela de pontos PIP`) · base territorial AIS · metadados ARCA (por `rule_id`).

## Saídas
Payload JSON para `processarEntradaManual` (campos do fato + `policiais[]` + `armas[]` + `drogas[]` + `ocorrenciasPip[]` + `imputado` + `qtd_o` + `detidos`) · alertas de conferência na faixa de status · linhas da equipe ordenadas por antiguidade.

## Portas
| Porta | Direção | Contrato (resumo) |
|---|---|---|
| `P3` (menu) | UI → produto | única fachada; 7 grupos; `Entrada/Menu.js` |
| Formulário → ARCA | consulta canônica | `rule_id` → metadados; **fail-soft** (ausência de ARCA não bloqueia) |
| Formulário → EntradaManual | payload | `require`: DATA, NATUREZA, MIKE, BOE; `ensure`: linha montada com validação de coluna; **anti-duplicidade** por BOE/MIKE |
| Formulário → C03 (AIS) | resolução territorial | cidade+bairro → AIS; sem base suficiente ⇒ **pendente de conferência**, nunca chute |

## Conexões
`C01 → C03/ARCA` (título PIP de veículo — decidido no #138) · `C01 → C04/C05` via vírgula de dados persistidos · `C01 → Google Sheets` (aba mensal) · `C01 → EFETIVO` (transversal).

## Invariantes
1. **Político-operacional:** `POLICIAL` gravado é **nome de guerra** da coluna `EFETIVO!A` (matrícula é a ponte, nunca o nome completo do BO).
2. **Ordem de antiguidade:** a equipe sai **patente → matrícula (mais antiga primeiro)**, estável; graduação desconhecida vai ao fim.
3. **QTD O** nasce `01` e **nunca é inferido** pelo OCR.
4. **DETIDOS** é indicador processual (APFD/TCO/BOC/AAFAI), padrão `TCO`, e **nunca é inferido**.
5. **Nada é inventado**: sem evidência ⇒ vazio + alerta explícito (AIS, DETIDOS, cidade/bairro).
6. **Uma arma por linha** (`ARMA` = física da linha); `QDT ARMAS` = participação, nunca somada.

## Regras (domínio × heurística)
| Regra | Onde rege | Artefato |
|---|---|---|
| Conversão de drogas (pedra 0,25 g · big 3 g · pino 1 g) e crack no total da cocaína | ARCA | `ARCA-CONVERSAO-001` + `Core/Constantes.js:CONVERSOES_DROGAS` |
| Arma física × participação | ARCA | `ARCA-ARMAS-001` |
| Título PIP de veículo exige natureza com recuperação/apreensão na **mesma** declaração | ARCA | `ARCA-VEICULO-001` |
| Endereço SEI `;` (lido do fim, tolerando quebra de linha/espaço) | heurística do parser | `extrairEnderecoOcr_` |
| Dedupe de entorpecente por **substância+unidade** | heurística do parser | `extrairDrogasOcr_` |
| Ordem de antiguidade | código canônico | `Core/Policiais.js:ordenarEquipePorAntiguidade_` |

## Tecnologia existente avaliada (§31.4)
Apps Script (runtime do produto) · Google Sheets (fonte operacional) · clasp (deploy/push) · sem bibliotecas externas novas.

## Artefatos
`Entrada/Formulario.html` · `Entrada/Menu.js` · `Entrada/EntradaManual.js` · `Entrada/SeletorMesesGuardiao.js` · diálogos HTML do C01 · `Core/Policiais.js` (ordenação, compartilhada).

## Dependências (§31.6)
| Dependência | Vínculo | Versão/estado |
|---|---|---|
| Google Apps Script (SpreadsheetApp/ContentService) | runtime do produto | V8 — ativo |
| Google Sheets API (leitura de validações/EFETIVO) | via Apps Script | ativo |
| Catálogo PIP + EFETIVO + base territorial AIS | abas da planilha | ativos |
| `clasp` (deploy) | ferramenta de publicação | 81/81 arquivos remotos byte-iguais ao HEAD |

## Erros
Validação de coluna rejeita valor fora da lista (ex.: `NATUREZA` fora da lista ⇒ gravação abortada) · duplicidade de BOE/MIKE bloqueia · AIS sem base ⇒ alerta âmbar (não bloqueia) · OCR sem correspondência ⇒ campo vazio + alerta.

## Observabilidade
Faixa de status do formulário (`>> Auto-preenchimento concluído | N pol | N arm | N drog`) · badge/alerta `CONFERIR AIS` · card de conferência do OCR · logs do Apps Script.

## Testes (fechaduras)
`TestFormularioAisSei` (9) · `TestFormularioCidadeBairro` (7) · `TestOcrVeiculoRoubado` (15) · `TestOcrEntorpecentesDetidos` (6) · `TestPadroesFormularioQtdODetidos` (7) · `TestOrdemAntiguidadeEquipe` (7) · `TestSemanticaArmasQdt` (6) · `TestEntradaManualFormulario` (suíte de contrato) · suíte integral **451 PASS / 0 FAIL**.

## Evidências
- Commits: `62635ca` (#140) · `4dde66a` (#144 + padrões) · `27daa78` (ordem de antiguidade) · `966bba0` (sandbox de teste) · `a1de4bf` (endpoint/INST).
- **Produção:** `SET2026` linha 28 — BO `202609042215125692` gravado com **AIS 4**, `CIDADE=RECIFE`, `BAIRRO=SANCHO`, `DETIDOS=TCO`.
- Deploy: `clasp push` + verificação **81/81 byte-iguais ao HEAD**.

## Divergências conhecidas
- `NOTA_DE_RESPONSABILIDADE.md` era **stub de 3 linhas** (substituído por esta cápsula; a nota passa a apontar para cá).
- Circuitos de submódulo ainda divergem entre repo e espelho (tratado no **#154**).
- Evidências §46.5 dos demais blocos: materializadas no **#153**.

## Critérios de verde
Código e GIT alinhados · suíte verde · produção conferida · cápsula e evidências presentes · nenhuma divergência oculta entre repo e espelho para este módulo.
