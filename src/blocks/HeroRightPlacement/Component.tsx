import React from 'react'
import Image from 'next/image'

import { pickMedia, type MediaValue } from '@/utilities/media'
import { Animator } from '../HeroFullBackground/Animator'

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
  media?: MediaValue
  mediaAlt?: string | null
  videoPoster?: MediaValue
  animation?: 'on' | 'off' | null
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
 * The image or video, always shown in full (contain) and pinned to the
 * right — the one fixed treatment this block offers. Video and GIF bypass
 * next/image, same reasoning as Hero — Full Background: GIFs lose their
 * animation through it, and video needs a real <video> element.
 */
const MediaLayer: React.FC<{ value: MediaValue; poster: MediaValue }> = ({ value, poster }) => {
  // "hero" is the large named size made for full-width and large media —
  // falls back to the original file when there is no hero-sized copy (the
  // source is smaller than 2560px, or the file is a GIF or a video).
  const pic = pickMedia(value, 'hero')
  if (!pic) return null

  const posterPic = pickMedia(poster)
  const style = { objectFit: 'contain', objectPosition: 'right center', background: 'transparent' } as React.CSSProperties

  if (pic.isVideo) {
    return (
      <>
        <video className="media" style={style} autoPlay muted loop playsInline preload="metadata" poster={posterPic?.src}>
          <source src={pic.src} />
        </video>
        {/* Shown instead of the video when the visitor prefers reduced motion — a pure CSS swap, no JS needed. */}
        {posterPic ? (
          <Image
            className="media media-video-fallback"
            src={posterPic.src}
            alt=""
            fill
            sizes="60vw"
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
      priority
      sizes="60vw"
      unoptimized={pic.unoptimized}
      style={style}
    />
  )
}

export const HeroRightPlacementBlock: React.FC<Props> = ({
  eyebrow,
  headline,
  subhead,
  primaryCta,
  secondaryCta,
  media,
  mediaAlt,
  videoPoster,
  animation,
}) => {
  if (!headline) return null

  const words = headline.trim().split(/\s+/)
  const anim = animation === 'off' ? 'off' : 'on'

  const primaryHref = resolveHref(primaryCta)
  const secondaryHref = resolveHref(secondaryCta)

  // A decorative background by default; mediaAlt only kicks in when the
  // editor says the picture itself carries meaning.
  const mediaValue: MediaValue =
    media && typeof media === 'object' && mediaAlt ? { ...media, alt: mediaAlt } : media

  return (
    <section className="ncx-hrp" data-anim={anim}>
      <style>{`
        .ncx-hrp{position:relative;overflow:hidden;isolation:isolate;
          background:var(--wash);color:var(--ncx-body);
          font-family:var(--font-body),Arial,sans-serif;
          min-height:min(86vh,720px);display:flex;align-items:center;
          padding-top:calc(64px + clamp(24px,3vw,44px))}
        /* Same stage as the other heroes: full bleed, four blooms, one layer. */
        .ncx-hrp::before{
          content:"";position:absolute;inset:-35%;z-index:0;pointer-events:none;
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
        @media(prefers-reduced-motion:reduce){.ncx-hrp::before{animation:none}}

        /* Subtle decorative glow behind the media — present regardless of
           what gets uploaded, purely for polish. */
        .ncx-hrp .glow{position:absolute;inset:0;z-index:0;pointer-events:none;
          background:
            radial-gradient(700px 500px at 75% 50%,rgba(74,123,224,.16),transparent 70%),
            radial-gradient(500px 400px at 100% 0%,rgba(198,40,40,.12),transparent 70%)}

        .ncx-hrp .bg{position:absolute;z-index:1;top:0;bottom:0;left:40%;right:0}
        .ncx-hrp .bg-inner{position:absolute;inset:0;
        /* The #000 below are mask stencils, not colours: these gradients
           supply an alpha channel only, so there is no token to point
           them at. */
          -webkit-mask-image:
            linear-gradient(90deg,transparent 0%,#000 22%),
            linear-gradient(180deg,transparent 0%,#000 8%,#000 92%,transparent 100%);
          -webkit-mask-composite:source-in;
          mask-image:
            linear-gradient(90deg,transparent 0%,#000 22%),
            linear-gradient(180deg,transparent 0%,#000 8%,#000 92%,transparent 100%);
          mask-composite:intersect}
        .ncx-hrp .media{position:absolute;inset:0;width:100%;height:100%}
        .ncx-hrp .media-video-fallback{display:none}

        /* A slow "breathe", not a pan — this block is about showing the
           whole image clearly, not panning across it. */
        .ncx-hrp[data-anim="on"] .bg-inner{animation:ncx-hrp-breathe 20s ease-in-out infinite alternate}
        @keyframes ncx-hrp-breathe{from{transform:scale(1)}to{transform:scale(1.04)}}

        .ncx-hrp .content{position:relative;z-index:2;width:100%;padding:72px 0}
        .ncx-hrp .container{max-width:1180px;margin:0 auto;width:100%;padding:0 32px}
        .ncx-hrp .copy{max-width:min(520px,44%)}
        .ncx-hrp .eyebrow{margin:0 0 16px;font-family:var(--font-display),Arial,sans-serif;font-size:14px;
          font-weight:600;color:var(--ncx-crimson-ink);display:inline-flex;align-items:center;gap:8px}
        .ncx-hrp .eyebrow::before{content:"";width:8px;height:8px;border-radius:50%;
          background:var(--ncx-crimson);box-shadow:0 0 0 4px var(--ncx-crimson-tint)}
        .ncx-hrp h1{font-family:var(--font-display),Arial,sans-serif;font-weight:600;
          letter-spacing:-.025em;line-height:1.05;font-size:clamp(40px,5vw,67px);
          margin:0 0 20px;max-width:14ch;text-wrap:balance}
        .ncx-hrp .word{display:inline-block;white-space:pre}
        .ncx-hrp .subhead{color:var(--ncx-muted);font-size:clamp(16px,1.3vw,18px);line-height:1.65;
          margin:0 0 30px;max-width:48ch}
        .ncx-hrp .cta{display:flex;gap:12px;flex-wrap:wrap}
        .ncx-hrp .btn{font-family:var(--font-display),Arial,sans-serif;font-weight:600;font-size:15px;
          display:inline-flex;align-items:center;gap:10px;padding:13px 22px;border-radius:12px;
          text-decoration:none;transition:transform .15s ease,background .15s ease,border-color .15s ease}
        .ncx-hrp .btn-primary{background:var(--ncx-crimson);color:var(--ncx-on-navy)}
        .ncx-hrp .btn-primary:hover{background:var(--ncx-crimson-hover);transform:translateY(-1px)}
        .ncx-hrp .btn-ghost{background:var(--ncx-white);color:var(--ncx-ink);border:1px solid var(--ncx-rule)}
        .ncx-hrp .btn-ghost:hover{background:var(--ncx-paper)}
        .ncx-hrp .btn:focus-visible{outline:2px solid var(--ncx-focus);outline-offset:3px}

        /* Entrance. Base state is fully visible — this only adds motion once
           the Animator client component marks the block as in view. */
        .ncx-hrp[data-anim="on"] .word{opacity:0;transform:translateY(.5em);filter:blur(8px)}
        .ncx-hrp[data-anim="on"] .subhead,.ncx-hrp[data-anim="on"] .cta{opacity:0;transform:translateY(16px)}
        .ncx-hrp[data-anim="on"] .content.in .word{
          animation:ncx-hrp-word-in .8s cubic-bezier(.2,.8,.2,1) forwards;
          animation-delay:calc(var(--i) * 60ms)}
        .ncx-hrp[data-anim="on"] .content.in .subhead{animation:ncx-hrp-rise .8s cubic-bezier(.2,.8,.2,1) forwards;animation-delay:.3s}
        .ncx-hrp[data-anim="on"] .content.in .cta{animation:ncx-hrp-rise .8s cubic-bezier(.2,.8,.2,1) forwards;animation-delay:.45s}
        @keyframes ncx-hrp-word-in{to{opacity:1;transform:none;filter:blur(0)}}
        @keyframes ncx-hrp-rise{to{opacity:1;transform:none}}

        @media(prefers-reduced-motion:reduce){
          .ncx-hrp .bg-inner{animation:none!important}
          .ncx-hrp .word,.ncx-hrp .subhead,.ncx-hrp .cta{
            animation:none!important;opacity:1!important;filter:none!important;transform:none!important}
          .ncx-hrp .btn{transition:none}
        }

        @media(max-width:1080px){
          .ncx-hrp .container{padding:0 20px}
        }

        @media(max-width:900px){
          .ncx-hrp{flex-direction:column;align-items:stretch;min-height:0}
          .ncx-hrp .content{order:1;padding:48px 0 8px}
          .ncx-hrp .copy{max-width:none}
          .ncx-hrp .bg{position:relative;order:2;inset:auto;left:auto;top:auto;bottom:auto;right:auto;
            width:100%;height:min(78vw,420px);z-index:0}
          .ncx-hrp .bg-inner{
            -webkit-mask-image:linear-gradient(180deg,transparent 0%,#000 14%,#000 88%,transparent 100%);
            -webkit-mask-composite:source-over;
            mask-image:linear-gradient(180deg,transparent 0%,#000 14%,#000 88%,transparent 100%);
            mask-composite:add}
          /* No longer beside the text, so pinning right just leaves an
             empty gap — centered fills the box evenly instead. */
          .ncx-hrp .media{object-position:center!important}
        }
      `}</style>

      <div className="glow" />

      <div className="bg">
        <div className="bg-inner">
          <MediaLayer value={mediaValue} poster={videoPoster} />
        </div>
      </div>

      <Animator className="content">
        <div className="container">
          <div className="copy">
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
          </div>
        </div>
      </Animator>
    </section>
  )
}
