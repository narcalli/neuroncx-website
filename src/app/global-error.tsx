'use client'

import React from 'react'

/**
 * The last resort: shown when the site's layout itself fails (the header, the
 * footer or the Site Settings could not be built), so it replaces the whole
 * page. It needs nothing from the CMS and carries its own styles.
 */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f6f7fa',
          color: '#171c2e',
          fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
        }}
      >
        <main style={{ maxWidth: 560, padding: '48px 24px' }}>
          <p style={{ margin: '0 0 12px', color: '#c62828', fontSize: 14 }}>NeuronCx</p>
          <h1 style={{ margin: 0, fontSize: 32, lineHeight: 1.2, fontWeight: 600 }}>
            Something went wrong on our side
          </h1>
          <p style={{ margin: '16px 0 28px', color: '#5a6379', fontSize: 18, lineHeight: 1.6 }}>
            The site could not be shown just now. Please try again in a moment.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                font: 'inherit',
                fontSize: 15,
                padding: '12px 22px',
                borderRadius: 8,
                border: 0,
                background: '#1a2035',
                color: '#ffffff',
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
            {/* A full page load, not client navigation: the app around it has failed. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              style={{
                fontSize: 15,
                padding: '12px 22px',
                borderRadius: 8,
                border: '1px solid #c9ced8',
                color: '#171c2e',
                textDecoration: 'none',
              }}
            >
              Go home
            </a>
          </div>
        </main>
      </body>
    </html>
  )
}
