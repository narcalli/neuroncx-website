import React from 'react'
import { renderToReadableStream } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { TrustPanelBlock } from '@/blocks/TrustPanel/Component'

/**
 * The Trust Panel reads light on a pale section and dark everywhere else, from
 * the block's own Appearance > Background. Dark stays the default, so pages
 * that never chose a background look exactly as they did.
 */

const props = {
  eyebrow: 'Deployment & trust',
  heading: 'Built on platforms you can check',
  intro: 'Hosted where you choose.',
  buttonLabel: 'Book a demo',
  cards: [
    { id: '1', title: 'Official WhatsApp Business Platform', description: 'Meta’s own platform.' },
    { id: '2', title: 'Audit trail on every interaction', description: 'Logged against the record.' },
  ],
}

const render = async (background?: string) => {
  const stream = await renderToReadableStream(
    React.createElement(TrustPanelBlock, { ...props, background } as any),
  )
  await stream.allReady
  return (await new Response(stream).text()).replace(/<!-- -->/g, '')
}

const sectionTag = (html: string) => html.match(/<section class="ncx-trust"[^>]*>/)?.[0] ?? ''

describe('the Trust Panel palette', () => {
  it('is dark and paints its own navy when no background was chosen', async () => {
    const tag = sectionTag(await render())
    expect(tag).toContain('data-theme="dark"')
    expect(tag).toContain('data-own-bg')
  })

  it('stays dark on Highlight (navy), and leaves the navy to the wrapper', async () => {
    const tag = sectionTag(await render('navy'))
    expect(tag).toContain('data-theme="dark"')
    expect(tag).not.toContain('data-own-bg')
  })

  it('reads light on a white or pale grey section', async () => {
    for (const background of ['white', 'cloud']) {
      const tag = sectionTag(await render(background))
      expect(tag).toContain('data-theme="light"')
      expect(tag).not.toContain('data-own-bg')
    }
  })

  it('takes every colour from the theme variables, so neither palette leaks into the other', async () => {
    const html = await render()
    const rules = html.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? ''
    // Outside the two palette declarations, no rule may name a navy-only token.
    const body = rules.replace(/\.ncx-trust(\[data-theme="light"\])?\{[^}]*--trust[^}]*\}/g, '')
    expect(body).not.toMatch(/on-navy|navy-tint/)
    expect(rules).toContain('--trust-ink:var(--ncx-ink)')
  })

  it('sits the cards off whichever pale surface they are on', async () => {
    expect(sectionTag(await render('white'))).toContain('data-surface="white"')
    expect(sectionTag(await render('cloud'))).toContain('data-surface="cloud"')
    // Dark needs no surface: its cards are a lighter navy than the section.
    expect(sectionTag(await render())).not.toContain('data-surface')
    const rules = (await render('white')).match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? ''
    expect(rules).toContain('[data-surface="white"]{--trust-card:var(--ncx-paper)}')
  })

  it('still renders the heading, intro, button and every card', async () => {
    const html = await render('white')
    expect(html).toContain('Built on platforms you can check')
    expect(html).toContain('Hosted where you choose.')
    expect(html).toContain('Book a demo')
    expect(html).toContain('Official WhatsApp Business Platform')
    expect(html).toContain('Audit trail on every interaction')
  })
})
