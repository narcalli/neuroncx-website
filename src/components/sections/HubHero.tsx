import Link from 'next/link'
import React from 'react'

import { ConversationHeroBlock } from '@/blocks/ConversationHero/Component'
import type { Hub } from '@/payload-types'
import { hrefOf, type LinkValue } from '@/utilities/cmsValues'
import { isPublicEntry } from '@/utilities/content'
import { pickMedia, type MediaValue } from '@/utilities/media'

/**
 * A hub page's hero, in the light theme: eyebrow, the page's one H1,
 * subheading, chips and buttons, with the chat (each reply labelled with the
 * entry that sends it) or a picture beside them.
 */
export const HubHero: React.FC<{ hub: Hub; draft?: boolean; crumbs?: React.ReactNode }> = ({
  hub,
  draft = false,
  crumbs,
}) => {
  const chat = (hub.heroChat ?? []).filter((m) => m?.text)
  const media = chat.length ? null : pickMedia(hub.heroMedia as MediaValue)
  const buttons = [hub.heroCta, hub.heroSecondaryCta]
    .map((b) => (b?.label ? { label: b.label, href: hrefOf(b as LinkValue) } : null))
    .filter((b): b is { label: string; href: string } => Boolean(b?.href))

  return (
    <header className="ncx-hubhero">
      <style>{`
        .ncx-hubhero{background:var(--ncx-cloud);padding:calc(64px + clamp(44px,6vw,76px)) 0 clamp(56px,7vw,88px);
          font-family:var(--font-body),Arial,sans-serif;color:var(--ncx-body)}
        .ncx-hubhero__cols{display:grid;gap:48px;align-items:center}
        .ncx-hubhero__cols.has-side{grid-template-columns:minmax(0,1.1fr) minmax(0,1fr)}
        .ncx-hubhero .eyebrow{font-family:var(--font-display),Arial,sans-serif;font-size:14px;
          color:var(--ncx-crimson-ink);margin:0 0 14px}
        .ncx-hubhero h1{font-family:var(--font-display),Arial,sans-serif;font-weight:600;
          font-size:clamp(38px,5vw,64px);line-height:1.06;letter-spacing:-.035em;margin:0;
          text-wrap:balance;color:var(--ncx-ink)}
        .ncx-hubhero .sub{margin:24px 0 0;max-width:58ch;font-size:19px;line-height:1.65;color:var(--ncx-muted)}
        .ncx-hubhero .chips{display:flex;flex-wrap:wrap;gap:8px;margin:24px 0 0;padding:0;list-style:none}
        .ncx-hubhero .chips li{font-size:13px;font-weight:500;color:var(--ncx-ink);background:var(--ncx-white);
          border:1px solid var(--ncx-rule);border-radius:999px;padding:6px 13px}
        .ncx-hubhero .cta{margin-top:32px;display:flex;gap:12px;flex-wrap:wrap}
        .ncx-hubhero .btn{font-family:var(--font-display),Arial,sans-serif;font-size:15px;font-weight:500;
          padding:13px 24px;border-radius:8px;text-decoration:none;display:inline-block;
          border:1px solid var(--ncx-rule);background:var(--ncx-white);color:var(--ncx-ink)}
        .ncx-hubhero .btn.primary{background:var(--ncx-crimson);border-color:var(--ncx-crimson);color:var(--ncx-on-navy)}
        .ncx-hubhero .btn.primary:hover{background:var(--ncx-crimson-hover)}
        .ncx-hubhero .btn:focus-visible{outline:2px solid var(--ncx-focus);outline-offset:3px}
        .ncx-hubhero__chat{background:var(--ncx-white);border:1px solid var(--ncx-rule);border-radius:var(--ncx-r-panel);
          padding:20px;display:flex;flex-direction:column;gap:10px;box-shadow:0 24px 48px -32px rgba(15,18,32,.35)}
        .ncx-hubhero__msg{margin:0;max-width:86%;padding:10px 14px;border-radius:14px;font-size:15px;line-height:1.5;
          background:var(--ncx-cloud);border:1px solid var(--ncx-rule);color:var(--ncx-ink)}
        .ncx-hubhero__msg.is-customer{align-self:flex-end;background:#e7f6e9;border-color:#cfe9d3}
        .ncx-hubhero__msg .who{display:block;font-size:12px;font-weight:500;color:var(--ncx-crimson-ink);margin-bottom:3px}
        .ncx-hubhero__caption{margin:12px 0 0;font-size:14px;color:var(--ncx-muted);text-align:center}
        .ncx-hubhero__media img{display:block;width:100%;height:auto;border-radius:var(--ncx-r-panel)}
        @media(max-width:960px){.ncx-hubhero__cols.has-side{grid-template-columns:minmax(0,1fr)}}
      `}</style>
      {/* The breadcrumb trail sits 28px under the fixed header (--crumb-top). */}
      <div
        className="ncx-container"
        style={{ '--crumb-top': 'calc(28px - clamp(44px,6vw,76px))' } as React.CSSProperties}
      >
        {crumbs}
        <div className={`ncx-hubhero__cols${chat.length || media ? ' has-side' : ''}`}>
          <div>
            {hub.eyebrow ? <p className="eyebrow">{hub.eyebrow}</p> : null}
            <h1>{hub.h1}</h1>
            {hub.subheading ? <p className="sub">{hub.subheading}</p> : null}
            {hub.heroChips?.length ? (
              <ul className="chips">
                {hub.heroChips.map((c, i) => (
                  <li key={c.id || i}>{c.label}</li>
                ))}
              </ul>
            ) : null}
            {buttons.length ? (
              <div className="cta">
                {buttons.map((b, i) => (
                  <Link key={b.href + i} className={`btn${i === 0 ? ' primary' : ''}`} href={b.href}>
                    {b.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
          {chat.length ? (
            <figure style={{ margin: 0 }}>
              <div className="ncx-hubhero__chat" role="group" aria-label="Example conversation">
                {chat.map((m, i) => {
                  const entry = m.entry && typeof m.entry === 'object' ? m.entry.value : null
                  const who = m.sender === 'business' && isPublicEntry(entry, draft) ? entry.name : null
                  return (
                    <p className={`ncx-hubhero__msg is-${m.sender}`} key={m.id || i}>
                      {who ? <span className="who">{who}</span> : null}
                      {m.text}
                    </p>
                  )
                })}
              </div>
              {hub.heroChatCaption ? (
                <figcaption className="ncx-hubhero__caption">{hub.heroChatCaption}</figcaption>
              ) : null}
            </figure>
          ) : media ? (
            <figure className="ncx-hubhero__media" style={{ margin: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={media.src} alt={media.alt || ''} width={media.width ?? undefined} height={media.height ?? undefined} />
            </figure>
          ) : null}
        </div>
      </div>
    </header>
  )
}

/**
 * The hub's hero in the conversation design (heroDesign): the Conversation
 * hero block, filled from the same hero fields. Customer messages are the
 * customer's side, entry and team messages the business's, and the entries
 * that reply are listed under the chat, once each, in order, and the
 * breadcrumb trail sits above it. No picture: the design has none.
 */
export const HubConversationHero: React.FC<{ hub: Hub; draft?: boolean; crumbs?: React.ReactNode }> = ({
  hub,
  draft = false,
  crumbs,
}) => {
  const chat = (hub.heroChat ?? []).filter((m) => m?.text)
  const repliers = [
    ...new Set(
      chat.flatMap((m) => {
        const entry = m.entry && typeof m.entry === 'object' ? m.entry.value : null
        return m.sender === 'business' && isPublicEntry(entry, draft) ? [entry.name] : []
      }),
    ),
  ]
  // One message per line, as the block reads it; a line break inside a message would split it.
  const line = (text: string) => text.replace(/\s*\n\s*/g, ' ')
  const conversation = [
    ...chat.map((m) => `${m.sender === 'customer' ? 'them' : 'us'}: ${line(m.text)}`),
    ...repliers.map((name) => `tag: ${name}`),
  ].join('\n')
  const button = (b: Hub['heroCta']) => (b?.label ? { label: b.label, href: hrefOf(b as LinkValue) } : null)
  const primary = button(hub.heroCta)
  const secondary = button(hub.heroSecondaryCta)

  return (
    <ConversationHeroBlock
      eyebrow={hub.eyebrow}
      headline={hub.h1}
      subhead={hub.subheading}
      primaryButtonLabel={primary?.href ? primary.label : null}
      primaryButtonLink={primary?.href ?? null}
      secondaryButtonLabel={secondary?.href ? secondary.label : null}
      secondaryButtonLink={secondary?.href ?? null}
      chips={hub.heroChips}
      conversationLabel={hub.heroChatCaption}
      conversation={conversation}
      crumbs={crumbs}
    />
  )
}
