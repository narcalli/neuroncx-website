import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { ClosingCtaBlock } from '@/blocks/ClosingCTA/Component'

/**
 * Closing CTA (prompt 12 of the motion plan): the server HTML is the plain,
 * settled card. The character wave and the drifting grid only run at level
 * on, in the browser; the buttons stay <Magnetic> either way.
 */
describe('ClosingCTA', () => {
  const base = {
    blockType: 'closingCta',
    heading: 'See the bot swarm run on your own workflow',
    subhead: 'Bring one real workflow and we will show it running.',
    primaryLabel: 'Book a demo',
    primaryLink: '/contact',
    secondaryLabel: 'See pricing',
    secondaryLink: '/pricing',
    tagline: 'CX workflows designed to think like your business',
  }

  it('renders the plain heading and a drifting grid layer behind the card', () => {
    const html = renderToStaticMarkup(React.createElement(ClosingCtaBlock, base))
    expect(html).toContain('<h2>See the bot swarm run on your own workflow</h2>')
    expect(html).toContain('class="grid-bg"')
    expect(html).toMatch(/\.ncx-closing \.grid-bg\{[^}]*background-size:48px 48px/)
  })

  it('keeps both buttons magnetic', () => {
    const html = renderToStaticMarkup(React.createElement(ClosingCtaBlock, base))
    expect(html.match(/<a class="btn primary"/g)?.length).toBe(1)
    expect(html.match(/<a class="btn ghost"/g)?.length).toBe(1)
  })

  it('reads the block motion setting without needing it', () => {
    const html = renderToStaticMarkup(React.createElement(ClosingCtaBlock, { ...base, motion: 'off' }))
    expect(html).toContain('See the bot swarm run on your own workflow')
  })

  it('renders nothing without a heading', () => {
    expect(renderToStaticMarkup(React.createElement(ClosingCtaBlock, { ...base, heading: null }))).toBe('')
  })
})
