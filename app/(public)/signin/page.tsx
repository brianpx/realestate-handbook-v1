import type { Metadata } from 'next';
import { SignupForm } from '@/components/site/SignupForm';
import { safeNextPath } from '@/lib/auth/validate';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to the handbook with an emailed link. No password, no card.',
  alternates: { canonical: '/signin' },
  robots: { index: false, follow: true },
};

type Props = { searchParams: Promise<{ next?: string | string[] }> };

// New and returning readers use the same form; preserve the page requested before sign-in.
export default async function SignInPage({ searchParams }: Props) {
  const { next } = await searchParams;
  const nextPath = safeNextPath(Array.isArray(next) ? next[0] : next);
  return <div className="pub-wrap auth-page"><SignupForm source="signin" next={nextPath} variant="page" /></div>;
}
