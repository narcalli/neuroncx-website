import React from 'react'
import Image from 'next/image'

import { pickMedia, type MediaValue } from '@/utilities/media'
import { Animator } from './Animator'

type LinkGroup = {
  type?: 'reference' | 'custom' | null
  reference?: {
    relationTo?: 'pages' | 'posts'
    value?: { slug?: string | null } | string | number | null
  } | null
  url?: string | null
  label?: string | null
  newTab?: boolean | null
} | null

type Props = {
  eyebrow?: string | null
  headline?: string | null
  subhead?: string | null
  primaryCta?: LinkGroup
  secondaryCta?: LinkGroup
  metaItems?: { text?: string | null; id?: string | null }[] | null
  media?: MediaValue
  mediaAlt?: string | null
  mediaPlacement?: 'fullBleed' | 'right' | null
  mediaFit?: 'cover' | 'contain' | null
  videoPoster?: MediaValue
  mobileMedia?: MediaValue
  focalPoint?: 'center' | 'left' | 'right' | 'top' | 'bottom' | null
  overlayStrength?: 'light' | 'medium' | 'strong' | null
  animation?: 'off' | 'subtle' | 'lively' | null
  height?: 'tall' | 'medium' | null
}

const FOCAL: Record<string, string> = {
  center: '50% 50%',
  left: '0% 50%',
  right: '100% 50%',
  top: '50% 0%',
  bottom: '50% 100%',
}

/** Resolves a CTA group into a real address, or null when there is nothing to link to. */
const resolveHref = (cta: LinkGroup | undefined): string | null => {
  if (!cta) return null
  if (cta.type === 'custom') return cta.url || null
  if (cta.type === 'reference' && cta.reference && typeof cta.reference.value === 'object') {
    const slug = cta.reference.value?.slug
    if (!slug) return null
    return cta.reference.relationTo === 'posts' ? `/posts/${slug}` : `/${slug}`
  }
  return null
}

/**
 * A media layer: picks the right tag for the file's type. Video and GIF
 * bypass next/image — GIFs lose their animation through it, and video needs
 * a real <video> element. A GIF or unlisted-host image also renders
 * unoptimized so it still shows up rather than breaking the page.
 */
const MediaLayer: React.FC<{
  value: MediaValue
  poster: MediaValue
  focalPoint: string
  /** Overrides the focal-point position outright, e.g. "right center" for a
   *  contained diagram in Right placement. */
  objectPositionOverride?: string
  fit: 'cover' | 'contain'
  priority?: boolean
  sizes: string
}> = ({ value, poster, focalPoint, objectPositionOverride, fit, priority, sizes }) => {
  // "hero" is a large named size made for full-bleed backgrounds (about
  // 2560px wide). Falls back to the original file when there is no
  // hero-sized copy — either the source itself is narrower than 2560px (in
  // which case the original is already the best quality available; Payload
  // will not upscale it, since that would look worse, not better), or the
  // file is a GIF or a video, neither of which get a sized copy.
  const pic = pickMedia(value, 'hero')
  if (!pic) return null

  const posterPic = pickMedia(poster)
  const objectPosition = objectPositionOverride || FOCAL[focalPoint] || FOCAL.center
  const style = { objectPosition, objectFit: fit, background: 'transparent' } as React.CSSProperties

  if (pic.isVideo) {
    return (
      <>
        <video
          className="media media-video"
          style={style}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={posterPic?.src}
        >
          <source src={pic.src} />
        </video>
        {/* Shown instead of the video when the visitor prefers reduced motion — a pure CSS swap, no JS needed. */}
        {posterPic ? (
          <Image
            className="media media-video-fallback"
            src={posterPic.src}
            alt=""
            fill
            sizes="100vw"
            unoptimized={posterPic.unoptimized}
            style={style}
          />
        ) : null}
      </>
    )
  }

  if (pic.isGif) {
    // eslint-disable-next-line @next/next/no-img-element -- next/image's optimiser drops GIF animation.
    return <img className="media" src={pic.src} alt={pic.alt} style={style} />
  }

  return (
    <Image
      className="media"
      src={pic.src}
      alt={pic.alt}
      fill
      priority={priority}
      loading={priority ? undefined : 'lazy'}
      sizes={sizes}
      unoptimized={pic.unoptimized}
      style={style}
    />
  )
}

