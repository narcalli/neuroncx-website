import React from 'react'

import { BlockIcon } from '@/components/BlockIcon'
import { cardNumbers, cardTokens, OptionCard } from '@/components/blocks/OptionCard/OptionCard'
import cardStyles from '@/components/blocks/OptionCard/OptionCard.module.css'
import type { ProductSuite2Card } from '@/blocks/ProductSuite2/Component'
import { ShadowVisual } from '@/blocks/HeroCustom/ShadowVisual'
import { safeVisualCss, safeVisualHtml } from '@/blocks/HeroCustom/safety'
import { SplitHeading } from '@/motion/SplitHeading'
import { Reveal } from '@/motion/Reveal'
import type { CustomVisualBlock as CustomVisualProps } from '@/payload-types'

import { type Anchor, CUSTOM_VISUAL_LAYOUTS, DEFAULT_DIAGRAM_ASPECT, layoutOf } from './layouts'

/** A slot's place in the diagram, as the CSS variables the slot rule reads. */
const at = ([x, y]: Anchor) => ({ '--cv-x': `${x}%`, '--cv-y': `${y}%` }) as React.CSSProperties

/**
 * Custom Visual (HTML/CSS): a hub with up to four cards around it, and the
 * editor's own connector visual behind them. The hub and the cards are real
 * page elements built from the shared card (OptionCard, its tokens and its
 * white surface), placed on the layout's anchor points (layouts.ts):
 *
 *   hubSpoke2  hub 50%,50%  cards 15%,50%  85%,50%
 *   hubSpoke3  hub 50%,50%  cards 50%,17%  15%,82%  85%,82%
 *   hubSpoke4  hub 50%,50%  cards 15%,20%  85%,20%  15%,80%  85%,80%
 *
 * x% across and y% down the diagram, from its top left; each point is the
 * centre of the hub or card. The visual is drawn in the Hero (custom CSS)
 * block's sealed box (ShadowVisual), cleaned the same way, as an overlay
 * filling the diagram behind them, so its lines meet the same points.
 *
 * Layout none: no hub, the cards in an ordinary grid, and the visual (when
 * there is one) full width under the heading. Below 860px the diagram stacks
 * into one column, hub first, and the overlay is removed: its points no
 * longer match anything.
 */
