# Evaluarea OpenAI pentru LearnAI

Evaluarea generează 50 de întrebări reale prin backend-ul LearnAI:

- 5 categorii, câte 10 întrebări fiecare;
- 4 întrebări Easy, 3 Medium și 3 Hard pentru fiecare categorie;
- 5 lanțuri Responses API independente, câte unul pentru fiecare categorie;
- latență măsurată pentru fiecare cerere;
- conformitate structurală verificată automat;
- verificare factuală separată, cu sursă pentru fiecare întrebare.

## Rulare

Pornește backend-ul pe `http://127.0.0.1:5000`, apoi execută:

```powershell
powershell -ExecutionPolicy Bypass -File .\DisertatieScris\evaluare-openai\run-evaluation.ps1
```

Rezultatele sunt scrise în folderul `results`:

- `raw-results.json` — cererile și răspunsurile complete;
- `automated-results.csv` — rezultate automate ușor de analizat;
- `automated-summary.json` — latență și conformitate structurală;
- `factual-review.csv` — fișa de verificare factuală.

În `factual-review.csv`, fiecare rând trebuie verificat folosind o sursă credibilă. Completează:

- `factualStatus`: `Correct`, `Incorrect` sau `Ambiguous`;
- `sourceUrl`: sursa folosită;
- `reviewNotes`: explicația verificării.

Apoi execută:

```powershell
powershell -ExecutionPolicy Bypass -File .\DisertatieScris\evaluare-openai\summarize-review.ps1
```

Procentul factual este publicabil numai când toate cele 50 de rânduri sunt verificate și au surse.
