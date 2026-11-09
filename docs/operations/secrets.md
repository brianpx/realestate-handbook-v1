# Project secrets in 1Password

## Verified setup

- CLI: `/opt/homebrew/bin/op`, version `2.42.0`.
- Authentication: existing 1Password desktop-app integration, matching `delphi-studio-v2`.
- Vault: **Real Estate Handbook**.
- Vault ID: `6hjbm6aq3zvcwyncacm2xs37i4`.
- Created on November 8, 2026 (America/Los_Angeles), initially empty. Existing credentials have not been imported, rotated, or changed in hosting settings.

This vault holds this project's secrets. Use Password items with titles such as `DEVELOPMENT_DATABASE_URL` or `PRODUCTION_SENDGRID_API_KEY`, storing the credential in the `password` field. Always identify the environment before saving or using a credential. Do not copy Delphi's credentials into this project.

## Access checks

```sh
op --version
op vault get 6hjbm6aq3zvcwyncacm2xs37i4 --format=json
op item list --vault 6hjbm6aq3zvcwyncacm2xs37i4 --format=json
```

Unlock the desktop app and approve its authentication prompt when requested. If a sandbox prevents desktop communication, request the normal execution permission; do not bypass it or change global authentication settings. Desktop authentication uses the user's existing account permissions; this vault does not restrict the CLI to only this project's secrets.

## Store and use secrets

Create items in the desktop app, or submit an item template to `op item create` through standard input with the explicit vault ID. Keep values in process memory, never in command arguments, terminal output, chat, logs, or tracked files. After storing a credential, privately compare a fresh read against the source and report only whether it matches. Preserve existing items; avoid duplicate titles.

Use `op run` to resolve references into the child process environment. Once an item exists, use its item ID in references where possible. For example, after storing a development database credential under the title above:

```sh
DATABASE_URL='op://6hjbm6aq3zvcwyncacm2xs37i4/DEVELOPMENT_DATABASE_URL/password' \
  op run -- pnpm dev
```

This is a usage example, not an existing credential. Never use a production database for routine local development. Do not run `printenv`, echo resolved credentials, or use `--no-masking`; CLI masking is only a safety net. Secret reference URIs contain identifiers, not secret values, and may be documented in the repository.

Consult `.env.example` for application settings. Current secret-bearing settings include `DATABASE_URL`, `LEAD_IP_SALT`, `SENDGRID_API_KEY`, and `VERCEL_AUTOMATION_BYPASS_SECRET`. Store only credentials actually provisioned for the intended environment; creating this vault does not authorize generating provider keys, rotating credentials, or changing deployments. Nonsecret settings can stay in normal environment configuration.

## Handoff status

CLI installation, desktop authentication, and vault creation are complete. No service account, offline recovery copy, or hosting synchronization was configured.

As of November 9, 2026 the vault holds `DEVELOPMENT_SHADCNUI_KIT_API_KEY` (matches `.env.local`) and `PREVIEW_AUTH_IP_SALT` (matches Vercel's Preview-only `AUTH_IP_SALT`). Vercel has no Development variables. The database and Neon variables are single entries shared by Preview and Production, so they are production credentials and were not imported. End-to-end `op run` resolution remains unverified.
