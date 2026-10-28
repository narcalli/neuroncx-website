/**
 * Turns a hub's stored hero chat (Hub['heroChat'], already resolved to plain
 * rows server side) into the sequence the chat phone plays: a typing
 * indicator and a hand-off divider before each business row that starts a
 * new agent's turn, never before the first one. Pure, so it is testable
 * without a browser.
 */

export type ChatSender = 'customer' | 'business' | 'team'

export type ChatRow = {
  sender: ChatSender
  text: string
  /** The agent's name, business rows only. */
  agentName: string | null
  /** The agent's family (microApps' `family` list), business rows only, when it has one. */
  agentFamily: string | null
}

export type PlayItem =
  | { kind: 'handoff'; agentName: string }
  | { kind: 'row'; row: ChatRow; rowNumber: number }

/** 1-based rowNumber matches the CMS's own numbering (heroBadges.chatRow, "1 for the first"). */
export const buildPlayScript = (rows: ChatRow[]): PlayItem[] => {
  const items: PlayItem[] = []
  let lastAgent: string | null = null
  rows.forEach((row, i) => {
    if (row.sender === 'business' && row.agentName) {
      if (lastAgent !== null && row.agentName !== lastAgent) {
        items.push({ kind: 'handoff', agentName: row.agentName })
      }
      lastAgent = row.agentName
    }
    items.push({ kind: 'row', row, rowNumber: i + 1 })
  })
  return items
}

/** The badge (its own index in heroBadges) pinged when this 1-based chat row arrives, or null. */
export const badgeForRow = (
  badges: { chatRow?: number | null }[],
  rowNumber: number,
): number | null => {
  const i = badges.findIndex((b) => b.chatRow === rowNumber)
  return i === -1 ? null : i
}

/** A phrase's words, lowercase, short connectors dropped, a trailing "s" stripped so a plural still matches. */
const significantWords = (phrase: string): Set<string> =>
  new Set(
    phrase
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, ' ')
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => (w.length > 3 && w.endsWith('s') ? w.slice(0, -1) : w))
      .filter((w) => w.length >= 4),
  )

/**
 * The heroChip (its own index) for an agent's family, by a shared
 * significant word ("Reads documents" chip, "Read and match documents"
 * family: both carry "document"). heroChips carries no family of its own, so
 * a chip not written to describe any family simply never lights up, rather
 * than guessing wrong.
 */
export const chipForFamily = (
  chips: { label?: string | null }[],
  family: string | null,
): number | null => {
  const famWords = significantWords(family || '')
  if (!famWords.size) return null
  const i = chips.findIndex((c) => {
    const labelWords = significantWords(c.label || '')
    for (const w of labelWords) if (famWords.has(w)) return true
    return false
  })
  return i === -1 ? null : i
}
