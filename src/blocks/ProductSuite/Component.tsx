import React from 'react'
import Image from 'next/image'

import { BlockIcon } from '@/components/BlockIcon'

type MediaSize = { url?: string | null }

type MediaFile = {
  url?: string | null
  alt?: string | null
  mimeType?: string | null
  sizes?: { card?: MediaSize | null; wide?: MediaSize | null; tall?: MediaSize | null } | null
}

type Product = {
  name?: string | null
  summary?: string | null
  points?: { text?: string | null; id?: string | null }[] | null
  linkLabel?: string | null
  linkHref?: string | null
  cardStyle?: 'tags' | 'steps' | null
  // An id (number or string), a full file, or null when the file was deleted.
  image?: MediaFile | string | number | null
  size?: 'standard' | 'wide' | 'tall' | null
  tint?: 'none' | 'violet' | 'cyan' | 'rose' | 'grey' | null
  teamControls?: string | null
  note?: string | null
  id?: string | null
}

type Props = {
  label?: string | null
  heading?: string | null
  intro?: string | null
  products?: Product[] | null
}

const CMS_URL = process.env.CMS_URL || 'http://localhost:3001'

const TINTS = ['violet', 'cyan', 'rose', 'grey']

const hostOf = (value?: string | null): string => {
  try {
    return new URL(value || '').hostname
  } catch {
    return ''
  }
}

// These are the sites that next.config.ts allows for image resizing.
// Keep this list in step with images.remotePatterns there.
const resizableHosts = (): Set<string> => {
  const hosts = new Set<string>()
  ;[process.env.NEXT_PUBLIC_SERVER_URL, CMS_URL].forEach((u) => {
    const h = hostOf(u)
    if (h) hosts.add(h)
  })
  if (process.env.S3_REGION) hosts.add(`s3.${process.env.S3_REGION}.amazonaws.com`)
  return hosts
}

const isLocalHost = (host: string) =>
  host === 'localhost' || host === '127.0.0.1' || host === '::1' || host.endsWith('.local')

type Picked = { src: string; alt: string; unoptimized: boolean }

/**
 * Finds the picture to show for a card. Returns null when there is nothing
 * usable (no image, only an id, a deleted file, or a file with no address),
 * so the card can fall back to text only.
 */
const pickImage = (image: Product['image'], want: 'card' | 'wide' | 'tall'): Picked | null => {
  if (!image || typeof image !== 'object') return null

  const raw = image.sizes?.[want]?.url || image.url
  if (!raw) return null

  // Files saved by the CMS often have an address that starts with a slash.
  const src = raw.startsWith('/') ? new URL(raw, CMS_URL).toString() : raw
  const host = hostOf(src)
  if (!host) return null

  const isSvg =
    image.mimeType === 'image/svg+xml' || src.split('?')[0].toLowerCase().endsWith('.svg')

  // Skip resizing for SVGs, for local addresses, and for any site we have not
  // allowed. That way an unexpected image site shows the picture as it is
  // instead of breaking the page.
  const unoptimized = isSvg || isLocalHost(host) || !resizableHosts().has(host)

  return { src, alt: image.alt || '', unoptimized }
}

