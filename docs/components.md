# ParkApp component reference

Stack: React 19, TypeScript, Tailwind v4. Tokens live in `frontend/src/index.css` (`@theme`). Use semantic utilities (`bg-primary`, `text-ink-muted`, `ring-control`), never raw hex.
UI primitives: `frontend/src/components/ui/`. Domain components: `frontend/src/components/`.

## Tokens

| Group | Tokens |
|-------|--------|
| Brand | `signal-50…900` (primary is `signal-700` `#0F3D91`) |
| Accent | `ticket-50/200/400/500/700` (accent is `ticket-400` `#FFB21A`) |
| Neutral | `ink`, `ink-muted`, `ink-subtle`, `line` (dividers), `control` (control borders), `canvas`, `surface` |
| Semantic | `success-50/600`, `danger-50/600` |
| Roles | `primary`, `primary-hover`, `primary-soft`, `accent`, `accent-hover` |
| Type | Display: Bricolage Grotesque. UI and body: Figtree. Scale: `caption` 13, `body` 16, `title` 20, `headline` 28, `display` 40 |
| Shape | `rounded-control` 12px (inputs, buttons), `rounded-surface` 20px (cards, sheets), `rounded-full` (chips, badges, pins) |
| Size | `h-touch` 52px (primary controls), 44px minimum for everything tappable |
| Elevation | `shadow-raised`, `shadow-sheet` |
| Motion | `ease-out-quint`, `animate-sheet-in`, `animate-pulse-ring`. All disabled under `prefers-reduced-motion` |

Rules: `line` is decoration (dividers, card outlines). Anything users must *find* (input edge, switch track, chip edge) uses `control` (3:1). Amber is a fill, never text.

---

## Button
Main action. One `accent` button per screen at most.

