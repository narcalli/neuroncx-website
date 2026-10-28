'use client'

/** GSAP DrawSVGPlugin, registered once, for the blocks that draw strokes. Import for its side effect. */

import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'

import { gsap } from './gsap'

if (typeof window !== 'undefined') gsap.registerPlugin(DrawSVGPlugin)

export { DrawSVGPlugin }
