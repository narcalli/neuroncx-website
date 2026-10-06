import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

import { pickMedia, type MediaValue } from '@/utilities/media'
import type { CaseStudy, TestimonialBlock as TestimonialProps } from '@/payload-types'

import { TestimonialCarousel } from './Carousel'

type Quote = NonNullable<TestimonialProps['quotes']>[number]

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

const QuoteCard = ({ q }: { q: Quote }) => {
  const photo = pickMedia(q.photo as MediaValue, 'square')
  const logo = pickMedia(q.logo as MediaValue)
  const story = q.linkedStory && typeof q.linkedStory === 'object' ? (q.linkedStory as CaseStudy) : null
  const storyHref = story && !story.clientPending && story.slug ? `/customers/${story.slug}` : null

  return (
    <figure className="ncx-testi__card">
      <span className="ncx-testi__mark" aria-hidden="true">
        &ldquo;
      </span>
      <blockquote className="ncx-testi__quote">
        <p>{q.quote}</p>
      </blockquote>
      <figcaption className="ncx-testi__attr">
        {photo ? (
          <Image
            className="ncx-testi__photo"
            src={photo.src}
            alt=""
            width={48}
            height={48}
            sizes="48px"
            unoptimized={photo.unoptimized}
          />
        ) : (
          <span className="ncx-testi__avatar" aria-hidden="true">
            {initials(q.attributionName)}
          </span>
        )}
        <span className="ncx-testi__who">
          <span className="ncx-testi__name">{q.attributionName}</span>
          <span className="ncx-testi__role">
            {[q.attributionRole, q.organisation].filter(Boolean).join(' · ')}
          </span>
          {storyHref ? (
            <Link className="ncx-testi__story" href={storyHref}>
              Read story &rarr;
            </Link>
          ) : null}
        </span>
        {logo ? (
          <Image
            className="ncx-testi__logo"
            src={logo.src}
            alt={q.organisation}
            width={logo.width || 120}
            height={logo.height || 40}
            sizes="120px"
            unoptimized={logo.unoptimized}
          />
        ) : null}
      </figcaption>
    </figure>
  )
}

export const TestimonialBlock: React.FC<TestimonialProps> = ({ eyebrow, heading, layout, quotes }) => {
  const list = (quotes || []).filter((q) => q && q.quote && q.attributionName && q.organisation)
  if (!list.length) return null

  const carousel = layout === 'carousel' && list.length > 1

  return (
    <section className="ncx-testi">
      <style>{`
        .ncx-testi{background:var(--ncx-cloud);padding:88px 0;font-family:Inter,Arial,sans-serif;color:var(--ncx-body)}
        .ncx-testi__wrap{max-width:760px;margin:0 auto;padding:0 24px}
        .ncx-testi__eyebrow{font-family:Inter,Arial,sans-serif;font-weight:600;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--ncx-crimson);margin:0 0 12px}
        .ncx-testi__heading{font-family:Poppins,Arial,sans-serif;font-weight:700;font-size:clamp(1.5rem,3vw,2rem);color:var(--ncx-navy);margin:0 0 32px}
        .ncx-testi__card{margin:0;position:relative}
        .ncx-testi__mark{display:block;font-family:Poppins,Arial,sans-serif;font-weight:700;font-size:72px;line-height:1;color:var(--ncx-crimson);opacity:.25;height:40px}
        .ncx-testi__quote{margin:0}
        .ncx-testi__quote p{margin:0;font-family:Poppins,Arial,sans-serif;font-weight:600;font-size:28px;line-height:1.45;color:var(--ncx-navy)}
        @media(max-width:640px){.ncx-testi__quote p{font-size:20px}}
        .ncx-testi__attr{display:flex;align-items:center;gap:16px;margin:32px 0 0}
        .ncx-testi__avatar,.ncx-testi__photo{width:48px;height:48px;border-radius:50%;flex-shrink:0;object-fit:cover}
        .ncx-testi__avatar{display:flex;align-items:center;justify-content:center;background:var(--ncx-crimson);color:#fff;font-weight:600;font-size:15px}
        .ncx-testi__who{display:flex;flex-direction:column;gap:2px;min-width:0}
        .ncx-testi__name{font-weight:600;font-size:14px;color:var(--ncx-navy)}
        .ncx-testi__role{font-size:13px;color:var(--ncx-muted)}
        .ncx-testi__story{font-weight:500;font-size:13px;color:var(--ncx-crimson);text-decoration:none;margin-top:4px}
        .ncx-testi__story:hover{text-decoration:underline}
        .ncx-testi__logo{margin-left:auto;max-width:120px;height:auto;max-height:40px;object-fit:contain}
        .ncx-testi__dots{display:flex;gap:10px;justify-content:center;margin-top:32px}
        .ncx-testi__dots button{width:10px;height:10px;border-radius:50%;border:0;padding:0;background:#D8DAE3;cursor:pointer}
        .ncx-testi__dots button.is-active{background:var(--ncx-crimson)}
      `}</style>
      <div className="ncx-testi__wrap">
        {eyebrow ? <p className="ncx-testi__eyebrow">{eyebrow}</p> : null}
        {heading ? <h2 className="ncx-testi__heading">{heading}</h2> : null}
        {carousel ? (
          <TestimonialCarousel>
            {list.map((q, i) => (
              <QuoteCard key={q.id || i} q={q} />
            ))}
          </TestimonialCarousel>
        ) : (
          <QuoteCard q={list[0]} />
        )}
      </div>
    </section>
  )
}
