# ESPELHO — Config.js

> [!NOTE] Espelho rico de código (Metodo §46.15) — gerado por `scripts/downplant/espelho-rico.mjs`
> Somente leitura. Não editar à mão: qualquer edição é sobrescrita na próxima geração.
> O código abaixo é cópia verbatim do arquivo de origem no commit declarado; divergência entre o embutido e a origem é deriva (§18.1).
> Regra do sha256 declarado: sha256 do conteúdo **normalizado para LF** (igual ao blob do Git). Em arquivo CRLF com terminador final diferente, ele difere do `sha256sum` dos bytes crus — a comparação de deriva é feita conteúdo-contra-conteúdo.
> Papel desta cópia: CANÔNICA (repositório). O derivado navegável no vault é gerado com as mesmas entradas.

- **Endereço Down Plant:** `C02_Leitura / MOD-C02-01_LEITURA_E_ADAPTACAO` — [NOTA_DE_RESPONSABILIDADE.md](../../02_Comodos/C02_Leitura/01_Dominio/modulos/MOD-C02-01_LEITURA_E_ADAPTACAO/NOTA_DE_RESPONSABILIDADE.md)
- **Arquivo de origem (link para o disco):** [`Core/Config.js`](../../Core/Config.js)
- **Commit de referência:** `fbb0608e7b98144533628c7f9b773a10505b800d` (`fbb0608`)
- **Data da última sincronização:** 2026-09-13T21:45:02-03:00

## Código-fonte embutido

Verbatim de `Core/Config.js` em `fbb0608`. sha256 do bloco (LF): `07e21c10c2b52687c7dbc845bd7f28abed54a7b6bbe8b8e3971b8aa485b4c016` — 68 linhas.

