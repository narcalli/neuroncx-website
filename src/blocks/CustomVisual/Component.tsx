import React from 'react'

import { ShadowVisual } from '@/blocks/HeroCustom/ShadowVisual'
import { safeVisualCss, safeVisualHtml } from '@/blocks/HeroCustom/safety'
import { SplitHeading } from '@/motion/SplitHeading'
import { Reveal } from '@/motion/Reveal'
import type { CustomVisualBlock as CustomVisualProps } from '@/payload-types'

/**
 * Custom Visual (HTML/CSS): an optional eyebrow, heading and intro, then the
 * editor's own visual full width under them. Everything the visual shows
 * comes from its HTML and CSS, drawn in the Hero (custom CSS) block's sealed
 * box (ShadowVisual) and cleaned the same way.
 */
export const CustomVisualBlock: React.FC<CustomVisualProps> = ({
  eyebrow,
  heading,
  intro,
  visualHtml,
  visualCss,
  visualAlt,
  aspect,
  maxWidth,
}) => {
  const html = safeVisualHtml(visualHtml)
  const css = safeVisualCss(visualCss)

  if (!heading && !eyebrow && !intro && !html) return null

  const box = {
    ...(aspect && aspect !== 'auto' ? { '--cv-aspect': aspect } : {}),
    ...(maxWidth ? { maxWidth } : {}),
  } as React.CSSProperties

  return (
    <section className="ncx-customvisual">
      <style>{css_}</style>
      <div className="ncx-container">
        {eyebrow ? (
          <Reveal as="p" from="left" className="ncx-customvisual__eyebrow">
            {eyebrow}
          </Reveal>
        ) : null}
        {heading ? <SplitHeading as="h2">{heading}</SplitHeading> : null}
        {intro ? (
          <Reveal as="p" className="ncx-customvisual__intro">
            {intro}
          </Reveal>
        ) : null}
        {html ? (
          <div className="ncx-customvisual__frame" style={box}>
            {/* Further down the page than a hero, so its entrance waits until it is seen. */}
            <ShadowVisual html={html} css={css} alt={visualAlt} animateOnView />
          </div>
        ) : null}
      </div>
    </section>
  )
}

const css_ = `
  .ncx-customvisual{padding-block:56px;font-family:var(--font-body),Arial,sans-serif;color:var(--ncx-body)}
  .ncx-customvisual__eyebrow{font-family:var(--font-display),Arial,sans-serif;font-size:14px;font-weight:600;
    margin:0 0 12px;color:var(--ncx-crimson)}
  .ncx-customvisual h2{font-family:var(--font-display),Arial,sans-serif;font-weight:700;
    font-size:clamp(26px,3.2vw,38px);letter-spacing:-.02em;line-height:1.15;margin:0;max-width:var(--ncx-heading-max)}
  .ncx-customvisual__intro{color:var(--ncx-muted);margin:14px 0 0;max-width:62ch;font-size:16.5px;line-height:1.65}
  /* No eyebrow, heading or intro: nothing is drawn for them, so the visual starts the block
     without the gap that would sit under a heading. */
  .ncx-customvisual .ncx-container > :first-child{margin-top:0}

  /* The visual, full width under the heading, in the editor's Shape and widest size. */
  .ncx-customvisual__frame{margin:40px auto 0;width:100%;aspect-ratio:var(--cv-aspect,auto)}
  .ncx-customvisual__frame > .hcx-visual{height:100%}

  @media (max-width:859.98px){
    .ncx-customvisual{padding-block:40px}
    .ncx-customvisual__frame{margin-top:28px}
    /* The editor's Shape becomes a minimum, not a fixed height. A visual whose CSS stacks
       its content on a phone grows to fit instead of being clipped by the sealed box; one
       drawn only with absolute positioning still gets the full Shape. */
    .ncx-customvisual__frame > .hcx-visual{height:auto;min-height:100%}
  }
`
