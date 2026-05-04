-- ============================================================================
-- Schedula demo seed — for Postman walkthrough & Loom video
-- ============================================================================
-- Run with: psql -d schedula -f scripts/seed-demo.sql
--
-- Prerequisites:
--   1. The User and DoctorProfile rows for doc-demo / pat-demo must already exist.
--      Replace the UUIDs below with real ones from your `user_table` if needed.
--   2. Run AFTER `bun run migration:run` so all tables exist.
--
-- This seed produces 4 demo dates relative to CURRENT_DATE:
--   • next Sunday       → clinic-closed demo  (no recurring on Sunday)
--   • CURRENT_DATE + 8  → doctor-on-leave demo (override is_unavailable=true)
--   • CURRENT_DATE + 5  → fully-booked demo   (saturated with bookings)
--   • CURRENT_DATE + 10 → happy-path demo     (clean Monday-ish)
--
-- Re-run safe: deletes the demo doctor's data first, then re-inserts.
-- ============================================================================

BEGIN;

-- ---- Fixed UUIDs (substitute if your User/DoctorProfile rows use different ones) ----
-- doctor: ae5d4932-133f-488a-be79-31775be8e8cd
-- patient: c4d631c2-ae81-43a8-838e-24b86347dc99

-- ---- Wipe previous demo data for this doctor ----
DELETE FROM booking             WHERE doctor_id = 'ae5d4932-133f-488a-be79-31775be8e8cd';
DELETE FROM availability_override WHERE doctor_id = 'ae5d4932-133f-488a-be79-31775be8e8cd';
DELETE FROM recurring_availability WHERE doctor_id = 'ae5d4932-133f-488a-be79-31775be8e8cd';
DELETE FROM clinic_holiday WHERE reason = 'DEMO_HOLIDAY';

-- ============================================================================
-- 1. Recurring availability: Mon–Sat 09:00–17:00, STREAM, 30-min slots
-- ============================================================================
INSERT INTO recurring_availability
  (doctor_id, day_of_week, start_time, end_time, slot_duration,
   schedule_type, session_type, max_appts_per_slot, availability_type, is_active)
VALUES
  ('ae5d4932-133f-488a-be79-31775be8e8cd', 'MONDAY',    '09:00', '17:00', 30, 'STREAM', 'MORNING', 1, 'RECURRING', true),
  ('ae5d4932-133f-488a-be79-31775be8e8cd', 'TUESDAY',   '09:00', '17:00', 30, 'STREAM', 'MORNING', 1, 'RECURRING', true),
  ('ae5d4932-133f-488a-be79-31775be8e8cd', 'WEDNESDAY', '09:00', '17:00', 30, 'STREAM', 'MORNING', 1, 'RECURRING', true),
  ('ae5d4932-133f-488a-be79-31775be8e8cd', 'THURSDAY',  '09:00', '17:00', 30, 'STREAM', 'MORNING', 1, 'RECURRING', true),
  ('ae5d4932-133f-488a-be79-31775be8e8cd', 'FRIDAY',    '09:00', '17:00', 30, 'STREAM', 'MORNING', 1, 'RECURRING', true),
  ('ae5d4932-133f-488a-be79-31775be8e8cd', 'SATURDAY',  '09:00', '17:00', 30, 'STREAM', 'MORNING', 1, 'RECURRING', true);
-- ⚠️ Sunday intentionally omitted → triggers "Clinic is closed" reason.

-- ============================================================================
-- 2. Doctor leave override (full-day unavailable on CURRENT_DATE + 8)
-- ============================================================================
INSERT INTO availability_override
  (doctor_id, date, is_unavailable, availability_type)
VALUES
  ('ae5d4932-133f-488a-be79-31775be8e8cd',
   (CURRENT_DATE + INTERVAL '8 days')::date,
   true,
   'CUSTOM');

-- ============================================================================
-- 3. Saturate CURRENT_DATE + 5 so it shows "fully booked → next slot"
--    Day has 16 STREAM slots (09:00-17:00 / 30 min) — book all of them.
-- ============================================================================
-- gen_random_uuid() needs the pgcrypto extension (no-op if already enabled)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO booking
  (doctor_id, patient_id, date, start_time, end_time, status, token_no)