export const CustomVisualBlock: React.FC<CustomVisualProps> = ({
  eyebrow,
  heading,
  intro,
  layout: rawLayout,
  hub,
  cards,
  visualHtml,
  visualCss,
  visualAlt,
  aspect,
  maxWidth,
}) => {
  const layout = layoutOf(rawLayout)
  const { hub: hubAt, spokes } = CUSTOM_VISUAL_LAYOUTS[layout]
  const items = ((cards || []) as ProductSuite2Card[]).filter((c) => c && c.title)
  const placed = layout === 'none' ? items : items.slice(0, spokes.length)
  const numbers = cardNumbers(placed)

  const html = safeVisualHtml(visualHtml)
  const css = safeVisualCss(visualCss)
  // Further down the page than a hero, so its entrance waits until it is seen.
  const visual = html ? <ShadowVisual html={html} css={css} alt={visualAlt} animateOnView /> : null
  const hasHub = Boolean(hubAt && (hub?.label || hub?.icon))

  if (!heading && !eyebrow && !intro && !placed.length && !hasHub && !visual) return null

  const cardOf = (card: ProductSuite2Card, i: number) => (
    <OptionCard
      options={card}
      number={numbers[i]}
      defaultColor="white"
      icon={card.icon}
      title={card.title || ''}
      body={card.description}
      link={card.link?.url ? { ...card.link, label: card.link.label || 'Learn more' } : null}
    />
  )

  // The diagram's box: the editor's shape, or the layout's own when Shape is "As tall as its content".
  const shape = aspect && aspect !== 'auto' ? aspect : layout === 'none' ? null : DEFAULT_DIAGRAM_ASPECT[layout]
  const box = {
    ...(shape ? { '--cv-aspect': shape } : {}),
    ...(maxWidth ? { maxWidth } : {}),
  } as React.CSSProperties

  return (
    <section className="ncx-customvisual" data-layout={layout}>
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

        {layout === 'none' ? (
          <>
            {visual ? (
              <div className="ncx-customvisual__frame" style={box}>
                {visual}
              </div>
            ) : null}
            {placed.length ? (
              <div className={`ncx-customvisual__grid ${cardTokens}`}>
                {placed.map((card, i) => (
                  <React.Fragment key={card.id || i}>{cardOf(card, i)}</React.Fragment>
                ))}
              </div>
            ) : null}
          </>
        ) : (
          <div className={`ncx-customvisual__stage ${cardTokens}`} style={box}>
            {visual ? <div className="ncx-customvisual__overlay">{visual}</div> : null}
            {hasHub ? (
              <div className="ncx-customvisual__slot ncx-customvisual__slot--hub" style={at(hubAt!)}>
                {/* The circle holds only the icon, at a fixed size, so its centre is the hub point and
                    nothing inside can stretch it; the label and caption sit under it as ordinary text. */}
                <div className={`${cardStyles.card} ${cardStyles.cardWhite} ncx-customvisual__hub`}>
                  {hub?.icon ? (
                    <span className={cardStyles.icon} aria-hidden="true">
                      <BlockIcon name={hub.icon} fallback={hub.icon} stroke="#fff" />
                    </span>
                  ) : null}
                </div>
                {hub?.label || hub?.caption ? (
                  <div className="ncx-customvisual__hub-text">
                    {hub?.label ? <p className="ncx-customvisual__hub-label">{hub.label}</p> : null}
                    {hub?.caption ? <p className="ncx-customvisual__hub-caption">{hub.caption}</p> : null}
                  </div>
                ) : null}
              </div>
            ) : null}
            {placed.map((card, i) => (
              <div key={card.id || i} className="ncx-customvisual__slot" style={at(spokes[i])}>
                {cardOf(card, i)}
              </div>
            ))}
          </div>
        )}
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

  /* The diagram: the hub and cards sit on the layout's points, the visual fills it behind them. */
  .ncx-customvisual__stage{position:relative;margin:40px auto 0;width:100%;aspect-ratio:var(--cv-aspect,1/1)}
  .ncx-customvisual__overlay{position:absolute;inset:0;z-index:0;pointer-events:none;background:transparent}
  .ncx-customvisual__overlay > .hcx-visual{height:100%}
  .ncx-customvisual__slot{position:absolute;z-index:1;left:var(--cv-x);top:var(--cv-y);
    transform:translate(-50%,-50%);width:min(260px,28%)}
  /* The hub slot is exactly the circle, so its centre is the hub point. */
  .ncx-customvisual__slot--hub{width:96px}
  /* The hub: the card's own white surface as a fixed 96px circle around the icon. Doubled class so it
     wins over the card module's padding. */
  .ncx-customvisual .ncx-customvisual__hub{width:96px;height:96px;padding:0;border-radius:50%;
    align-items:center;justify-content:center}
  /* Under the circle, out of the slot's box, so wrapping never moves the circle. */
  .ncx-customvisual__hub-text{position:absolute;top:calc(100% + 16px);left:50%;transform:translateX(-50%);
    width:max-content;max-width:200px;text-align:center}
  .ncx-customvisual__hub-label{margin:0;font-family:var(--title-font);font-weight:600;font-size:16px;line-height:1.25;color:var(--title-color)}
  .ncx-customvisual__hub-caption{margin:4px 0 0;font-size:13px;line-height:1.35;color:var(--ncx-muted)}

  /* Layout none: the visual full width under the heading, then the cards in a grid. */
  .ncx-customvisual__frame{margin:40px auto 0;width:100%;aspect-ratio:var(--cv-aspect,auto)}
  .ncx-customvisual__frame > .hcx-visual{height:100%}
  .ncx-customvisual__grid{margin-top:40px;display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));
    gap:20px;align-items:stretch}

  /* One column: hub and cards in order, and no overlay, since its points no longer apply. */
  @media (max-width:859.98px){
    .ncx-customvisual{padding-block:40px}
    .ncx-customvisual__stage{aspect-ratio:auto;display:flex;flex-direction:column;gap:16px;margin-top:28px}
    .ncx-customvisual__overlay{display:none}
    .ncx-customvisual__slot{position:static;transform:none;width:auto}
    .ncx-customvisual__slot--hub{align-self:center;width:auto;display:flex;flex-direction:column;align-items:center}
    .ncx-customvisual__hub-text{position:static;transform:none;margin-top:12px;max-width:260px}
    .ncx-customvisual__frame,.ncx-customvisual__grid{margin-top:28px}
  }
`
