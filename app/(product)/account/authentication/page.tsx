import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { ChromeIcon, GithubIcon, KeyRoundIcon, MailIcon } from 'lucide-react';
import { SettingsCard } from '@/components/account/SettingsCard';
import { ProductCard } from '@/components/shell/ProductCard';
import { Badge } from '@/components/ui/badge';
import { requireViewer } from '@/lib/auth/dal';

export const metadata: Metadata = { title: 'Authentication', alternates: { canonical: '/account/authentication' } };

function MethodRow({ icon, title, subtitle, control, method }: { icon: ReactNode; title: string; subtitle: ReactNode; control: ReactNode; method: string }) {
  return (
    <li data-auth-method={method} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-3">
      <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-[6px] border border-border bg-muted/50">{icon}</span>
      <div className="min-w-0 flex-1 basis-48">
        <p className="m-0 font-medium">{title}</p>
        <p className="m-0 text-sm [overflow-wrap:anywhere] text-muted-foreground">{subtitle}</p>
      </div>
      {control}
    </li>
  );
}

const comingSoon = <Badge variant="secondary">Coming soon</Badge>;

// How the reader proves who they are. Today that is one way: a one-time link sent to their address (see the email
// card on /account). The other methods are listed so the reader can see what is planned, with no control that
// pretends to work.
export default async function AuthenticationPage() {
  const { user } = await requireViewer();
  return (
    <ProductCard>
      <p className="part-label">Account</p>
      <h1 className="hb-title">Authentication</h1>

      <SettingsCard id="sign-in-methods" title="Sign-in Methods" description="Customize how you access your account.">
        <ul className="m-0 list-none divide-y divide-border rounded-[6px] border border-border p-0">
          <MethodRow
            method="email"
            icon={<MailIcon size={18} />}
            title="Email"
            subtitle={<span data-auth-email>{user.email}</span>}
            control={<Link href="/account#email" className="btn-nav btn-secondary max-sm:w-full">Manage</Link>}
          />
          <MethodRow method="passkeys" icon={<KeyRoundIcon size={18} />} title="Passkeys" subtitle="Sign in with your fingerprint, face or device lock." control={comingSoon} />
          <MethodRow method="google" icon={<ChromeIcon size={18} />} title="Google" subtitle="Sign in with your Google account." control={comingSoon} />
          <MethodRow method="github" icon={<GithubIcon size={18} />} title="GitHub" subtitle="Sign in with your GitHub account." control={comingSoon} />
        </ul>
      </SettingsCard>

      <SettingsCard
        id="two-factor"
        title="Two-Factor Authentication"
        description="You sign in with a one-time link we email you, so access to your inbox is the only factor today. An authenticator app and passkeys are not available yet."
        footer="Keep your email account secure: anyone who can read your inbox can sign in as you."
        action={<button type="button" disabled className="btn-nav btn-secondary">Set Up Authenticator App</button>}
      >
        <p className="m-0 flex items-center gap-2 text-sm">Authenticator app {comingSoon}</p>
      </SettingsCard>
    </ProductCard>
  );
}
