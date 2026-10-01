# Accessibility Audit: ParkApp driver app (frontend)
**Standard:** WCAG 2.1 AA | **Date:** 2026-09-30 | **Method:** code review + computed contrast ratios

> Not covered: real screen reader testing (VoiceOver, NVDA, TalkBack), 200% zoom on a device, and automated axe scan. Code review catches structure and contrast, not how assistive tech actually announces things. Run those before launch.

## Summary
**Issues found:** 13 | **Critical:** 0 | **Major:** 6 | **Minor:** 7 | **Fixed:** 13 | **Open:** 0 (manual testing still pending, see Priority Fixes)

## Findings

### Perceivable
| # | Issue | WCAG | Severity | Status |
|---|-------|------|----------|--------|
| 1 | Focus ring was amber (`#FFB21A`): 1.7:1 on white and canvas | 1.4.11 Non-text contrast | 🟡 Major | ✅ Fixed. Ring is now `signal-700`, 9.35:1 |
| 2 | Input, secondary button, chip and segmented borders used `line` (`#DFE3EC`): 1.29:1 | 1.4.11 | 🟡 Major | ✅ Fixed. New `--color-control` (`#7D88A6`), 3.53:1 on white, 3.30:1 on canvas |
| 3 | Switch "off" track used `line`: 1.2:1 against canvas | 1.4.11 | 🟡 Major | ✅ Fixed. Uses `control` |
| 4 | `success-600` on `success-50` was 4.41:1 at 13px (badges) | 1.4.3 Contrast | 🟢 Minor | ✅ Fixed. `#0F6E40`, 5.60:1 |
| 5 | Star rating used `aria-label` on a plain `<span>`, which screen readers often ignore | 4.1.2 / 1.1.1 | 🟢 Minor | ✅ Fixed. Number is `aria-hidden`, full sentence is `sr-only` |
| 6 | Occupancy bar showed *occupied* share but was named "spots free", and had no readable value | 1.3.1 / 4.1.2 | 🟢 Minor | ✅ Fixed. Bar shows free share, `aria-valuetext="34 / 180"` |

### Operable
| # | Issue | WCAG | Severity | Status |
|---|-------|------|----------|--------|
| 7 | Filter chips were 40px tall, switch 32px, map price pins about 36px | 2.5.5 Target size (AAA in 2.1; 2.5.8 in 2.2) | 🟢 Minor | ✅ Fixed. All now ≥ 44px (switch keeps a 32px visual track inside a 44px hit area) |
| 8 | Route changes did not move focus or update the tab title: keyboard and SR users stayed at the old position on the new screen | 2.4.3 Focus order, 2.4.2 Page titled | 🟡 Major | ✅ Fixed. `AppLayout` focuses `<main>` and sets `document.title` from the `<h1>` |
| 9 | Full lots in the map had only a strikethrough to show "full" | 1.4.1 Use of color, 4.1.2 | 🟢 Minor | ✅ Fixed. Pin `aria-label` now ends with "Lleno / Full" |

### Understandable
| # | Issue | WCAG | Severity | Status |
|---|-------|------|----------|--------|
| 10 | `<html lang>` could stay `es` when the stored language was `en` (listener registered after init) | 3.1.1 Language of page | 🟡 Major | ✅ Fixed. Synced on init and on change |
| 11 | "English" / "Español" labels had no `lang` attribute | 3.1.2 Language of parts | 🟢 Minor | ✅ Fixed. `LanguageSwitch` passes `lang` per option |

### Robust
| # | Issue | WCAG | Severity | Status |
|---|-------|------|----------|--------|
| 12 | Filtering the list changed results silently | 4.1.3 Status messages | 🟡 Major | ✅ Fixed. `role="status"` announces "3 estacionamientos encontrados" |
| 13 | Profile rows (payment methods, add vehicle, help) are buttons with no action | 2.1.1 / 4.1.2 | 🟢 Minor | ✅ Fixed. Rows are now real links: `/profile/payment`, `/profile/vehicles`, and a `mailto:` for help |

## Color Contrast Check (after fixes)
| Element | Foreground | Background | Ratio | Required | Pass |
|---------|-----------|------------|-------|----------|------|
| Body text | ink `#081230` | canvas `#F6F7FA` | 17.20 | 4.5 | ✅ |
| Secondary text | ink-muted `#4A5573` | white | 7.40 | 4.5 | ✅ |
| Placeholder, inactive nav | ink-subtle `#66708F` | white / canvas | 4.91 / 4.58 | 4.5 | ✅ (tight; do not go lighter) |
| Primary button | white | primary `#0F3D91` | 10.02 | 4.5 | ✅ |
| Accent button | ink | accent `#FFB21A` | 10.21 | 4.5 | ✅ |
| Ticket captions | signal-200 `#B3C9F0` | primary | 5.98 | 4.5 | ✅ |
| Warning text | ticket-700 `#8A5600` | ticket-50 | 5.72 | 4.5 | ✅ |
| Success badge | success-600 `#0F6E40` | success-50 | 5.60 | 4.5 | ✅ |
| Error text | danger-600 `#C9302C` | white / danger-50 | 5.33 / 4.66 | 4.5 | ✅ |
| Focus ring | signal-700 | canvas | 9.35 | 3 | ✅ |
| Control borders | control `#7D88A6` | white / canvas | 3.53 / 3.30 | 3 | ✅ |

Rule for the team: amber (`accent`) is a **fill**, never a text or outline color on light backgrounds. Only `ink` text goes on top of it.

## Keyboard Navigation
| Element | Tab | Enter / Space | Escape | Arrows |
|---------|-----|---------------|--------|--------|
| Filter chips | Each chip | Toggle (`aria-pressed`) | — | — |
| Map pins | Each pin | Open lot | — | — |
| Segmented control | One stop per group (native radios) | — | — | Move selection |
| Switch | Yes | Toggle | — | — |
| Bottom nav | Each tab | Go to tab (`aria-current="page"`) | — | — |
| Booking form | Plate, arrival, duration, pay | Enter submits | — | Arrows inside radio groups |

No modals or custom popovers exist yet, so there are no focus traps. If a bottom sheet is added, it needs focus trap, Escape to close, and focus return.

## Screen Reader (expected announcements, to confirm with real testing)
| Element | Announced as | Note |
|---------|-------------|------|
| Map pin | "Reforma 222, $48 / h, button" | Full lots add ", Lleno" |
| Filter chip | "Techado, toggle button, pressed" | |
| Rating | "4.7 de 5" | Star icon hidden |
| Countdown | "Tiempo restante 01:59:30, timer" | `aria-live="off"`, so it does not chatter every second |
| Plate error | "Escribe tu placa para continuar", alert | Input is `aria-invalid` and `aria-describedby` |
| Time added | "Tiempo agregado", status | Polite live region |
| Results | "3 estacionamientos encontrados", status | Polite live region |

## Priority Fixes (remaining)
1. **Test with VoiceOver (iOS) and TalkBack** on the booking flow, focus on the `Segmented` radios and the `role="timer"`.
2. **Check 200% zoom and 320px width** on Explore and Booking. The layout is rem-based and single column, so it should reflow, but it is unverified.
3. **The "Cómo llegar" button opens a new tab** with no warning. Add "(abre en una pestaña nueva)" to its accessible name when the real map provider is connected.
