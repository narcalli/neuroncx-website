import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { closingSlot, isClosingCta } from '@/blocks/closingSlot'
import { closedInset, ExpandingCardCtaBlock } from '@/blocks/ExpandingCardCta/Component'
import type { ExpandingCardCtaBlock as Props } from '@/payload-types'

/** Expanding Card CTA: the closed card's size, the server HTML, its scoped CSS and where it is looked up. */

const BASE: Props = {
  blockType: 'expandingCardCta',
  headingLine1: 'Run every conversation',
  headingLine2: 'from one place.',
  description: 'One record for acquisition, engagement and retention.',
  ctaLabel: 'Book a demo',
  ctaUrl: '/contact',
  startShape: 'square',
}

const render = (p: Partial<Props> = {}) => renderToStaticMarkup(React.createElement(ExpandingCardCtaBlock, { ...BASE, ...p }))
/** The HTML without the inline <style>, so attribute checks do not match the CSS text. */
const markup = (p: Partial<Props> = {}) => render(p).replace(/<style>[\s\S]*?<\/style>/, '')

/** The closed card's width and height from an inset string, for a w x h panel. */
const card = (w: number, h: number, shape: Props['startShape']) => {
  const [top, right, bottom, left] = closedInset(w, h, shape).match(/[\d.]+(?=px)/g)!.map(Number)
  return { w: +(w - left - right).toFixed(1), h: +(h - top - bottom).toFixed(1) }
}

describe('the closed card', () => {
  it('is worked out in pixels, rounded 18px, and centred', () => {
    expect(closedInset(1440, 666, 'square')).toMatch(/^inset\([\d.]+px [\d.]+px [\d.]+px [\d.]+px round 18px\)$/)
    const [top, right, bottom, left] = closedInset(1440, 666, 'square').match(/[\d.]+(?=px)/g)!.map(Number)
    expect(top).toBe(bottom)
    expect(left).toBe(right)
  })

  it('stays square at 1440, 1024 and 768 wide', () => {
    for (const [w, h] of [
      [1440, 666],
      [1024, 568],
      [768, 594],
    ]) {
      const c = card(w, h, 'square')
      expect(c.w, `${w}`).toBeCloseTo(c.h, 0)
    }
    // At 1440 x 666 the height limit wins: 666 * 0.52.
    expect(card(1440, 666, 'square').h).toBeCloseTo(666 * 0.52, 0)
  })

  it('is taller than wide as a tall square, and 1.85 times as wide as tall as a wide card', () => {
    const tall = card(1440, 666, 'portrait')
    expect(tall.w / tall.h).toBeCloseTo(0.78, 2)
    const wide = card(1440, 666, 'wide')
    expect(wide.w / wide.h).toBeCloseTo(1.85, 2)
  })

  it('uses the phone size below 700px wide for every shape, and never covers more than 92% by 86%', () => {
    // 390 x 556: side = min(390 * 0.62, 556 * 0.34) = 189.04.
    expect(card(390, 556, 'square').h).toBeCloseTo(189, 0)
    expect(card(390, 556, 'portrait').h).toBeCloseTo(189, 0)
    const wide = card(390, 556, 'wide')
    expect(wide.w).toBeCloseTo(189.04 * 1.85, 0)
    // A wide card on a very wide, short panel stops at 92% of the width.
    expect(card(699, 2000, 'wide').w).toBeLessThanOrEqual(699 * 0.92 + 0.1)
    expect(card(100, 1000, 'square').w).toBeLessThanOrEqual(92)
  })
})

