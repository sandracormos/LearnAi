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

## Graphics and Visual Systems

The app includes a few graphics-focused systems that are useful to mention in a computer graphics presentation.

### Graphics sources and integration

| Element | Where it comes from | How it is integrated |
| --- | --- | --- |
| `SVG icons` | Inline SVG markup in `src/main.tsx` and small icon buttons in `src/components/ui` | Rendered directly in JSX, then styled through `src/styles.css` so they can change size and color without extra image files. |
| `Lottie animations` | JSON files in `LottieAnimations/` such as `Brain.json`, `Confetti.json`, `Loading.json`, and `Winner.json` | Wrapped with `lottie-react` components in `src/components/ui/*.tsx` and placed in the dashboard, quiz loading state, completion screen, and leaderboard highlight. |
| `PNG previews` | Static preview images in `LottieAnimations/` such as `brain.png`, `Winner.png`, `Robot.png`, and `svgIcons.png` | Used in this README for documentation and presentation, not in the runtime UI. |
| `Avatar system` | DiceBear avatars generated from the public DiceBear API plus local avatar item assets in `src/assets/avatar/` | Built in `src/main.tsx` by assembling the selected style, colors, and layered avatar parts. Local images are used for the custom avatar editor, while the final profile avatar is rendered from the generated SVG URL. |
| `Interactive robot` | A remote Spline scene URL from `https://prod.spline.design/.../scene.splinecode` | Loaded through `InteractiveRobotSpline` in `src/components/ui/interactive-3d-robot.tsx` and shown on the signed-in menu hero. |
| `Theme switch` | Custom SVG sun and moon icons embedded in the settings UI | The app swaps light and dark visuals by changing the theme state, storing the preference in `localStorage`, and letting CSS variables in `src/styles.css` restyle the interface. |
| `Daily reward calendar` | Lock icon SVG and calendar-style layout created in the client | Rendered as a visual reward panel with claimed, current, and locked states so the streak is visible at a glance. |
| `XP, progress, and leaderboard feedback` | CSS shapes, highlighted rows, bars, counters, and the winner Lottie animation | These are driven by React state and updated after quiz actions so score, level, and rank changes are visible immediately. |

### Animation previews

| Preview | Use |
| --- | --- |
| <img src="LottieAnimations/brain.png" alt="Brain preview" width="120" /> | Dashboard brain animation |
| <img src="LottieAnimations/Winner.png" alt="Winner preview" width="120" /> | Winner / leaderboard highlight |
| <img src="LottieAnimations/Robot.png" alt="Robot preview" width="120" /> | Menu robot visual |
| <img src="LottieAnimations/svgIcons.png" alt="SVG icons preview" width="120" /> | Icon set preview |

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
