# fix-repo-audit.ps1 — Correção em lote do repo OPP_Formul-rio_Clasp
# Idempotente: pode ser re-executado sem efeitos colaterais.
# Pré-requisito: gh auth login com escopo repo.
#
# Roda em Windows PowerShell 5.1 OU PowerShell Core (pwsh).
# Uso:  powershell -ExecutionPolicy Bypass -File scripts/fix-repo-audit.ps1

$ErrorActionPreference = "Continue"
$REPO = "BNeto04/OPP_Formul-rio_Clasp"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " VERIFICANDO AUTENTICACAO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
gh auth status
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO: gh nao autenticado. Rode: gh auth login" -ForegroundColor Red
    exit 1
}
Write-Host "OK autenticado`n"

# ----------------------------------------------------------
# 1. CRIAR LABELS (idempotente)
# ----------------------------------------------------------
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " [1/6] CRIANDO LABELS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$labels = @(
    @{ name = "tipo:task";    color = "0075ca"; desc = "Card de tarefa executavel" }
    @{ name = "tipo:bug";     color = "d73a4a"; desc = "Correcao de defeito" }
    @{ name = "tipo:adm";     color = "5319e7"; desc = "Governanca e regras administrativas" }
    @{ name = "tipo:teoria";  color = "e4e669"; desc = "Teoria em construcao / laboratorio" }
    @{ name = "tipo:docs";    color = "0e8a16"; desc = "Documentacao e contratos" }
    @{ name = "sprint:c01";   color = "fbca04"; desc = "Sprint C01 - OCR/Form/Sheets" }
    @{ name = "sprint:a01";   color = "f9d0c4"; desc = "Sprint A01 - Multi-Provider Fallbacks" }
    @{ name = "sprint:a02";   color = "c5def5"; desc = "Sprint A02 - Canteiro Agentico GitOps" }
    @{ name = "sprint:h01";   color = "bfdadc"; desc = "Sprint H01 - Colmeia API" }
    @{ name = "sprint:g01";   color = "d4c5f9"; desc = "Sprint G01 - Guardiao Qualidade" }
    @{ name = "sprint:ocr";   color = "fef2c0"; desc = "Frente OCR" }
    @{ name = "sprint:menu";  color = "c2e0c6"; desc = "Frente Menu" }
    @{ name = "P0";           color = "b60205"; desc = "Prioridade critica" }
    @{ name = "P1";           color = "d93f0b"; desc = "Prioridade alta" }
    @{ name = "P2";           color = "e4e669"; desc = "Prioridade media" }
    @{ name = "status:review";  color = "006b75"; desc = "Em revisao / auditoria" }
    @{ name = "status:blocked"; color = "b60205"; desc = "Bloqueado por dependencia" }
)

foreach ($l in $labels) {
    Write-Host "  -> $($l.name)" -NoNewline
    gh label create $l.name --repo $REPO --color $l.color --description $l.desc --force 2>&1 | Out-Null
    Write-Host " ok"
}
Write-Host ""

# ----------------------------------------------------------
# 2. ASSIGNEE EM TODAS AS ISSUES
# ----------------------------------------------------------
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " [2/6] ATRIBUINDO ASSIGNEE (BNeto04)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$allIssues = gh issue list --repo $REPO --state all --json number --limit 200 | ConvertFrom-Json
$total = @($allIssues).Count
$i = 0
foreach ($issue in $allIssues) {
    $i++
    Write-Host "  -> #$($issue.number) ($i/$total)" -NoNewline
    gh issue edit $issue.number --repo $REPO --add-assignee BNeto04 2>&1 | Out-Null
    Write-Host " ok"
}
Write-Host ""

# ----------------------------------------------------------
# 3. DEFAULT BRANCH
# ----------------------------------------------------------
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " [3/6] DEFAULT BRANCH -> sprint/g01-guardiao-qualidade-live-001" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

gh repo edit $REPO --default-branch "sprint/g01-guardiao-qualidade-live-001" 2>&1
Write-Host ""

# ----------------------------------------------------------
# 4. DESCRICAO + TOPICS DO REPO
# ----------------------------------------------------------
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " [4/6] DESCRICAO E TOPICS DO REPO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

gh repo edit $REPO --description "Sistema OCR + Formulario OPP com pontes Telegram/ChatGPT, canteiro agentico GitOps e Colmeia API" --add-topic "ocr,clasp,google-apps-script,fastapi,telegram-bot,agentic,gitops" 2>&1
Write-Host ""

# ----------------------------------------------------------
# 5. #57 e #58: ROTULAR + FIXAR
# ----------------------------------------------------------
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " [5/6] ROTULANDO E FIXANDO #57 e #58" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

gh issue edit 57 --repo $REPO --add-label "tipo:adm" 2>&1
gh issue edit 58 --repo $REPO --add-label "tipo:teoria" 2>&1
gh issue pin 57 --repo $REPO 2>&1
gh issue pin 58 --repo $REPO 2>&1
Write-Host "  -> #57 tipo:adm + pinned ok"
Write-Host "  -> #58 tipo:teoria + pinned ok`n"

# ----------------------------------------------------------
# 6. APLICAR LABELS EM LOTE POR PADRAO DE TITULO
# ----------------------------------------------------------
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " [6/6] APLICANDO LABELS EM LOTE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$allFull = gh issue list --repo $REPO --state all --json number,title --limit 200 | ConvertFrom-Json

foreach ($issue in $allFull) {
    $n = $issue.number
    $t = $issue.title
    $lbls = @()

    if ($t -match "T-C01-|SPRINT-C01|OCR-P3|OCR-ARCA") { $lbls += "sprint:c01" }
    if ($t -match "T-A01-|SPRINT-A01")   { $lbls += "sprint:a01" }
    if ($t -match "T-A02-|SPRINT-A02")   { $lbls += "sprint:a02" }
    if ($t -match "H01-|SPRINT-H01")     { $lbls += "sprint:h01" }
    if ($t -match "G01-|SPRINT-G01|ARCA-GUARD|ARCA-GOV") { $lbls += "sprint:g01" }
    if ($t -match "MENU-P3")             { $lbls += "sprint:menu" }

    if ($t -match "^ADM-")               { $lbls += "tipo:adm" }
    elseif ($t -match "^PROGRAM-")       { $lbls += "tipo:adm" }
    elseif ($t -match "^\[BRIDGE|^\[ANTIGRAVITY|^T-|^H01-") { $lbls += "tipo:task" }
    elseif ($t -match "^SPRINT-")        { $lbls += "tipo:task" }
    elseif ($t -match "^ARCA-GUARD|^ARCA-GOV|^G01-|^MENU-P3|^OCR-") { $lbls += "tipo:task" }

    if ($n -lt 51 -and @($lbls).Count -eq 0) { continue }

    if (@($lbls).Count -gt 0) {
        $labelStr = $lbls -join ","
        Write-Host "  -> #$n [$labelStr]" -NoNewline
        gh issue edit $n --repo $REPO --add-label $labelStr 2>&1 | Out-Null
        Write-Host " ok"
    }
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host " CONCLUIDO - 6/6 acoes executadas" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "Verifique: https://github.com/$REPO`n"
