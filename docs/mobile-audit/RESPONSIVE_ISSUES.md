# Responsive and interaction issue inventory

Audit date: 2026-11-10. Snapshot at commit `2e02de7` plus existing working-tree changes; source hashes in artifacts/source-snapshot.json. No production edits. P0: none established; this does not certify all workflows. P1 means high-impact; P2 significant friction; P3 enhancement or coverage gap. A standards reference indicates a criterion for evaluation, not a claim of formally established failure.

## MA-01 — P1: 200% root-text overflow

- Status: **Confirmed browser**.
- Routes/components: /, /preview, /handbook/ch1, /account.
- Source: `app/(public)/site.css:82,129–130; app/globals.css:551–553; app/(product)/account/page.tsx:110`.
- Environment: Chromium 320×640, root font 200%.
- Reproduce / observed versus expected: Set html font-size:200% at 320px, scroll horizontally. Measured document widths: 386, 359, 343, 443px respectively; expected content reflow. Account support email is 411px wide; public single-column grid uses an auto minimum, and nested chapter tables need inspection.
- Evidence: artifacts/targeted.json; artifacts/diagnostics.json; screenshots/text200-*.png.
- Standard/principle: WCAG 1.4.4/1.4.10 review. Root scaling is a stress simulation, not native browser text-only zoom; table cells can be exempt but whole-page spill should be contained..
- Correction: Use minmax(0,1fr), min-width:0 on shrinkable content, wrapping long email/text, and locally scrollable table wrappers. Never globally hide horizontal overflow.
- Regression risk: Medium; complexity: Medium.

## MA-02 — P1: Drill transition loses focus

- Status: **Confirmed browser**.
- Routes/components: /handbook/ch11 — ChoiceDrill.
- Source: `components/widgets/ChoiceDrill.tsx:15,41–48,75`.
- Environment: Chromium 390×844; keyboard.
- Reproduce / observed versus expected: Choose first Fair Housing option, focus Next phrase, press Enter. activeElement becomes BODY rather than next question. Result/restart transitions share the same static risk.
- Evidence: artifacts/targeted.json.
- Standard/principle: WCAG 2.4.3 focus order/orientation review.
- Correction: Focus next prompt, result heading and restarted prompt; preserve answer feedback.
- Regression risk: Low; complexity: Small.

## MA-03 — P1: Edits during profile save can be overwritten

- Status: **Probable workflow defect**.
- Routes/components: /account — ProfileForm.
- Source: `components/account/ProfileForm.tsx:81,90–97,149`.
- Environment: Any viewport, delayed PUT; not runtime verified.
- Reproduce / observed versus expected: Save profile, edit again before response returns. Source replaces current values with response snapshot while inputs remain editable. Expected preservation of later edits. Local fixture has no profile database, so this race was not executed.
- Evidence: Source inspection.
- Standard/principle: Preserve input and avoid silent data loss.
- Correction: Disable editable fieldset during save or track request revisions and preserve newer values.
- Regression risk: Medium; complexity: Small–medium.

## MA-04 — P2: Short-landscape menu extends below viewport

- Status: **Confirmed browser geometry; impact needs device QA**.
- Routes/components: Handbook shell — mobile sidebar.
- Source: `app/globals.css:1096–1103,1110–1124`.
- Environment: Chromium 768×320 landscape.
- Reproduce / observed versus expected: Open fresh chapter menu. Navigation bottom is 353.53px in 320px viewport, with Close menu below screenshot; top X remains visible. Expected menu scroller and closing affordances fit available height.
- Evidence: artifacts/targeted.json; screenshots/landscape-menu.png.
- Standard/principle: Responsive available-height layout; focus not obscured requires further keyboard/device confirmation.
- Correction: Size menu to available dynamic viewport below actual header/search and reserve close-control space.
- Regression risk: Medium; complexity: Medium.

## MA-05 — P2: Resend requires retyping email

- Status: **Confirmed static**.
- Routes/components: /signin, /signup, shared signup placements.
- Source: `components/site/SignupForm.tsx:110,121`.
- Environment: All devices; runtime resend not executed.
- Reproduce / observed versus expected: Submit successfully, wait 30s, select Send again. Handler returns to idle and remounts blank uncontrolled email field. Expected resend or retained address.
- Evidence: Source inspection.
- Standard/principle: Recoverability and recognition over recall.
- Correction: Retain address and resend deliberately; keep cooldown and submission protection.
- Regression risk: Low; complexity: Small.

