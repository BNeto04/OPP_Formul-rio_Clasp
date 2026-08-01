import os
import re
import sys
import unicodedata
import openpyxl

# Garantir suporte UTF-8 no stdout do Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def remove_accents(input_str):
    nfkd_form = unicodedata.normalize('NFKD', input_str)
    return "".join([c for c in nfkd_form if not unicodedata.combining(c)])

def find_excel_file(search_dir, keywords):
    """
    Localiza um arquivo .xlsx no diretório baseado em palavras-chave normalizadas.
    """
    if not os.path.exists(search_dir):
        return None
    for fname in os.listdir(search_dir):
        if not fname.endswith('.xlsx') or fname.startswith('~$'):
            continue
        fname_norm = remove_accents(fname.upper())
        if all(remove_accents(kw.upper()) in fname_norm for kw in keywords):
            return os.path.join(search_dir, fname)
    return None

def normalize_key_str(val):
    if val is None:
        return ''
    s = str(val).strip()
    if s.endswith('.0'):
        s = s[:-2]
    # Remove tempo em datas se presente
    if ' ' in s and ('-' in s or '/' in s):
        s = s.split(' ')[0]
    return s.upper()

def run_diagnostico():
    downloads_dir = r'C:\Users\Bneto04\Downloads'
    
    file_synth = find_excel_file(downloads_dir, ['SYNTHEON', 'HOMOLOGACAO', 'M06.2'])
    file_gtar = find_excel_file(downloads_dir, ['GTAR', 'TROPA', 'ARMAS', '2026'])

    if not file_synth or not file_gtar:
        print(f"[ERRO] Erro ao localizar arquivos Excel em {downloads_dir}:")
        print(f"   SYNTHEON: {file_synth}")
        print(f"   GTAR: {file_gtar}")
        sys.exit(1)

    print(f"[OK] Arquivo Syntheon: {os.path.basename(file_synth)}")
    print(f"[OK] Arquivo GTAR:     {os.path.basename(file_gtar)}")

    wb_synth = openpyxl.load_workbook(file_synth, data_only=True)
    wb_gtar = openpyxl.load_workbook(file_gtar, data_only=True)

    # 1. Carregar Pecúlio (antiguidade ORD)
    peculio_ws = None
    for sheet_name in wb_gtar.sheetnames:
        name_norm = remove_accents(sheet_name.upper())
        if 'PECULIO' in name_norm or 'EFETIVO' in name_norm:
            peculio_ws = wb_gtar[sheet_name]
            break
    
    if not peculio_ws and 'EFETIVO' in wb_synth.sheetnames:
        peculio_ws = wb_synth['EFETIVO']

    mapa_ord = {}
    mapa_desig_peculio = {}

    if peculio_ws:
        pec_rows = list(peculio_ws.iter_rows(values_only=True))
        col_ord, col_mat, col_desig = -1, -1, -1
        for i, r in enumerate(pec_rows[:30]):
            if not r: continue
            r_str = [remove_accents(normalize_key_str(c)) for c in r]
            for c_i, h in enumerate(r_str):
                if h in ['ORD', 'ORD.', 'N', 'Nº', 'N°', 'ANTIGUIDADE']: col_ord = c_i
                elif h in ['MAT', 'MAT.', 'MATRICULA']: col_mat = c_i
                elif h in ['SUB-UNIDADE', 'DESIGNACAO', 'PELOTAO']: col_desig = c_i
            if col_ord != -1 and col_mat != -1:
                break
        
        if col_ord != -1 and col_mat != -1:
            for r in pec_rows[i+1:]:
                if not r or len(r) <= max(col_ord, col_mat): continue
                val_ord = r[col_ord]
                val_mat = normalize_key_str(r[col_mat]).replace('-', '').replace('.', '')
                val_desig = str(r[col_desig] or '').strip() if col_desig != -1 and len(r) > col_desig else ''
                if val_ord is not None and val_mat:
                    try:
                        mapa_ord[val_mat] = float(val_ord)
                        if val_desig:
                            mapa_desig_peculio[val_mat] = val_desig
                    except: pass

    print(f"[INFO] Peculio: {len(mapa_ord)} militares mapeados por antiguidade.")

    # 2. Processar planilhas mensais
    def processar_mes(sheet_name):
        if sheet_name not in wb_synth.sheetnames:
            return None
        ws = wb_synth[sheet_name]
        rows = list(ws.iter_rows(values_only=True))
        if not rows: return None

        header = [remove_accents(normalize_key_str(c)) for c in rows[0]]

        col_data = header.index('DATA') if 'DATA' in header else 1
        col_mike = header.index('MIKE') if 'MIKE' in header else 4
        col_boe = [i for i, h in enumerate(header) if 'BOE' in h][0] if any('BOE' in h for h in header) else 6
        col_arma_fato = header.index('ARMA') if 'ARMA' in header else 11
        col_desig = [i for i, h in enumerate(header) if 'PELOT' in h or 'DESIG' in h][0]
        col_grad = header.index('GRAD') if 'GRAD' in header else 28
        col_mat = [i for i, h in enumerate(header) if 'MAT' in h or 'MATRICULA' in h][0]
        col_pm = [i for i, h in enumerate(header) if 'POLICIAL' in h or 'NOME' in h][0]
        col_qdt = [i for i, h in enumerate(header) if 'QDT ARMAS' in h or 'QTD ARMAS' in h][0]

        tuneis = {}

        for idx, r in enumerate(rows[1:], start=2):
            if not r or len(r) <= col_data: continue
            d = normalize_key_str(r[col_data])
            m = normalize_key_str(r[col_mike])
            b = normalize_key_str(r[col_boe])
            mat = normalize_key_str(r[col_mat]).replace('-', '').replace('.', '')
            pm = str(r[col_pm] or '').strip()
            grad = str(r[col_grad] or '').strip()
            desig = str(r[col_desig] or '').strip()

            try: af = float(r[col_arma_fato] or 0)
            except: af = 0.0
            try: qdt = float(r[col_qdt] or 0)
            except: qdt = 0.0

            if not d and not m and not b: continue

            # Chave normalizada por DATA|MIKE|BOE
            k = f"{d}|{m}|{b}"
            if k not in tuneis:
                tuneis[k] = {'chave': k, 'data': d, 'mike': m, 'boe': b, 'linhas': []}
            
            tuneis[k]['linhas'].append({
                'linha': idx,
                'matricula': mat,
                'policial': pm,
                'grad': grad,
                'designacao': desig,
                'arma_fato': af,
                'qdt_armas': qdt
            })

        # Filtrar apenas túneis que possuem qualquer arma cadastrada em arma_fato ou qdt_armas
        tuneis_armados = {}
        for k, t in tuneis.items():
            sf = sum(l['arma_fato'] for l in t['linhas'])
            sq = sum(l['qdt_armas'] for l in t['linhas'])
            if sf > 0 or sq > 0:
                tuneis_armados[k] = t

        tot_soma_qdt = 0
        tot_soma_fato = 0
        tot_max_qdt = 0
        tot_prim_qdt = 0
        divergencias_desig = 0

        tabela_tuneis = []

        for k, t in tuneis_armados.items():
            sq = sum(l['qdt_armas'] for l in t['linhas'])
            sf = sum(l['arma_fato'] for l in t['linhas'])
            mq = max(l['qdt_armas'] for l in t['linhas'])
            pq = t['linhas'][0]['qdt_armas']

            tot_soma_qdt += sq
            tot_soma_fato += sf
            tot_max_qdt += mq
            tot_prim_qdt += pq

            # Escolhe o líder pelo menor ORD no Pecúlio
            menor_ord = 999999
            lider = None
            for l in t['linhas']:
                ord_val = mapa_ord.get(l['matricula'], 999999)
                if ord_val < menor_ord:
                    menor_ord = ord_val
                    lider = l
            if not lider:
                lider = t['linhas'][0]

            desig_oc = lider['designacao']
            desig_pec = mapa_desig_peculio.get(lider['matricula'], desig_oc)
            if desig_oc != desig_pec:
                divergencias_desig += 1

            linhas_str = ", ".join(str(l['linha']) for l in t['linhas'])
            tabela_tuneis.append({
                'chave': k,
                'linhas': linhas_str,
                'qtd_pms': len(t['linhas']),
                'arma_fato': sf,
                'qdt_armas_inflado': sq,
                'max_qdt': mq,
                'prim_qdt': pq,
                'lider_nome': lider['policial'],
                'lider_mat': lider['matricula'],
                'lider_ord': menor_ord if menor_ord != 999999 else 'N/A',
                'desig_mensal': desig_oc,
                'desig_peculio_atual': desig_pec,
                'diverge': desig_oc != desig_pec
            })

        return {
            'sheet': sheet_name,
            'qtd_tuneis': len(tuneis_armados),
            'soma_qdt_inflado': tot_soma_qdt,
            'soma_arma_fato': tot_soma_fato,
            'max_qdt': tot_max_qdt,
            'prim_qdt': tot_prim_qdt,
            'divergencias_desig': divergencias_desig,
            'tabela': tabela_tuneis
        }

    res_abr = processar_mes('ABR2026')
    res_mai = processar_mes('MAI2026')
    res_jun = processar_mes('JUN2026')

    print("\n========================================================================")
    print("RESULTADOS DO DIAGNOSTICO REAL NORMALIZADO (2o TRIMESTRE)")
    print("========================================================================\n")

    for res in [res_abr, res_mai, res_jun]:
        if not res: continue
        print(f"--- MES: {res['sheet']} ---")
        print(f"  Tuneis Armados (Chave DATA|MIKE|BOE): {res['qtd_tuneis']}")
        print(f"  1. GXT Inflado Atual (Soma QDT ARMAS por PM): {res['soma_qdt_inflado']}")
        print(f"  2. Soma Coluna ARMA (Fato Fisico Real):       {res['soma_arma_fato']}")
        print(f"  3. Maximo QDT ARMAS no Tunel:                 {res['max_qdt']}")
        print(f"  4. Primeira Linha QDT ARMAS:                  {res['prim_qdt']}\n")

    total_fato = res_abr['soma_arma_fato'] + res_mai['soma_arma_fato'] + res_jun['soma_arma_fato']
    total_inflado = res_abr['soma_qdt_inflado'] + res_mai['soma_qdt_inflado'] + res_jun['soma_qdt_inflado']

    print("========================================================================")
    print(f"TOTAL 2o TRIMESTRE:")
    print(f"  Target Baseline Historico: 88.0 armas (Abril 40 + Maio 27 + Junho 21)")
    print(f"  GXT Inflado Atual:          {total_inflado} armas (+{total_inflado - 88} infladas)")
    print(f"  Fato Fisico Coluna ARMA:    {total_fato} armas (Abril {res_abr['soma_arma_fato']} + Maio {res_mai['soma_arma_fato']} + Junho {res_jun['soma_arma_fato']})")
    print("========================================================================\n")

    # Detalhamento de Junho para isolar a diferença de 22 vs 21
    print("DETALHAMENTO DE JUNHO DE 2026 (ISOLAMENTO DE FATOS):")
    for t in res_jun['tabela']:
        print(f"  Tunel: {t['chave']} | Linhas: {t['linhas']} | Fato Fisico: {t['arma_fato']} | QDT Inflado: {t['qdt_armas_inflado']} | Lider: {t['lider_nome']} ({t['desig_mensal']})")

if __name__ == '__main__':
    run_diagnostico()