| Variant | Use when |
|---------|----------|
| `primary` | Main action on a screen with no payment (navigate, view session) |
| `accent` | The action that commits: reserve, pay |
| `secondary` | Supporting action, sits next to a primary |
| `ghost` | Low-emphasis, inline |

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'accent' \| 'secondary' \| 'ghost'` | `primary` | Visual style |
| `size` | `'md' \| 'lg'` | `lg` | 44px / 52px tall |
| `loading` | `boolean` | `false` | Shows spinner, disables, sets `aria-busy` |
| `block` | `boolean` | `false` | Full width |
| …`ButtonHTMLAttributes` | | | `type` defaults to `button` |

States: hover darkens; active darkens further; disabled uses `line` fill with `ink-subtle` text (exempt from contrast); loading keeps width, prepends spinner. Focus: 3px `signal-700` outline, 2px offset.
A11y: native `<button>`; Enter and Space activate; disabled and loading are not focusable or clickable.

| ✅ Do | ❌ Don't |
|------|---------|
| Label with the result: "Pagar y reservar · $104" | "Enviar", "Aceptar" |
| Keep the same verb across the flow | Two accent buttons on one screen |

```tsx
<Button variant="accent" block loading={busy}>{t('booking.confirm')}</Button>
```

## Input
Labelled text field with inline error.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | required | Always rendered; use `hideLabel` to keep it screen-reader only |
| `hideLabel` | `boolean` | `false` | Visually hides the label |
| `error` | `string` | | Shows message, red 2px border, `aria-invalid`, `role="alert"` |
| `icon` | `ReactNode` | | Leading icon (decorative) |
| …`InputHTMLAttributes` | | | |

States: default (`control` border), focus (2px `primary` ring), error (2px `danger-600` ring plus message; color is never the only signal), disabled (native).
A11y: `label[for]`, `aria-describedby` points to the error. Error says what to do, not just what failed.

```tsx
<Input label={t('booking.plate')} value={plate} onChange={…} error={error} />
```

## Chip
Toggle filter. `aria-pressed` carries state. 44px tall.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `selected` | `boolean` | `false` | Pressed state: `ink` fill, white text |

Use in a `role="group"` with an `aria-label`. Announce the effect of toggling with a status region (see Explore).

## Badge
Short status label. Text is always present, color only reinforces.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `tone` | `'neutral' \| 'success' \| 'danger' \| 'accent' \| 'primary'` | `neutral` | `success` available, `accent` few left, `danger` full |
| `icon` | `ReactNode` | | Decorative leading icon |

## Segmented
Single choice among 2–4 short options (arrival, duration, language). Built on native radios in a `fieldset`.

| Prop | Type | Description |
|------|------|-------------|
| `label` | `string` | Legend (required) |
| `hideLabel` | `boolean` | Screen-reader only legend |
| `options` | `{ value; label; lang? }[]` | `lang` marks labels in another language |
| `value` / `onChange` | `T` / `(v: T) => void` | Controlled |

A11y: one Tab stop for the group, arrow keys change selection, SR announces "radio, 2 of 4". Do not use for 5+ options or long labels.

## Switch
On/off setting that applies immediately. `role="switch"`, `aria-checked`, required `label`. 44px hit area, 32px visual track.

## PSign
Brand mark (the parking road sign). Decorative by default; pass `label` to make it an image with a name.

## EmptyState
Explains an empty or failed result and offers the next step.

| Prop | Type | Description |
|------|------|-------------|
| `icon` | `ReactNode` | 24px icon in a soft circle |
| `title` | `string` | What is missing |
| `body` | `string` | How to fix it, max about 32 characters per line |
| `action` | `ReactNode` | One button or link |

Copy rule: state the situation plus the way out. No apologies.

## TopBar
Sticky screen header. Renders the screen's single `<h1>`.

| Prop | Type | Description |
|------|------|-------------|
| `title` | `string` | Becomes the `<h1>` |
| `back` | `boolean` | Shows a back button (`aria-label` "Volver") |
| `onBack` | `() => void` | Overrides `navigate(-1)` |
| `trailing` | `ReactNode` | Right slot (for example a `Badge`) |

## BottomNav
Four tabs: Explorar, Mi lugar, Historial, Perfil. `<nav aria-label>`, `NavLink` sets `aria-current="page"`. Active tab changes color **and** icon weight. Only shown on the four root routes (see `AppLayout`).

## LanguageSwitch
`Segmented` wired to `i18n.changeLanguage`. `<html lang>` follows. Adding a language: add `xx.json`, add the code to `languages` in `src/i18n/index.ts`, add its name to `names`.

---

## Domain components

| Component | Purpose | Key props | A11y notes |
|-----------|---------|-----------|------------|
| `LotCard` | Lot summary in the list: name, walk time, price, availability, features | `lot: Lot` | Whole card is one link. Rating is read as "4.7 de 5" |
| `LotMap` | Stylised map with price pins | `lots: Lot[]` | Pins are buttons named "Lot, price, Lleno?". Group is labelled. Placeholder until a real map is connected |
| `LotFeatures` | Covered, EV, attended icons with text | `features: LotFeature[]` | Icons decorative, text always visible |
| `TicketStub` | The brand object: entry and exit times, plate, level and spot, access code | `session`, `lot` | `<article>` named by lot. Stripes are `aria-hidden`; the code is printed as text |
| `AppLayout` | Page shell. Focuses `<main>` and sets the tab title on route change | | Required for keyboard and SR users in this SPA |

## Patterns

**Form (Booking):** one `Input`, two `Segmented`, summary `dl`, one `accent` `Button`. Validate on submit, focus stays put, error uses `role="alert"`.
**Status feedback:** inline `role="status"` text (see Spot "Tiempo agregado", Explore result count). No toasts yet.
**Empty state:** always `EmptyState` with a next action.

## Known gaps
- No modal or bottom sheet component yet. When added: focus trap, Escape, return focus, `aria-modal`.
- No dark theme. Tokens are structured so a `dark` set can override the semantic roles.
- Saved vehicles live in `localStorage` on the device (`src/lib/vehicles.ts`); the first one is the default and pre-fills the plate in Booking. Payment methods shows one fixed demo card.
- Adding or removing payment methods is not built.
