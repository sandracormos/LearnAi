# TrivAI Web

Trivia web app built with React, ASP.NET Core, Firebase, and OpenAI.

## Requirements

- .NET SDK 9
- Node.js and npm
- Firebase project
- OpenAI API key

## Setup

Create the client environment file:

```powershell
cd TrivAi.Client
Copy-Item .env.example .env
```

Fill `.env` with the Firebase Web App configuration:

```text
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Enable Email/Password Authentication and Cloud Firestore in Firebase.

Publish the rules from `firestore.rules` in Firebase Console.

## Run

Start the API:

```powershell
$env:OPENAI_API_KEY="your-key"
dotnet run --project TrivAi.Api --urls http://localhost:5080
```

Start the client in another terminal:

```powershell
cd TrivAi.Client
npm install
npm run dev -- --port 5173
```

Open `http://127.0.0.1:5173`.
