# Feedants — Competition Details (Full Stack Assignment)

React Native (Expo) frontend, Node.js/Express backend, MongoDB. All competition
data is dynamic — nothing about the screen is hardcoded on the client.

## Project structure

```
feedants-assignment/
  backend/
    config/db.js
    models/User.js               # organizer or participant
    models/Competition.js        # the competition + judge + rewards + winners
    models/Registration.js       # join table: which user registered for which competition
    middleware/auth.js
    controllers/authController.js
    controllers/competitionController.js
    controllers/registrationController.js   # concurrency-safe register/submit
    routes/*.js
    seed.js                      # seeds one demo competition matching the design
    server.js
    .env.example
  frontend/
    App.js                       # screen switching, no nav library needed
    src/api.js                   # <-- set your backend IP here
    src/theme.js
    src/screens/LoginScreen.js
    src/screens/SignupScreen.js  # role picker: organizer / participant
    src/screens/CompetitionListScreen.js
    src/screens/CompetitionDetailsScreen.js   # the screen from the design
```

## 1. Backend setup

```
cd backend
npm install
cp .env.example .env      # edit MONGO_URI if not using local default
npm run seed               # creates a demo organizer, participant, and competition
npm run dev                 # starts on http://localhost:5000 (nodemon)
```

Demo logins created by the seed script:
- Organizer: `organizer@feedants.com` / `password123`
- Participant: `participant@feedants.com` / `password123`

### Environment variables (`backend/.env`)
```
MONGO_URI=mongodb://localhost:27017/feedants
PORT=5000
```

### API endpoints

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | /api/auth/signup | — | `{name,email,password,role}`, role = organizer/participant |
| POST | /api/auth/login | — | `{email,password}` → `{token,user}` |
| POST | /api/auth/logout | token | clears the session token |
| GET | /api/competitions | — | list, with computed `status` and `spotsLeft` |
| POST | /api/competitions | token (organizer) | create a competition |
| GET | /api/competitions/:id | optional token | full details screen payload |
| POST | /api/competitions/:id/register | token (participant) | atomic register, blocks overbooking/duplicates/late registration |
| POST | /api/competitions/:id/submit | token (participant) | `{submissionUrl}`, only inside submission window |
| GET | /api/competitions/:id/registrations | token (organizer, owner) | list of registrants for judging |

Auth is a simple opaque token (random hex string stored on the user document
and sent back as `Authorization: Bearer <token>`) rather than JWT — the
assignment doesn't need stateless auth, and this is enough to identify who is
registering/submitting and to gate organizer-only routes.

## 2. Frontend setup (Expo)

```
cd frontend
npm install
```

Open `src/api.js` and set `API_URL` to your machine's LAN IP (not
`localhost` — a phone/emulator can't reach your laptop's localhost):

```js
export const API_URL = 'http://192.168.1.5:5000/api';
```

Find your IP with `ipconfig` (Windows) or `ifconfig`/`ip a` (Mac/Linux), look
for something like `192.168.x.x`.

Then:
```
npx expo start
```
Scan the QR code with the **Expo Go** app on your phone (same Wi-Fi network
as your laptop), or press `a`/`i` for an Android/iOS emulator.

Flow: Sign up (pick organizer or participant) → land on the competitions list
→ tap the seeded competition → see the details screen with live countdown,
spots progress, dates, tabs, and a Register/Upload Submission button whose
label and enabled state change based on your registration state and the
competition's current phase.

## Assumptions

- One participant can register for a competition only once (enforced by a
  unique DB index, not just a UI check).
- "Registration closes in" counts down to `registerBefore`; after that,
  registration is closed even if spots remain.
- Submission is only possible for users who are registered, and only inside
  `[submissionStart, submissionEnd]`.
- Organizers create competitions (via API/seed script here); there's no
  "create competition" screen in the app since the design only specifies the
  details screen.
- Judge photo/video and winner photos are optional fields — the seed data
  leaves them blank since no real media was provided; UI hides the video link
  if empty.

## Technical decisions

- **Status is never stored, always computed.** `getLifecycleStatus()`
  derives `registration-open / registration-closed / submission-open /
  submission-closed / results-announced` from the four stored dates on every
  request. This means the "lifecycle" can never drift out of sync with the
  dates — there's nothing to forget to update.
- **Concurrency-safe registration.** The one place where "thousands of
  concurrent users" really bites is the last spot in a competition. Instead
  of "read bookedSpots, check < totalSpots, then increment" (a classic race
  condition), registration uses one atomic
  `findOneAndUpdate({_id, registerBefore: {$gt: now}, $expr: {$lt: ['$bookedSpots','$totalSpots']}}, {$inc:{bookedSpots:1}})`.
  MongoDB guarantees this check-and-increment happens as a single atomic
  operation per document, so two simultaneous requests for the last spot
  can't both succeed. The `Registration` document is then created inside a
  unique index on `(competition, user)`, and if that insert somehow fails
  after the spot was reserved (a very rare double-race), the increment is
  rolled back so `bookedSpots` stays accurate.
- **Server-computed countdown.** The details response returns
  `registrationClosesInMs` computed against the server clock, not raw dates
  for the client to diff against its own clock. The client just ticks that
  number down locally between refetches for a smooth UI.
- **Simple opaque token instead of JWT.** Enough to identify a user and gate
  routes; avoids explaining/expiring JWTs for a small assignment scope.
- **No navigation library on the frontend.** Since this is a first React
  Native project, screen switching is done with a single `screen` state
  variable in `App.js` instead of React Navigation, to keep `npm install`
  and mental overhead minimal.

## Trade-offs

- `bookedSpots` is a denormalized counter on `Competition` for fast reads
  (the list/details screens don't need to `COUNT()` registrations every
  time), kept in sync via the atomic increment/rollback above rather than
  via a transaction — fine at document-atomicity level, but a periodic
  reconciliation job (`bookedSpots = count(Registrations)`) would be a good
  safety net in production.
- No pagination on `GET /api/competitions` — acceptable for a handful of
  competitions, not for thousands.
- No image upload — `submissionUrl` is just a link the user pastes in,
  rather than a file upload pipeline (S3/Cloudinary), to keep scope small.
- No refresh/expiry on the auth token — it's valid until logout.

## What I'd change for production

- Move to JWT (short-lived access + refresh token) or signed sessions, plus
  rate limiting on auth and registration endpoints.
- Add MongoDB transactions across `Competition` + `Registration` writes if
  the data model grows past a single-document atomic update being sufficient.
- Real file/video upload for submissions and judge/winner photos (S3 +
  signed URLs) instead of raw link fields.
- Pagination, filtering, and search on the competitions list.
- Push notifications for registration-closing-soon / result-announced.
- Input validation library (e.g. Zod/Joi) on all request bodies instead of
  manual checks.
- Move screen navigation to React Navigation once the app grows past four
  screens.
- Tests: unit tests for `getLifecycleStatus` and the registration race
  condition (concurrent request simulation), integration tests for the API.
