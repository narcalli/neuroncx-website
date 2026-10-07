import React from 'react'

type Presentation = {
  background?: string | null
  width?: string | null
  spacingTop?: string | null
  spacingBottom?: string | null
  align?: string | null
  hidden?: boolean | null
}

type Props = Presentation & {
  blockType?: string
  flush?: boolean
  /** Lets a link elsewhere on the page (e.g. "#how-it-works") jump to this block. */
  htmlId?: string | null
  children: React.ReactNode
}

const BACKGROUNDS: Record<string, string> = {
  white: 'var(--ncx-white)',
  cloud: 'var(--ncx-cloud)',
  navy: 'var(--ncx-navy)',
}

/**
 * Highlight (navy) is not just white body text. The whole token set is
 * remapped for the subtree, so a block that reads --ncx-* renders correctly in
 * either state without knowing which one it is in: ink and body go white,
 * muted and faint go to the soft tint, hairlines to the translucent rule, and
 * every light surface becomes the barely-raised wash. Crimson is deliberately
 * left alone — it stays the one accent that reads the same in both states.
 */
const ON_NAVY: Record<string, string> = {
  '--ncx-ink': 'var(--ncx-on-navy)',
  // Nested navy would vanish into the wrapper, so it steps up a tone.
  '--ncx-navy': 'var(--ncx-navy-tint)',
  // Crimson and teal as TEXT step down; the fill hues are left alone.
  '--ncx-crimson-ink': 'var(--ncx-on-navy-soft)',
  '--ncx-teal-ink': 'var(--ncx-teal-on-navy)',
  // Interactive text keeps its affordance: a link does not step down to the
  // soft tint in the one section the page most wants acted on.
  '--ncx-link': 'var(--ncx-on-navy)',
  // A focus ring and a hover hairline both have to stay visible on navy, and
  // crimson at 1px does not. Teal steps up; the hover line brightens.
  '--ncx-focus': 'var(--ncx-teal-on-navy)',
  '--ncx-hover-line': 'var(--ncx-on-navy-rule-strong)',
  // Tints are pale surfaces: left alone they survive as light patches.
  '--ncx-crimson-tint': 'var(--ncx-crimson-wash-on-navy)',
  '--ncx-teal-tint': 'var(--ncx-teal-wash-on-navy)',
  '--ncx-body': 'var(--ncx-on-navy)',
  '--ncx-muted': 'var(--ncx-on-navy-soft)',
  '--ncx-faint': 'var(--ncx-on-navy-soft)',
  '--ncx-rule': 'var(--ncx-on-navy-rule)',
  '--ncx-rule-soft': 'var(--ncx-on-navy-rule)',
  '--ncx-rule-strong': 'var(--ncx-on-navy-rule-strong)',
  '--ncx-cloud': 'var(--ncx-on-navy-raise)',
  '--ncx-paper': 'var(--ncx-on-navy-raise)',
  '--ncx-white': 'var(--ncx-on-navy-raise)',
  '--ncx-raised': 'var(--ncx-on-navy-raise)',
}

const SPACE: Record<string, string> = {
  none: '0px',
  sm: '16px',
  lg: '72px',
}

const WIDTHS: Record<string, string> = {
  narrow: '760px',
  wide: '1320px',
}

/**
 * Applies the per-block Appearance options chosen in the admin.
 *
 * Every value defaults to "default", which means: change nothing and let the
 * block's own styling stand. Only an explicit choice produces a style here, so
 * existing pages look exactly as they did before these options existed.
 */
export const BlockWrapper: React.FC<Props> = ({
  background,
  width,
  spacingTop,
  spacingBottom,
  align,
  hidden,
  flush,
  htmlId,
  children,
}) => {
  if (hidden) return null

  const outer: React.CSSProperties = {}
  const inner: React.CSSProperties = {}

  const hasBackground = Boolean(background && background !== 'default' && BACKGROUNDS[background])

  if (hasBackground) {
    outer.background = BACKGROUNDS[background as string]
    // Dark backgrounds need light text, or the block disappears into them.
    if (background === 'navy') outer.color = 'var(--ncx-on-navy)'
    // The remap goes on the inner element, not this one: applied here it
    // would rewrite the very variable this element's own background reads,
    // and the band would come out navy-tint instead of navy.
    if (background === 'navy') Object.assign(inner, ON_NAVY)
  }

  if (spacingTop && spacingTop !== 'default') outer.paddingTop = SPACE[spacingTop]
  if (spacingBottom && spacingBottom !== 'default') outer.paddingBottom = SPACE[spacingBottom]

  if (width && width !== 'default') {
    if (width === 'full') {
      inner.maxWidth = 'none'
    } else if (WIDTHS[width]) {
      inner.maxWidth = WIDTHS[width]
      inner.marginLeft = 'auto'
      inner.marginRight = 'auto'
    }
  }

  if (align && align !== 'default') inner.textAlign = align as React.CSSProperties['textAlign']

  // Keeps a jump link (e.g. #how-it-works) from landing under the sticky header.
  if (htmlId) outer.scrollMarginTop = '96px'

  const hasOuter = Object.keys(outer).length > 0
  const hasInner = Object.keys(inner).length > 0

  const content = hasInner ? <div style={inner}>{children}</div> : children

  // A chosen background should fill edge to edge with no gap to adjacent
  // blocks, the same as the dedicated flush/hero blocks — otherwise the
  // page's own background shows through the margin as a visible seam.
  const isFlush = flush || hasBackground

  if (!hasOuter && !hasInner) {
    return (
      <div id={htmlId || undefined} className={isFlush ? '' : 'my-4'}>
        {children}
      </div>
    )
  }

  return (
    <div id={htmlId || undefined} className={isFlush ? '' : 'my-4'} style={outer}>
      {content}
    </div>
  )
}
