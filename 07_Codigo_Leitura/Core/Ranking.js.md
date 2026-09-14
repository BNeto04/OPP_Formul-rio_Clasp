# ESPELHO — Ranking.js

> [!NOTE] Espelho rico de código (Metodo §46.15) — gerado por `scripts/downplant/espelho-rico.mjs`
> Somente leitura. Não editar à mão: qualquer edição é sobrescrita na próxima geração.
> O código abaixo é cópia verbatim do arquivo de origem no commit declarado; divergência entre o embutido e a origem é deriva (§18.1).
> Regra do sha256 declarado: sha256 do conteúdo **normalizado para LF** (igual ao blob do Git). Em arquivo CRLF com terminador final diferente, ele difere do `sha256sum` dos bytes crus — a comparação de deriva é feita conteúdo-contra-conteúdo.
> Papel desta cópia: CANÔNICA (repositório). O derivado navegável no vault é gerado com as mesmas entradas.

- **Endereço Down Plant:** `C04_Motor / MOD-C04-01_MOTOR_ANALITICO` — [NOTA_DE_RESPONSABILIDADE.md](../../02_Comodos/C04_Motor/01_Dominio/modulos/MOD-C04-01_MOTOR_ANALITICO/NOTA_DE_RESPONSABILIDADE.md)
- **Arquivo de origem (link para o disco):** [`Core/Ranking.js`](../../Core/Ranking.js)
- **Commit de referência:** `fbb0608e7b98144533628c7f9b773a10505b800d` (`fbb0608`)
- **Data da última sincronização:** 2026-09-13T21:45:09-03:00

## Código-fonte embutido

Verbatim de `Core/Ranking.js` em `fbb0608`. sha256 do bloco (LF): `8bb21de72694a3d48c419eb75a6ce80ad774b098f5ec6d14d47088c23b700336` — 58 linhas.

```javascript
/**
 * Motor de classificação e ranqueamento parametrizado do ecossistema SYNTHÉON.
 */
const SyntheonRanking = {
  /**
   * Ordena e classifica a lista de produtividade de acordo com critérios fornecidos.
   * @param {Object} produtividade - Mapa retornado por SyntheonMetricas.
   * @param {Array<string>} criterios - Vetor ordenado de critérios (ex: ['PONTOS', 'OCORRENCIAS', 'ARMAS', 'DROGAS']).
   * @return {Array<Object>} Lista ranqueada com o atributo 'rank' (1-based).
   */
  gerarRanking(produtividade, criterios) {
    const lista = Object.values(produtividade);

    lista.sort((a, b) => {
      for (const criterio of criterios) {
        let valA = 0;
        let valB = 0;

        switch (criterio) {
          case 'PONTOS':
            // Pontos acumulados (PIP ou CPM)
            valA = (a.indicadores && a.indicadores.pontosPIP !== undefined) ? a.indicadores.pontosPIP : (a.pontosPIP || 0);
            valB = (b.indicadores && b.indicadores.pontosPIP !== undefined) ? b.indicadores.pontosPIP : (b.pontosPIP || 0);
            break;
          case 'OCORRENCIAS':
            valA = (a.fatos && a.fatos.ocorrencias !== undefined) ? a.fatos.ocorrencias : (a.ocorrencias || 0);
            valB = (b.fatos && b.fatos.ocorrencias !== undefined) ? b.fatos.ocorrencias : (b.ocorrencias || 0);
            break;
          case 'ARMAS':
            valA = (a.fatos && a.fatos.armas !== undefined) ? a.fatos.armas : (a.armas || 0);
            valB = (b.fatos && b.fatos.armas !== undefined) ? b.fatos.armas : (b.armas || 0);
            break;
          case 'DROGAS':
            valA = (a.fatos && a.fatos.drogasTotal !== undefined) ? a.fatos.drogasTotal : (a.drogasTotal || 0);
            valB = (b.fatos && b.fatos.drogasTotal !== undefined) ? b.fatos.drogasTotal : (b.drogasTotal || 0);
            break;
          default:
            break;
        }

        if (valB !== valA) {
          return valB - valA; // Ordenação decrescente
        }
      }

      // Desempate padrão por ordem alfabética do nome
      return String(a.nome).localeCompare(String(b.nome), 'pt-BR');
    });

    // Insere o rank numérico
    return lista.map((item, index) => {
      return {
        rank: index + 1,
        ...item
      };
    });
  }
};
```

## Responsabilidade observada

