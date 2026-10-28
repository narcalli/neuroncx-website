'use client'

import React, { useEffect, useRef } from 'react'
import { animate } from 'motion/react'
import { convertLexicalToPlaintext } from '@payloadcms/richtext-lexical/plaintext'
import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'

import RichText from '@/components/RichText'
import { faqPage, jsonLdHtml } from '@/utilities/jsonLd'

import type { FAQBlock as FAQBlockProps } from '@/payload-types'
import { gsap, useGSAP } from '@/motion/gsap'
import type { MotionSetting } from '@/motion/levels'
import { isPastStart, onceInView } from '@/motion/useOnceInView'
import { SplitHeading } from '@/motion/SplitHeading'
import { Reveal } from '@/motion/Reveal'
import { useMotionLevel } from '@/motion/useMotionLevel'

type Item = FAQBlockProps['items'][number]

/**
 * A question and its answer, as a native <details>/<summary>: with no
 * script, clicking the question still opens and closes it, instantly (the
 * [open] attribute alone drives the CSS). At level on, a click is instead
 * caught and played as an animation: the panel's height tweens to fit, the
 * chevron turns, and the answer rises in just after, then <details> is left
 * open or closed to match.
 *
 * The question's accessible name must be the question text alone, so the
 * chevron is aria-hidden.
 */
function QuestionAnswer({ item, motion }: { item: Item; motion?: MotionSetting | null }) {
  const level = useMotionLevel(motion)
  const answerData = item.answer as unknown as DefaultTypedEditorState
  const summaryRef = useRef<HTMLElement>(null)
  const answerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const chevRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const summary = summaryRef.current
    const details = summary?.closest('details')
    const answer = answerRef.current
    const inner = innerRef.current
    const chev = chevRef.current
    if (!summary || !details || !answer || level !== 'on') return

    let current: ReturnType<typeof animate> | null = null
    const onClick = (e: MouseEvent) => {
      e.preventDefault()
      current?.stop()
      const willOpen = !details.open
      if (chev) animate(chev, { rotate: willOpen ? 180 : 0 }, { duration: 0.35, ease: 'easeOut' })
      if (willOpen) {
        details.open = true
        const target = answer.scrollHeight
        current = animate(answer, { height: [0, target] }, { duration: 0.45, ease: [0.4, 0, 0.2, 1] })
        current.then(() => {
          answer.style.height = 'auto'
        })
        if (inner) {
          inner.style.opacity = '0'
          inner.style.transform = 'translateY(10px)'
          animate(inner, { opacity: 1, y: 0 }, { delay: 0.12, duration: 0.3 })
        }
      } else {
        const start = answer.getBoundingClientRect().height
        current = animate(answer, { height: [start, 0] }, { duration: 0.35, ease: [0.4, 0, 0.2, 1] })
        current.then(() => {
          details.open = false
        })
      }
    }
    summary.addEventListener('click', onClick)
    return () => {
      summary.removeEventListener('click', onClick)
      current?.stop()
    }
  }, [level])

  return (
    <details className="faq-item" open={item.defaultOpen || undefined}>
      <summary ref={summaryRef as React.RefObject<HTMLElement>}>
        <span>{item.question}</span>
        <svg ref={chevRef} className="chev" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M3.5 6 8 10.5 12.5 6" fill="none" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      </summary>
      <div className="faq-answer" ref={answerRef}>
        <div ref={innerRef}>
          <RichText data={answerData} enableGutter={false} enableProse={false} />
        </div>
      </div>
    </details>
  )
}

