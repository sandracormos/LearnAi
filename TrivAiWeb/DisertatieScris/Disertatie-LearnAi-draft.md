# LearnAi: aplicație web de trivia cu inteligență artificială generativă

## 1. Rezumat

Această lucrare explorează dezvoltarea și implementarea LearnAi, o aplicație educațională de tip quiz/trivia, destinată să ofere utilizatorilor o experiență interactivă, captivantă și stimulantă din punct de vedere intelectual. Pornind de la o introducere în industria jocurilor video, lucrarea analizează conceptul de generare procedurală de conținut și importanța acestuia în dezvoltarea aplicațiilor interactive. De asemenea, sunt discutate rolul inteligenței artificiale în jocuri, evoluția acesteia, domeniile de aplicare și utilizarea concretă a modelelor generative în cadrul unei aplicații de trivia.

Un accent important al lucrării este pus pe modelul GPT al OpenAI, evidențiind importanța acestuia în generarea de conținut pentru jocuri și aplicații educaționale. Lucrarea identifică și abordează provocări esențiale în dezvoltarea unei astfel de aplicații, precum rejucabilitatea, costurile de mentenanță, costurile de creare a conținutului, accesibilitatea pe mai multe dispozitive și păstrarea progresului utilizatorului.

Procesul de implementare al aplicației LearnAi este prezentat în detaliu, acoperind integrarea cu Firebase, comunicarea cu OpenAI printr-un backend ASP.NET Core, utilizarea React pentru interfața web și proiectarea logicii aplicației. Lucrarea analizează și designul vizual și interactiv al aplicației, incluzând autentificarea utilizatorilor, configurarea jocului, generarea întrebărilor, interacțiunea cu răspunsurile, sistemul de scor și nivel, dashboard-ul, leaderboard-ul și testele personalizate create de utilizatori.

Sunt discutate și posibile îmbunătățiri viitoare, oferind direcții pentru dezvoltarea ulterioară a aplicației. Lucrarea se încheie prin sintetizarea principalelor rezultate și prin evidențierea rolului inovației și al tehnologiei în crearea unor experiențe educaționale interactive, accesibile și moderne.

## 2. Introducere

Rezultatul acestui proiect este menit să reprezinte abilitățile și competențele necesare pentru dezvoltarea unei aplicații complete de la zero, incluzând proiectarea, planificarea, implementarea și testarea, fiecare etapă fiind abordată prin practici potrivite pentru piața actuală.

LearnAi este o aplicație de tip trivia concepută pentru a oferi utilizatorilor un control mai mare asupra experienței de învățare și de joc, îmbunătățind atât rejucabilitatea, cât și gradul de implicare. Prin posibilitatea de a selecta categoriile dorite de întrebări și prin utilizarea inteligenței artificiale pentru generarea întrebărilor în timp real, LearnAi oferă o experiență dinamică și personalizată, care se schimbă cu fiecare sesiune.

Prin aceste funcționalități, LearnAi își propune să redefinească formatul tradițional al jocurilor de trivia, oferind divertisment, antrenament intelectual și beneficii educaționale pentru utilizatori cu interese diferite.

În timpul pregătirii acestei lucrări a fost utilizat OpenAI GPT pentru îmbunătățirea clarității și pentru sprijin în redactare. După utilizarea acestui instrument, conținutul a fost revizuit și editat, iar autorul își asumă responsabilitatea pentru forma finală a lucrării.

### 2.1. Introducere în industria jocurilor video

În ultimele decenii, industria jocurilor video a cunoscut o creștere exponențială, jocurile ajungând să fie privite ca mai mult decât o pauză recreativă sau o formă de evadare din rutina zilnică. Ele au devenit un fenomen cultural și un sector major al industriei de divertisment. Această industrie este una dintre cele mai mari, mai profitabile și mai rapid dezvoltate industrii de divertisment la nivel global.

Pe măsură ce industria s-a extins, și publicul său s-a diversificat. Deși jocurile video au fost asociate în mod tradițional cu un public tânăr, în ultimii ani comunitatea de jucători a devenit mult mai variată. Popularitatea jocurilor mobile și a jocurilor simple, cu reguli ușor de înțeles, a extins accesul către categorii de vârstă și niveluri de experiență foarte diferite.

