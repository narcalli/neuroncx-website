import { describe, expect, it } from 'vitest'

import { toSuiteProduct } from '@/components/cards/adapters/microApp'
import type { MicroApp } from '@/payload-types'

/**
 * A bot swarm agent as a Product suite card: the steps as pills in Panel
 * order, labelled where the text leaves out the verb, and the summary,
 * result and proof as one paragraph.
 */

const agent = (extra: Partial<MicroApp> = {}) =>
  ({ id: 'a1', name: 'Appointment assistance', slug: 'appointment-assistance', status: 'live', _status: 'published', hasOwnPage: false, ...extra }) as MicroApp

describe('Product suite card', () => {
  it('lists the steps in Panel order, labelled where the text leaves out the verb', () => {
    const card = toSuiteProduct(
      agent({
        records: 'The booking on the customer record.',
        acts: 'Books the appointment.',
        startsWhen: 'A customer taps Book.',
        checks: 'Your open slots.',
        teamControls: 'Your team sets the slots.',
        handsOver: '',
      }),
    )
    expect(card.points?.map((p) => p.text)).toEqual([
      'Starts when: A customer taps Book.',
      'Checks: Your open slots.',
      'Books the appointment.',
      'Records: The booking on the customer record.',
      'Your team sets the slots.',
    ])
  })

  it('labels what the team controls when the text does not say so', () => {
    const card = toSuiteProduct(agent({ teamControls: 'Which sources get a link.' }))
    expect(card.points?.map((p) => p.text)).toEqual(['Team controls: Which sources get a link.'])
  })

  it('joins summary, result and proof, and leaves out the empty ones', () => {
    expect(toSuiteProduct(agent({ summary: 'Books slots.', result: null, proof: 'Live at a hospital.' })).summary).toBe(
      'Books slots. Live at a hospital.',
    )
    expect(toSuiteProduct(agent()).summary).toBeNull()
  })

  it("links to the agent's own page, else its button, else nowhere", () => {
    expect(toSuiteProduct(agent({ hasOwnPage: true })).linkHref).toBe('/bot-swarm/appointment-assistance')
    const button = { label: 'See the full payment flow', link: { type: 'custom', url: '/solutions/payment-in-chat/' } }
    const withButton = toSuiteProduct(agent({ cta: button } as Partial<MicroApp>))
    expect(withButton.linkHref).toBe('/solutions/payment-in-chat/')
    expect(withButton.linkLabel).toBe('See the full payment flow')
    expect(toSuiteProduct(agent()).linkHref).toBeNull()
  })

  it('flags Pilot, and Planned in a preview', () => {
    expect(toSuiteProduct(agent({ status: 'pilot' })).flag).toBe('Pilot')
    expect(toSuiteProduct(agent({ status: 'planned' }), true).flag).toBe('Planned')
    expect(toSuiteProduct(agent()).flag).toBeNull()
  })
})
