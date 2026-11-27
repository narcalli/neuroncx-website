import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { ComparisonTableBlock } from '@/blocks/ComparisonTable/Component'
import type { ComparisonTableBlock as Props } from '@/payload-types'

/** Comparison table on the page: a real table, a highlighted column, sideways scroll on phones. */

const block: Props = {
  blockType: 'comparisonTable',
  eyebrow: 'How it compares',
  heading: 'NeuronCx and the systems you might use instead',
  intro: 'What each kind of system typically covers.',
  columns: [
    { id: 'c1', label: 'NeuronCx', highlight: true },
    { id: 'c2', label: 'A classic CRM', highlight: false },
    { id: 'c3', label: 'A chatbot tool', highlight: false },
  ],
  rows: [
    { id: 'r1', label: 'Customer record', cells: [{ text: 'One record per person' }, { text: 'Contacts and deals' }, { text: 'Chat history only' }] },
    { id: 'r2', label: 'Follow-up', cells: [{ text: 'Agents carry the job to the end' }, { text: 'Tasks for your team' }] },
  ],
  footnote: 'Typical setups, not named products.',
}
const html = renderToStaticMarkup(React.createElement(ComparisonTableBlock, block))

describe('the table', () => {
  it('is a real table with a caption from the heading', () => {
    expect(html).toContain('<table><caption class="cmp-caption">NeuronCx and the systems you might use instead</caption>')
    expect(html).toMatch(/\.cmp-caption\{position:absolute;width:1px;height:1px;[^}]*clip:rect\(0 0 0 0\)/)
  })

  it('carries the page h1 when it opens a page with no hero, and an h2 otherwise', () => {
    // h2 by default, through SplitHeading like any other section heading.
    expect(html).toContain('<h2')
    expect(html).not.toContain('<h1')

    const asH1 = renderToStaticMarkup(
      React.createElement(ComparisonTableBlock, { ...block, headingLevel: 'h1' } as Props & { headingLevel: 'h1' }),
    )
    expect(asH1).toContain('<h1>NeuronCx and the systems you might use instead</h1>')
    expect(asH1).not.toContain('<h2')
  })

  it('styles the h1 exactly like the h2, so the page heading does not render bare', () => {
    // The stylesheet used to name h2 alone; an h1 then came out unstyled.
    expect(html).toMatch(/\.ncx-cmp h2,\.ncx-cmp h1\{font-family:var\(--font-display\)/)
  })

  it('has column headers and row headers', () => {
    expect(html).toContain('<thead><tr><td class="cmp-corner"></td><th scope="col" class="is-lit">NeuronCx</th><th scope="col">A classic CRM</th><th scope="col">A chatbot tool</th></tr></thead>')
    expect(html).toContain('<tr><th scope="row">Customer record</th><td class="is-lit">One record per person</td><td>Contacts and deals</td><td>Chat history only</td></tr>')
  })

  it('keeps one cell per column, leaving a missing one empty', () => {
    expect(html).toContain('<th scope="row">Follow-up</th><td class="is-lit">Agents carry the job to the end</td><td>Tasks for your team</td><td></td></tr>')
  })

  it('colours the highlighted column: navy header with light text, paper cells; other headers ink on white', () => {
    expect(html).toContain('thead th.is-lit{background:var(--ncx-navy);color:var(--ncx-on-navy)')
    expect(html).toContain('td.is-lit{background:var(--ncx-paper)}')
    expect(html).toMatch(/thead th,\.ncx-cmp th\.cmp-corner\{[^}]*color:var\(--ncx-ink\);background:var\(--ncx-white\)\}/)
  })

  it('sticks the header under the site header above 720px, and drops the scroll container so it can', () => {
    // The box must stop being a scroll container at this width: while it is
    // one it is the scrollport the header sticks to, and it never scrolls,
    // so the header would sit partway down the table over the first rows.
    expect(html).toMatch(/@media \(min-width:720px\)\{[^@]*\.cmp-scroll\{overflow-x:visible\}/)
    // top tracks the site bar rather than assuming it is always there: it
    // hides on the way down the page (Header/Component.client.tsx).
    expect(html).toMatch(
      /@media \(min-width:720px\)\{[^@]*thead th,[^{]*\.cmp-corner\{position:sticky;top:var\(--ncx-nav-offset,64px\);z-index:2\}/,
    )
  })

  it('scrolls sideways below 720px in a labelled, focusable region, with row labels pinned', () => {
    expect(html).toContain('<div class="cmp-scroll" role="region" aria-label="NeuronCx and the systems you might use instead: comparison table" tabindex="0">')
    expect(html).toMatch(/@media \(max-width:719\.98px\)\{[^@]*th\[scope="row"\]\{position:sticky;left:0;/)
  })

  it('puts the footnote under the table in the muted colour', () => {
    expect(html).toMatch(/<\/table><\/div><p class="cmp-note">Typical setups, not named products\.<\/p>/)
    expect(html).toMatch(/\.cmp-note\{[^}]*color:var\(--ncx-muted\)/)
  })

  it('leaves the top-left corner empty with no rowHeading, and makes it a real column header once one is set', () => {
    expect(html).toContain('<thead><tr><td class="cmp-corner"></td>')
    const labelled = renderToStaticMarkup(
      React.createElement(ComparisonTableBlock, { ...block, rowHeading: 'Capability' } as Props & { rowHeading: string }),
    )
    expect(labelled).toContain('<thead><tr><th scope="col" class="cmp-corner">Capability</th>')
  })

  it('highlights nothing when no column is highlighted, and draws nothing without columns or rows', () => {
    const plain = renderToStaticMarkup(
      React.createElement(ComparisonTableBlock, { ...block, columns: block.columns.map((c) => ({ ...c, highlight: false })) }),
    )
    expect(plain).not.toContain('class="is-lit"')
    expect(renderToStaticMarkup(React.createElement(ComparisonTableBlock, { ...block, rows: [] }))).toBe('')
  })

  it('uses brand variables only, no colour codes', () => {
    const sheet = html.slice(html.indexOf('<style>'), html.indexOf('</style>'))
    expect(sheet).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(/)
  })
})