export const HeroFullBackgroundBlock: React.FC<Props> = ({
  eyebrow,
  headline,
  subhead,
  primaryCta,
  secondaryCta,
  metaItems,
  media,
  mediaAlt,
  mediaPlacement,
  mediaFit,
  videoPoster,
  mobileMedia,
  focalPoint,
  overlayStrength,
  animation,
  height,
}) => {
  if (!headline) return null

  const words = headline.trim().split(/\s+/)
  const items = (metaItems || []).filter((m) => m && m.text)
  const anim = animation || 'subtle'
  const placement = mediaPlacement === 'right' ? 'right' : 'fullBleed'
  // Contain always leaves letterbox bars once media fills the whole hero, so
  // full bleed is forced to cover regardless of what is saved — the admin
  // hides the choice for full bleed, but this also covers a block that had
  // "right" and contain saved before it was switched back to full bleed.
  const fit: 'cover' | 'contain' = placement === 'right' ? mediaFit || 'contain' : 'cover'
  // A contained diagram is pushed to the right edge, so it meets the media
  // box's right edge with no gap — center would leave a hard-edged gap on
  // both sides, which the mask cannot fade because there is nothing there.
  const objectPositionOverride = placement === 'right' && fit === 'contain' ? 'right center' : undefined

  const primaryHref = resolveHref(primaryCta)
  const secondaryHref = resolveHref(secondaryCta)

  // A decorative background by default; mediaAlt only kicks in when the
  // editor says the picture itself carries meaning.
  const mediaValue: MediaValue =
    media && typeof media === 'object' && mediaAlt ? { ...media, alt: mediaAlt } : media

  return (
    <section
      className="ncx-hfb"
      data-anim={anim}
      data-height={height === 'medium' ? 'medium' : 'tall'}
      data-overlay={overlayStrength || 'strong'}
      data-placement={placement}
    >
      <style>{`
        .ncx-hfb{position:relative;overflow:hidden;isolation:isolate;background:var(--ncx-navy);
          font-family:var(--font-body),Arial,sans-serif;color:var(--ncx-on-navy);
          height:min(88vh,760px)}
        .ncx-hfb[data-height="medium"]{height:min(64vh,560px)}

        .ncx-hfb .bg{position:absolute;inset:0;z-index:0}
        .ncx-hfb .layer{position:absolute;inset:0}
        .ncx-hfb .layer-mobile{display:none}
        .ncx-hfb .media{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
        .ncx-hfb .media-video-fallback{display:none}

        /* Slow zoom and pan. Purely decorative, so it runs without waiting on JS. */
        .ncx-hfb[data-anim="subtle"] .layer .media,
        .ncx-hfb[data-anim="lively"] .layer .media{
          animation:ncx-hfb-pan 22s ease-in-out infinite alternate}
        @keyframes ncx-hfb-pan{from{transform:scale(1.02)}to{transform:scale(1.12)}}

        .ncx-hfb .overlay{position:absolute;inset:0;z-index:1;pointer-events:none}
        .ncx-hfb .overlay{
          background:
            linear-gradient(90deg,rgba(10,14,28,var(--o1)) 0%,rgba(10,14,28,var(--o2)) 42%,rgba(10,14,28,var(--o3)) 78%),
            linear-gradient(0deg,rgba(10,14,28,var(--o4)) 0%,rgba(10,14,28,0) 46%)}
        .ncx-hfb{--o1:.74;--o2:.55;--o3:.24;--o4:.68}
        .ncx-hfb[data-overlay="light"]{--o1:.62;--o2:.42;--o3:.16;--o4:.58}
        .ncx-hfb[data-overlay="strong"]{--o1:.86;--o2:.68;--o3:.36;--o4:.78}
        /* Strong: a near-solid panel behind the text column, fading into the rest of the overlay. */
        .ncx-hfb[data-overlay="strong"] .overlay{
          background:
            linear-gradient(90deg,rgba(10,14,28,.92) 0%,rgba(10,14,28,.92) 45%,rgba(10,14,28,var(--o2)) 65%,rgba(10,14,28,var(--o3)) 78%),
            linear-gradient(0deg,rgba(10,14,28,var(--o4)) 0%,rgba(10,14,28,0) 46%)}

        /* Right placement: media sits in the right 60% of the hero, running
           to the true right edge of the viewport (not the 1180px text
           container) and the full height of the hero. Text sits on plain
           navy at the left, so no dark overlay is needed there. */
        .ncx-hfb[data-placement="right"] .overlay{display:none}
        .ncx-hfb[data-placement="right"] .bg{inset:0 0 0 40%;background:transparent}
        .ncx-hfb[data-placement="right"] .layer{
        /* The #000 below are mask stencils, not colours: these gradients
           supply an alpha channel only, so there is no token to point
           them at. */
          -webkit-mask-image:
            linear-gradient(90deg,transparent 0%,#000 35%),
            linear-gradient(180deg,transparent 0%,#000 10%,#000 90%,transparent 100%);
          -webkit-mask-composite:source-in,source-in;
          mask-image:
            linear-gradient(90deg,transparent 0%,#000 35%),
            linear-gradient(180deg,transparent 0%,#000 10%,#000 90%,transparent 100%);
          mask-composite:intersect}
        .ncx-hfb[data-placement="right"][data-anim="subtle"] .layer .media,
        .ncx-hfb[data-placement="right"][data-anim="lively"] .layer .media{
          animation:ncx-hfb-pan-tight 22s ease-in-out infinite alternate}
        @keyframes ncx-hfb-pan-tight{from{transform:scale(1.01)}to{transform:scale(1.05)}}

        .ncx-hfb .content{position:absolute;inset:0;z-index:2;display:flex;align-items:flex-end}
        .ncx-hfb .ncx-container{width:100%;padding-bottom:56px}
        .ncx-hfb .inner{max-width:640px;text-shadow:0 1px 3px rgba(0,0,0,.35)}
        .ncx-hfb[data-placement="right"] .inner{max-width:44%}
        .ncx-hfb .eyebrow{font-family:var(--font-display),Arial,sans-serif;font-size:14px;font-weight:600;
          color:var(--ncx-crimson-on-navy);margin:0 0 14px}
        .ncx-hfb h1{font-family:var(--font-display),Arial,sans-serif;font-weight:700;
          font-size:clamp(32px,5.2vw,56px);line-height:1.08;letter-spacing:-.02em;margin:0;
          max-width:14ch;text-wrap:balance}
        .ncx-hfb .word{display:inline-block;white-space:pre}
        .ncx-hfb .subhead{margin:20px 0 0;font-size:18px;line-height:1.6;max-width:56ch;color:var(--ncx-on-navy-soft)}
        .ncx-hfb .cta{margin-top:28px;display:flex;flex-wrap:wrap;gap:14px}
        .ncx-hfb .btn{font-family:var(--font-display),Arial,sans-serif;font-weight:500;font-size:15px;
          display:inline-flex;align-items:center;gap:8px;padding:13px 22px;border-radius:10px;
          text-decoration:none;transition:transform .15s ease,background .15s ease,border-color .15s ease}
        .ncx-hfb .btn-primary{background:var(--ncx-crimson);color:var(--ncx-on-navy)}
        .ncx-hfb .btn-primary:hover{background:var(--ncx-crimson-hover)}
        .ncx-hfb .btn-ghost{background:var(--ncx-on-navy-raise);color:var(--ncx-on-navy);border:1px solid var(--ncx-on-navy-rule-strong)}
        .ncx-hfb .btn-ghost:hover{background:rgba(255,255,255,.14);border-color:rgba(255,255,255,.7)}
        .ncx-hfb .btn:focus-visible{outline:2px solid var(--ncx-on-navy);outline-offset:3px}
        .ncx-hfb .meta{list-style:none;display:flex;flex-wrap:wrap;gap:10px 18px;
          margin:26px 0 0;padding:0;font-size:14px;color:var(--ncx-on-navy-soft)}
        .ncx-hfb .meta li{display:flex;align-items:center;gap:8px}
        .ncx-hfb .meta li::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--ncx-crimson)}

        /* Entrance. Base state is fully visible — this only adds motion once
           the Animator client component marks the block as in view. */
        .ncx-hfb[data-anim="subtle"] .word,.ncx-hfb[data-anim="lively"] .word{
          opacity:0;transform:translateY(16px)}
        .ncx-hfb[data-anim="lively"] .word{filter:blur(6px);transform:translateY(16px) rotate(-2deg)}
        .ncx-hfb[data-anim="subtle"] .subhead,.ncx-hfb[data-anim="subtle"] .cta,.ncx-hfb[data-anim="subtle"] .meta,
        .ncx-hfb[data-anim="lively"] .subhead,.ncx-hfb[data-anim="lively"] .cta,.ncx-hfb[data-anim="lively"] .meta{
          opacity:0;transform:translateY(14px)}

        .ncx-hfb[data-anim="subtle"] .content.in .word{
          animation:ncx-hfb-word-in .6s cubic-bezier(.2,.7,.2,1) forwards;
          animation-delay:calc(var(--i) * 35ms)}
        .ncx-hfb[data-anim="lively"] .content.in .word{
          animation:ncx-hfb-word-in-lively .7s cubic-bezier(.2,.7,.2,1) forwards;
          animation-delay:calc(var(--i) * 75ms)}
        .ncx-hfb[data-anim] .content.in .subhead{animation:ncx-hfb-rise .5s ease forwards;animation-delay:.25s}
        .ncx-hfb[data-anim] .content.in .cta{animation:ncx-hfb-rise .5s ease forwards;animation-delay:.38s}
        .ncx-hfb[data-anim] .content.in .meta{animation:ncx-hfb-rise .5s ease forwards;animation-delay:.5s}
        @keyframes ncx-hfb-word-in{to{opacity:1;transform:none}}
        @keyframes ncx-hfb-word-in-lively{to{opacity:1;filter:blur(0);transform:none}}
        @keyframes ncx-hfb-rise{to{opacity:1;transform:none}}

        .ncx-hfb[data-anim="off"] .word,.ncx-hfb[data-anim="off"] .subhead,
        .ncx-hfb[data-anim="off"] .cta,.ncx-hfb[data-anim="off"] .meta{opacity:1;transform:none}

        @media(prefers-reduced-motion:reduce){
          .ncx-hfb .layer .media{animation:none!important}
          .ncx-hfb .word,.ncx-hfb .subhead,.ncx-hfb .cta,.ncx-hfb .meta{
            animation:none!important;opacity:1!important;filter:none!important;transform:none!important}
          .ncx-hfb .media-video{display:none}
          .ncx-hfb .media-video-fallback{display:block}
          .ncx-hfb .btn{transition:none}
        }

        @media(max-width:1080px){
          .ncx-hfb .ncx-container{padding-bottom:56px}
        }

        @media(max-width:767px){
          .ncx-hfb,.ncx-hfb[data-height="medium"]{height:auto;min-height:520px}
          .ncx-hfb .ncx-container{padding-bottom:40px}
          .ncx-hfb .inner{max-width:none}
          .ncx-hfb h1{font-size:clamp(28px,8vw,38px);max-width:none}
          .ncx-hfb .subhead{font-size:16px}
          /* Only swap to the mobile file when one was actually provided —
             otherwise the desktop file stays put rather than disappearing. */
          .ncx-hfb:has(.layer-mobile) .layer-desktop{display:none}
          .ncx-hfb .layer-mobile{display:block}
        }

        /* Right placement has its own, wider breakpoint: the side-by-side
           layout gets cramped well before the hero's general text sizing
           needs to change, so it switches to a stacked layout on its own. */
        @media(max-width:900px){
          .ncx-hfb[data-placement="right"]{display:flex;flex-direction:column;height:auto;min-height:0}
          .ncx-hfb[data-placement="right"] .content{position:static;order:1;display:block}
          .ncx-hfb[data-placement="right"] .ncx-container{padding-bottom:32px}
          .ncx-hfb[data-placement="right"] .inner{max-width:none}
          .ncx-hfb[data-placement="right"] .bg{position:relative;order:2;inset:auto;
            width:100%;height:260px;background:transparent}
          /* The "align right" position (set inline, for the side-by-side
             desktop layout) no longer applies once the image is full width
             with nothing beside it — that would just push it off-center and
             leave an empty gap. !important is the only thing that can beat
             an inline style here. */
          .ncx-hfb[data-placement="right"] .media{object-position:center!important}
          /* Full width now, so only the bottom edge still needs a fade —
             there is no navy beside the image left to blend into. */
          .ncx-hfb[data-placement="right"] .layer{
            position:absolute;inset:0;
            -webkit-mask-image:linear-gradient(180deg,#000 0%,#000 90%,transparent 100%);
            -webkit-mask-composite:source-over;
            mask-image:linear-gradient(180deg,#000 0%,#000 90%,transparent 100%);
            mask-composite:add}
          /* Right placement always shows the main media field here, even on
             phones — the layout itself already changes (stacked, not an
             overlay), so a separate mobileMedia override is not needed. This
             also undoes the general layer-desktop/layer-mobile swap, which
             is for full-bleed only. */
          .ncx-hfb[data-placement="right"] .layer-desktop{display:block}
          .ncx-hfb[data-placement="right"] .layer-mobile{display:none}
        }
      `}</style>

      <div className="bg">
        <div className="layer layer-desktop">
          <MediaLayer
            value={mediaValue}
            poster={videoPoster}
            focalPoint={focalPoint || 'center'}
            objectPositionOverride={objectPositionOverride}
            fit={fit}
            priority
            sizes={placement === 'right' ? '60vw' : '100vw'}
          />
        </div>
        {mobileMedia && typeof mobileMedia === 'object' ? (
          <div className="layer layer-mobile">
            <MediaLayer
              value={mobileMedia}
              poster={videoPoster}
              focalPoint={focalPoint || 'center'}
              fit={fit}
              sizes="100vw"
            />
          </div>
        ) : null}
      </div>

      <div className="overlay" />

      <Animator className="content">
        <div className="ncx-container">
          <div className="inner">
            {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}

            <h1 aria-label={headline}>
              {words.map((word, i) => (
                <React.Fragment key={i}>
                  <span className="word" style={{ '--i': i } as React.CSSProperties} aria-hidden="true">
                    {word}
                  </span>
                  {i < words.length - 1 ? ' ' : ''}
                </React.Fragment>
              ))}
            </h1>

            {subhead ? <p className="subhead">{subhead}</p> : null}

            {(primaryHref && primaryCta?.label) || (secondaryHref && secondaryCta?.label) ? (
              <div className="cta">
                {primaryHref && primaryCta?.label ? (
                  <a
                    className="btn btn-primary"
                    href={primaryHref}
                    {...(primaryCta?.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  >
                    {primaryCta.label}
                  </a>
                ) : null}
                {secondaryHref && secondaryCta?.label ? (
                  <a
                    className="btn btn-ghost"
                    href={secondaryHref}
                    {...(secondaryCta?.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  >
                    {secondaryCta.label}
                  </a>
                ) : null}
              </div>
            ) : null}

            {items.length ? (
              <ul className="meta">
                {items.map((m, i) => (
                  <li key={m.id || i}>{m.text}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </Animator>
    </section>
  )
}
