# ESPELHO — DialogGxtSelecaoLivre.html

> [!NOTE] Espelho rico de código (Metodo §46.15) — gerado por `scripts/downplant/espelho-rico.mjs`
> Somente leitura. Não editar à mão: qualquer edição é sobrescrita na próxima geração.
> O código abaixo é cópia verbatim do arquivo de origem no commit declarado; divergência entre o embutido e a origem é deriva (§18.1).
> Regra do sha256 declarado: sha256 do conteúdo **normalizado para LF** (igual ao blob do Git). Em arquivo CRLF com terminador final diferente, ele difere do `sha256sum` dos bytes crus — a comparação de deriva é feita conteúdo-contra-conteúdo.
> Papel desta cópia: CANÔNICA (repositório). O derivado navegável no vault é gerado com as mesmas entradas.

- **Endereço Down Plant:** `C06_Relatorios / MOD-C06-02_MERITO_DE_ARMAS_GXT` — [NOTA_DE_RESPONSABILIDADE.md](../../02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-02_MERITO_DE_ARMAS_GXT/NOTA_DE_RESPONSABILIDADE.md)
- **Arquivo de origem (link para o disco):** [`Entrada/DialogGxtSelecaoLivre.html`](../../Entrada/DialogGxtSelecaoLivre.html)
- **Commit de referência:** `fbb0608e7b98144533628c7f9b773a10505b800d` (`fbb0608`)
- **Data da última sincronização:** 2026-09-13T21:45:26-03:00

## Código-fonte embutido

