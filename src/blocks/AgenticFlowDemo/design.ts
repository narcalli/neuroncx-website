import type React from 'react'

import type { AgenticFlowDemoBlock } from '@/payload-types'

/**
 * The block's Design tab (neuroncx-cms src/blocks/AgenticFlowDemo/config.ts)
 * resolved to what the page draws, both modes. Every option left as saved
 * before the tab existed, or empty, gives the block's look from before it:
 * where that look differs by mode (the card eyebrows, the line), empty means
 * "as this mode looks by default".
 */

export type Mode = 'flow' | 'agentFeatures'
export type AccentName = 'crimson' | 'navy' | 'teal' | 'grey'
export type LineStyle = 'animated' | 'static' | 'none'

/**
 * The colour presets, as brand colours. Teal is the brand teal token
 * (#136B74), which the third card has always used. Grey has no token: it is
 * #6B7280 for a card, and for the line the hairline grey the line has always
 * been.
 */
const ACCENTS: Record<AccentName, { color: string; ink: string }> = {
  crimson: { color: 'var(--ncx-crimson)', ink: 'var(--ncx-crimson-ink)' },
  navy: { color: 'var(--ncx-navy)', ink: 'var(--ncx-navy)' },
  teal: { color: 'var(--ncx-teal)', ink: 'var(--ncx-teal-ink)' },
  grey: { color: '#6B7280', ink: '#6B7280' },
}

const LINE_COLORS = {
  grey: { line: 'var(--ncx-rule)', dot: 'var(--ncx-crimson)' },
  crimson: { line: 'var(--ncx-crimson)', dot: 'var(--ncx-crimson)' },
  navy: { line: 'var(--ncx-navy)', dot: 'var(--ncx-navy)' },
} as const

const SELECTED = {
  solidCrimson: { bg: 'var(--ncx-crimson)', border: 'var(--ncx-crimson)', text: 'var(--ncx-on-navy)', ring: 'none', chip: 'var(--ncx-crimson)', chipInk: 'var(--ncx-crimson-ink)' },
  solidNavy: { bg: 'var(--ncx-navy)', border: 'var(--ncx-navy)', text: 'var(--ncx-on-navy)', ring: 'none', chip: 'var(--ncx-navy)', chipInk: 'var(--ncx-navy)' },
  outline: {
    bg: 'var(--ncx-white)',
    border: 'var(--ncx-crimson)',
    text: 'var(--ncx-crimson-ink)',
    ring: '0 0 0 1px var(--ncx-crimson)',
    chip: 'var(--ncx-crimson)',
    chipInk: 'var(--ncx-crimson-ink)',
  },
} as const

const PANEL_BG = { cloud: 'var(--ncx-cloud)', white: 'var(--ncx-white)', none: 'transparent' } as const

export const STAGE_LABELS: Record<Mode, [string, string, string]> = {
  flow: ['Trigger', 'Route', 'Resolve'],
  agentFeatures: ['What it does', 'Features', 'Saves to your systems'],
}

export const DEFAULT_PROMPT = 'Pick an event and watch it travel through.'

export type Design = {
  /** Flow mode's line above the buttons; null hides it. */
  prompt: string | null
  stageLabels: [string, string, string]
  handlerLabels: { agent: string; human: string }
  showFootnote: boolean
  accents: [AccentName, AccentName, AccentName]
  cardShadow: boolean
  equalHeights: boolean
  lineStyle: LineStyle
  lineColor: keyof typeof LINE_COLORS
  selectedStyle: keyof typeof SELECTED
  compact: boolean
  panelBackground: keyof typeof PANEL_BG
  panelBorder: boolean
  /** Seconds between events, or null for off. Flow mode only. */
  autoplay: number | null
  /** The event shown first, 0-based, within the events there are. */
  startIndex: number
}

const pick = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T =>
  allowed.includes(value as T) ? (value as T) : fallback

const text = (value: unknown): string | null => (typeof value === 'string' && value.trim() ? value.trim() : null)

