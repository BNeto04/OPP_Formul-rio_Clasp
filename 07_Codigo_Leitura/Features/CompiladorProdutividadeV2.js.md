# ESPELHO — CompiladorProdutividadeV2.js

> [!NOTE] Espelho rico de código (Metodo §46.15) — gerado por `scripts/downplant/espelho-rico.mjs`
> Somente leitura. Não editar à mão: qualquer edição é sobrescrita na próxima geração.
> O código abaixo é cópia verbatim do arquivo de origem no commit declarado; divergência entre o embutido e a origem é deriva (§18.1).
> Regra do sha256 declarado: sha256 do conteúdo **normalizado para LF** (igual ao blob do Git). Em arquivo CRLF com terminador final diferente, ele difere do `sha256sum` dos bytes crus — a comparação de deriva é feita conteúdo-contra-conteúdo.
> Papel desta cópia: CANÔNICA (repositório). O derivado navegável no vault é gerado com as mesmas entradas.

- **Endereço Down Plant:** `C06_Relatorios / MOD-C06-01_RELATORIOS_OFICIAIS` — [NOTA_DE_RESPONSABILIDADE.md](../../02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-01_RELATORIOS_OFICIAIS/NOTA_DE_RESPONSABILIDADE.md)
- **Arquivo de origem (link para o disco):** [`Features/CompiladorProdutividadeV2.js`](../../Features/CompiladorProdutividadeV2.js)
- **Commit de referência:** `fbb0608e7b98144533628c7f9b773a10505b800d` (`fbb0608`)
- **Data da última sincronização:** 2026-09-13T21:45:32-03:00

## Código-fonte embutido

Verbatim de `Features/CompiladorProdutividadeV2.js` em `fbb0608`. sha256 do bloco (LF): `72c39d3b08d00dac33868037e12a0cf84f6839fdc93b9808fce9bf993296d789` — 56 linhas.

```javascript
/**
 * ARQUIVO: Features/CompiladorProdutividadeV2.js
 * DESCRIÇÃO: A Orquestração Beta da V2. 
 * Respeita o Princípio da Coexistência: não substitui o V1, mas 
 * executa em paralelo consumindo Adaptador -> Motor -> Modelo -> Renderer.
 */

class CompiladorProdutividadeV2 {
  /**
   * Ponto de entrada da nova arquitetura.
   * Pode ser chamado diretamente no Google Apps Script para testar lado a lado.
   */
  static executar(apenasAnoAtual = false) {
    const planilha = SpreadsheetApp.getActiveSpreadsheet();
    const ui = SpreadsheetApp.getUi();
    
    // Simulação do Fluxo Inflexível (Pipeline)
    // 1. LEITURA (Pilar 1 - Adaptadores)
    const metadado2026 = CatalogoEstruturas[FonteDados.OPP_2026];
    const sheet2026 = planilha.getSheetByName("JAN2026"); // Mock simplificado
    
    // Obter Mapa de Efetivo (Mock idêntico ao original)
    const abaEfetivo = planilha.getSheetByName('Efetivo');
    let mapaEfetivo = {};
    if (abaEfetivo) {
       // mapaEfetivo = carregarEfetivo(abaEfetivo);
    }
    
    let fatosBrutos = [];
    if (sheet2026) {
      // Retorna array de RegistroCanonico
      fatosBrutos = Adaptador2026.extrairFatos(sheet2026, metadado2026, mapaEfetivo); 
    }

    // 2. CÁLCULO (Pilar 3 - Motor Analítico V2)
    // Converte os fatos brutos em Registros Analíticos agregados
    let registrosAnaliticos = MotorAnaliticoV2.processarProdutividadePolicial(fatosBrutos);

    // 3. ESTRUTURA LÓGICA (Pilar 4 - Modelos)
    const modelo = new ModeloProdutividade();
    
    // O Modelo se encarrega de ordenar os dados conforme suas próprias regras de negócio
    registrosAnaliticos = modelo.ordenarDados(registrosAnaliticos);

    // 4. RENDERIZAÇÃO LÓGICA E FÍSICA (Pilares 5 e 6)
    const tema = TemaPMPE;
    
    // O Renderer apenas constrói um Documento (agnóstico de Sheets)
    const documentoLogico = RendererLogico.renderizar(modelo, registrosAnaliticos, tema);

    // O Driver pega o documento e materializa na Planilha (único ponto de contato com a API)
    GoogleSheetsDriver.materializar(planilha, documentoLogico);

    return true;
  }
}
```

