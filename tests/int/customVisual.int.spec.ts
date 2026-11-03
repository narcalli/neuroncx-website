import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { CustomVisualBlock } from '@/blocks/CustomVisual/Component'
import type { CustomVisualBlock as Props } from '@/payload-types'

/**
 * Custom Visual (HTML/CSS): an optional heading, then the editor's visual
 * full width under it, in the sealed box. Nothing else is drawn.
 */

const block = (extra: Partial<Props> = {}): Props =>
  ({
    blockType: 'customVisual',
    heading: 'How it fits',
    visualHtml: '<div class="ring"></div><script>alert(1)</script>',
    visualCss: '.ring{border:1px solid red}@import url(x.css);',
    visualAlt: 'A ring',
    aspect: 'auto',
    ...extra,
  }) as Props
const render = (p: Props) => renderToStaticMarkup(React.createElement(CustomVisualBlock, p))
/** The markup without the block's own stylesheet, whose rules name the same classes. */
const html = (p: Props) => render(p).replace(/<style>[\s\S]*?<\/style>/, '')

describe('a visual', () => {
  const out = html(block())

  it('puts the cleaned visual in the sealed box, full width under the heading', () => {
    expect(out).toMatch(/ncx-customvisual__frame"><div class="hcx-visual" role="img" aria-label="A ring"/)
    expect(out).toContain('shadowrootmode="open"')
    expect(out).toContain('class="ring"')
    expect(out).not.toContain('<script>')
    expect(out).not.toContain('@import')
    expect(out.indexOf('ncx-customvisual__frame')).toBeGreaterThan(out.indexOf('How it fits'))
  })

  it('draws nothing of its own besides the heading and the visual', () => {
    expect(out).not.toMatch(/__stage|__slot|__hub|__grid|__overlay/)
  })

  it("holds the visual's animations behind a rule only a data-anim=hold host triggers", () => {
    expect(out).toContain(':host([data-anim="hold"]) *')
    // The server HTML is never held: the hold is set by the page once it runs.
    expect(out).not.toMatch(/<div class="hcx-visual"[^>]*data-anim/)
  })

  it("uses the editor's Shape and widest size, and no fixed shape when Shape is As tall as its content", () => {
    expect(html(block({ aspect: '16/9', maxWidth: 900 }))).toMatch(/--cv-aspect:16\/9;max-width:900px/)
    expect(out).not.toContain('--cv-aspect')
  })

  it('lets the visual grow past its Shape below 860px, keeping the Shape as its least height', () => {
    expect(render(block())).toMatch(
      /@media \(max-width:859\.98px\)\{[\s\S]*\.ncx-customvisual__frame > \.hcx-visual\{height:auto;min-height:100%\}/,
    )
  })
})

describe('a block with no eyebrow, heading or intro', () => {
  it('draws nothing for them, and the visual comes first', () => {
    const bare = html(block({ eyebrow: null, heading: null, intro: null }))
    expect(bare).not.toMatch(/<h2|ncx-customvisual__eyebrow"|ncx-customvisual__intro"/)
    expect(bare).toMatch(/<div class="ncx-container"><div class="ncx-customvisual__frame"/)
  })

  it('drops the gap meant to sit under a heading', () => {
    expect(render(block())).toContain('.ncx-customvisual .ncx-container > :first-child{margin-top:0}')
  })
})

describe('a heading with no visual', () => {
  it('draws the heading only', () => {
    const out = html(block({ visualHtml: null }))
    expect(out).toContain('How it fits')
    expect(out).not.toContain('ncx-customvisual__frame')
  })
})

describe('an empty block', () => {
  it('draws nothing', () => {
    expect(html({ blockType: 'customVisual' } as Props)).toBe('')
  })
})
