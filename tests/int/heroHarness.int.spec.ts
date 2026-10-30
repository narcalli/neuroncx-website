import fs from 'node:fs'
import path from 'node:path'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { drawingLabels, HEADER_EDGE_SCRIPT, harnessCards, HeroHarnessBlock, headlineLines, introText, shownButtons } from '@/blocks/HeroHarness/Component'
import {
  buildDrawing,
  groupState,
  landscapeRows,
  landscapeRowTops,
  layoutFor,
  portraitCells,
  type Drawing,
  type HarnessLabels,
  type Shape,
} from '@/blocks/HeroHarness/geometry'
import { cyclePlan, STEP } from '@/blocks/HeroHarness/loop'
import { BYOC_LEFT, PACE, STILL_STATUS, statusModeFor } from '@/blocks/HeroHarness/Stage'
import { stageCss } from '@/blocks/HeroHarness/styles'
import type { HeroHarnessBlock as Props } from '@/payload-types'

/** Hero (harness loop): the text, the cards and the drawing (static; motion comes next). */

const DEFAULTS: Partial<Props> = {
  textLayout: 'grid',
  eyebrow: 'Agentic CRM and CX platform',
  headline: 'An agentic rethink of CRM,\nmarketing automation and omnichannel CX.',
  intro: 'NeuronCx is a captive AI harness that goes beyond SaaS silos.',
  headingSize: 44,
  spacing: 'roomy',
  introWidth: 720,
  background: 'cloud',
}

const CARDS = [
  { title: 'Grounded in your enterprise ontology', highlights: ['ontology'], body: 'Agents read your locations, services, prices and rules.' },
  { title: 'Orchestrated agents that act on their own', highlights: ['orchestration', 'actions'], body: 'Orchestration routes each customer event.' },
  { title: 'Your own cloud, beyond SaaS', highlights: ['boundary'], body: 'The data layer runs inside your own cloud account.' },
] as Props['cards']

const render = (p: Partial<Props> = {}) =>
  renderToStaticMarkup(React.createElement(HeroHarnessBlock, { blockType: 'heroHarness', ...DEFAULTS, ...p } as Props))

describe('the title', () => {
  it('is the one H1, with each typed line break as a desktop-only break', () => {
    const html = render()
    expect(html.match(/<h1/g)).toHaveLength(1)
    expect(html).toContain('<h1>An agentic rethink of CRM,<br class="br"/> marketing automation and omnichannel CX.</h1>')
    expect(headlineLines('One\r\n\n  Two  ')).toEqual(['One', 'Two'])
  })

  it('takes its size from the CMS, capped to the allowed range', () => {
    expect(render()).toContain('--hh-h:44px')
    expect(render({ headingSize: 52 })).toContain('--hh-h:52px')
    expect(render({ headingSize: 90 })).toContain('--hh-h:56px')
    expect(render()).toContain('font-size:clamp(28px,3.1vw,var(--hh-h))')
  })
})

describe('the intro', () => {
  it('is one paragraph, with typed line breaks joined', () => {
    expect(introText('First line.\n\nSecond line.\r\nThird.')).toBe('First line. Second line. Third.')
    expect(render({ intro: 'One.\nTwo.' })).toContain('<p class="hh-intro">One. Two.</p>')
  })
})

