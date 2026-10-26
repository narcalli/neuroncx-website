import React, { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, describe, expect, it } from 'vitest'

import { RecordAnatomyBlock } from '@/blocks/RecordAnatomy/Component'
import type { RecordAnatomyBlock as Props } from '@/payload-types'

/** Record anatomy: a vertical tabs pattern, every panel in the HTML, a real table per entity. */

const block: Props = {
  blockType: 'recordAnatomy',
  eyebrow: 'Under the hood',
  heading: 'What a student record holds',
  intro: 'And which system fills each field.',
  recordLabel: 'Student record',
  fieldColumnLabel: 'Field',
  sourceColumnLabel: 'Filled by',
  entities: [
    {
      id: 'a',
      label: 'Fees',
      icon: 'card',
      description: 'What the student owes and has paid.',
      fields: [
        { name: 'Balance due', source: 'ERP' },
        { name: 'Last payment', source: 'Payment gateway' },
      ],
    },
    { id: 'b', label: 'Admissions', fields: [{ name: 'Programme', source: 'Qualification form' }] },
    {
      id: 'c',
      label: 'Contacts',
      fields: [
        { name: 'Email', source: 'Lead management system' },
        { name: 'Phone', source: 'Lead management system' },
        { name: 'Guardian', source: 'Qualification form' },
      ],
    },
  ],
}

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let root: Root | null = null
let host: HTMLDivElement | null = null
const draw = (props: Props = block) => {
  host = document.body.appendChild(document.createElement('div'))
  const r = (root = createRoot(host))
  act(() => r.render(React.createElement(RecordAnatomyBlock, props)))
  return host
}
const tabs = () => [...document.querySelectorAll<HTMLButtonElement>('[role="tab"]')]
const panels = () => [...document.querySelectorAll<HTMLElement>('[role="tabpanel"]')]
const selected = () => tabs().findIndex((t) => t.getAttribute('aria-selected') === 'true')
const fire = (el: Element, event: Event) => act(() => void el.dispatchEvent(event))
const click = (el: Element) => fire(el, new MouseEvent('click', { bubbles: true, cancelable: true }))
const key = (el: Element, k: string) => fire(el, new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }))

afterEach(() => {
  act(() => root?.unmount())
  host?.remove()
  root = host = null
})