```javascript
/**
 * Configuracoes Globais do Ecossistema SYNTHEON.
 */
const CONFIG_SYNTHEON = (() => {
  const deepFreeze = obj => {
    Object.getOwnPropertyNames(obj).forEach(prop => {
      const valor = obj[prop];
      if (valor && typeof valor === 'object' && !Object.isFrozen(valor)) {
        deepFreeze(valor);
      }
    });
    return Object.freeze(obj);
  };

  const config = {
    VERSAO: "1.0.0",
    FUSO_HORARIO: "America/Recife",
    DEBUG: false,

    PLANILHAS: {
      OCORRENCIAS_ID: "1S05sTbd3otgjGjrC-YrzHk7dXp7mzzaw_J2lyQ86hOY",
      PECULIO_ID: "1PJnA8d9sf5CNj0-rt3yIxnwS8BEGfqxRvoyOjCtVHNE"
    },

    ABAS: {
      EFETIVO_ALIASES: ["EFETIVO", "Efetivo", "efetivo"],
      MESES_2026: [
        { nome: 'JAN2026', mes: 0, ano: 2026, label: 'JAN' },
        { nome: 'FEV2026', mes: 1, ano: 2026, label: 'FEV' },
        { nome: 'MAR2026', mes: 2, ano: 2026, label: 'MAR' },
        { nome: 'ABR2026', mes: 3, ano: 2026, label: 'ABR' },
        { nome: 'MAI2026', mes: 4, ano: 2026, label: 'MAI' },
        { nome: 'JUN2026', mes: 5, ano: 2026, label: 'JUN' },
        { nome: 'JUL2026', mes: 6, ano: 2026, label: 'JUL' },
        { nome: 'AGO2026', mes: 7, ano: 2026, label: 'AGO' },
        { nome: 'SET2026', mes: 8, ano: 2026, label: 'SET' },
        { nome: 'OUT2026', mes: 9, ano: 2026, label: 'OUT' },
        { nome: 'NOV2026', mes: 10, ano: 2026, label: 'NOV' },
        { nome: 'DEZ2026', mes: 11, ano: 2026, label: 'DEZ' }
      ]
    },

    RELATORIOS: {
      CABECALHO_BG: "#073763",
      CABECALHO_TXT: "#ffffff",
      TOTAL_BG: "#073763",
      TOTAL_TXT: "#ffffff"
    },

    obterIdOcorrencias() {
      return this.PLANILHAS.OCORRENCIAS_ID;
    },

    obterIdPeculio() {
      return this.PLANILHAS.PECULIO_ID;
    }
  };

  // Aliases temporarios para compatibilidade com codigo legado.
  config.RELATORIOS['CABEÇALHO_BG'] = config.RELATORIOS.CABECALHO_BG;
  config.RELATORIOS['CABEÇALHO_TXT'] = config.RELATORIOS.CABECALHO_TXT;

  return deepFreeze(config);
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG_SYNTHEON;
}
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

- Superfície exposta no nível do arquivo (nível global): —
- Membros públicos observados: `obterIdOcorrencias`, `obterIdPeculio`

_Extraído por heurística do gerador (globais de nível arquivo + métodos/accessors de 1º–2º nível). Não substitui a declaração de porta da Planta: confirme no endereço acima._

## Divergência com a Planta declarada

Testes mecânicos executados na geração (commit `fbb0608`, 2026-09-13T21:45:02-03:00):

- OK — T1 endereco existe: NOTA_DE_RESPONSABILIDADE.md do modulo presente
- OK — T3 arquivo presente no commit de referencia (fbb0608:Core/Config.js)
- OK — T4 conteudo em disco identico ao do commit de referencia (sha256 LF)
- OK — T5 espelho anterior sem deriva de codigo (sha256 do bloco == origem)
- OK — T6 endereco declarado no espelho anterior corresponde ao endereco canonico atual
- OK — T7 sem duplicidade: exatamente 1 espelho de leitura declara "Core/Config.js" como origem
- **ACHADO** — T2 artefato NAO declarado no endereco: "Core/Config.js" nao aparece nas NOTAS/capsula de C02_Leitura / MOD-C02-01_LEITURA_E_ADAPTACAO

Veredito mecânico: **1 divergência(s) detectada(s) pelos testes acima**.

Declaração verificada a mão por humano/agente (não derivável automaticamente):

- **Como o endereco foi derivado (nao inventado):** menção em arquivo do próprio endereço; fonte `02_Comodos/C02_Leitura/01_Dominio/modulos/MOD-C02-01_LEITURA_E_ADAPTACAO/CIR-MOD-C02-01_LEITURA_E_ADAPTACAO.canvas`.
- **Ponteiro anterior para elemento PARADO:** o espelho de leitura anterior apontava para `_SUP_158/C00_Governanca_Estrutural/01_Dominio/modulos/MOD-C00-01_INFRAESTRUTURA_CORE`, elemento arquivado no card #158 (sem lastro em nenhuma ref do repo). O endereco acima NAO e uma renomeacao daquele: foi derivado da declaracao do artefato na Planta (medido em `MAPA_ARTEFATO_ENDERECO_162.md`).
- **Divergencia com o espelho anterior:** o espelho antigo declarava o modulo `MOD-C00-01_INFRAESTRUTURA_CORE`; a derivacao atual chega a `C02_Leitura/MOD-C02-01_LEITURA_E_ADAPTACAO`. Divergencia declarada, nao sobrescrita em silencio.
- **Nada foi corrigido no artefato:** o gerador nao altera codigo de produto; o arquivo de origem permanece byte a byte como estava.

## Última verificação (data/commit)

- 2026-09-13T21:45:02-03:00 · commit `fbb0608` · sha256 da origem (LF): `07e21c10c2b52687c7dbc845bd7f28abed54a7b6bbe8b8e3971b8aa485b4c016`
- Reexecutar: `node scripts/downplant/espelho-rico.mjs gerar --endereco C02_Leitura/MOD-C02-01_LEITURA_E_ADAPTACAO --origem Core/Config.js --saida <caminho>`
- Verificar deriva sem regravar: `node scripts/downplant/espelho-rico.mjs verificar --espelho <caminho>`
