# ESPELHO — RegistroCanonico.js

> [!NOTE] Espelho rico de código (Metodo §46.15) — gerado por `scripts/downplant/espelho-rico.mjs`
> Somente leitura. Não editar à mão: qualquer edição é sobrescrita na próxima geração.
> O código abaixo é cópia verbatim do arquivo de origem no commit declarado; divergência entre o embutido e a origem é deriva (§18.1).
> Regra do sha256 declarado: sha256 do conteúdo **normalizado para LF** (igual ao blob do Git). Em arquivo CRLF com terminador final diferente, ele difere do `sha256sum` dos bytes crus — a comparação de deriva é feita conteúdo-contra-conteúdo.
> Papel desta cópia: CANÔNICA (repositório). O derivado navegável no vault é gerado com as mesmas entradas.

- **Endereço Down Plant:** `C03_Dominio / MOD-C03-01_MODELO_DE_OCORRENCIA` — [NOTA_DE_RESPONSABILIDADE.md](../../02_Comodos/C03_Dominio/01_Dominio/modulos/MOD-C03-01_MODELO_DE_OCORRENCIA/NOTA_DE_RESPONSABILIDADE.md)
- **Arquivo de origem (link para o disco):** [`Dominio/RegistroCanonico.js`](../../Dominio/RegistroCanonico.js)
- **Commit de referência:** `fbb0608e7b98144533628c7f9b773a10505b800d` (`fbb0608`)
- **Data da última sincronização:** 2026-09-13T21:45:23-03:00

## Código-fonte embutido

Verbatim de `Dominio/RegistroCanonico.js` em `fbb0608`. sha256 do bloco (LF): `2d96af34d1ccea66cd1b95ce130ee4dc0f6cbc7a0ffb404a09c93daaeecf1913` — 73 linhas.

```javascript
/**
 * ARQUIVO: Dominio/RegistroCanonico.js
 * PILAR 2: Registro Canônico (A Linguagem Oficial do SYNTHÉON)
 * DESCRIÇÃO: Objeto imutável contendo os "Fatos". Transforma os dados lidos
 * de qualquer fonte (OPP2024, OPP2026, Firebase) para a estrutura única consumida 
 * pelo Motor Analítico. Nunca possui cálculos ou indicadores (como médias ou percentuais).
 */
class RegistroCanonico {
  constructor(dados) {
    // 1. Rastreabilidade Plena (De onde veio o dado?)
    this.origem = {
      ano: dados.origem?.ano || null,
      mes: dados.origem?.mes || null,
      aba: dados.origem?.aba || '',
      linha: dados.origem?.linha || 0,
      versaoEstrutura: dados.origem?.versaoEstrutura || 'DESCONHECIDA'
    };

    // 2. Cobertura Histórica (Informa ao motor o que é N/D e o que é zero)
    this.coberturaHistorica = dados.coberturaHistorica || {};

    // 3. Fatos: Ocorrência Global (Evento indivisível)
    this.ocorrencia = {
      chave: dados.ocorrencia?.chave || '',
      data: dados.ocorrencia?.data || null,
      mike: dados.ocorrencia?.mike || '',
      boe: dados.ocorrencia?.boe || '',
      natureza: dados.ocorrencia?.natureza || '',
      cidade: dados.ocorrencia?.cidade || '',
      bairro: dados.ocorrencia?.bairro || '',
      ais: dados.ocorrencia?.ais || 0,
      armaFato: dados.ocorrencia?.armaFato !== undefined ? dados.ocorrencia.armaFato : 0,
      tipoArma: dados.ocorrencia?.tipoArma || '',
      modeloArma: dados.ocorrencia?.modeloArma || ''
    };

    // 4. Fatos: Métricas da Ocorrência (Valores que pertencem ao evento, não ao policial isolado)
    this.metricasPrimarias = {
      pontosTotais: dados.metricasPrimarias?.pontosTotais || 0,
      detidos: dados.metricasPrimarias?.detidos || 0,
      apfd: dados.metricasPrimarias?.apfd || 0,
      tco: dados.metricasPrimarias?.tco || 0,
      boc: dados.metricasPrimarias?.boc || 0
    };

    // 5. Evento pontuavel declarado pelo operador na linha fisica (AG/AH).
    this.eventoPontuavel = {
      indicador: dados.eventoPontuavel?.indicador || '',
      imputado: dados.eventoPontuavel?.imputado || ''
    };

    // 6. Fatos: Relacionamento de Equipe
    this.equipe = dados.equipe || ''; // Nome ou sigla da guarnição, se houver
    
    // 7. Fatos: Policiais Envolvidos e sua cota de participação física
    this.policiais = dados.policiais || [];

    // Congela a instância e sub-estruturas para imutabilidade total no pipeline V2
    Object.freeze(this.origem);
    Object.freeze(this.coberturaHistorica);
    Object.freeze(this.ocorrencia);
    Object.freeze(this.metricasPrimarias);
    Object.freeze(this.eventoPontuavel);
    Object.freeze(this.policiais);
    Object.freeze(this);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { RegistroCanonico };
}


```

