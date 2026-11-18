// Formatos de presentación (fechas en español, moneda configurable con VITE_CURRENCY).
const LOCALE = 'es'
const CURRENCY = import.meta.env.VITE_CURRENCY || 'BOB'

const money = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: CURRENCY })
const dateTime = new Intl.DateTimeFormat(LOCALE, { dateStyle: 'medium', timeStyle: 'short' })
const dateLong = new Intl.DateTimeFormat(LOCALE, {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})
const time = new Intl.DateTimeFormat(LOCALE, { hour: '2-digit', minute: '2-digit' })

export const formatMoney = (n: number) => money.format(n)
export const formatDateTime = (iso: string) => dateTime.format(new Date(iso))
export const formatDateLong = (iso: string) => dateLong.format(new Date(iso))
export const formatTime = (iso: string) => time.format(new Date(iso))

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('')
}

/** ISO → valor para <input type="datetime-local"> en hora local. */
export function toLocalInput(iso: string) {
  const d = new Date(iso)
  const offset = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - offset).toISOString().slice(0, 16)
}
