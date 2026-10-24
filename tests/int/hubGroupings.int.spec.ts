import { describe, expect, it } from 'vitest'

import { familyCard } from '@/components/cards/adapters/microApp'
import { groupingCopy, groupingsPlaced } from '@/components/sections/hubGroupingsPlacement'
import type { Hub, MicroApp } from '@/payload-types'

/** A hub's grouping sections: where they go, their copy, and their cards. */

const layout = (...types: string[]) => types.map((blockType, i) => ({ id: `b${i}`, blockType })) as unknown as Hub['layout']

describe('where the grouping sections go', () => {
  it('in the layout when it has the Grouping sections block, else right after the hero', () => {
    expect(groupingsPlaced(layout('hubIntroSection', 'agenticFlowDemo', 'hubGroupingsSection', 'howItWorks2'))).toBe(true)
    expect(groupingsPlaced(layout('hubIntroSection', 'howItWorks2'))).toBe(false)
    expect(groupingsPlaced(null)).toBe(false)
  })
})

describe("a grouping section's copy", () => {
  const group = { name: 'Book and get paid', heading: 'Family heading', intro: 'Family intro', summary: 'Family summary' }

  it("uses the hub row's own, else the grouping's, else the name for the heading", () => {
    expect(groupingCopy({ eyebrow: 'Row eyebrow', heading: 'Row heading', intro: 'Row intro' }, group)).toEqual({
      eyebrow: 'Row eyebrow',
      heading: 'Row heading',
      intro: 'Row intro',
    })
    expect(groupingCopy({}, group)).toEqual({ eyebrow: 'Book and get paid', heading: 'Family heading', intro: 'Family intro' })
    expect(groupingCopy({}, { name: 'Book and get paid', summary: 'Family summary' })).toEqual({
      eyebrow: 'Book and get paid',
      heading: 'Book and get paid',
      intro: 'Family summary',
    })
  })
})

describe('an agent card in its family section', () => {
  const doc = {
    id: 'm1',
    name: 'Payment services',
    slug: 'payment-services',
    tagline: 'The old card line',
    summary: 'Sends a Razorpay payment link in the WhatsApp chat.',
    keyPoints: [{ line: 'One' }, { line: 'Two' }, { line: 'Three' }],
    family: { id: 'f1', name: 'Book and get paid' },
    status: 'live',
  } as unknown as MicroApp

  it('shows the name, the summary and the key points, with no family pill', () => {
    const card = familyCard(doc)
    expect(card).toMatchObject({ title: 'Payment services', tagline: null, text: doc.summary, badge: null, keyPoints: ['One', 'Two', 'Three'] })
  })

  it('falls back to the tagline when there is no summary', () => {
    expect(familyCard({ ...doc, summary: null } as unknown as MicroApp).text).toBe('The old card line')
  })
})