## Responsabilidade observada

Fonte: `02_Comodos/C03_Dominio/01_Dominio/modulos/MOD-C03-01_MODELO_DE_OCORRENCIA/NOTA_DE_RESPONSABILIDADE.md` — NOTA_DE_RESPONSABILIDADE.md do modulo (fallback: primeiras linhas uteis; sem secao de papel/responsabilidade).

Responsabilidade canonica do modulo.
## Documentos do modulo

## Portas expostas (se aplicável)

- Superfície exposta no nível do arquivo (nível global): `RegistroCanonico`
- Membros públicos observados: `constructor`

_Extraído por heurística do gerador (globais de nível arquivo + métodos/accessors de 1º–2º nível). Não substitui a declaração de porta da Planta: confirme no endereço acima._

## Divergência com a Planta declarada

Testes mecânicos executados na geração (commit `fbb0608`, 2026-09-13T21:45:23-03:00):

- OK — T1 endereco existe: NOTA_DE_RESPONSABILIDADE.md do modulo presente
- OK — T3 arquivo presente no commit de referencia (fbb0608:Dominio/RegistroCanonico.js)
- OK — T4 conteudo em disco identico ao do commit de referencia (sha256 LF)
- OK — T5 espelho anterior sem deriva de codigo (sha256 do bloco == origem)
- OK — T6 endereco declarado no espelho anterior corresponde ao endereco canonico atual
- OK — T7 sem duplicidade: exatamente 1 espelho de leitura declara "Dominio/RegistroCanonico.js" como origem
- **ACHADO** — T2 artefato NAO declarado no endereco: "Dominio/RegistroCanonico.js" nao aparece nas NOTAS/capsula de C03_Dominio / MOD-C03-01_MODELO_DE_OCORRENCIA

Veredito mecânico: **1 divergência(s) detectada(s) pelos testes acima**.

Declaração verificada a mão por humano/agente (não derivável automaticamente):

- **Como o endereco foi derivado (nao inventado):** menção em arquivo do próprio endereço; fonte `02_Comodos/C03_Dominio/01_Dominio/modulos/MOD-C03-01_MODELO_DE_OCORRENCIA/CIR-MOD-C03-01_MODELO_DE_OCORRENCIA.canvas`.
- **Enderecos concorrentes declarados na Planta (1):** `C02_Leitura/MOD-C02-01_LEITURA_E_ADAPTACAO`. O artefato e referenciado em mais de um endereco; o campo acima registra o endereco PRIMARIO. Nao e erro de endereco — e declaracao concorrente na propria Planta.
- **Nada foi corrigido no artefato:** o gerador nao altera codigo de produto; o arquivo de origem permanece byte a byte como estava.

## Última verificação (data/commit)

- 2026-09-13T21:45:23-03:00 · commit `fbb0608` · sha256 da origem (LF): `2d96af34d1ccea66cd1b95ce130ee4dc0f6cbc7a0ffb404a09c93daaeecf1913`
- Reexecutar: `node scripts/downplant/espelho-rico.mjs gerar --endereco C03_Dominio/MOD-C03-01_MODELO_DE_OCORRENCIA --origem Dominio/RegistroCanonico.js --saida <caminho>`
- Verificar deriva sem regravar: `node scripts/downplant/espelho-rico.mjs verificar --espelho <caminho>`
