import React from 'react'

import type { HeroCustomBlock as HeroCustomProps } from '@/payload-types'

import { ShadowVisual } from './ShadowVisual'
import { safeVisualCss, safeVisualHtml } from './safety'

type LinkGroup = HeroCustomProps['primaryCta']

/** A button's address, or null when there is nothing to link to. Hero (harness loop) buttons use the same rule. */
export const hrefOf = (cta: LinkGroup | undefined): string | null => {
  if (!cta) return null
  if (cta.type === 'custom') return cta.url || null
  const value = cta.reference?.value
  if (cta.type === 'reference' && value && typeof value === 'object' && 'slug' in value && value.slug) {
    return cta.reference?.relationTo === 'posts' ? `/posts/${value.slug}` : value.slug === 'home' ? '/' : `/${value.slug}`
  }
  return null
}

const Button: React.FC<{ cta: LinkGroup | undefined; kind: 'primary' | 'ghost' }> = ({ cta, kind }) => {
  const href = hrefOf(cta)
  if (!href || !cta?.label) return null
  return (
    <a className={`hcx-btn hcx-btn--${kind}`} href={href} {...(cta.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
      {cta.label}
    </a>
  )
}

/**
 * Hero (custom CSS). Everything but the visual is fixed and built like the
 * other heroes: the eyebrow, the headline (the page's H1), the subhead, the
 * buttons, the breadcrumbs under the header, the page widths and the phone
 * layout. The visual is the editor's own HTML and CSS, drawn in a sealed box
 * (ShadowVisual) beside, below or behind the text.
 */
export const HeroCustomBlock: React.FC<
  HeroCustomProps & {
    leading?: React.ReactNode
    /** Short labels under the subhead. Entry pages pass their hero chips; the page block has none. */
    chips?: { label: string }[] | null
  }
> = ({
  eyebrow,
  headline,
  subhead,
  primaryCta,
  secondaryCta,
  visualPosition,
  split,
  height,
  phoneVisual,
  background,
  visualHtml,
  visualCss,
  visualAlt,
  aspect,
  maxWidth,
  leading,
  chips,
}) => {
  const html = safeVisualHtml(visualHtml)
  const css = safeVisualCss(visualCss)
  const pos = visualPosition || 'right'
  const visual = html ? <ShadowVisual html={html} css={css} alt={visualAlt} /> : null
  const frame: React.CSSProperties = {
    ...(aspect && aspect !== 'auto' ? { aspectRatio: aspect } : {}),
    ...(maxWidth ? { maxWidth } : {}),
  }

  return (
    <section
      className="ncx-hcx"
      data-pos={pos}
      data-split={split || '50'}
      data-height={height || 'natural'}
      data-phone={phoneVisual || 'below'}
      data-bg={background || 'cloud'}
      data-lead={leading ? '' : undefined}
      {...(background === 'navy' ? { 'data-nav': 'dark' } : {})}
    >
      <style>{heroCss}</style>
      {leading ? (
        <div className="hcx-lead">
          <div className="ncx-container">{leading}</div>
        </div>
      ) : null}
      {pos === 'background' && visual ? <div className="hcx-bg">{visual}</div> : null}
      <div className="ncx-container hcx-inner">
        <div className="hcx-grid" data-cols={visual ? undefined : '1'}>
          <div className="hcx-copy">
            {eyebrow ? <p className="hcx-eyebrow">{eyebrow}</p> : null}
            <h1>{headline}</h1>
            {subhead ? <p className="hcx-sub">{subhead}</p> : null}
            {chips?.length ? (
              <ul className="hcx-chips">
                {chips.map((c, i) => (
                  <li key={i}>{c.label}</li>
                ))}
              </ul>
            ) : null}
            {(hrefOf(primaryCta) && primaryCta?.label) || (hrefOf(secondaryCta) && secondaryCta?.label) ? (
              <div className="hcx-cta">
                <Button cta={primaryCta} kind="primary" />
                <Button cta={secondaryCta} kind="ghost" />
              </div>
            ) : null}
          </div>
          {pos !== 'background' && visual ? (
            <div className="hcx-media">
              <div className="hcx-frame" style={frame}>
                {visual}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}

const heroCss = `
  .ncx-hcx{--hcx-bg:var(--ncx-cloud);--hcx-ink:var(--ncx-ink);--hcx-muted:var(--ncx-muted);
    position:relative;overflow:hidden;isolation:isolate;background:var(--hcx-bg);color:var(--hcx-ink);
    font-family:var(--font-body),Arial,sans-serif;
    padding:calc(64px + clamp(44px,6vw,76px)) 0 clamp(56px,7vw,88px)}
  .ncx-hcx[data-bg="white"]{--hcx-bg:var(--ncx-white)}
  .ncx-hcx[data-bg="navy"]{--hcx-bg:var(--ncx-navy);--hcx-ink:var(--ncx-on-navy);--hcx-muted:var(--ncx-on-navy-soft)}
  /* Room for the breadcrumbs, 28px under the header, as on the other heroes. */
  .ncx-hcx[data-lead]{padding-top:calc(64px + clamp(72px,8vw,104px))}
  .ncx-hcx .hcx-lead{position:absolute;top:64px;left:0;right:0;z-index:3;--crumb-top:28px;pointer-events:none}
  .ncx-hcx .hcx-lead nav,.ncx-hcx .hcx-lead a{pointer-events:auto}
  .ncx-hcx[data-height="tall"]{min-height:min(88vh,820px);display:flex;align-items:center}
  .ncx-hcx .hcx-inner{position:relative;z-index:1;width:100%}
  .ncx-hcx .hcx-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:clamp(32px,5vw,72px);align-items:center}
  .ncx-hcx[data-split="40"] .hcx-grid{grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr)}
  .ncx-hcx[data-pos="left"] .hcx-copy{order:2}
  .ncx-hcx[data-pos="below"] .hcx-grid,.ncx-hcx[data-pos="background"] .hcx-grid{grid-template-columns:minmax(0,1fr)}
  .ncx-hcx[data-pos="below"] .hcx-copy{max-width:760px}
  .ncx-hcx[data-pos="background"] .hcx-copy{max-width:640px}
  /* No visual at all: the text takes the full width, whatever the position. */
  .ncx-hcx .hcx-grid[data-cols="1"]{grid-template-columns:minmax(0,1fr)}
  .ncx-hcx .hcx-grid[data-cols="1"] .hcx-copy,.ncx-hcx .hcx-grid[data-cols="1"] .hcx-sub{max-width:none}
  .ncx-hcx .hcx-copy{min-width:0}
  .ncx-hcx .hcx-eyebrow{display:inline-flex;align-items:center;gap:10px;margin:0 0 18px;
    font-family:var(--font-display),Arial,sans-serif;font-weight:600;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:var(--hcx-muted)}
  .ncx-hcx .hcx-eyebrow::before{content:"";width:8px;height:8px;border-radius:50%;background:var(--ncx-crimson)}
  .ncx-hcx h1{font-family:var(--font-display),Arial,sans-serif;font-weight:600;font-size:clamp(36px,4.6vw,60px);line-height:1.06;
    letter-spacing:-.025em;margin:0;max-width:var(--ncx-heading-max);color:var(--hcx-ink)}
  .ncx-hcx .hcx-sub{margin:22px 0 0;max-width:52ch;font-size:clamp(16px,1.3vw,19px);line-height:1.65;color:var(--hcx-muted)}
  .ncx-hcx .hcx-chips{display:flex;flex-wrap:wrap;gap:8px;margin:22px 0 0;padding:0;list-style:none}
  .ncx-hcx .hcx-chips li{padding:6px 12px;border:1px solid var(--ncx-rule);border-radius:999px;background:var(--ncx-white);
    font-family:var(--font-display),Arial,sans-serif;font-size:13px;font-weight:500;line-height:1.3;color:var(--ncx-ink)}
  .ncx-hcx[data-bg="navy"] .hcx-chips li{border-color:var(--ncx-on-navy-rule);background:var(--ncx-on-navy-raise);color:var(--ncx-on-navy)}
  .ncx-hcx .hcx-cta{display:flex;flex-wrap:wrap;gap:12px;margin-top:30px}
  .ncx-hcx .hcx-btn{font-family:var(--font-display),Arial,sans-serif;font-weight:600;font-size:15px;display:inline-flex;align-items:center;
    padding:13px 22px;border-radius:12px;text-decoration:none;transition:transform .15s ease,background .15s ease}
  .ncx-hcx .hcx-btn--primary{background:var(--ncx-crimson);color:var(--ncx-on-navy)}
  .ncx-hcx .hcx-btn--primary:hover{background:var(--ncx-crimson-hover);transform:translateY(-1px)}
  .ncx-hcx .hcx-btn--ghost{background:var(--ncx-white);color:var(--ncx-ink);border:1px solid var(--ncx-rule)}
  .ncx-hcx .hcx-btn--ghost:hover{background:var(--ncx-paper)}
  .ncx-hcx .hcx-btn:focus-visible{outline:2px solid var(--ncx-focus);outline-offset:3px}
  .ncx-hcx .hcx-media{min-width:0}
  .ncx-hcx .hcx-frame{width:100%;margin-inline:auto}
  .ncx-hcx .hcx-frame > .hcx-visual{height:100%}
  /* Behind the text: the visual fills the hero, and a wash of the background
     colour keeps the text side readable. */
  .ncx-hcx .hcx-bg{position:absolute;inset:0;z-index:0}
  .ncx-hcx .hcx-bg::after{content:"";position:absolute;inset:0;pointer-events:none;
    background:linear-gradient(90deg,var(--hcx-bg) 0%,color-mix(in srgb,var(--hcx-bg) 75%,transparent) 45%,transparent 80%)}
  @media (prefers-reduced-motion:reduce){.ncx-hcx .hcx-btn{transition:none}}
  /* Phones and small tablets: one column, text first, then the visual. */
  @media (max-width:899.98px){
    .ncx-hcx .hcx-grid,.ncx-hcx[data-split="40"] .hcx-grid{grid-template-columns:minmax(0,1fr)}
    .ncx-hcx[data-pos="left"] .hcx-copy{order:0}
    .ncx-hcx[data-phone="hide"] .hcx-media,.ncx-hcx[data-phone="hide"] .hcx-bg{display:none}
    .ncx-hcx .hcx-bg::after{background:color-mix(in srgb,var(--hcx-bg) 82%,transparent)}
    .ncx-hcx[data-height="tall"]{min-height:0}
  }
`
