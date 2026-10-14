import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import React from 'react'

import { ClosingCtaBlock } from '@/blocks/ClosingCTA/Component'
import { FAQBlock } from '@/blocks/FAQ/Component'
import { loadMaster } from '@/blocks/IntegrationsLanding/Component'
import { CMS_TAG, getMany } from '@/utilities/cms'
import { hrefOf, paragraph, type LinkValue } from '@/utilities/cmsValues'
import { integrationHref } from '@/utilities/integrations'
import { pickMedia, type MediaValue } from '@/utilities/media'
import type {
  ConnectionType,
  Integration,
  IntegrationCategory,
  IntegrationsMaster,
  Product,
} from '@/payload-types'

type Args = { params: Promise<{ slug: string }> }

/**
 * An integration's own page, in the site's light theme. Shown only for a
 * published, Live entry with Own page on (integrations.md in the CMS docs,
 * section 4); every other slug is a 404. Section headings come from the
 * entry's own Section headings, then the main Integrations master record's
 * Item page labels, with {name} replaced by the entry's name.
 */

const publicItem = {
  'where[status][equals]': 'live',
  'where[_status][equals]': 'published',
}

const loadItem = async (slug: string): Promise<Integration | null> => {
  const docs = await getMany<Integration>(
    'integrations',
    {
      ...publicItem,
      'where[slug][equals]': slug,
      'where[hasOwnPage][equals]': true,
      limit: 1,
      depth: 2,
    },
    { tags: [CMS_TAG, 'integrations', `integration-${slug}`] },
  )
  return docs[0] || null
}

const populated = <T extends { id: string }>(
  list?: (string | T | null | undefined)[] | null,
): T[] => (list || []).filter((x): x is T => Boolean(x && typeof x === 'object'))

const objectOf = <T,>(v: unknown): T | null => (v && typeof v === 'object' ? (v as T) : null)

// The entry's chosen related integrations, or up to three other live ones in
// its category.
const loadRelated = async (d: Integration): Promise<Integration[]> => {
  const chosen = populated<Integration>(d.related).filter((r) => r.status === 'live')
  if (chosen.length) return chosen.slice(0, 3)
  const category = objectOf<IntegrationCategory>(d.category)?.id ?? (d.category as string)
  if (!category) return []
  return getMany<Integration>(
    'integrations',
    {
      ...publicItem,
      'where[category][equals]': category,
      'where[id][not_equals]': d.id,
      sort: 'order,name',
      limit: 3,
      depth: 1,
    },
    { tags: [CMS_TAG, 'integrations'] },
  )
}

const DEFAULT_LABELS = {
  statusTable: 'What moves between {name} and NeuronCx',
  edgeCases: 'When things do not go to plan',
  setup: 'What it takes to connect {name}',
  related: 'Other systems like {name}',
} as const

const PROVIDED_BY: Record<string, string> = { you: 'You', neuroncx: 'NeuronCx' }

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const d = await loadItem(slug)
  if (!d) return {}
  return {
    title: d.meta?.title || d.heroHeading || d.name,
    description: d.meta?.description || d.summary || undefined,
  }
}

