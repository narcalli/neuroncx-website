import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { fromMicroApp } from '@/components/cards/adapters/microApp'
import { fromIntegration } from '@/components/cards/adapters/integration'
import { CARD_DESIGN_DEFAULTS, mergeCardDesign } from '@/components/cards/defaults'
import { KeyPointList } from '@/components/cards/KeyPoints'
import { CardDesign } from '@/components/cards/registry'
import { KEY_POINT_DESIGNS, showKeyPointsOf } from '@/components/cards/sectionDesign'
import type { CardItem } from '@/components/cards/types'
import type { Integration, MicroApp } from '@/payload-types'

/** "Show key points": an entry's key points listed under its card's description. */

const h = React.createElement
const render = (el: React.ReactElement) => renderToStaticMarkup(el)
const lines = (html: string) => (html.match(/<li><svg[^]*?<span>([^<]*)<\/span><\/li>/g) || []).map((li) => li.replace(/^.*<span>|<\/span><\/li>$/g, ''))

const item = (over: Partial<CardItem> = {}): CardItem => ({
  id: 'a',
  title: 'Payment chaser',
  text: 'Sends the link and follows up until it is paid.',
  initial: 'P',
  href: '/bot-swarm/payment-chaser',
  keyPoints: ['Sends the payment link', 'Follows up until paid', 'Stops once refunded', 'A fourth line'],
  ...over,
})

describe('the setting', () => {
  it('is off unless saved on, mirroring the CMS default', () => {
    expect(CARD_DESIGN_DEFAULTS.showKeyPoints).toBe(false)
    expect(mergeCardDesign({}).showKeyPoints).toBe(false)
    expect(mergeCardDesign({ showKeyPoints: null }).showKeyPoints).toBe(false)
    expect(mergeCardDesign({ showKeyPoints: true }).showKeyPoints).toBe(true)
  })

  it('on a hub section, follows the switch beside the design in force: the row, else the grouping', () => {
    expect(KEY_POINT_DESIGNS).toEqual(['feature', 'logoCard', 'story'])
    // The row chose a design that shows them: its own switch decides.
    expect(showKeyPointsOf({ cardDesign: 'feature', showKeyPoints: true }, { cardDesign: 'story', showKeyPoints: false })).toBe(true)
    expect(showKeyPointsOf({ cardDesign: 'story', showKeyPoints: false }, { cardDesign: 'feature', showKeyPoints: true })).toBe(false)
    // The row follows the grouping, or chose a design without room for them: the grouping's switch decides.
    expect(showKeyPointsOf({}, { cardDesign: 'logoCard', showKeyPoints: true })).toBe(true)
    expect(showKeyPointsOf({ cardDesign: 'grid', showKeyPoints: true }, { cardDesign: 'feature', showKeyPoints: true })).toBe(true)
    // Neither chose such a design.
    expect(showKeyPointsOf({ cardDesign: 'grid', showKeyPoints: true }, { cardDesign: 'bento', showKeyPoints: true })).toBe(false)
    expect(showKeyPointsOf({}, {})).toBe(false)
  })
})

describe('the entries', () => {
  it("an agent's key points come along in order, empty lines left out", () => {
    const doc = {
      id: 'm1',
      name: 'Payment chaser',
      slug: 'payment-chaser',
      keyPoints: [{ line: 'One' }, { line: '' }, { line: 'Two' }, { line: 'Three' }],
    } as unknown as MicroApp
    expect(fromMicroApp(doc).keyPoints).toEqual(['One', 'Two', 'Three'])
    expect(fromMicroApp({ ...doc, keyPoints: null } as unknown as MicroApp).keyPoints).toEqual([])
  })

  it('an integration has none, so its cards are unaffected', () => {
    const doc = { id: 'i1', name: 'Razorpay', slug: 'razorpay' } as unknown as Integration
    expect(fromIntegration(doc).keyPoints).toBeUndefined()
  })
})

describe('the list', () => {
  it('shows the first 3, each with a tick, 14px under what comes before', () => {
    const html = render(h(KeyPointList, { points: ['A', 'B', 'C', 'D'] }))
    expect(html).toMatch(/^<style>[^]*<\/style><ul class="ncx-keypts" style="margin-top:14px">/)
    expect(lines(html)).toEqual(['A', 'B', 'C'])
    expect(html).toContain('color:#C62828')
    expect(html).toMatch(/font-size:14\.5px;line-height:1\.5;color:#374151/)
    expect(html).toMatch(/\.ncx-keypts\{[^}]*gap:8px/)
    expect(html.match(/<svg[^>]*width="16"[^>]*height="16"/g)).toHaveLength(3)
  })

  it('takes the card gap off the margin, so the space stays 14px', () => {
    expect(render(h(KeyPointList, { points: ['A'], gapAbove: 12 }))).toContain('margin-top:2px')
  })

  it('renders nothing without key points', () => {
    for (const points of [undefined, null, [], ['', '  ']]) expect(render(h(KeyPointList, { points: points }))).toBe('')
  })
})

describe('the card designs', () => {
  for (const design of KEY_POINT_DESIGNS) {
    describe(design, () => {
      it('lists the first 3 key points under the description when the switch is on', () => {
        const html = render(h(CardDesign, { design: design, items: [item()], showKeyPoints: true }))
        expect(lines(html)).toEqual(['Sends the payment link', 'Follows up until paid', 'Stops once refunded'])
        // Under the description or headline.
        const text = design === 'story' ? 'Sends the link and follows up until it is paid.' : 'Sends the link'
        expect(html.indexOf('class="ncx-keypts"')).toBeGreaterThan(html.indexOf(text))
      })

      it('lists nothing with the switch off, or for an entry without key points', () => {
        expect(render(h(CardDesign, { design: design, items: [item()] }))).not.toContain('class="ncx-keypts"')
        expect(render(h(CardDesign, { design: design, items: [item({ keyPoints: [] })], showKeyPoints: true }))).not.toContain('class="ncx-keypts"')
        expect(render(h(CardDesign, { design: design, items: [item({ keyPoints: null })], showKeyPoints: true }))).not.toContain('class="ncx-keypts"')
      })
    })
  }

  it('keeps the link at the foot: after the list on the feature and story cards', () => {
    for (const design of ['feature', 'story'] as const) {
      const html = render(h(CardDesign, { design: design, items: [item({ linkLabel: 'Open the agent' })], showKeyPoints: true }))
      expect(html.lastIndexOf('Open the agent'), design).toBeGreaterThan(html.lastIndexOf('Stops once refunded'))
    }
  })

  it('drops the 3-line cut on the logo card text only while the switch is on', () => {
    expect(render(h(CardDesign, { design: "logoCard", items: [item()], showKeyPoints: true }))).toContain('class="ncx-irel__text is-full"')
    expect(render(h(CardDesign, { design: "logoCard", items: [item()] }))).toContain('class="ncx-irel__text"')
  })

  it('leaves the grid, directory and pill designs alone', () => {
    for (const design of ['grid', 'directory', 'pill'] as const) {
      expect(render(h(CardDesign, { design: design, items: [item()], showKeyPoints: true })), design).not.toContain('class="ncx-keypts"')
    }
  })
})
