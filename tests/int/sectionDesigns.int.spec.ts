import { describe, expect, it } from 'vitest'

import { toBentoCard, toDetailedCard, toSuite2Card, toSuiteProduct } from '@/components/cards/adapters/microApp'
import { bentoSizes } from '@/components/cards/bentoPattern'
import { sectionDesignOf } from '@/components/cards/sectionDesign'
import type { MicroApp } from '@/payload-types'

/**
 * A hub grouping section drawn with one of the site's blocks: which design
 * applies, how the bento cards share the width, and what each agent card
 * shows in each design.
 */

const agent = (extra: Partial<MicroApp> = {}) =>
  ({
    id: 'a1',
    name: 'Payment services',
    slug: 'payment-services',
    status: 'live',
    _status: 'published',
    hasOwnPage: false,
    summary: 'Sends a payment link.',
    result: 'Nobody chases payments.',
    proof: 'Live at a hospital.',
    startsWhen: 'A booking is made.',
    checks: 'Whether the link is paid.',
    acts: 'Sends the link.',
    teamControls: 'Your team sets the discounts.',
    icon: 'card',
    ...extra,
  }) as MicroApp

describe('which design a section draws with', () => {
  it("is the section's own design, which wins over the grouping's", () => {
    expect(sectionDesignOf({ cardDesign: 'bento' }, { cardDesign: 'suite' })).toBe('bento')
    expect(sectionDesignOf({ cardDesign: 'grid' }, { cardDesign: 'suite' })).toBeNull()
  })

  it("is the grouping's section design when the section has none, else the card grid", () => {
    expect(sectionDesignOf({}, { cardDesign: 'detailedSuite' })).toBe('detailedSuite')
    expect(sectionDesignOf({ cardDesign: null }, { cardDesign: 'feature' })).toBeNull()
    expect(sectionDesignOf({}, {})).toBeNull()
  })
})

describe('bento sizes', () => {
  const widths = (n: number, pattern?: string) => bentoSizes(n, pattern).map((s) => Number(s.colSpan))
  const rowsFill = (n: number, pattern?: string) => bentoSizes(n, pattern).filter((s) => s.rowSpan === '1')

  it('even: rows of three, with rows of two instead of a lone card', () => {
    expect(widths(1)).toEqual([12])
    expect(widths(2)).toEqual([6, 6])
    expect(widths(3)).toEqual([4, 4, 4])
    expect(widths(4)).toEqual([6, 6, 6, 6])
    expect(widths(5)).toEqual([4, 4, 4, 6, 6])
    expect(widths(7)).toEqual([4, 4, 4, 6, 6, 6, 6])
    expect(rowsFill(7)).toHaveLength(7)
  })

  it('featured: the first card large with two beside it, then even', () => {
    expect(bentoSizes(5, 'featured')).toEqual([
      { colSpan: '8', rowSpan: '2' },
      { colSpan: '4', rowSpan: '1' },
      { colSpan: '4', rowSpan: '1' },
      { colSpan: '6', rowSpan: '1' },
      { colSpan: '6', rowSpan: '1' },
    ])
    expect(widths(2, 'featured')).toEqual([8, 4])
  })

  it('alternating: wide then narrow, then narrow then wide, an odd last card across the row', () => {
    expect(widths(5, 'alternating')).toEqual([8, 4, 4, 8, 12])
  })

  it('every full row adds up to 12', () => {
    for (const pattern of ['even', 'alternating']) {
      for (let n = 1; n <= 9; n++) expect(widths(n, pattern).reduce((a, b) => a + b, 0) % 12, `${pattern} ${n}`).toBe(0)
    }
  })
})

describe('agent cards', () => {
  it('Product suite, steps: summary and result, steps without team controls, which get their own box, proof as a note', () => {
    const card = toSuiteProduct(agent(), false, 'steps')
    expect(card.cardStyle).toBe('steps')
    expect(card.summary).toBe('Sends a payment link. Nobody chases payments.')
    expect(card.points?.map((p) => p.text)).toEqual(['Starts when: A booking is made.', 'Checks: Whether the link is paid.', 'Sends the link.'])
    expect(card.teamControls).toBe('Your team sets the discounts.')
    expect(card.note).toBe('Live at a hospital.')
  })

  it('Product suite 2: numbered, icon, name, summary, and the Pilot flag as the eyebrow', () => {
    expect(toSuite2Card(agent())).toMatchObject({ title: 'Payment services', icon: 'card', showNumber: true, showEyebrow: false, link: null })
    expect(toSuite2Card(agent({ status: 'pilot' }))).toMatchObject({ tag: 'Pilot', showEyebrow: true })
  })

  it('Detailed product suite: channels as the eyebrow, key points as highlights, icon as watermark', () => {
    const card = toDetailedCard(agent({ channel: ['whatsapp', 'web'], tagline: 'Paid in the chat', keyPoints: [{ line: 'Razorpay links' }] }))
    expect(card).toMatchObject({ eyebrow: 'WhatsApp and Web', tagline: 'Paid in the chat', watermarkIcon: 'card', accentColor: 'crimson', cta: null })
    expect(card.highlights?.map((h) => h.label)).toEqual(['Razorpay links'])
  })

  it('Bento grid: the size it is given, the result on large cards, points only on tall ones', () => {
    const points = { keyPoints: [{ line: 'Razorpay links' }] }
    const small = toBentoCard(agent(points), { colSpan: '4', rowSpan: '1' })
    expect(small).toMatchObject({ colSpan: '4', rowSpan: '1', titleSize: 'regular', body: 'Sends a payment link.', showPoints: false })
    const wide = toBentoCard(agent(points), { colSpan: '12', rowSpan: '1' })
    expect(wide).toMatchObject({ titleSize: 'large', body: 'Sends a payment link. Nobody chases payments.', showPoints: false })
    const tall = toBentoCard(agent(points), { colSpan: '8', rowSpan: '2' })
    expect(tall).toMatchObject({ showPoints: true, listStyle: 'pills' })
    expect(tall.points).toEqual([{ id: undefined, text: 'Razorpay links' }])
  })

  it('Bento grid: a tall card without key points lists the steps instead', () => {
    const tall = toBentoCard(agent(), { colSpan: '8', rowSpan: '2' })
    expect(tall).toMatchObject({ showPoints: true, listStyle: 'bullets' })
    expect(tall.points?.map((p) => p.text)).toEqual(['Starts when: A booking is made.', 'Checks: Whether the link is paid.', 'Sends the link.'])
  })

  it("links to the agent's button in every design when it has no page", () => {
    const withButton = agent({ cta: { label: 'See the flow', link: { type: 'custom', url: '/solutions/pay/' } } } as Partial<MicroApp>)
    expect(toSuite2Card(withButton).link).toEqual({ url: '/solutions/pay/', label: 'See the flow' })
    expect(toDetailedCard(withButton).cta).toEqual({ url: '/solutions/pay/', label: 'See the flow' })
    expect(toBentoCard(withButton, { colSpan: '4', rowSpan: '1' }).link).toEqual({ url: '/solutions/pay/', label: 'See the flow' })
  })
})
