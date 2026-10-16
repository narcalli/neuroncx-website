import { convertLexicalToPlaintext } from '@payloadcms/richtext-lexical/plaintext'
import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

import { ClosingCtaBlock } from '@/blocks/ClosingCTA/Component'
import { FAQBlock } from '@/blocks/FAQ/Component'
import { IntegrationsBlock } from '@/blocks/Integrations/Component'
import { BlockIcon } from '@/components/BlockIcon'
import RichText from '@/components/RichText'
import type { Integration, MicroApp, MicroAppsMaster, Sector } from '@/payload-types'
import { hrefOf, paragraph, type LinkValue } from '@/utilities/cmsValues'
import { pickMedia, type MediaValue } from '@/utilities/media'
import {
  idOf,
  idsOf,
  isPublicAgent,
  loadAgentFamilies,
  loadAgents,
  populated,
} from '@/utilities/microApps'

import { AgentCards, AgentChips } from './AgentCard'
import { AgentPanel, hubSteps } from './AgentPanel'

/**
 * The bot swarm hub, built from a bot swarm master record: its hero and
 * sections, one section per agent family with that family's live and pilot
 * agents, and the integrations those agents work with. The record's filter
 * (families, sectors, channel) narrows the agents; empty means all of them.
 *
 * Every section takes its heading from the record and is left out when it
 * has nothing to show, and so is a family with no agents to list. The
 * closing panel is the only navy section. Paints its own hero; the H1 is the
 * record's h1 and the only one on the page.
 */

const hasText = (v?: string | null) => Boolean(v && v.trim())

const richTextIsEmpty = (data: unknown) => {
  if (!data || typeof data !== 'object') return true
  try {
    return !convertLexicalToPlaintext({ data: data as DefaultTypedEditorState }).trim()
  } catch {
    return true
  }
}

const labelledBy = (id: string, text?: string | null) => (hasText(text) ? id : undefined)

const Heading: React.FC<{ id: string; text?: string | null }> = ({ id, text }) =>
  hasText(text) ? <h2 id={id}>{text}</h2> : null

