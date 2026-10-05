# Hero — Workforce Grid

Server component at `Component.tsx`. Renders the headline, subhead and button
as real text in the initial HTML — only the entrance trigger is client-side,
using the same generic `Animator` component from `HeroFullBackground/Animator.tsx`
(adds an `.in` class once the block scrolls into view; content is fully visible
without it, in case JS never runs).

## The theme system

Everything theme-dependent is a CSS custom property, scoped under
`.ncx-hwg[data-theme="..."]`, set from the CMS's `theme` field via a
`data-theme` attribute on the section. There is one stylesheet, not three —
switching themes never swaps which CSS loads, only which values apply. The
three palettes (`dark`, `red`, `white`) are ported from the reference file
exactly, including that each theme changes the *card style*, not just the
colours: bordered cards on dark, translucent white cards on red, shadowed
white cards on white.

## The scrolling grid

- Cards are split round-robin across 2–4 columns (the `columns` field),
  server-side, in the order they were entered.
- Each column's card list is rendered **twice** in the DOM (the real cards,
  then an identical, `aria-hidden` + `tabindex="-1"` copy) so a pure CSS
  `translateY(-50%)` loop has no visible seam. No JS drives the scroll.
- Columns alternate direction (`up`, `down`, `up`, `down`), and each has a
  slightly different base duration (34s/29s/38s/26s) so they never look
  mechanically synced. The `speed` field divides all of them by the same
  multiplier (slow ×1, medium ×1.7, fast ×2.6).
- `:hover` and `:focus-within` pause just that column's animation — a
  keyboard user tabbing onto a card stops it the same as a mouse hovering it.
- The duplicated copy is excluded from the accessibility tree and tab order.
  It exists purely so the CSS loop can wrap seamlessly; without hiding it, a
  screen reader or keyboard user would hit the same handful of cards twice
  per column with no indication why. This is the one deliberate deviation
  from the raw reference file, made for accessibility.
- `prefers-reduced-motion: reduce` turns the scroll off entirely (cards render
  as a static list) and skips the entrance animation too.
- Below 980px: always 2 columns, regardless of the `columns` field. Below
  640px: a single horizontal, swipeable row per column (scroll-snap), no fade
  mask, animation off.

## Contrast

Verified for real, not just by eye: computed the actual on-screen colours
(compositing the red theme's translucent white cards over the red page
background, since the nominal CSS values alone are misleading there) and
checked WCAG contrast for card title and description text in all three
themes. All pass AA with real margin — the tightest is the white theme's
description text at 4.85:1 against a 4.5:1 requirement.

## Known gap — not fixed here

The site's persistent header stays dark navy regardless of this block's
theme. On the White theme this leaves a visible hard seam directly under the
header. This is a deliberate, flagged gap, not an oversight — making the
header theme-aware touches every page on the site, not just this block, so
it's left as a separate decision rather than changed quietly as a side effect
of this task.
