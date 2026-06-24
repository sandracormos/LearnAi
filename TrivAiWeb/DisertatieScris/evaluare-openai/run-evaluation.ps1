param(
    [string]$BaseUrl = "http://127.0.0.1:5000",
    [string]$OutputDirectory = (Join-Path $PSScriptRoot "results")
)

$ErrorActionPreference = "Stop"

$categories = @("History", "Geography", "Science", "Technology", "General Knowledge")
$difficulties = @("Easy", "Easy", "Easy", "Easy", "Medium", "Medium", "Medium", "Hard", "Hard", "Hard")
$results = [System.Collections.Generic.List[object]]::new()
$endpoint = "$($BaseUrl.TrimEnd('/'))/api/trivia/question"

New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null

$questionNumber = 0
foreach ($category in $categories) {
    $previousQuestions = [System.Collections.Generic.List[string]]::new()
    $previousResponseId = $null

    foreach ($difficulty in $difficulties) {
        $questionNumber++
        $requestBody = @{
            categories = $category
            difficulty = $difficulty
            previousQuestions = @($previousQuestions | Select-Object -Last 10)
            openAiPreviousResponseId = $previousResponseId
        } | ConvertTo-Json -Depth 5

        $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
        try {
            $response = Invoke-RestMethod `
                -Method Post `
                -Uri $endpoint `
                -ContentType "application/json" `
                -Body $requestBody `
                -TimeoutSec 120
            $stopwatch.Stop()

            $answers = @($response.answers)
            $correctAnswers = @($answers | Where-Object { $_.isCorrect -eq $true })
            $structureValid = `
                -not [string]::IsNullOrWhiteSpace([string]$response.questionName) -and `
                -not [string]::IsNullOrWhiteSpace([string]$response.tipForAnsweringQuestion) -and `
                $answers.Count -eq 4 -and `
                $correctAnswers.Count -eq 1 -and `
                @($answers | Where-Object { [string]::IsNullOrWhiteSpace([string]$_.text) }).Count -eq 0

            $result = [pscustomobject]@{
                questionNumber = $questionNumber
                category = $category
                difficulty = $difficulty
                latencySeconds = [Math]::Round($stopwatch.Elapsed.TotalSeconds, 3)
                requestSucceeded = $true
                structureValid = $structureValid
                question = [string]$response.questionName
                hint = [string]$response.tipForAnsweringQuestion
                answers = @($answers | ForEach-Object {
                    [pscustomobject]@{ text = [string]$_.text; isCorrect = [bool]$_.isCorrect }
                })
                correctAnswer = if ($correctAnswers.Count -eq 1) { [string]$correctAnswers[0].text } else { $null }
                openAiResponseId = [string]$response.openAiPreviousResponseId
                error = $null
            }

            if ($structureValid) {
                $previousQuestions.Add([string]$response.questionName)
                $previousResponseId = [string]$response.openAiPreviousResponseId
            }
        }
        catch {
            $stopwatch.Stop()
            $result = [pscustomobject]@{
                questionNumber = $questionNumber
                category = $category
                difficulty = $difficulty
                latencySeconds = [Math]::Round($stopwatch.Elapsed.TotalSeconds, 3)
                requestSucceeded = $false
                structureValid = $false
                question = $null
                hint = $null
                answers = @()
                correctAnswer = $null
                openAiResponseId = $null
                error = $_.Exception.Message
            }
        }

        $results.Add($result)
        Write-Host ("[{0}/50] {1} / {2}: success={3}, structure={4}, latency={5}s" -f `
            $questionNumber, $category, $difficulty, $result.requestSucceeded, $result.structureValid, $result.latencySeconds)
    }
}

$successful = @($results | Where-Object requestSucceeded)
$structurallyValid = @($results | Where-Object structureValid)
$latencies = @($successful | ForEach-Object latencySeconds | Sort-Object)
$averageLatency = if ($latencies.Count) { [Math]::Round(($latencies | Measure-Object -Average).Average, 3) } else { $null }
$medianLatency = if ($latencies.Count) { $latencies[[Math]::Floor(($latencies.Count - 1) * 0.50)] } else { $null }
$p95Latency = if ($latencies.Count) { $latencies[[Math]::Floor(($latencies.Count - 1) * 0.95)] } else { $null }

$summary = [pscustomobject]@{
    generatedAt = (Get-Date).ToString("o")
    endpoint = $endpoint
    model = "gpt-4o-mini"
    plannedQuestions = 50
    successfulRequests = $successful.Count
    failedRequests = 50 - $successful.Count
    structurallyValidResponses = $structurallyValid.Count
    structuralCompliancePercent = [Math]::Round($structurallyValid.Count / 50 * 100, 2)
    averageLatencySeconds = $averageLatency
    medianLatencySeconds = $medianLatency
    p95LatencySeconds = $p95Latency
    factualReviewStatus = "Pending manual verification with cited sources"
}

$rawOutput = [pscustomobject]@{
    methodology = [pscustomobject]@{
        categories = $categories
        difficultyDistributionPerCategory = [pscustomobject]@{ Easy = 4; Medium = 3; Hard = 3 }
        sessionDesign = "Five independent response chains, one per category; ten questions per chain."
        latencyMeasurement = "Client-side elapsed time for each HTTP POST to the LearnAI backend."
        structuralCriteria = "Non-empty question and hint, exactly four non-empty answers, exactly one answer marked correct."
    }
    summary = $summary
    results = $results
}

$rawOutput | ConvertTo-Json -Depth 10 | Set-Content -Encoding UTF8 (Join-Path $OutputDirectory "raw-results.json")
$summary | ConvertTo-Json -Depth 5 | Set-Content -Encoding UTF8 (Join-Path $OutputDirectory "automated-summary.json")

$reviewRows = foreach ($result in $results) {
    [pscustomobject]@{
        questionNumber = $result.questionNumber
        category = $result.category
        difficulty = $result.difficulty
        latencySeconds = $result.latencySeconds
        structureValid = $result.structureValid
        question = $result.question
        answer1 = if ($result.answers.Count -gt 0) { $result.answers[0].text } else { $null }
        answer2 = if ($result.answers.Count -gt 1) { $result.answers[1].text } else { $null }
        answer3 = if ($result.answers.Count -gt 2) { $result.answers[2].text } else { $null }
        answer4 = if ($result.answers.Count -gt 3) { $result.answers[3].text } else { $null }
        markedCorrectAnswer = $result.correctAnswer
        factualStatus = "Pending"
        sourceUrl = ""
        reviewNotes = ""
    }
}

$reviewRows | Export-Csv -NoTypeInformation -Encoding UTF8 (Join-Path $OutputDirectory "factual-review.csv")
$results | Select-Object questionNumber, category, difficulty, latencySeconds, requestSucceeded, structureValid, question, correctAnswer, error |
    Export-Csv -NoTypeInformation -Encoding UTF8 (Join-Path $OutputDirectory "automated-results.csv")

Write-Host "Evaluation completed. Results: $OutputDirectory"
Write-Host ($summary | Format-List | Out-String)
