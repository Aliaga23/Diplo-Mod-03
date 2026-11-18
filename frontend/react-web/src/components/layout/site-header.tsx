import { CaretDownIcon, ListIcon, SignOutIcon } from '@phosphor-icons/react'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router'

import { Logo } from '@/components/common/logo'
import { ThemeToggle } from '@/components/common/theme-toggle'
import { SITE_LINKS, accountLinks } from '@/components/layout/site-nav'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { ROLE_LABEL, authStore, useSession } from '@/lib/auth-store'
import { initials } from '@/lib/format'
import { cn } from '@/lib/utils'

function useLogout() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  return () => {
    authStore.clear()
    qc.clear()
    navigate('/', { replace: true })
  }
}

function AccountMenu() {
  const session = useSession()
  const logout = useLogout()
  if (!session) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-full border border-ink-line bg-white/5 py-1 pr-3 pl-1 text-sm hover:bg-white/10"
        >
          <Avatar className="size-7">
            <AvatarFallback className="bg-primary text-[11px] font-semibold text-primary-foreground">
              {initials(session.name)}
            </AvatarFallback>
          </Avatar>
          <span className="max-w-32 truncate font-medium">{session.name.split(' ')[0]}</span>
          <CaretDownIcon className="size-3.5 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="font-normal">
          <div className="text-sm font-medium">{session.name}</div>
          <div className="truncate text-xs text-muted-foreground">
            {session.email} · {ROLE_LABEL[session.role]}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {accountLinks(session.role).map((l) => (
          <DropdownMenuItem key={l.href} asChild>
            <Link to={l.href}>
              <l.icon />
              {l.label}
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={logout}>
          <SignOutIcon />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function MobileMenu() {
  const session = useSession()
  const logout = useLogout()
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white md:hidden" aria-label="Abrir menú">
          <ListIcon className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] gap-0">
        <SheetHeader className="border-b">
          <SheetTitle>
            <Logo />
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col p-2">
          {SITE_LINKS.map((l) => (
            <Link key={l.href} to={l.href} onClick={close} className="rounded-md px-3 py-2.5 text-sm font-medium hover:bg-muted">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto space-y-2 border-t p-4">
          {session ? (
            <>
              <div className="px-1 pb-2 text-xs text-muted-foreground">
                {session.name} · {ROLE_LABEL[session.role]}
              </div>
              {accountLinks(session.role).map((l) => (
                <Button key={l.href} asChild variant="outline" className="w-full justify-start">
                  <Link to={l.href} onClick={close}>
                    <l.icon />
                    {l.label}
                  </Link>
                </Button>
              ))}
              <Button variant="ghost" className="w-full justify-start text-destructive" onClick={logout}>
                <SignOutIcon />
                Cerrar sesión
              </Button>
            </>
          ) : (
            <>
              <Button asChild className="w-full">
                <Link to="/registro" onClick={close}>
                  Crear cuenta
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link to="/login" onClick={close}>
                  Iniciar sesión
                </Link>
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

/** Barra superior del sitio público: navy, fija arriba, sin sidebar. */
export function SiteHeader() {
  const session = useSession()

  return (
    <header className="sticky top-0 z-30 border-b border-ink-line bg-ink text-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 md:px-8">
        <Link to="/" className="shrink-0" aria-label="EntradasYa, inicio">
          <Logo className="[&_span:last-child]:text-white/55" />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {SITE_LINKS.map((l) => (
            <NavLink
              key={l.href}
              to={l.href}
              className={({ isActive }) =>
                cn(
                  'rounded-md px-3 py-2 text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white',
                  isActive && !l.href.includes('#') && 'text-white',
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle className="text-white/70 hover:bg-white/10 hover:text-white" />
          {session ? (
            <div className="hidden md:block">
              <AccountMenu />
            </div>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Button asChild variant="ghost" className="text-white/80 hover:bg-white/10 hover:text-white">
                <Link to="/login">Iniciar sesión</Link>
              </Button>
              <Button asChild>
                <Link to="/registro">Crear cuenta</Link>
              </Button>
            </div>
          )}
          <MobileMenu />
        </div>
      </div>
    </header>
  )
}
