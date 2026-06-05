# Artefacte Project Management - TrivAI Web

## 1. Requirements Document

### Project overview

TrivAI Web este o aplicatie web educationala de tip quiz/trivia, dezvoltata ca MVP pentru proiectul TrivAI. Aplicatia permite utilizatorilor sa isi creeze cont, sa isi configureze profilul, sa porneasca sesiuni de trivia generate cu AI si sa isi urmareasca progresul prin scor, nivel, istoric si leaderboard.

### Business need

Utilizatorii care vor sa invete sau sa se antreneze prin intrebari de cultura generala au nevoie de o aplicatie interactiva, usor de accesat din browser, care sa genereze intrebari noi pe categorii alese de utilizator. Valoarea business consta in livrarea unei experiente educationale personalizate, cu progres salvat si elemente de gamification.

### Scope

In scope:

- autentificare utilizator cu email si parola;
- profil utilizator cu display name, nivel, scor si avatar configurabil;
- configurare joc: categorii, dificultate si durata;
- generare intrebari trivia prin backend ASP.NET Core si OpenAI API;
- afisare intrebare cu 4 raspunsuri si exact un raspuns corect;
- helper-e per joc: 50/50, reveal answer si hint;
- scor XP, nivel si progres sesiune;
- salvare sesiuni finalizate in Firestore;
- leaderboard cu cei mai buni jucatori;
- dashboard cu statistici si istoric sesiuni.

Out of scope pentru MVP:

- multiplayer in timp real;
- aplicatie mobile nativa;
- plata/subscriptii;
- administrare manuala a intrebarilor;
- Firebase Storage pentru imagini de avatar;
- integrare PlayFab.

### Stakeholders

| Stakeholder | Interes / responsabilitate |
| --- | --- |
| Utilizator final | Joaca quiz-uri, isi personalizeaza profilul si urmareste progresul. |
| Product Owner / Student | Stabileste functionalitatile, prioritatile si criteriile de acceptanta. |
| Developer | Implementeaza frontend, backend, integrare Firebase/OpenAI si infrastructura tehnica. |
| Profesor / Evaluator | Verifica functionalitatea, documentatia, infrastructura si prezentarea proiectului. |

### Functional requirements

| ID | Requirement | Prioritate | Criteriu de acceptanta |
| --- | --- | --- | --- |
| FR-01 | Utilizatorul se poate inregistra cu email si parola. | Must | Contul este creat in Firebase Authentication si profilul initial este salvat in Firestore. |
| FR-02 | Utilizatorul se poate autentifica si deloga. | Must | Dupa login, utilizatorul vede ecranul de joc si datele sale salvate. |
| FR-03 | Utilizatorul poate seta numele afisat si avatarul. | Should | Modificarile sunt salvate in profilul Firestore. |
| FR-04 | Utilizatorul poate alege categorii, dificultate si durata jocului. | Must | Aplicatia porneste o sesiune cu optiunile selectate. |
| FR-05 | Sistemul genereaza o intrebare trivia folosind OpenAI. | Must | Backend-ul returneaza o intrebare, 4 raspunsuri si un hint. |
| FR-06 | Fiecare intrebare are exact un raspuns corect. | Must | Backend-ul valideaza raspunsul primit de la OpenAI. |
| FR-07 | Utilizatorul poate raspunde la intrebare si primeste feedback. | Must | Raspunsul corect si raspunsul gresit sunt evidentiate dupa submit. |
| FR-08 | Utilizatorul poate folosi helper-ele 50/50, reveal answer si hint. | Should | Fiecare helper poate fi folosit o singura data intr-o sesiune. |
| FR-09 | Aplicatia calculeaza scorul XP, nivelul si progresul. | Must | Dupa fiecare raspuns, scorul si progresul sunt actualizate. |
| FR-10 | La finalul jocului, progresul este salvat. | Must | Sesiunea finalizata apare in istoricul utilizatorului. |
| FR-11 | Utilizatorul poate vedea dashboard-ul cu statistici. | Should | Dashboard-ul afiseaza nivel, scor, streak, acuratete si sesiuni recente. |
| FR-12 | Utilizatorul poate vedea leaderboard-ul. | Should | Leaderboard-ul afiseaza primii jucatori dupa scor. |

### Non-functional requirements

