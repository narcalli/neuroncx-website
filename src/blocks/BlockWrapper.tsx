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
  children,
}) => {
  if (hidden) return null

  const outer: React.CSSProperties = {}
  const inner: React.CSSProperties = {}

  if (background && background !== 'default' && BACKGROUNDS[background]) {
    outer.background = BACKGROUNDS[background]
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

  const hasOuter = Object.keys(outer).length > 0
  const hasInner = Object.keys(inner).length > 0

  const content = hasInner ? <div style={inner}>{children}</div> : children

  if (!hasOuter && !hasInner) {
    return <div className={flush ? '' : 'my-4'}>{children}</div>
  }

  return (
    <div className={flush ? '' : 'my-4'} style={outer}>
      {content}
    </div>
  )
}
