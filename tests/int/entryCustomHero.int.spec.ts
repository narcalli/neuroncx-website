import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { HeroCustomBlock } from '@/blocks/HeroCustom/Component'
import { heroDesignOf, toCustomHero } from '@/components/sections/entryHeroAdapters'
import type { MicroApp } from '@/payload-types'

/** An entry's own page with the Custom CSS visual hero design. */

const entry = {
  id: 'a1',
  name: 'Payment services',
  slug: 'payment-services',
  summary: 'Collects fees on WhatsApp.',
  heroDesign: 'customCss',
  heroHeading: 'Fees collected on WhatsApp',
  heroSubheading: 'Links, reminders and receipts, without a call.',
  heroChips: [{ label: 'Payment links' }, { label: 'Receipts' }],
  heroSecondaryCta: { label: 'See pricing', link: { type: 'custom', url: '/pricing' } },
  visualHtml: '<div class="card" onclick="steal()">Paid<script>alert(1)</script></div>',
  visualCss: '@import url(https://evil.test/x.css); .card{color:var(--ncx-crimson)}',
  visualAlt: 'A receipt marked paid.',
  aspect: '4/3',
  maxWidth: 520,
} as unknown as MicroApp

const input = { entry, groupName: 'Book and get paid', primary: { label: 'Book a demo', href: '/contact' } }

describe('the design', () => {
  it('is read as Custom CSS visual', () => {
    expect(heroDesignOf({ heroDesign: 'customCss' })).toBe('customCss')
  })

  it("keeps the entry's eyebrow, heading, subheading, chips and buttons, with its visual on the right", () => {
    expect(toCustomHero(input)).toMatchObject({
      blockType: 'heroCustom',
      eyebrow: 'Book and get paid',
      headline: 'Fees collected on WhatsApp',
      subhead: 'Links, reminders and receipts, without a call.',
      chips: [{ label: 'Payment links' }, { label: 'Receipts' }],
      primaryCta: { label: 'Book a demo', type: 'custom', url: '/contact' },
      secondaryCta: { label: 'See pricing', type: 'custom', url: '/pricing' },
      visualPosition: 'right',
      background: 'cloud',
      visualAlt: 'A receipt marked paid.',
      aspect: '4/3',
      maxWidth: 520,
    })
  })

  it('takes the key points as chips when the entry has none', () => {
    const props = toCustomHero({ ...input, entry: { ...entry, heroChips: [], keyPoints: [{ line: 'One' }, { line: 'Two' }] } as any })
    expect(props.chips).toEqual([{ label: 'One' }, { label: 'Two' }])
  })
})

describe('the page', () => {
  const html = renderToStaticMarkup(React.createElement(HeroCustomBlock, { ...toCustomHero(input), leading: 'crumbs' }))

  it('draws the heading as the H1, the chips, both buttons and the bar', () => {
    expect(html).toContain('<h1>Fees collected on WhatsApp</h1>')
    expect(html).toContain('<ul class="hcx-chips"><li>Payment links</li><li>Receipts</li></ul>')
    expect(html).toContain('href="/contact"')
    expect(html).toContain('href="/pricing"')
    expect(html).toContain('crumbs')
  })

  it('sanitises the visual as the page block does: no script, event attribute or outside import', () => {
    expect(html).toContain('Paid')
    expect(html).not.toMatch(/<script|onclick|alert\(1\)|@import|evil\.test/)
  })

  it('styles the chips with brand variables only', () => {
    const sheet = html.slice(html.indexOf('<style>'), html.indexOf('</style>'))
    const chipRules = sheet.split('\n').filter((l) => l.includes('hcx-chips')).join('\n')
    expect(chipRules).toContain('var(--ncx-')
    expect(chipRules).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(/)
  })
})
