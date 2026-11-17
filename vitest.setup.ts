// Any setup scripts you might need go here

// Load .env files
import 'dotenv/config'
import { vi } from 'vitest'

// The code block's copy button pulls in a Payload UI stylesheet the test runner cannot load. Every
// lazily loaded component reaches the tests together (tests/lazyClientDirect.ts), so it is stubbed here.
vi.mock('@/blocks/Code/CopyButton', () => ({ CopyButton: () => null }))

// jsdom has no matchMedia, which the motion code (src/motion/) can read when
// a test renders an animated block: a no-op stub is enough, since nothing
// here scrolls or resizes.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })
}
