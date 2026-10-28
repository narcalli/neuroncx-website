import { describe, expect, it } from 'vitest'

import { effectiveLevel, stricter } from '@/motion/levels'

/** How the site, page, block and visitor motion settings combine (src/motion/levels.ts). */

describe('motion levels', () => {
  it('on unless something is stricter', () => {
    expect(effectiveLevel({})).toBe('on')
    expect(effectiveLevel({ site: 'on', page: 'follow', block: 'follow' })).toBe('on')
  })

  it('the strictest switch wins', () => {
    expect(effectiveLevel({ site: 'reduced', page: 'on', block: 'on' })).toBe('reduced')
    expect(effectiveLevel({ site: 'on', page: 'off', block: 'on' })).toBe('off')
    expect(effectiveLevel({ site: 'on', page: 'follow', block: 'reduced' })).toBe('reduced')
  })

  it('site off beats a block set to on', () => {
    expect(effectiveLevel({ site: 'off', block: 'on' })).toBe('off')
  })

  it('follow takes the level above it', () => {
    expect(effectiveLevel({ site: 'reduced', page: 'follow', block: 'follow' })).toBe('reduced')
    expect(effectiveLevel({ site: 'on', page: 'reduced', block: 'follow' })).toBe('reduced')
  })

  it('a visitor asking for less motion always gets the final state', () => {
    expect(effectiveLevel({ visitorReduced: true, site: 'on', page: 'on', block: 'on' })).toBe(
      'off',
    )
  })

  it('stricter orders off over reduced over on', () => {
    expect(stricter('on', 'reduced')).toBe('reduced')
    expect(stricter('off', 'reduced')).toBe('off')
    expect(stricter('on', 'on')).toBe('on')
  })
})