SELECT
  'ae5d4932-133f-488a-be79-31775be8e8cd',
  gen_random_uuid(),  -- distinct fake patient per slot
  (CURRENT_DATE + INTERVAL '5 days')::date,
  (TIME '09:00' + (gs * INTERVAL '30 minutes'))::time,
  (TIME '09:30' + (gs * INTERVAL '30 minutes'))::time,
  'BOOKED',
  gs + 1
FROM generate_series(0, 15) gs;

-- ============================================================================
-- 4. Optional: clinic holiday (for an alternate "clinic closed" demo case)
-- ============================================================================
INSERT INTO clinic_holiday (date, leave_type, reason)
VALUES
  ((CURRENT_DATE + INTERVAL '14 days')::date, 'HOLIDAY', 'DEMO_HOLIDAY');

-- ============================================================================
-- 5. Doctor with NO availability anywhere -> triggers
--    "No upcoming availability found within the next 30 days." (BadRequest)
-- ============================================================================
-- Fixed UUID for the empty-schedule doctor: 22222222-2222-2222-2222-222222222222
DELETE FROM doctor_profile WHERE doctor_id = '22222222-2222-2222-2222-222222222222';
DELETE FROM "user"         WHERE user_id   = '22222222-2222-2222-2222-222222222222';

INSERT INTO "user" (user_id, mobile_number, role, name, email)
VALUES ('22222222-2222-2222-2222-222222222222',
        '9999900000',
        'DOCTOR',
        'Dr. No Schedule',
        NULL);

INSERT INTO doctor_profile
  (doctor_id, specialization, years_experience, qualifications,
   clinic_name, street, city, state, zip, country)
VALUES ('22222222-2222-2222-2222-222222222222',
        'General Medicine',
        1,
        'MBBS',
        NULL, NULL, NULL, NULL, NULL, NULL);

-- Intentionally NO recurring_availability and NO availability_override rows.
-- Every day in the next 30 days will resolve to reason = NO_SCHEDULE.

-- ============================================================================
-- 6. Address for the main demo doctor (used by GET /doctors/:id/address)
-- ============================================================================
UPDATE doctor_profile
SET clinic_name = 'Apollo Clinic',
    street      = '12 MG Road, Indiranagar',
    city        = 'Bangalore',
    state       = 'Karnataka',
    zip         = '560038',
    country     = 'India'
WHERE doctor_id = 'ae5d4932-133f-488a-be79-31775be8e8cd';

COMMIT;

-- ============================================================================
-- Verification queries — run after seeding
-- ============================================================================
SELECT 'recurring_availability' AS table, COUNT(*) AS rows
FROM recurring_availability WHERE doctor_id = 'ae5d4932-133f-488a-be79-31775be8e8cd'
UNION ALL
SELECT 'availability_override', COUNT(*)
FROM availability_override WHERE doctor_id = 'ae5d4932-133f-488a-be79-31775be8e8cd'
UNION ALL
SELECT 'booking (saturated day)', COUNT(*)
FROM booking
WHERE doctor_id = 'ae5d4932-133f-488a-be79-31775be8e8cd'
  AND date = (CURRENT_DATE + INTERVAL '9 days')::date
UNION ALL
SELECT 'clinic_holiday (demo)', COUNT(*)
FROM clinic_holiday WHERE reason = 'DEMO_HOLIDAY'
UNION ALL
SELECT 'no-schedule doctor recurring rows', COUNT(*)
FROM recurring_availability WHERE doctor_id = '22222222-2222-2222-2222-222222222222';

-- Print the demo dates so you can paste them into Postman
SELECT
  (CURRENT_DATE + INTERVAL '8 days')::date  AS leave_date,
  (CURRENT_DATE + INTERVAL '9 days')::date  AS fully_booked_date,
  (CURRENT_DATE + INTERVAL '10 days')::date AS happy_path_date,
  (CURRENT_DATE + INTERVAL '14 days')::date AS clinic_holiday_date,
  '22222222-2222-2222-2222-222222222222'    AS no_availability_doctor_id;

-- Find next Sunday (for the "clinic closed because no Sunday recurring" demo)
SELECT (CURRENT_DATE + ((7 - EXTRACT(DOW FROM CURRENT_DATE)::int) % 7) * INTERVAL '1 day')::date
       AS next_sunday;
