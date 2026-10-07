# Hero — Workforce Grid

Server component at `Component.tsx`. Renders the headline, subhead and button
as real text in the initial HTML — only the entrance trigger is client-side,
using the same generic `Animator` component from `HeroFullBackground/Animator.tsx`
(adds an `.in` class once the block scrolls into view; content is fully visible
without it, in case JS never runs).

## Colours

One palette, declared as custom properties on `.ncx-hwg` and fed entirely from
the `--ncx-*` tokens. The three themes this block used to carry (`dark`, `red`,
`white`), the `data-theme` attribute that selected between them and the CMS
`theme` field behind it have all been removed: the site is light only, so two
of the three were unreachable and the field saved a value that changed nothing.

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

Card title and description text were checked against the card surface for the
single remaining palette; both clear AA with margin.