export const resolveDesign = (block: Partial<AgenticFlowDemoBlock>, eventCount = 0): Design => {
  const mode: Mode = block.mode === 'agentFeatures' ? 'agentFeatures' : 'flow'
  const defaults = STAGE_LABELS[mode]
  const labels = (block.stageLabels ?? {}) as Record<string, unknown>
  const accents = (block.accents ?? {}) as Record<string, unknown>
  const accentNames = Object.keys(ACCENTS) as AccentName[]
  const start = Math.floor(Number(block.startEvent) || 1)
  const seconds = Number(block.autoplay)
  return {
    // A saved empty prompt hides it; a block saved before the option existed has none and keeps it.
    prompt: block.promptLabel === undefined ? DEFAULT_PROMPT : text(block.promptLabel),
    stageLabels: [text(labels.trigger) ?? defaults[0], text(labels.route) ?? defaults[1], text(labels.resolve) ?? defaults[2]],
    handlerLabels: {
      agent: text(block.handlerLabels?.agent) ?? 'Virtual agent',
      human: text(block.handlerLabels?.human) ?? 'Human team',
    },
    showFootnote: block.showFootnote !== false,
    accents: [
      pick(accents.card1, accentNames, 'crimson'),
      pick(accents.card2, accentNames, 'crimson'),
      pick(accents.card3, accentNames, 'teal'),
    ],
    cardShadow: block.cardShadow !== false,
    equalHeights: block.equalHeights !== false,
    lineStyle: pick(block.lineStyle, ['animated', 'static', 'none'] as const, mode === 'flow' ? 'animated' : 'static'),
    lineColor: pick(block.lineColor, ['grey', 'crimson', 'navy'] as const, mode === 'flow' ? 'grey' : 'crimson'),
    selectedStyle: pick(block.selectedStyle, ['solidCrimson', 'solidNavy', 'outline'] as const, 'solidCrimson'),
    compact: block.buttonSize === 'compact',
    panelBackground: pick(block.panelBackground, ['cloud', 'white', 'none'] as const, 'cloud'),
    panelBorder: block.panelBorder !== false,
    autoplay: mode === 'flow' && [6, 8, 10].includes(seconds) ? seconds : null,
    startIndex: eventCount && start >= 1 && start <= eventCount ? start - 1 : 0,
  }
}

/** The section's class names: only the options that differ from the block's default look add one. */
export const designClasses = (d: Design): string =>
  [
    d.compact ? 'fd-compact' : '',
    d.cardShadow ? '' : 'fd-noshadow',
    d.equalHeights ? '' : 'fd-top',
    `fd-line-${d.lineStyle}`,
    // No background and no border: nothing marks the panel, so its content lines up with the heading.
    d.panelBackground === 'none' && !d.panelBorder ? 'fd-bare' : '',
  ]
    .filter(Boolean)
    .join(' ')

/** The section's colours, as custom properties the shared CSS reads. */
export const designVars = (d: Design): React.CSSProperties => {
  const sel = SELECTED[d.selectedStyle]
  const line = LINE_COLORS[d.lineColor]
  return {
    '--fd-panel-bg': PANEL_BG[d.panelBackground],
    '--fd-panel-border': d.panelBorder ? '1px solid var(--ncx-rule)' : '1px solid transparent',
    '--fd-line': line.line,
    '--fd-dot': line.dot,
    '--fd-sel-bg': sel.bg,
    '--fd-sel-border': sel.border,
    '--fd-sel-text': sel.text,
    '--fd-sel-ring': sel.ring,
    '--fd-chip': sel.chip,
    '--fd-chip-ink': sel.chipInk,
  } as React.CSSProperties
}

/** One card's accent: its border, eyebrow and shadow tint. */
export const accentVars = (name: AccentName): React.CSSProperties =>
  ({ '--acc': ACCENTS[name].color, '--acc-ink': ACCENTS[name].ink }) as React.CSSProperties

/** The next event for autoplay, wrapping round. */
export const nextEvent = (index: number, count: number): number => (count ? (index + 1) % count : 0)
