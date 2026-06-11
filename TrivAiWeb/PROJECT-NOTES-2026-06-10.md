# TrivAI Project Notes - June 10, 2026

## Changes Made

- Started the React frontend on `http://127.0.0.1:5173`.
- Started the .NET API on `http://localhost:5080`.
- Added backend custom-test models:
  - `CustomTest`
  - `CustomTestQuestion`
  - `PublishedCustomTest`
  - `PublishedCustomTestQuestion`
- Added backend custom-test API endpoints:
  - `POST /api/custom-tests` saves or publishes a test.
  - `GET /api/custom-tests/` loads the signed-in user's editable tests.
  - `GET /api/custom-tests/published` loads playable published tests.
  - `POST /api/custom-tests/published/{testId}/answers` validates an answer.
  - `DELETE /api/custom-tests/{testId}` deletes a test.
- Moved custom-test Firebase operations from the frontend to the backend.
- Added Firebase ID-token authentication to custom-test API requests.
- Changed published tests so `correctAnswer` is not sent to browsers.
- Added encrypted answer-key storage for published tests.
- Changed custom-test scoring to validate answers through the backend.
- Kept draft answers accessible to their creator for editing.
- Restored OpenAI API connectivity after restarting the backend with network access.

## Important Files

- `TrivAi.Api/DataStructures/CustomTest.cs`
- `TrivAi.Api/DataStructures/CustomTestQuestion.cs`
- `TrivAi.Api/DataStructures/PublishedCustomTest.cs`
- `TrivAi.Api/DataStructures/PublishedCustomTestQuestion.cs`
- `TrivAi.Api/Endpoints/CustomTestEndpoints.cs`
- `TrivAi.Api/Firebase/FirestoreCustomTestService.cs`
- `TrivAi.Api/Services/ICustomTestService.cs`
- `TrivAi.Client/src/firebase.ts`
- `TrivAi.Client/src/main.tsx`

## Verification

- Frontend production build passes.
- Backend build passes.
- All 7 .NET tests pass.
- OpenAI question generation works.
- Custom-test endpoints reject unauthenticated requests.
- Published-test responses no longer include `correctAnswer`.

## Remaining Action

Existing published tests must be opened and republished once. This rewrites their
old Firestore documents without visible correct answers and adds the encrypted
answer key used by the backend.
