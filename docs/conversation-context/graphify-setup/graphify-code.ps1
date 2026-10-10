# Project-local Graphify entry point; no PATH or activated environment required.
param([Parameter(Position=0, ValueFromRemainingArguments=$true)][string[]]$GraphifyArgs)
$ErrorActionPreference = 'Stop'
$pythonMarker = Join-Path $PSScriptRoot 'graphify-out/.graphify_python'
$graphifyPython = (Get-Content -LiteralPath $pythonMarker -Raw).Trim()
if (-not (Test-Path -LiteralPath $graphifyPython)) { throw "Graphify interpreter missing: $graphifyPython" }
Push-Location -LiteralPath $PSScriptRoot
try {
    if ($GraphifyArgs.Count -gt 0 -and $GraphifyArgs[0] -eq 'refresh') {
        & $graphifyPython -m graphify extract . --code-only --no-cluster --max-workers 4
        if ($LASTEXITCODE -ne 0) { throw 'Code extraction failed' }
        & $graphifyPython -m graphify cluster-only . --no-label --no-viz
        if ($LASTEXITCODE -ne 0) { throw 'Clustering failed' }
        & $graphifyPython '.graphify/finalize.py'
        if ($LASTEXITCODE -ne 0) { throw 'Report generation failed' }
        & $graphifyPython -m graphify export html
        if ($LASTEXITCODE -ne 0) { throw 'HTML export failed' }
    } else {
        & $graphifyPython -m graphify @GraphifyArgs
        if ($LASTEXITCODE -ne 0) { throw "Graphify failed with exit code $LASTEXITCODE" }
    }
} finally { Pop-Location }
