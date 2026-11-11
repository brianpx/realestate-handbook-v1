# Mobile UX review

The reading experience has a strong mobile foundation, but recovery and accessibility transitions need work. Route rendering and a successful navigation check do not establish every end-to-end business workflow.

| Journey | Evidence / current result | Friction and next action |
|---|---|---|
| Discover → sample | Pixel 7 preset touch Menu → Sample lesson executed successfully | Header exposes two current-location links (MA-12) |
| Sign up / sign in | Email keyboard/autocomplete, field-associated errors, loading and submission guards inspected; invalid email check executed | Resend clears address (MA-05). Actual email delivery and mail-client handoff not executed |
| Verify email | Invalid/missing-token recovery route rendered in matrix | Used/expired tokens, successful verification, cross-device and in-app-mail browser behavior unverified |
| Read → navigate → search | Authenticated chapters rendered across matrix; keyboard navigation/search inertness tests executed | Short landscape geometry MA-04; failure retry MA-06; history restoration MA-10 |
| First-week setup | Setup rendered at all widths and 200% root text without document overflow | Static back/skip, local persistence and heading-focus support; complete multi-step journey not executed |
| Plan / review | Pro fixture and coach flag show routes; coach-heading checks passed | Full plan creation/edit/review completion not executed |
| Practice drills | Existing quiz commitment/focus tests passed | Fair Housing Next loses focus (MA-02); script reveal probable MA-11; timer status MA-08 |
| Account / profile | Account rendered; profile database unavailable state shown in isolated fixture | Pending-save and reauthentication draft loss probable (MA-03,15) |
| Save / restore progress | Export/import implementation and confirmation inspected | Previous backup has no recovery button (MA-09); native phone download/import unverified |
| Admin | Dashboard, users, leads and audit rendered with admin fixture | Empty/small fixture data only; user detail/actions and long populated tables unverified |

No essential drag-only flow was found. Glossary activation supports click and Escape as well as hover. Signup/lead status and quiz feedback have deliberate accessibility support. StartSetup offers optional skips and back navigation; profile fields are optional. Local-only progress and lack of synchronization are disclosed.

The mobile keyboard, autofill, system font settings, browser zoom, notches, Dynamic Island clearance, bottom browser toolbar, physical orientation changes and installed mode were not tested on hardware. No edge-to-edge requirement was inferred from absent safe-area CSS. Dark preference and reduced-motion media matching were exercised, but this is not a complete theme contrast or animation audit.

Design inventory: semantic colors and light/dark palettes in globals.css:13–110; system sans/serif fonts; 6px base radius with legacy/public variants; Base UI/shadcn base-nova and Lucide; Tailwind v4 plus handwritten CSS. Product breakpoints 420/600/700/900/1000/1100px, admin mobile hook 768px, outline container thresholds 1160/1628px. These different thresholds are not inherently defects. Consolidate repeated control metrics after fixing behavior, preserving branding.
