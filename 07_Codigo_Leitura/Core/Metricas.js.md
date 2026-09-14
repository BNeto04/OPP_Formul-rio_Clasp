# ESPELHO — Metricas.js

> [!NOTE] Espelho rico de código (Metodo §46.15) — gerado por `scripts/downplant/espelho-rico.mjs`
> Somente leitura. Não editar à mão: qualquer edição é sobrescrita na próxima geração.
> O código abaixo é cópia verbatim do arquivo de origem no commit declarado; divergência entre o embutido e a origem é deriva (§18.1).
> Regra do sha256 declarado: sha256 do conteúdo **normalizado para LF** (igual ao blob do Git). Em arquivo CRLF com terminador final diferente, ele difere do `sha256sum` dos bytes crus — a comparação de deriva é feita conteúdo-contra-conteúdo.
> Papel desta cópia: CANÔNICA (repositório). O derivado navegável no vault é gerado com as mesmas entradas.

- **Endereço Down Plant:** `C02_Leitura / MOD-C02-01_LEITURA_E_ADAPTACAO` — [NOTA_DE_RESPONSABILIDADE.md](../../02_Comodos/C02_Leitura/01_Dominio/modulos/MOD-C02-01_LEITURA_E_ADAPTACAO/NOTA_DE_RESPONSABILIDADE.md)
- **Arquivo de origem (link para o disco):** [`Core/Metricas.js`](../../Core/Metricas.js)
- **Commit de referência:** `fbb0608e7b98144533628c7f9b773a10505b800d` (`fbb0608`)
- **Data da última sincronização:** 2026-09-13T21:45:07-03:00

## Código-fonte embutido

Verbatim de `Core/Metricas.js` em `fbb0608`. sha256 do bloco (LF): `29642054158e01c0dedb2a1da8bffea3025c4a5e39ce6eb60dbea6b5a73199d4` — 95 linhas.

```javascript
/**
 * Cérebro matemático e consolidador de métricas do ecossistema SYNTHÉON.
 */
const SyntheonMetricas = {
  /**
   * Consolida as ocorrências estruturadas em métricas por policial individual.
   * @param {Array<OcorrenciaPadronizada>} ocorrencias - Lista de ocorrências canônicas.
   * @return {Object.<string, Object>} Mapa contendo as métricas de cada militar.
   */
  consolidarPoliciais(ocorrencias) {
    const produtividade = {};

    ocorrencias.forEach(oc => {
      Object.keys(oc.policiais).forEach(matricula => {
        const pol = oc.policiais[matricula];

        if (!produtividade[matricula]) {
          produtividade[matricula] = {
            matricula: matricula,
            nome: pol.nome,
            grad: pol.grad,
            pelotao: pol.pelotao, // Lotação inicial
            historicoEscalas: [],
            fatos: {
              ocorrencias: 0,
              armas: 0,
              participacaoArmas: 0,
              maconha: 0,
              cocaina: 0,
              crack: 0,
              drogasTotal: 0,
              detidos: 0,
              apfd: 0,
              tco: 0,
              boc: 0,
              qtdBoe: 0,
              ocorrenciasComArma: 0,
              ocorrenciasComDroga: 0
            },
            indicadores: {
              pontosPIP: 0,
              pontosCPM: 0,
              pontosTotais: 0
            }
          };
        }

        const registro = produtividade[matricula];
        
        // Atualiza a lotação mais recente vista (se for diferente da anterior, e adiciona ao histórico)
        if (pol.pelotao && pol.pelotao !== 'N/I') {
          registro.pelotao = pol.pelotao; 
          if (!registro.historicoEscalas.includes(pol.pelotao)) {
            registro.historicoEscalas.push(pol.pelotao);
          }
        }

        registro.fatos.ocorrencias++;
        if (pol.armas > 0) registro.fatos.ocorrenciasComArma++;
        if (pol.maconha > 0 || pol.cocaina > 0 || pol.crack > 0) registro.fatos.ocorrenciasComDroga++;
        
        // Acumular Pontuações (Indicadores)
        // Para PIP/CPM, a pontuação consolidada no Objeto Canônico é a pontosFiccao rateada
        registro.indicadores.pontosPIP += pol.pontosFiccao || 0;
        registro.indicadores.pontosCPM += pol.pontosFiccao || 0; // CPM utiliza a mesma base de pontos na célula
        registro.indicadores.pontosTotais += pol.pontosFiccao || 0;

        // Acumular Apreensões e KPIs (Fatos imutáveis da operação)
        registro.fatos.armas += pol.armas || 0;
        registro.fatos.participacaoArmas += pol.participacaoArmas || 0;
        registro.fatos.maconha += pol.maconha || 0;
        registro.fatos.cocaina += pol.cocaina || 0;
        registro.fatos.crack += pol.crack || 0;
        registro.fatos.detidos += pol.detidos || 0;
        registro.fatos.apfd += pol.apfd || 0;
        registro.fatos.tco += pol.tco || 0;
        registro.fatos.boc += pol.boc || 0;
        registro.fatos.qtdBoe += pol.qtdBoe || 0;
        
        // Peso total de drogas (maconha + cocaína + crack)
        registro.fatos.drogasTotal += ((pol.maconha || 0) + (pol.cocaina || 0) + (pol.crack || 0));
      });
    });

    const resultado = {};
    for (const matricula in produtividade) {
      const reg = produtividade[matricula];
      reg.indicadores.pontosTotais = reg.indicadores.pontosCPM;
      // Requer que a classe RegistroAnalitico já tenha sido carregada pelo Google Apps Script
      resultado[matricula] = typeof RegistroAnalitico !== 'undefined' ? new RegistroAnalitico(reg) : reg;
    }

    return resultado;
  }
};
```

