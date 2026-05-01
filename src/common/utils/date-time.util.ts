export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysStr(base: string, days: number): string {
  const d = new Date(base + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function combineDateTime(date: string, time: string): Date {
  const t = time.length === 5 ? `${time}:00` : time;
  return new Date(`${date}T${t}Z`);
}

export function minutesUntil(target: Date): number {
  return (target.getTime() - Date.now()) / 60000;
}