Jocurile au devenit progresiv mai complexe, folosind grafică, interacțiuni cu utilizatorul, povestire, provocări și mecanici atent construite. Aceste elemente sunt proiectate pentru a oferi utilizatorilor competiție, entuziasm, satisfacție, imersiune și sentimentul de progres.

Totuși, pentru ca un joc sau o aplicație interactivă să rămână relevantă și să nu devină rapid repetitivă, aceasta trebuie să fie suficient de captivantă pentru publicul țintă. O metodă importantă prin care acest lucru poate fi obținut este generarea procedurală de conținut.

### 2.2. Introducere în generarea procedurală de conținut

Generarea procedurală de conținut are numeroase utilizări în proiectarea jocurilor și aplicațiilor interactive. Probabil cea mai comună utilizare este creșterea rejucabilității, deoarece un conținut variat poate duce la experiențe diferite de la o sesiune la alta. De asemenea, generarea procedurală poate fi folosită pentru a construi aplicații care se adaptează la nivelul de competență, preferințele sau acțiunile utilizatorului.

Un concept strâns legat de rejucabilitate este adaptabilitatea: folosirea generării procedurale de conținut pentru ajustarea conținutului în funcție de acțiunile, preferințele sau nivelul utilizatorului. Adaptabilitatea poate îmbunătăți rejucabilitatea și poate diversifica baza de utilizatori, încurajând participarea persoanelor cu stiluri și niveluri diferite.

În cazul LearnAi, generarea procedurală nu se limitează la crearea aleatorie a unor elemente simple, ci este susținută de inteligență artificială generativă. Întrebările sunt produse dinamic, pe baza categoriilor, dificultății și contextului trimis către backend. Astfel, aplicația poate oferi conținut nou fără ca fiecare întrebare să fie introdusă manual.

### 2.3. Introducere în inteligența artificială

Inteligența artificială reprezintă un domeniu al informaticii care urmărește crearea de sisteme capabile să realizeze sarcini asociate în mod obișnuit cu inteligența umană, precum înțelegerea limbajului, recunoașterea tiparelor, generarea de conținut, luarea deciziilor și adaptarea la contexte noi.

În cadrul aplicațiilor interactive, inteligența artificială poate avea mai multe roluri. Ea poate controla comportamentul unor personaje, poate adapta dificultatea jocului, poate genera lumi și obiective sau poate crea conținut textual personalizat. Într-o aplicație de trivia, valoarea principală a AI constă în capacitatea de a produce întrebări variate, relevante și formulate natural.

Modelele de limbaj moderne, precum GPT, au capacitatea de a genera text coerent, contextual și adaptat cerințelor primite. Acest lucru le face potrivite pentru aplicații care au nevoie de conținut nou, flexibil și ușor de personalizat.

## 3. Problema

Dezvoltarea unei aplicații interactive de trivia ridică mai multe provocări importante. Aceste provocări sunt legate de menținerea interesului utilizatorului, reducerea costurilor de creare a conținutului, accesibilitatea aplicației pe dispozitive diferite și păstrarea progresului în mod sigur.

### 3.1. Probleme de rejucabilitate

Una dintre principalele provocări ale jocurilor de trivia este repetarea întrebărilor. Dacă utilizatorii întâlnesc aceleași întrebări în mod repetat, experiența devine previzibilă, iar interesul scade. Pentru ca aplicația să rămână atractivă, este necesar ca fiecare sesiune să ofere un nivel ridicat de varietate.

Această problemă este cu atât mai relevantă pentru o aplicație educațională, unde utilizatorul trebuie să simtă că învață sau își testează cunoștințele într-un mod nou. Repetarea excesivă poate transforma procesul într-o memorare mecanică, nu într-o experiență de învățare activă.

### 3.2. Costuri de mentenanță

Costurile de mentenanță reprezintă o altă provocare semnificativă. După lansarea unei aplicații, munca nu se încheie. Dezvoltatorii trebuie să corecteze erori, să trateze probleme de securitate, să mențină compatibilitatea cu browsere și servicii externe și să se asigure că experiența utilizatorului rămâne stabilă.

