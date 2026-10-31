import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { ProblemStatementBlock } from '@/blocks/ProblemStatement/Component'
import { Pill } from '@/components/cards/Pill'
import { initialOf } from '@/components/cards/types'
import { RelatedCards } from '@/components/integrations/RelatedCards'
import { readableTitle } from '@/utilities/siteDefaults'

/** The go-live fixes that have no other home: titles, initial tiles and the problem cards. */

describe('a page title that holds a slug', () => {
  it('reads as words in sentence case', () => {
    expect(readableTitle('knowledge-base')).toBe('Knowledge base')
    expect(readableTitle('user-intelligence')).toBe('User intelligence')
    expect(readableTitle('integrations')).toBe('Integrations')
  })

  it('leaves a real title as typed', () => {
    expect(readableTitle('Omnichannel CX')).toBe('Omnichannel CX')
    expect(readableTitle('CRM')).toBe('CRM')
    expect(readableTitle('Terms of Use')).toBe('Terms of Use')
  })
})

describe('the initial tile when there is no logo', () => {
  it('is a capital, named for assistive tech', () => {
    expect(initialOf('astTECS')).toBe('A')
    expect(initialOf('')).toBe('?')
    const out = renderToStaticMarkup(React.createElement(Pill, { name: 'Exotel', initial: 'E' }))
    expect(out).toContain('role="img"')
    expect(out).toContain('aria-label="Exotel"')
  })

  it('makes a card without a page plain, and only a card with one a link', () => {
    const out = renderToStaticMarkup(
      React.createElement(RelatedCards, {
        showAllLink: false,
        cards: [
          { id: 'a', name: 'Exotel', text: null, href: null, logoSrc: null },
          { id: 'b', name: 'Zenoti', text: null, href: '/integrations/zenoti', logoSrc: null },
        ],
      }),
    )
    expect(out.match(/<a /g)).toHaveLength(1)
    expect(out).toContain('href="/integrations/zenoti"')
    expect(out).toContain('aria-label="Exotel"')
    expect(out).toContain('ncx-card-motion is-still')
  })
})

describe('the problem cards', () => {
  it('have no mark before the heading', () => {
    const out = renderToStaticMarkup(
      React.createElement(ProblemStatementBlock as React.FC<any>, {
        heading: 'Heading',
        problems: [{ id: 'a', title: 'A title', description: 'A line.' }],
      }),
    )
    expect(out).not.toContain('class="mark"')
    expect(out).toContain('<p><b>A title</b> A line.</p>')
  })
})
