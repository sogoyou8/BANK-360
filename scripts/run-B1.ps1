# BANK 360 B1 — Windows: execution sur source UCI officielle + controles.
# Aucun deploiement, aucune publication, aucun envoi des donnees.
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $PSScriptRoot)

function Invoke-Checked($label, $arguments) {
    Write-Host "`n[$label]" -ForegroundColor Cyan
    & python @arguments
    if ($LASTEXITCODE -ne 0) { throw "$label a echoue (code $LASTEXITCODE)" }
}
Invoke-Checked 'Dependances XLS UCI' @('-m','pip','install','-r','requirements-uci.txt')
Invoke-Checked 'Acquisition + ingestion source UCI officielle' @('-m','bank360','run','--source','official')
Invoke-Checked 'Audit qualite SQL' @('-m','bank360','validate')
Invoke-Checked 'Tests automatises' @('-m','unittest','discover','-s','tests','-v')
Write-Host "`nB1 UCI VALIDEE - Consulter reports/B1-quality-report.json" -ForegroundColor Green
