# Raport de evidență - evaluarea gpt-4o-mini în LearnAI

## Identificarea rulării

- Data rulării: 2026-06-25T00:24:51.8713716+03:00
- Commit Git: `adc554e6b6aefe5d0d64b80c61087457e78bb48a`
- Model configurat: `gpt-4o-mini`
- Endpoint LearnAI testat: `http://127.0.0.1:5238/api/trivia/question`
- Număr planificat de întrebări: 50

## Metodologie

Au fost generate 50 de întrebări prin backend-ul real LearnAI, nu prin răspunsuri simulate. Eșantionul conține cinci categorii: History, Geography, Science, Technology și General Knowledge, cu zece întrebări pentru fiecare categorie. Distribuția pe categorie a fost de patru întrebări Easy, trei Medium și trei Hard. Fiecare categorie a utilizat un lanț Responses API separat, iar întrebările anterioare din același lanț au fost transmise pentru reducerea repetării.

Latența reprezintă timpul total observat de client pentru cererea HTTP către backend. Validarea structurală a cerut text și indiciu nenule, exact patru variante nenule și exact o variantă marcată drept corectă. Verificarea factuală a fost realizată separat și fiecare rând din `factual-review.csv` conține clasificare, sursă și observație.

## Rezultate automate

| Metrică | Rezultat |
|---|---:|
| Cereri reușite | 50 / 50 |
| Cereri eșuate | 0 |
| Răspunsuri valide structural | 50 / 50 (100%) |
| Latență medie | 2.154 s |
| Latență mediană | 2.018 s |
| Percentila 95 a latenței | 2.844 s |

## Rezultate factuale

| Clasificare | Număr | Procent din 50 |
|---|---:|---:|
| Corecte | 43 | 86% |
| Incorecte | 2 | 4% |
| Ambigue | 5 | 10% |

### Întrebări incorecte

- Întrebarea 7: Who was the British Prime Minister at the start of World War II? - răspuns marcat: Winston Churchill. Neville Chamberlain, not Winston Churchill, was prime minister when Britain entered the war in September 1939. Sursă: https://www.gov.uk/government/history/past-prime-ministers/neville-chamberlain
- Întrebarea 19: Which country possesses the largest island in the world? - răspuns marcat: Greenland. Greenland is the largest island, but it is not a country among the choices; it is an autonomous territory in the Kingdom of Denmark. The question asks which country possesses it. Sursă: https://denmark.dk/people-and-culture/greenland

### Întrebări ambigue

- Întrebarea 9: What was the primary cause of the Thirty Years' War in Europe? - Religious conflict was central, but dynastic and territorial struggles were also major causes; 'primary' is contestable. Sursă: https://www.britannica.com/event/Thirty-Years-War
- Întrebarea 10: Which empire was known for its use of the falcon as a symbol of power and the concept of Ma'at? - Horus and Ma'at are Egyptian concepts, but 'Egyptian Empire' and a single falcon symbol of imperial power are imprecise. Sursă: https://www.britannica.com/topic/ancient-Egyptian-religion
- Întrebarea 12: Which river is the longest in the world? - The Nile is conventionally listed as longest, but measurements and the Amazon claim remain disputed. Sursă: https://www.britannica.com/place/Nile-River
- Întrebarea 36: Which programming language is known as the backbone of web development? - JavaScript is fundamental to interactive web development, but 'the backbone' is subjective and HTML/CSS are also foundational. Sursă: https://developer.mozilla.org/en-US/docs/Web/JavaScript
- Întrebarea 39: Which protocol is used for secure data transmission over a computer network? - TLS secures data in transit, but SSH is also a secure network protocol and is another offered option. Sursă: https://www.rfc-editor.org/rfc/rfc8446

## Fișiere de probă

- `raw-results.json`: răspunsurile complete, variantele, latențele și identificatorii OpenAI.
- `automated-results.csv`: rezultatele automate într-un format tabelar.
- `automated-summary.json`: sumarul latenței și al conformității structurale.
- `factual-review.csv`: toate cele 50 de verificări factuale, cu surse și observații.
- `factual-summary.json`: sumarul verificării factuale.
- `evaluation-table.png`: tabel grafic separat, fără inserare automată în disertație.
- `checksums.sha256`: amprente SHA-256 pentru detectarea modificării fișierelor de probă.

## Limitări

Rezultatul de 86% descrie numai acest eșantion de 50 de întrebări. Nu demonstrează performanța tuturor întrebărilor pe care modelul le poate genera și nu măsoară eficiența pedagogică. Latența depinde de conexiune, încărcarea serviciilor și mediul local.
