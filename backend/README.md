# Backend

FastAPI server implementing the auth + booking slice of [API.md](../API.md), with
WhatsApp Business API wired in for:

- **OTP delivery** — `POST /auth/send-otp` sends the code as a WhatsApp template message.
- **Booking confirmation** — `POST /bookings` sends a confirmation message after the booking is created.
- **Booking cancellation** — `POST /bookings/{id}/cancel` sends a cancellation message.

Everything else in [API.md](../API.md) (staff, admin, weather, notifications, queue, lot,
payment, hold) is **not implemented yet** — the frontend falls back to `KSMock` for those
while `useMock` is on, or will fail with "could not reach the server" if you flip
`useMock: false` before they exist.

## Run it

```bash
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env
.venv/bin/uvicorn app.main:app --reload --port 8080
```

Health check: `curl http://localhost:8080/api/v1/health`

Then in [`frontend/config.js`](../frontend/config.js):

```js
useMock: false,
apiBase: "http://localhost:8080/api/v1"
```

## WhatsApp Business API setup

Integration follows the provided **WhatsApp API Setup Documentation** — a BSP that fronts the
Meta Cloud API v23.0 shape under its own domain and API key. All of it lives in
[`app/services/whatsapp.py`](app/services/whatsapp.py):

- **Send Message**: `POST {WA_API_BASE_URL}/{WA_VERSION}/{WA_PHONE_NUMBER_ID}/messages`, with
  `Authorization: Bearer <key>` and `X-API-KEY: <key>` headers (the doc's two examples use
  each; we send both so either works), and the standard
  `{ messaging_product, to, type: "template", template: { name, language, components } }` body.
- **Errors** come back in one of two documented shapes — `{ "isValid": false, "response": [...] }`
  or `{ "success": false, "error": { "message": ... } }` — both are parsed in `_extract_error()`.
- **Template creation** (`POST /{version}/{wabaId}/message_templates`) is a one-time,
  out-of-band step, not part of a request — see `scripts/manage_templates.py` below.

Until real credentials exist, `WA_DRY_RUN=true` (the default) logs the **exact** request payload
that would be sent instead of calling the provider, so the OTP → booking → confirmation flow can
be built and demoed without a live WhatsApp account.

**Secrets and template names are never committed.** `.env` is git-ignored (see
`.gitignore`), and `app/config.py` has no real fallback values for any WhatsApp
setting — `WA_API_KEY`, `WA_PHONE_NUMBER_ID`, `WA_WABA_ID`, and all three
`WA_TEMPLATE_*` names exist **only** in your local `.env` or in your deploy
host's environment variable settings. Anyone cloning this repo gets a working
app in `WA_DRY_RUN=true` mode with none of that information.

### 1. Fill in `.env`

```
WA_DRY_RUN=false
WA_API_BASE_URL=https://yourdomain.com     # the BSP's host from their doc
WA_VERSION=v23.0
WA_PHONE_NUMBER_ID=<your registered WhatsApp phone number id>
WA_WABA_ID=<your WhatsApp Business Account id>   # only needed for manage_templates.py
WA_API_KEY=<your API key from My Profile>
WA_TEMPLATE_LANG=en                        # must match the language the templates were approved under
WA_TEMPLATE_OTP=<your approved OTP template name>
WA_TEMPLATE_BOOKING_CONFIRMED=<your approved booking-confirmation template name>
WA_TEMPLATE_BOOKING_CANCELLED=<your approved cancellation template name>
```

### 2. Create/verify the three templates this backend sends

```bash
cd backend
.venv/bin/python -m scripts.manage_templates create   # only if not already created
.venv/bin/python -m scripts.manage_templates list      # check APPROVED / PENDING / REJECTED
```

**Sends will fail until each shows `APPROVED`.** `manage_templates.py create` submits
`UTILITY`-category templates matching the body text baked into that script — if your
templates were created manually with different wording or components (header, buttons),
the script's version won't match what's registered; treat `create` as a starting point,
not the source of truth. **Always confirm the real shape with `list`** before trusting
what `app/services/whatsapp.py` sends — its module docstring documents the exact
component/parameter shape it expects per template, based on the last `list` check, and
must be kept in sync with whatever is actually approved on your WABA.

Params sent per event, in order (see `app/services/whatsapp.py` for the exact component
structure each one is wrapped in):

| Event | Template | Params sent (in order) |
| --- | --- | --- |
| OTP | `WA_TEMPLATE_OTP` | body: `[otp]`, button: `[otp]` |
| Booking confirmed | `WA_TEMPLATE_BOOKING_CONFIRMED` | header: `[farmerName]`, body: `[token, dateLabel, slotLabel, centreName, cropsLabel]` |
| Booking cancelled | `WA_TEMPLATE_BOOKING_CANCELLED` | header: `[farmerName]`, body: `[token, dateLabel]` |

## Deploying (so it's live, not just local)

GitHub itself only serves static files — the frontend can go on GitHub Pages, but this
FastAPI backend needs an actual server host with its own environment-variable secrets
store. [`render.yaml`](../render.yaml) at the repo root is a ready-to-use blueprint for
[Render](https://render.com):

1. Push this repo to GitHub (secrets are already excluded — see above).
2. On Render: **New +** → **Blueprint** → connect this GitHub repo. Render reads
   `render.yaml` automatically.
3. It will list several env vars with no value and ask you to fill them in by hand
   (`WA_API_BASE_URL`, `WA_PHONE_NUMBER_ID`, `WA_WABA_ID`, `WA_API_KEY`, and the three
   `WA_TEMPLATE_*` names) — paste in the same values you have in your local `.env`.
   These are stored only in Render's own secret store, never in the repo.
4. Deploy. Render gives you a `https://kissan-setu-backend-xxxx.onrender.com` URL.
5. Point the frontend at it — either edit [`frontend/config.js`](../frontend/config.js)
   (`apiBase: "https://<your-render-url>/api/v1"`, `useMock: false`) before deploying the
   frontend (e.g. to GitHub Pages), or override it at runtime if you add that later.
6. Add that Render URL's origin to `CORS_ORIGINS` in Render's env vars (it defaults to
   `*` here, which works but is permissive — tighten it once you know the frontend's
   real origin).

Any other host that runs a Python web service (Railway, Fly.io, a VPS, etc.) works the
same way in spirit: install `backend/requirements.txt`, run
`uvicorn app.main:app --host 0.0.0.0 --port $PORT`, and set the same env vars as secrets
in that platform's dashboard — never in a file that gets committed.

## Notes on the auth model

Tokens issued by `/auth/verify-otp` are plain random strings mapped to a mobile number in an
in-memory dict (`app/store.py`) — enough for a prototype, not JWTs and not persisted across a
restart. All farmer/booking/OTP state lives in memory for the same reason; swap `app/store.py`
for a real database when this grows past the demo stage.
