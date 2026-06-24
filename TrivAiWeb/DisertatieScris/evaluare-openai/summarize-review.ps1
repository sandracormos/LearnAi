param(
    [string]$ReviewFile = (Join-Path $PSScriptRoot "results\factual-review.csv"),
    [string]$OutputFile = (Join-Path $PSScriptRoot "results\factual-summary.json")
)

$ErrorActionPreference = "Stop"
$rows = @(Import-Csv $ReviewFile)
$allowed = @("Correct", "Incorrect", "Ambiguous", "Pending")
$invalid = @($rows | Where-Object { $_.factualStatus -notin $allowed })
if ($invalid.Count) {
    throw "factualStatus must be one of: $($allowed -join ', ')."
}

$reviewed = @($rows | Where-Object factualStatus -ne "Pending")
$correct = @($rows | Where-Object factualStatus -eq "Correct")
$incorrect = @($rows | Where-Object factualStatus -eq "Incorrect")
$ambiguous = @($rows | Where-Object factualStatus -eq "Ambiguous")
$missingSources = @($reviewed | Where-Object { [string]::IsNullOrWhiteSpace($_.sourceUrl) })

$summary = [pscustomobject]@{
    totalQuestions = $rows.Count
    reviewedQuestions = $reviewed.Count
    pendingQuestions = $rows.Count - $reviewed.Count
    correctQuestions = $correct.Count
    incorrectQuestions = $incorrect.Count
    ambiguousQuestions = $ambiguous.Count
    factualAccuracyPercent = if ($reviewed.Count) { [Math]::Round($correct.Count / $reviewed.Count * 100, 2) } else { $null }
    reviewedRowsMissingSource = $missingSources.Count
    publishable = $rows.Count -eq 50 -and $reviewed.Count -eq 50 -and $missingSources.Count -eq 0
}

$summary | ConvertTo-Json -Depth 5 | Set-Content -Encoding UTF8 $OutputFile
$summary | Format-List

if (-not $summary.publishable) {
    Write-Warning "The factual result is not ready for the dissertation until all 50 rows are reviewed and sourced."
}
