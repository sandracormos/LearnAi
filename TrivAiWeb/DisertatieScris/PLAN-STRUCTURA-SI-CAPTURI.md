# Structură recomandată pentru forma finală

## Abstract

Rămâne nenumerotat și nu trebuie inclus ca „Capitolul 1”.

## Capitolul 1. Introducere

- 1.1. Contextul și actualitatea temei
- 1.2. Motivația alegerii temei
- 1.3. Obiectivele lucrării
- 1.4. Contribuțiile proprii și structura lucrării

## Capitolul 2. Stadiul actual al cercetării

- 2.1. Platforme de e-learning și educația digitală
- 2.2. Generarea procedurală de conținut
- 2.3. Inteligența artificială: concepte strict necesare
- 2.4. Inteligența artificială în educație
- 2.5. Gamificarea și testarea prin recuperarea informației
- 2.6. Soluții existente: Moodle, Kahoot! și Khanmigo
- 2.7. Sinteza analizei și poziționarea LearnAI

Istoria generală a AI poate fi păstrată, dar scurtată. Exemplele Rogue, The Sims și Minecraft trebuie folosite numai pentru a explica generarea și controlul parametrilor; nu trebuie să ocupe o parte importantă din lucrare.

## Capitolul 3. Analiza problemei și cerințele sistemului

- 3.1. Problema diversității conținutului
- 3.2. Costul producerii și întreținerii conținutului
- 3.3. Menținerea implicării utilizatorilor
- 3.4. Persistența progresului între dispozitive
- 3.5. Cerințe funcționale
- 3.6. Cerințe nefuncționale
- 3.7. Actori și cazuri principale de utilizare

## Capitolul 4. Proiectarea soluției LearnAI

- 4.1. Arhitectura generală
- 4.2. Proiectarea fluxului de generare a întrebărilor
- 4.3. Proiectarea modelului de date
- 4.4. Proiectarea mecanismelor de gamificare
- 4.5. Securitate și protecția datelor
- 4.6. Decizii tehnologice și alternative analizate

## Capitolul 5. Implementarea și descrierea aplicației

- 5.1. Frontend React și TypeScript
- 5.2. Backend ASP.NET Core
- 5.3. Integrarea OpenAI
- 5.4. Firebase Authentication și Cloud Firestore
- 5.5. Testele personalizate și protejarea răspunsurilor
- 5.6. Implementarea gamificării
- 5.7. Descrierea interfeței

## Capitolul 6. Testare și evaluare

- 6.1. Strategia de testare
- 6.2. Teste automate și rezultate tehnice
- 6.3. Evaluarea conținutului generat
- 6.4. Limitările evaluării

## Capitolul 7. Direcții de dezvoltare viitoare

## Capitolul 8. Concluzii

# Prezentarea informațiilor

Statisticile din studii, comparația cu soluțiile existente, cerințele și rezultatele testării sunt prezentate prin paragrafe scurte și enumerări. Nu se introduc tabele suplimentare; rămân numai tabelele care aparțin șablonului original al universității.

# Figuri realizate pentru lucrare

1. `figuri/figura-arhitectura-learnai.svg`
   - Poziție: secțiunea 4.1, imediat după primul paragraf care enumeră React, ASP.NET Core, OpenAI și Firebase.
   - Referire în text: „Componentele principale și relațiile dintre acestea sunt prezentate în Figura 4.1.”
   - Legendă: **Figura 4.1. Arhitectura generală a aplicației LearnAI (realizare proprie).**

2. `figuri/figura-flux-generare-intrebare.svg`
   - Poziție: secțiunea 4.2, după descrierea fluxului complet.
   - Referire în text: „Succesiunea etapelor de generare și validare este sintetizată în Figura 4.2.”
   - Legendă: **Figura 4.2. Fluxul generării și validării unei întrebări (realizare proprie).**

# Capturi necesare din aplicație

Toate capturile trebuie realizate la aceeași rezoluție, recomandat 1440×900, fără bara browserului și fără adrese de e-mail reale.

1. **Pagina de autentificare**
   - Poziție: 5.7.1.
   - Conținut: formularul de autentificare și identitatea vizuală LearnAI.
   - Legendă: „Figura 5.1. Pagina de autentificare a aplicației LearnAI.”

2. **Dashboard după autentificare**
   - Poziție: 5.7.2.
   - Conținut: nivel, XP, streak, acuratețe și sesiuni recente. Folosește un cont demonstrativ cu date, nu un profil gol.
   - Legendă: „Figura 5.2. Dashboard-ul utilizatorului și indicatorii de progres.”

3. **Configurarea unui quiz**
   - Poziție: 5.7.3.
   - Conținut: categoria, dificultatea și numărul de întrebări; selecțiile trebuie să fie vizibile.
   - Legendă: „Figura 5.3. Configurarea unei sesiuni de întrebări generate.”

4. **Ecranul unei întrebări**
   - Poziție: 5.7.4.
   - Conținut: întrebare, patru variante, progresul sesiunii și opțiunile Hint/50-50/Reveal. Nu captura ecranul de încărcare în locul funcționalității principale.
   - Legendă: „Figura 5.4. Interfața de rezolvare a unei întrebări generate.”

5. **Feedback după răspuns sau ecranul de final**
   - Poziție: 5.7.4, după explicația scorului.
   - Conținut: marcarea răspunsului, XP obținut și rezultatul sesiunii.
   - Legendă: „Figura 5.5. Feedbackul oferit utilizatorului după finalizarea unei sesiuni.”

6. **Editorul de teste personalizate**
   - Poziție: 5.7.5.
   - Conținut: titlul, o întrebare completă, variantele și acțiunile Draft/Publish.
   - Legendă: „Figura 5.6. Crearea și publicarea unui test personalizat.”

7. **Clasamentul**
   - Poziție: 5.7.6.
   - Conținut: minimum trei conturi demonstrative, fără date personale reale.
   - Legendă: „Figura 5.7. Clasamentul utilizatorilor în funcție de experiența acumulată.”

8. **Personalizarea avatarului**
   - Poziție: 5.7.7.
   - Conținut: previzualizarea avatarului, opțiunile de stil și cel puțin o opțiune blocată de nivel.
   - Legendă: „Figura 5.8. Interfața de personalizare a avatarului.”

Nu este necesară o captură separată pentru fiecare meniu. Opt capturi bine alese sunt suficiente pentru a descrie interfața fără a transforma lucrarea într-un manual de utilizare.

# Reguli pentru cod

Se recomandă cel mult două fragmente scurte:

1. schema JSON strictă folosită pentru răspunsul OpenAI;
2. validarea care impune exact patru variante și un singur răspuns corect.

Restul implementării trebuie explicat prin diagrame, fluxuri și decizii tehnice. Codul complet rămâne în proiectul anexat.
