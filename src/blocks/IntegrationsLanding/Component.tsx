import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

import { ClosingCtaBlock } from '@/blocks/ClosingCTA/Component'
import { FAQBlock } from '@/blocks/FAQ/Component'
import { IntegrationsBlock } from '@/blocks/Integrations/Component'
import { IntegrationsMarqueeBlock } from '@/components/blocks/IntegrationsMarquee/IntegrationsMarquee'
import type { SavedCardDesign } from '@/components/cards/defaults'
import { Reveal } from '@/motion/Reveal'
import { SplitHeading } from '@/motion/SplitHeading'
import { CMS_TAG, getMany } from '@/utilities/cms'
import { hrefOf, paragraph, type LinkValue } from '@/utilities/cmsValues'
import { pickMedia, type MediaValue } from '@/utilities/media'
import type {
  Integration,
  IntegrationCategory,
  IntegrationsLandingBlock as IntegrationsLandingBlockProps,
  IntegrationsMaster,
} from '@/payload-types'

/**
 * The integrations landing page in one block, built from an Integrations
 * master record (the chosen one, or the main one with Is main on), the
 * integration categories and the live integration items. Paints its own hero,
 * so the page using it sets its hero to None.
 */

/** The chosen master record, or the main one when none is chosen. */
export const loadMaster = async (
  master?: IntegrationsLandingBlockProps['master'],
): Promise<IntegrationsMaster | null> => {
  const id = typeof master === 'object' ? master?.id : master
  const docs = await getMany<IntegrationsMaster>(
    'integrationsMaster',
    {
      ...(id ? { 'where[id][equals]': id } : { 'where[isMain][equals]': true }),
      limit: 1,
      depth: 2,
    },
    { tags: [CMS_TAG, 'integrations-master'] },
  )
  return docs[0] || null
}

const idsOf = (list?: (string | { id: string })[] | null) =>
  (list || []).map((x) => (typeof x === 'object' ? x.id : x)).filter(Boolean) as string[]

type Section = {
  key: string
  category: IntegrationCategory
  label: string | null
  heading: string | null
  intro: string | null
  /** Merged over the defaults by the Integrations block. */
  cardDesign: SavedCardDesign | null
}

/**
 * The integration sections. With rows in the master's "Integration sections"
 * list: those categories, in that order, each with the text typed in its row.
 * Without: every category (or the ones the master's filter picks), in
 * category order, with the category's own name, hub heading and hub intro.
 *
 * Card settings: a row's own card design when its "Use the page's design"
 * is off, otherwise the master's card design (and, where that is missing,
 * the defaults, which the Integrations block fills in).
 */
const sectionsOf = (m: IntegrationsMaster, categories: IntegrationCategory[]): Section[] => {
  const byId = new Map(categories.map((c) => [c.id, c]))
  const pageDesign = m.cardDesign || null
  const rows = (m.integrationSections || []).flatMap((row): Section[] => {
    const id = typeof row.category === 'object' ? row.category?.id : row.category
    const category = id ? byId.get(id) : undefined
    return category
      ? [
          {
            key: row.id || category.id,
            category,
            label: row.eyebrow || null,
            heading: row.heading || null,
            intro: row.intro || null,
            cardDesign: row.usePageDesign === false ? row.cardDesign || null : pageDesign,
          },
        ]
      : []
  })
  if (rows.length) return rows

  const only = idsOf(m.filter?.categories as any)
  return (only.length ? categories.filter((c) => only.includes(c.id)) : categories).map((c) => ({
    key: c.id,
    category: c,
    label: c.name,
    heading: c.hubHeading || null,
    intro: c.description || null,
    cardDesign: pageDesign,
  }))
}

export const IntegrationsLandingBlock: React.FC<
  Pick<IntegrationsLandingBlockProps, 'master'> & { record?: IntegrationsMaster | null }
