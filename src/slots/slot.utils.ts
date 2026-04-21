
// export function generateTimeSlots(
//   start: string,
//   end: string,
//   intervalMinutes: number,
// ): { start: string; end: string }[] {   // ← change return type
//   const slots: { start: string; end: string }[] = [];
// //   const slots = [];
//   const [sh, sm] = start.split(':').map(Number);
//   const [eh, em] = end.split(':').map(Number);
//   let current = new Date(2020, 1, 1, sh, sm);
//   let endTime = new Date(2020, 1, 1, eh, em);

//   while (current < endTime) {
//     const slotStart = new Date(current);
//     const slotEnd = new Date(current.getTime() + intervalMinutes * 60000);
//     if (slotEnd <= endTime) {
//       const format = (d: Date) =>
//         d.toTimeString().slice(0, 5); // HH:MM

//       slots.push({
//         start: format(slotStart),
//         end: format(slotEnd),
//       });
//     }

//     current.setMinutes(current.getMinutes() + intervalMinutes);
//   }
 
//   return slots;
// }

export function generateTimeSlots(
  start: string,
  end: string,
  intervalMinutes: number,
): { start: string; end: string }[] {

  // 🚨 Prevent invalid input
  if (!intervalMinutes || intervalMinutes <= 0) {
    throw new Error(`Invalid intervalMinutes: ${intervalMinutes}`);
  }

  if (start === end) {
    return [];
  }

  const slots: { start: string; end: string }[] = [];

  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);

  const current = new Date(2020, 1, 1, sh, sm);
  const endTime = new Date(2020, 1, 1, eh, em);

  // 🚨 If time is reversed (example override gives bad value)
  if (current >= endTime) {
    return [];
  }

  const format = (d: Date) => d.toTimeString().slice(0, 5);

  // 🔒 Add iteration safety-limit (failsafe for corrupted data)
  let safetyCounter = 0;
  const SAFETY_LIMIT = 2000; // Enough for any normal slot schedule

  while (current < endTime) {
    safetyCounter++;
    if (safetyCounter > SAFETY_LIMIT) {
      console.error("Slot generation aborted due to infinite-loop risk.");
      break;
    }

    const slotStart = new Date(current);
    const slotEnd = new Date(current.getTime() + intervalMinutes * 60000);

    if (slotEnd <= endTime) {
      slots.push({
        start: format(slotStart),
        end: format(slotEnd),
      });
    }

    current.setMinutes(current.getMinutes() + intervalMinutes);
  }

  return slots;
}