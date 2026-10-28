import { describe, expect, it } from 'vitest'

import { HIDE_AFTER, nextHeaderState, STUCK_AT } from '@/Header/headerScroll'

/** The header's scroll behaviour (prompt 4): the hairline and shadow, and when it hides. */

describe('the header while scrolling', () => {
  it('is not stuck at the very top', () => {
    expect(nextHeaderState({ scrollY: 0, lastScrollY: 0, held: false }).stuck).toBe(false)
    expect(nextHeaderState({ scrollY: STUCK_AT, lastScrollY: 0, held: false }).stuck).toBe(false)
  })

  it('is stuck once the page has moved past the threshold', () => {
    expect(nextHeaderState({ scrollY: STUCK_AT + 1, lastScrollY: 0, held: false }).stuck).toBe(true)
  })

  it('stays shown below the hide threshold, whichever way the page moves', () => {
    expect(nextHeaderState({ scrollY: HIDE_AFTER, lastScrollY: 0, held: false }).hidden).toBe(false)
    expect(nextHeaderState({ scrollY: 50, lastScrollY: 80, held: false }).hidden).toBe(false)
  })

  it('hides past the threshold while scrolling down', () => {
    expect(
      nextHeaderState({ scrollY: HIDE_AFTER + 1, lastScrollY: HIDE_AFTER, held: false }).hidden,
    ).toBe(true)
  })

  it('shows again the moment the page scrolls up, even slightly', () => {
    expect(
      nextHeaderState({ scrollY: 500, lastScrollY: 501, held: false }).hidden,
    ).toBe(false)
  })

  it('never hides while a menu is open, the drawer is open, or focus is inside it', () => {
    expect(
      nextHeaderState({ scrollY: HIDE_AFTER + 50, lastScrollY: HIDE_AFTER, held: true }).hidden,
    ).toBe(false)
  })
})