> = async ({ master, record }) => {
  const m = record ?? (await loadMaster(master))
  if (!m) return null

  const categories = await getMany<IntegrationCategory>(
    'integrationCategories',
    { sort: 'order', limit: 50, depth: 0 },
    { tags: [CMS_TAG, 'integration-categories'] },
  )
  const products = idsOf(m.filter?.products as any)
  const sections = sectionsOf(m, categories)

  const centred = m.heroLayout === 'centred'
  const systems = ((m.heroSystems || []) as (string | Integration)[]).filter(
    (s): s is Integration => typeof s === 'object' && Boolean(s?.name),
  )
  // The centred hero has no image.
  const image = centred ? null : pickMedia(m.hero?.image as MediaValue)
  const primaryHref = hrefOf(m.cta?.link as LinkValue)
  const secondaryHref = hrefOf(m.hero?.secondaryCta?.link as LinkValue)
  const apiHref = hrefOf(m.apiCard?.link as LinkValue)

  return (
    <div className="ncx-ihub">
      <style>{`
        .ncx-ihub{font-family:var(--font-body),Arial,sans-serif;color:var(--ncx-body)}

        .ncx-ihub__hero{position:relative;overflow:hidden;isolation:isolate;background:var(--wash);padding:0 0 clamp(48px,6vw,72px)}
        .ncx-ihub__hero::before{content:"";position:absolute;inset:-35%;z-index:0;
          background:
            radial-gradient(38% 46% at 18% 28%, var(--g1), transparent 66%),
            radial-gradient(44% 52% at 78% 16%, var(--g2), transparent 66%),
            radial-gradient(46% 54% at 62% 88%, var(--g3), transparent 66%),
            radial-gradient(42% 50% at 8% 86%, var(--g4), transparent 66%);
          animation:ncxDrift 26s ease-in-out infinite alternate;will-change:transform}
        @keyframes ncxDrift{
          0%{transform:translate3d(0,0,0) scale(1) rotate(0deg)}
          50%{transform:translate3d(5%,-4%,0) scale(1.16) rotate(4deg)}
          100%{transform:translate3d(-4%,5%,0) scale(1.06) rotate(-3deg)}
        }
        @media(prefers-reduced-motion:reduce){.ncx-ihub__hero::before{animation:none}}
        .ncx-ihub__hero .inner{position:relative;z-index:1;padding-block:calc(64px + clamp(44px,6vw,76px)) 0}
        .ncx-ihub__grid{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:56px;align-items:center}
        .ncx-ihub__grid.is-single{grid-template-columns:minmax(0,1fr)}
        .ncx-ihub .pill{display:inline-flex;align-items:center;gap:9px;font-family:var(--font-display),Arial,sans-serif;
          font-size:13px;color:var(--ncx-muted);border:1px solid var(--ncx-rule);background:var(--ncx-white);
          padding:7px 15px;border-radius:999px;margin:0 0 24px}
        .ncx-ihub .spark{width:7px;height:7px;border-radius:50%;background:var(--ncx-crimson)}
        .ncx-ihub h1{font-family:var(--font-display),Arial,sans-serif;font-weight:500;font-size:clamp(36px,4.6vw,56px);
          line-height:1.06;letter-spacing:-.035em;margin:0;max-width:var(--ncx-heading-max);text-wrap:balance;color:var(--ncx-ink)}
        .ncx-ihub .sub{margin:24px 0 0;max-width:56ch;font-size:19px;line-height:1.65;color:var(--ncx-muted)}
        .ncx-ihub .cta{margin-top:34px;display:flex;gap:12px;flex-wrap:wrap}
        .ncx-ihub .btn{font-family:var(--font-display),Arial,sans-serif;font-size:15px;font-weight:500;padding:13px 24px;
          border-radius:8px;text-decoration:none;display:inline-block;transition:background .18s ease}
        .ncx-ihub .btn.primary{background:var(--ncx-crimson);color:var(--ncx-on-navy)}
        .ncx-ihub .btn.primary:hover{background:var(--ncx-crimson-hover)}
        .ncx-ihub .btn.ghost{border:1px solid var(--ncx-rule);color:var(--ncx-ink);background:var(--ncx-white)}
        .ncx-ihub .btn.ghost:hover{border-color:var(--ncx-rule-strong)}
        .ncx-ihub .btn:focus-visible,.ncx-ihub a:focus-visible{outline:2px solid var(--ncx-focus);outline-offset:3px}
        .ncx-ihub .systems{list-style:none;margin:28px 0 0;padding:0;display:flex;flex-wrap:wrap;gap:8px}
        .ncx-ihub .systems li{font-size:13px;font-weight:500;color:var(--ncx-ink);background:var(--ncx-white);
          border:1px solid var(--ncx-rule);border-radius:999px;padding:5px 12px}
        .ncx-ihub__visual{background:var(--ncx-white);border:1px solid var(--ncx-rule);border-radius:var(--ncx-r-panel);
          box-shadow:var(--ncx-shadow);padding:18px}
        .ncx-ihub__visual img{width:100%;height:auto;display:block;border-radius:12px}
        /* Centred: one column, everything on the centre line. */
        .ncx-ihub__hero.is-centred .ncx-ihub__grid{justify-items:center;text-align:center}
        .ncx-ihub__hero.is-centred h1,.ncx-ihub__hero.is-centred .sub{margin-inline:auto}
        .ncx-ihub__hero.is-centred .cta,.ncx-ihub__hero.is-centred .systems{justify-content:center}

        .ncx-ihub__section{padding-block:72px}
        .ncx-ihub__section h2{font-family:var(--font-display),Arial,sans-serif;font-weight:500;
          font-size:clamp(28px,3.4vw,38px);line-height:1.15;letter-spacing:-.03em;margin:0 0 36px;color:var(--ncx-ink);max-width:var(--ncx-heading-max)}
        .ncx-ihub__five{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px}
        .ncx-ihub__five li{background:var(--ncx-white);border:1px solid var(--ncx-rule);border-radius:var(--ncx-r-card);padding:22px 20px}
        .ncx-ihub__five .n{font-family:var(--font-display),Arial,sans-serif;font-size:13px;color:var(--ncx-crimson-ink);margin:0 0 10px}
        .ncx-ihub__five h3{font-family:var(--font-display),Arial,sans-serif;font-weight:600;font-size:17px;line-height:1.3;
          margin:0 0 8px;color:var(--ncx-ink)}
        .ncx-ihub__five p{margin:0;font-size:15px;line-height:1.55;color:var(--ncx-muted)}

        .ncx-ihub__wrong{background:var(--ncx-white);border-block:1px solid var(--ncx-rule)}
        .ncx-ihub__rows{margin:0;border-top:1px solid var(--ncx-rule)}
        .ncx-ihub__row{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.4fr);gap:32px;padding:20px 0;
          border-bottom:1px solid var(--ncx-rule)}
        .ncx-ihub__row dt{font-family:var(--font-display),Arial,sans-serif;font-weight:600;font-size:17px;color:var(--ncx-ink)}
        .ncx-ihub__row dd{margin:0;font-size:16px;line-height:1.6;color:var(--ncx-muted)}

        .ncx-ihub__api{display:flex;justify-content:space-between;align-items:center;gap:24px;flex-wrap:wrap;
          background:var(--ncx-white);border:1px solid var(--ncx-rule);border-radius:var(--ncx-r-panel);
          box-shadow:var(--ncx-shadow);padding:32px 36px}
        .ncx-ihub__api h2{margin:0 0 8px;font-size:clamp(24px,2.6vw,30px)}
        .ncx-ihub__api p{margin:0;max-width:60ch;font-size:17px;line-height:1.6;color:var(--ncx-muted)}

        @media(max-width:960px){
          .ncx-ihub__grid{grid-template-columns:minmax(0,1fr);gap:36px}
          .ncx-ihub__section{padding-block:56px}
        }
        @media(max-width:600px){
          .ncx-ihub__row{grid-template-columns:minmax(0,1fr);gap:6px}
          .ncx-ihub__api{padding:24px 22px}
        }
      `}</style>

      <header className={`ncx-ihub__hero${centred ? ' is-centred' : ''}`} data-loop>
        <div className="inner ncx-container">
          <div className={`ncx-ihub__grid${image ? '' : ' is-single'}`}>
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
              {systems.length ? (
                <ul className="systems" aria-label="Systems NeuronCx connects to">
                  {systems.map((s) => (
                    <li key={s.id}>{s.name}</li>
                  ))}
                </ul>
              ) : null}
            </div>
            {image ? (
              <div className="ncx-ihub__visual">
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

      {m.logoStripOn ? (
        <IntegrationsMarqueeBlock blockType="integrationsMarquee" {...(m.logoStrip || {})} />
      ) : null}

      {sections.map((s) => (
        <IntegrationsBlock
          key={s.key}
          blockType="integrations"
          populateBy="filter"
          categories={[s.category.id]}
          products={products}
          label={s.label}
          heading={s.heading}
          intro={s.intro}
          cardDesign={s.cardDesign}
          limit={24}
        />
      ))}

      {m.fiveThings?.length ? (
        <section className="ncx-ihub__section">
          <div className="ncx-container">
            <SplitHeading as="h2">{m.fiveThingsHeading || 'What connecting your systems gives you'}</SplitHeading>
            <ol className="ncx-ihub__five">
              {m.fiveThings.map((t, i) => (
                <li key={t.id || i}>
                  <p className="n">{String(i + 1).padStart(2, '0')}</p>
                  <h3>{t.title}</h3>
                  <p>{t.line}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      ) : null}

      {m.whenFeedsGoWrong?.length ? (
        <section className="ncx-ihub__section ncx-ihub__wrong">
          <div className="ncx-container">
            <SplitHeading as="h2">{m.whenFeedsGoWrongHeading || 'When feeds go wrong'}</SplitHeading>
            <dl className="ncx-ihub__rows">
              {m.whenFeedsGoWrong.map((r, i) => (
                <div className="ncx-ihub__row" key={r.id || i}>
                  <dt>{r.problem}</dt>
                  <dd>{r.whatHappens}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      ) : null}

      {m.apiCard?.heading ? (
        <section className="ncx-ihub__section">
          <div className="ncx-container">
            <div className="ncx-ihub__api">
              <div>
                <SplitHeading as="h2">{m.apiCard.heading}</SplitHeading>
                {m.apiCard.line ? <Reveal as="p">{m.apiCard.line}</Reveal> : null}
              </div>
              {apiHref ? (
                <Link className="btn ghost" href={apiHref}>
                  {m.apiCard.buttonLabel || 'Get in touch'}
                </Link>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {m.faqs?.length ? (
        <FAQBlock
          blockType="faq"
          heading={m.faqHeading || 'Questions about integrations'}
          items={m.faqs.map((f, i) => ({
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