describe('the layouts', () => {
  it('carries the layout, spacing and background for the CSS, centred and roomy by default', () => {
    expect(render()).toMatch(/<section class="ncx-hh" data-layout="grid" data-spacing="roomy" data-bg="cloud"/)
    expect(render({ textLayout: 'stack', spacing: 'compact', background: 'white' })).toMatch(
      /data-layout="stack" data-spacing="compact" data-bg="white"/,
    )
    expect(render({ textLayout: null, spacing: null, background: null } as unknown as Partial<Props>)).toMatch(
      /data-layout="centred" data-spacing="roomy" data-bg="cloud" data-width="site"/,
    )
  })

  it('shows the small label only in the stacked layout with a label', () => {
    expect(render()).not.toContain('hh-eyebrow">')
    expect(render({ textLayout: 'stack' })).not.toContain('hh-eyebrow">')
    expect(render({ textLayout: 'stackWithLabel' })).toContain('<p class="hh-eyebrow">Agentic CRM and CX platform</p><h1>')
  })

  it('sets the intro width for the stacked layouts, and the design spacing values', () => {
    expect(render({ introWidth: 640 })).toContain('--hh-intro-w:640px')
    const css = render()
    expect(css).toContain('--hh-top:clamp(32px,4.5vw,64px);--hh-gap:22px;--hh-stage:clamp(32px,4vw,56px)')
    expect(css).toContain('[data-spacing="compact"]{--hh-top:16px;--hh-gap:10px;--hh-stage:14px')
    expect(css).toContain('grid-template-columns:minmax(0,35fr) minmax(0,65fr)')
    // Grid: the intro fills its column, so it ends where the drawing panel ends.
    expect(css).toContain('[data-layout="grid"] .hh-body{grid-column:2;max-width:none}')
    // Centred: title and intro centred, the intro at most 860px, the same gaps.
    expect(css).toContain('[data-layout="centred"] .hh-text{align-items:center;text-align:center}')
    expect(css).toContain('[data-layout="centred"] .hh-body{align-items:center;max-width:860px}')
  })
})

describe('the buttons', () => {
  it('draw none by default, and only those with a label and an address, up to two', () => {
    expect(render()).not.toContain('class="hh-cta"')
    const html = render({
      buttons: [
        { type: 'custom', url: '/contact', label: 'Book a demo' },
        { type: 'custom', url: '', label: 'No address' },
        { type: 'custom', url: '/platform', label: 'See the platform', newTab: true },
      ],
    })
    expect(html).toContain('<a class="hh-btn hh-btn--primary" href="/contact">Book a demo</a>')
    expect(html).toContain('<a class="hh-btn hh-btn--ghost" href="/platform" target="_blank" rel="noopener noreferrer">See the platform</a>')
    expect(html).not.toContain('No address')
    expect(
      shownButtons([
        { type: 'reference', reference: { relationTo: 'pages', value: { slug: 'home' } as any }, label: 'Home' },
        { type: 'custom', url: '/a', label: 'A' },
        { type: 'custom', url: '/b', label: 'B' },
      ]).map((b) => b.href),
    ).toEqual(['/', '/a'])
  })
})

describe('the cards', () => {
  const html = () => render({ cards: CARDS })

  it('are tabs for the drawing panel, the first selected, only it in the Tab order', () => {
    const out = html()
    expect(out).toMatch(/<div class="hh-cards" role="tablist" aria-label="What the harness does" aria-orientation="vertical">/)
    expect(out.match(/role="tab"/g)).toHaveLength(3)
    const tabs = [...out.matchAll(/<button[^>]*role="tab"[^>]*>/g)].map((m) => m[0])
    expect(tabs[0]).toMatch(/aria-selected="true"/)
    expect(tabs[0]).toMatch(/tabindex="0"/)
    expect(tabs[1]).toMatch(/aria-selected="false"/)
    expect(tabs[1]).toMatch(/tabindex="-1"/)
    const panelId = out.match(/class="hh-panel" id="([^"]+)" role="tabpanel"/)![1]
    for (const t of tabs) expect(t).toContain(`aria-controls="${panelId}"`)
  })

  it('are named by their title, with the explanation in the server HTML, hidden on the card', () => {
    const out = html()
    const tab = out.match(/<button[^>]*role="tab"[^>]*>/)![0]
    const titleId = tab.match(/aria-labelledby="([^"]+)"/)![1]
    const bodyId = tab.match(/aria-describedby="([^"]+)"/)![1]
    expect(out).toContain(`<span class="hh-card-title" id="${titleId}">Grounded in your enterprise ontology</span>`)
    expect(out).toContain(`<span class="hh-sr" id="${bodyId}">Agents read your locations, services, prices and rules.</span>`)
    // The panel is named by the selected card's title.
    expect(out).toMatch(new RegExp(`role="tabpanel" aria-labelledby="${titleId}"`))
  })

  it('sit left of the drawing, or above it in one row', () => {
    expect(html()).toContain('data-cards="left"')
    const above = render({ cards: CARDS, cardsPosition: 'above' })
    expect(above).toContain('data-cards="above" data-level="on" style="--hh-cards:3"')
    expect(above).toContain('aria-orientation="horizontal"')
  })

  it('keep only cards with a title, at most six, and only known parts', () => {
    const cards = harnessCards([
      ...CARDS!,
      { title: '  ', highlights: ['loop'] },
      { title: 'Odd part', highlights: ['nonsense', 'loop'] as any },
      ...Array.from({ length: 4 }, (_, i) => ({ title: `Extra ${i}`, highlights: ['loop'] })),
    ] as Props['cards'])
    expect(cards).toHaveLength(6)
    expect(cards[3]).toEqual({ title: 'Odd part', body: '', highlights: ['loop'] })
  })

  it('draw nothing below the text without cards', () => {
    expect(render({ cards: [] as any })).not.toContain('class="hh-stage"')
  })
})

