/**
 * The swarm diagram's layout and data (docs/motion/bot-swarm-motion-demo.html,
 * the swarm section): where each agent sits on the ring around the centre,
 * its family colour, a short label, and which hand-offs to animate. Pure, so
 * it is testable without a browser; the component (Diagram.tsx) only reads
 * these and draws the SVG.
 */

export const CX = 320
export const CY = 215
export const RING_R = 158
export const CORE_R = 58

export type Agent = { id: string; name: string; familyName: string | null; passesTo: string[] }
export type Point = { x: number; y: number; cos: number; sin: number }
export type Pair = { fromId: string; toId: string; fromName: string; toName: string }

/** Evenly spaced around the ring, the first straight up (as in the demo). */
export const ringPositions = (count: number, cx = CX, cy = CY, r = RING_R): Point[] =>
  Array.from({ length: count }, (_, i) => {
    const step = count > 0 ? 360 / count : 0
    const angle = ((-90 + i * step) * Math.PI) / 180
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    return { x: cx + r * cos, y: cy + r * sin, cos, sin }
  })

/** A label's offset from its point and which way it reads, so labels clear the ring and never run into it. */
export const labelAnchor = (p: Point, offset = 32): { x: number; y: number; anchor: 'start' | 'middle' | 'end' } => ({
  x: p.x + p.cos * offset,
  y: p.y + p.sin * offset + (p.sin > 0.3 ? 10 : p.sin < -0.3 ? -2 : 4),
  anchor: Math.abs(p.cos) < 0.3 ? 'middle' : p.cos > 0 ? 'start' : 'end',
})

const FAMILY_COLORS: Record<string, string> = {
  'book and get paid': 'var(--ncx-crimson)',
  'read and match documents': 'var(--ncx-navy)',
  'check and coach your team': 'var(--ncx-muted)',
}

/** The family's ring colour, by name (prompt 6: crimson, navy, slate). An unlisted family falls back to the third. */
export const familyColor = (familyName: string | null | undefined): string =>
  FAMILY_COLORS[(familyName || '').trim().toLowerCase()] || FAMILY_COLORS['check and coach your team']

/**
 * A short label for the ring, since there is no field for one: the leading
 * words that fit `max` characters, with an ellipsis if any are left out.
 * Short names already within the limit are used whole.
 */
export const shortLabel = (name: string, max = 18): string => {
  if (name.length <= max) return name
  let out = ''
  for (const word of name.split(' ')) {
    const next = out ? `${out} ${word}` : word
    if (next.length > max) break
    out = next
  }
  return `${out || name.slice(0, max)}…`
}

/**
 * Every hand-off to animate: one pair per (agent, entry in its passesTo),
 * both ends live or pilot (already true of `agents`, which only holds
 * those). A pair naming an agent not in `agents` (unpublished, or planned)
 * is left out.
 */
export const buildPairs = (agents: Agent[]): Pair[] => {
  const byId = new Map(agents.map((a) => [a.id, a]))
  return agents.flatMap((a) =>
    a.passesTo.flatMap((toId) => {
      const to = byId.get(toId)
      return to ? [{ fromId: a.id, toId: to.id, fromName: a.name, toName: to.name }] : []
    }),
  )
}

/** A family name's agents, counted from `agents`, for the fact at this row (0: agents, 1: families, 2: always 1). */
export const factFallback = (index: number, agents: Agent[]): string => {
  if (index === 0) return String(agents.length)
  if (index === 1) return String(new Set(agents.map((a) => a.familyName).filter(Boolean)).size)
  return '1'
}
