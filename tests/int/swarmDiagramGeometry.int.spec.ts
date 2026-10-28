import { describe, expect, it } from 'vitest'

import {
  buildPairs,
  factFallback,
  familyColor,
  labelAnchor,
  ringPositions,
  shortLabel,
  type Agent,
} from '@/blocks/SwarmDiagram/geometry'

describe('ringPositions', () => {
  it('starts straight up and spaces evenly', () => {
    const pos = ringPositions(4, 0, 0, 10)
    expect(pos[0].x).toBeCloseTo(0, 5)
    expect(pos[0].y).toBeCloseTo(-10, 5)
    expect(pos[1].x).toBeCloseTo(10, 5)
    expect(pos[1].y).toBeCloseTo(0, 5)
    expect(pos[2].y).toBeCloseTo(10, 5)
  })

  it('is empty with no agents, never dividing by zero', () => {
    expect(ringPositions(0)).toEqual([])
  })
})

describe('labelAnchor', () => {
  it('reads from the start on the right, from the end on the left, centred top and bottom', () => {
    expect(labelAnchor({ x: 0, y: 0, cos: 1, sin: 0 }).anchor).toBe('start')
    expect(labelAnchor({ x: 0, y: 0, cos: -1, sin: 0 }).anchor).toBe('end')
    expect(labelAnchor({ x: 0, y: 0, cos: 0, sin: -1 }).anchor).toBe('middle')
  })
})

describe('familyColor', () => {
  it('matches the three named families, case and spacing aside', () => {
    expect(familyColor('Book and get paid')).toBe('var(--ncx-crimson)')
    expect(familyColor(' read and match documents ')).toBe('var(--ncx-navy)')
    expect(familyColor('CHECK AND COACH YOUR TEAM')).toBe('var(--ncx-muted)')
  })

  it('falls back for anything else, never throwing', () => {
    expect(familyColor('Something new')).toBe('var(--ncx-muted)')
    expect(familyColor(null)).toBe('var(--ncx-muted)')
  })
})

describe('shortLabel', () => {
  it('keeps a short name whole', () => {
    expect(shortLabel('Payment services')).toBe('Payment services')
  })

  it('cuts a long name at a word boundary with an ellipsis', () => {
    expect(shortLabel('Student mark statement assessment')).toBe('Student mark…')
  })
})

describe('buildPairs', () => {
  const agent = (id: string, passesTo: string[] = []): Agent => ({ id, name: id, familyName: 'f', passesTo })

  it('one pair per passesTo entry that is itself an agent on the ring', () => {
    const agents = [agent('a', ['b']), agent('b'), agent('c')]
    expect(buildPairs(agents)).toEqual([{ fromId: 'a', toId: 'b', fromName: 'a', toName: 'b' }])
  })

  it('leaves out a pair naming an agent not on the ring', () => {
    const agents = [agent('a', ['missing'])]
    expect(buildPairs(agents)).toEqual([])
  })
})

describe('factFallback', () => {
  const agents: Agent[] = [
    { id: '1', name: 'a', familyName: 'Book and get paid', passesTo: [] },
    { id: '2', name: 'b', familyName: 'Book and get paid', passesTo: [] },
    { id: '3', name: 'c', familyName: 'Read and match documents', passesTo: [] },
  ]

  it('counts agents, then families, then is always 1', () => {
    expect(factFallback(0, agents)).toBe('3')
    expect(factFallback(1, agents)).toBe('2')
    expect(factFallback(2, agents)).toBe('1')
  })
})
