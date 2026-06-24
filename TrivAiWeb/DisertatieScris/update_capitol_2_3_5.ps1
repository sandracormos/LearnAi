param(
    [string]$Source = "Disertatie.docx",
    [string]$Destination = "Disertatie-revizuita.docx"
)

$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.IO.Compression

$sourcePath = (Resolve-Path $Source).Path
$destinationPath = Join-Path (Split-Path $sourcePath) $Destination
[System.IO.File]::Copy($sourcePath, $destinationPath, $true)

$paragraphs = @(
    "Integrarea inteligenței artificiale în educație nu a început odată cu apariția modelelor generative. Sistemele de tutorat inteligent, evaluarea automată și analiza datelor educaționale sunt cercetate de mai multe decenii. Elementul comun al acestor tehnologii este utilizarea datelor despre activitatea cursantului pentru a oferi sprijin, feedback sau conținut adaptat. Odată cu dezvoltarea modelelor lingvistice de mari dimensiuni, aria de utilizare s-a extins: un sistem poate genera explicații, exemple, întrebări și exerciții într-un limbaj natural, la cerere. Totuși, valoarea educațională nu rezultă numai din utilizarea unei tehnologii avansate, ci din modul în care aceasta este integrată într-un obiectiv pedagogic clar.",

    "O imagine relevantă asupra domeniului este oferită de analiza sistematică realizată de Zawacki-Richter și colaboratorii săi, care a examinat 146 de articole publicate între 2007 și 2018 despre aplicațiile inteligenței artificiale în învățământul superior. Autorii au grupat utilizările identificate în patru categorii principale: profilare și predicție, evaluare, sisteme adaptive și personalizare, respectiv sisteme de tutorat inteligent [7]. Această clasificare arată că inteligența artificială poate interveni în mai multe etape ale procesului educațional: identificarea nevoilor cursantului, alegerea activităților potrivite, furnizarea feedbackului și monitorizarea progresului. Studiul semnalează însă și participarea relativ redusă a educatorilor la cercetarea analizată, ceea ce susține necesitatea unei colaborări mai strânse între specialiștii tehnici și cei din domeniul educației.",

    "Personalizarea reprezintă una dintre cele mai studiate aplicații. Un sistem adaptiv poate ajusta succesiunea exercițiilor, dificultatea sau tipul de feedback în funcție de răspunsurile anterioare. Dovezile referitoare la sistemele de tutorat inteligent sunt în general favorabile, dar trebuie interpretate în raport cu metoda de comparație și contextul educațional. Meta-analiza realizată de Ma, Adesope, Nesbit și Liu a sintetizat 107 efecte, provenite din studii care au inclus în total 14.321 de participanți. Rezultatele au indicat performanțe mai bune ale cursanților care au utilizat sisteme de tutorat inteligent comparativ cu instruirea în grup mare, materialele tipărite și alte forme de instruire asistată de calculator; diferența față de tutoratul uman individual nu a fost semnificativă [8]. În mod similar, Kulik și Fletcher au analizat 50 de evaluări controlate și au constatat că aceste sisteme au produs, în majoritatea cazurilor, rezultate mai bune decât metodele convenționale folosite în grupurile de control [9]. Aceste concluzii nu arată că un sistem AI înlocuiește profesorul, ci că feedbackul imediat și exercițiul adaptat pot completa eficient activitatea didactică.",

    "Inteligența artificială poate sprijini și evaluarea formativă. Răspunsurile la exerciții pot fi analizate imediat, iar utilizatorul poate primi explicații sau recomandări fără a aștepta o evaluare ulterioară. Pentru itemii cu răspuns prestabilit, precum întrebările cu alegere multiplă, verificarea poate fi realizată în mod determinist, ceea ce limitează ambiguitatea notării. În schimb, evaluarea automată a răspunsurilor deschise necesită mai multă prudență, deoarece aprecierea calității argumentării, a creativității sau a contextului poate varia. În astfel de situații, rezultatul produs de AI trebuie tratat drept sprijin pentru evaluare și nu drept decizie incontestabilă.",

    "Modelele lingvistice generative adaugă posibilitatea producerii rapide de conținut educațional. Ele pot formula întrebări, variante de răspuns, indicii și explicații pentru subiecte și niveluri de dificultate diferite. Această capacitate poate reduce timpul necesar construirii unei colecții extinse de exerciții și permite diversificarea activităților. Din perspectivă pedagogică, beneficiul este mai important atunci când materialul generat solicită recuperarea activă a informației și oferă feedback, nu atunci când modelul furnizează pur și simplu răspunsul final. Prin urmare, generarea automată trebuie însoțită de reguli privind structura itemilor, nivelul de dificultate și verificarea rezultatului.",

    "Utilizarea modelelor generative introduce și riscuri specifice. Acestea pot produce afirmații plauzibile, dar factualmente greșite, pot reproduce erori sau prejudecăți din datele de antrenare și pot formula întrebări ambigue. Kasneci și colaboratorii săi arată că modelele lingvistice pot susține personalizarea, feedbackul și crearea materialelor, dar evidențiază concomitent riscuri privind informația incorectă, biasul, dependența excesivă și integritatea evaluării [10]. Într-o aplicație educațională, fluența textului nu trebuie confundată cu validitatea acestuia. Sunt necesare validarea structurii răspunsului, delimitarea domeniului de utilizare, posibilitatea raportării conținutului problematic și, pentru activități cu miză ridicată, verificarea umană a materialului.",

    "Protecția datelor constituie o altă cerință importantă. Personalizarea poate presupune colectarea rezultatelor, a preferințelor și a istoricului de activitate, iar aceste informații trebuie limitate la ceea ce este necesar, stocate în siguranță și prelucrate transparent. Ghidul UNESCO privind inteligența artificială generativă în educație recomandă o abordare centrată pe om, protejarea datelor personale, adecvarea instrumentelor la vârsta utilizatorilor și păstrarea responsabilității umane asupra deciziilor educaționale [11]. În acest cadru, AI are rolul de a extinde posibilitățile profesorului și ale cursantului, nu de a elimina judecata pedagogică sau responsabilitatea instituției.",

    "În cadrul LearnAI, inteligența artificială este utilizată în principal pentru generarea dinamică a întrebărilor de tip quiz, pe baza categoriei și a dificultății selectate. Arhitectura aplicației separă interfața utilizatorului de serviciul de generare: solicitarea este transmisă backend-ului ASP.NET Core, iar cheia API nu este expusă în browser. Răspunsul modelului este prelucrat într-o structură controlată, care conține întrebarea, variantele de răspuns, răspunsul corect și indiciul. Această abordare susține varietatea și personalizarea conținutului, dar nu elimină necesitatea verificării corectitudinii. Pentru o utilizare educațională matură, platforma poate fi extinsă cu mecanisme de raportare, validare prin surse și revizuire a întrebărilor generate.",

    "Prin urmare, inteligența artificială poate contribui la educație prin personalizare, feedback rapid, tutorat și generare de conținut, iar rezultatele cercetărilor asupra sistemelor de tutorat inteligent oferă dovezi că anumite implementări pot îmbunătăți învățarea. Efectul nu este însă automat și nu poate fi atribuit tehnologiei în mod izolat. Calitatea conținutului, proiectarea activității, protecția datelor și supravegherea umană determină dacă utilizarea AI produce un avantaj educațional real. LearnAI se înscrie în această direcție ca instrument de exersare și evaluare formativă, în care generarea automată este combinată cu alegerea utilizatorului și cu mecanisme software de control."
)

