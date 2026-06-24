param(
    [string]$OutputPath = (Join-Path $PSScriptRoot "results\evaluation-table.png")
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$width = 1600
$height = 640
$rows = @(
    @("Metrică", "Rezultat măsurat"),
    @("Întrebări planificate", "50"),
    @("Cereri reușite", "50 / 50 (100%)"),
    @("Răspunsuri valide structural", "50 / 50 (100%)"),
    @("Corecte factual", "43 / 50 (86%)"),
    @("Incorecte factual", "2 / 50 (4%)"),
    @("Ambigue", "5 / 50 (10%)"),
    @("Latență medie", "2,154 secunde"),
    @("Latență mediană", "2,018 secunde"),
    @("Percentila 95 a latenței", "2,844 secunde")
)

$bitmap = [System.Drawing.Bitmap]::new($width, $height)
$bitmap.SetResolution(220, 220)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

$white = [System.Drawing.Brushes]::White
$headerBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(31, 78, 121))
$alternateBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(235, 242, 248))
$textBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(25, 25, 25))
$gridPen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(100, 116, 139), 2)
$headerFont = [System.Drawing.Font]::new("Arial", 14, [System.Drawing.FontStyle]::Bold)
$bodyFont = [System.Drawing.Font]::new("Arial", 12, [System.Drawing.FontStyle]::Regular)
$bodyBoldFont = [System.Drawing.Font]::new("Arial", 12, [System.Drawing.FontStyle]::Bold)

try {
    $graphics.FillRectangle($white, 0, 0, $width, $height)
    $rowHeight = $height / $rows.Count
    $firstColumnWidth = 980

    for ($index = 0; $index -lt $rows.Count; $index++) {
        $top = [int]($index * $rowHeight)
        $bottom = [int](($index + 1) * $rowHeight)
        $actualHeight = $bottom - $top

        if ($index -eq 0) {
            $graphics.FillRectangle($headerBrush, 0, $top, $width, $actualHeight)
            $font1 = $headerFont
            $font2 = $headerFont
            $brush = $white
        }
        else {
            if ($index % 2 -eq 0) {
                $graphics.FillRectangle($alternateBrush, 0, $top, $width, $actualHeight)
            }
            $font1 = $bodyFont
            $font2 = $bodyBoldFont
            $brush = $textBrush
        }

        $graphics.DrawString($rows[$index][0], $font1, $brush, 24, $top + 10)
        $graphics.DrawString($rows[$index][1], $font2, $brush, $firstColumnWidth + 24, $top + 10)
        $graphics.DrawLine($gridPen, 0, $bottom - 1, $width, $bottom - 1)
    }

    $graphics.DrawRectangle($gridPen, 1, 1, $width - 3, $height - 3)
    $graphics.DrawLine($gridPen, $firstColumnWidth, 0, $firstColumnWidth, $height)

    $directory = Split-Path -Parent $OutputPath
    New-Item -ItemType Directory -Force -Path $directory | Out-Null
    $bitmap.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
}
finally {
    $bodyBoldFont.Dispose()
    $bodyFont.Dispose()
    $headerFont.Dispose()
    $gridPen.Dispose()
    $textBrush.Dispose()
    $alternateBrush.Dispose()
    $headerBrush.Dispose()
    $graphics.Dispose()
    $bitmap.Dispose()
}

Write-Host "Created $OutputPath"
