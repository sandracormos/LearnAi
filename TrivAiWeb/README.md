# TrivAI Web

Web MVP for the Unity TrivAI project, built with ASP.NET Core and React.

## Included

- Firebase Authentication with email/password.
- Firestore player profiles, saved progress, completed sessions and leaderboard.
- Local configurable player avatars saved as Firestore profile settings.
- Game setup: name, custom or combined categories, difficulty and duration.
- Question generation through the ASP.NET backend using the OpenAI Responses API.
- Multiple-choice answers, XP score, level and session progress.
- One-use-per-game helpers: 50/50, reveal answer and hint.
- One-question preloading in the client to reduce wait time between turns.
- No PlayFab for now. Firebase is used for authentication, profiles and leaderboards.

## OpenAI Configuration

Recommended: set the key as an environment variable:

```powershell
$env:OPENAI_API_KEY="sk-..."
```

Alternatively, for local development you can fill `OpenAI:ApiKey` in `TrivAi.Api/appsettings.Development.json`.

The default model is `gpt-4o-mini` and can be changed from `OpenAI:Model`.

## Run

From the `TrivAiWeb` folder:

```powershell
dotnet run --project TrivAi.Api --urls http://localhost:5080
```

In another terminal:

```powershell
cd TrivAi.Client
npm install
npm run dev -- --port 5173
```

The React app runs at `http://127.0.0.1:5173`.

## Firebase Setup

1. Create a Firebase project.
2. Add a Web app in Project settings.
3. Enable Authentication -> Sign-in method -> Email/Password.
4. Create a Cloud Firestore database.
5. Copy `TrivAi.Client/.env.example` to `TrivAi.Client/.env` and fill the Firebase web app values:

```powershell
cd TrivAi.Client
Copy-Item .env.example .env
```

Required values:

```text
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Restart `npm run dev` after editing `.env`.

The app writes:

- `users/{uid}`: email, displayName, level, score, bestPlatformScore, gamesPlayed.
- `users/{uid}/sessions/{sessionId}`: completed quiz session history.
- `leaderboard/{uid}`: public leaderboard entry.
- `users/{uid}.avatar`: local avatar choices such as base color, face, hair, accessory and background.

Starter Firestore rules for local development:

```text
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      match /sessions/{sessionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }

    match /leaderboard/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

No Firebase Storage bucket is required for avatars.
