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
  white: '#FFFFFF',
  cloud: '#F5F5F7',
  navy: '#1A2035',
  crimson: '#C62828',
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
    if (background === 'navy' || background === 'crimson') outer.color = '#FFFFFF'
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