describe('the status and caption', () => {
  it('show the live status line and the selected card\'s caption with its lit parts', () => {
    const out = render({ cards: CARDS })
    expect(out).toContain('<span class="hh-live"><i aria-hidden="true" data-loop=""></i>Live loop</span>')
    expect(out).toContain(
      '<div class="hh-cap" data-on=""><p class="hh-cap-body">Agents read your locations, services, prices and rules.</p><ul class="hh-cap-tags"><li>Highlighted:</li><li class="hh-tag">Enterprise ontology</li></ul></div>',
    )
    // The BYOC card names the whole inside of the box.
    expect(out).toContain('<li>Highlighted: everything inside the dashed line</li>')
    // Parts use the drawing's label; the actions and the loop use the block's caption names.
    expect(out).toContain('<li class="hh-tag">Agent actions</li>')
    expect(render({ cards: CARDS, orchestrationLabel: 'Router' })).toContain('<li class="hh-tag">Router</li>')
    expect(render({ cards: CARDS, actionsName: 'What agents do' })).toContain('<li class="hh-tag">What agents do</li>')
    const loopCard = [{ title: 'Improves at your own pace', highlights: ['loop'], body: 'Outcomes feed back.' }] as Props['cards']
    expect(render({ cards: loopCard })).toContain('<li class="hh-tag">Learning loop</li>')
    expect(render({ cards: loopCard, loopName: 'Feedback loop' })).toContain('<li class="hh-tag">Feedback loop</li>')
  })

  it('are left out when turned off', () => {
    const out = render({ cards: CARDS, showStatus: false, showCaption: false })
    expect(out).not.toContain('class="hh-status"')
    expect(out).not.toContain('class="hh-caption"')
  })
})

/* The drawing */

const LABELS: HarnessLabels = drawingLabels({
  ontologyItems: [{ label: 'Locations' }, { label: 'Services' }, { label: 'Rules and terms' }],
  customer360Fields: [{ label: 'Profile' }, { label: 'History' }, { label: 'Next step' }, { label: 'Care gaps' }],
})
const flat = (items: Shape[]): Shape[] => items.flatMap((s) => (s.t === 'g' ? flat(s.items) : [s]))
const shapes = (d: Drawing) => flat([...d.lines, ...d.nodes].flatMap((g) => g.items))
const texts = (d: Drawing) => shapes(d).filter((s): s is Extract<Shape, { t: 'text' }> => s.t === 'text').map((s) => s.text)
const byK = (d: Drawing, k: string) => shapes(d).find((s) => 'k' in s && s.k === k)
const withActions = (n: number): HarnessLabels => ({ ...LABELS, actions: ['Qualify', 'Book and pay', 'Follow up', 'Campaigns', 'Collect'].slice(0, n) })

