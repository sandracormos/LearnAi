param(
    [string]$Source = "Disertatie.docx",
    [string]$Destination = "Disertatie-revizuita-comisie.docx"
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

    function New-Paragraph([string]$text, [string]$style = "NoSpacing", [bool]$bold = $false) {
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

    function Insert-Before([Xml.XmlNode]$anchor, [object[]]$nodes) {
        foreach ($node in $nodes) { [void]$body.InsertBefore($node, $anchor) }
    }

    function Replace-Text([Xml.XmlNode]$paragraph, [string]$text) {
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

    function Set-Style([Xml.XmlNode]$paragraph, [string]$style) {
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

    function Remove-FromThrough([Xml.XmlNode]$start, [Xml.XmlNode]$last) {
        $after = $last.NextSibling
        $node = $start
        while ($node -and $node -ne $after) {
            $next = $node.NextSibling
            [void]$body.RemoveChild($node)
            $node = $next
        }
        return $after
    }

    function Remove-Until([Xml.XmlNode]$start, [Xml.XmlNode]$endExclusive) {
        $node = $start
        while ($node -and $node -ne $endExclusive) {
            $next = $node.NextSibling
            [void]$body.RemoveChild($node)
            $node = $next
        }
    }

    # Copertă și terminologie.
    $subtitle = Find-Paragraph "PlatformaeducationalagamificatabazzatapeAi*"
    if ($subtitle) { Replace-Text $subtitle "Platformă educațională gamificată bazată pe AI" }

    foreach ($paragraph in @($body.SelectNodes(".//w:p", $ns))) {
        $paragraphText = Get-Text $paragraph
        if ($paragraphText -notmatch "GPT-4o mini") {
            foreach ($textNode in @($paragraph.SelectNodes(".//w:t", $ns))) {
                $textNode.InnerText = $textNode.InnerText -replace "GPT-4o", "GPT-4o mini"
            }
        }
    }

    # Rezumat nenumerotat, rescris concis și cu diacritice.
    $abstractHeading = Find-Paragraph "Abstract*"
    if ($abstractHeading) {
        Replace-Text $abstractHeading "Rezumat"
        Set-Style $abstractHeading "Title"
        $abstractStart = Find-Paragraph "Aceastatezaexploreaza*" $abstractHeading
        $abstractLast = Find-Paragraph "Infinal,suntprezentate*" $abstractHeading
        if ($abstractStart -and $abstractLast) {
            $abstractAnchor = Remove-FromThrough $abstractStart $abstractLast
            Insert-Before $abstractAnchor @(
                (New-Paragraph "Lucrarea prezintă proiectarea și implementarea aplicației LearnAI, o platformă web gamificată care utilizează inteligența artificială generativă pentru crearea dinamică a întrebărilor. Soluția urmărește diversificarea conținutului, configurarea sesiunilor după categorie și dificultate și păstrarea progresului utilizatorului."),
                (New-Paragraph "Aplicația utilizează React și TypeScript pentru interfață, ASP.NET Core pentru backend, Firebase pentru autentificare și persistența datelor și modelul GPT-4o mini prin OpenAI Responses API. Backend-ul solicită răspunsuri conforme unei scheme JSON stricte și verifică existența întrebării, numărul variantelor și unicitatea răspunsului corect. Platforma include teste personalizate, progres prin XP și niveluri, streak-uri, clasament și avataruri configurabile."),
                (New-Paragraph "Validarea tehnică a inclus testele automate ale parserului și validatorului, build-ul frontend și verificări ale endpoint-urilor principale. Rezultatele confirmă funcționarea componentelor testate, fără a demonstra automat corectitudinea factuală a tuturor întrebărilor sau eficiența pedagogică. Lucrarea delimitează aceste aspecte și propune verificarea prin surse, evaluarea unui eșantion de întrebări și testarea cu utilizatori."),
                (New-Paragraph "Cuvinte-cheie: inteligență artificială generativă, educație digitală, gamificare, React, ASP.NET Core, Firebase, OpenAI." "NoSpacing" $true)
            )
        }
    }

    # Introducerea devine Capitolul 1, iar materialul teoretic este Capitolul 2.
    $introduction = Find-Paragraph "2.Introducere*"
    if ($introduction) { Replace-Text $introduction "1. Introducere" }
    $firstTheory = Find-Paragraph "2.1.Platformedee-learningșieducațiadigitală*"
    if ($firstTheory) {
        Insert-Before $firstTheory @((New-Paragraph "2. Stadiul actual al cercetării" "Heading1"))
    }

    $introProject = Find-Paragraph "LearnAIesteoplatformădeînvățareasistată*"
    if ($introProject) {
        Replace-Text $introProject "LearnAI este o platformă web gamificată care utilizează inteligența artificială pentru generarea succesivă a întrebărilor de trivia. Utilizatorul selectează categoria și dificultatea, iar întrebările anterioare sunt folosite pentru reducerea repetării în aceeași sesiune. Aplicația nu adaptează încă automat dificultatea pe baza performanței; această funcționalitate este propusă ca dezvoltare viitoare."
    }
    $aiDisclosure = Find-Paragraph "Înrealizareaacesteilucrări*"
    if ($aiDisclosure) {
        Replace-Text $aiDisclosure "În realizarea acestei lucrări a fost utilizat OpenAI GPT pentru îmbunătățirea clarității exprimării și pentru asistență în procesul de redactare. Conținutul a fost verificat, revizuit și adaptat de autor, care își asumă responsabilitatea pentru forma finală a lucrării."
    }

    # Elimină statisticile comerciale care nu susțin direct cercetarea.
    $marketStart = Find-Paragraph "Creștereapopularitățiieducațieidigitale*"
    $marketEnd = Find-Paragraph "Platformeledee-learningoferănumeroaseavantaje*"
    if ($marketStart -and $marketEnd) { Remove-Until $marketStart $marketEnd }
    $reasonsStart = Find-Paragraph "Importanțaacestoravantajeesteevidențiată*"
    $reasonsEnd = Find-Paragraph "Cutoateacestea,platformeleeducaționale*"
    if ($reasonsStart -and $reasonsEnd) { Remove-Until $reasonsStart $reasonsEnd }
    $aiMarketStart = Find-Paragraph "DiagramaprezentatainFigura4*"
    $aiEducationHeading = Find-Paragraph "2.3.3.UtilizareaInteligențeiArtificialeînEducație*"
    if ($aiMarketStart -and $aiEducationHeading) { Remove-Until $aiMarketStart $aiEducationHeading }

    # Numerotare și stiluri în capitolul 2.
    $controlHeading = Find-Paragraph "ControlulUtilizatoruluiAsupraContinutului*"
    if ($controlHeading) {
        Replace-Text $controlHeading "2.2.1. Controlul utilizatorului asupra conținutului"
        Set-Style $controlHeading "Heading3"
    }
    $differencesHeading = Find-Paragraph "2.3.1.AI,MachineLearningsiDeepLearning*"
    if ($differencesHeading) { Set-Style $differencesHeading "Heading3" }
    $historyHeading = Find-Paragraph "2.3.1.IstoriaInteligenteiArtificiale*"
    if ($historyHeading) { Replace-Text $historyHeading "2.3.2. Istoria inteligenței artificiale" }
    $applicationsHeading = Find-Paragraph "2.3.2Aplicatii*"
    if ($applicationsHeading) { Replace-Text $applicationsHeading "2.3.3. Aplicații ale inteligenței artificiale" }
    $aiEducationHeading = Find-Paragraph "2.3.3.UtilizareaInteligențeiArtificialeînEducație*"
    if ($aiEducationHeading) { Replace-Text $aiEducationHeading "2.3.4. Utilizarea inteligenței artificiale în educație și generarea conținutului" }
    foreach ($role in @("AIcaActor*", "AIcaDesigner*", "AIcaProducator*")) {
        $roleHeading = Find-Paragraph $role
        if ($roleHeading) { Set-Style $roleHeading "NoSpacing" }
    }

    # Uniformizează titlurile moștenite din versiunea inițială.
    $headingCorrections = [ordered]@{
        "2.2.IntroducereinGenerareaProceduraladeContinut*" = "2.2. Introducere în generarea procedurală de conținut"
        "2.3.IntroducereinInteligentaArtificiala*" = "2.3. Introducere în inteligența artificială"
        "2.3.1.AI,MachineLearningsiDeepLearning*" = "2.3.1. AI, machine learning și deep learning: diferențe"
        "3.1.ProblemaDiversitatiiContinutului*" = "3.1. Problema diversității conținutului"
        "3.2.CosturiledeMentenanta*" = "3.2. Costurile de mentenanță"
        "3.3.CosturileDezvoltariiContinutului*" = "3.3. Costurile dezvoltării conținutului"
        "4.1.StrategiipentruGenerareasiDiversificareaContinutuluiEducational*" = "4.1. Strategii pentru generarea și diversificarea conținutului educațional"
        "4.2.SolutiipentruReducereaCosturilordeMentenantasiDezvoltare*" = "4.2. Soluții pentru reducerea costurilor de mentenanță și dezvoltare"
    }
    foreach ($pattern in $headingCorrections.Keys) {
        $heading = Find-Paragraph $pattern
        if ($heading) { Replace-Text $heading $headingCorrections[$pattern] }
    }

    # Citări scurte pentru sursele istorice și pentru AI în jocuri.
    $dartmouthParagraph = Find-Paragraph "Inanul1956aavutlocConferintaDartmouth*"
    if ($dartmouthParagraph) {
        Replace-Text $dartmouthParagraph "În anul 1956 a avut loc Conferința Dartmouth, considerată un punct de plecare al cercetării moderne în inteligența artificială [5]."
    }
    $samuelParagraph = Find-Paragraph "Pemasuraceinteresul*ArthurSamuel*"
    if ($samuelParagraph) {
        Replace-Text $samuelParagraph "În 1959, Arthur Samuel a prezentat un program pentru jocul de dame care își îmbunătățea performanța prin învățare [4]."
    }
    $gameAiParagraph = Find-Paragraph "Conformarticoluluiacademic*AIforGameProduction*"
    if ($gameAiParagraph) {
        Insert-Before $gameAiParagraph @((New-Paragraph "Inteligența artificială este utilizată în jocuri pentru controlul agenților și generarea experiențelor interactive [2]."))
    }

    $adaptiveClaim = Find-Paragraph "IncontextulaplicatieiLearnAI,utilizatorulbeneficiaza*"
    if ($adaptiveClaim) {
        Replace-Text $adaptiveClaim "În LearnAI, utilizatorul controlează direct categoria și dificultatea întrebărilor. Sistemul folosește istoricul întrebărilor din sesiunea curentă pentru reducerea repetării, dar nu adaptează încă automat dificultatea după performanță. O astfel de personalizare este analizată ca direcție de dezvoltare viitoare."
    }

    # Stadiul cercetării, produse existente și contribuție proprie.
    $chapter3 = Find-Paragraph "3.Problema*"
    if (-not $chapter3) { throw "Nu a fost găsit capitolul 3." }
    Insert-Before $chapter3 @(
        (New-Paragraph "2.4. Dovezi privind utilizarea AI și a gamificării în educație" "Heading2"),
        (New-Paragraph "Cercetarea privind inteligența artificială în educație precede modelele generative actuale. Analiza sistematică realizată de Zawacki-Richter și colaboratorii săi a examinat 146 de articole și a identificat patru categorii principale: profilare și predicție, evaluare, sisteme adaptive și personalizare, respectiv tutorat inteligent [7]. Autorii au remarcat și participarea redusă a educatorilor la o parte importantă a cercetării analizate."),
        (New-Paragraph "Meta-analiza realizată de Ma, Adesope, Nesbit și Liu a sintetizat 107 efecte, provenite din studii cu 14.321 de participanți. Sistemele de tutorat inteligent au produs rezultate mai bune decât instruirea în grup mare, materialele tipărite și alte forme de instruire asistată de calculator, fără o diferență semnificativă față de tutoratul uman individual [8]. Kulik și Fletcher au analizat 50 de evaluări controlate și au raportat rezultate favorabile în majoritatea cazurilor [9]. Aceste rezultate susțin utilitatea feedbackului și a adaptării, nu ideea că orice sistem AI este automat eficient."),
        (New-Paragraph "Pentru modelele lingvistice generative, beneficiile trebuie analizate împreună cu riscurile. Kasneci și colaboratorii evidențiază posibilitățile de personalizare și creare a materialelor, dar și riscurile privind informația incorectă, biasul, dependența excesivă și integritatea evaluării [10]. UNESCO recomandă o abordare centrată pe om, protecția datelor și menținerea responsabilității umane asupra deciziilor educaționale [11]."),
        (New-Paragraph "Gamificarea poate susține implicarea atunci când este legată de obiective educaționale. Meta-analiza lui Sailer și Homner a identificat efecte pozitive asupra rezultatelor cognitive, motivaționale și comportamentale, cu variații determinate de context și proiectare [12]. Formatul quiz-ului este relevant și prin practica recuperării informației: Roediger și Karpicke au demonstrat că testarea repetată poate îmbunătăți retenția pe termen mai lung comparativ cu simpla recitire [13]."),
        (New-Paragraph "2.5. Analiza unor soluții existente" "Heading2"),
        (New-Paragraph "Moodle oferă administrarea cursurilor, evaluări și o bancă de întrebări controlată de profesor [14]. Kahoot! este orientat spre activități de quiz gamificate și oferă funcții pentru crearea asistată a conținutului [15]. Khanmigo abordează tutoratul conversațional și sprijinul acordat cursanților și profesorilor [16]. Aceste produse au obiective și niveluri de complexitate diferite, motiv pentru care comparația cu LearnAI trebuie privită ca o poziționare funcțională, nu ca demonstrarea unei superiorități generale."),
        (New-Paragraph "LearnAI combină generarea succesivă a întrebărilor după categorie și dificultate cu progres persistent, gamificare și teste create de utilizatori. Spre deosebire de o bancă fixă, conținutul poate varia de la o sesiune la alta; în schimb, utilizarea unui model generativ introduce necesitatea verificării factuale. Față de un tutor conversațional, aplicația are un scop mai restrâns: exersarea prin întrebări cu alegere multiplă și feedback imediat."),
        (New-Paragraph "1.6. Motivația și contribuția proprie" "Heading2"),
        (New-Paragraph "Contribuția proprie nu constă în dezvoltarea modelului GPT sau a serviciilor Firebase. Ea constă în proiectarea și implementarea unei aplicații complete care integrează generarea contextuală, validarea structurii întrebării, progresul persistent, mecanismele de gamificare și publicarea testelor. Pentru testele publicate, răspunsul corect este eliminat din datele trimise browserului, iar verificarea este realizată în backend folosind o cheie protejată.")
    )

    # Capitolul 3 devine analiză și primește cerințe explicite.
    Replace-Text $chapter3 "3. Analiza problemei și cerințele sistemului"
    $chapter4 = Find-Paragraph "4.Solutia*"
    if (-not $chapter4) { throw "Nu a fost găsit capitolul 4." }
    Insert-Before $chapter4 @(
        (New-Paragraph "3.5. Cerințe funcționale" "Heading2"),
        (New-Paragraph "RF1 – Utilizatorul trebuie să se poată înregistra, autentifica și deconecta prin Firebase Authentication."),
        (New-Paragraph "RF2 – Utilizatorul trebuie să poată selecta categoria, dificultatea și numărul de întrebări al sesiunii."),
        (New-Paragraph "RF3 – Sistemul trebuie să genereze întrebări cu exact patru variante și un singur răspuns corect."),
        (New-Paragraph "RF4 – Sistemul trebuie să salveze profilul, XP-ul, nivelul, streak-ul și istoricul sesiunilor."),
        (New-Paragraph "RF5 – Utilizatorul trebuie să poată crea, salva, publica și șterge teste personalizate."),
        (New-Paragraph "RF6 – Răspunsurile testelor publicate trebuie verificate în backend, fără expunerea cheii în browser."),
        (New-Paragraph "3.6. Cerințe nefuncționale" "Heading2"),
        (New-Paragraph "Securitate – cheia OpenAI nu trebuie inclusă în frontend, iar accesul la datele private trebuie limitat prin autentificare și reguli Firestore."),
        (New-Paragraph "Corectitudinea structurii – răspunsurile AI sunt acceptate numai dacă respectă schema și regulile validatorului."),
        (New-Paragraph "Compatibilitate – interfața trebuie să funcționeze în browsere moderne și să se adapteze la ecrane diferite."),
        (New-Paragraph "Mentenabilitate – interfața, API-ul și integrările externe trebuie să aibă responsabilități separate."),
        (New-Paragraph "Rezistență la erori – indisponibilitatea OpenAI sau Firebase trebuie tratată fără afișarea unor date incomplete."),
        (New-Paragraph "3.7. Actori și flux principal" "Heading2"),
        (New-Paragraph "Actorul principal este utilizatorul autentificat. Acesta configurează sesiunea, răspunde la întrebări, consultă statisticile și creează teste. Frontend-ul gestionează interacțiunea, backend-ul generează și validează conținutul, OpenAI furnizează răspunsul generativ, iar Firebase gestionează identitatea și persistența datelor."),
        (New-Paragraph "Fluxul principal începe prin selectarea parametrilor. Clientul solicită o întrebare, backend-ul construiește cererea OpenAI și validează rezultatul, iar frontend-ul afișează variantele și feedbackul. La final, rezultatul este salvat și reflectat în profil și Dashboard.")
    )

    Replace-Text $chapter4 "4. Proiectarea soluției"
    $dynamicHeading = Find-Paragraph "GenerareaDinamicaaIntrebarilor*"
    if ($dynamicHeading) { Replace-Text $dynamicHeading "4.1.1. Generarea dinamică a întrebărilor"; Set-Style $dynamicHeading "Heading3" }
    $categoryHeading = Find-Paragraph "CategoriiDefinitedeUtilizator*"
    if ($categoryHeading) { Replace-Text $categoryHeading "4.1.2. Categorii definite de utilizator"; Set-Style $categoryHeading "Heading3" }
    $benefitsHeading = Find-Paragraph "4.1.1.BeneficiileUtilizariiModelului*"
    if ($benefitsHeading) { Replace-Text $benefitsHeading "4.1.3. Beneficiile utilizării modelului GPT-4o mini" }
    $alternativeHeading = Find-Paragraph "ComparatiecuAlteSolutii*"
    if ($alternativeHeading) { Replace-Text $alternativeHeading "4.2.2. Comparație cu alte soluții"; Set-Style $alternativeHeading "Heading3" }

    $generationClaim = Find-Paragraph "Pentruacombaterepetitivitateacontinutului*"
    if ($generationClaim) {
        Replace-Text $generationClaim "Pentru reducerea repetării, LearnAI utilizează modelul GPT-4o mini pentru generarea succesivă a întrebărilor. Conținutul este produs la cerere după categoria și dificultatea selectate. Istoricul ultimelor întrebări și identificatorul răspunsului OpenAI precedent reduc probabilitatea repetării, fără a oferi o garanție absolută."
    }
    $scaleClaim = Find-Paragraph "PrinutilizareamodeluluiGPT-4omini,LearnAIpoateraspunde*"
    if ($scaleClaim) {
        Replace-Text $scaleClaim "Integrarea prin API permite adăugarea unor categorii fără modificarea unei bănci locale de întrebări. Scalabilitatea efectivă depinde însă de limitele serviciului OpenAI, costul apelurilor și infrastructura backend și nu a fost evaluată prin teste de încărcare."
    }
    $costClaim = Find-Paragraph "PrinintegrareaAPI-uluiOpenAIpentrugenerareadinamica*"
    if ($costClaim) {
        Replace-Text $costClaim "Integrarea OpenAI poate reduce efortul redactării manuale a unui volum mare de întrebări, dar nu elimină costurile de conținut. Utilizarea API-ului, verificarea factuală, monitorizarea și tratarea rezultatelor invalide introduc costuri tehnice care trebuie luate în considerare."
    }

    # Capitolul 5: titluri, stiluri și numerotarea figurilor.
    $chapter5 = Find-Paragraph "5.AbordaresiImplementare*"
    if ($chapter5) { Replace-Text $chapter5 "5. Implementarea și descrierea aplicației" }
    $settingsHeading = Find-Paragraph "5.2.5.StatisticișiProfilUtilizator*"
    if ($settingsHeading) { Replace-Text $settingsHeading "5.2.5. Setări și profil utilizator" }
    $openAiHeading = Find-Paragraph "5.3.4.IntegrareaOpenAI*"
    if ($openAiHeading) { Set-Style $openAiHeading "Heading3" }
    $securityHeading = Find-Paragraph "5.3.7.Securitateașivalidareadatelor*"
    if ($securityHeading) { Set-Style $securityHeading "Heading3" }

    foreach ($paragraph in @($body.SelectNodes("./w:p", $ns))) {
        $styleNode = $paragraph.SelectSingleNode("./w:pPr/w:pStyle", $ns)
        if ($styleNode -and $styleNode.GetAttribute("val", $w) -like "Heading*" -and [string]::IsNullOrWhiteSpace((Get-Text $paragraph))) {
            Set-Style $paragraph "NoSpacing"
        }
    }

    $architectureText = Find-Paragraph "AplicațiaLearnAIestealcătuitădintr-unfrontend*"
    if ($architectureText) {
        Insert-Before $architectureText @((New-Paragraph "Figura 5.1. Arhitectura generală a sistemului LearnAI (realizare proprie)." "Caption"))
    }

    $figureReplacements = [ordered]@{
        "Figura 5.1. Pagina de autentificare a aplicației LearnAI." = "Figura 5.2. Pagina de autentificare a aplicației LearnAI."
        "Figura 5.2. Dashboard-ul cu statisticile generale ale utilizatorului." = "Figura 5.3. Dashboard-ul cu statisticile generale ale utilizatorului."
        "Figura 5.3. Istoricul recent al sesiunilor finalizate." = "Figura 5.4. Istoricul recent al sesiunilor finalizate."
        "Figura 5.3. Configurarea unei sesiuni de întrebări în LearnAI." = "Figura 5.5. Configurarea unei sesiuni de întrebări în LearnAI."
        "Figura 5.4. Ecranul de rezolvare a unei întrebări generate." = "Figura 5.6. Ecranul de rezolvare a unei întrebări generate."
        "Figura 5.5. Feedbackul vizual afișat după verificarea răspunsului." = "Figura 5.7. Feedbackul vizual afișat după verificarea răspunsului."
        "Figura 5.6. Configurarea numelui și a avatarului în pagina Settings." = "Figura 5.8. Configurarea numelui și a avatarului în pagina Settings."
        "Figura 5.7. Preferințele vizuale și rezumatul profilului utilizatorului." = "Figura 5.9. Preferințele vizuale și rezumatul profilului utilizatorului."
        "Figura 5.8. Structura colecțiilor Cloud Firestore utilizate de LearnAI (realizare proprie)." = "Figura 5.10. Structura colecțiilor Cloud Firestore utilizate de LearnAI (realizare proprie)."
        "Figura 5.9. Fluxul integrării OpenAI pentru generarea întrebărilor (realizare proprie)." = "Figura 5.11. Fluxul integrării OpenAI pentru generarea întrebărilor (realizare proprie)."
        "Figura 5.10. Salvarea și publicarea testelor personalizate (realizare proprie)." = "Figura 5.12. Salvarea și publicarea testelor personalizate (realizare proprie)."
    }
    foreach ($oldCaption in $figureReplacements.Keys) {
        foreach ($paragraph in @($body.SelectNodes("./w:p", $ns))) {
            if ((Get-Text $paragraph).Trim() -eq $oldCaption) { Replace-Text $paragraph $figureReplacements[$oldCaption] }
        }
    }
    $mentionMaps = [ordered]@{
        "Organizarea statisticilor generale ale utilizatorului este prezentată în Figura 5.2." = "Organizarea statisticilor generale ale utilizatorului este prezentată în Figura 5.3."
        "Istoricul sesiunilor finalizate este prezentat în Figura 5.3." = "Istoricul sesiunilor finalizate este prezentat în Figura 5.4."
        "Parametrii disponibili pentru configurarea unei sesiuni sunt prezentați în Figura 5.3." = "Parametrii disponibili pentru configurarea unei sesiuni sunt prezentați în Figura 5.5."
        "Elementele disponibile în timpul rezolvării unei întrebări sunt prezentate în Figura 5.4." = "Elementele disponibile în timpul rezolvării unei întrebări sunt prezentate în Figura 5.6."
        "Feedbackul oferit după selectarea unui răspuns este prezentat în Figura 5.5." = "Feedbackul oferit după selectarea unui răspuns este prezentat în Figura 5.7."
        "Opțiunile pentru modificarea numelui și personalizarea avatarului sunt prezentate în Figura 5.6." = "Opțiunile pentru modificarea numelui și personalizarea avatarului sunt prezentate în Figura 5.8."
        "Setarea temei și rezumatul progresului sunt prezentate în Figura 5.7." = "Setarea temei și rezumatul progresului sunt prezentate în Figura 5.9."
        "Organizarea logică a datelor persistente este prezentată în Figura 5.8" = "Organizarea logică a datelor persistente este prezentată în Figura 5.10."
        "Fluxul utilizat pentru generarea și validarea unei întrebări este prezentat în Figura 5.9" = "Fluxul utilizat pentru generarea și validarea unei întrebări este prezentat în Figura 5.11."
        "Separarea dintre versiunea editabilă și versiunea publicată a unui test este ilustrată în Figura 5.10" = "Separarea dintre versiunea editabilă și versiunea publicată a unui test este ilustrată în Figura 5.12."
    }
    foreach ($oldMention in $mentionMaps.Keys) {
        foreach ($paragraph in @($body.SelectNodes("./w:p", $ns))) {
            if ((Get-Text $paragraph).Trim() -eq $oldMention) { Replace-Text $paragraph $mentionMaps[$oldMention] }
        }
    }

    # Capitol separat de testare, apoi renumerotarea capitolelor finale.
    $futureHeading = Find-Paragraph "6.Îmbunătățiriviitoare*"
    if (-not $futureHeading) { throw "Nu a fost găsit capitolul de îmbunătățiri." }
    Insert-Before $futureHeading @(
        (New-Paragraph "6. Testare și evaluare" "Heading1"),
        (New-Paragraph "6.1. Obiectivele testării" "Heading2"),
        (New-Paragraph "Testarea a urmărit verificarea componentelor care controlează structura întrebării, construirea frontend-ului și comportamentul de bază al API-ului. Verificările tehnice nu sunt echivalente cu evaluarea factuală sau pedagogică a conținutului generat."),
        (New-Paragraph "6.2. Teste automate backend" "Heading2"),
        (New-Paragraph "Proiectul TrivAi.Api.Tests conține șapte teste unitare. Patru teste verifică TriviaQuestionValidator: acceptarea unei întrebări valide și respingerea întrebărilor fără text, fără exact patru variante sau fără un singur răspuns corect. Trei teste verifică extragerea textului și a identificatorului din răspunsul OpenAI și tratarea unui răspuns fără output_text."),
        (New-Paragraph "La executarea comenzii dotnet test au fost rulate toate cele șapte teste: șapte au reușit, niciunul nu a eșuat și niciunul nu a fost omis. Rezultatul confirmă comportamentul componentelor testate, nu funcționarea completă a serviciilor externe."),
        (New-Paragraph "6.3. Verificarea frontend-ului și a API-ului" "Heading2"),
        (New-Paragraph "Build-ul de producție al clientului a fost finalizat cu succes prin TypeScript și Vite, fiind transformate 94 de module. Procesul a confirmat compatibilitatea tipurilor și generarea pachetului de producție. Au fost raportate avertismente privind dimensiunea unor module și utilizarea eval în biblioteca Lottie, aspecte incluse în direcțiile de optimizare."),
        (New-Paragraph "Endpoint-ul GET /api/health a răspuns cu HTTP 200 și valoarea status «ok». O cerere neautentificată către GET /api/custom-tests/ a fost respinsă cu HTTP 401, confirmând controlul de acces pentru acest flux."),
        (New-Paragraph "6.4. Limitările evaluării" "Heading2"),
        (New-Paragraph "Testarea curentă nu include teste de încărcare, un studiu cu utilizatori sau o evaluare sistematică a corectitudinii factuale. În consecință, rezultatele permit concluzii despre componentele tehnice verificate, dar nu demonstrează că toate întrebările sunt corecte sau că aplicația îmbunătățește învățarea."),
        (New-Paragraph "Pentru o evaluare ulterioară se recomandă generarea unui eșantion fix de întrebări distribuite pe categorii și dificultăți. Fiecare întrebare trebuie verificată după corectitudine factuală, claritate, existența unui singur răspuns valid și adecvarea dificultății. Rezultatele trebuie raportate separat de testele software.")
    )

    Replace-Text $futureHeading "7. Îmbunătățiri viitoare"
    foreach ($index in 1..8) {
        $heading = Find-Paragraph "6.$index.*" $futureHeading
        if ($heading) {
            $text = (Get-Text $heading).Trim() -replace "^6\.$index\.", "7.$index."
            Replace-Text $heading $text
            Set-Style $heading "Heading2"
        }
    }
    $conclusionHeading = Find-Paragraph "7.Concluzii*"
    if ($conclusionHeading) { Replace-Text $conclusionHeading "8. Concluzii" }
    $referencesHeading = Find-Paragraph "8.Referinte*"
    if (-not $referencesHeading) { throw "Nu a fost găsită bibliografia." }
    Replace-Text $referencesHeading "Referințe"

    # Bibliografie unică, numerotată și corelată cu citările.
    $sectPr = $body.SelectSingleNode("./w:sectPr", $ns)
    $node = $referencesHeading.NextSibling
    while ($node -and $node -ne $sectPr) {
        $next = $node.NextSibling
        [void]$body.RemoveChild($node)
        $node = $next
    }
    $references = @(
        "[1]. Giattino, C., Mathieu, E., Samborska, V., & Roser, M. (2023). Artificial Intelligence. Our World in Data. https://ourworldindata.org/artificial-intelligence",
        "[2]. Yannakakis, G. N., & Togelius, J. (2018). Artificial Intelligence and Games. Springer. https://doi.org/10.1007/978-3-319-63519-4",
        "[3]. Turing, A. M. (1950). Computing Machinery and Intelligence. Mind, 59(236), 433–460. https://doi.org/10.1093/mind/LIX.236.433",
        "[4]. Samuel, A. L. (1959). Some Studies in Machine Learning Using the Game of Checkers. IBM Journal of Research and Development, 3(3), 210–229. https://doi.org/10.1147/rd.33.0210",
        "[5]. Anyoha, R. (2017). The History of Artificial Intelligence. Science in the News, Harvard University.",
        "[6]. Riedl, M. O., & Zook, A. (2013). AI for Game Production. 2013 IEEE Conference on Computational Intelligence in Games. https://doi.org/10.1109/CIG.2013.6633663",
        "[7]. Zawacki-Richter, O., Marín, V. I., Bond, M., & Gouverneur, F. (2019). Systematic review of research on artificial intelligence applications in higher education – where are the educators? International Journal of Educational Technology in Higher Education, 16, 39. https://doi.org/10.1186/s41239-019-0171-0",
        "[8]. Ma, W., Adesope, O. O., Nesbit, J. C., & Liu, Q. (2014). Intelligent tutoring systems and learning outcomes: A meta-analysis. Journal of Educational Psychology, 106(4), 901–918. https://doi.org/10.1037/a0037123",
        "[9]. Kulik, J. A., & Fletcher, J. D. (2016). Effectiveness of Intelligent Tutoring Systems: A Meta-Analytic Review. Review of Educational Research, 86(1), 42–78. https://doi.org/10.3102/0034654315581420",
        "[10]. Kasneci, E., et al. (2023). ChatGPT for good? On opportunities and challenges of large language models for education. Learning and Individual Differences, 103, 102274. https://doi.org/10.1016/j.lindif.2023.102274",
        "[11]. UNESCO. (2023). Guidance for generative AI in education and research. Paris: UNESCO. https://doi.org/10.54675/EWZM9535",
        "[12]. Sailer, M., & Homner, L. (2020). The Gamification of Learning: a Meta-analysis. Educational Psychology Review, 32, 77–112. https://doi.org/10.1007/s10648-019-09498-w",
        "[13]. Roediger, H. L., & Karpicke, J. D. (2006). Test-Enhanced Learning: Taking Memory Tests Improves Long-Term Retention. Psychological Science, 17(3), 249–255. https://doi.org/10.1111/j.1467-9280.2006.01693.x",
        "[14]. Moodle. Question bank. MoodleDocs. https://docs.moodle.org/en/Question_bank (consultat la 22.06.2026)",
        "[15]. Kahoot!. How to generate a kahoot with AI. Kahoot! Help Center. https://support.kahoot.com/hc/en-us/articles/17152945038355 (consultat la 22.06.2026)",
        "[16]. Khan Academy. Khanmigo: AI-powered teaching assistant and tutor. https://www.khanmigo.ai/ (consultat la 22.06.2026)"
    )
    foreach ($reference in $references) {
        [void]$body.InsertBefore((New-Paragraph $reference "NoSpacing"), $sectPr)
    }

    # Elimină atribute neconforme vechi din tabelele șablonului.
    foreach ($tableLook in @($body.SelectNodes(".//w:tblLook", $ns))) {
        foreach ($attributeName in @("firstRow", "lastRow", "firstColumn", "lastColumn", "noHBand", "noVBand")) {
            [void]$tableLook.RemoveAttribute($attributeName, $w)
        }
    }

    $entry.Delete()
    $newEntry = $archive.CreateEntry("word/document.xml")
    $writer = [IO.StreamWriter]::new($newEntry.Open(), [Text.UTF8Encoding]::new($false))
    try { $xml.Save($writer) } finally { $writer.Dispose() }

    # Solicită Word să actualizeze automat cuprinsul și câmpurile la deschidere.
    $settingsEntry = $archive.GetEntry("word/settings.xml")
    if ($settingsEntry) {
        $settingsReader = [IO.StreamReader]::new($settingsEntry.Open(), [Text.Encoding]::UTF8)
        try { [xml]$settingsXml = $settingsReader.ReadToEnd() } finally { $settingsReader.Dispose() }
        $settingsNs = [Xml.XmlNamespaceManager]::new($settingsXml.NameTable)
        $settingsNs.AddNamespace("w", $w)
        $updateFields = $settingsXml.SelectSingleNode("/w:settings/w:updateFields", $settingsNs)
        if (-not $updateFields) {
            $updateFields = $settingsXml.CreateElement("w", "updateFields", $w)
            [void]$settingsXml.DocumentElement.AppendChild($updateFields)
        }
        $updateFields.SetAttribute("val", $w, "true")
        $settingsEntry.Delete()
        $newSettingsEntry = $archive.CreateEntry("word/settings.xml")
        $settingsWriter = [IO.StreamWriter]::new($newSettingsEntry.Open(), [Text.UTF8Encoding]::new($false))
        try { $settingsXml.Save($settingsWriter) } finally { $settingsWriter.Dispose() }
    }
}
finally {
    $archive.Dispose()
}

Write-Output $destinationPath
