'use client';

import { ChevronDownIcon, SettingsIcon } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

const SETTINGS_LINKS = [
  { id: 'account/authentication', label: 'Authentication', href: '/account/authentication' },
  { id: 'account/billing', label: 'Billing Information', href: '/account/billing' },
];

/**
 * The Settings row of the sidebar: a gear row that opens /account, and a disclosure button beside it that shows the
 * settings pages indented under it. The group stays open while the reader is on /account or one of its pages (like
 * a part of the book holding the current page); folded, its list is `hidden`, so its links leave the tab order.
 */
export function SettingsNav({ current }: { current: string }) {
  const here = current === 'account' || SETTINGS_LINKS.some(link => link.id === current);
  const [unfolded, setUnfolded] = useState(false);
  const open = here || unfolded;
  return (
    <li className="nav-settings">
      <div className="nav-settings-row">
        <Link href="/account" className={`nav-item nav-settings-link${current === 'account' ? ' active' : ''}`} data-page="account" aria-current={current === 'account' ? 'page' : undefined}>
          <SettingsIcon aria-hidden="true" size={16} />
          Settings
        </Link>
        <button
          type="button"
          className="nav-settings-toggle"
          aria-label="Settings pages"
          aria-expanded={open}
          aria-controls="navSettings"
          aria-disabled={here || undefined}
          onClick={() => { if (!here) setUnfolded(u => !u); }}
        >
          <ChevronDownIcon aria-hidden="true" size={16} />
        </button>
      </div>
      <ul className="nav-group-list nav-settings-list" role="list" id="navSettings" hidden={!open}>
        {SETTINGS_LINKS.map(link => (
          <li key={link.id}>
            <Link href={link.href} className={`nav-item${current === link.id ? ' active' : ''}`} data-page={link.id} aria-current={current === link.id ? 'page' : undefined}>{link.label}</Link>
          </li>
        ))}
      </ul>
    </li>
  );
}