Într-o aplicație care depinde de generarea de conținut, mentenanța poate deveni și mai costisitoare dacă întrebările trebuie actualizate manual. Fără o strategie clară, dezvoltatorii pot ajunge să aloce mult timp întreținerii conținutului în loc să îmbunătățească produsul.

### 3.3. Costuri de dezvoltare a conținutului

Crearea de conținut atractiv și de calitate este o provocare majoră. Utilizatorii moderni se așteaptă la o experiență bogată, variată și adaptată intereselor lor. Într-o aplicație de trivia, acest lucru presupune un volum mare de întrebări, răspunsuri, explicații și categorii.

Pe măsură ce utilizatorii devin familiarizați cu întrebările existente, este necesară adăugarea constantă de conținut nou. Acest proces poate implica timp, muncă manuală și verificare continuă, ceea ce crește costurile de dezvoltare.

### 3.4. Dezvoltare dependentă de platformă

O altă problemă este legată de aplicațiile proiectate pentru o singură platformă. Dacă o aplicație funcționează doar pe Android, iOS sau desktop, accesul utilizatorilor este limitat. Suportarea mai multor platforme poate crește costurile, deoarece fiecare platformă poate avea cerințe, optimizări și procese de testare specifice.

Pentru LearnAi, abordarea web rezolvă în mare parte această problemă. O aplicație web poate fi accesată din browser, de pe dispozitive diferite, fără instalarea unei aplicații native.

### 3.5. Păstrarea progresului pe mai multe dispozitive

Păstrarea progresului utilizatorului pe mai multe dispozitive este o provocare importantă. Utilizatorii se așteaptă să poată trece de la un dispozitiv la altul fără să piardă scoruri, niveluri, profiluri sau istoricul sesiunilor.

Acest lucru necesită autentificare, stocare în cloud și sincronizare corectă a datelor. Fără aceste mecanisme, utilizatorii se pot confrunta cu pierderi de progres, conflicte de date sau o experiență inconsistentă.

## 4. Soluția

În capitolul anterior au fost identificate mai multe provocări majore: asigurarea rejucabilității, gestionarea costurilor de mentenanță și dezvoltare, crearea continuă de conținut proaspăt și păstrarea progresului utilizatorului. Acest capitol prezintă soluțiile implementate în LearnAi pentru abordarea acestor probleme.

### 4.1. Strategii pentru rejucabilitate și generare de conținut

**Generarea dinamică a întrebărilor.** Pentru a rezolva problema rejucabilității, LearnAi folosește OpenAI GPT pentru generarea întrebărilor de trivia în timp real. Această abordare asigură faptul că fiecare sesiune oferă un set nou de întrebări, reducând repetarea și menținând interesul utilizatorului. Prin utilizarea inteligenței artificiale, aplicația poate furniza constant conținut nou fără actualizări manuale frecvente.

**Categorii definite de utilizator.** LearnAi crește implicarea utilizatorului prin posibilitatea de a alege categoriile întrebărilor. Această funcționalitate personalizează experiența și permite utilizatorilor să adapteze conținutul la propriile interese. Utilizatorii pot selecta categorii existente sau pot introduce categorii personalizate, iar AI generează întrebări relevante pentru sesiunea curentă.

**Generare procedurală de conținut.** Pentru reducerea costurilor de creare a conținutului, LearnAi folosește generarea procedurală prin AI. Prin crearea algoritmică a întrebărilor și a opțiunilor de răspuns, aplicația poate furniza un volum ridicat de conținut fără ca fiecare element să fie redactat manual. Această metodă asigură o experiență variată și menține costurile de dezvoltare sub control.

Prin urmare, problema rejucabilității este abordată prin implementarea OpenAI GPT ca element central al sistemului de generare a întrebărilor. Modelul folosește capacități avansate de procesare a limbajului natural și o bază largă de cunoștințe pentru a crea întrebări clare, variate și potrivite nivelului ales.

### 4.1.1. Beneficiile utilizării OpenAI GPT