## MA-06 — P2: Search error recovery is undiscoverable

- Status: **Confirmed static**.
- Routes/components: Handbook/account search.
- Source: `components/shell/SidebarSearch.tsx:52,111,134`.
- Environment: All devices; failed request state not executed.
- Reproduce / observed versus expected: Fail search-index fetch, restore network and keep typing. failed prevents effect retry; only focus event retries. Plain Try again text is not actionable.
- Evidence: Source inspection.
- Standard/principle: Error recovery and WCAG 3.3.3 review.
- Correction: Provide explicit Retry button and announced loading/failure state.
- Regression risk: Low; complexity: Small.

## MA-07 — P2: Prose list markers are removed

- Status: **Confirmed browser styling; AT impact unverified**.
- Routes/components: Chapter prose including /handbook/ch1.
- Source: `app/globals.css:1,435–437`.
- Environment: Chromium; all widths.
- Reproduce / observed versus expected: Inspect ordinary chapter ul/ol. First five inspected lists have list-style-type:none, including an ordered list. Expected bullets/numbers where sequence or grouping conveys meaning.
- Evidence: artifacts/diagnostics.json; docs/plans/PROGRESS.md:240.
- Standard/principle: WCAG 1.3.1 review; VoiceOver list exposure needs actual testing.
- Correction: Restore scoped disc/decimal markers; preserve deliberate custom lists and explicit list semantics.
- Regression risk: Medium; complexity: Small–medium.

## MA-08 — P2: Timing result lacks announcement

- Status: **Confirmed static omission**.
- Routes/components: /handbook/ch4 — ResponseTimer.
- Source: `components/widgets/ResponseTimer.tsx:41–43,61–62`.
- Environment: All devices; screen reader not tested.
- Reproduce / observed versus expected: Start then stamp a reply. Verdict added to ordinary list, without live region or focus transfer. Expected nonvisual status notification.
- Evidence: Source inspection.
- Standard/principle: WCAG 4.1.3.
- Correction: Announce completed verdict in atomic status; keep ticking timer silent.
- Regression risk: Low; complexity: Small.

## MA-09 — P2: Progress restore has no recovery control

- Status: **Confirmed product limitation**.
- Routes/components: /account; Settings — ProgressTransfer.
- Source: `components/shell/ProgressTransfer.tsx:53–64; app/(product)/account/page.tsx:106`.
- Environment: Any viewport, particularly phone.
- Reproduce / observed versus expected: Import wrong valid backup then seek undo. Pre-import backup exists but account explicitly discloses no restore button. Expected accessible recovery.
- Evidence: Source inspection.
- Standard/principle: Recoverability; confirmation exists, so not an automatic WCAG error-prevention failure.
- Correction: Add guarded Restore previous backup/Undo with summary and persistence-error handling.
- Regression risk: Medium; complexity: Medium.

## MA-10 — P2: Back navigation can lose reading position

- Status: **Probable**.
- Routes/components: Handbook chapter navigation.
- Source: `components/shell/Sidebar.tsx:142–155`.
- Environment: Mobile window and desktop nested scroll.
- Reproduce / observed versus expected: Read halfway, change chapter, browser Back. Pathname effect resets window/main unless hash exists and can compete with restoration. Runtime not verified.
- Evidence: Source inspection.
- Standard/principle: Predictable history and preservation of reading context.
- Correction: Respect history restoration; distinguish new navigation from history traversal and preserve hash behavior.
- Regression risk: Medium; complexity: Medium.

## MA-11 — P2: Script reveal hides focused control

- Status: **Probable**.
- Routes/components: /handbook/ch6, ch9, ch11, pref — ScriptBox.
- Source: `components/widgets/ScriptBox.tsx:83–88`.
- Environment: Keyboard on any viewport.
- Reproduce / observed versus expected: Practice, type, activate Reveal script to compare. Button becomes hidden with no explicit focus destination. Runtime not verified.
- Evidence: Source inspection.
- Standard/principle: WCAG 2.4.3 review.
- Correction: Focus revealed comparison region or persistent control and announce change.
- Regression risk: Low; complexity: Small.

## MA-12 — P2: Two current locations exposed at once

- Status: **Confirmed static incorrect state**.
- Routes/components: / — PublicHeader.
- Source: `components/site/PublicHeader.tsx:18–21,64`.
- Environment: All devices.
- Reproduce / observed versus expected: Open home navigation. Both hash links get aria-current=location from pathname alone regardless current section.
- Evidence: Source inspection.
- Standard/principle: Accurate programmatic state; WCAG 4.1.2 review.
- Correction: Track actual location or omit current-location state; retain exact-page current state.
- Regression risk: Low; complexity: Small.

