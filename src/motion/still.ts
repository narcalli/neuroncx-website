/**
 * Whether movement should stop for an element, read from the page itself:
 * the visitor's system asks for less motion, or the site, its page or its
 * block is set to off or reduced (data-motion on <html>, on the page's
 * wrapper or on the block's wrapper, written in the server HTML). For code
 * outside React's render, such as a scroll handler; components use
 * useMotionLevel. Reduced counts as still here: these are loops, scrolls and
 * count-ups, which reduced drops.
 */
export const isStill = (el?: Element | null): boolean => {
  if (typeof window === 'undefined') return false
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true
  return Boolean((el ?? document.documentElement).closest('[data-motion="off"], [data-motion="reduced"]'))
}
