import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { AgentFeatures } from '@/blocks/AgenticFlowDemo/AgentFeatures'
import { accentVars, designClasses, designVars, nextEvent, resolveDesign } from '@/blocks/AgenticFlowDemo/design'
import { eventLinks } from '@/blocks/AgenticFlowDemo/eventLinks'
import { featureFamilies } from '@/blocks/AgenticFlowDemo/featureData'
import { FlowDemo } from '@/blocks/AgenticFlowDemo/FlowDemo'
import type { AgenticFlowDemoBlock, MicroApp } from '@/payload-types'

/** The Agentic Flow Demo's Design tab, as the page draws it. */

const h = React.createElement
const events = [
  { id: 'e1', label: 'Payment due', triggerTitle: 'T1', triggerText: 't1', routeText: 'r1', handlers: ['agent'], resolveTitle: 'R1', resolveText: 'x1' },
  { id: 'e2', label: 'Prescription photo', triggerTitle: 'T2', triggerText: 't2', routeText: 'r2', handlers: ['agent', 'human'], resolveTitle: 'R2', resolveText: 'x2' },
] as NonNullable<AgenticFlowDemoBlock['events']>
const flow = (block: Partial<AgenticFlowDemoBlock>, links = {}) =>
  renderToStaticMarkup(
    h(FlowDemo, {
      heading: 'H',
      events,
      footnote: 'Illustrative run, not live data.',
      design: resolveDesign({ mode: 'flow', ...block }, events.length),
      links,
    }),
  )

describe('the defaults: the look from before the Design tab', () => {
  it('in Flow mode', () => {
    expect(resolveDesign({}, 2)).toEqual({
      prompt: 'Pick an event and watch it travel through.',
      stageLabels: ['Trigger', 'Route', 'Resolve'],
      handlerLabels: { agent: 'Virtual agent', human: 'Human team' },
      showFootnote: true,
      accents: ['crimson', 'crimson', 'teal'],
      cardShadow: true,
      equalHeights: true,
      lineStyle: 'animated',
      lineColor: 'grey',
      selectedStyle: 'solidCrimson',
      compact: false,
      panelBackground: 'cloud',
      panelBorder: true,
      autoplay: null,
      startIndex: 0,
    })
  })

  it('in Agent features mode: its own eyebrows, a still crimson line', () => {
    expect(resolveDesign({ mode: 'agentFeatures' })).toMatchObject({
      stageLabels: ['What it does', 'Features', 'Saves to your systems'],
      lineStyle: 'static',
      lineColor: 'crimson',
      autoplay: null,
    })
  })

  it('as the CMS fills them in for a block saved before the tab, too', () => {
    const saved = resolveDesign({
      promptLabel: 'Pick an event and watch it travel through.',
      stageLabels: { trigger: null, route: null, resolve: null },
      handlerLabels: { agent: 'Virtual agent', human: 'Human team' },
      showFootnote: true,
      accents: { card1: 'crimson', card2: 'crimson', card3: 'teal' },
      cardShadow: true,
      equalHeights: true,
      selectedStyle: 'solidCrimson',
      buttonSize: 'regular',
      panelBackground: 'cloud',
      panelBorder: true,
      autoplay: 'off',
      startEvent: 1,
    }, 2)
    expect(saved).toEqual(resolveDesign({}, 2))
  })

  it('add no option classes except the line style', () => {
    expect(designClasses(resolveDesign({}))).toBe('fd-line-animated')
    expect(designClasses(resolveDesign({ mode: 'agentFeatures' }))).toBe('fd-line-static')
  })
})