## MA-13 — P2: Long glossary definitions can exceed viewport

- Status: **Probable**.
- Routes/components: Chapter TermPopover.
- Source: `components/shell/TermPopover.tsx:89–98; app/globals.css:1024`.
- Environment: 320px text enlargement or short landscape.
- Reproduce / observed versus expected: Open long term. Position clamps/flips but no max-height or scrolling handles a taller-than-viewport definition. Runtime not verified.
- Evidence: Source inspection.
- Standard/principle: Readable overlays and reflow.
- Correction: Bound to available viewport; permit scrolling with accessible focus/escape behavior.
- Regression risk: Medium; complexity: Small–medium.

## MA-14 — P2: Touch metrics differ between component systems

- Status: **Design recommendation**.
- Routes/components: Settings, account transfer and admin controls.
- Source: `components/ui/button.tsx:21–32; app/globals.css:1045–1049`.
- Environment: Coarse pointer/mobile.
- Reproduce / observed versus expected: Shared Buttons use 24/28/32/36px variants while legacy controls get 44px height. Not sufficient evidence of WCAG 2.5.8 failure.
- Evidence: Source inspection.
- Standard/principle: WCAG minimum 24px with exceptions; prefer 44–48 CSS px for primary touch actions.
- Correction: Adopt deliberate mobile/coarse-pointer target policy; inspect spacing and avoid bloating dense tables.
- Regression risk: Medium; complexity: Medium.

## MA-15 — P2: Expired session recovery loses profile draft

- Status: **Probable**.
- Routes/components: /account — ProfileForm.
- Source: `components/account/ProfileForm.tsx:70,105`.
- Environment: Any device; expired-session PUT not executed.
- Reproduce / observed versus expected: Enter draft, receive 401, leave to sign in and return. Draft exists only in component state.
- Evidence: Source inspection.
- Standard/principle: Form recovery and input preservation.
- Correction: Preserve draft through reauthentication with explicit short retention/cleanup or warn before leaving.
- Regression risk: Medium; complexity: Medium.

## MA-16 — P3: Safe areas and virtual keyboard unverified

- Status: **Verification gap**.
- Routes/components: All shells, dialogs and forms.
- Source: `app/layout.tsx:25–30; app/globals.css:679,694`.
- Environment: Physical iOS/iPadOS/Android.
- Reproduce / observed versus expected: No safe-area env rules or viewport-fit opt-in. Default containment can be correct: absence alone is not a defect. Browser toolbars, keyboard, cutouts and standalone use were not physically tested.
- Evidence: Static inspection only.
- Standard/principle: Platform usability.
- Correction: Test physical devices first; add safe-area insets together with edge-to-edge opt-in only if needed.
- Regression risk: High if viewport-fit changed alone; complexity: Small implementation, substantial QA.

## MA-17 — P3: Typography and control systems need incremental consolidation

- Status: **Design recommendation**.
- Routes/components: Public/product/admin shared UI.
- Source: `app/globals.css:118–124,1074–1083,1274–1281; app/(public)/site.css:35–39,57`.
- Environment: Root/default text changes.
- Reproduce / observed versus expected: Header branding uses fixed px/vw sizes; legacy and Base UI controls have divergent radii and metrics. Root text enlargement does not scale all labels equally.
- Evidence: Static inspection; text200 screenshots.
- Standard/principle: Scalable typography and maintainable design tokens.
- Correction: Introduce shared semantic control metrics and scalable header units; retain brand and content-driven breakpoints.
- Regression risk: Medium; complexity: Medium–large.

## MA-18 — P3: Production performance and accessibility automation incomplete

- Status: **Verification gap**.
- Routes/components: Representative routes and interactions.
- Source: `playwright.config.ts:1; package.json:1`.
- Environment: All target platforms.
- Reproduce / observed versus expected: No axe or Lighthouse dependency and no configured browser projects; existing suite narrower than requested matrix. Full CWV/AT certification unavailable.
- Evidence: Environment discovery and test artifacts.
- Standard/principle: WCAG manual review plus field Core Web Vitals.
- Correction: Add repeatable audit jobs after approval, representative production lab profiles and real-user metric collection; no measured INP claim from lab proxies.
- Regression risk: Low; complexity: Medium.

