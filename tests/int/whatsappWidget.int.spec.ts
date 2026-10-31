import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { WhatsappButton, revealAt } from '@/blocks/WhatsappWidget/Button'
import { whatsappButtonOn } from '@/utilities/siteSettings'

/** The WhatsApp button: when it shows, and what the server sends. The browser side is in tests/e2e. */

const html = (props: object = {}) =>
  renderToStaticMarkup(
    React.createElement(WhatsappButton as React.FC<any>, { phone: '+919876543210', ...props }),
  )

describe('when the button shows', () => {
  it('after 420px on a long page, and a third of the way on a short one', () => {
    expect(revealAt(9000)).toBe(420)
    expect(revealAt(1260)).toBe(420)
    expect(revealAt(600)).toBe(200)
  })
})

describe('whether the site-wide button is on', () => {
  it('only when switched on and with a number', () => {
    expect(whatsappButtonOn({ whatsappButton: { enabled: true, phone: '+919876543210' } } as any)).toBe(true)
    expect(whatsappButtonOn({ whatsappButton: { enabled: false, phone: '+919876543210' } } as any)).toBe(false)
    expect(whatsappButtonOn({ whatsappButton: { enabled: true, phone: '  ' } } as any)).toBe(false)
    expect(whatsappButtonOn({} as any)).toBe(false)
  })
})

describe('what the server sends', () => {
  it('nothing on a page it is hidden from, and the button everywhere else', () => {
    // Outside the app router there is no pathname, which reads as the home page.
    expect(html({ hiddenPaths: ['/'] })).toBe('')
    expect(html({ hiddenPaths: ['/contact'] })).toContain('class="ncx-wa"')
  })

  it('hidden for the script to show, with a noscript style that shows it', () => {
    const out = html()
    expect(out).toContain('visibility:hidden')
    expect(out).toMatch(/<noscript>.*\.ncx-wa\{visibility:visible!important;opacity:1!important;.*<\/noscript>/s)
  })

  it('the label to the left of the icon, Chat by default, the field when set', () => {
    const out = html()
    expect(out).toContain('<span class="ncx-wa__label">Chat</span>')
    expect(out.indexOf('ncx-wa__label')).toBeLessThan(out.indexOf('class="ncx-wa__glyph"'))
    expect(html({ label: 'Talk to us' })).toContain('<span class="ncx-wa__label">Talk to us</span>')
  })

  it('the same accessible name and link whatever the label says', () => {
    const out = html({ label: 'Talk to us', message: 'Hi', includeRef: false })
    expect(out).toContain('aria-label="Chat with us on WhatsApp"')
    expect(out).toContain('href="https://wa.me/919876543210?text=Hi"')
  })

  it('keeps the label on phones and clears the safe area', () => {
    const out = html()
    expect(out).not.toContain('.ncx-wa__label{display:none}')
    expect(out).toContain('bottom:calc(14px + env(safe-area-inset-bottom,0px))')
  })
})
