import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

import { ClosingCtaBlock } from '@/blocks/ClosingCTA/Component'
import { FAQBlock } from '@/blocks/FAQ/Component'
import { IntegrationsBlock } from '@/blocks/Integrations/Component'
import type { AgentFamily, Customer, Integration, MicroApp, MicroAppsMaster } from '@/payload-types'
import { hrefOf, paragraph, type LinkValue } from '@/utilities/cmsValues'
import { customerHref, publicCustomers } from '@/utilities/customers'
import { pickMedia, type MediaValue } from '@/utilities/media'
import {
  idOf,
  isPublicAgent,
  loadAgents,
  loadAgentsPassingTo,
  populated,
} from '@/utilities/microApps'
import { siteOrigin } from '@/utilities/ownPageMeta'

import { AgentCards, AgentChips } from './AgentCard'
import { AgentPanel, agentSteps } from './AgentPanel'

/**
 * An agent's own page, in the site's light theme. Shown only for a
 * published, Live agent with Own page on (micro_apps_swarm.md in the CMS
 * docs, section 4). Every H2 comes from the agent's own Section headings,
 * then the main bot swarm master record's Agent page labels, with {name}
 * replaced by the agent's name. Sections with nothing to show are left out;
 * the closing panel is the only navy section. The benefits field is not
 * shown.
 */

// Used only when neither the agent nor the main master record has a heading.
const DEFAULT_LABELS = {
  panel: 'How {name} works',
  chain: 'Where {name} sits in the chain',
  teamControls: 'What your team controls',
  result: 'What changes for your team',
  useCases: 'Where {name} is used',
  worksWith: 'Systems {name} works with',
  faq: 'Questions about {name}',
  related: 'Other agents in this family',
} as const

type LabelKey = keyof typeof DEFAULT_LABELS

const RELATED_MAX = 3

const hasText = (v?: string | null) => Boolean(v && v.trim())

/** The hand-picked related agents that visitors may see, else others in the same family. */
const loadRelated = async (a: MicroApp, familyId: string | null): Promise<MicroApp[]> => {
  const picked = populated<MicroApp>(a.related)
    .filter((r) => r.id !== a.id && isPublicAgent(r))
    .slice(0, RELATED_MAX)
  if (picked.length || !familyId) return picked
  const family = await loadAgents({ families: [familyId] })
  return family.filter((r) => r.id !== a.id).slice(0, RELATED_MAX)
}