Verbatim de `Entrada/DialogGxtSelecaoLivre.html` em `fbb0608`. sha256 do bloco (LF): `7b4a73e2b011f5144fc51b13342d88df182a10228979bbe95c76319c7705b569` — 58 linhas.

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <base target="_top">
    <style>
      body { font-family: Arial, sans-serif; padding: 18px; color: #111827; }
      h3 { margin: 0 0 6px; font-size: 17px; }
      p { margin: 0 0 14px; color: #4b5563; font-size: 13px; line-height: 1.35; }
      .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 14px; }
      .mes { display: flex; align-items: center; gap: 7px; border: 1px solid #d1d5db; border-radius: 6px; padding: 8px; cursor: pointer; }
      .mes:hover { background: #f3f4f6; }
      .actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 12px; }
      button { border: 0; border-radius: 6px; padding: 8px 12px; font-weight: 700; cursor: pointer; }
      .secondary { background: #e5e7eb; color: #111827; }
      .primary { background: #073763; color: white; }
    </style>
  </head>
  <body>
    <h3>Gxt - Relatório Trimestral de Mérito</h3>
    <p>Selecione os meses para compilar o relatório acumulado por armas.</p>
    <div class="grid">
      <label class="mes"><input type="checkbox" name="mes" value="JAN2026"> JAN</label>
      <label class="mes"><input type="checkbox" name="mes" value="FEV2026"> FEV</label>
      <label class="mes"><input type="checkbox" name="mes" value="MAR2026"> MAR</label>
      <label class="mes"><input type="checkbox" name="mes" value="ABR2026"> ABR</label>
      <label class="mes"><input type="checkbox" name="mes" value="MAI2026"> MAI</label>
      <label class="mes"><input type="checkbox" name="mes" value="JUN2026"> JUN</label>
      <label class="mes"><input type="checkbox" name="mes" value="JUL2026"> JUL</label>
      <label class="mes"><input type="checkbox" name="mes" value="AGO2026"> AGO</label>
      <label class="mes"><input type="checkbox" name="mes" value="SET2026"> SET</label>
      <label class="mes"><input type="checkbox" name="mes" value="OUT2026"> OUT</label>
      <label class="mes"><input type="checkbox" name="mes" value="NOV2026"> NOV</label>
      <label class="mes"><input type="checkbox" name="mes" value="DEZ2026"> DEZ</label>
    </div>
    <div class="actions">
      <button class="secondary" onclick="marcarTodos()">Todos</button>
      <button class="secondary" onclick="google.script.host.close()">Cancelar</button>
      <button class="primary" onclick="gerar()">Gerar</button>
    </div>
    <script>
      function marcarTodos() {
        document.querySelectorAll('input[name="mes"]').forEach(cb => cb.checked = true);
      }
      function gerar() {
        const selecionados = Array.from(document.querySelectorAll('input[name="mes"]:checked')).map(cb => cb.value);
        if (selecionados.length === 0) {
          alert('Selecione pelo menos um mês.');
          return;
        }
        google.script.run
          .withSuccessHandler(() => google.script.host.close())
          .withFailureHandler(err => alert('Erro: ' + err.message))
          .gerarGxtSelecaoLivre(selecionados);
      }
    </script>
  </body>
</html>
```

## Responsabilidade observada

Fonte: `02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-02_MERITO_DE_ARMAS_GXT/MOD-C06-02_MERITO_DE_ARMAS_GXT.md` — CAPSULA do modulo (formato 46.2), "## Responsabilidade".

Gerar as **listas de apreensao de armas** por `P3 -> Armas -> Selecao Livre` e `Armas -> Anual` - o rateio de
produtividade de armas por PEL/GTAR a partir das armas fisicas do tunel, com a cor de cada faixa.

Fonte: `02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-02_MERITO_DE_ARMAS_GXT/MOD-C06-02_MERITO_DE_ARMAS_GXT.md` — CAPSULA do modulo (formato 46.2), "## Limites".

- **Nao inventa arma:** a fonte e `ARMA` (fisica, uma por linha); `QDT ARMAS` e participacao e **nao** entra no
  calculo (o proprio compilador lia a coluna errada - defeito real corrigido em `1b2c0ae`).
- **Nao decide a regra sozinho:** as regras embutidas foram **inferidas e registradas** (`Dominio/ARCA/REGRAS_ARMAS_INFERIDAS.md`);
  o que o proprietario ditou (R2/R6/R10) foi implementado no `be68de8`.
- **Nao altera relatorios consagrados** ao gerar as listas.

## Portas expostas (se aplicável)

Não aplicável: nenhuma superfície exportada reconhecida no arquivo.

## Divergência com a Planta declarada

Testes mecânicos executados na geração (commit `fbb0608`, 2026-09-13T21:45:26-03:00):

- OK — T1 endereco existe: NOTA_DE_RESPONSABILIDADE.md do modulo presente
- OK — T2 artefato declarado no endereco: "Entrada/DialogGxtSelecaoLivre.html" aparece na Planta
- OK — T3 arquivo presente no commit de referencia (fbb0608:Entrada/DialogGxtSelecaoLivre.html)
- OK — T4 conteudo em disco identico ao do commit de referencia (sha256 LF)
- OK — T5 espelho anterior sem deriva de codigo (sha256 do bloco == origem)
- OK — T6 endereco declarado no espelho anterior corresponde ao endereco canonico atual
- OK — T7 sem duplicidade: exatamente 1 espelho de leitura declara "Entrada/DialogGxtSelecaoLivre.html" como origem

Veredito mecânico: **nenhuma divergência detectada pelos testes acima**.

Declaração verificada a mão por humano/agente (não derivável automaticamente):

- **Como o endereco foi derivado (nao inventado):** secao Artefatos; fonte `02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-02_MERITO_DE_ARMAS_GXT/MOD-C06-02_MERITO_DE_ARMAS_GXT.md`:63.
- **Divergencia com o espelho anterior:** o espelho antigo declarava o modulo `MOD-C01-01_FORMULARIO_E_MENUS`; a derivacao atual chega a `C06_Relatorios/MOD-C06-02_MERITO_DE_ARMAS_GXT`. Divergencia declarada, nao sobrescrita em silencio.
- **Nada foi corrigido no artefato:** o gerador nao altera codigo de produto; o arquivo de origem permanece byte a byte como estava.

## Última verificação (data/commit)

- 2026-09-13T21:45:26-03:00 · commit `fbb0608` · sha256 da origem (LF): `7b4a73e2b011f5144fc51b13342d88df182a10228979bbe95c76319c7705b569`
- Reexecutar: `node scripts/downplant/espelho-rico.mjs gerar --endereco C06_Relatorios/MOD-C06-02_MERITO_DE_ARMAS_GXT --origem Entrada/DialogGxtSelecaoLivre.html --saida <caminho>`
- Verificar deriva sem regravar: `node scripts/downplant/espelho-rico.mjs verificar --espelho <caminho>`
