import React from 'react'

import { cardNumbers, cardTokens, OptionCard } from '@/components/blocks/OptionCard/OptionCard'
import type { CardColor } from '@/components/blocks/OptionCard/types'
import { pickMedia, type PickedMedia } from '@/utilities/media'

import styles from './BentoGrid.module.css'
import type { BentoGridBlockProps, BentoGridCard, BentoGridCardColor, BentoGridGap } from './types'

const GAP_VALUES: Record<BentoGridGap, string> = {
  small: '12px',
  medium: '20px',
  large: '32px',
}

// Card colours only Bento Grid offers. Each is drawn as the shared grey card
// with its fill and border swapped, so borders and accent lines work as usual.
const BENTO_COLOR_CLASSES: Record<Exclude<BentoGridCardColor, CardColor>, string> = {
  red: styles.cardRed,
}

/** "auto" halves the width for cards up to half, full width otherwise. */
function tabletColSpanValue(colSpan: string, tabletColSpan: string): string {
  if (tabletColSpan === 'auto') {
    return Number(colSpan) <= 6 ? '6' : '12'
  }
  return tabletColSpan
}

function sizesFor(colSpan: string): string {
  const pct = Math.round((Number(colSpan) / 12) * 100)
  return `(min-width: 1024px) ${pct}vw, 100vw`
}

/** Resolves a card's image field, skipping (with a dev warning) when the API only returned an id. */
function resolveCardImage(image: BentoGridCard['image'], title: string): PickedMedia | null {
  if (!image) return null
  if (typeof image === 'string') {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        `[BentoGrid] Card "${title}" image came back as an id ("${image}"), not a populated object — increase the API depth when fetching this page. Skipping the image for this card.`,
      )
    }
    return null
  }
  return pickMedia(image)
}

export const BentoGrid: React.FC<BentoGridBlockProps> = ({
  gap,
  rowHeight,
  dense,
  framed,
  eyebrow,
  title,
  description,
  cards,
  width,
  background,
}) => {
  const items = (cards || []).filter((c) => c && c.title)
  if (!items.length) return null

  const numbers = cardNumbers(items)

  const headEyebrow = eyebrow?.trim()
  const headTitle = title?.trim()
  const headDescription = description?.trim()
  const hasHeader = Boolean(headEyebrow || headTitle || headDescription)
  // On the dark section backgrounds the header switches to light text.
  const onDark = background === 'navy' || background === 'crimson'

  const gridStyle = {
    '--gap': GAP_VALUES[gap] || GAP_VALUES.medium,
    '--row-h': `${rowHeight || 240}px`,
    gridAutoFlow: dense ? 'row dense' : 'row',
  } as React.CSSProperties

  const rootClasses = [styles.root]
  // A chosen "Content width" (narrow / wide / full) replaces the default cap.
  if (width && width !== 'default') rootClasses.push(styles.uncapped)

  return (
    <div className={`${cardTokens} ${styles.container}`}>
      <div className={rootClasses.join(' ')}>
        {hasHeader ? (
          <header className={onDark ? `${styles.header} ${styles.onDark}` : styles.header}>
            {headEyebrow ? <p className={styles.eyebrow}>{headEyebrow}</p> : null}
            {headTitle ? <h2 className={styles.title}>{headTitle}</h2> : null}
            {headDescription ? <p className={styles.description}>{headDescription}</p> : null}
          </header>
        ) : null}

        <div className={framed ? styles.framed : undefined}>
          <div className={styles.grid} style={gridStyle}>
            {items.map((card, i) => {
              const { cardColor, ...rest } = card
              const cellClasses = [styles.cell]
              // A Bento-only colour renders as the shared grey card plus its own class.
              const sharedColor = cardColor === 'red' ? 'grey' : cardColor
              if (cardColor === 'red') cellClasses.push(BENTO_COLOR_CLASSES[cardColor])

              return (
                <OptionCard
                  key={card.id || i}
                  className={cellClasses.join(' ')}
                  style={
                    {
                      '--col': card.colSpan,
                      '--col-md': tabletColSpanValue(card.colSpan, card.tabletColSpan),
                      '--row': card.rowSpan,
                    } as React.CSSProperties
                  }
                  options={{ ...rest, cardColor: sharedColor }}
                  number={numbers[i]}
                  icon={card.icon}
                  title={card.title}
                  largeTitle={card.titleSize === 'large'}
                  body={card.body}
                  image={resolveCardImage(card.image, card.title)}
                  imagePosition={card.imagePosition}
                  imageSizes={sizesFor(card.colSpan)}
                  link={card.link}
                />
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
