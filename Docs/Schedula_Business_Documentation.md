# SCHEDULA — Business Flow Documentation

**Project:** Schedula by Kamesh Aditya
**Branch:** `feat/nextDay-availability-book`
**Live URL:** https://schedula-by-kamesh-aditya.onrender.com
**Document Type:** Business Flow — For Manager Review

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [User Signup & Authentication](#2-user-signup--authentication)
3. [Doctor Onboarding](#3-doctor-onboarding)
4. [Patient Profile Setup](#4-patient-profile-setup)
5. [Doctor Availability Management](#5-doctor-availability-management)
6. [Slot Viewing](#6-slot-viewing)
7. [Appointment Booking & Next-Day Auto-Booking](#7-appointment-booking--next-day-auto-booking)
8. [Business Flowchart Summary](#8-business-flowchart-summary)
9. [Key Business Rules Summary](#9-key-business-rules-summary)

---

## 1. System Overview

Schedula is an appointment scheduling platform that connects **Patients** with **Doctors**. The system manages doctor availability, generates bookable time slots, and handles appointment creation — including automatically booking the next available day when a selected date has no open slots.

### Platform Components

| Component | Purpose |
|---|---|
| User & Auth | Signup, OTP login, JWT-based access control |
| Doctor Profile | Doctor details: specialization, clinic, experience |
| Patient Profile | Patient details: date of birth, sex |
| Availability | Weekly recurring schedule set by the doctor |
| Availability Override | Date-specific exceptions: block a day or change hours |
| Slots | System-generated bookable time slots from availability |
| Booking | Patient books a slot; auto-books next day if current date is full |

### User Roles

| Role | Who | What They Can Do |
|---|---|---|
| PATIENT | End user seeking medical care | Set up profile, view slots, book & cancel appointments |
| DOCTOR | Medical professional | Set up profile, define availability, view their own schedule |
| ADMIN | Platform administrator | Role defined in the system (admin-specific routes not yet implemented in this branch) |

---

## 2. User Signup & Authentication

### 2.1 — Signup

Any new user — doctor or patient — registers by providing their mobile number, name, role, and optionally an email address. The mobile number must be exactly 10 digits and is unique across the system.

| Step | Action | Details |
|---|---|---|
| 1 | Submit signup details | Mobile number (10 digits), full name, role (DOCTOR or PATIENT), optional email |
| 2 | System validates input | Checks format: 10-digit mobile, valid role, non-empty name |
| 3 | Account created | User record is saved in the database with a unique ID |

### 2.2 — OTP-Based Login

Login is passwordless. The user provides their mobile number, receives a one-time password (OTP), enters it to verify identity, and receives a JWT token used for all subsequent protected actions.

| Step | Action | Details |
|---|---|---|
| 1 | Request OTP | User submits their mobile number; system generates a 6-digit OTP and stores it |
| 2 | Receive OTP | OTP is delivered (currently logged to console; SMS delivery can be integrated) |
| 3 | Verify OTP | User submits mobile + OTP; system checks against the latest stored OTP |
| 4 | JWT Token issued | On successful verification, a signed JWT token is returned — includes user ID and role |
| 5 | Token used for all requests | Every protected API call must include this token in the request header |

> **Note:** If a mobile number is not found at OTP verification time, the system auto-creates a basic user record.

### Authentication API Endpoints

| Action | Endpoint | Who Can Access | What Happens |
|---|---|---|---|
| Signup | POST /auth/signup | Anyone | Creates a new user account |
| Request OTP | POST /auth/request-otp | Anyone | Generates and sends OTP to the mobile number |
| Verify OTP | POST /auth/verify-otp | Anyone | Validates OTP and returns JWT access token |

---

## 3. Doctor Onboarding

After signup and login, a Doctor must complete their profile before they can be discovered by patients or set their availability. This step is protected — only users with the DOCTOR role can access it.

| Step | Action | Details |
|---|---|---|
| 1 | Login as Doctor | Doctor logs in via OTP and obtains a JWT token |
| 2 | Submit profile details | Provides specialization, years of experience, qualifications, clinic name, and address |
| 3 | Profile saved | If no profile exists, a new one is created. If one already exists, it is updated. |
| 4 | Doctor is discoverable | Patients can search for doctors by name or specialization |

### Doctor Profile Fields

| Field | Required | Description |
|---|---|---|
| Specialization | Yes | Medical specialty (e.g. Cardiology, Dermatology) |
| Years of Experience | Yes | Number of years in practice |
| Qualifications | Yes | Degrees and certifications |
| Clinic Name | Optional | Name of the clinic or hospital |
| Address | Optional | Physical location of the practice |

Patients can search for doctors by specialization or name using the public doctor listing endpoint — no login required.

---

## 4. Patient Profile Setup

After signup and login, a Patient sets up their profile with basic health-relevant details. This is protected — only users with the PATIENT role can access this step.

| Step | Action | Details |
|---|---|---|
| 1 | Login as Patient | Patient logs in via OTP and obtains a JWT token |
| 2 | Submit profile details | Provides date of birth and sex |
| 3 | Profile saved | Profile is created or updated in the system |

### Patient Profile Fields

| Field | Required | Description |
|---|---|---|
| Date of Birth | Yes | Patient's date of birth (YYYY-MM-DD format) |
| Sex | Yes | Patient's sex |

---

## 5. Doctor Availability Management

A doctor sets their weekly recurring availability — the days and time windows during which they accept appointments. They can also set date-specific overrides to change or block their schedule for a particular day.

### 5.1 — Recurring Availability (Weekly Schedule)

The doctor defines a reusable weekly schedule. This template repeats every week automatically.

| Step | Action | Details |
|---|---|---|
| 1 | Select days of the week | Doctor picks one or more days (e.g. MON, WED, FRI) |
| 2 | Set the time window | Start time and end time for the session (e.g. 09:00 to 13:00) |
| 3 | Choose slot duration | Each appointment slot length in minutes (e.g. 15 min) |
| 4 | Set schedule type | STREAM: one patient per slot. WAVE: multiple patients per slot (batch) |
| 5 | Choose session type | Label as MORNING, AFTERNOON, or EVENING |
| 6 | System saves the schedule | Overlapping slots on the same day are blocked automatically |

### Schedule Types Explained

| Type | How It Works | Example |
|---|---|---|
| STREAM | Each time slot accommodates exactly one patient. Once booked, the slot disappears from the available list. | 9:00–9:15 can only be booked by one patient |
| WAVE | Each time slot can accommodate multiple patients up to a set maximum (max_appts_per_slot). Slot remains visible until the maximum is reached. | 9:00–9:15 allows 3 patients simultaneously |

### 5.2 — Availability Override (Date-Specific Changes)

If a doctor needs to change their schedule for a specific date — such as being unavailable on a holiday or having different hours — they can create an override.

| Step | Option | Details |
|---|---|---|
| 1 | Full-day block | Set is_unavailable = true. Doctor shown as completely unavailable. No slots generated. |
| 2 | Custom time window | Provide a new start_time and end_time for that date, replacing the regular schedule |
| 3 | Conflict prevention | System blocks overlapping overrides and prevents time overrides when a full-day block already exists |

> **Note:** Overrides always take precedence over the recurring weekly schedule. If an override exists for a date, it is used — the weekly template is ignored for that day.

---

## 6. Slot Viewing

A patient selects a doctor and a date. The system calculates and returns the list of available time slots. Slots are never stored in the database — they are generated on demand.

| Step | Action | Details |
|---|---|---|
| 1 | Patient queries slots | Provides doctor ID and a date (today or future — past dates are rejected) |
| 2 | Check for override | If an override exists for that date, it is used instead of the recurring schedule |
| 3 | Full-day block check | If the override marks the doctor as unavailable, no slots are returned |
| 4 | Use recurring schedule | If no override, system looks up the recurring availability for that day of the week |
| 5 | Generate time slots | System breaks the time window into individual slots based on slot duration |
| 6 | Filter booked slots | STREAM: removes fully booked slots. WAVE: removes slots at max capacity. |
| 7 | Filter past slots | If the date is today, slots that have already passed are removed |
| 8 | Return available slots | Patient sees only genuinely open, bookable slots |

> **Note:** Slots are dynamically generated each time a patient queries them — they are not stored in the database.

---

## 7. Appointment Booking & Next-Day Auto-Booking

This section covers the primary feature of the `feat/nextDay-availability-book` branch. When a patient tries to book an appointment, the system either books the requested slot directly or automatically finds and books the next available day if no slots are open.

### 7.1 — Normal Booking Flow

| Step | Action | Details |
|---|---|---|
| 1 | Patient selects a slot | Chooses a doctor, date, start time, and end time |
| 2 | System validates the slot | Checks that the chosen slot is in the list of available slots for that date |
| 3 | Checks availability type | Looks at STREAM vs WAVE rules to confirm the slot has capacity |
| 4 | Booking created | A booking record is saved with status: BOOKED |
| 5 | Confirmation returned | "Booking created successfully" with the full booking details |

### 7.2 — Next-Day Auto-Booking (Key Feature)

> 🟢 **Latest Commit Update:** Search window reduced from **30 days to 7 days**.

If a patient tries to book a date that has no available slots (all full, doctor blocked, or no schedule set), the system automatically searches forward — day by day — to find the next date with open slots, then books the first available slot on that day.

| Step | Action | Details |
|---|---|---|
| 1 | Patient attempts to book | Submits a booking request for a doctor on a specific date |
| 2 | System gets slots | Result is an empty list — no slots available for that date |
| 3 | Auto-search triggered | System searches the next **7 days**, one day at a time, for available slots |
| 4 | Next available day found | First date with open slots is identified (e.g. tomorrow, or 3 days later) |
| 5 | First slot auto-selected | System picks the first available slot on that day automatically |
| 6 | Booking created | Booking saved for the new date and slot without patient needing to resubmit |
| 7 | Patient notified | Response: "Today's slot full. Automatically booked next available day: YYYY-MM-DD" |

> **Note:** If no availability is found within the next 7 days, the system returns an error: "No upcoming availability found."

### 7.3 — Booking Rules & Protections

| Rule | What It Prevents |
|---|---|
| No past date booking | Patients cannot book appointments for dates in the past |
| Slot must be valid | The chosen time slot must appear in the system's available slot list |
| STREAM: one per slot | A time slot cannot be double-booked in STREAM mode |
| WAVE: max capacity | A slot cannot exceed the doctor's max-appointments-per-slot setting |
| DB-level uniqueness | Database enforces a unique constraint: one patient cannot book the same doctor + date + time twice |
| Doctor unavailable override | Booking is blocked if the doctor has marked that date as fully unavailable |

### 7.4 — Other Booking Actions

> 🟢 **Latest Commit Update:** Role guards are now set per-endpoint. `getDoctorSchedule` is now restricted to **DOCTOR role only** (was accessible to both roles previously). Results also now sort by `date ASC, then start_time ASC`.

| Action | Who Can Access | What Happens |
|---|---|---|
| Cancel Booking | PATIENT (own bookings only) | Booking status changed to CANCELLED. Only the patient who made the booking can cancel it. |
| View My Bookings | PATIENT | Returns all bookings for the logged-in patient, sorted by date (most recent first) |
| View Doctor Schedule | **DOCTOR only** | Returns all BOOKED appointments for a doctor on a given date, sorted by date then start time |

---

## 8. Business Flowchart Summary

```
┌─────────────────────────────────────────────┐
│                   SIGNUP                    │
│  Mobile Number / Name / Role (DOCTOR|PAT.)  │
└──────────────────────┬──────────────────────┘
                       │
              ┌────────▼────────┐
              │   REQUEST OTP   │
              │  6-digit OTP    │
              └────────┬────────┘
                       │
              ┌────────▼────────┐
              │   VERIFY OTP    │
              │  JWT Issued     │
              └────────┬────────┘
                       │
           ┌───────────▼───────────┐
           │      ROLE CHECK       │
           └──────┬────────────────┘
                  │
       ┌──────────┴──────────────────┐
       │ DOCTOR                      │ PATIENT
       ▼                             ▼
┌──────────────┐           ┌──────────────────┐
│Doctor Profile│           │ Patient Profile  │
│Specialization│           │ DOB / Sex        │
│Clinic / Exp. │           └────────┬─────────┘
└──────┬───────┘                    │
       │                    ┌───────▼──────────┐
┌──────▼───────┐            │  View Slots      │
│Set Avail.    │            │  Doctor + Date   │
│Days/Times/   │            └───────┬──────────┘
│Duration/Type │                    │
└──────┬───────┘           ┌────────▼─────────┐
       │                   │   BOOK SLOT      │
┌──────▼────────┐          └────────┬─────────┘
│Override(opt.) │                   │
│Block/Change   │         ┌─────────┴──────────┐
│specific dates │         │                    │
└───────────────┘    Slot Available      Slot Full / No Slots
                          │                    │
                          │            ┌───────▼──────────┐
                          │            │ AUTO-BOOK         │
                          │            │ NEXT DAY          │
                          │            │ (search 7 days)   │
                          │            └───────┬──────────┘
                          │                    │
                    ┌─────▼────────────────────▼─────┐
                    │       BOOKING CONFIRMED         │
                    │         Status: BOOKED          │
                    └─────────────────────────────────┘
```

---

## 9. Key Business Rules Summary

### Authentication

| Rule | Details |
|---|---|
| Mobile-only login | No passwords. All logins use a 6-digit OTP sent to the mobile number. |
| Token-secured access | Every action after login requires a valid JWT token. Tokens carry the user's role. |
| Role enforcement | Doctors cannot access patient actions and vice versa. |

### Doctor Availability

| Rule | Details |
|---|---|
| Recurring schedule | Doctor sets a weekly template: chosen days, time window, slot duration, and schedule type. |
| No overlap allowed | Two availability windows on the same day cannot overlap. |
| Override wins | A date-specific override always replaces the recurring schedule for that day. |
| Full-day block | A doctor can mark a specific date as fully unavailable. |

### Slot Generation

| Rule | Details |
|---|---|
| Dynamic calculation | Slots are calculated on-demand — not stored in the database. |
| Past slots hidden | If today is queried, slots that have already passed are automatically removed. |
| STREAM vs WAVE | STREAM: one patient per slot. WAVE: multiple patients up to a set maximum. |

### Booking

| Rule | Details |
|---|---|
| Valid slot required | Only slots returned by the system can be booked — no arbitrary time booking. |
| No past booking | Patients cannot book appointments for dates in the past. |
| Next-day auto-booking (7-day window) | If no slots are available on the selected date, the system automatically books the first slot on the next available day (searches up to 7 days ahead). |
| Cancellation by patient only | Only the patient who made the booking can cancel it. |
| Double-booking prevented | The database enforces uniqueness — a patient cannot book the same slot twice. |
| Doctor schedule: DOCTOR role only | The endpoint to view the doctor schedule is restricted to DOCTOR role only. |

---

*Branch: feat/nextDay-availability-book | For Manager Review | Confidential*
