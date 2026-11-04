'use client'

import { usePathname } from 'next/navigation'
import React, { useSyncExternalStore } from 'react'

const noSubscribe = () => () => {}

const dateFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

/**
 * Shown on every page while draft mode is on, so a preview is never mistaken
 * for the live site. Exit turns draft mode off and comes back to this page.
 * Fixed to the bottom, clear of the fixed site header. In an old-version
 * preview (utilities/versionCookie.ts) it says which version is showing.
 */
export const DraftBanner: React.FC<{ version?: { at: string | null } | null }> = ({ version }) => {
  const path = usePathname() || '/'
  // The date in the editor's own time zone, so it matches the CMS History tab:
  // only in the browser, since the server's time zone may differ.
  const inBrowser = useSyncExternalStore(noSubscribe, () => true, () => false)
  const when = inBrowser && version?.at ? dateFormat.format(new Date(version.at)) : ''
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
      {version ? (
        <span>
          <strong>Old version preview.</strong> Showing the version {when ? `from ${when}` : 'chosen in History'}.
          Visitors do not see this.
        </span>
      ) : (
        <span>
          <strong>Draft preview.</strong> Unpublished changes and Planned entries are showing. Visitors do not
          see this.
        </span>
      )}
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