export const ProductSuiteBlock: React.FC<Props> = ({ label, heading, intro, products }) => {
  const items = products || []
  if (!items.length) return null

  // How many steps cards come before each card. Only steps cards are counted,
  // so the image side alternates between them.
  const stepsBefore = items.map((_, i) => items.slice(0, i).filter((x) => x.cardStyle === 'steps').length)

  return (
    <section className="ncx-suite">
      <style>{`
        .ncx-suite{
          /* Products are told apart by weight, not by hue: four surfaces drawn
             from navy and teal, which the palette already owns. Adding a fifth
             product means another weight, not another colour. */
          max-width:1120px;margin:0 auto;padding:56px 32px;
          font-family:var(--font-body),Arial,sans-serif;color:var(--ncx-body)}
        .ncx-suite .label{font-family:var(--font-display),Arial,sans-serif;font-size:14px;
          margin:0 0 12px;color:var(--ncx-crimson-ink)}
        .ncx-suite h2{font-family:var(--font-display),Arial,sans-serif;font-weight:500;
          font-size:clamp(28px,3.4vw,40px);letter-spacing:-.03em;margin:0;max-width:800px}
        .ncx-suite .intro{color:var(--ncx-muted);margin:14px 0 0;max-width:62ch;font-size:18px;line-height:1.6}
        .ncx-suite .grid{margin-top:44px;display:grid;grid-auto-flow:dense;
          grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}

        .ncx-suite .pic{object-fit:contain}

        /* Tags card */
        .ncx-suite .card{display:flex;flex-direction:column;background:var(--ncx-white);
          border:1px solid var(--ncx-rule);border-radius:24px;padding:14px;
          color:inherit;text-decoration:none;
          transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease}
        .ncx-suite a.card:hover{transform:translateY(-3px);border-color:var(--ncx-rule);
          box-shadow:0 12px 28px rgba(26,26,46,.08)}
        .ncx-suite a.card:focus-visible{outline:2px solid var(--ncx-focus);outline-offset:3px}
        .ncx-suite .card.wide{grid-column:span 2}
        .ncx-suite .card.tall{grid-row:span 2}
        .ncx-suite .shot{position:relative;flex:none;height:230px;
          background:var(--ncx-cloud);border-radius:16px}
        .ncx-suite .card.tall .shot{flex:1 1 auto;height:auto;min-height:230px}
        .ncx-suite .shot .in{position:absolute;inset:18px}
        .ncx-suite .body{flex:1;display:flex;flex-direction:column;align-items:center;
          text-align:center;padding:20px 14px 10px}
        .ncx-suite .card.plain .body{padding-top:22px}
        .ncx-suite h3{font-family:var(--font-display),Arial,sans-serif;font-weight:500;
          font-size:21px;letter-spacing:-.02em;margin:0}
        .ncx-suite ul.pills{margin:14px 0 0;padding:0;list-style:none;display:flex;
          flex-wrap:wrap;justify-content:center;gap:8px}
        .ncx-suite ul.pills li{font-family:var(--font-display),Arial,sans-serif;font-size:12.5px;
          color:var(--ncx-muted);border:1px solid var(--ncx-rule);background:var(--ncx-cloud);
          padding:5px 11px;border-radius:999px}
        .ncx-suite .summary{color:var(--ncx-muted);font-size:15.5px;line-height:1.6;margin:14px 0 0}
        .ncx-suite .more{margin-top:auto;padding-top:18px;
          font-family:var(--font-display),Arial,sans-serif;font-weight:500;font-size:14px;
          color:var(--ncx-crimson-ink);text-decoration:none;border-bottom:1px solid transparent}
        .ncx-suite a.more:hover,.ncx-suite a.card:hover .more{text-decoration:underline;
          text-underline-offset:4px}
        .ncx-suite a.more:focus-visible{outline:2px solid var(--ncx-focus);outline-offset:3px}

        /* Steps card */
        .ncx-suite .steps{grid-column:1 / -1;display:grid;grid-template-columns:1fr;
          gap:8px;background:var(--ncx-white);border:1px solid var(--ncx-rule);border-radius:28px;padding:14px}
        .ncx-suite .steps.has-pic{grid-template-columns:1fr 400px}
        .ncx-suite .steps.has-pic.flip{grid-template-columns:400px 1fr}
        .ncx-suite .steps.flip .panel{order:-1}
        .ncx-suite .steps .text{display:flex;flex-direction:column;padding:30px 34px 26px}
        .ncx-suite .steps h3{font-size:26px;letter-spacing:-.025em}
        .ncx-suite .steps .summary{font-size:16.5px;max-width:58ch;margin:12px 0 0}
        .ncx-suite ol.flow{list-style:none;margin:26px 0 0;padding:0}
        .ncx-suite ol.flow li{position:relative;display:flex;gap:14px;
          padding-bottom:16px;font-size:15.5px;line-height:1.5;color:var(--ncx-body)}
        .ncx-suite ol.flow li:last-child{padding-bottom:0}
        .ncx-suite ol.flow li::after{content:"";position:absolute;left:13px;top:32px;
          bottom:4px;width:2px;background:var(--ncx-rule)}
        .ncx-suite ol.flow li:last-child::after{display:none}
        .ncx-suite ol.flow .num{flex:none;width:28px;height:28px;border-radius:50%;
          display:flex;align-items:center;justify-content:center;background:var(--ncx-rule-soft);
          color:var(--ncx-ink);font-family:var(--font-display),Arial,sans-serif;font-weight:600;font-size:13px}
        .ncx-suite ol.flow .txt{padding-top:2px}
        .ncx-suite .team{display:flex;align-items:flex-start;gap:10px;margin-top:18px;
          background:var(--ncx-cloud);border:1px solid var(--ncx-rule);border-radius:14px;
          padding:14px 16px;font-size:14.5px;line-height:1.5;color:var(--ncx-muted)}
        .ncx-suite .team svg{flex:none;width:18px;height:18px;margin-top:2px}
        .ncx-suite .note{margin:16px 0 0;font-size:14px;line-height:1.5;color:var(--ncx-muted)}
        .ncx-suite .steps .more{align-self:flex-start;margin-top:auto;padding-top:22px}
        .ncx-suite .panel{position:relative;min-height:280px;border-radius:20px;
          background:var(--ncx-cloud)}
        .ncx-suite .panel .in{position:absolute;inset:24px}

        .ncx-suite .shot.tint-violet,.ncx-suite .panel.tint-violet{background:var(--ncx-rule-soft)}
        .ncx-suite .shot.tint-cyan,.ncx-suite .panel.tint-cyan{background:var(--ncx-teal-tint)}
        .ncx-suite .shot.tint-rose,.ncx-suite .panel.tint-rose{background:var(--ncx-crimson-tint)}
        .ncx-suite .shot.tint-grey,.ncx-suite .panel.tint-grey{background:var(--ncx-cloud)}

        @media(prefers-reduced-motion:reduce){
          .ncx-suite .card{transition:none}
          .ncx-suite a.card:hover{transform:none}
        }
        @media(max-width:900px){
          .ncx-suite{padding:40px 20px}
          .ncx-suite .grid{margin-top:32px;grid-template-columns:1fr}
          .ncx-suite .card.wide{grid-column:auto}
          .ncx-suite .card.tall{grid-row:auto}
          .ncx-suite .card.tall .shot{flex:none;height:230px;min-height:0}
          .ncx-suite .steps.has-pic,.ncx-suite .steps.has-pic.flip{grid-template-columns:1fr}
          .ncx-suite .steps .panel{order:-1;min-height:220px}
          .ncx-suite .steps .text{padding:22px 20px 20px}
          .ncx-suite .steps h3{font-size:23px}
        }
      `}</style>

      {label ? <p className="label">{label}</p> : null}
      {heading ? <h2>{heading}</h2> : null}
      {intro ? <p className="intro">{intro}</p> : null}

      <div className="grid">
        {items.map((p, i) => {
          const isSteps = p.cardStyle === 'steps'
          const points = (p.points || []).filter((pt) => pt && pt.text)
          const tint = p.tint && TINTS.includes(p.tint) ? ` tint-${p.tint}` : ''
          const linkText = p.linkLabel || 'Read more'
          const key = p.id || i

          if (isSteps) {
            const pic = pickImage(p.image, 'card')
            const flip = stepsBefore[i] % 2 === 1

            return (
              <article
                className={`steps${pic ? ' has-pic' : ''}${flip ? ' flip' : ''}`}
                key={key}
              >
                <div className="text">
                  <h3>{p.name}</h3>
                  {p.summary ? <p className="summary">{p.summary}</p> : null}

                  {points.length ? (
                    <ol className="flow">
                      {points.map((pt, j) => (
                        <li key={pt.id || j}>
                          <span className="num" aria-hidden="true">
                            {j + 1}
                          </span>
                          <span className="txt">{pt.text}</span>
                        </li>
                      ))}
                    </ol>
                  ) : null}

                  {p.teamControls ? (
                    <div className="team">
                      <BlockIcon name="settings" fallback="settings" stroke="currentColor" />
                      <span>{p.teamControls}</span>
                    </div>
                  ) : null}

                  {p.note ? <p className="note">{p.note}</p> : null}

                  {p.linkHref ? (
                    <a className="more" href={p.linkHref}>
                      {linkText}
                    </a>
                  ) : null}
                </div>

                {pic ? (
                  <div className={`panel${tint}`}>
                    <div className="in">
                      <Image
                        className="pic"
                        src={pic.src}
                        alt={pic.alt}
                        fill
                        sizes="(max-width: 900px) 100vw, 400px"
                        loading="lazy"
                        unoptimized={pic.unoptimized}
                      />
                    </div>
                  </div>
                ) : null}
              </article>
            )
          }

          // Wide and tall only apply when there is a picture to fill the space.
          const want = p.size === 'wide' ? 'wide' : p.size === 'tall' ? 'tall' : 'card'
          const pic = pickImage(p.image, want)
          const sizeClass = pic && want !== 'card' ? ` ${want}` : ''
          const sizes =
            want === 'wide'
              ? '(max-width: 900px) 100vw, 740px'
              : '(max-width: 900px) 100vw, 360px'

          const inner = (
            <>
              {pic ? (
                <div className={`shot${tint}`}>
                  <div className="in">
                    <Image
                      className="pic"
                      src={pic.src}
                      alt={pic.alt}
                      fill
                      sizes={sizes}
                      loading="lazy"
                      unoptimized={pic.unoptimized}
                    />
                  </div>
                </div>
              ) : null}
              <div className="body">
                <h3>{p.name}</h3>
                {points.length ? (
                  <ul className="pills">
                    {points.map((pt, j) => (
                      <li key={pt.id || j}>{pt.text}</li>
                    ))}
                  </ul>
                ) : null}
                {p.summary ? <p className="summary">{p.summary}</p> : null}
                {p.linkHref ? <span className="more">{linkText}</span> : null}
              </div>
            </>
          )

          const className = `card${sizeClass}${pic ? '' : ' plain'}`

          return p.linkHref ? (
            <a className={className} href={p.linkHref} key={key}>
              {inner}
            </a>
          ) : (
            <div className={className} key={key}>
              {inner}
            </div>
          )
        })}
      </div>
    </section>
  )
}
