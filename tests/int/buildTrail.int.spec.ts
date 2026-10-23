import { describe, expect, it } from 'vitest'

import {
  buildTrail,
  ELLIPSIS,
  MAX_ITEMS,
  type TrailPage,
} from '@/components/Breadcrumbs/buildTrail'

const HOME = { label: 'Home', href: '/' }

describe('buildTrail: page', () => {
  it('walks its parents, honours breadcrumbLabel, and leaves a label parent unlinked', () => {
    const knowledgeBase: TrailPage = {
      id: 'kb',
      title: 'Knowledge base for every channel',
      slug: 'knowledge-base',
      breadcrumbLabel: 'Knowledge base',
      breadcrumbParent: { kind: 'label', label: 'Platform' },
    }
    const page: TrailPage = {
      id: 'reports',
      title: 'Reports and analytics',
      slug: 'reports',
      breadcrumbLabel: 'Reports',
      breadcrumbParent: { kind: 'page', page: knowledgeBase },
    }
    expect(buildTrail({ page })).toEqual([
      HOME,
      { label: 'Platform' },
      { label: 'Knowledge base', href: '/knowledge-base' },
      { label: 'Reports' },
    ])
  })

  it('uses the title without a breadcrumbLabel, and stops at a parent that is only an id', () => {
    const page: TrailPage = {
      title: 'CRM',
      slug: 'crm',
      breadcrumbLabel: '  ',
      breadcrumbParent: { kind: 'page', page: 'unpopulated-id' },
    }
    expect(buildTrail({ page })).toEqual([HOME, { label: 'CRM' }])
  })
})

describe('buildTrail: integration', () => {
  it('is Home / Integrations / category / item, with the category unlinked', () => {
    expect(
      buildTrail({
        integration: { name: 'DocPulse', category: { name: 'EMR and Healthcare Systems' } },
      }),
    ).toEqual([
      HOME,
      { label: 'Integrations', href: '/integrations' },
      { label: 'EMR and Healthcare Systems' },
      { label: 'DocPulse' },
    ])
  })

  it('leaves out a category that arrived as an id', () => {
    expect(buildTrail({ integration: { name: 'DocPulse', category: 'category-id' } })).toEqual([
      HOME,
      { label: 'Integrations', href: '/integrations' },
      { label: 'DocPulse' },
    ])
  })
})

describe('buildTrail: customer', () => {
  it('is Home / Customers / name', () => {
    expect(buildTrail({ customer: { name: 'Ovum Hospitals' } })).toEqual([
      HOME,
      { label: 'Customers', href: '/customers' },
      { label: 'Ovum Hospitals' },
    ])
  })
})

describe('buildTrail: collapse', () => {
  it(`caps a trail at ${MAX_ITEMS} items, keeping Home and the last two with ${ELLIPSIS} between`, () => {
    // Home / Solutions / Healthcare / Clinics / Fertility: five items before the cap.
    const solutions: TrailPage = { id: 's', title: 'Solutions', slug: 'solutions' }
    const healthcare: TrailPage = {
      id: 'h',
      title: 'Healthcare',
      slug: 'healthcare',
      breadcrumbParent: { kind: 'page', page: solutions },
    }
    const clinics: TrailPage = {
      id: 'c',
      title: 'Clinics',
      slug: 'clinics',
      breadcrumbParent: { kind: 'page', page: healthcare },
    }
    const page: TrailPage = {
      id: 'f',
      title: 'Fertility',
      slug: 'fertility',
      breadcrumbParent: { kind: 'page', page: clinics },
    }
    const trail = buildTrail({ page })
    expect(trail).toHaveLength(MAX_ITEMS)
    expect(trail).toEqual([
      HOME,
      { label: ELLIPSIS },
      { label: 'Clinics', href: '/clinics' },
      { label: 'Fertility' },
    ])
  })
})

describe('buildTrail: content entry', () => {
  it('is Home / hub / grouping / entry, with the grouping unlinked', () => {
    expect(
      buildTrail({
        entry: {
          name: 'Payment services',
          hub: { label: 'Bot swarm', href: '/bot-swarm' },
          group: 'Book and get paid',
        },
      }),
    ).toEqual([
      HOME,
      { label: 'Bot swarm', href: '/bot-swarm' },
      { label: 'Book and get paid' },
      { label: 'Payment services' },
    ])
  })

  it('leaves the grouping out when there is none', () => {
    expect(
      buildTrail({ entry: { name: 'Qualify', hub: { label: 'Bot swarm', href: '/bot-swarm' } } }),
    ).toEqual([HOME, { label: 'Bot swarm', href: '/bot-swarm' }, { label: 'Qualify' }])
  })
})
