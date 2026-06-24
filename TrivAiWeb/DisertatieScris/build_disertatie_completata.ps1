param(
    [string]$Source = "Disertatie-revizuita-corectata.docx",
    [string]$Destination = "Disertatie-completata.docx"
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.IO.Compression

$sourcePath = (Resolve-Path $Source).Path
$destinationPath = Join-Path (Split-Path $sourcePath) $Destination
[IO.File]::Copy($sourcePath, $destinationPath, $true)

$archive = [IO.Compression.ZipFile]::Open($destinationPath, [IO.Compression.ZipArchiveMode]::Update)
try {
    $entry = $archive.GetEntry("word/document.xml")
    $reader = [IO.StreamReader]::new($entry.Open())
    try { $raw = $reader.ReadToEnd() } finally { $reader.Dispose() }
    $xml = New-Object Xml.XmlDocument
    $xml.PreserveWhitespace = $false
    $xml.LoadXml($raw)
    $w = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
    $ns = [Xml.XmlNamespaceManager]::new($xml.NameTable)
    $ns.AddNamespace("w", $w)
    $body = $xml.SelectSingleNode("//w:body", $ns)

    function Get-Text([Xml.XmlNode]$node) {
        (($node.SelectNodes(".//w:t", $ns) | ForEach-Object { $_.InnerText }) -join "")
    }

    function Get-Compact([Xml.XmlNode]$node) {
        (Get-Text $node) -replace "\s", ""
    }

    function Find-Paragraph([string]$pattern, [Xml.XmlNode]$after = $null) {
        $seen = $null -eq $after
        foreach ($paragraph in @($body.SelectNodes("./w:p", $ns))) {
            if (-not $seen) {
                if ($paragraph -eq $after) { $seen = $true }
                continue
            }
            if ((Get-Compact $paragraph) -like $pattern) { return $paragraph }
        }
        return $null
    }

    function New-Paragraph([string]$text, [string]$style = "NormalWeb", [bool]$bold = $false) {
        $p = $xml.CreateElement("w", "p", $w)
        $pPr = $xml.CreateElement("w", "pPr", $w)
        if ($style) {
            $pStyle = $xml.CreateElement("w", "pStyle", $w)
            [void]$pStyle.SetAttribute("val", $w, $style)
            [void]$pPr.AppendChild($pStyle)
        }
        [void]$p.AppendChild($pPr)
        $r = $xml.CreateElement("w", "r", $w)
        if ($bold) {
            $rPr = $xml.CreateElement("w", "rPr", $w)
            [void]$rPr.AppendChild($xml.CreateElement("w", "b", $w))
            [void]$r.AppendChild($rPr)
        }
        $t = $xml.CreateElement("w", "t", $w)
        $t.InnerText = $text
        [void]$r.AppendChild($t)
        [void]$p.AppendChild($r)
        return $p
    }

    function New-Table([string[]]$headers, [object[]]$rows) {
        $table = $xml.CreateElement("w", "tbl", $w)
        $tblPr = $xml.CreateElement("w", "tblPr", $w)
        $tblW = $xml.CreateElement("w", "tblW", $w)
        [void]$tblW.SetAttribute("w", $w, "0")
        [void]$tblW.SetAttribute("type", $w, "auto")
        [void]$tblPr.AppendChild($tblW)
        $borders = $xml.CreateElement("w", "tblBorders", $w)
        foreach ($side in @("top", "left", "bottom", "right", "insideH", "insideV")) {
            $border = $xml.CreateElement("w", $side, $w)
            [void]$border.SetAttribute("val", $w, "single")
            [void]$border.SetAttribute("sz", $w, "4")
            [void]$border.SetAttribute("color", $w, "B7C0CE")
            [void]$borders.AppendChild($border)
        }
        [void]$tblPr.AppendChild($borders)
        [void]$table.AppendChild($tblPr)
        $tblGrid = $xml.CreateElement("w", "tblGrid", $w)
        foreach ($null in $headers) {
            $gridCol = $xml.CreateElement("w", "gridCol", $w)
            [void]$gridCol.SetAttribute("w", $w, "2000")
            [void]$tblGrid.AppendChild($gridCol)
        }
        [void]$table.AppendChild($tblGrid)

        $allRows = @(@($headers)) + $rows
        for ($rowIndex = 0; $rowIndex -lt $allRows.Count; $rowIndex++) {
            $tr = $xml.CreateElement("w", "tr", $w)
            foreach ($value in $allRows[$rowIndex]) {
                $tc = $xml.CreateElement("w", "tc", $w)
                $tcPr = $xml.CreateElement("w", "tcPr", $w)
                if ($rowIndex -eq 0) {
                    $shade = $xml.CreateElement("w", "shd", $w)
                    [void]$shade.SetAttribute("val", $w, "clear")
                    [void]$shade.SetAttribute("fill", $w, "DDEBF7")
                    [void]$tcPr.AppendChild($shade)
                }
                [void]$tc.AppendChild($tcPr)
                [void]$tc.AppendChild((New-Paragraph ([string]$value) "NormalWeb" ($rowIndex -eq 0)))
                [void]$tr.AppendChild($tc)
            }
            [void]$table.AppendChild($tr)
        }
        return $table
    }

    function Insert-Before([Xml.XmlNode]$anchor, [object[]]$nodes) {
        foreach ($node in $nodes) { [void]$body.InsertBefore($node, $anchor) }
    }

    function Remove-Between([Xml.XmlNode]$start, [Xml.XmlNode]$end) {
        $node = $start.NextSibling
        while ($node -and $node -ne $end) {
            $next = $node.NextSibling
            [void]$body.RemoveChild($node)
            $node = $next
        }
    }

    function Replace-ParagraphText([Xml.XmlNode]$paragraph, [string]$text) {
        $pPr = $paragraph.SelectSingleNode("./w:pPr", $ns)
        foreach ($child in @($paragraph.ChildNodes)) {
            if ($child -ne $pPr) { [void]$paragraph.RemoveChild($child) }
        }
        $r = $xml.CreateElement("w", "r", $w)
        $t = $xml.CreateElement("w", "t", $w)
        $t.InnerText = $text
        [void]$r.AppendChild($t)
        [void]$paragraph.AppendChild($r)
    }

    function Set-ParagraphStyle([Xml.XmlNode]$paragraph, [string]$style) {
        $pPr = $paragraph.SelectSingleNode("./w:pPr", $ns)
        if (-not $pPr) {
            $pPr = $xml.CreateElement("w", "pPr", $w)
            [void]$paragraph.PrependChild($pPr)
        }
        $pStyle = $pPr.SelectSingleNode("./w:pStyle", $ns)
        if (-not $pStyle) {
            $pStyle = $xml.CreateElement("w", "pStyle", $w)
            [void]$pPr.PrependChild($pStyle)
        }
        [void]$pStyle.SetAttribute("val", $w, $style)
    }

    # Abstractul rămâne nenumerotat; introducerea devine Capitolul 1,
    # iar secțiunile teoretice existente sunt încadrate în Capitolul 2.
    $abstract = Find-Paragraph "Abstract*"
    if ($abstract) { Set-ParagraphStyle $abstract "Title" }
    $introduction = Find-Paragraph "2.Introducere*"
    if ($introduction) { Replace-ParagraphText $introduction "1. Introducere" }
    $firstTheorySection = Find-Paragraph "2.1.Platformedee-learningșieducațiadigitală*"
    if ($firstTheorySection) {
        Insert-Before $firstTheorySection @((New-Paragraph "2. Stadiul actual al cercetării" "Heading1"))
    }

    # Completări pentru stadiul cercetării și poziționarea proiectului.
    $chapter3 = Find-Paragraph "3.Problema*"
    if (-not $chapter3) { throw "Nu a fost găsit capitolul 3." }

    $researchRows = @(
        @("Zawacki-Richter et al. (2019)", "146 articole", "Patru direcții dominante: predicție, evaluare, personalizare și tutorat inteligent", "Încadrarea funcțiilor LearnAI"),
        @("Ma et al. (2014)", "107 efecte; 14.321 participanți", "Avantaje față de instruirea în grup mare și alte forme de instruire asistată", "Susține feedbackul și adaptarea"),
        @("Kulik și Fletcher (2016)", "50 evaluări controlate", "Rezultate mai bune în majoritatea evaluărilor sistemelor de tutorat inteligent", "Justifică evaluarea formativă asistată")
    )
    $comparisonRows = @(
        @("Moodle", "LMS și bancă de întrebări", "Conținut creat în principal de profesor", "Evaluare structurată și administrarea cursurilor", "Nu urmărește generarea dinamică la fiecare întrebare"),
        @("Kahoot!", "Quiz-uri gamificate", "Oferă funcții de creare asistată de AI", "Competiție sincronă și ușurință de utilizare", "Controlul și funcțiile disponibile depind de planul platformei"),
        @("Khanmigo", "Tutor conversațional", "Dialog și asistență bazate pe AI", "Ghidare conversațională și instrumente pentru profesori", "Nu este centrat pe trivia competitivă și teste publicate de utilizatori"),
        @("LearnAI", "Exersare prin întrebări și teste", "Întrebări generate la cerere după categorie și dificultate", "Progres persistent, gamificare, teste proprii și validare backend", "Necesită control suplimentar al corectitudinii factuale")
    )
    $literatureNodes = @(
        (New-Paragraph "Dovezile sintetizate în această secțiune provin din cercetări cu obiective diferite. Zawacki-Richter și colaboratorii au analizat 146 de articole și au identificat patru direcții dominante: predicția, evaluarea, personalizarea și tutoratul inteligent [7]. Ma și colaboratorii au sintetizat 107 efecte, provenite din studii cu 14.321 de participanți, iar rezultatele au susținut utilitatea sistemelor de tutorat inteligent în raport cu mai multe forme de instruire [8]. Kulik și Fletcher au analizat 50 de evaluări controlate și au raportat rezultate favorabile în majoritatea cazurilor [9]. Aceste rezultate justifică investigarea feedbackului și a adaptării, dar nu demonstrează că orice aplicație bazată pe AI este automat eficientă."),
        (New-Paragraph "2.3.6. Gamificarea și testarea prin recuperarea informației" "Heading3"),
        (New-Paragraph "Elementele de joc nu produc automat învățare, însă pot susține participarea atunci când sunt legate de obiective educaționale. Meta-analiza realizată de Sailer și Homner a identificat efecte pozitive ale gamificării asupra rezultatelor cognitive, motivaționale și comportamentale, cu variații determinate de context și de modul de proiectare [12]. În LearnAI, punctele XP, nivelurile, streak-urile și clasamentul oferă feedback asupra continuității activității; ele nu înlocuiesc conținutul sau evaluarea."),
        (New-Paragraph "Formatul quiz-ului este relevant și prin relația sa cu practica recuperării informației. Roediger și Karpicke au arătat experimental că testarea repetată poate îmbunătăți retenția pe termen mai lung față de simpla recitire a materialului [13]. LearnAI poate sprijini acest tip de exersare prin întrebări succesive și feedback imediat. Pentru ca mecanismul să aibă valoare educațională, întrebările trebuie să fie corecte, suficient de variate și adaptate nivelului utilizatorului."),
        (New-Paragraph "2.4. Analiza unor soluții existente" "Heading2"),
        (New-Paragraph "Pentru poziționarea aplicației au fost analizate trei categorii de produse: un sistem de management al învățării, o platformă de quiz gamificat și un tutor conversațional. Comparația nu urmărește declararea unei superiorități generale a LearnAI, deoarece produsele au obiective diferite. Scopul este identificarea funcțiilor relevante pentru problema tratată și a spațiului în care proiectul aduce o combinație proprie de caracteristici."),
        (New-Paragraph "Moodle oferă o infrastructură matură pentru cursuri, evaluări și bănci de întrebări, fiind potrivit instituțiilor care doresc control editorial asupra materialelor [14]. Kahoot! pune accent pe quiz-uri gamificate și permite crearea asistată a conținutului, fiind orientat spre activități interactive și competitive [15]. Khanmigo abordează o altă zonă: tutoratul conversațional și sprijinul acordat cursanților și profesorilor [16]. LearnAI nu încearcă să reproducă integral aceste platforme. Proiectul urmărește generarea la cerere a întrebărilor, persistența progresului individual și combinarea sesiunilor generate cu teste construite și publicate de utilizatori."),
        (New-Paragraph "2.5. Motivația și contribuția proprie" "Heading2"),
        (New-Paragraph "Motivația proiectului pornește de la tensiunea dintre varietatea conținutului și controlul calității. O bancă fixă de întrebări oferă predictibilitate și poate fi verificată editorial, dar necesită timp pentru extindere și actualizare. Generarea cu un model lingvistic permite acoperirea rapidă a unor categorii diverse, însă introduce riscul unor rezultate incorecte sau ambigue. LearnAI investighează practic această problemă printr-o arhitectură în care modelul generează o structură strictă, iar backend-ul verifică proprietăți care pot fi validate automat."),
        (New-Paragraph "Contribuția proprie nu constă în inventarea modelelor lingvistice sau a gamificării. Ea constă în proiectarea și implementarea unei aplicații complete care le combină: generare contextuală cu reducerea repetării, validarea structurii întrebării, autentificare și progres persistent, teste create de utilizatori, protejarea cheii răspunsurilor pentru testele publicate și o interfață unitară. Originalitatea este susținută de deciziile de integrare și de fluxurile implementate, nu de afirmația că nu există alte produse cu funcții asemănătoare.")
    )
    Insert-Before $chapter3 $literatureNodes

    # Completează analiza cerințelor fără a elimina secțiunile 3.1-3.5 existente.
    $chapter4 = Find-Paragraph "4.Solutia*"
    if (-not $chapter4) { throw "Nu a fost găsit capitolul 4." }
    Replace-ParagraphText $chapter4 "4. Soluția"
    $requirementsRows = @(
        @("RF1", "Înregistrare și autentificare prin e-mail și parolă", "Utilizator", "Ridicată"),
        @("RF2", "Configurarea categoriei, dificultății și duratei quiz-ului", "Utilizator", "Ridicată"),
        @("RF3", "Generarea unei întrebări cu patru variante și un singur răspuns corect", "Sistem", "Ridicată"),
        @("RF4", "Salvarea scorului, nivelului, streak-ului și istoricului", "Sistem", "Ridicată"),
        @("RF5", "Crearea, salvarea și publicarea testelor personalizate", "Utilizator", "Medie"),
        @("RF6", "Validarea răspunsurilor testelor publicate în backend", "Sistem", "Ridicată"),
        @("RF7", "Afișarea dashboard-ului și a clasamentului", "Utilizator", "Medie")
    )
    $nonFunctionalRows = @(
        @("Securitate", "Cheile serviciilor nu sunt expuse în browser; endpoint-urile protejate cer token Firebase"),
        @("Corectitudinea structurii", "Răspunsul AI trebuie să conțină text, exact patru variante și un singur răspuns corect"),
        @("Compatibilitate", "Interfața trebuie să ruleze în browsere moderne pe desktop și dispozitive mobile"),
        @("Mentenabilitate", "Frontend-ul, backend-ul și serviciile externe au responsabilități separate"),
        @("Rezistență la erori", "Erorile OpenAI și Firebase sunt tratate și comunicate utilizatorului"),
        @("Confidențialitate", "Se stochează numai datele necesare profilului, progresului și funcțiilor aplicației")
    )
    $analysisNodes = @(
        (New-Paragraph "3.6. Cerințe funcționale" "Heading2"),
        (New-Paragraph "Cerințele funcționale au fost derivate din problemele identificate și din fluxurile implementate. Tabelul 3.1 prezintă funcțiile esențiale, fără a include detalii strict vizuale."),
        (New-Paragraph "RF1 – Autentificare. Utilizatorul trebuie să se poată înregistra și autentifica prin e-mail și parolă."),
        (New-Paragraph "RF2 – Configurarea sesiunii. Utilizatorul trebuie să poată selecta categoria, dificultatea și numărul de întrebări."),
        (New-Paragraph "RF3 – Generarea întrebării. Sistemul trebuie să furnizeze o întrebare cu exact patru variante și un singur răspuns corect."),
        (New-Paragraph "RF4 – Persistența progresului. Sistemul trebuie să salveze scorul, nivelul, streak-ul și istoricul sesiunilor."),
        (New-Paragraph "RF5 – Teste personalizate. Utilizatorul trebuie să poată crea, salva și publica propriile teste."),
        (New-Paragraph "RF6 – Validarea răspunsurilor. Răspunsurile testelor publicate trebuie verificate în backend."),
        (New-Paragraph "RF7 – Monitorizarea progresului. Utilizatorul trebuie să poată consulta dashboard-ul și clasamentul."),
        (New-Paragraph "3.7. Cerințe nefuncționale" "Heading2"),
        (New-Paragraph "Într-o aplicație care utilizează servicii externe, cerințele nefuncționale influențează direct arhitectura. Separarea cheilor de acces, validarea răspunsului AI și tratarea indisponibilității serviciilor sunt cerințe ale soluției, nu simple detalii de implementare."),
        (New-Paragraph "Securitate. Cheile serviciilor nu trebuie expuse în browser, iar endpoint-urile protejate trebuie să solicite un token Firebase valid."),
        (New-Paragraph "Corectitudinea structurii. Un răspuns AI este acceptat numai dacă include text, exact patru variante și un singur răspuns corect."),
        (New-Paragraph "Compatibilitate. Interfața trebuie să funcționeze în browsere moderne, atât pe desktop, cât și pe dispozitive mobile."),
        (New-Paragraph "Mentenabilitate. Frontend-ul, backend-ul și integrările externe trebuie să aibă responsabilități separate."),
        (New-Paragraph "Rezistență la erori. Problemele de comunicare cu OpenAI sau Firebase trebuie tratate și comunicate utilizatorului."),
        (New-Paragraph "Confidențialitate. Aplicația trebuie să stocheze numai datele necesare profilului, progresului și funcționalităților oferite."),
        (New-Paragraph "3.8. Actori și cazuri principale de utilizare" "Heading2"),
        (New-Paragraph "Actorul principal este utilizatorul autentificat. Acesta își configurează profilul, pornește un quiz, răspunde la întrebări, folosește metodele de ajutor, consultă statisticile și creează teste. Sistemul LearnAI coordonează validarea locală, apelurile către backend și actualizarea progresului. OpenAI și Firebase sunt actori externi: primul furnizează conținutul generat, iar al doilea gestionează identitatea și persistența datelor."),
        (New-Paragraph "Fluxul principal începe prin alegerea parametrilor sesiunii. Clientul solicită backend-ului o întrebare, backend-ul construiește cererea structurată și validează răspunsul primit. După alegerea unei variante, clientul oferă feedback și actualizează starea sesiunii. La final, rezultatul este salvat în profil și reflectat în dashboard și clasament. Fluxurile alternative tratează indisponibilitatea serviciului AI, lipsa autentificării și răspunsurile care nu respectă schema.")
    )
    Insert-Before $chapter4 $analysisNodes

    # Repară numerotarea internă a capitolului 4 și adaugă proiectarea lipsă.
    $renames = @{
        "4.4.1.AvantajeleIntegrariiFirebase*" = "4.3.1. Avantajele integrării Firebase"
        "4.3.GamificareaProcesuluideÎnvățare*" = "4.4. Gamificarea procesului de învățare"
        "4.3.1.BeneficiileGamificăriiînEducație*" = "4.4.1. Beneficiile gamificării în educație"
        "4.3.2.Niveluri,XPșiStreak-uri,ClasamenteșiSistemedeRecompensare*" = "4.4.2. Niveluri, XP, streak-uri, clasamente și recompense"
    }
    foreach ($pattern in $renames.Keys) {
        $paragraph = Find-Paragraph $pattern
        if ($paragraph) { Replace-ParagraphText $paragraph $renames[$pattern] }
    }
    $gptBenefits = Find-Paragraph "4.1.1.BeneficiileUtilizariiModeluluiGPT-4o*"
    $aiComparison = if ($gptBenefits) { Find-Paragraph "ComparatiecuAlteSolutii*" $gptBenefits } else { $null }
    if ($aiComparison) { Replace-ParagraphText $aiComparison "4.1.2. Comparație cu alte soluții AI" }
    $firebaseAdvantages = Find-Paragraph "4.3.1.AvantajeleintegrăriiFirebase*"
    $firebaseComparison = if ($firebaseAdvantages) { Find-Paragraph "ComparatiecuAlteSolutii*" $firebaseAdvantages } else { $null }
    if ($firebaseComparison) { Replace-ParagraphText $firebaseComparison "4.3.2. Comparație cu alte soluții" }

    $chapter5 = Find-Paragraph "5.Abordare*Implementare*"
    if (-not $chapter5) { throw "Nu a fost găsit capitolul 5." }
    $designNodes = @(
        (New-Paragraph "4.5. Arhitectura generală și separarea responsabilităților" "Heading2"),
        (New-Paragraph "LearnAI utilizează o arhitectură distribuită în patru componente. Clientul React gestionează interfața și starea sesiunii. API-ul ASP.NET Core expune operațiile de generare și de administrare a testelor. OpenAI furnizează întrebările generate, iar Firebase asigură autentificarea și persistența. Separarea permite protejarea cheii OpenAI și mutarea validărilor critice în afara browserului."),
        (New-Paragraph "Componentele și canalele de comunicare sunt prezentate în Figura 4.1. Clientul comunică prin HTTP cu backend-ul și cu serviciile Firebase permise aplicației web. Pentru testele publicate, răspunsul corect nu este trimis browserului; verificarea este realizată de API."),
        (New-Paragraph "[INSERAȚI AICI: DisertatieScris/figuri/figura-arhitectura-learnai.svg]" "NormalWeb" $true),
        (New-Paragraph "Figura 4.1. Arhitectura generală a aplicației LearnAI (realizare proprie)." "Caption"),
        (New-Paragraph "4.6. Proiectarea fluxului de generare și validare" "Heading2"),
        (New-Paragraph "Cererea include categoria, dificultatea, cel mult zece întrebări anterioare și identificatorul răspunsului OpenAI precedent, atunci când acesta există. Modelului i se impune o schemă JSON strictă. După parsare, backend-ul verifică existența textului, numărul variantelor și unicitatea răspunsului corect. O ieșire care nu respectă aceste condiții este tratată ca eroare și nu este afișată drept întrebare validă."),
        (New-Paragraph "Succesiunea etapelor este sintetizată în Figura 4.2. Mecanismul reduce erorile structurale și repetarea în interiorul unei sesiuni, dar nu poate demonstra singur corectitudinea factuală. Aceasta rămâne o limită care necesită verificare separată."),
        (New-Paragraph "[INSERAȚI AICI: DisertatieScris/figuri/figura-flux-generare-intrebare.svg]" "NormalWeb" $true),
        (New-Paragraph "Figura 4.2. Fluxul generării și validării unei întrebări (realizare proprie)." "Caption")
    )
    Insert-Before $chapter5 $designNodes

    # Înlocuiește capitolele încă necompletate 5-7 cu o structură coerentă și adaugă evaluarea.
    $referencesHeading = Find-Paragraph "Referinte*"
    if (-not $referencesHeading) { throw "Nu a fost găsită secțiunea de referințe." }
    Replace-ParagraphText $referencesHeading "Referințe"
    $node = $chapter5
    while ($node -and $node -ne $referencesHeading) {
        $next = $node.NextSibling
        [void]$body.RemoveChild($node)
        $node = $next
    }

    $validationRows = @(
        @("Teste unitare backend", "dotnet test", "7 teste executate; 7 reușite; 0 eșuate", "Parserul răspunsului OpenAI și validatorul întrebării"),
        @("Build frontend", "TypeScript + Vite", "Build de producție reușit; 94 module transformate", "Compatibilitatea tipurilor și generarea pachetului"),
        @("Disponibilitate API", "GET /api/health", "HTTP 200; status «ok»", "Pornirea și rutarea backend-ului"),
        @("Control acces", "GET /api/custom-tests fără token", "HTTP 401", "Respingerea accesului neautentificat")
    )
    $implementationNodes = @(
        (New-Paragraph "5. Implementarea și descrierea aplicației" "Heading1"),
        (New-Paragraph "Acest capitol descrie componentele implementate și legătura dintre deciziile de proiectare și codul aplicației. Codul sursă complet nu este reprodus în lucrare; sunt explicate fluxurile și mecanismele care au relevanță pentru tema propusă."),
        (New-Paragraph "5.1. Frontend-ul React și TypeScript" "Heading2"),
        (New-Paragraph "Interfața este realizată cu React și TypeScript. Componenta principală coordonează autentificarea, navigarea între ecrane, configurarea quiz-ului, starea sesiunii și actualizarea profilului. TypeScript definește structuri pentru întrebări, răspunsuri, profiluri, sesiuni, clasament și teste personalizate, reducând erorile produse de date cu forme neașteptate."),
        (New-Paragraph "Starea întrebării curente rămâne în client numai pe durata sesiunii. Datele persistente, precum XP-ul, nivelul, streak-ul, istoricul și avatarul, sunt citite și actualizate în Firestore. Interfața tratează separat stările de încărcare, succes și eroare pentru ca indisponibilitatea unui serviciu extern să nu lase utilizatorul fără feedback."),
        (New-Paragraph "5.2. Backend-ul ASP.NET Core" "Heading2"),
        (New-Paragraph "Backend-ul este implementat ca API ASP.NET Core. Configurația înregistrează servicii distincte pentru generarea întrebărilor și administrarea testelor, clienți HTTP și politica CORS pentru clientul local. Endpoint-ul /api/trivia/question primește parametrii sesiunii și returnează o întrebare validată. Grupul /api/custom-tests gestionează salvarea, publicarea, listarea, ștergerea și verificarea răspunsurilor."),
        (New-Paragraph "Separarea pe servicii, endpoint-uri, contracte și validatori limitează responsabilitatea fiecărei componente. Astfel, construirea cererii OpenAI, parsarea răspunsului și validarea întrebării pot fi testate independent de interfața web."),
        (New-Paragraph "5.3. Integrarea OpenAI" "Heading2"),
        (New-Paragraph "Serviciul OpenAITriviaService trimite cereri către Responses API. Promptul precizează categoria, dificultatea, întrebările deja folosite și regulile de generare. Răspunsul este solicitat conform unei scheme JSON stricte care impune câmpurile questionName, answers și tipForAnsweringQuestion. Lista answers trebuie să conțină exact patru obiecte, fiecare cu text și indicatorul isCorrect."),
        (New-Paragraph "După parsare, TriviaQuestionValidator verifică din nou trei invariante: textul întrebării nu este gol, există exact patru variante și exact una este corectă. Identificatorul răspunsului OpenAI este returnat clientului și reutilizat la întrebarea următoare pentru menținerea contextului. Această combinație dintre schemă, validare și istoricul întrebărilor reprezintă mecanismul principal de control al generării."),
        (New-Paragraph "5.4. Firebase Authentication și Cloud Firestore" "Heading2"),
        (New-Paragraph "Firebase Authentication gestionează înregistrarea, autentificarea și identitatea utilizatorului. După autentificare, profilul asociat este încărcat din Cloud Firestore. Documentele profilului conțin datele necesare experienței persistente: numele afișat, avatarul, XP-ul, nivelul, streak-urile și statisticile agregate."),
        (New-Paragraph "Firestore păstrează și intrările clasamentului, istoricul sesiunilor și testele personalizate. Folosirea identificatorului Firebase drept cheie leagă datele de cont și permite regăsirea progresului de pe alt dispozitiv. Regulile Firestore și tokenul de identitate limitează operațiile disponibile utilizatorului."),
        (New-Paragraph "5.5. Testele personalizate și protejarea răspunsurilor" "Heading2"),
        (New-Paragraph "Utilizatorul poate salva un test ca draft sau îl poate publica. La publicare, backend-ul verifică existența titlului, a întrebărilor, a variantelor și validitatea indexului răspunsului corect. Versiunea editabilă este păstrată în spațiul utilizatorului, iar versiunea publicată este stocată separat."),
        (New-Paragraph "Pentru testele publicate, câmpul correctAnswer este eliminat din întrebările returnate browserului. Cheia răspunsurilor este serializată și protejată cu ASP.NET Core Data Protection. Când utilizatorul răspunde, clientul trimite numai indicii întrebării și variantei, iar backend-ul returnează rezultatul verificării. Această decizie previne aflarea răspunsurilor prin simpla inspectare a răspunsului HTTP."),
        (New-Paragraph "5.6. Implementarea gamificării" "Heading2"),
        (New-Paragraph "Răspunsurile corecte acordă XP, iar XP-ul determină nivelul profilului. Streak-ul urmărește continuitatea utilizării, recompensa zilnică oferă un stimulent de revenire, iar clasamentul compară progresul agregat. Unele opțiuni ale avatarului sunt condiționate de nivel, transformând progresul numeric într-o recompensă vizibilă. Aceste mecanisme sunt secundare obiectivului de exersare și nu modifică validitatea răspunsului."),
        (New-Paragraph "5.7. Descrierea interfeței" "Heading2"),
        (New-Paragraph "5.7.1. Autentificarea" "Heading3"),
        (New-Paragraph "Pagina de autentificare este punctul de intrare pentru funcțiile care necesită progres persistent. După validarea datelor, utilizatorul este asociat profilului Firestore."),
        (New-Paragraph "[CAPTURĂ: pagina de autentificare, fără date personale reale]" "NormalWeb" $true),
        (New-Paragraph "Figura 5.1. Pagina de autentificare a aplicației LearnAI." "Caption"),
        (New-Paragraph "5.7.2. Dashboard-ul" "Heading3"),
        (New-Paragraph "Dashboard-ul sintetizează nivelul, XP-ul, streak-ul, acuratețea și activitatea recentă. Scopul său este prezentarea progresului într-o formă rapid de interpretat."),
        (New-Paragraph "[CAPTURĂ: dashboard cu un cont demonstrativ care conține date]" "NormalWeb" $true),
        (New-Paragraph "Figura 5.2. Dashboard-ul utilizatorului și indicatorii de progres." "Caption"),
        (New-Paragraph "5.7.3. Configurarea sesiunii" "Heading3"),
        (New-Paragraph "Înaintea începerii, utilizatorul alege categoria, dificultatea și dimensiunea sesiunii. Parametrii sunt trimiși backend-ului la generarea fiecărei întrebări."),
        (New-Paragraph "[CAPTURĂ: configurarea quiz-ului cu selecțiile vizibile]" "NormalWeb" $true),
        (New-Paragraph "Figura 5.3. Configurarea unei sesiuni de întrebări generate." "Caption"),
        (New-Paragraph "5.7.4. Rezolvarea și feedbackul" "Heading3"),
        (New-Paragraph "Ecranul de joc afișează întrebarea, cele patru variante și progresul sesiunii. Metodele Hint, 50/50 și Reveal oferă sprijin controlat. După răspuns, interfața marchează rezultatul, iar la final prezintă XP-ul acumulat."),
        (New-Paragraph "[CAPTURĂ: întrebare completă cu cele patru variante și metodele de ajutor]" "NormalWeb" $true),
        (New-Paragraph "Figura 5.4. Interfața de rezolvare a unei întrebări generate." "Caption"),
        (New-Paragraph "[CAPTURĂ: feedback după răspuns sau ecranul de final]" "NormalWeb" $true),
        (New-Paragraph "Figura 5.5. Feedbackul oferit după finalizarea unei sesiuni." "Caption"),
        (New-Paragraph "5.7.5. Testele personalizate" "Heading3"),
        (New-Paragraph "Editorul permite definirea titlului, descrierii, întrebărilor și variantelor. Testul poate rămâne draft sau poate fi publicat în biblioteca disponibilă utilizatorilor autentificați."),
        (New-Paragraph "[CAPTURĂ: editor cu o întrebare completă și acțiunile Draft/Publish]" "NormalWeb" $true),
        (New-Paragraph "Figura 5.6. Crearea și publicarea unui test personalizat." "Caption"),
        (New-Paragraph "5.7.6. Clasamentul și avatarul" "Heading3"),
        (New-Paragraph "Clasamentul afișează progresul comparativ, iar editorul avatarului oferă identitate vizuală și recompense asociate nivelului."),
        (New-Paragraph "[CAPTURĂ: clasament cu minimum trei conturi demonstrative]" "NormalWeb" $true),
        (New-Paragraph "Figura 5.7. Clasamentul utilizatorilor după experiența acumulată." "Caption"),
        (New-Paragraph "[CAPTURĂ: personalizarea avatarului și o opțiune blocată de nivel]" "NormalWeb" $true),
        (New-Paragraph "Figura 5.8. Interfața de personalizare a avatarului." "Caption"),

        (New-Paragraph "6. Testare și evaluare" "Heading1"),
        (New-Paragraph "6.1. Strategia de testare" "Heading2"),
        (New-Paragraph "Validarea curentă acoperă corectitudinea unor componente backend, compilarea frontend-ului și comportamente API de bază. Testele unitare verifică parsarea răspunsului OpenAI și respingerea întrebărilor fără text, fără patru variante sau fără un unic răspuns corect. Build-ul de producție verifică tipurile TypeScript și procesul de împachetare."),
        (New-Paragraph "6.2. Rezultatele validării tehnice" "Heading2"),
        (New-Paragraph "Verificările au fost executate la 22 iunie 2026 în mediul local al proiectului. Comanda dotnet test a executat șapte teste backend: toate au reușit și niciunul nu a fost omis. Testele acoperă parsarea răspunsului OpenAI și validarea structurii întrebării."),
        (New-Paragraph "Build-ul de producție al clientului React a fost finalizat fără erori TypeScript sau Vite și a transformat 94 de module. Endpoint-ul GET /api/health a răspuns cu HTTP 200 și statusul «ok». O cerere neautentificată către GET /api/custom-tests a fost respinsă cu HTTP 401, confirmând controlul de acces pentru acest flux."),
        (New-Paragraph "Rezultatele confirmă faptul că proiectul poate fi construit și că regulile structurale principale sunt verificate. Ele nu demonstrează corectitudinea factuală a fiecărei întrebări generate și nici eficiența pedagogică asupra unui grup de cursanți."),
        (New-Paragraph "6.3. Evaluarea conținutului generat" "Heading2"),
        (New-Paragraph "Pentru o evaluare experimentală completă se recomandă generarea unui eșantion fix, de exemplu 100 de întrebări distribuite între mai multe categorii și niveluri. Fiecare întrebare trebuie evaluată independent după corectitudine factuală, claritate, existența unui singur răspuns valid, adecvarea dificultății și repetitivitate. Rezultatele trebuie raportate ca proporții și însoțite de exemple de erori. Până la realizarea acestei evaluări, lucrarea nu trebuie să susțină că modelul produce întotdeauna conținut corect."),
        (New-Paragraph "6.4. Limitările evaluării" "Heading2"),
        (New-Paragraph "Setul actual de șapte teste este redus și nu acoperă integrarea completă cu serviciile externe, încărcarea concurentă sau toate regulile Firestore. Nu a fost realizat încă un studiu cu utilizatori și nici o comparație cantitativă între modelele lingvistice. De asemenea, timpul de răspuns și costul API pot varia în funcție de model și de infrastructura externă. Aceste limite delimitează concluziile care pot fi formulate pe baza implementării curente."),

        (New-Paragraph "7. Direcții de dezvoltare viitoare" "Heading1"),
        (New-Paragraph "Prima direcție este evaluarea și verificarea factuală a întrebărilor. Conținutul raportat de utilizatori poate fi trimis într-un flux de revizuire, iar întrebările validate pot fi reutilizate dintr-un cache. Pentru domenii specializate, generarea poate fi fundamentată pe documente sau surse aprobate, cu păstrarea legăturii dintre întrebare și fragmentul sursă."),
        (New-Paragraph "A doua direcție este personalizarea pe baza performanței. În locul selectării manuale exclusive a dificultății, sistemul poate recomanda categorii și niveluri pe baza erorilor anterioare. O astfel de adaptare trebuie evaluată experimental pentru a evita menținerea utilizatorului într-o zonă prea ușoară sau prea dificilă."),
        (New-Paragraph "Alte extinderi relevante sunt importul documentelor pentru generarea testelor, formate noi de itemi, modul multiplayer, analize mai detaliate ale progresului, accesibilitate îmbunătățită și o suită mai largă de teste de integrare și securitate. Fiecare extindere trebuie introdusă numai dacă susține obiectivul educațional, nu doar pentru creșterea numărului de funcții."),

        (New-Paragraph "8. Concluzii" "Heading1"),
        (New-Paragraph "Lucrarea a analizat și implementat LearnAI, o aplicație web care utilizează inteligența artificială generativă pentru crearea întrebărilor de trivia și combină acest mecanism cu progres persistent, gamificare și teste realizate de utilizatori. Analiza literaturii a arătat că sistemele adaptive și de tutorat pot susține învățarea, dar rezultatul depinde de proiectarea pedagogică, calitatea conținutului și supravegherea umană."),
        (New-Paragraph "Soluția realizată separă interfața React, API-ul ASP.NET Core și serviciile OpenAI și Firebase. Schema JSON strictă și validatorul backend reduc erorile structurale. Pentru testele publicate, răspunsurile corecte nu sunt expuse clientului, iar verificarea este efectuată în backend. Aceste decizii reprezintă contribuțiile tehnice principale ale proiectului."),
        (New-Paragraph "Testele automate și verificările de build confirmă funcționarea componentelor evaluate, dar nu sunt suficiente pentru a demonstra corectitudinea factuală generală sau eficiența educațională. Concluzia justificată este că LearnAI oferă o bază funcțională și extensibilă pentru exersare asistată de AI. Validarea pe un eșantion de întrebări și un studiu cu utilizatori sunt pașii necesari pentru evaluarea științifică ulterioară.")
    )
    Insert-Before $referencesHeading $implementationNodes

    $newReferences = @(
        "[12]. Sailer, M., & Homner, L. (2020). The Gamification of Learning: a Meta-analysis. Educational Psychology Review, 32, 77–112. https://doi.org/10.1007/s10648-019-09498-w",
        "[13]. Roediger, H. L., & Karpicke, J. D. (2006). Test-Enhanced Learning: Taking Memory Tests Improves Long-Term Retention. Psychological Science, 17(3), 249–255. https://doi.org/10.1111/j.1467-9280.2006.01693.x",
        "[14]. Moodle. Question bank. MoodleDocs. https://docs.moodle.org/en/Question_bank (consultat la 22.06.2026)",
        "[15]. Kahoot!. How to generate a kahoot with AI. Kahoot! Help & Resource Center. https://support.kahoot.com/hc/en-us/articles/17152945038355 (consultat la 22.06.2026)",
        "[16]. Khan Academy. Khanmigo: AI-powered teaching assistant and tutor. https://www.khanmigo.ai/ (consultat la 22.06.2026)"
    )
    $sectPr = $body.SelectSingleNode("./w:sectPr", $ns)
    $allText = (($body.SelectNodes(".//w:t", $ns) | ForEach-Object { $_.InnerText }) -join " ")
    if ($allText -notlike "*10.1007/s10648-019-09498-w*") {
        foreach ($reference in $newReferences) {
            $paragraph = New-Paragraph $reference "NormalWeb"
            if ($sectPr) { [void]$body.InsertBefore($paragraph, $sectPr) } else { [void]$body.AppendChild($paragraph) }
        }
    }

    # Elimină atribute vechi, redundante și neconforme de pe tblLook;
    # valoarea compactă w:val rămâne neschimbată.
    foreach ($tableLook in @($body.SelectNodes(".//w:tblLook", $ns))) {
        foreach ($attributeName in @("firstRow", "lastRow", "firstColumn", "lastColumn", "noHBand", "noVBand")) {
            [void]$tableLook.RemoveAttribute($attributeName, $w)
        }
    }

    $entry.Delete()
    $newEntry = $archive.CreateEntry("word/document.xml")
    $writer = [IO.StreamWriter]::new($newEntry.Open(), [Text.UTF8Encoding]::new($false))
    try { $xml.Save($writer) } finally { $writer.Dispose() }
}
finally {
    $archive.Dispose()
}

Write-Output $destinationPath
