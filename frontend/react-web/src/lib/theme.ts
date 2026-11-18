// Tema claro/oscuro: una clase en <html> y la preferencia en localStorage.
import { useSyncExternalStore } from 'react'

export type Theme = 'light' | 'dark'
const KEY = 'entradasya.theme'

function initial(): Theme {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    /* sin almacenamiento */
  }
  return 'light'
}

let current: Theme = initial()
const listeners = new Set<() => void>()

function apply(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  document.documentElement.style.colorScheme = theme
}

apply(current)

export const themeStore = {
  get: () => current,
  set(theme: Theme) {
    current = theme
    apply(theme)
    try {
      localStorage.setItem(KEY, theme)
    } catch {
      /* sin almacenamiento */
    }
    listeners.forEach((l) => l())
  },
  subscribe(l: () => void) {
    listeners.add(l)
    return () => {
      listeners.delete(l)
    }
  },
}

export function useTheme() {
  return useSyncExternalStore(themeStore.subscribe, themeStore.get)
}
