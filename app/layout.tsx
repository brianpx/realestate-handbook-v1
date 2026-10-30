import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { BOOK_TITLE } from '@/lib/pages';
import { SITE_DESCRIPTION, SITE_TITLE } from '@/lib/offer';
import './globals.css';

import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: `%s - ${BOOK_TITLE}` },
  description: SITE_DESCRIPTION,
  robots: { index: true, follow: true, 'max-image-preview': 'large' },
  icons: { icon: '/images/favicon-32.png', apple: '/images/apple-touch-icon.png' },
  openGraph: {
    type: 'website',
    siteName: BOOK_TITLE,
    locale: 'en_US',
    images: [{ url: '/images/og-image.png', width: 1200, height: 630, alt: `${BOOK_TITLE}: a practical guide for new agents` }],
  },
  twitter: { card: 'summary_large_image' },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#020617' },
  ],
};

// Runs before first paint so dark mode does not flash light. Same keys as the static site.
const THEME_SCRIPT = `try{var s=JSON.parse(localStorage.getItem('handbookSettings')||'{}')||{};if(s.dark!==undefined?s.dark:matchMedia('(prefers-color-scheme: dark)').matches)document.documentElement.classList.add('dark');if(s.fullWidth===true)document.documentElement.classList.add('wide');if(s.hideQuizzes===true)document.documentElement.classList.add('hide-quizzes');if(s.textSize==='small'||s.textSize==='large')document.documentElement.classList.add('text-'+s.textSize)}catch(e){}`;

// Old shared links look like /#ch5 (the handbook used to be the home page). Hashes never reach the server, so
// redirect on the client. In-page anchors on the sales page (#pricing, #faq) do not match and are left alone.
const HASH_SCRIPT = `var h=location.hash.replace(/^#/,'');if(/^(cover|pref|ch\\d+|app-[a-f])$/.test(h)&&location.pathname==='/'){location.replace('/handbook/'+h)}`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: HASH_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
