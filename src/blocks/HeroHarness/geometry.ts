/**
 * The harness drawing, as data: every box, line, chip and label of the two
 * layouts, ported from drawLand() and drawPortrait() in
 * docs/reference/harness-hero-demo.html with the same coordinates. Pure, so
 * the server and the browser lay it out the same way, and tests can check it.
 *
 * Landscape is 760 x 380, for a drawing 480px wide or more; portrait is
 * 376 x 620, below that, which gives the BYOC box (x 22 to 354) the same
 * space on both sides, with the loop lane in the left margin. Inside the dashed BYOC box: ontology, policy,
 * orchestration, the guardrails gate, the actions and "Team steps in".
 * Outside: the customer event, Customer 360 and the learning loop.
 *
 * No line runs along the dashed edge. The loop has its own lane outside the
 * box (landscape x 138, portrait x 6), and the actions leave by one rail
 * (landscape x 728, portrait x 188). Where a line crosses the edge, the
 * dashes open in a "door". Draw order: the box and its doors, then lines,
 * then boxes and labels; moving dots go on a layer above (Stage.tsx).
 *
 * The CMS checks the chip and loop label lengths with the same numbers
 * (neuroncx-cms src/blocks/HeroHarness/fit.ts).
 */

export type Part =
  | 'trigger'
  | 'boundary'
  | 'ontology'
  | 'policy'
  | 'guardrails'
  | 'orchestration'
  | 'actions'
  | 'handover'
  | 'customer360'
  | 'loop'

export const PARTS: Part[] = [
  'trigger',
  'boundary',
  'ontology',
  'policy',
  'guardrails',
  'orchestration',
  'actions',
  'handover',
  'customer360',
  'loop',
]

/** Everything inside the dashed box: kept at full strength when the box itself is highlighted. */
export const INSIDE = new Set<Part>(['ontology', 'policy', 'orchestration', 'guardrails', 'actions', 'handover'])

export type HarnessLabels = {
  triggerLabel: string
  triggerEvents: string[]
  boundaryLabel: string
  ontologyLabel: string
  ontologyItems: string[]
  policyLabel: string
  policySub: string
  guardrailsLabel: string
  orchestrationLabel: string
  orchestrationSubLabel: string
  actions: string[]
  handoverLabel: string
  customer360Label: string
  customer360Fields: string[]
  loopLabel: string
  /** The caption's names for the actions and the loop, which have no label in the drawing. */
  actionsName: string
  loopName: string
}

/**
 * A shape. `k` names the shapes the motion step moves or flashes: the dot
 * paths (trigger, ontology, policy, act-i, out-i, loop), the orchestration
 * halo, the gate checks (check-i), the action and chip flashes (action-i,
 * field-i), the loop label background and the event text.
 */
export type Shape =
  | { t: 'rect'; x: number; y: number; w: number; h: number; rx?: number; cls: string; k?: string }
  | { t: 'path'; d: string; cls: string; k?: string }
  | { t: 'line'; x1: number; y1: number; x2: number; y2: number; cls: string }
  | { t: 'circle'; cx: number; cy: number; r: number; cls: string; k?: string }
  | { t: 'text'; x: number; y: number; text: string; cls: string; anchor?: 'middle'; k?: string }
  | { t: 'g'; transform?: string; items: Shape[] }

/** A group of shapes and the parts it belongs to (empty for none). */
export type Group = { parts: Part[]; items: Shape[] }

export type Layout = 'landscape' | 'portrait'

export type Drawing = { layout: Layout; width: number; height: number; lines: Group[]; nodes: Group[] }

/** Measures text in a class of the drawing at a font size; the browser measures for real once fonts load. */
export type Measure = (text: string, cls: 'chip-t' | 'loop-t', fontSize: number) => number

/** The drawing's labels and chips are in IBM Plex Mono: every letter is 0.6 of the font size wide. */
export const monoMeasure: Measure = (text, cls, fontSize) => text.length * fontSize * (0.6 + (cls === 'loop-t' ? 0.03 : 0))