describe('the options', () => {
  it('labels: an emptied prompt hides it; empty eyebrows and tags fall back', () => {
    expect(resolveDesign({ promptLabel: '' }).prompt).toBeNull()
    expect(resolveDesign({ promptLabel: null }).prompt).toBeNull()
    expect(resolveDesign({ stageLabels: { trigger: 'When', route: ' ', resolve: 'Then' } }).stageLabels).toEqual(['When', 'Route', 'Then'])
    expect(resolveDesign({ handlerLabels: { agent: 'Bot', human: '' } }).handlerLabels).toEqual({ agent: 'Bot', human: 'Human team' })
  })

  it('cards, line, buttons and panel become classes and colours', () => {
    const d = resolveDesign({
      accents: { card1: 'navy', card2: 'grey', card3: 'crimson' },
      cardShadow: false,
      equalHeights: false,
      lineStyle: 'none',
      lineColor: 'navy',
      selectedStyle: 'outline',
      buttonSize: 'compact',
      panelBackground: 'none',
      panelBorder: false,
    })
    expect(designClasses(d)).toBe('fd-compact fd-noshadow fd-top fd-line-none fd-bare')
    // A border, or a background, still marks the panel: it keeps its padding.
    expect(designClasses(resolveDesign({ panelBackground: 'none' }))).toBe('fd-line-animated')
    expect(designVars(d)).toMatchObject({
      '--fd-panel-bg': 'transparent',
      '--fd-panel-border': '1px solid transparent',
      '--fd-line': 'var(--ncx-navy)',
      '--fd-sel-bg': 'var(--ncx-white)',
      '--fd-sel-border': 'var(--ncx-crimson)',
      '--fd-sel-ring': '0 0 0 1px var(--ncx-crimson)',
    })
    expect(accentVars('navy')).toEqual({ '--acc': 'var(--ncx-navy)', '--acc-ink': 'var(--ncx-navy)' })
    expect(accentVars('teal')).toEqual({ '--acc': 'var(--ncx-teal)', '--acc-ink': 'var(--ncx-teal-ink)' })
    expect(accentVars('grey')).toEqual({ '--acc': '#6B7280', '--acc-ink': '#6B7280' })
  })

  it('the default colours are the ones the sheet used before', () => {
    expect(designVars(resolveDesign({}))).toEqual({
      '--fd-panel-bg': 'var(--ncx-cloud)',
      '--fd-panel-border': '1px solid var(--ncx-rule)',
      '--fd-line': 'var(--ncx-rule)',
      '--fd-dot': 'var(--ncx-crimson)',
      '--fd-sel-bg': 'var(--ncx-crimson)',
      '--fd-sel-border': 'var(--ncx-crimson)',
      '--fd-sel-text': 'var(--ncx-on-navy)',
      '--fd-sel-ring': 'none',
      '--fd-chip': 'var(--ncx-crimson)',
      '--fd-chip-ink': 'var(--ncx-crimson-ink)',
    })
  })

  it('behaviour: autoplay seconds in Flow mode only, and the first event within range', () => {
    expect(resolveDesign({ autoplay: '8' }).autoplay).toBe(8)
    expect(resolveDesign({ autoplay: 'off' }).autoplay).toBeNull()
    expect(resolveDesign({ mode: 'agentFeatures', autoplay: '6' }).autoplay).toBeNull()
    expect(resolveDesign({ startEvent: 2 }, 2).startIndex).toBe(1)
    expect(resolveDesign({ startEvent: 4 }, 2).startIndex).toBe(0)
    expect([nextEvent(0, 3), nextEvent(2, 3), nextEvent(0, 0)]).toEqual([1, 0, 0])
  })
})

describe('Flow mode on the page', () => {
  it('draws the labels, the start event and each card accent', () => {
    const html = flow({
      promptLabel: 'Choose one',
      stageLabels: { trigger: 'When', route: 'Who', resolve: 'Then' },
      handlerLabels: { agent: 'Bot', human: 'Staff' },
      accents: { card1: 'navy', card2: 'grey', card3: 'crimson' },
      startEvent: 2,
    })
    expect(html).toContain('<p class="lab-q">Choose one</p>')
    expect(html).toMatch(/aria-pressed="false">Payment due<\/button><button type="button" class="tb" aria-pressed="true">Prescription photo/)
    expect(html).toMatch(/class="node n-trig on" style="--acc:var\(--ncx-navy\);--acc-ink:var\(--ncx-navy\)"><span class="tag">When<\/span><b>T2<\/b>/)
    expect(html).toMatch(/class="node n-route on" style="--acc:#6B7280;--acc-ink:#6B7280"><span class="tag">Who<\/span>/)
    expect(html).toContain('<span class="on">Bot</span><span class="on">Staff</span>')
    expect(html).toMatch(/class="node n-res ok on" style="--acc:var\(--ncx-crimson\)[^"]*"><span class="tag">Then<\/span>/)
  })

  it('hides the prompt and the note when asked, and draws no line with none', () => {
    const html = flow({ promptLabel: '', showFootnote: false, lineStyle: 'none' })
    expect(html).not.toContain('class="lab-q"')
    expect(html).not.toContain('Illustrative run')
    expect(html).not.toContain('<svg class="stage-svg"')
    expect(flow({})).toContain('<svg class="stage-svg"')
  })

  it("shows the selected event's link under the resolve card", () => {
    const html = flow({}, { e1: { label: 'See the payment flow', href: '/payments', newTab: false } })
    expect(html).toMatch(/<div class="stage-foot"><a class="ev-link" href="\/payments">See the payment flow →<\/a><\/div>/)
    expect(flow({ startEvent: 2 }, { e1: { label: 'x', href: '/x', newTab: false } })).not.toContain('class="stage-foot"')
  })
})

