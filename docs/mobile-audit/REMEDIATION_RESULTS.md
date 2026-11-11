# Remediation results

The user authorized execution of REMEDIATION_PLAN.md after the audit. Implementation was developed and checked in isolated worktrees; production deployment, commits and external-service changes were not performed. Existing unrelated working-tree edits are preserved.

## Changes

| Findings | Implementation |
|---|---|
| MA-01 | Public grid tracks shrink correctly, long content wraps, table overflow stays local; four failing 200% root-text cases now fit 320px |
| MA-02,11 | Drill next/result/restart and script reveal have explicit focus destinations |
| MA-03 | Profile inputs are unavailable while save is pending, preventing overwritten edits |
| MA-04 | Menu/search height uses measured shell edge and visual viewport height |
| MA-05 | Resend review retains the address and focuses the input; wording describes the review step |
| MA-06 | Search has an explicit retry with preserved focus and loading/error status |
| MA-07 | Scoped prose list markers restored; custom navigation lists remain intentional |
| MA-08 | Latest timer verdict is an atomic status, separate from continuously ticking time |
| MA-09 | Previous-backup recovery exposed; import must save a coherent recoverable snapshot before replacement |
| MA-10 | Native mobile history restoration retained; desktop panel positions restored without stale-route writes |
| MA-12 | Untracked hash links no longer claim current-location state |
| MA-13 | Long glossary definitions fit available height and scroll by keyboard; Escape restores owner focus |
| MA-14,17 | Shared touch-target sizing and min-height/wrapping policy; scalable headers with actual-height clearance |
| MA-15 | Account-scoped same-tab draft recovery, 30-minute eligibility window, latest values captured before reauthentication, cleanup after save |
| MA-18 | Added focused regression coverage and repeated production lab diagnostics; no speculative bundle rewrite |

Shared changes preserve existing colors, branding and native controls. No global overflow-x hiding was introduced. The previous audit remains a dated baseline; these results supersede its issue status for the changed code.

## Remaining limits

MA-16 physical iOS/iPadOS/Android keyboard, cutout/safe-area, toolbar and split-screen checks cannot be completed without device access. No viewport-fit opt-in was added without that evidence. Root-font enlargement remains a simulation, not native browser zoom certification. VoiceOver/TalkBack and full contrast review remain manual follow-up.

Performance observations are local lab samples, not field p75 metrics. INP, field CWV, real cellular behavior, Lighthouse and axe remain unmeasured. No third-party analytics endpoint was introduced. Firefox is not installed. No production database migration ran. Database-dependent integration tests remain skipped. The profile recovery mechanism works in the same tab/account and does not transfer drafts into a separate mail browser.

## Verification

Final integration results are recorded below. The first expanded run exposed a desktop history failure and an outdated fixed-header-height expectation; both were investigated rather than weakening the reading-position check. A separate short-landscape menu/Close-control regression passed. The production viewport collector initially timed out waiting for network idle on token-recovery pages; HTTP responses were 200. Its rerun used DOMContentLoaded plus per-width layout observation and completed 1,104 rows with expected statuses and no default-text document overflow. This is layout evidence, not certification of token flows.

## Repeated performance observations

Three cold browser-context samples per route, production localhost, 4× CPU and throttled network as in the original audit. These were captured before the final desktop history-listener guard, which was subsequently regression-tested separately. LCP is a candidate at capture; shift values are raw sums, not full session-window CLS. No field performance pass is claimed.

| Route | LCP candidate range | Median | Encoded JS | Shift sum |
|---|---:|---:|---:|---:|
| `/` | 744–748ms | 744ms | 290,566 bytes | 0 |
| `/preview` | 768–784ms | 780ms | 278,327 bytes | 0 |
| `/handbook/ch11` | 856–868ms | 868ms | 409,697 bytes | 0 |

The chapter route remains the largest measured JS transfer. These changes add only a few kilobytes decoded relative to baseline; no evidence justified a risky registry rewrite. Trace/chunk attribution and real-user monitoring remain follow-up work.

## Files changed

- `app/(product)/account/page.tsx`
- `app/(public)/site.css`
- `app/globals.css`
- `components/account/ProfileForm.test.tsx`
- `components/account/ProfileForm.tsx`
- `components/shell/ProgressTransfer.tsx`
- `components/shell/Sidebar.tsx`
- `components/shell/SidebarSearch.test.tsx`
- `components/shell/SidebarSearch.tsx`
- `components/shell/TermPopover.tsx`
- `components/site/PublicHeader.test.tsx`
- `components/site/PublicHeader.tsx`
- `components/site/SignupForm.test.tsx`
- `components/site/SignupForm.tsx`
- `components/ui/button.tsx`
- `components/widgets/ChoiceDrill.tsx`
- `components/widgets/ResponseTimer.tsx`
- `components/widgets/ScriptBox.tsx`
- `components/widgets/interaction-accessibility.test.tsx`
- `e2e/css.spec.ts`
- `e2e/mobile-layout.spec.ts`
- `e2e/mobile-recovery.spec.ts`
- `e2e/site.spec.ts`
- `lib/state/index.ts`
- `lib/state/transfer.test.ts`

Changes were partitioned across isolated worktrees, reviewed by a separate agent, and integrated into `/private/tmp/reh-mobile-remediation`. The final copy back uses source-hash guards and preserves pre-existing e2e/site.spec.ts edits. No branch checkout or commit is performed in the shared working tree.

## Final verification results

- `pnpm typecheck`: passed in isolated integration worktree.
- `pnpm test`: 849 passed; 20 database/integration-dependent tests skipped (80 files passed, 4 skipped).
- `env -u DATABASE_URL -u E2E_DATABASE_URL NEXT_PUBLIC_COACH_ENABLED=true pnpm build`: passed; TypeScript passed; 45 pages generated; database migration skipped because DATABASE_URL unset.
- `node node_modules/@playwright/test/cli.js test -c remediation.config.ts`: **89 passed** against final production build. Includes unweakened desktop/mobile history assertions, short-landscape menu, 200% text reflow, glossary keyboard scrolling, touch targets and backup recovery.
- Production Chromium/WebKit layout sweep: 1,104 route/width observations, expected HTTP statuses and no default-text document overflow. Captured before the final history timing correction; final history behavior separately passed the full browser suite.
- Repeated performance: three samples per route, raw evidence in `artifacts/remediation-performance.json`; no INP/field pass claimed.
- Separate-agent review: reported issues corrected and rechecked; no remaining correctness blocker identified.
- Source-hash guards passed before copying 25 owned code/test files to the original working tree. The copied files exactly match verified integration files; hashes retained in `remediation/artifacts/verified-source.json`.
- `git diff --check`: passed. Existing unrelated edits preserved. No commits, pushes or deployments.
