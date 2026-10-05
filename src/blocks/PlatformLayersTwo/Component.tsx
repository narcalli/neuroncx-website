import React from 'react'

import { CMSLink } from '@/components/Link'
import type { PlatformLayersTwoBlock as PlatformLayersTwoProps } from '@/payload-types'

import { ScrollStackClient, type ScrollStackItem } from './ScrollStackClient'

type Layer = NonNullable<PlatformLayersTwoProps['layers']>[number]

/** Resolves a layer's link through the site's existing CMS link component. */
const renderLink = (link: Layer['link']) => {
  if (!link?.label) return null

  if (link.type === 'internal') {
    if (!link.page || typeof link.page !== 'object') return null
    return (
      <CMSLink
        appearance="inline"
        className="ncx-ss__link"
        label={link.label}
        type="reference"
        reference={{ relationTo: 'pages', value: link.page }}
      />
    )
  }

  return (
    <CMSLink appearance="inline" className="ncx-ss__link" label={link.label} type="custom" url={link.url} />
  )
}

export const PlatformLayersTwoBlock: React.FC<PlatformLayersTwoProps> = ({
  eyebrow,
  heading,
  intro,
  theme,
  showIndicators,
  anchorId,
  layers,
}) => {
  const list = (layers || []).filter((l) => l && l.title)
  if (!list.length) return null

  const items: ScrollStackItem[] = list.map((layer, i) => ({
    key: layer.id || `layer-${i}`,
    title: layer.title,
    tag: layer.tag,
    description: layer.description,
    footnote: layer.footnote,
    footer: renderLink(layer.link),
  }))

  return (
    <section
      id={anchorId || undefined}
      className={`ncx-ss${theme === 'navy' ? ' is-navy' : ''}`}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Poppins:wght@700&display=swap');
        .ncx-ss{--ncx-ss-red:#C62828;--ncx-ss-navy:#1A2035;--ncx-ss-surface:#F7F8FA;
          background:var(--ncx-ss-surface);padding:64px 0;font-family:Inter,Arial,sans-serif;color:#1A1A2E;scroll-margin-top:96px}
        .ncx-ss.is-navy{background:var(--ncx-ss-navy);color:var(--ncx-white)}
        @media(min-width:1024px){.ncx-ss{padding:96px 0}}
        .ncx-ss__wrap{max-width:1280px;margin:0 auto;padding:0 16px}
        @media(min-width:640px){.ncx-ss__wrap{padding:0 24px}}

        .ncx-ss__grid{display:grid;grid-template-columns:1fr;gap:40px}
        @media(min-width:1024px){.ncx-ss__grid{grid-template-columns:repeat(12,minmax(0,1fr));gap:64px}}
        .ncx-ss__sticky{min-width:0}
        @media(min-width:1024px){.ncx-ss__sticky{grid-column:span 5;position:sticky;top:112px;align-self:start}}
        .ncx-ss__stack{grid-column:auto;list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:32px;min-width:0}
        @media(min-width:1024px){.ncx-ss__stack{grid-column:span 7}}

        .ncx-ss .ncx-ss__eyebrow{font-family:Poppins,Arial,sans-serif;font-weight:700;font-size:.8rem;letter-spacing:.08em;text-transform:uppercase;color:var(--ncx-ss-red);margin:0 0 14px}
        .ncx-ss.is-navy .ncx-ss__eyebrow{color:#FF8F8F}
        .ncx-ss h2{font-family:Poppins,Arial,sans-serif;font-weight:700;font-size:clamp(1.75rem,3.4vw,2.6rem);line-height:1.15;letter-spacing:-.02em;margin:0;max-width:20ch;color:inherit}
        .ncx-ss__intro{margin:18px 0 0;font-size:1.05rem;line-height:1.65;color:#475569}
        .ncx-ss.is-navy .ncx-ss__intro{color:var(--ncx-white);opacity:.78}

        .ncx-ss__ind{display:none;list-style:none;margin:36px 0 0;padding:0}
        @media(min-width:1024px){.ncx-ss__ind{display:block}}
        .ncx-ss__ind button{display:flex;align-items:center;gap:12px;width:100%;text-align:left;background:transparent;border:0;border-radius:10px;padding:8px 10px;cursor:pointer;font:inherit;font-weight:600;font-size:.95rem;color:#334155}
        .ncx-ss.is-navy .ncx-ss__ind button{color:var(--ncx-white)}
        .ncx-ss__ind button.is-active,.ncx-ss.is-navy .ncx-ss__ind button.is-active{background:#FEF2F2;color:var(--ncx-ss-red)}
        .ncx-ss__num{display:grid;place-items:center;flex:0 0 24px;width:24px;height:24px;border-radius:6px;background:#E2E8F0;color:#334155;font-size:.75rem;font-weight:700}
        .ncx-ss__ind button.is-active .ncx-ss__num{background:var(--ncx-ss-red);color:#fff}

        .ncx-ss__card{position:relative;display:flex;gap:16px;background:#fff;border:2px solid #E2E8F0;border-radius:24px;box-shadow:0 1px 2px rgba(15,23,42,.05);padding:20px;scroll-margin-top:140px;cursor:pointer;color:#1A1A2E;transition:border-color .35s ease,box-shadow .35s ease,transform .35s ease}
        @media(min-width:640px){.ncx-ss__card{padding:32px}}
        .ncx-ss__card:hover{border-color:#CBD5E1}
        .ncx-ss__card.is-active{border-color:var(--ncx-ss-red);box-shadow:0 20px 40px -12px rgba(198,40,40,.18);transform:translateY(-2px)}
        .ncx-ss__card::before{content:"";position:absolute;left:calc(20px + 24px - 1px);top:-32px;width:2px;height:32px;background:#CBD5E1;transition:background .35s ease}
        @media(min-width:640px){.ncx-ss__card::before{left:calc(32px + 28px - 1px)}}
        .ncx-ss__card:first-child::before{display:none}
        .ncx-ss__card.is-done::before,.ncx-ss__card.is-active::before{background:var(--ncx-ss-red)}

        .ncx-ss__badge{flex:0 0 48px;width:48px;height:48px;border-radius:16px;display:grid;place-items:center;background:#F1F5F9;color:#475569;font-family:Poppins,Arial,sans-serif;font-weight:700;font-size:1.125rem;transition:background .35s ease,color .35s ease,box-shadow .35s ease}
        @media(min-width:640px){.ncx-ss__badge{flex-basis:56px;width:56px;height:56px}}
        .ncx-ss__card.is-active .ncx-ss__badge{background:var(--ncx-ss-red);color:#fff;box-shadow:0 10px 20px -6px rgba(198,40,40,.45)}

        .ncx-ss__body{min-width:0;flex:1}
        .ncx-ss__tag{display:inline-block;margin-bottom:10px;border:1px solid #E2E8F0;background:#F1F5F9;color:#64748B;border-radius:999px;padding:4px 10px;font-size:.75rem;font-weight:600;transition:background .35s ease,color .35s ease,border-color .35s ease}
        .ncx-ss__card.is-active .ncx-ss__tag{background:#FEF2F2;color:var(--ncx-ss-red);border-color:#FECACA}
        .ncx-ss__card h3{font-family:Poppins,Arial,sans-serif;font-weight:700;font-size:1.25rem;line-height:1.3;margin:0;color:var(--ncx-ss-navy)}
        .ncx-ss__desc{margin:10px 0 0;font-size:1rem;line-height:1.65;color:#475569}
        .ncx-ss__note{display:flex;align-items:center;gap:8px;margin:14px 0 0;font-size:.75rem;font-weight:600;color:#64748B}
        .ncx-ss__foot{margin-top:16px}
        .ncx-ss__link{color:var(--ncx-ss-red);font-weight:600;text-decoration:none}
        .ncx-ss__link:hover{text-decoration:underline}

        @media(prefers-reduced-motion:reduce){
          .ncx-ss__card,.ncx-ss__card.is-active{transform:none}
          .ncx-ss__card,.ncx-ss__card::before,.ncx-ss__badge,.ncx-ss__tag{transition:background .35s ease,color .35s ease,border-color .35s ease}
        }
      `}</style>

      <div className="ncx-ss__wrap">
        <ScrollStackClient items={items} showIndicators={Boolean(showIndicators)}>
          {eyebrow ? <p className="ncx-ss__eyebrow">{eyebrow}</p> : null}
          <h2>{heading}</h2>
          {intro ? <p className="ncx-ss__intro">{intro}</p> : null}
        </ScrollStackClient>
      </div>
    </section>
  )
}
