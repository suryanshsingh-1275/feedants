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