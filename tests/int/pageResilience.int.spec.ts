import { readFileSync } from 'fs'
import path from 'path'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

// The blocks rich text can embed, which these tests do not use; the code
// block pulls in the admin UI's styles.
vi.mock('@/blocks/Code/Component', () => ({ CodeBlock: () => null }))
vi.mock('@/blocks/MediaBlock/Component', () => ({ MediaBlock: () => null }))
vi.mock('@/blocks/Banner/Component', () => ({ BannerBlock: () => null }))
vi.mock('@/blocks/CallToAction/Component', () => ({ CallToActionBlock: () => null }))

import RichText from '@/components/RichText'
import { Animator } from '@/blocks/HeroFullBackground/Animator'

/**
 * Content that can break or blank a page: a rich text link to an entry
 * visitors cannot reach, and hero buttons hidden until JavaScript runs.
 */

const linkState = (doc: unknown) =>
  ({
    root: {
      type: 'root',
      version: 1,
      direction: null,
      format: '',
      indent: 0,
      children: [
        {
          type: 'paragraph',
          version: 1,
          direction: null,
          format: '',
          indent: 0,
          textFormat: 0,
          children: [
            { type: 'text', text: 'See ', version: 1, format: 0, detail: 0, mode: 'normal', style: '' },
            {
              type: 'link',
              version: 3,
              direction: null,
              format: '',
              indent: 0,
              fields: { linkType: 'internal', newTab: false, doc },
              children: [{ type: 'text', text: 'our pricing', version: 1, format: 0, detail: 0, mode: 'normal', style: '' }],
            },
          ],
        },
      ],
    },
  }) as unknown as React.ComponentProps<typeof RichText>['data']

const render = (doc: unknown) => renderToStaticMarkup(React.createElement(RichText, { data: linkState(doc) }))

describe('a rich text link to another entry', () => {
  it('links to the entry when it arrives populated', () => {
    expect(render({ relationTo: 'pages', value: { id: 'p1', slug: 'pricing' } })).toContain('<a href="/pricing">our pricing</a>')
  })

  it.each([
    ['deleted or unpublished: only its id comes back', { relationTo: 'pages', value: '6650f0c2a1b2c3d4e5f60718' }],
    ['the reference is gone altogether', undefined],
    ['the entry has no slug', { relationTo: 'pages', value: { id: 'p1' } }],
  ])('keeps its words without a link when %s', (_, doc) => {
    const html = render(doc)
    expect(html).toContain('See our pricing')
    expect(html).not.toContain('<a')
  })
})

describe('hero buttons', () => {
  it('are sent visible: the Animator adds nothing until it runs in the browser', () => {
    const html = renderToStaticMarkup(React.createElement(Animator, { className: 'content', children: 'Buttons' }))
    expect(html).toBe('<div class="content">Buttons</div>')
  })

  it.each(['HeroWorkforceGrid', 'HeroFullBackground', 'HeroRightPlacement'])(
    '%s hides its buttons only once the Animator has armed a block off screen',
    (block) => {
      const css = readFileSync(path.resolve(__dirname, `../../src/blocks/${block}/Component.tsx`), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
      const hiding = [...css.matchAll(/([^{}]+)\{\s*opacity:0/g)].map((m) => m[1].trim())
      expect(hiding.length).toBeGreaterThan(0)
      for (const selectors of hiding) {
        for (const selector of selectors.split(',')) expect(selector, block).toContain('.armed')
      }
    },
  )
})
