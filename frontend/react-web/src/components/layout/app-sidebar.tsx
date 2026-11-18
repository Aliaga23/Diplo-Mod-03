import { Link, useLocation } from 'react-router'

import { Logo } from '@/components/common/logo'
import type { NavGroup, NavItem } from '@/components/layout/nav'
import { UserMenu } from '@/components/layout/user-menu'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar'

export function AppSidebar({ nav }: { nav: NavGroup[] }) {
  const { pathname } = useLocation()
  const isActive = (item: NavItem) => (item.exact ? pathname === item.href : pathname.startsWith(item.href))

  return (
    <Sidebar>
      <SidebarHeader className="px-3 pt-4">
        <Link to="/" className="px-1 text-sidebar-accent-foreground">
          <Logo />
        </Link>
      </SidebarHeader>
      <SidebarSeparator className="mx-0" />
      <SidebarContent>
        {nav.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-[11px] tracking-wider text-sidebar-foreground/45 uppercase">
              {group.label}
            </SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) => {
                const active = isActive(item)
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      className="relative h-9 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:before:absolute data-[active=true]:before:inset-y-2 data-[active=true]:before:-left-2 data-[active=true]:before:w-[3px] data-[active=true]:before:rounded-full data-[active=true]:before:bg-sidebar-primary"
                    >
                      <Link to={item.href}>
                        <item.icon weight={active ? 'fill' : 'regular'} className={active ? 'text-sidebar-primary' : ''} />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="pb-3">
        <UserMenu />
      </SidebarFooter>
    </Sidebar>
  )
}
