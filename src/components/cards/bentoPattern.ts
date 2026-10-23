import type { BentoGridColSpan, BentoGridRowSpan } from '@/components/blocks/BentoGrid/types'

/**
 * Bento sizes for a list of cards whose sizes nobody set, such as a hub
 * grouping section in the Bento grid design (its "Bento sizes" option).
 *
 * - even: rows of three, with rows of two where three would leave one card
 *   alone (4 cards make 2 + 2, 5 make 3 + 2, 7 make 3 + 2 + 2)
 * - featured: the first card large, two cards stacked beside it, then even
 * - alternating: rows of two, wide then narrow, then narrow then wide; an
 *   odd last card takes the whole row
 */
export type BentoPattern = 'even' | 'featured' | 'alternating'

export type BentoSize = { colSpan: BentoGridColSpan; rowSpan: BentoGridRowSpan }

const ROW_WIDTH: Record<number, BentoGridColSpan> = { 1: '12', 2: '6', 3: '4' }

/** Cards per row for `n` cards: threes, with twos instead of a lone card. */
const evenRows = (n: number): number[] => {
  if (n <= 0) return []
  if (n <= 3) return [n]
  const rows: number[] = []
  let left = n
  while (left > 0) {
    // 4 is 2 + 2, not 3 + 1.
    const take = left === 4 ? 2 : Math.min(3, left)
    rows.push(take)
    left -= take
  }
  return rows
}

const even = (n: number): BentoSize[] =>
  evenRows(n).flatMap((count) => Array.from({ length: count }, () => ({ colSpan: ROW_WIDTH[count], rowSpan: '1' as const })))

export const bentoSizes = (n: number, pattern: BentoPattern | string | null | undefined = 'even'): BentoSize[] => {
  if (n <= 0) return []
  if (pattern === 'featured') {
    if (n === 1) return [{ colSpan: '12', rowSpan: '2' }]
    if (n === 2) return [{ colSpan: '8', rowSpan: '1' }, { colSpan: '4', rowSpan: '1' }]
    return [
      { colSpan: '8', rowSpan: '2' },
      { colSpan: '4', rowSpan: '1' },
      { colSpan: '4', rowSpan: '1' },
      ...even(n - 3),
    ]
  }
  if (pattern === 'alternating') {
    return Array.from({ length: n }, (_, i): BentoSize => {
      if (i === n - 1 && n % 2 === 1) return { colSpan: '12', rowSpan: '1' }
      const wideFirst = Math.floor(i / 2) % 2 === 0
      const first = i % 2 === 0
      return { colSpan: first === wideFirst ? '8' : '4', rowSpan: '1' }
    })
  }
  return even(n)
}
