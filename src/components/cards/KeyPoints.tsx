import React from 'react'

/** At most this many key points on a card. */
export const MAX_KEY_POINTS = 3

/**
 * An entry's key points under a card's description, when the card design's
 * "Show key points" is on (neuroncx-cms src/fields/cardDesign.ts): the first
 * three as a list, each with a small tick. Nothing at all without key points.
 *
 * The list sits 14px under the description. Cards lay out their parts in a
 * flex column with a gap, so `gapAbove` takes that gap off the margin.
 */
export const KeyPointList: React.FC<{ points?: string[] | null; gapAbove?: number }> = ({ points, gapAbove = 0 }) => {
  const lines = (points || []).filter((p) => typeof p === 'string' && p.trim()).slice(0, MAX_KEY_POINTS)
  if (!lines.length) return null
  return (
    <>
      <style>{keyPointsCss}</style>
      <ul className="ncx-keypts" style={{ marginTop: Math.max(0, 14 - gapAbove) }}>
        {lines.map((line, i) => (
          <li key={i}>
            <svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true" focusable="false">
              <path d="M3.5 8.5 6.5 11.5 12.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </>
  )
}

// The tick sits on the first line's centre (14.5px x 1.5 = 21.75px line, 16px icon).
const keyPointsCss = `
.ncx-keypts{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px;align-self:stretch}
.ncx-keypts li{display:flex;align-items:flex-start;gap:8px;
  font-family:var(--font-body),'Inter',Arial,sans-serif;font-size:14.5px;line-height:1.5;color:#374151;text-align:left}
.ncx-keypts svg{flex:none;width:16px;height:16px;margin-top:3px;color:#C62828}
`