## Responsabilidade observada

Fonte: `02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-01_RELATORIOS_OFICIAIS/MOD-C06-01_RELATORIOS_OFICIAIS.md` — CAPSULA do modulo (formato 46.2), "## Responsabilidade".

Gerar e publicar os **relatorios oficiais** do produto - em especial o `COMPARATIVO_2026` (produtividade
consolidada por policial) - a partir dos fatos canonicos, com renderizacao propria.

Fonte: `02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-01_RELATORIOS_OFICIAIS/MOD-C06-01_RELATORIOS_OFICIAIS.md` — CAPSULA do modulo (formato 46.2), "## Limites".

- **Nao decide regra de dominio:** consome o que o C04 consolidou e o que a ARCA declara.
- **Nao corrige a fonte:** quando o valor publicado diverge, o defeito e rastreado ate a origem
  (o #152 separa "defeito do produto" de "defeito da entrada").
- **Nao inventa valor:** a ordem de entrega de armas segue a regra do proprietario (score desc, empate por
  antiguidade - R10) e a divergencia fica **registrada**, nao resolvida por conveniencia.

## Portas expostas (se aplicável)

- Superfície exposta no nível do arquivo (nível global): `CompiladorProdutividadeV2`
- Membros públicos observados: `executar`

_Extraído por heurística do gerador (globais de nível arquivo + métodos/accessors de 1º–2º nível). Não substitui a declaração de porta da Planta: confirme no endereço acima._

## Divergência com a Planta declarada

Testes mecânicos executados na geração (commit `fbb0608`, 2026-09-13T21:45:32-03:00):

- OK — T1 endereco existe: NOTA_DE_RESPONSABILIDADE.md do modulo presente
- OK — T2 artefato declarado no endereco: "Features/CompiladorProdutividadeV2.js" aparece na Planta
- OK — T3 arquivo presente no commit de referencia (fbb0608:Features/CompiladorProdutividadeV2.js)
- OK — T4 conteudo em disco identico ao do commit de referencia (sha256 LF)
- OK — T5 espelho anterior sem deriva de codigo (sha256 do bloco == origem)
- OK — T6 endereco declarado no espelho anterior corresponde ao endereco canonico atual
- OK — T7 sem duplicidade: exatamente 1 espelho de leitura declara "Features/CompiladorProdutividadeV2.js" como origem

Veredito mecânico: **nenhuma divergência detectada pelos testes acima**.

Declaração verificada a mão por humano/agente (não derivável automaticamente):

- **Como o endereco foi derivado (nao inventado):** secao Artefatos; fonte `02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-01_RELATORIOS_OFICIAIS/MOD-C06-01_RELATORIOS_OFICIAIS.md`:59.
- **Nada foi corrigido no artefato:** o gerador nao altera codigo de produto; o arquivo de origem permanece byte a byte como estava.

## Última verificação (data/commit)

- 2026-09-13T21:45:32-03:00 · commit `fbb0608` · sha256 da origem (LF): `72c39d3b08d00dac33868037e12a0cf84f6839fdc93b9808fce9bf993296d789`
- Reexecutar: `node scripts/downplant/espelho-rico.mjs gerar --endereco C06_Relatorios/MOD-C06-01_RELATORIOS_OFICIAIS --origem Features/CompiladorProdutividadeV2.js --saida <caminho>`
- Verificar deriva sem regravar: `node scripts/downplant/espelho-rico.mjs verificar --espelho <caminho>`
