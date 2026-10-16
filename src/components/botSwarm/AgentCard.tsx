import Link from 'next/link'
import React from 'react'

import { BlockIcon } from '@/components/BlockIcon'
import type { MicroApp } from '@/payload-types'
import { microAppHref } from '@/utilities/microApps'

const Body: React.FC<{ agent: MicroApp }> = ({ agent }) => (
  <>
    <span className="ncx-bsc__tile" aria-hidden="true">
      <BlockIcon name={agent.icon} fallback="bot" />
    </span>
    <span className="ncx-bsc__head">
      <span className="ncx-bsc__name">{agent.name}</span>
      {agent.status === 'pilot' ? <span className="ncx-bsc__tag">Pilot</span> : null}
    </span>
    {agent.tagline ? <span className="ncx-bsc__text">{agent.tagline}</span> : null}
  </>
)

/**
 * One agent as a card: icon, name, tagline and a Pilot tag for pilot agents.
 * A link only when the agent has its own page (microAppHref). The card
 * carries id="<slug>", so /bot-swarm#<slug> lands on it. Render it through
 * AgentCards, which holds the styles.
 */
export const AgentCard: React.FC<{ agent: MicroApp }> = ({ agent }) => {
  const href = microAppHref(agent)
  const id = agent.slug || undefined
  return href ? (
    <Link className="ncx-bsc" id={id} href={href}>
      <Body agent={agent} />
    </Link>
  ) : (
    <div className="ncx-bsc" id={id}>
      <Body agent={agent} />
    </div>
  )
}

/** A grid of agent cards. */
export const AgentCards: React.FC<{ agents: MicroApp[]; label?: string }> = ({ agents, label }) => {
  if (!agents.length) return null
  return (
    <>
      <style>{`
        .ncx-bsc-grid{list-style:none;margin:0;padding:0;display:grid;gap:16px;
          grid-template-columns:repeat(auto-fill,minmax(250px,1fr))}
        .ncx-bsc-grid > li{display:flex}
        .ncx-bsc{flex:1;display:flex;flex-direction:column;align-items:flex-start;gap:12px;
          background:var(--ncx-white);border:1px solid var(--ncx-rule);border-radius:var(--ncx-r-card);
          padding:22px;color:inherit;text-decoration:none;scroll-margin-top:110px}
        .ncx-bsc__tile{flex:none;width:48px;height:48px;border-radius:12px;background:var(--ncx-crimson-tint);
          color:var(--ncx-crimson-ink);display:flex;align-items:center;justify-content:center}
        .ncx-bsc__tile svg{width:24px;height:24px}
        .ncx-bsc__head{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
        .ncx-bsc__name{font-family:var(--font-display),Arial,sans-serif;font-weight:600;font-size:18px;
          line-height:1.3;color:var(--ncx-ink)}
        .ncx-bsc__tag{font-family:var(--font-display),Arial,sans-serif;font-size:12px;font-weight:600;
          color:var(--ncx-ink);background:var(--ncx-cloud);border:1px solid var(--ncx-rule-strong);
          border-radius:999px;padding:2px 10px}
        .ncx-bsc__text{font-size:15px;line-height:1.55;color:var(--ncx-muted)}
        a.ncx-bsc:hover{box-shadow:var(--ncx-lift);border-color:var(--ncx-rule-strong)}
        a.ncx-bsc:hover .ncx-bsc__tile{background:var(--ncx-crimson);color:var(--ncx-on-navy)}
        a.ncx-bsc:focus-visible{outline:2px solid var(--ncx-focus);outline-offset:3px}
        @media(prefers-reduced-motion:no-preference){
          a.ncx-bsc{transition:box-shadow .25s ease,border-color .25s ease}
          a.ncx-bsc .ncx-bsc__tile{transition:background .25s ease,color .25s ease}
        }
      `}</style>
      <ul className="ncx-bsc-grid" aria-label={label}>
        {agents.map((a) => (
          <li key={a.id}>
            <AgentCard agent={a} />
          </li>
        ))}
      </ul>
    </>
  )
}

/**
 * Agents as small chips, for the hub hero and an agent's chain. A chip is a
 * link only when the agent has its own page. `current` marks this page's
 * own agent.
 */
export const AgentChips: React.FC<{
  agents: {
    id: string
    name: string
    status?: MicroApp['status']
    hasOwnPage?: boolean | null
    slug?: string | null
  }[]
  label: string
  current?: string
}> = ({ agents, label, current }) => {
  if (!agents.length) return null
  return (
    <>
      <style>{`
        .ncx-bschips{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:8px}
        .ncx-bschips a,.ncx-bschips span{display:inline-flex;align-items:center;gap:8px;font-size:14px;font-weight:500;
          color:var(--ncx-ink);background:var(--ncx-white);border:1px solid var(--ncx-rule);border-radius:999px;
          padding:6px 14px;text-decoration:none}
        .ncx-bschips a:hover{border-color:var(--ncx-rule-strong);box-shadow:var(--ncx-shadow)}
        .ncx-bschips a:focus-visible{outline:2px solid var(--ncx-focus);outline-offset:3px}
        .ncx-bschips [aria-current]{background:var(--ncx-crimson-tint);border-color:transparent;color:var(--ncx-crimson-ink)}
        .ncx-bschips .pilot{font-size:11px;font-weight:600;color:var(--ncx-muted);padding:0;border:0;background:none}
      `}</style>
      <ul className="ncx-bschips" aria-label={label}>
        {agents.map((a) => {
          const href = a.id === current ? null : microAppHref(a as Partial<MicroApp>)
          const inner = (
            <>
              {a.name}
              {a.status === 'pilot' ? <span className="pilot">Pilot</span> : null}
            </>
          )
          return (
            <li key={a.id}>
              {href ? (
                <Link href={href}>{inner}</Link>
              ) : (
                <span aria-current={a.id === current ? 'page' : undefined}>{inner}</span>
              )}
            </li>
          )
        })}
      </ul>
    </>
  )
}
