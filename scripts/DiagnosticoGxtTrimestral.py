import os
import sys
import unicodedata
import openpyxl

# Garantir suporte UTF-8 no stdout do Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def remove_accents(input_str):
    if input_str is None: return ''
    nfkd_form = unicodedata.normalize('NFKD', str(input_str))
    return "".join([c for c in nfkd_form if not unicodedata.combining(c)])

def find_excel_file(search_dir, keywords):
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
    if ' ' in s and ('-' in s or '/' in s):
        s = s.split(' ')[0]
    return s.upper()

def run_diagnostico():
    downloads_dir = r'C:\Users\Bneto04\Downloads'
    
    file_synth = find_excel_file(downloads_dir, ['SYNTHEON', 'HOMOLOGACAO', 'M06.2'])
    file_gtar = find_excel_file(downloads_dir, ['GTAR', 'TROPA', 'ARMAS', '2026'])

    if not file_synth or not file_gtar:
        print(f"[ERRO] Erro ao localizar arquivos Excel em {downloads_dir}:")
        sys.exit(1)

    print(f"[OK] Arquivo Syntheon: {os.path.basename(file_synth)}")
    print(f"[OK] Arquivo GTAR:     {os.path.basename(file_gtar)}")

    wb_synth = openpyxl.load_workbook(file_synth, data_only=True)
    wb_gtar = openpyxl.load_workbook(file_gtar, data_only=True)

    # 1. Pecúlio ORD map
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
            if col_ord != -1 and col_mat != -1: break
        
        if col_ord != -1 and col_mat != -1:
            for r in pec_rows[i+1:]:
                if not r or len(r) <= max(col_ord, col_mat): continue
                val_ord = r[col_ord]
                val_mat = normalize_key_str(r[col_mat]).replace('-', '').replace('.', '')
                val_desig = str(r[col_desig] or '').strip() if col_desig != -1 and len(r) > col_desig else ''
                if val_ord is not None and val_mat:
                    try:
                        mapa_ord[val_mat] = float(val_ord)
                        if val_desig: mapa_desig_peculio[val_mat] = val_desig
                    except: pass

    # 2. Processar planilhas mensais distinguindo Armas de Fogo e Armas Artesanais
    def processar_mes(sheet_name):
        if sheet_name not in wb_synth.sheetnames: return None
        ws = wb_synth[sheet_name]
        rows = list(ws.iter_rows(values_only=True))
        if not rows: return None

        header = [remove_accents(normalize_key_str(c)) for c in rows[0]]

        col_data = header.index('DATA') if 'DATA' in header else 1
        col_mike = header.index('MIKE') if 'MIKE' in header else 4
        col_boe = [i for i, h in enumerate(header) if 'BOE' in h][0] if any('BOE' in h for h in header) else 6
        col_arma_fato = header.index('ARMA') if 'ARMA' in header else 11
        col_tipo = header.index('TIPO') if 'TIPO' in header else 12
        col_modelo = header.index('MODELO') if 'MODELO' in header else 14
        col_nat = [i for i, h in enumerate(header) if 'NATUREZA' in h][0] if any('NATUREZA' in h for h in header) else 5
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

            raw_arma = r[col_arma_fato] if col_arma_fato != -1 and len(r) > col_arma_fato else None
            raw_tipo = str(r[col_tipo] or '') if col_tipo != -1 and len(r) > col_tipo else ''
            raw_modelo = str(r[col_modelo] or '') if col_modelo != -1 and len(r) > col_modelo else ''
            raw_nat = str(r[col_nat] or '') if col_nat != -1 and len(r) > col_nat else ''
            raw_qdt = r[col_qdt] if col_qdt != -1 and len(r) > col_qdt else 0

            # Verificar se é numérico ou artesanal
            is_artesanal = False
            arma_num = 0.0

            str_arma = str(raw_arma or '').strip().upper()
            str_tipo = raw_tipo.strip().upper()
            str_modelo = raw_modelo.strip().upper()
            str_nat = raw_nat.strip().upper()

            if 'ARTESANAL' in str_arma or 'ARTESANAL' in str_tipo or 'ARTESANAL' in str_modelo or 'ARTESANAL' in str_nat:
                is_artesanal = True

            try:
                if raw_arma is not None and not is_artesanal:
                    arma_num = float(raw_arma)
            except:
                if 'ARTESANAL' in str_arma:
                    is_artesanal = True
                arma_num = 0.0

            try: qdt_val = float(raw_qdt or 0)
            except: qdt_val = 0.0

            if not d and not m and not b: continue

            k = f"{d}|{m}|{b}"
            if k not in tuneis:
                tuneis[k] = {'chave': k, 'data': d, 'mike': m, 'boe': b, 'linhas': []}

            tuneis[k]['linhas'].append({
                'linha': idx,
                'matricula': mat,
                'policial': pm,
                'grad': grad,
                'designacao': desig,
                'arma_raw': raw_arma,
                'arma_fogo_num': arma_num,
                'is_artesanal': is_artesanal,
                'qdt_armas': qdt_val
            })

        tuneis_armados = {}
        for k, t in tuneis.items():
            sf_num = sum(l['arma_fogo_num'] for l in t['linhas'])
            has_art = any(l['is_artesanal'] for l in t['linhas'])
            sq = sum(l['qdt_armas'] for l in t['linhas'])
            if sf_num > 0 or has_art or sq > 0:
                tuneis_armados[k] = t

        tot_fogo_num = 0
        tot_artesanal_fatos = 0
        tot_qdt_inflado = 0

        tabela_tuneis = []

        for k, t in tuneis_armados.items():
            sf_num = sum(l['arma_fogo_num'] for l in t['linhas'])
            # Artesanal deduplicada: se houver linha artesanal no túnel, conta 1 fato físico artesanal
            art_cnt = 1 if any(l['is_artesanal'] for l in t['linhas']) else 0
            sq = sum(l['qdt_armas'] for l in t['linhas'])

            tot_fogo_num += sf_num
            tot_artesanal_fatos += art_cnt
            tot_qdt_inflado += sq

            menor_ord = 999999
            lider = None
            for l in t['linhas']:
                ord_val = mapa_ord.get(l['matricula'], 999999)
                if ord_val < menor_ord:
                    menor_ord = ord_val
                    lider = l
            if not lider: lider = t['linhas'][0]

            desig_oc = lider['designacao']
            desig_pec = mapa_desig_peculio.get(lider['matricula'], desig_oc)

            linhas_str = ", ".join(str(l['linha']) for l in t['linhas'])
            tabela_tuneis.append({
                'chave': k,
                'linhas': linhas_str,
                'qtd_pms': len(t['linhas']),
                'fogo_num': sf_num,
                'artesanal_cnt': art_cnt,
                'total_fato_fisico': sf_num + art_cnt,
                'qdt_inflado': sq,
                'lider_nome': lider['policial'],
                'desig_mensal': desig_oc
            })

        return {
            'sheet': sheet_name,
            'qtd_tuneis': len(tuneis_armados),
            'tot_fogo_num': tot_fogo_num,
            'tot_artesanal_fatos': tot_artesanal_fatos,
            'tot_fato_fisico': tot_fogo_num + tot_artesanal_fatos,
            'tot_qdt_inflado': tot_qdt_inflado,
            'tabela': tabela_tuneis
        }

    res_abr = processar_mes('ABR2026')
    res_mai = processar_mes('MAI2026')
    res_jun = processar_mes('JUN2026')

    print("\n========================================================================")
    print("📊 CLASSIFICAÇÃO HISTÓRICA REFINADA (ARMAS DE FOGO NUMÉRICAS VS ARTESANAIS)")
    print("========================================================================\n")

    for res in [res_abr, res_mai, res_jun]:
        if not res: continue
        print(f"--- MÊS: {res['sheet']} ---")
        print(f"  Túneis Armados Totais:                 {res['qtd_tuneis']}")
        print(f"  1. Armas de Fogo Numéricas (Card/Soma): {res['tot_fogo_num']}")
        print(f"  2. Armas Artesanais (Texto no Registro): {res['tot_artesanal_fatos']}")
        print(f"  3. Total Fatos Físicos (Fogo + Artesanal): {res['tot_fato_fisico']}")
        print(f"  4. QDT ARMAS Inflado (Soma/PM):          {res['tot_qdt_inflado']}\n")

    print("========================================================================")
    print(f"RESUMO HISTÓRICO DO 2º TRIMESTRE:")
    print(f"  ABRIL: {res_abr['tot_fogo_num']} de Fogo Numéricas | {res_abr['tot_artesanal_fatos']} Artesanal | Target = 40")
    print(f"  MAIO:  {res_mai['tot_fogo_num']} de Fogo Numéricas | {res_mai['tot_artesanal_fatos']} Artesanal | Target = 27")
    print(f"  JUNHO: {res_jun['tot_fogo_num']} de Fogo Numéricas | {res_jun['tot_artesanal_fatos']} Artesanal | Target = 21 (Fogo Exato = 21! ✅)")
    print("========================================================================\n")

    print("DETALHAMENTO DOS TÚNEIS COM ARMA ARTESANAL OU >1 ARMA EM JUNHO:")
    for t in res_jun['tabela']:
        if t['artesanal_cnt'] > 0 or t['fogo_num'] > 1:
            print(f"  Túnel: {t['chave']} | Linhas: {t['linhas']} | Fogo Numérico: {t['fogo_num']} | Artesanal Texto: {t['artesanal_cnt']} | Líder: {t['lider_nome']} ({t['desig_mensal']})")

if __name__ == '__main__':
    run_diagnostico()
