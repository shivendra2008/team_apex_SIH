# Kissan Setu — API contract

Base URL: `{apiBase}` from `frontend/config.js`, default `http://localhost:8080/api/v1`.

Turn the frontend onto the live server by setting `KSConfig.useMock = false`.

## Conventions

| Rule | Detail |
| --- | --- |
| JSON | UTF-8 request and response bodies |
| Auth | `Authorization: Bearer <token>` on every route except the two OTP routes |
| Language | `Accept-Language: en` / `hi` / `pa` |
| Dates | `YYYY-MM-DD` |
| Mobile / Aadhaar | digits only, no spaces |
| Errors | `{ "message": "Human-readable reason" }` plus the HTTP status |

Store only the last 4 digits of Aadhaar. The farmer app already tells the user that.

CORS must allow the frontend origin.

---

## Auth

### `POST /auth/send-otp`

```json
{ "mobile": "9876543210", "aadhaar": "123456784821" }
```

```json
{ "ok": true, "expiresInSec": 24 }
```

### `POST /auth/verify-otp`

```json
{ "mobile": "9876543210", "otp": "1234" }
```

```json
{
  "token": "jwt-or-session-token",
  "farmer": {
    "id": "farmer-001",
    "name": "Ramesh Singh",
    "initials": "RS",
    "village": "Kheri Village",
    "district": "Karnal",
    "mobile": "9876543210",
    "language": "en",
    "bank": { "name": "PNB", "last4": "4471" }
  }
}
```

---

## Farmer

### `GET /farmer/me`

Same `farmer` object as verify.

### `PATCH /farmer/me`

```json
{ "language": "hi" }
```

Returns the updated farmer.

### `GET /crops`

```json
[{ "id": "wheat", "name": "Wheat", "nameHi": "गेहूं", "namePa": "ਕਣਕ", "msp": 2521 }]
```

### `GET /centres`

```json
[{
  "id": 1,
  "name": "Karnal Grain Mandi",
  "crops": "Wheat, Paddy",
  "km": 4.2,
  "waitMinutes": 35,
  "load": 0.62,
  "gate": "Gate 2",
  "lat": 29.6857,
  "lng": 76.9905,
  "mapLeft": "47%",
  "mapTop": "44%"
}]
```

`mapLeft` / `mapTop` are optional. If omitted, the frontend places pins from `lat` / `lng`.

### `GET /centres/{centreId}/slots?date=2026-08-25`

```json
{
  "centreId": 1,
  "date": "2026-08-25",
  "slots": [
    { "id": "s3", "start": "11:00", "end": "11:45", "total": 12, "left": 2 }
  ]
}
```

### `POST /bookings`

```json
{
  "centreId": 1,
  "date": "2026-08-25",
  "slotId": "s3",
  "crops": [{ "cropId": "wheat", "quintal": 20 }]
}
```

Returns a booking object (see current booking).

### `GET /bookings/current`

```json
{
  "booking": {
    "id": "bk-042",
    "token": "A-042",
    "centreId": 1,
    "centreName": "Karnal Mandi, Gate 2",
    "gate": "Gate 2",
    "date": "2026-08-25",
    "dateLabel": "Tue 25 Aug",
    "slotId": "s3",
    "slotLabel": "11:00 – 11:45",
    "crops": [{ "cropId": "wheat", "quintal": 42, "name": "Wheat", "msp": 2521 }],
    "cropsLabel": "Wheat · 42 quintal",
    "status": "confirmed",
    "waitMinutes": 35,
    "aheadCount": 6
  }
}
```

`booking` is `null` when the farmer has nothing active.

`status`: `confirmed` | `cancelled` | `held`.

### `POST /bookings/{id}/cancel`

```json
{ "ok": true, "offeredTo": { "name": "Kamla Yadav" }, "penalty": false }
```

### `POST /bookings/{id}/hold`

```json
{ "ok": true, "heldMinutes": 30 }
```

### `GET /queue?centreId=1`

```json
{
  "position": 7,
  "total": 13,
  "eta": "11:38 AM",
  "nowServing": "A-036",
  "avgMinutes": 5,
  "ahead": [
    { "token": "A-036", "name": "Prem Chand", "village": "Ballah", "tag": "At counter" }
  ]
}
```

### `GET /lots/current`

