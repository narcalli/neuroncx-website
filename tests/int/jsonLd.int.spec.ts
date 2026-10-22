import { describe, expect, it } from 'vitest'

import { buildTrail } from '@/components/Breadcrumbs/buildTrail'
import { breadcrumbList, faqPage, jsonLdHtml } from '@/utilities/jsonLd'

const SITE = 'https://www.example.com'

describe('breadcrumbList', () => {
  it('resolves relative hrefs against the site, numbers from 1, and leaves the current page without an item', () => {
    expect(
      breadcrumbList(buildTrail({ customer: { name: 'Ovum Hospitals' } }), `${SITE}/`),
    ).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: 'Customers', item: `${SITE}/customers` },
        { '@type': 'ListItem', position: 3, name: 'Ovum Hospitals' },
      ],
    })
  })

  it('leaves out steps with no page (a category, a label, the collapsed middle) and renumbers', () => {
    const trail = [
      { label: 'Home', href: '/' },
      { label: '…' },
      { label: 'Integrations', href: '/integrations' },
      { label: 'EMR and Healthcare Systems' },
      { label: 'DocPulse' },
    ]
    expect(breadcrumbList(trail, SITE)?.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: 'Integrations', item: `${SITE}/integrations` },
      { '@type': 'ListItem', position: 3, name: 'DocPulse' },
    ])
  })

  it('is null without an absolute site address, or with fewer than two steps left', () => {
    const trail = buildTrail({ customer: { name: 'Ovum Hospitals' } })
    expect(breadcrumbList(trail, '')).toBeNull()
    expect(breadcrumbList(trail, '/relative')).toBeNull()
    expect(breadcrumbList([{ label: 'Platform' }, { label: 'CRM' }], SITE)).toBeNull()
  })
})

describe('jsonLdHtml', () => {
  it('escapes "<" so a value cannot close the script tag', () => {
    const data = faqPage([{ question: 'Does </script> break it?', answer: 'No.' }])
    const { __html } = jsonLdHtml(data)
    expect(__html).not.toContain('<')
    expect(JSON.parse(__html)).toEqual(data)
  })
})
