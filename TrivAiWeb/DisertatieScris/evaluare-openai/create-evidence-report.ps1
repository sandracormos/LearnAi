param(
    [string]$ResultsDirectory = (Join-Path $PSScriptRoot "results")
)

$ErrorActionPreference = "Stop"

$automated = Get-Content (Join-Path $ResultsDirectory "automated-summary.json") -Raw | ConvertFrom-Json
$factual = Get-Content (Join-Path $ResultsDirectory "factual-summary.json") -Raw | ConvertFrom-Json
$review = @(Import-Csv (Join-Path $ResultsDirectory "factual-review.csv"))
$raw = Get-Content (Join-Path $ResultsDirectory "raw-results.json") -Raw | ConvertFrom-Json
$commit = (git -C (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path rev-parse HEAD).Trim()

$incorrect = @($review | Where-Object factualStatus -eq "Incorrect")
$ambiguous = @($review | Where-Object factualStatus -eq "Ambiguous")

$lines = [System.Collections.Generic.List[string]]::new()
$lines.Add("# Raport de evidență - evaluarea gpt-4o-mini în LearnAI")
$lines.Add("")
$lines.Add("## Identificarea rulării")
$lines.Add("")
$lines.Add("- Data rulării: $($automated.generatedAt)")
$lines.Add("- Commit Git: ``$commit``")
$lines.Add("- Model configurat: ``$($automated.model)``")
$lines.Add("- Endpoint LearnAI testat: ``$($automated.endpoint)``")
$lines.Add("- Număr planificat de întrebări: $($automated.plannedQuestions)")
$lines.Add("")
$lines.Add("## Metodologie")
$lines.Add("")
$lines.Add("Au fost generate 50 de întrebări prin backend-ul real LearnAI, nu prin răspunsuri simulate. Eșantionul conține cinci categorii: History, Geography, Science, Technology și General Knowledge, cu zece întrebări pentru fiecare categorie. Distribuția pe categorie a fost de patru întrebări Easy, trei Medium și trei Hard. Fiecare categorie a utilizat un lanț Responses API separat, iar întrebările anterioare din același lanț au fost transmise pentru reducerea repetării.")
$lines.Add("")
$lines.Add("Latența reprezintă timpul total observat de client pentru cererea HTTP către backend. Validarea structurală a cerut text și indiciu nenule, exact patru variante nenule și exact o variantă marcată drept corectă. Verificarea factuală a fost realizată separat și fiecare rând din ``factual-review.csv`` conține clasificare, sursă și observație.")
$lines.Add("")
$lines.Add("## Rezultate automate")
$lines.Add("")
$lines.Add("| Metrică | Rezultat |")
$lines.Add("|---|---:|")
$lines.Add("| Cereri reușite | $($automated.successfulRequests) / $($automated.plannedQuestions) |")
$lines.Add("| Cereri eșuate | $($automated.failedRequests) |")
$lines.Add("| Răspunsuri valide structural | $($automated.structurallyValidResponses) / $($automated.plannedQuestions) ($($automated.structuralCompliancePercent)%) |")
$lines.Add("| Latență medie | $($automated.averageLatencySeconds) s |")
$lines.Add("| Latență mediană | $($automated.medianLatencySeconds) s |")
$lines.Add("| Percentila 95 a latenței | $($automated.p95LatencySeconds) s |")
$lines.Add("")
$lines.Add("## Rezultate factuale")
$lines.Add("")
$lines.Add("| Clasificare | Număr | Procent din 50 |")
$lines.Add("|---|---:|---:|")
$lines.Add("| Corecte | $($factual.correctQuestions) | $($factual.factualAccuracyPercent)% |")
$lines.Add("| Incorecte | $($factual.incorrectQuestions) | $([Math]::Round($factual.incorrectQuestions / 50 * 100, 2))% |")
$lines.Add("| Ambigue | $($factual.ambiguousQuestions) | $([Math]::Round($factual.ambiguousQuestions / 50 * 100, 2))% |")
$lines.Add("")
$lines.Add("### Întrebări incorecte")
$lines.Add("")
foreach ($row in $incorrect) {
    $lines.Add("- Întrebarea $($row.questionNumber): $($row.question) - răspuns marcat: $($row.markedCorrectAnswer). $($row.reviewNotes) Sursă: $($row.sourceUrl)")
}
$lines.Add("")
$lines.Add("### Întrebări ambigue")
$lines.Add("")
foreach ($row in $ambiguous) {
    $lines.Add("- Întrebarea $($row.questionNumber): $($row.question) - $($row.reviewNotes) Sursă: $($row.sourceUrl)")
}
$lines.Add("")
$lines.Add("## Fișiere de probă")
$lines.Add("")
$lines.Add("- ``raw-results.json``: răspunsurile complete, variantele, latențele și identificatorii OpenAI.")
$lines.Add("- ``automated-results.csv``: rezultatele automate într-un format tabelar.")
$lines.Add("- ``automated-summary.json``: sumarul latenței și al conformității structurale.")
$lines.Add("- ``factual-review.csv``: toate cele 50 de verificări factuale, cu surse și observații.")
$lines.Add("- ``factual-summary.json``: sumarul verificării factuale.")
$lines.Add("- ``evaluation-table.png``: tabel grafic separat, fără inserare automată în disertație.")
$lines.Add("- ``checksums.sha256``: amprente SHA-256 pentru detectarea modificării fișierelor de probă.")
$lines.Add("")
$lines.Add("## Limitări")
$lines.Add("")
$lines.Add("Rezultatul de $($factual.factualAccuracyPercent)% descrie numai acest eșantion de 50 de întrebări. Nu demonstrează performanța tuturor întrebărilor pe care modelul le poate genera și nu măsoară eficiența pedagogică. Latența depinde de conexiune, încărcarea serviciilor și mediul local.")

$reportPath = Join-Path $ResultsDirectory "evidence-report.md"
$lines | Set-Content -Encoding UTF8 $reportPath

$evidenceFiles = @(
    "raw-results.json",
    "automated-results.csv",
    "automated-summary.json",
    "factual-review.csv",
    "factual-summary.json",
    "evaluation-table.png",
    "evidence-report.md"
)

$checksumLines = foreach ($file in $evidenceFiles) {
    $hash = Get-FileHash (Join-Path $ResultsDirectory $file) -Algorithm SHA256
    "$($hash.Hash.ToLowerInvariant())  $file"
}
$checksumLines | Set-Content -Encoding ASCII (Join-Path $ResultsDirectory "checksums.sha256")

Write-Host "Created $reportPath and checksums.sha256"
