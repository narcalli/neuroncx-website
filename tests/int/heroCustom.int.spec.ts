import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { HeroCustomBlock } from '@/blocks/HeroCustom/Component'
import { safeVisualCss, safeVisualHtml } from '@/blocks/HeroCustom/safety'
import { visualMarkup } from '@/blocks/HeroCustom/ShadowVisual'
import type { HeroCustomBlock as Props } from '@/payload-types'

/** Hero (custom CSS): the fixed hero, and the visual in its sealed box. */

const render = (p: Partial<Props>) =>
  renderToStaticMarkup(React.createElement(HeroCustomBlock, { blockType: 'heroCustom', headline: 'One record per customer', ...p } as Props))

describe('the hero', () => {
  it('draws the eyebrow, the headline as the H1, the subhead and the buttons', () => {
    const html = render({
      eyebrow: 'Bot swarm',
      subhead: 'Every agent works on the same record.',
      primaryCta: { type: 'custom', url: '/contact', label: 'Book a demo' },
      secondaryCta: { type: 'custom', url: '', label: 'No address' },
    })
    expect(html).toContain('<p class="hcx-eyebrow">Bot swarm</p><h1>One record per customer</h1>')
    expect(html).toContain('<a class="hcx-btn hcx-btn--primary" href="/contact">Book a demo</a>')
    // A button with no address is left out.
    expect(html).not.toContain('No address')
  })

  it('carries the layout choices for the CSS, with the defaults', () => {
    expect(render({})).toMatch(/<section class="ncx-hcx" data-pos="right" data-split="50" data-height="natural" data-phone="below" data-bg="cloud">/)
    const html = render({ visualPosition: 'left', split: '40', height: 'tall', phoneVisual: 'hide', background: 'navy' })
    expect(html).toMatch(/data-pos="left" data-split="40" data-height="tall" data-phone="hide" data-bg="navy" data-nav="dark"/)
  })

  it('draws no visual area without HTML', () => {
    expect(render({ visualCss: '.a{}' })).not.toContain('class="hcx-visual"')
  })
})

describe('the visual', () => {
  const html = render({
    visualHtml: '<div class="hub">Customer record</div>',
    visualCss: '.hub{color:var(--ncx-crimson)}',
    visualAlt: 'Five agents around the customer record',
    aspect: '4/3',
    maxWidth: 560,
  })

  it('is in the page HTML inside a declarative shadow root, so search engines read its text', () => {
    expect(html).toContain('<div class="hcx-visual" role="img" aria-label="Five agents around the customer record"><template shadowrootmode="open"><style>')
    expect(html).toContain('<div class="hub">Customer record</div></template></div>')
  })

  it('sits in a frame with the chosen shape and widest size', () => {
    expect(html).toContain('<div class="hcx-frame" style="aspect-ratio:4/3;max-width:560px">')
  })

  it('is decoration, hidden from screen readers, when it has no description', () => {
    expect(render({ visualHtml: '<i></i>' })).toContain('<div class="hcx-visual" aria-hidden="true">')
  })

  it('goes behind the text when placed as the background', () => {
    const bg = render({ visualHtml: '<i></i>', visualPosition: 'background' })
    expect(bg).toMatch(/<div class="hcx-bg"><div class="hcx-visual"/)
    expect(bg).not.toContain('class="hcx-frame"')
  })

  it("starts from a sealed, clipped box, then the visual's CSS, then the reduced-motion rule", () => {
    const m = visualMarkup('<p>x</p>', '.a{color:red}')
    expect(m.indexOf(':host{display:block;position:relative;width:100%;height:100%;overflow:hidden;contain:paint;isolation:isolate;')).toBeGreaterThan(0)
    expect(m.indexOf('.a{color:red}')).toBeGreaterThan(m.indexOf(':host{'))
    expect(m.indexOf('@media (prefers-reduced-motion:reduce)')).toBeGreaterThan(m.indexOf('.a{color:red}'))
    expect(m).toContain('container-type:inline-size;container-name:visual')
    expect(m.endsWith('</style><p>x</p>')).toBe(true)
  })
})

describe('the safety pass before drawing', () => {
  it('removes code that runs, and markup that could leave the box', () => {
    const out = safeVisualHtml(
      '<div onclick="x()">a</div><script>alert(1)</script><a href="javascript:alert(1)">b</a></template><iframe src="//x"></iframe><style>p{}</style>',
    )
    expect(out).toBe('<div>a</div><a href="alert(1)">b</a>')
  })

  it('keeps plain HTML as it is', () => {
    const plain = '<div class="hub"><svg viewBox="0 0 10 10"><circle r="4"></circle></svg><span>Customer record</span></div>'
    expect(safeVisualHtml(plain)).toBe(plain)
  })

  it('removes @import and HTML from the CSS', () => {
    expect(safeVisualCss('@import url(x.css);.a{color:red}</style><script>')).toBe('.a{color:red}')
  })
})