Fonte: `02_Comodos/C04_Motor/01_Dominio/modulos/MOD-C04-01_MOTOR_ANALITICO/MOD-C04-01_MOTOR_ANALITICO.md` — CAPSULA do modulo (formato 46.2), "## Responsabilidade".

Consolidar os fatos canonicos em **Registro Analitico** e calcular o **merito por armas**. Depois da
refatoracao, o Motor e um **orquestrador de plugins**: recebe fatos, dispara o ciclo de vida
(`inicializar -> processar -> finalizar`) e consolida o resultado.

Fonte: `02_Comodos/C04_Motor/01_Dominio/modulos/MOD-C04-01_MOTOR_ANALITICO/MOD-C04-01_MOTOR_ANALITICO.md` — CAPSULA do modulo (formato 46.2), "## Limites".

- **Nao le planilha** e **nao grava**: consome fatos e devolve registros.
- **Nao reimplementa regra de dominio:** as tabelas/limiares vivem na ARCA e em `Core/Constantes.js`.
- **Nao usa `QDT ARMAS` como arma fisica.** `ARMA` e a **fonte exclusiva** de arma de fogo fisica; o
  reconhecimento de artesanal vem de indicadores textuais (`TIPO`/`MODELO`/`ARMA`), nunca de `QDT ARMAS`.
- **Nao infere lideranca por outro criterio:** o merito vai ao militar de **menor `N`** (mais antigo).

## Portas expostas (se aplicável)

- Superfície exposta no nível do arquivo (nível global): `SyntheonRanking`
- Membros públicos observados: `gerarRanking`

_Extraído por heurística do gerador (globais de nível arquivo + métodos/accessors de 1º–2º nível). Não substitui a declaração de porta da Planta: confirme no endereço acima._

## Divergência com a Planta declarada

Testes mecânicos executados na geração (commit `fbb0608`, 2026-09-13T21:45:09-03:00):

- OK — T1 endereco existe: NOTA_DE_RESPONSABILIDADE.md do modulo presente
- OK — T3 arquivo presente no commit de referencia (fbb0608:Core/Ranking.js)
- OK — T4 conteudo em disco identico ao do commit de referencia (sha256 LF)
- OK — T5 espelho anterior sem deriva de codigo (sha256 do bloco == origem)
- OK — T6 endereco declarado no espelho anterior corresponde ao endereco canonico atual
- OK — T7 sem duplicidade: exatamente 1 espelho de leitura declara "Core/Ranking.js" como origem
- **ACHADO** — T2 artefato NAO declarado no endereco: "Core/Ranking.js" nao aparece nas NOTAS/capsula de C04_Motor / MOD-C04-01_MOTOR_ANALITICO

Veredito mecânico: **1 divergência(s) detectada(s) pelos testes acima**.

Declaração verificada a mão por humano/agente (não derivável automaticamente):

- **Como o endereco foi derivado (nao inventado):** menção em arquivo do próprio endereço; fonte `02_Comodos/C04_Motor/01_Dominio/modulos/MOD-C04-01_MOTOR_ANALITICO/CIR-MOD-C04-01_MOTOR_ANALITICO.canvas`.
- **Ponteiro anterior para elemento PARADO:** o espelho de leitura anterior apontava para `_SUP_158/C00_Governanca_Estrutural/01_Dominio/modulos/MOD-C00-01_INFRAESTRUTURA_CORE`, elemento arquivado no card #158 (sem lastro em nenhuma ref do repo). O endereco acima NAO e uma renomeacao daquele: foi derivado da declaracao do artefato na Planta (medido em `MAPA_ARTEFATO_ENDERECO_162.md`).
- **Divergencia com o espelho anterior:** o espelho antigo declarava o modulo `MOD-C00-01_INFRAESTRUTURA_CORE`; a derivacao atual chega a `C04_Motor/MOD-C04-01_MOTOR_ANALITICO`. Divergencia declarada, nao sobrescrita em silencio.
- **Nada foi corrigido no artefato:** o gerador nao altera codigo de produto; o arquivo de origem permanece byte a byte como estava.

## Última verificação (data/commit)

- 2026-09-13T21:45:09-03:00 · commit `fbb0608` · sha256 da origem (LF): `8bb21de72694a3d48c419eb75a6ce80ad774b098f5ec6d14d47088c23b700336`
- Reexecutar: `node scripts/downplant/espelho-rico.mjs gerar --endereco C04_Motor/MOD-C04-01_MOTOR_ANALITICO --origem Core/Ranking.js --saida <caminho>`
- Verificar deriva sem regravar: `node scripts/downplant/espelho-rico.mjs verificar --espelho <caminho>`
