import { MoonIcon, SunIcon } from '@phosphor-icons/react'

import { Button } from '@/components/ui/button'
import { themeStore, useTheme } from '@/lib/theme'

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useTheme()
  const next = theme === 'dark' ? 'light' : 'dark'
  return (
    <Button
      variant="ghost"
      size="icon"
      className={className}
      aria-label={theme === 'dark' ? 'Usar tema claro' : 'Usar tema oscuro'}
      onClick={() => themeStore.set(next)}
    >
      {theme === 'dark' ? <SunIcon className="size-[18px]" /> : <MoonIcon className="size-[18px]" />}
    </Button>
  )
}
