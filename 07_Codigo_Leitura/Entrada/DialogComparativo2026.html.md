# ESPELHO — DialogComparativo2026.html

> [!NOTE] Espelho rico de código (Metodo §46.15) — gerado por `scripts/downplant/espelho-rico.mjs`
> Somente leitura. Não editar à mão: qualquer edição é sobrescrita na próxima geração.
> O código abaixo é cópia verbatim do arquivo de origem no commit declarado; divergência entre o embutido e a origem é deriva (§18.1).
> Regra do sha256 declarado: sha256 do conteúdo **normalizado para LF** (igual ao blob do Git). Em arquivo CRLF com terminador final diferente, ele difere do `sha256sum` dos bytes crus — a comparação de deriva é feita conteúdo-contra-conteúdo.
> Papel desta cópia: CANÔNICA (repositório). O derivado navegável no vault é gerado com as mesmas entradas.

- **Endereço Down Plant:** `C06_Relatorios / MOD-C06-01_RELATORIOS_OFICIAIS` — [NOTA_DE_RESPONSABILIDADE.md](../../02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-01_RELATORIOS_OFICIAIS/NOTA_DE_RESPONSABILIDADE.md)
- **Arquivo de origem (link para o disco):** [`Entrada/DialogComparativo2026.html`](../../Entrada/DialogComparativo2026.html)
- **Commit de referência:** `fbb0608e7b98144533628c7f9b773a10505b800d` (`fbb0608`)
- **Data da última sincronização:** 2026-09-13T21:45:25-03:00

## Código-fonte embutido

Verbatim de `Entrada/DialogComparativo2026.html` em `fbb0608`. sha256 do bloco (LF): `6960639b1511551f6af59ffb0d0dae3bceb43ebf21b4d70c186be0e52b4f7820` — 45 linhas.

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
      .primary { background: #064e3b; color: white; }
    </style>
  </head>
  <body>
    <h3>Produtividade / Comparativo 2026</h3>
    <p>Selecione um ou mais meses. Para bimestre ou trimestre, marque os meses desejados.</p>
    <div class="grid"><?!= opcoes ?></div>
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
          alert('Selecione pelo menos um mes.');
          return;
        }
        google.script.run
          .withSuccessHandler(() => google.script.host.close())
          .withFailureHandler(err => alert('Erro: ' + err.message))
          .processarComparativo2026Selecionado(selecionados);
      }
    </script>
  </body>
</html>
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

Não aplicável: nenhuma superfície exportada reconhecida no arquivo.

## Divergência com a Planta declarada

Testes mecânicos executados na geração (commit `fbb0608`, 2026-09-13T21:45:25-03:00):

- OK — T1 endereco existe: NOTA_DE_RESPONSABILIDADE.md do modulo presente
- OK — T2 artefato declarado no endereco: "Entrada/DialogComparativo2026.html" aparece na Planta
- OK — T3 arquivo presente no commit de referencia (fbb0608:Entrada/DialogComparativo2026.html)
- OK — T4 conteudo em disco identico ao do commit de referencia (sha256 LF)
- OK — T5 espelho anterior sem deriva de codigo (sha256 do bloco == origem)
- OK — T6 endereco declarado no espelho anterior corresponde ao endereco canonico atual
- OK — T7 sem duplicidade: exatamente 1 espelho de leitura declara "Entrada/DialogComparativo2026.html" como origem

Veredito mecânico: **nenhuma divergência detectada pelos testes acima**.

Declaração verificada a mão por humano/agente (não derivável automaticamente):

- **Como o endereco foi derivado (nao inventado):** secao Artefatos; fonte `02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-01_RELATORIOS_OFICIAIS/MOD-C06-01_RELATORIOS_OFICIAIS.md`:61.
- **Divergencia com o espelho anterior:** o espelho antigo declarava o modulo `MOD-C01-01_FORMULARIO_E_MENUS`; a derivacao atual chega a `C06_Relatorios/MOD-C06-01_RELATORIOS_OFICIAIS`. Divergencia declarada, nao sobrescrita em silencio.
- **Nada foi corrigido no artefato:** o gerador nao altera codigo de produto; o arquivo de origem permanece byte a byte como estava.

## Última verificação (data/commit)

- 2026-09-13T21:45:25-03:00 · commit `fbb0608` · sha256 da origem (LF): `6960639b1511551f6af59ffb0d0dae3bceb43ebf21b4d70c186be0e52b4f7820`
- Reexecutar: `node scripts/downplant/espelho-rico.mjs gerar --endereco C06_Relatorios/MOD-C06-01_RELATORIOS_OFICIAIS --origem Entrada/DialogComparativo2026.html --saida <caminho>`
- Verificar deriva sem regravar: `node scripts/downplant/espelho-rico.mjs verificar --espelho <caminho>`
