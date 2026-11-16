# Animation and Save-action surface pass

Scope: all current motion paths in Peramax. Source inspection, regression tests and production build; no browser rendering or frame-rate measurements. The environment reports remote-desktop capability, but no browser, CUA, NodeREPL or preview-control tool was exposed after discovery. No browser/server was installed or started.

## Save expense blur

The previous gradient covered the frosted layer with nearly opaque paper and exposed only a small transparent edge. Its masked pseudo-element also sat at negative z-index in an isolated action bar. The new action layer uses a nonnegative stack, with buttons above it, a 36px upper fade, 16px backdrop blur and a more translucent tint spanning the sheet. The button text itself stays sharp.

Blur is visible where form content scrolls behind the sticky actions; a flat paper background has little detail to blur. More → Disable blur effects and the system's reduced-transparency preference deliberately disable it. Disabling blur retains a paper gradient; older browsers without backdrop-filter keep the tinted gradient fallback.

## Motion inventory

| Motion path                     | Review/result                                                                                                              |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Main navigation                 | Local 160ms fade/scale, no shared highlight travelling through Add                                                         |
| Day/week/month picker           | Local three-option shared indicator, 200ms deceleration                                                                    |
| Screen changes                  | Short 160ms opacity transition; no page-wide travel                                                                        |
| Category/amount/control presses | Brief color/press feedback; CSS press travel disabled by both app/system reduced motion                                    |
| Sheet entrance                  | Native dialog entrance 180ms; content opacity 160ms                                                                        |
| Sheet X/Escape/backdrop exit    | 180ms exit captures the currently rendered position before cancelling interrupted motion                                   |
| Sheet save/programmatic exit    | 140ms exit retains mounted fields until close; remounts fresh on next opening                                              |
| Handle drag                     | Direct gesture response; 80px threshold; short/cancelled drags snap back in 180ms; a second drag cancels previous snapback |
| Discard confirmation            | Keeps edited values mounted; explicit Keep editing / Discard; return-focus behavior preserved                              |
| Scroll morph                    | RequestAnimationFrame-batched updates, stable text geometry, scale and corner changes, desktop and reduced-motion fallback |
| Allowance/daily/weekly tracks   | Transform scaleX, full-width stable geometry, 280ms deceleration                                                           |
| Savings track                   | Same transform and timing as other progress indicators; ARIA values remain based on exact amounts                          |
| Insights bars/breakdown         | Transform scaleY/scaleX; labels rendered outside animated bars so type does not scale                                      |
| Spending heads-up               | Bounded 240ms height/opacity collapse to avoid abrupt layout change                                                        |
| Activity filter panel           | Bounded 200ms height/opacity transition; Done/Escape focus restoration and rapid reuse retained                            |
| My plan guidance                | Three short expanding rings plus hint; outside click/Escape/timeout dismissal; static reduced-motion alternative           |
| Toasts                          | Explicit 160ms entrance/exit rather than default spring entrance and instant removal                                       |
| Update popup                    | Bounded CSS entrance; update activation remains user-controlled and blocked during forms                                   |
| Pointer glow                    | Mouse-only RAF updates; hidden on touch, reduced motion or disabled blur; listeners cleaned up                             |

## Regression coverage

Existing expense, plan, savings, warning, filter, PWA, scroll-morph and blur-preference tests remain. Added explicit programmatic sheet-close and interrupted snapback tests. A stale plan-form regression introduced while retaining the exit content was caught by the tests and fixed by resetting the form session on opening rather than closing.

## Remaining visual checks

Actual Android/iOS scroll/keyboard behavior, Save gradient appearance with content behind it, backdrop paint order, long-drag interruption, rapid tab/filter/period changes, and low-end device frame pacing still need on-device verification. Passing jsdom tests does not prove those visual properties. No claim of complete visual smoothness is made.
