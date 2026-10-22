import type { CardColumns, CardLastRow } from './types'

/**
 * Card placement on a 24-track grid, so a last row that is not full can be
 * stretched or centred with CSS alone. 24 divides evenly by every row width
 * a design uses (1, 2, 3 or 4 cards) and by every possible remainder, and
 * leaves an even number of spare tracks to centre a short row exactly.
 */
export const TRACKS = 24

/** The grid-column value for card i of n, in rows of `perRow`. */
export const placement = (i: number, n: number, perRow: number, lastRow: CardLastRow): string => {
  const span = TRACKS / perRow
  const rest = n % perRow
  const firstOfLast = n - rest
  if (!rest || i < firstOfLast || lastRow === 'leave') return `span ${span}`
  if (lastRow === 'stretch') return `span ${TRACKS / rest}`
  // Centre: shift the first card of the short row by half the spare tracks.
  return i === firstOfLast ? `${(TRACKS - rest * span) / 2 + 1} / span ${span}` : `span ${span}`
}

/**
 * CSS custom properties that place card i on wide screens (--col-wide, the
 * chosen columns) and on tablets (--col-mid, at most 2 per row). Phones show
 * one card per row, so they need nothing.
 */
export const placementVars = (
  i: number,
  n: number,
  columns: CardColumns,
  lastRow: CardLastRow,
): Record<string, string> => ({
  '--col-wide': placement(i, n, columns, lastRow),
  '--col-mid': placement(i, n, Math.min(columns, 2), lastRow),
})

/**
 * The CSS that reads those properties, for a grid with class `root`. Wide
 * screens use --col-wide, tablets (below 1024px) --col-mid, and phones (below
 * 640px) one card per row.
 */
export const placementCss = (root: string): string => `
  ${root}.has-cols{grid-template-columns:repeat(${TRACKS},minmax(0,1fr))}
  ${root}.has-cols > *{grid-column:var(--col-wide)}
  @media(max-width:1023.98px){${root}.has-cols > *{grid-column:var(--col-mid)}}
  @media(max-width:639.98px){${root}.has-cols > *{grid-column:1 / -1}}
`
