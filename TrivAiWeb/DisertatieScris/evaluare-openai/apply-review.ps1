param(
    [string]$ReviewFile = (Join-Path $PSScriptRoot "results\factual-review.csv")
)

$ErrorActionPreference = "Stop"

$reviews = @{
    1  = @("Correct",   "https://www.whitehouse.gov/about-the-white-house/presidents/george-washington/", "George Washington was the first U.S. president.")
    2  = @("Correct",   "https://www.britannica.com/topic/Pyramids-of-Giza", "The Giza pyramids were built in ancient Egypt.")
    3  = @("Correct",   "https://www.britannica.com/topic/Titanic", "Titanic sank in April 1912.")
    4  = @("Correct",   "https://kinginstitute.stanford.edu/i-have-dream", "The speech was delivered by Martin Luther King Jr.")
    5  = @("Correct",   "https://www.archives.gov/research/military/civil-war", "The American Civil War was fought between Union and Confederate states.")
    6  = @("Correct",   "https://www.britannica.com/event/World-War-II", "World War II began in Europe in 1939.")
    7  = @("Incorrect", "https://www.gov.uk/government/history/past-prime-ministers/neville-chamberlain", "Neville Chamberlain, not Winston Churchill, was prime minister when Britain entered the war in September 1939.")
    8  = @("Correct",   "https://history.state.gov/milestones/1914-1920/paris-peace", "The expected conventional answer is the Treaty of Versailles.")
    9  = @("Ambiguous", "https://www.britannica.com/event/Thirty-Years-War", "Religious conflict was central, but dynastic and territorial struggles were also major causes; 'primary' is contestable.")
    10 = @("Ambiguous", "https://www.britannica.com/topic/ancient-Egyptian-religion", "Horus and Ma'at are Egyptian concepts, but 'Egyptian Empire' and a single falcon symbol of imperial power are imprecise.")
    11 = @("Correct",   "https://www.britannica.com/place/Asia", "Asia is the largest continent.")
    12 = @("Ambiguous", "https://www.britannica.com/place/Nile-River", "The Nile is conventionally listed as longest, but measurements and the Amazon claim remain disputed.")
    13 = @("Correct",   "https://www.britannica.com/place/Japan", "Japan is conventionally called the Land of the Rising Sun.")
    14 = @("Correct",   "https://www.britannica.com/place/Paris", "Paris is the capital of France.")
    15 = @("Correct",   "https://www.britannica.com/place/Sahara-desert-Africa", "The Sahara is the largest hot desert.")
    16 = @("Correct",   "https://www.britannica.com/place/Ural-Mountains", "The Urals form a conventional boundary between Europe and Asia.")
    17 = @("Correct",   "https://www.canada.ca/en/environment-climate-change/services/water-overview.html", "Canada is generally identified as having more lakes than any other country.")
    18 = @("Correct",   "https://www.britannica.com/place/Dead-Sea", "The shores of the Dead Sea are Earth's lowest exposed land point.")
    19 = @("Incorrect", "https://denmark.dk/people-and-culture/greenland", "Greenland is the largest island, but it is not a country among the choices; it is an autonomous territory in the Kingdom of Denmark. The question asks which country possesses it.")
    20 = @("Correct",   "https://pubs.usgs.gov/gip/dynamic/slabs.html", "Most of North America lies on the North American Plate.")
    21 = @("Correct",   "https://pubchem.ncbi.nlm.nih.gov/compound/Water", "Water has the molecular formula H2O.")
    22 = @("Correct",   "https://science.nasa.gov/mars/", "Mars is known as the Red Planet.")
    23 = @("Correct",   "https://www.genome.gov/genetics-glossary/Mitochondria", "Mitochondria are commonly described as cellular powerhouses.")
    24 = @("Correct",   "https://earthobservatory.nasa.gov/features/CarbonCycle/page2.php", "Photosynthesis removes carbon dioxide from the atmosphere.")
    25 = @("Correct",   "https://science.nasa.gov/earth/facts/", "Nitrogen is the main component of Earth's atmosphere.")
    26 = @("Correct",   "https://goldbook.iupac.org/terms/view/C01384", "A covalent bond involves shared electron pairs.")
    27 = @("Correct",   "https://www.britannica.com/science/condensation-phase-change", "Gas-to-liquid transition is condensation.")
    28 = @("Correct",   "https://www.britannica.com/science/refraction", "Bending at a boundary between media is refraction.")
    29 = @("Correct",   "https://www.britannica.com/science/endocytosis", "Endocytosis is cellular uptake by membrane engulfment.")
    30 = @("Correct",   "https://www.britannica.com/science/Doppler-effect", "The described frequency shift is the Doppler effect.")
    31 = @("Correct",   "https://developer.mozilla.org/en-US/docs/Glossary/Browser", "A browser retrieves and displays web content.")
    32 = @("Correct",   "https://developer.mozilla.org/en-US/docs/Web/HTML", "HTML stands for HyperText Markup Language.")
    33 = @("Correct",   "https://news.microsoft.com/facts-about-microsoft/", "Windows is developed by Microsoft.")
    34 = @("Correct",   "https://www.usb.org/", "USB stands for Universal Serial Bus.")
    35 = @("Correct",   "https://www.cisa.gov/news-events/news/virtual-private-network-vpn-security", "A VPN creates a protected connection across an untrusted network.")
    36 = @("Ambiguous", "https://developer.mozilla.org/en-US/docs/Web/JavaScript", "JavaScript is fundamental to interactive web development, but 'the backbone' is subjective and HTML/CSS are also foundational.")
    37 = @("Correct",   "https://pages.nist.gov/800-63-3/sp800-63b.html", "2FA means two-factor authentication.")
    38 = @("Correct",   "https://www.redhat.com/en/blog/linux-root-user", "root is the privileged administrative account on Unix-like systems.")
    39 = @("Ambiguous", "https://www.rfc-editor.org/rfc/rfc8446", "TLS secures data in transit, but SSH is also a secure network protocol and is another offered option.")
    40 = @("Correct",   "https://www.icann.org/resources/pages/dns-2022-09-13-en", "DNS maps domain names to IP addresses.")
    41 = @("Correct",   "https://www.britannica.com/place/Paris", "Paris is the capital of France.")
    42 = @("Correct",   "https://science.nasa.gov/mars/", "Mars is known as the Red Planet.")
    43 = @("Correct",   "https://www.fisheries.noaa.gov/species/blue-whale", "The blue whale is the largest animal and mammal.")
    44 = @("Correct",   "https://www.britannica.com/topic/guacamole", "Avocado is the main ingredient in guacamole.")
    45 = @("Correct",   "https://www.rsc.org.uk/romeo-and-juliet/about-the-play", "Romeo and Juliet was written by William Shakespeare.")
    46 = @("Correct",   "https://www.ncbi.nlm.nih.gov/books/NBK470464/", "The skin is the largest organ of the human body.")
    47 = @("Correct",   "https://iupac.org/what-we-do/periodic-table-of-elements/", "O is the chemical symbol for oxygen.")
    48 = @("Correct",   "https://www.merriam-webster.com/dictionary/synonym", "A synonym has the same or nearly the same meaning as another word.")
    49 = @("Correct",   "https://www.government.is/topics/foreign-affairs/diplomatic-missions/about-iceland/", "Reykjavik is the capital of Iceland.")
    50 = @("Correct",   "https://www.britannica.com/place/Amazon-River", "The Amazon is the longest river in South America.")
}

$rows = @(Import-Csv $ReviewFile)
if ($rows.Count -ne 50 -or $reviews.Count -ne 50) {
    throw "Expected exactly 50 generated questions and 50 review decisions."
}

foreach ($row in $rows) {
    $id = [int]$row.questionNumber
    if (-not $reviews.ContainsKey($id)) {
        throw "Missing review decision for question $id."
    }
    $decision = $reviews[$id]
    $row.factualStatus = $decision[0]
    $row.sourceUrl = $decision[1]
    $row.reviewNotes = $decision[2]
}

$rows | Export-Csv -NoTypeInformation -Encoding UTF8 $ReviewFile
Write-Host "Applied 50 sourced review decisions to $ReviewFile"