describe('the drawing', () => {
  it('is landscape at 480px of its own width and wider, portrait below', () => {
    expect(layoutFor(479)).toBe('portrait')
    expect(layoutFor(480)).toBe('landscape')
    const land = buildDrawing('landscape', LABELS)
    const port = buildDrawing('portrait', LABELS)
    expect([land.width, land.height, port.width, port.height]).toEqual([760, 380, 360, 620])
  })

  it('draws the box and its three doors first, then the lines, then the boxes and labels', () => {
    for (const layout of ['landscape', 'portrait'] as const) {
      const d = buildDrawing(layout, LABELS)
      expect(d.lines[0].parts).toEqual(['boundary'])
      expect(d.lines[0].items[0]).toMatchObject({ t: 'rect', cls: 'bound' })
      expect(d.lines[0].items.filter((s) => s.t === 'line' && s.cls === 'door-gap')).toHaveLength(3)
    }
    const land = buildDrawing('landscape', LABELS).lines[0].items.filter((s) => s.t === 'line' && s.cls === 'door-gap')
    // In from the event, the loop back in, the rail out to Customer 360.
    expect(land.map((s: any) => [s.x1, s.y1, s.x2, s.y2])).toEqual([
      [160, 192, 160, 210],
      [160, 61, 160, 79],
      [719, 318, 737, 318],
    ])
  })

  it('keeps the loop and the rail in their own lanes, and knocks the event arrow over the loop', () => {
    const land = buildDrawing('landscape', LABELS)
    expect(byK(land, 'loop')).toMatchObject({ d: 'M176 352H138V70H177' })
    expect(byK(land, 'out-0')).toMatchObject({ d: 'M712 143H728V329' })
    // The policy connector turns just under the policy box.
    expect(byK(land, 'policy')).toMatchObject({ d: 'M452 108V119H412V167' })
    const trigger = land.lines.find((g) => g.parts.join() === 'trigger')!
    expect(trigger.items[0]).toMatchObject({ t: 'path', cls: 'knock', d: 'M120 201H243' })
    const port = buildDrawing('portrait', LABELS)
    expect(byK(port, 'loop')).toMatchObject({ d: 'M34 551H6V155H33' })
    expect((byK(port, 'out-0') as any).d).toMatch(/H188V515$/)
  })

  it('has every label as real text, in both layouts', () => {
    for (const layout of ['landscape', 'portrait'] as const) {
      const all = texts(buildDrawing(layout, LABELS))
      for (const label of [
        'Customer event',
        'New enquiry',
        'BYOC',
        'Enterprise ontology',
        'Locations',
        'Rules and terms',
        'Policy framework',
        'Set by your team',
        'Guardrails',
        'Orchestration',
        'Agents',
        'Qualify',
        'Campaigns',
        'Team steps in',
        'Customer 360',
        'Care gaps',
      ])
        expect(all, `${layout}: ${label}`).toContain(label)
    }
    expect(texts(buildDrawing('landscape', LABELS))).toEqual(expect.arrayContaining(['Learns from', 'every outcome']))
    expect(texts(buildDrawing('portrait', LABELS))).toContain('Learns from every outcome')
  })

  it("keeps the reference's rows for four actions, and spaces 2 to 5 evenly in the gate", () => {
    expect(landscapeRowTops(5)).toEqual([130, 166, 202, 238, 274])
    for (const rows of [3, 4, 5, 6]) {
      const { tops, height } = landscapeRows(rows)
      expect(tops[0]).toBeGreaterThanOrEqual(118)
      expect(tops[rows - 1] + height).toBeLessThanOrEqual(312)
      const gaps = tops.slice(1).map((t, i) => t - tops[i])
      expect(new Set(gaps).size).toBe(1)
      // At least 10px between boxes.
      expect(gaps[0] - height).toBeGreaterThanOrEqual(10)
      // Every check mark (radius 7) inside the gate, y 123 to 308.
      expect(tops[0] + height / 2 - 7).toBeGreaterThanOrEqual(123)
      expect(tops[rows - 1] + height / 2 + 7).toBeLessThanOrEqual(308)
    }
    // 5 actions: shorter rows, the reference's 26px otherwise.
    expect(landscapeRows(6).height).toBe(24)
    expect(landscapeRows(5).height).toBe(26)
    // Portrait: the reference's cells for four actions, "Team steps in" across the bottom.
    expect(portraitCells(5).map((c) => [c.x, c.y, c.w])).toEqual([
      [34, 378, 148],
      [194, 378, 148],
      [34, 418, 148],
      [194, 418, 148],
      [34, 458, 308],
    ])
    for (const count of [3, 4, 5, 6]) {
      const cells = portraitCells(count)
      expect(cells[0].y).toBeGreaterThanOrEqual(370)
      expect(cells[count - 1].y + 30).toBeLessThanOrEqual(498)
      // 10px between rows.
      if (cells.length > 2) expect(cells[2].y - (cells[0].y + 30)).toBe(10)
    }
    // Five actions: "Team steps in" shares the last row.
    expect(portraitCells(6).at(-1)).toMatchObject({ col: 'right', x: 194, w: 148 })
  })

  it('centres every check mark and line on its action row, with 5 actions too', () => {
    for (const n of [4, 5]) {
      const d = buildDrawing('landscape', withActions(n))
      const boxes = shapes(d).filter((s): s is Extract<Shape, { t: 'rect' }> => s.t === 'rect' && (s.cls === 'abox' || s.cls === 'hbox'))
      const checks = shapes(d).filter((s): s is Extract<Shape, { t: 'circle' }> => s.t === 'circle' && s.cls === 'chk-c')
      boxes.forEach((box, i) => {
        const centre = box.y + box.h / 2
        expect(checks[i].cy, `check ${i}`).toBe(centre)
        expect((byK(d, `act-${i}`) as any).d, `line ${i}`).toMatch(new RegExp(` ${centre}H551$`))
        expect((byK(d, `out-${i}`) as any).d, `rail ${i}`).toBe(`M712 ${centre}H728V329`)
      })
    }
  })

  it('draws one action box, one gate path and one rail path per action, plus "Team steps in"', () => {
    for (const n of [2, 5]) {
      for (const layout of ['landscape', 'portrait'] as const) {
        const d = buildDrawing(layout, withActions(n))
        expect(shapes(d).filter((s) => s.t === 'rect' && (s.cls === 'abox' || s.cls === 'hbox'))).toHaveLength(n + 1)
        expect(byK(d, `act-${n}`)).toBeTruthy()
        expect(byK(d, `out-${n}`)).toBeTruthy()
        expect(byK(d, `act-${n + 1}`)).toBeUndefined()
      }
    }
  })

  it('wraps chips as the reference does, and makes Orchestration the only navy box', () => {
    const land = buildDrawing('landscape', LABELS)
    const chips = shapes(land).filter((s): s is Extract<Shape, { t: 'rect' }> => s.t === 'rect' && s.cls === 'chip-bg')
    // Ontology: two on the first row, "Rules and terms" on the second.
    expect(chips.slice(0, 3).map((c) => c.y)).toEqual([61, 61, 84])
    // Customer 360: one row.
    expect(new Set(chips.slice(3).map((c) => c.y))).toEqual(new Set([341]))
    expect(shapes(land).filter((s) => 'cls' in s && s.cls === 'orch-box')).toHaveLength(1)
  })
})

