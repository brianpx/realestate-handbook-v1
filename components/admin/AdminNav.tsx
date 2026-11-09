'use client';

import { LayoutDashboardIcon, UsersIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BreadcrumbPage } from '@/components/ui/breadcrumb';
import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { ADMIN } from '@/lib/routes';

const ITEMS = [
  { title: 'Overview', href: ADMIN, icon: LayoutDashboardIcon },
  { title: 'Leads', href: `${ADMIN}/leads`, icon: UsersIcon },
] as const;

// Overview is the group's root, so only an exact match lights it up; the others own their sub-paths.
const active = (pathname: string, href: string) => (href === ADMIN ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));
const current = (pathname: string) => ITEMS.find(item => active(pathname, item.href));

export function AdminNav() {
  const pathname = usePathname();
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Admin</SidebarGroupLabel>
      <SidebarMenu>
        {ITEMS.map(item => (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton tooltip={item.title} isActive={active(pathname, item.href)} render={<Link href={item.href} aria-current={active(pathname, item.href) ? 'page' : undefined} />}>
              <item.icon />
              <span>{item.title}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}

/** The current page's name for the header breadcrumb; the layout cannot know the path, so this reads it. */
export function AdminBreadcrumbPage() {
  const pathname = usePathname();
  return <BreadcrumbPage>{current(pathname)?.title ?? 'Admin'}</BreadcrumbPage>;
}