/** A drawing 480px wide or more is landscape. */
export const PORTRAIT_BELOW = 480
export const layoutFor = (width: number): Layout => (width < PORTRAIT_BELOW ? 'portrait' : 'landscape')

/* Builders */

class Builder {
  lines: Group[] = []
  nodes: Group[] = []
  constructor(readonly measure: Measure) {}
  line(parts: Part[] = []) {
    const g: Group = { parts, items: [] }
    this.lines.push(g)
    return g.items
  }
  node(parts: Part[] = []) {
    const g: Group = { parts, items: [] }
    this.nodes.push(g)
    return g.items
  }
}

type Dir = 'r' | 'l' | 'd'

/** A small arrow head at the end of a line. */
const chev = (x: number, y: number, dir: Dir, cls = 'ln'): Shape => ({
  t: 'path',
  cls,
  d: {
    r: `M${x - 6} ${y - 4}L${x} ${y}L${x - 6} ${y + 4}`,
    l: `M${x + 6} ${y - 4}L${x} ${y}L${x + 6} ${y + 4}`,
    d: `M${x - 4} ${y - 6}L${x} ${y}L${x + 4} ${y - 6}`,
  }[dir],
})

/** A "door": the dashed edge opens where a line passes through, so lines never sit on the dashes. */
const door = (x: number, y: number, o: 'v' | 'h'): Shape[] => {
  const L = 9
  return o === 'v'
    ? [
        { t: 'line', x1: x, y1: y - L, x2: x, y2: y + L, cls: 'door-gap' },
        { t: 'line', x1: x - 4, y1: y - L, x2: x + 4, y2: y - L, cls: 'door-cap' },
        { t: 'line', x1: x - 4, y1: y + L, x2: x + 4, y2: y + L, cls: 'door-cap' },
      ]
    : [
        { t: 'line', x1: x - L, y1: y, x2: x + L, y2: y, cls: 'door-gap' },
        { t: 'line', x1: x - L, y1: y - 4, x2: x - L, y2: y + 4, cls: 'door-cap' },
        { t: 'line', x1: x + L, y1: y - 4, x2: x + L, y2: y + 4, cls: 'door-cap' },
      ]
}

/** One chip: a pill sized to its text, with a flash layer for the motion step. */
const chip = (b: Builder, x: number, y: number, label: string, h: number, pad: number, fontSize: number, k?: string) => {
  const w = Math.ceil(b.measure(label, 'chip-t', fontSize)) + pad * 2
  const shapes: Shape[] = [
    { t: 'rect', x, y, w, h, rx: h / 2, cls: 'chip-bg' },
    { t: 'rect', x, y, w, h, rx: h / 2, cls: 'flash', k },
    { t: 'text', x: x + pad, y: y + h / 2 + 3.6, text: label, cls: 'chip-t' },
  ]
  return { w, shapes }
}

/** Chips left to right, starting a new row when the next one would pass maxW (chipRow() in the reference). */
const chipRow = (
  b: Builder,
  x: number,
  y: number,
  maxW: number,
  labels: string[],
  h: number,
  pad: number,
  gap: number,
  fontSize: number,
  flashKey?: string,
): Shape[] => {
  const out: Shape[] = []
  let cx = x
  let cy = y
  labels.forEach((label, i) => {
    const k = flashKey ? `${flashKey}-${i}` : undefined
    const w = Math.ceil(b.measure(label, 'chip-t', fontSize)) + pad * 2
    if (cx > x && cx + w > x + maxW) {
      cx = x
      cy += h + 4
    }
    out.push(...chip(b, cx, cy, label, h, pad, fontSize, k).shapes)
    cx += w + gap
  })
  return out
}

/** A gate check mark, with a flash layer. */
const check = (x: number, y: number, i: number): Shape => ({
  t: 'g',
  items: [
    { t: 'circle', cx: x, cy: y, r: 7, cls: 'chk-c' },
    { t: 'circle', cx: x, cy: y, r: 7, cls: 'chk-f', k: `check-${i}` },
    { t: 'path', d: `M${x - 3} ${y}l2.2 2.4L${x + 3.4} ${y - 2.6}`, cls: 'chk-p' },
  ],
})

