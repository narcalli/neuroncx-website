'use client'

import { usePathname } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'

import type { WhatsappWidgetBlock as Props } from '@/payload-types'

/** The page the click came from, as it appears in the CMS. */
const slugFrom = (pathname: string) => {
  const trimmed = (pathname || '/').replace(/^\/+|\/+$/g, '')
  return trimmed || 'home'
}

const WhatsAppGlyph = () => (
  <span className="ncx-wa__glyph" aria-hidden="true">
    <svg viewBox="0 0 24 24" focusable="false">
      <path
        fill="currentColor"
        d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2m0 1.67c2.2 0 4.27.86 5.83 2.42a8.2 8.2 0 0 1 2.41 5.82c0 4.54-3.7 8.24-8.25 8.24a8.2 8.2 0 0 1-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.26-8.24m-3.6 4.1c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1s.9 2.43 1.03 2.6c.13.17 1.76 2.68 4.26 3.76.6.26 1.06.41 1.42.53.6.19 1.14.16 1.57.1.48-.07 1.48-.6 1.69-1.19.21-.58.21-1.08.15-1.19-.06-.1-.23-.16-.48-.29-.25-.12-1.48-.73-1.71-.81-.23-.09-.4-.13-.56.12-.17.25-.65.81-.79.98-.15.17-.29.19-.54.06-.25-.12-1.06-.39-2.01-1.24-.74-.66-1.25-1.48-1.39-1.73-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.44.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.44-.06-.12-.55-1.37-.77-1.87-.2-.48-.41-.42-.56-.43h-.47Z"
      />
    </svg>
  </span>
)

/**
 * A fixed pill, bottom right. Three behaviours, all deliberate:
 *  - it holds back on first paint and fades in once the visitor is past the
 *    hero, so it is not competing for the first click;
 *  - it steps aside whenever a closing CTA is on screen, since both live in
 *    the same corner and the CTA is the stronger ask;
 *  - it drops to the glyph alone on narrow screens.
 * It never opens anything by itself.
 */
export const WhatsappWidgetBlock: React.FC<Props> = ({
  enabled,
  phone,
  label,
  prefill,
  includeRef,
}) => {
  const [shown, setShown] = useState(false)
  const ctaVisible = useRef(false)
  const pathname = usePathname()

  useEffect(() => {
    if (!enabled || !phone) return

    const past = () => window.scrollY > 420
    let ticking = false

    const paint = () => {
      ticking = false
      setShown(past() && !ctaVisible.current)
    }
    const onScroll = () => {
      if (!ticking) {
        ticking = true
        window.requestAnimationFrame(paint)
      }
    }

    // The closing CTA wins the corner whenever any part of it is on screen.
    const closings = Array.from(document.querySelectorAll('.ncx-closing'))
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) ctaVisible.current = true
          else if (!entries.some((x) => x.isIntersecting))
            ctaVisible.current = closings.some((c) => {
              const r = c.getBoundingClientRect()
              return r.top < window.innerHeight && r.bottom > 0
            })
        })
        paint()
      },
      { threshold: 0 },
    )
    closings.forEach((c) => io.observe(c))

    paint()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      io.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [enabled, phone, pathname])

  if (!enabled || !phone) return null

  const digits = phone.replace(/[^\d]/g, '')
  const text = `${prefill || ''}${includeRef === false ? '' : ` [ref: ${slugFrom(pathname)}]`}`.trim()
  const href = `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ''}`
  const text_ = label || 'Chat with us'

  return (
    <div className={`ncx-wa${shown ? ' is-shown' : ''}`}>
      <style>{`
        .ncx-wa{position:fixed;right:20px;bottom:20px;z-index:50;
          opacity:0;visibility:hidden;transform:translateY(10px);pointer-events:none;
          transition:opacity .28s ease,transform .28s ease,visibility .28s ease}
        .ncx-wa.is-shown{opacity:1;visibility:visible;transform:none;pointer-events:auto}
        .ncx-wa__link{
          display:flex;align-items:center;gap:10px;text-decoration:none;
          background:var(--ncx-white);border:1px solid var(--ncx-rule);border-radius:999px;
          padding:9px 18px 9px 9px;box-shadow:var(--ncx-shadow);
          color:var(--ncx-ink);font-family:var(--font-display),Arial,sans-serif;
          font-weight:600;font-size:14.5px;letter-spacing:-.01em;white-space:nowrap;
          transition:box-shadow .18s ease,transform .18s ease}
        .ncx-wa__link:hover{box-shadow:var(--ncx-lift);transform:translateY(-1px)}
        .ncx-wa__glyph{width:26px;height:26px;border-radius:50%;background:#25D366;color:var(--ncx-on-navy);
          display:flex;align-items:center;justify-content:center;flex:none}
        .ncx-wa__glyph svg{width:17px;height:17px;display:block}
        .ncx-wa__link:focus-visible{outline:2px solid var(--ncx-navy);outline-offset:3px}
        @media(max-width:560px){
          .ncx-wa{right:14px;bottom:14px}
          .ncx-wa__label{display:none}
          .ncx-wa__link{padding:9px;gap:0}
        }
        @media(prefers-reduced-motion:reduce){
          .ncx-wa,.ncx-wa__link{transition:none!important}
        }
      `}</style>

      <a
        className="ncx-wa__link"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${text_} on WhatsApp`}
      >
        <WhatsAppGlyph />
        <span className="ncx-wa__label">{text_}</span>
      </a>
    </div>
  )
}
