# Kissan Setu

SIH 2026 (PS 26032) — slot booking and live queue for crop procurement centres.

This repo has two folders:

```
frontend/   UI (open frontend/index.html)
backend/    put the server here — any language or framework
```

The frontend already calls every API listed below. Match these paths and JSON shapes and the UI will work.

Exact request and response examples live in **[API.md](API.md)**. Read that file before you start coding.

---

## Live demo

- **Frontend**: https://shivendra2008.github.io/team_apex_SIH/ (deployed automatically from
  `frontend/` via [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml)
  on every push to `main` — requires enabling **Settings → Pages → Source: GitHub Actions**
  once in the repo).
- **Backend**: https://kissan-setu-backend.onrender.com (real WhatsApp Business API wired up;
  see [backend/README.md](backend/README.md)).

`frontend/config.js` already points `apiBase` at the Render backend with `useMock: false`, so
the Pages deployment talks to the live server out of the box.

## Backend status

A FastAPI server now lives in `backend/`, implementing auth (`send-otp` / `verify-otp`) and
the booking flow (`bookings`, `bookings/current`, `cancel`), with **WhatsApp Business API**
wired in for OTP delivery and booking confirmation/cancellation messages. See
[backend/README.md](backend/README.md) for how to run it, how the WhatsApp credentials and
approved template names are kept out of source control (`.env`, git-ignored), and how to
deploy it live via the [`render.yaml`](render.yaml) blueprint. Everything else in the table
below is still mock-only.

## For the backend developer

Build **21 endpoints** under:

```
http://localhost:8080/api/v1
```

When your server is running, the frontend switches to it by editing `frontend/config.js`:

```js
useMock: false,
apiBase: "http://localhost:8080/api/v1"
```

Until then the UI uses mock data (`useMock: true`) so the demo still works.

### Rules the frontend already follows

| Rule | What you must do |
| --- | --- |
| JSON | UTF-8 bodies both ways |
| Auth | `Authorization: Bearer <token>` on **every** route except the two OTP routes |
| Language | Read `Accept-Language`: `en`, `hi`, or `pa` |
| Dates | `YYYY-MM-DD` |
| Mobile / Aadhaar | digits only, no spaces |
| Errors | `{ "message": "Human-readable reason" }` plus the HTTP status |
| CORS | Allow the frontend origin (file, localhost, or GitHub Pages) |
| Aadhaar | Store only the last 4 digits |

---

## APIs you have to build

### Auth — 2

| Method | Path | What it does |
| --- | --- | --- |
| `POST` | `/auth/send-otp` | Send a 4-digit OTP to the farmer’s mobile. Body: `{ mobile, aadhaar }`. |
| `POST` | `/auth/verify-otp` | Check the OTP. Body: `{ mobile, otp }`. Return `{ token, farmer }`. |

### Farmer — 14

| Method | Path | What it does |
| --- | --- | --- |
| `GET` | `/farmer/me` | Logged-in farmer profile. |
| `PATCH` | `/farmer/me` | Update language. Body: `{ language }` (`en` / `hi` / `pa`). |
| `GET` | `/crops` | Crops with MSP (`id`, `name`, `nameHi`, `namePa`, `msp`). |
| `GET` | `/centres` | Nearby centres with wait time, load, lat/lng. |
| `GET` | `/centres/{centreId}/slots?date=` | Free slots for that centre on that day. |
| `POST` | `/bookings` | Create a booking. Body: `{ centreId, date, slotId, crops }`. |
| `GET` | `/bookings/current` | Active booking, or `{ booking: null }`. |
| `POST` | `/bookings/{id}/cancel` | Cancel and offer the slot to the waitlist. |
| `POST` | `/bookings/{id}/hold` | Farmer is late — hold the place (~30 min). |
| `GET` | `/queue?centreId=` | Live queue: position, ETA, who is ahead. |
| `GET` | `/lots/current` | Lot tracker (arrived → graded → weighing → paid). |
| `GET` | `/payments/current` | MSP breakdown and DBT status. |
| `GET` | `/weather?district=` | Forecast and auto-rescheduled slots. |
| `GET` | `/notifications` | WhatsApp / SMS messages for the farmer. |

### Centre staff — 4

| Method | Path | What it does |
| --- | --- | --- |
| `GET` | `/staff/dashboard` | Today’s stats, queue, waitlist, slot capacity. |
| `PATCH` | `/staff/queue/{token}/stage` | Move a farmer along. Body: `{ stage }`. |
| `POST` | `/staff/check-in` | Scan / type a token at the gate. Body: `{ token }`. `404` if not booked today. |
| `POST` | `/staff/sync` | Replay mutations saved while the desk was offline. |

Staff stages: `booked` · `arrived` · `graded` · `weighed` · `accepted` · `no_show`.

### District admin — 1

| Method | Path | What it does |
| --- | --- | --- |
| `GET` | `/admin/dashboard` | District stats, centre load, alerts, arrivals by hour. |

---

## Suggested build order

1. `POST /auth/send-otp` and `POST /auth/verify-otp`
2. `GET /farmer/me`, `GET /crops`, `GET /centres`
3. `GET /centres/{id}/slots` and `POST /bookings`
4. `GET /bookings/current`, cancel, hold
5. Queue, lot, payment, weather, notifications
6. Staff dashboard, stage update, check-in, sync
7. Admin dashboard

Open the frontend and walk Farmer → Staff → Admin after each group. If a screen stays empty or a toast says the server could not be reached, that endpoint is missing or the JSON shape does not match [API.md](API.md).

---

## Frontend

Open `frontend/index.html` in a browser (or any static host).

| File | Role |
| --- | --- |
| `frontend/index.html` | Screens for farmer, centre staff, district admin |
| `frontend/app.js` | UI — calls `KSApi.*` only, no hardcoded live data |
| `frontend/api.js` | Named client. One function = one backend route |
| `frontend/config.js` | `useMock` and `apiBase` |
| `frontend/mock.js` | Fake responses used while the backend is not ready |
| `API.md` | Full JSON contract |
| `backend/` | Empty on purpose — add the server here |

Deep links: `?view=staff`, `?view=admin`, `?screen=home`, `?lang=hi`.
