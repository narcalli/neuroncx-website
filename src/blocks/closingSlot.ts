/**
 * Where something placed "just before the closing call to action" goes in a
 * layout: the index of the first closing CTA shown, or the layout's length
 * (the end) when it has none. A hidden block never renders, so a hidden
 * closing CTA does not count.
 */
export const closingSlot = (blocks: { blockType?: string | null; hidden?: boolean | null }[] | null | undefined): number => {
  const list = Array.isArray(blocks) ? blocks : []
  const at = list.findIndex((b) => b?.blockType === 'closingCta' && !b.hidden)
  return at === -1 ? list.length : at
}
