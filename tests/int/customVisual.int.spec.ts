import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { CustomVisualBlock } from '@/blocks/CustomVisual/Component'
import { CUSTOM_VISUAL_LAYOUTS, DEFAULT_DIAGRAM_ASPECT, layoutOf } from '@/blocks/CustomVisual/layouts'
import type { CustomVisualBlock as Props } from '@/payload-types'

/**
 * Custom Visual (HTML/CSS): the hub and the real cards on the layout's
 * points, the editor's visual behind them in the sealed box, and the plain
 * grid for layout none.
 */

const card = (title: string) => ({ title, description: `${title} text`, tag: 'Record' })
const block = (extra: Partial<Props> = {}): Props =>
  ({
    blockType: 'customVisual',
    heading: 'How it fits',
    layout: 'hubSpoke3',
    hub: { icon: 'database', label: 'NeuronCx', caption: 'One record' },
    cards: [card('One'), card('Two'), card('Three')],
    visualHtml: '<div class="ring"></div><script>alert(1)</script>',
    visualCss: '.ring{border:1px solid red}@import url(x.css);',
    visualAlt: 'Three spokes around the record',
    aspect: 'auto',
    ...extra,
  }) as Props
const render = (p: Props) => renderToStaticMarkup(React.createElement(CustomVisualBlock, p))
/** The markup without the block's own stylesheet, whose rules name the same classes. */
const html = (p: Props) => render(p).replace(/<style>[\s\S]*?<\/style>/, '')

describe('the anchor table', () => {
  it("matches the CMS Layout guidance word for word (neuroncx-cms src/blocks/CustomVisual/layouts.ts)", () => {
    // The CMS states these points to editors; the visual is drawn to meet them.
    expect(CUSTOM_VISUAL_LAYOUTS.hubSpoke2).toEqual({ hub: [50, 50], spokes: [[15, 50], [85, 50]] })
    expect(CUSTOM_VISUAL_LAYOUTS.hubSpoke3).toEqual({ hub: [50, 50], spokes: [[50, 17], [15, 82], [85, 82]] })
    expect(CUSTOM_VISUAL_LAYOUTS.hubSpoke4).toEqual({ hub: [50, 50], spokes: [[15, 20], [85, 20], [15, 80], [85, 80]] })
    expect(CUSTOM_VISUAL_LAYOUTS.none).toEqual({ hub: null, spokes: [] })
    expect(layoutOf(undefined)).toBe('hubSpoke3')
  })
})

describe('a hub layout', () => {
  const out = html(block())

  it('puts the hub and each card on the layout points', () => {
    expect(out).toMatch(/ncx-customvisual__slot--hub" style="--cv-x:50%;--cv-y:50%"/)
    for (const [x, y] of CUSTOM_VISUAL_LAYOUTS.hubSpoke3.spokes) expect(out).toContain(`style="--cv-x:${x}%;--cv-y:${y}%"`)
    expect(out.match(/class="ncx-customvisual__slot"/g)).toHaveLength(3)
  })

  it('draws the cards with the shared card, on its tokens, in white', () => {
    expect(out).toMatch(/ncx-customvisual__stage [^"]*tokens/)
    expect(out.match(/cardWhite/g)!.length).toBe(4) // three cards and the hub
    expect(out).toContain('Record')
  })

  it('makes the hub from the same white card surface, holding only its icon tile', () => {
    const circle = out.match(/<div class="[^"]*cardWhite[^"]* ncx-customvisual__hub">([\s\S]*?)<\/div><div class="ncx-customvisual__hub-text">/)
    expect(circle).toBeTruthy()
    expect(circle![1]).toMatch(/class="[^"]*icon[^"]*" aria-hidden="true"><svg/)
    expect(circle![1]).not.toContain('NeuronCx')
  })

  it('puts the hub label and caption under the circle, not inside it', () => {
    expect(out).toMatch(/<div class="ncx-customvisual__hub-text"><p class="ncx-customvisual__hub-label">NeuronCx<\/p><p class="ncx-customvisual__hub-caption">One record<\/p><\/div>/)
  })

  it('sizes the circle in fixed pixels, never from the diagram width or its content', () => {
    const sheet = render(block())
    expect(sheet).toContain('.ncx-customvisual .ncx-customvisual__hub{width:96px;height:96px;')
    expect(sheet).not.toMatch(/__hub\{[^}]*aspect-ratio/)
  })

  it("holds the visual's animations behind a rule only a data-anim=hold host triggers", () => {
    expect(out).toContain(':host([data-anim="hold"]) *')
    // The server HTML is never held: the hold is set by the page once it runs.
    expect(out).not.toMatch(/<div class="hcx-visual"[^>]*data-anim/)
  })

  it('puts the cleaned visual in the sealed box, as an overlay behind them', () => {
    expect(out).toMatch(/ncx-customvisual__overlay"><div class="hcx-visual" role="img" aria-label="Three spokes around the record"/)
    expect(out).toContain('shadowrootmode="open"')
    expect(out).toContain('class="ring"')
    expect(out).not.toContain('<script>')
    expect(out).not.toContain('@import')
    // The overlay comes first, so the hub and the cards paint above it.
    expect(out.indexOf('ncx-customvisual__overlay')).toBeLessThan(out.indexOf('ncx-customvisual__slot'))
  })

  it("uses the layout's own shape while Shape is As tall as its content, and the editor's otherwise", () => {
    expect(out).toContain(`--cv-aspect:${DEFAULT_DIAGRAM_ASPECT.hubSpoke3}`)
    expect(html(block({ aspect: '16/9', maxWidth: 900 }))).toMatch(/--cv-aspect:16\/9;max-width:900px/)
  })

  it('hides the overlay and stacks the slots below 860px', () => {
    const sheet = render(block())
    expect(sheet).toMatch(/@media \(max-width:859\.98px\)\{[^@]*\.ncx-customvisual__overlay\{display:none\}/)
    expect(sheet).toMatch(/@media \(max-width:859\.98px\)\{[^@]*\.ncx-customvisual__slot\{position:static;transform:none;width:auto\}/)
  })
})

describe('layout none', () => {
  const out = html(block({ layout: 'none', hub: { label: 'Not shown' } }))

  it('has no hub and no fixed slots: the cards sit in a grid', () => {
    expect(out).not.toContain('Not shown')
    expect(out).not.toContain('ncx-customvisual__slot')
    expect(out).toMatch(/ncx-customvisual__grid [^"]*tokens/)
  })

  it('puts the visual full width under the heading, before the cards', () => {
    expect(out).not.toContain('ncx-customvisual__overlay')
    expect(out.indexOf('ncx-customvisual__frame')).toBeGreaterThan(out.indexOf('How it fits'))
    expect(out.indexOf('ncx-customvisual__frame')).toBeLessThan(out.indexOf('ncx-customvisual__grid'))
  })
})

describe('an empty block', () => {
  it('draws nothing', () => {
    expect(html({ blockType: 'customVisual', layout: 'none' } as Props)).toBe('')
  })
})
