# Feedants — Competition Details (Full Stack Assignment)

React Native (Expo) frontend, Node.js/Express backend, MongoDB. All competition data is dynamic — nothing on the screen is hardcoded.

## Structure

feedants-assignment/
backend/
config/db.js
models/ User.js, Competition.js, Registration.js
middleware/auth.js
controllers/ auth, competition, registration (registration = concurrency-safe register/submit)
routes/*.js
seed.js seeds a demo organizer, participant, and one competition
server.js
.env
frontend/
App.js
src/api.js <- set your backend URL here
src/screens/
LoginScreen.js
SignupScreen.js role picker: organizer / participant
CompetitionListScreen.js shows "+ Create Competition" for organizers
CreateCompetitionScreen.js organizer-only form, posts to the API
CompetitionDetailsScreen.js the screen from the design


## 1. Backend

cd backend
npm install
npm run seed
npm run dev


`.env`:
MONGO_URI=mongodb://localhost:27017/feedants
PORT=5050



Demo logins: organizer@feedants.com / participant@feedants.com, both password123.

### API

| Method | Route | Auth | Notes |
|---|---|---|---|
| POST | /api/auth/signup | — | {name,email,password,role} |
| POST | /api/auth/login | — | returns {token,user} |
| POST | /api/auth/logout | token | clears session token |
| GET | /api/competitions | — | list, computed status + spotsLeft |
| POST | /api/competitions | token (organizer) | create a competition |
| GET | /api/competitions/:id | optional token | full details payload |
| POST | /api/competitions/:id/register | token (participant) | atomic, blocks overbooking/duplicates/late registration |
| POST | /api/competitions/:id/submit | token (participant) | {submissionUrl}, only in submission window |
| GET | /api/competitions/:id/registrations | token (organizer, owner) | for judging |

Auth is a simple opaque token (random hex, stored on the user, sent as Authorization: Bearer) instead of JWT — enough to identify users and gate organizer-only routes for this scope.

