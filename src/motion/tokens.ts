/**
 * Motion tokens: the one place durations, easings, springs, staggers and the
 * in-view start point are set, so every animated block keeps the same timing
 * as the approved demo (docs/motion/bot-swarm-motion-demo.html).
 */

/** Seconds. */
export const DURATION = { fast: 0.15, base: 0.5, slow: 0.9 } as const

/** The standard ease out: GSAP's name, and the same curve for Motion and CSS. */
export const EASE = {
  gsap: 'power3.out',
  motion: [0.22, 1, 0.36, 1] as [number, number, number, number],
  css: 'cubic-bezier(.22,1,.36,1)',
} as const

/** The standard spring for Motion (motion/react). */
export const SPRING = { type: 'spring', stiffness: 380, damping: 24 } as const

/** Seconds between items that arrive one after another. */
export const STAGGER = 0.06

/** How far an element rises as it fades in, in px. */
export const RISE = 16

/**
 * When an element counts as in view: its top reaches 80% of the window
 * height. As a ratio of the window, and as an IntersectionObserver margin.
 */
export const IN_VIEW = { ratio: 0.8, rootMargin: '0px 0px -20% 0px' } as const
