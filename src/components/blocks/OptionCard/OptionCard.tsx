import React from 'react'
import Image from 'next/image'

import { BlockIcon } from '@/components/BlockIcon'
import type { PickedMedia } from '@/utilities/media'

import styles from './OptionCard.module.css'
import type {
  CardBorderColor,
  CardColor,
  CardImagePosition,
  CardLinkData,
  CardOptionFields,
  CardPoint,
} from './types'

/** Put this class on an element that wraps the cards: it carries the card's brand tokens. */
export const cardTokens = styles.tokens

const COLOR_CLASSES: Record<CardColor, string> = {
  grey: '',
  lavender: styles.cardLavender,
  white: styles.cardWhite,
}

const BORDER_COLOR_CLASSES: Record<CardBorderColor, string> = {
  blue: styles.borderBlue,
  violet: styles.borderViolet,
  crimson: styles.borderCrimson,
  navy: styles.borderNavy,
}

/**
 * The number each card shows, in order: its own text, or its place (01, 02, ...)
 * among the cards that count automatically, or null when its number is off.
 */
export function cardNumbers(cards: Pick<CardOptionFields, 'showNumber' | 'numberText'>[]): (string | null)[] {
  let count = 0
  return cards.map((card) => {
    if (!card.showNumber) return null
    const own = card.numberText?.trim()
    if (own) return own
    count += 1
    return String(count).padStart(2, '0')
  })
}

export type OptionCardProps = {
  /** The stored option fields, straight from the CMS. */
  options: CardOptionFields
  /** From cardNumbers(). */
  number: string | null
  title: string
  largeTitle?: boolean
  body?: string | null
  /** A BlockIcon name. */
  icon?: string | null
  image?: PickedMedia | null
  imagePosition?: CardImagePosition | null
  imageSizes?: string
  link?: CardLinkData | null
  /** The colour used when the card has none saved. */
  defaultColor?: CardColor
  className?: string
  style?: React.CSSProperties
}

function Badges({ icon, number }: { icon?: string | null; number: string | null }) {
  if (!icon && !number) return null
  return (
    <div className={styles.badges}>
      {icon ? (
        <span className={styles.icon} aria-hidden="true">
          <BlockIcon name={icon} fallback={icon} stroke="#fff" />
        </span>
      ) : null}
      {number ? (
        <span className={styles.number} aria-hidden="true">
          {number}
        </span>
      ) : null}
    </div>
  )
}

function Points({ points, bullets }: { points?: CardPoint[] | null; bullets: boolean }) {
  const items = (points || []).filter((p) => p && p.text)
  if (!items.length) return null
  return (
    <ul className={bullets ? styles.bullets : styles.pills}>
      {items.map((p, i) => (
        <li key={p.id || i}>{p.text}</li>
      ))}
    </ul>
  )
}

function CardLink({ link }: { link?: CardLinkData | null }) {
  if (!link?.url || !link?.label) return null
  return (
    <a
      className={styles.link}
      href={link.url}
      {...(link.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {link.label}
    </a>
  )
}

function Picture({ image, alt, sizes, wrap }: { image: PickedMedia; alt: string; sizes?: string; wrap: boolean }) {
  const img = (
    <Image
      src={image.src}
      alt={image.alt || alt}
      fill
      sizes={sizes || '100vw'}
      unoptimized={image.unoptimized}
      style={{ objectFit: 'cover' }}
    />
  )
  return wrap ? <div className={styles.imageWrap}>{img}</div> : img
}

export const OptionCard: React.FC<OptionCardProps> = ({
  options,
  number,
  title,
  largeTitle,
  body,
  icon,
  image,
  imagePosition,
  imageSizes,
  link,
  defaultColor = 'grey',
  className,
  style,
}) => {
  const position = image ? imagePosition || 'middle' : null

  const classes = [styles.card, COLOR_CLASSES[options.cardColor || defaultColor]]
  if (options.border === 'solid') {
    classes.push(styles.borderSolid, BORDER_COLOR_CLASSES[options.borderColor || 'blue'])
  }
  if (options.border === 'gradient') classes.push(styles.borderGradient)
  if (position === 'background') classes.push(styles.cardBackground)
  if (className) classes.push(className)

  const picture = (at: CardImagePosition) =>
    image && position === at ? <Picture image={image} alt={title} sizes={imageSizes} wrap /> : null

  const content = (
    <>
      {picture('top')}
      <Badges icon={icon} number={number} />
      {options.showEyebrow !== false && options.tag ? <span className={styles.tag}>{options.tag}</span> : null}
      <h3 className={largeTitle ? styles.titleLarge : styles.titleRegular}>{title}</h3>
      {picture('middle')}
      {body ? <p className={styles.body}>{body}</p> : null}
      {options.showPoints ? <Points points={options.points} bullets={options.listStyle === 'bullets'} /> : null}
      {picture('bottom')}
      {options.accentLine ? <div className={styles.accentLine} aria-hidden="true" /> : null}
      <CardLink link={link} />
    </>
  )

  if (image && position === 'background') {
    return (
      <div className={classes.filter(Boolean).join(' ')} style={style}>
        <div className={styles.bgImageWrap}>
          <Picture image={image} alt={title} sizes={imageSizes} wrap={false} />
          <div className={styles.bgOverlay} />
        </div>
        <div className={styles.bgContent}>{content}</div>
      </div>
    )
  }

  return (
    <div className={classes.filter(Boolean).join(' ')} style={style}>
      {content}
    </div>
  )
}