## Responsabilidade observada

Fonte: `02_Comodos/C02_Leitura/01_Dominio/modulos/MOD-C02-01_LEITURA_E_ADAPTACAO/MOD-C02-01_LEITURA_E_ADAPTACAO.md` — CAPSULA do modulo (formato 46.2), "## Responsabilidade".

**Ler** as planilhas e **traduzir** linhas fisicas em fatos canonicos (`RegistroCanonico`), alem de resolver a
antiguidade a partir do peculio. E o unico ponto do sistema que conhece o **layout fisico** das abas.

Fonte: `02_Comodos/C02_Leitura/01_Dominio/modulos/MOD-C02-01_LEITURA_E_ADAPTACAO/MOD-C02-01_LEITURA_E_ADAPTACAO.md` — CAPSULA do modulo (formato 46.2), "## Limites".

- **Nao agrega dados.** O cabecalho do adaptador declara a "Regra de Ouro #4": ele **apenas traduz** linhas
  fisicas em fatos; somar/consolidar e do Motor (C04).
- **Nao grava** em planilha: leitura somente.
- **Nao inventa posicao de coluna:** quando o cabecalho nao e reconhecido, falha explicitamente
  (`FALHA_ADAPTADOR_SEM_FATOS`) em vez de chutar indice.
- **Nao usa fallback para `QDT ARMAS`**: a separacao arma fisica x participacao e obrigatoria.

## Portas expostas (se aplicável)

- Superfície exposta no nível do arquivo (nível global): `SyntheonMetricas`
- Membros públicos observados: `consolidarPoliciais`

_Extraído por heurística do gerador (globais de nível arquivo + métodos/accessors de 1º–2º nível). Não substitui a declaração de porta da Planta: confirme no endereço acima._

## Divergência com a Planta declarada

Testes mecânicos executados na geração (commit `fbb0608`, 2026-09-13T21:45:07-03:00):

- OK — T1 endereco existe: NOTA_DE_RESPONSABILIDADE.md do modulo presente
- OK — T2 artefato declarado no endereco: "Core/Metricas.js" aparece na Planta
- OK — T3 arquivo presente no commit de referencia (fbb0608:Core/Metricas.js)
- OK — T4 conteudo em disco identico ao do commit de referencia (sha256 LF)
- OK — T5 espelho anterior sem deriva de codigo (sha256 do bloco == origem)
- OK — T6 endereco declarado no espelho anterior corresponde ao endereco canonico atual
- OK — T7 sem duplicidade: exatamente 1 espelho de leitura declara "Core/Metricas.js" como origem

Veredito mecânico: **nenhuma divergência detectada pelos testes acima**.

Declaração verificada a mão por humano/agente (não derivável automaticamente):

- **Como o endereco foi derivado (nao inventado):** secao Artefatos; fonte `02_Comodos/C02_Leitura/01_Dominio/modulos/MOD-C02-01_LEITURA_E_ADAPTACAO/MOD-C02-01_LEITURA_E_ADAPTACAO.md`:62.
- **Ponteiro anterior para elemento PARADO:** o espelho de leitura anterior apontava para `_SUP_158/C00_Governanca_Estrutural/01_Dominio/modulos/MOD-C00-01_INFRAESTRUTURA_CORE`, elemento arquivado no card #158 (sem lastro em nenhuma ref do repo). O endereco acima NAO e uma renomeacao daquele: foi derivado da declaracao do artefato na Planta (medido em `MAPA_ARTEFATO_ENDERECO_162.md`).
- **Enderecos concorrentes declarados na Planta (1):** `C04_Motor/MOD-C04-01_MOTOR_ANALITICO`. O artefato e referenciado em mais de um endereco; o campo acima registra o endereco PRIMARIO. Nao e erro de endereco — e declaracao concorrente na propria Planta.
- **Divergencia com o espelho anterior:** o espelho antigo declarava o modulo `MOD-C00-01_INFRAESTRUTURA_CORE`; a derivacao atual chega a `C02_Leitura/MOD-C02-01_LEITURA_E_ADAPTACAO`. Divergencia declarada, nao sobrescrita em silencio.
- **Nada foi corrigido no artefato:** o gerador nao altera codigo de produto; o arquivo de origem permanece byte a byte como estava.

## Última verificação (data/commit)

- 2026-09-13T21:45:07-03:00 · commit `fbb0608` · sha256 da origem (LF): `29642054158e01c0dedb2a1da8bffea3025c4a5e39ce6eb60dbea6b5a73199d4`
- Reexecutar: `node scripts/downplant/espelho-rico.mjs gerar --endereco C02_Leitura/MOD-C02-01_LEITURA_E_ADAPTACAO --origem Core/Metricas.js --saida <caminho>`
- Verificar deriva sem regravar: `node scripts/downplant/espelho-rico.mjs verificar --espelho <caminho>`
