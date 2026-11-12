# Coming-soon page: turning it on and off

While `COMING_SOON=true` is set on Production, every visitor without a session sees `/coming-soon` at whatever URL
they asked for, with `X-Robots-Tag: noindex` (`proxy.ts`, `lib/site.ts`). `/signin` and `/auth/verify` stay open, so
the owner can sign in and then see the whole site. Any other value, or no variable, leaves the site open.

The variable is set for **Production only**. Previews and local dev never show the coming-soon page unless you set it
there yourself.

## Before you run anything

The checkout is not linked to the Vercel project, so every command names it with `--project realestate-handbook`
(team `brian-pitts`). A changed variable only reaches the site on the **next production deployment**, so each
switch is two steps: change the variable, then redeploy production.

Check the current state:

```sh
vercel env ls production --project realestate-handbook | grep COMING_SOON
```

A `COMING_SOON` row means the switch exists. The value is stored as a Secret and shows as `Hidden`; the only value
that closes the site is `true`.

## Turn the coming-soon page off (launch)

```sh
vercel env rm COMING_SOON production --project realestate-handbook --yes
```

Then redeploy production (below).

## Turn the coming-soon page on

```sh
vercel env add COMING_SOON production --project realestate-handbook --value true
```

If the variable already exists with another value, add `--force` to overwrite it. Then redeploy production (below).

## Redeploy production

Either merge to `main`, which deploys production through the Git integration, or rebuild the current production
deployment without a code change:

```sh
vercel ls realestate-handbook --prod          # copy the newest Ready production URL
vercel redeploy <that-url> --target production
```

## Check it worked

```sh
curl -sI https://www.findnurturekeep.com/pricing | grep -i x-robots-tag
```

- **On:** `X-Robots-Tag: noindex`, and the page body is the coming-soon page.
- **Off:** no `noindex` from the proxy (crawlers stay out until `SITE_INDEXABLE=true`, a separate switch), and
  `/pricing` is the real pricing page.

Use a private window for a browser check: a signed-in session cookie gets past the coming-soon page.

## Known gaps while it is on

- `/images/*` (the book figures) and `/sitemap.xml` stay public.
- `/goodbye` and `/subscribe/confirm` show the coming-soon page.
- The `realestate-handbook.vercel.app` alias pointed at an older deployment that serves the full site (PROGRESS.md,
  9 November). Repoint or remove it if it still does.
