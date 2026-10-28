import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { HowItWorks2Block } from '@/blocks/HowItWorks2/Component'

/**
 * How it works 2 (prompt 9 of the motion plan): the server HTML, and
 * motion off or autoplay off, show the finished state directly, since the
 * line-draw and the pop only run once the page has mounted.
 */
describe('How it works 2', () => {
  const steps = [
    { title: 'Hears', description: 'Understands the request.' },
    { title: 'Checks', description: 'Looks at your rules.' },
    { title: 'Acts', description: 'Does the work.' },
  ]

  it('shows every circle already navy (lit), and the line already drawn', () => {
    const html = renderToStaticMarkup(React.createElement(HowItWorks2Block, { heading: 'How it works', steps }))
    expect(html.match(/class="num is-lit"/g)?.length).toBe(3)
    expect(html).toContain('class="fill"')
    // The crimson head is not part of a finished line: hidden by its own CSS (opacity:0), not removed.
    expect(html).toContain('class="head"')
    expect(html).not.toContain('class="num"><')
  })

  it('draws nothing with fewer than one titled step', () => {
    expect(renderToStaticMarkup(React.createElement(HowItWorks2Block, { heading: 'H', steps: [] }))).toBe('')
  })

  it('reads motion, autoplay and speed from the block, without needing them', () => {
    const html = renderToStaticMarkup(
      React.createElement(HowItWorks2Block, { heading: 'H', steps, motion: 'off', autoplay: false, speed: 'faster' }),
    )
    expect(html.match(/class="num is-lit"/g)?.length).toBe(3)
  })
})
