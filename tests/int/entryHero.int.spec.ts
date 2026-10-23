import { describe, expect, it } from 'vitest'

import {
  chainSteps,
  chipsOf,
  conversationLines,
  heroDesignOf,
  toConversationHero,
  toRightPlacementHero,
  toStatsHero,
  type HeroInput,
} from '@/components/sections/entryHeroAdapters'
import type { MicroApp } from '@/payload-types'

/**
 * An entry's own page hero: what each design's adapter hands the existing
 * hero block.
 */

const agent = (extra: Partial<MicroApp> = {}) =>
  ({
    id: 'pay',
    name: 'Payment services',
    slug: 'payment-services',
    status: 'live',
    _status: 'published',
    hasOwnPage: true,
    summary: 'Sends a payment link.',
    icon: 'card',
    ...extra,
  }) as MicroApp

const other = (id: string, name: string, extra: Partial<MicroApp> = {}) => agent({ id, name, slug: id, icon: null, ...extra })

const input = (entry: MicroApp, extra: Partial<HeroInput> = {}): HeroInput => ({
  entry,
  groupName: 'Book and get paid',
  primary: { label: 'Book a demo', href: '/contact' },
  ...extra,
})

const button = (label: string, url: string) => ({ label, link: { type: 'custom' as const, url } })

describe('hero design', () => {
  it('is the entry design, or conversation when it has none', () => {
    expect(heroDesignOf(agent({ heroDesign: 'stats' }))).toBe('stats')
    expect(heroDesignOf(agent())).toBe('conversation')
  })
})

describe('shared fields', () => {
  it("fall back to the grouping's name, the entry name and the summary", () => {
    expect(toStatsHero(input(agent()))).toMatchObject({
      eyebrow: 'Book and get paid',
      headline: 'Payment services',
      subhead: 'Sends a payment link.',
    })
    expect(
      toStatsHero(input(agent({ heroEyebrow: 'Payments', heroHeading: 'Paid in the chat', heroSubheading: 'Links that follow through.' }))),
    ).toMatchObject({ eyebrow: 'Payments', headline: 'Paid in the chat', subhead: 'Links that follow through.' })
  })

  it('chips are the entry chips, else its key points, 4 at most', () => {
    expect(chipsOf(agent({ heroChips: [{ label: 'Razorpay' }] }))).toEqual([{ label: 'Razorpay' }])
    expect(chipsOf(agent({ keyPoints: [1, 2, 3, 4, 5].map((n) => ({ line: `Point ${n}` })) }))).toHaveLength(4)
  })
})

describe('conversation', () => {
  const chat = [
    { sender: 'customer' as const, text: 'Can I pay\nhere?' },
    { sender: 'business' as const, text: 'Here is your link.', entry: { relationTo: 'microApps' as const, value: agent() } },
    { sender: 'team' as const, text: 'Anything else?' },
    { sender: 'business' as const, text: 'Paid, thank you.', entry: { relationTo: 'microApps' as const, value: agent() } },
    { sender: 'business' as const, text: 'Planned agent.', entry: { relationTo: 'microApps' as const, value: other('q', 'Qualify', { status: 'planned' }) } },
  ]

  it('turns chat rows into them and us lines, then names each replying agent once', () => {
    expect(conversationLines(agent({ heroChat: chat }))).toBe(
      [
        'them: Can I pay here?',
        'us: Here is your link.',
        'us: Anything else?',
        'us: Paid, thank you.',
        'us: Planned agent.',
        'tag: Payment services',
      ].join('\n'),
    )
  })

  it('names a Planned agent only in a draft preview', () => {
    expect(conversationLines(agent({ heroChat: chat }), true)).toMatch(/tag: Qualify$/)
  })

  it('maps buttons, chips, caption and stats to the block props', () => {
    const props = toConversationHero(
      input(
        agent({
          heroChat: chat,
          heroChatCaption: 'WhatsApp, 11:42',
          heroSecondaryCta: button('See the flow', '/solutions/pay/'),
          heroChips: [{ label: 'Razorpay' }],
          heroStats: [{ value: '40%', label: 'fewer calls' }, { value: '2x' } as never],
        }),
      ),
    )
    expect(props).toMatchObject({
      primaryButtonLabel: 'Book a demo',
      primaryButtonLink: '/contact',
      secondaryButtonLabel: 'See the flow',
      secondaryButtonLink: '/solutions/pay/',
      chips: [{ label: 'Razorpay' }],
      conversationLabel: 'WhatsApp, 11:42',
      workflowSteps: [],
    })
    expect(props.stats).toEqual([{ value: '40%', label: 'fewer calls', id: undefined }])
  })

  it('shows the chain as workflow steps when switched on: before, this agent, next, each once', () => {
    const before = [other('pre', 'Prescription understanding', { icon: 'document' as never })]
    const next = [other('rec', 'Records'), agent()]
    expect(chainSteps(agent(), { before, next }).map((s) => [s.label, s.icon])).toEqual([
      ['Prescription understanding', 'document'],
      ['Payment services', 'card'],
      ['Records', null],
    ])
    expect(toConversationHero(input(agent({ heroWorkflowFromChain: true }), { chain: { before, next } })).workflowSteps).toHaveLength(3)
    expect(toConversationHero(input(agent({ heroWorkflowFromChain: false }), { chain: { before, next } })).workflowSteps).toEqual([])
  })
})

describe('picture on the right', () => {
  const media = { id: 'm', url: '/media/flow.png', alt: 'Payment flow', width: 1200, height: 630, filename: 'flow.png', mimeType: 'image/png' }

  it('passes the picture, its alt text, the motion and both buttons', () => {
    const props = toRightPlacementHero(
      input(agent({ heroDesign: 'rightPlacement', heroMedia: media as never, heroMotion: 'off', heroSecondaryCta: button('See the flow', '/flow') })),
    )
    expect(props.media).toBe(media)
    expect(props).toMatchObject({
      mediaAlt: 'Payment flow',
      animation: 'off',
      primaryCta: { type: 'custom', url: '/contact', label: 'Book a demo' },
      secondaryCta: { type: 'custom', url: '/flow', label: 'See the flow' },
    })
  })

  it("prefers the entry's own alt text, and moves by default", () => {
    const props = toRightPlacementHero(input(agent({ heroMedia: media as never, heroMediaAlt: 'How a payment link moves' })))
    expect(props).toMatchObject({ mediaAlt: 'How a payment link moves', animation: 'on', secondaryCta: null })
  })
})

describe('stats', () => {
  it('passes the stats with a value and a label, and both buttons', () => {
    const props = toStatsHero(
      input(agent({ heroStats: [{ value: '40%', label: 'fewer calls' }, { value: '2x', label: 'faster' }], heroSecondaryCta: button('Pricing', '/pricing') })),
    )
    expect(props).toMatchObject({ primaryLabel: 'Book a demo', primaryLink: '/contact', secondaryLabel: 'Pricing', secondaryLink: '/pricing' })
    expect(props.stats?.map((s) => s.value)).toEqual(['40%', '2x'])
  })
})