/** An action box, or the dashed "Team steps in" box with a person mark (action() in the reference). */
const actionBox = (b: Builder, x: number, y: number, w: number, h: number, label: string, i: number, handover: boolean, portrait: boolean) => {
  const items = b.node([handover ? 'handover' : 'actions'])
  if (handover) {
    const px = x + 14
    const py = y + h / 2
    items.push(
      { t: 'rect', x, y, w, h, rx: 10, cls: 'hbox' },
      { t: 'rect', x, y, w, h, rx: 10, cls: 'flash', k: `action-${i}` },
      { t: 'circle', cx: px, cy: py - 4, r: 3.2, cls: 'person' },
      { t: 'path', d: `M${px - 6} ${py + 7}a6 6 0 0 1 12 0`, cls: 'person' },
      { t: 'text', x: x + 28, y: y + h / 2 + 4.5, text: label, cls: 'lbl' },
    )
  } else {
    items.push(
      { t: 'rect', x, y, w, h, rx: 10, cls: 'abox' },
      { t: 'rect', x, y, w, h, rx: 10, cls: 'flash', k: `action-${i}` },
      { t: 'text', x: x + (portrait ? 12 : 14), y: y + h / 2 + 4.5, text: label, cls: 'lbl' },
    )
  }
}

/** The loop label with its flash background: one line, or the words split over two (loopLabel() in the reference). */
const loopLabel = (b: Builder, x: number, y: number, label: string, two: boolean, fontSize: number): Shape => {
  const words = label.trim().split(/\s+/).filter(Boolean)
  const half = Math.ceil(words.length / 2)
  const lines = two ? [words.slice(0, half).join(' '), words.slice(half).join(' ')].filter(Boolean) : [label.trim()]
  const widest = Math.max(0, ...lines.map((l) => b.measure(l, 'loop-t', fontSize)))
  return {
    t: 'g',
    transform: `translate(${x} ${y})`,
    items: [
      { t: 'rect', x: -6, y: -11, w: widest + 12, h: 16 + (lines.length - 1) * 14, rx: 4, cls: 'loop-bg', k: 'loopBg' },
      ...lines.map((text, i): Shape => ({ t: 'text', x: 0, y: i * 14, text, cls: 'loop-t' })),
    ],
  }
}

/** The action rows: the actions, then "Team steps in" last. */
const actionRows = (labels: HarnessLabels) => [
  ...labels.actions.map((label) => ({ label, handover: false })),
  { label: labels.handoverLabel, handover: true },
]

/* Landscape, 760 x 380. Lanes: the loop runs outside the box on the left
   (x 138); the actions leave by one rail (x 728). */

/**
 * Where the action rows sit in the gate, centred on it: the reference's 26px
 * rows 36px apart (10px between boxes), and for 6 rows (5 actions) 24px rows
 * 34px apart, still 10px between boxes, with every check mark inside the
 * gate. Every line, check mark and box shares the row's centre.
 */
export const landscapeRows = (rows: number): { tops: number[]; height: number } => {
  const height = rows > 5 ? 24 : 26
  const pitch = height + 10
  const block = (rows - 1) * pitch + height
  const top = Math.round(215 - block / 2)
  return { tops: Array.from({ length: rows }, (_, i) => top + i * pitch), height }
}

export const landscapeRowTops = (rows: number): number[] => landscapeRows(rows).tops

