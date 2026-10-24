import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { MegaPanel } from '@/Header/MegaMenu'
import { menuKind, panelLayout, panelLeft, type MenuGroup, type NavItem } from '@/Header/megaMenuLayout'

/** The header's mega menu: what each item is, how a panel lays out, and where it sits. */

const nav = (item: Partial<NavItem>): NavItem => ({ label: 'Menu', type: 'link', ...item }) as NavItem
const custom = (url: string, newTab = false) => ({ type: 'custom' as const, url, newTab })
const entries = (n: number, extra: object = {}) =>
  Array.from({ length: n }, (_, i) => ({ id: `i${i}`, label: `Item ${i}`, link: custom(`/item-${i}`), ...extra }))
const groupsOf = (...sizes: number[]): MenuGroup[] =>
  sizes.map((n, gi) => ({
    id: `g${gi}`,
    label: `Group ${gi}`,
    items: entries(n).map((e) => ({ ...e, id: `g${gi}${e.id}`, icon: null, description: null, href: e.link.url, newTab: false, badge: null })),
  }))

describe('what a menu item is', () => {
  it('a mega menu from its groups, items that go nowhere left out', () => {
    const kind = menuKind(
      nav({
        type: 'megaMenu',
        groups: [
          { id: 'a', label: 'Modules', items: [{ id: 'x', label: 'CRM', icon: 'users', description: 'The record', link: custom('/crm'), badge: 'new' }, { id: 'y', label: 'Nowhere', link: {} }] },
          { id: 'b', label: 'Empty', items: [] },
        ],
      }),
    )
    expect(kind).toEqual({
      kind: 'megaMenu',
      groups: [{ id: 'a', label: 'Modules', items: [{ id: 'x', icon: 'users', label: 'CRM', description: 'The record', href: '/crm', newTab: false, badge: 'new' }] }],
    })
  })

  it('a page reference goes to its slug, an external address opens in a new tab', () => {
    const kind = menuKind(
      nav({
        type: 'megaMenu',
        groups: [
          {
            items: [
              { label: 'Pricing', link: { type: 'reference', reference: { relationTo: 'pages', value: { slug: 'pricing' } as never } } },
              { label: 'Docs', link: custom('https://docs.example.com') },
            ],
          },
        ],
      }),
    )
    expect(kind.kind === 'megaMenu' && kind.groups[0].items.map((i) => [i.href, i.newTab])).toEqual([
      ['/pricing', false],
      ['https://docs.example.com', true],
    ])
  })

  it('a plain link from its link field', () => {
    expect(menuKind(nav({ type: 'link', link: custom('/customers') }))).toEqual({ kind: 'link', href: '/customers', newTab: false })
  })

  it('reads a header not yet copied into the mega menu fields: old columns become groups', () => {
    const kind = menuKind(
      nav({
        type: 'link',
        columns: [
          { heading: 'Modules', links: [{ label: 'CRM', href: '/crm', description: 'The record' }] },
          { heading: 'Agents', links: [{ label: 'Botswarm', href: '/botswarm' }] },
        ],
      }),
    )
    expect(kind.kind).toBe('megaMenu')
    expect(kind.kind === 'megaMenu' && kind.groups.map((g) => [g.label, g.items.map((i) => i.label)])).toEqual([
      ['Modules', ['CRM']],
      ['Agents', ['Botswarm']],
    ])
  })

  it('and an old flat list splits at each group heading', () => {
    const kind = menuKind(
      nav({
        type: 'link',
        items: [
          { label: 'Guides', href: '/guides', badge: 'New' },
          { label: 'API', href: '/api', groupHeading: 'Developers' },
        ],
      }),
    )
    expect(kind.kind === 'megaMenu' && kind.groups.map((g) => [g.label, g.items.map((i) => [i.label, i.badge])])).toEqual([
      [null, [['Guides', 'new']]],
      ['Developers', [['API', null]]],
    ])
  })

  it('and an old plain link keeps its address', () => {
    expect(menuKind(nav({ type: 'link', href: '/customers' }))).toEqual({ kind: 'link', href: '/customers', newTab: false })
    expect(menuKind(nav({ type: 'link' }))).toEqual({ kind: 'none' })
  })
})

