# Test Cases — Next Available Appointment Booking

**Feature branch:** `feat/nextDay-availability-book`
**Author:** Kamesh Aditya
**Last updated:** 2026-04-29

Each test ID below maps 1-to-1 with a Jest `it(...)` description in the spec files:
- [src/slots/slot.service.spec.ts](../src/slots/slot.service.spec.ts) — 18 tests
- [src/booking/booking.service.spec.ts](../src/booking/booking.service.spec.ts) — 17 tests

**Run all:** `bun run test` → 35/35 passing as of last run.

Live tracker (Pass/Fail/Blocked): _link to Google Sheet here_

---

## A. Slot Fetching — `GET /slots?doctor_id=X&date=Y`

| ID | Scenario | Preconditions | Steps | Expected Result | Status |
|---|---|---|---|---|---|
| A1 | Normal working day, no bookings | Doctor has Mon–Sat 09:00–17:00 STREAM, 30-min slots | GET on a future Monday | `available: true`, full slot grid returned | ✅ |
| A2 | Weekly off (Sunday) — clinic closed | Doctor has no recurring entry for Sunday | GET on a future Sunday | `available: false`, message: "Clinic is closed on selected date…", `next_available` = Monday | ✅ |
| A3 | Full-day clinic holiday | `ClinicHoliday` row covers full day | GET on holiday date | `reason: CLINIC_HOLIDAY`, slots `[]` | ✅ |
| A4 | Partial clinic closure (e.g. 12:00–14:00) | `ClinicHoliday` partial window | GET on partial-closure date | Overlapping slots filtered out, rest returned | ✅ |
| A5 | Doctor on full-day leave | `AvailabilityOverride` with `is_unavailable=true` | GET on leave date | `reason: DOCTOR_ON_LEAVE` | ✅ |
| A6 | Partial leave override (afternoon only) | Override window 14:00–17:00 | GET on date | Only afternoon slots returned | ✅ |
| A7 | All STREAM slots booked | Each slot has BOOKED row | GET on saturated day | `reason: ALL_SLOTS_BOOKED` | ✅ |
| A8 | After hours (today, current time past end) | Schedule end < now | GET today | `reason: CONSULTING_HOURS_OVER` | ✅ |
| A9 | Today, partway through day | Now=11:00, schedule 09–17 | GET today | Only slots with `start > 11:00` | ✅ (covered indirectly by A8 + isToday filter) |
| A10 | Past date | date < today | GET with past date | 400 BadRequest "Cannot book past dates" | ✅ |
| A11 | Missing doctor_id or date | Omit query param | GET | 400 BadRequest | ✅ |
| A12 | WAVE slot with capacity remaining | maxAppts=3, 1 booked | GET | Slot still appears | ✅ |
| A13 | WAVE slot at full capacity | maxAppts=2, 2 booked | GET | Slot omitted | ✅ |
| A14 | All next 30 days unavailable | Permanent holidays | `suggestNextAvailableDay` | Returns `null` | ✅ |
| A15 | Invalid `slot_duration` (≤ 0) | Recurring with `slot_duration: 0` | GET | 400 BadRequest | ✅ |
| A16 | `start_time === end_time` | Recurring 09:00 → 09:00 | GET | 400 BadRequest | ✅ |
| A17 | Day-of-week query correctness | Future Monday | GET | `recurringRepo.find` called with `day_of_week: MONDAY` | ✅ |

---

## B. Booking Creation — `POST /booking`