const drawLandscape = (labels: HarnessLabels, measure: Measure): Drawing => {
  const b = new Builder(measure)

  // The box sits under every line; doors at the three crossings.
  b.line(['boundary']).push(
    { t: 'rect', x: 160, y: 8, w: 592, h: 310, rx: 20, cls: 'bound' },
    ...door(160, 201, 'v'),
    ...door(160, 70, 'v'),
    ...door(728, 318, 'h'),
  )
  b.node(['boundary']).push({ t: 'text', x: 178, y: 24, text: labels.boundaryLabel, cls: 'mono' })

  // The learning loop, outside the box.
  b.line(['loop']).push({ t: 'path', d: 'M176 352H138V70H177', cls: 'ln loop-ln', k: 'loop' }, chev(177, 70, 'r', 'ln loop-ln'))
  b.node(['loop']).push(loopLabel(b, 16, 266, labels.loopLabel, true, 10.5))

  // The customer event; its arrow hops over the loop lane.
  b.node(['trigger']).push(
    { t: 'rect', x: 4, y: 173, w: 116, h: 56, rx: 12, cls: 'box' },
    { t: 'text', x: 16, y: 194, text: labels.triggerLabel, cls: 'mono' },
    { t: 'text', x: 16, y: 217, text: labels.triggerEvents[0] ?? '', cls: 'lbl', k: 'event' },
  )
  b.line(['trigger']).push(
    { t: 'path', d: 'M120 201H243', cls: 'knock' },
    { t: 'path', d: 'M120 201H243', cls: 'ln', k: 'trigger' },
    chev(243, 201, 'r'),
  )

  // Ontology and policy.
  b.node(['ontology']).push(
    { t: 'rect', x: 178, y: 32, w: 244, h: 76, rx: 12, cls: 'box' },
    { t: 'text', x: 192, y: 52, text: labels.ontologyLabel, cls: 'lbl' },
    ...chipRow(b, 192, 61, 216, labels.ontologyItems, 19, 7, 6, 10.5),
  )
  b.node(['policy']).push(
    { t: 'rect', x: 436, y: 32, w: 160, h: 76, rx: 12, cls: 'box' },
    { t: 'text', x: 450, y: 52, text: labels.policyLabel, cls: 'lbl' },
    { t: 'text', x: 450, y: 72, text: labels.policySub, cls: 'mono' },
  )
  b.line(['ontology']).push({ t: 'path', d: 'M300 108V167', cls: 'ln', k: 'ontology' }, chev(300, 167, 'd'))
  b.line(['policy']).push({ t: 'path', d: 'M452 108V119H412V167', cls: 'ln', k: 'policy' }, chev(412, 167, 'd'))

  // Orchestration, the only navy box.
  b.node(['orchestration']).push(
    { t: 'rect', x: 244, y: 168, w: 196, h: 66, rx: 14, cls: 'orch-box' },
    { t: 'rect', x: 244, y: 168, w: 196, h: 66, rx: 14, cls: 'halo', k: 'halo' },
    { t: 'text', x: 342, y: 197, text: labels.orchestrationLabel, cls: 'orch-t', anchor: 'middle' },
    { t: 'text', x: 342, y: 214, text: labels.orchestrationSubLabel, cls: 'orch-s', anchor: 'middle' },
    ...Array.from({ length: 5 }, (_, k): Shape => ({ t: 'circle', cx: 318 + k * 12, cy: 225, r: 2.4, cls: 'orch-d' })),
  )

  // The actions through the guardrails gate, then out by one rail to Customer 360.
  const rows = actionRows(labels)
  const { tops, height: H } = landscapeRows(rows.length)
  const AX = 552
  const AW = 160
  rows.forEach((row, i) => {
    const cy = tops[i] + H / 2
    const own: Part = row.handover ? 'handover' : 'actions'
    b.line([own, 'guardrails']).push(
      { t: 'path', d: `M440 201H458C474 201 468 ${cy} 486 ${cy}H${AX - 1}`, cls: 'ln', k: `act-${i}` },
      chev(AX - 1, cy, 'r'),
    )
    b.line([own, 'customer360']).push(
      { t: 'path', d: `M${AX + AW} ${cy}H728V329`, cls: 'ln', k: `out-${i}` },
      ...(i === rows.length - 1 ? [chev(728, 329, 'd')] : []),
    )
  })
  b.node(['guardrails']).push(
    { t: 'rect', x: 480, y: 123, w: 28, h: 185, rx: 8, cls: 'gate' },
    { t: 'text', x: 494, y: 118, text: labels.guardrailsLabel, cls: 'mono', anchor: 'middle' },
    ...tops.map((top, i) => check(494, top + H / 2, i)),
  )
  rows.forEach((row, i) => actionBox(b, AX, tops[i], AW, H, row.label, i, row.handover, false))

  // Customer 360, outside the box.
  b.node(['customer360']).push(
    { t: 'rect', x: 176, y: 330, w: 560, h: 44, rx: 12, cls: 'box' },
    { t: 'text', x: 192, y: 357, text: labels.customer360Label, cls: 'lbl' },
    ...chipRow(b, 320, 341, 400, labels.customer360Fields, 22, 9, 8, 10.5, 'field'),
  )

  return { layout: 'landscape', width: 760, height: 380, lines: b.lines, nodes: b.nodes }
}

