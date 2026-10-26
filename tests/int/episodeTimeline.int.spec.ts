import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { AgenticEpisodeBlock } from '@/blocks/AgenticEpisode/Component'
import { DOT_RADIUS, GAP, MIN_INSET, edgeLabelWidth, middleLabelWidth, timeline } from '@/blocks/AgenticEpisode/geometry'
import type { AgenticEpisodeBlock as Episode } from '@/payload-types'

/** The Episode Timeline's alignment: inset bar, labels that never touch, focus on the point, upright below 760px. */

// Where each label's box runs, for a panel `w` wide: [left, right] in px.
const boxes = (w: number, n: number, neighbourWidths: number[] = []) => {
  const { inset, spacing } = timeline(w, n)
  const p = (i: number) => inset + spacing * i
  return Array.from({ length: n }, (_, i) => {
    if (i === 0) {
      const width = edgeLabelWidth(spacing, n, neighbourWidths[1])
      return [p(0) - DOT_RADIUS, p(0) - DOT_RADIUS + width]
    }
    if (i === n - 1) {
      const width = edgeLabelWidth(spacing, n, neighbourWidths[n - 2])
      return [p(i) + DOT_RADIUS - width, p(i) + DOT_RADIUS]
    }
    const width = neighbourWidths[i] ?? middleLabelWidth(spacing)
    return [p(i) - width / 2, p(i) + width / 2]
  })
}

describe('the bar', () => {
  it('is inset half a label width from each edge, or 60px, whichever is more', () => {
    for (const n of [2, 5, 7, 8]) {
      for (const w of [650, 860, 1066]) {
        const { inset, spacing } = timeline(w, n)
        expect(inset).toBeGreaterThanOrEqual(MIN_INSET)
        expect(inset).toBeCloseTo(Math.max(MIN_INSET, (spacing - GAP) / 2), 6)
        // The points fill the bar: first at the inset, last at the far inset.
        expect(inset * 2 + spacing * (n - 1)).toBeCloseTo(w, 6)
      }
    }
  })

  it('puts every point in the middle of an equal share of the panel when the labels allow', () => {
    const { inset, spacing } = timeline(1066, 5)
    expect(inset).toBeCloseTo((1066 - 48) / 10, 6)
    expect(spacing).toBeCloseTo((1066 - 2 * inset) / 4, 6)
  })
})

describe('the labels', () => {
  it('in the middle are at most the distance between two points less 12px', () => {
    expect(middleLabelWidth(134)).toBe(122)
  })

  it('never touch their neighbours, and stay inside the panel, with 2, 5, 7 and 8 points', () => {
    for (const n of [2, 5, 7, 8]) {
      for (const w of [650, 860, 1066]) {
        const b = boxes(w, n)
        for (let i = 1; i < n; i++) expect(b[i][0] - b[i - 1][1], `${n} points, ${w}px, labels ${i - 1} and ${i}`).toBeGreaterThanOrEqual(GAP - 1e-6)
        expect(b[0][0]).toBeGreaterThanOrEqual(0)
        expect(b[n - 1][1]).toBeLessThanOrEqual(w)
      }
    }
  })

  it('at the ends run wider when the neighbouring label is short, but never wider than a middle label', () => {
    const { spacing } = timeline(1066, 7)
    expect(edgeLabelWidth(spacing, 7)).toBeCloseTo(spacing / 2 + 4, 6)
    expect(edgeLabelWidth(spacing, 7, 40)).toBeGreaterThan(spacing / 2 + 4)
    expect(edgeLabelWidth(spacing, 7, 0)).toBe(middleLabelWidth(spacing))
    // Still clear of a short neighbour.
    const b = boxes(1066, 7, [0, 40])
    expect(b[1][0] - b[0][1]).toBeGreaterThanOrEqual(GAP - 1e-6)
  })

  it('with two points, split the space between them', () => {
    const { spacing } = timeline(1066, 2)
    expect(edgeLabelWidth(spacing, 2)).toBeCloseTo((spacing - GAP) / 2 + DOT_RADIUS, 6)
  })
})

describe('the markup', () => {
  const points = ['Booking', 'Scan done', 'Pharmacy purchase', 'Prescription callback', 'Review visit'].map((label, i) => ({
    id: `p${i}`,
    label,
    caption: `What attaches at ${label}`,
  }))
  const html = renderToStaticMarkup(
    React.createElement(AgenticEpisodeBlock, {
      blockType: 'agenticEpisode',
      heading: 'One episode',
      startLabel: 'Episode open',
      endLabel: 'Episode closes',
      points,
    } as unknown as Episode),
  )

  it('marks the first, middle and last points, and passes the count to the CSS', () => {
    expect(html).toContain('style="--n:5"')
    expect(html.match(/<li class="(first|mid|last)[^"]*" style="--i:(\d)"/g)).toEqual([
      // The first point counts as reached from the start.
      '<li class="first done" style="--i:0"',
      '<li class="mid" style="--i:1"',
      '<li class="mid" style="--i:2"',
      '<li class="mid" style="--i:3"',
      '<li class="last" style="--i:4"',
    ])
  })

  it('puts the start and end labels in the head, to line up over the end points', () => {
    expect(html).toContain('<span class="start">Episode open</span>')
    expect(html).toContain('<span class="end">Episode closes</span>')
    expect(html).toContain('.ncx-epi .head .start{margin-left:calc(var(--inset) - 10px)}')
  })

  it("carries each point's caption, shown beside it below 760px", () => {
    expect(html).toContain('<p class="pcap">What attaches at Prescription callback</p>')
    expect(html).toContain('@media (max-width:759.98px)')
  })

  it('wraps labels to two lines at most, on one top line', () => {
    expect(html).toMatch(/\.ncx-epi \.lbl\{[^}]*-webkit-line-clamp:2/)
    expect(html).toMatch(/\.ncx-epi \.tl li\{pointer-events:none;position:absolute;top:11px;/)
  })

  it("keeps each label's click area to its own button", () => {
    expect(html).toMatch(/\.ncx-epi \.pt\{pointer-events:auto;[^}]*width:fit-content;max-width:100%/)
  })

  it('rings only the point, only for keyboard focus', () => {
    expect(html).toContain('.ncx-epi .pt:focus,.ncx-epi .pt:focus-visible{outline:none}')
    expect(html).toContain('.ncx-epi .pt:focus-visible .dot{outline:2px solid var(--ncx-crimson);outline-offset:4px}')
  })
})
