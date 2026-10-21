import Image from 'next/image'
import React from 'react'

import styles from './Pill.module.css'

/**
 * One logo pill: the logo, or a monogram when there is none, and the name.
 * The Integrations Marquee block draws its rows from these, and the pill card
 * design lays them out as a list.
 *
 * `duplicate` and `repeat` are for the marquee: copies it adds to make the
 * loop seamless or to fill a row. Both are hidden from assistive tech, and
 * `repeat` is also marked so the marquee can hide it under reduced motion.
 *
 * `wrap` is for a still list: a long name wraps onto a second line instead
 * of running off a narrow screen. The marquee keeps every pill on one line.
 */
export const Pill: React.FC<{
  name: string
  /** Shown when there is no logo. */
  initial: string
  logo?: { src: string; unoptimized?: boolean } | null
  duplicate?: boolean
  repeat?: boolean
  wrap?: boolean
}> = ({ name, initial, logo, duplicate, repeat, wrap }) => (
  <div
    className={wrap ? `${styles.pill} ${styles.wrap}` : styles.pill}
    aria-hidden={duplicate || repeat || undefined}
    data-repeat={repeat ? 'true' : undefined}
  >
    {logo ? (
      <span className={styles.icon}>
        <Image src={logo.src} alt="" fill sizes="36px" unoptimized={logo.unoptimized} />
      </span>
    ) : (
      <span className={styles.monogram} aria-hidden="true">
        {initial}
      </span>
    )}
    <span className={styles.name}>{name}</span>
  </div>
)
