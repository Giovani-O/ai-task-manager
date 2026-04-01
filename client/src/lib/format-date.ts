import { format } from 'date-fns'

export function formatDateTime(date: Date | null | undefined): string {
  if (!date) return '—'
  return format(date, 'dd/MM/yyyy HH:mm')
}
