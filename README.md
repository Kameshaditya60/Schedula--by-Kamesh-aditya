# Schedula

A hospital appointment booking REST API built with **NestJS**, **TypeORM**, and **PostgreSQL**.

**Live API:** https://schedula-by-kamesh-aditya.onrender.com

**Stack:** NestJS 10 · TypeORM · PostgreSQL · JWT · Passport · Bun

---

## Key features

- **OTP-based passwordless auth** with role-based access (`PATIENT`, `DOCTOR`, `ADMIN`)
- **Doctor schedule management** — recurring weekly availability + per-day overrides
- **Slot generation** for two booking modes: `STREAM` (sequential tokens) and `WAVE` (capped per-slot capacity)
- **Booking with a 7-day window** — patients can only book today through today+6
- **Hardened cancel API** — idempotent, blocks past-date and within-1-hour cancellations
- **Doctor leave auto-cancels existing bookings** in a single database transaction
- **Clinic-wide holidays** — full closure or emergency partial closure

---

## Prerequisites

- [Bun](https://bun.sh) (or Node.js 20+ + npm)
- PostgreSQL 14+ running locally on port `5433`

---

## Quick start

```bash
git clone <repo-url>
cd Schedula--by-Kamesh-aditya

bun install

# 1. Create your .env (see Environment variables below)
cp .env.example .env
# edit .env with your local Postgres credentials

# 2. Apply schema
bun run migration:run

# 3. Start the dev server (auto-reload on file changes)
bun run start:dev
```

Server starts on `http://localhost:3000`.

---

## Environment variables

| Key | Required | Description |
|---|---|---|
| `db_host` | No | Postgres host (defaults to `localhost`) |
| `db_username` | Yes | Postgres user |
| `db_password` | Yes | Postgres password |
| `db_name` | Yes | Database name (e.g. `schedula`) |
| `JWT_SECRET_KEY` | Yes | Secret used to sign JWT access tokens |
| `PORT` | Yes | Port the API server listens on (e.g. `3000`) |

> Note: The Postgres port is hardcoded to `5433` in `data-source.ts` and `app.module.ts`.

---

## API endpoints

All routes are mounted at the base URL. JWT-guarded routes need an `Authorization: Bearer <token>` header.

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/request-otp` | – | Request a 6-digit OTP for a mobile number |
| `POST` | `/auth/verify-otp` | – | Verify OTP, returns JWT + user |

### Booking (patient)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/booking` | `PATIENT` | Create a booking (must be within today..today+6) |
| `POST` | `/booking/cancel/:id` | `PATIENT` | Cancel a booking |
| `GET` | `/booking/my?date=YYYY-MM-DD` | `PATIENT` | List my bookings, optionally filtered by date |

### Booking (doctor)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/booking/doctor?doctor_id=…&date=…` | `DOCTOR` | View a doctor's bookings for a date |

### Doctor availability

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/doctor/availability/recurring` | `DOCTOR` | Set weekly recurring schedule |
| `GET` | `/doctor/availability/recurring?doctorId=…&date=…` | – | Get availability for a date |
| `POST` | `/doctor/availability/recurring/override` | `DOCTOR` | Per-day override or take leave (`is_unavailable: true` auto-cancels existing bookings) |

### Slots

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/slots?doctor_id=…&date=…` | – | Available slots for a doctor on a date |

### Profiles

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/doctors/onboarding` | – | Create a doctor profile |
| `GET` | `/doctors` | – | List doctors |
| `POST` | `/patients/profile` | – | Create a patient profile |

### Clinic holidays

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/clinic-holidays` | – | Add a clinic-wide holiday |
| `GET` | `/clinic-holidays` | – | List holidays |
| `DELETE` | `/clinic-holidays/:id` | – | Remove a holiday |

---

## Testing

```bash
bun run test           # 69 unit tests across 8 suites
bun run test:cov       # with coverage
bun run build          # TypeScript compile check
```

Suites cover: booking creation/cancel rules, slot generation (STREAM and WAVE), the leave-day auto-cancel transaction, OTP auth, JWT guard, and JWT strategy.

---

## Demo materials

| File | Purpose |
|---|---|
| `scripts/seed-demo.sql` | Seed a doctor + recurring availability + sample bookings for end-to-end testing |
| `scripts/schedula-demo.postman_collection.json` | Postman collection walking through the 7-day window, cancel rules, and doctor-leave flows. Pre-request scripts auto-compute `today+N` dates; tokens auto-extracted on OTP verify. |

To use the seed:
```bash
psql -d schedula -f scripts/seed-demo.sql
```

---

## Project structure

```
src/
  auth/              OTP-based auth, JWT strategy, role guards
  user/              User entity (PATIENT / DOCTOR / ADMIN)
  doctorProfile/    Doctor-specific profile data
  patientProfile/   Patient-specific profile data
  availability/      Recurring weekly availability + per-day overrides
  booking/           Bookings (creation, cancel, retrieval)
  clinic-holiday/    Clinic-wide closures
  slots/             Slot generation for STREAM and WAVE schedules
  common/utils/      Shared helpers (date-time)
  migrations/        TypeORM migrations
```

---

## Database schema

See `updated Schedula ER Diagram .png` in the repo root.

For full business context (entities, roles, booking flows), see [`Docs/Schedula_Business_Documentation.md`](Docs/Schedula_Business_Documentation.md).

---

## Deployment

Deployed on [Render](https://render.com) — see the live URL at the top of this README. The `migration:run_prod` script is wired up for production migrations against the compiled `dist/` output.
