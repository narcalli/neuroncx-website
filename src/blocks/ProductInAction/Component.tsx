import React from 'react'
import Image from 'next/image'

import { BlockIcon } from '@/components/BlockIcon'
import { pickMedia, type MediaValue } from '@/utilities/media'
import type { ProductInActionBlock as ProductInActionProps } from '@/payload-types'

type Card = NonNullable<ProductInActionProps['cards']>[number]

const CardLink = ({ link }: { link: Card['link'] }) => {
  if (!link?.url || !link?.label) return null
  return (
    <a
      className="ncx-pia__link"
      href={link.url}
      {...(link.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {link.label}
    </a>
  )
}

export const ProductInActionBlock: React.FC<ProductInActionProps> = ({
  eyebrow,
  heading,
  intro,
  layout,
  alternateSides,
  theme,
  anchorId,
  cards,
}) => {
  const list = (cards || []).filter((c) => c && c.title)
  if (!list.length) return null

  const stacked = layout !== 'plain'
  const tinted = theme === 'tinted'

  return (
    <section
      id={anchorId || undefined}
      className={`ncx-pia${tinted ? ' is-tinted' : ''}${stacked ? ' is-stacked' : ''}${alternateSides ? ' is-alt' : ''}`}
    >
      <style>{`
        .ncx-pia{--stack-top:96px;--stack-offset:20px;padding:64px 0;
          font-family:var(--font-body),Arial,sans-serif;color:var(--ncx-body)}
        .ncx-pia.is-tinted{background:var(--ncx-cloud)}
        @media(min-width:640px){.ncx-pia{padding:80px 0}}
        @media(min-width:1024px){.ncx-pia{padding:96px 0}}
        .ncx-pia__wrap{max-width:1280px;margin:0 auto;padding:0 16px}
        @media(min-width:640px){.ncx-pia__wrap{padding:0 24px}}

        .ncx-pia__head{max-width:60ch;margin:0 auto 48px;text-align:center}
        .ncx-pia .ncx-pia__eyebrow{font-family:var(--font-display),Arial,sans-serif;font-weight:700;font-size:.8rem;letter-spacing:.08em;text-transform:uppercase;color:var(--ncx-crimson-ink);margin:0 0 12px}
        .ncx-pia h2{font-family:var(--font-display),Arial,sans-serif;font-weight:700;font-size:clamp(1.75rem,3.4vw,2.6rem);line-height:1.15;letter-spacing:-.02em;margin:0;color:var(--ncx-ink)}
        .ncx-pia__intro{margin:16px 0 0;font-size:1.05rem;line-height:1.65;color:var(--ncx-muted)}

        .ncx-pia__list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:32px}
        .ncx-pia__card{position:relative;background:var(--ncx-white);border:1px solid var(--ncx-rule);border-radius:24px;box-shadow:0 18px 40px -28px rgba(26,32,53,.35);overflow:visible}
        .ncx-pia__grid{display:grid;grid-template-columns:1fr;gap:28px;padding:28px}
        @media(min-width:640px){.ncx-pia__grid{padding:36px}}

        .ncx-pia__text{min-width:0;padding:4px 0}
        @media(min-width:1024px){.ncx-pia__text{padding:40px 8px 40px 40px}}
        .ncx-pia__icon{display:inline-flex;width:36px;height:36px;color:var(--ncx-crimson-ink)}
        .ncx-pia__icon svg{width:36px;height:36px}
        .ncx-pia .ncx-pia__card h3{font-family:var(--font-display),Arial,sans-serif;font-weight:700;font-size:1.5rem;line-height:1.25;margin:16px 0 0;color:var(--ncx-ink)}
        .ncx-pia__desc{margin:12px 0 0;font-size:1rem;line-height:1.65;color:var(--ncx-muted)}
        .ncx-pia__bullets{list-style:none;margin:20px 0 0;padding:0;display:grid;gap:10px}
        .ncx-pia__bullets li{display:flex;gap:10px;align-items:flex-start;font-size:.95rem;line-height:1.5;color:var(--ncx-body)}
        .ncx-pia__bullets svg{flex:0 0 auto;width:16px;height:16px;margin-top:3px;color:var(--ncx-crimson-ink)}
        .ncx-pia__link{display:inline-block;margin-top:22px;color:var(--ncx-link);font-weight:600;text-decoration:none}
        .ncx-pia__link:hover{text-decoration:underline}

        .ncx-pia__media{min-width:0}
        .ncx-pia__frame{background:var(--ncx-cloud);border-radius:20px;padding:20px}
        @media(min-width:1024px){.ncx-pia__frame{padding:28px 0 28px 28px}}
        .ncx-pia__shot{display:block;width:100%;height:auto;aspect-ratio:16/10;object-fit:cover;border-radius:12px;box-shadow:0 22px 40px -24px rgba(26,32,53,.45);background:var(--ncx-white)}
        .ncx-pia__caption{margin:12px 2px 0;font-size:.8rem;color:var(--ncx-muted)}

        @media(min-width:1024px){
          .ncx-pia.is-stacked .ncx-pia__list{display:block}
          .ncx-pia.is-stacked .ncx-pia__card{position:sticky;top:calc(var(--stack-top) + var(--card-index) * var(--stack-offset));margin-bottom:0}
          .ncx-pia.is-stacked .ncx-pia__card + .ncx-pia__card{margin-top:0}
          .ncx-pia__grid{grid-template-columns:minmax(0,5fr) minmax(0,7fr);gap:0;align-items:center;padding:0}
          .ncx-pia__media{grid-column:2;grid-row:1}
          .ncx-pia__text{grid-column:1;grid-row:1}
          .ncx-pia.is-alt .ncx-pia__card:nth-child(even) .ncx-pia__text{grid-column:2}
          .ncx-pia.is-alt .ncx-pia__card:nth-child(even) .ncx-pia__media{grid-column:1}
          .ncx-pia.is-alt .ncx-pia__card:nth-child(even) .ncx-pia__frame{padding:28px 28px 28px 0}
          .ncx-pia.is-alt .ncx-pia__card:nth-child(even) .ncx-pia__shot{margin-left:0}
        }
        .ncx-pia__card:hover{box-shadow:0 22px 44px -26px rgba(26,32,53,.4)}
      `}</style>

      <div className="ncx-pia__wrap">
        {eyebrow || heading || intro ? (
          <header className="ncx-pia__head">
            {eyebrow ? <p className="ncx-pia__eyebrow">{eyebrow}</p> : null}
            {heading ? <h2>{heading}</h2> : null}
            {intro ? <p className="ncx-pia__intro">{intro}</p> : null}
          </header>
        ) : null}

        <ol className="ncx-pia__list">
          {list.map((card, i) => {
            const pick = pickMedia(card.image as MediaValue, 'stack1600')
            const alignedWidth = pick?.width ?? 1600
            const alignedHeight = pick?.height ?? Math.round(alignedWidth * 0.625)
            return (
              <li
                key={card.id || i}
                className="ncx-pia__card"
                style={{ ['--card-index' as string]: i, zIndex: i + 1 }}
              >
                <div className="ncx-pia__grid">
                  <div className="ncx-pia__text">
                    {card.icon ? (
                      <span className="ncx-pia__icon" aria-hidden="true">
                        <BlockIcon name={card.icon} fallback="message" stroke="currentColor" />
                      </span>
                    ) : null}
                    <h3>{card.title}</h3>
                    <p className="ncx-pia__desc">{card.description}</p>
                    {card.bullets && card.bullets.length ? (
                      <ul className="ncx-pia__bullets">
                        {card.bullets.map((b, j) =>
                          b?.text ? (
                            <li key={j}>
                              <BlockIcon name="check" fallback="check" stroke="currentColor" />
                              <span>{b.text}</span>
                            </li>
                          ) : null,
                        )}
                      </ul>
                    ) : null}
                    <CardLink link={card.link} />
                  </div>

                  <div className="ncx-pia__media">
                    {pick ? (
                      <div className="ncx-pia__frame">
                        <Image
                          className="ncx-pia__shot"
                          src={pick.src}
                          alt={card.imageAlt}
                          width={alignedWidth}
                          height={alignedHeight}
                          sizes="(min-width: 1024px) 50vw, 100vw"
                          priority={i === 0}
                          loading={i === 0 ? 'eager' : 'lazy'}
                          unoptimized={pick.unoptimized}
                        />
                        {card.imageCaption ? <p className="ncx-pia__caption">{card.imageCaption}</p> : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