**Bază de cunoștințe diversă.** Modelul GPT este antrenat pe un set foarte larg de date, care acoperă numeroase domenii. Această bază de cunoștințe permite aplicației LearnAi să genereze întrebări despre aproape orice subiect, oferind o experiență bogată și variată.

**Capacități de procesare a limbajului natural.** Capacitățile avansate de procesare a limbajului natural permit generarea unui text asemănător celui uman, coerent și relevant contextual. Acest aspect este esențial pentru crearea de întrebări nu doar corecte, ci și ușor de înțeles.

**Versatilitate.** Capacitatea de a genera conținut în timp real, fără actualizări manuale extinse, reprezintă un avantaj important pentru menținerea implicării utilizatorilor. Dezvoltatorii se pot concentra pe arhitectură, interfață, securitate și experiența utilizatorului, în timp ce modelul AI gestionează generarea conținutului.

**Control prin backend.** În LearnAi, integrarea OpenAI este realizată prin backend, nu direct din frontend. Această alegere protejează cheia API, permite validarea răspunsurilor și reduce riscul ca datele sensibile să fie expuse în browser.

### 4.2. Soluții pentru reducerea costurilor de mentenanță și dezvoltare

Prin integrarea OpenAI pentru generarea întrebărilor în timp real, LearnAi reduce semnificativ costurile de mentenanță și dezvoltare a conținutului. Sarcina principală devine menținerea apelurilor API funcționale, validate și actualizate, ceea ce necesită mai puțin efort decât crearea manuală continuă a întrebărilor.

Un avantaj important al API-ului OpenAI este ușurința integrării. Serviciul este documentat și poate fi accesat prin cereri HTTP standard, ceea ce permite includerea sa într-un backend ASP.NET Core. În LearnAi, backend-ul primește cererea de la client, construiește promptul, trimite cererea către OpenAI și validează răspunsul înainte ca întrebarea să ajungă la utilizator.

### 4.3. Soluții pentru accesibilitate pe platforme diferite

LearnAi a fost dezvoltat ca aplicație web pentru a asigura accesibilitate pe mai multe dispozitive. Alegerea unui frontend React rulat în browser reduce dependența de platforme specifice și permite utilizatorilor să acceseze aplicația de pe laptop, desktop, tabletă sau telefon, în funcție de browserul disponibil.

Această abordare simplifică procesul de dezvoltare, deoarece nu este necesară menținerea separată a unor aplicații native pentru Android, iOS sau desktop. În schimb, aplicația folosește tehnologii web moderne, iar actualizările pot fi livrate centralizat.

### 4.4. Soluție pentru păstrarea progresului

Pentru păstrarea progresului utilizatorului, LearnAi utilizează Firebase Authentication și Cloud Firestore. Firebase Authentication gestionează autentificarea prin email și parolă, iar Firestore stochează profilul utilizatorului, scorurile, nivelul, istoricul sesiunilor, leaderboard-ul și testele personalizate.

Prin folosirea stocării în cloud, utilizatorii își pot accesa progresul după autentificare, fără să depindă de un singur dispozitiv. Această soluție reduce riscul de pierdere a datelor și permite sincronizarea informațiilor între sesiuni.

## 5. Abordare și implementare

În acest capitol este prezentată implementarea tehnică a aplicației LearnAi, cu accent pe instrumentele și tehnologiile utilizate pentru realizarea proiectului.

Nucleul aplicației este format dintr-un frontend React/TypeScript, un backend ASP.NET Core și servicii externe pentru autentificare, stocare și generare AI. React este responsabil pentru interfața utilizatorului și pentru gestionarea stării aplicației în browser. ASP.NET Core expune endpoint-uri HTTP pentru generarea întrebărilor și pentru gestionarea testelor personalizate. Firebase oferă autentificare și stocare, iar OpenAI este folosit pentru generarea întrebărilor de trivia.

### 5.1. Designul aplicației

Designul LearnAi combină elemente vizuale moderne cu funcționalități clare, pentru a crea o experiență prietenoasă și ușor de folosit. Interfața include ecrane pentru autentificare, configurarea quiz-ului, rularea sesiunii, dashboard, leaderboard, setări, personalizarea avatarului și crearea testelor personalizate.

