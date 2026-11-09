# Hosting and database ownership

On November 8, 2026 (America/Los_Angeles), `realestate-handbook` and its attached Neon database were transferred using the Vercel CLI from **brianpx's projects (Hobby)** to **meded (Pro)**. The CLI scope for meded is `brian-pitts`, not `meded`.

## Resources

| Resource | Identifier | Current location |
| --- | --- | --- |
| Vercel project | `prj_RtoVEbnWQiUEpZQgK9V01FDaNLbU` | [realestate-handbook in meded](https://vercel.com/brian-pitts/realestate-handbook) |
| Neon project | `morning-credit-15469990` | `realestate-handbook-db` |
| Vercel database resource | `store_pPuSqinKAVS2Sqoa` | [Database in meded](https://vercel.com/brian-pitts/~/stores/integration/store_pPuSqinKAVS2Sqoa) |

Vercel hosting is on Pro. The Neon database retained its existing **Free** plan; the ownership transfer did not upgrade the database plan.

## Verification at transfer

- Vercel reported the project owner as meded, with the original project ID retained and no transfer pending.
- The existing database resource appeared in meded and no longer appeared in the source team's storage list.
- The database remained connected to production, preview, and development, and the project's 18 environment-variable entries were retained.
- The transferred project's `NEON_PROJECT_ID` was confirmed as `morning-credit-15469990`.
- [The production site](https://realestate-handbook.vercel.app) returned HTTP 200. Direct deployment URLs redirected to Vercel authentication; those redirects were not application health checks.

An independently running production deployment finished before the transfer could proceed. The production deployment at completion was `dpl_LNwzB9p9TcLUvPCuDQedN3umjtEb` (`realestate-handbook-j89bvauml-brianpxs-projects.vercel.app`), with status READY. No application code was changed for the transfer. A direct database query was not performed.

## CLI checks

Use the destination scope for future project operations:

```sh
vercel project inspect realestate-handbook --scope brian-pitts
vercel storage get realestate-handbook-db --scope brian-pitts
vercel integration resource inspect realestate-handbook-db --scope brian-pitts
```