export const BotSwarmHub = async ({ record: m }: { record: MicroAppsMaster }) => {
  const [allFamilies, agents] = await Promise.all([loadAgentFamilies(), loadAgents(m.filter || {})])

  const onlyFamilies = idsOf(m.filter?.families as any)
  const families = (
    onlyFamilies.length ? allFamilies.filter((f) => onlyFamilies.includes(f.id)) : allFamilies
  )
    .map((family) => ({
      family,
      agents: agents.filter((a) => idOf(a.family as any) === family.id),
    }))
    .filter((s) => s.agents.length)

  // The integrations the listed agents work with, once each, in the order
  // they first appear. Only live ones arrive (the CMS read rule).
  const shownAgents = families.flatMap((s) => s.agents)
  const integrationIds = [
    ...new Set(shownAgents.flatMap((a) => populated<Integration>(a.integrations).map((i) => i.id))),
  ]

  const heroAgents = populated<MicroApp>(m.heroAgents).filter(isPublicAgent)
  const image = pickMedia(m.hero?.image as MediaValue)
  const primaryHref = hrefOf(m.cta?.link as LinkValue)
  const secondaryHref = hrefOf(m.hero?.secondaryCta?.link as LinkValue)
  const proof = (m.proofStrip || []).filter((r) => r && !r.pending && r.figure)
  const comparison = (m.comparison || []).filter((r) => r && (r.oldWay || r.withAgents))
  const steps = hubSteps(m)
  const underneath = (m.underneath || []).filter((r) => r && r.title)
  const byIndustry = (m.byIndustry || []).filter((r) => r && r.title)
  const trust = (m.trustCards || []).filter((r) => r && r.title)
  const faqs = (m.faqs || []).filter((f) => f && f.question && f.answer)

  return (
    <div className="ncx-bs">
      <style>{`
        .ncx-bs{font-family:var(--font-body),Arial,sans-serif;color:var(--ncx-body)}

        /* Hero, on the site's light wash, as on the integrations hub. The top
           padding clears the fixed site header. */
        .ncx-bs__hero{position:relative;overflow:hidden;isolation:isolate;background:var(--wash);padding:0 0 clamp(48px,6vw,72px)}
        .ncx-bs__hero::before{content:"";position:absolute;inset:-35%;z-index:0;
          background:
            radial-gradient(38% 46% at 18% 28%, var(--g1), transparent 66%),
            radial-gradient(44% 52% at 78% 16%, var(--g2), transparent 66%),
            radial-gradient(46% 54% at 62% 88%, var(--g3), transparent 66%),
            radial-gradient(42% 50% at 8% 86%, var(--g4), transparent 66%);
          animation:ncxBsDrift 26s ease-in-out infinite alternate;will-change:transform}
        @keyframes ncxBsDrift{
          0%{transform:translate3d(0,0,0) scale(1) rotate(0deg)}
          50%{transform:translate3d(5%,-4%,0) scale(1.16) rotate(4deg)}
          100%{transform:translate3d(-4%,5%,0) scale(1.06) rotate(-3deg)}
        }
        @media(prefers-reduced-motion:reduce){.ncx-bs__hero::before{animation:none}}
        .ncx-bs__hero .inner{position:relative;z-index:1;padding-block:calc(64px + clamp(44px,6vw,76px)) 0}
        .ncx-bs__grid{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:56px;align-items:center}
        .ncx-bs__grid.is-single{grid-template-columns:minmax(0,1fr)}
        .ncx-bs .pill{display:inline-flex;align-items:center;gap:9px;font-family:var(--font-display),Arial,sans-serif;
          font-size:13px;color:var(--ncx-muted);border:1px solid var(--ncx-rule);background:var(--ncx-white);
          padding:7px 15px;border-radius:999px;margin:0 0 24px}
        .ncx-bs .spark{width:7px;height:7px;border-radius:50%;background:var(--ncx-crimson)}
        .ncx-bs h1{font-family:var(--font-display),Arial,sans-serif;font-weight:500;font-size:clamp(36px,4.6vw,56px);
          line-height:1.06;letter-spacing:-.035em;margin:0;max-width:20ch;text-wrap:balance;color:var(--ncx-ink)}
        .ncx-bs .sub{margin:24px 0 0;max-width:56ch;font-size:19px;line-height:1.65;color:var(--ncx-muted)}
        .ncx-bs .cta{margin-top:34px;display:flex;gap:12px;flex-wrap:wrap}
        .ncx-bs .btn{font-family:var(--font-display),Arial,sans-serif;font-size:15px;font-weight:500;padding:13px 24px;
          border-radius:8px;text-decoration:none;display:inline-block;transition:background .18s ease}
        .ncx-bs .btn.primary{background:var(--ncx-crimson);color:var(--ncx-on-navy)}
        .ncx-bs .btn.primary:hover{background:var(--ncx-crimson-hover)}
        .ncx-bs .btn.ghost{border:1px solid var(--ncx-rule);color:var(--ncx-ink);background:var(--ncx-white)}
        .ncx-bs .btn.ghost:hover{border-color:var(--ncx-rule-strong)}
        .ncx-bs .btn:focus-visible,.ncx-bs a:focus-visible{outline:2px solid var(--ncx-focus);outline-offset:3px}
        .ncx-bs__agents{margin-top:28px}
        .ncx-bs__visual{background:var(--ncx-white);border:1px solid var(--ncx-rule);border-radius:var(--ncx-r-panel);
          box-shadow:var(--ncx-shadow);padding:18px}
        .ncx-bs__visual img{width:100%;height:auto;display:block;border-radius:12px}

        /* Sections */
        .ncx-bs__section{padding-block:72px;scroll-margin-top:96px}
        .ncx-bs__section.is-band{background:var(--ncx-white);border-block:1px solid var(--ncx-rule)}
        .ncx-bs__section h2{font-family:var(--font-display),Arial,sans-serif;font-weight:500;
          font-size:clamp(28px,3.4vw,38px);line-height:1.15;letter-spacing:-.03em;margin:0 0 32px;color:var(--ncx-ink);max-width:24ch}
        .ncx-bs__intro{max-width:68ch;font-size:18px;line-height:1.7;color:var(--ncx-body)}
        .ncx-bs__intro p{margin:0 0 1em}

        .ncx-bs__proof{list-style:none;margin:0;padding:0;display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(200px,1fr))}
        .ncx-bs__proof li{border-left:3px solid var(--ncx-crimson);padding:4px 0 4px 18px}
        .ncx-bs__proof .fig{display:block;font-family:var(--font-display),Arial,sans-serif;font-weight:600;
          font-size:clamp(28px,3.2vw,38px);letter-spacing:-.02em;color:var(--ncx-ink);line-height:1.1}
        .ncx-bs__proof .lbl{display:block;margin-top:6px;font-size:15px;line-height:1.5;color:var(--ncx-muted)}

        .ncx-bs__compare{width:100%;border-collapse:collapse;background:var(--ncx-white);border:1px solid var(--ncx-rule);
          border-radius:var(--ncx-r-card);overflow:hidden;font-size:16px;line-height:1.55}
        .ncx-bs__compare th{font-family:var(--font-display),Arial,sans-serif;font-weight:600;font-size:14px;text-align:left;
          color:var(--ncx-ink);background:var(--ncx-cloud);padding:14px 20px;border-bottom:1px solid var(--ncx-rule)}
        .ncx-bs__compare td{padding:16px 20px;border-bottom:1px solid var(--ncx-rule);vertical-align:top;width:50%}
        .ncx-bs__compare tr:last-child td{border-bottom:0}
        .ncx-bs__compare td:first-child{color:var(--ncx-muted)}
        .ncx-bs__compare td:last-child{color:var(--ncx-ink)}

        .ncx-bs__family-head{display:flex;gap:16px;align-items:flex-start;margin:0 0 28px}
        .ncx-bs__family-head .icon{flex:none;width:48px;height:48px;border-radius:12px;background:var(--ncx-white);
          border:1px solid var(--ncx-rule);color:var(--ncx-crimson-ink);display:flex;align-items:center;justify-content:center}
        .ncx-bs__family-head .icon svg{width:24px;height:24px}
        .ncx-bs__family-head h2{margin:0}
        .ncx-bs__family-intro{margin:10px 0 0;max-width:64ch;font-size:18px;line-height:1.6;color:var(--ncx-muted)}
        .ncx-bs__pain{margin:0 0 8px;font-family:var(--font-display),Arial,sans-serif;font-size:19px;line-height:1.5;
          color:var(--ncx-ink);max-width:60ch}
        .ncx-bs__summary{margin:0 0 28px;font-size:16px;line-height:1.65;color:var(--ncx-muted);max-width:68ch}

        .ncx-bs__cards{list-style:none;margin:0;padding:0;display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(240px,1fr))}
        .ncx-bs__cards li{background:var(--ncx-white);border:1px solid var(--ncx-rule);border-radius:var(--ncx-r-card);padding:22px 20px}
        .ncx-bs__cards .eyebrow{margin:0 0 8px;font-family:var(--font-display),Arial,sans-serif;font-size:13px;color:var(--ncx-crimson-ink)}
        .ncx-bs__cards h3{font-family:var(--font-display),Arial,sans-serif;font-weight:600;font-size:17px;line-height:1.3;
          margin:0 0 8px;color:var(--ncx-ink)}
        .ncx-bs__cards p{margin:0;font-size:15px;line-height:1.55;color:var(--ncx-muted)}
        .ncx-bs__cards.is-three{grid-template-columns:repeat(3,minmax(0,1fr))}

        @media(max-width:960px){
          .ncx-bs__grid{grid-template-columns:minmax(0,1fr);gap:36px}
          .ncx-bs__section{padding-block:56px}
          .ncx-bs__cards.is-three{grid-template-columns:minmax(0,1fr)}
        }
        @media(max-width:600px){
          .ncx-bs__compare th,.ncx-bs__compare td{padding:12px 14px;font-size:15px}
        }
      `}</style>

      <header className="ncx-bs__hero">
        <div className="inner ncx-container">
          <div className={`ncx-bs__grid${image ? '' : ' is-single'}`}>
            <div>
              {m.eyebrow ? (
                <p className="pill">
                  <span className="spark" aria-hidden="true" />
                  {m.eyebrow}
                </p>
              ) : null}
              <h1>{m.h1}</h1>
              {m.subheading ? <p className="sub">{m.subheading}</p> : null}
              {(primaryHref && m.cta?.label) || (secondaryHref && m.hero?.secondaryCta?.label) ? (
                <div className="cta">
                  {primaryHref && m.cta?.label ? (
                    <Link className="btn primary" href={primaryHref}>
                      {m.cta.label}
                    </Link>
                  ) : null}
                  {secondaryHref && m.hero?.secondaryCta?.label ? (
                    <Link className="btn ghost" href={secondaryHref}>
                      {m.hero.secondaryCta.label}
                    </Link>
                  ) : null}
                </div>
              ) : null}
              {heroAgents.length ? (
                <div className="ncx-bs__agents">
                  <AgentChips agents={heroAgents} label="Agents in the swarm" />
                </div>
              ) : null}
            </div>
            {image ? (
              <div className="ncx-bs__visual">
                <Image
                  src={image.src}
                  alt={image.alt || ''}
                  width={image.width || 1600}
                  height={image.height || 1200}
                  sizes="(max-width: 960px) 100vw, 560px"
                  unoptimized={image.unoptimized}
                  priority
                />
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {!richTextIsEmpty(m.intro) ? (
        <section className="ncx-bs__section" aria-labelledby={labelledBy('intro', m.introHeading)}>
          <div className="ncx-container">
            <Heading id="intro" text={m.introHeading} />
            <div className="ncx-bs__intro">
              <RichText
                data={m.intro as unknown as DefaultTypedEditorState}
                enableGutter={false}
                enableProse={false}
              />
            </div>
          </div>
        </section>
      ) : null}

      {proof.length ? (
        <section
          className="ncx-bs__section is-band"
          aria-labelledby={labelledBy('proof', m.proofStripHeading)}
        >
          <div className="ncx-container">
            <Heading id="proof" text={m.proofStripHeading} />
            <ul className="ncx-bs__proof">
              {proof.map((r, i) => (
                <li key={r.id || i}>
                  <span className="fig">{r.figure}</span>
                  <span className="lbl">{r.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {comparison.length ? (
        <section
          className="ncx-bs__section"
          aria-labelledby={labelledBy('comparison', m.comparisonHeading)}
        >
          <div className="ncx-container">
            <Heading id="comparison" text={m.comparisonHeading} />
            <table className="ncx-bs__compare">
              <thead>
                <tr>
                  <th scope="col">The old way</th>
                  <th scope="col">With agents</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((r, i) => (
                  <tr key={r.id || i}>
                    <td>{r.oldWay}</td>
                    <td>{r.withAgents}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {families.map(({ family, agents: list }) => (
        <section
          className="ncx-bs__section"
          id={family.slug}
          key={family.id}
          aria-labelledby={`family-${family.slug}`}
        >
          <div className="ncx-container">
            <div className="ncx-bs__family-head">
              {family.icon ? (
                <span className="icon" aria-hidden="true">
                  <BlockIcon name={family.icon} fallback="bot" />
                </span>
              ) : null}
              <div>
                <h2 id={`family-${family.slug}`}>{family.hubHeading || family.name}</h2>
                {family.description ? (
                  <p className="ncx-bs__family-intro">{family.description}</p>
                ) : null}
              </div>
            </div>
            {family.painLine ? <p className="ncx-bs__pain">{family.painLine}</p> : null}
            {family.summary ? <p className="ncx-bs__summary">{family.summary}</p> : null}
            <AgentCards agents={list} label={family.name} />
          </div>
        </section>
      ))}

      {steps.length ? (
        <section
          className="ncx-bs__section is-band"
          aria-labelledby={labelledBy('five-steps', m.fiveStepsHeading)}
        >
          <div className="ncx-container">
            <Heading id="five-steps" text={m.fiveStepsHeading} />
            <AgentPanel steps={steps} />
          </div>
        </section>
      ) : null}

      {underneath.length ? (
        <section
          className="ncx-bs__section"
          aria-labelledby={labelledBy('underneath', m.underneathHeading)}
        >
          <div className="ncx-container">
            <Heading id="underneath" text={m.underneathHeading} />
            <ul className="ncx-bs__cards is-three">
              {underneath.map((r, i) => (
                <li key={r.id || i}>
                  <h3>{r.title}</h3>
                  <p>{r.line}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {hasText(m.worksWithHeading) && integrationIds.length ? (
        <IntegrationsBlock
          blockType="integrations"
          populateBy="selection"
          selectedDocs={integrationIds}
          heading={m.worksWithHeading}
          limit={24}
        />
      ) : null}

      {byIndustry.length ? (
        <section
          className="ncx-bs__section"
          aria-labelledby={labelledBy('by-industry', m.byIndustryHeading)}
        >
          <div className="ncx-container">
            <Heading id="by-industry" text={m.byIndustryHeading} />
            <ul className="ncx-bs__cards">
              {byIndustry.map((r, i) => {
                const sector =
                  r.sector && typeof r.sector === 'object' ? (r.sector as Sector) : null
                return (
                  <li key={r.id || i}>
                    {sector?.name ? <p className="eyebrow">{sector.name}</p> : null}
                    <h3>{r.title}</h3>
                    <p>{r.line}</p>
                  </li>
                )
              })}
            </ul>
          </div>
        </section>
      ) : null}

      {trust.length ? (
        <section
          className="ncx-bs__section is-band"
          aria-labelledby={labelledBy('trust', m.trustCardsHeading)}
        >
          <div className="ncx-container">
            <Heading id="trust" text={m.trustCardsHeading} />
            <ul className="ncx-bs__cards">
              {trust.map((r, i) => (
                <li key={r.id || i}>
                  <h3>{r.title}</h3>
                  <p>{r.line}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {faqs.length ? (
        <FAQBlock
          blockType="faq"
          heading={m.faqHeading || 'Questions about the bot swarm'}
          items={faqs.map((f, i) => ({
            id: f.id || String(i),
            question: f.question,
            answer: paragraph(f.answer),
          }))}
          emitSchema
        />
      ) : null}

      <ClosingCtaBlock
        heading={m.closing?.heading || null}
        subhead={m.closing?.subheading || null}
        primaryLabel={m.cta?.label || null}
        primaryLink={primaryHref || '/contact'}
      />
    </div>
  )
}