| ID | Requirement | Criteriu de acceptanta |
| --- | --- | --- |
| NFR-01 | Aplicatia trebuie sa fie web-based. | Frontend-ul ruleaza in browser prin React/Vite. |
| NFR-02 | Backend-ul trebuie sa expuna API HTTP. | ASP.NET Core expune endpoint-uri sub `/api`. |
| NFR-03 | Cheile secrete nu trebuie expuse in frontend. | OpenAI API key este citita in backend din configuratie sau variabila de mediu. |
| NFR-04 | Codul backend trebuie sa fie structurat pe responsabilitati. | Exista foldere separate pentru `DataStructures`, `Contracts`, `Endpoints`, `OpenAi`, `Services`, `Validation`. |
| NFR-05 | Aplicatia trebuie sa poata fi rulata local. | README contine comenzi pentru API si client. |
| NFR-06 | Proiectul trebuie sa permita testare automata si CI. | Va exista proiect de teste si workflow CI pentru build/test. |

### Constraints and assumptions

- Proiectul foloseste C#/.NET pentru backend si React/TypeScript pentru frontend.
- Firebase este folosit pentru autentificare, profiluri, leaderboard si sesiuni.
- OpenAI API este folosit pentru generarea intrebarilor.
- Utilizatorul are conexiune la internet pentru Firebase si OpenAI.
- MVP-ul este dezvoltat pentru prezentare academica si functionalitate redusa, nu pentru productie comerciala.

## 2. Planning - Agile Backlog

Metoda de planning aleasa este Agile Backlog, deoarece TrivAI este un produs software unde functionalitatile pot fi livrate incremental si ajustate pe baza feedback-ului.

### Product backlog

| ID | User story | Prioritate | Estimare | Criterii de acceptanta |
| --- | --- | --- | --- | --- |
| US-01 | Ca utilizator, vreau sa imi creez cont ca sa imi pot salva progresul. | Must | 5 SP | Register functioneaza cu email/parola; profilul este creat in Firestore. |
| US-02 | Ca utilizator, vreau sa ma autentific ca sa pot continua de unde am ramas. | Must | 3 SP | Login/logout functioneaza; datele profilului se incarca dupa autentificare. |
| US-03 | Ca utilizator, vreau sa aleg categoriile quiz-ului ca sa primesc intrebari relevante. | Must | 3 SP | Formularul permite categorii custom sau combinate. |
| US-04 | Ca utilizator, vreau sa aleg dificultatea si durata ca sa controlez nivelul jocului. | Must | 3 SP | Dificultatea si durata sunt trimise catre backend la pornirea jocului. |
| US-05 | Ca utilizator, vreau intrebari generate automat ca sa nu joc mereu aceleasi intrebari. | Must | 8 SP | Backend-ul genereaza intrebari prin OpenAI si returneaza schema asteptata. |
| US-06 | Ca utilizator, vreau sa vad 4 raspunsuri si sa selectez unul. | Must | 5 SP | UI-ul afiseaza 4 raspunsuri, permite selectia si submit-ul. |
| US-07 | Ca utilizator, vreau feedback dupa raspuns ca sa stiu daca am raspuns corect. | Must | 3 SP | Dupa submit, raspunsul corect/gresit este evidentiat vizual. |
| US-08 | Ca utilizator, vreau helper-e precum 50/50, hint si reveal answer. | Should | 5 SP | Helper-ele functioneaza si sunt limitate la o utilizare per sesiune. |
| US-09 | Ca utilizator, vreau scor si nivel ca sa am motivatie sa continui. | Must | 5 SP | Scorul si nivelul se actualizeaza pe baza raspunsurilor. |
| US-10 | Ca utilizator, vreau ca progresul sa fie salvat la finalul sesiunii. | Must | 5 SP | Sesiunea finalizata este salvata in Firestore. |
| US-11 | Ca utilizator, vreau dashboard cu statistici ca sa imi urmaresc evolutia. | Should | 5 SP | Dashboard-ul afiseaza nivel, scor, acuratete, streak si istoric. |
| US-12 | Ca utilizator, vreau leaderboard ca sa compar scorul cu alti jucatori. | Should | 3 SP | Leaderboard-ul afiseaza topul jucatorilor dupa scor. |
| US-13 | Ca utilizator, vreau sa imi personalizez avatarul ca sa am profil distinct. | Could | 5 SP | Avatarul poate fi editat si salvat in profil. |
| US-14 | Ca developer, vreau teste unitare pentru backend ca sa reduc riscul de regresii. | Must | 5 SP | Testele valideaza logica de validare si parsare. |
| US-15 | Ca developer, vreau CI pentru build si teste automate. | Must | 5 SP | Workflow-ul ruleaza build si teste la fiecare push/pull request. |
| US-16 | Ca developer, vreau deployment simplu ca sa demonstrez livrarea aplicatiei. | Must | 3 SP | Exista un pas automat sau script de publish/copy in folder de deploy. |