describe('the server HTML', () => {
  it('is the open panel: no closed card, no hidden text, nothing to undo when motion is off', () => {
    const html = markup()
    expect(html).not.toContain('clip-path')
    expect(html).not.toContain('data-state=')
    expect(html).toContain('<section class="ncx-expanding-cta" data-shape="square"')
  })

  it('has one h2 with a clipping wrapper per line, the second only when set', () => {
    expect(render()).toMatch(
      /<h2 class="ecc-heading"><span class="ecc-line"><span class="ecc-line-text">Run every conversation<\/span><\/span><span class="ecc-line"><span class="ecc-line-text">from one place\.<\/span><\/span><\/h2>/,
    )
    expect(render({ headingLine2: null }).match(/class="ecc-line"/g)).toHaveLength(1)
  })

  it('marks the lower half of the panel, from where the closed card centre sits, for the in-view line', () => {
    expect(render()).toContain('<span class="ecc-middle" aria-hidden="true"></span>')
    expect(render()).toContain('.ncx-expanding-cta .ecc-middle{position:absolute;top:50%;bottom:0;left:0;width:100%;pointer-events:none}')
  })

  it('has a real link with a hidden arrow, and a hidden scan line', () => {
    const html = render()
    expect(html).toContain('<a class="ecc-btn" href="/contact"><span class="ecc-btn-label">Book a demo</span><svg class="ecc-btn-arrow"')
    expect(html).toMatch(/<svg class="ecc-btn-arrow"[^>]*aria-hidden="true"/)
    expect(html).toContain('<span class="ecc-scan" aria-hidden="true"></span>')
  })

  it('draws nothing without a first heading line', () => {
    expect(render({ headingLine1: '' })).toBe('')
  })
})

describe('its CSS', () => {
  const css = render().match(/<style>([\s\S]*?)<\/style>/)![1]
  const rules = css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/@keyframes[^{]*\{(?:[^{}]*\{[^}]*\})*[^}]*\}/g, '')
    .replace(/@media[^{]*\{/g, '')
    .split('}')
    .map((r) => r.split('{')[0].trim())
    .filter(Boolean)

  it('scopes every rule to .ncx-expanding-cta, and never touches .ncx-closing', () => {
    for (const selector of rules) for (const part of selector.split(',')) expect(part.trim(), part).toMatch(/^\.ncx-expanding-cta/)
    expect(css).not.toContain('ncx-closing')
  })

  it('leaves teal alone, and takes its easing from the tokens', () => {
    expect(css).not.toContain('--ncx-teal')
    expect(css).toContain('cubic-bezier(.22,1,.36,1)')
    expect(css.replace(/cubic-bezier\(\.22,1,\.36,1\)/g, '')).not.toContain('cubic-bezier')
  })

  it('runs the text in turn when open, and the scan line once at level on', () => {
    expect(css).toContain('[data-state="armed"] .ecc-line-text{transform:translateY(110%)}')
    expect(css).toContain('[data-state="open"] .ecc-line-text{transition:transform 900ms')
    expect(css).toContain('[data-state="open"] .ecc-line + .ecc-line .ecc-line-text{transition-delay:110ms}')
    expect(css).toContain('[data-state="open"] .ecc-desc{transition:opacity 760ms cubic-bezier(.22,1,.36,1) 300ms')
    expect(css).toContain('[data-state="open"] .ecc-btn{transition:opacity 760ms cubic-bezier(.22,1,.36,1) 560ms')
    expect(css).toContain('[data-state="open"][data-scan] .ecc-scan{animation:ecc-scan 1200ms cubic-bezier(.22,1,.36,1) 60ms 1 both}')
    expect(markup()).not.toContain('data-loop')
  })

  it('narrows the panel and widens the button below 880px', () => {
    const phone = css.slice(css.indexOf('@media (max-width:879.98px)'))
    expect(phone).toContain('.ecc-panel{padding:72px 22px;min-height:66vh}')
    expect(phone).toContain('.ecc-btn{width:100%;justify-content:center')
  })
})

describe('as a closing call to action', () => {
  // endsPage (RenderSections.tsx) and IndustryEntryPage.tsx ask isClosingCta.
  it('ends the page wherever the closing CTA block does', () => {
    expect(isClosingCta('expandingCardCta')).toBe(true)
    expect(isClosingCta('closingCta')).toBe(true)
    expect(isClosingCta('agenticClosing')).toBe(false)
    expect(closingSlot([{ blockType: 'content' }, { blockType: 'expandingCardCta' }])).toBe(1)
    expect(closingSlot([{ blockType: 'expandingCardCta', hidden: true }])).toBe(1)
  })
})