export const AgentPage = async ({
  agent: a,
  master,
}: {
  agent: MicroApp
  master: MicroAppsMaster | null
}) => {
  const family = a.family && typeof a.family === 'object' ? (a.family as AgentFamily) : null
  const familyId = idOf(a.family as any)
  const [passingIn, related] = await Promise.all([
    loadAgentsPassingTo(a.id),
    loadRelated(a, familyId),
  ])

  const heading = (key: LabelKey) =>
    (a.headingOverrides?.[key] || master?.labels?.[key] || DEFAULT_LABELS[key]).replaceAll(
      '{name}',
      a.name,
    )

  // The page's button: the agent's own, else the master record's, else contact.
  const ownHref = a.cta?.label ? hrefOf(a.cta.link as LinkValue) : null
  const ctaHref = ownHref || hrefOf(master?.cta?.link as LinkValue) || '/contact'
  const ctaLabel = (ownHref ? a.cta?.label : null) || master?.cta?.label || 'Talk to our team'

  const media = pickMedia(a.media as MediaValue)
  const steps = agentSteps(a, master)
  const passesOut = populated<MicroApp>(a.passesTo).filter((r) => r.id !== a.id && isPublicAgent(r))
  const comingIn = passingIn.filter((r) => r.id !== a.id)
  const useCases = (a.useCases || []).filter((u) => u && u.title)
  const integrationIds = populated<Integration>(a.integrations).map((i) => i.id)
  const customers = publicCustomers(populated<Customer>(a.customers))
  const faqs = (a.faqs || []).filter((f) => f && f.question && f.answer)

  // BreadcrumbList structured data, with addresses on the real site only.
  const origin = siteOrigin()
  const crumbs = origin
    ? {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { name: 'Bot swarm', item: `${origin}/bot-swarm` },
          ...(family?.slug
            ? [{ name: family.name, item: `${origin}/bot-swarm#${family.slug}` }]
            : []),
          { name: a.name, item: `${origin}/bot-swarm/${a.slug}` },
        ].map((c, i) => ({ '@type': 'ListItem', position: i + 1, ...c })),
      }
    : null

  return (
    <article className="ncx-agent">
      {crumbs ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }}
        />
      ) : null}
      <style>{`
        .ncx-agent{font-family:var(--font-body),Arial,sans-serif;color:var(--ncx-body)}

        /* Hero on a flat light band, as on integration pages. The top padding
           clears the fixed site header. */
        .ncx-agent__hero{background:var(--ncx-cloud);padding:0 0 clamp(56px,7vw,88px)}
        .ncx-agent__hero .inner{padding-block:calc(64px + clamp(44px,6vw,76px)) 0}
        .ncx-agent__grid{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,.8fr);gap:56px;align-items:center}
        .ncx-agent__grid.is-single{grid-template-columns:minmax(0,1fr)}
        .ncx-agent .crumb{display:inline-flex;align-items:center;gap:9px;flex-wrap:wrap;
          font-family:var(--font-display),Arial,sans-serif;font-size:13px;color:var(--ncx-muted);
          border:1px solid var(--ncx-rule);background:var(--ncx-white);
          padding:7px 15px;border-radius:999px;margin:0 0 24px}
        .ncx-agent .crumb a{color:var(--ncx-muted);text-decoration:none}
        .ncx-agent .crumb a:hover{color:var(--ncx-ink)}
        .ncx-agent .crumb [aria-current]{color:var(--ncx-ink)}
        .ncx-agent .crumb .sep{color:var(--ncx-faint)}
        .ncx-agent .spark{width:7px;height:7px;border-radius:50%;background:var(--ncx-crimson)}
        .ncx-agent .tags{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 18px;padding:0;list-style:none}
        .ncx-agent .tags li{font-size:12px;font-weight:500;color:var(--ncx-ink);background:var(--ncx-white);
          border:1px solid var(--ncx-rule);border-radius:999px;padding:5px 12px}
        .ncx-agent h1{font-family:var(--font-display),Arial,sans-serif;font-weight:600;
          font-size:clamp(38px,5vw,64px);line-height:1.06;letter-spacing:-.035em;
          margin:0;text-wrap:balance;color:var(--ncx-ink)}
        .ncx-agent .sub{margin:24px 0 0;max-width:60ch;font-size:19px;line-height:1.65;color:var(--ncx-muted)}
        .ncx-agent .cta{margin-top:34px;display:flex;gap:12px;flex-wrap:wrap}
        .ncx-agent .btn{font-family:var(--font-display),Arial,sans-serif;font-size:15px;font-weight:500;
          padding:13px 24px;border-radius:8px;text-decoration:none;display:inline-block;
          background:var(--ncx-crimson);color:var(--ncx-on-navy);transition:background .18s ease}
        .ncx-agent .btn:hover{background:var(--ncx-crimson-hover)}
        .ncx-agent .btn:focus-visible,.ncx-agent a:focus-visible{outline:2px solid var(--ncx-focus);outline-offset:3px}
        .ncx-agent__visual{background:var(--ncx-white);border:1px solid var(--ncx-rule);border-radius:var(--ncx-r-panel);
          box-shadow:var(--ncx-shadow);padding:18px}
        .ncx-agent__visual img{width:100%;height:auto;display:block;border-radius:12px}

        /* A short chat example: what the customer sees, from the agent. */
        .ncx-agent__chat{background:var(--ncx-white);border:1px solid var(--ncx-rule);border-radius:var(--ncx-r-panel);
          box-shadow:var(--ncx-shadow);padding:20px;display:flex;flex-direction:column;gap:10px}
        .ncx-agent__chat .who{font-family:var(--font-display),Arial,sans-serif;font-size:13px;color:var(--ncx-muted);margin:0}
        .ncx-agent__msg{margin:0;max-width:92%;padding:12px 15px;border-radius:14px;border-top-left-radius:4px;
          font-size:15px;line-height:1.55;background:var(--ncx-cloud);border:1px solid var(--ncx-rule);color:var(--ncx-ink)}

        /* Sections */
        .ncx-agent__section{padding-block:72px}
        .ncx-agent__section.is-band{background:var(--ncx-white);border-block:1px solid var(--ncx-rule)}
        .ncx-agent__section h2{font-family:var(--font-display),Arial,sans-serif;font-weight:500;
          font-size:clamp(28px,3.4vw,38px);line-height:1.15;letter-spacing:-.03em;margin:0 0 32px;color:var(--ncx-ink)}
        .ncx-agent__lead{margin:0 0 24px;max-width:68ch;font-size:18px;line-height:1.6;color:var(--ncx-ink)}
        .ncx-agent__lead b{font-family:var(--font-display),Arial,sans-serif;font-weight:600}
        .ncx-agent__panel{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(0,1fr);gap:32px;align-items:start}
        .ncx-agent__panel.is-single{grid-template-columns:minmax(0,1fr)}
        .ncx-agent__text{margin:0;max-width:68ch;font-size:18px;line-height:1.7;color:var(--ncx-body)}
        .ncx-agent__result{margin:0;max-width:40ch;font-family:var(--font-display),Arial,sans-serif;font-weight:500;
          font-size:clamp(22px,2.4vw,28px);line-height:1.35;color:var(--ncx-ink)}
        .ncx-agent__proof{margin:20px 0 0;display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:16px;color:var(--ncx-muted)}
        .ncx-agent__proof::before{content:"";width:8px;height:8px;border-radius:50%;background:var(--ncx-crimson)}
        .ncx-agent__proof a{color:var(--ncx-link)}

        .ncx-agent__chain{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
        .ncx-agent__chain .arrow{color:var(--ncx-faint);font-size:20px;line-height:1}

        .ncx-agent__cards{list-style:none;margin:0;padding:0;display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(240px,1fr))}
        .ncx-agent__cards li{background:var(--ncx-white);border:1px solid var(--ncx-rule);border-radius:var(--ncx-r-card);padding:22px 20px}
        .ncx-agent__cards h3{font-family:var(--font-display),Arial,sans-serif;font-weight:600;font-size:17px;line-height:1.3;
          margin:0 0 8px;color:var(--ncx-ink)}
        .ncx-agent__cards p{margin:0;font-size:15px;line-height:1.55;color:var(--ncx-muted)}

        @media(max-width:960px){
          .ncx-agent__grid,.ncx-agent__panel{grid-template-columns:minmax(0,1fr);gap:32px}
          .ncx-agent__section{padding-block:56px}
        }
      `}</style>

      <header className="ncx-agent__hero">
        <div className="inner ncx-container">
          <nav className="crumb" aria-label="Breadcrumb">
            <span className="spark" aria-hidden="true" />
            <Link href="/bot-swarm">Bot swarm</Link>
            {family?.slug ? (
              <>
                <span className="sep" aria-hidden="true">
                  /
                </span>
                <Link href={`/bot-swarm#${family.slug}`}>{family.name}</Link>
              </>
            ) : null}
            <span className="sep" aria-hidden="true">
              /
            </span>
            <span aria-current="page">{a.name}</span>
          </nav>

          <div className={`ncx-agent__grid${media || hasText(a.customerSees) ? '' : ' is-single'}`}>
            <div>
              {family ? (
                <ul className="tags" aria-label="Agent family">
                  <li>{family.name}</li>
                </ul>
              ) : null}
              <h1>{a.heroHeading || a.name}</h1>
              {a.heroSubheading || a.summary ? (
                <p className="sub">{a.heroSubheading || a.summary}</p>
              ) : null}
              <div className="cta">
                <Link className="btn" href={ctaHref}>
                  {ctaLabel}
                </Link>
              </div>
            </div>
            {media ? (
              <div className="ncx-agent__visual">
                <Image
                  src={media.src}
                  alt={media.alt || ''}
                  width={media.width || 1600}
                  height={media.height || 1200}
                  sizes="(max-width: 960px) 100vw, 480px"
                  unoptimized={media.unoptimized}
                  priority
                />
              </div>
            ) : hasText(a.customerSees) ? (
              <figure className="ncx-agent__chat" aria-label="Example message">
                <p className="who">{a.name}</p>
                <p className="ncx-agent__msg">{a.customerSees}</p>
              </figure>
            ) : null}
          </div>
        </div>
      </header>

      {steps.some((s) => s.line) || hasText(a.startsWhen) ? (
        <section className="ncx-agent__section" aria-labelledby="panel">
          <div className="ncx-container">
            <h2 id="panel">{heading('panel')}</h2>
            {hasText(a.startsWhen) ? (
              <p className="ncx-agent__lead">
                <b>Starts when:</b> {a.startsWhen}
              </p>
            ) : null}
            <div className={`ncx-agent__panel${hasText(a.customerSees) ? '' : ' is-single'}`}>
              <AgentPanel steps={steps} layout={hasText(a.customerSees) ? 'column' : 'row'} />
              {hasText(a.customerSees) ? (
                <figure className="ncx-agent__chat" aria-label="What the customer sees">
                  <p className="who">What the customer sees</p>
                  <p className="ncx-agent__msg">{a.customerSees}</p>
                </figure>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {passesOut.length || comingIn.length ? (
        <section className="ncx-agent__section is-band" aria-labelledby="chain">
          <div className="ncx-container">
            <h2 id="chain">{heading('chain')}</h2>
            <div className="ncx-agent__chain">
              {comingIn.length ? (
                <>
                  <AgentChips agents={comingIn} label="Agents that pass to this one" />
                  <span className="arrow" aria-hidden="true">
                    →
                  </span>
                </>
              ) : null}
              <AgentChips agents={[a]} label="This agent" current={a.id} />
              {passesOut.length ? (
                <>
                  <span className="arrow" aria-hidden="true">
                    →
                  </span>
                  <AgentChips agents={passesOut} label="Agents this one passes to" />
                </>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {hasText(a.teamControls) ? (
        <section className="ncx-agent__section" aria-labelledby="team-controls">
          <div className="ncx-container">
            <h2 id="team-controls">{heading('teamControls')}</h2>
            <p className="ncx-agent__text">{a.teamControls}</p>
          </div>
        </section>
      ) : null}

      {hasText(a.result) || hasText(a.proof) ? (
        <section className="ncx-agent__section is-band" aria-labelledby="result">
          <div className="ncx-container">
            <h2 id="result">{heading('result')}</h2>
            {hasText(a.result) ? <p className="ncx-agent__result">{a.result}</p> : null}
            {hasText(a.proof) ? (
              <p className="ncx-agent__proof">
                <span>{a.proof}</span>
                {customers.map((c) => {
                  const href = customerHref(c)
                  return href ? (
                    <Link key={c.id} href={href}>
                      {c.name}
                    </Link>
                  ) : null
                })}
              </p>
            ) : null}
          </div>
        </section>
      ) : null}

      {useCases.length ? (
        <section className="ncx-agent__section" aria-labelledby="use-cases">
          <div className="ncx-container">
            <h2 id="use-cases">{heading('useCases')}</h2>
            <ul className="ncx-agent__cards">
              {useCases.map((u, i) => (
                <li key={u.id || i}>
                  <h3>{u.title}</h3>
                  <p>{u.line}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {integrationIds.length ? (
        <IntegrationsBlock
          blockType="integrations"
          populateBy="selection"
          selectedDocs={integrationIds}
          heading={heading('worksWith')}
          limit={24}
        />
      ) : null}

      {faqs.length ? (
        <FAQBlock
          blockType="faq"
          heading={heading('faq')}
          items={faqs.map((f, i) => ({
            id: f.id || String(i),
            question: f.question,
            answer: paragraph(f.answer),
            defaultOpen: i === 0,
          }))}
          emitSchema
        />
      ) : null}

      {related.length ? (
        <section className="ncx-agent__section" aria-labelledby="related">
          <div className="ncx-container">
            <h2 id="related">{heading('related')}</h2>
            <AgentCards agents={related} label={heading('related')} />
          </div>
        </section>
      ) : null}

      <ClosingCtaBlock
        heading={master?.closing?.heading || null}
        subhead={master?.closing?.subheading || null}
        primaryLabel={ctaLabel}
        primaryLink={ctaHref}
      />
    </article>
  )
}
