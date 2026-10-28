'use client'

/** GSAP SplitText, registered once, for the blocks that split text. */

import { SplitText } from 'gsap/SplitText'

import { gsap } from './gsap'

if (typeof window !== 'undefined') gsap.registerPlugin(SplitText)

export { SplitText }
