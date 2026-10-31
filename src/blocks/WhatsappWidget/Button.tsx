'use client'

import { motion } from 'motion/react'
import { usePathname } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'

import { isStill } from '@/motion/still'
import { SPRING } from '@/motion/tokens'
import { useMotionLevel } from '@/motion/useMotionLevel'

/**
 * How far to scroll before the button shows: the same 420px on any width, and
 * sooner on a short page so it can still be reached.
 */
export const revealAt = (travel: number) => Math.min(420, travel / 3)

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
 *  - it holds back on first paint and appears once the visitor has scrolled
 *    past revealAt(), so it is not competing for the first click. It springs
 *    up at motion on, and shows at once at any other level;
 *  - it steps aside whenever a closing CTA is on screen, since both live in
 *    the same corner and the CTA is the stronger ask;
 *  - without JavaScript nothing can run that rule, so a noscript style shows it.
 * It never opens anything by itself.
 */
export const WhatsappButton: React.FC<{
  phone: string
  label?: string | null
  message?: string | null
  includeRef?: boolean | null
  /** Addresses where the button stays away. Checked here because the root layout does not re-render on navigation. */
  hiddenPaths?: string[]
}> = ({ phone, label, message, includeRef, hiddenPaths }) => {
  const [shown, setShown] = useState(false)
  const ctaVisible = useRef(false)
  const pathname = usePathname()
  const level = useMotionLevel()
  const here = (pathname || '/').replace(/\/+$/, '') || '/'
  const away = Boolean(hiddenPaths?.includes(here))

  useEffect(() => {
    if (away) return

    // The button outlives a page: forget the last page's closing section.
    ctaVisible.current = false

    const past = () => {
      const travel = document.documentElement.scrollHeight - window.innerHeight
      return travel > 0 && window.scrollY > revealAt(travel)
    }
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
  }, [away, pathname])

  if (away) return null

  const digits = phone.replace(/[^\d]/g, '')
  const text = `${message || ''}${includeRef === false ? '' : ` [ref: ${slugFrom(pathname)}]`}`.trim()
  const href = `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ''}`
  const text_ = label || 'Chat'

  return (
    <motion.div
      className="ncx-wa"
      style={{ visibility: shown ? 'visible' : 'hidden', pointerEvents: shown ? 'auto' : 'none' }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: shown ? 1 : 0, y: shown ? 0 : 16 }}
      transition={level === 'on' && !isStill() ? SPRING : { duration: 0 }}
    >
      <noscript>
        <style>{`.ncx-wa{visibility:visible!important;opacity:1!important;transform:none!important;pointer-events:auto!important}`}</style>
      </noscript>
      <style>{`
        .ncx-wa{position:fixed;right:20px;bottom:20px;z-index:50}
        .ncx-wa__link{
          display:flex;align-items:center;gap:8px;height:46px;padding:0 14px 0 18px;box-sizing:border-box;
          text-decoration:none;background:#0E7A4F;border-radius:999px;box-shadow:0 6px 16px rgba(14,122,79,.28);
          color:#fff;font-family:var(--font-display),Arial,sans-serif;
          font-weight:600;font-size:15px;white-space:nowrap;transition:background-color .18s ease}
        .ncx-wa__link:hover{background:#0B6641}
        .ncx-wa__glyph{width:24px;height:24px;display:flex;flex:none}
        .ncx-wa__glyph svg{width:24px;height:24px;display:block}
        /* Two colours, so the ring shows on the light and the navy sections alike. */
        .ncx-wa__link:focus-visible{outline:2px solid var(--ncx-navy);outline-offset:2px;box-shadow:0 0 0 2px #fff}
        @media(max-width:560px){
          .ncx-wa{right:14px;bottom:calc(14px + env(safe-area-inset-bottom,0px))}
        }
        @media(prefers-reduced-motion:reduce){
          .ncx-wa__link{transition:none!important}
        }
      `}</style>

      <a
        className="ncx-wa__link"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
      >
        <span className="ncx-wa__label">{text_}</span>
        <WhatsAppGlyph />
      </a>
    </motion.div>
  )
}
