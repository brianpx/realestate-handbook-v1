# Accessibility report

**Full WCAG 2.2 AA conformance is not established.** This audit combines source inspection, DOM/computed-style observations and selected keyboard tests. No screen reader or physical-device test occurred. Axe is absent and no axe scan was run; therefore there are no axe-reported violations to claim.

| Issue | Evidence | WCAG review |
|---|---|---|
| MA-01 | 200% root-font simulation causes document overflow on four routes | 1.4.4 Resize Text / 1.4.10 Reflow; confirm native zoom/text settings and table exceptions |
| MA-02 | Keyboard Next in Fair Housing leaves focus on BODY | 2.4.3 Focus Order; explicit next prompt/result destination needed |
| MA-07 | Ordinary chapter UL/OL computed list-style-type:none | 1.3.1 Info and Relationships; ordered sequence and Safari AT exposure need manual review |
| MA-08 | Completed timer verdict lacks status semantics | 4.1.3 Status Messages, source-confirmed omission; actual announcements unverified |
| MA-11 | Script reveal hides focused trigger | 2.4.3, probable until runtime reproduction |
| MA-12 | Two home hash links marked current simultaneously | Accurate state / 4.1.2 review; do not equate automatically to a proven conformance failure |
| MA-04,13 | Short-height navigation and long glossary content | 2.4.11 Focus Not Obscured and reflow require further interaction checks |
| MA-14 | Several shared controls smaller than preferred mobile targets | 2.5.8 must assess 24×24px minimum, spacing and exceptions; 44–48px preference is not AA minimum |

Positive evidence: HTML language; explicit landmarks/headings; global focus rings and forced-color fallback; reduced-motion CSS; field error descriptions and aria-invalid; quiz feedback focus/live regions; table captions/headers/aria-sort; keyboard- and click-operable glossary; audio transcripts and user-initiated playback; sidebar inertness and Escape/navigation-focus tests.

Existing test subset includes quiz keyboard behavior, sidebar/search inertness, navigation heading focus, settings focus persistence, semantic lists, headings, sticky search clearance, contrast of one timeline state, large-text rail wrapping, 900/901px breakpoint behavior, and table captions. Exact execution results are in DEVICE_TEST_MATRIX.md. The development menu-focus failure targeted NEXTJS-PORTAL, not application content; the identical production subset passed 19/19 without code changes.

Manual gaps: VoiceOver/Safari, TalkBack/Chrome, NVDA/Firefox; complete keyboard traversal; full contrast including dark/disabled/loading states; native 200% text zoom and browser 400% reflow; text-spacing overrides; forced-colors rendering; target-size spacing exceptions; focus with virtual keyboard/sticky overlays; all empty/error/long-content states. GoalCalculator dialog h3→h5 jump (components/widgets/GoalCalculator.tsx:111,117,125) is a low-priority structural recommendation, not a standalone AA failure.

References verified online: [WCAG 2.2](https://www.w3.org/TR/WCAG22/), [target size and exceptions](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum), [reflow](https://www.w3.org/WAI/WCAG21/Understanding/reflow), [Apple accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility), [Android accessibility / Material control guidance](https://developer.android.com/guide/topics/ui/accessibility/apps). The attempted Material 3 accessibility-basics URL returned 404, so Android’s official guidance is used as the corroborating source; no claim of a complete current Material specification review.
