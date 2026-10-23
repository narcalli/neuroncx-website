'use client'

import { usePathname } from 'next/navigation'
import React from 'react'

/**
 * Shown on every page while draft mode is on, so a preview is never mistaken
 * for the live site. Exit turns draft mode off and comes back to this page.
 * Fixed to the bottom, clear of the fixed site header.
 */
export const DraftBanner: React.FC = () => {
  const path = usePathname() || '/'
  return (
    <div
      role="status"
      style={{
        position: 'fixed',
        left: 16,
        right: 16,
        bottom: 16,
        zIndex: 1000,
        margin: '0 auto',
        maxWidth: 720,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px 16px',
        padding: '12px 16px',
        borderRadius: 12,
        background: 'var(--ncx-white)',
        color: 'var(--ncx-ink)',
        border: '2px dashed var(--ncx-crimson)',
        boxShadow: '0 16px 40px -16px rgba(15,18,32,.45)',
        fontFamily: 'var(--font-body),Arial,sans-serif',
        fontSize: 14,
        lineHeight: 1.45,
      }}
    >
      <span>
        <strong>Draft preview.</strong> Unpublished changes and Planned entries are showing. Visitors do not
        see this.
      </span>
      <a
        href={`/next/exit-preview?path=${encodeURIComponent(path)}`}
        style={{
          fontWeight: 600,
          color: 'var(--ncx-crimson-ink)',
          textDecoration: 'underline',
          textUnderlineOffset: 3,
          whiteSpace: 'nowrap',
        }}
      >
        Exit preview
      </a>
    </div>
  )
}