/* Portrait, 376 x 620. The loop lane runs outside the left edge (x 6); one
   rail runs down the middle (x 188). The actions sit in two columns, with
   "Team steps in" last: across the full width when it is alone on its row. */

/** Where each action box sits in portrait: two columns, rows of 30px 10px apart, centred under the gate. */
export const PORTRAIT_ROW = 30
export const portraitCells = (count: number) => {
  const rows = Math.ceil(count / 2)
  const block = rows * PORTRAIT_ROW + (rows - 1) * 10
  const top = Math.round(433 - block / 2)
  return Array.from({ length: count }, (_, i) => {
    const row = Math.floor(i / 2)
    const full = i === count - 1 && count % 2 === 1
    const col: 'left' | 'right' | 'full' = full ? 'full' : i % 2 === 0 ? 'left' : 'right'
    return { row, col, x: col === 'right' ? 194 : 34, y: top + row * 40, w: full ? 308 : 148 }
  })
}

const drawPortrait = (labels: HarnessLabels, measure: Measure): Drawing => {
  const b = new Builder(measure)

  b.line(['boundary']).push(
    { t: 'rect', x: 22, y: 80, w: 332, h: 422, rx: 20, cls: 'bound' },
    ...door(188, 80, 'h'),
    ...door(22, 155, 'v'),
    ...door(188, 502, 'h'),
  )
  b.node(['boundary']).push({ t: 'text', x: 36, y: 100, text: labels.boundaryLabel, cls: 'mono' })

  b.line(['loop']).push({ t: 'path', d: 'M34 551H6V155H33', cls: 'ln loop-ln', k: 'loop' }, chev(33, 155, 'r', 'ln loop-ln'))
  b.node(['loop']).push(loopLabel(b, 40, 606, labels.loopLabel, false, 11))

  b.node(['trigger']).push(
    { t: 'rect', x: 118, y: 6, w: 140, h: 54, rx: 12, cls: 'box' },
    { t: 'text', x: 130, y: 25, text: labels.triggerLabel, cls: 'mono' },
    { t: 'text', x: 130, y: 47, text: labels.triggerEvents[0] ?? '', cls: 'lbl', k: 'event' },
  )
  b.line(['trigger']).push({ t: 'path', d: 'M188 60V243', cls: 'ln', k: 'trigger' }, chev(188, 243, 'd'))

  b.node(['ontology']).push(
    { t: 'rect', x: 34, y: 112, w: 148, h: 86, rx: 12, cls: 'box' },
    { t: 'text', x: 44, y: 133, text: labels.ontologyLabel, cls: 'lbl' },
    ...chipRow(b, 44, 144, 130, labels.ontologyItems, 20, 5, 4, 10),
  )
  b.node(['policy']).push(
    { t: 'rect', x: 194, y: 112, w: 148, h: 86, rx: 12, cls: 'box' },
    { t: 'text', x: 206, y: 133, text: labels.policyLabel, cls: 'lbl' },
    { t: 'text', x: 206, y: 155, text: labels.policySub, cls: 'mono' },
  )
  b.line(['ontology']).push({ t: 'path', d: 'M108 198V243', cls: 'ln', k: 'ontology' }, chev(108, 243, 'd'))
  b.line(['policy']).push({ t: 'path', d: 'M268 198V243', cls: 'ln', k: 'policy' }, chev(268, 243, 'd'))

  b.node(['orchestration']).push(
    { t: 'rect', x: 103, y: 244, w: 170, h: 72, rx: 14, cls: 'orch-box' },
    { t: 'rect', x: 103, y: 244, w: 170, h: 72, rx: 14, cls: 'halo', k: 'halo' },
    { t: 'text', x: 188, y: 274, text: labels.orchestrationLabel, cls: 'orch-t', anchor: 'middle' },
    { t: 'text', x: 188, y: 292, text: labels.orchestrationSubLabel, cls: 'orch-s', anchor: 'middle' },
    ...Array.from({ length: 5 }, (_, k): Shape => ({ t: 'circle', cx: 164 + k * 12, cy: 304, r: 2.4, cls: 'orch-d' })),
  )

  const rows = actionRows(labels)
  const cells = portraitCells(rows.length)
  const H = PORTRAIT_ROW
  rows.forEach((row, i) => {
    const c = cells[i]
    const mid = c.y + H / 2
    const own: Part = row.handover ? 'handover' : 'actions'
    // In: the first row drops in from above; later rows enter from the middle rail at the side.
    const inPath: [string, Shape] =
      c.col === 'full'
        ? [`M188 316V${c.y - 1}`, chev(188, c.y - 1, 'd')]
        : c.row === 0
          ? [`M188 316V${c.y - 10}H${c.x + 74}V${c.y - 1}`, chev(c.x + 74, c.y - 1, 'd')]
          : c.col === 'left'
            ? [`M188 316V${mid}H183`, chev(183, mid, 'l')]
            : [`M188 316V${mid}H193`, chev(193, mid, 'r')]
    b.line([own, 'guardrails']).push({ t: 'path', d: inPath[0], cls: 'ln', k: `act-${i}` }, inPath[1])
    // Out: back to the middle rail, then down through the door to Customer 360.
    const out = c.col === 'full' ? `M188 ${c.y + H}V515` : c.col === 'left' ? `M182 ${mid}H188V515` : `M194 ${mid}H188V515`
    b.line([own, 'customer360']).push(
      { t: 'path', d: out, cls: 'ln', k: `out-${i}` },
      ...(i === rows.length - 1 ? [chev(188, 515, 'd')] : []),
    )
  })
  b.node(['guardrails']).push(
    { t: 'rect', x: 34, y: 334, w: 308, h: 24, rx: 8, cls: 'gate' },
    { t: 'text', x: 46, y: 350, text: labels.guardrailsLabel, cls: 'mono' },
    check(188, 346, 0),
  )
  rows.forEach((row, i) => actionBox(b, cells[i].x, cells[i].y, cells[i].w, H, row.label, i, row.handover, true))

  b.node(['customer360']).push(
    { t: 'rect', x: 34, y: 516, w: 308, h: 70, rx: 12, cls: 'box' },
    { t: 'text', x: 46, y: 538, text: labels.customer360Label, cls: 'lbl' },
    ...chipRow(b, 46, 552, 286, labels.customer360Fields, 22, 8, 6, 10, 'field'),
  )

  return { layout: 'portrait', width: 376, height: 620, lines: b.lines, nodes: b.nodes }
}

export const buildDrawing = (layout: Layout, labels: HarnessLabels, measure: Measure = monoMeasure): Drawing =>
  layout === 'portrait' ? drawPortrait(labels, measure) : drawLandscape(labels, measure)

/* Highlights */

/**
 * A group's state for the selected card's parts: lit (crimson), dimmed, or
 * as it is. No card selected: everything as it is. The BYOC box keeps
 * everything inside it at full strength and dims only what is outside.
 */
export const groupState = (parts: Part[], lit: Part[]): 'on' | 'dim' | null => {
  if (!lit.length || !parts.length) return null
  const set = new Set(lit)
  const on = parts.some((p) => set.has(p))
  if (on) return 'on'
  const keep = set.has('boundary') && parts.some((p) => INSIDE.has(p))
  return keep ? null : 'dim'
}
