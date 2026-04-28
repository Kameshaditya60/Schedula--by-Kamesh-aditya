# ✅ TEST CASE PLAN — Next Available Day Suggestion

> ❗ If the selected date has no available slots (override or recurring), the system should **suggest the next active day**.

### Functions Under Test

- `getSlotsForDate()`
- suggestNextAvailableDay()` *(new helper)*

---

## 🧪 A. Core Test Cases — Next Available Day Suggestion

### 1️⃣ Today Has Availability → No Suggestion Needed

**Scenario:** Input date falls on a recurring active day with at least one valid slot.

|                                | Detail                                          |
| ------------------------------ | ----------------------------------------------- |
| **Input**                      | Date = recurring active day with ≥ 1 valid slot |
| **Expected: slots**            | Returned normally                               |
| **Expected: suggestedNextDay** | `null`                                          |

---

### 2️⃣ Today Has Override Marked Unavailable

**Scenario:** An override record exists for today with `is_unavailable = true`.

| | Detail |
|---|---|
| **Input** | `override.is_unavailable = true` |
| **Expected: slots** | `[]` |
| **Expected: suggestedNextDay** | Next recurring day (uses recurring availability unless another override exists) |

---

### 3️⃣ Today Recurring Exists but ALL Slots Are Booked

**Scenario:** All slots for today are fully occupied by bookings.

| | Detail |
|---|---|
| **Input** | Bookings fully fill all STREAM slots, or all WAVE slots (`max_appts_per_slot` reached) |
| **Expected: slots** | `[]` |
| **Expected: suggestedNextDay** | Next active recurring day |

---

### 5️⃣ Today Override Exists with WAVE but Capacity Full

**Scenario:** A WAVE-type override exists for today, but max capacity is reached.

| | Detail |
|---|---|
| **Input** | `max_appts_per_slot = 3`, bookings = `3` |
| **Expected: slots** | `[]` |
| **Expected: suggestedNextDay** | Next available day suggested |

---

### 6️⃣ Today Override Exists with STREAM and Slot Already Booked

**Scenario:** A STREAM-type override exists (e.g. 10–11), but that slot is already booked.

| | Detail |
|---|---|
| **Input** | Stream override: `10:00–11:00`, booking exists for that slot |
| **Expected: slots** | `[]` |
| **Expected: suggestedNextDay** | Next available day suggested |

---

### 7️⃣ No Recurring + No Override Found for Today

**Scenario:** Today has no recurring schedule and no override record.

| | Detail |
|---|---|
| **Input** | No recurring entry, no override for today |
| **Expected: slots** | `[]` |
| **Expected: suggestedNextDay** | Next date with a recurring availability |

---

## 🧪 B. Multi-Day Logic Tests

### 9️⃣ Next Available Day Found via Override Before Recurring

**Scenario:** Today is full; tomorrow has an override; recurring resumes on Friday.

| | Detail |
|---|---|
| **Input** | Today = full; Tomorrow = override exists; Friday = next recurring day |
| **Expected: suggestedNextDay** | Tomorrow (override date), **not** Friday |

---

### 🔟 Multiple Overrides Exist — Pick Nearest Future Override

**Scenario:** Two future overrides exist; system must pick the closest.

| | Detail |
|---|---|
| **Overrides** | `2026-04-28`, `2026-04-30` |
| **Recurring** | Monday |
| **Input date** | `2026-04-27` |
| **Expected: suggestedNextDay** | `2026-04-28` *(closest)* |

---

### 1️⃣1️⃣ Override Has One Slot; Recurring Has Several

**Scenario:** Override's only slot is already booked; recurring next day has free slots.

| | Detail |
|---|---|
| **Input** | Override slot = booked; Recurring next day = free slots available |
| **Expected: suggestedNextDay** | Recurring next day |

---

### 1️⃣2️⃣ Override Exists but `is_unavailable = true`

**Scenario:** An override exists for today but it marks the day as unavailable.

| | Detail |
|---|---|
| **Input** | Override for today with `is_unavailable = true` |
| **Expected: slots** | `[]` (today is empty) |
| **Expected: suggestedNextDay** | Skip override, look to next available day |

---

## 🧪 C. Performance & DB Load Test Cases

> These ensure the solution is efficient and avoids unnecessary database queries.

### 1️⃣4️⃣ Next-Day Search Should NOT Check Beyond 14–30 Days

**Safety Rule:** If no availability is found within the next 14 days, the doctor has no active recurring schedule.

| | Detail |
|---|---|
| **Expected behavior** | Loop stops at 14 days |
| **Expected result** | Returns `"No upcoming availability"` |

---

## 🧪 D. Edge Cases

### 1️⃣6️⃣ Past Date

| | Detail |
|---|---|
| **Input** | `date < today` |
| **Expected** | ❌ Throws `"Cannot book past dates"` |

---

### 1️⃣7️⃣ Invalid `slot_duration`

| | Detail |
|---|---|
| **Input** | `slot_duration <= 0` |
| **Expected** | ❌ Throws `"Invalid slot_duration"` |

---

### 1️⃣8️⃣ Invalid Time Range

| | Detail |
|---|---|
| **Input** | `start_time === end_time` |
| **Expected** | ❌ Throws `"Invalid time range"` |

---

### 1️⃣9️⃣ No Availability for Next 30 Days

| | Detail |
|---|---|
| **Input** | No slots or overrides for the next 30 days |
| **Expected: slots** | `[]` |
| **Expected: suggestedNextDay** | `null` |
| **Expected: message** | `"Doctor has no upcoming availability"` |