export default async function IntegrationPage({ params }: Args) {
  const { slug } = await params
  const d = await loadItem(slug)
  if (!d) notFound()
  const [master, related] = await Promise.all([loadMaster(), loadRelated(d)])

  const heading = (key: keyof typeof DEFAULT_LABELS) =>
    (d.headingOverrides?.[key] || master?.labels?.[key] || DEFAULT_LABELS[key]).replaceAll(
      '{name}',
      d.name,
    )

  const category = objectOf<IntegrationCategory>(d.category)
  const connection = objectOf<ConnectionType>(d.connection)
  const products = populated<Product>(d.products)
  const logo = pickMedia(d.logo as MediaValue)

  // The page's button: the entry's own, else the master record's, else contact.
  const ctaHref =
    (d.cta?.label && hrefOf(d.cta.link as LinkValue)) ||
    hrefOf((master as IntegrationsMaster | null)?.cta?.link as LinkValue) ||
    '/contact'
  const ctaLabel =
    (d.cta?.label && hrefOf(d.cta.link as LinkValue) ? d.cta.label : null) ||
    master?.cta?.label ||
    'Talk to our team'

  const flow = (d.statusFlow || []).filter((r) => r && r.event)
  const showPartner = flow.some((r) => r.inPartner)
  const edgeCases = (d.edgeCases || []).filter((r) => r && r.situation)
  const setup = (d.setupChecklist || []).filter((r) => r && r.item)
  const chat = (d.chatExample || []).filter((m) => m && m.text)
  const faqs = (d.faqs || []).filter((f) => f && f.question && f.answer)
  const glance = (d.glance || []).filter((g) => g && g.title)

  return (
    <article className="ncx-iitem">
      <style>{`
        .ncx-iitem{font-family:var(--font-body),Arial,sans-serif;color:var(--ncx-body)}

        /* Hero: the same stage and breadcrumb pill as the customer pages. */
        .ncx-iitem__hero{position:relative;overflow:hidden;isolation:isolate;
          background:var(--wash);padding:0 0 clamp(48px,6vw,72px)}
        .ncx-iitem__hero::before{content:"";position:absolute;inset:-35%;z-index:0;
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
        @media(prefers-reduced-motion:reduce){.ncx-iitem__hero::before{animation:none}}
        .ncx-iitem__hero .inner{position:relative;z-index:1;padding-block:calc(64px + clamp(44px,6vw,76px)) 0}
        .ncx-iitem .crumb{display:inline-flex;align-items:center;gap:9px;flex-wrap:wrap;
          font-family:var(--font-display),Arial,sans-serif;font-size:13px;color:var(--ncx-muted);
          border:1px solid var(--ncx-rule);background:var(--ncx-white);
          padding:7px 15px;border-radius:999px;margin:0 0 24px}
        .ncx-iitem .crumb a{color:var(--ncx-muted);text-decoration:none}
        .ncx-iitem .crumb a:hover{color:var(--ncx-ink)}
        .ncx-iitem .crumb [aria-current]{color:var(--ncx-ink)}
        .ncx-iitem .crumb .sep{color:var(--ncx-faint)}
        .ncx-iitem .spark{width:7px;height:7px;border-radius:50%;background:var(--ncx-crimson)}
        .ncx-iitem__grid{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,.9fr);gap:56px;align-items:start}
        .ncx-iitem .tags{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 18px;padding:0;list-style:none}
        .ncx-iitem .tags li{font-size:12px;font-weight:500;color:var(--ncx-ink);background:var(--ncx-white);
          border:1px solid var(--ncx-rule);border-radius:999px;padding:5px 12px}
        .ncx-iitem h1{font-family:var(--font-display),Arial,sans-serif;font-weight:500;
          font-size:clamp(36px,4.6vw,56px);line-height:1.06;letter-spacing:-.035em;
          margin:0;max-width:18ch;text-wrap:balance;color:var(--ncx-ink)}
        .ncx-iitem .sub{margin:24px 0 0;max-width:52ch;font-size:19px;line-height:1.65;color:var(--ncx-muted)}
        .ncx-iitem .cta{margin-top:34px;display:flex;gap:12px;flex-wrap:wrap}
        .ncx-iitem .btn{font-family:var(--font-display),Arial,sans-serif;font-size:15px;font-weight:500;
          padding:13px 24px;border-radius:8px;text-decoration:none;display:inline-block;
          background:var(--ncx-crimson);color:var(--ncx-on-navy);transition:background .18s ease}
        .ncx-iitem .btn:hover{background:var(--ncx-crimson-hover)}
        .ncx-iitem .btn:focus-visible,.ncx-iitem a:focus-visible{outline:2px solid var(--ncx-focus);outline-offset:3px}

        /* At a glance card */
        .ncx-iitem__card{background:var(--ncx-white);border:1px solid var(--ncx-rule);border-radius:var(--ncx-r-card);
          box-shadow:var(--ncx-shadow);padding:24px 26px}
        .ncx-iitem__id{display:flex;align-items:center;gap:14px;padding-bottom:18px;margin-bottom:6px;
          border-bottom:1px solid var(--ncx-rule-soft)}
        .ncx-iitem__mark{flex:0 0 44px;width:44px;height:44px;border-radius:10px;background:var(--ncx-cloud);
          display:flex;align-items:center;justify-content:center;overflow:hidden}
        .ncx-iitem__mark img{max-width:34px;max-height:34px;width:auto;height:auto;object-fit:contain}
        .ncx-iitem__initial{font-family:var(--font-display),Arial,sans-serif;font-size:18px;font-weight:500;color:var(--ncx-muted)}
        .ncx-iitem__id b{display:block;font-family:var(--font-display),Arial,sans-serif;font-size:17px;font-weight:600;color:var(--ncx-ink)}
        .ncx-iitem__id span.note{display:block;margin-top:2px;font-size:13px;color:var(--ncx-muted)}
        .ncx-iitem__glance{list-style:none;margin:0;padding:0}
        .ncx-iitem__glance li{padding:13px 0;border-bottom:1px solid var(--ncx-rule-soft)}
        .ncx-iitem__glance li:last-child{border-bottom:0;padding-bottom:0}
        .ncx-iitem__glance b{display:block;font-size:15px;font-weight:600;color:var(--ncx-ink)}
        .ncx-iitem__glance span{display:block;margin-top:3px;font-size:14px;line-height:1.5;color:var(--ncx-muted)}

        /* Sections */
        .ncx-iitem__section{padding-block:72px}
        .ncx-iitem__section.is-band{background:var(--ncx-white);border-block:1px solid var(--ncx-rule)}
        .ncx-iitem__section h2{font-family:var(--font-display),Arial,sans-serif;font-weight:500;
          font-size:clamp(28px,3.4vw,38px);line-height:1.15;letter-spacing:-.03em;margin:0 0 32px;color:var(--ncx-ink);max-width:26ch}

        /* What moves */
        .ncx-iitem__table{width:100%;border-collapse:collapse;font-size:15px;line-height:1.55}
        .ncx-iitem__table th{text-align:left;font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;
          color:var(--ncx-muted);padding:0 20px 12px 0;border-bottom:1px solid var(--ncx-rule-strong)}
        .ncx-iitem__table td{padding:16px 20px 16px 0;border-bottom:1px solid var(--ncx-rule);vertical-align:top;color:var(--ncx-muted)}
        .ncx-iitem__table td:first-child{font-family:var(--font-display),Arial,sans-serif;font-weight:600;color:var(--ncx-ink);width:28%}
        .ncx-iitem__table .state{display:inline-block;font-size:13px;font-weight:500;color:var(--ncx-ink);
          background:var(--ncx-cloud);border:1px solid var(--ncx-rule-soft);border-radius:999px;padding:2px 10px;white-space:nowrap}

        /* Chat example */
        .ncx-iitem__chat{max-width:560px;background:var(--ncx-cloud);border:1px solid var(--ncx-rule);
          border-radius:var(--ncx-r-panel);padding:22px;display:flex;flex-direction:column;gap:10px}
        .ncx-iitem__msg{max-width:82%;padding:10px 14px;border-radius:14px;font-size:15px;line-height:1.5;
          background:var(--ncx-white);border:1px solid var(--ncx-rule);color:var(--ncx-ink)}
        .ncx-iitem__msg.is-customer{align-self:flex-end;background:#e7f6e9;border-color:#cfe9d3}
        .ncx-iitem__msg .who{display:block;font-size:12px;color:var(--ncx-muted);margin-bottom:3px}
        .ncx-iitem__msg time{display:block;text-align:right;font-size:11px;color:var(--ncx-faint);margin-top:4px}

        /* Edge cases */
        .ncx-iitem__rows{margin:0;border-top:1px solid var(--ncx-rule)}
        .ncx-iitem__row{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.4fr);gap:32px;padding:20px 0;
          border-bottom:1px solid var(--ncx-rule)}
        .ncx-iitem__row dt{font-family:var(--font-display),Arial,sans-serif;font-weight:600;font-size:17px;color:var(--ncx-ink)}
        .ncx-iitem__row dd{margin:0;font-size:16px;line-height:1.6;color:var(--ncx-muted)}

        /* Setup */
        .ncx-iitem__setup{list-style:none;margin:0;padding:0;counter-reset:step;display:grid;gap:12px;max-width:820px}
        .ncx-iitem__setup li{counter-increment:step;display:grid;grid-template-columns:36px minmax(0,1fr) auto;gap:16px;
          align-items:center;background:var(--ncx-white);border:1px solid var(--ncx-rule);border-radius:var(--ncx-r-card);padding:16px 20px}
        .ncx-iitem__setup li::before{content:counter(step,decimal-leading-zero);font-family:var(--font-display),Arial,sans-serif;
          font-size:13px;color:var(--ncx-crimson-ink)}
        .ncx-iitem__setup .what{font-size:16px;line-height:1.5;color:var(--ncx-ink)}
        .ncx-iitem__setup .by{font-size:12px;color:var(--ncx-muted);white-space:nowrap}
        .ncx-iitem__setup .by b{font-weight:600;color:var(--ncx-ink)}

        /* Related */
        .ncx-iitem__cards{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px}
        .ncx-iitem__small{display:flex;gap:12px;align-items:flex-start;background:var(--ncx-white);
          border:1px solid var(--ncx-rule);border-radius:var(--ncx-r-card);padding:18px 20px;height:100%;
          color:inherit;text-decoration:none}
        a.ncx-iitem__small{transition:border-color .18s ease}
        a.ncx-iitem__small:hover{border-color:var(--ncx-rule-strong)}
        a.ncx-iitem__small:hover b{text-decoration:underline;text-underline-offset:3px}
        .ncx-iitem__small .ncx-iitem__mark{flex-basis:34px;width:34px;height:34px;border-radius:8px}
        .ncx-iitem__small .ncx-iitem__mark img{max-width:26px;max-height:26px}
        .ncx-iitem__small .ncx-iitem__initial{font-size:15px}
        .ncx-iitem__small b{display:block;font-family:var(--font-display),Arial,sans-serif;font-size:15px;font-weight:600;color:var(--ncx-ink)}
        .ncx-iitem__small span.note{display:block;margin-top:4px;font-size:13px;line-height:1.5;color:var(--ncx-muted)}

        @media(max-width:960px){
          .ncx-iitem__grid{grid-template-columns:minmax(0,1fr);gap:36px}
          .ncx-iitem__section{padding-block:56px}
        }
        @media(max-width:700px){
          .ncx-iitem__table thead{display:none}
          .ncx-iitem__table,.ncx-iitem__table tbody,.ncx-iitem__table tr,.ncx-iitem__table td{display:block;width:auto}
          .ncx-iitem__table tr{padding:16px 0;border-bottom:1px solid var(--ncx-rule)}
          .ncx-iitem__table td{border:0;padding:0}
          .ncx-iitem__table td:first-child{width:auto}
          .ncx-iitem__table td + td{margin-top:8px}
          .ncx-iitem__row{grid-template-columns:minmax(0,1fr);gap:6px}
          .ncx-iitem__setup li{grid-template-columns:28px minmax(0,1fr);gap:4px 12px}
          .ncx-iitem__setup .by{grid-column:2}
          .ncx-iitem__card{padding:20px}
        }
      `}</style>

      <header className="ncx-iitem__hero">
        <div className="inner ncx-container">
          <nav className="crumb" aria-label="Breadcrumb">
            <span className="spark" aria-hidden="true" />
            <Link href="/integrations">Integrations</Link>
            <span className="sep" aria-hidden="true">
              /
            </span>
            <span aria-current="page">{d.name}</span>
          </nav>

          <div className="ncx-iitem__grid">
            <div>
              {category || connection ? (
                <ul className="tags" aria-label="Integration type">
                  {category ? <li>{category.name}</li> : null}
                  {connection ? <li>{connection.badgeLabel || connection.name}</li> : null}
                </ul>
              ) : null}
              <h1>{d.heroHeading || d.name}</h1>
              {d.heroSubheading || d.summary ? (
                <p className="sub">{d.heroSubheading || d.summary}</p>
              ) : null}
              <div className="cta">
                <Link className="btn" href={ctaHref}>
                  {ctaLabel}
                </Link>
              </div>
            </div>

            <aside className="ncx-iitem__card" aria-label={`About ${d.name}`}>
              <div className="ncx-iitem__id">
                <span className="ncx-iitem__mark" aria-hidden="true">
                  {logo ? (
                    <Image
                      src={logo.src}
                      alt=""
                      width={logo.width || 120}
                      height={logo.height || 120}
                      sizes="34px"
                      unoptimized={logo.unoptimized}
                    />
                  ) : (
                    <span className="ncx-iitem__initial">{d.name.charAt(0)}</span>
                  )}
                </span>
                <span>
                  <b>{d.name}</b>
                  {d.tagline ? <span className="note">{d.tagline}</span> : null}
                  {products.length ? (
                    <span className="note">
                      Works with {products.map((p) => p.name).join(', ')}
                    </span>
                  ) : null}
                </span>
              </div>
              {glance.length ? (
                <ul className="ncx-iitem__glance" aria-label="At a glance">
                  {glance.map((g, i) => (
                    <li key={g.id || i}>
                      <b>{g.title}</b>
                      {g.line ? <span>{g.line}</span> : null}
                    </li>
                  ))}
                </ul>
              ) : null}
            </aside>
          </div>
        </div>
      </header>

      {flow.length ? (
        <section className="ncx-iitem__section" aria-labelledby="what-moves">
          <div className="ncx-container">
            <h2 id="what-moves">{heading('statusTable')}</h2>
            <table className="ncx-iitem__table">
              <thead>
                <tr>
                  <th scope="col">When</th>
                  {showPartner ? <th scope="col">In {d.name}</th> : null}
                  <th scope="col">What happens in NeuronCx</th>
                </tr>
              </thead>
              <tbody>
                {flow.map((r, i) => (
                  <tr key={r.id || i}>
                    <td>{r.event}</td>
                    {showPartner ? (
                      <td>{r.inPartner ? <span className="state">{r.inPartner}</span> : null}</td>
                    ) : null}
                    <td>{r.whatHappens}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {chat.length ? (
        <section className="ncx-iitem__section" aria-labelledby="example">
          <div className="ncx-container">
            <h2 id="example">An example conversation</h2>
            <div className="ncx-iitem__chat">
              {chat.map((m, i) => (
                <p className={`ncx-iitem__msg is-${m.sender}`} key={m.id || i}>
                  {m.label ? <span className="who">{m.label}</span> : null}
                  {m.text}
                  {m.time ? <time>{m.time}</time> : null}
                </p>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {edgeCases.length ? (
        <section className="ncx-iitem__section is-band" aria-labelledby="edge-cases">
          <div className="ncx-container">
            <h2 id="edge-cases">{heading('edgeCases')}</h2>
            <dl className="ncx-iitem__rows">
              {edgeCases.map((r, i) => (
                <div className="ncx-iitem__row" key={r.id || i}>
                  <dt>{r.situation}</dt>
                  <dd>{r.whatWeDo}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      ) : null}

      {setup.length ? (
        <section className="ncx-iitem__section" aria-labelledby="setup">
          <div className="ncx-container">
            <h2 id="setup">{heading('setup')}</h2>
            <ol className="ncx-iitem__setup">
              {setup.map((r, i) => (
                <li key={r.id || i}>
                  <span className="what">{r.item}</span>
                  <span className="by">
                    From <b>{PROVIDED_BY[r.providedBy] || d.name}</b>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </section>
      ) : null}

      {faqs.length ? (
        <FAQBlock
          blockType="faq"
          heading={`Questions about ${d.name}`}
          items={faqs.map((f, i) => ({
            id: f.id || String(i),
            question: f.question,
            answer: paragraph(f.answer),
          }))}
          emitSchema
        />
      ) : null}

      {related.length ? (
        <section className="ncx-iitem__section" aria-labelledby="related">
          <div className="ncx-container">
            <h2 id="related">{heading('related')}</h2>
            <ul className="ncx-iitem__cards">
              {related.map((r) => {
                const mark = pickMedia(r.logo as MediaValue)
                const href = integrationHref(r)
                const body = (
                  <>
                    <span className="ncx-iitem__mark" aria-hidden="true">
                      {mark ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={mark.src} alt="" loading="lazy" />
                      ) : (
                        <span className="ncx-iitem__initial">{r.name.charAt(0)}</span>
                      )}
                    </span>
                    <span>
                      <b>{r.name}</b>
                      {r.summary ? <span className="note">{r.summary}</span> : null}
                    </span>
                  </>
                )
                return (
                  <li key={r.id}>
                    {href ? (
                      <Link className="ncx-iitem__small" href={href}>
                        {body}
                      </Link>
                    ) : (
                      <div className="ncx-iitem__small">{body}</div>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        </section>
      ) : null}

      <ClosingCtaBlock
        heading={master?.closing?.heading || 'Connect the systems you already use'}
        subhead={master?.closing?.subheading || null}
        primaryLabel={ctaLabel}
        primaryLink={ctaHref}
      />
    </article>
  )
}
