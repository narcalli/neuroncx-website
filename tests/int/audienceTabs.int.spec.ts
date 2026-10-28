import React, { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AudienceTabsBlock } from '@/blocks/AudienceTabs/Component'
import type { AudienceTabsBlock as Props } from '@/payload-types'

/** Audience tabs: the WAI-ARIA tabs pattern, every panel in the HTML, "#" links. */

const block: Props = {
  blockType: 'audienceTabs',
  eyebrow: 'Who it is for',
  heading: 'One platform, read three ways',
  intro: 'Pick the view that fits your role.',
  tabs: [
    {
      id: 'a',
      label: 'Leadership',
      title: 'See the whole customer journey',
      intro: 'Every channel in one view.',
      points: [{ text: 'Reports on every channel in one place' }, { text: 'Sets the rules agents follow' }],
      links: [{ label: 'See pricing', url: '/pricing' }, { label: 'How it works', url: '#how-it-works' }],
    },
    {
      id: 'b',
      label: 'Operations',
      title: 'Run the day from one queue',
      points: [{ text: 'Routes each conversation to the right team' }, { text: 'Hands repeat work to agents' }],
    },
    {
      id: 'c',
      label: 'IT',
      points: [{ text: 'Connects to the systems already in use' }, { text: 'Keeps an audit trail of every action' }],
      links: [{ label: 'Security overview', url: 'https://example.com/security' }],
    },
  ],
}

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let root: Root | null = null
let host: HTMLDivElement | null = null
const draw = (props: Props = block) => {
  host = document.body.appendChild(document.createElement('div'))
  const r = (root = createRoot(host))
  act(() => r.render(React.createElement(AudienceTabsBlock, props)))
  return host
}
const tabs = () => [...document.querySelectorAll<HTMLButtonElement>('[role="tab"]')]
const tab = (name: string) => tabs().find((t) => t.textContent === name)!
const panels = () => [...document.querySelectorAll<HTMLElement>('[role="tabpanel"]')]
const visiblePanel = () => panels().find((p) => !p.hidden)!
const link = (name: string) => [...document.querySelectorAll<HTMLAnchorElement>('a')].find((a) => a.textContent === name)!
const selected = () => tabs().findIndex((t) => t.getAttribute('aria-selected') === 'true')
/** Dispatches the event inside act; true when nothing cancelled it. */
const fire = (el: Element, event: Event) => {
  let result = true
  act(() => {
    result = el.dispatchEvent(event)
  })
  return result
}
const click = (el: Element) => fire(el, new MouseEvent('click', { bubbles: true, cancelable: true }))
const key = (el: Element, k: string) => fire(el, new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }))

afterEach(() => {
  act(() => root?.unmount())
  host?.remove()
  root = host = null
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  history.replaceState(null, '', '/')
})

describe('the server HTML', () => {
  const html = renderToString(React.createElement(AudienceTabsBlock, block))

  it('holds every panel, with all but the first hidden', () => {
    expect(html.match(/role="tabpanel"/g)).toHaveLength(3)
    for (const text of ['Reports on every channel in one place', 'Routes each conversation to the right team', 'Keeps an audit trail of every action']) {
      expect(html).toContain(text)
    }
    const panels = [...html.matchAll(/<div class="aud-panel" role="tabpanel"[^>]*>/g)].map((m) => m[0])
    expect(panels[0]).not.toContain('hidden')
    expect(panels[1]).toContain('hidden=""')
    expect(panels[2]).toContain('hidden=""')
  })

  it('shows the first tab as selected', () => {
    expect(html).toMatch(/<button type="button" role="tab" id="[^"]+" aria-selected="true"[^>]*tabindex="0">Leadership<\/button>/)
    expect(html).toMatch(/aria-selected="false"[^>]*tabindex="-1">Operations</)
  })

  it('keeps hidden panels hidden even though the panel CSS sets a grid', () => {
    expect(html).toContain('.ncx-aud .aud-panel[hidden]{display:none}')
  })
})

