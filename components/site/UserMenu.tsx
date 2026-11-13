'use client';

import Link from 'next/link';
import type { ComponentType, SVGProps } from 'react';
import { BookOpenIcon, HouseIcon, LifeBuoyIcon, LogOutIcon, MonitorIcon, MoonIcon, PenLineIcon, SettingsIcon, SmilePlusIcon, SunIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLinkItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { AccountSummary } from '@/lib/account/me';
import { useTheme, type ThemeChoice } from '@/lib/state/theme';

type Icon = ComponentType<SVGProps<SVGSVGElement>>;
type MenuLink = { href: string; label: string; Icon: Icon };

const FEEDBACK: MenuLink = { href: '/support?topic=feedback', label: 'Feedback', Icon: SmilePlusIcon };
const LINKS: readonly MenuLink[] = [
  { href: '/', label: 'Home Page', Icon: HouseIcon },
  { href: '/support', label: 'Help', Icon: LifeBuoyIcon },
  { href: '/handbook', label: 'Docs', Icon: BookOpenIcon },
  { href: '/updates', label: 'Changelog', Icon: PenLineIcon },
];
const THEMES: readonly { value: ThemeChoice; label: string; Icon: Icon }[] = [
  { value: 'system', label: 'System', Icon: MonitorIcon },
  { value: 'light', label: 'Light', Icon: SunIcon },
  { value: 'dark', label: 'Dark', Icon: MoonIcon },
];
const isThemeChoice = (value: unknown): value is ThemeChoice => THEMES.some(t => t.value === value);
const SIGN_OUT_ACTION = '/api/auth/sign-out';
const AVATAR_BUTTON = "inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 p-0 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 [@media(pointer:coarse)]:size-11";

// A name that is only the address's local part carries no initials worth showing, so that account gets the gradient.
function initialsOf(account: AccountSummary): string | null {
  if (account.displayName === account.email.split('@')[0]) return null;
  const words = account.displayName.split(/\s+/).filter(Boolean);
  const letters = words.length > 1 ? [words[0], words[words.length - 1]] : words.slice(0, 1);
  return letters.map(word => word?.[0]?.toUpperCase() ?? '').join('') || null;
}

// The same address always gets the same two hues.
function gradientFor(seed: string): string {
  let hash = 0;
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return `linear-gradient(135deg, hsl(${hash % 360} 75% 55%), hsl(${(hash >>> 9) % 360} 75% 45%))`;
}

export function UserAvatar({ account, className }: { account: AccountSummary; className?: string }) {
  const initials = initialsOf(account);
  return (
    <Avatar className={className}>
      {account.avatarUrl && <AvatarImage src={account.avatarUrl} alt="" />}
      <AvatarFallback
        className={initials ? 'bg-accent text-accent-foreground' : undefined}
        style={initials ? undefined : { background: gradientFor(account.email) }}
        aria-hidden="true"
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

/** The space the avatar button takes, shown while the account is still loading so the header does not shift again. */
export function UserMenuPlaceholder() {
  return <span className={`${AVATAR_BUTTON} bg-muted`} aria-hidden="true" />;
}

const rowLabel = (label: string, Icon: Icon) => (
  <>
    <span>{label}</span>
    <Icon aria-hidden="true" className="ml-auto text-muted-foreground" />
  </>
);

/** The avatar button and its Vercel-style dropdown, for the header's right edge. */
export function UserMenu({ account }: { account: AccountSummary }) {
  const [theme, setTheme] = useTheme();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={AVATAR_BUTTON} aria-label={`Account menu for ${account.displayName}`}>
        <UserAvatar account={account} className="size-full" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="[&_svg]:[stroke-width:1.5]">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="min-w-0 flex-1">
            <p className="m-0 truncate text-sm leading-tight font-semibold">{account.displayName}</p>
            <p className="m-0 truncate text-sm leading-tight text-muted-foreground">{account.email}</p>
          </div>
          <DropdownMenuLinkItem render={<Link href="/account" />} closeOnClick aria-label="Account settings" className="size-8 min-h-8 w-8 shrink-0 justify-center p-0">
            <SettingsIcon aria-hidden="true" className="text-muted-foreground" />
          </DropdownMenuLinkItem>
        </div>
        <DropdownMenuLinkItem render={<Link href={FEEDBACK.href} />} closeOnClick>{rowLabel(FEEDBACK.label, FEEDBACK.Icon)}</DropdownMenuLinkItem>
        <div className="flex items-center gap-2 px-2 py-1">
          <span className="text-sm">Theme</span>
          <DropdownMenuRadioGroup
            aria-label="Theme"
            value={theme}
            onValueChange={value => { if (isThemeChoice(value)) setTheme(value); }}
            className="ml-auto inline-flex gap-0.5 rounded-full border border-border p-0.5"
          >
            {THEMES.map(({ value, label, Icon }) => (
              <DropdownMenuRadioItem
                key={value}
                value={value}
                label={label}
                aria-label={label}
                closeOnClick={false}
                className="grid size-6 cursor-default place-items-center rounded-full text-muted-foreground outline-none data-checked:bg-accent data-checked:text-accent-foreground data-highlighted:ring-2 data-highlighted:ring-ring [@media(pointer:coarse)]:size-9"
              >
                <Icon aria-hidden="true" className="size-3.5" />
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </div>
        {LINKS.map(({ href, label, Icon }) => (
          <DropdownMenuLinkItem key={href} render={<Link href={href} />} closeOnClick>{rowLabel(label, Icon)}</DropdownMenuLinkItem>
        ))}
        <DropdownMenuSeparator />
        {/* A real form post: the item must stay mounted until the browser has sent it, so it does not close the menu itself. */}
        <form method="post" action={SIGN_OUT_ACTION}>
          <DropdownMenuItem nativeButton render={<button type="submit" />} closeOnClick={false}>{rowLabel('Log Out', LogOutIcon)}</DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** The same account items laid out in the phone menu panel, where a nested popover would be awkward. */
export function AccountPanel({ account }: { account: AccountSummary }) {
  const [theme, setTheme] = useTheme();
  const link = ({ href, label, Icon }: MenuLink) => (
    <Link key={href} href={href} className="pub-account-link">{label}<Icon aria-hidden="true" /></Link>
  );
  return (
    <div className="pub-account" role="group" aria-label="Account">
      <div className="pub-account-head">
        <div className="pub-account-who">
          <strong>{account.displayName}</strong>
          <span>{account.email}</span>
        </div>
        <Link href="/account" className="pub-account-gear" aria-label="Account settings"><SettingsIcon aria-hidden="true" /></Link>
      </div>
      {link(FEEDBACK)}
      <div className="pub-account-theme">
        <span id="pubThemeLabel">Theme</span>
        <div role="group" aria-labelledby="pubThemeLabel" className="pub-theme-pill">
          {THEMES.map(({ value, label, Icon }) => (
            <button key={value} type="button" aria-label={label} aria-pressed={theme === value} onClick={() => setTheme(value)}>
              <Icon aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>
      {LINKS.map(link)}
      <form method="post" action={SIGN_OUT_ACTION}>
        <button type="submit" className="pub-account-link">Log Out<LogOutIcon aria-hidden="true" /></button>
      </form>
    </div>
  );
}
