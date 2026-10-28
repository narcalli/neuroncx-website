import { describe, expect, it } from 'vitest'

import { badgeForRow, buildPlayScript, chipForFamily, type ChatRow } from '@/components/hubHero/chatScript'
import { splitUnderline } from '@/components/hubHero/underline'

const row = (over: Partial<ChatRow>): ChatRow => ({
  sender: 'customer',
  text: 'hi',
  agentName: null,
  agentFamily: null,
  ...over,
})

describe('the hero chat script', () => {
  it('never puts a hand-off divider before the first agent', () => {
    const only = row({ sender: 'business', text: 'Hello', agentName: 'Prescriptions' })
    const items = buildPlayScript([only])
    expect(items).toEqual([{ kind: 'row', row: only, rowNumber: 1 }])
  })

  it('puts a divider only when the agent changes', () => {
    const rows = [
      row({ sender: 'business', text: 'a', agentName: 'A' }),
      row({ sender: 'business', text: 'b', agentName: 'A' }),
      row({ sender: 'customer', text: 'ok' }),
      row({ sender: 'business', text: 'c', agentName: 'B' }),
    ]
    const items = buildPlayScript(rows)
    expect(items.map((it) => it.kind)).toEqual(['row', 'row', 'row', 'handoff', 'row'])
    expect(items[3]).toEqual({ kind: 'handoff', agentName: 'B' })
  })

  it('numbers rows from 1, matching the CMS badge field', () => {
    const items = buildPlayScript([row({}), row({ sender: 'business', agentName: 'A' })])
    expect(items.map((it) => (it.kind === 'row' ? it.rowNumber : it.kind))).toEqual([1, 2])
  })

  it('leaves team rows out of the hand-off tracking', () => {
    const rows = [
      row({ sender: 'business', text: 'a', agentName: 'A' }),
      row({ sender: 'team', text: 'noted' }),
      row({ sender: 'business', text: 'b', agentName: 'A' }),
    ]
    expect(buildPlayScript(rows).map((it) => it.kind)).toEqual(['row', 'row', 'row'])
  })
})

describe('badgeForRow', () => {
  it('finds the badge whose chatRow matches, by its own index', () => {
    const badges = [{ chatRow: 3 }, { chatRow: 1 }]
    expect(badgeForRow(badges, 1)).toBe(1)
    expect(badgeForRow(badges, 3)).toBe(0)
    expect(badgeForRow(badges, 2)).toBeNull()
  })
})

describe('chipForFamily', () => {
  it('matches loosely, either direction, ignoring case and punctuation', () => {
    const chips = [{ label: 'Reads documents' }, { label: 'Takes payments' }]
    expect(chipForFamily(chips, 'Read and match documents')).toBe(0)
    expect(chipForFamily(chips, 'Book and get paid')).toBeNull()
  })

  it('is null with no family or no chips that describe it', () => {
    expect(chipForFamily([{ label: 'Anything' }], null)).toBeNull()
    expect(chipForFamily([], 'Read and match documents')).toBeNull()
  })
})

describe('splitUnderline', () => {
  it('splits the heading around the word', () => {
    expect(splitUnderline('Bot swarm for customer service', 'swarm')).toEqual({
      before: 'Bot ',
      word: 'swarm',
      after: ' for customer service',
    })
  })

  it('renders plainly with no word, an empty word, or no match', () => {
    expect(splitUnderline('Bot swarm', null)).toEqual({ before: 'Bot swarm', word: null, after: '' })
    expect(splitUnderline('Bot swarm', '  ')).toEqual({ before: 'Bot swarm', word: null, after: '' })
    expect(splitUnderline('Bot swarm', 'nope')).toEqual({ before: 'Bot swarm', word: null, after: '' })
  })
})