### 5.1.1. Pagina de autentificare

Pagina de autentificare reprezintă punctul de intrare în aplicație. Utilizatorii se pot înregistra și autentifica prin email și parolă, iar după autentificare aplicația încarcă profilul asociat din Firestore.

Autentificarea este importantă deoarece permite salvarea progresului, a scorului, a nivelului și a preferințelor utilizatorului. Fără autentificare, aplicația ar putea funcționa doar ca o sesiune temporară, fără istoric și fără continuitate între dispozitive.

### 5.1.2. Ecranul de configurare a jocului

Ecranul de configurare permite utilizatorilor să își adapteze experiența de joc. Utilizatorul poate alege categoriile întrebărilor, dificultatea și durata sesiunii.

**Categorii de întrebări.** Utilizatorii pot selecta sau introduce categorii, ceea ce permite o experiență de trivia personalizată. Această funcționalitate face ca întrebările să fie relevante pentru interesele utilizatorului.

**Niveluri de dificultate.** Aplicația include niveluri de dificultate precum ușor, mediu și greu. Dificultatea aleasă este trimisă către backend și inclusă în cererea de generare a întrebării.

**Durata jocului.** Durata sesiunii controlează numărul de întrebări. Utilizatorii pot alege variante predefinite sau pot configura un număr personalizat de întrebări.

**Metode de ajutor.** LearnAi include metode de ajutor care pot fi utilizate în timpul jocului:

- 50/50 elimină două răspunsuri incorecte;
- Reveal answer afișează răspunsul corect;
- Hint afișează un indiciu pentru întrebarea curentă.

Aceste metode pot fi folosite o singură dată într-o sesiune, ceea ce oferă sprijin fără a elimina complet provocarea.

### 5.1.3. Ecranul de încărcare

Ecranul de încărcare apare în timpul generării întrebărilor. Deoarece întrebările sunt obținute printr-un serviciu extern, aplicația trebuie să trateze perioadele de așteptare, răspunsurile lente și posibilele erori de conexiune.

LearnAi folosește animații și mesaje vizuale pentru a păstra utilizatorul informat. În cazul în care OpenAI sau Firebase nu sunt disponibile, aplicația poate afișa o eroare și poate permite utilizatorului să reîncerce.

### 5.1.4. Ecranul de joc

Ecranul de joc este centrul experienței LearnAi. Acesta afișează întrebarea curentă și patru variante de răspuns. Utilizatorul selectează un răspuns, iar aplicația oferă feedback imediat după trimitere.

O caracteristică importantă este absența presiunii unui cronometru strict. Utilizatorul poate răspunde în propriul ritm, ceea ce creează o experiență mai relaxată și mai potrivită pentru învățare.

Utilizatorii primesc puncte XP pentru răspunsurile corecte, iar progresul este afișat prin scor, nivel și indicatori vizuali. Sistemul de nivel este conceput pentru a motiva utilizatorii să continue și să observe evoluția în timp.

### 5.1.5. Dashboard și leaderboard

Dashboard-ul oferă utilizatorului o imagine de ansamblu asupra progresului său. Sunt afișate informații precum nivelul, scorul, numărul de sesiuni, acuratețea, răspunsurile corecte și istoricul recent.

Leaderboard-ul afișează clasamentul utilizatorilor după scor, creând un element competitiv. Această funcționalitate încurajează utilizatorii să revină, să își îmbunătățească performanța și să compare progresul cu alți jucători.

### 5.1.6. Teste personalizate

O funcționalitate importantă a aplicației LearnAi este crearea testelor personalizate. Utilizatorii pot construi propriile teste, pot adăuga întrebări și răspunsuri, pot marca răspunsul corect și pot salva testul ca draft sau îl pot publica.

Pentru testele publicate, backend-ul validează răspunsurile și nu trimite către browser cheia răspunsurilor corecte. Această alegere îmbunătățește securitatea și previne aflarea răspunsurilor prin inspectarea datelor din frontend.

### 5.1.7. Personalizarea avatarului