```json
{
  "lotNo": "KRL-2291",
  "cropLabel": "Wheat · 42 quintal",
  "centreName": "Karnal Mandi",
  "steps": [
    { "key": "arrived", "status": "done", "time": "25 Aug, 11:04 AM", "note": null },
    { "key": "graded", "status": "done", "time": "25 Aug, 11:26 AM", "noteKey": "gradeNote" },
    { "key": "weighing", "status": "now", "timeKey": "stWeighingTs" },
    { "key": "accepted", "status": "todo", "timeKey": "pending" },
    { "key": "paid", "status": "todo", "timeKey": "pending" }
  ]
}
```

`key` values: `arrived` | `graded` | `weighing` | `accepted` | `paid`.  
`status`: `done` | `now` | `todo`.

### `GET /payments/current`

```json
{
  "lotNo": "KRL-2291",
  "cropLabel": "Wheat · 42 quintal",
  "centreName": "Karnal Mandi",
  "lines": [{ "label": "Wheat", "quintal": 42, "msp": 2521, "amount": 105882 }],
  "gross": 105882,
  "deductions": 0,
  "net": 105882,
  "bank": { "name": "PNB", "last4": "4471" },
  "status": "awaiting_weighing",
  "progress": [
    { "key": "payLotAccepted", "status": "todo", "timeKey": "afterWeighingDone" },
    { "key": "payReceipt", "status": "todo", "timeKey": "pending" },
    { "key": "paySentBank", "status": "todo", "timeKey": "pending" }
  ]
}
```

### `GET /weather?district=Karnal`

```json
{
  "district": "Karnal",
  "source": "IMD",
  "rainMm": 24,
  "rainDate": "2026-08-27",
  "days": [
    { "dow": "Tue", "mm": 0, "wet": false, "icon": "sun" }
  ],
  "moved": { "count": 148, "from": "27 Aug", "to": "28 Aug, same time" },
  "farmerDate": "25 August"
}
```

`icon`: `sun` | `cloud` | `rain`.

### `GET /notifications`

```json
[{ "id": "n1", "key": "msg1", "time": "8:02 AM", "body": "optional pre-translated text" }]
```

If `body` is omitted, the frontend uses `key` (`msg1`–`msg4`) for the current language.

---

## Centre staff

### `GET /staff/dashboard`

```json
{
  "centreName": "Karnal Mandi",
  "gate": "Gate 2",
  "operator": "Suresh Kumar",
  "date": "25 August 2026",
  "stats": {
    "booked": 86,
    "inQueue": 6,
    "completed": 41,
    "noShows": 4,
    "acceptedQtl": 1720,
    "avgWait": 35
  },
  "queue": [
    {
      "token": "A-042",
      "name": "Ramesh Singh",
      "village": "Kheri",
      "crop": "Wheat, 42 qtl",
      "slot": "11:00 AM",
      "stage": "arrived"
    }
  ],
  "waitlist": [
    { "name": "Kamla Yadav", "village": "Indri", "want": "11:00 AM", "since": "since 8:40 AM" }
  ],
  "slots": [{ "time": "11:00 – 11:45", "total": 12, "left": 2 }],
  "sync": { "online": true, "pendingCount": 0 }
}
```

`stage`: `booked` | `arrived` | `graded` | `weighed` | `accepted` | `no_show`.

### `PATCH /staff/queue/{token}/stage`

```json
{ "stage": "graded" }
```

```json
{ "ok": true, "token": "A-042", "stage": "graded" }
```

### `POST /staff/check-in`

```json
{ "token": "A-042" }
```

```json
{
  "token": "A-042",
  "farmer": { "name": "Ramesh Singh", "village": "Kheri" },
  "slot": "11:00 AM",
  "crop": "Wheat, 42 qtl"
}
```

`404` if the token is not booked today.

### `POST /staff/sync`

Used when the desk comes back online. Replay anything saved on the device.

```json
{
  "mutations": [
    { "type": "stage", "token": "A-041", "stage": "graded" },
    { "type": "check-in", "token": "A-042" }
  ]
}
```

```json
{ "ok": true, "applied": 2 }
```

---

## District admin

### `GET /admin/dashboard`

```json
{
  "district": "Karnal",
  "centreCount": 6,
  "stats": {
    "served": 1284,
    "servedDelta": "+18% vs last Tuesday",
    "avgWait": 38,
    "avgWaitWas": "5h 40m",
    "utilisation": 91,
    "noShowLoss": 4,
    "paymentsPending": 137,
    "paymentsAmount": "₹ 3.2 Cr"
  },
  "centres": [],
  "alerts": [
    { "level": "crit", "title": "Nilokheri centre is over capacity", "body": "...", "time": "4 minutes ago" }
  ],
  "hourly": [{ "hour": "11a", "count": 141 }]
}
```

`level`: `crit` | `warn` | `info`.

`centres` uses the same shape as `GET /centres`.