describe('the highlights', () => {
  it('light the selected parts, dim the rest, and leave everything as it is with nothing selected', () => {
    expect(groupState(['ontology'], ['ontology'])).toBe('on')
    expect(groupState(['actions', 'guardrails'], ['guardrails', 'policy'])).toBe('on')
    expect(groupState(['trigger'], ['ontology'])).toBe('dim')
    expect(groupState(['trigger'], [])).toBeNull()
  })

  it('keep everything inside the box at full strength for the BYOC card, and dim what is outside', () => {
    expect(groupState(['boundary'], ['boundary'])).toBe('on')
    expect(groupState(['orchestration'], ['boundary'])).toBeNull()
    expect(groupState(['actions', 'customer360'], ['boundary'])).toBeNull()
    expect(groupState(['customer360'], ['boundary'])).toBe('dim')
    expect(groupState(['loop'], ['boundary'])).toBe('dim')
  })

  it('are drawn as classes on the parts of both layouts, which carry the screen reader description', () => {
    const out = render({ cards: CARDS, screenReaderDescription: 'The harness, in words.' })
    expect(out.match(/<svg class="hh-svg hh-svg--(landscape|portrait)"[^>]*role="img" aria-label="The harness, in words."/g)).toHaveLength(2)
    expect(out).toContain('<g data-parts="ontology" class="is-on">')
    expect(out).toContain('<g data-parts="trigger" class="dim">')
  })
})