| ID | Scenario | Preconditions | Steps | Expected Result | Status |
|---|---|---|---|---|---|
| B1 | STREAM, first booking of day | No bookings, slots open | POST `{doctor_id, date}` | 201, token=1, `alloted_slot` = first slot | ✅ |
| B2 | STREAM, token increments | 2 existing bookings | POST same day | token=3 | ✅ |
| B3 | All slots booked → suggest next | Saturated day | POST | message: "fully booked…", `available_slot`, `token_no`, `ReportingTime = start − 15min` | ✅ |
| B4 | Clinic closed (Sunday) → suggest Monday | No Sunday recurring | POST `date=<Sunday>` | message: "Clinic is closed…" + Monday slot | ✅ |
| B5 | Doctor on leave → suggest next | Leave override | POST | message: "Doctor is unavailable…" + next | ✅ |
| B6 | After hours today → suggest tomorrow | Today after 17:00 | POST today | message: "Consultation hours are over…" + tomorrow | ✅ |
| B7 | Duplicate booking (same patient/doctor/date) | Existing BOOKED row | POST same combo | 409 ConflictException | ✅ |
| B8 | WAVE without start/end | WAVE schedule | POST `{doctor_id, date}` only | 400 "start_time and end_time are required" | ✅ |
| B9 | WAVE with valid start/end, capacity remaining | maxAppts=3, 1 booked | POST full body | 201 | ✅ |
| B10 | WAVE slot full | count >= maxAppts | POST | 409 "Slot is fully booked" | ✅ |
| B11 | WAVE invalid slot times | start/end not in generated slots | POST | 400 "Selected slot is not available" | ✅ |
| B12 | All next 30 days unavailable | Permanent unavailability | POST | 400 "No upcoming availability found within the next 30 days." | ✅ |
| B13 | Concurrent booking race (DB unique constraint) | pg error code 23505 from save | POST | Mapped to 409 ConflictException | ✅ |
| B14 | ReportingTime correctness | First slot 09:00 | POST triggering B3 path | `ReportingTime = "08:45"` | ✅ |
| B15 | ReportingTime midnight wrap | First slot 00:10 | POST | `ReportingTime = "23:55"` | ✅ |

---

## C. Cancellation — `cancelBooking`

| ID | Scenario | Preconditions | Steps | Expected Result | Status |
|---|---|---|---|---|---|
| C1 | Cancel own booking | BOOKED row owned by patient | cancelBooking(id, patientId) | status → CANCELLED | ✅ |
| C2 | Cancel another patient's booking | Booking owned by different patient | cancelBooking(id, patientId) | 403 ForbiddenException | ✅ |
| C3 | Cancel non-existent id | No row | cancelBooking('missing', patientId) | 400 BadRequest "Booking not found" | ✅ |
| C4 | After cancel, slot becomes bookable again (STREAM) | Cancel B1, then re-book | POST same slot | 201 (token logic recomputes) | ⏸ Manual / e2e |

---

## D. Auth & Role Guards

| ID | Scenario | Steps | Expected Result | Status |
|---|---|---|---|---|
| D1 | POST /booking without JWT | omit Authorization header | 401 Unauthorized | ⏸ Manual (Postman) |
| D2 | POST /booking with DOCTOR-role JWT | use doctor token | 403 Forbidden | ⏸ Manual (Postman) |
| D3 | GET /doctor/schedule with PATIENT-role JWT | use patient token on doctor-only route | 403 Forbidden | ⏸ Manual (Postman) |

---

## E. Edge Cases / Open Items (from spec §6)

| ID | Scenario | Status / Notes |
|---|---|---|
| E1 | **Partial leaves** (spec 6.1) — afternoon-only leave should still surface morning slots | ✅ Covered by A6 |
| E2 | **Timezone sync** (spec 6.2) — "today" check must use clinic timezone, not server | ⚠️ **Open issue** — currently uses server local time via `new Date().toISOString()` and `toTimeString()`. Needs decision before merge. |
| E3 | **Concurrent booking** (spec 6.3) — last-slot race | ✅ Covered by B13 (DB unique constraint translates to 409). Requires `UNIQUE(doctor_id, date, start_time)` constraint on Booking table to actually trigger in production. |
| E4 | `end_time < start_time` validation on recurring create | ⚠️ **Gap** — `generateTimeSlots` returns `[]` silently. Recommend adding guard in availability create endpoint. |

---

## How to run

```bash
cd Schedula/Backend/Schedula--by-Kamesh-aditya
bun install
bun run test                                # all 35 unit tests
bun run test -- slot.service.spec           # only SlotService
bun run test -- booking.service.spec        # only BookingService
bun run test:cov                            # with coverage
```

## Manual smoke (Postman)

After running the seed script (`scripts/seed-demo.sql`):

1. `GET /slots?doctor_id=doc-demo&date=<future-Sunday>` → expect "Clinic is closed" + Monday in `next_available`
2. `POST /booking` with body `{doctor_id: "doc-demo", date: "<saturated-day>"}` → expect "fully booked" + next-day suggestion + `ReportingTime`
3. `POST /booking` happy path with body `{doctor_id: "doc-demo", date: "<future-Monday>"}` → expect 201 with token=1

---

## Legend

- ✅ Passing (automated)
- ⏸ Pending manual test
- ⚠️ Open issue / known gap
- ❌ Failing
