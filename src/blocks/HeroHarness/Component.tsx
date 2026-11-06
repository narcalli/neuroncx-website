import React from 'react'

import { hrefOf } from '@/blocks/HeroCustom/Component'
import type { HeroHarnessBlock as HeroHarnessProps } from '@/payload-types'

import { PARTS, type HarnessLabels, type Part } from './geometry'
import { HeaderEdge } from './HeaderEdge'
import { HarnessStage, type HarnessCard } from './Stage'
import { stageCss } from './styles'

type Button = NonNullable<HeroHarnessProps['buttons']>[number]

/** The title's lines as the editor typed them. Each break shows on desktop only; below 900px the title wraps on its own. */
export const headlineLines = (headline: string | null | undefined): string[] =>
  (headline ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

/** The intro as one paragraph: any line breaks the editor typed are joined with a space. */
export const introText = (intro: string | null | undefined): string =>
  (intro ?? '')
    .split(/\s*\r?\n\s*/)
    .filter(Boolean)
    .join(' ')
    .trim()

type Look = 'primary' | 'secondary'

/**
 * The buttons that can be drawn: a label and somewhere to go, each with its
 * look. A button's own Style wins; left empty, the first drawn is primary and
 * the second secondary.
 */
export const shownButtons = (buttons: HeroHarnessProps['buttons']): (Button & { href: string; look: Look })[] =>
  (buttons ?? [])
    .map((b) => ({ ...b, href: hrefOf(b) ?? '' }))
    .filter((b) => b.label && b.href)
    .slice(0, 2)
    .map((b, i) => ({
      ...b,
      look: b.appearance === 'primary' || b.appearance === 'secondary' ? b.appearance : i === 0 ? 'primary' : 'secondary',
    }))

/** Text, else the design's default. */
const or = (v: string | null | undefined, fallback: string) => (typeof v === 'string' && v.trim() ? v.trim() : fallback)

/** A list of label rows, without empty ones; the design's defaults when there are none and the list needs some. */
const list = (rows: { label?: string | null }[] | null | undefined, fallback: string[], max: number): string[] => {
  const labels = (rows ?? []).map((r) => (r?.label ?? '').trim()).filter(Boolean)
  return (labels.length ? labels : fallback).slice(0, max)
}

/** The drawing's words, from the block, with the design's defaults for anything empty. */
export const drawingLabels = (p: Partial<HeroHarnessProps>): HarnessLabels => ({
  triggerLabel: or(p.triggerLabel, 'Customer event'),
  triggerEvents: list(p.triggerEvents, ['New enquiry', 'Payment due', 'Follow-up due'], 4),
  boundaryLabel: or(p.boundaryLabel, 'BYOC'),
  ontologyLabel: or(p.ontologyLabel, 'Enterprise ontology'),
  ontologyItems: (p.ontologyItems ?? []).map((r) => (r?.label ?? '').trim()).filter(Boolean).slice(0, 3),
  policyLabel: or(p.policyLabel, 'Policy framework'),
  policySub: or(p.policySub, 'Set by your team'),
  guardrailsLabel: or(p.guardrailsLabel, 'Guardrails'),
  orchestrationLabel: or(p.orchestrationLabel, 'Orchestration'),
  orchestrationSubLabel: or(p.orchestrationSubLabel, 'Agents'),
  actions: list(p.actions, ['Qualify', 'Book and pay', 'Follow up', 'Campaigns'], 5),
  handoverLabel: or(p.handoverLabel, 'Team steps in'),
  customer360Label: or(p.customer360Label, 'Customer 360'),
  customer360Fields: (p.customer360Fields ?? []).map((r) => (r?.label ?? '').trim()).filter(Boolean).slice(0, 4),
  loopLabel: or(p.loopLabel, 'Learns from every outcome'),
  actionsName: or(p.actionsName, 'Agent actions'),
  loopName: or(p.loopName, 'Learning loop'),
})

/** The cards with a title, each with the parts it lights up. */
export const harnessCards = (cards: HeroHarnessProps['cards'] | null | undefined): HarnessCard[] =>
  (cards ?? [])
    .filter((c) => c && c.title && c.title.trim())
    .slice(0, 6)
    .map((c) => ({
      title: c.title.trim(),
      body: (c.body ?? '').trim(),
      highlights: (c.highlights ?? []).filter((h): h is Part => (PARTS as string[]).includes(h)),
    }))

const DESCRIPTION_DEFAULT =
  'A diagram of the NeuronCx harness: customer events flow into orchestrated agents that work from your ontology, policies and guardrails, act or hand over to your team, write to Customer 360, and learn from each outcome. The agents run in your own cloud (BYOC).'

const clamp = (n: number | null | undefined, min: number, max: number, fallback: number) =>
  typeof n === 'number' && Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback

/** The widths the centred intro can take; 620 keeps a line near 69 characters, 1020 is the widest on purpose. */
const INTRO_MAX_WIDTHS = ['620', '720', '860', '1020'] as const

/** The centred intro's max-width in px: the editor's choice, else 620. */
export const introMaxWidth = (value: string | null | undefined): number =>
  Number((INTRO_MAX_WIDTHS as readonly string[]).includes(value ?? '') ? value : '620')

/**
 * How fast the title shrinks with the screen (900px and wider), in vw. The
 * design's 3.1vw, or faster for sizes over 44px, so that every size is
 * reached by 1440px.
 */
export const headingSlope = (px: number): string => `${Math.max(3.1, Math.ceil((px / 14.4) * 10000) / 10000)}vw`

/**
 * Hero (harness loop), from the approved design
 * (docs/reference/harness-hero-demo.html). The title (the page's one H1) and
 * the intro sit above everything, in one of four layouts: centred (the
 * default), stacked, a grid whose intro runs from where the drawing starts to
 * its right edge (35fr and 65fr, as the cards and drawing below), or stacked
 * with a small label.
 * Light theme only; all text is drawn on the server.
 *
 * Below the text: the cards, which act as tabs, and the drawing of the
 * harness they light up (Stage.tsx, geometry.ts).
 */
export const HeroHarnessBlock: React.FC<HeroHarnessProps & { leading?: React.ReactNode }> = ({
  textLayout,
  eyebrow,
  headline,
  intro,
  buttons,
  headingSize,
  spacing,
  introWidth,
  introMaxWidth: introMax,
  background,
  leading,
  ...rest
}) => {
  const layout = textLayout || 'centred'
  const width = rest.blockWidth === 'header' ? 'header' : 'site'
  const lines = headlineLines(headline)
  const paragraph = introText(intro)
  const shown = shownButtons(buttons)
  const cards = harnessCards(rest.cards)
  const size = clamp(headingSize, 32, 56, 44)
  const vars = {
    '--hh-h': `${size}px`,
    '--hh-h-vw': headingSlope(size),
    '--hh-intro-w': `${clamp(introWidth, 560, 900, 720)}px`,
    '--hh-intro-max': `${introMaxWidth(introMax)}px`,
  } as React.CSSProperties

  return (
    <section
      className="ncx-hh"
      data-layout={layout}
      data-spacing={spacing || 'roomy'}
      data-bg={background || 'cloud'}
      data-width={width}
      data-frame={rest.frame === 'framed' ? 'framed' : 'plain'}
      data-lead={leading ? '' : undefined}
      style={vars}
    >
      <style>{heroCss + stageCss}</style>
      {width === 'header' ? <HeaderEdge /> : null}
      {leading ? (
        <div className="hh-lead">
          <div className="ncx-container">{leading}</div>
        </div>
      ) : null}
      <div className="ncx-container">
        <div className="hh-text">
          {eyebrow?.trim() ? <p className="hh-eyebrow">{eyebrow.trim()}</p> : null}
          <h1>
            {lines.map((line, i) => (
              <React.Fragment key={i}>
                {i > 0 ? (
                  <>
                    <br className="br" />{' '}
                  </>
                ) : null}
                {line}
              </React.Fragment>
            ))}
          </h1>
          <div className="hh-body">
            {paragraph ? <p className="hh-intro">{paragraph}</p> : null}
            {shown.length ? (
              <div className="hh-cta">
                {shown.map((b, i) => (
                  <a
                    key={b.id ?? i}
                    className={`hh-btn hh-btn--${b.look}`}
                    href={b.href}
                    {...(b.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  >
                    {b.label}
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {cards.length ? (
          <HarnessStage
            cards={cards}
            cardsPosition={rest.cardsPosition === 'above' ? 'above' : 'left'}
            labels={drawingLabels(rest)}
            showStatus={rest.showStatus !== false}
            showCaption={rest.showCaption !== false}
            description={or(rest.screenReaderDescription, DESCRIPTION_DEFAULT)}
            motion={rest.motion}
            autoplay={rest.autoplay !== false}
            loop={rest.loop !== false}
            speed={rest.speed === 'slower' || rest.speed === 'faster' ? rest.speed : 'normal'}
            autoplaySeconds={clamp(rest.autoplaySeconds, 4, 12, 6)}
          />
        ) : null}
      </div>
    </section>
  )
}

/*
 * Values from the approved design's CSS. Spacing presets: roomy is the
 * design's own; compact brings more of the drawing above the fold. The hero
 * sits flush under the fixed 64px header, so its top padding adds that.
 */
const heroCss = `
  .ncx-hh{--hh-bg:var(--ncx-cloud);--hh-top:clamp(32px,4.5vw,64px);--hh-gap:22px;--hh-stage:clamp(32px,4vw,56px);
    background:var(--hh-bg);color:var(--ncx-body);font-family:var(--font-body),Arial,sans-serif;position:relative;
    padding:calc(64px + var(--hh-top)) 0 clamp(40px,5vw,64px)}
  .ncx-hh[data-bg="white"]{--hh-bg:var(--ncx-white)}
  .ncx-hh[data-spacing="compact"]{--hh-top:16px;--hh-gap:10px;--hh-stage:14px}
  /* Room for the breadcrumbs, 28px under the header, as on the other heroes. */
  .ncx-hh[data-lead]{padding-top:calc(64px + 48px + var(--hh-top))}
  .ncx-hh .hh-lead{position:absolute;top:64px;left:0;right:0;z-index:3;--crumb-top:28px;pointer-events:none}
  .ncx-hh .hh-lead nav,.ncx-hh .hh-lead a{pointer-events:auto}

  .ncx-hh h1{font-family:var(--font-display),Arial,sans-serif;font-weight:600;font-size:clamp(28px,3.1vw,var(--hh-h));line-height:1.12;
    letter-spacing:-.022em;color:var(--ncx-ink);margin:0;text-wrap:balance}
  .ncx-hh .hh-intro{font-size:clamp(15px,1.2vw,17px);line-height:1.7;color:var(--ncx-muted);margin:0;text-wrap:pretty}
  /* The small label: a neutral chip, as Hero (custom CSS)'s chips (.hcx-chips li): pill, white fill, 1px rule border,
     dark text, here in small uppercase with the red dot. Its own class: the drawing caption's tags (.hh-tag) are separate.
     22px under it to the title: the text column's gap plus the rest. */
  .ncx-hh .hh-eyebrow{display:inline-flex;align-items:center;gap:8px;align-self:flex-start;padding:6px 12px;
    margin:0 0 calc(22px - var(--hh-gap));border:1px solid var(--ncx-rule);border-radius:999px;background:var(--ncx-white);
    color:var(--ncx-ink);font-family:var(--font-display),Arial,sans-serif;font-weight:600;font-size:12.5px;
    line-height:1.4;letter-spacing:.08em;text-transform:uppercase}
  .ncx-hh .hh-eyebrow::before{content:"";flex:none;width:7px;height:7px;border-radius:50%;background:var(--ncx-crimson)}

  /* Stacked, with or without the small label: one column, left aligned. */
  .ncx-hh .hh-text{display:flex;flex-direction:column;align-items:flex-start;gap:var(--hh-gap)}
  .ncx-hh .hh-body{display:flex;flex-direction:column;align-items:flex-start;gap:var(--hh-gap);max-width:var(--hh-intro-w)}
  /* Grid: the title spans both columns; the intro starts where the drawing starts. */
  .ncx-hh[data-layout="grid"] .hh-text{display:grid;grid-template-columns:minmax(0,35fr) minmax(0,65fr);gap:var(--hh-gap) 20px}
  .ncx-hh[data-layout="grid"] h1,.ncx-hh[data-layout="grid"] .hh-eyebrow{grid-column:1 / -1}
  .ncx-hh[data-layout="grid"] .hh-eyebrow{justify-self:start}
  .ncx-hh[data-layout="grid"] .hh-body{grid-column:2;max-width:none}
  /* Centred: the title and the intro centred above the cards and drawing. */
  .ncx-hh[data-layout="centred"] .hh-text{align-items:center;text-align:center}
  .ncx-hh[data-layout="centred"] .hh-eyebrow{align-self:center}
  .ncx-hh[data-layout="centred"] .hh-body{align-items:center;max-width:var(--hh-intro-max)}
  .ncx-hh[data-layout="centred"] .hh-cta{justify-content:center}

  /* Laptops and desktops: the title reaches its set size by 1440px. Its width is the site column's, and text-wrap:balance
     splits a title that needs more than one line into even lines; a typed break still sets the split by hand. Roomy
     spacing is 20px under the title and 40px above the cards and drawing, framed or not, with up to 20px less space
     above the text. */
  @media (min-width:900px){
    .ncx-hh h1{font-size:clamp(28px,var(--hh-h-vw),var(--hh-h))}
    .ncx-hh[data-spacing="roomy"]{--hh-top:clamp(32px,calc(4.5vw - 20px),44px);--hh-gap:20px;--hh-stage:40px}
  }

  /* The buttons: 28px under the intro (the intro column's gap plus the rest), 12px apart, wrapping onto a new row
     rather than shrinking. Pills at least 44px tall, so the tap target holds at every width. */
  .ncx-hh .hh-cta{display:flex;flex-wrap:wrap;gap:12px;margin-top:calc(28px - var(--hh-gap))}
  .ncx-hh .hh-btn{flex:none;max-width:100%;box-sizing:border-box;min-height:44px;font-family:var(--font-display),Arial,sans-serif;
    font-weight:600;font-size:15px;display:inline-flex;align-items:center;justify-content:center;text-align:center;
    padding:10px 22px;border-radius:999px;text-decoration:none;border:1px solid transparent;transition:transform .15s ease,background .15s ease}
  /* Primary: the header's Book a demo fill (#C62828, hover #A81F1F), which are these two tokens. */
  .ncx-hh .hh-btn--primary{background:var(--ncx-crimson);color:var(--ncx-on-navy)}
  .ncx-hh .hh-btn--primary:hover{background:var(--ncx-crimson-hover);transform:translateY(-1px)}
  /* Secondary: a neutral chip, dark text. */
  .ncx-hh .hh-btn--secondary{background:var(--ncx-rule-soft);color:var(--ncx-ink)}
  .ncx-hh .hh-btn--secondary:hover{background:var(--ncx-rule)}
  .ncx-hh .hh-btn:focus-visible{outline:2px solid var(--ncx-focus);outline-offset:3px}

  @media (prefers-reduced-motion:reduce){.ncx-hh .hh-btn{transition:none}}
  /* Phones and small tablets: one column; typed line breaks give way to natural wrapping.
     Title and intro sizes match the integration page hero (/integrations/abdm). Centred text goes left aligned. */
  @media (max-width:899.98px){
    .ncx-hh h1 .br{display:none}
    .ncx-hh h1{font-size:38px;line-height:1.06}
    .ncx-hh .hh-intro{font-size:19px;line-height:1.65}
    .ncx-hh[data-layout="centred"] .hh-text{align-items:flex-start;text-align:left;gap:16px}
    .ncx-hh[data-layout="centred"] .hh-eyebrow{align-self:flex-start;margin-bottom:6px}
    .ncx-hh[data-layout="centred"] .hh-body{align-items:flex-start;max-width:none}
    .ncx-hh[data-layout="centred"] .hh-cta{justify-content:flex-start}
    .ncx-hh[data-layout="grid"] .hh-text{grid-template-columns:minmax(0,1fr)}
    .ncx-hh[data-layout="grid"] .hh-body{grid-column:1}
  }
`
