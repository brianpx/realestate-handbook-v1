# Remediation plan — separate approval required

This audit changes documentation and adds isolated audit evidence only. No application fix, commit, deployment or message sending is authorized by this report.

| Order | Work package | Issues | Smallest maintainable correction | Acceptance gate |
|---|---|---|---|---|
| 1 | Reflow and preserve user work | MA-01,03,09 | Fix intrinsic-width causes, preserve pending profile edits, expose existing backup recovery | 320px + text enlargement; delayed PUT retains newer input; wrong-file import can be undone |
| 2 | Keyboard and nonvisual feedback | MA-02,07,08,11,12 | Explicit focus destinations, scoped prose markers, status announcements, accurate current state | Keyboard all transitions; VoiceOver/TalkBack status and lists; no focus reset to body |
| 3 | Navigation and form recovery | MA-04,05,06,10,15 | Available-height menu, retained resend address, real retry control, history restoration, draft recovery | 768×320 and 844×390; offline retry; browser Back; expired session |
| 4 | Typography and touch | MA-13,14,17 | Bounded popover; shared mobile control sizing; scalable header labels | 200% native text and zoom; 24px WCAG spacing review; 44–48px primary actions |
| 5 | Performance evidence and targeted optimization | MA-18 | Production traces and route chunk accounting before changing bundles; test slow network/CPU | Repeat lab runs; field p75 LCP≤2.5s, INP≤200ms, CLS≤0.1; lab is not field |
| 6 | Consolidation | MA-17 | Incremental semantic control tokens and shared primitives | Existing styles and theme tests unchanged; no wholesale redesign |
| 7 | Platform QA / optional enhancements | MA-16 | Physical-device keyboard, safe-area and toolbar tests first | iOS Safari, iPad split-screen, Android Chrome; add viewport-fit only with safe padding |

Shared fixes with greatest reach: public grid constraints, chapter table wrappers, ChoiceDrill transitions, Sidebar available-height sizing, SignupForm state, shared Button touch metrics. Each package should add a focused regression test and run `pnpm typecheck` plus affected Vitest/Playwright checks. Use an isolated branch/worktree; rebase findings against current source hashes because other sessions are active. Obtain approval for remediation, then implement packages in order. Do not replace useful native controls or hide page overflow globally.
