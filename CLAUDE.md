@AGENTS.md

## Claude Code

- Use plan mode for multi-package or architectural changes.
- Editing subagents run with `isolation: worktree`.

## Secrets

- Use the project's 1Password vault `Real Estate Handbook` (`6hjbm6aq3zvcwyncacm2xs37i4`). See [the secrets runbook](docs/operations/secrets.md) before storing or using credentials.
- Authenticate through the existing 1Password desktop integration. Never print secret values or put them in chat, command arguments, logs, or tracked files. Use `op run` with secret references for commands that need credentials.
- The vault was created empty; do not assume credentials have been migrated. Keep development, preview, and production items distinct, and never replace an existing credential merely to populate the vault.
