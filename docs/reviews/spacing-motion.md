# Peramax spacing and motion review

Method: dual-agent (A: /root/design_review · B: /root/evidence_review).
Target: src/App.tsx and shared expense sheet, dashboard, Activity, More, and responsive CSS.
Review date: 16 November 2026, Asia/Manila. Source review only; no supported browser tool was available. This is a pre-fix assessment, not a visual performance certification.

## Design health

| Heuristic | Score / 4 | Main finding |
| --- | ---: | --- |
| System status | 3 | Totals need explicit filter scope |
| Real-world match | 4 | PHP, Pamasahe, and Manila periods fit daily use |
| Control and freedom | 3 | Strong draft protection; confusing empty filter states |
| Consistency | 3 | CSS layers compete over component spacing |
| Error prevention | 3 | Validation and discard confirmation are present |
| Recognition | 3 | Visible category choices and amount presets help |
| Efficiency | 2 | Many Activity controls lack clear grouping |
| Minimalist design | 3 | Separate limit cards are useful, but spacing varies |
| Error recovery | 2 | Missing Clear filters makes recovery harder |
| Help | 2 | Scope of totals needs explanation |
| Total | 28/40 | Solid task model; spacing and motion need correction |

## Specificity and strengths

The green/stone visual language supports a Filipino daily spending app through concrete categories, payment methods, amount presets, and calendar rules. Preserve these rather than replacing the visual identity. Sticky saves, visible date/note, remembered payment, separate limit cards, clear warning words, draft protection, and keyboard-operable sheet handles are strengths.

## Priorities and fixes

1. P2: Layout overrides defeat responsive behavior. The expense-specific three-column category rule overrides the narrow-screen fallback; metadata column widths override compact desktop widths. Fixed with matching-specificity final breakpoints at 359px and 960–1150px. Spacing follows 16px group / 24px section intervals. Category icons and separate limit cards remain.
2. P2: Amount presets and category legend had no separation because both adjacent margins were set to zero. Restored an 18px group gap and consistent date/note spacing; kept all fields visible and sticky actions accessible.
3. P2: Scroll morph changes padding while scrolling, causing available text width and potentially row height to change. Stabilized horizontal padding, retained rounded corners, reduced scale travel to 2.5% horizontally and 0.8% vertically, and used the transformed rectangle's center with center-origin scaling. Page and sheet-content transitions now fade without competing horizontal/vertical travel.
4. P2: Reduce animations was only partly honored. The app preference reached MotionConfig/CSS while imperative sheet animations and morph hooks read only the OS setting. One shared hook now combines both preferences across declarative and imperative paths. Long downward drags previously animated toward a fixed 100px destination, potentially reversing upward; dismissal now continues below the release point.
5. P1/P2: Financial context was omitted from accessible transaction names; period totals and matching totals had different unlabeled scopes. Added amount/date/category/payment as each row's accessible description, labeled period totals as before filters, added Clear filters, and distinguished filtered emptiness from an empty period. Row names retain the existing Edit action; details are available as the description.

## Persona and cognitive-load review

- Interrupted one-handed user: keep the six familiar category choices visible, but distinguish the preset group and preserve the draft through accidental close.
- First-time user: label what a payment total covers and provide recovery when filtering hides entries.
- Low-vision / screen-reader user: preserve focus outlines and provide transaction financial details, not just repeated note names.

Activity still has several meaningful controls: period, search, category, payment, and sorting. The fix groups them instead of removing requested functionality. Screen-reader testing and phone viewport checks remain necessary.

## Verification

Regression checks cover app-level reduced motion during imperative modal close, long-drag exit direction, filter clearing and empty-state language, and existing expense/plan/savings flows. No new fonts, backend, or storage migration is introduced.

## Run notes

Assessment A finished before B's detector evidence entered synthesis. Both independent assessments agree on narrow-screen CSS and reduced-motion defects. CLI detector and context launcher were actually attempted and failed with exit127 because `.codex/skills/impeccable/scripts/impeccable` is absent. No numerical detector finding count is asserted. No PRODUCT.md, DESIGN.md, or critique ignore list found. Slug persistence/trend unavailable with missing launcher; this report is the manual archive. Browser visibility and overlay injection unavailable: no supported browser/cua tool exposed. No critique server started; no server cleanup required. No temporary report body created. Visual check, mobile keyboard, touch gestures, and performance on device remain pending.

Questions skipped: the user requested the critique and implementation together and already authorized the work.