describe('event links', () => {
  const ev = (link: unknown) => [{ ...events[0], link }] as NonNullable<AgenticFlowDemoBlock['events']>

  it('go to a page, the home page, a URL, or an agent with its own page', () => {
    expect(eventLinks(ev({ label: 'Pricing', type: 'reference', reference: { relationTo: 'pages', value: { slug: 'pricing' } } }))).toEqual({
      e1: { label: 'Pricing', href: '/pricing', newTab: false },
    })
    expect(eventLinks(ev({ label: 'Home', type: 'reference', reference: { relationTo: 'pages', value: { slug: 'home' } } })).e1.href).toBe('/')
    expect(eventLinks(ev({ label: 'Docs', type: 'custom', url: 'https://docs.example.com', newTab: true }))).toEqual({
      e1: { label: 'Docs', href: 'https://docs.example.com', newTab: true },
    })
    const agent = { slug: 'payment-services', status: 'live', hasOwnPage: true }
    expect(eventLinks(ev({ label: 'Agent', type: 'reference', reference: { relationTo: 'microApps', value: agent } })).e1.href).toBe(
      '/bot-swarm/payment-services',
    )
  })

  it('are left out without text, without a target, or for an agent with no page', () => {
    expect(eventLinks(ev({ label: '', type: 'custom', url: '/x' }))).toEqual({})
    expect(eventLinks(ev({ label: 'Go', type: 'custom', url: '' }))).toEqual({})
    expect(eventLinks(ev({ label: 'Go', type: 'reference', reference: { relationTo: 'pages', value: 'an-id-only' } }))).toEqual({})
    const noPage = { slug: 'recover', status: 'live', hasOwnPage: false }
    expect(eventLinks(ev({ label: 'Go', type: 'reference', reference: { relationTo: 'microApps', value: noPage } }))).toEqual({})
  })
})

describe('Agent features mode on the page', () => {
  const agents = [
    { id: 'a1', name: 'Payment services', slug: 'p', status: 'live', family: 'f1', channel: ['whatsapp'], handsOver: 'Yes', keyPoints: [] },
  ] as unknown as MicroApp[]
  const render = (block: Partial<AgenticFlowDemoBlock>) =>
    renderToStaticMarkup(
      h(AgentFeatures, {
        heading: 'H',
        families: featureFamilies([], [{ id: 'f1', name: 'Book and get paid' }], agents),
        pickFamilyLabel: 'Pick a family',
        pickAgentLabel: 'Agents',
        design: resolveDesign({ mode: 'agentFeatures', ...block }),
      }),
    )

  it('takes the eyebrows, tags, accents and option classes', () => {
    const html = render({
      stageLabels: { trigger: 'Job', route: 'Can do', resolve: 'Keeps' },
      handlerLabels: { agent: 'Bot', human: 'Staff' },
      accents: { card1: 'teal', card2: 'navy', card3: 'grey' },
      selectedStyle: 'solidNavy',
      buttonSize: 'compact',
      cardShadow: false,
    })
    expect(html).toMatch(/<section class="ncx-flow ncx-flow--features fd-compact fd-noshadow fd-line-static" style="[^"]*--fd-sel-bg:var\(--ncx-navy\)/)
    expect(html).toMatch(/class="node on" style="--acc:var\(--ncx-teal\)[^"]*"><span class="tag">Job</)
    expect(html).toMatch(/class="node on" style="--acc:var\(--ncx-navy\)[^"]*"><span class="tag">Can do</)
    expect(html).toMatch(/class="node ok on" style="--acc:#6B7280[^"]*"><span class="tag">Keeps</)
    expect(html).toMatch(/<span class="on"[^>]*>Bot<\/span><span class="on"[^>]*>Staff<\/span>/)
  })

  it('draws the measured line for the shown agent only when animated', () => {
    expect(render({})).not.toContain('<svg class="stage-svg"')
    expect(render({ lineStyle: 'animated' }).match(/<svg class="stage-svg"/g)).toHaveLength(1)
  })
})
