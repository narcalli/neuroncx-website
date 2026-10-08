import React from 'react'
import Image from 'next/image'

import { pickMedia } from '@/utilities/media'

import styles from './IntegrationsMarquee.module.css'
import type { IntegrationsMarqueeBlockProps, MarqueeLogo } from './types'

/** Resolves a logo's image field, skipping (with a dev warning) when the API only returned an id. */
function resolveLogoImage(logo: MarqueeLogo['logo'], name: string) {
  if (!logo) return null
  if (typeof logo === 'string') {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        `[IntegrationsMarquee] Logo "${name}" came back as an id ("${logo}"), not a populated object — increase the API depth when fetching this page. Falling back to the monogram.`,
      )
    }
    return null
  }
  return pickMedia(logo)
}

function Pill({ logo, duplicate }: { logo: MarqueeLogo; duplicate?: boolean }) {
  const image = resolveLogoImage(logo.logo, logo.name)
  const initial = logo.name.trim().charAt(0).toUpperCase()

  return (
    <div className={styles.pill} aria-hidden={duplicate || undefined}>
      {image ? (
        <span className={styles.icon}>
          <Image src={image.src} alt="" fill sizes="36px" unoptimized={image.unoptimized} />
        </span>
      ) : (
        <span className={styles.monogram} aria-hidden="true">
          {initial}
        </span>
      )}
      <span className={styles.name}>{logo.name}</span>
    </div>
  )
}

function Row({ logos, durationSeconds, reverse }: { logos: MarqueeLogo[]; durationSeconds: number; reverse?: boolean }) {
  return (
    <div className={styles.row}>
      <div
        className={reverse ? `${styles.track} ${styles.reverse}` : styles.track}
        style={{ '--dur': `${durationSeconds}s` } as React.CSSProperties}
      >
        <div className={styles.copy}>
          {logos.map((logo, i) => (
            <Pill logo={logo} key={logo.id || i} />
          ))}
        </div>
        {/* A second, identical copy so the loop has no seam — hidden from assistive tech and, under reduced motion, hidden entirely. */}
        <div className={styles.copy} data-duplicate="true">
          {logos.map((logo, i) => (
            <Pill logo={logo} duplicate key={logo.id || i} />
          ))}
        </div>
      </div>
    </div>
  )
}

export const IntegrationsMarqueeBlock: React.FC<IntegrationsMarqueeBlockProps & { background?: string | null }> = ({
  eyebrow,
  title,
  description,
  logos,
  background,
}) => {
  const items = (logos || []).filter((l) => l && l.name)
  if (!items.length) return null

  const headEyebrow = eyebrow?.trim()
  const headTitle = title?.trim()
  const headDescription = description?.trim()
  const hasHeader = Boolean(headEyebrow || headTitle || headDescription)
  const onDark = background === 'navy' || background === 'crimson'

  const half = Math.ceil(items.length / 2)
  const row1 = items.slice(0, half)
  const row2 = items.slice(half)

  return (
    <div className={styles.container}>
      <div className={`${styles.root} ncx-container`}>
        {hasHeader ? (
          <header className={onDark ? `${styles.header} ${styles.onDark}` : styles.header}>
            {headEyebrow ? <p className={styles.eyebrow}>{headEyebrow}</p> : null}
            {headTitle ? <h2 className={styles.title}>{headTitle}</h2> : null}
            {headDescription ? <p className={styles.description}>{headDescription}</p> : null}
          </header>
        ) : null}

        <div className={styles.marquee}>
          <div className={styles.rows}>
            <Row logos={row1} durationSeconds={40} />
            {row2.length ? <Row logos={row2} durationSeconds={48} reverse /> : null}
          </div>
        </div>
      </div>
    </div>
  )
}