### Sprint plan propus

| Sprint | Obiectiv | User stories incluse | Rezultat asteptat |
| --- | --- | --- | --- |
| Sprint 1 | Baza aplicatiei si autentificare | US-01, US-02, US-03, US-04 | Utilizatorul se poate autentifica si configura o sesiune de joc. |
| Sprint 2 | Generare si rulare quiz | US-05, US-06, US-07, US-08 | Aplicatia poate genera intrebari si permite joc complet. |
| Sprint 3 | Progres si profil | US-09, US-10, US-11, US-12, US-13 | Progresul este salvat, dashboard-ul si leaderboard-ul sunt functionale. |
| Sprint 4 | Infrastructura tehnica | US-14, US-15, US-16 | Exista teste, CI, build automat si deployment simplu. |

### Definition of Done

O functionalitate este considerata terminata cand:

- codul este implementat si integrat in proiect;
- functionalitatea poate fi rulata local;
- erorile principale sunt tratate;
- criteriile de acceptanta sunt indeplinite;
- build-ul trece fara erori;
- pentru functionalitatile critice exista teste sau verificare manuala documentata.

## 3. Risk Log

| ID | Risc | Cauza | Probabilitate | Impact | Nivel | Raspuns / mitigare | Owner | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| R-01 | OpenAI API nu raspunde sau returneaza eroare. | Dependenta de serviciu extern si conexiune internet. | Medie | Mare | Ridicat | Tratare erori HTTP, mesaj pentru utilizator, retry manual prin buton Try again. | Developer | Deschis |
| R-02 | Cheia OpenAI este expusa accidental in repository. | Configurare locala salvata in fisiere versionate. | Medie | Mare | Ridicat | Folosirea variabilei de mediu `OPENAI_API_KEY`, eliminarea cheilor reale din fisierele comise. | Developer | Deschis |
| R-03 | Firebase nu este configurat corect. | Lipsa valorilor din `.env` sau reguli Firestore incorecte. | Medie | Mare | Ridicat | Documentare setup Firebase in README si validare `isFirebaseConfigured`. | Developer | In lucru |
| R-04 | Intrebarile generate nu respecta formatul asteptat. | Modelul AI poate produce raspuns incomplet sau invalid. | Medie | Mare | Ridicat | Folosirea JSON schema strict si validare backend pentru 4 raspunsuri si un singur raspuns corect. | Developer | In lucru |
| R-05 | Costurile API cresc necontrolat. | Generare frecventa de intrebari prin OpenAI. | Scazuta | Mediu | Mediu | Limitarea functionalitatii MVP, monitorizare usage si folosirea unui model low-cost. | Product Owner | Deschis |
| R-06 | Aplicatia devine greu de mentinut. | Logica prea multa in fisiere mari sau responsabilitati amestecate. | Medie | Mediu | Mediu | Refactorizare backend pe `DataStructures`, `Contracts`, `Endpoints`, `OpenAi`, `Services`, `Validation`. | Developer | In lucru |
| R-07 | Frontend bundle prea mare. | Asset-uri mari pentru avatar si hero image. | Medie | Scazut | Mediu | Optimizarea imaginilor si reducerea dimensiunilor asset-urilor. | Developer | Deschis |
| R-08 | Datele utilizatorului nu se salveaza corect. | Erori Firestore, conexiune sau reguli de securitate. | Medie | Mare | Ridicat | Tratare erori la salvare, refresh dashboard si reguli Firestore clare. | Developer | Deschis |
| R-09 | Scope-ul proiectului creste prea mult. | Idei noi precum multiplayer, mobile app sau admin panel. | Medie | Mediu | Mediu | Pastrarea MVP-ului si prioritizarea backlog-ului cu Must/Should/Could. | Product Owner | Deschis |
| R-10 | Proiectul nu indeplineste cerintele de infrastructura academica. | Lipsa testelor, CI, static analysis sau deployment. | Medie | Mare | Ridicat | Adaugare proiect de teste, GitHub Actions, static analysis si deployment simplu. | Developer | Deschis |

## Surse

- https://pm2.europa.eu/index_en
- README.md si structura curenta a proiectului TrivAI Web
