'use client';

import { useCallback } from 'react';
import { useSettings, writeSettings } from './index';

export type ThemeChoice = 'system' | 'light' | 'dark';

const SYSTEM_DARK = '(prefers-color-scheme: dark)';

/**
 * The reader's theme choice, stored as `dark` in the same settings the sidebar's Dark mode switch writes
 * (undefined is "follow the system"). Choosing here also sets the class on <html> at once, because public pages
 * mount no Settings panel to mirror the setting.
 */
export function useTheme(): readonly [ThemeChoice, (choice: ThemeChoice) => void] {
  const { dark } = useSettings();
  const setTheme = useCallback((choice: ThemeChoice) => {
    writeSettings({ dark: choice === 'system' ? undefined : choice === 'dark' });
    document.documentElement.classList.toggle('dark', choice === 'system' ? window.matchMedia(SYSTEM_DARK).matches : choice === 'dark');
  }, []);
  return [dark === undefined ? 'system' : dark ? 'dark' : 'light', setTheme];
}
