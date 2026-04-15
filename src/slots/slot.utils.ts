
export function generateTimeSlots(
  start: string,
  end: string,
  intervalMinutes: number,
): { start: string; end: string }[] {   // ← change return type
  const slots: { start: string; end: string }[] = [];
//   const slots = [];
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);

  let current = new Date(2020, 1, 1, sh, sm);
  let endTime = new Date(2020, 1, 1, eh, em);

  while (current < endTime) {
    const slotStart = new Date(current);
    const slotEnd = new Date(current.getTime() + intervalMinutes * 60000);

    if (slotEnd <= endTime) {
      const format = (d: Date) =>
        d.toTimeString().slice(0, 5); // HH:MM

      slots.push({
        start: format(slotStart),
        end: format(slotEnd),
      });
    }

    current.setMinutes(current.getMinutes() + intervalMinutes);
  }

  return slots;
}