export const FAQBlock: React.FC<FAQBlockProps & { motion?: MotionSetting | null }> = ({
  heading,
  intro,
  items,
  background,
  anchorId,
  emitSchema,
  motion,
}) => {
  const level = useMotionLevel(motion)
  const listRef = useRef<HTMLDivElement>(null)
  const list = (items || []).filter((item) => item && item.question)

  useGSAP(
    () => {
      const el = listRef.current
      if (!el || list.length < 2) return
      const targets = Array.from(el.children)

      if (level === 'reduced') {
        if (isPastStart(el)) return
        gsap.set(targets, { opacity: 0 })
        const stop = onceInView(el, () => gsap.to(targets, { opacity: 1, duration: 0.5, stagger: 0.07 }))
        return () => {
          stop()
          gsap.set(targets, { clearProps: 'opacity' })
        }
      }
      if (level !== 'on' || isPastStart(el)) return

      gsap.set(targets, { opacity: 0, y: 20 })
      const stop = onceInView(el, () => {
        gsap.to(targets, { opacity: 1, y: 0, duration: 0.55, stagger: 0.07, ease: 'power3.out' })
      })
      return () => {
        stop()
        gsap.set(targets, { clearProps: 'all' })
      }
    },
    { dependencies: [level, list.length] },
  )

  if (!list.length) return null

  const bg = background === 'white' ? 'white' : 'cloud'

  // schema.org FAQPage structured data (utilities/jsonLd.ts).
  const schema = emitSchema
    ? faqPage(
        list.map((item) => ({
          question: item.question,
          answer: convertLexicalToPlaintext({ data: item.answer as unknown as DefaultTypedEditorState }),
        })),
      )
    : null

  return (
    <section className="ncx-faq" id={anchorId || undefined} data-bg={bg}>
      <style>{`

        .ncx-faq{padding:76px 0;font-family:var(--font-body),Arial,sans-serif;color:var(--ncx-body);
          scroll-margin-top:96px}
        .ncx-faq[data-bg="white"]{background:var(--ncx-white)}
        .ncx-faq[data-bg="cloud"]{background:var(--ncx-cloud)}


        .ncx-faq h2{font-family:var(--font-display),Arial,sans-serif;font-weight:600;
          font-size:clamp(26px,3.2vw,36px);letter-spacing:-.02em;line-height:1.15;margin:0;color:var(--ncx-ink)}
        .ncx-faq .intro{color:var(--ncx-muted);margin:14px 0 0;max-width:62ch;font-size:16px;line-height:1.65}

        .ncx-faq .list{margin-top:34px}

        .ncx-faq .faq-item{border-bottom:1px solid var(--ncx-rule)}
        .ncx-faq .faq-item:first-of-type{border-top:1px solid var(--ncx-rule)}

        .ncx-faq summary{font-family:var(--font-display),Arial,sans-serif;font-weight:600;font-size:1.06rem;
          padding:20px 40px 20px 0;cursor:pointer;list-style:none;position:relative;color:var(--ncx-ink);
          display:flex;align-items:center;justify-content:space-between;gap:16px}
        .ncx-faq summary::-webkit-details-marker{display:none}
        .ncx-faq summary:focus-visible{outline:2px solid var(--ncx-crimson);outline-offset:2px}
        .ncx-faq .chev{flex:none;color:var(--ncx-link);transition:transform .35s ease}
        .ncx-faq .faq-item[open] .chev{transform:rotate(180deg)}

        .ncx-faq .faq-answer{overflow:hidden;height:0}
        .ncx-faq .faq-item[open] .faq-answer{height:auto}
        .ncx-faq .faq-answer > div{padding:0 0 22px;max-width:66ch;font-size:.98rem;line-height:1.6;
          font-family:var(--font-body),Arial,sans-serif;color:var(--ncx-body)}
        .ncx-faq .faq-answer p{margin:0 0 .75em}
        .ncx-faq .faq-answer p:last-child{margin-bottom:0}
        .ncx-faq .faq-answer a{color:var(--ncx-link)}
        .ncx-faq .faq-answer ul{margin:.5em 0;padding-left:1.25em}

        @media(prefers-reduced-motion:reduce){
          .ncx-faq .chev{transition:none}
        }
        @media(max-width:860px){
          .ncx-faq{padding:60px 0}
        }
      `}</style>

      <div className="inner ncx-container">
        {heading ? <SplitHeading as="h2" motion={motion}>{heading}</SplitHeading> : null}
        {intro ? <Reveal as="p" className="intro" motion={motion}>{intro}</Reveal> : null}

        <div className="list" ref={listRef}>
          {list.map((item) => (
            <QuestionAnswer item={item} motion={motion} key={item.id} />
          ))}
        </div>
      </div>

      {schema ? <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdHtml(schema)} /> : null}
    </section>
  )
}