LearnAi include un sistem de personalizare a avatarului. Utilizatorul poate modifica stilul avatarului, culorile, părul, accesoriile și alte elemente vizuale. Unele opțiuni pot fi asociate cu nivelul utilizatorului, ceea ce transformă progresul într-un mecanism de deblocare vizuală.

Această funcționalitate contribuie la identitatea utilizatorului în aplicație și face profilul mai personal.

### 5.2. Implementare tehnică

Frontend-ul este construit cu React și TypeScript. React gestionează componentele vizuale, starea aplicației și interacțiunile utilizatorului. TypeScript ajută la definirea tipurilor pentru întrebări, răspunsuri, profiluri, sesiuni și teste personalizate.

Backend-ul este construit cu ASP.NET Core și expune endpoint-uri HTTP sub ruta `/api`. Endpoint-ul `/api/trivia/question` primește categoriile și dificultatea, apoi folosește serviciul OpenAI pentru a genera o întrebare. Endpoint-urile `/api/custom-tests` gestionează salvarea, publicarea, listarea și validarea răspunsurilor pentru testele personalizate.

Firebase este folosit pentru autentificare și stocare. În frontend, Firebase Authentication gestionează utilizatorul curent, iar Firestore păstrează profilurile, sesiunile, leaderboard-ul și testele. În backend, cererile pentru testele personalizate sunt asociate cu utilizatorul autentificat prin token-ul Firebase.

OpenAI este folosit pentru generarea întrebărilor. Cheia API nu este expusă în frontend, ci este citită în backend din configurație sau variabilă de mediu. Această structură separă responsabilitățile și protejează datele sensibile.

### 5.3. Firebase

Firebase oferă servicii potrivite pentru aplicații web care au nevoie de autentificare și sincronizare rapidă a datelor. În LearnAi, Firebase Authentication permite înregistrarea și autentificarea utilizatorilor prin email și parolă.

Cloud Firestore este folosit pentru stocarea datelor aplicației. Informațiile salvate includ profilul utilizatorului, numele afișat, avatarul, nivelul, scorul, sesiunile finalizate, leaderboard-ul și testele personalizate.

Prin această structură, aplicația poate oferi o experiență persistentă. Utilizatorul își poate închide browserul, se poate autentifica ulterior și își poate regăsi progresul.

### 5.4. OpenAI

Integrarea OpenAI în LearnAi are rolul de a gestiona generarea dinamică a întrebărilor de trivia. Prin utilizarea modelului GPT, aplicația poate genera întrebări unice, relevante contextual și adaptate dificultății alese.

Procesul de integrare include:

- configurarea cheii API în backend;
- construirea unei cereri pe baza categoriilor și dificultății;
- trimiterea cererii către OpenAI;
- parsarea răspunsului;
- validarea structurii întrebării;
- returnarea întrebării către frontend.

Validarea este importantă deoarece răspunsul AI trebuie să respecte forma așteptată: o întrebare, patru variante de răspuns, exact un răspuns corect și un indiciu. Dacă răspunsul nu respectă schema, backend-ul poate trata eroarea în loc să trimită date invalide către utilizator.

### 5.5. Testare și verificare

Aplicația include verificări pentru backend și build-uri pentru frontend. Testarea este importantă deoarece aplicația depinde de mai multe componente: React, ASP.NET Core, Firebase și OpenAI. O eroare într-o singură componentă poate afecta întregul flux al utilizatorului.

Pentru backend, testele verifică logica de validare și comportamentul serviciilor. Pentru frontend, build-ul confirmă că aplicația poate fi compilată și livrată fără erori de tip sau de bundling.

## 6. Îmbunătățiri viitoare

Acest capitol prezintă direcții posibile pentru îmbunătățirea experienței LearnAi și pentru implicarea utilizatorilor în moduri noi.

1. **Conținut generat de utilizatori.** Utilizatorii pot contribui cu întrebări, categorii și teste, extinzând conținutul aplicației și stimulând implicarea comunității. LearnAi include deja o bază pentru testele personalizate, iar această funcționalitate poate fi extinsă.

2. **Mod multiplayer.** Introducerea unor sesiuni de trivia în timp real ar putea încuraja interacțiunea socială și competiția directă între utilizatori.

