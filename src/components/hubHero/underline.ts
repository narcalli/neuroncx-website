/**
 * Splits a heading around the word it underlines (Hub['heroUnderlineWord']),
 * so the word can sit in its own span with the underline SVG. No match, no
 * word set, or an empty heading: the whole heading renders plainly.
 */
export type UnderlineSplit = { before: string; word: string | null; after: string }

export const splitUnderline = (heading: string | null | undefined, word?: string | null): UnderlineSplit => {
  const h = heading || ''
  const w = word?.trim()
  const i = w ? h.indexOf(w) : -1
  if (!w || i === -1) return { before: h, word: null, after: '' }
  return { before: h.slice(0, i), word: w, after: h.slice(i + w.length) }
}
