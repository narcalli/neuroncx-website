import Link from 'next/link'
import React from 'react'

import { backLinkOf, clusterHref, nextStage, type ClusterPage } from '@/utilities/clusters'

/**
 * The foot of a cluster page: back to its pillar page, and on to the page
 * for the next stage. The next-stage link is left out on the last stage, and
 * the whole footer when there is neither link.
 */
export const ClusterFooter: React.FC<{ page: ClusterPage; siblings: ClusterPage[] }> = ({ page, siblings }) => {
  const back = backLinkOf(page)
  const next = nextStage(page, siblings)
  const nextHref = next ? clusterHref(next) : null
  if (!back && !(next && nextHref)) return null

  return (
    <nav className="ncx-clusterfoot ncx-container" aria-label="More in this topic">
      <style>{`
        .ncx-clusterfoot{display:flex;flex-wrap:wrap;gap:16px;justify-content:space-between;align-items:stretch;
          padding-block:40px;font-family:var(--font-body),Arial,sans-serif}
        .ncx-clusterfoot a{display:flex;flex-direction:column;justify-content:center;gap:6px;min-height:44px;
          padding:18px 22px;border:1px solid var(--ncx-rule);border-radius:var(--ncx-r-card);background:var(--ncx-white);
          color:var(--ncx-ink);text-decoration:none;transition:border-color .15s}
        .ncx-clusterfoot a:hover{border-color:var(--ncx-rule-strong)}
        .ncx-clusterfoot a:focus-visible{outline:2px solid var(--ncx-focus);outline-offset:2px}
        .ncx-clusterfoot .back{font-family:var(--font-display),Arial,sans-serif;font-weight:500;font-size:16px;
          color:var(--ncx-link)}
        .ncx-clusterfoot .next{margin-left:auto;text-align:right;max-width:min(100%,460px)}
        .ncx-clusterfoot .next-label{font-family:var(--font-label),monospace;font-size:11.5px;font-weight:500;
          letter-spacing:.06em;text-transform:uppercase;color:var(--ncx-muted)}
        .ncx-clusterfoot .next-title{font-family:var(--font-display),Arial,sans-serif;font-weight:500;font-size:18px;
          line-height:1.3;color:var(--ncx-ink)}
        .ncx-clusterfoot .arrow{color:var(--ncx-link)}
        @media(max-width:640px){.ncx-clusterfoot a,.ncx-clusterfoot .next{width:100%;margin-left:0;text-align:left}}
        @media(prefers-reduced-motion:reduce){.ncx-clusterfoot a{transition:none}}
      `}</style>
      {back ? (
        <Link className="back" href={back.href}>
          <span>
            <span className="arrow" aria-hidden="true">
              ←{' '}
            </span>
            Back to {back.label}
          </span>
        </Link>
      ) : null}
      {next && nextHref ? (
        <Link className="next" href={nextHref}>
          <span className="next-label">Next stage{next.stage?.trim() ? `: ${next.stage.trim()}` : ''}</span>
          <span className="next-title">
            {next.title}{' '}
            <span className="arrow" aria-hidden="true">
              →
            </span>
          </span>
        </Link>
      ) : null}
    </nav>
  )
}