describe('registration', () => {
  const read = (file: string) => fs.readFileSync(path.resolve(process.cwd(), file), 'utf8')

  it('is drawn by RenderBlocks, flush, and sits flush under the header as a first block', () => {
    const blocks = read('src/blocks/RenderBlocks.tsx')
    expect(blocks).toContain('heroHarness: HeroHarnessBlock,')
    expect(blocks.slice(blocks.indexOf('const noMargin'))).toContain("'heroHarness',")
    expect(read('src/components/PageView/index.tsx')).toContain("'heroHarness',")
  })

  it('has the connector line colour token', () => {
    expect(read('src/app/(frontend)/globals.css')).toContain('--ncx-wire: #bcc4d4;')
  })
})

describe('the live loop', () => {
  const texts = { events: ['New enquiry', 'Payment due', 'Follow-up due'], actions: ['Qualify', 'Book and pay', 'Follow up', 'Campaigns'], fields: ['Profile', 'History', 'Next step', 'Care gaps'] }

  it('takes the next event and chip each cycle, moves down the actions, and hands over every third cycle', () => {
    const plans = Array.from({ length: 9 }, (_, c) => cyclePlan(c, texts))
    expect(plans.map((p) => p.event)).toEqual(['New enquiry', 'Payment due', 'Follow-up due', 'New enquiry', 'Payment due', 'Follow-up due', 'New enquiry', 'Payment due', 'Follow-up due'])
    expect(plans.map((p) => p.handover)).toEqual([false, false, true, false, false, true, false, false, true])
    // "Team steps in" is the row after the actions.
    expect(plans.map((p) => p.action)).toEqual([0, 1, 4, 2, 3, 4, 0, 1, 4])
    expect(plans.map((p) => p.field)).toEqual([0, 1, 2, 3, 0, 1, 2, 3, 0])
    expect(cyclePlan(0, { ...texts, fields: [] }).field).toBe(-1)
  })

  it('names each step in the status line', () => {
    expect(STEP.event('New enquiry')).toEqual(['Event in', 'New enquiry'])
    expect(STEP.orchestration).toEqual(['Orchestration', 'Reading ontology and policy'])
    expect(STEP.passed('Qualify')).toEqual(['Guardrails', 'Passed, agent runs Qualify'])
    expect(STEP.handover).toEqual(['Guardrails', 'Outside policy, so your team steps in'])
    expect(STEP.record('Profile')).toEqual(['Customer 360', 'Updating Profile'])
    expect(STEP.learning).toEqual(['Learning loop', 'Outcome feeds back into ontology and policy'])
  })

  it('scales every duration with the Speed switch', () => {
    expect(PACE).toEqual({ slower: 1.4, normal: 1, faster: 0.75 })
  })
})

