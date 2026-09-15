# DEC-INST-NANO-001 — Nano Task e ferramentas NM-OBS-* como INSTALAÇÃO TRANSVERSAL

> **Formato:** seção `46.4 Decisão` do método canônico (`03_Fundacao/METODO_DOWN_PLANT_PROGRESSIVO_v2.4.md:808-818`),
> com transliteração ASCII dos rótulos — mesma convenção já usada em `dependencias/decisoes/DEC-DEP-*.md`.
> **Natureza:** decisão **ontológica** exigida pelo card **#169** (*"decisão ontológica registrada, não presumida"*).

- **Estado:** VIGENTE
- **Data:** 15/09/2026 (card **#169** / `DP24-006`)
- **Localização:** `02_Comodos/C00_Governanca_Estrutural/03_Especificacoes/INSTALACOES_TRANSVERSAIS/INST-NANO-001_NANO_TASK_E_FERRAMENTAS_DETERMINISTICAS.md`
- **Contexto:** a bancada `dp24-nano-lab` (24/08/2026) entrega contrato de Nano Task (9 blocos), gateway de
  acionamento, caminho seguro e 6 ferramentas determinísticas `NM-OBS-*`. A própria nota do laboratório
  (`ONTOLOGIA_EXPERIMENTAL.md`) declara que *"a infraestrutura não deve ser contada como Nano Máquina sem
  decisão ontológica posterior"* — e o card proíbe presumir a casa.
- **Decisão:** **ADOTAR como INSTALAÇÃO TRANSVERSAL (§8.11)**, colhida para `scripts/dp24-nano/**`, com
  âncora no Cômodo técnico `C00_Governanca_Estrutural` e identificador **INST-NANO-001**.
- **Alternativas:**
  - **(b) Módulo do produto** — **rejeitada**: a bancada é **infraestrutura determinística compartilhada de
    agentes**, não capacidade entregue ao usuário. Tratá-la como Módulo confundiria infraestrutura do
    método/agentes com capacidade funcional do OPP (não há fluxo de operador que a consuma: 0 consumidores
    de produto).
  - **(c) Manter fora do repositório** (só na bancada local) — **rejeitada**: a capacidade ficaria sem
    endereço, sem teste no contador único e sem proveniência — o oposto do axioma §3.10 (localização antes
    da ação).
  - **(d) Reimplementar em JavaScript/Apps Script** para "caber" no produto — **rejeitada**: §31.2 proíbe
    reimplementar capacidade existente, e a bancada não pertence ao produto.
- **Consequências:** (+) a instalação passa a ter endereço, contrato, proveniência por hash e fechadura com
  exit code; (+) os agentes ganham ferramentas determinísticas com autoridade explícita e caminho seguro;
  (+) o produto permanece intocado (nenhuma linha de runtime alterada); (−) cria-se uma **dependência de
  ambiente**: a instalação exige Python 3 — declarada, com falha ruidosa em vez de fallback silencioso.
- **Riscos:** **(R1)** o repositório passa a conter material de duas linguagens (Apps Script/Node + Python);
  mitigação: `scripts/**` está no `.claspignore`, então **nada** da instalação é publicado no Apps Script.
  **(R2)** alguém pode tratar a instalação como capacidade do produto; mitigação: esta DEC + a seção 4 do
  `INST-NANO-001` (consumidores de produto = 0) + a fechadura que exige o documento.
- **Condição de revisão:** se um fluxo de produto passar a consumir a instalação; se o método promover a
  regra de encapsulamento do Circuito (card **#176**) de forma que a bancada passe a ser vista como
  Circuito; ou se o Python deixar de ser ambiente suportado.