describe('the tabs pattern', () => {
  it('ties each tab to its panel and labels the tab list with the heading', () => {
    draw()
    const list = document.querySelector('[role="tablist"]')!
    expect(document.getElementById(list.getAttribute('aria-labelledby')!)?.textContent).toBe('One platform, read three ways')
    tabs().forEach((tab) => {
      const panel = document.getElementById(tab.getAttribute('aria-controls')!)!
      expect(panel.getAttribute('role')).toBe('tabpanel')
      expect(panel.getAttribute('aria-labelledby')).toBe(tab.id)
    })
  })

  it('opens a tab on click and hides the others', () => {
    draw()
    click(tab('Operations'))
    expect(selected()).toBe(1)
    expect(panels().map((p) => p.hidden)).toEqual([true, false, true])
    expect(tabs().map((t) => t.tabIndex)).toEqual([-1, 0, -1])
  })

  it('moves with Left and Right (wrapping round), Home and End, and takes the focus along', () => {
    draw()
    const press = (k: string) => key(document.activeElement && document.activeElement !== document.body ? document.activeElement : tabs()[0], k)
    press('ArrowRight')
    expect(selected()).toBe(1)
    expect(document.activeElement).toBe(tabs()[1])
    press('ArrowRight')
    press('ArrowRight')
    expect(selected()).toBe(0)
    press('ArrowLeft')
    expect(selected()).toBe(2)
    press('Home')
    expect(selected()).toBe(0)
    press('End')
    expect(selected()).toBe(2)
    expect(document.activeElement).toBe(tabs()[2])
    press('ArrowDown')
    expect(selected()).toBe(2)
  })

  it('lets a panel without links take the focus itself', () => {
    draw()
    expect(panels().map((p) => p.getAttribute('tabindex'))).toEqual([null, '0', null])
  })

  it('shows the title, intro and links on the left and the points as a list', () => {
    draw()
    const panel = visiblePanel()
    expect(panel.querySelector('.aud-copy h3')?.textContent).toBe('See the whole customer journey')
    expect([...panel.querySelectorAll('.aud-links a')].map((a) => a.getAttribute('href'))).toEqual(['/pricing', '#how-it-works'])
    expect(panel.querySelectorAll('.aud-points li')).toHaveLength(2)
  })

  it('draws nothing without tabs', () => {
    expect(draw({ ...block, tabs: [] }).innerHTML).toBe('')
  })
})

describe('"#" links', () => {
  const withTarget = () => {
    const target = document.createElement('div')
    target.id = 'how-it-works'
    document.body.appendChild(target)
    const scroll = vi.fn()
    target.scrollIntoView = scroll
    return { target, scroll }
  }
  // jsdom has no matchMedia: stand one in that answers the reduced-motion
  // question. addEventListener/removeEventListener too, now that rendering
  // the block's heading (SplitHeading, Reveal) also reads it, through
  // usePrefersReducedMotion's useSyncExternalStore subscription.
  const motion = (reduce: boolean) =>
    vi.stubGlobal(
      'matchMedia',
      (q: string) =>
        ({
          matches: reduce && q.includes('reduce'),
          addEventListener: () => {},
          removeEventListener: () => {},
        }) as unknown as MediaQueryList,
    )

  it('scroll smoothly to the section, update the address and move the focus there', () => {
    const { target, scroll } = withTarget()
    motion(false)
    draw()
    expect(click(link('How it works'))).toBe(false)
    expect(scroll).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' })
    expect(location.hash).toBe('#how-it-works')
    expect(document.activeElement).toBe(target)
    target.remove()
  })

  it('jump when the reader has asked for less motion', () => {
    const { target, scroll } = withTarget()
    motion(true)
    draw()
    click(link('How it works'))
    expect(scroll).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' })
    target.remove()
  })

  it('leave the browser to it when no section has that id, and leave other links alone', () => {
    motion(false)
    draw()
    // Read the click at the document, after React has handled it, then stop
    // jsdom from trying to follow the link.
    const untouched = (name: string) => {
      let prevented: boolean | null = null
      const watch = (e: Event) => {
        prevented = e.defaultPrevented
        e.preventDefault()
      }
      document.addEventListener('click', watch)
      act(() => void link(name).dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })))
      document.removeEventListener('click', watch)
      return prevented === false
    }
    expect(untouched('How it works')).toBe(true)
    expect(untouched('See pricing')).toBe(true)
  })
})

describe('the look', () => {
  const html = renderToString(React.createElement(AudienceTabsBlock, block))
  const sheet = html.slice(html.indexOf('<style>'), html.indexOf('</style>'))

  it('underlines the selected tab in crimson with ink text, others muted, at least 44px tall', () => {
    expect(sheet).toContain('[role="tab"][aria-selected="true"]{color:var(--ncx-ink);border-bottom-color:var(--ncx-crimson)}')
    expect(sheet).toMatch(/\[role="tab"\]\{[^}]*min-height:44px;[^}]*color:var\(--ncx-muted\)/)
  })

  it('scrolls the tab row sideways, and stacks the panel below 900px', () => {
    expect(sheet).toMatch(/\.aud-tablist\{[^}]*overflow-x:auto/)
    expect(sheet).toMatch(/@media \(max-width:899\.98px\)\{\s*\.ncx-aud \.aud-panel\{grid-template-columns:minmax\(0,1fr\)\}/)
  })

  it('draws points as white cards with a crimson dot, and links in crimson', () => {
    expect(sheet).toMatch(/\.aud-points li\{[^}]*background:var\(--ncx-white\)/)
    expect(sheet).toMatch(/\.aud-points li::before\{[^}]*border-radius:50%;background:var\(--ncx-crimson\)/)
    expect(sheet).toMatch(/\.aud-links a\{color:var\(--ncx-link\)/)
  })

  it('uses brand variables only, no colour codes', () => {
    expect(sheet).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(/)
  })
})
