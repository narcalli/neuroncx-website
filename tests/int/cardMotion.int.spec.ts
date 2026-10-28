import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { CardMotion } from '@/components/cards/CardMotion'

/* eslint-disable react/no-children-prop -- CardMotion's `children` is a
   named prop (not a plain FC), so createElement needs it in the props
   object for the types to line up; this is a .ts file, not .tsx, so plain
   JSX children are not an option here. */

/**
 * The one wrapper every card design puts around a card (prompt 8 of the
 * motion plan): the server HTML is the plain, settled card, since the
 * entrance and the hover only run once the page has mounted.
 */
describe('CardMotion', () => {
  it('renders the card as given, with nothing hidden before any script runs', () => {
    const html = renderToStaticMarkup(
      React.createElement(CardMotion, { index: 2, children: React.createElement('a', { href: '/x' }, 'A card') }),
    )
    // The card itself, not TiltCard's own always-present (and already
    // invisible) hover light, which is a separate, decorative element.
    expect(html).toContain('<a href="/x">A card</a>')
    expect(html).not.toContain('display:none')
  })

  it('carries its class for the entrance and the hover ring', () => {
    const html = renderToStaticMarkup(React.createElement(CardMotion, { children: 'x' }))
    expect(html).toContain('class="ncx-card-motion"')
  })

  it('marks itself still, with no tilt, when asked for none', () => {
    const html = renderToStaticMarkup(React.createElement(CardMotion, { tilt: false, children: 'x' }))
    expect(html).toContain('class="ncx-card-motion is-still"')
  })

  it('still wraps a tilting card in TiltCard, by default', () => {
    const html = renderToStaticMarkup(
      React.createElement(CardMotion, { children: React.createElement('span', null, 'x') }),
    )
    // TiltCard's own div, carrying the spring transform values as inline style.
    expect(html).toMatch(/<div style="[^"]*position:relative[^"]*"><span>x<\/span>/)
  })
})
