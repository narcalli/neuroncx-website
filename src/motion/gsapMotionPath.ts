'use client'

/** GSAP MotionPathPlugin, registered once, for the blocks with a moving packet. Import for its side effect. */

import { MotionPathPlugin } from 'gsap/MotionPathPlugin'

import { gsap } from './gsap'

if (typeof window !== 'undefined') gsap.registerPlugin(MotionPathPlugin)

export { MotionPathPlugin }
