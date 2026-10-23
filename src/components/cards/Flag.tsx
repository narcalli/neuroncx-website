import React from 'react'

/**
 * A card's status pill, such as Pilot, or Planned in a draft preview. Inline
 * styles, so every card design can drop it in without its own CSS. Planned
 * is dashed: it is never on the live site, only in a preview.
 */
export const CardFlag: React.FC<{ text?: string | null }> = ({ text }) =>
  text ? (
    <span
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        marginLeft: 8,
        padding: '2px 8px',
        borderRadius: 999,
        fontFamily: 'var(--font-body),Arial,sans-serif',
        fontSize: 11,
        fontWeight: 600,
        lineHeight: '16px',
        letterSpacing: '.02em',
        color: 'var(--ncx-crimson-ink)',
        border: `1px ${text === 'Planned' ? 'dashed' : 'solid'} currentColor`,
        background: 'var(--ncx-white)',
      }}
    >
      {text}
    </span>
  ) : null
