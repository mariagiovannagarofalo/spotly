import { Plan } from '../types'

export function tzLabel(iana: string): string {
  try {
    return new Intl.DateTimeFormat('en', { timeZone: iana, timeZoneName: 'short' })
      .formatToParts(new Date())
      .find(p => p.type === 'timeZoneName')?.value ?? iana
  } catch { return iana }
}

export function getEventTop(plan: Plan, startHour: number, rowHeight: number): number {
  if (!plan.start_time) return 0
  const [h, m] = plan.start_time.split(':').map(Number)
  return (h - startHour) * rowHeight + (m / 60) * rowHeight
}

export function getEventHeight(plan: Plan, startHour: number, rowHeight: number): number {
  if (!plan.start_time || !plan.end_time) return rowHeight
  const [sh, sm] = plan.start_time.split(':').map(Number)
  const [eh, em] = plan.end_time.split(':').map(Number)
  const mins = (eh * 60 + em) - (sh * 60 + sm)
  return Math.max(rowHeight * 0.5, (mins / 60) * rowHeight)
}

export function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}
