# ESPELHO — Metamodelos.js

> [!NOTE] Espelho rico de código (Metodo §46.15) — gerado por `scripts/downplant/espelho-rico.mjs`
> Somente leitura. Não editar à mão: qualquer edição é sobrescrita na próxima geração.
> O código abaixo é cópia verbatim do arquivo de origem no commit declarado; divergência entre o embutido e a origem é deriva (§18.1).
> Regra do sha256 declarado: sha256 do conteúdo **normalizado para LF** (igual ao blob do Git). Em arquivo CRLF com terminador final diferente, ele difere do `sha256sum` dos bytes crus — a comparação de deriva é feita conteúdo-contra-conteúdo.
> Papel desta cópia: CANÔNICA (repositório). O derivado navegável no vault é gerado com as mesmas entradas.

- **Endereço Down Plant:** `C02_Leitura / MOD-C02-01_LEITURA_E_ADAPTACAO` — [NOTA_DE_RESPONSABILIDADE.md](../../02_Comodos/C02_Leitura/01_Dominio/modulos/MOD-C02-01_LEITURA_E_ADAPTACAO/NOTA_DE_RESPONSABILIDADE.md)
- **Arquivo de origem (link para o disco):** [`Config/Metamodelos.js`](../../Config/Metamodelos.js)
- **Commit de referência:** `fbb0608e7b98144533628c7f9b773a10505b800d` (`fbb0608`)
- **Data da última sincronização:** 2026-09-13T21:45:00-03:00

## Código-fonte embutido

Verbatim de `Config/Metamodelos.js` em `fbb0608`. sha256 do bloco (LF): `99b2f36fba8f0f45236c834c4134c1d62c876caacf690fbe9727a775e68819f6` — 67 linhas.

```javascript
/**
 * ARQUIVO: Config/Metamodelos.js
 * PILAR 0: Metamodelo e Catálogo de Estruturas
 * DESCRIÇÃO: Define o catálogo das fontes de dados, informando ao sistema 
 * as capacidades de cada versão e sua cobertura histórica.
 */
const FonteDados = Object.freeze({
  OPP_2026: "OPP_2026",
  OPP_2025: "OPP_2025",
  FIREBASE_OCORRENCIAS: "FIREBASE_OCORRENCIAS"
});

const CatalogoEstruturas = (() => {
  const catalog = {
    [FonteDados.OPP_2026]: {
      versao: "2026",
      adaptador: "Adaptador2026",
      camposObrigatorios: ["MATRICULA", "DATA", "MIKE"],
      camposOpcionais: ["BOE", "NATUREZA", "CIDADE", "BAIRRO", "AIS", "POLICIAL", "GRAD", "PELOTAO"],
      metricasDisponiveis: ["ARMAS", "MACONHA", "COCAINA", "CRACK", "PONTOS_TOTAIS", "PONTOS_FICCAO", "DETIDOS", "APFD", "TCO", "BOC"],
      coberturaHistorica: {
        armas: true,
        maconha: true,
        cocaina: true,
        crack: true,
        pontosTotais: true,
        pontosIndividuais: true,
        detidos: true,
        apfd: true,
        tco: true,
        boc: true
      }
    },
    [FonteDados.OPP_2025]: {
      versao: "2025",
      adaptador: "Adaptador2025",
      camposObrigatorios: ["MATRICULA", "DATA", "MIKE"],
      camposOpcionais: [],
      metricasDisponiveis: [],
      coberturaHistorica: {
        armas: true,
        maconha: false,
        cocaina: false,
        crack: false,
        pontosTotais: true,
        pontosIndividuais: true,
        detidos: true
      }
    }
  };

  const deepFreeze = obj => {
    Object.getOwnPropertyNames(obj).forEach(prop => {
      const valor = obj[prop];
      if (valor && typeof valor === 'object' && !Object.isFrozen(valor)) {
        deepFreeze(valor);
      }
    });
    return Object.freeze(obj);
  };

  return deepFreeze(catalog);
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FonteDados, CatalogoEstruturas };
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

Não aplicável: nenhuma superfície exportada reconhecida no arquivo.

## Divergência com a Planta declarada

Testes mecânicos executados na geração (commit `fbb0608`, 2026-09-13T21:45:00-03:00):

- OK — T1 endereco existe: NOTA_DE_RESPONSABILIDADE.md do modulo presente
- OK — T3 arquivo presente no commit de referencia (fbb0608:Config/Metamodelos.js)
- OK — T4 conteudo em disco identico ao do commit de referencia (sha256 LF)
- OK — T5 espelho anterior sem deriva de codigo (sha256 do bloco == origem)
- OK — T6 endereco declarado no espelho anterior corresponde ao endereco canonico atual
- OK — T7 sem duplicidade: exatamente 1 espelho de leitura declara "Config/Metamodelos.js" como origem
- **ACHADO** — T2 artefato NAO declarado no endereco: "Config/Metamodelos.js" nao aparece nas NOTAS/capsula de C02_Leitura / MOD-C02-01_LEITURA_E_ADAPTACAO

Veredito mecânico: **1 divergência(s) detectada(s) pelos testes acima**.

Declaração verificada a mão por humano/agente (não derivável automaticamente):

- **Como o endereco foi derivado (nao inventado):** menção em arquivo do próprio endereço; fonte `02_Comodos/C02_Leitura/01_Dominio/modulos/MOD-C02-01_LEITURA_E_ADAPTACAO/CIR-MOD-C02-01_LEITURA_E_ADAPTACAO.canvas`.
- **Divergencia com o espelho anterior:** o espelho antigo declarava o modulo `MOD-C03-01_MODELO_DE_OCORRENCIA`; a derivacao atual chega a `C02_Leitura/MOD-C02-01_LEITURA_E_ADAPTACAO`. Divergencia declarada, nao sobrescrita em silencio.
- **Nada foi corrigido no artefato:** o gerador nao altera codigo de produto; o arquivo de origem permanece byte a byte como estava.

## Última verificação (data/commit)

- 2026-09-13T21:45:00-03:00 · commit `fbb0608` · sha256 da origem (LF): `99b2f36fba8f0f45236c834c4134c1d62c876caacf690fbe9727a775e68819f6`
- Reexecutar: `node scripts/downplant/espelho-rico.mjs gerar --endereco C02_Leitura/MOD-C02-01_LEITURA_E_ADAPTACAO --origem Config/Metamodelos.js --saida <caminho>`
- Verificar deriva sem regravar: `node scripts/downplant/espelho-rico.mjs verificar --espelho <caminho>`