describe('the motion levels', () => {
  it('on: the first card selected and the live status line', () => {
    const out = render({ cards: CARDS })
    expect(out).toContain('data-level="on"')
    expect(out).toMatch(/<button[^>]*aria-selected="true"/)
    expect(out).not.toContain(STILL_STATUS.off)
  })

  it('reduced: highlights only, said in the status line', () => {
    const out = render({ cards: CARDS, motion: 'reduced' })
    expect(out).toContain('data-level="reduced"')
    expect(out).toContain(`<span class="hh-status-text">${STILL_STATUS.reduced}</span>`)
    expect(out).toMatch(/<button[^>]*aria-selected="true"/)
  })

  it('off: no card selected, nothing dimmed, a still view', () => {
    const out = render({ cards: CARDS, motion: 'off' })
    expect(out).toContain('data-level="off"')
    expect(out).toContain(`<span class="hh-status-text">${STILL_STATUS.off}</span>`)
    expect(out).not.toMatch(/<button[^>]*aria-selected="true"/)
    expect(out).not.toContain('class="dim"')
    expect(out).not.toContain('class="is-on"')
    expect(out).toContain('<div class="hh-cap" data-on=""><p class="hh-cap-body">Select a card to highlight that part of the harness.</p></div>')
  })
})

describe('the width', () => {
  it('keeps the site column by default, with no script', () => {
    const out = render({ cards: CARDS })
    expect(out).toContain('data-width="site"')
    expect(out).not.toContain('<script')
  })

  it("matches the header: reads the header bar's own side padding before the hero is drawn, from 760px up", () => {
    const out = render({ cards: CARDS, blockWidth: 'header' })
    expect(out).toContain('data-width="header"')
    expect(out).toContain('<script>' + HEADER_EDGE_SCRIPT + '</script>')
    expect(HEADER_EDGE_SCRIPT).toContain("document.querySelector('.ncx-nav__in')")
    expect(HEADER_EDGE_SCRIPT).toContain('cs.paddingLeft')
    expect(HEADER_EDGE_SCRIPT).toContain('cs.paddingRight')
    expect(HEADER_EDGE_SCRIPT).toContain('@media (min-width:760px)')
    // No gutter number of its own.
    expect(HEADER_EDGE_SCRIPT).not.toMatch(/padding-(left|right):\d/)
  })

  it('runs the drawing the full width of its panel', () => {
    expect(stageCss).not.toContain('max-width:880px')
  })
})

describe('the cards beside the drawing', () => {
  it('are as tall as the panel from 900px, sharing it evenly, titles centred, at least 48px each', () => {
    expect(stageCss).toContain('.hh-stage[data-cards="left"]{align-items:stretch}')
    expect(stageCss).toContain('.hh-stage[data-cards="left"] .hh-cards{height:100%}')
    expect(stageCss).toContain('.hh-stage[data-cards="left"] .hh-card{flex:1 1 0;justify-content:center;min-height:48px}')
  })
})

describe('the status line placement', () => {
  it('sits above a portrait drawing, in the corner of a mid-size one, and above a wide one at the BYOC box', () => {
    expect(statusModeFor('portrait', 1200)).toBe('row')
    expect(statusModeFor('landscape', 800)).toBe('corner')
    expect(statusModeFor('landscape', 801)).toBe('wide')
    expect(BYOC_LEFT).toBe(160)
    expect(stageCss).toContain('padding-left:var(--hh-box-left,0px)')
    // Before the page is interactive, the same line from the drawing's width.
    expect(stageCss).toContain('padding-left:calc(100cqw * 160 / 760)')
  })
})

describe('the lit boxes', () => {
  it('have a crimson 1.5px outline on the crimson tint', () => {
    for (const cls of ['box', 'abox', 'hbox']) {
      expect(stageCss).toContain(`.is-on .${cls}{stroke:var(--ncx-crimson);stroke-width:1.5;fill:var(--ncx-crimson-tint)}`)
    }
  })
})