3. **Mod de învățare ghidată.** Aplicația ar putea include trasee educaționale, lecții scurte sau recomandări de categorii pe baza performanței anterioare.

4. **Formate noi de întrebări.** Întrebările pot fi extinse dincolo de varianta cu răspuns multiplu. Exemplele includ răspunsuri deschise, întrebări de tip „cel mai apropiat răspuns”, ordonare, asociere sau completare.

5. **Încărcare de documente.** O direcție importantă este transformarea materialelor încărcate de utilizator în quiz-uri. Interfața LearnAi include deja o zonă pentru încărcarea unui document, iar funcționalitatea poate fi completată prin extragerea textului și generarea automată a întrebărilor.

6. **Analiză avansată a progresului.** Dashboard-ul poate fi extins cu recomandări personalizate, grafice de evoluție și identificarea categoriilor unde utilizatorul are nevoie de exercițiu suplimentar.

Viitorul LearnAi oferă numeroase posibilități de creștere, inovare și extindere. Prin conținut generat de utilizatori, moduri competitive, trasee educaționale și formate noi de întrebări, aplicația poate continua să fie relevantă și captivantă.

## 7. Concluzie

În contemplarea ideii căutării permanente a cunoașterii, suntem amintiți de diferența dintre acumularea de informații și înțelegerea reală. Inteligența artificială pare să aibă acces la o cantitate vastă de cunoștințe, însă înțelegerea umană rămâne un proces mai profund, legat de context, reflecție și interpretare. Această observație este relevantă pentru LearnAi, unde dorința de cunoaștere se intersectează cu evoluția inteligenței artificiale și cu aplicațiile educaționale interactive.

În concluzie, dezvoltarea LearnAi a fost un proces provocator și valoros. Pe parcursul implementării, proiectul a întâmpinat provocări legate de integrarea serviciilor externe, securizarea datelor, generarea conținutului și menținerea unei experiențe fluide pentru utilizator. Cu toate acestea, utilizarea tehnologiilor moderne, precum OpenAI GPT, React, ASP.NET Core și Firebase, a dus la realizarea unei aplicații web funcționale și extensibile.

LearnAi reprezintă o inițiativă relevantă în zona aplicațiilor educaționale interactive, având scopul de a oferi utilizatorilor o experiență captivantă și stimulantă intelectual. Prin abordarea unor provocări precum rejucabilitatea, costurile de mentenanță, crearea de conținut și accesibilitatea pe mai multe dispozitive, LearnAi demonstrează potențialul tehnologiilor avansate în construirea unor instrumente moderne de învățare.

Integrarea generării dinamice de întrebări, interfața prietenoasă, sistemul de scor și nivel, dashboard-ul, leaderboard-ul și testele personalizate evidențiază versatilitatea și eficiența abordării alese. În esență, LearnAi este mai mult decât un proiect software; este o reprezentare a creativității, a viziunii și a angajamentului pentru folosirea tehnologiei în sprijinul învățării.

## Observații de adaptare din lucrarea TrivAI

Următoarele elemente din lucrarea de licență TrivAI au fost păstrate ca idee și traduse/adaptate pentru LearnAi:

- explicațiile despre rejucabilitate și generarea procedurală de conținut;
- motivația folosirii OpenAI GPT pentru generarea întrebărilor;
- structura problemă/soluție pentru costuri de mentenanță, conținut și progres între dispozitive;
- descrierea ecranelor principale: autentificare, configurare joc, încărcare, gameplay, statistici;
- metodele de ajutor 50/50, reveal answer și hint;
- sistemul de scor, XP, nivel și leaderboard;
- capitolele de îmbunătățiri viitoare și concluzie.

Elementele care nu au fost păstrate literal deoarece nu se potrivesc tehnic cu LearnAi:

- Unity, Unity Canvas, TextMeshPro, DOTween și Asset Store;
- PlayFab ca backend principal;
- BestHTTP și implementarea specifică Unity pentru OpenAI;
- ThreadID/AssistantID ca mecanism central de memorie, deoarece aplicația LearnAi curentă folosește backend ASP.NET Core și salvează `openAiPreviousResponseId` unde este cazul.
