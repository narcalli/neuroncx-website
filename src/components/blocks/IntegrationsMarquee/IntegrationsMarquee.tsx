import React from 'react'

import { Pill as CardPill } from '@/components/cards/Pill'
import { loadIntegrations, usesCollection } from '@/utilities/integrations'
import { pickMedia } from '@/utilities/media'

import { Reveal } from '@/motion/Reveal'
import { SplitHeading } from '@/motion/SplitHeading'

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

function Pill({
  logo,
  duplicate,
  repeat,
}: {
  logo: MarqueeLogo
  duplicate?: boolean
  repeat?: boolean
}) {
  const image = resolveLogoImage(logo.logo, logo.name)

  // The pill itself is shared with the pill card design (components/cards/Pill).
  return (
    <CardPill
      name={logo.name}
      initial={logo.name.trim().charAt(0).toUpperCase()}
      logo={image ? { src: image.src, unoptimized: image.unoptimized } : null}
      duplicate={duplicate}
      repeat={repeat}
    />
  )
}

// A row repeats its logos until it holds at least this many, so one copy is
// wider than the page column and no blank stretch scrolls past.
const MIN_PER_ROW = 10

function Row({ logos, durationSeconds, reverse }: { logos: MarqueeLogo[]; durationSeconds: number; reverse?: boolean }) {
  const filled = [...logos]
  while (filled.length < MIN_PER_ROW) filled.push(...logos)

  return (
    <div className={styles.row}>
      <div
        className={reverse ? `${styles.track} ${styles.reverse}` : styles.track}
        style={{ '--dur': `${durationSeconds}s` } as React.CSSProperties}
      >
        {/* Repeats added to fill the row are hidden from assistive tech and, under reduced motion, not shown. */}
        <div className={styles.copy}>
          {filled.map((logo, i) => (
            <Pill
              logo={logo}
              repeat={i >= logos.length}
              key={`${logo.id || i % logos.length}-${i}`}
            />
          ))}
        </div>
        {/* A second, identical copy so the loop has no seam — hidden from assistive tech and, under reduced motion, hidden entirely. */}
        <div className={styles.copy} data-duplicate="true">
          {filled.map((logo, i) => (
            <Pill logo={logo} duplicate key={`${logo.id || i % logos.length}-${i}`} />
          ))}
        </div>
      </div>
    </div>
  )
}

// The marquee needs at least this many logos to fill its rows.
const MIN_LOGOS = 4
const MAX_LOGOS = 40
// From this many logos there are three rows; below it, two.
const THREE_ROWS_FROM = 9
// Seconds per loop, by row. Different speeds keep the rows from lining up.
const ROW_SECONDS = [40, 48, 44]

export const IntegrationsMarqueeBlock = async (
  props: IntegrationsMarqueeBlockProps & { background?: string | null },
) => {
  const { eyebrow, title, description, logos, background, populateBy } = props

  let items: MarqueeLogo[]
  if (usesCollection(populateBy)) {
    // Each integration's logo and name. An entry without a logo gets the
    // monogram, as in the typed list.
    items = (await loadIntegrations(props, MAX_LOGOS)).map((d) => ({
      id: d.id,
      name: d.name,
      logo: d.logo && typeof d.logo === 'object' ? (d.logo as MarqueeLogo['logo']) : null,
    }))
    if (items.length < MIN_LOGOS) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          `[IntegrationsMarquee] Only ${items.length} integration(s) matched; the marquee needs at least ${MIN_LOGOS}, so it is not shown. Widen the filter or publish more Live integrations.`,
        )
      }
      return null
    }
  } else {
    items = (logos || []).filter((l) => l && l.name)
  }
  if (!items.length) return null

  const headEyebrow = eyebrow?.trim()
  const headTitle = title?.trim()
  const headDescription = description?.trim()
  const hasHeader = Boolean(headEyebrow || headTitle || headDescription)
  const onDark = background === 'navy' || background === 'crimson'

  // Logos are dealt round-robin, so the rows come out the same length and
  // each row gets a mix. Rows alternate direction.
  const rowCount = items.length >= THREE_ROWS_FROM ? 3 : 2
  const rows = Array.from({ length: rowCount }, (_, r) =>
    items.filter((_, i) => i % rowCount === r),
  ).filter((row) => row.length)

  return (
    <div className={styles.container}>
      <div className={`${styles.root} ncx-container`}>
        {hasHeader ? (
          <header className={onDark ? `${styles.header} ${styles.onDark}` : styles.header}>
            {headEyebrow ? (
              <Reveal as="p" from="left" className={styles.eyebrow}>
                {headEyebrow}
              </Reveal>
            ) : null}
            {headTitle ? <SplitHeading as="h2" className={styles.title}>{headTitle}</SplitHeading> : null}
            {headDescription ? (
              <Reveal as="p" className={styles.description}>
                {headDescription}
              </Reveal>
            ) : null}
          </header>
        ) : null}

        <div className={styles.marquee} data-loop>
          <div className={styles.rows}>
            {rows.map((row, i) => (
              <Row logos={row} durationSeconds={ROW_SECONDS[i]} reverse={i % 2 === 1} key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