describe('how a panel lays out', () => {
  it('a single group hides its label; more than one shows them', () => {
    expect(panelLayout(groupsOf(3), null).showLabels).toBe(false)
    expect(panelLayout(groupsOf(5), null).showLabels).toBe(false)
    expect(panelLayout(groupsOf(2, 1), null).showLabels).toBe(true)
  })

  it('a group with 4 or more items is a 2-column grid, a shorter one a list', () => {
    expect(panelLayout(groupsOf(3, 4, 7), null).groups.map((g) => g.grid)).toEqual([false, true, true])
  })

  it('the featured card needs it switched on, a title, and 5 or more items in total', () => {
    const on = { enabled: true, title: 'See Botswarm', link: custom('/botswarm'), linkLabel: 'Explore' }
    expect(panelLayout(groupsOf(4), on).featured).toBeNull()
    expect(panelLayout(groupsOf(4, 1), on).featured).toEqual({ eyebrow: null, title: 'See Botswarm', href: '/botswarm', newTab: false, linkLabel: 'Explore' })
    expect(panelLayout(groupsOf(5), { ...on, enabled: false }).featured).toBeNull()
    expect(panelLayout(groupsOf(5), { ...on, title: ' ' }).featured).toBeNull()
  })

  it('keeps the label line for an unlabelled column beside labelled ones', () => {
    const groups = groupsOf(2, 2)
    groups[1].label = null
    expect(panelLayout(groups, null).reserveLabel).toBe(true)
    expect(panelLayout(groupsOf(2), null).reserveLabel).toBe(false)
  })
})

describe('where a panel sits', () => {
  const container = { containerLeft: 100, containerRight: 1300 }

  it('directly under its trigger when it fits', () => {
    expect(panelLeft({ ...container, triggerLeft: 400, panelWidth: 500 })).toBe(400)
  })

  it('moved left just enough to keep its right edge inside the container', () => {
    expect(panelLeft({ ...container, triggerLeft: 1000, panelWidth: 500 })).toBe(800)
  })

  it('never past the container left edge', () => {
    expect(panelLeft({ ...container, triggerLeft: 1000, panelWidth: 1200 })).toBe(100)
    expect(panelLeft({ ...container, triggerLeft: 40, panelWidth: 300 })).toBe(100)
  })
})

describe('the panel', () => {
  const html = (groups: MenuGroup[], featured: NavItem['featured'] = null) =>
    renderToStaticMarkup(React.createElement(MegaPanel, { id: 'p', groups, featured }))

  it('renders rows as links with an icon slot, the badge beside the label, the description under it', () => {
    const groups = groupsOf(2)
    groups[0].items[0] = { ...groups[0].items[0], icon: 'bot', description: 'Agents at work', badge: 'beta' }
    const out = html(groups)
    expect(out).toContain('ncx-mega__item')
    expect(out.match(/class="ncx-mega__icon"/g)).toHaveLength(2)
    expect(out).toMatch(/Item 0<span class="ncx-pill ncx-pill--beta">Beta<\/span><\/span><span class="ncx-mega__desc">Agents at work/)
    expect(out).not.toContain('ncx-mega__eyebrow')
  })

  it('drops the icon slot when no item has an icon', () => {
    expect(html(groupsOf(2))).not.toContain('ncx-mega__icon')
  })

  it('labels each column when there are several, and adds the featured card last', () => {
    const out = html(groupsOf(4, 1), { enabled: true, eyebrow: 'New', title: 'Meet Botswarm', link: custom('/botswarm') })
    expect(out.match(/class="ncx-mega__eyebrow"/g)).toHaveLength(2)
    expect(out).toContain('ncx-mega__list is-grid')
    expect(out.indexOf('ncx-mega__feature')).toBeGreaterThan(out.lastIndexOf('ncx-mega__group'))
    expect(out).toContain('Learn more')
  })
})
