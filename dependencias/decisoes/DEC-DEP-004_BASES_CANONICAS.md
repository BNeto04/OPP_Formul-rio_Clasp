# DEC-DEP-004 — Adotar as bases canonicas (EFETIVO, catalogo PIP, base territorial AIS) por consulta, sem copia

> **Formato:** secao `46.4 Decisao` do metodo canonico (`03_Fundacao/METODO_DOWN_PLANT_PROGRESSIVO_v2.4.md:808-818`),
> com transliteracao ASCII dos rotulos — mesma convencao ja usada nas evidencias §46.5 deste repo.
> **Natureza:** registro **retroativo** do vinculo §31.6. O uso precede este documento.

- **Estado:** VIGENTE
- **Data:** 2026-09-14 (data do registro do vinculo; card **#167**)
- **Localizacao:** `dependencias/DEP-004_ABAS_E_BASES_CANONICAS.md` (registro) · Modulos/Circuitos/Portas na secao
  `Vinculo estrutural (§31.4 / §31.6)` do mesmo arquivo
- **Contexto:** quatro bases governam o dominio — `EFETIVO` (pessoas/antiguidade), catalogo PIP (pontuacao por
  indicador), base territorial AIS (cidade/bairro -> Area Integrada) e o PECULIO (fonte de antiguidade `N`).
  Todas vivem na planilha; o repositorio guarda **o codigo que as consulta** e, no caso da AIS, uma copia
  versionada (`Dominio/tabela_territorial_ais.json`, versao `1.0.0`, publicacao `2026-09-04`).
- **Decisao:** **ADOTAR** (manter) as bases como **consultadas, nunca copiadas**, com uma unica excecao
  declarada: a copia versionada da base AIS, cuja origem sao as portarias oficiais listadas no proprio JSON
  (Portaria SDS 1197/2010, Lei Estadual 14.320/2011 com Anexo Unico alterado pela 14.890/2012, Portaria SDS
  129/2008, Decreto Estadual 26.868/2004).
- **Alternativas:** (a) **construir** base propria de territorio — rejeitada: a base AIS deriva de norma oficial,
  nao de conveniencia tecnica, e ja existe versionada; (b) **construir** espelho proprio de `EFETIVO`/PIP —
  rejeitada: criaria segunda fonte de verdade para dado que a operacao escreve durante o turno; (c) resolver AIS
  por heuristica quando a base nao decide — rejeitada: o metodo de auditoria e **fail-closed**, campo sem base
  fica **pendente de conferencia** e nunca e chutado.
- **Consequencias:** (+) nenhuma duplicidade de verdade; (+) a regra `MULTI_AIS_BAIRRO_EXATO` e o unico criterio de
  determinacao, declarado; (−) a cobertura da base AIS e limitada a Regiao Metropolitana do Recife conforme as
  portarias citadas; (−) bairros fora da cobertura e casos ambiguos ficam pendentes por desenho.
- **Riscos:** ausencia da base -> `MODO_LIMITADO_CATALOGO_PIP`/`CATALOGO_PIP_INDISPONIVEL`; alias solto `PIP`
  lendo a aba errada (fix G01 #117); divergencia de regra de desempate de antiguidade, ja corrigida no #145/#146
  (`ARCA-ANTIGUIDADE-002`: matricula mais antiga, nao menor `N`); nao existe prova de que a copia versionada da
  AIS espelhe o estado atual da planilha.
- **Condicao de revisao:** (1) nova publicacao oficial de territorio que exija a versao `2.x` da base AIS;
  (2) alteracao de schema de `EFETIVO` ou do catalogo PIP; (3) decisao do Proprietario sobre os casos ambiguos e
  multi-AIS. Revisao disparada pelo relatorio do Vigia (§46.14) — o Vigia **nao** substitui a base nem resolve
  pendencia de conferencia.