$references = @(
    "[7]. Zawacki-Richter, O., Marín, V. I., Bond, M., & Gouverneur, F. (2019). Systematic review of research on artificial intelligence applications in higher education – where are the educators? International Journal of Educational Technology in Higher Education, 16, 39. https://doi.org/10.1186/s41239-019-0171-0",
    "[8]. Ma, W., Adesope, O. O., Nesbit, J. C., & Liu, Q. (2014). Intelligent tutoring systems and learning outcomes: A meta-analysis. Journal of Educational Psychology, 106(4), 901–918. https://doi.org/10.1037/a0037123",
    "[9]. Kulik, J. A., & Fletcher, J. D. (2016). Effectiveness of Intelligent Tutoring Systems: A Meta-Analytic Review. Review of Educational Research, 86(1), 42–78. https://doi.org/10.3102/0034654315581420",
    "[10]. Kasneci, E., et al. (2023). ChatGPT for good? On opportunities and challenges of large language models for education. Learning and Individual Differences, 103, 102274. https://doi.org/10.1016/j.lindif.2023.102274",
    "[11]. UNESCO. (2023). Guidance for generative AI in education and research. Paris: UNESCO. https://doi.org/10.54675/EWZM9535"
)

$archive = [System.IO.Compression.ZipFile]::Open($destinationPath, [System.IO.Compression.ZipArchiveMode]::Update)
try {
    $entry = $archive.GetEntry("word/document.xml")
    $reader = [System.IO.StreamReader]::new($entry.Open())
    try { $documentXml = $reader.ReadToEnd() } finally { $reader.Dispose() }

    [xml]$xml = $documentXml
    $w = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
    $ns = [System.Xml.XmlNamespaceManager]::new($xml.NameTable)
    $ns.AddNamespace("w", $w)
    $body = $xml.SelectSingleNode("//w:body", $ns)
    $bodyParagraphs = @($body.SelectNodes("./w:p", $ns))

    $start = $null
    $end = $null
    foreach ($paragraph in $bodyParagraphs) {
        $text = (($paragraph.SelectNodes(".//w:t", $ns) | ForEach-Object { $_.InnerText }) -join "")
        $compact = $text -replace "\s", ""
        if (-not $start -and $compact -like "2.3.5.*UtilizareaInteligențeiArtificialeînEducație*") {
            $start = $paragraph
            continue
        }
        if ($start -and $compact -like "3.Problema*") {
            $end = $paragraph
            break
        }
    }
    if (-not $start -or -not $end) {
        throw "Nu a fost identificat intervalul secțiunii 2.3.5."
    }

    $template = $start.NextSibling
    while ($template -and $template -ne $end) {
        $templateStyle = $template.SelectSingleNode("./w:pPr/w:pStyle", $ns)
        if ($template.LocalName -eq "p" -and $templateStyle -and $templateStyle.GetAttribute("val", $w) -eq "NormalWeb") {
            break
        }
        $template = $template.NextSibling
    }
    if (-not $template -or $template -eq $end) {
        $template = $end.NextSibling
        while ($template -and $template.LocalName -ne "p") { $template = $template.NextSibling }
    }
    $node = $start.NextSibling
    while ($node -and $node -ne $end) {
        $next = $node.NextSibling
        [void]$body.RemoveChild($node)
        $node = $next
    }

    foreach ($paragraphText in $paragraphs) {
        $newParagraph = $xml.CreateElement("w", "p", $w)
        $paragraphProperties = $template.SelectSingleNode("./w:pPr", $ns)
        if ($paragraphProperties) {
            [void]$newParagraph.AppendChild($paragraphProperties.CloneNode($true))
        }
        $run = $xml.CreateElement("w", "r", $w)
        $textNode = $xml.CreateElement("w", "t", $w)
        $textNode.InnerText = $paragraphText
        [void]$run.AppendChild($textNode)
        [void]$newParagraph.AppendChild($run)
        [void]$body.InsertBefore($newParagraph, $end)
    }

    $allText = (($body.SelectNodes(".//w:t", $ns) | ForEach-Object { $_.InnerText }) -join " ")
    if ($allText -notlike "*10.1186/s41239-019-0171-0*") {
        $sectPr = $body.SelectSingleNode("./w:sectPr", $ns)
        $referenceTemplate = @($body.SelectNodes("./w:p", $ns)) | Where-Object {
            ((($_.SelectNodes(".//w:t", $ns) | ForEach-Object { $_.InnerText }) -join "") -like "[[]1[]]*")
        } | Select-Object -First 1
        if (-not $referenceTemplate) { $referenceTemplate = $template }

        foreach ($referenceText in $references) {
            $newReference = $xml.CreateElement("w", "p", $w)
            $referenceProperties = $referenceTemplate.SelectSingleNode("./w:pPr", $ns)
            if ($referenceProperties) {
                [void]$newReference.AppendChild($referenceProperties.CloneNode($true))
            }
            $run = $xml.CreateElement("w", "r", $w)
            $textNode = $xml.CreateElement("w", "t", $w)
            $textNode.InnerText = $referenceText
            [void]$run.AppendChild($textNode)
            [void]$newReference.AppendChild($run)
            if ($sectPr) { [void]$body.InsertBefore($newReference, $sectPr) } else { [void]$body.AppendChild($newReference) }
        }
    }

    $entry.Delete()
    $newEntry = $archive.CreateEntry("word/document.xml")
    $writer = [System.IO.StreamWriter]::new($newEntry.Open(), [System.Text.UTF8Encoding]::new($false))
    try { $xml.Save($writer) } finally { $writer.Dispose() }
}
finally {
    $archive.Dispose()
}

Write-Output $destinationPath
