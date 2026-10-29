import { describe, expect, it } from 'vitest'

import { arc, chainThrough, controlThrough, pointOnChain } from '@/motion/arc'
import { gsap } from '@/motion/gsap'

/** The arc helper that replaced GSAP's MotionPath plugin (src/motion/arc.ts). */
describe('arc', () => {
  const a = { x: 0, y: 0 }
  const b = { x: 100, y: 0 }

  it('starts and ends on the chain ends', () => {
    const chain = [a, { x: 50, y: -40 }, b]
    expect(pointOnChain(chain, 0)).toEqual(a)
    expect(pointOnChain(chain, 1)).toEqual(b)
  })

  it('passes through the via point halfway when the control comes from controlThrough', () => {
    const via = { x: 50, y: -20 }
    const chain = [a, controlThrough(a, via, b), b]
    const mid = pointOnChain(chain, 0.5)
    expect(mid.x).toBeCloseTo(50, 6)
    expect(mid.y).toBeCloseTo(-20, 6)
  })

  it('chains two curves through a point, reaching it at the halfway mark', () => {
    const via = { x: 50, y: 50 }
    const chain = chainThrough(a, via, b)
    expect(chain).toHaveLength(5)
    expect(pointOnChain(chain, 0.5)).toEqual(via)
    expect(pointOnChain(chain, 1)).toEqual(b)
  })

  it('moves the element when its timeline is sought, which skips onUpdate', () => {
    const el = document.createElement('div')
    const t = gsap
      .timeline({ paused: true })
      .add(arc(el, [a, { x: 50, y: -40 }, b], { duration: 1 }))
    t.seek(0.5)
    expect(gsap.getProperty(el, 'x')).toBeCloseTo(50, 3)
    expect(gsap.getProperty(el, 'y')).toBeCloseTo(-20, 3)
    t.seek(1)
    expect(gsap.getProperty(el, 'x')).toBeCloseTo(100, 3)
    t.kill()
  })

  it('clamps progress outside 0 to 1', () => {
    const chain = [a, { x: 50, y: 0 }, b]
    expect(pointOnChain(chain, -1)).toEqual(a)
    expect(pointOnChain(chain, 2)).toEqual(b)
  })
})