describe('the server HTML', () => {
  const html = renderToString(React.createElement(RecordAnatomyBlock, block))

  it('holds every panel, with all but the first hidden', () => {
    const open = [...html.matchAll(/<div class="rec-panel" role="tabpanel"[^>]*>/g)].map((m) => m[0])
    expect(open).toHaveLength(3)
    expect(open[0]).not.toContain('hidden')
    expect(open[1]).toContain('hidden=""')
    expect(open[2]).toContain('hidden=""')
    for (const text of ['Balance due', 'Programme', 'Guardian']) expect(html).toContain(text)
  })

  it('selects the first entity, in a vertical tab list labelled by the heading', () => {
    expect(html).toMatch(/role="tablist" aria-orientation="vertical" aria-labelledby="[^"]+"/)
    expect(html).toMatch(/role="tab" id="[^"]+" aria-selected="true"[^>]*tabindex="0"><span class="rec-name">/)
    expect(html).toMatch(/aria-selected="false"[^>]*tabindex="-1"><span class="rec-name">Admissions<\/span><span class="rec-count"><span class="rec-hidden">, <\/span>1 field<\/span>/)
  })

  it('names each entity first, then its count, while the count sits above it on screen', () => {
    const div = document.createElement('div')
    div.innerHTML = html
    expect([...div.querySelectorAll('[role="tab"]')].map((t) => t.textContent)).toEqual(['Fees, 2 fields', 'Admissions, 1 field', 'Contacts, 3 fields'])
    expect(html).toMatch(/\.rec-count\{order:-1;/)
  })

  it('shows the icon only when one is chosen', () => {
    const icons = html.match(/class="rec-icon"/g) || []
    expect(icons).toHaveLength(1)
    expect(html).toMatch(/<span class="rec-icon"><svg[^>]*aria-hidden="true"/)
    expect(html).toMatch(/<span class="rec-name"><span class="rec-icon"><svg[\s\S]*?<\/span>Fees<\/span>/)
  })

  it('heads each panel with the record and entity, then the description and a real table', () => {
    expect(html).toContain(
      '<h3><span class="rec-record">Student record</span><span class="rec-sep" aria-hidden="true">›</span> <!-- -->Fees</h3><p class="rec-desc">What the student owes and has paid.</p>',
    )
    expect(html).toContain('<table><caption class="rec-caption">Student record, Fees: 2 fields</caption>')
    expect(html).toContain('<thead><tr><th scope="col">Field</th><th scope="col">Filled by</th></tr></thead>')
    expect(html).toContain('<tr><th scope="row">Balance due</th><td>ERP</td></tr>')
  })

  it('falls back to the default labels when they are left empty', () => {
    const plain = renderToString(
      React.createElement(RecordAnatomyBlock, { ...block, recordLabel: null, fieldColumnLabel: null, sourceColumnLabel: '' }),
    )
    expect(plain).toContain('<span class="rec-record">Customer record</span>')
    expect(plain).toContain('<th scope="col">Field</th><th scope="col">Filled by</th>')
  })

  it('keeps hidden panels hidden even though the panel CSS sets a display', () => {
    expect(html).toContain('.ncx-rec .rec-panel[hidden]{display:none}')
  })
})

describe('the tabs pattern', () => {
  it('ties each entity to its panel', () => {
    draw()
    tabs().forEach((tab) => {
      const panel = document.getElementById(tab.getAttribute('aria-controls')!)!
      expect(panel.getAttribute('role')).toBe('tabpanel')
      expect(panel.getAttribute('aria-labelledby')).toBe(tab.id)
      expect(panel.tabIndex).toBe(0)
    })
  })

  it('opens an entity on click and hides the others', () => {
    draw()
    click(tabs()[2])
    expect(selected()).toBe(2)
    expect(panels().map((p) => p.hidden)).toEqual([true, true, false])
    expect(tabs().map((t) => t.tabIndex)).toEqual([-1, -1, 0])
  })

  it('moves with Up and Down (wrapping round), Home and End, taking the focus along', () => {
    draw()
    const press = (k: string) => key(document.activeElement && document.activeElement !== document.body ? document.activeElement : tabs()[0], k)
    press('ArrowDown')
    expect(selected()).toBe(1)
    expect(document.activeElement).toBe(tabs()[1])
    press('ArrowDown')
    press('ArrowDown')
    expect(selected()).toBe(0)
    press('ArrowUp')
    expect(selected()).toBe(2)
    press('Home')
    expect(selected()).toBe(0)
    press('End')
    expect(selected()).toBe(2)
    expect(document.activeElement).toBe(tabs()[2])
    // Left and Right belong to a horizontal list; here they do nothing.
    press('ArrowRight')
    press('ArrowLeft')
    expect(selected()).toBe(2)
  })

  it('draws nothing without entities', () => {
    expect(draw({ ...block, entities: [] }).innerHTML).toBe('')
  })
})

describe('the look', () => {
  const html = renderToString(React.createElement(RecordAnatomyBlock, block))
  const sheet = html.slice(html.indexOf('<style>'), html.indexOf('</style>'))

  it('fills the selected entity navy with white text; others white with a rule border', () => {
    expect(sheet).toContain('[role="tab"][aria-selected="true"]{background:var(--ncx-navy);border-color:var(--ncx-navy);color:var(--ncx-on-navy)}')
    expect(sheet).toMatch(/\[role="tab"\]\{[^}]*background:var\(--ncx-white\);border:1px solid var\(--ncx-rule\)/)
  })

  it('sets the field count in the label font, upper case', () => {
    expect(sheet).toMatch(/\.rec-count\{order:-1;font-family:var\(--font-label\),monospace;[^}]*text-transform:uppercase/)
  })

  it('lays the entities in two columns, beside a white panel, stacking below 900px', () => {
    expect(sheet).toMatch(/\.rec-tablist\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/)
    expect(sheet).toMatch(/\.rec-panel\{background:var\(--ncx-white\)/)
    expect(sheet).toMatch(/@media \(max-width:899\.98px\)\{\s*\.ncx-rec \.rec-body\{grid-template-columns:minmax\(0,1fr\)\}/)
  })

  it('uses brand variables only, no colour codes', () => {
    expect(sheet).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(/)
  })
})
